import { auth, db, doc, getDoc } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const quizForm = document.getElementById('quizForm');
const quizContainer = document.getElementById('quizContainer');
const resultContainer = document.getElementById('resultContainer');
const canvas = document.getElementById('certificateCanvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('downloadBtn');

let currentUser = null;
let currentCourseId = new URLSearchParams(window.location.search).get('courseId');
let courseTitle = "Web Development Course"; // Default or fetch

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        if(currentCourseId) {
             const courseDoc = await getDoc(doc(db, "courses", currentCourseId));
             if(courseDoc.exists()) {
                 courseTitle = courseDoc.data().title;
             }
        }
    } else {
        window.location.href = 'index.html';
    }
});

quizForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const q1 = document.querySelector('input[name="q1"]:checked').value;
    const q2 = document.querySelector('input[name="q2"]:checked').value;

    if (q1 === 'correct' && q2 === 'correct') {
        showResult();
    } else {
        alert("Incorrect answers. Please try again.");
    }
});

async function showResult() {
    quizContainer.classList.add('d-none');
    resultContainer.classList.remove('d-none');

    // Generate Certificate
    await generateCertificate();
    
    // Send Email (Mock)
    sendEmail();
}

async function generateCertificate() {
    // Background
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.lineWidth = 20;
    ctx.strokeStyle = "#2c3e50";
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Header
    ctx.fillStyle = "#2c3e50";
    ctx.font = "bold 50px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Certificate of Completion", canvas.width / 2, 150);

    // Subheader
    ctx.fillStyle = "#555";
    ctx.font = "30px Arial";
    ctx.fillText("This is to certify that", canvas.width / 2, 220);

    // Name
    const userName = currentUser.displayName || (await fetchUserName()) || "Student";
    ctx.fillStyle = "#000";
    ctx.font = "bold 60px Brush Script MT, cursive"; // Or just Arial if font not available
    ctx.fillText(userName, canvas.width / 2, 300);

    // Course
    ctx.fillStyle = "#555";
    ctx.font = "30px Arial";
    ctx.fillText("has successfully completed the course", canvas.width / 2, 380);
    
    ctx.fillStyle = "#007bff";
    ctx.font = "bold 40px Arial";
    ctx.fillText(courseTitle, canvas.width / 2, 450);

    // Date
    const date = new Date().toLocaleDateString();
    ctx.fillStyle = "#777";
    ctx.font = "20px Arial";
    ctx.fillText(`Date: ${date}`, canvas.width / 2, 530);
}

async function fetchUserName() {
    const docSnap = await getDoc(doc(db, "users", currentUser.uid));
    if (docSnap.exists()) {
        return docSnap.data().name;
    }
    return "Student";
}

function sendEmail() {
    // Mock EmailJS
    console.log("Sending email to:", currentUser.email);
    // emailjs.send(...) would go here
    // Since we don't have keys, we just log it.
}

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `Certificate_${currentUser.uid}.png`;
    link.href = canvas.toDataURL();
    link.click();
});
