import { auth, db, doc, setDoc, getDoc } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// DOM Elements
const authWrapper = document.getElementById('authWrapper');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const showSignupBtn = document.getElementById('showSignup');
const showLoginBtn = document.getElementById('showLogin');
const alertContainer = document.getElementById('alertContainer');

// Password Toggles
const toggleLoginPass = document.getElementById('toggleLoginPass');
const toggleSignupPass = document.getElementById('toggleSignupPass');
const loginPasswordInput = document.getElementById('loginPassword');
const signupPasswordInput = document.getElementById('signupPassword');

// Helper: Show Alert
function showAlert(message, type = 'danger') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show shadow-lg`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${type === 'danger' ? '<i class="fas fa-exclamation-circle me-2"></i>' : '<i class="fas fa-check-circle me-2"></i>'}
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertContainer.appendChild(alertDiv);
    
    // Auto dismiss
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertDiv);
        bsAlert.close();
    }, 4000);
}

// Helper: Toggle Password Visibility
function setupPasswordToggle(toggleBtn, inputField) {
    if (toggleBtn && inputField) {
        toggleBtn.addEventListener('click', () => {
            const type = inputField.getAttribute('type') === 'password' ? 'text' : 'password';
            inputField.setAttribute('type', type);
            toggleBtn.classList.toggle('fa-eye');
            toggleBtn.classList.toggle('fa-eye-slash');
        });
    }
}

setupPasswordToggle(toggleLoginPass, loginPasswordInput);
setupPasswordToggle(toggleSignupPass, signupPasswordInput);

// Helper: Shake Animation
function triggerShake(form) {
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.classList.add('shake');
        input.addEventListener('animationend', () => {
            input.classList.remove('shake');
        }, { once: true });
    });
}

// Helper: Loading State
function setLoading(button, isLoading) {
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

// Toggle Forms (Slide Effect)
if (showSignupBtn && showLoginBtn && authWrapper) {
    showSignupBtn.addEventListener('click', () => {
        authWrapper.classList.add('sign-up-mode');
    });

    showLoginBtn.addEventListener('click', () => {
        authWrapper.classList.remove('sign-up-mode');
    });
}

// Handle Login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const btn = loginForm.querySelector('button');

        setLoading(btn, true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            showAlert("Login successful! Redirecting...", "success");
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } catch (error) {
            console.error(error);
            setLoading(btn, false);
            triggerShake(loginForm);
            
            let msg = "Invalid email or password";
            if (error.code === 'auth/user-not-found') msg = "User not found";
            if (error.code === 'auth/wrong-password') msg = "Incorrect password";
            showAlert(msg, "danger");
        }
    });
}

// Handle Signup
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const btn = signupForm.querySelector('button');

        setLoading(btn, true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create user document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                role: 'student',
                status: 'pending_payment',
                createdAt: new Date().toISOString()
            });

            showAlert("Account created! Redirecting...", "success");
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);

        } catch (error) {
            console.error(error);
            setLoading(btn, false);
            triggerShake(signupForm);

            let msg = error.message;
            if (error.code === 'auth/email-already-in-use') msg = "Email already in use";
            if (error.code === 'auth/weak-password') msg = "Password should be at least 6 characters";
            showAlert(msg, "danger");
        }
    });
}

// Forgot Password Placeholder
const forgotPassLink = document.getElementById('forgotPassLink');
if (forgotPassLink) {
    forgotPassLink.addEventListener('click', (e) => {
        e.preventDefault();
        showAlert("Reset password link sent to email (Demo)", "info");
    });
}

// Auth State Check
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const path = window.location.pathname;
        if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
             window.location.href = 'dashboard.html';
        }
    }
});