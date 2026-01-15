// ========== CART.JS - LOGIC GIỮ NGUYÊN, UI ĐẸP HƠN ==========

// Lấy thông tin từ localStorage
const customerId = localStorage.getItem('customerId');
const tableNumber = localStorage.getItem('tableNumber');
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

// Hiển thị thông tin bàn và ID
document.getElementById('tableNumber').textContent = `Bàn ${tableNumber}`;
document.getElementById('customerIdCart').textContent = customerId;

// Render giỏ hàng
function renderCart() {
  const container = document.getElementById('cartItems');
  const totalDiv = document.getElementById('cartTotal');
  const cartContainer = document.getElementById('cartContainer');
  const emptyCart = document.getElementById('emptyCart');
  
  // Kiểm tra giỏ trống
  if (cart.length === 0) {
    cartContainer.style.display = 'none';
    emptyCart.style.display = 'block';
    return;
  }
  
  cartContainer.style.display = 'block';
  emptyCart.style.display = 'none';
  
  // Render danh sách món
  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        <div class="item-details">Số lượng: ${item.quantity}</div>
      </div>
      <div class="item-price">${(item.price * item.quantity).toLocaleString()}đ</div>
      <button class="remove-btn" onclick="removeItem('${item.id}')">✕</button>
    </div>
  `).join('');
  
  // Render tổng tiền
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  totalDiv.innerHTML = `
    <h2>TỔNG ĐƠN HÀNG</h2>
    <div class="total-amount">${total.toLocaleString()}đ</div>
  `;
}

// Xoá món khỏi giỏ
function removeItem(id) {
  if (confirm('Bạn có chắc muốn xoá món này?')) {
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    // Cập nhật số lượng trên index
    if (window.opener) {
      window.opener.updateCartCount?.();
    }
  }
}

// Gửi đơn cho bếp
document.getElementById('placeOrder').addEventListener('click', () => {
  if (cart.length === 0) {
    alert('Giỏ hàng trống!');
    return;
  }
  
  if (confirm('Xác nhận gửi đơn cho bếp?')) {
    const orderId = 'ORD' + Date.now();
    const order = {
      orderId,
      customerId,
      tableNumber,
      items: cart,
      status: 'pending',
      timestamp: new Date(),
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    };
    
    localStorage.setItem('pendingOrder', JSON.stringify(order));
    
    // TODO: Sau này lưu vào Firebase
    alert(`✅ Đã gửi đơn #${orderId} cho bếp!\n\nSẽ chuyển sang trang bếp sau...`);
    
    // Giờ tạm thời clear giỏ và quay lại index
    localStorage.removeItem('cart');
    location.href = 'index.html';
  }
});

// Khởi tạo
renderCart();
