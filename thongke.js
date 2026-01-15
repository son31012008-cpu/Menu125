import { db } from './firebase-config.js';
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Load thống kê với filter
window.loadStatistics = function(period = 'today') {
  // Set active button
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  const ordersRef = collection(db, 'orders');
  let startTime = new Date();

  // Tính thời gian bắt đầu
  switch(period) {
    case 'today':
      startTime.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startTime.setDate(startTime.getDate() - 7);
      break;
    case 'month':
      startTime.setDate(startTime.getDate() - 30);
      break;
    case 'all':
      startTime = new Date('2020-01-01'); // Ngày xa trong quá khứ
      break;
  }

  const q = query(
    ordersRef,
    where('timestamp', '>=', startTime.toISOString()),
    where('status', '==', 'completed') // Chỉ tính đơn hoàn thành
  );

  onSnapshot(q, (snapshot) => {
    processStatistics(snapshot.docs.map(doc => doc.data()));
  }, (error) => {
    console.error("❌ Lỗi load thống kê:", error);
    showToast('Không thể tải thống kê!', 'error');
  });
}

function processStatistics(orders) {
  const foodStats = {}; // { name: { count, revenue, icon, category } }
  let totalRevenue = 0;
  let totalItems = 0;

  orders.forEach(order => {
    order.items.forEach(item => {
      const key = item.name;
      if (!foodStats[key]) {
        foodStats[key] = {
          count: 0,
          revenue: 0,
          icon: item.icon || '🍽️',
          category: item.category || 'Chưa phân loại'
        };
      }
      foodStats[key].count += item.quantity;
      foodStats[key].revenue += item.price * item.quantity;
      totalItems += item.quantity;
    });
    totalRevenue += order.totalAmount;
  });

  // Sắp xếp theo số lượng giảm dần
  const sortedStats = Object.entries(foodStats)
    .sort(([,a], [,b]) => b.count - a.count);

  renderSummary(totalRevenue, totalItems, orders.length);
  renderFoodStats(sortedStats);
}

function renderSummary(totalRevenue, totalItems, totalOrders) {
  document.getElementById('statistics-summary').innerHTML = `
    <div class="summary-card">
      <h3>💰 Tổng doanh thu</h3>
      <div class="value">${totalRevenue.toLocaleString()}đ</div>
    </div>
    <div class="summary-card" style="background: linear-gradient(135deg, #27ae60, #229954);">
      <h3>🍽️ Tổng món đã bán</h3>
      <div class="value">${totalItems}</div>
    </div>
    <div class="summary-card" style="background: linear-gradient(135deg, #f39c12, #e67e22);">
      <h3>📋 Tổng đơn hàng</h3>
      <div class="value">${totalOrders}</div>
    </div>
    <div class="summary-card" style="background: linear-gradient(135deg, #9b59b6, #8e44ad);">
      <h3>📊 Trung bình/đơn</h3>
      <div class="value">${totalOrders > 0 ? Math.round(totalRevenue / totalOrders).toLocaleString() : 0}đ</div>
    </div>
  `;
}

function renderFoodStats(stats) {
  const container = document.getElementById('food-stats-grid');
  
  if (stats.length === 0) {
    container.innerHTML = `
      <div class="no-data">
        <h3>📊 Chưa có dữ liệu</h3>
        <p>Không có đơn hàng nào trong khoảng thời gian này</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = stats.map(([name, data]) => `
    <div class="stat-card">
      <div class="stat-header">
        <div class="stat-icon">${data.icon}</div>
        <div class="stat-info">
          <h3>${name}</h3>
          <div class="category">${data.category}</div>
        </div>
      </div>
      <div class="stat-details">
        <div>
          <div class="quantity-sold">${data.count}</div>
          <div class="order-label">phần đã bán</div>
        </div>
        <div class="revenue">${data.revenue.toLocaleString()}đ</div>
      </div>
    </div>
  `).join('');
}

// Load mặc định khi mở trang
window.addEventListener('load', () => {
  loadStatistics('today');
});

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer') || (() => {
    const c = document.createElement('div');
    c.id = 'toastContainer';
    c.className = 'toast-container';
    document.body.appendChild(c);
    return c;
  })();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
