const products = [
  { id: 1, name: 'Vela de Lavanda', price: 15, image: 'https://picsum.photos/id/200/300/200' },
  { id: 2, name: 'Vela de Vainilla', price: 18, image: 'https://picsum.photos/id/210/300/200' },
  { id: 3, name: 'Vela de Sándalo', price: 22, image: 'https://picsum.photos/id/220/300/200' }
];

let cart = JSON.parse(localStorage.getItem('cart') || '[]');

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  const cartCount = document.getElementById('cart-count');
  if (cartCount) cartCount.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  grid.innerHTML = products.map(product => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}" class="product-image">
      <div class="product-info">
        <h3 class="product-title">${product.name}</h3>
        <p class="product-price">$${product.price}</p>
        <button class="add-to-cart" data-id="${product.id}">Añadir al carrito</button>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.id);
      addToCart(id);
    });
  });
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveCart();
  showCartModal();
}

function showCartModal() {
  const modal = document.getElementById('cart-modal');
  if (!modal) return;
  const cartItemsDiv = document.getElementById('cart-items');
  const cartTotalSpan = document.getElementById('cart-total');

  if (cart.length === 0) {
    cartItemsDiv.innerHTML = '<p>Tu carrito está vacío</p>';
    cartTotalSpan.innerText = '0';
  } else {
    cartItemsDiv.innerHTML = cart.map(item => `
      <div class="cart-item">
        <span>${item.name} x${item.quantity}</span>
        <span>$${item.price * item.quantity}</span>
      </div>
    `).join('');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalSpan.innerText = total;
  }
  modal.style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  updateCartUI();

  const cartIcon = document.querySelector('.cart-icon');
  if (cartIcon) cartIcon.addEventListener('click', showCartModal);

  const closeModal = document.querySelector('.close-modal');
  if (closeModal) closeModal.addEventListener('click', () => {
    document.getElementById('cart-modal').style.display = 'none';
  });

  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        alert('Tu carrito está vacío');
        return;
      }
      localStorage.setItem('checkout_cart', JSON.stringify(cart));
      window.location.href = 'checkout.html';
    });
  }
});

if (window.location.pathname.includes('checkout.html')) {
  let stripe = null;
  let elements = null;

  async function initStripe() {
    if (stripe) return;
    stripe = Stripe('pk_test_tu_publishable_key'); // Reemplazar con tu clave publicable
  }

  async function loadCheckout() {
    const checkoutCart = JSON.parse(localStorage.getItem('checkout_cart') || '[]');
    const orderItemsDiv = document.getElementById('order-items');
    const orderTotalSpan = document.getElementById('order-total');

    if (!orderItemsDiv) return;

    if (checkoutCart.length === 0) {
      orderItemsDiv.innerHTML = '<p>No hay productos en tu pedido. <a href="index.html">Volver a la tienda</a></p>';
      document.getElementById('payment-form').style.display = 'none';
      return;
    }

    let total = 0;
    orderItemsDiv.innerHTML = checkoutCart.map(item => {
      total += item.price * item.quantity;
      return `<div class="cart-item">${item.name} x${item.quantity} - $${item.price * item.quantity}</div>`;
    }).join('');
    orderTotalSpan.innerText = total;
    try {
      await initStripe();
      const response = await fetch('http://localhost:4242/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total * 100 }) //esta en centavos el pago
      });
      if (!response.ok) throw new Error('Error al crear el pago');
      const { clientSecret } = await response.json();

      elements = stripe.elements({ clientSecret });
      const paymentElement = elements.create('payment');
      paymentElement.mount('#payment-element');

      const form = document.getElementById('payment-form');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('payment-submit');
        const buttonText = document.getElementById('payment-button-text');
        const spinner = document.getElementById('payment-spinner');
        const errorDiv = document.getElementById('payment-error');

        submitBtn.disabled = true;
        buttonText.textContent = 'Procesando...';
        spinner.classList.remove('hidden');

        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: { return_url: window.location.origin + '/success.html' },
          redirect: 'if_required'
        });

        if (error) {
          errorDiv.textContent = error.message;
          errorDiv.classList.remove('hidden');
          submitBtn.disabled = false;
          buttonText.textContent = 'Pagar';
          spinner.classList.add('hidden');
        } else {
         
          localStorage.removeItem('checkout_cart');
          localStorage.removeItem('cart');
          window.location.href = 'success.html';
        }
      });
    } catch (error) {
      console.error(error);
      alert('Error al conectar con el servidor de pagos. Asegúrate de que el backend esté corriendo.');
    }
  }

  loadCheckout();
}