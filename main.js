import { db, customerId, doc, onSnapshot } from './firebase-config.js';

console.log("✅ Đang tải món từ foodData...");

// Hiển thị ID
document.getElementById('customerId').textContent = `ID: ${customerId}`;

// Tải món ăn từ Firebase
const foodRef = doc(db, 'foodData', 'Number1');

onSnapshot(foodRef, (doc) => {
  if (doc.exists()) {
    const food = doc.data();
    console.log("✅ Dữ liệu:", food);
    
    if (typeof food.price !== 'number') {
      console.error("❌ Price phải là NUMBER, không phải string!");
      return;
    }
    
    renderFoodCard(food);
  } else {
    console.error("❌ Không tìm thấy document Number1 trong collection foodData!");
  }
});

function renderFoodCard(food) {
  const container = document.getElementById('foodGrid');
  container.innerHTML = `
    <div class="food-card" onclick="location.href='detail.html?id=Number1'">
      <div class="food-info" style="padding: 25px;">
        <h3 class="food-name">${food.name}</h3>
        <p class="food-description">${food.description}</p>
        <div class="food-price">${food.price.toLocaleString()}đ</div>
        <div id="rating-Number1" class="rating-container"></div>
      </div>
    </div>
  `;

  // Tải đánh giá realtime với hiển thị chính xác
  const ratingRef = doc(db, 'foodRatings', 'Number1');
  onSnapshot(ratingRef, (ratingDoc) => {
    const data = ratingDoc.data() || { average: 0, count: 0 };
    console.log("⭐ Đánh giá:", data.average, "sao từ", data.count, "lượt");
    renderStars('rating-Number1', data.average, data.count);
  });
}

// ========== HÀM RENDER SAO CHÍNH XÁC ==========
function renderStars(containerId, average, count) {
  const container = document.getElementById(containerId);
  const avg = average || 0;
  const fullStars = Math.floor(avg);
  const decimal = avg - fullStars;
  
  let html = '';
  
  // 4 SAO ĐẦY
  for (let i = 0; i < fullStars; i++) {
    html += '<span class="star-rating star-100">★</span>';
  }
  
  // SAO THỨ 5: TÍNH PHẦN TRĂM
  if (fullStars < 5) {
    if (decimal >= 0.8) {
      html += '<span class="star-rating star-80">★</span>';
    } else if (decimal >= 0.6) {
      html += '<span class="star-rating star-60">★</span>';
    } else if (decimal >= 0.4) {
      html += '<span class="star-rating star-40">★</span>';
    } else if (decimal >= 0.2) {
      html += '<span class="star-rating star-20">★</span>';
    } else {
      html += '<span class="star-rating star-0">★</span>';
    }
  }
  
  // SAO RỖNG CÒN LẠI
  const totalRendered = Math.ceil(avg);
  for (let i = totalRendered; i < 5; i++) {
    html += '<span class="star-rating star-0">★</span>';
  }
  
  html += ` <span style="color: #FFD700; font-size: 14px; margin-left: 8px;">(${count})</span>`;
  container.innerHTML = html;
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
