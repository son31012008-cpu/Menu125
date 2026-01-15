import { db, customerId, doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from './firebase-config.js';

const urlParams = new URLSearchParams(window.location.search);
const foodId = urlParams.get('id');

if (!foodId) location.href = 'index.html';

const foodRef = doc(db, 'foodData', foodId);
const ratingRef = doc(db, 'foodRatings', foodId);
const userRatingRef = doc(db, 'foodRatings', foodId, 'userRatings', customerId);

// Render món ăn
onSnapshot(foodRef, (doc) => {
  const food = doc.data();
  document.getElementById('foodDetail').innerHTML = `
    <div class="food-detail-image">${food.icon || '🍜'}</div>
    <h1 class="food-detail-name">${food.name}</h1>
    <p>${food.description}</p>
    <div class="food-detail-price">${food.price.toLocaleString()}đ</div>
    
    <div class="rating-section">
      <h3>Đánh giá của bạn:</h3>
      <div class="stars" id="starRating"></div>
      <p id="ratingStatus">Chưa đánh giá</p>
    </div>
    
    <div class="stats" id="stats"></div>
    
    <div class="review-section">
      <h3>Nhận xét:</h3>
      <textarea id="reviewText" placeholder="Viết nhận xét của bạn..."></textarea>
      <button id="submitReview" class="order-btn">GỬI NHẬN XÉT</button>
      <div id="reviewsList"></div>
    </div>
    
    <div class="order-section">
      <label>Số lượng: </label>
      <input type="number" id="quantity" min="1" value="1">
      <button class="order-btn" id="addToCart">🛒 THÊM VÀO GIỎ</button>
    </div>
  `;
  
  loadRating();
  loadReviews();
  setupCartButton(food);
});

// ========== ĐÁNH GIÁ 1 LẦN ==========
function loadRating() {
  getDoc(userRatingRef).then((docSnap) => {
    if (docSnap.exists()) {
      const rating = docSnap.data().rating;
      highlightStars(rating);
      document.getElementById('ratingStatus').textContent = `✅ Đã đánh giá: ${rating} sao`;
      document.getElementById('starRating').style.pointerEvents = 'none';
    } else {
      setupRating();
    }
  });
  
  // Thống kê realtime
  onSnapshot(ratingRef, (doc) => {
    const data = doc.data() || { average: 0, count: 0 };
    const stars = '⭐'.repeat(Math.round(data.average || 0));
    document.getElementById('stats').innerHTML = `
      <p>⭐ Trung bình: <strong>${(data.average || 0).toFixed(1)}</strong> / 5.0</p>
      <p>👥 Tổng: <strong>${data.count || 0}</strong></p>
    `;
  });
}

function setupRating() {
  const stars = document.querySelectorAll('.star');
  stars.forEach(star => {
    star.addEventListener('click', async () => {
      const rating = parseInt(star.dataset.rating);
      
      // Lưu đánh giá cá nhân
      await setDoc(userRatingRef, { 
        rating: rating, 
        timestamp: new Date(),
        tableNumber: localStorage.getItem('tableNumber')
      });
      
      // Cập nhật tổng
      const docSnap = await getDoc(ratingRef);
      if (!docSnap.exists()) {
        await setDoc(ratingRef, { total: rating, count: 1, average: rating });
      } else {
        await updateDoc(ratingRef, {
          total: increment(rating),
          count: increment(1)
        });
        const data = (await getDoc(ratingRef)).data();
        await updateDoc(ratingRef, { average: data.total / data.count });
      }
      
      // Vô hiệu hóa
      document.getElementById('starRating').style.pointerEvents = 'none';
      document.getElementById('ratingStatus').textContent = `✅ Đã đánh giá: ${rating} sao`;
    });
  });
}

function highlightStars(rating) {
  const stars = document.querySelectorAll('.star');
  stars.forEach((star, i) => star.classList.toggle('active', i < rating));
}

// ========== NHẬN XÉT ==========
function loadReviews() {
  const reviewsRef = doc(db, 'foodReviews', foodId);
  onSnapshot(reviewsRef, (doc) => {
    const reviews = doc.data()?.reviews || [];
    const list = document.getElementById('reviewsList');
    list.innerHTML = reviews.map(r => `
      <div class="review-item">
        <strong>${r.customerId}</strong> (${r.tableNumber}): 
        ${'⭐'.repeat(r.rating)} - ${r.text}
      </div>
    `).join('');
  });
  
  document.getElementById('submitReview').addEventListener('click', async () => {
    const text = document.getElementById('reviewText').value.trim();
    if (!text) return alert('Vui lòng nhập nhận xét!');
    
    const reviewData = {
      customerId: customerId,
      tableNumber: localStorage.getItem('tableNumber'),
      rating: (await getDoc(userRatingRef)).data()?.rating || 0,
      text: text,
      timestamp: new Date()
    };
    
    await updateDoc(reviewsRef, {
      reviews: [...(await getDoc(reviewsRef)).data()?.reviews || [], reviewData]
    });
    
    document.getElementById('reviewText').value = '';
    alert('✅ Cảm ơn nhận xét của bạn!');
  });
}

// ========== GIỎ HÀNG ==========
function setupCartButton(food) {
  document.getElementById('addToCart').addEventListener('click', () => {
    const quantity = parseInt(document.getElementById('quantity').value);
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    const existing = cart.find(item => item.id === foodId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        id: foodId,
        name: food.name,
        price: food.price,
        quantity: quantity,
        icon: food.icon
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    alert(`✅ Đã thêm ${quantity} ${food.name} vào giỏ hàng!`);
  });
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cartCount').textContent = count;
}