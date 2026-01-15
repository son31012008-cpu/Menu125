import { db, customerId, doc, getDoc, setDoc, updateDoc, increment, onSnapshot, showToast } from './firebase-config.js';

const urlParams = new URLSearchParams(window.location.search);
const foodId = urlParams.get('id');

if (!foodId) location.href = 'index.html';

const foodRef = doc(db, 'foodData', foodId);

onSnapshot(foodRef, (doc) => {
  const food = doc.data();
  
  document.getElementById('foodDetail').innerHTML = `
    <h1 class="food-detail-name">${food.name}</h1>
    <p>${food.description}</p>
    <div class="food-detail-price">${food.price.toLocaleString()}đ</div>
    
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
    
    <div id="stats"></div>
    
    <div class="order-section">
      <label>Số lượng: </label>
      <input type="number" id="quantity" min="1" value="1">
      <button class="order-btn" id="addToCart">🛒 THÊM VÀO GIỎ</button>
    </div>
  `;  // ✅ CHỈ CÓ DẤU ; - KHÔNG CÓ )
  
  setupRating();
  loadStats();
  setupCart(food);
});

let hasRated = false;
const userRatingRef = doc(db, 'foodRatings', foodId, 'userRatings', customerId);
const foodRatingRef = doc(db, 'foodRatings', foodId);

// Setup rating
getDoc(userRatingRef).then(docSnap => {
  if (docSnap.exists()) {
    hasRated = true;
    highlightStars(docSnap.data().rating);
    document.getElementById('ratingStatus').textContent = `✅ Đã đánh giá: ${docSnap.data().rating} sao`;
    document.getElementById('starRating').style.pointerEvents = 'none';
  } else {
    setupRating();
  }
  
  onSnapshot(foodRatingRef, doc => {
    const data = doc.data() || { average: 0, count: 0 };
    document.getElementById('stats').innerHTML = `
      <p>⭐ Trung bình: <strong>${(data.average || 0).toFixed(1)}</strong> / 5.0</p>
      <p>👥 Tổng: <strong>${data.count || 0}</strong> đánh giá</p>
    `;
  });
});

function setupRating() {
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
      showToast('🎉 Cảm ơn bạn đã đánh giá!', 'success');
    });
  });
}

function highlightStars(rating) {
  document.querySelectorAll('.star').forEach((star, i) => {
    star.classList.toggle('active', i < rating);
  });
}

function setupCart(food) {
  document.getElementById('addToCart').addEventListener('click', async () => {
    const qty = parseInt(document.getElementById('quantity').value);
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
        icon: food.icon
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    showToast(`✅ Đã thêm ${qty} ${food.name} vào giỏ hàng!`, 'success');
    
    // QUAY LẠI INDEX
    setTimeout(() => location.href = 'index.html', 1500);
  });
}
