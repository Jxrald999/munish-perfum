# 🌸 Munish Perfum - Tienda Online Premium

## Descripción
Proyecto de e-commerce privado de **Munish Perfum** construido con HTML5, CSS3, Bootstrap 5.3 y JavaScript vanilla. Tienda online especializada en fragancias de lujo con integración de pagos SINPE Móvil (Costa Rica) y notificaciones por email mediante EmailJS.

## ✨ Características Principales

- **Frontend Responsivo**: Diseño mobile-first optimizado para todos los dispositivos
- **Integración SINPE Móvil**: Sistema de pago para Costa Rica con referencia de transacción
- **Validación de Formularios**: Validación completa de datos de cliente y dirección
- **Carrito Persistente**: Almacenamiento de carrito en localStorage
- **Notificaciones por Email**: Integración EmailJS para confirmaciones de pedido
- **Imágenes Optimizadas**: Lazy loading y dimensionamiento responsivo
- **Tipografía Premium**: Fuentes Google Fonts (Josefin Sans, Jost)
- **Bootstrap 5.3**: Framework CSS moderno con componentes listos

## 📁 Estructura del Proyecto

```
munish-perfum/
├── index.html                 # Página principal
├── shop.html                  # Catálogo de productos
├── single-product.html        # Detalle de producto
├── cart.html                  # Carrito de compras
├── checkout.html              # Formulario y pago
├── tracking.html              # Seguimiento de pedidos
├── style.css                  # Estilos principales
│
├── css/
│   ├── vendor.css            # Estilos de proveedores
│   ├── cart.css              # Estilos carrito
│   ├── checkout.css          # Estilos checkout
│   ├── normalize.css         # Normalización
│   └── mobile-responsive.css # Media queries (mobile-first)
│
├── js/
│   ├── script.js             # Script principal
│   ├── checkout.js           # Lógica checkout + EmailJS
│   ├── cart.js               # Gestión carrito
│   ├── product.js            # Lógica productos
│   ├── inventory.js          # Inventario
│   ├── tracking.js           # Seguimiento
│   ├── plugins.js            # Plugins jQuery
│   ├── modernizr.js          # Feature detection
│   ├── jquery.min.js         # jQuery 3.x
│   ├── ajax-loader.gif       # Loader animado
│   └── supabase_setup.sql    # Base de datos (opcional)
│
├── images/                    # Imágenes de productos
├── fraganze-admin/            # Panel administrativo (Laravel)
├── README.md                  # Este archivo
└── .gitignore                # Archivos ignorados en Git

```

## 🚀 Instalación y Uso

### Requisitos
- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Conexión a Internet (para CDN y EmailJS)

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/TuUsuario/munish-perfum.git
   cd munish-perfum
   ```

2. **Abrir en navegador**
   - Opción 1: Doble click en `index.html`
   - Opción 2: Usar un servidor local (recomendado)
     ```bash
     # Con Python 3
     python -m http.server 8000
     
     # Con Node.js (http-server)
     npx http-server
     ```
   - Opción 3: Usar Live Server en VS Code

3. **Desplegar en Netlify** (Producción)
   - Conectar repositorio GitHub
   - Establecer raíz de publicación: `/` (raíz del proyecto)
   - Hacer deploy
   - [Documention: Deploying to Netlify](https://docs.netlify.com/site-deploys/create-deploys/)

## ⚙️ Configuración

### EmailJS
La integración de EmailJS está configurada en [js/checkout.js](js/checkout.js):

```javascript
const EMAIL_CONFIG = {
    serviceID: 'service_1rcm2h6',
    templateID: 'template_rxa2wil',
    userID: 'bconIQbmXvIrAd_SU'
};
```

**Para cambiar credenciales:**
1. Ir a [EmailJS Console](https://console.emailjs.com)
2. Copiar tus IDs
3. Reemplazar en `checkout.js` línea 8-10

### SINPE Móvil
El sistema de pagos SINPE Móvil está configurado para:
- Número de referencia requerido
- Validación de comprobante
- Confirmación por email

## 📝 Funcionalidades Detalladas

### Página Principal (`index.html`)
- Galería hero con CTA
- Catálogo de destacados
- Testimonios
- Newsletter
- Footer con links

### Catálogo (`shop.html`)
- Grid responsivo de productos
- Filtros por categoría
- Paginación
- Links a detalle

### Detalle de Producto (`single-product.html`)
- Galería de imágenes
- Descripción completa
- Selección de cantidad
- Añadir a carrito
- Productos relacionados

### Carrito (`cart.html`)
- Listado de items
- Cantidad ajustable
- Cálculo automático de totales
- Botón proceder a checkout

### Checkout (`checkout.html`)
- Formulario datos cliente
- Validación en tiempo real
- Información SINPE
- Carga de comprobante
- Envío de email
- Confirmación de pedido

### Seguimiento (`tracking.html`)
- Búsqueda por número de orden
- Estado del pedido
- Historial

## 🔐 Seguridad

✅ **Verificaciones realizadas:**
- ✅ Credenciales EmailJS protegidas (public key solamente)
- ✅ Validación de cliente en formularios
- ✅ Rutas relativas (sin paths absolutos)
- ✅ HTTPS recomendado en producción
- ✅ Sanitización de inputs en checkout

**Recomendaciones para producción:**
- Usar HTTPS en Netlify (automático)
- Implementar rate-limiting en API de emails
- Validar en backend además de frontend
- Usar variables de entorno para credenciales sensibles

## 🎨 Diseño y UX

### Responsive Design
- **Mobile**: 320px - 480px (optimizado)
- **Tablet**: 481px - 992px
- **Desktop**: 993px+

### Tipografía
- **Titulares**: Josefin Sans (200-700 weight)
- **Body**: Jost (200-500 weight)
- **Line-height**: 1.6 - 1.7 (legibilidad premium)

### Paleta de Colores
- **Primario**: #74909B (gris azulado)
- **Secundario**: #e8f1f5 (azul muy claro)
- **Neutral**: #ffffff, #f9fafb, #e9ecef

## 📦 Dependencias Externas

### CDN
- **Bootstrap 5.3**: CSS Framework
- **Swiper**: Carrusel de imágenes
- **Google Fonts**: Tipografía
- **EmailJS**: Notificaciones email

### Locales
- **jQuery 3.x**: Manipulación DOM
- **Modernizr**: Feature detection

**Nota:** Ninguna instalación NPM requerida. Todo via CDN o incluido.

## 🧪 Testing

Para verificar funcionalidad:

1. **Carrito**:
   - Añadir/eliminar productos
   - Verificar localStorage

2. **Checkout**:
   - Llenar formulario completo
   - Verificar validación
   - Enviar email de prueba

3. **Responsivo**:
   - Abrir DevTools (F12)
   - Activar modo móvil
   - Verificar en 320px, 480px, 768px

## 📱 Mobile-First Optimization

El proyecto está optimizado con:
- **Spacing**: Mínimo 40px entre secciones, 20px entre inputs
- **Touch Targets**: Botones mínimo 48px alto
- **Typography**: Font-size 16px en inputs (iOS friendly)
- **Performance**: Lazy loading de imágenes, minificación en producción

## 🐛 Troubleshooting

### EmailJS no envía
- Verificar credenciales en checkout.js
- Validar conexión a internet
- Revisar console (F12) para errores

### Carrito vacío al recargar
- Verificar localStorage habilitado
- Limpiar cache del navegador

### Imágenes no cargan
- Verificar rutas relativas
- Asegurar que /images existe

## 📞 Contacto y Soporte

- **Email**: [Contacto de Munish]
- **GitHub**: [Tu repositorio]
- **Netlify**: [Tu dominio]

## 📄 Licencia

Proyecto privado - Todos los derechos reservados © 2026 Munish Perfum.

## 🔄 Changelog

### v2.0 (Actual)
- ✅ Optimización mobile-first con media queries
- ✅ Integración EmailJS completa
- ✅ SINPE Móvil con validación
- ✅ Estructura producción lista
- ✅ README profesional

### v1.0
- Proyecto inicial
- Estructura HTML
- Estilos Bootstrap

## ✅ Pre-Deploy Checklist

Antes de desplegar en Netlify:
- [ ] Verificar todas las rutas relativas
- [ ] Testing responsive en móviles
- [ ] Testing completo de checkout
- [ ] EmailJS funcional
- [ ] Imágenes optimizadas
- [ ] Cache del navegador limpio
- [ ] Sin console.log en producción

---

**Última actualización**: 4 Febrero 2026
**Status**: ✅ Listo para producción
