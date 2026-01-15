import { db, customerId, doc, onSnapshot, updateDoc } from './firebase-config.js';
import { collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Hiển thị ID admin
document.getElementById('adminId').textContent = customerId || 'Bếp trưởng';

// ============================================
// TẢI ĐƠN HÀNG REALTIME
// ============================================
function loadOrders() {
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, where('status', 'in', ['pending', 'preparing', 'ready']), orderBy('timestamp', 'desc'));
  
  onSnapshot(q, (snapshot) => {
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    renderOrders(orders);
    updateStats(orders);
  });
}

// ============================================
// RENDER ĐƠN HÀNG
// ============================================
function renderOrders(orders) {
  const grid = document.getElementById('ordersGrid');
  if (!grid) return;
  
  if (orders.length === 0) {
    grid.innerHTML = '<div style="text-align:center; padding:50px; color:white;"><h2>📭 Chưa có đơn hàng mới</h2></div>';
    return;
  }
  
  grid.innerHTML = orders.map(order => `
    <div class="order-card ${order.status}">
      <div class="order-header">
        <div class="order-number">#${order.orderNumber}</div>
        <div class="order-status status-${order.status}">
          ${getStatusText(order.status)}
        </div>
      </div>
      
      <div class="order-info">
        <div>
          <strong>🧑 Khách:</strong> ${order.customerName}<br>
          <strong>🪑 Bàn:</strong> ${order.tableNumber}
        </div>
        <div>
          <strong>💰 Tổng:</strong> ${order.totalAmount.toLocaleString()}đ<br>
          <strong>⏰ Lúc:</strong> ${new Date(order.timestamp).toLocaleTimeString()}
        </div>
      </div>
      
      <div class="order-items">
        <strong>🍽️ Chi tiết:</strong>
        ${order.items.map(item => `
          <div class="order-item">
            <span>${item.icon} ${item.name}</span>
            <span>x${item.quantity}</span>
          </div>
        `).join('')}
      </div>
      
      <div class="order-actions">
        ${renderActionButtons(order.id, order.status)}
      </div>
    </div>
  `).join('');
  
  // Gắn sự kiện cho các nút
  document.querySelectorAll('.btn-status').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const orderId = e.target.dataset.orderId;
      const status = e.target.dataset.status;
      updateOrderStatus(orderId, status);
    });
  });
}

// ============================================
// CẬP NHẬT TRẠNG THÁI ĐƠN
// ============================================
async function updateOrderStatus(orderId, status) {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: status,
      updatedAt: new Date().toISOString()
    });
    
    // Thông báo cho khách hàng (nếu có customerId)
    // Có thể gửi FCM notification ở đây
    
  } catch (error) {
    console.error("❌ Lỗi cập nhật trạng thái:", error);
  }
}

// ============================================
// CẬP NHẬT THỐNG KÊ
// ============================================
function updateStats(orders) {
  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length
  };
  
  document.getElementById('pendingCount').textContent = stats.pending;
  document.getElementById('preparingCount').textContent = stats.preparing;
  document.getElementById('readyCount').textContent = stats.ready;
}

// ============================================
// HELPER
// ============================================
function getStatusText(status) {
  const statuses = {
    pending: '⏳ Chờ xử lý',
    preparing: '🔥 Đang nấu',
    ready: '✅ Sẵn sàng'
  };
  return statuses[status] || status;
}

function renderActionButtons(orderId, status) {
  const buttons = {
    pending: `<button class="btn-status btn-preparing" data-order-id="${orderId}" data-status="preparing">Bắt đầu nấu</button>`,
    preparing: `<button class="btn-status btn-ready" data-order-id="${orderId}" data-status="ready">Hoàn thành</button>`,
    ready: `<button class="btn-status btn-complete" data-order-id="${orderId}" data-status="completed">Đã giao</button>`
  };
  
  return buttons[status] || '';
}

// ============================================
// KHỞI TẠO
// ============================================
window.addEventListener('load', () => {
  loadOrders();
});
