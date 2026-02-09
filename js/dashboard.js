import { auth, db, doc, getDoc, collection, getDocs, addDoc, setDoc } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const userNameSpan = document.getElementById('userName');
const coursesList = document.getElementById('coursesList');
const logoutBtn = document.getElementById('logoutBtn');
const toggleSidebar = document.getElementById('toggleSidebar');
const sidebar = document.getElementById('sidebar');

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
            userNameSpan.textContent = userData.name || user.email;

            if (userData.status !== 'paid' && userData.status !== 'approved') {
                window.location.href = 'access.html';
                return;
            }

            // Check if admin
            if (userData.role === 'admin') {
                // Add admin link or redirect? For now just allow them to see dashboard too
                // Maybe add a link to admin.html in sidebar
                 const sidebar = document.querySelector('.sidebar');
                 const adminLink = document.createElement('a');
                 adminLink.href = 'admin.html';
                 adminLink.innerHTML = '<i class="fas fa-user-shield me-2"></i> Admin Panel';
                 sidebar.insertBefore(adminLink, sidebar.lastElementChild);
            }

            loadCourses();
        } else {
             // User doc missing? Create one or logout?
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

async function loadCourses() {
    coursesList.innerHTML = '';
    const querySnapshot = await getDocs(collection(db, "courses"));
    
    if (querySnapshot.empty) {
        await seedCourses();
        loadCourses(); // Reload
        return;
    }

    querySnapshot.forEach((doc) => {
        const course = doc.data();
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-4';
        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <h5 class="card-title">${course.title}</h5>
                    <p class="card-text text-muted">${course.description || "No description available."}</p>
                    <p class="card-text"><small class="text-muted">${course.lessons ? course.lessons.length : 0} Lessons</small></p>
                    <a href="course.html?id=${doc.id}" class="btn btn-primary w-100">Start Learning</a>
                </div>
            </div>
        `;
        coursesList.appendChild(col);
    });
}

async function seedCourses() {
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
