// ============================================================
// SHOP.JS - VERSIÓN BLINDADA CONTRA DATOS INCOMPLETOS
// ============================================================

(function() {
    'use strict';
    
    // Variables globales del sistema
    let allProducts = [];
    let filteredProducts = [];
    let currentPage = 1;
    const productsPerPage = 12;
    
    // ====================
    // INICIALIZACIÓN
    // ====================
    let initialRenderDone = false;

    function init() {
        console.log('%c=== SHOP SYSTEM INICIANDO ===', 'color: blue; font-weight: bold');
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupSystem);
        } else {
            setupSystem();
        }
    }
    
    function setupSystem() {
        console.log('DOM listo, configurando sistema...');
        setupEventListeners();

        // If API already loaded, render now
        if (window.PRODUCTS_LOADED && window.PRODUCTS.length > 0) {
            loadProducts();
            renderAllProducts();
            return;
        }

        // Show loading state
        showLoading();

        // Wait for API data (no static fallback)
        document.addEventListener('productsLoaded', function onLoad(e) {
            if (!initialRenderDone) {
                loadProducts();
                if (window.PRODUCTS.length > 0) {
                    renderAllProducts();
                } else {
                    showError((e.detail && e.detail.error) || 'Error al cargar productos');
                }
            }
            document.removeEventListener('productsLoaded', onLoad);
        });
    }

    function showLoading() {
        const grid = document.getElementById('product-grid-main');
        if (!grid || grid.querySelector('.spinner-border')) return;
        grid.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-secondary mb-3" role="status" style="width:3rem;height:3rem;">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="text-muted">Cargando productos...</p>
            </div>`;
    }

    function showError(msg) {
        const grid = document.getElementById('product-grid-main');
        if (!grid) return;
        grid.innerHTML = `
            <div class="col-12 text-center py-5">
                <h4 class="text-danger">⚠️ No se pudieron cargar los productos</h4>
                <p class="text-muted">${msg || 'Verifica que el servidor admin esté funcionando'}</p>
                <button class="btn btn-outline-dark mt-2" onclick="location.reload()">Reintentar</button>
            </div>`;
    }
    
    // ====================
    // CARGA DE PRODUCTOS
    // ====================
    function loadProducts() {
        if (window.PRODUCTS && Array.isArray(window.PRODUCTS)) {
            allProducts = window.PRODUCTS;
            filteredProducts = [...allProducts];
            console.log('%c✓ Productos cargados:', 'color: green', allProducts.length);
        } else {
            console.error('%c✗ NO SE ENCONTRARON PRODUCTOS', 'color: red');
            allProducts = [];
            filteredProducts = [];
        }
    }
    
    // ====================
    // EVENT LISTENERS
    // ====================
    function setupEventListeners() {
        console.log('Configurando event listeners...');
        
        // 1. BUSCADOR - Input en tiempo real
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                const searchTerm = e.target.value.trim();
                console.log('%cBuscando: "' + searchTerm + '"', 'color: purple');
                currentPage = 1;
                applyFiltersAndRender();
            });
            console.log('%c✓ Buscador conectado', 'color: green');
        } else {
            console.error('%c✗ NO se encontró #search-input', 'color: red');
        }
        
        // 2. ORDENAR - Change event
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', function(e) {
                const sortValue = e.target.value;
                console.log('%cOrdenando por: ' + sortValue, 'color: orange');
                applySortAndRender();
            });
            console.log('%c✓ Selector de orden conectado', 'color: green');
        } else {
            console.error('%c✗ NO se encontró #sort-select', 'color: red');
        }
        
        // 3. FILTROS CHECKBOX - Género
        const genderCheckboxes = document.querySelectorAll('.filter-gender');
        console.log('Checkboxes de género encontrados:', genderCheckboxes.length);
        genderCheckboxes.forEach(cb => {
            cb.addEventListener('change', function() {
                console.log('Género cambiado:', this.value, this.checked);
                currentPage = 1;
                applyFiltersAndRender();
            });
        });
        
        // 4. FILTROS CHECKBOX - Familia
        const familyCheckboxes = document.querySelectorAll('.filter-family');
        console.log('Checkboxes de familia encontrados:', familyCheckboxes.length);
        familyCheckboxes.forEach(cb => {
            cb.addEventListener('change', function() {
                console.log('Familia cambiada:', this.value, this.checked);
                currentPage = 1;
                applyFiltersAndRender();
            });
        });
        
        // 5. PRECIOS
        const priceMin = document.getElementById('price-min');
        const priceMax = document.getElementById('price-max');
        if (priceMin && priceMax) {
            priceMin.addEventListener('change', function() {
                console.log('Precio mínimo:', this.value);
                currentPage = 1;
                applyFiltersAndRender();
            });
            priceMax.addEventListener('change', function() {
                console.log('Precio máximo:', this.value);
                currentPage = 1;
                applyFiltersAndRender();
            });
        }
        
        // 6. BOTÓN APLICAR
        const btnApply = document.getElementById('btn-apply-filters');
        if (btnApply) {
            btnApply.addEventListener('click', function() {
                console.log('Botón aplicar clickeado');
                currentPage = 1;
                applyFiltersAndRender();
            });
        }
        
        // 7. PAGINACIÓN
        const pagination = document.querySelector('.pagination');
        if (pagination) {
            pagination.addEventListener('click', handlePaginationClick);
        }
    }
    
    // ====================
    // FILTRADO
    // ====================
    function applyFiltersAndRender() {
        console.log('%c=== APLICANDO FILTROS ===', 'color: blue; font-weight: bold');
        
        // Obtener valores de filtros
        const searchTerm = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
        
        const selectedGenders = Array.from(document.querySelectorAll('.filter-gender:checked')).map(cb => cb.value);
        const selectedFamilies = Array.from(document.querySelectorAll('.filter-family:checked')).map(cb => cb.value);
        
        const minPrice = parseFloat(document.getElementById('price-min')?.value) || 0;
        const maxPrice = parseFloat(document.getElementById('price-max')?.value) || 999999;
        
        console.log('Búsqueda:', searchTerm);
        console.log('Géneros:', selectedGenders);
        console.log('Familias:', selectedFamilies);
        console.log('Rango precio:', minPrice, '-', maxPrice);
        
        // Filtrar productos
        filteredProducts = allProducts.filter(product => {
            // SAFE: Obtener precio del producto con validación
            let price = 0;
            try {
                if (product.decant_prices && typeof product.decant_prices === 'object') {
                    price = product.decant_prices['2ml'] || product.decant_prices['3ml'] || 0;
                }
                if (price === 0 && product.price50ml) {
                    price = product.price50ml;
                }
                if (price === 0 && product.full_bottle_price && typeof product.full_bottle_price === 'number') {
                    price = product.full_bottle_price;
                }
            } catch (e) {
                console.warn('Error obteniendo precio del producto:', product.id || product.name, e);
                price = 0;
            }
            
            // 1. Filtro de Búsqueda (nombre, marca, descripción)
            let matchesSearch = true;
            if (searchTerm) {
                const name = (product.name || '').toLowerCase();
                const brand = (product.brand || '').toLowerCase();
                const desc = (product.descripcion || '').toLowerCase();
                matchesSearch = name.includes(searchTerm) || 
                               brand.includes(searchTerm) || 
                               desc.includes(searchTerm);
            }
            
            // 2. Filtro de Género
            let matchesGender = true;
            if (selectedGenders.length > 0) {
                matchesGender = selectedGenders.includes(product.genero) || 
                               selectedGenders.includes(product.category);
            }
            
            // 3. Filtro de Familia
            let matchesFamily = true;
            if (selectedFamilies.length > 0) {
                matchesFamily = selectedFamilies.some(fam => {
                    return product.familia_olfativa && product.familia_olfativa.includes(fam);
                });
            }
            
            // 4. Filtro de Precio
            const matchesPrice = price >= minPrice && price <= maxPrice;
            
            // Retornar si pasa TODOS los filtros
            return matchesSearch && matchesGender && matchesFamily && matchesPrice;
        });
        
        console.log('%cProductos filtrados: ' + filteredProducts.length + ' de ' + allProducts.length, 'color: green; font-weight: bold');
        
        // Aplicar ordenamiento
        applySort();
        
        // Renderizar
        renderProducts();
        updateResultCount();
    }
    
    // ====================
    // ORDENAMIENTO
    // ====================
    function applySort() {
        const sortValue = document.getElementById('sort-select')?.value || 'popularidad';
        console.log('Aplicando orden:', sortValue);
        
        // SAFE: Función para obtener precio con validación
        const getPrice = (p) => {
            try {
                if (p.decant_prices && typeof p.decant_prices === 'object') {
                    return p.decant_prices['2ml'] || p.decant_prices['3ml'] || p.price50ml || 0;
                }
                return p.price50ml || 0;
            } catch (e) {
                return 0;
            }
        };
        
        try {
            switch(sortValue) {
                case 'precio-ascendente':
                    filteredProducts.sort((a, b) => getPrice(a) - getPrice(b));
                    console.log('Ordenado por precio ascendente');
                    break;
                case 'precio-descendente':
                    filteredProducts.sort((a, b) => getPrice(b) - getPrice(a));
                    console.log('Ordenado por precio descendente');
                    break;
                case 'alfabetico':
                    filteredProducts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                    console.log('Ordenado alfabéticamente');
                    break;
                default: // popularidad
                    filteredProducts.sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));
                    console.log('Ordenado por popularidad (ID)');
            }
        } catch (e) {
            console.error('Error en ordenamiento:', e);
        }
    }
    
    function applySortAndRender() {
        applySort();
        renderProducts();
    }
    
    // ====================
    // RENDERIZADO
    // ====================
    function renderAllProducts() {
        console.log('Renderizando todos los productos inicialmente...');
        filteredProducts = [...allProducts];
        applySort();
        renderProducts();
        updateResultCount();
        initialRenderDone = true;
    }
    
    function renderProducts() {
        const grid = document.getElementById('product-grid-main');
        if (!grid) {
            console.error('%c✗ NO se encontró #product-grid-main', 'color: red');
            return;
        }
        
        console.log('%c=== INICIANDO RENDERIZADO ===', 'color: blue; font-weight: bold');
        
        // Limpiar grid
        grid.innerHTML = '';
        
        // Calcular paginación
        const start = (currentPage - 1) * productsPerPage;
        const end = start + productsPerPage;
        const visibleProducts = filteredProducts.slice(start, end);
        
        console.log('Renderizando página', currentPage, ':', visibleProducts.length, 'productos');
        console.log('IDs de productos a renderizar:', visibleProducts.map(p => p.id || p.name).join(', '));
        
        // Si no hay productos
        if (visibleProducts.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <h4 class="text-muted">No se encontraron productos con esos filtros.</h4>
                    <button class="btn btn-outline-dark mt-2" onclick="location.reload()">Ver todos</button>
                </div>`;
            renderPagination(0);
            return;
        }
        
        // NUEVO: Acumular HTML antes de inyectar (más seguro)
        let htmlAccumulator = '';
        let successCount = 0;
        let errorCount = 0;
        
        visibleProducts.forEach((product, index) => {
            try {
                const cardHTML = createProductCard(product);
                if (cardHTML && cardHTML.trim().length > 0) {
                    htmlAccumulator += cardHTML;
                    successCount++;
                    console.log(`✓ Producto ${index + 1}/${visibleProducts.length} renderizado:`, product.name || product.id);
                } else {
                    console.warn(`⚠ Producto ${index + 1} generó HTML vacío:`, product.id || product.name);
                    errorCount++;
                }
            } catch (error) {
                console.error(`✗ ERROR renderizando producto ${index + 1}:`, product.id || product.name, error);
                errorCount++;
                // Continuar con el siguiente producto
            }
        });
        
        console.log('%cRenderizado completado: ' + successCount + ' éxitos, ' + errorCount + ' errores', 
                    errorCount > 0 ? 'color: orange; font-weight: bold' : 'color: green; font-weight: bold');
        
        // Inyectar HTML acumulado
        if (htmlAccumulator.length > 0) {
            grid.innerHTML = htmlAccumulator;
            console.log('%c✓ HTML inyectado al DOM exitosamente', 'color: green');
        } else {
            console.error('%c✗ NO se generó HTML para inyectar', 'color: red');
            grid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <h4 class="text-danger">Error al cargar productos</h4>
                    <p class="text-muted">Por favor, revisa la consola para más detalles.</p>
                    <button class="btn btn-outline-dark mt-2" onclick="location.reload()">Recargar página</button>
                </div>`;
        }
        
        // CORREGIDO: Renderizar paginación con cálculo correcto
        const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
        console.log('Total de páginas calculadas:', totalPages);
        renderPagination(totalPages);
    }
    
    // ====================
    // CREACIÓN DE TARJETAS - VERSIÓN BLINDADA
    // ====================
    function createProductCard(product) {
        try {
            // VALIDACIÓN: Asegurar que el producto tenga propiedades básicas
            if (!product || typeof product !== 'object') {
                console.error('Producto inválido (no es objeto):', product);
                return '';
            }
            
            // SAFE: Valores por defecto para todas las propiedades
            const id = product.id || 'unknown-' + Date.now();
            const name = product.name || 'Producto sin nombre';
            const brand = product.brand || 'Munish';
            
            // SAFE: Obtener precio con múltiples fallbacks
            let priceValue = 0;
            try {
                if (product.decant_prices && typeof product.decant_prices === 'object') {
                    priceValue = product.decant_prices['2ml'] || 
                                product.decant_prices['3ml'] || 
                                product.decant_prices['5ml'] || 0;
                }
                if (priceValue === 0 && product.price50ml) {
                    priceValue = product.price50ml;
                }
            } catch (e) {
                console.warn('Error obteniendo precio:', e);
                priceValue = 0;
            }
            
            // SAFE: Formatear precio
            let priceFormatted = '0';
            try {
                if (typeof priceValue === 'number' && priceValue > 0) {
                    priceFormatted = priceValue.toLocaleString('es-CR');
                } else {
                    priceFormatted = 'Consultar';
                }
            } catch (e) {
                console.warn('Error formateando precio:', e);
                priceFormatted = String(priceValue);
            }
            
            // SAFE: Imagen con validación
            let img = product.image || 'images/product-item1.jpg';
            try {
                if (img && typeof img === 'string') {
                    if (!img.startsWith('http') && !img.startsWith('images/') && !img.startsWith('/')) {
                        img = 'images/' + img;
                    }
                } else {
                    img = 'images/product-item1.jpg';
                }
            } catch (e) {
                console.warn('Error procesando imagen:', e);
                img = 'images/product-item1.jpg';
            }
            
            // SAFE: Badge de decants
            const hasDecants = product.decant_prices && typeof product.decant_prices === 'object';
            const decantBadge = hasDecants ? '<span class="badge bg-dark position-absolute top-0 start-0 m-2">Decants</span>' : '';
            
            // CONSTRUIR HTML
            const html = `
        <div class="col-6 col-md-4 col-lg-3 mb-4">
            <div class="card product-card h-100 border-0 shadow-sm">
                <a href="single-product.html?id=${id}" class="d-block position-relative overflow-hidden">
                    <img src="${img}" class="card-img-top product-image" alt="${name}"
                         style="aspect-ratio: 1/1; object-fit: contain; padding: 1rem;"
                         onerror="this.src='images/product-item1.jpg'">
                    ${decantBadge}
                </a>
                <div class="card-body p-3 text-center d-flex flex-column">
                    <p class="text-muted small mb-1 text-uppercase">${brand}</p>
                    <h6 class="card-title text-truncate mb-2">
                        <a href="single-product.html?id=${id}" class="text-dark text-decoration-none fw-bold">${name}</a>
                    </h6>
                    <div class="mt-auto">
                        <p class="text-primary fw-bold mb-2">Desde ₡${priceFormatted}</p>
                        <a href="single-product.html?id=${id}" class="btn btn-outline-dark btn-sm w-100">Ver Opciones</a>
                    </div>
                </div>
            </div>
        </div>`;
            
            return html;
            
        } catch (error) {
            console.error('ERROR CRÍTICO en createProductCard:', error, 'Producto:', product);
            return ''; // Retornar vacío en caso de error
        }
    }
    
    // ====================
    // PAGINACIÓN - VERSIÓN CORREGIDA
    // ====================
    function renderPagination(totalPages) {
        const nav = document.querySelector('.pagination');
        if (!nav) {
            console.warn('No se encontró .pagination');
            return;
        }
        
        // Si no hay productos o solo hay 1 página, ocultar paginación
        if (totalPages <= 1) {
            nav.innerHTML = '';
            console.log('Paginación ocultada (totalPages <= 1)');
            return;
        }
        
        console.log('%cRenderizando paginación: Página ' + currentPage + ' de ' + totalPages, 'color: blue');
        
        let html = `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-action="prev">«</a>
                    </li>`;
        
        // LÓGICA MEJORADA: Evitar elipsis extraños
        for (let i = 1; i <= totalPages; i++) {
            // Siempre mostrar: primera, última, actual, y vecinas
            const isFirstOrLast = (i === 1 || i === totalPages);
            const isNearCurrent = (i >= currentPage - 1 && i <= currentPage + 1);
            
            if (isFirstOrLast || isNearCurrent) {
                html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                            <a class="page-link" href="#" data-page="${i}">${i}</a>
                         </li>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                // Solo agregar elipsis si hay un gap
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }
        
        html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-action="next">»</a>
                 </li>`;
        
        nav.innerHTML = html;
        console.log('%c✓ Paginación renderizada exitosamente', 'color: green');
    }
    
    function handlePaginationClick(e) {
        const link = e.target.closest('.page-link');
        if (!link || link.parentElement.classList.contains('disabled')) return;
        
        e.preventDefault();
        
        const action = link.dataset.action;
        const page = link.dataset.page;
        const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
        
        if (action === 'prev' && currentPage > 1) {
            currentPage--;
        } else if (action === 'next' && currentPage < totalPages) {
            currentPage++;
        } else if (page) {
            currentPage = parseInt(page);
        }
        
        console.log('Navegando a página', currentPage);
        renderProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // ====================
    // UTILIDADES
    // ====================
    function updateResultCount() {
        const el = document.querySelector('.shop-result-count strong');
        if (el) {
            el.textContent = filteredProducts.length;
        }
    }
    
    // ====================
    // INICIAR SISTEMA
    // ====================
    console.log('%cshop.js BLINDADO cargado', 'color: blue; font-weight: bold');
    init();

})();