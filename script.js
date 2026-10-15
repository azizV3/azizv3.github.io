document.addEventListener("DOMContentLoaded", () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    /* ---------- Original behaviour: hover sounds + smooth anchors ---------- */
    document.querySelectorAll("[data-sound]").forEach(element => {
        const audioElement = document.getElementById(element.getAttribute("data-sound"));
        if (!audioElement) return;
        element.addEventListener("mouseenter", () => {
            audioElement.currentTime = 0;
            audioElement.play().catch(error => {
                console.log("Audio playback prevented by browser policy:", error);
            });
        });
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute("href"));
            if (target) target.scrollIntoView({ behavior: "smooth" });
        });
    });

    /* ---------- Scroll progress bar + navbar shrink (always on, cheap) ---------- */
    const bar = document.createElement("div");
    bar.className = "scroll-progress";
    document.body.appendChild(bar);
    const navbar = document.querySelector(".navbar");
    const heroTitle = document.querySelector(".hero-title");
    const heroArrow = document.querySelector(".scroll-indicator");
    let ticking = false;

    function onScroll() {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
        if (navbar) navbar.classList.toggle("scrolled", y > 40);
        if (!reduced && heroTitle) {
            const fade = Math.max(0, 1 - y / (window.innerHeight * 0.6));
            heroTitle.style.transform = `translateY(${y * 0.3}px)`;
            heroTitle.style.opacity = fade;
            if (heroArrow) heroArrow.style.opacity = fade;
        }
        ticking = false;
    }
    window.addEventListener("scroll", () => {
        if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
    onScroll();

    if (reduced) return; // everything below is motion-heavy

    document.documentElement.classList.add("js");

    /* ---------- Scramble text ---------- */
    function scramble(el) {
        const final = el.textContent;
        const glyphs = "!<>-_/[]{}=+*^?#01";
        let frame = 0;
        el.setAttribute("aria-label", final);
        const timer = setInterval(() => {
            let out = "";
            for (let i = 0; i < final.length; i++) {
                if (final[i] === " " || i < frame / 2) out += final[i];
                else out += glyphs[Math.floor(Math.random() * glyphs.length)];
            }
            el.textContent = out;
            if (frame / 2 >= final.length) { el.textContent = final; clearInterval(timer); }
            frame++;
        }, 30);
    }

    /* ---------- Typing effect for the code terminal ---------- */
    function typeCode(code) {
        const body = code.closest(".terminal-body");
        if (body) body.style.minHeight = body.offsetHeight + "px"; // no layout jump
        const parts = [];
        const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) parts.push({ node: walker.currentNode, text: walker.currentNode.nodeValue });
        parts.forEach(p => (p.node.nodeValue = ""));
        const cursor = document.createElement("span");
        cursor.className = "caret";
        let i = 0, k = 0;
        (function step() {
            if (i >= parts.length) return;
            const p = parts[i];
            p.node.nodeValue = p.text.slice(0, ++k);
            p.node.parentNode.insertBefore(cursor, p.node.nextSibling);
            if (k >= p.text.length) { i++; k = 0; }
            setTimeout(step, 14 + Math.random() * 28);
        })();
    }

    /* ---------- Reveal on scroll (staggered per group) ---------- */
    const revealTargets = document.querySelectorAll(
        ".content-box, .code-terminal, .info-card, .contact-wrapper > *"
    );
    revealTargets.forEach(el => {
        el.classList.add("reveal");
        const siblings = [...el.parentElement.children].filter(c => c.classList.contains("reveal") || c === el);
        el.style.setProperty("--d", siblings.indexOf(el) * 0.12 + "s");
    });

    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            el.classList.add("in");
            io.unobserve(el);
            setTimeout(() => el.style.removeProperty("--d"), 1400); // don't delay hovers later
            el.querySelectorAll(".section-title").forEach(scramble);
            const code = el.querySelector(".terminal-body code");
            if (code) setTimeout(() => typeCode(code), 500);
        });
    }, { threshold: 0.2 });
    revealTargets.forEach(el => io.observe(el));

    if (heroTitle) scramble(heroTitle);
    document.querySelectorAll(".contact-wrapper h1").forEach(h => setTimeout(() => scramble(h), 150));

    /* ---------- Card tilt + cursor spotlight ---------- */
    if (finePointer) {
        document.querySelectorAll(".info-card:not(.featured)").forEach(card => {
            card.addEventListener("mousemove", e => {
                const r = card.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width;
                const y = (e.clientY - r.top) / r.height;
                card.style.setProperty("--mx", x * 100 + "%");
                card.style.setProperty("--my", y * 100 + "%");
                card.style.setProperty("--ry", (x - 0.5) * 10 + "deg");
                card.style.setProperty("--rx", (0.5 - y) * 10 + "deg");
            });
            card.addEventListener("mouseleave", () => {
                card.style.setProperty("--rx", "0deg");
                card.style.setProperty("--ry", "0deg");
            });
        });
    }

    /* ---------- Particle network behind content (About, Portfolio, Home) ---------- */
    const host = document.querySelector(".main-container");
    if (host) {
        const canvas = document.createElement("canvas");
        canvas.className = "fx-canvas";
        host.prepend(canvas);
        const ctx = canvas.getContext("2d");
        const mouse = { x: -999, y: -999 };
        let w, h, dots = [], visible = true;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        function resize() {
            w = host.offsetWidth; h = host.offsetHeight;
            canvas.width = w * dpr; canvas.height = h * dpr;
            canvas.style.width = w + "px"; canvas.style.height = h + "px";
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const n = Math.min(90, Math.floor((w * h) / 16000));
            dots = Array.from({ length: n }, () => ({
                x: Math.random() * w, y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35
            }));
        }
        resize();
        new ResizeObserver(resize).observe(host);
        host.addEventListener("mousemove", e => {
            const r = host.getBoundingClientRect();
            mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
        });
        host.addEventListener("mouseleave", () => { mouse.x = mouse.y = -999; });
        new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(host);

        (function draw() {
            requestAnimationFrame(draw);
            if (!visible || document.hidden) return;
            ctx.clearRect(0, 0, w, h);
            for (let i = 0; i < dots.length; i++) {
                const a = dots[i];
                a.x += a.vx; a.y += a.vy;
                if (a.x < 0 || a.x > w) a.vx *= -1;
                if (a.y < 0 || a.y > h) a.vy *= -1;
                ctx.fillStyle = "rgba(3,218,198,0.6)";
                ctx.beginPath(); ctx.arc(a.x, a.y, 1.6, 0, 6.283); ctx.fill();
                for (let j = i + 1; j < dots.length; j++) {
                    const b = dots[j], d = Math.hypot(a.x - b.x, a.y - b.y);
                    if (d < 120) {
                        ctx.strokeStyle = `rgba(3,218,198,${0.18 * (1 - d / 120)})`;
                        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                    }
                }
                const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
                if (dm < 160) {
                    ctx.strokeStyle = `rgba(255,2,102,${0.5 * (1 - dm / 160)})`;
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
                    a.x += (mouse.x - a.x) * 0.004; a.y += (mouse.y - a.y) * 0.004;
                }
            }
        })();
    }

    /* ---------- Matrix rain behind the Contact terminal ---------- */
    if (document.querySelector(".contact-wrapper")) {
        const canvas = document.createElement("canvas");
        canvas.className = "fx-rain";
        document.body.prepend(canvas);
        const ctx = canvas.getContext("2d");
        const chars = "01{}[]<>/;=+*#$%ABCDEF".split("");
        const size = 16;
        let cols, drops;
        function resize() {
            canvas.width = window.innerWidth; canvas.height = window.innerHeight;
            cols = Math.ceil(canvas.width / size);
            drops = Array.from({ length: cols }, () => Math.random() * -50);
        }
        resize();
        window.addEventListener("resize", resize);
        let last = 0;
        (function rain(t) {
            requestAnimationFrame(rain);
            if (document.hidden || t - last < 55) return;
            last = t;
            ctx.globalCompositeOperation = "destination-out";
            ctx.fillStyle = "rgba(0,0,0,0.12)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = "source-over";
            ctx.font = size + "px Inconsolata, monospace";
            drops.forEach((y, i) => {
                ctx.fillStyle = Math.random() > 0.97 ? "#d8ffd8" : "#33ff33";
                ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * size, y * size);
                drops[i] = y * size > canvas.height && Math.random() > 0.975 ? 0 : y + 1;
            });
        })(0);
    }
});
