
(function () {
  'use strict';

  var CFG = window.PORTFOLIO_CONFIG || {};
  var root = document.documentElement;
  var reduceMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var fineMQ = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)') : { matches: false };

  /* ---------------------------------------------
     01. CYBER LOADER
     --------------------------------------------- */
  function seamPoints(W, H) {
    var amp = W < 600 ? 14 : 22;
    var c = Math.round(H / 2);
    var steps = [0.2, 0.47, 0.76];
    var up = true;
    var pts = [[-20, c - amp]];
    steps.forEach(function (f) {
      var x = Math.round(W * f);
      pts.push([x, c + (up ? -amp : amp)]);
      up = !up;
      pts.push([x + amp * 2, c + (up ? -amp : amp)]);
    });
    pts.push([W + 20, c + (up ? -amp : amp)]);
    return { pts: pts, amp: amp, c: c };
  }

  function buildDoors(loader) {
    var W = window.innerWidth, H = window.innerHeight;
    var seam = seamPoints(W, H);
    var rev = seam.pts.slice().reverse().map(function (p) { return 'L' + p[0] + ' ' + p[1]; }).join(' ');
    var top = 'M-20 -20 L' + (W + 20) + ' -20 ' + rev + ' Z';
    var bottom = 'M-20 ' + (H + 20) + ' L' + (W + 20) + ' ' + (H + 20) + ' ' + rev + ' Z';
    var ns = 'http://www.w3.org/2000/svg';

    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'loader__doors');
    svg.style.setProperty('--off', (H / 2 + seam.amp + 30) + 'px');

    var pTop = document.createElementNS(ns, 'path');
    pTop.setAttribute('d', top);
    pTop.setAttribute('class', 'loader__half loader__half--t');
    svg.appendChild(pTop);

    var pBottom = document.createElementNS(ns, 'path');
    pBottom.setAttribute('d', bottom);
    pBottom.setAttribute('class', 'loader__half loader__half--b');
    svg.appendChild(pBottom);

    loader.appendChild(svg);
  }

  function runLoader(onDone) {
    var loader = document.getElementById('loader');
    if (!loader) { onDone(); return; }

    var bar = loader.querySelector('.loader__bar i');
    var pct = document.getElementById('loaderPct');
    var status = document.getElementById('loaderStatus');
    var steps = ['INITIALIZING', 'LOADING NEURAL MODELS', 'CONNECTING AGENT PIPELINES', 'ACCESS GRANTED'];

    var visited = false;
    try {
      visited = sessionStorage.getItem('mab_visited') === '1';
      sessionStorage.setItem('mab_visited', '1');
    } catch (e) { /* storage unavailable */ }

    var MIN = reduceMQ.matches ? 400 : (visited ? 800 : 1800);
    var MAX = 2600;
    var t0 = performance.now();
    var lastStep = -1;

    function frame(now) {
      var el = now - t0;
      var p = Math.min(el / MIN, 1);
      p = 1 - Math.pow(1 - p, 2.2);

      if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      if (pct) pct.textContent = ('00' + Math.round(p * 100)).slice(-3);
      var s = Math.min(steps.length - 1, Math.floor(p * (steps.length - 1) + 0.0001));
      if (s !== lastStep && status) { status.textContent = steps[s]; lastStep = s; }

      if (p >= 1 || el >= MAX) { finish(); return; }
      requestAnimationFrame(frame);
    }

    function finish() {
      if (bar) bar.style.transform = 'scaleX(1)';
      if (pct) pct.textContent = '100';
      if (status) status.textContent = steps[steps.length - 1];
      if (!reduceMQ.matches) buildDoors(loader);
      setTimeout(function () {
        loader.classList.add('is-done');
        root.classList.remove('is-loading');
        root.classList.add('is-ready');
        onDone();
        setTimeout(function () {
          if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, 1000);
      }, reduceMQ.matches ? 80 : 260);
    }

    requestAnimationFrame(frame);
  }

  /* ---------------------------------------------
     02. BACKGROUND CIRCUIT FX (Traces & Lightning)
     --------------------------------------------- */
  function initBgfx() {
    var cv = document.getElementById('bgfx');
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, G = 24, dpr = 1;
    var traces = [];
    var bolts = [];
    var clock = 0, nextBolt = 1.8;
    var raf = 0, last = 0, running = false;
    var DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

    function rand(a, b) { return a + Math.random() * (b - a); }

    function spawn(t, initial) {
      t = t || {};
      t.v = Math.random() < 0.7;
      t.red = Math.random() < 0.18;
      t.alpha = t.red ? rand(0.35, 0.6) : rand(0.08, 0.22);
      t.max = G * Math.floor(rand(2, 9));
      t.speed = rand(12, 28);
      t.hold = rand(0.6, 2.5);
      t.state = 0;
      t.timer = 0;
      t.fade = 0;
      if (t.v) {
        t.x = Math.floor(rand(0, W / G)) * G + 0.5;
        t.head = initial ? rand(-H * 0.1, H) : rand(-G * 4, H * 0.3);
      } else {
        t.y = Math.floor(rand(0, H / G)) * G + 0.5;
        t.head = initial ? rand(-W * 0.1, W) : rand(-G * 4, W * 0.4);
      }
      t.tail = t.head;
      if (initial) {
        var r = Math.random();
        if (r < 0.5) { t.tail = t.head - t.max * Math.random(); }
        else { t.state = 1; t.tail = t.head - t.max; t.timer = Math.random() * t.hold; }
        t.fade = 1;
      }
      return t;
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      G = W < 600 ? 22 : 28;
      var n = Math.max(6, Math.min(18, Math.round(W * H / 58000)));
      traces = [];
      for (var i = 0; i < n; i++) traces.push(spawn(null, true));
    }

    function step(t, dt) {
      var limit = t.v ? H : W;
      var d = t.speed * dt;
      t.fade = Math.min(1, t.fade + dt * 1.5);
      if (t.state === 0) {
        t.head += d;
        if (t.head - t.tail >= t.max) t.state = 1;
      } else if (t.state === 1) {
        t.head += d; t.tail += d;
        t.timer += dt;
        if (t.timer >= t.hold) t.state = 2;
      } else {
        t.tail += d * 1.6;
        if (t.tail >= t.head) spawn(t, false);
      }
      if (t.tail > limit + 20) spawn(t, false);
    }

    function snap(v) { return Math.round(v / G) * G + 0.5; }

    function makeBolt() {
      var base = [0, 2, 4, 6][Math.floor(Math.random() * 4)];
      var x = snap(rand(0.08, 0.92) * W), y = snap(rand(0.08, 0.92) * H);
      var pts = [[x, y]];
      var reach = (base % 4 === 0) ? W : H;
      var travelled = 0;
      var jogs = 0, maxJogs = 1 + Math.floor(Math.random() * 3);
      var limit = reach * rand(0.35, 0.75);

      while (travelled < limit) {
        var run = G * Math.floor(rand(6, 15));
        var d = DIRS[base];
        x += d[0] * run; y += d[1] * run; travelled += run;
        pts.push([x, y]);
        if (jogs >= maxJogs) continue;
        var side = Math.random() < 0.5 ? -1 : 1;
        var dj = DIRS[(base + side + 8) % 8];
        var step2 = G * (Math.random() < 0.7 ? 1 : 2);
        x += dj[0] * step2; y += dj[1] * step2; travelled += step2;
        pts.push([x, y]);
        jogs++;
        if (travelled >= limit) {
          var dEnd = DIRS[base];
          x += dEnd[0] * G * 3; y += dEnd[1] * G * 3;
          pts.push([x, y]);
        }
      }
      var cum = [0];
      for (var j = 1; j < pts.length; j++) {
        cum.push(cum[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]));
      }
      return {
        pts: pts, cum: cum, total: cum[cum.length - 1],
        head: 0,
        speed: rand(750, 1200),
        trail: rand(140, 260),
        red: Math.random() < 0.45,
        after: 0
      };
    }

    function pointAt(b, dist) {
      var c = b.cum, p = b.pts;
      for (var i = 1; i < c.length; i++) {
        if (dist <= c[i]) {
          var r = (dist - c[i - 1]) / ((c[i] - c[i - 1]) || 1);
          return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * r, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * r, i];
        }
      }
      return [p[p.length - 1][0], p[p.length - 1][1], p.length - 1];
    }

    function strokeRange(b, d0, d1) {
      d0 = Math.max(0, d0); d1 = Math.min(b.total, d1);
      if (d1 <= d0) return;
      var a = pointAt(b, d0), z = pointAt(b, d1);
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      for (var i = a[2]; i < z[2]; i++) ctx.lineTo(b.pts[i][0], b.pts[i][1]);
      ctx.lineTo(z[0], z[1]);
      ctx.stroke();
    }

    function stepBolts(dt) {
      clock += dt;
      if (clock >= nextBolt && bolts.length < 2) {
        bolts.push(makeBolt());
        nextBolt = clock + (W < 600 ? rand(2.4, 5.0) : rand(1.6, 3.8));
      }
      for (var i = bolts.length - 1; i >= 0; i--) {
        var b = bolts[i];
        b.head += b.speed * dt;
        if (b.head - b.trail > b.total) {
          b.after += dt;
          if (b.after > 0.7) bolts.splice(i, 1);
        }
      }
    }

    function drawBolts() {
      ctx.lineJoin = 'miter';
      for (var i = 0; i < bolts.length; i++) {
        var b = bolts[i];
        var col = b.red ? '227,0,55' : '3,218,198';
        var tail = b.head - b.trail;

        var ghost = 0.08 * (1 - Math.min(1, b.after / 0.7));
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(' + col + ',' + ghost.toFixed(3) + ')';
        strokeRange(b, 0, b.head);

        var vAlpha = (0.5 * (1 - Math.min(1, b.after / 0.7))).toFixed(3);
        ctx.strokeStyle = 'rgba(' + col + ',' + vAlpha + ')';
        ctx.beginPath();
        var s0 = b.pts[0];
        ctx.arc(s0[0], s0[1], 3, 0, Math.PI * 2);
        ctx.stroke();

        if (b.head >= b.total) {
          var e0 = b.pts[b.pts.length - 1];
          ctx.beginPath();
          ctx.arc(e0[0], e0[1], 3, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (tail > b.total) continue;

        var N = 6;
        for (var k = 0; k < N; k++) {
          var t0 = tail + (b.trail * k) / N;
          var t1 = tail + (b.trail * (k + 1)) / N;
          var a = Math.pow((k + 1) / N, 2);
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = 'rgba(' + col + ',' + (a * 0.9).toFixed(3) + ')';
          strokeRange(b, t0, t1);
        }

        if (b.head < b.total) {
          var h = pointAt(b, b.head);
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          ctx.beginPath();
          ctx.arc(h[0], h[1], 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      for (var i = 0; i < traces.length; i++) {
        var t = traces[i];
        var a = t.alpha * t.fade;
        var col = t.red ? '227,0,55' : '255,255,255';
        var hx, hy, tx, ty;
        if (t.v) { hx = tx = t.x; hy = t.head; ty = t.tail; }
        else { hy = ty = t.y; hx = t.head; tx = t.tail; }

        var g = ctx.createLinearGradient(tx, ty, hx, hy);
        g.addColorStop(0, 'rgba(' + col + ',0)');
        g.addColorStop(1, 'rgba(' + col + ',' + a + ')');
        ctx.strokeStyle = g;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx, hy);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(' + col + ',' + Math.min(1, a * 1.8) + ')';
        ctx.beginPath();
        ctx.arc(t.v ? hx : hx + 3, t.v ? hy + 3 : hy, 2.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      drawBolts();
    }

    function loop(now) {
      raf = requestAnimationFrame(loop);
      var dt = (now - last) / 1000;
      if (dt < (bolts.length ? 1 / 60 : 1 / 30)) return;
      last = now;
      if (dt > 0.1) dt = 0.1;
      for (var i = 0; i < traces.length; i++) step(traces[i], dt);
      stepBolts(dt);
      draw();
    }

    function start() {
      if (running || reduceMQ.matches) return;
      running = true; last = performance.now();
      raf = requestAnimationFrame(loop);
    }
    function stop() { running = false; cancelAnimationFrame(raf); }

    var rt = 0;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (Math.abs(window.innerWidth - W) < 2 && Math.abs(window.innerHeight - H) < 160) return;
        resize(); draw();
      }, 200);
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    resize();
    draw();
    start();
  }

  /* ---------------------------------------------
     03. KV SNOW / FLOATING CYBER PARTICLES
     --------------------------------------------- */
  function initSnow() {
    var cv = document.getElementById('kvSnow');
    if (!cv || !cv.getContext || reduceMQ.matches) return;
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, dpr = 1, flakes = [];
    var raf = 0, last = 0, running = false, visible = true;

    var sp = document.createElement('canvas');
    sp.width = sp.height = 24;
    var sx = sp.getContext('2d');
    var g = sx.createRadialGradient(12, 12, 0, 12, 12, 12);
    g.addColorStop(0, 'rgba(255,120,150,1)');
    g.addColorStop(0.25, 'rgba(227,0,55,.8)');
    g.addColorStop(0.65, 'rgba(227,0,55,.2)');
    g.addColorStop(1, 'rgba(227,0,55,0)');
    sx.fillStyle = g;
    sx.fillRect(0, 0, 24, 24);

    function rand(a, b) { return a + Math.random() * (b - a); }
    var SLANT = 0.32;

    function make(f, initial) {
      f = f || {};
      f.x = rand(0, W + H * SLANT);
      f.y = initial ? rand(-H * 0.1, H) : rand(-30, -8);
      var k = Math.pow(Math.random(), 2.2);
      f.size = 5 + k * 10;
      f.vy = rand(24, 38) + k * 20;
      f.amp = rand(6, 20);
      f.freq = rand(0.25, 0.7);
      f.phase = rand(0, Math.PI * 2);
      f.alpha = rand(0.5, 0.9);
      f.tw = rand(0.6, 1.5);
      return f;
    }

    function resize() {
      var r = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.max(10, Math.min(30, Math.round(W * H / 38000)));
      flakes = [];
      for (var i = 0; i < n; i++) flakes.push(make(null, true));
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = (now - last) / 1000;
      if (dt < 1 / 30) return;
      last = now;
      if (dt > 0.1) dt = 0.1;
      var t = now / 1000;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        f.y += f.vy * dt;
        f.x -= f.vy * SLANT * dt;
        if (f.y > H + 10 || f.x < -f.amp - 20) make(f, false);
        var x = f.x + Math.sin(t * f.freq + f.phase) * f.amp;
        ctx.globalAlpha = f.alpha * (0.75 + 0.25 * Math.sin(t * f.tw + f.phase));
        ctx.drawImage(sp, x - f.size / 2, f.y - f.size / 2, f.size, f.size);
      }
      ctx.globalAlpha = 1;
    }

    function start() {
      if (running || !visible || document.hidden || reduceMQ.matches) return;
      running = true; last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function stop() { running = false; cancelAnimationFrame(raf); }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible) start(); else stop();
      }).observe(cv);
    }

    window.addEventListener('resize', resize);
    resize();
    start();
  }

  /* ---------------------------------------------
     04. HEADER & MOBILE MENU
     --------------------------------------------- */
  function initHeader() {
    var hd = document.getElementById('hd');
    if (!hd) return;
    var btn = hd.querySelector('.hd__menu');
    var nav = document.getElementById('nav');
    var open = false;

    function setMenu(v) {
      open = v;
      root.classList.toggle('menu-open', v);
      if (btn) {
        btn.setAttribute('aria-expanded', String(v));
        btn.setAttribute('aria-label', v ? 'Close Menu' : 'Open Menu');
      }
    }

    if (btn) btn.addEventListener('click', function () { setMenu(!open); });
    if (nav) {
      nav.addEventListener('click', function (e) {
        if (e.target.closest('a')) setMenu(false);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) { setMenu(false); if (btn) btn.focus(); }
    });
    window.addEventListener('resize', function () {
      if (open && window.innerWidth >= 900) setMenu(false);
    });

    // Active link highlighting on scroll
    var sections = document.querySelectorAll('section[id]');
    function checkActiveSection() {
      var scrollY = window.pageYOffset + 120;
      sections.forEach(function (sec) {
        var top = sec.offsetTop;
        var height = sec.offsetHeight;
        var id = sec.getAttribute('id');
        if (scrollY >= top && scrollY < top + height) {
          document.querySelectorAll('.hd__nav a').forEach(function (a) {
            a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
          });
        }
      });
    }
    window.addEventListener('scroll', checkActiveSection, { passive: true });
  }

  /* ---------------------------------------------
     05. SCROLL PROGRESS & PARALLAX
     --------------------------------------------- */
  function initScroll() {
    var hd = document.getElementById('hd');
    var prog = document.getElementById('progress');
    var kvImg = document.querySelector('.kv__img');
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.pageYOffset;
      if (hd) hd.classList.toggle('is-scrolled', y > 40);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (prog) prog.style.transform = 'scaleY(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';
      if (kvImg && !reduceMQ.matches && y < window.innerHeight * 1.2) {
        kvImg.style.transform = 'translate3d(0,' + (y * 0.2).toFixed(1) + 'px,0)';
      }
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------------------------------------------
     06. REVEAL & STAGGER
     --------------------------------------------- */
  function initReveal() {
    var groups = document.querySelectorAll('.rv-stagger');
    for (var g = 0; g < groups.length; g++) {
      var kids = groups[g].querySelectorAll(':scope > .rv');
      for (var k = 0; k < kids.length; k++) kids[k].style.setProperty('--d', (k * 0.08).toFixed(2) + 's');
    }
    var els = document.querySelectorAll('.rv');
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < els.length; i++) els[i].classList.add('is-in');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    for (var j = 0; j < els.length; j++) io.observe(els[j]);
  }

  /* ---------------------------------------------
     07. 3D TILT & LIGHTBOX
     --------------------------------------------- */
  function initJacket() {
    var btn = document.querySelector('.jacket__btn');
    var lb = document.getElementById('lightbox');
    if (!btn) return;

    var tilt = btn.querySelector('.jacket__tilt');
    var tx = 0, ty = 0, th = 0, cx = 0, cy = 0, ch = 0, traf = 0;

    function tiltFrame() {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      ch += (th - ch) * 0.12;
      if (tilt) {
        tilt.style.setProperty('--rx', cx.toFixed(4));
        tilt.style.setProperty('--ry', cy.toFixed(4));
        tilt.style.setProperty('--h', ch.toFixed(4));
      }
      if (Math.abs(tx - cx) + Math.abs(ty - cy) + Math.abs(th - ch) > 0.002) {
        traf = requestAnimationFrame(tiltFrame);
      } else {
        traf = 0;
      }
    }
    function kick() { if (!traf) traf = requestAnimationFrame(tiltFrame); }

    btn.addEventListener('pointermove', function (e) {
      if (!fineMQ.matches || reduceMQ.matches || e.pointerType !== 'mouse') return;
      var r = btn.getBoundingClientRect();
      tx = Math.max(-0.5, Math.min(0.5, (e.clientX - r.left) / r.width - 0.5));
      ty = Math.max(-0.5, Math.min(0.5, (e.clientY - r.top) / r.height - 0.5));
      th = 1;
      kick();
    });
    btn.addEventListener('pointerleave', function () { tx = 0; ty = 0; th = 0; kick(); });

    /* Lightbox Modal */
    if (!lb) return;
    var img = lb.querySelector('.lb__img');
    var closeBtn = lb.querySelector('.lb__close');
    var hasDialog = typeof lb.showModal === 'function';
    var closing = false;

    function open() {
      if (img && !img.getAttribute('src')) img.setAttribute('src', img.getAttribute('data-src'));
      root.classList.add('lb-open');
      if (hasDialog) lb.showModal(); else lb.setAttribute('open', '');
      if (closeBtn) closeBtn.focus();
    }
    function close() {
      if (closing || !lb.hasAttribute('open')) return;
      closing = true;
      lb.classList.add('is-closing');
      setTimeout(function () {
        lb.classList.remove('is-closing');
        if (hasDialog) lb.close(); else lb.removeAttribute('open');
        root.classList.remove('lb-open');
        closing = false;
        btn.focus();
      }, reduceMQ.matches ? 0 : 260);
    }

    btn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    lb.addEventListener('click', function (e) {
      if (!e.target.closest('.lb__img, .lb__close')) close();
    });
    lb.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !hasDialog) close();
    });
  }

  /* ---------------------------------------------
     08. HUD CURSOR (Crosshairs & Coordinates)
     --------------------------------------------- */
  function initCursor() {
    if (!fineMQ.matches || reduceMQ.matches) return;

    var el = document.createElement('div');
    el.className = 'cur';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="cur__ring"><span class="cur__frame"><i></i><i></i><i></i><i></i></span>' +
      '<span class="cur__label">X 0000 / Y 0000</span></div>' +
      '<div class="cur__dot"></div>';
    document.body.appendChild(el);
    root.classList.add('has-cur');

    var ring = el.querySelector('.cur__ring');
    var dot = el.querySelector('.cur__dot');
    var label = el.querySelector('.cur__label');
    var mx = -100, my = -100, rx = -100, ry = -100;
    var raf = 0, frame = 0, target = null;

    function actionOf(t) {
      if (t.closest('.jacket__btn')) return 'ZOOM';
      if (t.closest('.chat-form button, .preset-btn')) return 'EXECUTE';
      if (t.closest('.hd__sound-toggle')) return 'AUDIO';
      if (t.closest('.hd__menu, .lb__close')) return 'CLOSE';
      var a = t.closest('a');
      if (a) {
        if (a.target === '_blank') return 'OPEN ↗';
        if ((a.getAttribute('href') || '').charAt(0) === '#') return 'JUMP';
        return 'OPEN';
      }
      return 'SELECT';
    }

    function tick() {
      rx += (mx - rx) * 0.22;
      ry += (my - ry) * 0.22;
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      if (!target && (frame++ % 3 === 0)) {
        label.textContent = 'X ' + ('000' + Math.round(mx)).slice(-4) + ' / Y ' + ('000' + Math.round(my)).slice(-4);
      }
      if (Math.abs(mx - rx) + Math.abs(my - ry) > 0.3) raf = requestAnimationFrame(tick);
      else raf = 0;
    }

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      el.classList.add('is-on');
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });

    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest && e.target.closest('a, button, input, .jacket__btn');
      if (t === target) return;
      target = t;
      el.classList.toggle('is-hover', !!t);
      if (t) label.textContent = actionOf(t);
    });

    document.addEventListener('mouseout', function (e) {
      if (!e.relatedTarget) el.classList.remove('is-on');
    });

    document.addEventListener('mousedown', function () {
      el.classList.add('is-down');
      var p = document.createElement('span');
      p.className = 'cur__pulse';
      p.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      el.appendChild(p);
      setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 700);
    });
    document.addEventListener('mouseup', function () { el.classList.remove('is-down'); });
  }

  /* ---------------------------------------------
     09. AUDIO SYSTEM (Original Portfolio Sounds)
     --------------------------------------------- */
  function initAudio() {
    var soundEnabled = false;
    try {
      soundEnabled = localStorage.getItem('mab_sound_enabled') === '1';
    } catch (e) {}

    var toggleBtn = document.getElementById('soundToggle');
    function updateToggle() {
      if (toggleBtn) {
        toggleBtn.classList.toggle('is-active', soundEnabled);
        toggleBtn.querySelector('span').textContent = soundEnabled ? 'AUDIO [ON]' : 'AUDIO [OFF]';
      }
    }
    updateToggle();

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        soundEnabled = !soundEnabled;
        try { localStorage.setItem('mab_sound_enabled', soundEnabled ? '1' : '0'); } catch (e) {}
        updateToggle();
        if (soundEnabled) playSound('home-sound');
      });
    }

    function playSound(soundId) {
      if (!soundEnabled) return;
      var el = document.getElementById(soundId);
      if (!el) return;
      el.currentTime = 0;
      el.volume = (CFG.audio && CFG.audio.volume) || 0.3;
      el.play().catch(function () {});
    }

    document.querySelectorAll('[data-sound]').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        var sid = el.getAttribute('data-sound');
        if (sid) playSound(sid);
      });
    });
  }

  /* ---------------------------------------------
     10. TYPING EFFECT FOR HERO CODE TERMINAL
     --------------------------------------------- */
  function initTypingCode() {
    var code = document.querySelector('.kv__terminal-body code');
    if (!code || reduceMQ.matches) return;

    var parts = [];
    var walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) parts.push({ node: walker.currentNode, text: walker.currentNode.nodeValue });
    parts.forEach(function (p) { p.node.nodeValue = ""; });

    var cursor = document.createElement("span");
    cursor.className = "caret";
    code.appendChild(cursor);

    var i = 0, k = 0;
    function step() {
      if (i >= parts.length) return;
      var p = parts[i];
      p.node.nodeValue = p.text.slice(0, ++k);
      p.node.parentNode.insertBefore(cursor, p.node.nextSibling);
      if (k >= p.text.length) { i++; k = 0; }
      setTimeout(step, 14 + Math.random() * 24);
    }
    setTimeout(step, 1600);
  }

  /* ---------------------------------------------
     11. TEXT SCRAMBLE DECODER
     --------------------------------------------- */
  function scramble(el) {
    if (!el || reduceMQ.matches) return;
    var final = el.textContent;
    var glyphs = "!<>-_/[]{}=+*^?#01";
    var frame = 0;
    el.setAttribute("aria-label", final);
    var timer = setInterval(function () {
      var out = "";
      for (var i = 0; i < final.length; i++) {
        if (final[i] === " " || i < frame / 2) out += final[i];
        else out += glyphs[Math.floor(Math.random() * glyphs.length)];
      }
      el.textContent = out;
      if (frame / 2 >= final.length) {
        el.textContent = final;
        clearInterval(timer);
      }
      frame++;
    }, 28);
  }

  /* ---------------------------------------------
     12. CONTACT CHANNELS & COPY HELPER
     --------------------------------------------- */
  function initContactCopy() {
    var toast = document.getElementById('copyToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'copyToast';
      toast.className = 'copy-toast';
      document.body.appendChild(toast);
    }

    var timer = 0;
    function showToast(msg) {
      toast.textContent = msg;
      toast.classList.add('is-shown');
      clearTimeout(timer);
      timer = setTimeout(function () {
        toast.classList.remove('is-shown');
      }, 2400);
    }

    document.querySelectorAll('[data-copy]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        var val = el.getAttribute('data-copy');
        if (!val) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(val).then(function () {
            showToast('COPIED: ' + val + ' // 0x200');
          }).catch(function () {
            showToast('COPIED TO CLIPBOARD');
          });
        } else {
          showToast('COPIED: ' + val);
        }
      });
    });
  }

  /* ---------------------------------------------
     INITIALIZATION
     --------------------------------------------- */
  initHeader();
  initJacket();
  initCursor();
  initAudio();
  initBgfx();
  initScroll();
  initContactCopy();

  runLoader(function () {
    initReveal();
    initSnow();
    initTypingCode();
    document.querySelectorAll('.sec-head__title').forEach(function (t) {
      t.addEventListener('mouseenter', function () { scramble(t); });
    });
  });

})();
