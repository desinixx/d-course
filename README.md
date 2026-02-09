# Professional LMS with Firebase

This is a Vanilla HTML/CSS/JS Learning Management System integrated with Firebase.

## Features

1.  **Authentication**: Login/Signup using Firebase Auth.
2.  **Dashboard**: View available courses (Seeded automatically if empty).
3.  **Course Player**: 
    - Video playback with disabled right-click.
    - "Next Lesson" button unlocks after video ends.
    - Progress tracking (saved to Firestore).
    - "Take Test" button appears after 3 lessons.
4.  **Access Control**:
    - **Razorpay (Mock)**: Click "Pay" to simulate payment and get immediate access.
    - **Scholarship**: Upload documents (saved to Firebase Storage). Admin must approve.
5.  **Admin Panel**: 
    - View pending scholarship applications.
    - View uploaded documents.
    - Approve users.
6.  **Assessment & Certificate**:
    - Quiz at the end of the course.
    - Auto-generated Certificate (Canvas API) upon passing.
    - Downloadable Certificate.

## Setup

1.  **Firebase Config**: The configuration is already set in `js/firebase-config.js`.
2.  **Hosting**: Open `index.html` via a local server (e.g., Live Server) or deploy to Netlify.

## How to Use

### Student Flow
1.  **Sign Up** at `signup.html`.
2.  You will be redirected to `access.html` because your status is "pending_payment".
3.  **Option A**: Click "Pay with Razorpay" -> Confirm Mock Payment -> Instant Access.
4.  **Option B**: Upload dummy files for Scholarship -> Wait for Admin Approval.
5.  Once accessed, go to **Dashboard**.
6.  Select a Course.
7.  Watch videos. "Next Lesson" unlocks when video finishes.
8.  After 3 lessons, click "Take Test".
9.  Pass the quiz to generate and download your **Certificate**.

### Admin Flow
1.  Navigate to `admin.html`.
2.  **Note**: Access is restricted. For this demo, you must have the role `admin` in your Firestore user document. 
    - *Testing Tip*: Open `js/admin.js` and see that `admin@desinix.com` is hardcoded allowed for testing, OR you can manually edit your User document in Firestore Console to change `role` to `admin`.
3.  View the table of applications.
4.  Click "Approve" to grant access to a scholarship applicant.

## Tech Stack
-   **Frontend**: HTML5, CSS3 (Bootstrap 5), JavaScript (ES6 Modules).
-   **Backend/DB**: Firebase Authentication, Firestore, Storage.
-   **Payment**: Razorpay (Mock).
