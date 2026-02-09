import { auth, db, doc, getDoc, updateDoc } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const quizForm = document.getElementById('quizForm');
const quizContainer = document.getElementById('quizContainer');
const resultContainer = document.getElementById('resultContainer');
const loadingOverlay = document.getElementById('loadingOverlay');
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
        processSuccess();
    } else {
        alert("Incorrect answers. Please try again.");
    }
});

function processSuccess() {
    // 1. Show Loading
    loadingOverlay.classList.remove('d-none');
    
    // 2. Wait 3 seconds (simulating processing)
    setTimeout(async () => {
        // 3. Generate Certificate
        await generateCertificate();
        
        // 4. Update DB
        if(currentUser) {
            try {
                await updateDoc(doc(db, "users", currentUser.uid), {
                    quizPassed: true
                });
            } catch(e) {
                console.error("Error updating profile:", e);
            }
        }

        // 5. Send Email (Mock)
        sendEmail();

        // 6. Reveal Result
        loadingOverlay.classList.add('d-none');
        quizContainer.parentElement.querySelector('.card-header').style.display = 'none'; // Hide header
        quizContainer.classList.add('d-none');
        resultContainer.classList.remove('d-none');
        
    }, 3000);
}

async function generateCertificate() {
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    // Ornamental Border (Gold Gradient)
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#d4af37");
    gradient.addColorStop(0.5, "#f1c40f");
    gradient.addColorStop(1, "#d4af37");
    
    ctx.lineWidth = 20;
    ctx.strokeStyle = gradient;
    ctx.strokeRect(10, 10, width - 20, height - 20);
    
    // Inner thin line
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#2c3e50";
    ctx.strokeRect(35, 35, width - 70, height - 70);

    // Header
    ctx.fillStyle = "#2c3e50";
    ctx.font = "bold 50px 'Playfair Display', serif"; // Fallback to serif
    ctx.textAlign = "center";
    ctx.fillText("CERTIFICATE", width / 2, 120);
    
    ctx.font = "20px 'Poppins', sans-serif";
    ctx.fillText("OF COMPLETION", width / 2, 150);

    // Line separator
    ctx.beginPath();
    ctx.moveTo(width / 2 - 50, 170);
    ctx.lineTo(width / 2 + 50, 170);
    ctx.strokeStyle = "#d4af37";
    ctx.stroke();

    // Subheader
    ctx.fillStyle = "#555";
    ctx.font = "italic 24px 'Poppins', sans-serif";
    ctx.fillText("This is to certify that", width / 2, 220);

    // Name
    const userName = currentUser.displayName || (await fetchUserName()) || "Student Name";
    ctx.fillStyle = "#1a1a1a";
    ctx.font = "bold 60px 'Great Vibes', cursive, serif"; // Fancy font fallback
    ctx.fillText(userName, width / 2, 300);

    // Underline Name
    ctx.beginPath();
    ctx.moveTo(width / 2 - 150, 310);
    ctx.lineTo(width / 2 + 150, 310);
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Course Text
    ctx.fillStyle = "#555";
    ctx.font = "20px 'Poppins', sans-serif";
    ctx.fillText("has successfully completed the course", width / 2, 360);
    
    ctx.fillStyle = "#2c3e50";
    ctx.font = "bold 32px 'Poppins', sans-serif";
    ctx.fillText(courseTitle, width / 2, 410);

    // Date & Signature
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    ctx.font = "18px 'Poppins', sans-serif";
    ctx.fillStyle = "#777";
    
    // Left: Date
    ctx.textAlign = "left";
    ctx.fillText(`Date: ${date}`, 100, 500);
    
    // Right: Signature (Mock)
    ctx.textAlign = "right";
    ctx.fillText("LMS Director", width - 100, 520);
    ctx.beginPath();
    ctx.moveTo(width - 200, 500);
    ctx.lineTo(width - 50, 500);
    ctx.stroke();
    
    // Signature Mock
    ctx.font = "italic 20px serif";
    ctx.fillText("John Doe", width - 100, 490);
}

async function fetchUserName() {
    try {
        const docSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (docSnap.exists()) {
            return docSnap.data().name;
        }
    } catch(e) { console.log(e); }
    return "Student";
}

function sendEmail() {
    // Mock Email Trigger
    console.log(`[Email Service] Sending certificate to ${currentUser.email}`);
    // In a real scenario:
    // emailjs.send('service_id', 'template_id', { to_email: currentUser.email, ... });
}

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `Certificate_${currentUser.uid}.png`;
    link.href = canvas.toDataURL();
    link.click();
});