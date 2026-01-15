import { db, customerId, doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from './firebase-config.js';

const urlParams = new URLSearchParams(window.location.search);
const foodId = urlParams.get('id');

if (!foodId) location.href = 'index.html';

const foodRef = doc(db, 'foodData', foodId);

onSnapshot(foodRef, (doc) => {
  const food = doc.data();
  
  document.getElementById('foodDetail').innerHTML = `
    <h1 class="food-detail-name" style="font-size: 36px; color: #8B0000; margin-bottom: 20px;">${food.name}</h1>
    <p style="font-size: 18px; margin-bottom: 15px;">${food.description}</p>
    <div class="food-detail-price" style="font-size: 28px; color: #FF6347; font-weight: bold; margin-bottom: 30px;">${food.price.toLocaleString()}đ</div>
    
    <div class="rating-section">
      <h3>Đánh giá của bạn:</h3>
      <div class="stars" id="starRating">
        <span class="star" data-rating="1">★</span>
        <span class="star" data-rating="2">★</span>
        <span class="star" data-rating="3">★</span>
        <span class="star" data-rating="4">★</span>
        <span class="star" data-rating="5">★</span>
      </div>
      <p id="ratingStatus">Chưa đánh giá</p>
    </div>
    
    <div class="stats" id="stats"></div>
    
    <div class="order-section">
      <label>Số lượng: </label>
      <input type="number" id="quantity" min="1" value="1" style="width: 60px;">
      <button class="order-btn" id="addToCart">🛒 THÊM VÀO GIỎ</button>
    </div>
  `;
  
  setupRating();
  loadStats();
  setupCart(food);
});

let hasRated = false;
const userRatingRef = doc(db, 'foodRatings', foodId, 'userRatings', customerId);
const foodRatingRef = doc(db, 'foodRatings', foodId);

function setupRating() {
  getDoc(userRatingRef).then(docSnap => {
    if (docSnap.exists()) {
      hasRated = true;
      highlightStars(docSnap.data().rating);
      document.getElementById('ratingStatus').textContent = `✅ Đã đánh giá: ${docSnap.data().rating} sao`;
      document.getElementById('starRating').style.pointerEvents = 'none';
    } else {
      document.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', async () => {
          if (hasRated) return;
          const rating = parseInt(star.dataset.rating);
          hasRated = true;
          
          await setDoc(userRatingRef, { rating, timestamp: new Date() });
          
          const snap = await getDoc(foodRatingRef);
          if (!snap.exists()) {
            await setDoc(foodRatingRef, { total: rating, count: 1, average: rating });
          } else {
            await updateDoc(foodRatingRef, {
              total: increment(rating),
              count: increment(1)
            });
            const data = (await getDoc(foodRatingRef)).data();
            await updateDoc(foodRatingRef, { average: data.total / data.count });
          }
          
          document.getElementById('starRating').style.pointerEvents = 'none';
          document.getElementById('ratingStatus').textContent = `✅ Đã đánh giá: ${rating} sao`;
        });
      });
    }
  });
}

function highlightStars(rating) {
  document.querySelectorAll('.star').forEach((star, i) => {
    star.classList.toggle('active', i < rating);
  });
}

function loadStats() {
  onSnapshot(foodRatingRef, doc => {
    const data = doc.data() || { average: 0, count: 0 };
    const stars = '⭐'.repeat(Math.round(data.average || 0));
    document.getElementById('stats').innerHTML = `
      <p>⭐ Trung bình: <strong>${(data.average || 0).toFixed(1)}</strong> / 5.0</p>
      <p>👥 Tổng: <strong>${data.count || 0}</strong> đánh giá</p>
    `;
  });
}

function setupCart(food) {
  document.getElementById('addToCart').addEventListener('click', () => {
    const qty = parseInt(document.getElementById('quantity').value);
    alert(`🛒 Thêm ${qty} ${food.name} vào giỏ hàng!\n\nKhách: ${customerId}`);
    // TODO: Lưu vào localStorage
  });
}
