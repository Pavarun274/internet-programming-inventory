require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3044;

// Middleware
app.use(cors());
app.use(express.json());

// Shared secret the app embeds at build time; blocks requests that don't come
// from our own client instead of leaving write routes open to anyone.
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

function requireApiKey(req, res, next) {
  if (!API_KEY || req.header('x-api-key') !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// MySQL Connection Pool Configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'std6730202700',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ip_std6730202700',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Root Route
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: `Inventory Backend API Server is running on port ${PORT}`,
    timestamp: new Date()
  });
});

// Test Database Connection Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS solution');
    res.json({
      db_status: 'connected',
      test: rows[0].solution
    });
  } catch (error) {
    res.status(500).json({
      db_status: 'error',
      message: error.message
    });
  }
});

// POST register a new user
app.post('/api/auth/register', requireApiKey, async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required.' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT user_id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username or email is already taken.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, passwordHash, 'staff']
    );

    const token = jwt.sign(
      { user_id: result.insertId, username, role: 'staff' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({
      token,
      user: { user_id: result.insertId, username, email, role: 'staff' },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST log in an existing user
app.post('/api/auth/login', requireApiKey, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { user_id: user.user_id, username: user.username, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all categories
app.get('/api/categories', async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all products
app.get('/api/products', async (req, res) => {
  try {
    const [products] = await pool.query('SELECT * FROM products');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add new product
app.post('/api/products', requireApiKey, async (req, res) => {
  const { sku, name, category_id, price, quantity, status, image, supplier } = req.body;
  if (!sku || !name) {
    return res.status(400).json({ error: 'SKU and Name are required.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO products (sku, name, category_id, price, quantity, status, image, supplier) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [sku, name, category_id || null, price || 0, quantity || 0, status || 'active', image || null, supplier || null]
    );
    res.status(201).json({
      message: 'Product created successfully',
      productId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update existing product
app.put('/api/products/:id', requireApiKey, async (req, res) => {
  const { id } = req.params;
  const { sku, name, category_id, price, quantity, status, image, supplier } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE products SET sku = ?, name = ?, category_id = ?, price = ?, quantity = ?, status = ?, image = ?, supplier = ? WHERE product_id = ?',
      [sku, name, category_id || null, price || 0, quantity || 0, status || 'active', image || null, supplier || null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE product
app.delete('/api/products/:id', requireApiKey, async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM products WHERE product_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`=================================`);
});
