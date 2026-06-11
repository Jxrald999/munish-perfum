const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
require('dotenv').config();
const expressLayouts = require('express-ejs-layouts');
const { getDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 8000;
const SESSION_SECRET = process.env.SESSION_SECRET || require('crypto').randomBytes(64).toString('hex');
const NODE_ENV = process.env.NODE_ENV || 'development';
const db = getDB();

// ---------- SECURITY HEADERS ----------
app.use(helmet({
  contentSecurityPolicy: false, // Deshabilitado porque usamos CDNs para Bootstrap, Swiper, etc.
  crossOriginEmbedderPolicy: false,
}));

// ---------- CORS ----------
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:8000').split(',');
app.use(cors({
  origin: NODE_ENV === 'production' ? ALLOWED_ORIGINS : '*',
  credentials: true,
}));

// ---------- RATE LIMITING ----------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // mÃ¡ximo 10 intentos por ventana
  message: { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: 'Demasiadas peticiones.' },
});

// ---------- MIDDLEWARE ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');
app.use(expressLayouts);
app.use((req, res, next) => {
  res.locals.user = req.session?.userName || null;
  res.locals.path = req.path;
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------- SESSION (segura) ----------
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'lax',
  }
}));

// ---------- FILE UPLOAD CON VALIDACIÃ“N ----------
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const storage = multer.diskStorage({
  destination: path.join(__dirname, 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Tipo de archivo no permitido. Solo imágenes (JPEG, PNG, WebP, GIF).'), false);
    }
    cb(null, true);
  }
});

// ---------- AUTH MIDDLEWARE ----------
function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

function redirectIfAuth(req, res, next) {
  if (req.session.userId) return res.redirect('/');
  next();
}

// ---------- API HELPER ----------
function getProductImage(product) {
  if (!product || !product.image) return '/static/img/placeholder.svg';
  if (product.image.startsWith('http')) return product.image;
  return '/api/images/' + product.image;
}

// Make helper available in all views
app.locals.getProductImage = getProductImage;

// ---------- INPUT SANITIZATION ----------
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+="[^"]*"/gi, '')
            .replace(/on\w+='[^']*'/gi, '')
            .trim();
}

function sanitizeObject(obj, fields) {
  const clean = { ...obj };
  fields.forEach(f => { if (typeof clean[f] === 'string') clean[f] = sanitize(clean[f]); });
  return clean;
}

// ---------- AUTH ROUTES ----------
app.get('/login', redirectIfAuth, (req, res) => {
  res.render('auth/login', { error: null });
});

app.post('/login', loginLimiter, redirectIfAuth, (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.render('auth/login', { error: 'Credenciales inválidas' });
  }
  req.session.userId = user.id;
  req.session.userName = user.name;
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// ---------- DASHBOARD ----------
app.get('/', requireAuth, (req, res) => {
  const totalProducts = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  const activeProducts = db.prepare('SELECT COUNT(*) as c FROM products WHERE is_active = 1').get().c;
  const featuredProducts = db.prepare('SELECT COUNT(*) as c FROM products WHERE is_featured = 1').get().c;
  const lowStock = db.prepare('SELECT COUNT(*) as c FROM products WHERE stock <= 5 AND stock > 0').get().c;
  const outOfStock = db.prepare('SELECT COUNT(*) as c FROM products WHERE stock <= 0').get().c;
  const totalOrders = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  const pendingOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'").get().c;
  const revenue = db.prepare("SELECT COALESCE(SUM(total), 0) as c FROM orders WHERE status IN ('confirmed','processing','shipped','delivered')").get().c;

  const recentOrders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5').all();
  const recentProducts = db.prepare('SELECT * FROM products ORDER BY created_at DESC LIMIT 5').all();

  res.render('dashboard', {
    user: req.session.userName,
    totalProducts, activeProducts, featuredProducts,
    lowStock, outOfStock, totalOrders, pendingOrders, revenue,
    recentOrders, recentProducts, getProductImage
  });
});

// ---------- PRODUCTS ----------
app.get('/products', requireAuth, (req, res) => {
  const search = req.query.search || '';
  const genero = req.query.genero || '';
  const familia = req.query.familia || '';
  const stockFilter = req.query.stock || '';

  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (search) { sql += ' AND (title LIKE ? OR brand LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (genero) { sql += ' AND genero = ?'; params.push(genero); }
  if (familia) { sql += ' AND familia_olfativa = ?'; params.push(familia); }
  if (stockFilter === 'low') { sql += ' AND stock <= 5 AND stock > 0'; }
  if (stockFilter === 'out') { sql += ' AND stock <= 0'; }

  sql += ' ORDER BY created_at DESC';
  const products = db.prepare(sql).all(...params);

  res.render('products/index', { user: req.session.userName, products, getProductImage, search, genero, familia, stockFilter });
});

app.get('/products/create', requireAuth, (req, res) => {
  res.render('products/form', { user: req.session.userName, product: null, errors: {} });
});

app.post('/products/create', requireAuth, upload.single('image'), (req, res) => {
  let { title, brand, genero, familia_olfativa, descripcion, notas_salida, notas_corazon, notas_fondo, ocasion, duracion, estacion, price50ml, price100ml, full_bottle_price, decant_2ml, decant_3ml, decant_5ml, decant_10ml, stock, is_active, is_featured, meta_title, meta_description } = req.body;

  // Sanitizar inputs de texto para prevenir XSS
  const sanitized = sanitizeObject({ title, brand, descripcion, notas_salida, notas_corazon, notas_fondo, ocasion, duracion, estacion, meta_title, meta_description },
    ['title', 'brand', 'descripcion', 'notas_salida', 'notas_corazon', 'notas_fondo', 'ocasion', 'duracion', 'estacion', 'meta_title', 'meta_description']);
  title = sanitized.title; brand = sanitized.brand; descripcion = sanitized.descripcion;
  notas_salida = sanitized.notas_salida; notas_corazon = sanitized.notas_corazon; notas_fondo = sanitized.notas_fondo;
  ocasion = sanitized.ocasion; duracion = sanitized.duracion; estacion = sanitized.estacion;
  meta_title = sanitized.meta_title; meta_description = sanitized.meta_description;

  if (!title || title.trim().length < 2) {
    return res.render('products/form', { user: req.session.userName, product: req.body, errors: { title: 'El nombre es requerido (mín. 2 caracteres)' } });
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const image = req.file ? req.file.filename : null;

  db.prepare(`INSERT INTO products (title, slug, brand, genero, familia_olfativa, descripcion, notas_salida, notas_corazon, notas_fondo, ocasion, duracion, estacion, price50ml, price100ml, full_bottle_price, decant_2ml, decant_3ml, decant_5ml, decant_10ml, stock, image, is_active, is_featured, meta_title, meta_description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    title, slug, brand, genero, familia_olfativa, descripcion, notas_salida, notas_corazon, notas_fondo, ocasion, duracion, estacion,
    price50ml || 0, price100ml || 0, full_bottle_price || 0, decant_2ml || 1200, decant_3ml || 1600, decant_5ml || 2100, decant_10ml || 4000,
    stock || 0, image, is_active ? 1 : 0, is_featured ? 1 : 0, meta_title, meta_description
  );

  res.redirect('/products');
});

app.get('/products/:id/edit', requireAuth, (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.redirect('/products');
  res.render('products/form', { user: req.session.userName, product, errors: {} });
});

app.post('/products/:id/edit', requireAuth, upload.single('image'), (req, res) => {
  let { title, brand, genero, familia_olfativa, descripcion, notas_salida, notas_corazon, notas_fondo, ocasion, duracion, estacion, price50ml, price100ml, full_bottle_price, decant_2ml, decant_3ml, decant_5ml, decant_10ml, stock, is_active, is_featured, meta_title, meta_description } = req.body;

  // Sanitizar inputs de texto para prevenir XSS
  const sanitized = sanitizeObject({ title, brand, descripcion, notas_salida, notas_corazon, notas_fondo, ocasion, duracion, estacion, meta_title, meta_description },
    ['title', 'brand', 'descripcion', 'notas_salida', 'notas_corazon', 'notas_fondo', 'ocasion', 'duracion', 'estacion', 'meta_title', 'meta_description']);
  title = sanitized.title; brand = sanitized.brand; descripcion = sanitized.descripcion;
  notas_salida = sanitized.notas_salida; notas_corazon = sanitized.notas_corazon; notas_fondo = sanitized.notas_fondo;
  ocasion = sanitized.ocasion; duracion = sanitized.duracion; estacion = sanitized.estacion;
  meta_title = sanitized.meta_title; meta_description = sanitized.meta_description;

  if (!title || title.trim().length < 2) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    return res.render('products/form', { user: req.session.userName, product: { ...product, ...req.body }, errors: { title: 'El nombre es requerido' } });
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let imageSql = '';
  const params = [];

  if (req.file) {
    imageSql = ', image = ?';
    params.push(req.file.filename);
  }

  params.push(title, slug, brand, genero, familia_olfativa, descripcion, notas_salida, notas_corazon, notas_fondo, ocasion, duracion, estacion,
    price50ml || 0, price100ml || 0, full_bottle_price || 0, decant_2ml || 1200, decant_3ml || 1600, decant_5ml || 2100, decant_10ml || 4000,
    stock || 0, is_active ? 1 : 0, is_featured ? 1 : 0, meta_title, meta_description, req.params.id);

  db.prepare(`UPDATE products SET title = ?, slug = ?, brand = ?, genero = ?, familia_olfativa = ?, descripcion = ?,
    notas_salida = ?, notas_corazon = ?, notas_fondo = ?, ocasion = ?, duracion = ?, estacion = ?,
    price50ml = ?, price100ml = ?, full_bottle_price = ?, decant_2ml = ?, decant_3ml = ?, decant_5ml = ?, decant_10ml = ?,
    stock = ?, is_active = ?, is_featured = ?, meta_title = ?, meta_description = ?${imageSql}
    WHERE id = ?`).run(...params);

  res.redirect('/products');
});

app.post('/products/:id/delete', requireAuth, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.redirect('/products');
});

app.post('/products/bulk', requireAuth, (req, res) => {
  const { ids, action } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) return res.redirect('/products');

  const placeholders = ids.map(() => '?').join(',');
  if (action === 'activate') db.prepare(`UPDATE products SET is_active = 1 WHERE id IN (${placeholders})`).run(...ids);
  if (action === 'deactivate') db.prepare(`UPDATE products SET is_active = 0 WHERE id IN (${placeholders})`).run(...ids);
  if (action === 'feature') db.prepare(`UPDATE products SET is_featured = 1 WHERE id IN (${placeholders})`).run(...ids);
  if (action === 'delete') db.prepare(`DELETE FROM products WHERE id IN (${placeholders})`).run(...ids);

  res.redirect('/products');
});

// ---------- ORDERS ----------
app.get('/orders', requireAuth, (req, res) => {
  const status = req.query.status || '';
  let sql = 'SELECT * FROM orders WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC';
  const orders = db.prepare(sql).all(...params);
  res.render('orders/index', { user: req.session.userName, orders, currentStatus: status });
});

app.get('/orders/:id', requireAuth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.redirect('/orders');
  res.render('orders/edit', { user: req.session.userName, order });
});

app.post('/orders/:id', requireAuth, (req, res) => {
  const { status, payment_status, tracking_company, tracking_number, tracking_url, admin_notes } = req.body;
  db.prepare(`UPDATE orders SET status = ?, payment_status = ?, tracking_company = ?, tracking_number = ?, tracking_url = ?, admin_notes = ? WHERE id = ?`)
    .run(status, payment_status, tracking_company, tracking_number, tracking_url, admin_notes, req.params.id);
  res.redirect('/orders');
});

// ---------- EXPORT ----------
app.get('/export/products', requireAuth, (req, res) => {
  const products = db.prepare('SELECT * FROM products WHERE is_active = 1').all();
  const json = products.map(p => ({
    id: p.slug,
    name: p.title,
    brand: p.brand,
    genero: p.genero,
    familia_olfativa: p.familia_olfativa,
    descripcion: (p.descripcion || '').replace(/<[^>]*>/g, ''),
    notas_salida: p.notas_salida ? p.notas_salida.split(',').map(s => s.trim()) : [],
    notas_corazon: p.notas_corazon ? p.notas_corazon.split(',').map(s => s.trim()) : [],
    notas_fondo: p.notas_fondo ? p.notas_fondo.split(',').map(s => s.trim()) : [],
    ocasion: p.ocasion ? p.ocasion.split(',').map(s => s.trim()) : [],
    duracion: p.duracion,
    estacion: p.estacion ? p.estacion.split(',').map(s => s.trim()) : [],
    full_bottle_price: p.full_bottle_price || 0,
    price50ml: p.price50ml || 0,
    price100ml: p.price100ml || 0,
    decant_prices: { '2ml': p.decant_2ml || 0, '3ml': p.decant_3ml || 0, '5ml': p.decant_5ml || 0, '10ml': p.decant_10ml || 0 },
    stock: p.stock,
    image: getProductImage(p),
  }));
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=products-export.json`);
  res.json(json);
});

// ---------- PUBLIC API (CORS for frontend + rate limiting) ----------
app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, apiLimiter);

app.get('/api/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC').all();
  const json = products.map(p => ({
    id: p.slug,
    name: p.title,
    brand: p.brand,
    genero: p.genero,
    familia_olfativa: p.familia_olfativa,
    descripcion: (p.descripcion || '').replace(/<[^>]*>/g, ''),
    notas_salida: p.notas_salida ? p.notas_salida.split(',').map(s => s.trim()) : [],
    notas_corazon: p.notas_corazon ? p.notas_corazon.split(',').map(s => s.trim()) : [],
    notas_fondo: p.notas_fondo ? p.notas_fondo.split(',').map(s => s.trim()) : [],
    ocasion: p.ocasion ? p.ocasion.split(',').map(s => s.trim()) : [],
    duracion: p.duracion,
    estacion: p.estacion ? p.estacion.split(',').map(s => s.trim()) : [],
    full_bottle_price: p.full_bottle_price || 0,
    price50ml: p.price50ml || 0,
    price100ml: p.price100ml || 0,
    decant_prices: { '2ml': p.decant_2ml || 0, '3ml': p.decant_3ml || 0, '5ml': p.decant_5ml || 0, '10ml': p.decant_10ml || 0 },
    stock: p.stock,
    image: p.image ? '/api/images/' + p.image : '/images/product-item1.jpg',
    gallery: [],
    is_featured: !!p.is_featured,
  }));
  res.json(json);
});

app.get('/api/products/featured', (req, res) => {
  const products = db.prepare('SELECT * FROM products WHERE is_active = 1 AND is_featured = 1 ORDER BY created_at DESC').all();
  const json = products.map(p => ({
    id: p.slug,
    name: p.title,
    brand: p.brand,
    genero: p.genero,
    familia_olfativa: p.familia_olfativa,
    descripcion: (p.descripcion || '').replace(/<[^>]*>/g, ''),
    price50ml: p.price50ml || 0,
    image: p.image ? '/api/images/' + p.image : '/images/product-item1.jpg',
    stock: p.stock,
  }));
  res.json(json);
});

app.get('/api/products/:slug', (req, res) => {
  const p = db.prepare('SELECT * FROM products WHERE slug = ? AND is_active = 1').get(req.params.slug);
  if (!p) return res.status(404).json({ error: 'not found' });
  res.json({
    id: p.slug,
    name: p.title,
    brand: p.brand,
    genero: p.genero,
    familia_olfativa: p.familia_olfativa,
    descripcion: (p.descripcion || '').replace(/<[^>]*>/g, ''),
    notas_salida: p.notas_salida ? p.notas_salida.split(',').map(s => s.trim()) : [],
    notas_corazon: p.notas_corazon ? p.notas_corazon.split(',').map(s => s.trim()) : [],
    notas_fondo: p.notas_fondo ? p.notas_fondo.split(',').map(s => s.trim()) : [],
    ocasion: p.ocasion ? p.ocasion.split(',').map(s => s.trim()) : [],
    duracion: p.duracion,
    estacion: p.estacion ? p.estacion.split(',').map(s => s.trim()) : [],
    full_bottle_price: p.full_bottle_price || 0,
    price50ml: p.price50ml || 0,
    price100ml: p.price100ml || 0,
    decant_prices: { '2ml': p.decant_2ml || 0, '3ml': p.decant_3ml || 0, '5ml': p.decant_5ml || 0, '10ml': p.decant_10ml || 0 },
    stock: p.stock,
    image: p.image ? '/api/images/' + p.image : '/images/product-item1.jpg',
    is_featured: !!p.is_featured,
  });
});

// Proxy images from uploads folder
app.get('/api/images/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    // fallback to frontend images
    const frontendImg = path.join(__dirname, '..', 'images', req.params.filename);
    if (fs.existsSync(frontendImg)) {
      res.sendFile(frontendImg);
    } else {
      res.status(404).send('Image not found');
    }
  }
});

// ---------- STATIC ----------
app.get('/static/img/placeholder.svg', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="#f0f0f0" width="200" height="200"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="#ccc" font-size="14">Sin imagen</text></svg>`);
});

// ---------- START ----------
app.listen(PORT, () => {
  console.log(`✅ Admin: http://localhost:${PORT}`);
  console.log(`✅ Login: http://localhost:${PORT}/login`);
  console.log(`✅ API:  http://localhost:${PORT}/api/products`);
});
