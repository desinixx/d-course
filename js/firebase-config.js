import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, addDoc, query, where, getDocs, deleteDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBsnCxgkIIihIt1KEfQrMhkc6T2VNvvaMo",
  authDomain: "d-course-9b1c6.firebaseapp.com",
  databaseURL: "https://d-course-9b1c6-default-rtdb.firebaseio.com",
  projectId: "d-course-9b1c6",
  storageBucket: "d-course-9b1c6.firebasestorage.app",
  messagingSenderId: "570486406353",
  appId: "1:570486406353:web:657cd143fda12799b099f0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, storage, googleProvider, collection, doc, getDoc, setDoc, updateDoc, addDoc, query, where, getDocs, deleteDoc, arrayUnion, ref, uploadBytes, getDownloadURL };
