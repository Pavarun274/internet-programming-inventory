/* global __dirname */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3044;

// Middleware
app.use(cors());
app.use(express.json());

// Uploaded product images — served statically from /uploads
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

const ALLOWED_IMAGE_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    // Random filename — never trust the client-supplied name, which could
    // contain path segments or collide with an existing file.
    filename: (req, file, cb) => {
      const ext = ALLOWED_IMAGE_TYPES[file.mimetype];
      cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES[file.mimetype]) {
      return cb(new Error('Only JPEG, PNG, or WEBP images are allowed.'));
    }
    cb(null, true);
  },
});

// Shared secret the app embeds at build time; blocks requests that don't come
// from our own client instead of leaving write routes open to anyone.
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

function requireApiKey(req, res, next) {
  if (req.user && req.user.role === 'user') {
    return res.status(403).json({ error: 'Forbidden: Standard users cannot create, edit, or delete inventory' });
  }
  if (req.user && req.user.role !== 'user') {
    return next();
  }
  if (!API_KEY || req.header('x-api-key') !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
  }
  next();
}

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Authentication token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Optional JWT Middleware — attaches req.user if a valid token is provided
function optionalAuthenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (!err && user) {
      req.user = user;
    }
    next();
  });
}

// RBAC Middleware: Restrict access to financial data (blocks 'user' role)
function requireFinancialAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }
  if (req.user.role === 'user') {
    return res.status(403).json({ error: 'Forbidden: Insufficient permissions to access financial data' });
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
      test: rows[0].solution,
      _debugDeployMarker: 'v2'
    });
  } catch (error) {
    res.status(500).json({
      db_status: 'error',
      message: error.message
    });
  }
});

// POST register a new user — DISABLED
app.post('/api/auth/register', (req, res) => {
  return res.status(403).json({
    error: 'Public registration is disabled. Please contact an administrator to obtain an account.',
  });
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

// POST upload a product image, returns the URL to store on the product
app.post('/api/upload', requireApiKey, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(201).json({ url });
  });
});

// GET all products — strips price field when requested by a 'user' role account
app.get('/api/products', optionalAuthenticateToken, async (req, res) => {
  try {
    const isUserRole = req.user && req.user.role === 'user';
    const [products] = await pool.query('SELECT * FROM products');

    // Ensure price is completely removed from payload sent over wire for 'user' role
    const sanitizedProducts = isUserRole
      ? products.map((p) => {
          const { price, ...rest } = p;
          return rest;
        })
      : products;

    res.json(sanitizedProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single product by id — strips price field when requested by 'user' role
app.get('/api/products/:id', optionalAuthenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const isUserRole = req.user && req.user.role === 'user';
    const [rows] = await pool.query('SELECT * FROM products WHERE product_id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const product = rows[0];
    if (isUserRole) {
      delete product.price;
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET financial metrics & analytics — strictly restricted to non-user roles (Admin)
app.get('/api/finances', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    const [products] = await pool.query('SELECT * FROM products');

    const totalValue = products.reduce(
      (sum, p) => sum + (Number(p.price) || 0) * (Number(p.quantity) || 0),
      0
    );
    const estimatedCost = totalValue * 0.65;
    const potentialProfit = totalValue - estimatedCost;

    res.json({
      status: 'success',
      summary: {
        totalValue,
        estimatedCost,
        potentialProfit,
        totalProducts: products.length,
      },
      monthlySales: [
        { month: 'Jan', s1: 65000, s2: 50000, s3: 30000, total2026: 145000, total2025: 120000 },
        { month: 'Feb', s1: 82000, s2: 65000, s3: 35000, total2026: 182000, total2025: 135000 },
        { month: 'Mar', s1: 75000, s2: 58000, s3: 32000, total2026: 165000, total2025: 150000 },
        { month: 'Apr', s1: 95000, s2: 72000, s3: 43000, total2026: 210000, total2025: 175000 },
        { month: 'May', s1: 110000, s2: 85000, s3: 50000, total2026: 245000, total2025: 190000 },
        { month: 'Jun', s1: 105000, s2: 80000, s3: 45000, total2026: 230000, total2025: 205000 },
        { month: 'Jul', s1: 130000, s2: 98000, s3: 57000, total2026: 285000, total2025: 220000 },
      ],
      dailyTopSellers: [
        {
          date: 'Today (Jul 26)',
          items: [
            { storeId: 's1', productName: 'MacBook Pro 14"', category: 'electronics', qtySold: 8, revenue: 559997 },
            { storeId: 's2', productName: 'Running Shoes Nike', category: 'clothing', qtySold: 15, revenue: 67495 },
            { storeId: 's3', productName: 'Protein Bar Box', category: 'food', qtySold: 24, revenue: 33591 },
          ],
        },
        {
          date: 'Yesterday (Jul 25)',
          items: [
            { storeId: 's1', productName: 'Power Drill Set', category: 'tools', qtySold: 5, revenue: 33248 },
            { storeId: 's2', productName: 'iPhone 16 Pro', category: 'electronics', qtySold: 4, revenue: 153998 },
            { storeId: 's3', productName: 'Organic Coffee Beans', category: 'food', qtySold: 18, revenue: 15743 },
          ],
        },
      ],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add new product
app.post('/api/products', optionalAuthenticateToken, requireApiKey, async (req, res) => {
  if (req.user && req.user.role === 'user') {
    return res.status(403).json({ error: 'Forbidden: Standard users cannot create products or set pricing' });
  }

  const { sku, name, category_id, price, quantity, status, image, supplier, min_quantity } = req.body;
  if (!sku || !name) {
    return res.status(400).json({ error: 'SKU and Name are required.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO products (sku, name, category_id, price, quantity, status, image, supplier, min_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [sku, name, category_id || null, price || 0, quantity || 0, status || 'active', image || null, supplier || null, min_quantity || 0]
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
app.put('/api/products/:id', optionalAuthenticateToken, requireApiKey, async (req, res) => {
  if (req.user && req.user.role === 'user') {
    return res.status(403).json({ error: 'Forbidden: Standard users cannot update products or pricing' });
  }

  const { id } = req.params;
  const { sku, name, category_id, price, quantity, status, image, supplier, min_quantity } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE products SET sku = ?, name = ?, category_id = ?, price = ?, quantity = ?, status = ?, image = ?, supplier = ?, min_quantity = ? WHERE product_id = ?',
      [sku, name, category_id || null, price || 0, quantity || 0, status || 'active', image || null, supplier || null, min_quantity || 0, id]
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
app.delete('/api/products/:id', optionalAuthenticateToken, requireApiKey, async (req, res) => {
  if (req.user && req.user.role === 'user') {
    return res.status(403).json({ error: 'Forbidden: Standard users cannot delete products' });
  }

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

// GET all stores
app.get('/api/stores', async (req, res) => {
  try {
    const [stores] = await pool.query('SELECT * FROM stores');
    res.json(stores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add new store
app.post('/api/stores', requireApiKey, async (req, res) => {
  const { name, type, address, manager, phone, status } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO stores (name, type, address, manager, phone, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, type || null, address || null, manager || null, phone || null, status || 'Operational']
    );
    res.status(201).json({
      message: 'Store created successfully',
      storeId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update existing store
app.put('/api/stores/:id', requireApiKey, async (req, res) => {
  const { id } = req.params;
  const { name, type, address, manager, phone, status } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE stores SET name = ?, type = ?, address = ?, manager = ?, phone = ?, status = ? WHERE store_id = ?',
      [name, type || null, address || null, manager || null, phone || null, status || 'Operational', id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json({ message: 'Store updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE store
app.delete('/api/stores/:id', requireApiKey, async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM stores WHERE store_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json({ message: 'Store deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all product-store allocations
app.get('/api/product-stores', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM product_stores');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT replace a product's full store allocation
// Body: { stores: [{ store_id, quantity }, ...] }
app.put('/api/products/:id/stores', requireApiKey, async (req, res) => {
  const { id } = req.params;
  const { stores } = req.body;
  if (!Array.isArray(stores)) {
    return res.status(400).json({ error: '"stores" must be an array.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM product_stores WHERE product_id = ?', [id]);
    for (const s of stores) {
      if (!s.store_id) continue;
      await conn.query(
        'INSERT INTO product_stores (product_id, store_id, quantity) VALUES (?, ?, ?)',
        [id, s.store_id, s.quantity || 0]
      );
    }
    await conn.commit();
    res.json({ message: 'Product store allocation updated successfully' });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

// GET all stock movements (newest first, joined for display)
app.get('/api/stock-movements', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT sm.*, p.name AS product_name, u.username
       FROM stock_movements sm
       LEFT JOIN products p ON p.product_id = sm.product_id
       LEFT JOIN users u ON u.user_id = sm.user_id
       ORDER BY sm.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET most recent transactions (stock movements joined with product + user
// display info). ?limit= (default 10, max 100) and ?type= (in|out|adjust).
app.get('/api/transactions/recent', async (req, res) => {
  let limit = parseInt(req.query.limit, 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 10;
  limit = Math.min(limit, 100);

  const { type } = req.query;
  if (type !== undefined && !['in', 'out', 'adjust'].includes(type)) {
    return res.status(400).json({ error: 'type must be one of: in, out, adjust.' });
  }

  try {
    const params = [];
    let query = `
      SELECT sm.movement_id, sm.created_at, sm.type, sm.quantity, sm.note,
             sm.product_id, p.sku, p.name AS product_name, p.image AS product_image,
             sm.user_id, u.username AS user_name
      FROM stock_movements sm
      INNER JOIN products p ON p.product_id = sm.product_id
      LEFT JOIN users u ON u.user_id = sm.user_id
    `;
    if (type) {
      query += ' WHERE sm.type = ?';
      params.push(type);
    }
    query += ' ORDER BY sm.created_at DESC, sm.movement_id DESC LIMIT ?';
    params.push(limit);

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST record a new stock movement
app.post('/api/stock-movements', requireApiKey, async (req, res) => {
  const { product_id, user_id, type, quantity, note } = req.body;
  if (!product_id || !user_id || !type || quantity === undefined) {
    return res.status(400).json({ error: 'product_id, user_id, type, and quantity are required.' });
  }
  if (!['in', 'out', 'adjust'].includes(type)) {
    return res.status(400).json({ error: 'type must be one of: in, out, adjust.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO stock_movements (product_id, user_id, type, quantity, note) VALUES (?, ?, ?, ?, ?)',
      [product_id, user_id, type, quantity, note || null]
    );
    res.status(201).json({
      message: 'Stock movement recorded successfully',
      movementId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// In-memory system settings state with defaults
let systemSettings = {
  notificationsEnabled: true,
  lowStockAlerts: true,
  showStatusIndicator: true,
  currencySymbol: '฿',
  currencyCode: 'THB',
  cogsRatio: 0.65,
  profitMarginTarget: 0.35,
  allowDatabaseReset: true,
  serverEnvironment: process.env.NODE_ENV || 'development',
};

// GET settings — strips financial and administrative settings for 'user' role
app.get('/api/settings', optionalAuthenticateToken, (req, res) => {
  const isUserRole = req.user && req.user.role === 'user';
  if (isUserRole) {
    const {
      currencySymbol,
      currencyCode,
      cogsRatio,
      profitMarginTarget,
      allowDatabaseReset,
      serverEnvironment,
      ...userSettings
    } = systemSettings;
    return res.json(userSettings);
  }
  res.json(systemSettings);
});

// PUT settings — blocks 'user' role from modifying financial or administrative configurations
app.put('/api/settings', optionalAuthenticateToken, (req, res) => {
  const isUserRole = req.user && req.user.role === 'user';
  const RESTRICTED_KEYS = [
    'currencySymbol',
    'currencyCode',
    'cogsRatio',
    'profitMarginTarget',
    'allowDatabaseReset',
    'serverEnvironment',
    'resetDatabase',
  ];

  if (isUserRole) {
    const attemptedRestrictedKeys = Object.keys(req.body).filter((key) =>
      RESTRICTED_KEYS.includes(key)
    );
    if (attemptedRestrictedKeys.length > 0) {
      return res.status(403).json({
        error: `Forbidden: Standard users cannot modify financial or administrative system settings (${attemptedRestrictedKeys.join(', ')})`,
      });
    }
  }

  // Update allowed fields
  systemSettings = {
    ...systemSettings,
    ...req.body,
  };

  res.json({
    message: 'Settings updated successfully',
    settings: isUserRole
      ? {
          notificationsEnabled: systemSettings.notificationsEnabled,
          lowStockAlerts: systemSettings.lowStockAlerts,
          showStatusIndicator: systemSettings.showStatusIndicator,
        }
      : systemSettings,
  });
});

// POST reset database endpoint — restricted strictly to non-user (Admin) roles
app.post('/api/settings/reset-database', authenticateToken, requireFinancialAccess, async (req, res) => {
  res.json({
    status: 'success',
    message: 'System database reset initiated successfully',
  });
});

// Start Server if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`=================================`);
  });
}

module.exports = {
  app,
  pool,
  authenticateToken,
  optionalAuthenticateToken,
  requireFinancialAccess,
};
