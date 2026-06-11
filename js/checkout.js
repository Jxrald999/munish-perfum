/* CHECKOUT.JS - Sistema de checkout con SINPE Móvil y envío de correos */

// Clave de almacenamiento sincronizada con product.js
const CART_STORAGE_KEY = 'fraganze_cart_v3';

// Configuración de EmailJS (necesitas registrarte en emailjs.com y configurar tu servicio)
const EMAIL_CONFIG = {
    serviceID: 'service_1rcm2h6',
    templateID: 'template_rxa2wil',
    userID: 'bconIQbmXvIrAd_SU'
};

// Inicializar EmailJS de forma robusta: intenta ahora y en load por si el script carga después
function tryInitEmailJS() {
    try {
        if (window.emailjs && typeof emailjs.init === 'function') {
            emailjs.init(EMAIL_CONFIG.userID);
            console.log('✅ EmailJS inicializado con Public Key');
            return true;
        }
    } catch (e) {
        console.warn('⚠️ Error inicializando EmailJS:', e);
    }
    return false;
}

tryInitEmailJS();
window.addEventListener('load', tryInitEmailJS);

const Checkout = {
    orderData: null,
    orderNumber: null,

    init() {
        if (typeof this.loadOrderSummary === 'function') {
            this.loadOrderSummary();
        } else {
            console.error('init: loadOrderSummary is not a function');
        }

        if (typeof this.attachEventListeners === 'function') {
            this.attachEventListeners();
        } else {
            console.error('init: attachEventListeners is not a function');
        }

        if (typeof this.checkCartEmpty === 'function') {
            this.checkCartEmpty();
        } else {
            console.error('init: checkCartEmpty is not a function');
        }
    },

    // Cargar resumen del carrito desde localStorage - Versión Robusta con auditoría
    loadOrderSummary() {
        try {
            console.log('🔍 AUDITORÍA: Iniciando loadOrderSummary()');
            console.log('📦 Buscando carrito en:', CART_STORAGE_KEY);
            
            // Leer datos del carrito desde localStorage con la clave sincronizada
            let cartJson = localStorage.getItem(CART_STORAGE_KEY);
            
            // Si no encontramos con la clave principal, buscar en nombres comunes antiguos
            if (!cartJson) {
                console.warn('⚠️ No encontrado en fraganze_cart_v3, buscando en nombres legacy...');
                const legacyKeys = ['fraganze_cart', 'cart', 'shopping_cart', 'fraganze_cart_v2'];
                for (let key of legacyKeys) {
                    const legacyData = localStorage.getItem(key);
                    if (legacyData) {
                        console.log('✅ Encontrado en clave legacy:', key);
                        cartJson = legacyData;
                        // Migrar a la nueva clave
                        localStorage.removeItem(key);
                        localStorage.setItem(CART_STORAGE_KEY, cartJson);
                        console.log('🔄 Migrado a fraganze_cart_v3');
                        break;
                    }
                }
            }
            
            if (!cartJson) {
                console.warn('❌ No se encontró carrito en localStorage bajo ninguna clave');
                this.orderData = null;
                this.showEmptyCartMessage();
                return;
            }

            let cartData = [];
            try {
                cartData = JSON.parse(cartJson);
                console.log('✅ JSON parseado correctamente. Items:', cartData.length);
            } catch (parseError) {
                console.error('❌ Error al parsear JSON:', parseError);
                console.error('Contenido problemático:', cartJson);
                // Limpiar datos corruptos
                localStorage.removeItem(CART_STORAGE_KEY);
                this.orderData = null;
                this.showEmptyCartMessage();
                return;
            }

            // Validar que sea un array no vacío
            if (!Array.isArray(cartData) || cartData.length === 0) {
                console.warn('⚠️ El carrito está vacío');
                this.orderData = null;
                this.showEmptyCartMessage();
                return;
            }

            console.log('📊 Carrito válido con', cartData.length, 'items');

            // Inicializar estructura de datos del pedido
            this.orderData = {
                items: cartData.map(item => ({
                    id: item.id || '',
                    name: item.name || 'Producto sin nombre',
                    price: Number(item.price) || 0,
                    quantity: Number(item.quantity) || 1,
                    size: item.size || '50ml',
                    image: item.image || 'images/product-item1.jpg'
                })),
                totals: {
                    subtotal: 0,
                    shipping: 0, // Se calcula dinÃ¡micamente vÃ­a Cart.getShippingCost()
                    tax: 0,
                    total: 0
                },
                customer: {
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    idNumber: '',
                    address: '',
                    province: '',
                    canton: ''
                },
                shipping: {
                    address: '',
                    district: '',
                    canton: '',
                    province: '',
                    postalCode: '',
                    notes: ''
                }
            };

            // Calcular subtotal sumando price * quantity para cada item
            // CRÍTICO: Usar Number() para evitar concatenación de strings
            this.orderData.totals.subtotal = this.orderData.items.reduce((sum, item) => {
                const itemPrice = Number(item.price) || 0;
                const itemQty = Number(item.quantity) || 1;
                const itemSubtotal = itemPrice * itemQty;
                console.log(`💲 ${item.name}: ${itemPrice} × ${itemQty} = ${itemSubtotal}`);
                return sum + itemSubtotal;
            }, 0);

            // Calcular envÃ­o usando Cart.getShippingCost() (CRC) si estÃ¡ disponible
            const subtotal = Number(this.orderData.totals.subtotal) || 0;
            const shipping = (window.Cart && typeof window.Cart.getShippingCost === 'function')
                ? window.Cart.getShippingCost()
                : (subtotal >= 50000 ? 0 : 3500);
            this.orderData.totals.shipping = shipping;
            const tax = subtotal * 0.13; // IVA 13% Costa Rica
            this.orderData.totals.tax = tax;
            this.orderData.totals.total = subtotal + shipping + tax;

            console.log('ðŸ’° TOTALES CALCULADOS:');
            console.log('  Subtotal:', subtotal);
            console.log('  Envío:', shipping);
            console.log('  IVA (13%):', tax);
            console.log('  TOTAL:', this.orderData.totals.total);

            // CRÍTICO: Renderizar el resumen del pedido
            this.renderOrderSummary();

            // CRÍTICO: Asegurar que orderData está disponible para sendEmails()
            console.log('✅ orderData completamente cargado y disponible para sendEmails()');
            console.log('📋 Estructura de orderData:', JSON.stringify(this.orderData, null, 2));

        } catch (error) {
            console.error('❌ Error cargando resumen del pedido:', error);
            this.orderData = null;
            this.showEmptyCartMessage();
        }
    },

    // Mostrar mensaje si el carrito está vacío
    showEmptyCartMessage() {
        // Intentar usar el contenedor del HTML del checkout primero
        let itemsContainer = document.getElementById('order-items');
        
        // Si no existe, usar el contenedor alternativo
        if (!itemsContainer) {
            itemsContainer = document.getElementById('order-summary-container');
        }
        
        if (itemsContainer) {
            itemsContainer.innerHTML = `
                <div class="alert alert-warning" role="alert">
                    <h4 class="alert-heading">¡Tu carrito está vacío!</h4>
                    <p>No hay productos en tu carrito. Por favor, regresa a la tienda y añade algunos productos antes de proceder al checkout.</p>
                    <hr>
                    <a href="shop.html" class="btn btn-primary">Continuar Comprando</a>
                </div>
            `;
        }
    },

    // Renderizar resumen visual del pedido
    renderOrderSummary() {
        console.log('🎨 Renderizando resumen del pedido...');
        
        // Intentar usar el contenedor del HTML del checkout primero
        let itemsContainer = document.getElementById('order-items');
        
        // Si no existe, usar el contenedor alternativo
        if (!itemsContainer) {
            itemsContainer = document.getElementById('order-summary-container');
        }
        
        if (!itemsContainer || !this.orderData) {
            console.warn('⚠️ No se encontró contenedor o no hay orderData');
            return;
        }

        // Renderizar items con estructura de tabla o lista
        const itemsHtml = this.orderData.items.map(item => {
            const itemPrice = Number(item.price) || 0;
            const itemQty = Number(item.quantity) || 1;
            const itemTotal = itemPrice * itemQty;
            
            return `
                <div class="order-item d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div>
                        <strong>${item.name}</strong>
                        <small class="d-block text-muted">${item.size || 'N/A'} x ${itemQty}</small>
                    </div>
                    <div class="text-end">
                        <strong>₡${itemTotal.toLocaleString('es-CR')}</strong>
                    </div>
                </div>
            `;
        }).join('');

        itemsContainer.innerHTML = itemsHtml;
        console.log('✅ Items renderizados:', this.orderData.items.length);

        // Actualizar elementos de totales si existen
        const subtotalEl = document.getElementById('summary-subtotal');
        const shippingEl = document.getElementById('summary-shipping');
        const taxEl = document.getElementById('summary-tax');
        const totalEl = document.getElementById('summary-total');

        // Calcular totales usando Number() para evitar problemas
        const subtotal = Number(this.orderData.totals.subtotal) || 0;
        const shipping = Number(this.orderData.totals.shipping) || 0;
        const tax = Number(this.orderData.totals.tax) || 0;
        const total = Number(subtotal) + Number(shipping) + Number(tax);

        // Actualizar elementos del DOM
        if (subtotalEl) {
            subtotalEl.textContent = '₡' + subtotal.toLocaleString('es-CR');
            console.log('✅ Subtotal actualizado:', subtotal);
        }
        if (shippingEl) {
            shippingEl.textContent = shipping === 0 ? 'GRATIS' : '₡' + shipping.toLocaleString('es-CR');
            console.log('✅ Envío actualizado:', shipping);
        }
        if (taxEl) {
            taxEl.textContent = '₡' + tax.toLocaleString('es-CR');
            console.log('✅ IVA actualizado:', tax);
        }
        if (totalEl) {
            totalEl.textContent = '₡' + total.toLocaleString('es-CR');
            console.log('✅ Total actualizado:', total);
        }

        // Actualizar el total en orderData
        this.orderData.totals.total = total;
        console.log('💾 orderData.totals.total sincronizado:', this.orderData.totals.total);
    },

    // Verificar si el carrito está vacío
    checkCartEmpty() {
        if (!this.orderData || !this.orderData.items || this.orderData.items.length === 0) {
            this.showEmptyCartMessage();
        }
    },

    // Adjuntar listeners a elementos
    attachEventListeners() {
        // Escuchar envío del formulario principal del checkout
        const form = document.getElementById('checkout-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();

                // Asegurar que orderData está cargado
                if (!this.orderData) {
                    this.loadOrderSummary();
                    if (!this.orderData) return;
                }

                // Recolectar datos del formulario y guardarlos en orderData
                this.orderData.customer.firstName = (document.getElementById('firstName') || {}).value || '';
                this.orderData.customer.lastName = (document.getElementById('lastName') || {}).value || '';
                this.orderData.customer.email = (document.getElementById('email') || {}).value || '';
                this.orderData.customer.phone = (document.getElementById('phone') || {}).value || '';
                this.orderData.customer.idNumber = (document.getElementById('idNumber') || {}).value || '';

                this.orderData.shipping.province = (document.getElementById('province') || {}).value || '';
                this.orderData.shipping.canton = (document.getElementById('canton') || {}).value || '';
                this.orderData.shipping.district = (document.getElementById('district') || {}).value || '';
                this.orderData.shipping.address = (document.getElementById('address') || {}).value || '';
                this.orderData.shipping.postalCode = (document.getElementById('postalCode') || {}).value || '';
                this.orderData.shipping.notes = (document.getElementById('notes') || {}).value || '';

                // Generar número de pedido simple
                this.orderNumber = 'ORD-' + Date.now();

                // Actualizar pantallas y valores
                const finalTotalEl = document.getElementById('final-total');
                const orderNumberEl = document.getElementById('order-number');
                if (finalTotalEl) finalTotalEl.textContent = '₡' + (Number(this.orderData.totals.total) || 0).toLocaleString('es-CR');
                if (orderNumberEl) orderNumberEl.textContent = this.orderNumber;

                // Mostrar la pantalla de pago
                const paymentScreen = document.getElementById('payment-screen');
                if (paymentScreen) paymentScreen.style.display = 'block';
                // Opcional: ocultar el formulario
                form.style.display = 'none';

                // Actualizar paso visual
                this.updateStep(2);
            });
        }
    },
    // Generar tabla HTML de pedidos para EmailJS
    generateOrdersTable() {
        if (!this.orderData || !this.orderData.items || this.orderData.items.length === 0) {
            return '<tr><td colspan="4">No hay items en el pedido</td></tr>';
        }

        return this.orderData.items.map(item => {
            const itemPrice = Number(item.price) || 0;
            const itemQty = Number(item.quantity) || 1;
            const itemTotal = itemPrice * itemQty;
            const itemSize = item.size || 'N/A';
            const itemName = item.name || 'Producto sin nombre';

            return `
<tr style="border-bottom: 1px solid #e0e0e0;">
  <td style="padding: 12px 8px; text-align: left; font-weight: 500;">${itemName}</td>
  <td style="padding: 12px 8px; text-align: center;">${itemSize}</td>
  <td style="padding: 12px 8px; text-align: center;">${itemQty}</td>
  <td style="padding: 12px 8px; text-align: right; font-weight: 600;">₡${itemTotal.toLocaleString('es-CR')}</td>
</tr>`;
        }).join('');
    },

    // Capturar datos del formulario dinámicamente en orderData
    collectFormData() {
        if (!this.orderData) this.orderData = this.orderData || {};

        this.orderData.customer = this.orderData.customer || {};
        this.orderData.shipping = this.orderData.shipping || {};

        // Campos personales
        this.orderData.customer.firstName = (document.getElementById('firstName') || {}).value || this.orderData.customer.firstName || '';
        this.orderData.customer.lastName = (document.getElementById('lastName') || {}).value || this.orderData.customer.lastName || '';
        this.orderData.customer.email = (document.getElementById('email') || {}).value || this.orderData.customer.email || '';
        this.orderData.customer.phone = (document.getElementById('phone') || {}).value || this.orderData.customer.phone || '';
        this.orderData.customer.idNumber = (document.getElementById('idNumber') || {}).value || this.orderData.customer.idNumber || '';

        // Dirección / envío
        // Leer valores del DOM usando los IDs del formulario
        const addrVal = (document.getElementById('address') || {}).value || this.orderData.shipping.address || '';
        const provVal = (document.getElementById('province') || {}).value || this.orderData.shipping.province || '';
        const cantVal = (document.getElementById('canton') || {}).value || this.orderData.shipping.canton || '';
        const distVal = (document.getElementById('district') || {}).value || this.orderData.shipping.district || '';
        const postalVal = (document.getElementById('postalCode') || {}).value || this.orderData.shipping.postalCode || '';
        const notesVal = (document.getElementById('notes') || {}).value || this.orderData.shipping.notes || '';

        // Guardar en shipping
        this.orderData.shipping.province = provVal;
        this.orderData.shipping.canton = cantVal;
        this.orderData.shipping.district = distVal;
        this.orderData.shipping.address = addrVal;
        this.orderData.shipping.postalCode = postalVal;
        this.orderData.shipping.notes = notesVal;

        // También sincronizar en customer para que las plantillas que usan customer_* funcionen
        this.orderData.customer.address = addrVal;
        this.orderData.customer.province = provVal;
        this.orderData.customer.canton = cantVal;

        // Mantener totales sincronizados
        if (!this.orderData.totals) this.orderData.totals = { subtotal: 0, shipping: 0, tax: 0, total: 0 };
        this.orderData.totals.subtotal = Number(this.orderData.totals.subtotal) || 0;
        this.orderData.totals.shipping = Number(this.orderData.totals.shipping) || 0;
        this.orderData.totals.total = Number(this.orderData.totals.total) || (this.orderData.totals.subtotal + this.orderData.totals.shipping + (this.orderData.totals.tax || 0));
    },

    // Enviar correos electrónicos con la nueva estructura de template
    async sendEmails() {
        const ordersTable = this.generateOrdersTable();
        
        // Asegurarse de tener datos más recientes del formulario
        this.collectFormData();
        const customer_name = (this.orderData.customer.firstName || '').trim() + ' ' + (this.orderData.customer.lastName || '').trim();
        const customer_email = (this.orderData.customer.email || '').trim();
        const address = (this.orderData.customer.address || '').trim();
        const province = (this.orderData.customer.province || '').trim();
        const canton = (this.orderData.customer.canton || '').trim();

        // Validación de seguridad: no intentar enviar si faltan email/address/province
        if (!customer_email || !address || !province) {
            alert('Por favor completa todos los datos de envío');
            console.error('EmailJS blocked: missing required fields', { customer_email, address, province, canton });
            return Promise.reject(new Error('Missing required shipping or contact fields'));
        }

        // Función auxiliar para limpiar símbolos y formatear a 2 decimales
        const parseAndFormat = (val) => {
            if (val === undefined || val === null) return '0.00';
            // Si viene como string con símbolo, limpiar caracteres no numéricos (excepto . and ,)
            let s = String(val);
            // Reemplazar símbolo de colón y espacios
            s = s.replace(/₡|\s/g, '');
            // Reemplazar comas por punto si existen
            s = s.replace(/,/g, '.');
            const n = parseFloat(s);
            if (isNaN(n)) return '0.00';
            return n.toFixed(2);
        };

        const subtotalFormatted = parseAndFormat(this.orderData.totals.subtotal);
        const shippingFormatted = parseAndFormat(this.orderData.totals.shipping);
        const taxFormatted = parseAndFormat(this.orderData.totals.tax);
        const totalFormatted = parseAndFormat(this.orderData.totals.total);

        const templateParams = {
            customer_name: customer_name,
            customer_email: customer_email,
            order_number: this.orderNumber,
            orders_html: ordersTable,
            total: totalFormatted,
            subtotal: subtotalFormatted,
            shipping: shippingFormatted,
            tax: taxFormatted,
            address: address,
            province: province,
            canton: canton
        };

        // Incluir datos del comprobante de pago si existe
        if (this.orderData.paymentProof) {
            templateParams.proof_filename = this.orderData.paymentProof.filename || 'Comprobante enviado';
            templateParams.proof_type = this.orderData.paymentProof.type || 'documento';
        } else {
            templateParams.proof_filename = 'Pendiente de comprobante';
            templateParams.proof_type = 'pendiente';
        }

        // Incluir número de referencia SINPE
        templateParams.sinpe_reference = (this.orderData.sinpeReference || '').toString().trim();

        // Detectar variables faltantes antes de enviar para facilitar depuración
        const missingKeys = Object.keys(templateParams).filter(k => templateParams[k] === undefined || templateParams[k] === null || templateParams[k] === '');
        if (missingKeys.length > 0) {
            console.warn('⚠️ EmailJS: faltan valores en templateParams:', missingKeys);
        }

        // Usar la sintaxis moderna del SDK incluyendo la Public Key explícita requerida por el servidor
        // Asegurar que customer_email esté asignado desde el formulario
        templateParams.customer_email = templateParams.customer_email || customer_email || (this.orderData.customer && this.orderData.customer.email) || '';

        // Log de depuración: mostrar templateParams completo
        console.log('📧 EmailJS templateParams enviado:', templateParams);

        return emailjs.send(
            EMAIL_CONFIG.serviceID,
            EMAIL_CONFIG.templateID,
            templateParams,
            'bconIQbmXvIrAd_SU' // Public Key (valor explícito requerido)
        );
    },

    // Validar y cargar comprobante de pago
    async validateAndUploadPaymentProof(proofInput, event) {
        // Antes de cualquier cosa, recolectar los datos del formulario
        this.collectFormData();

        // Validación de dirección: bloquear si faltan campos críticos de envío (usamos customer.* para la plantilla)
        const addr = (this.orderData && this.orderData.customer && (this.orderData.customer.address || '')).toString().trim();
        const prov = (this.orderData && this.orderData.customer && (this.orderData.customer.province || '')).toString().trim();
        const cant = (this.orderData && this.orderData.customer && (this.orderData.customer.canton || '')).toString().trim();

        if (!addr || !prov || !cant) {
            alert('Por favor, completa tu dirección de envío');
            console.error('Validation failed: address, province or canton missing', { address: addr, province: prov, canton: cant });
            return;
        }

        // Validación de número SINPE: campo requerido
        const sinpeRefInput = document.getElementById('sinpe-reference');
        const sinpeRef = (sinpeRefInput && sinpeRefInput.value || '').toString().trim();
        if (!sinpeRef) {
            alert('Por favor ingresa el número de referencia o comprobante SINPE');
            console.error('Validation failed: sinpe-reference is empty');
            return;
        }

        // Guardar número SINPE en orderData
        this.orderData.sinpeReference = sinpeRef;
        console.log('✅ Número SINPE capturado:', sinpeRef);

        // Validar que haya archivo
        if (!proofInput.files || !proofInput.files[0]) {
            alert('Por favor selecciona un comprobante de pago.');
            return;
        }

        // Validar tamaño del archivo (5MB máximo)
        const file = proofInput.files[0];
        if (file.size > 5 * 1024 * 1024) {
            alert('El archivo es demasiado grande. El tamaño máximo es 5MB.');
            return;
        }

        // Mostrar loading
        const btn = event && event.target ? event.target : document.querySelector('.btn-success');
        if (btn) { btn.classList.add('loading'); btn.disabled = true; }

        try {
            // Convertir archivo a base64
            const fileBase64 = await this.fileToBase64(file);
            this.orderData.paymentProof = {
                filename: file.name,
                type: file.type,
                data: fileBase64
            };

            // Enviar correos — no bloquear el flujo principal si falla EmailJS
            try {
                await this.sendEmails();
            } catch (emailError) {
                // Mostrar error detallado en consola
                console.error('❌ EmailJS send failed:', emailError);

                // Reconstruir templateParams localmente para detectar valores faltantes
                const ordersTableDebug = this.generateOrdersTable();
                const templateParamsDebug = {
                    customer_name: this.orderData.customer.firstName + ' ' + this.orderData.customer.lastName,
                    customer_email: this.orderData.customer.email,
                    order_number: this.orderNumber,
                    orders_html: ordersTableDebug,
                    subtotal: this.orderData.totals.subtotal,
                    shipping: this.orderData.totals.shipping,
                    total: this.orderData.totals.total,
                    address: this.orderData.customer.address,
                    province: this.orderData.customer.province,
                    canton: this.orderData.customer.canton
                };

                const missingKeysDebug = Object.keys(templateParamsDebug).filter(k => templateParamsDebug[k] === undefined || templateParamsDebug[k] === null || templateParamsDebug[k] === '');
                if (missingKeysDebug.length > 0) {
                    console.error('🔎 EmailJS: faltan/son vacíos estos campos en templateParams:', missingKeysDebug);
                }

                console.error('🔎 templateParams (depuración):', templateParamsDebug);

                // NO lanzar de nuevo: continuar flujo (éxito en Supabase / confirmación)
            }

            // Limpiar carrito (aunque EmailJS fallara, no bloqueamos el éxito de la compra)
            Cart.clearCart();

            // Mostrar confirmación
            this.showConfirmation();

        } catch (error) {
            console.error('Error al procesar el pago:', error);
            alert('Hubo un error al procesar tu pedido. Por favor intenta de nuevo o contáctanos directamente.');
            if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
        }
    },

    // Convertir archivo a base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },

    // Formatear dirección de envío
    formatShippingAddress() {
        const s = this.orderData.shipping;
        return `${s.address}, ${s.district}, ${s.canton}, ${s.province}${s.postalCode ? `, ${s.postalCode}` : ''}${s.notes ? `\nNotas: ${s.notes}` : ''}`;
    },

    // Enviar notificación a la tienda (simulado - puedes usar un webhook o API)
    sendStoreNotification(emailData) {
        // Aquí puedes implementar el envío a un webhook, API o servicio
        // Por ejemplo, usar fetch para enviar a tu backend
        
        console.log('Notificación de pedido:', {
            ...emailData,
            paymentProof: this.orderData.paymentProof
        });

        // Ejemplo de envío a un webhook (descomenta y ajusta la URL):
        /*
        fetch('https://tu-webhook-url.com/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...emailData,
                orderData: this.orderData
            })
        })
        .then(response => response.json())
        .then(data => console.log('Webhook response:', data))
        .catch(error => console.error('Webhook error:', error));
        */
    },

    // Mostrar pantalla de confirmación
    showConfirmation() {
        document.getElementById('payment-screen').style.display = 'none';
        document.getElementById('confirmation-screen').style.display = 'block';
        
        // Actualizar información
        document.getElementById('confirmation-order-number').textContent = this.orderNumber;
        document.getElementById('confirmation-email').textContent = this.orderData.customer.email;

        // Actualizar steps
        this.updateStep(3);

        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Guardar en localStorage para historial (opcional)
        this.saveOrderHistory();
    },

    // Guardar pedido en historial
    saveOrderHistory() {
        const history = JSON.parse(localStorage.getItem('fraganze_order_history') || '[]');
        history.unshift({
            orderNumber: this.orderNumber,
            date: new Date().toISOString(),
            total: this.orderData.totals.total,
            status: 'pending'
        });
        
        // Mantener solo los últimos 10 pedidos
        if (history.length > 10) {
            history.pop();
        }
        
        localStorage.setItem('fraganze_order_history', JSON.stringify(history));
    },

    // Actualizar paso visual
    updateStep(stepNumber) {
        const steps = document.querySelectorAll('.step');
        steps.forEach((step, index) => {
            const num = index + 1;
            step.classList.remove('active', 'completed');
            
            if (num === stepNumber) {
                step.classList.add('active');
            } else if (num < stepNumber) {
                step.classList.add('completed');
            }
        });
    }
,
    // Volver al formulario desde la pantalla de pago
    goBackToForm() {
        const paymentScreen = document.getElementById('payment-screen');
        const form = document.getElementById('checkout-form');
        if (paymentScreen) paymentScreen.style.display = 'none';
        if (form) form.style.display = 'block';
        this.updateStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
,
    // Confirmar pago: se llama desde el botón inline confirmPayment
    confirmPayment(evt) {
        // Simplified checkout: generate WhatsApp message and open chat with prefilled order
        if (!this.orderData) {
            this.loadOrderSummary();
            if (!this.orderData) {
                alert('No hay pedido para procesar.');
                return;
            }
        }

        // Recolectar datos del formulario antes de confirmar
        this.collectFormData();

        const customer_name = ((this.orderData.customer.firstName || '').trim() + ' ' + (this.orderData.customer.lastName || '').trim()).trim();
        const address = (this.orderData.shipping && this.orderData.shipping.address) ? this.orderData.shipping.address.trim() : (this.orderData.customer.address || '').trim();

        if (!customer_name || !address) {
            alert('Por favor completa tu Nombre y Dirección antes de confirmar el pedido.');
            this.updateStep(1);
            return;
        }

        // Construir lista de productos: Nombre (tamaño) x cantidad
        const itemsList = (this.orderData.items || []).map(i => `${i.name}${i.size ? ' (' + i.size + ')' : ''} x${i.quantity || 1}`).join(', ');

        const total = Number(this.orderData.totals && this.orderData.totals.total ? this.orderData.totals.total : 0) || 0;

        const msg = `Hola Jerald, mi nombre es ${customer_name}. Quiero pedir: ${itemsList} para enviar a: ${address}. El total es: ₡${total.toLocaleString('es-CR')}.`;

        const phone = '50684453904';
        const waLink = `https://wa.me/${phone}?text=` + encodeURIComponent(msg);

        // Abrir WhatsApp en nueva ventana/pestaña
        window.open(waLink, '_blank');

        // Generar número de pedido y mostrar confirmación localmente
        this.orderNumber = 'ORD-' + Date.now();
        this.showConfirmation();

        // Limpiar carrito local
        try { Cart.clearCart(); } catch (e) { console.warn('No se pudo limpiar el carrito automáticamente', e); }
    }
};

// Funciones globales para botones inline
function goBackToForm() {
    Checkout.goBackToForm();
}

function confirmPayment(evt) {
    Checkout.confirmPayment(evt);
}

function copyToClipboard(text, evt) {
    navigator.clipboard.writeText(text).then(() => {
        const btn = evt && evt.target ? evt.target : document.querySelector('.sinpe-number button');
        const originalText = btn ? btn.textContent : '';
        if (btn) {
            btn.textContent = '¡Copiado!';
            btn.classList.add('btn-success');
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('btn-success');
            }, 2000);
        }
    }).catch(err => {
        alert('No se pudo copiar. Por favor copia manualmente: ' + text);
    });
}

// Exportar para uso global (exponer antes de inicializar para evitar llamadas tempranas)
window.Checkout = Checkout;

// Inicializar checkout cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Checkout.init());
} else {
    Checkout.init();
}
