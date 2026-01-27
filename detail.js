import { db, customerId, doc, getDoc, showToast } from './firebase-config.js';

// ============================================
// 1. LẤY ID MÓN ĂN TỪ URL
// ============================================
const urlParams = new URLSearchParams(window.location.search);
const foodId = urlParams.get('id');

if (!foodId) {
  showToast('Không tìm thấy món ăn!', 'error');
  setTimeout(() => location.href = 'index.html', 1500);
}

// ============================================
// 2. RENDER DỮ LIỆU MÓN ĂN
// ============================================
function renderFoodDetail(food) {
  const container = document.getElementById('foodDetail');
  if (!container) return;

  container.innerHTML = `
    <div class="food-info-section">
      <span class="food-icon">${food.icon || '🍽️'}</span>
      <h1 class="food-detail-name">${food.name}</h1>
      <p class="food-detail-description">${food.description || 'Không có mô tả'}</p>
      <div class="food-detail-price">${(food.price || 0).toLocaleString()}đ</div>
    </div>

    <div class="order-section">
      <h3 class="order-title">🛒 Đặt hàng:</h3>
      <div class="quantity-control">
        <label class="quantity-label">Số lượng:</label>
        <input type="number" id="quantity" min="1" value="1" max="99">
      </div>
      <button class="add-to-cart-btn" id="addToCart">🛒 THÊM VÀO GIỎ HÀNG</button>
    </div>
  `;
}

// ============================================
// 3. SETUP CHỨC NĂNG THÊM VÀO GIỎ
// ============================================
function setupCart(food, foodId) {
  const addBtn = document.getElementById('addToCart');
  if (!addBtn) return;

  addBtn.addEventListener('click', () => {
    const qty = parseInt(document.getElementById('quantity').value) || 1;
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    const existing = cart.find(item => item.id === foodId);
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({
        id: foodId,
        name: food.name,
        price: food.price,
        quantity: qty,
        icon: food.icon || '🍽️'
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    showToast(`✅ Đã thêm ${qty}x ${food.name} vào giỏ!`, 'success');
    
    setTimeout(() => location.href = 'index.html', 1500);
  });
}

// ============================================
// 4. KHỞI TẠO TRANG
// ============================================

// Firebase references
const foodRef = doc(db, 'foodData', foodId);

// Load dữ liệu món ăn
import { onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js ";

onSnapshot(foodRef, (doc) => {
  if (!doc.exists()) {
    showToast('Món ăn không tồn tại!', 'error');
    setTimeout(() => location.href = 'index.html', 2000);
    return;
  }

  const food = doc.data();
  renderFoodDetail(food);
  
  // Setup chức năng giỏ hàng
  setupCart(food, foodId);
});
