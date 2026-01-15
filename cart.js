// ========== CART.JS - GIỎ HÀNG ==========
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

function renderCart() {
  const container = document.getElementById('cartItems');
  const totalDiv = document.getElementById('cartTotal');
  
  if (cart.length === 0) {
    container.innerHTML = '<p>Giỏ hàng trống!</p>';
    totalDiv.innerHTML = '';
    return;
  }
  
  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <span class="item-icon">${item.icon}</span>
      <div class="item-info">
        <h4>${item.name}</h4>
        <p>${item.price.toLocaleString()}đ x ${item.quantity}</p>
      </div>
      <button class="remove-btn" onclick="removeItem('${item.id}')">❌</button>
    </div>
  `).join('');
  
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  totalDiv.innerHTML = `<h2>Tổng: ${total.toLocaleString()}đ</h2>`;
}

function removeItem(id) {
  cart = cart.filter(item => item.id !== id);
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
}

document.getElementById('placeOrder').addEventListener('click', () => {
  if (cart.length === 0) {
    alert('Giỏ hàng trống!');
    return;
  }
  
  const orderId = 'ORD' + Date.now();
  const orderData = {
    orderId: orderId,
    customerId: localStorage.getItem('customerId'),
    tableNumber: localStorage.getItem('tableNumber'),
    items: cart,
    status: 'pending', // pending → cooking → ready → paid
    timestamp: new Date(),
    total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  };
  
  localStorage.setItem('pendingOrder', JSON.stringify(orderData));
  alert(`✅ Đã gửi đơn #${orderId} cho bếp!`);
  localStorage.removeItem('cart');
  location.href = 'kitchen.html?order=' + orderId;
});

renderCart();