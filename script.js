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


const productsGrid = document.querySelector('#productsGrid');
const searchInput = document.querySelector('#searchInput');
const searchBtn = document.querySelector('#searchBtn');
const cartContainer = document.querySelector('#cartItems');
const checkoutForm = document.querySelector('#checkoutForm');
// ========== Ініціалізація при завантаженні сторінки ==========
document.addEventListener('DOMContentLoaded', function () {
   setupGsapAnimations();
   loadCart(); // Завантажуємо кошик з LocalStorage
   fetchProducts(); // Отримуємо товари з JSON


   searchInput?.addEventListener('input', function () {
       const text = searchInput.value.toLowerCase(); // Що ввів юзер


       // Фільтруємо
       const filtered = products.filter(product => product.title.toLowerCase().includes(text));


       // Перемальовуємо сторінку новими даними!
       displayProducts(filtered);
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
   if (productsGrid) {
       displayProducts(data);
   }
}
// ========== Відображення товарів ==========
function displayProducts(products) {
   productsGrid.innerHTML = ''; // Очищаємо блок товарів


   products?.forEach(product => {
       const card = createProductCard(product);
       productsGrid.innerHTML += card;
   });


   animateProductCardsOnRender();
}
// ========== Створення картки товару ==========
function createProductCard(product) {
   return `<div class="card" style="width: 18rem;">
       <img src="img/${product.image}" class="card-img-top" alt="${product.title}">
       <div class="card-body">
           <h5 class="card-title">${product.title}</h5>
           <p class="card-text text-primary fw-bold">${product.price} $ </p>
           <button onclick="addToCart(${product.id})"  class="btn btn-warning add-to-cart-btn"> <i class="bi bi-cart-plus"></i> Add to cart</button>
       </div>
   </div>`;
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
}
// Завантаження кошика з Cookie або LocalStorage
function loadCart() {
   const savedCart = getStoredCart();
   if (savedCart.length > 0) {
       cart = savedCart;
       displayCart(); // Відображаємо кошик після завантаження
   }
}
function displayCart() {
   if (!cartContainer) return; // Якщо елемент для відображення кошика не знайдено, зупиняємо функцію


   // Очищаємо контейнер перед виведенням
   cartContainer.innerHTML = '';
   if (cart.length === 0) {
       cartContainer.innerHTML = '<p class="m-3">Your cart is empty 🛒</p>';
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
             <p class="card-text text-muted mb-1">Quantity: ${product.quantity}</p>
             <p class="card-text text-primary fw-bold mb-0">Price: ${product.price} $</p>
         </div>
       </div>
     </div>
   `;
   });
   document.querySelector('#totalPrice').textContent = `${total} $`; // Виводимо загальну суму


}


