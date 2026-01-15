import { db, customerId, doc, onSnapshot } from './firebase-config.js';

console.log("✅ Đang tải dữ liệu từ Firebase...");

// Hiển thị ID
document.getElementById('customerId').textContent = `ID: ${customerId}`;

// Tải món ăn từ Firebase
const foodRef = doc(db, 'foodData', 'Number1');

onSnapshot(foodRef, (doc) => {
  if (doc.exists()) {
    const food = doc.data();
    renderFoodCard(food);
  } else {
    console.error("❌ Không tìm thấy món ăn!");
  }
});

function renderFoodCard(food) {
  const container = document.getElementById('foodGrid');
  container.innerHTML = `
    <div class="food-card" onclick="location.href='detail.html?id=Number1'">
      <div class="food-image">${food.icon}</div>
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

// Hiệu ứng hoa rơi (giữ nguyên code cũ)
function createFlowers() { /* ... */ }
createFlowers();
