import { db, customerId, doc, getDoc, setDoc, updateDoc, increment, onSnapshot, showToast } from './firebase-config.js';

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

    <div class="rating-section">
      <h3 class="rating-title">🌟 Đánh giá của bạn:</h3>
      <div class="stars-container" id="starRating">
        <span class="star" data-rating="1">★</span>
        <span class="star" data-rating="2">★</span>
        <span class="star" data-rating="3">★</span>
        <span class="star" data-rating="4">★</span>
        <span class="star" data-rating="5">★</span>
      </div>
      <p id="ratingStatus">Chưa đánh giá</p>
    </div>

    <div class="stats-section">
      <h3>📊 Thống kê đánh giá</h3>
      <div class="stats-grid" id="stats"></div>
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
// 3. RENDER SAO ĐÁNH GIÁ
// ============================================
function highlightStars(rating) {
  document.querySelectorAll('.star').forEach((star, i) => {
    star.classList.toggle('active', i < rating);
  });
}

// ============================================
// 4. LOAD THỐNG KÊ ĐÁNH GIÁ
// ============================================
function loadStats(foodRatingRef) {
  onSnapshot(foodRatingRef, (doc) => {
    const data = doc.data() || { average: 0, count: 0 };
    const statsDiv = document.getElementById('stats');
    if (statsDiv) {
      statsDiv.innerHTML = `
        <div class="stat-item">
          <span class="stat-value">${(data.average || 0).toFixed(1)}</span>
          <span class="stat-label">⭐ Trung bình</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${data.count || 0}</span>
          <span class="stat-label">👥 Tổng đánh giá</span>
        </div>
      `;
    }
  });
}

// ============================================
// 5. SETUP CHỨC NĂNG ĐÁNH GIÁ
// ============================================
let hasRated = false;

function setupRating(userRatingRef, foodRatingRef) {
  // Kiểm tra đã đánh giá chưa
  getDoc(userRatingRef).then(docSnap => {
    if (docSnap.exists()) {
      hasRated = true;
      highlightStars(docSnap.data().rating);
      document.getElementById('ratingStatus').textContent = `✅ Đã đánh giá: ${docSnap.data().rating} sao`;
      document.getElementById('starRating').style.pointerEvents = 'none';
    }
  });

  // Setup click và hover
  const stars = document.querySelectorAll('.star');
  const starRating = document.getElementById('starRating');

  stars.forEach(star => {
    // Click để đánh giá
    star.addEventListener('click', async () => {
      if (hasRated) return;

      const rating = parseInt(star.dataset.rating);
      
      try {
        // Lưu rating user
        await setDoc(userRatingRef, {
          rating,
          timestamp: Date.now(),
          customerId
        });

        // Cập nhật stats
        const snap = await getDoc(foodRatingRef);
        if (!snap.exists()) {
          await setDoc(foodRatingRef, {
            total: rating,
            count: 1,
            average: rating
          });
        } else {
          await updateDoc(foodRatingRef, {
            total: increment(rating),
            count: increment(1)
          });
          const data = (await getDoc(foodRatingRef)).data();
          await updateDoc(foodRatingRef, {
            average: data.total / data.count
          });
        }

        hasRated = true;
        highlightStars(rating);
        starRating.style.pointerEvents = 'none';
        document.getElementById('ratingStatus').textContent = `✅ Đã đánh giá: ${rating} sao`;
        showToast('🎉 Cảm ơn bạn đã đánh giá!', 'success');
      } catch (error) {
        console.error("❌ Lỗi đánh giá:", error);
        showToast('Có lỗi khi lưu đánh giá!', 'error');
      }
    });

    // Hover effect
    star.addEventListener('mouseenter', () => {
      if (!hasRated) {
        highlightStars(parseInt(star.dataset.rating));
      }
    });
  });

  // Reset khi rời chuột
  starRating.addEventListener('mouseleave', () => {
    if (!hasRated) {
      highlightStars(0);
    } else {
      const rated = parseInt(document.getElementById('ratingStatus').textContent.match(/\d+/)[0]);
      highlightStars(rated);
    }
  });
}

// ============================================
// 6. SETUP CHỨC NĂNG THÊM VÀO GIỎ
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
// 7. KHỞI TẠO TRANG
// ============================================

// Firebase references
const foodRef = doc(db, 'foodData', foodId);
const userRatingRef = doc(db, 'foodRatings', foodId, 'userRatings', customerId);
const foodRatingRef = doc(db, 'foodRatings', foodId);

// Load dữ liệu món ăn
onSnapshot(foodRef, (doc) => {
  if (!doc.exists()) {
    showToast('Món ăn không tồn tại!', 'error');
    setTimeout(() => location.href = 'index.html', 2000);
    return;
  }

  const food = doc.data();
  renderFoodDetail(food);
  
  // Vì DOM đã render, mới setup các chức năng
  loadStats(foodRatingRef);
  setupRating(userRatingRef, foodRatingRef);
  setupCart(food, foodId);
});
