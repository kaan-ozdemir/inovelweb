// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCyWJ26hK5qqXEyh0z947uG9SidU0hHdpE",
    authDomain: "inovelraffle.firebaseapp.com",
    projectId: "inovelraffle",
    storageBucket: "inovelraffle.firebasestorage.app",
    messagingSenderId: "452191999667",
    appId: "1:452191999667:web:57f7c0b92da230ad1942c6"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
