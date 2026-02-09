import { auth, db, collection, getDocs, doc, updateDoc, getDoc, deleteDoc } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const applicationsTable = document.getElementById('applicationsTable');
const loading = document.getElementById('loading');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Check if admin
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
            loadApplications();
        } else {
            // For demo purposes, if the email is "admin@desinix.com", we treat as admin
            // OR if it's the very first user... 
            // Let's just alert and redirect if not admin.
            // But to allow the USER to test this, I'll allow it if they add ?admin=true to URL or similar hack, 
            // OR I will just instruct them to change the role in Firestore.
            // For now:
            if(user.email === 'admin@desinix.com') {
                 loadApplications();
            } else {
                alert("Access Denied. Admins only.");
                window.location.href = 'dashboard.html';
            }
        }
    } else {
        window.location.href = 'index.html';
    }
});

async function loadApplications() {
    applicationsTable.innerHTML = '';
    const querySnapshot = await getDocs(collection(db, "applications"));
    
    if (querySnapshot.empty) {
        loading.textContent = "No pending applications.";
        return;
    }

    loading.style.display = 'none';

    querySnapshot.forEach((docSnapshot) => {
        const app = docSnapshot.data();
        const row = document.createElement('tr');
        
        const date = app.timestamp ? new Date(app.timestamp.seconds * 1000).toLocaleDateString() : 'N/A';

        row.innerHTML = `
            <td>${date}</td>
            <td>${app.name}</td>
            <td>${app.email}</td>
            <td>
                <a href="${app.adhaarURL}" target="_blank" class="btn btn-sm btn-outline-info">Adhaar</a>
                <a href="${app.birthCertURL}" target="_blank" class="btn btn-sm btn-outline-info">Birth Cert</a>
                ${app.rationCardURL ? `<a href="${app.rationCardURL}" target="_blank" class="btn btn-sm btn-outline-info">Ration</a>` : ''}
            </td>
            <td>
                <button class="btn btn-success btn-sm approve-btn" data-uid="${app.uid}" data-appid="${docSnapshot.id}">Approve</button>
            </td>
        `;
        applicationsTable.appendChild(row);
    });

    // Add event listeners
    document.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', approveUser);
    });
}

async function approveUser(e) {
    const uid = e.target.getAttribute('data-uid');
    const appId = e.target.getAttribute('data-appid');

    if (!confirm("Are you sure you want to approve this user?")) return;

    try {
        // Update user status
        await updateDoc(doc(db, "users", uid), {
            status: 'approved'
        });

        // Delete application (or move to archive)
        await deleteDoc(doc(db, "applications", appId));

        alert("User approved successfully!");
        loadApplications(); // Refresh

    } catch (error) {
        console.error(error);
        alert("Error approving user.");
    }
}
