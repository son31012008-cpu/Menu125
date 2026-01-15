import { db, customerId, doc, onSnapshot } from './firebase-config.js';

console.log("✅ Đang tải menu...");

// ========== XỬ LÝ CHỌN BÀN ==========
let tableNumber = localStorage.getItem('tableNumber');

if (!tableNumber) {
  // Chưa chọn bàn
  document.getElementById('authContainer').style.display = 'flex';
  document.getElementById('menuSection').style.display = 'none';
  
  const startBtn = document.getElementById('startBtn');
  const tableSelect = document.getElementById('tableSelect');
  
  if (startBtn && tableSelect) {
    startBtn.addEventListener('click', () => {
      const selected = tableSelect.value;
      if (!selected) {
        alert('Vui lòng chọn số bàn!');
        return;
      }
      tableNumber = selected;
      localStorage.setItem('tableNumber', tableNumber);
      location.reload();
    });
  }
} else {
  // Đã chọn bàn → hiện menu
  document.getElementById('authContainer').style.display = 'none';
  document.getElementById('menuSection').style.display = 'block';
  
  const customerInfo = document.getElementById('customerInfo');
  if (customerInfo) {
    customerInfo.innerHTML = `
      Bàn: <strong style="color: #FFD700;">${tableNumber}</strong> | 
      ID: <span style="font-size: 12px;">${customerId}</span>
    `;
  }
  
  loadMenu();
}

// ========== TẢI MÓN ĂN ==========
function loadMenu() {
  const foodRef = doc(db, 'foodData', 'Number1');
  
  onSnapshot(foodRef, (doc) => {
    if (doc.exists()) {
      const food = doc.data();
      console.log("✅ Món ăn:", food);
      
      if (typeof food.price !== 'number') {
        console.error("❌ Price phải là NUMBER trong Firebase!");
        return;
      }
      
      renderFoodCard(food);
    } else {
      console.error("❌ Không tìm thấy món ăn Number1 trong Firebase!");
    }
  });
}

function renderFoodCard(food) {
  const container = document.getElementById('foodGrid');
  if (!container) {
    console.error("❌ Không tìm thấy foodGrid element!");
    return;
  }
  
  container.innerHTML = `
    <div class="food-card" onclick="location.href='detail.html?id=Number1'">
      <div class="food-info" style="padding: 25px;">
        <h3 class="food-name">${food.name}</h3>
        <p class="food-description">${food.description}</p>
        <div class="food-price">${food.price.toLocaleString()}đ</div>
        <div id="rating-Number1" class="rating-container"></div>
      </div>
    </div>
  `;

  const ratingRef = doc(db, 'foodRatings', 'Number1');
  onSnapshot(ratingRef, (ratingDoc) => {
    const data = ratingDoc.data() || { average: 0, count: 0 };
    renderStars('rating-Number1', data.average, data.count);
  });
}

// ========== RENDER SAO CHÍNH XÁC ==========
function renderStars(containerId, average, count) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error("❌ Không tìm thấy rating container!");
    return;
  }

  const avg = average || 0;
  const fullStars = Math.floor(avg);
  const decimal = avg - fullStars;
  
  let html = '';
  
  // 4 SAO ĐẦY (full)
  for (let i = 0; i < fullStars; i++) {
    html += '<span class="star-rating star-100">★</span>';
  }
  
  // SAO THỨ 5: TÍNH PHẦN TRĂM
  if (fullStars < 5) {
    if (decimal >= 0.8) {
      html += '<span class="star-rating star-80">★</span>'; // 80%
    } else if (decimal >= 0.6) {
      html += '<span class="star-rating star-60">★</span>'; // 60%
    } else if (decimal >= 0.4) {
      html += '<span class="star-rating star-40">★</span>'; // 40%
    } else if (decimal >= 0.2) {
      html += '<span class="star-rating star-20">★</span>'; // 20%
    } else {
      html += '<span class="star-rating star-0">★</span>'; // 0% (rỗng)
    }
  }
  
  // SAO RỖNG CÒN LẠI
  const totalRendered = fullStars + (decimal > 0 ? 1 : 0);
  for (let i = totalRendered; i < 5; i++) {
    html += '<span class="star-rating star-0">★</span>';
  }
  
  html += ` <span style="color: #FFD700; font-size: 14px; margin-left: 8px;">(${count || 0})</span>`;
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

// Hiệu ứng hoa rơi
function createFlowers() {
  const container = document.getElementById('flowerContainer');
  if (!container) return;
  
  const flowers = ['🌸', '🌺', '🌼', '🌻'];
  setInterval(() => {
    const flower = document.createElement('div');
    flower.className = 'flower';
    flower.textContent = flowers[Math.floor(Math.random() * flowers.length)];
    flower.style.left = Math.random() * 100 + '%';
    flower.style.animationDuration = (Math.random() * 3 + 5) + 's';
    container.appendChild(flower);
    setTimeout(() => flower.remove(), 8000);
  }, 500);
}

window.addEventListener('load', () => {
  updateCartCount();
  createFlowers();
});
