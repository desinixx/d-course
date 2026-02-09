import { auth, db, collection, getDocs, doc, updateDoc, deleteDoc, getDoc, query, where } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const applicationsTable = document.getElementById('applicationsTable');
const loading = document.getElementById('loading');
const emptyState = document.getElementById('emptyState');
const pendingCountEl = document.getElementById('pendingCount');
const totalCountEl = document.getElementById('totalCount');
const approvedCountEl = document.getElementById('approvedCount');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Check if admin
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
            loadApplications();
        } else if (user.email === 'admin@desinix.com') {
            loadApplications();
        } else {
            alert("Access Denied. Admins only.");
            window.location.href = 'dashboard.html';
        }
    } else {
        window.location.href = 'index.html';
    }
});

async function loadApplications() {
    applicationsTable.innerHTML = '';
    loading.style.display = 'block';

    // Fetch all scholarship_requests to compute stats
    const allSnapshot = await getDocs(collection(db, "scholarship_requests"));

    let pendingCount = 0;
    let approvedCount = 0;
    let totalCount = allSnapshot.size;

    allSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.status === 'pending') pendingCount++;
        if (data.status === 'approved') approvedCount++;
    });

    // Update stats
    if (pendingCountEl) pendingCountEl.textContent = pendingCount;
    if (totalCountEl) totalCountEl.textContent = totalCount;
    if (approvedCountEl) approvedCountEl.textContent = approvedCount;

    // Fetch only pending requests for the table
    const pendingQuery = query(
        collection(db, "scholarship_requests"),
        where("status", "==", "pending")
    );
    const querySnapshot = await getDocs(pendingQuery);

    loading.style.display = 'none';

    if (querySnapshot.empty) {
        if (emptyState) emptyState.classList.remove('d-none');
        return;
    }

    if (emptyState) emptyState.classList.add('d-none');

    const rowPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const app = docSnapshot.data();
        let studentName = 'Unknown';

        try {
            const userDocSnap = await getDoc(doc(db, "users", app.uid));
            if (userDocSnap.exists()) {
                studentName = userDocSnap.data().name || 'No Name';
            }
        } catch (e) {
            console.error("Error fetching user name:", e);
        }

        const row = document.createElement('tr');

        const date = app.appliedAt
            ? new Date(app.appliedAt.seconds * 1000).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'short', day: 'numeric'
            })
            : 'N/A';

        row.innerHTML = `
            <td>${date}</td>
            <td>${studentName}</td>
            <td>${app.email}</td>
            <td>
                <a href="${app.adhaarUrl}" target="_blank" rel="noopener noreferrer">
                    <img src="${app.adhaarUrl}" alt="Adhaar" class="doc-thumbnail" title="Click to view Adhaar Card">
                </a>
            </td>
            <td>
                <a href="${app.birthCertUrl}" target="_blank" rel="noopener noreferrer">
                    <img src="${app.birthCertUrl}" alt="Birth Cert" class="doc-thumbnail" title="Click to view Birth Certificate">
                </a>
            </td>
            <td><span class="badge-pending">Pending</span></td>
            <td>
                <div class="d-flex gap-2">
                    <button class="btn btn-success btn-sm approve-btn" data-uid="${app.uid}" data-appid="${docSnapshot.id}">
                        <i class="fas fa-check me-1"></i>Approve
                    </button>
                    <button class="btn btn-danger btn-sm reject-btn" data-uid="${app.uid}" data-appid="${docSnapshot.id}">
                        <i class="fas fa-times me-1"></i>Reject
                    </button>
                </div>
            </td>
        `;
        return row;
    });

    const rows = await Promise.all(rowPromises);
    rows.forEach(row => applicationsTable.appendChild(row));

    // Add event listeners for buttons
    document.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', approveUser);
    });
    document.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', rejectUser);
    });
}

async function approveUser(e) {
    const btn = e.target.closest('.approve-btn');
    const uid = btn.getAttribute('data-uid');
    const appId = btn.getAttribute('data-appid');

    if (!confirm("Are you sure you want to approve this scholarship request?")) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Approving...';

    try {
        // Update the user status in the users collection to approved
        await updateDoc(doc(db, "users", uid), {
            status: 'approved'
        });

        // Delete the entry from scholarship_requests
        await deleteDoc(doc(db, "scholarship_requests", appId));

        alert("Scholarship approved! The student now has full course access.");
        loadApplications(); // Refresh the table

    } catch (error) {
        console.error("Error approving user:", error);
        alert("Error approving user: " + error.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check me-1"></i>Approve';
    }
}

async function rejectUser(e) {
    const btn = e.target.closest('.reject-btn');
    const uid = btn.getAttribute('data-uid');
    const appId = btn.getAttribute('data-appid');

    if (!confirm("Are you sure you want to REJECT this scholarship request?")) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Rejecting...';

    try {
        // Optional: Update user status to 'rejected'
        await updateDoc(doc(db, "users", uid), {
            status: 'rejected'
        });

        // Delete the entry from scholarship_requests
        await deleteDoc(doc(db, "scholarship_requests", appId));

        alert("Scholarship rejected.");
        loadApplications(); // Refresh the table

    } catch (error) {
        console.error("Error rejecting user:", error);
        alert("Error rejecting user: " + error.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-times me-1"></i>Reject';
    }
}