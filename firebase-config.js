import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyADHGSv4xwRrqP-ia5WZUWs6GHchtpEYSc",
  authDomain: "menu-vhdg.firebaseapp.com",
  projectId: "menu-vhdg",
  storageBucket: "menu-vhdg.firebasestorage.app",
  messagingSenderId: "486523234627",
  appId: "1:486523234627:web:c25a8970015f77599627f6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let customerId = localStorage.getItem('customerId');
if (!customerId) {
  customerId = 'KH' + Date.now() + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('customerId', customerId);
}

signInAnonymously(auth).catch(console.error);
export { db, auth, customerId, doc, onSnapshot, getDoc, setDoc, updateDoc, increment };
