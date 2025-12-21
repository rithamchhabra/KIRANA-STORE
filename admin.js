// admin.js - Rebuilt Diagnostic Version
import { auth, db, collection, addDoc, deleteDoc, doc, onSnapshot, signInWithEmailAndPassword, onAuthStateChanged, signOut } from './firebase-config.js';

const app = document.getElementById('admin-app');

// --- Master List Data (Same as before) ---
const MASTER_LIST = [
    { name: "Potato (Aloo)", category: "vegetables", price: 30, unit: "kg", image: "https://placehold.co/150?text=Aloo" },
    { name: "Onion (Pyaaz)", category: "vegetables", price: 40, unit: "kg", image: "https://placehold.co/150?text=Onion" },
    { name: "Tomato", category: "vegetables", price: 50, unit: "kg", image: "https://placehold.co/150?text=Tomato" },
    { name: "Green Chili", category: "vegetables", price: 20, unit: "250g", image: "https://placehold.co/150?text=Chili" },
    { name: "Coriander (Dhaniya)", category: "vegetables", price: 10, unit: "bunch", image: "https://placehold.co/150?text=Dhaniya" },
    { name: "Banana", category: "fruits", price: 60, unit: "dozen", image: "https://placehold.co/150?text=Banana" },
    { name: "Apple", category: "fruits", price: 120, unit: "kg", image: "https://placehold.co/150?text=Apple" },
    { name: "Rice (Basmati)", category: "staples", price: 90, unit: "kg", image: "https://placehold.co/150?text=Rice" },
    { name: "Atta (Wheat Flour)", category: "staples", price: 40, unit: "kg", image: "https://placehold.co/150?text=Atta" },
    { name: "Toor Dal", category: "staples", price: 140, unit: "kg", image: "https://placehold.co/150?text=Dal" },
    { name: "Sugar", category: "staples", price: 42, unit: "kg", image: "https://placehold.co/150?text=Sugar" },
    { name: "Salt", category: "staples", price: 20, unit: "pack", image: "https://placehold.co/150?text=Salt" },
    { name: "Sunflower Oil", category: "staples", price: 130, unit: "liter", image: "https://placehold.co/150?text=Oil" },
    { name: "Milk", category: "essentials", price: 30, unit: "liter", image: "https://placehold.co/150?text=Milk" },
    { name: "Bread", category: "essentials", price: 40, unit: "pack", image: "https://placehold.co/150?text=Bread" },
    { name: "Maggie Noodles", category: "essentials", price: 14, unit: "pack", image: "https://placehold.co/150?text=Maggie" },
    { name: "Toothpaste", category: "essentials", price: 55, unit: "pack", image: "https://placehold.co/150?text=Colgate" },
    { name: "Bathing Soap", category: "essentials", price: 35, unit: "pc", image: "https://placehold.co/150?text=Soap" }
];

// --- Views ---

const LoginView = () => `
    <div style="display:flex; justify-content:center; align-items:center; height:100vh; background:#f4f6f8;">
        <div style="background:white; padding:2rem; border-radius:12px; box-shadow:0 4px 6px rgba(0,0,0,0.1); width:100%; max-width:400px;">
            <h2 style="text-align:center; margin-bottom:1.5rem; color:#1e293b;">Admin Login</h2>
            <form id="login-form">
                <input type="email" id="admin-email" placeholder="Email" required style="width:100%; padding:12px; margin-bottom:10px; border:1px solid #ddd; border-radius:6px;">
                <input type="password" id="admin-password" placeholder="Password" required style="width:100%; padding:12px; margin-bottom:20px; border:1px solid #ddd; border-radius:6px;">
                <button type="submit" style="width:100%; padding:12px; background:#059669; color:white; border:none; border-radius:6px; font-weight:600; cursor:pointer;">Login Securely</button>
            </form>
            <p id="login-status" style="margin-top:10px; text-align:center; color:red;"></p>
        </div>
    </div>
`;

const DashboardView = (user) => `
    <div style="max-width:1200px; margin:0 auto; padding:20px;">
        <!-- Status Bar -->
        <div id="status-bar" style="background:#1e293b; color:white; padding:15px; border-radius:8px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <strong>Logged in:</strong> ${user.email} <span style="color:#4ade80; margin-left:10px;">● Online</span>
            </div>
            <button onclick="window.handleLogout()" style="background:#ef4444; color:white; border:none; padding:5px 15px; border-radius:4px; cursor:pointer;">Logout</button>
        </div>

        <!-- Connection Error Warning (Hidden by default) -->
        <div id="db-error-banner" style="display:none; background:#fee2e2; color:#b91c1c; padding:15px; border-radius:8px; margin-bottom:20px; border:1px solid #f87171;">
            <strong>🚨 Database Locked!</strong><br>
            You cannot add or delete items because Firebase Permissions are missing.<br>
            <strong style="text-decoration:underline; cursor:pointer;" onclick="alert('Open FIREBASE_RULES_TO_COPY.txt in your folder, copy the code, and paste it in Firebase Console > Firestore > Rules.')">Click here for the Fix Instructions</strong>
        </div>

        <div class="admin-grid" style="display:grid; grid-template-columns: 1fr 250px; gap:20px;">
            
            <!-- Left: Product List -->
            <div style="background:white; padding:20px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h3>Your Products</h3>
                </div>
                
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="text-align:left; border-bottom:2px solid #eee;">
                            <th style="padding:10px;">Image</th>
                            <th style="padding:10px;">Name</th>
                            <th style="padding:10px;">Price</th>
                            <th style="padding:10px;">Action</th>
                        </tr>
                    </thead>
                    <tbody id="product-list-body">
                        <tr><td colspan="4" style="padding:20px; text-align:center;">Loading products...</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- Right: Quick Add -->
            <div style="background:white; padding:20px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.1); max-height:80vh; overflow-y:auto; display:flex; flex-direction:column;">
                <h3 style="margin-bottom:10px;">⚡ Quick Add</h3>
                
                <button onclick="document.getElementById('product-modal').style.display='flex'" style="background:#059669; color:white; border:none; padding:10px; border-radius:6px; font-weight:bold; cursor:pointer; margin-bottom:15px; display:flex; align-items:center; justify-content:center; gap:8px;">
                    <span style="font-size:1.2rem;">+</span> Add Custom Item
                </button>

                <input type="text" id="quick-search" placeholder="Search items..." style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; margin-bottom:10px;">
                <div id="quick-list" style="overflow-y:auto;"></div>
            </div>
        </div>
    </div>

    <!-- Modal -->
    <div id="product-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); justify-content:center; align-items:center;">
        <div style="background:white; padding:2rem; border-radius:8px; width:400px; position:relative;">
            <span onclick="document.getElementById('product-modal').style.display='none'" style="position:absolute; top:10px; right:15px; cursor:pointer; font-size:1.5rem;">&times;</span>
            <h3>Add New Product</h3>
            <form id="custom-form" style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">
                <input id="c-name" placeholder="Product Name" required style="padding:8px; border:1px solid #ddd; border-radius:4px;">
                <select id="c-cat" style="padding:8px; border:1px solid #ddd; border-radius:4px;">
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="staples">Staples</option>
                    <option value="essentials">Essentials</option>
                </select>
                <input id="c-price" type="number" placeholder="Price" required style="padding:8px; border:1px solid #ddd; border-radius:4px;">
                <input id="c-unit" placeholder="Unit (kg, packet)" required style="padding:8px; border:1px solid #ddd; border-radius:4px;">
                <input id="c-img" placeholder="Image URL" required style="padding:8px; border:1px solid #ddd; border-radius:4px;">
                <button type="submit" style="background:#059669; color:white; border:none; padding:10px; border-radius:4px; font-weight:bold; cursor:pointer;">Save Product</button>
            </form>
        </div>
    </div>
`;

// --- Logic ---

onAuthStateChanged(auth, (user) => {
    if (user) {
        app.innerHTML = DashboardView(user);
        initDashboard();
    } else {
        app.innerHTML = LoginView();
        initLogin();
    }
});

function initLogin() {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        const status = document.getElementById('login-status');

        status.textContent = "Verifying...";
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            status.textContent = "Login Failed: " + err.message;
        }
    });
}

function initDashboard() {
    // 1. Render Quick Add List with Search
    const quickList = document.getElementById('quick-list');
    const searchInput = document.getElementById('quick-search');

    function renderQuickList(items) {
        quickList.innerHTML = items.map(item => `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px; padding:8px; border:1px solid #eee; border-radius:6px; cursor:pointer; hover:bg-gray-50;" onclick='window.quickAdd(${JSON.stringify(item)})'>
                <img src="${item.image}" style="width:40px; height:40px; border-radius:4px; object-fit:cover;">
                <div style="flex:1;">
                    <div style="font-weight:600; font-size:0.9rem;">${item.name}</div>
                    <div style="font-size:0.8rem; color:#666;">₹${item.price}/${item.unit}</div>
                </div>
                <div style="font-size:1.2rem; color:#059669;">+</div>
            </div>
        `).join('');
    }

    // Initial Render
    renderQuickList(MASTER_LIST);

    // Filter Logic
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = MASTER_LIST.filter(item => item.name.toLowerCase().includes(term));
            renderQuickList(filtered);
        });
    }

    // 2. Listen for Products
    const listBody = document.getElementById('product-list-body');
    const dbBanner = document.getElementById('db-error-banner');

    onSnapshot(collection(db, 'products'), (snapshot) => {
        dbBanner.style.display = 'none'; // Hide error if successful

        if (snapshot.empty) {
            listBody.innerHTML = '<tr><td colspan="4" style="padding:20px; text-align:center; color:#666;">No items in shop. Click items on the right to add them! 👉</td></tr>';
            return;
        }

        listBody.innerHTML = '';
        snapshot.forEach(docSnap => {
            const p = docSnap.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding:10px;"><img src="${p.image}" style="width:40px; height:40px; border-radius:4px;"></td>
                <td style="padding:10px;">${p.name}</td>
                <td style="padding:10px;">₹${p.price}/${p.unit}</td>
                <td style="padding:10px;"><button onclick="window.deleteItem('${docSnap.id}')" style="color:red; background:none; border:none; cursor:pointer;">🗑️</button></td>
            `;
            listBody.appendChild(tr);
        });

    }, (error) => {
        // Error Handler for Snapshot
        console.error("Snapshot Error:", error);
        if (error.message.includes("permissions") || error.code === 'permission-denied') {
            dbBanner.style.display = 'block'; // Show bright red banner
        }
    });

    // 3. Custom Form Logic
    document.getElementById('custom-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const p = {
            name: document.getElementById('c-name').value,
            category: document.getElementById('c-cat').value,
            price: Number(document.getElementById('c-price').value),
            unit: document.getElementById('c-unit').value,
            image: document.getElementById('c-img').value,
            createdAt: new Date()
        };
        try {
            await addDoc(collection(db, 'products'), p);
            document.getElementById('product-modal').style.display = 'none';
            alert("Added!");
        } catch (err) {
            alert("Error: " + err.message);
        }
    });
}

// Global Functions
window.handleLogout = () => signOut(auth);

window.quickAdd = async (item) => {
    try {
        await addDoc(collection(db, 'products'), { ...item, createdAt: new Date() });
    } catch (err) {
        if (err.message.includes("permission")) {
            alert("⚠️ STOP: Your Database is Locked.\n\nLook at the RED BANNER at the top of the dashboard for the fix functionality.");
        } else {
            console.error(err);
        }
    }
};

window.deleteItem = async (id) => {
    if (confirm("Delete?")) {
        try {
            await deleteDoc(doc(db, 'products', id));
        } catch (err) {
            alert("Error: " + err.message);
        }
    }
};
