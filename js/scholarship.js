import { auth, db, collection, addDoc, doc, getDoc, query, where, getDocs } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = "dd6ckybfy";
const CLOUDINARY_UPLOAD_PRESET = "qq4NjKt3QCLe_GQT5ft5ojUZ15E";

const form = document.getElementById('scholarshipForm');
const formContainer = document.getElementById('scholarshipFormContainer');
const alreadyApplied = document.getElementById('alreadyApplied');
const appliedStatusText = document.getElementById('appliedStatusText');
const progressContainer = document.getElementById('progressContainer');
const progressTextEl = document.getElementById('progressText');
const uploadProgress = document.getElementById('uploadProgress');
const alertMessage = document.getElementById('alertMessage');
const submitBtn = document.getElementById('submitBtn');
const studentNameInput = document.getElementById('studentName');
const emailInput = document.getElementById('email');
const logoutBtn = document.getElementById('logoutBtn');
const toggleSidebar = document.getElementById('toggleSidebar');
const sidebar = document.getElementById('sidebar');

let currentUser = null;

// Sidebar toggle
if (toggleSidebar) {
    toggleSidebar.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => window.location.href = 'index.html');
    });
}

function showAlert(message, type) {
    if (alertMessage) {
        alertMessage.textContent = message;
        alertMessage.className = `alert alert-${type} mb-4`;
        alertMessage.classList.remove('d-none');
    }
}

// Check Auth & existing application status
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        emailInput.value = user.email;

        // Fetch user details for name
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                studentNameInput.value = userData.name || user.displayName || "";

                // Check if user already has an approved scholarship
                if (userData.status === 'approved') {
                    formContainer.classList.add('d-none');
                    alreadyApplied.classList.remove('d-none');
                    appliedStatusText.textContent = "Your scholarship has been approved! You have full course access.";
                    return;
                }
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }

        // Check if already applied (pending request exists)
        try {
            const q = query(
                collection(db, "scholarship_requests"),
                where("uid", "==", user.uid),
                where("status", "==", "pending")
            );
            const existingApps = await getDocs(q);
            if (!existingApps.empty) {
                formContainer.classList.add('d-none');
                alreadyApplied.classList.remove('d-none');
                appliedStatusText.textContent = "Your scholarship application is pending review by the Desinix Team.";
                return;
            }
        } catch (error) {
            console.error("Error checking existing applications:", error);
        }
    } else {
        window.location.href = 'index.html';
    }
});

/**
 * Upload a file directly to Cloudinary using the Fetch API (unsigned upload).
 * @param {File} file - The image file to upload.
 * @param {string} folder - The Cloudinary folder to organize uploads.
 * @returns {Promise<string>} - The secure URL of the uploaded image.
 */
async function uploadToCloudinary(file, folder) {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);

    const response = await fetch(url, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Cloudinary upload failed');
    }

    const data = await response.json();
    return data.secure_url;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser) {
        showAlert("You must be logged in to submit.", "danger");
        return;
    }

    const adhaarFile = document.getElementById('adhaarFile').files[0];
    const birthCertFile = document.getElementById('birthCertFile').files[0];

    // Validation
    const files = [adhaarFile, birthCertFile];
    for (const file of files) {
        if (!file) {
            showAlert("Please select all required documents.", "danger");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            showAlert(`File "${file.name}" exceeds the 2MB limit.`, "danger");
            return;
        }
        if (!file.type.startsWith('image/')) {
            showAlert(`File "${file.name}" is not a valid image.`, "danger");
            return;
        }
    }

    // UI Updates
    alertMessage.classList.add('d-none');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Uploading...';
    progressContainer.classList.remove('d-none');
    uploadProgress.style.width = "0%";
    progressTextEl.textContent = "Uploading Adhaar Card to Cloudinary...";

    try {
        // Step 1: Upload Adhaar to Cloudinary
        const adhaarUrl = await uploadToCloudinary(
            adhaarFile,
            `scholarship_docs/${currentUser.uid}`
        );
        uploadProgress.style.width = "50%";
        progressTextEl.textContent = "Uploading Birth Certificate to Cloudinary...";

        // Step 2: Upload Birth Certificate to Cloudinary
        const birthCertUrl = await uploadToCloudinary(
            birthCertFile,
            `scholarship_docs/${currentUser.uid}`
        );
        uploadProgress.style.width = "80%";
        progressTextEl.textContent = "Saving to database...";

        // Step 3: Save to Firestore (scholarship_requests collection)
        await addDoc(collection(db, "scholarship_requests"), {
            uid: currentUser.uid,
            email: currentUser.email,
            adhaarUrl: adhaarUrl,
            birthCertUrl: birthCertUrl,
            status: "pending",
            appliedAt: serverTimestamp()
        });

        uploadProgress.style.width = "100%";
        progressTextEl.textContent = "Application submitted!";

        showAlert("Scholarship application submitted successfully! The Desinix Team will review your documents.", "success");

        // Show the already-applied banner and hide form
        setTimeout(() => {
            formContainer.classList.add('d-none');
            alreadyApplied.classList.remove('d-none');
            appliedStatusText.textContent = "Your scholarship application is pending review by the Desinix Team.";
        }, 2000);

    } catch (error) {
        console.error("Upload failed:", error);
        showAlert("Upload failed: " + error.message, "danger");
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Submit Application';
        progressContainer.classList.add('d-none');
    }
});
