import { 
  db, customerId, doc, setDoc, updateDoc, increment, showToast,
  getDoc, collection, query, where, getDocs
} from './firebase-config.js';

// ============================================
// KHAI BÁO BIẾN
// ============================================
let cart = [];
let totalAmount = 0;

// ============================================
// KHỞI TẠO TRANG
// ============================================
async function initCart() {
  cart = JSON.parse(localStorage.getItem('cart') || '[]');
  
  console.log("🛒 Giỏ hàng ban đầu:", JSON.stringify(cart, null, 2));
  
  displayCustomerInfo();
  
  // Đồng bộ với Firebase để lấy imageURL mới nhất
  if (cart.length > 0) {
    await syncCartWithFirebase();
    toggleCartView();
    renderCart();
    calculateTotal();
    setupEventListeners();
  } else {
    toggleCartView();
  }
}

// ============================================
// ĐỒNG BỘ GIỎ HÀNG VỚI FIREBASE
// ============================================
async function syncCartWithFirebase() {
  try {
    console.log("🔄 Đang đồng bộ với Firebase...");
    
    // Lấy thông tin mới nhất từ Firebase cho từng món trong giỏ
    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      
      if (!item.id) {
        console.warn(`⚠️ Món ${item.name} không có ID, bỏ qua`);
        continue;
      }
      
      try {
        const foodRef = doc(db, 'foodData', item.id);
        const foodSnap = await getDoc(foodRef);
        
        if (foodSnap.exists()) {
          const freshData = foodSnap.data();
          console.log(`✅ Firebase trả về cho ${item.id}:`, freshData);
          
          // Cập nhật item - QUAN TRỌNG: Lấy imageURL từ Firebase
          cart[i] = {
            ...item,
            name: freshData.name || item.name,
            price: freshData.price || item.price,
            imageURL: freshData.imageURL || '', // Lấy ảnh từ Firebase
            category: freshData.category || item.category,
            icon: freshData.icon || '🍽️'
          };
          
          console.log(`🖼️ Đã cập nhật imageURL cho ${cart[i].name}: "${cart[i].imageURL}"`);
        } else {
          console.warn(`⚠️ Không tìm thấy món ${item.id} trong Firebase`);
        }
      } catch (err) {
        console.error(`❌ Lỗi fetch món ${item.id}:`, err);
      }
    }
    
    // Lưu lại giỏ hàng đã cập nhật
    localStorage.setItem('cart', JSON.stringify(cart));
    console.log("💾 Giỏ hàng sau khi cập nhật:", cart);
    
  } catch (error) {
    console.error("❌ Lỗi đồng bộ Firebase:", error);
  }
}

// ============================================
// HIỂN THỊ THÔNG TIN KHÁCH & BÀN
// ============================================
function displayCustomerInfo() {
  const customerEl = document.getElementById('customerIdCart');
  const tableEl = document.getElementById('tableNumber');
  
  if (customerEl) {
    customerEl.textContent = customerId || 'Khách';
  }
  
  const tableNumber = localStorage.getItem('tableNumber') || 'Chưa chọn bàn';
  if (tableEl) {
    tableEl.textContent = `Bàn: ${tableNumber}`;
  }
}

// ============================================
// CHUYỂN ĐỔI GIỮA GIỎ TRỐNG & CÓ MÓN
// ============================================
function toggleCartView() {
  const emptyCart = document.getElementById('emptyCart');
  const cartItemsSection = document.getElementById('cartItemsSection');
  
  if (cart.length === 0) {
    emptyCart?.classList.add('show');
    cartItemsSection?.classList.remove('show');
  } else {
    emptyCart?.classList.remove('show');
    cartItemsSection?.classList.add('show');
  }
}

// ============================================
// RENDER DANH SÁCH MÓN ĂN - ĐÃ FIX LỖI ẢNH
// ============================================
function renderCart() {
  const cartItemsList = document.getElementById('cartItemsList');
  if (!cartItemsList) {
    console.error("❌ Không tìm thấy #cartItemsList");
    return;
  }
  
  console.log("🎨 Bắt đầu render giỏ hàng...");
  
  cartItemsList.innerHTML = cart.map((item, index) => {
    // Lấy đường dẫn ảnh - Ưu tiên imageURL từ Firebase
    const imageUrl = item.imageURL || '';
    const hasImage = imageUrl && imageUrl.trim() !== '';
    
    console.log(`📝 Render item ${index}: ${item.name}, imageURL="${imageUrl}", hasImage=${hasImage}`);
    
    // Tạo HTML cho ảnh hoặc icon
    let imageHtml;
    if (hasImage) {
      // Có ảnh - dùng thẻ img với đường dẫn từ Firebase
      imageHtml = `<img src="${imageUrl}" 
                       alt="${item.name}" 
                       style="width:100%; height:100%; object-fit:cover; display:block;" 
                       onerror="this.style.display='none'; 
                                this.parentElement.innerHTML='<span style=font-size:40px;>${item.icon || '🍽️'}</span>';">`;
    } else {
      // Không có ảnh - dùng icon
      imageHtml = `<span style="font-size: 40px;">${item.icon || '🍽️'}</span>`;
    }
    
    return `
    <div class="cart-item-card" data-id="${item.id || item.name}">
      <div class="item-image-wrapper" style="width: 80px; height: 80px; border-radius: 12px; overflow: hidden; background: linear-gradient(135deg, #f5f5f5, #e0e0e0); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        ${imageHtml}
      </div>
      
      <div class="item-details" style="flex: 1; margin-left: 12px; min-width: 0;">
        <h3 style="margin: 0 0 4px 0; color: #8B0000; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</h3>
        <p style="margin: 0; color: #666; font-size: 13px;">${item.category === 'topping' ? '➕ Topping' : '🍽️ Món chính'}</p>
        <p style="margin: 4px 0 0 0; color: #FF6347; font-size: 14px; font-weight: bold;">${(item.price || 0).toLocaleString('vi-VN')}đ / phần</p>
      </div>
      
      <div class="quantity-controls" style="display: flex; align-items: center; gap: 8px; margin: 0 12px;">
        <button class="qty-btn minus" data-index="${index}" aria-label="Giảm số lượng" style="width: 32px; height: 32px; border: none; background: #f0f0f0; border-radius: 50%; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center;">−</button>
        <input type="number" value="${item.quantity}" min="1" readonly style="width: 40px; text-align: center; border: none; background: transparent; font-weight: bold; font-size: 16px;">
        <button class="qty-btn plus" data-index="${index}" aria-label="Tăng số lượng" style="width: 32px; height: 32px; border: none; background: linear-gradient(135deg, #FFD700, #FF6347); color: white; border-radius: 50%; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center;">+</button>
      </div>
      
      <div class="item-total-price" style="font-weight: bold; color: #8B0000; font-size: 16px; min-width: 100px; text-align: right;">
        ${((item.price || 0) * item.quantity).toLocaleString('vi-VN')}đ
      </div>
      
      <button class="remove-item-btn" data-index="${index}" aria-label="Xóa món" style="width: 36px; height: 36px; border: none; background: #ffebee; color: #f44336; border-radius: 50%; cursor: pointer; margin-left: 12px; font-size: 18px; display: flex; align-items: center; justify-content: center;">
        ✕
      </button>
    </div>
  `}).join('');
  
  console.log("✅ Đã render xong, gắn sự kiện...");
  attachCartItemEvents();
}

// ============================================
// GẮN SỰ KIỆN CHO CÁC NÚT TRONG GIỎ
// ============================================
function attachCartItemEvents() {
  document.querySelectorAll('.qty-btn.minus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      changeQuantity(index, -1);
    });
  });
  
  document.querySelectorAll('.qty-btn.plus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      changeQuantity(index, 1);
    });
  });
  
  document.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      removeFromCart(index);
    });
  });
}

// ============================================
// THAY ĐỔI SỐ LƯỢNG MÓN
// ============================================
function changeQuantity(index, change) {
  if (index < 0 || index >= cart.length) return;
  
  cart[index].quantity += change;
  if (cart[index].quantity < 1) {
    cart[index].quantity = 1;
  }
  
  saveCart();
  renderCart();
  calculateTotal();
}

// ============================================
// XÓA MÓN KHỎI GIỎ
// ============================================
function removeFromCart(index) {
  if (index < 0 || index >= cart.length) return;
  
  const removedItem = cart[index];
  cart.splice(index, 1);
  
  saveCart();
  toggleCartView();
  
  if (cart.length > 0) {
    renderCart();
    calculateTotal();
  }
  
  showToast(`❌ Đã xóa ${removedItem.name}`, 'info');
}

// ============================================
// LƯU GIỎ HÀNG XUỐNG LOCALSTORAGE
// ============================================
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  console.log("💾 Đã lưu giỏ hàng:", cart);
}

// ============================================
// TÍNH TỔNG TIỀN
// ============================================
function calculateTotal() {
  totalAmount = cart.reduce((sum, item) => {
    return sum + ((item.price || 0) * (item.quantity || 0));
  }, 0);
  
  const totalEl = document.getElementById('totalAmount');
  if (totalEl) {
    totalEl.textContent = `${totalAmount.toLocaleString('vi-VN')}đ`;
  }
}

// ============================================
// GỬI ĐƠN LÊN FIREBASE
// ============================================
async function sendOrderToFirebase(orderData) {
  try {
    const cleanTableNumber = orderData.tableNumber.replace(/\D/g, '') || '0';
    const orderId = `order_${cleanTableNumber}_${Date.now()}`;
    
    const orderRef = doc(db, 'orders', orderId);
    
    await setDoc(orderRef, {
      ...orderData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      orderNumber: Date.now().toString().slice(-6),
      timestamp: Date.now()
    });
    
    // Cập nhật thống kê
    const today = new Date().toISOString().split('T')[0];
    const statsRef = doc(db, 'stats', today);
    const statsSnap = await getDoc(statsRef);
    
    if (statsSnap.exists()) {
      await updateDoc(statsRef, {
        totalOrders: increment(1),
        totalRevenue: increment(orderData.totalAmount)
      });
    } else {
      await setDoc(statsRef, {
        totalOrders: 1,
        totalRevenue: orderData.totalAmount,
        date: today
      });
    }
    
    return orderId;
  } catch (error) {
    console.error("❌ Lỗi gửi đơn:", error);
    throw error;
  }
}

// ============================================
// HIỂN THỊ MODAL XÁC NHẬN
// ============================================
function showConfirmModal() {
  const tableNumber = localStorage.getItem('tableNumber') || 'Chưa chọn bàn';
  
  const orderReviewEl = document.getElementById('orderReviewContent');
  if (orderReviewEl) {
    orderReviewEl.innerHTML = `
      <div style="margin-bottom: 15px;">
        <strong>📍 Bàn:</strong> ${tableNumber}<br>
        <strong>👤 Khách:</strong> ${customerId}<br>
        <strong>📝 Số món:</strong> ${cart.length}<br>
        <strong>💰 Tổng cộng:</strong> ${totalAmount.toLocaleString('vi-VN')}đ
      </div>
      <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
      <div class="order-items-list">
        ${cart.map(item => `
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span>${item.name} x${item.quantity}</span>
            <span>${((item.price || 0) * item.quantity).toLocaleString('vi-VN')}đ</span>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  const modal = document.getElementById('confirmModal');
  modal?.classList.add('show');
  modal?.setAttribute('aria-hidden', 'false');
}

// ============================================
// ĐÓNG MODAL
// ============================================
function closeConfirmModal() {
  const modal = document.getElementById('confirmModal');
  modal?.classList.remove('show');
  modal?.setAttribute('aria-hidden', 'true');
}

// ============================================
// XỬ LÝ GỬI ĐƠN
// ============================================
async function handlePlaceOrder() {
  if (cart.length === 0) {
    showToast('🚨 Giỏ hàng trống!', 'error');
    return;
  }
  
  const tableNumber = localStorage.getItem('tableNumber');
  if (!tableNumber || tableNumber === 'Chưa chọn bàn') {
    showToast('⚠️ Vui lòng chọn số bàn trước!', 'warning');
    return;
  }
  
  showConfirmModal();
}

// ============================================
// XỬ LÝ XÁC NHẬN ĐƠN HÀNG
// ============================================
async function handleConfirmOrder() {
  try {
    const tableNumber = localStorage.getItem('tableNumber') || 'Chưa chọn bàn';
    
    const orderData = {
      tableNumber,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category || 'mon_chinh',
        imageURL: item.imageURL || ''
      })),
      totalAmount: totalAmount,
      customerId: customerId,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    showToast('🚀 Đang xử lý đơn hàng...', 'info');
    
    await sendOrderToFirebase(orderData);
    
    showToast('✅ Đơn hàng đã được gửi thành công!', 'success');
    
    localStorage.removeItem('cart');
    closeConfirmModal();
    
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    
  } catch (error) {
    console.error("❌ Lỗi xử lý đơn:", error);
    showToast(`Có lỗi xảy ra: ${error.message}`, 'error');
  }
}

// ============================================
// GẮN SỰ KIỆN CHO CÁC NÚT
// ============================================
function setupEventListeners() {
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  placeOrderBtn?.addEventListener('click', handlePlaceOrder);
  
  const confirmBtn = document.getElementById('confirmOrderBtn');
  confirmBtn?.addEventListener('click', handleConfirmOrder);
  
  const cancelBtn = document.getElementById('cancelOrderBtn');
  cancelBtn?.addEventListener('click', closeConfirmModal);
  
  const modal = document.getElementById('confirmModal');
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeConfirmModal();
    }
  });
}

// ============================================
// KHỞI CHẠY KHI TRANG ĐƯỢC TẢI
// ============================================
document.addEventListener('DOMContentLoaded', initCart);
