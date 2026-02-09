import { auth, db, collection, getDocs, doc, updateDoc, getDoc, query, where } from "./firebase-config.js";
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
    pendingCountEl.textContent = pendingCount;
    totalCountEl.textContent = totalCount;
    approvedCountEl.textContent = approvedCount;

    // Fetch only pending requests for the table
    const pendingQuery = query(
        collection(db, "scholarship_requests"),
        where("status", "==", "pending")
    );
    const querySnapshot = await getDocs(pendingQuery);

    loading.style.display = 'none';

    if (querySnapshot.empty) {
        emptyState.classList.remove('d-none');
        return;
    }

    emptyState.classList.add('d-none');

    querySnapshot.forEach((docSnapshot) => {
        const app = docSnapshot.data();
        const row = document.createElement('tr');

        const date = app.appliedAt
            ? new Date(app.appliedAt.seconds * 1000).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'short', day: 'numeric'
            })
            : 'N/A';

        row.innerHTML = `
            <td>${date}</td>
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
                <button class="btn btn-success btn-sm approve-btn" data-uid="${app.uid}" data-appid="${docSnapshot.id}">
                    <i class="fas fa-check me-1"></i>Approve
                </button>
            </td>
        `;
        applicationsTable.appendChild(row);
    });

    // Add event listeners for approve buttons
    document.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', approveUser);
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
        // Update the user's status to "approved" in the users collection
        await updateDoc(doc(db, "users", uid), {
            status: 'approved'
        });

        // Update the scholarship_requests document status to "approved"
        await updateDoc(doc(db, "scholarship_requests", appId), {
            status: 'approved'
        });

        alert("Scholarship approved! The student now has full course access.");
        loadApplications(); // Refresh the table

    } catch (error) {
        console.error("Error approving user:", error);
        alert("Error approving user: " + error.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check me-1"></i>Approve';
    }
}
