// Import Firebase SDK - KHÔNG DẤU CÁCH
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
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

// ===== THÊM: SYNC GIỮA THIẾT BỊ =====
let customerId = localStorage.getItem('customerId');
let isSyncEnabled = localStorage.getItem('firebaseSync') === 'true';

if (!customerId || !isSyncEnabled) {
  customerId = 'KH' + Date.now() + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('customerId', customerId);
  localStorage.setItem('firebaseSync', 'true');
}

signInAnonymously(auth).catch(console.error);

// Kiểm tra xem có đang dùng thiết bị khác không
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("✅ Firebase Auth ID:", user.uid);
    // TODO: Sau này dùng user.uid để sync đơn hàng giữa thiết bị
  }
});

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

// ========== HÀM SYNC ĐƠN HÀNG (Tính năng cao cấp) ==========
export async function syncOrdersToUser(userId, customerId) {
  try {
    const ordersByCustomer = collection(db, 'orders');
    const q = query(ordersByCustomer, where('customerId', '==', customerId));
    const snapshot = await getDocs(q);
    
    // Copy đơn hàng cũ sang user mới
    const promises = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return setDoc(doc(db, 'userOrders', userId, 'orders', docSnap.id), data);
    });
    
    await Promise.all(promises);
    showToast('✅ Đã đồng bộ đơn hàng giữa thiết bị!', 'success');
  } catch (error) {
    console.error("Lỗi sync:", error);
    showToast('Lỗi đồng bộ: ' + error.message, 'error');
  }
}

// ========== EXPORT ==========
export { 
  db, auth, signInAnonymously, customerId, 
  doc, onSnapshot, getDoc, setDoc, updateDoc, increment,
  collection, query, where, orderBy, limit, getDocs,
  showToast, syncOrdersToUser
};
