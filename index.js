const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// 1. Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'codealpha_store'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL Database!');
});

// Visitor Counter Middleware
app.use((req, res, next) => {
    db.query("UPDATE visits SET count = count + 1 WHERE id = 1");
    next();
});

// 2. Page Routes (GET)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'views', 'about.html')));
app.get('/shop', (req, res) => res.sendFile(path.join(__dirname, 'views', 'shop.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'views', 'register.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(__dirname, 'views', 'cart.html')));
app.get('/product-details', (req, res) => res.sendFile(path.join(__dirname, 'views', 'product-details.html')));
app.get('/checkout', (req, res) => res.sendFile(path.join(__dirname, 'views', 'checkout.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'views', 'contact.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));

// 3. API Routes
// Stats API
app.get('/api/stats', (req, res) => {
    const query = `
        SELECT 
            (SELECT count FROM visits WHERE id = 1) as total_visitors,
            (SELECT COUNT(*) FROM orders) as total_orders,
            (SELECT COUNT(*) FROM orders WHERE status = 'Completed') as completed_orders,
            (SELECT COUNT(*) FROM messages) as total_msg
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: "DB Error" });
        res.json(results[0]);
    });
});

// Products API
app.get('/api/products', (req, res) => {
    db.query("SELECT * FROM products", (err, results) => res.json(results));
});

app.delete('/api/delete-product/:id', (req, res) => {
    db.query("DELETE FROM products WHERE id=?", [req.params.id], (err, r) => res.json({msg: "Deleted"}));
});

// Messages API
app.get('/api/messages', (req, res) => {
    db.query("SELECT * FROM messages", (err, results) => res.json(results));
});

app.delete('/api/delete-message/:id', (req, res) => {
    db.query("DELETE FROM messages WHERE id = ?", [req.params.id], (err, result) => {
        if (err) res.status(500).json({ error: "DB Error" });
        else res.json({ message: "Deleted" });
    });
});

// Forms POST Routes
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.query("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, results) => {
        if (results.length > 0) {
            res.json({ message: "Login Successful!" });
        } else {
            res.json({ message: "Invalid email or password" });
        }
    });
});

app.post('/register', (req, res) => {
    const { email, password } = req.body;
    db.query("INSERT INTO users (email, password) VALUES (?, ?)", [email, password], (err, result) => {
        res.json({ message: "Registration Successful!" });
    });
});

app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;
    db.query("INSERT INTO messages (name, email, message) VALUES (?, ?, ?)", [name, email, message], (err, result) => {
        res.json({ message: "Message sent!" });
    });
});

// Get Orders API
app.get('/api/orders', (req, res) => {
    db.query("SELECT * FROM orders", (err, results) => {
        if (err) return res.status(500).json({ error: "DB Error" });
        res.json(results);
    });
});

// Update Order Status API (Edit)
app.put('/api/update-order/:id', (req, res) => {
    const { status } = req.body;
    db.query("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: "DB Error" });
        res.json({ message: "Order updated successfully" });
    });
});

// Checkout API Route to save orders
app.post('/api/checkout', (req, res) => {
    const { customer_name, total_price } = req.body;
    const status = 'Pending';

    const query = "INSERT INTO orders (customer_name, total_price, status) VALUES (?, ?, ?)";
    db.query(query, [customer_name, total_price, status], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database Error during checkout" });
        }
        res.json({ message: "Order placed successfully!" });
    });
});

// Newsletter Subscription API
app.post('/api/subscribe', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    db.query("INSERT INTO subscribers (email) VALUES (?)", [email], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Subscription failed or email already exists" });
        }
        res.json({ message: "Subscribed successfully!" });
    });
});

// 4. Server Start
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});