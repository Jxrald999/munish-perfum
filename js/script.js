(function ($) {
  "use strict";

  // =========================
  // HEADER STICKY
  // =========================
  function headerSticky() {
    const header = document.querySelector("#header");
    if (!header) return;

    window.addEventListener("scroll", () => {
      // Añadimos una clase para cambios de color o sombra al hacer scroll
      if (window.scrollY > 50) {
        header.classList.add("sticky", "shadow-sm");
      } else {
        header.classList.remove("sticky", "shadow-sm");
      }
    });
  }

  // =========================
  // SWIPER (TESTIMONIOS)
  // =========================
  function initSlider() {
    const el = document.querySelector(".testimonial-swiper");
    if (!el) return;

    new Swiper(".testimonial-swiper", {
      slidesPerView: 1,
      spaceBetween: 30,
      loop: true,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
    });
  }

  // =========================
  // AOS (ANIMACIONES)
  // =========================
  function initAOS() {
    if (typeof AOS === "undefined") return;

    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
    });
  }

  // =========================
  // COLORBOX (VIDEO PLAYER)
  // =========================
  function initColorbox() {
    if (!$.fn.colorbox) return;

    // Configuración para videos de YouTube o Vimeo
    $(".youtube, .video-play-btn").colorbox({
      iframe: true,
      innerWidth: "80%",
      innerHeight: "80%",
      maxWidth: "960px",
      maxHeight: "585px",
      opacity: 0.8,
      fixed: true,
      onOpen: function() {
        $('body').css('overflow', 'hidden'); // Bloquear scroll al ver video
      },
      onClosed: function() {
        $('body').css('overflow', 'auto');
      }
    });
  }

  // ==========================================
  // REFRESH AOS PARA PRODUCTOS DINÁMICOS
  // ==========================================
  // Esta función es vital ahora que los productos se cargan por JS
  function refreshAOS() {
    if (typeof AOS !== "undefined") {
      setTimeout(() => {
        AOS.refresh();
      }, 500); // Esperamos a que el render de product.js termine
    }
  }

  // =========================
  // DOM READY
  // =========================
  $(document).ready(function () {
    headerSticky();
    initSlider();
    initAOS();
    initColorbox();
    refreshAOS(); // Refresca las animaciones de los productos cargados
  });

  // Exportar funciones útiles globalmente si fuera necesario
  window.FraganzeTheme = {
    refreshAnimations: refreshAOS
  };

})(jQuery);