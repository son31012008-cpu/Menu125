import { db, getCustomerId } from './firebase-config.js';
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

let customerId = null;
let hasRated = false;

// BƯỚC 1: Khởi tạo async
async function init() {
  customerId = await getCustomerId();
  const urlParams = new URLSearchParams(window.location.search);
  const foodId = urlParams.get('id');
  
  if (!foodId) return location.href = 'index.html';
  
  loadFood(foodId);
}

// BƯỚC 2: Load dữ liệu
function loadFood(foodId) {
  const foodRef = doc(db, 'foodData', foodId);
  
  onSnapshot(foodRef, (doc) => {
    if (!doc.exists()) return location.href = 'index.html';
    
    const food = doc.data();
    renderFood(food, foodId);
    setupRating(foodId); // CHUYỂN foodId vào đây
    loadStats(foodId);
    setupCart(food, foodId);
  });
}

// BƯỚC 3: Render HTML
function renderFood(food, foodId) {
  document.getElementById('foodDetail').innerHTML = `
    <h1>${food.name}</h1>
    <p>${food.description}</p>
    <div class="price">${food.price.toLocaleString()}đ</div>
    
    <div class="rating-section">
      <h3>Đánh giá:</h3>
      <div class="stars" id="starRating">
        ${[1,2,3,4,5].map(i => `<span class="star" data-rating="${i}">★</span>`).join('')}
      </div>
      <p id="ratingStatus">Chưa đánh giá</p>
    </div>
    
    <div id="stats"></div>
    
    <div class="order-section">
      <label>Số lượng: </label>
      <input type="number" id="quantity" min="1" value="1">
      <button class="order-btn" id="addToCart">🛒 THÊM VÀO GIỎ</button>
    </div>
  `;
}

// BƯỚC 4: Setup rating (đợi customerId)
async function setupRating(foodId) {
  if (!customerId) return;
  
  const userRatingRef = doc(db, 'foodRatings', foodId, 'userRatings', customerId);
  const foodRatingRef = doc(db, 'foodRatings', foodId);
  
  // Kiểm tra đã đánh giá chưa
  const ratingSnap = await getDoc(userRatingRef);
  if (ratingSnap.exists()) {
    hasRated = true;
    highlightStars(ratingSnap.data().rating);
    document.getElementById('ratingStatus').textContent = `✅ Đã đánh giá: ${ratingSnap.data().rating} sao`;
    document.getElementById('starRating').style.pointerEvents = 'none';
  }
  
  // Load stats
  onSnapshot(foodRatingRef, (doc) => {
    const data = doc.data() || { average: 0, count: 0 };
    document.getElementById('stats').innerHTML = `
      <p>⭐ Trung bình: <strong>${(data.average || 0).toFixed(1)}</strong> / 5.0</p>
      <p>👥 Tổng: <strong>${data.count || 0}</strong> đánh giá</p>
    `;
  });
  
  // Click events
  document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', async () => {
      if (hasRated) return;
      
      const rating = parseInt(star.dataset.rating);
      hasRated = true;
      
      await setDoc(userRatingRef, { rating, timestamp: Date.now() });
      
      const snap = await getDoc(foodRatingRef);
      if (!snap.exists()) {
        await setDoc(foodRatingRef, { total: rating, count: 1, average: rating });
      } else {
        await updateDoc(foodRatingRef, {
          total: increment(rating),
          count: increment(1),
          average: (snap.data().total + rating) / (snap.data().count + 1)
        });
      }
      
      highlightStars(rating);
      document.getElementById('starRating').style.pointerEvents = 'none';
      document.getElementById('ratingStatus').textContent = `✅ Đã đánh giá: ${rating} sao`;
      showToast('🎉 Cảm ơn bạn đã đánh giá!', 'success');
    });
  });
}

// BƯỚC 5: Các hàm còn lại
function highlightStars(rating) {
  document.querySelectorAll('.star').forEach((star, i) => {
    star.classList.toggle('active', i < rating);
  });
}

function setupCart(food, foodId) {
  document.getElementById('addToCart').addEventListener('click', () => {
    const qty = parseInt(document.getElementById('quantity').value) || 1;
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    const existing = cart.find(item => item.id === foodId);
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({ id: foodId, name: food.name, price: food.price, quantity: qty, icon: food.icon });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    showToast(`✅ Đã thêm ${qty}x ${food.name} vào giỏ!`, 'success');
    setTimeout(() => location.href = 'index.html', 1500);
  });
}

function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = `position:fixed;top:20px;right:20px;background:${type==='error'?'#f44336':'#4caf50'};color:white;padding:12px 20px;border-radius:4px;z-index:9999`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// KHỞI CHẠY
init();
