// ========== IMPORT TỪ FIREBASE JS ==========
import { 
  db, customerId, 
  collection, query, where, orderBy, getDocs,
  showToast 
} from './firebase-config.js';

// ========== CẤU HÌNH & BIẾN ==========
let currentPeriod = 'today';

// ========== CÁC HÀM TIỆN ÍCH ==========
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function getStartTime(period) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayMs = 24 * 60 * 60 * 1000;
  
  switch(period) {
    case 'today':
      return startOfDay.getTime();
    case 'week':
      return startOfDay.getTime() - (7 * dayMs);
    case 'month':
      return startOfDay.getTime() - (30 * dayMs);
    case 'all':
      return 0;
    default:
      return startOfDay.getTime();
  }
}

// ========== LẤY DỮ LIỆU TỪ FIRESTORE ==========
async function getOrderDataFromFirestore() {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const orders = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() ? data.timestamp.toDate().getTime() : (data.timestamp || 0)
      });
    });
    
    return orders;
  } catch (error) {
    console.error("Lỗi Firestore:", error);
    showToast('Lỗi kết nối database: ' + error.message, 'error');
    return [];
  }
}

// ========== TÍNH TOÁN THỐNG KÊ ==========
function calculateFoodStats(orders, period) {
  const startTime = getStartTime(period);
  const filteredOrders = orders.filter(order => order.timestamp >= startTime);
  
  const foodStats = {};
  let totalRevenue = 0;
  let totalOrders = 0;
  let totalQuantity = 0;
  
  filteredOrders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        const foodName = item.name;
        const quantity = parseInt(item.quantity) || 0;
        const price = parseInt(item.price) || 0;
        
        if (!foodStats[foodName]) {
          foodStats[foodName] = {
            name: foodName,
            icon: item.icon || '🍽️',
            category: item.category || 'Món ăn',
            quantity: 0,
            revenue: 0
          };
        }
        
        foodStats[foodName].quantity += quantity;
        foodStats[foodName].revenue += quantity * price;
        
        totalQuantity += quantity;
        totalRevenue += quantity * price;
      });
      totalOrders++;
    }
  });
  
  return {
    foods: Object.values(foodStats),
    summary: {
      totalRevenue,
      totalOrders,
      totalQuantity,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
    }
  };
}

// ========== RENDER GIAO DIỆN ==========
function renderSummary(summary) {
  const container = document.getElementById('statistics-summary');
  if (!container) return;
  
  container.innerHTML = `
    <div class="summary-card">
      <h3>Tổng doanh thu</h3>
      <div class="value">${formatCurrency(summary.totalRevenue)}</div>
    </div>
    <div class="summary-card">
      <h3>Tổng đơn hàng</h3>
      <div class="value">${summary.totalOrders}</div>
    </div>
    <div class="summary-card">
      <h3>Tổng số lượng</h3>
      <div class="value">${summary.totalQuantity}</div>
    </div>
    <div class="summary-card">
      <h3>Giá trị trung bình/đơn</h3>
      <div class="value">${formatCurrency(summary.averageOrderValue)}</div>
    </div>
  `;
}

function renderFoodStats(foodStats) {
  const gridContainer = document.getElementById('food-stats-grid');
  if (!gridContainer) return;
  
  const loading = document.getElementById('loading');
  if (loading) loading.style.display = 'none';
  
  if (foodStats.length === 0) {
    gridContainer.innerHTML = `
      <div class="no-data">
        <h3>📊 Không có dữ liệu</h3>
        <p>Không có đơn hàng nào trong khoảng thời gian này</p>
      </div>
    `;
    return;
  }
  
  foodStats.sort((a, b) => b.revenue - a.revenue);
  
  gridContainer.innerHTML = foodStats.map(food => `
    <div class="stat-card">
      <div class="stat-header">
        <div class="stat-icon">${food.icon}</div>
        <div class="stat-info">
          <h3>${food.name}</h3>
          <div class="category">${food.category}</div>
        </div>
      </div>
      <div class="stat-details">
        <div>
          <div class="quantity-sold">${food.quantity} đã bán</div>
          <div class="revenue">${formatCurrency(food.revenue)}</div>
        </div>
      </div>
    </div>
  `).join('');
}

function updateActiveButton(period) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const activeBtn = document.getElementById(`btn-${period}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

// ========== LOAD THỐNG KÊ ==========
async function loadStatistics(period) {
  try {
    const orders = await getOrderDataFromFirestore();
    const stats = calculateFoodStats(orders, period);
    
    renderSummary(stats.summary);
    renderFoodStats(stats.foods);
    updateActiveButton(period);
    
  } catch (error) {
    console.error("Lỗi tải thống kê:", error);
    showToast('Không thể tải thống kê: ' + error.message, 'error');
  }
}

// ========== KHỞI TẠO TRANG ==========
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('btn-today')?.addEventListener('click', () => loadStatistics('today'));
  document.getElementById('btn-week')?.addEventListener('click', () => loadStatistics('week'));
  document.getElementById('btn-month')?.addEventListener('click', () => loadStatistics('month'));
  document.getElementById('btn-all')?.addEventListener('click', () => loadStatistics('all'));
  
  loadStatistics('today');
});
