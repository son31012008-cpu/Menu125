import { db, customerId, doc, onSnapshot } from './firebase-config.js';

console.log("✅ Đang tải món từ foodData...");

// Hiển thị ID
document.getElementById('customerId').textContent = `ID: ${customerId}`;

// Chờ Firebase tải xong
setTimeout(() => {
  const foodRef = doc(db, 'foodData', 'Number1');
  
  onSnapshot(foodRef, (doc) => {
    console.log("📡 Firebase response:", doc.exists, doc.data());
    
    if (doc.exists()) {
      const food = doc.data();
      console.log("✅ Dữ liệu món ăn:", food);
      
      // Kiểm tra kiểu dữ liệu
      if (typeof food.price !== 'number') {
        console.error("❌ Price phải là NUMBER trong Firebase!");
        return;
      }
      
      renderFoodCard(food);
    } else {
      console.error("❌ Không tìm thấy document Number1 trong collection foodData!");
      document.getElementById('foodGrid').innerHTML = 
        `<p style="color:white; text-align:center; font-size:20px;">
          Chưa có dữ liệu món ăn.<br>
          Vui lòng tạo collection <strong>foodData</strong> → document <strong>Number1</strong>
        </p>`;
    }
  });
}, 1000); // Delay 1s để Firebase kết nối

function renderFoodCard(food) {
  const container = document.getElementById('foodGrid');
  container.innerHTML = `
    <div class="food-card" onclick="location.href='detail.html?id=Number1'">
      <div class="food-info" style="padding: 25px;">
        <h3 class="food-name" style="font-size: 26px;">${food.name}</h3>
        <p class="food-description" style="font-size: 16px; margin: 10px 0;">${food.description}</p>
        <div class="food-price" style="font-size: 22px; font-weight: bold; color: #FF6347;">
          ${food.price.toLocaleString()}đ
        </div>
        <div class="rating-display" id="rating-Number1" style="margin-top: 15px; font-size: 18px;">
          ⭐ Đang tải đánh giá...
        </div>
      </div>
    </div>
  `;

  // Load đánh giá
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
    flower.className = 'flower';
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
