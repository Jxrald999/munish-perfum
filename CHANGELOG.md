# CHANGELOG - Munish Perfum

## Fase 1 — Corrección de Errores

### Bugs Críticos
- **style.css:128**: Comentario CSS mal formado (`*/` sin `/*` apertura) que rompía el parser CSS. Eliminado.
- **script.js:24**: Selector de testimonios Swiper incorrecto (`.review-swiper` → `.testimonial-swiper`). Nunca se inicializaba el slider.
- **checkout.js:124,160**: Costo de envío hardcodeado en USD ($5) cuando el sistema completo usa CRC (₡3,500). Reemplazado por `Cart.getShippingCost()` dinámico.
- **single-product.html:359-366**: Botones de idioma/tema fuera del `div.container-fluid` pero dentro de `<nav>`. Movidos dentro del container.

### Bugs de Lógica
- **cart.js:48-49**: Referencia a `Inventory` inexistente (variable nunca definida). Eliminada.
- **shop.js:58-66**: `showLoading()` insertaba HTML sin verificar si ya existía un spinner. Agregada guarda.
- **i18n.js**: ~150+ claves de traducción faltantes o con nombres incorrectos. Sincronizadas con los HTMLs.

### Código Muerto / Legacy
- **products.js**: Ya no se carga en ningún HTML (todo viaja por API). Mantenido como referencia.
- **seed.js vs seed-full.js**: seed.js tenía typo en `decants_2ml` (con 's'). seed-full.js ya lo corrigió.

---

## Fase 2 — Hardening de Seguridad

### Headers HTTP
- **Helmet**: Middleware de seguridad integrado (XSS, content-type sniffing, etc.)
- **X-Frame-Options**: `DENY` — previene clickjacking
- **X-Content-Type-Options**: `nosniff` — previene MIME sniffing
- **Referrer-Policy**: `strict-origin-when-cross-origin`
- **Strict-Transport-Security**: En producción, HSTS por 1 año

### Autenticación y Sesiones
- **SESSION_SECRET**: Migrada a variable de entorno (`.env`). Generada automáticamente si no existe.
- **Cookie de sesión**: `httpOnly: true`, `secure: true` en producción, `sameSite: 'lax'` (previene CSRF).
- **Rate limiting**: POST /login limitado a 10 intentos por 15 minutos (previene fuerza bruta).
- **API rate limiting**: 200 peticiones por minuto.

### Input Validation
- **Multer**: Agregado `fileFilter` para solo aceptar imágenes (JPEG, PNG, WebP, GIF). Previene subida de archivos maliciosos.
- **Sanitización XSS**: Función `sanitize()` que elimina tags `<script>` y manejadores de eventos (`onclick=`, etc.) de todos los inputs de texto en productos.
- **Login**: Query parametrizado (previene SQLi). Comparación bcrypt segura.

### CORS
- **Orígenes permitidos**: Configurable vía `ALLOWED_ORIGINS` en `.env`. En producción solo permiten orígenes conocidos.

### Environment & Secrets
- **.env**: Creado para admin-server con `SESSION_SECRET`, `ALLOWED_ORIGINS`, `NODE_ENV`, `PORT`.
- **.env.example**: Template documentado para nuevos desarrolladores.
- **.gitignore**: `.env`, `admin-server/data/`, `admin-server/uploads/` excluidos.

### Dependencias
- **Paquetes agregados**: `helmet`, `express-rate-limit`, `cors`, `dotenv`
- **Vulnerabilidades**: 0 vulnerabilidades en todas las dependencias (npm audit).

---

## Fase 3 — Release Ready

### Documentación
- **README.md**: Reescrito con descripción completa, arquitectura, instalación, variables de entorno, y guía de despliegue.

### Scripts
- **package.json**: Agregados scripts `start:front` y `seed:full`.
- **go-live.bat**: Script actualizado que inicia frontend + admin automáticamente.

### Estructura
- Archivos legacy eliminados: `product.html`, `product-detail.js`, `inventory.js`, `update_shop.ps1`
- Documentación movida a `docs/`
- `style.css` movido a `css/`
