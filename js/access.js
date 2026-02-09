import { auth, db, storage, ref, uploadBytes, getDownloadURL, doc, updateDoc, getDoc, addDoc, collection } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
                uploadStatus.innerHTML = '<span class="text-info">Application pending approval.</span>';
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

// Razorpay Logic (Mock)
if (payBtn) {
    payBtn.addEventListener('click', () => {
        const options = {
            "key": "YOUR_KEY_ID", // Enter the Key ID generated from the Dashboard
            "amount": "49900", // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
            "currency": "INR",
            "name": "Professional LMS",
            "description": "Course Access Fee",
            "handler": async function (response){
                // On success, update user status
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
        // Since we don't have a real key, we'll just mock the success for this demo
        // const rzp1 = new Razorpay(options);
        // rzp1.open();
        
        // MOCK SUCCESS
        if(confirm("Simulating Payment Success?")) {
             options.handler({razorpay_payment_id: "mock_id"});
        }
    });
}

// Scholarship Upload Logic
if (scholarshipForm) {
    scholarshipForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentUser) return;

        const adhaarFile = document.getElementById('adhaarFile').files[0];
        const birthFile = document.getElementById('birthFile').files[0];
        const rationFile = document.getElementById('rationFile').files[0];

        if (!adhaarFile || !birthFile) {
            alert("Please upload required documents.");
            return;
        }

        uploadStatus.innerHTML = '<span class="text-primary">Uploading documents... Please wait.</span>';
        scholarshipForm.querySelector('button').disabled = true;

        try {
            const timestamp = Date.now();
            
            // Upload Adhaar
            const adhaarRef = ref(storage, `documents/${currentUser.uid}/adhaar_${timestamp}`);
            await uploadBytes(adhaarRef, adhaarFile);
            const adhaarURL = await getDownloadURL(adhaarRef);

            // Upload Birth Cert
            const birthRef = ref(storage, `documents/${currentUser.uid}/birth_${timestamp}`);
            await uploadBytes(birthRef, birthFile);
            const birthURL = await getDownloadURL(birthRef);

            // Upload Ration (if exists)
            let rationURL = null;
            if (rationFile) {
                const rationRef = ref(storage, `documents/${currentUser.uid}/ration_${timestamp}`);
                await uploadBytes(rationRef, rationFile);
                rationURL = await getDownloadURL(rationRef);
            }

            // Save Application to Firestore
            await addDoc(collection(db, "applications"), {
                uid: currentUser.uid,
                name: currentUser.displayName || "Unknown", // Assuming displayName is set or fetched
                email: currentUser.email,
                adhaarURL: adhaarURL,
                birthCertURL: birthURL,
                rationCardURL: rationURL,
                timestamp: new Date()
            });

            // Update User Status
            await updateDoc(doc(db, "users", currentUser.uid), {
                status: 'scholarship_pending'
            });

            uploadStatus.innerHTML = '<span class="text-success">Request submitted successfully! Waiting for approval.</span>';

        } catch (error) {
            console.error(error);
            uploadStatus.innerHTML = '<span class="text-danger">Error uploading documents. Try again.</span>';
            scholarshipForm.querySelector('button').disabled = false;
        }
    });
}
