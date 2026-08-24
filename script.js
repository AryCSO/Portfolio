/* =========================================================
   Ary.dev — interações do portfólio
   Sem dependências externas. Tudo degrada com elegância se
   alguma API não existir ou se o storage estiver bloqueado.
   ========================================================= */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- storage seguro ----------
     Navegador anônimo ou site data bloqueado faz o acesso
     lançar exceção, não só retornar null. */
  var store = {
    get: function (k) {
      try { return window.localStorage.getItem(k); } catch (e) { return null; }
    },
    set: function (k, v) {
      try { window.localStorage.setItem(k, v); } catch (e) { /* silencioso de propósito */ }
    }
  };

  /* ---------- tema ---------- */
  var body = document.body;
  var toggle = document.getElementById('theme-toggle');
  var icon = document.getElementById('theme-icon');

  function systemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }

  function paintIcon(theme) {
    if (!icon) { return; }
    // no claro mostramos a lua (o que o clique vai fazer), e vice-versa
    var symbol = theme === 'light' ? '#i-moon' : '#i-sun';
    icon.setAttribute('href', symbol);
    icon.setAttribute('xlink:href', symbol);
  }

  function applyTheme(theme) {
    body.setAttribute('data-theme', theme);
    paintIcon(theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) { meta.setAttribute('content', theme === 'light' ? '#FAF8F4' : '#0F0E0C'); }
  }

  var saved = store.get('theme');
  applyTheme(saved === 'light' || saved === 'dark' ? saved : systemTheme());

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next);
      store.set('theme', next);
    });
  }

  // Quem nunca escolheu acompanha a mudança do sistema em tempo real.
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: light)');
    var onSystemChange = function () {
      if (!store.get('theme')) { applyTheme(systemTheme()); }
    };
    if (mq.addEventListener) { mq.addEventListener('change', onSystemChange); }
    else if (mq.addListener) { mq.addListener(onSystemChange); }
  }

  /* ---------- barra de progresso + voltar ao topo ---------- */
  var progress = document.getElementById('progress');
  var toTop = document.getElementById('to-top');
  var ticking = false;

  function onScrollFrame() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var y = window.scrollY || doc.scrollTop;

    if (progress) {
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    }
    if (toTop) { toTop.classList.toggle('show', y > 400); }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScrollFrame); }
  }, { passive: true });
  onScrollFrame();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- marquee ----------
     Duplica o conteúdo da faixa para o loop fechar sem salto:
     a animação anda até -50%, que é exatamente uma cópia. */
  Array.prototype.forEach.call(document.querySelectorAll('[data-marquee]'), function (track) {
    track.innerHTML += track.innerHTML;
  });

  /* ---------- seção ativa na navegação ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        links.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- diagrama: mede cada traço ----------
     stroke-dasharray precisa do comprimento real do caminho, senão a
     animação de desenho começa no lugar errado. Medimos em runtime. */
  Array.prototype.forEach.call(document.querySelectorAll('.dg-link'), function (path) {
    try {
      var len = Math.ceil(path.getTotalLength());
      path.style.setProperty('--len', len);
    } catch (e) { /* navegador sem getTotalLength: a linha só aparece pronta */ }
  });

  /* ---------- contadores ---------- */
  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) { return; }
    var slot = el.querySelector('span:not(.suf)');
    var write = function (v) {
      if (slot) { slot.textContent = String(v); }
      else { el.firstChild ? (el.firstChild.nodeValue = String(v)) : (el.textContent = String(v)); }
    };

    if (reduceMotion) { write(target); return; }

    var dur = 1100;
    var t0 = null;
    var step = function (ts) {
      if (t0 === null) { t0 = ts; }
      var p = Math.min((ts - t0) / dur, 1);
      // easeOutCubic: começa rápido e assenta, que lê como contagem real
      write(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) { window.requestAnimationFrame(step); }
    };
    window.requestAnimationFrame(step);
  }

  /* ---------- reveal ao rolar ---------- */
  var revealables = document.querySelectorAll('.reveal');
  var counters = document.querySelectorAll('[data-count]');

  if (!('IntersectionObserver' in window) || reduceMotion) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('in'); });
    Array.prototype.forEach.call(counters, runCounter);
  } else {
    var revealer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(revealables, function (el) { revealer.observe(el); });

    var counterObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        runCounter(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    Array.prototype.forEach.call(counters, function (el) { counterObs.observe(el); });
  }

  /* ---------- carrossel ---------- */
  (function () {
    var track = document.querySelector('[data-carousel]');
    if (!track) { return; }

    var prev = document.querySelector('[data-car-prev]');
    var next = document.querySelector('[data-car-next]');
    var dotsBox = document.querySelector('[data-car-dots]');
    var slides = Array.prototype.slice.call(track.children);
    if (!slides.length) { return; }

    function step() {
      // largura de um card + gap, lida do layout real em vez de chutada
      var a = slides[0].getBoundingClientRect();
      if (slides.length < 2) { return a.width; }
      return slides[1].getBoundingClientRect().left - a.left;
    }

    function current() {
      return Math.round(track.scrollLeft / (step() || 1));
    }

    function go(i) {
      var max = slides.length - 1;
      var target = Math.max(0, Math.min(i, max));
      track.scrollTo({ left: target * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    // pontos
    var dots = [];
    if (dotsBox) {
      slides.forEach(function (_, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Ir para o projeto ' + (i + 1));
        b.addEventListener('click', function () { go(i); });
        dotsBox.appendChild(b);
        dots.push(b);
      });
    }

    function sync() {
      var i = current();
      var atStart = track.scrollLeft <= 2;
      var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      if (prev) { prev.disabled = atStart; }
      if (next) { next.disabled = atEnd; }
      dots.forEach(function (d, k) {
        d.setAttribute('aria-current', k === i ? 'true' : 'false');
      });
    }

    if (prev) { prev.addEventListener('click', function () { go(current() - 1); }); }
    if (next) { next.addEventListener('click', function () { go(current() + 1); }); }

    // teclado: o container tem tabindex, então setas navegam
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(current() + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(current() - 1); }
    });

    var scrollTick = false;
    track.addEventListener('scroll', function () {
      if (!scrollTick) {
        scrollTick = true;
        window.requestAnimationFrame(function () { sync(); scrollTick = false; });
      }
    }, { passive: true });

    window.addEventListener('resize', sync);
    sync();
  })();

  /* ---------- ano do rodapé ---------- */
  var ano = document.getElementById('ano');
  if (ano) { ano.textContent = String(new Date().getFullYear()); }
})();
