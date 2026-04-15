const products = [
  { id: 1, name: "Camiseta", price: 11.00, image: "https://srv.latostadora.com/image/hombre-desarrollador-camisa-friki-del-ano--id:a9fc8e20-5bf3-4e32-b538-eb29f4aa2c69;s:H_A1;b:f2f2f2;w:420;tpl:H_A1F;f:f.jpg" },
  { id: 2, name: "Sudadera con capucha", price: 10.00, image: "https://i.etsystatic.com/8039902/r/il/084fca/2053802624/il_fullxfull.2053802624_9z3a.jpg" },
  { id: 3, name: "Taza de cerámica", price: 11.00, image: "https://i.etsystatic.com/21468781/r/il/426363/2712010149/il_300x300.2712010149_1y8y.jpg" },
  { id: 4, name: "Conjunto de broches", price: 10.00, image: "https://m.media-amazon.com/images/I/610ke3CQ7nL.jpg" },
  { id: 5, name: "Gorra", price: 0.50, image: "https://i.etsystatic.com/19775863/r/il/a1a5c7/7416296357/il_600x600.7416296357_fa8b.jpg" },
  { id: 6, name: "Mochila resistente", price: 20.00, image: "https://www.officedepot.com.mx/medias/100140887.jpg-1200ftw?context=bWFzdGVyfHJvb3R8MTgzMDcyfGltYWdlL2pwZWd8YURsa0wyZzBOQzh4TWpFd05EY3pOems0TURRME5pOHhNREF4TkRBNE9EY3VhbkJuWHpFeU1EQm1kSGN8NTRiMDY2YzdlZmE3NjAzNjUxODAyZjM5MzE5NTViZWI4MWRhYWRlYWIyYjEyYjA2NTU5N2ZjMTkzMmU0ODBlYw" }
];

let cart = [];

const productsContainer = document.getElementById('products-container');
const cartIcon = document.getElementById('cart-icon');
const cartModal = document.getElementById('cart-modal');
const checkoutModal = document.getElementById('checkout-modal');
const cartItemsDiv = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');
const cartCountSpan = document.getElementById('cart-count');
const checkoutBtn = document.getElementById('checkout-btn');

let stripe, elements, paymentElement;

function renderProducts() {
  productsContainer.innerHTML = products.map(p => `
    <div class="product-card">
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>$${p.price.toFixed(2)}</p>
      <button onclick="addToCart(${p.id})">Añadir al carrito</button>
    </div>
  `).join('');
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  updateCartUI();
}

function updateCartUI() {
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  cartCountSpan.textContent = totalItems;
  if (cart.length === 0) {
    cartItemsDiv.innerHTML = '<p>El carrito está vacío</p>';
    cartTotalSpan.textContent = '0';
    return;
  }
  cartItemsDiv.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <img src="${item.image}" alt="${item.name}">
        <div>
          <strong>${item.name}</strong><br>
          <small>$${item.price.toFixed(2)} c/u</small>
        </div>
      </div>
      <div class="cart-item-controls">
        <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
        <span>${item.quantity}</span>
        <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
        <button onclick="removeItem(${item.id})" class="remove-btn">🗑️</button>
      </div>
      <div style="font-weight: bold;">$${(item.price * item.quantity).toFixed(2)}</div>
    </div>
  `).join('');
  const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  cartTotalSpan.textContent = total.toFixed(2);
}

function updateQuantity(productId, newQuantity) {
  if (newQuantity <= 0) {
    removeItem(productId);
    return;
  }
  const item = cart.find(i => i.id === productId);
  if (item) item.quantity = newQuantity;
  updateCartUI();
}

function removeItem(productId) {
  cart = cart.filter(i => i.id !== productId);
  updateCartUI();
}

function openModal(modal) { modal.style.display = 'flex'; }
function closeModal(modal) { modal.style.display = 'none'; }

cartIcon.onclick = () => openModal(cartModal);
document.querySelectorAll('.close').forEach(btn => {
  btn.onclick = () => {
    closeModal(cartModal);
    closeModal(checkoutModal);
  };
});

checkoutBtn.onclick = async () => {
  if (cart.length === 0) {
    alert('El carrito está vacío');
    return;
  }
  closeModal(cartModal);
  openModal(checkoutModal);
  await initializeStripeCheckout();
};

async function initializeStripeCheckout() {
  const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
  const amountCents = Math.round(total * 100);
  try {
    const response = await fetch('https://shopproject-zpv1.onrender.com/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amountCents })
    });
    if (!response.ok) throw new Error('Error en el servidor');
    const { clientSecret } = await response.json();

    stripe = Stripe('pk_live_51T4M2a38eBTm0LV2RgqqRbY60TAcYezPWJaw0huZuImlBjZrsoHvI6jEcNeKhWxtJTsl1tT9vAGB1VnI64ZciRDh00AoNM66Gn');
    elements = stripe.elements({ clientSecret });
    paymentElement = elements.create('payment');
    paymentElement.mount('#payment-element');

    const form = document.getElementById('payment-form');
    const submitBtn = document.getElementById('submit-payment');
    const btnText = document.getElementById('button-text');
    const spinner = document.getElementById('spinner');
    const msgDiv = document.getElementById('payment-message');

    form.onsubmit = async (e) => {
      e.preventDefault();
      submitBtn.disabled = true;
      btnText.textContent = 'Procesando...';
      spinner.classList.remove('hidden');

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.origin },
        redirect: 'if_required'
      });

      if (error) {
        msgDiv.textContent = error.message;
        msgDiv.className = 'error';
        msgDiv.classList.remove('hidden');
        submitBtn.disabled = false;
        btnText.textContent = 'Pagar';
        spinner.classList.add('hidden');
      } else {
        msgDiv.textContent = '¡Pago exitoso! Gracias por tu compra.';
        msgDiv.className = 'success';
        msgDiv.classList.remove('hidden');
        cart = [];
        updateCartUI();
        setTimeout(() => {
          closeModal(checkoutModal);
          if (paymentElement) paymentElement.unmount();
          form.reset();
          msgDiv.classList.add('hidden');
        }, 2000);
      }
    };
  } catch (err) {
    console.error(err);
    alert('Error al iniciar el pago. Verifica que el backend esté funcionando.');
    closeModal(checkoutModal);
  }
}

renderProducts();
updateCartUI();