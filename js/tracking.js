/* TRACKING.JS - Sistema de rastreo de pedidos con Supabase */

// ⚠️ CONFIGURACIÓN REQUERIDA ⚠️
// Reemplaza estos valores con los de tu proyecto Supabase
const SUPABASE_CONFIG = {
    url: 'https://tu-proyecto.supabase.co', // CAMBIAR por tu URL de Supabase
    key: 'tu-anon-public-key' // CAMBIAR por tu anon key de Supabase
};

// Inicializar Supabase
let supabase = null;

// Verificar si Supabase está configurado
function initSupabase() {
    if (window.supabase && SUPABASE_CONFIG.url.includes('supabase.co')) {
        supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
        return true;
    }
    return false;
}

const TrackingSystem = {
    // Estado
    currentOrder: null,

    // Inicializar
    init() {
        this.attachEventListeners();
        this.checkUrlParams();
    },

    // Event Listeners
    attachEventListeners() {
        const form = document.getElementById('tracking-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.searchOrder();
            });
        }
    },

    // Verificar parámetros URL (para links directos)
    checkUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const orderNum = params.get('order');
        const email = params.get('email');
        
        if (orderNum || email) {
            document.getElementById('order-input').value = orderNum || email;
            this.searchOrder();
        }
    },

    // Buscar pedido
    async searchOrder() {
        const query = document.getElementById('order-input').value.trim();
        
        if (!query) {
            alert('Por favor ingresa un número de pedido o email');
            return;
        }

        this.showLoading();

        // Si Supabase está configurado, usar base de datos real
        if (initSupabase()) {
            await this.searchInSupabase(query);
        } else {
            // Modo demo con localStorage (para testing sin backend)
            this.searchInLocalStorage(query);
        }
    },

    // Buscar en Supabase
    async searchInSupabase(query) {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, tracking_events(*)')
                .or(`order_number.eq.${query},customer_email.ilike.${query}`)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error || !data) {
                this.showError();
                return;
            }

            this.currentOrder = data;
            this.displayTracking(data);
            
        } catch (err) {
            console.error('Error buscando en Supabase:', err);
            this.showError();
        }
    },

    // Buscar en localStorage (modo demo)
    searchInLocalStorage(query) {
        // Buscar en historial de pedidos
        const history = JSON.parse(localStorage.getItem('fraganze_order_history') || '[]');
        const order = history.find(o => 
            o.orderNumber === query || 
            (o.email && o.email.toLowerCase() === query.toLowerCase())
        );

        if (order) {
            // Simular datos completos para el demo
            this.currentOrder = this.generateDemoOrder(order);
            this.displayTracking(this.currentOrder);
        } else {
            this.showError();
        }
    },

    // Generar orden demo para testing
    generateDemoOrder(baseOrder) {
        const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
        const currentStatusIndex = Math.min(
            Math.floor((Date.now() - new Date(baseOrder.date).getTime()) / (1000 * 60 * 60 * 24)),
            statuses.length - 1
        );
        
        const events = [];
        const baseDate = new Date(baseOrder.date);
        
        for (let i = 0; i <= currentStatusIndex; i++) {
            const eventDate = new Date(baseDate);
            eventDate.setDate(eventDate.getDate() + i);
            
            events.push({
                status: this.getStatusText(statuses[i]),
                message: this.getStatusMessage(statuses[i]),
                location: i > 1 ? 'San José, Costa Rica' : null,
                created_at: eventDate.toISOString()
            });
        }

        return {
            order_number: baseOrder.orderNumber,
            customer_email: baseOrder.email || 'cliente@example.com',
            total: baseOrder.total,
            status: statuses[currentStatusIndex],
            created_at: baseOrder.date,
            tracking_number: currentStatusIndex >= 3 ? `CR${Math.floor(Math.random() * 1000000000)}` : null,
            tracking_company: currentStatusIndex >= 3 ? 'Correos de Costa Rica' : null,
            tracking_url: currentStatusIndex >= 3 ? 'https://www.correos.go.cr/rastreo' : null,
            tracking_events: events
        };
    },

    // Mostrar loading
    showLoading() {
        document.getElementById('loading-state').style.display = 'block';
        document.getElementById('error-state').style.display = 'none';
        document.getElementById('tracking-result').style.display = 'none';
    },

    // Mostrar error
    showError() {
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('error-state').style.display = 'block';
        document.getElementById('tracking-result').style.display = 'none';
    },

    // Mostrar resultado
    displayTracking(order) {
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('error-state').style.display = 'none';
        document.getElementById('tracking-result').style.display = 'block';

        // Información básica
        document.getElementById('order-number').textContent = order.order_number;
        document.getElementById('order-date').textContent = new Date(order.created_at).toLocaleDateString('es-CR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('order-total').textContent = `₡${(order.total || 0).toLocaleString('es-CR')}`;
        
        // Status badge
        const statusBadge = document.getElementById('order-status');
        statusBadge.textContent = this.getStatusText(order.status);
        statusBadge.className = `status-badge bg-${this.getStatusColor(order.status)}`;

        // Información de tracking (si existe)
        if (order.tracking_number) {
            document.getElementById('tracking-company').textContent = order.tracking_company || 'N/A';
            document.getElementById('tracking-number').textContent = order.tracking_number;
            
            if (order.tracking_url) {
                document.getElementById('tracking-url').href = order.tracking_url;
                document.getElementById('tracking-url').style.display = 'inline-block';
            } else {
                document.getElementById('tracking-url').style.display = 'none';
            }
            
            document.getElementById('tracking-info').style.display = 'block';
        } else {
            document.getElementById('tracking-info').style.display = 'none';
        }

        // Renderizar timeline
        this.renderTimeline(order.tracking_events || []);

        // Scroll suave al resultado
        setTimeout(() => {
            document.getElementById('tracking-result').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100);
    },

    // Renderizar timeline
    renderTimeline(events) {
        const timeline = document.getElementById('timeline');
        
        if (!events || events.length === 0) {
            timeline.innerHTML = `
                <div class="text-center text-muted py-4">
                    <p>Aún no hay actualizaciones para este pedido.</p>
                    <small>Te notificaremos cuando haya novedades.</small>
                </div>
            `;
            return;
        }

        // Ordenar eventos por fecha (más reciente primero)
        const sortedEvents = [...events].sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        );

        timeline.innerHTML = sortedEvents.map((event, index) => `
            <div class="timeline-item">
                <div class="timeline-dot ${index === 0 ? 'active' : ''}">
                    ${this.getEventIcon(event.status, index === 0)}
                </div>
                <div class="timeline-content">
                    <h6 class="mb-2 ${index === 0 ? 'text-primary' : ''}">${event.status}</h6>
                    ${event.message ? `<p class="mb-2 text-muted">${event.message}</p>` : ''}
                    ${event.location ? `
                        <p class="mb-1 small">
                            <svg width="12" height="12" fill="currentColor" class="me-1" viewBox="0 0 16 16">
                                <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                            </svg>
                            ${event.location}
                        </p>
                    ` : ''}
                    <small class="text-muted">
                        <svg width="12" height="12" fill="currentColor" class="me-1" viewBox="0 0 16 16">
                            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                        </svg>
                        ${new Date(event.created_at).toLocaleString('es-CR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </small>
                </div>
            </div>
        `).join('');
    },

    // Obtener ícono del evento
    getEventIcon(status, isActive) {
        const icons = {
            'Pedido Recibido': '<circle cx="8" cy="8" r="4"/>',
            'Pago Confirmado': '<path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>',
            'En Preparación': '<path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>',
            'Enviado': '<path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-3.998-.085A1.5 1.5 0 0 1 0 10.5v-7z"/>',
            'Entregado': '<path fill-rule="evenodd" d="M10.97 4.97a.75.75 0 0 1 1.071 1.05l-3.992 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.235.235 0 0 1 .02-.022z"/>'
        };
        
        const icon = icons[status] || '<circle cx="8" cy="8" r="4"/>';
        return `<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">${icon}</svg>`;
    },

    // Textos de estado
    getStatusText(status) {
        const texts = {
            pending: 'Pendiente de Confirmación',
            confirmed: 'Pago Confirmado',
            processing: 'En Preparación',
            shipped: 'Enviado',
            delivered: 'Entregado',
            cancelled: 'Cancelado'
        };
        return texts[status] || status;
    },

    // Mensajes de estado
    getStatusMessage(status) {
        const messages = {
            pending: 'Estamos verificando tu pago',
            confirmed: 'Tu pago ha sido confirmado exitosamente',
            processing: 'Estamos preparando tu pedido con mucho cuidado',
            shipped: 'Tu pedido está en camino',
            delivered: '¡Tu pedido ha sido entregado! Disfruta tus fragancias',
            cancelled: 'Este pedido ha sido cancelado'
        };
        return messages[status] || '';
    },

    // Colores de estado
    getStatusColor(status) {
        const colors = {
            pending: 'warning',
            confirmed: 'info',
            processing: 'primary',
            shipped: 'success',
            delivered: 'success',
            cancelled: 'danger'
        };
        return colors[status] || 'secondary';
    }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TrackingSystem.init());
} else {
    TrackingSystem.init();
}

// Exportar para uso global
window.TrackingSystem = TrackingSystem;
