import { db, customerId, doc, onSnapshot } from './firebase-config.js';
import { getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

console.log("✅ Đang tải menu Tết...");

// ========== XỬ LÝ CHỌN BÀN ==========
let tableNumber = localStorage.getItem('tableNumber');

if (!tableNumber) {
  document.getElementById('authContainer').style.display = 'flex';
  document.getElementById('mainContent').style.display = 'none';
  
  document.getElementById('startBtn').addEventListener('click', () => {
    const selected = document.getElementById('tableSelect').value;
    if (!selected) {
      showToast('Vui lòng chọn số bàn!', 'error');
      return;
    }
    localStorage.setItem('tableNumber', selected);
    location.reload();
  });
} else {
  document.getElementById('authContainer').style.display = 'none';
  document.getElementById('mainContent').style.display = 'block';
  
  const customerInfo = document.getElementById('customerInfo');
  if (customerInfo) {
    customerInfo.innerHTML = `Bàn: <strong style="color:#FFD700;">${tableNumber}</strong> | ID: ${customerId}`;
  }
  
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

// ========== RENDER THẺ MÓN ĂN - ĐÃ SỬA ĐÚNG ==========
function renderFoodCard(food) {
  const container = document.getElementById('foodGrid');
  const foodId = 'Number1';
  
  container.innerHTML = `
    <div class="food-card" data-id="${foodId}" id="food-${foodId}">
      <div class="food-info">
        <h3 class="food-name">${food.name}</h3>
        <p class="food-description">${food.description}</p>
        <div class="food-price">${food.price.toLocaleString()}đ</div>
        <div id="rating-${foodId}" class="rating-display"></div>
      </div>
    </div>
  `;

  // ✅ ĐỢI 100ms RỒI MỚI GẮN SỰ KIỆN
  setTimeout(() => {
    const foodCard = document.getElementById(`food-${foodId}`);
    if (foodCard) {
      foodCard.addEventListener('click', () => {
        location.href = `detail.html?id=${foodId}`;
      });
    }
  }, 100);

  // Load rating
  const ratingRef = doc(db, 'foodRatings', foodId);
  onSnapshot(ratingRef, (ratingDoc) => {
    const data = ratingDoc.data() || { average: 0, count: 0 };
    renderStars(`rating-${foodId}`, data.average, data.count);
  });
}

// ========== RENDER SAO ==========
function renderStars(containerId, average, count) {
  const container = document.getElementById(containerId);
  const avg = average || 0;
  const fullStars = Math.floor(avg);
  
  let html = '';
  for (let i = 0; i < 5; i++) {
    html += `<span class="star-rating ${i < fullStars ? 'star-100' : 'star-0'}">★</span>`;
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
  if (!container) return;
  
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

// ========== SETUP SỰ KIỆN ==========
function setupEventListeners() {
  // Nút giỏ hàng floating
  const cartFloat = document.getElementById('cartFloat');
  if (cartFloat) {
    cartFloat.addEventListener('click', () => {
      location.href = 'cart.html';
    });
  }
}

// ========== KHỞI TẠO ==========
window.addEventListener('load', () => {
  createFlowers();
  updateCartCount();
  setupEventListeners();
});
