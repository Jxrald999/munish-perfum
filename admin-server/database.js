const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'munish.db');

let db;

function getDB() {
  if (db) return db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initSchema();
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      brand TEXT,
      genero TEXT,
      familia_olfativa TEXT,
      descripcion TEXT,
      notas_salida TEXT,
      notas_corazon TEXT,
      notas_fondo TEXT,
      ocasion TEXT,
      duracion TEXT,
      estacion TEXT,
      full_bottle_price REAL,
      price50ml REAL,
      price100ml REAL,
      decant_2ml REAL DEFAULT 1200,
      decant_3ml REAL DEFAULT 1600,
      decant_5ml REAL DEFAULT 2100,
      decant_10ml REAL DEFAULT 4000,
      stock INTEGER DEFAULT 0,
      image TEXT,
      gallery TEXT,
      is_active INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      meta_title TEXT,
      meta_description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT,
      customer_email TEXT,
      customer_phone TEXT,
      id_number TEXT,
      province TEXT,
      canton TEXT,
      district TEXT,
      address TEXT,
      notes TEXT,
      items TEXT,
      subtotal REAL DEFAULT 0,
      shipping REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'sinpe',
      payment_reference TEXT,
      payment_status TEXT DEFAULT 'pending',
      status TEXT DEFAULT 'pending',
      tracking_company TEXT,
      tracking_number TEXT,
      tracking_url TEXT,
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

module.exports = { getDB };
