let allProducts = [];

document.addEventListener("DOMContentLoaded", () => {
    // ** Admin Panel Authentication Check **
    if (document.getElementById('section-dashboard')) {
        if (localStorage.getItem('isAdminLoggedIn') !== 'true') {
            alert("Please login first to access the admin panel!");
            window.location.href = '/login';
            return;
        }
        loadDashboard();
    }

    if (document.getElementById('product-grid')) fetchAllProducts();
    if (document.getElementById('cart-items')) loadCart();
    updateCartCount();

    // Typewriter Effect for Black Friday
    const head = document.querySelector(".typewriter");
    if (head) {
        let i = 0;
        const text = "BLACK FRIDAY";
        function type() { 
            if (i < text.length) { 
                head.textContent += text.charAt(i++); 
                setTimeout(type, 150); 
            } 
        }
        type();
    }

    // ** NEWSLETTER SUBSCRIPTION **
    const subForm = document.getElementById('subscribe-form');
    if (subForm) {
        subForm.onsubmit = async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('sub-email');
            const email = emailInput ? emailInput.value : '';

            try {
                const response = await fetch('/api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const result = await response.json();
                alert(result.message);
                if (response.ok) {
                    emailInput.value = '';
                }
            } catch (err) {
                console.error("Subscription Error:", err);
            }
        };
    }
});

async function fetchAllProducts() {
    try {
        const res = await fetch('/api/products');
        allProducts = await res.json();
        renderProducts(allProducts);
    } catch (err) { 
        console.error("Error fetching products:", err); 
    }
}

function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    if (items.length === 0) {
        grid.innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>No products found.</p>";
        return;
    }

    items.forEach((p) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.cssText = "border: 1px solid #ddd; padding: 15px; border-radius: 10px; text-align: center; background: #fff;";

        card.innerHTML = `
            <img src="${p.image_url || ''}" alt="${p.name}" style="width:100%; height:200px; object-fit:cover; border-radius:5px;">
            <h3>${p.name}</h3>
            <p>Price: $${p.price}</p>
        `;

        // 1. View Details Button
        const detailsBtn = document.createElement('button');
        detailsBtn.innerText = "View Details";
        detailsBtn.style.cssText = "background:#333; color:#fff; padding:8px; width:100%; border:none; border-radius:5px; cursor:pointer; margin-top: 10px;";
        detailsBtn.onclick = () => {
            viewProductDetails(p);
        };

        // 2. Add to Cart Button
        const cartBtn = document.createElement('button');
        cartBtn.innerText = "Add to Cart";
        cartBtn.style.cssText = "background:#000; color:#fff; padding:10px; width:100%; border:none; border-radius:5px; cursor:pointer; margin-top: 8px;";
        cartBtn.onclick = () => {
            addToCart(p.name, p.price, p.image_url);
        };

        card.appendChild(detailsBtn);
        card.appendChild(cartBtn);
        grid.appendChild(card);
    });
}

// ** VIEW DETAILS FUNCTION **
function viewProductDetails(p) {
    localStorage.setItem('selectedProduct', JSON.stringify(p));
    window.location.href = '/product-details'; 
}

// ** SEARCH FUNCTION **
function performSearch(query) {
    const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase())
    );
    renderProducts(filtered);
}

// ** CATEGORY FILTER FUNCTION **
function filterProducts(category) {
    if (category === 'all') {
        renderProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => 
            p.category && p.category.toLowerCase() === category.toLowerCase()
        );
        renderProducts(filtered);
    }
}

// ** CART LOAD & TOTAL PRICE CALCULATION **
function loadCart() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const container = document.getElementById('cart-items');
    if (!container) return;
    
    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = "<p>Your cart is empty.</p>";
        const totalEl = document.getElementById('cart-total');
        if (totalEl) totalEl.innerText = "$0.00";
        return;
    }

    cart.forEach((item, index) => {
        total += Number(item.price);
        container.innerHTML += `
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid #ddd; padding-bottom:10px;">
                <img src="${item.img || ''}" style="width:50px; height:50px; object-fit:cover; border-radius:5px;">
                <h4>${item.name}</h4>
                <p>$${item.price}</p>
                <button onclick="removeFromCart(${index})" style="background:red; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Remove</button>
            </div>
        `;
    });

    const totalEl = document.getElementById('cart-total');
    if (totalEl) {
        totalEl.innerText = "$" + total.toFixed(2);
    }
}

// ** REMOVE FROM CART **
window.removeFromCart = (index) => {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
    updateCartCount();
};

// ** CHECKOUT FUNCTION **
async function checkoutOrder() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    let total_price = cart.reduce((sum, item) => sum + Number(item.price), 0);
    let customer_name = prompt("Enter your name for the order:") || "Guest";

    try {
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer_name, total_price, items: cart })
        });
        
        const result = await response.json();
        alert(result.message);
        
        if(response.ok) {
            localStorage.removeItem('cart'); 
            updateCartCount();
            window.location.href = '/shop'; 
        }
    } catch (err) {
        console.error("Checkout Error:", err);
    }
}

// ** ADD TO CART & REAL-TIME COUNTING (Active) **
window.addToCart = (name, price, img) => {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.push({ name, price, img });
    localStorage.setItem('cart', JSON.stringify(cart));
    
    updateCartCount();
    alert(name + " added to cart!");
};

function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const countEl = document.getElementById('cart-count');
    if (countEl) {
        countEl.innerText = cart.length;
    }
}

// ** ADMIN PANEL LOAD **
async function loadDashboard() {
    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        
        const visitorsEl = document.getElementById('stat-visitors');
        if (visitorsEl) visitorsEl.innerText = data.total_visitors || 0;

        const ordersEl = document.getElementById('stat-orders');
        if (ordersEl) ordersEl.innerText = data.total_orders || 0;

        const completedEl = document.getElementById('stat-completed');
        if (completedEl) completedEl.innerText = data.completed_orders || 0;

        const msgEl = document.getElementById('stat-msg');
        if (msgEl) msgEl.innerText = data.total_msg || 0;
    } catch (err) { 
        console.error("Admin Load Error:", err); 
    }
}