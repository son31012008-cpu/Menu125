// Firebase v9+ Modular SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { 
  getFirestore, doc, onSnapshot, getDoc, setDoc, updateDoc, increment,
  collection, query, where, orderBy, limit, getDocs 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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

// ========== HÀM THÔNG BÁO TOAST ==========
function showToast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toastContainer') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} toast-tet`;
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-content">
      <div class="toast-title">Thông báo</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'slideOut 0.4s ease forwards';
      setTimeout(() => toast.remove(), 400);
    }
  }, duration);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// ========== EXPORT ĐẦY ĐỦ ==========
export { 
  db, auth, signInAnonymously, customerId, 
  doc, onSnapshot, getDoc, setDoc, updateDoc, increment,
  collection, query, where, orderBy, limit, getDocs,
  showToast 
};
