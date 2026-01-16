// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, query, get, orderByChild, startAt } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCeD7qFkQKgg4rCTvJTY02l2JNUqy5P9Ag",
  authDomain: "beptiendungnam.firebaseapp.com",
  databaseURL: "https://beptiendungnam-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "beptiendungnam",
  storageBucket: "beptiendungnam.appspot.com",
  messagingSenderId: "1028539429806",
  appId: "1:1028539429806:web:3e16a9b040df7d3a6c4dc7",
  measurementId: "G-GX0QKJKYZX"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// CÁC HÀM THỐNG KÊ
let currentPeriod = 'today';

// Hàm format số tiền
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Hàm lấy thời gian bắt đầu theo chu kỳ
function getStartTime(period) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch(period) {
    case 'today':
      return startOfDay.getTime();
    case 'week':
      return startOfDay.getTime() - (7 * 24 * 60 * 60 * 1000);
    case 'month':
      return startOfDay.getTime() - (30 * 24 * 60 * 60 * 1000);
    case 'all':
      return 0;
    default:
      return startOfDay.getTime();
  }
}

// Hàm lấy dữ liệu từ Firebase thay vì localStorage
async function getOrderDataFromFirebase() {
  try {
    const ordersRef = ref(db, 'orders');
    const snapshot = await get(ordersRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const orders = [];
      for (let date in data) {
        for (let key in data[date]) {
          orders.push({
            id: key,
            ...data[date][key],
            timestamp: data[date][key].timestamp || 0
          });
        }
      }
      return orders;
    }
    return [];
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu:", error);
    return [];
  }
}

// Hàm tính toán thống kê theo món
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

// Hàm render tổng quan
function renderSummary(summary) {
  const summaryContainer = document.getElementById('statistics-summary');
  summaryContainer.innerHTML = `
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

// Hàm render danh sách món ăn
function renderFoodStats(foodStats) {
  const gridContainer = document.getElementById('food-stats-grid');
  
  if (foodStats.length === 0) {
    gridContainer.innerHTML = `
      <div class="no-data">
        <h3>📊 Không có dữ liệu</h3>
        <p>Không có đơn hàng nào trong khoảng thời gian này</p>
      </div>
    `;
    return;
  }
  
  // Sắp xếp theo doanh thu giảm dần
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

// Hàm chính để load thống kê
async function loadStatistics(period) {
  try {
    const orders = await getOrderDataFromFirebase();
    const stats = calculateFoodStats(orders, period);
    
    renderSummary(stats.summary);
    renderFoodStats(stats.foods);
    
    // Cập nhật trạng thái nút active
    updateActiveButton(period);
    
  } catch (error) {
    console.error("Lỗi khi tải thống kê:", error);
    const gridContainer = document.getElementById('food-stats-grid');
    gridContainer.innerHTML = `
      <div class="no-data">
        <h3>❌ Lỗi tải dữ liệu</h3>
        <p>Không thể kết nối đến cơ sở dữ liệu</p>
      </div>
    `;
  }
}

// Hàm cập nhật nút active
function updateActiveButton(period) {
  // Xóa class active khỏi tất cả nút
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Thêm class active vào nút được chọn
  const activeBtn = document.getElementById(`btn-${period}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

// Gán sự kiện click cho các nút
document.addEventListener('DOMContentLoaded', function() {
  // Gán event listener cho mỗi nút filter
  document.getElementById('btn-today').addEventListener('click', () => loadStatistics('today'));
  document.getElementById('btn-week').addEventListener('click', () => loadStatistics('week'));
  document.getElementById('btn-month').addEventListener('click', () => loadStatistics('month'));
  document.getElementById('btn-all').addEventListener('click', () => loadStatistics('all'));
  
  // Tải thống kê mặc định khi load trang
  loadStatistics('today');
});
