/* =========================================================
   Arnab Mukherjee — portfolio interactions
   ========================================================= */
(() => {
    'use strict';

    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const store = {
        get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
        set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
    };

    /* ---------- colour helpers ---------- */
    function cssVar(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }
    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const n = parseInt(hex, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    // Approximate visible-spectrum colour for a wavelength in nm
    function wavelengthToRgb(nm) {
        let r = 0, g = 0, b = 0;
        if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
        else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
        else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
        else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
        else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
        else { r = 1; }
        let f = 1;
        if (nm < 420) f = 0.35 + 0.65 * (nm - 380) / 40;
        else if (nm > 680) f = 0.35 + 0.65 * (750 - nm) / 70;
        // lift dark ends so they stay visible
        return [r, g, b].map(c => Math.round(255 * Math.min(1, Math.pow(c * f, 0.8) * 0.92 + 0.08)));
    }

    /* ---------- toast ---------- */
    let toastTimer;
    function toast(msg) {
        const t = $('#toast');
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
    }

    /* ---------- theme ---------- */
    const themeListeners = [];
    function currentTheme() {
        return document.documentElement.dataset.theme ||
            (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    }
    function setTheme(t) {
        document.documentElement.dataset.theme = t;
        store.set('theme', t);
        $('meta[name="theme-color"]').setAttribute('content', t === 'light' ? '#f6f7fb' : '#07080d');
        themeListeners.forEach(fn => fn());
    }
    function toggleTheme() { setTheme(currentTheme() === 'light' ? 'dark' : 'light'); }
    if (!document.documentElement.dataset.theme) document.documentElement.dataset.theme = currentTheme();
    $('#themeToggle').addEventListener('click', toggleTheme);

    /* ---------- nav, progress, cursor glow ---------- */
    const navbar = $('#navbar');
    const progress = $('#scrollProgress');
    const navLinks = $('#navLinks');
    const menuBtn = $('#menuBtn');

    function onScroll() {
        const y = window.scrollY;
        navbar.classList.toggle('scrolled', y > 20);
        const max = document.documentElement.scrollHeight - innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    }
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    menuBtn.addEventListener('click', () => {
        const open = navLinks.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', open);
    });
    $$('a', navLinks).forEach(a => a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
    }));

    // Active section highlight
    const sectionObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            $$('a', navLinks).forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(s => sectionObs.observe(s));

    const glow = $('#cursorGlow');
    if (!reducedMotion) {
        addEventListener('pointermove', e => {
            glow.style.opacity = 1;
            glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        }, { passive: true });
    }

    /* ---------- reveal + counters ---------- */
    const revealObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            e.target.classList.add('visible');
            revealObs.unobserve(e.target);
            $$('[data-count]', e.target).forEach(countUp);
        });
    }, { threshold: 0.12 });
    $$('.reveal').forEach((el, i) => {
        el.style.transitionDelay = `${Math.min(i % 6, 5) * 60}ms`;
        revealObs.observe(el);
    });

    function countUp(el) {
        const target = +el.dataset.count;
        const suffix = el.dataset.suffix || '';
        if (reducedMotion) { el.textContent = target + suffix; return; }
        const t0 = performance.now();
        const dur = 1400;
        (function tick(now) {
            const p = Math.min(1, (now - t0) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(tick);
        })(t0);
    }

    /* ---------- rotating hero subtitle ---------- */
    (function rotator() {
        const el = $('#rotator');
        const phrases = [
            'numerical solvers for physics',
            'simulation code that scales',
            'electromagnetic & optical simulations',
            'finite-element models',
            'physics-informed neural networks',
            'ray tracers from scratch',
            'fast surrogates for slow solvers'
        ];
        if (reducedMotion) return;
        let pi = 0, ci = phrases[0].length, deleting = true;
        function step() {
            const p = phrases[pi];
            if (deleting) {
                ci--;
                if (ci <= 0) { deleting = false; pi = (pi + 1) % phrases.length; }
            } else {
                ci++;
                if (ci >= phrases[pi].length) { deleting = true; el.textContent = phrases[pi]; return setTimeout(step, 2200); }
            }
            el.textContent = phrases[pi].slice(0, ci) || '​';
            setTimeout(step, deleting ? 28 : 55);
        }
        setTimeout(step, 2600);
    })();

    /* =========================================================
       Hero: live wave-interference field
       ========================================================= */
    const wave = (() => {
        const canvas = $('#waveCanvas');
        const ctx = canvas.getContext('2d');
        const buf = document.createElement('canvas');
        const bctx = buf.getContext('2d');
        const CELL = 5;                     // css px per simulation cell
        const LAMBDA = 46;                  // wavelength in css px
        const K = (2 * Math.PI) / LAMBDA;
        const TABLE = 4096;
        const cosT = new Float32Array(TABLE);
        for (let i = 0; i < TABLE; i++) cosT[i] = Math.cos((i / TABLE) * 2 * Math.PI);
        const TWO_PI = 2 * Math.PI;

        let w = 0, h = 0, gw = 0, gh = 0, img = null;
        let pointer = null;
        let emitters = [];
        let t = 0, running = false, visible = true, raf = 0;
        let bg = [7, 8, 13], c1 = [94, 231, 255], c2 = [167, 139, 250];

        function readColors() {
            bg = hexToRgb(cssVar('--bg'));
            c1 = hexToRgb(cssVar('--accent'));
            c2 = hexToRgb(cssVar('--accent-2'));
        }

        function resize() {
            const r = canvas.getBoundingClientRect();
            w = r.width; h = r.height;
            // the field is smooth, so render at half CSS resolution and let the compositor upscale
            const dpr = 0.5;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            gw = Math.ceil(w / CELL); gh = Math.ceil(h / CELL);
            buf.width = gw; buf.height = gh;
            img = bctx.createImageData(gw, gh);
        }

        function sources() {
            // two slow "ambient" emitters keep the field alive even without a pointer
            const s = [
                { x: w * (0.72 + 0.06 * Math.sin(t * 0.21)), y: h * (0.32 + 0.08 * Math.cos(t * 0.17)), a: 0.8 },
                { x: w * (0.86 + 0.04 * Math.cos(t * 0.13)), y: h * (0.70 + 0.07 * Math.sin(t * 0.19)), a: 0.8 }
            ];
            emitters.forEach(e => s.push({ x: e.x, y: e.y, a: 1 }));
            if (pointer) s.push({ x: pointer.x, y: pointer.y, a: 1.1 });
            return s;
        }

        function render() {
            const src = sources();
            const n = src.length;
            const data = img.data;
            const phaseT = t * 4.2;
            const norm = 1 / Math.sqrt(n);
            const fadeX = gw * 0.42;
            const strength = currentTheme() === 'light' ? 0.38 : 0.55;
            let p = 0;
            for (let j = 0; j < gh; j++) {
                const y = (j + 0.5) * CELL;
                for (let i = 0; i < gw; i++) {
                    const x = (i + 0.5) * CELL;
                    let v = 0;
                    for (let s = 0; s < n; s++) {
                        const dx = x - src[s].x, dy = y - src[s].y;
                        const r = Math.sqrt(dx * dx + dy * dy);
                        let ph = (K * r - phaseT) % TWO_PI;
                        if (ph < 0) ph += TWO_PI;
                        // gentle 1/sqrt(r) cylindrical decay
                        v += src[s].a * cosT[(ph * TABLE / TWO_PI) | 0] / Math.sqrt(1 + r / 140);
                    }
                    v *= norm;
                    // keep the left side calmer so text stays readable
                    const mask = i < fadeX ? 0.25 + 0.75 * (i / fadeX) : 1;
                    const a = Math.min(1, Math.abs(v)) * strength * mask;
                    const c = v > 0 ? c1 : c2;
                    data[p] = bg[0] + (c[0] - bg[0]) * a;
                    data[p + 1] = bg[1] + (c[1] - bg[1]) * a;
                    data[p + 2] = bg[2] + (c[2] - bg[2]) * a;
                    data[p + 3] = 255;
                    p += 4;
                }
            }
            bctx.putImageData(img, 0, 0);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(buf, 0, 0, canvas.width, canvas.height);

            // emitter markers
            const dpr = canvas.width / w;
            ctx.save();
            ctx.scale(dpr, dpr);
            const marks = emitters.slice();
            if (pointer) marks.push(pointer);
            marks.forEach(m => {
                ctx.beginPath();
                ctx.arc(m.x, m.y, 5, 0, TWO_PI);
                ctx.fillStyle = `rgb(${c1.join(',')})`;
                ctx.shadowColor = `rgb(${c1.join(',')})`;
                ctx.shadowBlur = 16;
                ctx.fill();
            });
            ctx.restore();
        }

        let last = 0;
        function loop(now) {
            raf = requestAnimationFrame(loop);
            if (!visible || document.hidden) return;
            const dt = Math.min(0.05, (now - last) / 1000 || 0);
            last = now;
            t += dt;
            render();
        }

        function start() {
            if (running) return;
            running = true;
            if (reducedMotion) { render(); return; }
            last = performance.now();
            raf = requestAnimationFrame(loop);
        }

        const hero = $('#hero');
        hero.addEventListener('pointermove', e => {
            const r = canvas.getBoundingClientRect();
            pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
            if (reducedMotion) render();
        });
        hero.addEventListener('pointerleave', () => { pointer = null; if (reducedMotion) render(); });
        hero.addEventListener('click', e => {
            if (e.target.closest('a, button')) return;
            const r = canvas.getBoundingClientRect();
            emitters.push({ x: e.clientX - r.left, y: e.clientY - r.top });
            if (emitters.length > 6) emitters.shift();
            if (reducedMotion) render();
        });
        hero.addEventListener('dblclick', () => { clearEmitters(); });

        function clearEmitters() { emitters = []; if (reducedMotion) render(); }

        new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
        addEventListener('resize', () => { resize(); render(); });
        themeListeners.push(() => { readColors(); render(); });

        readColors();
        resize();
        start();
        return { clearEmitters };
    })();

    /* =========================================================
       Timeline accordion
       ========================================================= */
    $$('.tl-item').forEach(item => {
        const body = $('.tl-body', item);
        const inner = document.createElement('div');
        inner.className = 'tl-inner';
        while (body.firstChild) inner.appendChild(body.firstChild);
        body.appendChild(inner);
        const head = $('.tl-head', item);
        head.addEventListener('click', () => {
            const open = item.classList.toggle('open');
            head.setAttribute('aria-expanded', open);
        });
    });

    /* =========================================================
       Metalens lab — scalar Huygens–Fresnel simulation
       ========================================================= */
    const lab = (() => {
        const canvas = $('#lensCanvas');
        const ctx = canvas.getContext('2d');
        const W = 360, H = 225;            // simulation grid (pixels)
        const VIEW_X = 70;                 // µm, transverse field of view
        const VIEW_Z = 112;                // µm, propagation distance shown
        const LENS_PX = 22;                // columns used to draw the metasurface
        canvas.width = W; canvas.height = H;

        const out = {
            lambda: $('#lambdaIn'), focal: $('#focalIn'), aperture: $('#apertureIn'), design: $('#designIn'),
            lens: $('#lensToggle'), log: $('#logToggle')
        };
        const TABLE = 8192, TWO_PI = Math.PI * 2;
        const cosT = new Float32Array(TABLE), sinT = new Float32Array(TABLE);
        for (let i = 0; i < TABLE; i++) { cosT[i] = Math.cos(i / TABLE * TWO_PI); sinT[i] = Math.sin(i / TABLE * TWO_PI); }
        const intensity = new Float32Array(W * H);
        const img = ctx.createImageData(W, H);
        let pending = false;

        function params() {
            return {
                lambda: +out.lambda.value / 1000,       // µm
                design: +out.design.value / 1000,       // µm
                f: +out.focal.value,                    // µm
                D: +out.aperture.value,                 // µm
                lens: out.lens.checked,
                log: out.log.checked
            };
        }

        function compute(fast) {
            pending = false;
            const S = fast ? 2 : 1;            // stride: coarse preview while dragging
            const t0 = performance.now();
            const p = params();
            const k = TWO_PI / p.lambda;
            const kd = TWO_PI / p.design;
            // sample the aperture finer than λ/2 to avoid aliasing
            const ns = Math.max(40, Math.ceil(p.D / (p.lambda * 0.45)));
            const xs = new Float32Array(ns), phs = new Float32Array(ns);
            for (let s = 0; s < ns; s++) {
                const x = -p.D / 2 + (s + 0.5) * p.D / ns;
                xs[s] = x;
                phs[s] = p.lens ? -kd * (Math.sqrt(x * x + p.f * p.f) - p.f) : 0;
            }
            const dz = VIEW_Z / (W - LENS_PX);
            const dx = VIEW_X / H;
            const scale = TABLE / TWO_PI;
            let max = 0;
            for (let i = LENS_PX; i < W; i += S) {
                const z = (i - LENS_PX + 0.5 * S) * dz;
                const z2 = z * z;
                for (let j = 0; j < H; j += S) {
                    const x = VIEW_X / 2 - (j + 0.5 * S) * dx;
                    let re = 0, im = 0;
                    for (let s = 0; s < ns; s++) {
                        const ddx = x - xs[s];
                        const r2 = ddx * ddx + z2;
                        const r = Math.sqrt(r2);
                        let ph = (phs[s] + k * r) % TWO_PI;
                        if (ph < 0) ph += TWO_PI;
                        const idx = (ph * scale) | 0;
                        // 2D Rayleigh–Sommerfeld kernel ~ (z/r) / sqrt(r)
                        const amp = z / (r * Math.sqrt(r));
                        re += amp * cosT[idx];
                        im += amp * sinT[idx];
                    }
                    const I = re * re + im * im;
                    for (let a = 0; a < S && j + a < H; a++)
                        for (let b = 0; b < S && i + b < W; b++) intensity[(j + a) * W + i + b] = I;
                    if (z > 3 && I > max) max = I;
                }
            }

            // locate focus along the optical axis
            const axisRow = Math.floor(H / 2);
            let best = LENS_PX, bestI = 0;
            for (let i = LENS_PX + 4; i < W; i++) {
                const I = intensity[axisRow * W + i];
                if (I > bestI) { bestI = I; best = i; }
            }
            const zFocus = (best - LENS_PX + 0.5) * dz;

            // colour map: spectral colour of the illumination
            const col = wavelengthToRgb(+out.lambda.value);
            const data = img.data;
            const logDen = Math.log(1 + 400);
            for (let j = 0; j < H; j++) {
                for (let i = 0; i < W; i++) {
                    const o = (j * W + i) * 4;
                    let v;
                    if (i < LENS_PX) {
                        v = 0;
                    } else {
                        const n = Math.min(1, intensity[j * W + i] / max);
                        v = p.log ? Math.log(1 + 400 * n) / logDen : Math.sqrt(n);
                    }
                    // hot core: blend towards white at highest intensities
                    const hot = Math.max(0, v - 0.75) * 4 * 0.6;
                    data[o] = col[0] * v + (255 - col[0]) * hot * v;
                    data[o + 1] = col[1] * v + (255 - col[1]) * hot * v;
                    data[o + 2] = col[2] * v + (255 - col[2]) * hot * v;
                    data[o + 3] = 255;
                }
            }
            ctx.putImageData(img, 0, 0);
            drawLens(p, col, dx);
            drawOverlay(p, zFocus, dz);

            const NA = Math.sin(Math.atan(p.D / 2 / p.f));
            const ms = performance.now() - t0;
            $('#labReadout').innerHTML =
                `NA ≈ ${NA.toFixed(2)} · spot ≈ ${(p.lambda * 1000 / (2 * NA)).toFixed(0)} nm<br>` +
                `design f = ${p.f} µm · ${p.lens ? 'measured' : 'no lens —'} focus ${p.lens ? `≈ ${zFocus.toFixed(1)} µm` : 'diffraction only'}<br>` +
                `${ns} Huygens sources · ${(W - LENS_PX) * H} px · ${ms.toFixed(0)} ms`;
        }

        function drawLens(p, col, dx) {
            // incident plane wave (left strip)
            ctx.fillStyle = '#05060a';
            ctx.fillRect(0, 0, LENS_PX, H);
            ctx.strokeStyle = `rgba(${col.join(',')},0.55)`;
            ctx.lineWidth = 1;
            for (let x = 2; x < LENS_PX - 6; x += 4) {
                ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); ctx.stroke();
            }
            // metasurface substrate
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            ctx.fillRect(LENS_PX - 6, 0, 2, H);
            // pillars: width encodes the local wrapped phase
            const kd = TWO_PI / p.design;
            const pitch = 2.2; // px between drawn pillars
            for (let y = 0; y < H; y += pitch) {
                const x = VIEW_X / 2 - (y + 0.5) * dx;
                if (Math.abs(x) > p.D / 2) continue;
                let ph = p.lens ? -kd * (Math.sqrt(x * x + p.f * p.f) - p.f) : 0;
                ph = ((ph % TWO_PI) + TWO_PI) % TWO_PI;
                const len = 1 + 4 * (ph / TWO_PI);
                ctx.fillStyle = `rgba(230,236,255,${0.45 + 0.5 * ph / TWO_PI})`;
                ctx.fillRect(LENS_PX - 4, y, len, 1.2);
            }
            // aperture stops
            ctx.fillStyle = '#2a2d3a';
            const top = (VIEW_X / 2 - p.D / 2) / dx;
            ctx.fillRect(LENS_PX - 6, 0, 6, Math.max(0, top));
            ctx.fillRect(LENS_PX - 6, H - Math.max(0, top), 6, Math.max(0, top));
        }

        function drawOverlay(p, zFocus, dz) {
            ctx.save();
            ctx.setLineDash([3, 4]);
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.beginPath(); ctx.moveTo(LENS_PX, H / 2 + 0.5); ctx.lineTo(W, H / 2 + 0.5); ctx.stroke();
            if (p.lens) {
                // designed focal plane
                const xf = LENS_PX + p.f / dz;
                if (xf < W) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
                    ctx.beginPath(); ctx.moveTo(xf + 0.5, 8); ctx.lineTo(xf + 0.5, H - 8); ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = 'rgba(255,255,255,0.75)';
                    ctx.font = '9px JetBrains Mono, monospace';
                    ctx.fillText('f (design)', Math.min(xf + 4, W - 54), 14);
                }
            }
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.font = '9px JetBrains Mono, monospace';
            ctx.fillText('z →', W - 26, H - 8);
            ctx.restore();
        }

        let fastNext = false;
        function schedule(fast) {
            fastNext = !!fast;
            if (pending) return;
            pending = true;
            requestAnimationFrame(() => compute(fastNext));
        }

        function syncLabels() {
            $('#lambdaOut').textContent = out.lambda.value + ' nm';
            $('#designOut').textContent = out.design.value + ' nm';
            $('#focalOut').textContent = out.focal.value + ' µm';
            $('#apertureOut').textContent = out.aperture.value + ' µm';
            out.lambda.style.setProperty('--track', `rgb(${wavelengthToRgb(+out.lambda.value).join(',')})`);
            out.design.style.setProperty('--track', `rgb(${wavelengthToRgb(+out.design.value).join(',')})`);
        }

        Object.values(out).forEach(el => {
            el.addEventListener('input', () => { syncLabels(); schedule(el.type === 'range'); });
            el.addEventListener('change', () => schedule(false));
        });

        // compute lazily the first time the lab scrolls into view
        let started = false;
        new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !started) { started = true; syncLabels(); schedule(); }
        }, { rootMargin: '200px' }).observe(canvas);

        return {
            setLambda(nm) {
                out.lambda.value = nm; syncLabels(); started = true; schedule();
            }
        };
    })();


    /* =========================================================
       Lab tabs
       ========================================================= */
    const tabListeners = [];
    function showTab(name) {
        $$('.lab-tab').forEach(t => {
            const on = t.id === 'tab-' + name;
            t.classList.toggle('active', on);
            t.setAttribute('aria-selected', on);
            t.tabIndex = on ? 0 : -1;
        });
        $$('.lab-panel').forEach(p => {
            const on = p.id === 'panel-' + name;
            p.hidden = !on;
            if (on) p.classList.add('visible');
        });
        tabListeners.forEach(fn => fn(name));
    }
    $$('.lab-tab').forEach((t, i, all) => {
        t.addEventListener('click', () => showTab(t.id.replace('tab-', '')));
        t.addEventListener('keydown', e => {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            const next = all[(i + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length];
            next.focus(); next.click();
        });
    });

    /* =========================================================
       PDE lab — Gray–Scott reaction–diffusion (explicit FD)
       ========================================================= */
    const rd = (() => {
        const canvas = $('#rdCanvas');
        const ctx = canvas.getContext('2d');
        const W = 256, H = 160, N = W * H;
        canvas.width = W; canvas.height = H;
        const Du = 0.16, Dv = 0.08;   // stable for dt = 1 on the 5-point stencil
        let u = new Float32Array(N), v = new Float32Array(N);
        let u2 = new Float32Array(N), v2 = new Float32Array(N);
        // periodic neighbour index tables
        const L = new Int32Array(W), R = new Int32Array(W), U = new Int32Array(H), D = new Int32Array(H);
        for (let i = 0; i < W; i++) { L[i] = (i - 1 + W) % W; R[i] = (i + 1) % W; }
        for (let j = 0; j < H; j++) { U[j] = ((j - 1 + H) % H) * W; D[j] = ((j + 1) % H) * W; }
        const img = ctx.createImageData(W, H);
        const el = { F: $('#rdF'), k: $('#rdK'), speed: $('#rdSpeed') };
        let F = 0.0545, K = 0.062, steps = 12, paused = false, active = true, inView = false, totalSteps = 0;
        let pal = [];

        function buildPalette() {
            const bg = [4, 5, 10], c2 = hexToRgb(cssVar('--accent-2')), c1 = hexToRgb(cssVar('--accent'));
            const stops = [[0, bg], [0.35, c2], [0.7, c1], [1, [255, 255, 255]]];
            pal = new Uint8ClampedArray(256 * 3);
            for (let i = 0; i < 256; i++) {
                const t = i / 255;
                let s = 0; while (s < stops.length - 2 && t > stops[s + 1][0]) s++;
                const [t0, a] = stops[s], [t1, b] = stops[s + 1];
                const f = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
                for (let c = 0; c < 3; c++) pal[i * 3 + c] = a[c] + (b[c] - a[c]) * f;
            }
        }

        function seed(x, y, r) {
            for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
                if (i * i + j * j > r * r) continue;
                const idx = ((y + j + H) % H) * W + ((x + i + W) % W);
                u[idx] = 0.5; v[idx] = 0.25 + Math.random() * 0.02;
            }
        }
        function reset() {
            u.fill(1); v.fill(0); totalSteps = 0;
            for (let n = 0; n < 14; n++) seed((Math.random() * W) | 0, (Math.random() * H) | 0, 3 + (Math.random() * 4 | 0));
            render();
        }

        function step() {
            for (let j = 0; j < H; j++) {
                const row = j * W, up = U[j], dn = D[j];
                for (let i = 0; i < W; i++) {
                    const p = row + i;
                    const uu = u[p], vv = v[p];
                    const lu = u[row + L[i]] + u[row + R[i]] + u[up + i] + u[dn + i] - 4 * uu;
                    const lv = v[row + L[i]] + v[row + R[i]] + v[up + i] + v[dn + i] - 4 * vv;
                    const uvv = uu * vv * vv;
                    u2[p] = uu + Du * lu - uvv + F * (1 - uu);
                    v2[p] = vv + Dv * lv + uvv - (F + K) * vv;
                }
            }
            let t = u; u = u2; u2 = t; t = v; v = v2; v2 = t;
            totalSteps++;
        }

        function render() {
            const d = img.data;
            for (let p = 0, o = 0; p < N; p++, o += 4) {
                const c = Math.min(255, Math.max(0, (v[p] * 3.2 * 255) | 0)) * 3;
                d[o] = pal[c]; d[o + 1] = pal[c + 1]; d[o + 2] = pal[c + 2]; d[o + 3] = 255;
            }
            ctx.putImageData(img, 0, 0);
        }

        let frames = 0, tAcc = 0, lastT = performance.now(), rate = 0;
        function loop(now) {
            requestAnimationFrame(loop);
            if (!active || !inView || document.hidden) { lastT = now; return; }
            if (!paused) {
                const t0 = performance.now();
                for (let s = 0; s < steps; s++) step();
                tAcc += performance.now() - t0;
                frames += steps;
                render();
            }
            if (now - lastT > 500) {
                rate = tAcc > 0 ? frames / (tAcc / 1000) : 0;
                const fps = frames / ((now - lastT) / 1000);
                $('#rdReadout').innerHTML =
                    `grid ${W}×${H} · periodic · Δt = 1<br>` +
                    `${(fps).toFixed(0)} steps/s on screen · solver ≈ ${(rate * N / 1e6).toFixed(0)} M cell-updates/s<br>` +
                    `t = ${totalSteps.toLocaleString()} steps`;
                frames = 0; tAcc = 0; lastT = now;
            }
        }

        function sync() {
            F = +el.F.value; K = +el.k.value; steps = +el.speed.value;
            $('#rdFOut').textContent = F.toFixed(4);
            $('#rdKOut').textContent = K.toFixed(4);
            $('#rdSpeedOut').textContent = steps;
        }
        Object.values(el).forEach(i => i.addEventListener('input', () => {
            sync();
            if (i !== el.speed) $$('#rdPresets .filter').forEach(b => b.classList.remove('active'));
        }));
        $$('#rdPresets .filter').forEach(b => b.addEventListener('click', () => {
            $$('#rdPresets .filter').forEach(x => x.classList.toggle('active', x === b));
            el.F.value = b.dataset.f; el.k.value = b.dataset.k; sync(); reset();
        }));
        $('#rdPause').addEventListener('click', e => { paused = !paused; e.currentTarget.textContent = paused ? 'Resume' : 'Pause'; });
        $('#rdReset').addEventListener('click', reset);

        let drawing = false;
        function paint(e) {
            const r = canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - r.left) / r.width * W), y = Math.floor((e.clientY - r.top) / r.height * H);
            if (x >= 0 && x < W && y >= 0 && y < H) { seed(x, y, 4); if (paused) render(); }
        }
        canvas.addEventListener('pointerdown', e => { drawing = true; canvas.setPointerCapture(e.pointerId); paint(e); });
        canvas.addEventListener('pointermove', e => { if (drawing) paint(e); });
        canvas.addEventListener('pointerup', () => { drawing = false; });
        canvas.addEventListener('pointercancel', () => { drawing = false; });

        new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { rootMargin: '100px' }).observe(canvas);
        tabListeners.push(name => { active = name === 'pde'; });
        themeListeners.push(() => { buildPalette(); render(); });

        buildPalette(); sync(); reset();
        if (reducedMotion) { for (let s = 0; s < 3000; s++) step(); render(); paused = true; $('#rdPause').textContent = 'Resume'; }
        requestAnimationFrame(loop);
    })();

    /* =========================================================
       HPC lab — strong scaling of Monte Carlo π with Web Workers
       ========================================================= */
    const hpc = (() => {
        const cores = Math.max(1, Math.min(16, navigator.hardwareConcurrency || 4));
        $('#hpcCores').textContent = cores;
        const chart = $('#hpcChart');
        const tbody = $('#hpcTable tbody');
        const nIn = $('#hpcN');
        const runBtn = $('#hpcRun');
        const supported = typeof Worker !== 'undefined' && typeof Blob !== 'undefined';
        const workerSrc = `self.onmessage = e => {
            const n = e.data.n; let x = e.data.seed >>> 0 || 1; let inside = 0;
            for (let i = 0; i < n; i++) {
                x ^= x << 13; x ^= x >>> 17; x ^= x << 5; const a = (x >>> 0) / 4294967296;
                x ^= x << 13; x ^= x >>> 17; x ^= x << 5; const b = (x >>> 0) / 4294967296;
                if (a * a + b * b < 1) inside++;
            }
            postMessage(inside);
        };`;
        let url = null, running = false;

        const threadCounts = [];
        for (let t = 1; t <= cores; t *= 2) threadCounts.push(t);
        if (threadCounts[threadCounts.length - 1] !== cores) threadCounts.push(cores);

        function syncN() { $('#hpcNOut').textContent = nIn.value + ' M'; }
        nIn.addEventListener('input', syncN); syncN();

        function job(worker, n, seed) {
            return new Promise(res => { worker.onmessage = e => res(e.data); worker.postMessage({ n, seed }); });
        }

        async function runOnce(T, total) {
            const workers = Array.from({ length: T }, () => new Worker(url));
            // warm-up so worker start-up and JIT are not timed
            await Promise.all(workers.map((w, i) => job(w, 200000, 99 + i)));
            const per = Math.floor(total / T);
            const t0 = performance.now();
            const counts = await Promise.all(workers.map((w, i) => job(w, i === T - 1 ? total - per * (T - 1) : per, (Math.random() * 4294967295) >>> 0 || 7 + i)));
            const ms = performance.now() - t0;
            workers.forEach(w => w.terminate());
            const inside = counts.reduce((a, b) => a + b, 0);
            return { T, ms, pi: 4 * inside / total };
        }

        function drawChart(results) {
            if (!results.length) {
                chart.innerHTML = `<div class="chart-title">Speedup vs. threads</div><div class="chart-sub">Fixed total workload (strong scaling)</div>` +
                    `<div class="hpc-empty">${supported ? 'Run the test to measure how well this problem scales on your machine.' : 'Web Workers are not available in this browser.'}</div>`;
                return;
            }
            const narrow = chart.clientWidth < 420;
            const VW = narrow ? 360 : 520, VH = narrow ? 260 : 300, m = { l: 36, r: 46, t: 14, b: 34 };
            const pw = VW - m.l - m.r, ph = VH - m.t - m.b;
            const maxT = threadCounts[threadCounts.length - 1];
            const yMax = Math.max(maxT, ...results.map(r => r.speedup)) * 1.08;
            const n = threadCounts.length, band = pw / n, bw = Math.min(46, band * 0.55);
            const X = i => m.l + band * i + band / 2;
            const Y = v => m.t + ph - (v / yMax) * ph;
            const stepY = yMax > 10 ? 4 : yMax > 5 ? 2 : 1;
            let g = '';
            for (let v = 0; v <= yMax; v += stepY) g += `<line x1="${m.l}" x2="${VW - m.r}" y1="${Y(v)}" y2="${Y(v)}"/>`;
            let axis = '';
            for (let v = 0; v <= yMax; v += stepY) axis += `<text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end">${v}×</text>`;
            threadCounts.forEach((t, i) => { axis += `<text x="${X(i)}" y="${VH - m.b + 18}" text-anchor="middle">${t}</text>`; });
            axis += `<text x="${m.l + pw / 2}" y="${VH - 2}" text-anchor="middle">threads</text>`;
            let bars = '';
            results.forEach(r => {
                const i = threadCounts.indexOf(r.T);
                const x = X(i) - bw / 2, y = Y(r.speedup), h = Y(0) - y, rr = Math.min(4, h);
                bars += `<path class="bar" d="M${x},${Y(0)} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + bw - rr} Q${x + bw},${y} ${x + bw},${y + rr} V${Y(0)} Z">` +
                    `<title>${r.T} thread${r.T > 1 ? 's' : ''}: ${r.speedup.toFixed(2)}× speedup, ${r.ms.toFixed(0)} ms, ${(100 * r.speedup / r.T).toFixed(0)}% efficiency</title></path>` +
                    `<text class="val" x="${X(i)}" y="${y - 6}" text-anchor="middle">${r.speedup.toFixed(1)}×</text>`;
            });
            const ideal = threadCounts.map((t, i) => `${X(i)},${Y(t)}`).join(' ');
            const lastI = n - 1;
            chart.innerHTML = `<div class="chart-title">Speedup vs. threads</div>` +
                `<div class="chart-sub">Fixed total workload (strong scaling) · measured on your device · hover bars for details</div>` +
                `<svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Bar chart of measured speedup per thread count against ideal linear speedup">` +
                `<g class="grid">${g}</g><g class="axis">${axis}</g>${bars}` +
                `<polyline class="ideal" points="${ideal}"/>` +
                `<text class="lbl" x="${X(lastI) + bw / 2 + 4}" y="${Y(threadCounts[lastI]) + 4}">ideal</text></svg>`;
        }

        function drawTable(results) {
            tbody.innerHTML = results.map(r =>
                `<tr><td>${r.T}</td><td>${r.ms.toFixed(0)} ms</td><td>${r.speedup.toFixed(2)}×</td>` +
                `<td>${(100 * r.speedup / r.T).toFixed(0)}%</td><td>${r.pi.toFixed(5)}</td></tr>`).join('');
        }

        async function run() {
            if (running || !supported) return;
            running = true;
            runBtn.disabled = true;
            if (!url) url = URL.createObjectURL(new Blob([workerSrc], { type: 'text/javascript' }));
            const total = +nIn.value * 1e6;
            const results = [];
            tbody.innerHTML = '';
            drawChart(results);
            try {
                for (const T of threadCounts) {
                    runBtn.textContent = `Running ${T} thread${T > 1 ? 's' : ''}…`;
                    const r = await runOnce(T, total);
                    r.speedup = results.length ? results[0].ms / r.ms : 1;
                    results.push(r);
                    drawChart(results); drawTable(results);
                }
                const best = results[results.length - 1];
                toast(`⚡ ${best.T} threads → ${best.speedup.toFixed(1)}× faster · π ≈ ${best.pi.toFixed(5)}`);
            } catch (e) {
                tbody.innerHTML = `<tr><td colspan="5">Benchmark failed: ${String(e.message || e).replace(/</g, '&lt;')}</td></tr>`;
            }
            runBtn.textContent = 'Run again';
            runBtn.disabled = false;
            running = false;
        }
        runBtn.addEventListener('click', run);
        drawChart([]);
        if (!supported) runBtn.disabled = true;
        return { run };
    })();

    /* =========================================================
       Projects: filter + tilt
       ========================================================= */
    $$('.filter').forEach(btn => btn.addEventListener('click', () => {
        $$('.filter').forEach(b => b.classList.toggle('active', b === btn));
        const f = btn.dataset.filter;
        $$('.project-card').forEach(card => {
            const show = f === 'all' || card.dataset.tags.split(' ').includes(f);
            card.classList.toggle('hide', !show);
            if (show) card.classList.add('visible');
        });
    }));

    if (!reducedMotion && matchMedia('(hover: hover)').matches) {
        $$('.tilt').forEach(card => {
            card.addEventListener('pointermove', e => {
                const r = card.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
                card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 6}deg) rotateY(${(px - 0.5) * 6}deg) translateY(-2px)`;
                card.style.setProperty('--mx', `${px * 100}%`);
                card.style.setProperty('--my', `${py * 100}%`);
            });
            card.addEventListener('pointerleave', () => { card.style.transform = ''; });
        });
    }

    /* =========================================================
       Copy email
       ========================================================= */
    function copyEmail() {
        const email = $('#copyEmail').dataset.email;
        const done = () => {
            toast('📋 Email copied: ' + email);
            const label = $('#copyEmail .copy-label');
            label.textContent = 'Copied ✓';
            setTimeout(() => { label.textContent = 'Copy email'; }, 1800);
        };
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(email).then(done, () => toast(email));
        } else {
            const ta = document.createElement('textarea');
            ta.value = email; document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); done(); } catch (e) { toast(email); }
            ta.remove();
        }
    }
    $('#copyEmail').addEventListener('click', copyEmail);

    /* =========================================================
       Photon rain (easter egg)
       ========================================================= */
    function photonRain() {
        if (reducedMotion) { toast('✨ You found the secret — photons everywhere!'); return; }
        for (let i = 0; i < 90; i++) {
            const d = document.createElement('div');
            const nm = 400 + Math.random() * 300;
            d.className = 'photon';
            d.style.left = Math.random() * 100 + 'vw';
            d.style.height = 12 + Math.random() * 30 + 'px';
            d.style.background = `rgb(${wavelengthToRgb(nm).join(',')})`;
            d.style.boxShadow = `0 0 8px rgb(${wavelengthToRgb(nm).join(',')})`;
            d.style.animationDuration = 1.2 + Math.random() * 1.8 + 's';
            d.style.animationDelay = Math.random() * 0.8 + 's';
            document.body.appendChild(d);
            setTimeout(() => d.remove(), 4000);
        }
        toast('✨ Photon shower! 400–700 nm, all at once.');
    }

    const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let kIdx = 0;
    addEventListener('keydown', e => {
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        kIdx = key === konami[kIdx] ? kIdx + 1 : (key === konami[0] ? 1 : 0);
        if (kIdx === konami.length) { kIdx = 0; photonRain(); }
    });

    /* =========================================================
       Tic-tac-toe vs. minimax
       ========================================================= */
    const game = (() => {
        const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        const boardEl = $('#gameBoard');
        const statusEl = $('#gameStatus');
        const score = { player: 0, ai: 0, draw: 0 };
        let board, active;
        const cells = [];
        for (let i = 0; i < 9; i++) {
            const c = document.createElement('button');
            c.className = 'game-cell';
            c.setAttribute('aria-label', `Cell ${i + 1}`);
            c.addEventListener('click', () => play(i));
            boardEl.appendChild(c);
            cells.push(c);
        }

        function winner(b) {
            for (const l of LINES) if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return { p: b[l[0]], line: l };
            return b.every(Boolean) ? { p: 'draw' } : null;
        }
        function minimax(b, isAi, depth) {
            const w = winner(b);
            if (w) return w.p === 'O' ? 10 - depth : w.p === 'X' ? depth - 10 : 0;
            let best = isAi ? -Infinity : Infinity;
            for (let i = 0; i < 9; i++) {
                if (b[i]) continue;
                b[i] = isAi ? 'O' : 'X';
                const v = minimax(b, !isAi, depth + 1);
                b[i] = '';
                best = isAi ? Math.max(best, v) : Math.min(best, v);
            }
            return best;
        }
        function aiMove() {
            const empty = board.map((v, i) => v ? -1 : i).filter(i => i >= 0);
            const hard = $('#hardMode').checked;
            if (!hard && Math.random() < 0.3) return empty[Math.floor(Math.random() * empty.length)];
            let best = -Infinity, move = empty[0];
            for (const i of empty) {
                board[i] = 'O';
                const v = minimax(board, false, 0);
                board[i] = '';
                if (v > best) { best = v; move = i; }
            }
            return move;
        }
        function render(winLine) {
            board.forEach((v, i) => {
                const c = cells[i];
                c.className = 'game-cell' + (v ? ' ' + v.toLowerCase() : '') + (winLine && winLine.includes(i) ? ' win' : '');
                c.innerHTML = v ? `<span>${v === 'X' ? '✕' : '◯'}</span>` : '';
                c.disabled = !active || !!v;
            });
            $('#playerScore').textContent = score.player;
            $('#computerScore').textContent = score.ai;
            $('#drawScore').textContent = score.draw;
        }
        function finish(w) {
            active = false;
            if (w.p === 'X') { score.player++; statusEl.textContent = '🎉 You win! (try unbeatable mode)'; }
            else if (w.p === 'O') { score.ai++; statusEl.textContent = '🤖 The algorithm wins this round.'; }
            else { score.draw++; statusEl.textContent = '🤝 Draw — a perfectly balanced system.'; }
            render(w.line);
        }
        function play(i) {
            if (!active || board[i]) return;
            board[i] = 'X';
            let w = winner(board);
            if (w) return finish(w);
            active = false;
            statusEl.textContent = 'AI is thinking…';
            render();
            setTimeout(() => {
                board[aiMove()] = 'O';
                active = true;
                w = winner(board);
                if (w) return finish(w);
                statusEl.textContent = 'Your turn — you are ✕';
                render();
            }, 380);
        }
        function reset() {
            board = Array(9).fill('');
            active = true;
            statusEl.textContent = 'Your turn — you are ✕';
            render();
        }
        reset();
        $('#resetGameBtn').addEventListener('click', reset);
        return { reset };
    })();

    /* ---------- modal helpers ---------- */
    let lastFocus = null;
    function openModal(el, focusEl) {
        lastFocus = document.activeElement;
        el.classList.remove('hidden');
        (focusEl || el.querySelector('button, input')).focus();
    }
    function closeModal(el) {
        el.classList.add('hidden');
        if (lastFocus) lastFocus.focus();
    }
    const gameModal = $('#gameModal');
    const openGame = () => openModal(gameModal, $('.game-cell'));
    $('#gameBtn').addEventListener('click', openGame);
    $('#closeGameBtn').addEventListener('click', () => closeModal(gameModal));
    gameModal.addEventListener('click', e => { if (e.target === gameModal) closeModal(gameModal); });

    /* =========================================================
       Command palette
       ========================================================= */
    const palette = $('#palette');
    const pInput = $('#paletteInput');
    const pList = $('#paletteList');
    const goto = id => () => $(id).scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    const commands = [
        { icon: '👋', label: 'Go to About', hint: 'section', run: goto('#about') },
        { icon: '💼', label: 'Go to Experience', hint: 'section', run: goto('#experience') },
        { icon: '🔬', label: 'Go to Simulation Lab', hint: 'section', run: goto('#lab') },
        { icon: '🧪', label: 'Lab: reaction-diffusion PDE solver', hint: 'lab', run: () => { showTab('pde'); goto('#lab')(); } },
        { icon: '🔭', label: 'Lab: metalens wave-optics simulation', hint: 'lab', run: () => { showTab('optics'); goto('#lab')(); } },
        { icon: '⚡', label: 'Lab: run parallel scaling benchmark', hint: 'hpc', run: () => { showTab('hpc'); goto('#lab')(); setTimeout(hpc.run, 600); } },
        { icon: '🧪', label: 'Go to Projects', hint: 'section', run: goto('#projects') },
        { icon: '📄', label: 'Go to Publications', hint: 'section', run: goto('#publications') },
        { icon: '✉️', label: 'Go to Contact', hint: 'section', run: goto('#contact') },
        { icon: '🌗', label: 'Toggle light / dark theme', hint: 'theme', run: toggleTheme },
        { icon: '📋', label: 'Copy email address', hint: 'contact', run: copyEmail },
        { icon: '📨', label: 'Send an email', hint: 'contact', run: () => { location.href = 'mailto:amkjdeutsch1@gmail.com'; } },
        { icon: '🐙', label: 'Open GitHub profile', hint: 'link', run: () => open('https://github.com/arnab-mkj', '_blank', 'noopener') },
        { icon: '💼', label: 'Open LinkedIn profile', hint: 'link', run: () => open('https://www.linkedin.com/in/arnab-mukherjee-05/', '_blank', 'noopener') },
        { icon: '🎮', label: 'Play tic-tac-toe', hint: 'fun', run: openGame },
        { icon: '🟥', label: 'Lab: switch to red light (650 nm)', hint: 'lab', run: () => { showTab('optics'); lab.setLambda(650); goto('#lab')(); } },
        { icon: '🟦', label: 'Lab: switch to blue light (450 nm)', hint: 'lab', run: () => { showTab('optics'); lab.setLambda(450); goto('#lab')(); } },
        { icon: '🧹', label: 'Clear hero light emitters', hint: 'hero', run: wave.clearEmitters },
        { icon: '✨', label: 'Make it rain photons', hint: 'secret', run: photonRain }
    ];
    let filtered = commands, sel = 0;

    function score(label, q) {
        label = label.toLowerCase();
        if (!q) return 1;
        if (label.includes(q)) return 2;
        let i = 0;
        for (const ch of label) if (ch === q[i]) i++;
        return i === q.length ? 1 : 0;
    }
    function renderPalette() {
        const q = pInput.value.trim().toLowerCase();
        filtered = commands.map(c => ({ c, s: score(c.label + ' ' + c.hint, q) })).filter(x => x.s > 0)
            .sort((a, b) => b.s - a.s).map(x => x.c);
        sel = Math.min(sel, Math.max(0, filtered.length - 1));
        pList.innerHTML = '';
        if (!filtered.length) {
            pList.innerHTML = '<li class="empty">No matching commands</li>';
            return;
        }
        filtered.forEach((c, i) => {
            const li = document.createElement('li');
            li.setAttribute('role', 'option');
            li.className = i === sel ? 'sel' : '';
            li.innerHTML = `<span class="p-icon">${c.icon}</span><span></span><span class="p-hint">${c.hint}</span>`;
            li.children[1].textContent = c.label;
            li.addEventListener('click', () => runCmd(c));
            li.addEventListener('pointermove', () => { if (sel !== i) { sel = i; highlight(); } });
            pList.appendChild(li);
        });
    }
    function highlight() {
        $$('li', pList).forEach((li, i) => li.classList.toggle('sel', i === sel));
        const el = pList.children[sel];
        if (el) el.scrollIntoView({ block: 'nearest' });
    }
    function runCmd(c) { closePalette(); setTimeout(c.run, 50); }
    function openPalette() {
        pInput.value = ''; sel = 0; renderPalette();
        openModal(palette, pInput);
    }
    function closePalette() { closeModal(palette); }

    $('#paletteBtn').addEventListener('click', openPalette);
    palette.addEventListener('click', e => { if (e.target === palette) closePalette(); });
    pInput.addEventListener('input', () => { sel = 0; renderPalette(); });
    pInput.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(1, filtered.length); highlight(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + filtered.length) % Math.max(1, filtered.length); highlight(); }
        else if (e.key === 'Enter' && filtered[sel]) { e.preventDefault(); runCmd(filtered[sel]); }
    });

    addEventListener('keydown', e => {
        const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName) && document.activeElement.type !== 'range' && document.activeElement.type !== 'checkbox';
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            palette.classList.contains('hidden') ? openPalette() : closePalette();
        } else if (e.key === '/' && !typing && palette.classList.contains('hidden')) {
            e.preventDefault(); openPalette();
        } else if (e.key === 'Escape') {
            if (!palette.classList.contains('hidden')) closePalette();
            else if (!gameModal.classList.contains('hidden')) closeModal(gameModal);
        }
    });

    /* ---------- misc ---------- */
    $('#year').textContent = new Date().getFullYear();
    console.log('%c👋 Hi there, curious engineer!', 'font-size:16px;font-weight:bold;color:#5ee7ff');
    console.log('Try Ctrl/⌘+K for the command palette — or the Konami code for something shinier.');
})();
