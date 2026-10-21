/* =========================================================
   INFOTECCELL — interações e efeitos
   ========================================================= */
(() => {
  'use strict';
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const CFG = window.INFOTEC || {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- toast ---------- */
  const toastEl = $('#toast');
  let toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('show'), 3200);
  }

  /* ---------- links do WhatsApp / Instagram ---------- */
  /*  data-wpp="community"  -> grupo do WhatsApp (só na seção da comunidade)
      data-wpp="stores"     -> abre o painel para escolher a loja
      data-wpp="store:ID"   -> abre o WhatsApp direto daquela loja
      data-wpp="online"     -> abre o WhatsApp das vendas online
      data-msg="..."        -> mensagem que já vai escrita                   */
  const LOJAS = CFG.LOJAS || [];
  const ONLINE = CFG.VENDAS_ONLINE || null;
  const communityUrl = CFG.WHATSAPP_COMUNIDADE || '';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const waUrl = (l, msg) => `https://wa.me/55${l.ddd}${l.numero}?text=${encodeURIComponent(msg || CFG.MENSAGEM_PADRAO || '')}`;
  const fone = l => { const n = l.numero, cut = n.length - 4; return `(${l.ddd}) ${n.slice(0, cut)}-${n.slice(cut)}`; };
  const waIcon = '<svg class="ico"><use href="#i-wa"/></svg>';
  const pinIcon = '<svg class="ico"><use href="#i-pin"/></svg>';

  $$('[data-wpp]').forEach(a => {
    const k = a.dataset.wpp;
    if (k === 'community' && communityUrl) { a.href = communityUrl; a.target = '_blank'; a.rel = 'noopener'; }
    else if (k.startsWith('store:')) {
      const l = LOJAS.find(x => x.id === k.slice(6));
      if (l) { a.href = waUrl(l, a.dataset.msg); a.target = '_blank'; a.rel = 'noopener'; }
    }
  });
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-wpp]');
    if (!a) return;
    const k = a.dataset.wpp;
    if (k === 'stores') { e.preventDefault(); openSheet(a.dataset.msg); }
    else if (k === 'online' && ONLINE) { e.preventDefault(); window.open(waUrl(ONLINE, a.dataset.msg || ONLINE.mensagem), '_blank', 'noopener'); }
    else if (k === 'community' && !communityUrl) { e.preventDefault(); toast('Link da comunidade chegando em breve 💬'); }
  });
  $$('[data-link]').forEach(a => {
    a.href = { una: CFG.INSTAGRAM_UNA, brasil: CFG.INSTAGRAM_BRASIL, luisgomes: CFG.INSTAGRAM_LUISGOMES }[a.dataset.link] || '#';
  });
  $('#year').textContent = new Date().getFullYear();

  /* ---------- seção "Nossas lojas" + rodapé ---------- */
  $('#shops').innerHTML = LOJAS.map((l, i) => `
    <article class="shop tilt" data-tilt data-reveal style="--d:${i * .1}s">
      <div class="shop-head"><span class="pin">${pinIcon}</span><div><small>Loja</small><h3>${esc(l.local)}</h3></div></div>
      <p class="addr">${esc(l.endereco)}</p>
      <p class="tel"><svg class="ico"><use href="#i-call"/></svg>${fone(l)}</p>
      <div class="shop-cta">
        <a class="btn btn-wa" href="${waUrl(l)}" target="_blank" rel="noopener">${waIcon}<span>Chamar no WhatsApp</span></a>
        <a class="btn btn-ghost btn-icon" href="tel:+55${l.ddd}${l.numero}" aria-label="Ligar para ${esc(l.nome)}"><svg class="ico"><use href="#i-call"/></svg></a>
      </div>
    </article>`).join('');
  if (ONLINE) {
    $('#online').innerHTML = `
      <span class="pin">${waIcon}</span>
      <div class="online-txt"><small>Vendas online</small><h3>Compre sem sair de casa</h3><p>Escolha o produto e finalize direto pelo WhatsApp.</p></div>
      <a class="btn btn-white btn-lg" href="${waUrl(ONLINE, ONLINE.mensagem)}" target="_blank" rel="noopener">${waIcon}<span>Comprar online</span></a>`;
  } else $('#online').remove();
  $('#footShops').innerHTML = (ONLINE ? `<li><b>Vendas online</b> · ${fone(ONLINE)}</li>` : '') + LOJAS.map(l => `<li><b>${esc(l.local)}</b> · ${esc(l.endereco)} · ${fone(l)}</li>`).join('');

  /* ---------- painel "Falar com qual loja?" ---------- */
  const sheet = $('#sheet'), sheetList = $('#sheetList');
  let sheetFocus = null, sheetT;
  function openSheet(msg) {
    sheetFocus = document.activeElement;
    const onlineRow = ONLINE ? `
      <a class="sheet-row online" href="${waUrl(ONLINE, msg || ONLINE.mensagem)}" target="_blank" rel="noopener">
        <span class="pin">${waIcon}</span>
        <span class="sr-txt"><b>Vendas online</b><small>Compre sem sair de casa</small><em>${fone(ONLINE)}</em></span>
        <span class="wa-dot">${waIcon}</span>
      </a>` : '';
    sheetList.innerHTML = onlineRow + LOJAS.map(l => `
      <a class="sheet-row" href="${waUrl(l, msg)}" target="_blank" rel="noopener">
        <span class="pin">${pinIcon}</span>
        <span class="sr-txt"><b>${esc(l.nome)}</b><small>${esc(l.endereco)}</small><em>${fone(l)}</em></span>
        <span class="wa-dot">${waIcon}</span>
      </a>`).join('');
    clearTimeout(sheetT);
    sheet.hidden = false;
    document.body.classList.add('sheet-open');
    requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('open')));
    $('.sheet-x', sheet).focus();
  }
  function closeSheet() {
    sheet.classList.remove('open');
    document.body.classList.remove('sheet-open');
    sheetT = setTimeout(() => { sheet.hidden = true; }, reduce ? 0 : 380);
    if (sheetFocus && sheetFocus.focus) sheetFocus.focus();
  }
  sheet.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) closeSheet();
    else if (e.target.closest('.sheet-row')) setTimeout(closeSheet, 250);
  });
  addEventListener('keydown', e => {
    if (sheet.hidden) return;
    if (e.key === 'Escape') closeSheet();
    else if (e.key === 'Tab') {
      const f = $$('button,a[href]', sheet).filter(x => x.offsetParent !== null);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- reveal ao rolar ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal]').forEach(el => io.observe(el));

  /* ---------- progresso, nav, FAB, parallax do herói ---------- */
  const bar = $('.progress i'), nav = $('#nav'), fab = $('.fab'), stage = $('#stage');
  let ticking = false, tiltEl = null, tiltRect = null, tiltDirty = false, magEl = null;
  function onScroll() {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    nav.classList.toggle('scrolled', scrollY > 20);
    fab.classList.toggle('show', scrollY > innerHeight * .7);
    if (!reduce && scrollY < innerHeight * 1.2) stage.style.setProperty('--py', `${-scrollY * .07}px`);
    tiltDirty = true;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* menu ativo conforme a seção */
  const spyLinks = $$('[data-spy]');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        spyLinks.forEach(a => a.classList.toggle('active', a.dataset.spy === en.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('header[id], section[id]').forEach(s => spy.observe(s));

  /* ---------- tilt 3D, ímã nos botões, holofote ---------- */
  const spot = $('.spotlight');
  function resetTilt(el) {
    if (!el) return;
    el.classList.remove('tilting');
    el.style.setProperty('--tx', '0deg'); el.style.setProperty('--ty', '0deg');
  }
  function resetMag(el) { if (el) { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); } }

  if (fine && !reduce) {
    addEventListener('pointermove', e => {
      spot.style.setProperty('--sx', e.clientX + 'px');
      spot.style.setProperty('--sy', e.clientY + 'px');
      spot.classList.add('on');

      const t = e.target.closest && e.target.closest('.tilt');
      if (t !== tiltEl) { resetTilt(tiltEl); tiltEl = t; tiltDirty = true; if (t) t.classList.add('tilting'); }
      if (tiltEl) {
        if (tiltDirty || !tiltRect) { tiltRect = tiltEl.getBoundingClientRect(); tiltDirty = false; }
        const px = clamp((e.clientX - tiltRect.left) / tiltRect.width, 0, 1);
        const py = clamp((e.clientY - tiltRect.top) / tiltRect.height, 0, 1);
        const max = tiltEl.classList.contains('phone') ? 9 : 7;
        tiltEl.style.setProperty('--tx', ((.5 - py) * max * 2).toFixed(2) + 'deg');
        tiltEl.style.setProperty('--ty', ((px - .5) * max * 2).toFixed(2) + 'deg');
        tiltEl.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        tiltEl.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      }

      const m = e.target.closest && e.target.closest('[data-magnetic]');
      if (m !== magEl) { resetMag(magEl); magEl = m; }
      if (magEl) {
        const r = magEl.getBoundingClientRect();
        magEl.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * .22).toFixed(1) + 'px');
        magEl.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * .32).toFixed(1) + 'px');
      }
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => {
      resetTilt(tiltEl); tiltEl = null; resetMag(magEl); magEl = null; spot.classList.remove('on');
    });
  }

  /* ---------- herói: inclinação 3D do mascote ---------- */
  const hero = $('#inicio');
  let heroVisible = true;
  new IntersectionObserver(([en]) => { heroVisible = en.isIntersecting; if (heroVisible) loop(); }, { threshold: 0 }).observe(hero);

  if (fine && !reduce) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      stage.style.setProperty('--rx', (px * 22).toFixed(2) + 'deg');
      stage.style.setProperty('--ry', (-py * 16).toFixed(2) + 'deg');
    });
    hero.addEventListener('pointerleave', () => {
      stage.style.setProperty('--rx', '0deg'); stage.style.setProperty('--ry', '0deg');
    });
  }

  /* partículas flutuantes + balanço automático no celular */
  const cv = $('#particles'), ctx = cv.getContext('2d');
  let W = 0, H = 0, dots = [], rafOn = false, t0 = 0;
  const mk = init => ({ x: Math.random() * W, y: init ? Math.random() * H : H + 8, r: Math.random() * 1.8 + .4, v: Math.random() * .45 + .12, a: Math.random() * .6 + .2, p: Math.random() * 6 });
  function sizeCanvas() {
    const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = r.width * dpr; cv.height = r.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = r.width; H = r.height;
    dots = Array.from({ length: Math.round(clamp(W / 18, 24, 70)) }, () => mk(true));
  }
  function frame(t) {
    rafOn = false;
    if (!heroVisible || document.hidden) return;
    ctx.clearRect(0, 0, W, H);
    for (const d of dots) {
      d.y -= d.v; d.x += Math.sin(t / 1400 + d.p) * .15;
      if (d.y < -8) Object.assign(d, mk(false));
      ctx.globalAlpha = d.a * (.6 + .4 * Math.sin(t / 700 + d.p));
      ctx.fillStyle = d.r > 1.6 ? '#7fe9ff' : '#ffffff';
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill();
    }
    if (!fine) { // sem mouse: balanço suave
      stage.style.setProperty('--rx', (Math.sin(t / 1800) * 9).toFixed(2) + 'deg');
      stage.style.setProperty('--ry', (Math.cos(t / 2300) * 5).toFixed(2) + 'deg');
    }
    loop();
  }
  function loop() { if (!rafOn && !reduce) { rafOn = true; requestAnimationFrame(frame); } }
  sizeCanvas();
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(sizeCanvas, 200); });
  document.addEventListener('visibilitychange', loop);
  loop();

  /* ---------- contagem animada ---------- */
  const fmt = (v, d) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      countIO.unobserve(en.target);
      const el = en.target, to = parseFloat(el.dataset.count), d = +(el.dataset.dec || 0), dur = 1500, s = performance.now();
      const step = n => {
        const k = Math.min(1, (n - s) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(to * e, d);
        if (k < 1) requestAnimationFrame(step); else el.textContent = fmt(to, d);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: .6 });
  if (!reduce) $$('[data-count]').forEach(el => { el.textContent = fmt(0, +(el.dataset.dec || 0)); countIO.observe(el); });

  /* ---------- contagem regressiva do sorteio ---------- */
  const target = new Date(CFG.SORTEIO || '2026-10-31T00:00:00-03:00').getTime();
  const cu = {}; $$('#count [data-u]').forEach(b => cu[b.dataset.u] = b);
  const p2 = n => String(n).padStart(2, '0');
  function tick() {
    let diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5); diff -= h * 36e5;
    const m = Math.floor(diff / 6e4); diff -= m * 6e4;
    const s = Math.floor(diff / 1e3);
    cu.d.textContent = p2(d); cu.h.textContent = p2(h); cu.m.textContent = p2(m); cu.s.textContent = p2(s);
    if (target - Date.now() <= 0) { $('.draw').innerHTML = 'Sorteio encerrado — acompanhe o resultado no <b>Instagram</b>.'; return; }
    setTimeout(tick, 1000);
  }
  tick();

  /* =========================================================
     PRODUTOS
     ========================================================= */
  const CATS = { smartphones: 'Smartphones', games: 'Games', capas: 'Capas', eletricos: 'Elétricos', promo: 'Promoção' };
  const P = [
    { id: 'iphone-13', cat: 'smartphones', title: 'iPhone 13', sub: 'Várias cores disponíveis' },
    { id: 'ps5-slim', cat: 'games', title: 'PS5 Slim Digital', sub: 'Memória 825GB' },
    { id: 'vipcoo', cat: 'eletricos', title: 'Vipcoo 950W', sub: 'Bicicleta elétrica' },
    { id: 'redmi-1', cat: 'smartphones', title: 'Linha Redmi', sub: 'Note 15 e Redmi 17' },
    { id: 'dualsense-azul', cat: 'games', title: 'DualSense Azul', sub: 'Controle PlayStation 5', price: 'R$ 430' },
    { id: 'capas-2', cat: 'capas', title: 'Capas para iPhone', sub: 'Cores vibrantes' },
    { id: 'xplore', cat: 'eletricos', title: 'Xplore 500W', sub: 'Bicicleta elétrica' },
    { id: 'iphone-12', cat: 'smartphones', title: 'iPhone 12', sub: 'Várias cores disponíveis' },
    { id: 'dualsense-branco', cat: 'games', title: 'DualSense Branco', sub: 'Controle PlayStation 5', price: 'R$ 410' },
    { id: 'capas-1', cat: 'capas', title: 'Capas para iPhone', sub: 'Tons neutros e rosé' },
    { id: 'triciclo', cat: 'eletricos', title: 'Triciclo elétrico', sub: 'Para o dia a dia' },
    { id: 'redmi-2', cat: 'smartphones', title: 'Redmi 15', sub: 'Lilás e outras cores' },
    { id: 'dualsense-preto', cat: 'games', title: 'DualSense Preto', sub: 'Controle PlayStation 5' },
    { id: 'iphone-11', cat: 'smartphones', title: 'iPhone 11', sub: 'Branco e preto' },
    { id: 'capas-3', cat: 'capas', title: 'Capas para iPhone', sub: 'Para todos os gostos' }
  ];
  const byId = id => P.find(p => p.id === id);

  /* promoções (cards flutuantes) — edite aqui: preço à vista, parcela 12x, specs */
  const PROMOS = [
    { id: 'redmi-17', cat: 'promo', title: 'Redmi 17', specs: '128GB · 4GB RAM', avista: '1.299,99', parcela: '123,47', cores: 'Preto, Gris Titânio e Roxo' },
    { id: 'galaxy-a07', cat: 'promo', title: 'Samsung Galaxy A07', specs: '128GB · 4GB RAM', avista: '899,00', parcela: '83,34' },
    { id: 'realme-c71', cat: 'promo', title: 'realme C71 NFC', specs: '128GB · 4GB RAM · NFC', avista: '1.099,00', parcela: '104,64', cores: 'Preto, Branco e Verde' },
    { id: 'redmi-note-17', cat: 'promo', title: 'Redmi Note 17', specs: '256GB · 8GB RAM', avista: '1.849,99', parcela: '175,99', cores: 'Preto, Prata e Azul' },
    { id: 'moto-g06', cat: 'promo', title: 'Moto G06', specs: '128GB · 4GB RAM', avista: '900,00', parcela: '85,62', cores: 'Preto, Verde e Roxo' }
  ].map(p => ({ ...p, sub: `${p.specs} · 12x de R$ ${p.parcela}`, price: `R$ ${p.avista} à vista` }));
  const sm = p => `assets/img/${p.id}-sm.webp`, lg = p => `assets/img/${p.id}-lg.webp`;

  /* ---------- catálogo ---------- */
  const grid = $('#grid'), seg = $('#seg'), thumb = $('.seg-thumb', seg);
  let filter = 'todos', list = P;

  function renderGrid() {
    list = filter === 'todos' ? P : P.filter(p => p.cat === filter);
    grid.innerHTML = list.map((p, i) => `
      <button class="card tilt" data-tilt style="--i:${i}" data-idx="${i}" aria-label="Ampliar ${p.title}">
        <img src="${sm(p)}" srcset="${sm(p)} 520w, ${lg(p)} 1000w" sizes="(min-width:960px) 25vw,(min-width:640px) 33vw,50vw"
             alt="${p.title} — ${p.sub}" width="520" height="693" loading="lazy" decoding="async">
        ${p.price ? `<span class="card-price">${p.price}</span>` : ''}
        <div class="card-cap"><small>${CATS[p.cat]}</small><h3>${p.title}</h3><p>${p.sub}</p></div>
      </button>`).join('');
  }
  function moveThumb() {
    const on = $('button.on', seg);
    if (!on) return;
    thumb.style.width = on.offsetWidth + 'px';
    thumb.style.transform = `translateX(${on.offsetLeft}px)`;
    if (seg.scrollWidth > seg.clientWidth) {
      seg.scrollTo({ left: on.offsetLeft - (seg.clientWidth - on.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
    }
  }
  function setFilter(f) {
    filter = f;
    $$('button', seg).forEach(b => { const on = b.dataset.f === f; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    renderGrid(); moveThumb();
  }
  seg.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setFilter(b.dataset.f); });
  seg.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const bs = $$('button', seg), i = bs.findIndex(b => b.classList.contains('on'));
    const n = bs[(i + (e.key === 'ArrowRight' ? 1 : bs.length - 1)) % bs.length];
    n.focus(); setFilter(n.dataset.f);
  });
  $$('[data-filter]').forEach(t => t.addEventListener('click', () => {
    setFilter(t.dataset.filter);
    $('#catalogo').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));
  addEventListener('resize', moveThumb);
  setFilter('todos');
  document.fonts && document.fonts.ready.then(moveThumb);

  /* ---------- ofertas: cards flutuantes ---------- */
  const promoGrid = $('#promoGrid');
  promoGrid.innerHTML = PROMOS.map((p, i) => `
    <article class="fcard" style="--fd:${(i * -1.7).toFixed(1)}s;--dur:${(6 + (i % 3) * 1.1).toFixed(1)}s">
      <button class="fcard-media tilt" data-tilt data-idx="${i}" aria-label="Ampliar oferta ${p.title}">
        <img src="${sm(p)}" srcset="${sm(p)} 520w, ${lg(p)} 960w" sizes="(min-width:1100px) 380px,(min-width:760px) 40vw,76vw"
             alt="Promoção ${p.title}: ${p.price}, ou 12x de R$ ${p.parcela}" width="520" height="650" loading="lazy" decoding="async">
      </button>
      <div class="fcard-cap">
        <div><b>${p.title}</b><small><span>R$ ${p.avista} à vista</span> <span>12x R$ ${p.parcela}</span></small></div>
        <a class="btn btn-wa btn-sm" data-wpp="online" href="#lojas"
           data-msg="Olá! Vi no site da Infoteccell e quero o ${p.title} por R$ ${p.avista} à vista ou 12x de R$ ${p.parcela}.">${waIcon}<span>Quero este</span></a>
      </div>
    </article>`).join('');
  promoGrid.addEventListener('click', e => {
    const c = e.target.closest('.fcard-media');
    if (c) { lbList = PROMOS; openLb(+c.dataset.idx); }
  });
  $$('.fcard', promoGrid).forEach(el => { el.dataset.reveal = ''; io.observe(el); });

  /* ---------- lightbox ---------- */
  const lb = $('#lb'), lbImg = $('#lbImg'), lbFig = $('.lb-fig', lb);
  let lbI = 0, lastFocus = null, lbList = P;
  function showLb(i, anim) {
    lbI = (i + lbList.length) % lbList.length;
    const p = lbList[lbI];
    lbImg.src = lg(p); lbImg.alt = `${p.title} — ${p.sub}`;
    $('#lbCat').textContent = CATS[p.cat];
    $('#lbTitle').textContent = p.title;
    $('#lbSub').textContent = p.sub;
    $('#lbPrice').textContent = p.price || '';
    $('#lbBtn').dataset.msg = `Olá! Vi no site da Infoteccell e tenho interesse em: ${p.title} (${p.sub})${p.price ? ', ' + p.price : ''}.`;
    if (anim) { lbFig.classList.remove('swap'); void lbFig.offsetWidth; lbFig.classList.add('swap'); }
  }
  function openLb(i) {
    lastFocus = document.activeElement;
    showLb(i); lb.hidden = false; document.body.classList.add('lb-open');
    $('.lb-x', lb).focus();
  }
  function closeLb() {
    lb.hidden = true; document.body.classList.remove('lb-open');
    lastFocus && lastFocus.focus && lastFocus.focus();
  }
  grid.addEventListener('click', e => { const c = e.target.closest('.card'); if (c) { lbList = list; openLb(+c.dataset.idx); } });
  lb.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeLb(); });
  $('#lbPrev').addEventListener('click', () => showLb(lbI - 1, true));
  $('#lbNext').addEventListener('click', () => showLb(lbI + 1, true));
  addEventListener('keydown', e => {
    if (lb.hidden || !sheet.hidden) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowLeft') showLb(lbI - 1, true);
    else if (e.key === 'ArrowRight') showLb(lbI + 1, true);
    else if (e.key === 'Tab') { // mantém o foco dentro do modal
      const f = $$('button,a[href]', $('.lb-card', lb)).filter(x => x.offsetParent !== null);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  let sx = null;
  lbFig.addEventListener('pointerdown', e => { sx = e.clientX; });
  lbFig.addEventListener('pointerup', e => {
    if (sx === null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 50) showLb(lbI + (dx < 0 ? 1 : -1), true);
  });

  /* ---------- coverflow 3D ---------- */
  const cf = $('#cf');
  const feat = ['iphone-13', 'ps5-slim', 'vipcoo', 'dualsense-azul', 'redmi-1', 'capas-2', 'xplore'].map(byId);
  const n = feat.length;
  cf.tabIndex = 0;
  cf.innerHTML = feat.map(p => `
    <figure class="cf-item" role="group" aria-label="${p.title}">
      <img src="${sm(p)}" srcset="${sm(p)} 520w, ${lg(p)} 1000w" sizes="300px" alt="${p.title} — ${p.sub}" width="520" height="693" loading="lazy" draggable="false">
    </figure>`).join('');
  const items = $$('.cf-item', cf), dotsEl = $('#cfDots');
  dotsEl.innerHTML = feat.map((p, i) => `<button aria-label="Ir para ${p.title}" data-i="${i}"></button>`).join('');
  const dots2 = $$('button', dotsEl);
  let pos = 0, cur = -1;

  function layout() {
    const c = ((Math.round(pos) % n) + n) % n;
    items.forEach((el, i) => {
      let o = i - pos; o = ((o + n / 2) % n + n) % n - n / 2;
      const a = Math.abs(o);
      el.style.setProperty('--o', o.toFixed(3)); el.style.setProperty('--a', Math.min(a, 3).toFixed(3));
      el.style.zIndex = String(100 - Math.round(a * 10));
      el.style.opacity = a > 2.6 ? '0' : '1';
      el.style.pointerEvents = a > 2.6 ? 'none' : 'auto';
      el.classList.toggle('active', i === c);
      el.setAttribute('aria-hidden', i === c ? 'false' : 'true');
    });
    if (c !== cur) {
      cur = c;
      const p = feat[c];
      $('#cfTitle').textContent = p.title; $('#cfSub').textContent = p.sub;
      $('#cfBtn').dataset.msg = `Olá! Vi no site da Infoteccell e tenho interesse em: ${p.title} (${p.sub}).`;
      dots2.forEach((d, i) => d.classList.toggle('on', i === c));
    }
  }
  function go(i) { pos = i; layout(); }
  const step = d => go(Math.round(pos) + d);
  $('#cfPrev').addEventListener('click', () => { step(-1); restartAuto(); });
  $('#cfNext').addEventListener('click', () => { step(1); restartAuto(); });
  dotsEl.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    let d = +b.dataset.i - cur; if (d > n / 2) d -= n; if (d < -n / 2) d += n;
    step(d); restartAuto();
  });
  cf.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { step(1); restartAuto(); }
    if (e.key === 'ArrowLeft') { step(-1); restartAuto(); }
  });

  let dragX = null, startPos = 0, moved = false, unit = 160;
  cf.addEventListener('pointerdown', e => {
    dragX = e.clientX; startPos = pos; moved = false;
    unit = (items[0].offsetWidth * .58) || 160;
  });
  addEventListener('pointermove', e => {
    if (dragX === null) return;
    const dx = e.clientX - dragX;
    if (!moved && Math.abs(dx) > 6) { moved = true; cf.classList.add('drag'); cf.setPointerCapture && cf.setPointerCapture(e.pointerId); }
    if (moved) { pos = startPos - dx / unit; layout(); }
  });
  addEventListener('pointerup', () => {
    if (dragX === null) return;
    dragX = null;
    if (moved) { cf.classList.remove('drag'); pos = Math.round(pos); layout(); restartAuto(); }
  });
  cf.addEventListener('click', e => {
    if (moved) { moved = false; return; }
    const el = e.target.closest('.cf-item');
    if (el && !el.classList.contains('active')) {
      let d = items.indexOf(el) - cur; if (d > n / 2) d -= n; if (d < -n / 2) d += n;
      step(d); restartAuto();
    }
  });

  let autoT = null, cfVisible = false;
  function restartAuto() {
    clearInterval(autoT);
    if (reduce || !cfVisible) return;
    autoT = setInterval(() => step(1), 3800);
  }
  new IntersectionObserver(([en]) => { cfVisible = en.isIntersecting; restartAuto(); }, { threshold: .35 }).observe(cf);
  cf.addEventListener('pointerenter', () => clearInterval(autoT));
  cf.addEventListener('pointerleave', restartAuto);
  layout();

  /* ---------- chat animado (comunidade) ---------- */
  const chat = $('#chat'), msgs = $$('[data-m]', chat), typing = $('#typing');
  let chatRun = 0;
  async function chatLoop(id) {
    while (id === chatRun) {
      msgs.forEach(m => m.classList.remove('show'));
      for (const m of msgs) {
        if (id !== chatRun) return;
        typing.classList.add('show'); await sleep(950);
        typing.classList.remove('show');
        m.classList.add('show'); await sleep(1250);
      }
      await sleep(3800);
    }
  }
  if (reduce) { msgs.forEach(m => m.classList.add('show')); }
  else {
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { chatRun++; chatLoop(chatRun); }
      else { chatRun++; typing.classList.remove('show'); }
    }, { threshold: .4 }).observe($('.phone'));
  }
})();
