import { db, customerId, doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from './firebase-config.js';

const urlParams = new URLSearchParams(window.location.search);
const foodId = urlParams.get('id');

if (!foodId) location.href = 'index.html';

const foodRef = doc(db, 'foodData', foodId);

onSnapshot(foodRef, (doc) => {
  const food = doc.data();
  
  document.getElementById('foodDetail').innerHTML = `
    <div class="food-info-section">
      <div class="food-icon">${food.icon || '🍜'}</div>
      <h1 class="food-detail-name">${food.name}</h1>
      <p class="food-detail-description">${food.description}</p>
      <div class="food-detail-price">${food.price.toLocaleString()}đ</div>
    </div>
    
    <div class="rating-section">
      <h3 class="rating-title">Đánh giá của bạn</h3>
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
      <h3>Thống kê đánh giá</h3>
      <div class="stats-grid" id="stats"></div>
    </div>
    
    <div class="order-section">
      <h3 class="order-title">Đặt món</h3>
      <div class="quantity-control">
        <span class="quantity-label">Số lượng:</span>
        <input type="number" id="quantity" min="1" value="1">
      </div>
      <button class="add-to-cart-btn" id="addToCart">
        <span>🛒</span>
        THÊM VÀO GIỎ HÀNG
      </button>
    </div>
  `;
  
  setupRating();
  loadStats();
  setupCart(food);
});

let hasRated = false;
const userRatingRef = doc(db, 'foodRatings', foodId, 'userRatings', customerId);
const foodRatingRef = doc(db, 'foodRatings', foodId);

// Hiệu ứng hover sao
document.addEventListener('mouseover', (e) => {
  if (e.target.classList.contains('star')) {
    const rating = parseInt(e.target.dataset.rating);
    highlightStarsTemp(rating);
  }
});

document.addEventListener('mouseout', (e) => {
  if (e.target.classList.contains('star')) {
    if (!hasRated) {
      document.querySelectorAll('.star').forEach(star => star.classList.remove('active'));
    } else {
      getDoc(userRatingRef).then(doc => {
        if (doc.exists()) highlightStars(doc.data().rating);
      });
    }
  }
});

function highlightStarsTemp(rating) {
  document.querySelectorAll('.star').forEach((star, i) => {
    star.classList.toggle('active', i < rating);
  });
}

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
          showToast('🎉 Cảm ơn bạn đã đánh giá!');
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
    document.getElementById('stats').innerHTML = `
      <div class="stat-item">
        <div class="stat-value">${(data.average || 0).toFixed(1)}</div>
        <div class="stat-label">Điểm trung bình</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.count || 0}</div>
        <div class="stat-label">Số lượt đánh giá</div>
      </div>
    `;
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
    showToast(`✅ Đã thêm ${qty} ${food.name} vào giỏ hàng!`);
    location.href = 'index.html'; // Quay lại index
  });
}

// Hiệu ứng hoa rơi
function createFlowers() {
  const container = document.getElementById('flowerContainer');
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

createFlowers();

