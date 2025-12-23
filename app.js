// app.js - Main Client Logic (SPA Version)
import { db, collection, onSnapshot, doc, getDoc } from './firebase-config.js';

// Configuration
const PHONE_NUMBER = "9111676448";
const app = document.getElementById('app');

// State
let products = [];
let cart = {};
let activeCategory = 'all';
let activeSearch = ''; // Search state
let storeSettings = { minPrice: 0, minQty: 0 };

// ... (HTML Components Same)

// Fetch Settings
async function loadSettings() {
    try {
        const docSnap = await getDoc(doc(db, 'settings', 'config'));
        if (docSnap.exists()) {
            storeSettings = docSnap.data();
        }
    } catch (err) {
        console.log("Settings Load Error:", err);
    }
}
loadSettings();

// ... (Rendering Logic Same)

// Checkout (WhatsApp)
window.checkout = () => {
    const totalQty = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = Object.values(cart).reduce((sum, item) => sum + (item.price * item.qty), 0);

    if (totalQty === 0) return;

    // Validation
    if (storeSettings.minQty > 0 && totalQty < storeSettings.minQty) {
        alert(`⚠️ Minimum Order Quantity is ${storeSettings.minQty} items.\nYou have ${totalQty}.`);
        return;
    }
    if (storeSettings.minPrice > 0 && totalPrice < storeSettings.minPrice) {
        alert(`⚠️ Minimum Order Amount is ₹${storeSettings.minPrice}.\nYour total is ₹${totalPrice}.`);
        return;
    }

    let message = `*Hello, I would like to place an order:*\n\n`;
    let index = 1;

    Object.values(cart).forEach(item => {
        const itemTotal = item.price * item.qty;
        message += `${index}. *${item.name}* (${item.qty} ${item.unit}) - ₹${itemTotal}\n`;
        index++;
    });

    message += `\n*Total Estimate: ₹${totalPrice}*\n`;
    message += `------------------------------\n`;
    message += `*Delivery Address:*\n`;

    const url = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
};

// --- Components (HTML Templates) ---

const CATEGORY_META = {
    vegetables: { icon: '🍅', label: 'Veg' },
    fruits: { icon: '🍎', label: 'Fruits' },
    staples: { icon: '🌾', label: 'Staples' },
    essentials: { icon: '🧼', label: 'Daily Needs' }
};

const Navbar = () => `
    <nav class="navbar">
        <div class="container" style="display:flex; justify-content:space-between; align-items:center;">
            <h1 class="logo">Kirana Store</h1>
            <a href="#products" class="btn-primary-outline">Browse Items</a>
        </div>
    </nav>
`;

const Hero = () => `
    <header class="hero">
        <div class="hero-content">
            <div class="hero-text">
                <h2>Fresh Grocery Delivered via WhatsApp</h2>
                <p>Order fresh vegetables, fruits, and daily essentials directly from your local shop.</p>
                <a href="#products" class="btn-primary">Order on WhatsApp</a>
            </div>
        </div>
    </header>
`;

const Categories = () => `
    <section id="categories" class="section">
        <div class="container">
            <h3 class="section-title">Shop by Category</h3>
            <div class="category-grid">
                <!-- Dynamic Content -->
            </div>
        </div>
    </section>
`;

const ProductsSection = () => `
    <section id="products" class="section">
        <div class="container">
            <h3 class="section-title">Fresh Products</h3>
            
            <!-- Search Bar (Mobile Friendly) -->
            <div style="margin-bottom: 20px; max-width: 500px; margin-left: auto; margin-right: auto;">
                <input type="search" 
                       placeholder="🔍 Search for Atta, Rice, Maggi..." 
                       oninput="window.setSearch(this.value)"
                       style="width:100%; padding:12px 20px; border-radius:30px; border:1px solid #ddd; outline:none; font-size:1rem; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
            </div>

            <div id="product-grid" class="product-grid">
                <div class="loader" id="loader" style="display:block;"></div>
            </div>
        </div>
    </section>
`;

const FloatingCart = () => `
    <div class="floating-cart" id="floating-cart" style="display: none;">
        <button class="btn-whatsapp" onclick="checkout()">
            <span class="icon">💬</span> Order (<span id="cart-count">0</span>) items
        </button>
    </div>
`;

const Footer = () => `
    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 Local Kirana Shop. All rights reserved.</p>
            <p>📍 Main Market, Local Area | 📞 +91 91116 76448</p>
            <p style="margin-top: 10px; font-size: 0.8rem;"><a href="admin.html" style="color: #999; text-decoration: none;">Admin Login</a></p>
        </div>
    </footer>
`;

// --- Rendering ---

function renderApp() {
    app.innerHTML = `
        ${Navbar()}
        ${Hero()}
        ${Categories()}
        ${ProductsSection()}
        ${FloatingCart()}
        ${Footer()}
    `;
    // Re-bind products after render
    renderCategories();
    renderProductGrid(products);
    updateCartUI();
}

// Initial Render
renderApp();

// --- Logic ---

// Dynamic Category Renderer
function renderCategories() {
    const grid = document.querySelector('.category-grid');
    if (!grid) return;

    // Count products per category
    const counts = {};
    products.forEach(p => {
        counts[p.category] = (counts[p.category] || 0) + 1;
    });

    // Generate HTML
    let html = `
        <div class="category-card ${activeCategory === 'all' ? 'active' : ''}" onclick="window.setCategory('all')">
            🥬 <br>All Items
        </div>
    `;

    Object.keys(CATEGORY_META).forEach(cat => {
        if (counts[cat] > 0) {
            const meta = CATEGORY_META[cat];
            html += `
                <div class="category-card ${activeCategory === cat ? 'active' : ''}" onclick="window.setCategory('${cat}')">
                    ${meta.icon} <br>${meta.label}
                </div>
            `;
        }
    });

    // Check if active category is empty (and switch to all if needed)
    if (activeCategory !== 'all' && !counts[activeCategory]) {
        activeCategory = 'all';
        // Recursion safe because 'all' is always valid
        renderCategories();
        renderProductGrid(products);
        return;
    }

    grid.innerHTML = html;
}

// Set Category Global
window.setCategory = (cat) => {
    activeCategory = cat;
    renderCategories();
    renderProductGrid(products);
};

// Set Search Global
window.setSearch = (query) => {
    activeSearch = query.toLowerCase().trim();
    renderProductGrid(products);
};

// Fetch Products
const productsRef = collection(db, 'products');
onSnapshot(productsRef, (snapshot) => {
    products = [];
    snapshot.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() });
    });
    renderCategories(); // Update categories based on new data
    renderProductGrid(products);
});

function renderProductGrid(fullList) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;


    let displayList = fullList;

    // 1. Filter by Category
    if (activeCategory !== 'all') {
        displayList = displayList.filter(p => p.category === activeCategory);
    }

    // 2. Filter by Search
    if (activeSearch) {
        displayList = displayList.filter(p => p.name.toLowerCase().includes(activeSearch));
    }

    if (displayList.length === 0) {
        grid.innerHTML = '<p style="text-align:center; width:100%; color:#666; padding:20px;">No products found matching your search.</p>';
        return;
    }

    grid.innerHTML = displayList.map(product => {
        const qty = cart[product.id] ? cart[product.id].qty : 0;
        return `
        <div class="product-card">
            <img src="${product.image || 'assets/default.png'}" class="product-img" alt="${product.name}" onerror="this.src='https://placehold.co/150'">
            <div class="product-name">${product.name}</div>
            <div class="product-price">₹${product.price}/${product.unit}</div>
            
            <div class="qty-selector">
                ${qty === 0
                ? `<button class="btn-primary add-btn" onclick="updateQty('${product.id}', 1)">Add +</button>`
                : `
                     <button class="btn-qty" onclick="updateQty('${product.id}', -1)">-</button>
                     <span class="qty-count">${qty}</span>
                     <button class="btn-qty" onclick="updateQty('${product.id}', 1)">+</button>
                    `
            }
            </div>
        </div>
        `;
    }).join('');
}

// Global Quantity Update
window.updateQty = (productId, change) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (!cart[productId]) {
        cart[productId] = { ...product, qty: 0 };
    }

    cart[productId].qty += change;

    if (cart[productId].qty <= 0) {
        delete cart[productId];
    }

    updateCartUI();
    renderProductGrid(products);
};

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const floatingCart = document.getElementById('floating-cart');

    let totalQty = 0;
    Object.values(cart).forEach(item => totalQty += item.qty);

    if (cartCount) cartCount.textContent = totalQty;

    if (floatingCart) {
        floatingCart.style.display = totalQty > 0 ? 'block' : 'none';
        if (totalQty > 0 && !floatingCart.classList.contains('pop-in')) {
            floatingCart.classList.add('pop-in');
        }
    }
}


