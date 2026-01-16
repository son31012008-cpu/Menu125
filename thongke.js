import { db, showToast } from './firebase-config.js';
import { 
  collection, query, where, onSnapshot, 
  doc, getDocs 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Tham số toàn cục
let currentFilter = 'today';
let foodDataCache = {};

// ========== LOAD THỐNG KÊ ==========
function loadStatistics(period = 'today') {
  currentFilter = period;
  
  // Set active button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.period === period) {
      btn.classList.add('active');
    }
  });

  const ordersRef = collection(db, 'orders');
  let startTime = new Date();

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
      startTime = new Date('2020-01-01');
      break;
  }

  const q = query(
    ordersRef,
    where('timestamp', '>=', startTime.toISOString()),
    where('status', '==', 'completed')
  );

  onSnapshot(q, (snapshot) => {
    console.log(`✅ Tìm thấy ${snapshot.docs.length} đơn hoàn thành`);
    processStatistics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => {
    console.error("❌ Lỗi load thống kê:", error);
    showToast('Không thể tải thống kê!');
  });
}

// ========== XỬ LÝ THỐNG KÊ ==========
async function processStatistics(orders) {
  const foodStats = {};
  let totalRevenue = 0;
  let totalItems = 0;

  // Load cache món ăn
  if (Object.keys(foodDataCache).length === 0) {
    console.log("📦 Đang cache dữ liệu món ăn...");
    const foodsRef = collection(db, 'foodData');
    const snapshot = await getDocs(foodsRef);
    snapshot.docs.forEach(doc => {
      foodDataCache[doc.id] = { id: doc.id, ...doc.data() };
    });
  }

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
    totalRevenue += order.totalAmount || 0;
  });

  const sortedStats = Object.entries(foodStats)
    .sort(([,a], [,b]) => b.count - a.count);

  renderSummary(totalRevenue, totalItems, orders.length);
  renderFoodStats(sortedStats);
}

// ========== RENDER TỔNG QUAN ==========
function renderSummary(totalRevenue, totalItems, totalOrders) {
  const container = document.getElementById('statistics-summary');
  if (!container) return;
  
  container.innerHTML = `
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

// ========== RENDER DANH SÁCH MÓN ==========
function renderFoodStats(stats) {
  const container = document.getElementById('food-stats-grid');
  if (!container) return;
  
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

// ========== KHỞI TẠO ==========
document.addEventListener('DOMContentLoaded', () => {
  // Gắn sự kiện cho filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const period = btn.dataset.period;
      loadStatistics(period);
    });
  });
  
  // Load mặc định
  loadStatistics('today');
});

// Export ra global
window.loadStatistics = loadStatistics;
