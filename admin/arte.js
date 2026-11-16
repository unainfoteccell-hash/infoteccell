/* =========================================================
   INFOTECCELL — gerador do encarte (desenha no <canvas>)
   Formatos: feed 1080x1350 (4:5)  |  story 1080x1920 (9:16)
   ========================================================= */
(function (global) {
  'use strict';

  const FORMATS = {
    feed:  { w: 1080, h: 1350, T: 0,   E: 0,   label: 'Feed (4:5)' },
    story: { w: 1080, h: 1920, T: 220, E: 100, label: 'Story (9:16)' }
  };
  const F_MAIN = '"Montserrat","Segoe UI",Arial,sans-serif';
  const F_COND = '"Barlow Condensed","Arial Narrow",Arial,sans-serif';

  const ICONS = {
    memoria: 'Cartão de memória', ram: 'Chip / RAM', nfc: 'NFC', bateria: 'Bateria',
    carregamento: 'Carregamento rápido', velocidade: 'Velocidade', camera: 'Câmera',
    tela: 'Tela', g5: '5G', nenhum: 'Sem ícone'
  };

  /* ---------- números ---------- */
  function parseMoney(s) {
    if (typeof s === 'number') return s;
    s = String(s || '').replace(/[^\d.,]/g, '');
    if (!s) return NaN;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    return parseFloat(s);
  }
  function money(n) {
    n = Math.round(n * 100) / 100;
    const [i, c] = n.toFixed(2).split('.');
    const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return { int, cents: c, text: `${int},${c}` };
  }

  /* ---------- desenho ---------- */
  function rrPath(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function polyRound(c, pts, r) {
    const n = pts.length;
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i + n - 1) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
      const v1 = { x: p0.x - p1.x, y: p0.y - p1.y }, v2 = { x: p2.x - p1.x, y: p2.y - p1.y };
      const l1 = Math.hypot(v1.x, v1.y), l2 = Math.hypot(v2.x, v2.y);
      const rad = Math.min(r, l1 / 2, l2 / 2);
      const a = { x: p1.x + v1.x / l1 * rad, y: p1.y + v1.y / l1 * rad };
      const b = { x: p1.x + v2.x / l2 * rad, y: p1.y + v2.y / l2 * rad };
      if (i === 0) c.moveTo(a.x, a.y); else c.lineTo(a.x, a.y);
      c.quadraticCurveTo(p1.x, p1.y, b.x, b.y);
    }
    c.closePath();
  }
  function radial(c, x, y, r, color) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function setFont(c, weight, size, fam) { c.font = `${weight} ${Math.round(size)}px ${fam || F_MAIN}`; }
  function textW(c, t) { return c.measureText(t).width; }
  /* menor fonte (<= size) que cabe em maxW */
  function fitSize(c, text, weight, size, maxW, fam, min) {
    setFont(c, weight, size, fam);
    const w = textW(c, text);
    return w > maxW ? Math.max(min || 10, size * maxW / w) : size;
  }
  function spaced(c, text, x, y, sp, align) {
    let w = 0; const ws = [...text].map(ch => { const k = textW(c, ch); w += k + sp; return k; });
    w -= sp;
    let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    c.textAlign = 'left';
    [...text].forEach((ch, i) => { c.fillText(ch, cx, y); cx += ws[i] + sp; });
    return w;
  }

  /* ---------- ícones (caixa de ±28px) ---------- */
  function drawIcon(c, name, cx, cy, size) {
    c.save();
    c.translate(cx, cy); const s = size / 56; c.scale(s, s);
    c.strokeStyle = '#fff'; c.fillStyle = '#fff'; c.lineWidth = 4.5; c.lineCap = 'round'; c.lineJoin = 'round';
    const line = (x1, y1, x2, y2) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };
    switch (name) {
      case 'memoria':
        c.beginPath(); c.moveTo(-16, -24); c.lineTo(6, -24); c.lineTo(16, -14); c.lineTo(16, 24); c.lineTo(-16, 24); c.closePath(); c.stroke();
        line(-7, -17, -7, -9); line(0, -17, 0, -9); line(7, -17, 7, -9);
        line(-8, 4, 8, 4); line(-8, 13, 8, 13); break;
      case 'ram':
        rrPath(c, -14, -14, 28, 28, 5); c.stroke(); c.fillRect(-6, -6, 12, 12);
        [-8, 0, 8].forEach(p => { line(p, -14, p, -23); line(p, 14, p, 23); line(-14, p, -23, p); line(14, p, 23, p); }); break;
      case 'nfc':
        [9, 18, 27].forEach(r => { c.beginPath(); c.arc(-16, 0, r, -0.85, 0.85); c.stroke(); }); break;
      case 'bateria':
        rrPath(c, -12, -22, 24, 48, 5); c.stroke(); c.fillRect(-5, -28, 10, 5);
        for (let i = 0; i < 4; i++) c.fillRect(-7, -17 + i * 11, 14, 7); break;
      case 'carregamento':
        c.beginPath(); c.moveTo(6, -26); c.lineTo(-12, 3); c.lineTo(-1, 3); c.lineTo(-6, 26); c.lineTo(13, -6); c.lineTo(2, -6); c.closePath(); c.fill(); break;
      case 'velocidade':
        c.beginPath(); c.arc(0, 8, 26, Math.PI * 1.03, Math.PI * 1.97); c.stroke();
        line(0, 8, 11, -12); c.beginPath(); c.arc(0, 8, 4, 0, 6.3); c.fill();
        line(-26, 8, -20, 8); line(26, 8, 20, 8); line(0, -17, 0, -12); break;
      case 'camera':
        rrPath(c, -24, -14, 48, 36, 8); c.stroke(); c.beginPath(); c.arc(0, 4, 10, 0, 6.3); c.stroke(); c.fillRect(-9, -22, 18, 6); break;
      case 'tela':
        rrPath(c, -15, -26, 30, 52, 7); c.stroke(); line(-5, -19, 5, -19); c.beginPath(); c.arc(0, 19, 2.2, 0, 6.3); c.fill(); break;
      case 'g5':
        c.font = `800 40px ${F_MAIN}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('5G', 0, 2); break;
      default: break;
    }
    c.restore();
  }

  /* ---------- peças do layout ---------- */
  function drawBackground(c, W, H, L) {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0c47dc'); g.addColorStop(.5, '#0a3cc2'); g.addColorStop(1, '#062a8e');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    radial(c, 900, L.T + 100, 560, 'rgba(70,170,255,.55)');
    radial(c, 100, H * .78, 560, 'rgba(25,95,255,.55)');
    radial(c, 540, L.T + 720, 760, 'rgba(30,115,255,.28)');

    // "INFOTECCEL" vertical gigante
    c.save();
    c.beginPath(); c.rect(0, 0, 126, H); c.clip();
    c.translate(118, H + 6); c.rotate(-Math.PI / 2);
    setFont(c, 900, 170); const tw = textW(c, 'INFOTECCEL');
    setFont(c, 900, 170 * (H * 1.03 / tw));
    c.fillStyle = 'rgba(40,125,255,.42)'; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    c.fillText('INFOTECCEL', 0, 0);
    c.restore();

    // formas geométricas
    c.fillStyle = 'rgba(45,135,255,.34)';
    polyRound(c, [{ x: 935, y: L.T + 540 }, { x: 1100, y: L.T + 450 }, { x: 1100, y: L.T + 1190 + L.E }, { x: 995, y: L.T + 1190 + L.E }], 34); c.fill();
    c.fillStyle = 'rgba(30,112,245,.5)';
    polyRound(c, [{ x: -10, y: L.T + 1090 + L.E }, { x: 140, y: L.T + 996 + L.E }, { x: 140, y: L.T + 1350 + L.E }, { x: -10, y: L.T + 1370 + L.E }], 26); c.fill();
    c.strokeStyle = 'rgba(95,200,255,.6)'; c.lineWidth = 3;
    polyRound(c, [{ x: 905, y: L.T - 20 }, { x: 1100, y: L.T - 20 }, { x: 1100, y: L.T + 118 }, { x: 852, y: L.T + 118 }, { x: 852, y: L.T + 62 }], 38); c.stroke();
  }

  function drawLogo(c, A, W, y) {
    const iconH = 100, iconW = iconH * A.logoIcon.naturalWidth / A.logoIcon.naturalHeight;
    const wordW = 372, wordH = wordW * A.logoWord.naturalHeight / A.logoWord.naturalWidth;
    const gap = 18, total = iconW + gap + wordW, x0 = (W - total) / 2;
    c.drawImage(A.logoIcon, x0, y, iconW, iconH);
    c.drawImage(A.logoWord, x0 + iconW + gap, y + 8, wordW, wordH);
    c.fillStyle = 'rgba(255,255,255,.85)'; setFont(c, 600, 15); c.textBaseline = 'alphabetic';
    spaced(c, 'CELULARES E ACESSÓRIOS', x0 + iconW + gap + wordW / 2, y + 8 + wordH + 28, 6.2, 'center');
  }

  function drawMascot(c, A, L) {
    const w = 352, h = w * A.mascote.naturalHeight / A.mascote.naturalWidth;
    c.drawImage(A.mascote, 742, L.T + 70, w, h);
  }

  function drawCard(c, L, cardBottom) {
    const top = L.T + 225;
    const P = [{ x: 150, y: top }, { x: 790, y: top }, { x: 948, y: L.T + 412 }, { x: 1003, y: cardBottom }, { x: 112, y: cardBottom }];
    // "aba" azul atrás
    const tg = c.createLinearGradient(300, top - 50, 700, top + 20);
    tg.addColorStop(0, '#2a86ff'); tg.addColorStop(1, '#1257e8');
    c.fillStyle = tg;
    polyRound(c, [{ x: 292, y: top + 30 }, { x: 640, y: top - 50 }, { x: 706, y: top + 30 }], 44); c.fill();
    // profundidade
    c.save(); c.translate(-14, 10);
    polyRound(c, P, 58); c.fillStyle = '#1b78ff'; c.fill(); c.restore();
    // card branco
    const g = c.createLinearGradient(0, top, 0, cardBottom);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#e6efff');
    c.save();
    c.shadowColor = 'rgba(30,140,255,.9)'; c.shadowBlur = 30;
    polyRound(c, P, 58); c.fillStyle = g; c.fill();
    c.restore();
    polyRound(c, P, 58); c.lineWidth = 7; c.strokeStyle = '#2f98ff'; c.stroke();
    // tracinhos (brilho)
    c.strokeStyle = '#fff'; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(168, top - 36); c.lineTo(204, top - 12); c.stroke();
    c.beginPath(); c.moveTo(212, top - 78); c.lineTo(224, top - 30); c.stroke();
  }

  function drawChips(c, L, specs) {
    const n = specs.length; if (!n) return 0;
    const heights = specs.map(s => s.icone === 'nenhum' ? 108 : 152);
    const gap = 16, total = heights.reduce((a, b) => a + b, 0) + gap * (n - 1);
    let y = L.T + 440 - (n - 1) * 54; // mais itens => começa mais acima
    const right = 944;
    let maxW = 0;
    specs.forEach((s, i) => {
      const h = heights[i];
      setFont(c, 800, 44);
      const vSize = fitSize(c, (s.valor || '').toUpperCase(), 800, 46, 190, F_MAIN, 24);
      setFont(c, 700, 20);
      const lSize = fitSize(c, (s.rotulo || '').toUpperCase(), 700, 20, 190, F_MAIN, 12);
      setFont(c, 800, vSize); const vW = textW(c, (s.valor || '').toUpperCase());
      setFont(c, 700, lSize); const lW = textW(c, (s.rotulo || '').toUpperCase());
      const w = Math.max(158, Math.min(236, Math.max(vW, lW) + 44));
      const x = right - w;
      const g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, '#2183ff'); g.addColorStop(1, '#0b4fe0');
      c.save(); c.shadowColor = 'rgba(0,30,140,.5)'; c.shadowBlur = 20; c.shadowOffsetY = 9;
      rrPath(c, x, y, w, h, 32); c.fillStyle = g; c.fill(); c.restore();
      rrPath(c, x, y, w, h, 32); c.lineWidth = 3.5; c.strokeStyle = '#52c6ff'; c.stroke();
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      const hasIcon = s.icone !== 'nenhum';
      if (hasIcon) drawIcon(c, s.icone, x + w / 2, y + 40, 54);
      setFont(c, 800, vSize); c.fillText((s.valor || '').toUpperCase(), x + w / 2, y + (hasIcon ? 104 : 66));
      setFont(c, 700, lSize); c.fillText((s.rotulo || '').toUpperCase(), x + w / 2, y + (hasIcon ? 132 : 94));
      maxW = Math.max(maxW, w);
      y += h + gap;
    });
    return maxW;
  }

  function drawProduct(c, f, A, box, L) {
    if (!f.photo) {
      // área vazia: dica visual
      c.save(); c.setLineDash([14, 12]); c.strokeStyle = 'rgba(30,90,220,.35)'; c.lineWidth = 4;
      rrPath(c, box.x + 20, box.y + 20, box.w - 40, box.h - 20, 36); c.stroke(); c.restore();
      c.fillStyle = 'rgba(30,90,220,.45)'; setFont(c, 700, 34); c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('FOTO DO PRODUTO', box.x + box.w / 2, box.y + box.h / 2);
      return;
    }
    const img = f.photo, zoom = (f.zoom || 100) / 100;
    const sc = Math.min(box.w / img.width, box.h / img.height) * zoom;
    const dw = img.width * sc, dh = img.height * sc;
    const cx = box.x + box.w / 2 + (f.offX || 0), bottom = box.y + box.h + (f.offY || 0);
    if (f.sombra !== false) {
      c.save(); c.translate(cx, bottom + 4); c.scale(1, .1);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, dw * .5);
      g.addColorStop(0, 'rgba(8,30,100,.5)'); g.addColorStop(1, 'rgba(8,30,100,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, dw * .5, 0, 6.3); c.fill(); c.restore();
    }
    c.save(); c.shadowColor = 'rgba(10,40,120,.25)'; c.shadowBlur = 24; c.shadowOffsetY = 10;
    c.drawImage(img, cx - dw / 2, bottom - dh, dw, dh);
    c.restore();
  }

  function drawName(c, f, cx, y) { // y = linha de base
    const t1 = (f.nome1 || '').toUpperCase(), t2 = (f.nome2 || '').toUpperCase();
    if (!t1 && !t2 && !f.marcaLogo) return;
    const logo = f.marcaLogo; const logoH = 96;
    const logoW = logo ? logoH * logo.width / logo.height : 0;
    const maxW = 760, gapT = 22, gapL = 22;
    let size = 112;
    const total = s => {
      setFont(c, 900, s);
      return (logo ? logoW + gapL : 0) + textW(c, t1) + (t1 && t2 ? gapT : 0) + textW(c, t2);
    };
    let tw = total(size);
    if (tw > maxW) { size = size * maxW / tw; tw = total(size); }
    const lh = logo ? Math.min(logoH, size * .95) : 0, lw = logo ? lh * logo.width / logo.height : 0;
    let x = cx - tw / 2 + (logo ? (lw - logoW) / 2 : 0) * 0;
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    if (logo) { c.drawImage(logo, x, y - lh * .86, lw, lh); x += lw + gapL; }
    setFont(c, 900, size);
    c.fillStyle = '#0b0f1c'; c.fillText(t1, x, y); x += textW(c, t1) + (t1 && t2 ? gapT : 0);
    c.fillStyle = '#1b57f0'; c.fillText(t2, x, y);
  }

  function drawColors(c, f, cx, cy) {
    const cores = (f.cores || []).filter(k => k.nome);
    if (!cores.length) return;
    const lab = 'CORES DISPONÍVEIS:';
    let fs = 22; setFont(c, 700, fs);
    const items = cores.map(k => ({ ...k, w: textW(c, k.nome) }));
    const dot = 19;
    const measure = fs => {
      setFont(c, 700, fs);
      let w = textW(c, lab) + 26;
      items.forEach(k => { w += dot * 2 + 10 + textW(c, k.nome) + 32; });
      return w - 32;
    };
    let tw = measure(fs);
    while (tw > 780 && fs > 14) { fs -= 1; tw = measure(fs); }
    let x = cx - tw / 2;
    c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillStyle = '#0b1a45'; setFont(c, 800, fs);
    c.fillText(lab, x, cy); x += textW(c, lab) + 26;
    items.forEach(k => {
      const g = c.createRadialGradient(x + dot * .7, cy - dot * .4, 2, x + dot, cy, dot);
      g.addColorStop(0, lighten(k.hex, .45)); g.addColorStop(1, k.hex);
      c.beginPath(); c.arc(x + dot, cy, dot, 0, 6.3); c.fillStyle = g; c.fill();
      c.lineWidth = 1.5; c.strokeStyle = 'rgba(20,40,100,.25)'; c.stroke();
      x += dot * 2 + 10; setFont(c, 700, fs); c.fillStyle = '#0b1a45';
      c.fillText(k.nome, x, cy + 1); x += textW(c, k.nome) + 32;
    });
  }
  function lighten(hex, a) {
    const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex || '#888888') || [0, '88', '88', '88'];
    const [r, g, b] = [m[1], m[2], m[3]].map(v => parseInt(v, 16));
    const f = v => Math.round(v + (255 - v) * a);
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }

  function brindeList(f) {
    const b = f.brindes || {};
    if (!b.ativo) return [];
    const out = [];
    ['capinha', 'pelicula', 'fone'].forEach(k => { if ((b.itens || []).includes(k)) out.push({ tipo: k }); });
    (b.custom || []).forEach(t => { if (t && t.trim()) out.push({ tipo: 'custom', texto: t.trim() }); });
    return out.slice(0, 3);
  }

  function drawBrindes(c, A, list, y) {
    const x = 133, w = 857, h = 182;
    c.save(); c.shadowColor = 'rgba(20,120,255,.6)'; c.shadowBlur = 18;
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#0d44c4'); g.addColorStop(1, '#062a86');
    rrPath(c, x, y, w, h, 44); c.fillStyle = g; c.fill(); c.restore();
    rrPath(c, x, y, w, h, 44); c.lineWidth = 5; c.strokeStyle = '#2593ff'; c.stroke();
    c.drawImage(A.gift, x + 20, y + 40, 90, 108);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = '#fff';
    setFont(c, 800, 38, F_COND); c.fillText('E AINDA GANHA', x + 124, y + 80);
    c.fillStyle = '#22c8ff'; setFont(c, 800, 72, F_COND); c.fillText('BRINDES!', x + 124, y + 146);
    // caixas à direita
    let rx = 967; const gap = 12;
    for (let i = list.length - 1; i >= 0; i--) {
      const b = list[i]; let img = A[b.tipo], bw = 128, bh = 148;
      if (img) { bw = img.naturalWidth; bh = img.naturalHeight; }
      const bx = rx - bw, by = y + (h - bh) / 2;
      if (img) c.drawImage(img, bx, by, bw, bh);
      else customBox(c, A, bx, by, bw, bh, b.texto);
      rx = bx - gap;
    }
  }
  function customBox(c, A, x, y, w, h, texto) {
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#0f4fd0'); g.addColorStop(1, '#06267e');
    rrPath(c, x, y, w, h, 22); c.fillStyle = g; c.fill();
    c.lineWidth = 2.5; c.strokeStyle = '#2d8cff'; c.stroke();
    c.drawImage(A.gift, x + w / 2 - 33, y + 12, 66, 79);
    c.fillStyle = 'rgba(0,20,90,.5)'; rrPath(c, x + 3, y + h - 44, w - 6, 41, 18); c.fill();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const fs = fitSize(c, texto, 700, 22, w - 18, F_MAIN, 11);
    setFont(c, 700, fs); c.fillText(texto, x + w / 2, y + h - 23);
  }

  /* caixa "DIVIDIMOS EM ATÉ 18x" (quando não há valor de parcela) */
  function drawParcelasBox(c, x, y, w, h, n) {
    c.save(); c.shadowColor = 'rgba(20,130,255,.7)'; c.shadowBlur = 22;
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#0d47cb'); g.addColorStop(1, '#052a88');
    rrPath(c, x, y, w, h, 46); c.fillStyle = g; c.fill(); c.restore();
    rrPath(c, x, y, w, h, 46); c.lineWidth = 6; c.strokeStyle = '#2b9cff'; c.stroke();
    c.fillStyle = '#fff'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    setFont(c, 800, 27); spaced(c, 'DIVIDIMOS EM ATÉ:', x + 46, y + 56, 1.5, 'left');
    const s = fitSize(c, n + 'x', 800, 104, w - 90, F_MAIN, 40);
    c.fillStyle = '#1fd0ff'; setFont(c, 800, s); c.fillText(n + 'x', x + 44, y + h - 34);
  }
  function drawPriceBox(c, x, y, w, h, label, m, color) {
    c.save(); c.shadowColor = 'rgba(20,130,255,.7)'; c.shadowBlur = 22;
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#0d47cb'); g.addColorStop(1, '#052a88');
    rrPath(c, x, y, w, h, 46); c.fillStyle = g; c.fill(); c.restore();
    rrPath(c, x, y, w, h, 46); c.lineWidth = 6; c.strokeStyle = '#2b9cff'; c.stroke();
    c.fillStyle = '#fff'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    setFont(c, 800, 27); spaced(c, label, x + 46, y + 56, 1.5, 'left');
    // preço "R$" + inteiro + centavos
    const avail = w - 86;
    const widths = s => {
      setFont(c, 800, s * .42); const a = textW(c, 'R$');
      setFont(c, 800, s); const b = textW(c, m.int);
      setFont(c, 800, s * .44); const d = textW(c, ',' + m.cents);
      return a + 6 + b + 4 + d;
    };
    let s = 124; const tw = widths(s); if (tw > avail) s = s * avail / tw;
    const base = y + h - 34; let px = x + 40;
    c.fillStyle = '#fff'; setFont(c, 800, s * .42); c.fillText('R$', px, base - s * .05); px += textW(c, 'R$') + 6;
    c.fillStyle = color; setFont(c, 800, s); c.fillText(m.int, px, base); px += textW(c, m.int) + 4;
    setFont(c, 800, s * .44); c.fillText(',' + m.cents, px, base - s * .5);
  }

  /* ---------- função principal ---------- */
  function drawArte(canvas, f, A, key) {
    const L = FORMATS[key] || FORMATS.feed;
    const W = L.w, H = L.h;
    canvas.width = W; canvas.height = H;
    const c = canvas.getContext('2d');
    c.textBaseline = 'alphabetic';

    const brindes = brindeList(f);
    const hasBr = brindes.length > 0;
    const cardBottom = L.T + 1150 + L.E;
    const stripTop = L.T + 968 + L.E;
    const cores = (f.cores || []).filter(k => k.nome);
    const colorsH = cores.length ? 54 : 0, subH = f.subtitulo ? 44 : 0, nameH = 112;
    const endY = hasBr ? stripTop - 16 : cardBottom - 38;
    const stackTop = endY - (colorsH + subH + nameH);
    const nameBase = stackTop + 94;

    drawBackground(c, W, H, L);
    drawMascot(c, A, L);
    drawCard(c, L, cardBottom);
    drawLogo(c, A, W, L.T + 28);

    const specs = (f.specs || []).filter(s => s.valor || s.rotulo).slice(0, 3);
    const chipsW = drawChips(c, L, specs);
    const box = { x: specs.length ? 168 : 190, y: L.T + 252, w: specs.length ? 586 : 720, h: Math.max(160, stackTop - 6 - (L.T + 252)) };
    drawProduct(c, f, A, box, L);

    drawName(c, f, 576, nameBase);
    let y = nameBase;
    if (f.subtitulo) {
      y += 42; c.fillStyle = '#1b3fd0'; setFont(c, 700, 26); c.textBaseline = 'alphabetic';
      spaced(c, f.subtitulo.toUpperCase(), 576, y, 9, 'center');
    }
    if (cores.length) drawColors(c, f, 576, y + 40);
    if (hasBr) drawBrindes(c, A, brindes, stripTop);

    const pTop = cardBottom;
    const avista = parseMoney(f.avista), parc = parseMoney(f.parcela);
    const n = f.parcelas || 12;
    drawPriceBox(c, 104, pTop, 488, 182, 'À VISTA:', isNaN(avista) ? { int: '0', cents: '00' } : money(avista), '#ffffff');
    if (isNaN(parc) || !String(f.parcela || '').trim()) drawParcelasBox(c, 600, pTop, 416, 182, n);
    else drawPriceBox(c, 600, pTop, 416, 182, `OU ${n}x DE:`, money(parc), '#1fd0ff');
    return canvas;
  }

  /* ---------- recursos ---------- */
  const ASSET_FILES = {
    logoIcon: 'assets/img/logo-icon.webp', logoWord: 'assets/img/logo-wordmark.webp', mascote: 'assets/img/mascote.webp',
    gift: 'assets/studio/gift.png', capinha: 'assets/studio/brinde-capinha.png',
    pelicula: 'assets/studio/brinde-pelicula.png', fone: 'assets/studio/brinde-fone.png'
  };
  function loadImage(src) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Falha ao carregar ' + src)); i.src = src; });
  }
  async function loadAssets(base) {
    base = base || '';
    const out = {};
    await Promise.all(Object.entries(ASSET_FILES).map(async ([k, v]) => { out[k] = await loadImage(base + v); }));
    return out;
  }
  async function loadFonts() {
    if (!document.fonts || !document.fonts.load) return;
    try {
      await Promise.all([
        document.fonts.load('900 100px "Montserrat"'), document.fonts.load('800 60px "Montserrat"'),
        document.fonts.load('700 30px "Montserrat"'), document.fonts.load('600 20px "Montserrat"'),
        document.fonts.load('800 60px "Barlow Condensed"')
      ]);
    } catch (e) { /* usa fonte reserva */ }
  }

  global.Arte = { FORMATS, ICONS, parseMoney, money, drawArte, loadAssets, loadFonts, loadImage, brindeList };
})(window);
