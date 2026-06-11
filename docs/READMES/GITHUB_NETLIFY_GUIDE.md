# 🚀 GUÍA PASO A PASO: DE DESARROLLO A PRODUCCIÓN

**Tu proyecto Munish Perfum está listo. Aquí está cómo llevarlo a GitHub y Netlify.**

---

## 📋 REQUISITOS PREVIOS

- [x] ✅ Estructura del proyecto limpia
- [x] ✅ Documentación completa
- [x] ✅ Credenciales verificadas
- [x] ✅ Rutas relativas confirmadas

**Si todos los checks están, continúa →**

---

## FASE 1️⃣: PREPARAR GITHUB (5 min)

### Paso 1: Crear Cuenta GitHub (si no tienes)
1. Ir a [github.com](https://github.com)
2. Click "Sign up"
3. Completar formulario
4. Verificar email

### Paso 2: Crear Repositorio Privado
1. En GitHub, click `+` → "New repository"
2. **Repository name**: `munish-perfum`
3. **Description**: `Tienda Online de Perfumes - SINPE + EmailJS`
4. **Privacidad**: Seleccionar "Private" ✅
5. **No inicializar** README (ya tenemos)
6. Click "Create repository"

**Resultado**: Tendrás URL como `https://github.com/TuUsuario/munish-perfum.git`

---

## FASE 2️⃣: SUBIR CÓDIGO A GITHUB (5 min)

### Paso 1: Abrir PowerShell en tu Carpeta

```powershell
# Navegar a la carpeta del proyecto
cd "c:\Users\rootkit\Downloads\JERALD\Perfumes jerald"

# Verificar que estás en el lugar correcto
Get-ChildItem | Select-Object Name
```

**Deberías ver**: index.html, cart.html, checkout.html, css/, js/, etc.

### Paso 2: Inicializar Git Localmente

```powershell
# Inicializar repositorio git local
git init

# Configurar tu usuario (hazlo UNA SOLA VEZ)
git config user.name "Tu Nombre"
git config user.email "tu@email.com"

# Verificar
git config user.name
git config user.email
```

### Paso 3: Agregar Archivos

```powershell
# Añadir TODOS los archivos
git add .

# Ver qué será incluido
git status
```

**Deberías ver**: Todos tus archivos en "Changes to be committed"

### Paso 4: Hacer Commit Inicial

```powershell
# Crear primer commit
git commit -m "✨ Preparación para producción - v2.0

- Limpieza de archivos temporales
- Documentación profesional (README, SECURITY)
- Configuración Netlify
- Verificación de seguridad y rutas
- Listo para despliegue en producción"
```

### Paso 5: Cambiar Rama a Main (si es necesario)

```powershell
# Ver rama actual
git branch

# Si estás en "master", renombrar a "main"
git branch -M main

# Verificar
git branch
```

### Paso 6: Conectar Remoto y Push

```powershell
# Añadir repositorio remoto (reemplaza TuUsuario)
git remote add origin https://github.com/TuUsuario/munish-perfum.git

# Verificar remoto
git remote -v

# Hacer push
git push -u origin main
```

**⚠️ Si pide credenciales:**
- Usuario: `TuUsuario`
- Contraseña: Tu **Personal Access Token** de GitHub
  - Crear en: GitHub → Settings → Developer settings → Personal access tokens
  - Scope: `repo` (full control of private repositories)

### Paso 7: Verificar en GitHub

1. Ir a https://github.com/TuUsuario/munish-perfum
2. Deberías ver todos tus archivos
3. Descripción actualizada
4. Privado ✅

**✅ Código en GitHub completo**

---

## FASE 3️⃣: DESPLEGAR EN NETLIFY (10 min)

### Paso 1: Crear Cuenta Netlify

1. Ir a [netlify.com](https://netlify.com)
2. Click "Sign up"
3. **Recomendado**: Sign up with GitHub (simplifica)
4. Autorizar Netlify en GitHub

### Paso 2: Conectar Repositorio

1. En Netlify dashboard, click "Add new site"
2. Seleccionar "Import an existing project"
3. Seleccionar "GitHub"
4. Autorizar si pide
5. Buscar y seleccionar: `munish-perfum`

### Paso 3: Configurar Deploy

En la página de configuración:

| Campo | Valor |
|-------|-------|
| **Repository** | munish-perfum |
| **Branch** | main |
| **Build command** | (dejar vacío) |
| **Publish directory** | `.` o `/` (raíz) |

**Nota**: netlify.toml hace el trabajo automáticamente

### Paso 4: Deploy

1. Click "Deploy site"
2. Esperar 1-2 minutos
3. ✅ Ver "Site is live"

**Resultado URL**: `https://munish-perfum.netlify.app` (o similar)

### Paso 5: Verificar Despliegue

1. Visitar tu URL
2. ✅ Ver index.html funciona
3. ✅ Navegar a otras páginas
4. ✅ Carrito funciona
5. ✅ Imágenes se cargan

---

## FASE 4️⃣: CONFIGURACIÓN AVANZADA (5 min, OPCIONAL)

### Añadir Dominio Personalizado

**Opción A: Dominio Netlify Gratuito**
```
Ya tienes: munish-perfum.netlify.app
✅ HTTPS automático
✅ CDN global
✅ Gratis
```

**Opción B: Tu Propio Dominio**

1. Comprar dominio en Godaddy, Namecheap, etc.
2. En Netlify: Site settings → Domain management
3. Click "Add custom domain"
4. Ingresar tu dominio
5. Seguir instrucciones DNS

### Variables de Entorno (FUTURO)

Si necesitas cambiar EmailJS sin código:

1. Netlify: Site settings → Build & deploy → Environment
2. Crear variables:
   ```
   EMAILJS_SERVICE_ID = service_1rcm2h6
   EMAILJS_TEMPLATE_ID = template_rxa2wil
   EMAILJS_PUBLIC_KEY = bconIQbmXvIrAd_SU
   ```

### Redirecciones (si usas rutas dinámicas)

Ya configuradas en `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## FASE 5️⃣: TESTING FINAL (10 min)

### Test 1: Accesibilidad
```
✅ Abrir en navegador: https://munish-perfum.netlify.app
✅ Ver página principal carga
✅ Hacer click en tienda, carrito, etc.
✅ Verificar imágenes cargan
```

### Test 2: Carrito
```
✅ Añadir producto al carrito
✅ Ver contador de carrito actualiza
✅ Recargar página (F5)
✅ Verificar carrito sigue ahí (localStorage)
✅ Ir a carrito.html
✅ Ver items listados correctamente
```

### Test 3: Checkout
```
✅ Ir a checkout.html
✅ Llenar todos los campos:
   - Nombre, Email, Teléfono
   - Documento ID
   - Dirección, Provincia, Cantón, Distrito, Código Postal
   - Número SINPE Móvil
✅ Validar que pide comprobante
✅ Click "Confirmar"
✅ Ver error si faltan campos
```

### Test 4: Responsive
```
✅ Abrir DevTools: F12
✅ Click responsive mode (Ctrl+Shift+M)
✅ Seleccionar iPhone 12 (390px)
✅ Ver sitio se adapta
✅ Probar todas las páginas en móvil
✅ Verificar botones son táctiles (48px+)
✅ Cambiar a iPad (768px)
✅ Verificar layout tablet
```

### Test 5: URLs y Links
```
✅ Abrir DevTools: F12 → Console
✅ Verificar NO hay errores rojos
✅ Hacer click en todos los links internos
✅ Verificar todas las páginas cargan
✅ Verificar no hay links rotos (404)
```

---

## FASE 6️⃣: MANTENER Y ACTUALIZAR (CONTINUO)

### Cómo Hacer Cambios en Producción

Simplemente:

```powershell
# 1. Hacer cambios en archivos locales
# (editar en VS Code)

# 2. Guardar cambios
# 3. Hacer commit
git add .
git commit -m "🔧 Descripción del cambio"

# 4. Push a GitHub
git push

# 5. Netlify deploya automáticamente
# Ver progreso en: https://app.netlify.com
```

### Monitorear Despliegues

1. Ir a Netlify dashboard
2. Ver historial de deploys
3. Hacer rollback si es necesario
4. Ver logs si algo falla

### Ver Logs de Errores

1. Netlify: Logs → Deploy log
2. Ver qué pasó en cada deploy
3. Correguir y hacer push de nuevo

---

## 🆘 TROUBLESHOOTING

### Problema: "git remote already exists"
```powershell
# Solución
git remote remove origin
git remote add origin https://github.com/TuUsuario/munish-perfum.git
```

### Problema: "Permission denied" en push
```powershell
# Solución 1: Usar HTTPS con token
# GitHub → Settings → Personal access tokens
# Copiar token y usarlo como password

# Solución 2: Usar SSH (más seguro)
# Generar SSH key y configurar en GitHub
```

### Problema: Sitio muestra 404
```
✅ Verificar que netlify.toml existe en raíz
✅ Verificar que publish directory es "/" o "."
✅ Ver deploy logs en Netlify
✅ Hacer redeploy: Netlify → Deploys → trigger
```

### Problema: CSS/JS no carga en producción
```
✅ Verificar rutas relativas (no css/vendor.css)
✅ Verificar archivo existe en carpeta
✅ Check DevTools: F12 → Network → ver qué falla
✅ Verificar .gitignore no ignora el archivo
```

### Problema: EmailJS no funciona
```
✅ Abrir DevTools: F12 → Console
✅ Ver errores de EmailJS
✅ Verificar que IDs en checkout.js son correctos
✅ Verificar que template en EmailJS tiene variables: {{customer_name}}, etc.
✅ Probar con email de prueba
```

---

## 📱 TESTING EN MÓVIL REAL (IMPORTANTE)

Antes de usar en producción:

### Con iPhone/Android
```
1. Tomar nota de tu URL: munish-perfum.netlify.app
2. En teléfono: Abrir navegador
3. Ingresar URL
4. Probar:
   - Carrito agrega items ✅
   - Checkout llena formulario ✅
   - SINPE número se captura ✅
   - Botones son cómodos de pulsar ✅
   - Imágenes se ven bien ✅
```

### Con DevTools (Emulación)
```
1. F12 → Responsive mode
2. Seleccionar dispositivos:
   - iPhone 12 (390px)
   - iPad (768px)
   - Android (360px)
3. Probar todas las funciones
```

---

## ✅ CHECKLIST FINAL

Antes de considerar "en producción":

- [ ] Repositorio privado en GitHub
- [ ] Código pusheado y visible en GitHub
- [ ] Sitio desplegado en Netlify
- [ ] URL accesible públicamente
- [ ] index.html carga correctamente
- [ ] Todas las imágenes visibles
- [ ] Carrito funciona
- [ ] Checkout funciona
- [ ] EmailJS envía (o está configurado)
- [ ] Responsive en móvil funciona
- [ ] No hay errores en console (F12)
- [ ] No hay 404 en network
- [ ] HTTPS funciona
- [ ] Deploy automático con GitHub funciona

**Si todos los checks pasan**: ✅ **¡LISTO PARA PRODUCCIÓN!**

---

## 🎉 ¡FELICIDADES!

Tu proyecto Munish Perfum está ahora:
- ✅ En GitHub privado
- ✅ En Netlify en vivo
- ✅ Accesible desde internet
- ✅ Actualizable con git push
- ✅ Con HTTPS automático
- ✅ Con CDN global
- ✅ Con despliegue automático

**Siguiente paso**: Comparte tu URL con clientes, inversores, o el equipo 🚀

---

**Documentado**: 4 Febrero 2026  
**Para**: Munish Perfum v2.0  
**Por**: GitHub Copilot - Setup Engineer
