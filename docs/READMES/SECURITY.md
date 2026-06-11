# 🔐 Guía de Configuración de Credenciales - Munish Perfum

## IMPORTANTE - Seguridad en Producción

Este documento explica cómo manejar credenciales y secretos de forma segura.

---

## 📋 Credenciales Actuales

### EmailJS
- **Service ID**: `service_1rcm2h6`
- **Template ID**: `template_rxa2wil`
- **Public Key**: `bconIQbmXvIrAd_SU`

**Ubicación actual**: [js/checkout.js](js/checkout.js) líneas 8-10

---

## ⚠️ Consideraciones de Seguridad

### ✅ Lo que SÍ está permitido compartir (Public):
- **Public Key de EmailJS** - Diseñado para usar en frontend
- **Service ID y Template ID** - Son públicos, requeridos para funcionar

### ❌ Lo que NO se debe compartir (Secrets):
- Claves privadas de API
- Credenciales de bases de datos
- Tokens JWT
- Información de transacciones reales

---

## 🚀 Para Producción en Netlify

### Opción 1: Usar Netlify Environment Variables (RECOMENDADO)

1. **En GitHub**: `.gitignore` ya ignora archivos `.env*`

2. **En Netlify Dashboard**:
   - Ir a: Site settings → Build & deploy → Environment
   - Añadir variables:
     ```
     EMAILJS_SERVICE_ID = service_1rcm2h6
     EMAILJS_TEMPLATE_ID = template_rxa2wil
     EMAILJS_PUBLIC_KEY = bconIQbmXvIrAd_SU
     ```

3. **En checkout.js** (versión con variables):
   ```javascript
   const EMAIL_CONFIG = {
       serviceID: process.env.EMAILJS_SERVICE_ID || 'service_1rcm2h6',
       templateID: process.env.EMAILJS_TEMPLATE_ID || 'template_rxa2wil',
       userID: process.env.EMAILJS_PUBLIC_KEY || 'bconIQbmXvIrAd_SU'
   };
   ```

### Opción 2: Mantener en código (para sitios estáticos)

Como este es un sitio HTML estático:
- ✅ Las credenciales están expuestas (necesario para frontend)
- ✅ No hay "backend secrets"
- ✅ Es seguro porque EmailJS es un servicio público
- ✅ Los IDs mostrados son públicos por diseño

---

## 🔄 Cambiar Credenciales EmailJS

Si necesitas usar otras credenciales:

1. **Crear cuenta en [EmailJS](https://www.emailjs.com)**
2. **Obtener tus credenciales**:
   - Email Console → Copy Service ID
   - Email Console → Copy Template ID
   - Account → Copy Public Key

3. **Actualizar [js/checkout.js](js/checkout.js)**:
   ```javascript
   const EMAIL_CONFIG = {
       serviceID: 'TUS_SERVICE_ID_NUEVO',
       templateID: 'TUS_TEMPLATE_ID_NUEVO',
       userID: 'TU_PUBLIC_KEY_NUEVO'
   };
   ```

4. **Verificar que el template de EmailJS tenga estas variables**:
   ```
   {{customer_name}}
   {{customer_email}}
   {{order_number}}
   {{total}}
   {{address}}
   {{province}}
   {{canton}}
   {{sinpe_reference}}
   {{proof_filename}}
   {{orders_html}}
   ```

---

## 📝 Checklist de Seguridad Pre-Deploy

- [ ] Verificar que no hay paths absolutos (ej: `C:/Users/...`)
- [ ] Verificar que no hay console.log() con datos sensibles
- [ ] Confirmar que .gitignore existe
- [ ] HTTPS habilitado en Netlify (automático)
- [ ] No hay comentarios con información personal
- [ ] No hay credenciales en archivos de backup
- [ ] Todo usa rutas relativas

---

## 🛡️ Protección de Datos

### Datos del Cliente
- **Recolectados**: Nombre, Email, Dirección, Teléfono, Documento ID
- **Almacenados**: localStorage (navegador del usuario solamente)
- **Enviados**: A EmailJS (servidor tercero de confianza)
- **Nunca compartidos**: Con terceros sin consentimiento

### Comprobantes de Pago
- **Uploadados**: A servidor temporal
- **Validación**: Extensión .jpg, .png, .pdf únicamente
- **Tamaño máximo**: Especificar en checkout.js

---

## 🔔 Variables Sensibles a Evitar

```javascript
// ❌ MAL - No hacer esto:
const passwords = {
    admin: 'admin123',
    database: 'secretpassword'
};

// ✅ BIEN - Usar environment variables:
const adminPanel = {
    url: process.env.ADMIN_URL || 'https://admin.example.com'
};
```

---

## 📞 Para Soporte

Si tienes dudas sobre seguridad:
1. Revisar [EmailJS Documentation](https://www.emailjs.com/docs/)
2. Revisar [Netlify Security](https://docs.netlify.com/security/)
3. Contactar al equipo de desarrollo

---

**Última actualización**: 4 Febrero 2026
**Versión**: 1.0
