require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3044;

// Middleware
app.use(cors());
app.use(express.json());

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
app.post('/api/products', async (req, res) => {
  const { sku, name, category_id, price, quantity, status } = req.body;
  if (!sku || !name) {
    return res.status(400).json({ error: 'SKU and Name are required.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO products (sku, name, category_id, price, quantity, status) VALUES (?, ?, ?, ?, ?, ?)',
      [sku, name, category_id || null, price || 0, quantity || 0, status || 'active']
    );
    res.status(201).json({
      message: 'Product created successfully',
      productId: result.insertId
    });
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
