import { db, doc, getDoc, updateDoc } from './firebase-config.js';
import { collection, query, where, orderBy, onSnapshot, limit } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

let currentStatus = 'pending';
let selectedOrder = null;

// ============================================
// KHỞI TẠO TRANG
// ============================================
window.addEventListener('load', () => {
  setupTabEvents();
  loadOrders();
});

// ============================================
// SETUP TAB EVENTS
// ============================================
function setupTabEvents() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      
      btn.classList.add('active');
      currentStatus = btn.dataset.status;
      document.getElementById(`${currentStatus}-tab`).classList.add('active');
    });
  });
}

// ============================================
// LOAD ĐƠN HÀNG REALTIME
// ============================================
function loadOrders() {
  listenToPendingOrders();
  listenToPreparingOrders();
  listenToCompletedOrders();
}

function listenToPendingOrders() {
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, 
    where('status', '==', 'pending'), 
    orderBy('timestamp', 'asc')
  );
  
  onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderOrders('pending', orders);
    updateBadge('pending', orders.length);
  }, (error) => {
    console.error("❌ Lỗi load pending:", error);
    showToast('Không thể tải đơn chờ xử lý!', 'error');
  });
}

function listenToPreparingOrders() {
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, 
    where('status', '==', 'preparing'), 
    orderBy('timestamp', 'asc')
  );
  
  onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderOrders('preparing', orders);
    updateBadge('preparing', orders.length);
  }, (error) => {
    console.error("❌ Lỗi load preparing:", error);
    showToast('Không thể tải đơn đang nấu!', 'error');
  });
}

function listenToCompletedOrders() {
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, 
    where('status', '==', 'completed'), 
    orderBy('completedAt', 'desc'), 
    limit(50)
  );
  
  onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderOrders('completed', orders);
    updateBadge('completed', orders.length);
  }, (error) => {
    console.error("❌ Lỗi load completed:", error);
    showToast('Không thể tải đơn hoàn thành!', 'error');
  });
}

// ============================================
// RENDER ORDERS
// ============================================
function renderOrders(status, orders) {
  if (status === 'completed') {
    renderCompletedOrders(orders);
  } else {
    renderPendingOrPreparing(status, orders);
  }
}

function renderPendingOrPreparing(status, orders) {
  const container = document.getElementById(`${status}-orders`);
  if (!container) return;
  
  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>${status === 'pending' ? '📭 Không có đơn hàng nào' : '🔥 Không có đơn nào đang nấu'}</h2>
        <p>${status === 'pending' ? 'Đang chờ đơn hàng mới...' : 'Tất cả đơn đã hoàn thành!'}</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = orders.map(order => `
    <div class="order-summary-card" onclick="showOrderDetail('${order.id}')">
      <div class="status-badge ${order.status}">${getStatusText(order.status)}</div>
      <div class="order-number">#${order.orderNumber || order.id.slice(-6).toUpperCase()}</div>
      <div class="order-meta">
        🪑 <strong>Bàn:</strong> ${order.tableNumber || 'N/A'} | 
        🧑 <strong>Khách:</strong> ${order.customerName || 'Khách hàng'}
      </div>
      <div class="order-total">
        <span>💰 ${(order.totalAmount || 0).toLocaleString()}đ</span>
        <span>🍽️ ${order.items ? order.items.length : 0} món</span>
        <span>⏰ ${order.timestamp ? new Date(order.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span>
      </div>
    </div>
  `).join('');
}

function renderCompletedOrders(orders) {
  const tbody = document.getElementById('completed-orders');
  if (!tbody) return;
  
  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">Chưa có đơn hoàn thành</td></tr>';
    return;
  }
  
  tbody.innerHTML = orders.map((order, index) => `
    <tr>
      <td>#${order.orderNumber || order.id.slice(-6).toUpperCase()}</td>
      <td>${order.tableNumber || 'N/A'}</td>
      <td>${order.customerName || 'Khách vãng lai'}</td>
      <td style="color: #e74c3c; font-weight: bold;">${(order.totalAmount || 0).toLocaleString()}đ</td>
      <td class="time">${order.timestamp ? new Date(order.timestamp).toLocaleString('vi-VN') : '-'}</td>
      <td class="time">${order.completedAt ? new Date(order.completedAt).toLocaleString('vi-VN') : '-'}</td>
    </tr>
  `).join('');
}

// ============================================
// HIỂN THỊ CHI TIẾT
// ============================================
window.showOrderDetail = function(orderId) {
  const orderRef = doc(db, 'orders', orderId);
  
  getDoc(orderRef).then(docSnap => {
    if (docSnap.exists()) {
      const order = { id: docSnap.id, ...docSnap.data() };
      selectedOrder = order;
      renderDetailBox(order);
    } else {
      showToast('Không tìm thấy đơn hàng!', 'error');
    }
  }).catch(error => {
    console.error("❌ Lỗi tải chi tiết:", error);
    showToast('Không thể tải chi tiết đơn hàng!', 'error');
  });
}

function renderDetailBox(order) {
  const overlay = document.getElementById('detailOverlay');
  const detailBox = document.getElementById('orderDetailBox');
  const content = document.getElementById('detailContent');
  const actions = document.getElementById('detailActions');
  
  // Format items
  const itemsHtml = order.items && order.items.length > 0 
    ? order.items.map(item => `
        <div class="detail-item-row">
          <span>${item.icon || '🍽️'} ${item.name} <strong>x${item.quantity || 1}</strong></span>
          <span>${((item.price || 0) * (item.quantity || 1)).toLocaleString()}đ</span>
        </div>
      `).join('')
    : '<div class="detail-item-row"><span>Không có món nào</span><span></span></div>';

  content.innerHTML = `
    <div class="detail-grid">
      <div class="detail-item">
        <strong>🧑 Khách hàng</strong>
        <div style="font-size: 18px; color: #2c3e50;">${order.customerName || 'Khách vãng lai'}</div>
        <small style="color: #7f8c8d;">ID: ${order.customerId || 'N/A'}</small>
      </div>
      <div class="detail-item">
        <strong>🪑 Số bàn</strong>
        <div style="font-size: 20px; color: #e74c3c; font-weight: bold;">${order.tableNumber || 'N/A'}</div>
        <small style="color: #7f8c8d;">Đơn #${order.orderNumber || order.id.slice(-6).toUpperCase()}</small>
      </div>
      <div class="detail-item">
        <strong>⏰ Giờ đặt</strong>
        <div style="font-size: 16px;">${order.timestamp ? new Date(order.timestamp).toLocaleString('vi-VN') : '-'}</div>
      </div>
      <div class="detail-item">
        <strong>📊 Trạng thái</strong>
        <div style="font-size: 16px; color: ${getStatusColor(order.status)}; font-weight: bold;">
          ${getStatusText(order.status)}
        </div>
      </div>
      <div class="detail-item full-width">
        <strong>📝 Chi tiết món</strong>
        <div class="detail-items">
          ${itemsHtml}
        </div>
      </div>
    </div>
    
    <div class="total-section">
      <span class="total-label">💰 TỔNG TIỀN</span>
      <span class="total-amount">${(order.totalAmount || 0).toLocaleString()}đ</span>
    </div>
  `;
  
  actions.innerHTML = renderDetailActions(order);
  
  overlay.classList.add('show');
  detailBox.classList.add('show');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function renderDetailActions(order) {
  if (order.status === 'pending') {
    return `
      <button class="btn-action btn-start" onclick="updateOrderStatus('${order.id}', 'preparing')">
        <span>🔥</span> Bắt đầu nấu
      </button>
      <button class="btn-action btn-back" onclick="closeDetailBox()">
        <span>✕</span> Đóng
      </button>
    `;
  } else if (order.status === 'preparing') {
    return `
      <button class="btn-action btn-finish" onclick="updateOrderStatus('${order.id}', 'completed')">
        <span>✓</span> Hoàn thành
      </button>
      <button class="btn-action btn-back" onclick="closeDetailBox()">
        <span>✕</span> Đóng
      </button>
    `;
  }
  
  return `
    <button class="btn-action btn-back" onclick="closeDetailBox()">
      <span>←</span> Quay lại
    </button>
  `;
}

window.closeDetailBox = function() {
  document.getElementById('detailOverlay').classList.remove('show');
  document.getElementById('orderDetailBox').classList.remove('show');
  document.body.style.overflow = ''; // Restore scrolling
}

window.updateOrderStatus = function(orderId, status) {
  const orderRef = doc(db, 'orders', orderId);
  const updateData = { 
    status: status,
    updatedAt: new Date().toISOString()
  };
  
  if (status === 'completed') {
    updateData.completedAt = new Date().toISOString();
  } else if (status === 'preparing') {
    updateData.startedAt = new Date().toISOString();
  }
  
  updateDoc(orderRef, updateData).then(() => {
    const messages = {
      preparing: '🔥 Đã bắt đầu nấu món!',
      completed: '✅ Đơn hàng hoàn thành!'
    };
    showToast(messages[status] || 'Cập nhật thành công!', 'success');
    closeDetailBox();
  }).catch(error => {
    console.error("❌ Lỗi:", error);
    showToast('Có lỗi khi cập nhật!', 'error');
  });
}

// ============================================
// UPDATE BADGE
// ============================================
function updateBadge(status, count) {
  const badge = document.getElementById(`${status}-badge`);
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

// ============================================
// HELPERS
// ============================================
function getStatusText(status) {
  const statuses = {
    pending: 'Đang chờ',
    preparing: 'Đang nấu',
    completed: 'Hoàn thành'
  };
  return statuses[status] || status;
}

function getStatusColor(status) {
  const colors = {
    pending: '#e74c3c',
    preparing: '#f39c12',
    completed: '#27ae60'
  };
  return colors[status] || '#333';
}

// ============================================
// SHOW TOAST
// ============================================
function showToast(message, type = 'info', title = '') {
  const container = document.getElementById('toastContainer') || createToastContainer();
  
  // Xác định icon và title mặc định theo type
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  const titles = {
    success: 'Thành công',
    error: 'Lỗi',
    warning: 'Cảnh báo',
    info: 'Thông báo'
  };
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">
      <div class="toast-title">${title || titles[type] || 'Thông báo'}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;
  
  container.appendChild(toast);
  
  // Tự động xóa sau 3.5 giây
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}
