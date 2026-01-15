// Firebase v9+ Modular SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, increment, onSnapshot, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
  // COPY 6 DÒNG CONFIG CỦA BẠN VÀO ĐÂY
  apiKey: "YOUR_API_KEY",
  authDomain: "menu-vhdg.firebaseapp.com",
  projectId: "menu-vhdg",
  storageBucket: "menu-vhdg.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Tạo ID khách hàng duy nhất
let customerId = localStorage.getItem('customerId');
if (!customerId) {
  customerId = 'KH' + Date.now() + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('customerId', customerId);
}

// Đăng nhập ẩn danh
signInAnonymously(auth).catch(console.error);

export { db, auth, signInAnonymously, customerId, collection, doc, getDoc, setDoc, updateDoc, increment, onSnapshot, query, orderBy, limit };