// API product loader — SOLE source of products (no static fallback)
(function() {
  'use strict';

  const API_BASE = '/api';
  window.PRODUCTS = [];
  window.PRODUCTS_LOADED = false;

  async function loadProducts() {
    try {
      const res = await fetch(API_BASE + '/products');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();

      window.PRODUCTS = data.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand || 'Munish',
        genero: p.genero || 'Unisex',
        familia_olfativa: p.familia_olfativa || '',
        descripcion: p.descripcion || '',
        notas_salida: Array.isArray(p.notas_salida) ? p.notas_salida.join(', ') : '',
        notas_corazon: Array.isArray(p.notas_corazon) ? p.notas_corazon.join(', ') : '',
        notas_fondo: Array.isArray(p.notas_fondo) ? p.notas_fondo.join(', ') : '',
        ocasion: Array.isArray(p.ocasion) ? p.ocasion : [],
        duracion: p.duracion || '',
        estacion: Array.isArray(p.estacion) ? p.estacion : [],
        full_bottle_price: p.full_bottle_price || 0,
        price50ml: p.price50ml || 0,
        price100ml: p.price100ml || 0,
        decant_prices: p.decant_prices || null,
        stock: p.stock || 0,
        image: p.image && p.image !== '/images/product-item1.jpg' ? p.image : (p.image || 'images/product-item1.jpg'),
        is_featured: p.is_featured || false,
      }));

      window.PRODUCTS_LOADED = true;
      console.log('[API] Productos cargados:', window.PRODUCTS.length);

      document.dispatchEvent(new CustomEvent('productsLoaded', {
        detail: { count: window.PRODUCTS.length, source: 'api' }
      }));

      if (typeof window.updateCartBadge === 'function') {
        window.updateCartBadge();
      }
    } catch (err) {
      console.error('[API] Error:', err);
      window.PRODUCTS_LOADED = true;
      document.dispatchEvent(new CustomEvent('productsLoaded', {
        detail: { count: 0, source: 'error', error: err.message }
      }));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProducts);
  } else {
    loadProducts();
  }

  window.loadProducts = loadProducts;
})();
