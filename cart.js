// ============================================
// IMPORT - CHỈ 1 LẦN
// ============================================
import { db, customerId, doc, setDoc, updateDoc, increment, showToast } from './firebase-config.js';
import { getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// ============================================
// KHAI BÁO BIẾN TOÀN CẦU - CHỈ 1 LẦN
// ============================================
let cart = [];
let totalAmount = 0;
let pendingOrderCallback = null;

// ============================================
// CÁC HÀM CHỨC NĂNG - MỖI HÀM 1 LẦN
// ============================================

async function initCart() {
  cart = JSON.parse(localStorage.getItem('cart') || '[]');
  
  if (cart.length === 0) {
    document.body.innerHTML = `
      <div style="text-align:center; padding:50px;">
        <h2>🛒 Giỏ hàng trống</h2>
        <p>Quay lại menu để chọn món nhé!</p>
        <button onclick="window.location.href='index.html'">Quay lại</button>
      </div>
    `;
    return;
  }
  
  renderCart();
  calculateTotal();
  setupEventListeners();
  setupModalEvents();
  
  const customerEl = document.getElementById('customerIdCart');
  if (customerEl) {
    customerEl.textContent = customerId || 'Khách vãng lai';
  }
}

function renderCart() {
  const cartContainer = document.getElementById('cartItems');
  if (!cartContainer) return;
  
  cartContainer.innerHTML = cart.map(item => `
    <div class="cart-item">
      <span>${item.icon} ${item.name}</span>
      <span>${item.price.toLocaleString()}đ x ${item.quantity}</span>
      <button class="remove-btn" data-id="${item.id}">Xóa</button>
    </div>
  `).join('');
  
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const itemId = e.target.dataset.id;
      removeFromCart(itemId);
    });
  });
}

function calculateTotal() {
  totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalEl = document.getElementById('totalAmount');
  if (totalEl) {
    totalEl.textContent = `${totalAmount.toLocaleString()}đ`;
  }
}

function removeFromCart(itemId) {
  cart = cart.filter(item => item.id !== itemId);
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
  calculateTotal();
  
  if (cart.length === 0) {
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
}

function showConfirmModal(orderData, callback) {
  pendingOrderCallback = callback;
  
  const summaryEl = document.getElementById('orderSummary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <strong>Khách:</strong> ${orderData.customerName}<br>
      <strong>Bàn:</strong> ${orderData.tableNumber}<br>
      <strong>Tổng:</strong> ${orderData.totalAmount.toLocaleString()}đ<br>
      <strong>Số món:</strong> ${orderData.items.length}<br>
      <hr>
      <strong>Chi tiết:</strong><br>
      ${orderData.items.map(item => `${item.name} x${item.quantity}`).join('<br>')}
    `;
  }
  
  const modal = document.getElementById('confirmModal');
  if (modal) {
    modal.classList.add('show');
  }
}

function closeConfirmModal() {
  const modal = document.getElementById('confirmModal');
  if (modal) {
    modal.classList.remove('show');
  }
  pendingOrderCallback = null;
}

async function confirmSendOrder() {
  if (pendingOrderCallback) {
    await pendingOrderCallback();
  }
  closeConfirmModal();
}

async function sendOrderToFirebase(orderData) {
  const orderId = `${orderData.tableNumber}_${Date.now()}`;
  const orderRef = doc(db, 'orders', orderId);
  
  await setDoc(orderRef, {
    ...orderData,
    status: 'pending',
    createdAt: new Date().toISOString(),
    orderNumber: Date.now().toString().slice(-6)
  });
  
  const statsRef = doc(db, 'stats', 'daily');
  const statsSnap = await getDoc(statsRef);
  
  if (statsSnap.exists()) {
    await updateDoc(statsRef, {
      totalOrders: increment(1),
      totalRevenue: increment(orderData.totalAmount)
    });
  } else {
    await setDoc(statsRef, {
      totalOrders: 1,
      totalRevenue: orderData.totalAmount,
      date: new Date().toISOString().split('T')[0]
    });
  }
}

function setupEventListeners() {
  const sendBtn = document.getElementById('placeOrder');
  
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const tableNumber = 'Bàn không xác định';
      const customerName = customerId || 'Khách vãng lai';
      
      if (cart.length === 0) {
        showToast('Giỏ hàng trống!', 'error');
        return;
      }
      
      const orderData = {
        customerName,
        tableNumber,
        items: [...cart],
        totalAmount: totalAmount,
        timestamp: Date.now(),
        status: 'pending',
        customerId: customerId
      };
      
      showConfirmModal(orderData, async () => {
        try {
          await sendOrderToFirebase(orderData);
          showToast('✅ Đã gửi đơn cho bếp!', 'success');
          
          localStorage.removeItem('cart');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 2000);
          
        } catch (error) {
          console.error("❌ Lỗi gửi đơn:", error);
          showToast('Có lỗi khi gửi đơn: ' + error.message, 'error');
        }
      });
    });
  }
}

function setupModalEvents() {
  const confirmBtn = document.querySelector('.btn-confirm');
  const cancelBtn = document.querySelector('.btn-cancel');
  
  if (confirmBtn) {
    confirmBtn.addEventListener('click', confirmSendOrder);
  }
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeConfirmModal);
  }
}

// ============================================
// KHỞI CHẠY
// ============================================
initCart();
