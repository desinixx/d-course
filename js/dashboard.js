import { auth, db, doc, getDoc, collection, getDocs, addDoc, setDoc } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const userNameSpan = document.getElementById('userName');
const coursesList = document.getElementById('coursesList');
const logoutBtn = document.getElementById('logoutBtn');
const toggleSidebar = document.getElementById('toggleSidebar');
const sidebar = document.getElementById('sidebar');
const progressCircle = document.getElementById('progressCircle');
const progressText = document.getElementById('progressText');

// Sidebar toggle
if(toggleSidebar) {
    toggleSidebar.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Check access
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            userNameSpan.textContent = userData.name || user.email.split('@')[0];

            if (userData.status !== 'paid' && userData.status !== 'approved') {
                window.location.href = 'access.html';
                return;
            }

            if (userData.role === 'admin') {
                 const sidebar = document.querySelector('.sidebar');
                 if(!document.getElementById('adminLink')) {
                     const adminLink = document.createElement('a');
                     adminLink.id = 'adminLink';
                     adminLink.href = 'admin.html';
                     adminLink.innerHTML = '<i class="fas fa-user-shield me-3"></i> Admin Panel';
                     sidebar.insertBefore(adminLink, sidebar.lastElementChild);
                 }
            }

            await loadCoursesAndProgress(user.uid);
            checkAchievements(user.uid, userData);
        } else {
             console.error("User document not found");
        }
    } else {
        window.location.href = 'index.html';
    }
});

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => window.location.href = 'index.html');
    });
}

async function loadCoursesAndProgress(userId) {
    coursesList.innerHTML = '';
    const querySnapshot = await getDocs(collection(db, "courses"));
    
    if (querySnapshot.empty) {
        await seedCourses();
        loadCoursesAndProgress(userId); 
        return;
    }

    let totalLessons = 0;
    let totalCompleted = 0;
    let coursesCompleted = 0;

    // Fetch user progress for all courses
    const progressSnapshot = await getDocs(collection(db, "users", userId, "progress"));
    const userProgressMap = {}; // courseId -> [completedLessonIndices]
    progressSnapshot.forEach(doc => {
        userProgressMap[doc.id] = doc.data().completedLessons || [];
    });

    querySnapshot.forEach((docSnap) => {
        const course = docSnap.data();
        const courseId = docSnap.id;
        const lessons = course.lessons || [];
        const completed = userProgressMap[courseId] || [];
        
        totalLessons += lessons.length;
        totalCompleted += completed.length;
        
        if (lessons.length > 0 && completed.length === lessons.length) {
            coursesCompleted++;
        }

        // Render Card
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-4';
        
        // Calculate course specific progress
        const courseProgress = lessons.length > 0 ? Math.round((completed.length / lessons.length) * 100) : 0;

        col.innerHTML = `
            <div class="course-card h-100 p-3 d-flex flex-column">
                <div class="card-body flex-grow-1">
                    <h5 class="card-title">${course.title}</h5>
                    <p class="card-text small mt-2">${course.description || "No description available."}</p>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <small class="text-muted">${lessons.length} Lessons</small>
                        <small class="text-primary">${courseProgress}% Complete</small>
                    </div>
                    <div class="progress mt-2" style="height: 5px; background: rgba(255,255,255,0.1);">
                        <div class="progress-bar bg-primary" role="progressbar" style="width: ${courseProgress}%"></div>
                    </div>
                </div>
                <div class="mt-3">
                    <a href="course.html?id=${courseId}" class="btn btn-primary w-100">Continue Learning</a>
                </div>
            </div>
        `;
        coursesList.appendChild(col);
    });

    updateProgressCircle(totalCompleted, totalLessons);
    updateAchievementsUI(totalCompleted, coursesCompleted);

    // Show certificate if at least one course is completed
    if (coursesCompleted > 0) {
        document.getElementById('certificateLink').style.display = 'block';
    }
}

function updateProgressCircle(completed, total) {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const offset = 440 - (440 * percentage / 100);
    
    progressCircle.style.strokeDashoffset = offset;
    progressText.textContent = `${percentage}%`;
}

function updateAchievementsUI(totalCompleted, coursesCompleted) {
    // 1. Fast Learner (> 3 lessons)
    if (totalCompleted >= 3) {
        document.getElementById('badge-fast-learner').classList.add('unlocked');
    }
    
    // 2. Dedicated (>= 1 course completed)
    if (coursesCompleted >= 1) {
        document.getElementById('badge-dedicated').classList.add('unlocked');
    }
}

async function checkAchievements(userId, userData) {
     // 3. Quiz Master (Check user profile for quiz flag)
     if (userData.quizPassed) {
         document.getElementById('badge-quiz-master').classList.add('unlocked');
         document.getElementById('certificateLink').style.display = 'block'; // Show cert link
     }
}

async function seedCourses() {
    // ... (Existing seed code is fine, omitting for brevity as it's likely already run or in db)
    // If I need to re-add it I will, but assuming DB has data or previous run handled it.
    // Copying the existing seed logic just in case:
    const courses = [
        {
            title: "Full Stack Web Development",
            description: "Master HTML, CSS, JS, and Backend technologies.",
            lessons: [
                { title: "Introduction to HTML", videoURL: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
                { title: "CSS Basics", videoURL: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
                { title: "JavaScript Fundamentals", videoURL: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
                { title: "Advanced JS", videoURL: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" }
            ]
        },
        {
            title: "French Language Mastery",
            description: "Learn French from scratch to advanced level.",
            lessons: [
                { title: "French Greetings", videoURL: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" },
                { title: "Numbers and Days", videoURL: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4" },
                { title: "Basic Grammar", videoURL: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4" }
            ]
        }
    ];

    for (const course of courses) {
        await addDoc(collection(db, "courses"), course);
    }
}