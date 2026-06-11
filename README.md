# Munish Perfum - E-commerce de Fragancias

Tienda online de perfumes premium con sistema de decants, panel admin y API en tiempo real.

## Arquitectura

```
munish/
├── index.html, shop.html...   Frontend estático (HTML + CSS + JS)
├── css/                        Estilos (style.css, cart.css, etc.)
├── js/                         Lógica del frontend
│   ├── api-products.js         → Carga productos desde la API (tiempo real)
│   ├── cart.js                 → Carrito de compras (localStorage)
│   ├── checkout.js             → Proceso de pago (SINPE + WhatsApp)
│   ├── shop.js                 → Motor de tienda con filtros
│   ├── i18n.js                 → Traducciones ES/EN
│   ├── theme.js                → Modo oscuro
│   └── ...
├── images/                     Imágenes de productos
├── admin-server/               Panel admin (Node.js + Express + SQLite)
│   ├── server.js               → API REST + Admin panel
│   ├── serve-frontend.js       → Servidor frontend con proxy a API
│   ├── database.js             → SQLite (better-sqlite3)
│   ├── views/                  → EJS templates del admin
│   └── seed-full.js            → Seed con 38 productos reales
├── go-live.bat                 → Un clic para iniciar todo
└── start.ps1                   → Alternativa PowerShell
```

## Requisitos

- **Node.js 18+** (para el admin server)
- **npm** (viene con Node.js)

## Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd munish-perfum

# 2. Instalar dependencias del admin
cd admin-server
npm install

# 3. Poblar base de datos (admin + 38 productos)
node seed-full.js

# 4. Iniciar servidores
cd ..
go-live.bat
```

## URLs

| Sitio | URL |
|---|---|
| 🏠 Tienda | http://localhost:3000 |
| 🔧 Admin Panel | http://localhost:8000 |
| 📡 API Productos | http://localhost:8000/api/products |

### Credenciales Admin
- **Usuario:** admin
- **Contraseña:** 00207DylanRamirezLopez

## Variables de Entorno

Editar `admin-server/.env`:

| Variable | Descripción | Default |
|---|---|---|
| `NODE_ENV` | development / production | development |
| `PORT` | Puerto del admin server | 8000 |
| `SESSION_SECRET` | Secreto para sesiones | (aleatorio) |
| `ALLOWED_ORIGINS` | CORS permitidos | http://localhost:3000 |

## Scripts (admin-server)

```bash
npm start       # Inicia el admin server
npm run seed    # Poblar DB con datos demo
node seed-full.js   # Poblar DB con 38 productos reales
node serve-frontend.js  # Servir frontend + proxy a API
```

## Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (vanilla) |
| Servidor frontend | Node.js (http nativo) |
| Admin Panel | Express.js + EJS |
| Base de datos | SQLite (better-sqlite3) |
| API REST | Express.js |
| Autenticación | bcrypt + session cookies |
| Seguridad | Helmet, Rate Limiting, CORS, input sanitization |
| Imágenes | Multer (upload) + fallback a /images/ |
| Traducciones | i18n.js (ES/EN) |
| Tema | CSS Variables + theme.js |

## Despliegue en Producción

### Frontend (Netlify / Vercel / Cloudflare Pages)
Arrastra la carpeta raíz a la plataforma de hosting estático.

### Admin Server (Railway / Render / Fly.io)
```bash
cd admin-server
npm install
node seed-full.js
npm start
```

Asegúrate de configurar las variables de entorno en la plataforma.

## Licencia

MIT
