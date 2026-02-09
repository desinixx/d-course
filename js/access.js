import { auth, db, doc, updateDoc, getDoc, addDoc, collection } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = "ffztf4nj";
const CLOUDINARY_UPLOAD_PRESET = "747623266781195";

const payBtn = document.getElementById('payBtn');
const scholarshipForm = document.getElementById('scholarshipForm');
const uploadStatus = document.getElementById('uploadStatus');
const logoutBtn = document.getElementById('logoutBtn');

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        // Check if already approved/paid, then redirect to dashboard
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.status === 'approved' || userData.status === 'paid') {
                window.location.href = 'dashboard.html';
            } else if (userData.status === 'scholarship_pending') {
                uploadStatus.innerHTML = '<span class="text-warning">Application pending approval.</span>';
                scholarshipForm.querySelector('button').disabled = true;
            }
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

/**
 * Upload a file directly to Cloudinary using the Fetch API (unsigned upload).
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

// Razorpay Logic (Mock)
if (payBtn) {
    payBtn.addEventListener('click', () => {
        const options = {
            "key": "YOUR_KEY_ID",
            "amount": "49900",
            "currency": "INR",
            "name": "Professional LMS",
            "description": "Course Access Fee",
            "handler": async function (response){
                if (currentUser) {
                     await updateDoc(doc(db, "users", currentUser.uid), {
                        status: 'paid'
                    });
                    alert('Payment Successful! Access Granted.');
                    window.location.href = 'dashboard.html';
                }
            },
            "prefill": {
                "name": currentUser ? currentUser.displayName : "",
                "email": currentUser ? currentUser.email : ""
            },
            "theme": {
                "color": "#3399cc"
            }
        };
        // MOCK SUCCESS
        if(confirm("Simulating Payment Success?")) {
             options.handler({razorpay_payment_id: "mock_id"});
        }
    });
}

// Scholarship Upload Logic - Now using Cloudinary
if (scholarshipForm) {
    scholarshipForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUser) return;

        const adhaarFile = document.getElementById('adhaarFile').files[0];
        const birthFile = document.getElementById('birthFile').files[0];

        if (!adhaarFile || !birthFile) {
            alert("Please upload required documents (Adhaar and Birth Certificate).");
            return;
        }

        // Validate file types and sizes
        for (const file of [adhaarFile, birthFile]) {
            if (file.size > 2 * 1024 * 1024) {
                alert(`File "${file.name}" exceeds 2MB limit.`);
                return;
            }
            if (!file.type.startsWith('image/')) {
                alert(`File "${file.name}" is not a valid image.`);
                return;
            }
        }

        uploadStatus.innerHTML = '<span class="text-warning">Uploading documents to Cloudinary... Please wait.</span>';
        scholarshipForm.querySelector('button').disabled = true;

        try {
            // Upload Adhaar to Cloudinary
            const adhaarUrl = await uploadToCloudinary(
                adhaarFile,
                `scholarship_docs/${currentUser.uid}`
            );

            // Upload Birth Certificate to Cloudinary
            const birthCertUrl = await uploadToCloudinary(
                birthFile,
                `scholarship_docs/${currentUser.uid}`
            );

            // Save Application to Firestore (scholarship_requests collection)
            await addDoc(collection(db, "scholarship_requests"), {
                uid: currentUser.uid,
                email: currentUser.email,
                adhaarUrl: adhaarUrl,
                birthCertUrl: birthCertUrl,
                status: "pending",
                appliedAt: serverTimestamp()
            });

            // Update User Status
            await updateDoc(doc(db, "users", currentUser.uid), {
                status: 'scholarship_pending'
            });

            uploadStatus.innerHTML = '<span class="text-success">Request submitted successfully! Waiting for Desinix Team approval.</span>';

        } catch (error) {
            console.error(error);
            uploadStatus.innerHTML = '<span class="text-danger">Error uploading documents: ' + error.message + '</span>';
            scholarshipForm.querySelector('button').disabled = false;
        }
    });
}
