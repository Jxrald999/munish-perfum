/* CART.JS - Sistema completo de carrito de compras para Fraganze
   Gestión de carrito con localStorage, operaciones CRUD y cálculos
*/

const Cart = {
    // Clave para localStorage (unificada con product.js)
    STORAGE_KEY: 'fraganze_cart_v3',
    
    // Precios estándar de decants en colones (CRC)
    DECANT_PRICES: {
        'Decant 2ml': 1200,
        'Decant 3ml': 1600,
        'Decant 5ml': 2100,
        'Decant 10ml': 4000,
        'decant-2ml': 1200,
        'decant-3ml': 1600,
        'decant-5ml': 2100,
        'decant-10ml': 4000
    },
    
    // Inicializar carrito
    init() {
        const cart = this.getCart();
        this.updateCartUI();
        this.attachEventListeners();
        return cart;
    },

    // Obtener carrito desde localStorage
    getCart() {
        const cartData = localStorage.getItem(this.STORAGE_KEY);
        return cartData ? JSON.parse(cartData) : [];
    },

    // Guardar carrito en localStorage
    saveCart(cart) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
        this.updateCartUI();
        this.triggerCartUpdate();
    },

    // Agregar producto al carrito
    addItem(productId, size = 'Botella Completa', quantity = 1) {
        let product = null;
        if (typeof window.PRODUCTS !== 'undefined' && Array.isArray(window.PRODUCTS)) {
            product = window.PRODUCTS.find(p => String(p.id) === String(productId));
        }

        if (!product) {
            console.error('Producto no encontrado');
            return false;
        }

        // Verificar stock
        if (product.stock < quantity) {
            alert('Lo sentimos, no hay suficiente stock disponible.');
            return false;
        }

        const cart = this.getCart();
        let price = product.price50ml || 0; // Default price

        // CORRECCIÓN: Lógica de precios para priorizar el precio específico del producto
        
        // 1. Normalizar clave del tamaño (ej: "Decant 2ml" -> "2ml")
        let sizeKey = null;
        if (size.includes('2ml')) sizeKey = '2ml';
        else if (size.includes('3ml')) sizeKey = '3ml';
        else if (size.includes('5ml')) sizeKey = '5ml';
        else if (size.includes('10ml')) sizeKey = '10ml';

        // 2. Determinar el precio exacto
        if (size === 'Botella Completa' || size === 'botella-completa') {
            price = product.price50ml || 0;
        } 
        // PRIORIDAD: Precio específico definido en products.js
        else if (sizeKey && product.decant_prices && product.decant_prices[sizeKey]) {
            price = product.decant_prices[sizeKey];
        } 
        // FALLBACK: Precio genérico estándar
        else if (this.DECANT_PRICES[size]) {
            price = this.DECANT_PRICES[size];
        }
        
        // Verificar si el producto ya existe en el carrito con el mismo tamaño
        const existingItemIndex = cart.findIndex(item => 
            String(item.id) === String(productId) && String(item.size) === String(size)
        );

        if (existingItemIndex > -1) {
            // Actualizar cantidad
            const newQuantity = cart[existingItemIndex].quantity + quantity;
            if (newQuantity > product.stock) {
                alert('No hay suficiente stock para esta cantidad.');
                return false;
            }
            cart[existingItemIndex].quantity = newQuantity;
        } else {
            // Agregar nuevo item
            cart.push({
                id: productId,
                name: product.name,
                price: price,
                size: size,
                quantity: quantity,
                image: product.image,
                brand: product.brand,
                stock: product.stock
            });
        }

        this.saveCart(cart);
        this.showAddedNotification(product.name + ' (' + size + ')');
        return true;
    },

    // Actualizar cantidad de un item
    updateQuantity(productId, size, newQuantity) {
        const cart = this.getCart();
        const itemIndex = cart.findIndex(item => 
            String(item.id) === String(productId) && String(item.size) === String(size)
        );

        if (itemIndex === -1) return false;

        // Buscar producto para verificar stock
        let product = null;
        if (typeof window.PRODUCTS !== 'undefined' && Array.isArray(window.PRODUCTS)) {
            product = window.PRODUCTS.find(p => String(p.id) === String(productId));
        }

        if (product && newQuantity > product.stock) {
            alert('No hay suficiente stock disponible.');
            return false;
        }

        if (newQuantity <= 0) {
            this.removeItem(productId, size);
            return true;
        }

        cart[itemIndex].quantity = newQuantity;
        this.saveCart(cart);
        return true;
    },

    // Eliminar item del carrito
    removeItem(productId, size) {
        let cart = this.getCart();
        // coerce to string to avoid type mismatches and persist via saveCart
        cart = cart.filter(item => !(String(item.id) === String(productId) && String(item.size) === String(size)));
        this.saveCart(cart);
        // if we're on the cart page, re-render the list
        try { if (document.querySelector('.cart-items-container')) this.renderCartPage(); } catch (e) {}
        return true;
    },

    // Vaciar carrito completo
    clearCart() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.updateCartUI();
        this.triggerCartUpdate();
    },

    // Obtener cantidad total de items
    getTotalItems() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + item.quantity, 0);
    },

    // Obtener subtotal del carrito
    getSubtotal() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    // Calcular envío (Costa Rica)
    getShippingCost() {
        const subtotal = this.getSubtotal();
        // Envío gratis para compras mayores a ₡50,000
        if (subtotal >= 50000) return 0;
        // Envío estándar ₡3,500
        return 3500;
    },

    // Calcular impuestos (13% IVA Costa Rica)
    getTax() {
        const subtotal = this.getSubtotal();
        return subtotal * 0.13;
    },

    // Obtener total final
    getTotal() {
        return this.getSubtotal() + this.getShippingCost() + this.getTax();
    },

    // Actualizar UI del carrito (badge de cantidad)
    updateCartUI() {
        const totalItems = this.getTotalItems();
        const badges = document.querySelectorAll('.cart-badge, .cart-count');
        
        badges.forEach(badge => {
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
        });

        // Actualizar ícono del carrito si existe
        const cartIcon = document.querySelector('.cart-icon-container');
        if (cartIcon) {
            if (totalItems > 0) {
                cartIcon.classList.add('has-items');
            } else {
                cartIcon.classList.remove('has-items');
            }
        }
    },

    // Mostrar notificación de producto agregado
    showAddedNotification(productName) {
        // Crear notificación
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                </svg>
                <span><strong>${productName}</strong> agregado al carrito</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => notification.classList.add('show'), 10);

        // Remover después de 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    // Adjuntar event listeners globales
    attachEventListeners() {
        // Listener para botones "Agregar al carrito" dinámicos
        document.addEventListener('click', (e) => {
            // Botón agregar al carrito
            if (e.target.closest('.btn-add-to-cart')) {
                e.preventDefault();
                const btn = e.target.closest('.btn-add-to-cart');
                const productId = btn.dataset.productId;
                const size = btn.dataset.size || '50ml';
                const quantity = parseInt(btn.dataset.quantity || 1);
                
                this.addItem(productId, size, quantity);
            }

            // Botón eliminar del carrito
            if (e.target.closest('.btn-remove-item')) {
                e.preventDefault();
                const btn = e.target.closest('.btn-remove-item');
                const productId = btn.dataset.productId;
                const size = btn.dataset.size;
                
                if (confirm('¿Deseas eliminar este producto del carrito?')) {
                    this.removeItem(productId, size);
                    this.renderCartPage();
                }
            }

            // Botón vaciar carrito
            if (e.target.closest('.btn-clear-cart')) {
                e.preventDefault();
                if (confirm('¿Estás seguro de vaciar todo el carrito?')) {
                    this.clearCart();
                    this.renderCartPage();
                }
            }
            // Proceder al checkout (solo si hay productos)
            if (e.target.closest('.proceed-to-checkout')) {
                e.preventDefault();
                if (this.getCart().length === 0) {
                    alert('El carrito está vacío. Agrega productos antes de proceder al pago.');
                } else {
                    window.location.href = 'checkout.html';
                }
            }
        });

        // Listener para cambios de cantidad
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('cart-quantity-input')) {
                const input = e.target;
                const productId = input.dataset.productId;
                const size = input.dataset.size;
                const newQuantity = parseInt(input.value);
                
                this.updateQuantity(productId, size, newQuantity);
                this.renderCartPage();
            }
        });
    },

    // Renderizar página del carrito
    renderCartPage() {
        const container = document.querySelector('.cart-items-container');
        const summaryContainer = document.querySelector('.cart-summary-container');
        
        if (!container) return;

        const cart = this.getCart();

        if (cart.length === 0) {
            container.innerHTML = `
                <div class="empty-cart">
                    <svg width="120" height="120" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                    </svg>
                    <h3>Tu carrito está vacío</h3>
                    <p>¡Descubre nuestras fragancias exclusivas!</p>
                    <a href="shop.html" class="btn btn-dark btn-lg mt-3">Ir a la Tienda</a>
                </div>
            `;
            
            if (summaryContainer) {
                summaryContainer.innerHTML = '';
            }
            return;
        }

        // Renderizar items del carrito
        let itemsHTML = '';
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            itemsHTML += `
                <div class="cart-item" data-product-id="${item.id}" data-size="${item.size}">
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="cart-item-details">
                        <h5 class="cart-item-name">${item.name}</h5>
                        <p class="cart-item-brand">${item.brand}</p>
                        <p class="cart-item-size">Tamaño: ${item.size}</p>
                        <p class="cart-item-price">₡${item.price.toLocaleString('es-CR')}</p>
                    </div>
                    <div class="cart-item-quantity">
                        <label>Cantidad:</label>
                        <input 
                            type="number" 
                            class="cart-quantity-input" 
                            value="${item.quantity}" 
                            min="1" 
                            max="${item.stock}"
                            data-product-id="${item.id}"
                            data-size="${item.size}"
                        >
                        <small class="text-muted">Stock: ${item.stock}</small>
                    </div>
                    <div class="cart-item-total">
                        <p class="mb-2"><strong>₡${itemTotal.toLocaleString('es-CR')}</strong></p>
                        <button 
                            class="btn btn-sm btn-outline-danger btn-remove-item"
                            data-product-id="${item.id}"
                            data-size="${item.size}"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = itemsHTML;

        // Renderizar resumen
        if (summaryContainer) {
            const subtotal = this.getSubtotal();
            const shipping = this.getShippingCost();
            const tax = this.getTax();
            const total = this.getTotal();

            summaryContainer.innerHTML = `
                <div class="cart-summary">
                    <h4 class="mb-4">Resumen del Pedido</h4>
                    <div class="summary-row">
                        <span>Subtotal:</span>
                        <span>₡${subtotal.toLocaleString('es-CR')}</span>
                    </div>
                    <div class="summary-row">
                        <span>Envío:</span>
                        <span>${shipping === 0 ? 'GRATIS' : '₡' + shipping.toLocaleString('es-CR')}</span>
                    </div>
                    ${shipping === 0 ? '<p class="text-success small mb-2">¡Envío gratis por compra mayor a ₡50,000!</p>' : 
                      '<p class="text-muted small mb-2">Envío gratis en compras mayores a ₡50,000</p>'}
                    <div class="summary-row">
                        <span>IVA (13%):</span>
                        <span>₡${tax.toLocaleString('es-CR')}</span>
                    </div>
                    <hr>
                    <div class="summary-row summary-total">
                        <span><strong>Total:</strong></span>
                        <span><strong>₡${total.toLocaleString('es-CR')}</strong></span>
                    </div>
                    <button class="btn btn-dark btn-lg w-100 mt-4 proceed-to-checkout">
                        Proceder al Pago
                    </button>
                    <button class="btn btn-outline-secondary w-100 mt-2 btn-clear-cart">
                        Vaciar Carrito
                    </button>
                    <a href="shop.html" class="btn btn-link w-100 mt-2">
                        Seguir Comprando
                    </a>
                </div>
            `;
        }
    },

    // Trigger evento personalizado cuando el carrito cambia
    triggerCartUpdate() {
        const event = new CustomEvent('cartUpdated', { 
            detail: { 
                items: this.getTotalItems(),
                total: this.getTotal()
            } 
        });
        document.dispatchEvent(event);
    }
};

// Escuchar actualizaciones externas al carrito (por ejemplo desde product.js)
document.addEventListener('cartUpdated', function (e) {
    try {
        Cart.updateCartUI();
    } catch (err) { }
});

// Inicializar carrito cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Cart.init());
} else {
    Cart.init();
}

// Exportar para uso global
window.Cart = Cart;

// Exponer helper para actualizar badge (llamable desde product.js u otras páginas)
window.updateCartBadge = function () {
    try { Cart.updateCartUI(); } catch (e) {}
};

// Ejecutar una vez en caliente para asegurar badge actualizado en el header
try { window.updateCartBadge(); } catch (e) {}