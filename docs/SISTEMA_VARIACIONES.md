# Sistema de Variaciones de Tamaños - Documentación

## 📋 Resumen
Se ha implementado un sistema completo de variaciones de tamaños para los productos, permitiendo a los clientes comprar **Botellas Completas** o **Decants** en diferentes volúmenes con precios dinámicos.

---

## 🎯 Características Implementadas

### 1. **Interfaz de Selección (single-product.html)**
✅ Selector visual con radio buttons/opciones de tamaño
✅ Menú desplegable opcional para todos los tamaños disponibles

**Opciones disponibles:**
- **Botella Completa** (50ml - 100ml) - Precio variable según producto
- **Decant 2ml** - ₡1,200
- **Decant 3ml** - ₡1,600
- **Decant 5ml** - ₡2,100
- **Decant 10ml** - ₡4,000

### 2. **Lógica de Precios Dinámicos (js/product.js)**
✅ Los precios se actualizan automáticamente al cambiar la selección
✅ Tabla de precios estándar para decants integrada
✅ Soporte para precios personalizados por producto

**Funciones principales:**
```javascript
DECANT_PRICES = {
    'decant-2ml': 1200,
    'decant-3ml': 1600,
    'decant-5ml': 2100,
    'decant-10ml': 4000
}
```

### 3. **Sistema de Carrito (js/cart.js)**
✅ Guarda correctamente el tamaño seleccionado con cada producto
✅ Agrupa productos iguales del mismo tamaño
✅ Muestra el tamaño en el carrito y checkout

**Formato en carrito:**
```
Nombre del Producto (Tamaño)
Ej: "Aura Bloom Premium (Decant 5ml)"
```

---

## 🔧 Implementación Técnica

### HTML (single-product.html)
```html
<!-- Radio buttons para seleccionar tamaño -->
<div class="size-options-grid">
    <div class="size-option-item">
        <input type="radio" id="size-botella-completa" name="size-option" value="botella-completa" checked>
        <label for="size-botella-completa" class="size-label">
            <span class="size-text">Botella Completa</span>
            <span class="size-sublabel">(50ml - 100ml)</span>
        </label>
    </div>
    <!-- Decants... -->
</div>
```

### JavaScript - Lógica de Precios (product.js)
```javascript
// Inicializa listeners de cambio de tamaño
initializeSizeSelector(product) {
    const sizeInputs = document.querySelectorAll('input[name="size-option"]');
    sizeInputs.forEach(input => {
        input.addEventListener('change', function() {
            updatePriceDisplay(product, this.value);
        });
    });
}

// Actualiza el precio mostrado
updatePriceDisplay(product, selectedSize) {
    let price = product.price50ml || 0;
    if (selectedSize === 'botella-completa') {
        price = product.price50ml || 0;
    } else if (DECANT_PRICES[selectedSize]) {
        price = DECANT_PRICES[selectedSize];
    }
    UI.updateElement('.current-price', UI.formatMoney(price));
}
```

### JavaScript - Agregar al Carrito (product.js)
```javascript
window.addToCart = function(idArg) {
    const selectedSize = window.getSelectedSize() // 'botella-completa' | 'decant-2ml' | etc
    const sizeLabel = window.getSizeLabel(selectedSize) // 'Botella Completa' | 'Decant 2ml' | etc
    const price = window.getSizePrice(selectedSize, product) // Precio correcto
    
    Cart.addItem(p.id, size, qty); // size = 'Decant 5ml'
}
```

### JavaScript - Carrito (cart.js)
```javascript
addItem(productId, size = 'Botella Completa', quantity = 1) {
    // size: 'Botella Completa', 'Decant 2ml', 'Decant 3ml', etc
    
    let price = product.price50ml || 0;
    if (size === 'Botella Completa') {
        price = product.price50ml || 0;
    } else if (this.DECANT_PRICES[size]) {
        price = this.DECANT_PRICES[size];
    }
    
    // Verificar si existe el mismo producto con el mismo tamaño
    const existingItemIndex = cart.findIndex(item => 
        String(item.id) === String(productId) && String(item.size) === String(size)
    );
    
    // Actualizar cantidad o agregar nuevo
}
```

---

## 💰 Tabla de Precios Base

| Tamaño | Precio | Moneda |
|--------|--------|--------|
| Botella Completa | Varía | CRC |
| Decant 2ml | ₡1,200 | CRC |
| Decant 3ml | ₡1,600 | CRC |
| Decant 5ml | ₡2,100 | CRC |
| Decant 10ml | ₡4,000 | CRC |

> Los precios de decants son estándar para todos los productos y pueden ajustarse en `DECANT_PRICES` en `js/cart.js` y `js/product.js`

---

## 📝 Cómo Usar

### Para el Cliente
1. Abre la página de producto (`single-product.html?id=1`)
2. Selecciona el tamaño deseado del selector visual
3. El precio se actualiza automáticamente
4. Ajusta la cantidad con los botones +/-
5. Haz clic en "Añadir al carrito"
6. El producto se guarda con el tamaño en el carrito

### Para el Desarrollador
1. **Cambiar precios de decants:**
   - Editar `DECANT_PRICES` en `js/product.js` (línea 11-16)
   - Editar `DECANT_PRICES` en `js/cart.js` (línea 5-10)

2. **Agregar nuevos tamaños:**
   - Agregar radio button en `single-product.html`
   - Agregar entrada en `DECANT_PRICES` en ambos archivos JS
   - Actualizar la función `getSizeLabel()` en `product.js`

3. **Personalizar precios por producto:**
   - Modificar la lógica en `updatePriceDisplay()` si es necesario
   - O agregar un campo `customDecantPrices` en `inventory.js`

---

## 🛠️ Archivos Modificados

1. **single-product.html**
   - ✅ Selector de tamaños con radio buttons
   - ✅ Estilos CSS para la interfaz
   - ✅ Atributo `checked` en Botella Completa por defecto

2. **js/product.js**
   - ✅ Constante `DECANT_PRICES`
   - ✅ Funciones: `initializeSizeSelector()`, `updatePriceDisplay()`, `getSelectedSize()`, `getSizeLabel()`, `getSizePrice()`
   - ✅ Lógica mejorada en `addToCart()`
   - ✅ Manejo de tamaños con labels legibles

3. **js/cart.js**
   - ✅ Constante `DECANT_PRICES`
   - ✅ Parámetro `size` en `addItem()` con valor por defecto
   - ✅ Lógica de determinación de precios según tamaño
   - ✅ Verificación de duplicados considerando el tamaño
   - ✅ Notificación mejorada: "Producto (Tamaño) agregado al carrito"

4. **Estilos CSS (single-product.html)**
   - ✅ Grid responsivo para opciones de tamaño
   - ✅ Estados hover y checked
   - ✅ Animaciones suaves
   - ✅ Responsive design mobile

---

## 🧪 Testing

### Casos de Prueba Recomendados
1. ✅ Seleccionar diferentes tamaños y verificar que el precio cambia
2. ✅ Agregar el mismo producto en diferentes tamaños → deben aparecer como items separados
3. ✅ Agregar el mismo producto en el mismo tamaño → debe aumentar la cantidad
4. ✅ Verificar el carrito muestra el formato correcto: "Nombre (Tamaño)"
5. ✅ Verificar checkout calcula precios correctos
6. ✅ Probar en dispositivos móviles (responsive)

---

## 📱 Responsive Design

El selector de tamaños usa un grid que se adapta automáticamente:
- **Desktop:** 5 columnas
- **Tablet:** 3-4 columnas
- **Mobile:** 2 columnas (se ajusta con `grid-template-columns: repeat(auto-fit, minmax(140px, 1fr))`)

---

## ⚠️ Notas Importantes

1. **Formato de Tamaño en Carrito:**
   - Uso interno: `'botella-completa'`, `'decant-2ml'`, etc.
   - Para mostrar: `'Botella Completa'`, `'Decant 2ml'`, etc.
   - La función `getSizeLabel()` maneja la conversión automáticamente

2. **Stock:**
   - El stock se verifica por producto, no por tamaño
   - Todos los tamaños comparten el mismo stock
   - Para diferente stock por tamaño, se requiere cambio en BD

3. **Precios:**
   - Decants tienen precios fijos en CRC (colones costarricenses)
   - Botella Completa usa `price50ml` del inventario
   - Fácil de ajustar editando `DECANT_PRICES`

4. **LocalStorage:**
   - Todo se guarda en localStorage con clave `fraganze_cart_v3`
   - Persiste entre sesiones

---

## 🚀 Próximas Mejoras (Opcionales)

- [ ] Precios de decants personalizados por producto
- [ ] Stock separado por tamaño
- [ ] Galería de imágenes por tamaño
- [ ] Comprador recomendaciones ("Más popular en este tamaño")
- [ ] Filtro de precios dinámico para decants
- [ ] Bundle: "3 decants = descuento"

---

## 📧 Soporte

Si hay cualquier duda sobre la implementación, revisar:
1. variables `DECANT_PRICES` en ambos archivos JS
2. Función `getSizeLabel()` para mapeo de valores
3. Lógica en `addToCart()` para obtener el tamaño seleccionado
4. Validación de duplicados en `cart.js` (line 64-70)

**Implementación completada: ✅ 4 de Febrero de 2026**
