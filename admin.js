import { db, doc, onSnapshot, updateDoc } from './firebase-config.js';
import { collection, query, where, orderBy, onSnapshot as onSnapshotCollection } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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
      // Xóa active tất cả tab
      tabButtons.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      
      // Active tab được chọn
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
  // Lắng nghe 3 collections
  listenToOrders('pending');
  listenToOrders('preparing');
  listenToOrders('completed');
}

function listenToOrders(status) {
  const ordersRef = collection(db, 'orders');
  let q;
  
  if (status === 'completed') {
    q = query(ordersRef, where('status', '==', status), orderBy('completedAt', 'desc'), limit(50));
  } else {
    q = query(ordersRef, where('status', '==', status), orderBy('timestamp', 'asc'));
  }
  
  onSnapshotCollection(q, (snapshot) => {
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    
    renderOrders(status, orders);
    updateBadge(status, orders.length);
  });
}

// ============================================
// RENDER ORDERS THEO STATUS
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
      <div style="text-align:center; padding:50px; color:white;">
        <h2>📭 Không có đơn hàng nào</h2>
      </div>
    `;
    return;
  }
  
  container.innerHTML = orders.map(order => `
    <div class="order-summary-card" onclick="showOrderDetail('${order.id}')">
      <div class="status-badge ${order.status}">${getStatusText(order.status)}</div>
      <div class="order-number">#${order.orderNumber}</div>
      <div class="order-meta">
        🪑 <strong>Bàn:</strong> ${order.tableNumber} | 
        🧑 <strong>Khách:</strong> ${order.customerName || 'Khách vãng lai'}
      </div>
      <div class="order-total">
        💰 ${order.totalAmount.toLocaleString()}đ | 
        🍽️ ${order.items.length} món | 
        ⏰ ${new Date(order.timestamp).toLocaleTimeString()}
      </div>
    </div>
  `).join('');
}

function renderCompletedOrders(orders) {
  const tbody = document.getElementById('completed-orders');
  if (!tbody) return;
  
  tbody.innerHTML = orders.map(order => `
    <tr>
      <td>#${order.orderNumber}</td>
      <td>${order.tableNumber}</td>
      <td>${order.customerName || 'Khách vãng lai'}</td>
      <td>${order.totalAmount.toLocaleString()}đ</td>
      <td class="time">${new Date(order.timestamp).toLocaleString()}</td>
      <td class="time">${order.completedAt ? new Date(order.completedAt).toLocaleString() : '-'}</td>
    </tr>
  `).join('');
}

// ============================================
// HIỂN THỊ CHI TIẾT ĐƠN HÀNG
// ============================================
window.showOrderDetail = function(orderId) {
  const status = currentStatus;
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, where('__name__', '==', orderId));
  
  // Lấy 1 đơn
  getDocs(q).then(snapshot => {
    if (!snapshot.empty) {
      const order = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      selectedOrder = order;
      renderDetailBox(order);
    }
  });
}

function renderDetailBox(order) {
  const overlay = document.getElementById('detailOverlay');
  const detailBox = document.getElementById('orderDetailBox');
  const content = document.getElementById('detailContent');
  const actions = document.getElementById('detailActions');
  
  // Hiển thị ID khách hàng, số bàn, chi tiết, giờ đặt
  content.innerHTML = `
    <div class="detail-grid">
      <div class="detail-item">
        <strong>🧑 Khách hàng:</strong>
        ${order.customerName || 'Khách vãng lai'}<br>
        <small>ID: ${order.customerId || 'N/A'}</small>
      </div>
      <div class="detail-item">
        <strong>🪑 Số bàn:</strong> ${order.tableNumber}<br>
        <small>#${order.orderNumber}</small>
      </div>
      <div class="detail-item">
        <strong>⏰ Giờ đặt:</strong><br>
        ${new Date(order.timestamp).toLocaleString()}
      </div>
      <div class="detail-item">
        <strong>💰 Tổng tiền:</strong><br>
        ${order.totalAmount.toLocaleString()}đ
      </div>
      <div class="detail-item full-width">
        <strong>📋 Chi tiết đơn:</strong>
        <div class="detail-items" style="margin-top: 10px;">
          ${order.items.map(item => `
            <div class="detail-item-row">
              <span>${item.icon} ${item.name}</span>
              <span><strong>${item.price.toLocaleString()}đ</strong> x ${item.quantity}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  
  // Render nút hành động theo trạng thái
  actions.innerHTML = renderDetailActions(order);
  
  // Hiện modal
  overlay.classList.add('show');
  detailBox.classList.add('show');
}

function renderDetailActions(order) {
  if (order.status === 'pending') {
    return `
      <button class="btn-action btn-start" onclick="updateOrderStatus('${order.id}', 'preparing')">
        🔥 Bắt đầu nấu
      </button>
      <button class="btn-action btn-back" onclick="closeDetailBox()">
        ↩️ Quay lại
      </button>
    `;
  } else if (order.status === 'preparing') {
    return `
      <button class="btn-action btn-finish" onclick="updateOrderStatus('${order.id}', 'completed')">
        ✅ Hoàn thành
      </button>
      <button class="btn-action btn-back" onclick="updateOrderStatus('${order.id}', 'pending')">
        ↩️ Đưa về chờ
      </button>
    `;
  }
  
  return '';
}

window.closeDetailBox = function() {
  document.getElementById('detailOverlay').classList.remove('show');
  document.getElementById('orderDetailBox').classList.remove('show');
}

// ============================================
// CẬP NHẬT TRẠNG THÁI
// ============================================
window.updateOrderStatus = function(orderId, status) {
  const orderRef = doc(db, 'orders', orderId);
  const updateData = {
    status: status,
    updatedAt: new Date().toISOString()
  };
  
  // Nếu chuyển sang completed, ghi thời gian hoàn thành
  if (status === 'completed') {
    updateData.completedAt = new Date().toISOString();
  }
  
  updateDoc(orderRef, updateData).then(() => {
    showToast('Cập nhật trạng thái thành công!', 'success');
    closeDetailBox();
  }).catch(error => {
    console.error("❌ Lỗi cập nhật:", error);
    showToast('Có lỗi khi cập nhật!', 'error');
  });
}

// ============================================
// UPDATE BADGE COUNT
// ============================================
function updateBadge(status, count) {
  const badge = document.getElementById(`${status}-badge`);
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function getStatusText(status) {
  const statuses = {
    pending: 'Đang chờ',
    preparing: 'Đang nấu',
    completed: 'Hoàn thành'
  };
  return statuses[status] || status;
}

// ============================================
// KHỞI TẠO
// ============================================
loadOrders();
