/* Clean product renderer + global functions - FIXED VERSION */

(function () {
  'use strict';

  const CART_STORAGE_KEY = 'fraganze_cart_v3';
  const STORAGE_KEYS = {
    PRODUCTS: 'fraganze_inventory_v3'
  };

  // Precios estándar de decants en colones (CRC)
  const DECANT_PRICES = {
    'decant-2ml': 1200,
    'decant-3ml': 1600,
    'decant-5ml': 2100,
    'decant-10ml': 4000
  };

  function normalizeProduct(p){
    if(!p) return null;
    return {
      id: p.id,
      name: p.name || p.title || '',
      category: p.category,
      categoryDisplay: (p.category || '').toString(),
      tag: p.tag || '',
      description: p.description || '',
      image: (function(){
        const img = p.image || (p.images && p.images[0]) || 'images/product-item1.jpg';
        if(!img) return 'images/product-item1.jpg';
        if(img.indexOf('http')===0) return img;
        if(img.indexOf('images/')===0 || img.indexOf('/images/')===0) return img.replace(/^\//,'');
        if(img.indexOf('/')===-1 && img.indexOf('product-item')!==-1) return 'images/'+img;
        return img;
      })(),
      price50ml: p.price50ml || 0,
      price100ml: p.price100ml || 0,
      variants: [ { label: '50ml', price: p.price50ml||0 }, { label: '100ml', price: p.price100ml||0 } ],
      stock: p.stock != null ? p.stock : 0,
      // IMPORTANTE: Asegurar que pasamos los precios especiales si existen
      decant_prices: p.decant_prices || null 
    };
  }

  // CORREGIDO: Prioriza window.PRODUCTS (products.js) sobre todo lo demás
  function getSourceProducts(){
    // 1. Intentar cargar desde la variable global definida en products.js
    if(typeof window.PRODUCTS !== 'undefined' && Array.isArray(window.PRODUCTS)){
      return window.PRODUCTS;
    }
    // 2. Fallback: Intentar leer de LocalStorage si la variable global falla
    try { 
      const s = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)); 
      return Array.isArray(s) ? s : []; 
    } catch(e){ return []; }
  }

  const DB = {
    read(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){return null;} },
    write(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} },
    
    // CORREGIDO: Inicializa usando window.PRODUCTS
    init(){ 
      // Iniciar carrito si no existe
      if(!this.read(CART_STORAGE_KEY)) this.write(CART_STORAGE_KEY,[]); 
      
      // Sincronizar productos nuevos al LocalStorage
      if(typeof window.PRODUCTS !== 'undefined' && Array.isArray(window.PRODUCTS)){
        this.write(STORAGE_KEYS.PRODUCTS, window.PRODUCTS);
      }
    },
    
    getProducts(){ return getSourceProducts().map(normalizeProduct).filter(Boolean); },
    
    // CORREGIDO: Busca directamente en la lista de productos normalizada
    getProductById(id){ 
      return this.getProducts().find(x => String(x.id) === String(id)) || null; 
    }
  };

  const UI = {
    formatMoney(a){ try{ return new Intl.NumberFormat('es-CR',{style:'currency',currency:'CRC'}).format(a); }catch(e){ return '₡'+(a||0).toLocaleString(); } },
    updateElement(sel,val,html=false){ const el=document.querySelector(sel); if(el) el[html?'innerHTML':'textContent']=val; }
  };

  function renderGlobalGrids(productsOpt){ const grid = document.querySelector('.product-grid-dynamic'); if(!grid) return; const products = productsOpt!==undefined?productsOpt:DB.getProducts(); const countEl = document.querySelector('.shop-result-count strong'); if(countEl) countEl.textContent = products.length; if(!products.length){ grid.innerHTML = '<div class="col-12 text-center py-5">No hay productos</div>'; return; } const html = products.map(p=>{
    const link = 'single-product.html?id='+encodeURIComponent(p.id);
    return `<div class="col-6 col-md-4 col-lg-3 mb-4"><div class="card product-card h-100"><a href="${link}" class="d-block text-center p-3"><img src="${p.image}" class="img-fluid product-image" alt="${p.name}"></a><div class="p-3 text-center"><h3 class="fs-6 text-truncate"><a href="${link}" class="text-decoration-none text-dark">${p.name}</a></h3><div class="text-muted">${UI.formatMoney(p.price50ml)} - ${UI.formatMoney(p.price100ml)}</div><div class="mt-2"><button class="btn btn-dark btn-add-to-cart" data-product-id="${p.id}" data-size="50ml" data-quantity="1">Agregar al Carrito</button></div></div></div></div>`;
  }).join(''); grid.innerHTML = `<div class="row g-3">${html}</div>`; }

  function applyFilters(){
    const all = DB.getProducts();
    const search = (document.getElementById('search-input')||{}).value||'';
    const term = search.trim().toLowerCase();
    const min = parseFloat((document.getElementById('price-min')||{}).value) || 0;
    const max = parseFloat((document.getElementById('price-max')||{}).value) || Infinity;

    // categories - read labels of checked boxes
    const catChecks = Array.from(document.querySelectorAll('.filter-category:checked')).map(ch => (ch.value||'').toString().trim().toLowerCase()).filter(Boolean);
    // remove 'todos' as it means no filtering by category
    const effectiveCatChecks = catChecks.filter(c => c !== 'todos');

    let filtered = all.filter(p=>{
      // search
      if(term){ const hay = ((p.name||'')+' '+(p.description||'')).toLowerCase(); if(!hay.includes(term)) return false; }
      // price (use lowest available price)
      const price = Math.min(Number(p.price50ml||Infinity), Number(p.price100ml||Infinity));
      if(price < min || price > max) return false;
      // categories: if 'todos' checked or nothing checked -> ignore category filter
      const hasCatChecks = effectiveCatChecks.length > 0;
      if(hasCatChecks){
        const matches = effectiveCatChecks.some(c=> {
          if(!c) return false; const fields = [p.category||'', p.type||'', p.brand||'', p.name||'']; return fields.join(' ').toLowerCase().includes(c);
        });
        if(!matches) return false;
      }

      // type filters (separate group)
      const typeChecks = Array.from(document.querySelectorAll('.filter-type:checked')).map(ch => (ch.value||'').toString().trim().toLowerCase()).filter(Boolean);
      if(typeChecks.length > 0){
        const tmatch = typeChecks.some(tc => {
          const fields = [p.type||'', p.category||'', p.tag||'', p.name||''];
          return fields.join(' ').toLowerCase().includes(tc);
        });
        if(!tmatch) return false;
      }
      return true;
    });

    // sort
    const sortEl = document.getElementById('sort-select');
    if(sortEl){ const idx = sortEl.selectedIndex; if(idx===1) filtered.sort((a,b)=> Math.min(a.price50ml||0,a.price100ml||0) - Math.min(b.price50ml||0,b.price100ml||0)); else if(idx===2) filtered.sort((a,b)=> Math.min(b.price50ml||0,b.price100ml||0) - Math.min(a.price50ml||0,a.price100ml||0)); else if(idx===3) filtered.sort((a,b)=> Number(b.id)-Number(a.id)); }

    renderGlobalGrids(filtered);
  }

  function renderProductDetail(){ 
    const id = (new URLSearchParams(window.location.search)).get('id'); 
    if(!id) return; 
    const p=DB.getProductById(id); 
    if(!p) return; 
    UI.updateElement('.product-title',p.name||''); 
    
    // --- LÓGICA AÑADIDA: Mostrar precio inicial correcto ---
    let initialPrice = p.price50ml || 0;
    if(p.decant_prices && p.decant_prices['2ml']) {
        initialPrice = p.decant_prices['2ml'];
    }
    UI.updateElement('.current-price', UI.formatMoney(initialPrice));
    // -----------------------------------------------------

    UI.updateElement('.product-description', p.description||''); 
    const main = document.getElementById('mainImage'); 
    if(main && p.image) main.src = p.image;
    
    // --- LÓGICA AÑADIDA: Inyectar datos al botón ---
    const btn = document.querySelector('.btn-add-to-cart');
    if(btn) {
        btn.dataset.productId = p.id;
        btn.dataset.size = 'Botella Completa';
        btn.dataset.quantity = '1';
    }
    // ----------------------------------------------
    
    // --- NUEVO: Asegurar que el input de cantidad empiece en 1 ---
    const qInput = document.getElementById('quantity');
    if(qInput) {
        qInput.value = '1';
        console.log('Cantidad inicial establecida en:', qInput.value);
    }
    // --------------------------------------------------------------

    // Inicializar evento para cambios de tamaño
    initializeSizeSelector(p);
    
    // --- LÓGICA AÑADIDA: Inicializar selector de cantidad ---
    initializeQuantitySelector();
  }

  function initializeSizeSelector(product) {
    const sizeInputs = document.querySelectorAll('input[name="size-option"]');
    sizeInputs.forEach(input => {
      input.addEventListener('change', function() {
        updatePriceDisplay(product, this.value);
        
        // --- LÓGICA AÑADIDA: Actualizar botón al cambiar tamaño ---
        const btn = document.querySelector('.btn-add-to-cart');
        if(btn) {
            // Mapeo amigable para el carrito
            const labels = {
                'botella-completa': 'Botella Completa',
                'decant-2ml': 'Decant 2ml',
                'decant-3ml': 'Decant 3ml',
                'decant-5ml': 'Decant 5ml',
                'decant-10ml': 'Decant 10ml'
            };
            btn.dataset.size = labels[this.value] || this.value;
        }
        // ---------------------------------------------------------
      });
    });
  }

  // --- FUNCIÓN NUEVA: Manejar input de cantidad ---
  function initializeQuantitySelector() {
      const qInput = document.getElementById('quantity');
      const btn = document.querySelector('.btn-add-to-cart');
      if(qInput && btn) {
          qInput.addEventListener('change', function() {
              // Validar que no sea menor a 1
              let val = parseInt(this.value) || 1;
              if(val < 1) val = 1;
              this.value = val;
              btn.dataset.quantity = val;
              console.log('Cantidad cambiada manualmente a:', val);
          });
      }
  }

  function updatePriceDisplay(product, selectedSize) {
    let price = product.price50ml || 0; // Default price
    
    // --- LÓGICA MEJORADA DE PRECIOS ---
    // Convertir a clave simple
    let sizeKey = null;
    if (selectedSize.includes('2ml')) sizeKey = '2ml';
    else if (selectedSize.includes('3ml')) sizeKey = '3ml';
    else if (selectedSize.includes('5ml')) sizeKey = '5ml';
    else if (selectedSize.includes('10ml')) sizeKey = '10ml';

    if (selectedSize === 'botella-completa') {
      price = product.price50ml || 0;
    } else if (sizeKey && product.decant_prices && product.decant_prices[sizeKey]) {
      price = product.decant_prices[sizeKey]; // Usar precio específico del producto
    } else if (DECANT_PRICES[selectedSize]) {
      price = DECANT_PRICES[selectedSize]; // Fallback
    }
    // ----------------------------------
    
    UI.updateElement('.current-price', UI.formatMoney(price));
  }

  function getSelectedSize() {
    const sizeInput = document.querySelector('input[name="size-option"]:checked');
    return sizeInput ? sizeInput.value : 'botella-completa';
  }

  function getSizeLabel(sizeValue) {
    const labels = {
      'botella-completa': 'Botella Completa',
      'decant-2ml': 'Decant 2ml',
      'decant-3ml': 'Decant 3ml',
      'decant-5ml': 'Decant 5ml',
      'decant-10ml': 'Decant 10ml'
    };
    return labels[sizeValue] || sizeValue;
  }

  function getSizePrice(sizeValue, product) {
    if (sizeValue === 'botella-completa') {
      return product.price50ml || 0;
    }
    return DECANT_PRICES[sizeValue] || 0;
  }

  function bindShopFilters(){ const grid=document.querySelector('.product-grid-dynamic'); if(!grid) return; const s=document.getElementById('search-input'); if(s){ s.addEventListener('input', applyFilters); s.addEventListener('keyup', applyFilters);} const btn=document.getElementById('btn-apply-filters'); if(btn) btn.addEventListener('click', applyFilters);
    // price inputs
    const pmin = document.getElementById('price-min'); const pmax = document.getElementById('price-max'); if(pmin) pmin.addEventListener('change', applyFilters); if(pmax) pmax.addEventListener('change', applyFilters);
    // category and type checkboxes
    Array.from(document.querySelectorAll('.filter-category, .filter-type')).forEach(ch=> ch.addEventListener('change', applyFilters));
    // sort select
    const sortEl = document.getElementById('sort-select'); if(sortEl) sortEl.addEventListener('change', applyFilters);
}

  // expose
  window.STORAGE_KEYS = STORAGE_KEYS; 
  window.DB = DB; 
  window.UI = UI; 
  window.DECANT_PRICES = DECANT_PRICES;
  window.renderGlobalGrids = renderGlobalGrids; 
  window.applyFilters = applyFilters; 
  window.bindShopFilters = bindShopFilters; 
  window.renderProductDetail = renderProductDetail;
  window.getSelectedSize = getSelectedSize;
  window.getSizeLabel = getSizeLabel;
  window.getSizePrice = getSizePrice;

})();

// =========================================================
// FUNCIONES GLOBALES FUERA DEL IIFE - CORREGIDAS
// =========================================================

// FUNCIÓN CORREGIDA: Incrementar cantidad
window.increaseQuantity = function(){ 
  const q = document.getElementById('quantity'); 
  if(!q) {
      console.error('No se encontró el input #quantity');
      return;
  }
  
  // CORREGIDO: Parsear correctamente y asegurar mínimo de 1
  let currentValue = parseInt(q.value, 10);
  if(isNaN(currentValue) || currentValue < 1) {
      currentValue = 1;
  }
  
  let newValue = currentValue + 1;
  
  // Validar contra stock si existe
  const id = (new URLSearchParams(window.location.search)).get('id'); 
  if(id && window.DB) { 
    const p = window.DB.getProductById(id); 
    if(p && p.stock != null && p.stock > 0) {
        newValue = Math.min(newValue, p.stock);
    }
  }
  
  // Actualizar input
  q.value = newValue;
  
  // Actualizar data del botón
  const btn = document.querySelector('.btn-add-to-cart');
  if(btn) {
      btn.dataset.quantity = newValue;
  }
  
  console.log('✓ Cantidad incrementada a:', newValue);
};

// FUNCIÓN CORREGIDA: Decrementar cantidad
window.decreaseQuantity = function(){ 
  const q = document.getElementById('quantity'); 
  if(!q) {
      console.error('No se encontró el input #quantity');
      return;
  }
  
  // CORREGIDO: Parsear correctamente y asegurar mínimo de 1
  let currentValue = parseInt(q.value, 10);
  if(isNaN(currentValue) || currentValue < 1) {
      currentValue = 1;
  }
  
  // Decrementar pero nunca bajar de 1
  let newValue = Math.max(1, currentValue - 1);
  
  // Actualizar input
  q.value = newValue;
  
  // Actualizar data del botón
  const btn = document.querySelector('.btn-add-to-cart');
  if(btn) {
      btn.dataset.quantity = newValue;
  }
  
  console.log('✓ Cantidad decrementada a:', newValue);
};

// La función addToCart antigua ya no es necesaria si usamos el listener de cart.js
// Pero la dejamos por compatibilidad si tienes onclick="..." en el HTML
window.addToCart = function(idArg){ 
  const pid = idArg || (new URLSearchParams(window.location.search)).get('id'); 
  if(!pid) return; 
  
  // Intentar usar el sistema nuevo de Cart primero
  if(window.Cart && window.Cart.addItem) {
      const btn = document.querySelector('.btn-add-to-cart');
      const size = (btn && btn.dataset.size) ? btn.dataset.size : 'Botella Completa';
      const qty = (btn && btn.dataset.quantity) ? parseInt(btn.dataset.quantity) : 1;
      window.Cart.addItem(pid, size, qty);
      return;
  }
  
  // Fallback al sistema antiguo
  const p = window.DB ? window.DB.getProductById(pid) : null; 
  if(!p){ 
    alert('Producto no encontrado.'); 
    return; 
  } 
  
  const q = document.getElementById('quantity'); 
  const qty = parseInt(q && q.value ? q.value : 1, 10) || 1;
  const selectedSize = window.getSelectedSize ? window.getSelectedSize() : 'botella-completa';
  const sizeLabel = window.getSizeLabel ? window.getSizeLabel(selectedSize) : selectedSize;
  const size = sizeLabel; 
  const price = window.getSizePrice ? window.getSizePrice(selectedSize, p) : (p.price50ml || 0);
  
  if(window.DB){ 
    const cart = window.DB.read('fraganze_cart_v3') || []; 
    const existingIndex = cart.findIndex(item => String(item.id) === String(p.id) && item.size === size);
    
    if (existingIndex > -1) {
      cart[existingIndex].quantity += qty;
    } else {
      cart.push({ 
        id: p.id, 
        name: p.name, 
        price: price,
        size: size, 
        quantity: qty, 
        image: p.image 
      });
    }
    
    window.DB.write('fraganze_cart_v3', cart); 
    try{ 
      document.dispatchEvent(new CustomEvent('cartUpdated', {
        detail: {
          items: cart.reduce((s, it) => s + (it.quantity || 0), 0), 
          total: cart.reduce((s, it) => s + (it.price || 0) * (it.quantity || 0), 0)
        }
      })); 
    } catch(e){} 
  }
  alert('¡' + p.name + ' (' + size + ') añadido al carrito!'); 
};

// =========================================================
// CORRECCIÓN CRÍTICA PARA shop.html
// =========================================================
window.addEventListener('load', function(){ 
  try{ if(window.DB && typeof window.DB.init==='function') window.DB.init(); }catch(e){} 
  try{ if(typeof window.updateCartBadge==='function') window.updateCartBadge(); }catch(e){} 

  // SOLO ejecutar el renderizado de product.js si NO estamos en la tienda
  const isShopPage = window.location.pathname.includes('shop.html');
  if (!isShopPage) {
    // Show loading state until API data arrives
    const container = document.querySelector('.product-info') || document.getElementById('product-detail');
    if (container && !window.PRODUCTS_LOADED) {
      container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-secondary mb-3" role="status" style="width:3rem;height:3rem;"><span class="visually-hidden">Cargando...</span></div><p class="text-muted">Cargando producto...</p></div>';
    }
  }

  try{ window.bindShopFilters && window.bindShopFilters(); }catch(e){} 
  // Try to render now (will work if API already responded)
  try{ window.renderProductDetail && window.renderProductDetail(); }catch(e){} 
});

// Render when API data arrives
document.addEventListener('productsLoaded', function(){
  try{ window.DB && window.DB.init(); }catch(e){}
  try{ window.renderProductDetail && window.renderProductDetail(); }catch(e){}
  try{ window.updateCartBadge && window.updateCartBadge(); }catch(e){}
});