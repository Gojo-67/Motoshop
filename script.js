// const btn = document.querySelector('.order-btn');


// btn.addEventListener('click', () => {
//     gtag('event', 'order_button_clicked');
//     console.log('Дані відправлено!');
// });
// 1. Універсальна функція для збереження будь-яких даних (масивів/об'єктів) у Cookie
function getJsonCookie(cookieName) {
   try {
       const allCookies = document.cookie ? document.cookie.split('; ') : [];
       const targetCookie = allCookies.find(row => row.startsWith(cookieName + '='));


       if (targetCookie) {
           const encodedData = targetCookie.split('=').slice(1).join('=');
           return JSON.parse(decodeURIComponent(encodedData));
       }
   } catch (error) {
       console.warn('Cookie parse error:', error);
   }
   return null;
}


// 2. Універсальна функція для збереження будь-яких даних (масивів/об'єктів) у Cookie
function saveJsonCookie(cookieName, data, seconds) {
   const jsonString = JSON.stringify(data);
   const safeString = encodeURIComponent(jsonString);


   try {
       document.cookie = `${cookieName}=${safeString}; max-age=${seconds}; path=/; SameSite=Lax`;
   } catch (error) {
       console.warn('Cookie save error:', error);
   }


   try {
       localStorage.setItem(cookieName, safeString);
   } catch (error) {
       console.warn('LocalStorage save error:', error);
   }
}


function getStoredCart() {
   const savedFromCookie = getJsonCookie('cart');
   if (Array.isArray(savedFromCookie)) return savedFromCookie;


   try {
       const savedFromStorage = localStorage.getItem('cart');
       if (!savedFromStorage) return [];


       const parsed = JSON.parse(decodeURIComponent(savedFromStorage));
       return Array.isArray(parsed) ? parsed : [];
   } catch (error) {
       console.warn('Cart storage read error:', error);
       return [];
   }
}
let products = [];
let cart = [];
let currentCategory = "all";
let currentSearch = "";
let selectedProductId = null;


const productsGrid = document.querySelector('#productsGrid');
const searchInput = document.querySelector('#searchInput');
const searchBtn = document.querySelector('#searchBtn');
const cartContainer = document.querySelector('#cartItems');
const checkoutForm = document.querySelector('#checkoutForm');
const categoryFilters = document.querySelector('#categoryFilters');
const noProducts = document.querySelector('#noProducts');
const cartItemsCount = document.querySelector('#cartItemsCount');
const totalPriceEl = document.querySelector('#totalPrice');
const modalElement = document.querySelector('.modal');
const modalProductImage = document.querySelector('#modalProductImage');
const modalProductCategory = document.querySelector('#modalProductCategory');
const modalProductTitle = document.querySelector('#modalProductTitle');
const modalProductDescription = document.querySelector('#modalProductDescription');
const modalProductPrice = document.querySelector('#modalProductPrice');
const modalAddToCartBtn = document.querySelector('#modalAddToCart');
let productModal = null;
// ========== Ініціалізація при завантаженні сторінки ==========
document.addEventListener('DOMContentLoaded', function () {
   setupGsapAnimations();
   loadCart(); // Завантажуємо кошик з LocalStorage
   fetchProducts(); // Отримуємо товари з JSON


   if (modalElement && typeof bootstrap !== 'undefined') {
       productModal = new bootstrap.Modal(modalElement);
   }


   productsGrid?.addEventListener('click', function (e) {
       const button = e.target.closest('.add-to-cart-btn');
       if (button) {
           e.stopPropagation();
           return;
       }


       const card = e.target.closest('.card');
       if (!card) return;


       const productId = Number(card.dataset.productId);
       if (productId) {
           openProductModal(productId);
       }
   });


   modalAddToCartBtn?.addEventListener('click', function () {
       if (!selectedProductId) return;
       addToCart(selectedProductId);
       productModal?.hide();
   });


   searchInput?.addEventListener('input', function () {
       currentSearch = searchInput.value.trim().toLowerCase();
       renderProducts();
   });


   searchBtn?.addEventListener('click', function (e) {
       e.preventDefault();
       currentSearch = searchInput?.value.trim().toLowerCase() || '';
       renderProducts();
   });


   categoryFilters?.addEventListener('click', function (e) {
       const activeButton = e.target.closest('.category-btn');
       if (!activeButton) return;


       currentCategory = activeButton.dataset.category || 'all';
       document.querySelectorAll('.category-btn').forEach(btn => {
           btn.classList.toggle('active', btn === activeButton);
           btn.classList.toggle('btn-dark', btn === activeButton);
           btn.classList.toggle('btn-outline-dark', btn !== activeButton);
       });


       renderProducts();
   });


   if (checkoutForm) {
       checkoutForm.addEventListener('submit', (e) => {
           e.preventDefault();
           alert('Дякуємо за замовлення! Ми зв\'яжемося з вами найближчим часом для підтвердження деталей замовлення.');
           location.assign('index.html'); // Повертаємо користувача на головну сторінку після оформлення замовлення
           cart = []; // Очищаємо кошик після оформлення замовлення
           saveJsonCookie('cart', cart, 3600 * 24 * 7); // Оновлюємо збереження кошика
           displayCart(); // Оновлюємо відображення кошика
           checkoutForm.reset();
       })
   }
});


function setupGsapAnimations() {
   if (typeof gsap === 'undefined') return;


   if (typeof ScrollTrigger !== 'undefined') {
       gsap.registerPlugin(ScrollTrigger);
   }


   const heroTitle = document.querySelector('#heroTitle');
   const heroText = document.querySelector('#heroText');
   const heroButton = document.querySelector('.hero-section .btn');


   if (heroTitle && heroText && heroButton) {
       gsap.from([heroTitle, heroText, heroButton], {
           y: 36,
           opacity: 0,
           duration: 0.8,
           ease: 'power2.out',
           stagger: 0.14
       });
   }


   if (typeof ScrollTrigger !== 'undefined') {
       gsap.utils.toArray('.section-title, #categoryFilters, #cartItems, #checkoutCard, footer .col-md-4, footer .col-md-6').forEach((el) => {
           gsap.from(el, {
               scrollTrigger: {
                   trigger: el,
                   start: 'top 88%'
               },
               y: 28,
               opacity: 0,
               duration: 0.7,
               ease: 'power2.out'
           });
       });
   }
}


function animateProductCardsOnRender() {
   if (typeof gsap === 'undefined') return;


   const cards = gsap.utils.toArray('#productsGrid .card');
   if (!cards.length) return;


   if (typeof ScrollTrigger !== 'undefined') {
       cards.forEach((card, index) => {
           gsap.from(card, {
               scrollTrigger: {
                   trigger: card,
                   start: 'top 92%'
               },
               y: 24,
               opacity: 0,
               duration: 0.45,
               ease: 'power2.out',
               delay: index * 0.03
           });
       });
       return;
   }


   gsap.fromTo(cards, { y: 24, opacity: 0 }, {
       y: 0,
       opacity: 1,
       duration: 0.45,
       ease: 'power2.out',
       stagger: 0.07,
       overwrite: true
   });
}
async function fetchProducts() {
   const response = await fetch('store_db.json');
   const data = await response.json();
   products = data; // глобальна змінна з усіма товарами
   renderCategoryFilters();
   renderProducts();
}


function renderCategoryFilters() {
   if (!categoryFilters) return;


   const categories = [...new Set(products.map(product => product.category).filter(Boolean))].sort();
   const buttons = [
       `<button class="btn btn-dark category-btn ${currentCategory === 'all' ? 'active' : ''}" data-category="all">All products</button>`
   ];


   categories.forEach(category => {
       buttons.push(`<button class="btn btn-outline-dark category-btn ${currentCategory === category ? 'active' : ''}" data-category="${category}">${category}</button>`);
   });


   categoryFilters.innerHTML = buttons.join('');
}


function renderProducts() {
   const filteredProducts = products.filter(product => {
       const matchesCategory = currentCategory === 'all' || product.category?.toLowerCase() === currentCategory.toLowerCase();
       const searchText = currentSearch.trim().toLowerCase();
       const matchesSearch = !searchText || [product.title, product.category, product.description]
           .filter(Boolean)
           .some(value => value.toLowerCase().includes(searchText));


       return matchesCategory && matchesSearch;
   });


   displayProducts(filteredProducts);
}


// ========== Відображення товарів ==========
function displayProducts(productsToRender) {
   if (!productsGrid) return;


   productsGrid.innerHTML = ''; // Очищаємо блок товарів


   if (!productsToRender?.length) {
       noProducts?.classList.remove('d-none');
       return;
   }


   noProducts?.classList.add('d-none');
   productsToRender.forEach(product => {
       const card = createProductCard(product);
       productsGrid.innerHTML += card;
   });


   animateProductCardsOnRender();
}
// ========== Створення картки товару ==========
function createProductCard(product) {
   return `<div class="card h-100 d-flex flex-column" style="width: 18rem; cursor: pointer;" data-product-id="${product.id}" role="button">
       <img src="img/${product.image}" class="card-img-top" alt="${product.title}" style="height: 220px; object-fit: cover;">
       <div class="card-body d-flex flex-column">
           <h5 class="card-title">${product.title}</h5>
           <p class="card-text text-muted mb-2">${product.category || 'No category'}</p>
           <p class="card-text text-primary fw-bold mb-3">${product.price} $ </p>
           <button type="button" onclick="event.stopPropagation(); addToCart(${product.id})" class="btn btn-warning add-to-cart-btn mt-auto"> <i class="bi bi-cart-plus"></i> Add to cart</button>
       </div>
   </div>`;
}


function openProductModal(productId) {
   const product = products.find(item => item.id === productId);
   if (!product) return;


   selectedProductId = product.id;
   modalProductImage.src = `img/${product.image}`;
   modalProductCategory.textContent = product.category || 'No category';
   modalProductTitle.textContent = product.title;
   modalProductDescription.textContent = product.description || 'No description available.';
   modalProductPrice.textContent = `${product.price} $`;


   productModal?.show();
}
// Додавання товару до кошика
function addToCart(productId) {
   const product = products.find(p => p.id === productId);
   if (!product) return;


   const cartItem = cart.find(item => item.id === productId);
   if (cartItem) {
       cartItem.quantity += 1; // Якщо товар вже в кошику, збільшуємо кількість
   } else {
       cart.push({ ...product, quantity: 1 }); // Додаємо новий товар до кошика
   }
   saveJsonCookie('cart', cart, 3600 * 24 * 7); // Зберігаємо кошик у Cookie та LocalStorage
   displayCart();
}


function removeFromCart(productId) {
   cart = cart.filter(item => item.id !== productId);
   saveJsonCookie('cart', cart, 3600 * 24 * 7);
   displayCart();
}


function changeQuantity(productId, delta) {
   const item = cart.find(product => product.id === productId);
   if (!item) return;


   item.quantity += delta;


   if (item.quantity <= 0) {
       cart = cart.filter(product => product.id !== productId);
   }


   saveJsonCookie('cart', cart, 3600 * 24 * 7);
   displayCart();
}
// Завантаження кошика з Cookie або LocalStorage
function loadCart() {
   const savedCart = getStoredCart();
   if (savedCart.length > 0) {
       cart = savedCart;
   }
   displayCart(); // Відображаємо кошик після завантаження
}
function displayCart() {
   if (!cartContainer) return; // Якщо елемент для відображення кошика не знайдено, зупиняємо функцію


   // Очищаємо контейнер перед виведенням
   cartContainer.innerHTML = '';
   if (cartItemsCount) {
       cartItemsCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
   }


   if (cart.length === 0) {
       cartContainer.innerHTML = '<p class="m-3">Your cart is empty 🛒</p>';
       if (totalPriceEl) totalPriceEl.textContent = '0 $';
       return; // Зупиняємо функцію, далі йти не треба
   }


   let total = 0;
   cart.forEach((product) => {
       total += product.price * product.quantity; // Підрахунок загальної суми


       cartContainer.innerHTML += `
     <div class="card border-0 border-bottom rounded-0">
       <div class="card-body d-flex align-items-center gap-3 p-3">
         <img src="img/${product.image}" height="80" >
         <div class="flex-grow-1">
             <h5 class="card-title mb-1">${product.title}</h5>
             <div class="d-flex align-items-center gap-2 mb-2">
                 <button onclick="changeQuantity(${product.id}, -1)" class="btn btn-outline-secondary btn-sm">-</button>
                 <span class="fw-bold">${product.quantity}</span>
                 <button onclick="changeQuantity(${product.id}, 1)" class="btn btn-outline-secondary btn-sm">+</button>
             </div>
             <p class="card-text text-primary fw-bold mb-0">Price: ${product.price} $</p>
         </div>
         <button onclick="removeFromCart(${product.id})" class="btn btn-outline-danger btn-sm">Delete</button>
       </div>
     </div>
   `;
   });
   if (totalPriceEl) totalPriceEl.textContent = `${total} $`; // Виводимо загальну суму


}


