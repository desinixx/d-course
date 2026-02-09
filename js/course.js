import { auth, db, doc, getDoc, setDoc, updateDoc, arrayUnion } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const videoPlayer = document.getElementById('videoPlayer');
const lessonList = document.getElementById('lessonList');
const courseTitle = document.getElementById('courseTitle');
const currentLessonTitle = document.getElementById('currentLessonTitle');
const nextLessonBtn = document.getElementById('nextLessonBtn');
const takeTestBtn = document.getElementById('takeTestBtn');

let currentCourseId = new URLSearchParams(window.location.search).get('id');
let currentCourse = null;
let currentLessonIndex = 0;
let userProgress = { completedLessons: [] };
let currentUser = null;

// Prevent right click on video
videoPlayer.addEventListener('contextmenu', (e) => e.preventDefault());

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        // Verify access (optional again, but good practice)
        await loadCourseData();
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

    // Get Course
    const courseDoc = await getDoc(doc(db, "courses", currentCourseId));
    if (!courseDoc.exists()) {
        alert("Course not found.");
        window.location.href = 'dashboard.html';
        return;
    }
    currentCourse = courseDoc.data();
    courseTitle.textContent = currentCourse.title;

    // Get Progress
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
        item.className = `list-group-item list-group-item-action ${index === currentLessonIndex ? 'active' : ''}`;
        
        // Add checkmark if completed
        const isCompleted = userProgress.completedLessons.includes(index);
        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span>${index + 1}. ${lesson.title}</span>
                ${isCompleted ? '<i class="fas fa-check-circle text-success"></i>' : ''}
            </div>
        `;

        item.onclick = () => loadLesson(index);
        lessonList.appendChild(item);
    });

    // Load first lesson if none selected
    if (videoPlayer.getAttribute('src') === "") {
        loadLesson(0);
    }
}

function loadLesson(index) {
    currentLessonIndex = index;
    const lesson = currentCourse.lessons[index];
    
    currentLessonTitle.textContent = lesson.title;
    
    // "Obfuscate" URL slightly by not having it in initial HTML and setting it here
    videoPlayer.src = lesson.videoURL;
    videoPlayer.load();
    videoPlayer.play().catch(e => console.log("Auto-play prevented", e));

    renderLessons(); // Update active state

    nextLessonBtn.disabled = true;
    nextLessonBtn.onclick = () => loadLesson(index + 1);

    // If already completed, enable next
    if (userProgress.completedLessons.includes(index)) {
        nextLessonBtn.disabled = false;
    }
}

// Video Events
videoPlayer.addEventListener('ended', async () => {
    nextLessonBtn.disabled = false;
    
    if (!userProgress.completedLessons.includes(currentLessonIndex)) {
        // Mark as completed in Firestore
        await setDoc(doc(db, "users", currentUser.uid, "progress", currentCourseId), {
            completedLessons: arrayUnion(currentLessonIndex)
        }, { merge: true });
        
        // Update local state
        userProgress.completedLessons.push(currentLessonIndex);
        renderLessons();
        checkTestEligibility();
    }
});

function checkTestEligibility() {
    // Check if at least 3 lessons are completed
    if (userProgress.completedLessons.length >= 3) {
        takeTestBtn.classList.remove('d-none');
        takeTestBtn.onclick = () => {
            window.location.href = `quiz.html?courseId=${currentCourseId}`;
        };
    }
}
