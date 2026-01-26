import { db, customerId, showToast } from './firebase-config.js';
import { collection, query, onSnapshot, doc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

console.log("✅ Đang tải menu Tết...");
console.log("📌 Customer ID:", customerId);

// ========== XỬ LÝ CHỌN BÀN ==========
let tableNumber = localStorage.getItem('tableNumber');

if (!tableNumber) {
  document.getElementById('authContainer').style.display = 'flex';
  document.getElementById('mainContent').style.display = 'none';
  
  document.getElementById('startBtn').addEventListener('click', () => {
    const selected = document.getElementById('tableSelect').value;
    if (!selected) {
      showToast('Vui lòng chọn số bàn!', 'warning');
      return;
    }
    localStorage.setItem('tableNumber', selected);
    location.reload();
  });
} else {
  document.getElementById('authContainer').style.display = 'none';
  document.getElementById('mainContent').style.display = 'block';
  
  // Cập nhật thông tin bàn - tương thích với UI mới
  const tableNumEl = document.getElementById('tableNum');
  const customerInfo = document.getElementById('customerInfo');
  
  if (tableNumEl) {
    tableNumEl.textContent = tableNumber;
  }
  
  if (customerInfo) {
    customerInfo.innerHTML = `
      <span class="table-badge">Bàn: ${tableNumber}</span>
      <span style="margin-left: 8px; opacity: 0.8;">ID: ${customerId.slice(0, 6)}...</span>
    `;
  }
  
  loadAllFoods();
}

// ========== TẢI TẤT CẢ MÓN ĂN ==========
function loadAllFoods() {
  const menuContainer = document.getElementById('menuContainer');
  if (!menuContainer) {
    console.error("❌ Không tìm thấy #menuContainer!");
    showToast('Lỗi hiển thị menu!', 'error');
    return;
  }

  console.log("🔄 Đang load từ collection: foodData");
  
  const foodsRef = collection(db, 'foodData');
  const q = query(foodsRef);
  
  onSnapshot(q, (snapshot) => {
    console.log(`✅ Tìm thấy ${snapshot.docs.length} món ăn`);
    
    const foods = [];
    const categories = new Set();
    
    snapshot.docs.forEach(doc => {
      const food = { id: doc.id, ...doc.data() };
      console.log("📄 Món:", food.name);
      foods.push(food);
      if (food.category) categories.add(food.category);
    });
    
    if (foods.length === 0) {
      console.warn("⚠️ Không có món ăn nào!");
      showToast('Chưa có món ăn nào trong menu!', 'warning');
      return;
    }
    
    if (categories.size === 0) {
      categories.add('Món chính');
    }
    
    renderFoodsByCategory(foods, Array.from(categories));
  }, (error) => {
    console.error("❌ Lỗi Firestore:", error);
    showToast('Không thể tải menu: ' + error.message, 'error');
  });
}

// ========== RENDER THEO CATEGORY ==========
function renderFoodsByCategory(foods, categories) {
  const menuContainer = document.getElementById('menuContainer');
  if (!menuContainer) return;
  
  menuContainer.innerHTML = '';
  
  categories.forEach((category, index) => {
    const section = document.createElement('section');
    section.className = 'category';
    section.style.animationDelay = `${index * 0.1}s`;
    
    const title = document.createElement('h2');
    title.className = 'category-title';
    title.textContent = category;
    section.appendChild(title);
    
    const categoryFoods = foods.filter(food => 
      (food.category || 'Món chính') === category
    );
    
    const foodGrid = document.createElement('div');
    foodGrid.className = 'food-grid';
    
    if (categoryFoods.length === 0) {
      foodGrid.innerHTML = '<p style="text-align:center; color:#666; grid-column: 1/-1;">Chưa có món nào.</p>';
    } else {
      foodGrid.innerHTML = categoryFoods.map(food => `
        <div class="food-card" data-id="${food.id}" id="food-${food.id}">
          <div class="food-image">
            <span style="font-size: inherit;">${food.icon || '🍽️'}</span>
          </div>
          <div class="food-info">
            <div class="food-header">
              <h3 class="food-name">${food.name}</h3>
              <div class="food-price">${food.price?.toLocaleString() || '0'}đ</div>
            </div>
            <p class="food-description">${food.description || 'Món ăn hấp dẫn'}</p>
            <div class="food-meta">
              <div class="rating" id="rating-${food.id}">
                <span>★★★★★</span>
                <span class="rating-score">(0)</span>
              </div>
              <button class="add-btn" data-id="${food.id}" onclick="event.stopPropagation(); addToCart('${food.id}')">
                +
              </button>
            </div>
          </div>
        </div>
      `).join('');
    }
    
    section.appendChild(foodGrid);
    menuContainer.appendChild(section);
    
    // Gắn sự kiện cho từng món (click vào card chuyển đến detail)
    categoryFoods.forEach(food => {
      const foodCard = document.getElementById(`food-${food.id}`);
      if (foodCard) {
        foodCard.addEventListener('click', (e) => {
          // Không chuyển trang nếu click vào nút +
          if (e.target.closest('.add-btn')) return;
          location.href = `detail.html?id=${food.id}`;
        });
      }
      loadFoodRating(food.id);
    });
  });
}

// ========== LOAD RATING ==========
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
  const hasHalf = avg % 1 >= 0.5;
  
  let html = '';
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      html += '<span>★</span>';
    } else if (i === fullStars && hasHalf) {
      html += '<span style="position: relative; display: inline-block;">★<span style="position: absolute; left: 0; top: 0; width: 50%; overflow: hidden; color: #ddd;">★</span></span>';
    } else {
      html += '<span style="color: #ddd;">★</span>';
    }
  }
  
  html += `<span class="rating-score">(${count || 0})</span>`;
  container.innerHTML = html;
}

// ========== CẬP NHẬT GIỎ HÀNG (Desktop + Mobile) ==========
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  // Desktop
  const cartCountEl = document.getElementById('cartCount');
  if (cartCountEl) {
    cartCountEl.textContent = count;
    cartCountEl.style.display = count > 0 ? 'flex' : 'none';
  }
  
  // Mobile
  const cartCountMobile = document.getElementById('cartCountMobile');
  if (cartCountMobile) {
    cartCountMobile.textContent = count;
    cartCountMobile.style.display = count > 0 ? 'flex' : 'none';
  }
}

// ========== THÊM VÀO GIỎ (Placeholder) ==========
window.addToCart = function(foodId) {
  // Lấy thông tin món ăn từ DOM hoặc Firebase
  const foodCard = document.getElementById(`food-${foodId}`);
  if (!foodCard) return;
  
  const name = foodCard.querySelector('.food-name')?.textContent || 'Món ăn';
  const priceText = foodCard.querySelector('.food-price')?.textContent || '0';
  const price = parseInt(priceText.replace(/[^\d]/g, ''));
  
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const existingItem = cart.find(item => item.id === foodId);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: foodId,
      name: name,
      price: price,
      quantity: 1
    });
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  showToast(`Đã thêm ${name} vào giỏ!`, 'success');
  
  // Hiệu ứng rung cho nút giỏ hàng
  const cartFloat = document.getElementById('cartFloat');
  if (cartFloat) {
    cartFloat.style.animation = 'none';
    setTimeout(() => {
      cartFloat.style.animation = '';
    }, 10);
  }
};

// ========== HOA RƠI ==========
function createFlowers() {
  const container = document.getElementById('flowerContainer');
  if (!container) return;
  
  const flowers = ['🌸', '🌺', '🌼', '🌻', '🌹', '🌷', '🍀'];
  const maxFlowers = window.innerWidth < 768 ? 15 : 25; // Giảm số hoa trên mobile
  
  setInterval(() => {
    if (container.children.length >= maxFlowers) return;
    
    const flower = document.createElement('div');
    flower.className = 'flower';
    flower.textContent = flowers[Math.floor(Math.random() * flowers.length)];
    flower.style.left = Math.random() * 100 + '%';
    flower.style.animationDuration = (Math.random() * 3 + 5) + 's';
    flower.style.animationDelay = Math.random() * 2 + 's';
    flower.style.fontSize = Math.random() * 10 + 15 + 'px';
    container.appendChild(flower);
    
    setTimeout(() => {
      if (flower.parentNode) {
        flower.remove();
      }
    }, 8000);
  }, 800);
}

// ========== SETUP EVENT LISTENERS ==========
function setupEventListeners() {
  // Desktop cart float
  const cartFloat = document.getElementById('cartFloat');
  if (cartFloat) {
    cartFloat.addEventListener('click', () => {
      location.href = 'cart.html';
    });
  }
  
  // Mobile nav cart button
  const cartBtnMobile = document.getElementById('cartBtnMobile');
  if (cartBtnMobile) {
    cartBtnMobile.addEventListener('click', () => {
      location.href = 'cart.html';
    });
  }
  
  // Mobile nav menu button (scroll to top)
  const menuBtn = document.querySelector('[data-section="menu"]');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Update active state
      document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
      menuBtn.classList.add('active');
    });
  }
  
  // Mobile nav contact button (có thể thay bằng modal hoặc scroll)
  const contactBtn = document.querySelector('[data-section="contact"]');
  if (contactBtn) {
    contactBtn.addEventListener('click', () => {
      showToast('Liên hệ: 1900 xxxx', 'info');
    });
  }
}

// ========== KHỞI TẠO ==========
window.addEventListener('load', () => {
  createFlowers();
  updateCartCount();
  setupEventListeners();
});

// Update cart khi storage thay đổi (nếu mở nhiều tab)
window.addEventListener('storage', (e) => {
  if (e.key === 'cart') {
    updateCartCount();
  }
});
