import { auth, db, doc, getDoc, setDoc, updateDoc, arrayUnion } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const videoPlayer = document.getElementById('videoPlayer');
const lessonList = document.getElementById('lessonList');
const courseTitle = document.getElementById('courseTitle');
const currentLessonTitle = document.getElementById('currentLessonTitle');
const nextLessonBtn = document.getElementById('nextLessonBtn');
const takeTestBtn = document.getElementById('takeTestBtn');
const courseContent = document.getElementById('courseContent');
const courseLockOverlay = document.getElementById('courseLockOverlay');

// Custom Controls
const playPauseBtn = document.getElementById('playPauseBtn');
const muteBtn = document.getElementById('muteBtn');
const fullScreenBtn = document.getElementById('fullScreenBtn');
const timeDisplay = document.getElementById('timeDisplay');

let currentCourseId = new URLSearchParams(window.location.search).get('id');
let currentCourse = null;
let currentLessonIndex = 0;
let userProgress = { completedLessons: [] };
let currentUser = null;

// Prevent keyboard seeking
window.addEventListener('keydown', (e) => {
    if (e.target === document.body || e.target === videoPlayer) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
        }
    }
});

// Custom Control Logic
playPauseBtn.addEventListener('click', togglePlay);
videoPlayer.addEventListener('click', togglePlay);

function togglePlay() {
    if (videoPlayer.paused || videoPlayer.ended) {
        videoPlayer.play();
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        videoPlayer.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
}

muteBtn.addEventListener('click', () => {
    videoPlayer.muted = !videoPlayer.muted;
    muteBtn.innerHTML = videoPlayer.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
});

fullScreenBtn.addEventListener('click', () => {
    if (videoPlayer.requestFullscreen) {
        videoPlayer.requestFullscreen();
    } else if (videoPlayer.webkitRequestFullscreen) {
        videoPlayer.webkitRequestFullscreen();
    } else if (videoPlayer.msRequestFullscreen) {
        videoPlayer.msRequestFullscreen();
    }
});

videoPlayer.addEventListener('timeupdate', () => {
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };
    timeDisplay.textContent = `${formatTime(videoPlayer.currentTime)} / ${formatTime(videoPlayer.duration || 0)}`;
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;

        // Security: Verify user status from Firestore before showing content
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const status = userData.status;

            // Only allow access if status is "approved" or "paid"
            if (status === 'approved' || status === 'paid') {
                // User is authorized - show course content
                courseContent.classList.remove('d-none');
                courseLockOverlay.classList.add('d-none');
                await loadCourseData();
            } else {
                // User is NOT approved - lock course content, show approval message
                courseContent.classList.add('d-none');
                courseLockOverlay.classList.remove('d-none');
            }
        } else {
            // No user document found - redirect to login
            window.location.href = 'index.html';
        }
    } else {
        window.location.href = 'index.html';
    }
});

async function loadCourseData() {
    if (!currentCourseId) {
        alert("No course specified.");
        window.location.href = 'dashboard.html';
        return;
    }

    const courseDoc = await getDoc(doc(db, "courses", currentCourseId));
    if (!courseDoc.exists()) {
        alert("Course not found.");
        window.location.href = 'dashboard.html';
        return;
    }
    currentCourse = courseDoc.data();
    courseTitle.textContent = currentCourse.title;

    const progressDoc = await getDoc(doc(db, "users", currentUser.uid, "progress", currentCourseId));
    if (progressDoc.exists()) {
        userProgress = progressDoc.data();
    } else {
        userProgress = { completedLessons: [] };
    }

    renderLessons();
    checkTestEligibility();
}

function renderLessons() {
    lessonList.innerHTML = '';
    currentCourse.lessons.forEach((lesson, index) => {
        const item = document.createElement('button');
        item.className = `lesson-btn ${index === currentLessonIndex ? 'active' : ''}`;

        const isCompleted = userProgress.completedLessons.includes(index);
        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span><i class="fas fa-play-circle me-2"></i> ${index + 1}. ${lesson.title}</span>
                ${isCompleted ? '<i class="fas fa-check-circle text-success"></i>' : ''}
            </div>
        `;

        item.onclick = () => loadLesson(index);
        lessonList.appendChild(item);
    });

    if (!videoPlayer.getAttribute('src')) {
        loadLesson(0);
    }
}

function loadLesson(index) {
    currentLessonIndex = index;
    const lesson = currentCourse.lessons[index];

    currentLessonTitle.textContent = lesson.title;
    videoPlayer.src = lesson.videoURL;
    videoPlayer.load();

    // Reset controls
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';

    // Autoplay attempt
    const playPromise = videoPlayer.play();
    if (playPromise !== undefined) {
        playPromise.then(_ => {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }).catch(error => {
            console.log("Autoplay prevented");
        });
    }

    renderLessons();

    nextLessonBtn.disabled = true;
    nextLessonBtn.onclick = () => loadLesson(index + 1);

    if (userProgress.completedLessons.includes(index)) {
        nextLessonBtn.disabled = false;
    }
}

videoPlayer.addEventListener('ended', async () => {
    playPauseBtn.innerHTML = '<i class="fas fa-redo"></i>';
    nextLessonBtn.disabled = false;

    if (!userProgress.completedLessons.includes(currentLessonIndex)) {
        await setDoc(doc(db, "users", currentUser.uid, "progress", currentCourseId), {
            completedLessons: arrayUnion(currentLessonIndex)
        }, { merge: true });

        userProgress.completedLessons.push(currentLessonIndex);
        renderLessons();
        checkTestEligibility();
    }
});

function checkTestEligibility() {
    const totalLessons = currentCourse.lessons.length;
    if (userProgress.completedLessons.length >= totalLessons) {
        takeTestBtn.classList.remove('d-none');
        takeTestBtn.onclick = () => {
            window.location.href = `quiz.html?courseId=${currentCourseId}`;
        };
    }
}
