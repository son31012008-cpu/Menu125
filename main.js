import { db, customerId, doc, onSnapshot } from './firebase-config.js';

console.log("✅ Đang tải món Number1 (không icon)");

// Hiển thị ID
document.getElementById('customerId').textContent = `ID: ${customerId}`;

// Tải dữ liệu món ăn
const foodRef = doc(db, 'foodData', 'Number1');

onSnapshot(foodRef, (doc) => {
  if (doc.exists()) {
    const food = doc.data();
    // Kiểm tra price là number
    if (typeof food.price !== 'number') {
      console.error("❌ Price phải là NUMBER!");
      return;
    }
    renderFoodCard(food);
  } else {
    console.error("❌ Không tìm thấy món ăn!");
  }
});

function renderFoodCard(food) {
  const container = document.getElementById('foodGrid');
  container.innerHTML = `
    <div class="food-card" onclick="location.href='detail.html?id=Number1'">
      <div class="food-info" style="padding: 20px;">
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

// Hiệu ứng hoa rơi
function createFlowers() {
  const container = document.getElementById('flowerContainer');
  const flowers = ['🌸', '🌺', '🌼', '🌻'];
  setInterval(() => {
    const flower = document.createElement('div');
    flower.className = 'food';
    flower.textContent = flowers[Math.floor(Math.random() * flowers.length)];
    flower.style.left = Math.random() * 100 + '%';
    flower.style.animationDuration = (Math.random() * 3 + 5) + 's';
    container.appendChild(flower);
    setTimeout(() => flower.remove(), 8000);
  }, 500);
}

window.addEventListener('load', () => {
  createFlowers();
});
