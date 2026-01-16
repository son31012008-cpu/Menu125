import { db, customerId, showToast } from './firebase-config.js';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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
  
  const customerInfo = document.getElementById('customerInfo');
  if (customerInfo) {
    customerInfo.innerHTML = `Bàn: <strong style="color:#FFD700;">${tableNumber}</strong> | ID: ${customerId}`;
  }
  
  loadAllFoods(); // SỬA: Tải tất cả món thay vì 1 món
}

// ========== TẢI TẤT CẢ MÓN ĂN TỪ FIREBASE ==========
function loadAllFoods() {
  const foodsRef = collection(db, 'foodData'); // SỬA: Lấy collection thay vì doc
  
  // Query để lấy món có sẵn (nếu có field 'available')
  const q = query(foodsRef, where('available', '==', true));
  
  onSnapshot(q, (snapshot) => {
    const foods = [];
    const categories = new Set();
    
    // Lấy tất cả món và danh mục
    snapshot.docs.forEach(doc => {
      const food = { id: doc.id, ...doc.data() };
      foods.push(food);
      if (food.category) categories.add(food.category);
    });
    
    // Nếu không có category, dùng category mặc định
    if (categories.size === 0) {
      categories.add('Món chính');
    }
    
    // Render theo từng category
    renderFoodsByCategory(foods, Array.from(categories));
  }, (error) => {
    console.error("❌ Lỗi load món ăn:", error);
    showToast('Không thể tải menu!');
  });
}

// ========== RENDER THEO CATEGORY ==========
function renderFoodsByCategory(foods, categories) {
  const menuContainer = document.querySelector('.menu-container');
  menuContainer.innerHTML = ''; // Xóa nội dung cũ
  
  // Render từng category
  categories.forEach(category => {
    // Tạo section cho category
    const section = document.createElement('section');
    section.className = 'category';
    
    // Tạo title
    const title = document.createElement('h2');
    title.className = 'category-title';
    title.textContent = category;
    section.appendChild(title);
    
    // Filter món ăn theo category
    const categoryFoods = foods.filter(food => 
      (food.category || 'Món chính') === category
    );
    
    // Tạo food grid
    const foodGrid = document.createElement('div');
    foodGrid.className = 'food-grid';
    
    // Render tất cả món trong category
    foodGrid.innerHTML = categoryFoods.map(food => `
      <div class="food-card" data-id="${food.id}" id="food-${food.id}">
        <div class="food-info">
          <h3 class="food-name">${food.icon || '🍽️'} ${food.name}</h3>
          <p class="food-description">${food.description || 'Món ăn hấp dẫn'}</p>
          <div class="food-price">${food.price.toLocaleString()}đ</div>
          <div id="rating-${food.id}" class="rating-display"></div>
        </div>
      </div>
    `).join('');
    
    section.appendChild(foodGrid);
    menuContainer.appendChild(section);
    
    // Gắn sự kiện click cho mỗi món
    categoryFoods.forEach(food => {
      setTimeout(() => {
        const foodCard = document.getElementById(`food-${food.id}`);
        if (foodCard) {
          foodCard.addEventListener('click', () => {
            location.href = `detail.html?id=${food.id}`;
          });
        }
      }, 100);
      
      // Load rating cho mỗi món
      loadFoodRating(food.id);
    });
  });
}

// ========== LOAD RATING CHO TỪNG MÓN ==========
function loadFoodRating(foodId) {
  const ratingRef = doc(db, 'foodRatings', foodId);
  onSnapshot(ratingRef, (ratingDoc) => {
    const data = ratingDoc.data() || { average: 0, count: 0 };
    renderStars(`rating-${foodId}`, data.average, data.count);
  });
}

// ========== RENDER SAO ==========
function renderStars(containerId, average, count) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
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
