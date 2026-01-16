import { db, showToast } from './firebase-config.js';
import { 
  collection, query, where, onSnapshot, 
  doc, getDocs 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Tham số toàn cục
let currentFilter = 'today';
let foodDataCache = {};
let ordersListener = null;

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

  // Cleanup listener cũ
  if (ordersListener) {
    ordersListener();
    ordersListener = null;
  }

  showLoading();

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

  ordersListener = onSnapshot(q, (snapshot) => {
    console.log(`📊 REALTIME: ${snapshot.docs.length} đơn mới`);
    processStatistics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => {
    console.error("❌ Lỗi Firebase:", error);
    showToast('Không thể tải thống kê!');
    hideLoading();
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
  hideLoading();
}

// ========== RENDER TỔNG QUAN ==========
function renderSummary(totalRevenue, totalItems, totalOrders) {
  const container = document.getElementById('statistics-summary');
  if (!container) return;
  
  container.innerHTML = `
    <div class="summary-card realtime-card">
      <h3>💰 Tổng doanh thu</h3>
      <div class="value">${totalRevenue.toLocaleString()}đ</div>
    </div>
    <div class="summary-card realtime-card" style="background: linear-gradient(135deg, #27ae60, #229954);">
      <h3>🍽️ Tổng món đã bán</h3>
      <div class="value">${totalItems}</div>
    </div>
    <div class="summary-card realtime-card" style="background: linear-gradient(135deg, #f39c12, #e67e22);">
      <h3>📋 Tổng đơn hàng</h3>
      <div class="value">${totalOrders}</div>
    </div>
    <div class="summary-card realtime-card" style="background: linear-gradient(135deg, #9b59b6, #8e44ad);">
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
    <div class="stat-card realtime-card">
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

// ========== SHOW/HIDE LOADING ==========
function showLoading() {
  const container = document.getElementById('food-stats-grid');
  if (container) {
    container.innerHTML = `
      <div class="no-data">
        <h3>⏳ Đang tải dữ liệu...</h3>
        <p>Vui lòng đợi trong giây lát</p>
      </div>
    `;
  }
}

function hideLoading() {
  // Không cần làm gì, renderFoodStats sẽ thay thế nội dung
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

// ⭐⭐⭐ FIX QUAN TRỌNG: EXPORT RA GLOBAL SCOPE⭐⭐⭐
window.loadStatistics = loadStatistics;

// Thêm CSS pulse animation
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { opacity: 0.7; }
    100% { opacity: 1; }
  }
  .realtime-card {
    transition: all 0.3s ease;
  }
`;
document.head.appendChild(style);
