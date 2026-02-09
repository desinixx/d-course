import { auth, db, doc, setDoc, getDoc } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const alertMessage = document.getElementById('alertMessage');

function showAlert(message, type) {
    if (alertMessage) {
        alertMessage.textContent = message;
        alertMessage.className = `alert alert-${type} mt-3`;
        alertMessage.classList.remove('d-none');
    } else {
        console.log(message);
    }
}

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create user document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                role: 'student', // Default role
                status: 'pending_payment' // Default status
            });

            showAlert("Account created! Redirecting...", "success");
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);

        } catch (error) {
            showAlert(error.message, "danger");
        }
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            showAlert("Login successful! Redirecting...", "success");
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } catch (error) {
            showAlert("Invalid email or password", "danger");
        }
    });
}

// Check auth state
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // If on login or signup page, redirect to dashboard
        const path = window.location.pathname;
        if (path.includes('index.html') || path.includes('signup.html') || path === '/' ) {
             // Optional: Check role if needed, but for now just dashboard
             // Fetch user role to decide where to go? 
             // Admin might go to admin.html, but let's stick to dashboard first.
             window.location.href = 'dashboard.html';
        }
    }
});
