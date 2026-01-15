import { db, customerId, doc, onSnapshot } from './firebase-config.js';

console.log("✅ Đang tải menu Tết...");

// ========== XỬ LÝ CHỌN BÀN ==========
let tableNumber = localStorage.getItem('tableNumber');

if (!tableNumber) {
  document.getElementById('authContainer').style.display = 'flex';
  document.getElementById('mainContent').style.display = 'none';
  
  document.getElementById('startBtn').addEventListener('click', () => {
    const selected = document.getElementById('tableSelect').value;
    if (!selected) {
      showToast('Vui lòng chọn số bàn!');
      return;
    }
    localStorage.setItem('tableNumber', selected);
    location.reload();
  });
} else {
  document.getElementById('authContainer').style.display = 'none';
  document.getElementById('mainContent').style.display = 'block';
  document.getElementById('customerInfo').innerHTML = 
    `Bàn: <strong style="color:#FFD700;">${tableNumber}</strong> | ID: ${customerId}`;
  
  loadMenu();
}

// ========== TẢI MÓN ĂN TỪ FIREBASE ==========
function loadMenu() {
  const foodRef = doc(db, 'foodData', 'Number1');
  
  onSnapshot(foodRef, (doc) => {
    if (doc.exists()) {
      const food = doc.data();
      if (typeof food.price !== 'number') {
        console.error("❌ Price phải là NUMBER trong Firebase!");
        return;
      }
      renderFoodCard(food);
    } else {
      console.error("❌ Không tìm thấy món ăn!");
    }
  });
}

// ========== RENDER THẺ MÓN ĂN ==========
function renderFoodCard(food) {
  const container = document.getElementById('foodGrid');
  container.innerHTML = `
    <div class="food-card" onclick="location.href='detail.html?id=Number1'">
      <div class="food-info">
        <h3 class="food-name">${food.name}</h3>
        <p class="food-description">${food.description}</p>
        <div class="food-price">${food.price.toLocaleString()}đ</div>
        <div id="rating-Number1" class="rating-display"></div>
      </div>
    </div>
  `;

  // Load đánh giá realtime
  const ratingRef = doc(db, 'foodRatings', 'Number1');
  onSnapshot(ratingRef, (ratingDoc) => {
    const data = ratingDoc.data() || { average: 0, count: 0 };
    renderStars('rating-Number1', data.average, data.count);
  });
}

// ========== RENDER SAO CHÍNH XÁC THEO DỮ LIỆU ==========
function renderStars(containerId, average, count) {
  const container = document.getElementById(containerId);
  const avg = average || 0;
  const fullStars = Math.floor(avg);
  const decimal = avg - fullStars;
  
  let html = '';
  
  // SAO ĐẦY
  for (let i = 0; i < fullStars; i++) {
    html += '<span class="star-rating star-100">★</span>';
  }
  
  // SAO THỨ N: PHẦN TRĂM
  if (fullStars < 5) {
    if (decimal >= 0.8) {
      html += '<span class="star-rating star-80">★</span>';
    } else if (decimal >= 0.6) {
      html += '<span class="star-rating star-60">★</span>';
    } else if (decimal >= 0.4) {
      html += '<span class="star-rating star-40">★</span>';
    } else if (decimal >= 0.2) {
      html += '<span class="star-rating star-20">★</span>';
    } else {
      html += '<span class="star-rating star-0">★</span>';
    }
  }
  
  // SAO RỖNG CÒN LẠI
  const totalRendered = Math.ceil(avg);
  for (let i = totalRendered; i < 5; i++) {
    html += '<span class="star-rating star-0">★</span>';
  }
  
  html += ` <span style="color:#FFD700; font-size:14px; margin-left:8px;">(${count || 0})</span>`;
  container.innerHTML = html;
}

// ========== CẬP NHẬT SỐ LƯỢNG GIỎ HÀNG ==========
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCountElement = document.getElementById('cartCount');
  if (cartCountElement) {
    cartCountElement.textContent = count || 0;
  }
}

// ========== HOẠT ẢNH HOA RƠI ==========
function createFlowers() {
  const container = document.getElementById('flowerContainer');
  const flowers = ['🌸', '🌺', '🌼', '🌻', '🌹', '🌷', '🌵'];
  
  setInterval(() => {
    const flower = document.createElement('div');
    flower.className = 'flower';
    flower.textContent = flowers[Math.floor(Math.random() * flowers.length)];
    flower.style.left = Math.random() * 100 + '%';
    flower.style.animationDuration = (Math.random() * 3 + 5) + 's';
    flower.style.animationDelay = Math.random() * 2 + 's';
    container.appendChild(flower);
    
    setTimeout(() => {
      if (flower.parentNode) {
        flower.remove();
      }
    }, (parseFloat(flower.style.animationDuration) + parseFloat(flower.style.animationDelay)) * 1000);
  }, 500);
}

// Khởi tạo khi load trang
window.addEventListener('load', () => {
  createFlowers();
  updateCartCount();
});

