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
  
  displayCustomerInfo();
  toggleCartView();
  
  if (cart.length > 0) {
    renderCart();
    calculateTotal();
    setupEventListeners();
  }
}

// ============================================
// HIỂN THỊ THÔNG TIN KHÁCH & BÀN
// ============================================
function displayCustomerInfo() {
  const customerEl = document.getElementById('customerIdCart');
  const tableEl = document.getElementById('tableNumber');
  
  if (customerEl) {
    customerEl.textContent = customerId || 'Khách vãng lai';
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
// RENDER DANH SÁCH MÓN ĂN
// ============================================
function renderCart() {
  const cartItemsList = document.getElementById('cartItemsList');
  if (!cartItemsList) return;
  
  cartItemsList.innerHTML = cart.map((item, index) => `
    <div class="cart-item-card" data-id="${item.id || item.name}">
      <img src="${item.imageURL || 'placeholder.jpg'}" 
           alt="${item.name}" 
           class="item-image"
           onerror="this.src='placeholder.jpg'">
      
      <div class="item-details">
        <h3>${item.name}</h3>
        <p>${item.category === 'topping' ? '➕ Topping' : '🍽️ Món chính'}</p>
      </div>
      
      <div class="quantity-controls">
        <button class="qty-btn minus" data-index="${index}" aria-label="Giảm số lượng">−</button>
        <input type="number" value="${item.quantity}" min="1" readonly>
        <button class="qty-btn plus" data-index="${index}" aria-label="Tăng số lượng">+</button>
      </div>
      
      <div class="item-total-price">
        ${(item.price * item.quantity).toLocaleString('vi-VN')}đ
      </div>
      
      <button class="remove-item-btn" data-index="${index}" aria-label="Xóa món">
        ✕
      </button>
    </div>
  `).join('');
  
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
}

// ============================================
// ✅ TÍNH TỔNG TIỀN ĐÃ BỎ GIẢM GIÁ
// ============================================
function calculateTotal() {
  totalAmount = cart.reduce((sum, item) => {
    return sum + ((item.price || 0) * (item.quantity || 0));
  }, 0);
  
  // Chỉ hiển thị tổng cộng
  const totalEl = document.getElementById('totalAmount');
  if (totalEl) {
    totalEl.textContent = `${totalAmount.toLocaleString('vi-VN')}đ`;
  }
}

// ============================================
// GỬI ĐƠN LÊN FIREBASE - ĐÃ SỬA
// ============================================
async function sendOrderToFirebase(orderData) {
  try {
    // ✅ SỬA: Tạo orderId an toàn, chỉ lấy số từ tableNumber
    const cleanTableNumber = orderData.tableNumber.replace(/\D/g, '') || '0';
    const orderId = `order_${cleanTableNumber}_${Date.now()}`;
    
    const orderRef = doc(db, 'orders', orderId);
    
    await setDoc(orderRef, {
      ...orderData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      orderNumber: Date.now().toString().slice(-6),
      timestamp: Date.now() // ✅ Thêm timestamp để sắp xếp
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
            <span>${(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
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
      totalAmount: totalAmount, // ✅ CHỈ CÓ TỔNG TIỀN MÓN
      customerId: customerId,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    showToast('🚀 Đang xử lý đơn hàng...', 'info');
    
    await sendOrderToFirebase(orderData);
    
    showToast('✅ Đơn hàng đã được gửi thành công!', 'success');
    
    // Xóa giỏ hàng
    localStorage.removeItem('cart');
    
    // Đóng modal
    closeConfirmModal();
    
    // Chuyển về trang chính
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
  // Nút gửi đơn
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  placeOrderBtn?.addEventListener('click', handlePlaceOrder);
  
  // Nút xác nhận trong modal
  const confirmBtn = document.getElementById('confirmOrderBtn');
  confirmBtn?.addEventListener('click', handleConfirmOrder);
  
  // Nút hủy trong modal
  const cancelBtn = document.getElementById('cancelOrderBtn');
  cancelBtn?.addEventListener('click', closeConfirmModal);
  
  // Đóng modal khi click bên ngoài
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
