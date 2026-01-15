import { db, customerId, doc, onSnapshot } from './firebase-config.js';

// ========== CHỌN BÀN ==========
let tableNumber = localStorage.getItem('tableNumber');

// Nếu chưa chọn bàn, hiển thị form
if (!tableNumber) {
  document.querySelector('.auth-container').style.display = 'flex';
  document.getElementById('startBtn').addEventListener('click', () => {
    const selected = document.getElementById('tableSelect').value;
    if (!selected) {
      alert('Vui lòng chọn số bàn!');
      return;
    }
    tableNumber = selected;
    localStorage.setItem('tableNumber', tableNumber);
    location.reload();
  });
} else {
  // Đã chọn bàn → hiển thị menu
  document.querySelector('.auth-container').style.display = 'none';
  document.getElementById('menuSection').style.display = 'block';
  document.getElementById('customerInfo').innerHTML = `Bàn: <strong>${tableNumber}</strong> | ID: ${customerId}`;
  
  loadMenu();
}

function loadMenu() {
  const foodRef = doc(db, 'foodData', 'Number1');
  
  onSnapshot(foodRef, (doc) => {
    if (doc.exists()) {
      const food = doc.data();
      renderFoodCard(food);
    } else {
      console.error("❌ Không tìm thấy món ăn Number1");
    }
  });
}

function renderFoodCard(food) {
  const container = document.getElementById('foodGrid');
  container.innerHTML = `
    <div class="food-card" onclick="location.href='detail.html?id=Number1'">
      <div class="food-image">${food.icon || '🍜'}</div>
      <div class="food-info">
        <h3 class="food-name">${food.name}</h3>
        <p class="food-description">${food.description}</p>
        <div class="food-price">${food.price.toLocaleString()}đ</div>
        <div class="rating-display" id="rating-Number1">⭐ Đang tải...</div>
      </div>
    </div>
  `;

  // Tải đánh giá realtime
  const ratingRef = doc(db, 'foodRatings', 'Number1');
  onSnapshot(ratingRef, (ratingDoc) => {
    const data = ratingDoc.data() || { average: 0, count: 0 };
    const stars = '⭐'.repeat(Math.round(data.average || 0));
    document.getElementById('rating-Number1').textContent = 
      `${stars} (${data.count} đánh giá)`;
  });
}