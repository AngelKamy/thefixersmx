/* ============================================================
   THE FIXERS — script.js
   Módulos: Nav · Reveal · Sticky CTA · Form · Spotlight · Track
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     CONFIG (ajusta acá tus URLs, números y endpoints)
     ---------------------------------------------------------- */
  const CONFIG = {
    whatsappNumber: '525500000000', // ← reemplazá con el número real (formato internacional sin '+')
    whatsappMessage: 'Hola The Fixers, quiero una cotización',
    formEndpoint: null, // ← cuando tengas backend, poné acá la URL POST
  };

  /* ----------------------------------------------------------
     1. NAVEGACIÓN — burger + scroll state
     ---------------------------------------------------------- */
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const navMobile = document.getElementById('navMobile');

  if (burger && navMobile) {
    burger.addEventListener('click', () => {
      const isOpen = navMobile.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(isOpen));
      navMobile.setAttribute('aria-hidden', String(!isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Cerrar al hacer clic en cualquier link
    navMobile.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        navMobile.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        navMobile.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });

    // Cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMobile.classList.contains('is-open')) {
        burger.click();
      }
    });
  }

  /* ----------------------------------------------------------
     2. SCROLL REVEAL — IntersectionObserver
     ---------------------------------------------------------- */
  const revealEls = [
    '.hero-copy',
    '.hero-visual',
    '.hero-kpis',
    '.section-head',
    '.problem-card',
    '.service',
    '.case',
    '.testimonial',
    '.step',
    '.process-side',
    '.guarantee-box',
    '.faq-item',
    '.cta-band-inner',
    '.contact-info',
    '.contact-form',
  ].join(',');

  document.querySelectorAll(revealEls).forEach((el) => el.classList.add('reveal'));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  } else {
    // Fallback: mostrar todo
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
  }

  /* ----------------------------------------------------------
     3. NAV SCROLL STATE
     ---------------------------------------------------------- */
  let lastScroll = 0;
  const onScroll = () => {
    const y = window.scrollY;
    if (nav) nav.classList.toggle('is-scrolled', y > 20);

    // Sticky CTA: aparece después del hero (cuando se scrollea ~600px)
    handleStickyCta(y);
    lastScroll = y;
  };

  let scrollRaf = null;
  window.addEventListener(
    'scroll',
    () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        onScroll();
        scrollRaf = null;
      });
    },
    { passive: true }
  );

  /* ----------------------------------------------------------
     4. STICKY CTA (móvil) — aparece tras scroll
     ---------------------------------------------------------- */
  const stickyCta = document.getElementById('stickyCta');
  const handleStickyCta = (y) => {
    if (!stickyCta) return;
    const threshold = 500;
    const shouldShow = y > threshold;
    if (shouldShow !== stickyCta.classList.contains('is-visible')) {
      stickyCta.classList.toggle('is-visible', shouldShow);
      stickyCta.setAttribute('aria-hidden', String(!shouldShow));
      document.body.classList.toggle('sticky-active', shouldShow);
    }
  };

  /* ----------------------------------------------------------
     5. SPOTLIGHT en service cards (hover)
     ---------------------------------------------------------- */
  // Solo en dispositivos con hover real (no móvil)
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.service, .problem-card, .case').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const mx = ((e.clientX - r.left) / r.width) * 100;
        const my = ((e.clientY - r.top) / r.height) * 100;
        card.style.setProperty('--mx', mx + '%');
        card.style.setProperty('--my', my + '%');
      });
    });
  }

  /* ----------------------------------------------------------
     6. FORMULARIO — validación + envío
     ---------------------------------------------------------- */
  const form = document.getElementById('leadForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;

      // Validación básica HTML5
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';

      try {
        const data = Object.fromEntries(new FormData(form));

        // Si hay endpoint configurado, hacer POST real
        if (CONFIG.formEndpoint) {
          const res = await fetch(CONFIG.formEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error('Error al enviar');
        } else {
          // Demo: simular envío
          await new Promise((r) => setTimeout(r, 800));
          console.log('Lead capturado:', data);
        }

        // Track conversión (Google Analytics / Meta Pixel)
        track('form_submit', { service: data.servicio, ciudad: data.ciudad });

        // Mostrar éxito
        showFormSuccess(form, data);
      } catch (err) {
        console.error(err);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        alert('Hubo un error. Por favor escribinos por WhatsApp.');
      }
    });
  }

  function showFormSuccess(formEl, data) {
    formEl.classList.add('is-success');
    const success = document.createElement('div');
    success.className = 'form-success';
    success.innerHTML = `
      <div class="form-success-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>
      </div>
      <h3>¡Mensaje recibido!</h3>
      <p>Te respondemos por WhatsApp al <b>${escapeHtml(data.telefono || '')}</b> en menos de 24 horas.</p>
      <a href="https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(
      'Hola, acabo de enviar el formulario'
    )}" class="btn btn-primary">Adelantar conversación por WhatsApp</a>
    `;
    formEl.appendChild(success);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  /* ----------------------------------------------------------
     7. TRACKING — Google Analytics / Meta Pixel ready
     ---------------------------------------------------------- */
  function track(event, props = {}) {
    // Google Analytics 4
    if (typeof window.gtag === 'function') {
      window.gtag('event', event, props);
    }
    // Meta Pixel
    if (typeof window.fbq === 'function') {
      window.fbq('trackCustom', event, props);
    }
    // Console (dev)
    if (window.location.hostname === 'localhost') {
      console.log('[track]', event, props);
    }
  }

  // Auto-track de clicks con data-track
  document.querySelectorAll('[data-track]').forEach((el) => {
    el.addEventListener('click', () => {
      track('cta_click', { id: el.getAttribute('data-track') });
    });
  });

  /* ----------------------------------------------------------
     8. SMOOTH SCROLL FALLBACK (Safari old)
     ---------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href === '#' || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const navHeight = nav ? nav.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ----------------------------------------------------------
     9. LAZY LOADING para imágenes futuras
     ---------------------------------------------------------- */
  // Aplicar loading="lazy" a todas las imágenes que no sean above-the-fold
  document.querySelectorAll('img').forEach((img) => {
    if (!img.hasAttribute('loading') && !img.closest('.hero, .nav')) {
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
    }
  });

  /* ----------------------------------------------------------
     10. INICIALIZACIÓN
     ---------------------------------------------------------- */
  onScroll(); // estado inicial
})();
