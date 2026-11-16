/* =========================================================
   Estúdio de Promoções — interface
   ========================================================= */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const CFG = window.INFOTEC || {};
  const Arte = window.Arte;

  if (location.protocol === 'file:') $('#fileWarn').hidden = false;

  /* ---------- utilidades ---------- */
  let toastT;
  function toast(msg, err) {
    const t = $('#toast'); t.textContent = msg; t.classList.toggle('err', !!err); t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), err ? 7000 : 3600);
  }
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const slug = s => String(s || 'promo').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'promo';
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = o => JSON.parse(JSON.stringify(o));
  const canvasToBlob = (c, type, q) => new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('Não foi possível gerar a imagem')), type || 'image/png', q));
  async function blobToImg(blob) {
    const im = new Image(); im.src = URL.createObjectURL(blob);
    await im.decode(); return im;
  }
  function saveBlob(blob, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  const blobToB64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
  const strToB64 = s => btoa(unescape(encodeURIComponent(s)));
  const b64ToStr = b => decodeURIComponent(escape(atob(b.replace(/\s/g, ''))));

  /* ---------- estado ---------- */
  const defaults = () => ({
    id: null, siteId: null, criado: null,
    nome1: 'REDMI', nome2: '17', subtitulo: '',
    specs: [{ valor: '128GB', rotulo: 'DE MEMÓRIA', icone: 'memoria' }, { valor: '4GB', rotulo: 'DE RAM', icone: 'ram' }],
    cores: [{ nome: 'Preto', hex: '#111111' }, { nome: 'Gris Titânio', hex: '#9a9a9a' }, { nome: 'Roxo', hex: '#7c3aed' }],
    brindes: { ativo: true, itens: ['capinha', 'pelicula', 'fone'], custom: [] },
    avista: '1299,99', parcelas: 12, parcela: '123,47', taxa: '',
    resumo: '128GB · 4GB RAM', resumoManual: false, moldura: false,
    zoom: 100, offX: 0, offY: 0, sombra: true
  });
  let S = defaults();
  const P = { orig: null, cut: null, img: null, work: null, logo: null, logoImg: null };
  let fmt = 'feed', assets = null;

  /* ---------- IndexedDB ---------- */
  let dbp;
  const db = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('infoteccell-studio', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('promos', { keyPath: 'id' });
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const tx = async (mode, fn) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('promos', mode); const q = fn(t.objectStore('promos')); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }); };
  const dbPut = rec => tx('readwrite', s => s.put(rec));
  const dbAll = () => tx('readonly', s => s.getAll());
  const dbDel = id => tx('readwrite', s => s.delete(id));

  /* ---------- montar formulário a partir do estado ---------- */
  const PARC = Array.from({ length: 18 }, (_, i) => i + 1);
  $('#parcelas').innerHTML = PARC.map(n => `<option value="${n}">${n}x</option>`).join('');
  const COMUNS = [['Preto', '#111111'], ['Branco', '#f2f2f2'], ['Prata', '#c2c6cc'], ['Cinza', '#7b7f86'], ['Grafite', '#3a3d42'], ['Azul', '#2a62d8'],
    ['Verde', '#4f8a6a'], ['Roxo', '#7c4fd0'], ['Vermelho', '#d11f2a'], ['Dourado', '#d4af37'], ['Rosa', '#f39ab8'], ['Titânio', '#9a9a9a']];
  $('#coresRapidas').innerHTML = COMUNS.map(([n, h], i) => `<button type="button" class="chip" data-i="${i}"><i style="background:${h}"></i>${n}</button>`).join('');

  function renderSpecs() {
    $('#specs').innerHTML = S.specs.map((s, i) => `
      <div class="row spec" data-i="${i}">
        <select data-k="icone" aria-label="Ícone">${Object.entries(Arte.ICONS).map(([k, v]) => `<option value="${k}" ${k === s.icone ? 'selected' : ''}>${v}</option>`).join('')}</select>
        <button class="x" type="button" data-del aria-label="Remover">×</button>
        <input data-k="valor" placeholder="128GB" value="${esc(s.valor)}" maxlength="14" aria-label="Valor">
        <input data-k="rotulo" placeholder="DE MEMÓRIA" value="${esc(s.rotulo)}" maxlength="24" aria-label="Legenda">
      </div>`).join('');
    $('#addSpec').hidden = S.specs.length >= 3;
  }
  function renderCores() {
    $('#cores').innerHTML = S.cores.map((k, i) => `
      <div class="row cor" data-i="${i}">
        <input type="color" data-k="hex" value="${esc(k.hex)}" aria-label="Cor">
        <input data-k="nome" placeholder="Preto" value="${esc(k.nome)}" maxlength="16" aria-label="Nome da cor">
        <button class="x" type="button" data-del aria-label="Remover">×</button>
      </div>`).join('');
    $$('#coresRapidas .chip').forEach(b => b.hidden = S.cores.length >= 5);
  }
  function syncForm() {
    ['nome1', 'nome2', 'subtitulo', 'avista', 'parcela', 'taxa', 'resumo'].forEach(k => { $('#' + k).value = S[k] || ''; });
    $('#parcelas').value = S.parcelas;
    $('#zoom').value = S.zoom; $('#zoomV').textContent = S.zoom + '%';
    $('#offX').value = S.offX; $('#offY').value = S.offY; $('#sombra').checked = S.sombra !== false;
    const b = S.brindes;
    $('#brAtivo').checked = b.ativo; $('#brBox').hidden = !b.ativo;
    $('#brCapinha').checked = b.itens.includes('capinha'); $('#brPelicula').checked = b.itens.includes('pelicula'); $('#brFone').checked = b.itens.includes('fone');
    $('#brCustom').value = (b.custom || []).join(', ');
    renderSpecs(); renderCores(); updateHint(); updatePhotoUI(); updateLogoUI();
  }

  /* ---------- preço ---------- */
  function updateHint() {
    const a = Arte.parseMoney(S.avista), p = Arte.parseMoney(S.parcela), n = S.parcelas;
    const el = $('#hintParc');
    if (isNaN(a) || isNaN(p)) { el.textContent = ''; return; }
    const tot = p * n, jur = (tot / a - 1) * 100;
    el.textContent = `${n}x de R$ ${Arte.money(p).text} = R$ ${Arte.money(tot).text} no total (${jur >= 0 ? '+' : ''}${jur.toFixed(1).replace('.', ',')}% sobre o à vista).`;
  }
  function autoParcela() {
    const a = Arte.parseMoney(S.avista), t = Arte.parseMoney(S.taxa);
    if (isNaN(a) || isNaN(t) || !S.taxa) return;
    S.parcela = Arte.money(a * (1 + t / 100) / S.parcelas).text; $('#parcela').value = S.parcela;
  }
  function autoResumo() {
    if (S.resumoManual) return;
    S.resumo = S.specs.filter(s => (s.valor || '').trim()).map(s => { const l = (s.rotulo || '').trim().replace(/^de\s+/i, ''); return (s.valor.trim() + (l ? ' ' + (/^ram$/i.test(l) || /^nfc$/i.test(l) ? l.toUpperCase() : l.toLowerCase()) : '')); }).join(' · ');
    $('#resumo').value = S.resumo;
  }

  /* ---------- entradas simples ---------- */
  const redraw = debounce(() => { if (assets) Arte.drawArte($('#preview'), renderForm(), assets, fmt); }, 35);
  const renderForm = () => ({ ...S, photo: P.img, marcaLogo: P.logoImg });
  ['nome1', 'nome2', 'subtitulo', 'avista', 'parcela', 'taxa', 'resumo'].forEach(k => {
    $('#' + k).addEventListener('input', e => {
      S[k] = e.target.value;
      if (k === 'resumo') S.resumoManual = true;
      if (k === 'parcela') { S.taxa = ''; $('#taxa').value = ''; }
      if (k === 'avista' || k === 'taxa') autoParcela();
      updateHint(); redraw();
    });
  });
  $('#parcelas').addEventListener('change', e => { S.parcelas = +e.target.value; autoParcela(); updateHint(); redraw(); });
  ['zoom', 'offX', 'offY'].forEach(k => $('#' + k).addEventListener('input', e => { S[k] = +e.target.value; if (k === 'zoom') $('#zoomV').textContent = S.zoom + '%'; redraw(); }));
  $('#sombra').addEventListener('change', e => { S.sombra = e.target.checked; redraw(); });

  function readBrindes() {
    const itens = [];
    if ($('#brCapinha').checked) itens.push('capinha'); if ($('#brPelicula').checked) itens.push('pelicula'); if ($('#brFone').checked) itens.push('fone');
    S.brindes = { ativo: $('#brAtivo').checked, itens, custom: $('#brCustom').value.split(',').map(t => t.trim()).filter(Boolean) };
    $('#brBox').hidden = !S.brindes.ativo; redraw();
  }
  ['brAtivo', 'brCapinha', 'brPelicula', 'brFone'].forEach(id => $('#' + id).addEventListener('change', readBrindes));
  $('#brCustom').addEventListener('input', readBrindes);

  /* specs */
  $('#specs').addEventListener('input', e => {
    const row = e.target.closest('.row'); if (!row) return;
    S.specs[+row.dataset.i][e.target.dataset.k] = e.target.value; autoResumo(); redraw();
  });
  $('#specs').addEventListener('click', e => {
    if (!e.target.closest('[data-del]')) return;
    S.specs.splice(+e.target.closest('.row').dataset.i, 1); renderSpecs(); autoResumo(); redraw();
  });
  $('#addSpec').addEventListener('click', () => { if (S.specs.length < 3) { S.specs.push({ valor: '', rotulo: '', icone: 'ram' }); renderSpecs(); redraw(); } });
  /* cores */
  $('#cores').addEventListener('input', e => { const row = e.target.closest('.row'); if (row) { S.cores[+row.dataset.i][e.target.dataset.k] = e.target.value; redraw(); } });
  $('#cores').addEventListener('click', e => { if (e.target.closest('[data-del]')) { S.cores.splice(+e.target.closest('.row').dataset.i, 1); renderCores(); redraw(); } });
  $('#coresRapidas').addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b || S.cores.length >= 5) return;
    const [nome, hex] = COMUNS[+b.dataset.i]; S.cores.push({ nome, hex }); renderCores(); redraw();
  });

  /* ---------- logo da marca ---------- */
  function updateLogoUI() {
    const t = $('#logoThumb'); t.hidden = !P.logoImg; if (P.logoImg) t.src = P.logoImg.src; $('#logoClear').hidden = !P.logoImg;
  }
  $('#marcaLogo').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try { P.logo = f; P.logoImg = await blobToImg(f); updateLogoUI(); redraw(); } catch (err) { toast('Não consegui abrir esse logo.', true); }
    e.target.value = '';
  });
  $('#logoClear').addEventListener('click', () => { P.logo = null; P.logoImg = null; updateLogoUI(); redraw(); });

  /* =========================================================
     FOTO DO PRODUTO + REMOÇÃO DE FUNDO
     ========================================================= */
  const MAXW = 1600;
  function updatePhotoUI() {
    const has = !!P.img;
    $('#drop').classList.toggle('has', has);
    $('#btnAuto').disabled = !P.work; $('#btnLiso').disabled = !P.work; $('#btnOrig').disabled = !P.work;
    const inn = $('#drop .drop-in');
    if (has) {
      inn.innerHTML = `<img id="fotoThumb" alt=""><b>Foto anexada ✔</b><small>Toque para trocar a foto</small>`;
      $('#fotoThumb').src = P.img.src;
    } else {
      inn.innerHTML = `<div class="drop-ico">📷</div><b>Toque para anexar a foto</b><small>ou arraste aqui · JPG, PNG ou WebP</small>`;
    }
  }
  function status(msg, mode, pct) {
    const box = $('#bgStatus'); box.hidden = !msg; $('#bgMsg').textContent = msg || '';
    const bar = $('#bgBar').parentElement; bar.classList.toggle('ind', mode === 'ind'); $('#bgBar').style.width = mode === 'pct' ? Math.round(pct) + '%' : (mode === 'done' ? '100%' : '');
  }
  function workCanvas(img) {
    const sc = Math.min(1, MAXW / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * sc); c.height = Math.round(img.naturalHeight * sc);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return c;
  }
  function hasAlpha(img) {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.drawImage(img, 0, 0, 64, 64);
    const d = x.getImageData(0, 0, 64, 64).data; for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return true; return false;
  }
  function trim(canvas) {
    const w = canvas.width, h = canvas.height, d = canvas.getContext('2d').getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 12) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return canvas;
    const out = document.createElement('canvas'); out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
    out.getContext('2d').drawImage(canvas, x0, y0, out.width, out.height, 0, 0, out.width, out.height); return out;
  }
  /* remove respingos soltos (pedaços de parede/chão que a IA deixa): mantém só as partes grandes do produto */
  function cleanSpecks(canvas) {
    const w = canvas.width, h = canvas.height, cx = canvas.getContext('2d'), im = cx.getImageData(0, 0, w, h), d = im.data, N = w * h;
    const lab = new Int32Array(N), st = new Int32Array(N), areas = [0]; let nl = 0;
    for (let s = 0; s < N; s++) {
      if (lab[s] || d[s * 4 + 3] <= 24) continue;
      nl++; let sp = 0, area = 0; st[sp++] = s; lab[s] = nl;
      while (sp) {
        const i = st[--sp]; area++; const px = i % w;
        let k;
        if (px > 0) { k = i - 1; if (!lab[k] && d[k * 4 + 3] > 24) { lab[k] = nl; st[sp++] = k; } }
        if (px < w - 1) { k = i + 1; if (!lab[k] && d[k * 4 + 3] > 24) { lab[k] = nl; st[sp++] = k; } }
        if (i >= w) { k = i - w; if (!lab[k] && d[k * 4 + 3] > 24) { lab[k] = nl; st[sp++] = k; } }
        if (i < N - w) { k = i + w; if (!lab[k] && d[k * 4 + 3] > 24) { lab[k] = nl; st[sp++] = k; } }
      }
      areas[nl] = area;
    }
    if (!nl) return canvas;
    const max = Math.max(...areas);
    const m1 = new Uint8Array(N);
    for (let i = 0; i < N; i++) if (lab[i] && areas[lab[i]] >= max * 0.012) m1[i] = 1;
    // dilata 3px para preservar a borda suave do produto
    const R = 3, m2 = new Uint8Array(N), m3 = new Uint8Array(N);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let v = 0; for (let k = -R; k <= R && !v; k++) { const xx = x + k; if (xx >= 0 && xx < w && m1[y * w + xx]) v = 1; } m2[y * w + x] = v; }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let v = 0; for (let k = -R; k <= R && !v; k++) { const yy = y + k; if (yy >= 0 && yy < h && m2[yy * w + x]) v = 1; } m3[y * w + x] = v; }
    for (let i = 0; i < N; i++) if (!m3[i]) d[i * 4 + 3] = 0;
    cx.putImageData(im, 0, 0); return canvas;
  }
  async function setCutout(canvas) {
    const t = trim(canvas); P.cut = await canvasToBlob(t, 'image/png'); P.img = await blobToImg(P.cut); S.moldura = false; updatePhotoUI(); redraw();
  }
  async function handleFoto(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast('Escolha um arquivo de imagem.', true); return; }
    try {
      P.orig = file; P.cut = null;
      const img = await blobToImg(file);
      P.work = workCanvas(img);
      if (/png|webp|gif/.test(file.type) && hasAlpha(img)) { await setCutout(P.work); status('A imagem já tem fundo transparente ✔', 'done'); return; }
      P.img = await blobToImg(await canvasToBlob(P.work, 'image/jpeg', .92)); updatePhotoUI(); redraw();
      if ($('#autoBg').checked) autoRemove(); else status('Foto anexada. Toque em “Remover fundo” para recortar o produto.', 'done');
    } catch (e) { toast('Não consegui abrir essa imagem.', true); }
  }
  $('#foto').addEventListener('change', e => { handleFoto(e.target.files[0]); e.target.value = ''; });
  const drop = $('#drop');
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => handleFoto(e.dataTransfer.files[0]));

  let bgLib = null, busy = false;
  async function autoRemove() {
    if (!P.work || busy) return;
    busy = true; $('#btnAuto').disabled = true;
    try {
      status('Carregando a ferramenta de recorte…', 'ind');
      bgLib = bgLib || import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm');
      const lib = await bgLib;
      const input = await canvasToBlob(P.work, 'image/png');
      let fetched = 0;
      const out = await lib.removeBackground(input, {
        model: $('#bgFast').checked ? 'isnet_quint8' : 'isnet_fp16', output: { format: 'image/png' },
        progress: (key, cur, tot) => {
          if (String(key).startsWith('fetch') && tot) { fetched = cur / tot; status(`Baixando o modelo de recorte… ${Math.round(fetched * 100)}% (só na 1ª vez neste aparelho)`, 'pct', fetched * 100); }
          else if (String(key).startsWith('compute')) status('Recortando o produto… (pode levar alguns segundos)', 'ind');
        }
      });
      const im = await blobToImg(out), c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
      c.getContext('2d').drawImage(im, 0, 0); await setCutout(cleanSpecks(c));
      status('Fundo removido ✔ — se ficou algo estranho, ajuste o tamanho/posição ou tente “Fundo liso”.', 'done');
    } catch (e) {
      console.error(e); bgLib = null;
      status('Não consegui recortar automaticamente (sem internet?). Tente “Fundo liso” ou anexe um PNG já recortado.', 'done');
      toast('Falha na remoção automática do fundo.', true);
    } finally { busy = false; $('#btnAuto').disabled = !P.work; }
  }
  $('#btnAuto').addEventListener('click', autoRemove);

  function flatRemove(src, tol) {
    const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    const x = c.getContext('2d'); x.drawImage(src, 0, 0);
    const w = c.width, h = c.height, im = x.getImageData(0, 0, w, h), d = im.data;
    // cor do fundo = média dos cantos
    let r = 0, g = 0, b = 0, n = 0;
    [[0, 0], [w - 5, 0], [0, h - 5], [w - 5, h - 5]].forEach(([sx, sy]) => { for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) { const k = ((sy + j) * w + sx + i) * 4; r += d[k]; g += d[k + 1]; b += d[k + 2]; n++; } });
    r /= n; g /= n; b /= n;
    const dist = k => Math.hypot(d[k] - r, d[k + 1] - g, d[k + 2] - b);
    const seen = new Uint8Array(w * h), st = [];
    const push = (px, py) => { if (px < 0 || py < 0 || px >= w || py >= h) return; const i = py * w + px; if (seen[i]) return; if (dist(i * 4) <= tol) { seen[i] = 1; st.push(i); } };
    for (let i = 0; i < w; i++) { push(i, 0); push(i, h - 1); } for (let j = 0; j < h; j++) { push(0, j); push(w - 1, j); }
    while (st.length) { const i = st.pop(), px = i % w, py = (i / w) | 0; push(px + 1, py); push(px - 1, py); push(px, py + 1); push(px, py - 1); }
    for (let i = 0; i < w * h; i++) if (seen[i]) d[i * 4 + 3] = 0;
    // suaviza a borda
    for (let py = 1; py < h - 1; py++) for (let px = 1; px < w - 1; px++) {
      const i = py * w + px; if (seen[i]) continue;
      if (seen[i - 1] || seen[i + 1] || seen[i - w] || seen[i + w]) { const dd = dist(i * 4); d[i * 4 + 3] = Math.round(255 * Math.min(1, Math.max(.15, (dd - tol) / (tol * .9)))); }
    }
    x.putImageData(im, 0, 0); return c;
  }
  $('#btnLiso').addEventListener('click', async () => {
    if (!P.work) return;
    status('Removendo fundo liso…', 'ind');
    await new Promise(r => setTimeout(r, 30));
    try { await setCutout(flatRemove(P.work, +$('#tol').value)); status('Fundo liso removido ✔ — ajuste a “Tolerância” e toque de novo se precisar.', 'done'); }
    catch (e) { toast('Não consegui remover o fundo.', true); }
  });
  $('#btnOrig').addEventListener('click', async () => {
    if (!P.work) return; P.cut = null; P.img = await blobToImg(await canvasToBlob(P.work, 'image/jpeg', .92)); S.moldura = true; updatePhotoUI(); redraw(); status('Usando a foto original em moldura (sem recorte).', 'done');
  });

  /* =========================================================
     PRÉVIA, DOWNLOAD, COMPARTILHAR
     ========================================================= */
  const stage = $('#stage');
  $('#fmtSeg').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    fmt = b.dataset.f; $$('#fmtSeg button').forEach(x => x.classList.toggle('on', x === b));
    stage.classList.toggle('story', fmt === 'story'); $('#dlCurName').textContent = fmt === 'story' ? 'Story' : 'Feed'; redraw();
  });
  const fileName = key => `${slug((S.nome1 || '') + ' ' + (S.nome2 || ''))}-${key}.png`;
  async function makeCanvas(key, form) { const c = document.createElement('canvas'); Arte.drawArte(c, form || renderForm(), assets, key); return c; }
  async function download(key) { saveBlob(await canvasToBlob(await makeCanvas(key)), fileName(key)); }
  $('#dlCur').addEventListener('click', () => download(fmt).then(() => toast('Arte baixada ✔')).catch(e => toast(e.message, true)));
  $('#dlFeed').addEventListener('click', () => download('feed'));
  $('#dlStory').addEventListener('click', () => download('story'));
  $('#dlBoth').addEventListener('click', async () => { await download('feed'); setTimeout(() => download('story'), 600); });

  function caption() {
    const a = Arte.parseMoney(S.avista), p = Arte.parseMoney(S.parcela);
    const L = [`🔥 ${(S.nome1 + ' ' + S.nome2).trim()}${S.subtitulo ? ' — ' + S.subtitulo : ''}`];
    if (S.resumo) L.push(`📱 ${S.resumo}`);
    if (!isNaN(a)) L.push(`💰 R$ ${Arte.money(a).text} à vista` + (!isNaN(p) ? ` ou ${S.parcelas}x de R$ ${Arte.money(p).text}` : ` — dividimos em até ${S.parcelas}x`));
    const br = Arte.brindeList(S).map(b => b.tipo === 'custom' ? b.texto : ({ capinha: 'capinha', pelicula: 'película', fone: 'fone de ouvido' })[b.tipo]);
    if (br.length) L.push(`🎁 E ainda ganha: ${br.join(', ')}!`);
    const o = CFG.VENDAS_ONLINE;
    if (o) L.push(`📲 Chame no WhatsApp: (${o.ddd}) ${o.numero.slice(0, -4)}-${o.numero.slice(-4)}`);
    (CFG.LOJAS || []).forEach(l => L.push(`📍 ${l.local}: ${l.endereco}`));
    L.push('', '#infoteccell #celulares #promoção #tecnologia');
    return L.join('\n');
  }
  $('#capBtn') && $('#capBtn').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(caption()); toast('Legenda copiada ✔ — é só colar no Instagram'); } catch (e) { toast('Não consegui copiar.', true); }
  });
  const canShareFiles = (() => { try { return !!(navigator.canShare && navigator.canShare({ files: [new File([''], 'a.png', { type: 'image/png' })] })); } catch (e) { return false; } })();
  $('#shareBtn').hidden = !canShareFiles; $('#copyBtn').hidden = !(window.ClipboardItem && navigator.clipboard && navigator.clipboard.write);
  $('#shareBtn').addEventListener('click', async () => {
    try {
      const blob = await canvasToBlob(await makeCanvas(fmt)); const file = new File([blob], fileName(fmt), { type: 'image/png' });
      await navigator.share({ files: [file], title: `${S.nome1} ${S.nome2}`.trim(), text: caption() });
    } catch (e) { if (e.name !== 'AbortError') toast('Não foi possível abrir o compartilhamento. Use “Baixar”.', true); }
  });
  $('#copyBtn').addEventListener('click', async () => {
    try { const blob = await canvasToBlob(await makeCanvas(fmt)); await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); toast('Imagem copiada ✔'); }
    catch (e) { toast('Não consegui copiar a imagem.', true); }
  });

  /* =========================================================
     SALVAR / LISTAR
     ========================================================= */
  const title = o => `${o.nome1 || ''} ${o.nome2 || ''}`.trim() || 'Promoção';
  async function thumbBlob(form) {
    const c = await makeCanvas('feed', form), t = document.createElement('canvas'); t.width = 320; t.height = 400;
    t.getContext('2d').drawImage(c, 0, 0, 320, 400); return canvasToBlob(t, 'image/jpeg', .82);
  }
  function snapshot() {
    const { resumoManual, ...rest } = clone(S);
    return { ...rest, resumoManual, fotoBlob: P.cut || P.orig || null, origBlob: P.orig || null, logoBlob: P.logo || null };
  }
  async function saveCurrent(quiet) {
    S.id = S.id || uid(); S.criado = S.criado || Date.now();
    const rec = { ...snapshot(), id: S.id, criado: S.criado, atualizado: Date.now(), thumb: await thumbBlob(renderForm()) };
    await dbPut(rec); if (!quiet) toast('Promoção salva neste navegador ✔'); listSaved(); return rec;
  }
  $('#saveBtn').addEventListener('click', () => saveCurrent().catch(e => toast('Não consegui salvar: ' + e.message, true)));

  async function loadRec(rec) {
    S = { ...defaults(), ...clone(Object.fromEntries(Object.entries(rec).filter(([k, v]) => !(v instanceof Blob) && k !== 'thumb'))) };
    P.orig = rec.origBlob || null; P.cut = rec.fotoBlob || null; P.logo = rec.logoBlob || null;
    P.img = rec.fotoBlob ? await blobToImg(rec.fotoBlob) : null; P.logoImg = rec.logoBlob ? await blobToImg(rec.logoBlob) : null;
    P.work = P.orig ? workCanvas(await blobToImg(P.orig)) : (P.img ? (() => { const c = document.createElement('canvas'); c.width = P.img.naturalWidth; c.height = P.img.naturalHeight; c.getContext('2d').drawImage(P.img, 0, 0); return c; })() : null);
    $('#exampleHint').hidden = true; syncForm(); redraw(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function newPromo() {
    S = defaults(); S.nome1 = S.nome2 = S.avista = S.parcela = S.resumo = ''; S.specs = []; S.cores = []; S.brindes = { ativo: true, itens: ['capinha', 'pelicula', 'fone'], custom: [] };
    Object.assign(P, { orig: null, cut: null, img: null, work: null, logo: null, logoImg: null }); status('');
    $('#exampleHint').hidden = true; syncForm(); redraw(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  $('#newBtn').addEventListener('click', () => { if (confirm('Limpar tudo e começar uma nova promoção? (o que não foi salvo será perdido)')) newPromo(); });

  const urls = new Set();
  const objUrl = b => { const u = URL.createObjectURL(b); urls.add(u); return u; };
  async function listSaved() {
    const box = $('#saved'); urls.forEach(u => URL.revokeObjectURL(u)); urls.clear();
    let all = []; try { all = (await dbAll()).sort((a, b) => b.atualizado - a.atualizado); } catch (e) { /* sem IndexedDB */ }
    const pubIds = new Set((window.PROMOS_DATA || []).map(p => p.id));
    box.innerHTML = all.length ? all.map(r => `
      <div class="pcard" data-id="${esc(r.id)}">
        ${r.thumb ? `<img src="${objUrl(r.thumb)}" alt="">` : ''}
        <b>${esc(title(r))}</b>
        <small>${r.avista ? 'R$ ' + esc(Arte.money(Arte.parseMoney(r.avista) || 0).text) + ' à vista' : ''}</small>
        ${r.siteId && pubIds.has(r.siteId) ? '<span class="badge">NO SITE</span>' : ''}
        <div class="acts">
          <button class="btn sm" data-a="edit">Editar</button><button class="btn ghost sm" data-a="dup">Duplicar</button>
          <button class="btn ghost sm" data-a="feed">Feed</button><button class="btn ghost sm" data-a="story">Story</button>
          <button class="btn ghost sm" data-a="pub">${r.siteId && pubIds.has(r.siteId) ? 'Atualizar no site' : 'Publicar no site'}</button>
          <button class="btn ghost sm" data-a="del">Excluir</button>
        </div>
      </div>`).join('') : '<p class="empty">Nenhuma promoção salva ainda. Monte uma e toque em “Salvar promoção”.</p>';
  }
  $('#saved').addEventListener('click', async e => {
    const btn = e.target.closest('[data-a]'); if (!btn) return;
    const id = btn.closest('.pcard').dataset.id, rec = (await dbAll()).find(r => r.id === id); if (!rec) return;
    const a = btn.dataset.a;
    if (a === 'edit') { await loadRec(rec); toast('Promoção carregada para edição.'); }
    else if (a === 'dup') { await loadRec(rec); S.id = null; S.siteId = null; S.criado = null; toast('Cópia criada — edite e salve.'); }
    else if (a === 'del') { if (confirm('Excluir esta promoção salva? (não remove do site)')) { await dbDel(id); listSaved(); } }
    else if (a === 'feed' || a === 'story') { await loadRec(rec); await download(a); }
    else if (a === 'pub') { await loadRec(rec); publishCurrent(); }
  });

  /* =========================================================
     PUBLICAR NO SITE (função /api/publicar, protegida por senha)
     ========================================================= */
  const LS_PWD = 'infoteccell-studio-senha';
  const store = (k, v, persist) => { try { const s = persist ? localStorage : sessionStorage; v ? s.setItem(k, v) : (localStorage.removeItem(k), sessionStorage.removeItem(k)); } catch (e) { /* ignora */ } };
  const readStore = k => { try { return localStorage.getItem(k) || sessionStorage.getItem(k) || ''; } catch (e) { return ''; } };
  $('#senha').value = readStore(LS_PWD);
  $('#senhaLembrar').checked = !!(() => { try { return localStorage.getItem(LS_PWD); } catch (e) { return ''; } })();
  const senha = () => $('#senha').value;
  const guardarSenha = () => { store(LS_PWD, senha(), $('#senhaLembrar').checked); };
  $('#senha').addEventListener('change', guardarSenha); $('#senhaLembrar').addEventListener('change', guardarSenha);
  $('#senhaEsquecer').addEventListener('click', () => { $('#senha').value = ''; store(LS_PWD, ''); $('#senhaMsg').textContent = 'Senha removida deste navegador.'; });

  async function api(acao, dados) {
    let r;
    try { r = await fetch('/api/publicar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senha: senha(), acao, ...(dados || {}) }) }); }
    catch (e) { throw new Error('Sem conexão com o servidor. Confira a internet.'); }
    let jn = null; try { jn = await r.json(); } catch (e) { /* sem corpo */ }
    if (!jn) throw new Error(r.status === 404 ? 'A função de publicação não foi encontrada. Abra o estúdio pelo endereço do site (https://infoteccell.vercel.app/admin.html).' : 'O servidor não respondeu direito (código ' + r.status + ').');
    if (!r.ok || !jn.ok) throw new Error(jn.erro || ('Erro ' + r.status));
    return jn;
  }
  $('#senhaTestar').addEventListener('click', async () => {
    guardarSenha(); const m = $('#senhaMsg');
    if (!senha()) { m.textContent = 'Digite a senha primeiro.'; return; }
    m.textContent = 'Testando…';
    try { const rs = await api('testar'); m.textContent = '✔ Senha correta' + (rs.quem && rs.quem !== 'equipe' ? ' (olá, ' + rs.quem + ')' : '') + ' e conexão com o site ok. Pode publicar!'; }
    catch (e) { m.textContent = '✖ ' + e.message; }
  });
  function pedirSenha(msg) { const d = $('#pubset'); d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => $('#senha').focus({ preventScroll: true }), 400); toast(msg, true); }

  async function encodeArt(form) {
    const feed = await makeCanvas('feed', form), out = {}; let ext = 'webp';
    for (const [k, w] of [['lg', 960], ['sm', 520]]) {
      const c = document.createElement('canvas'); c.width = w; c.height = Math.round(w * 1350 / 1080);
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(feed, 0, 0, c.width, c.height);
      let bl = await canvasToBlob(c, 'image/webp', .84);
      if (bl.type !== 'image/webp') { bl = await canvasToBlob(c, 'image/jpeg', .86); ext = 'jpg'; }
      out[k] = bl;
    }
    return { ...out, ext };
  }

  let publishing = false;
  async function publishCurrent() {
    if (publishing) return;
    guardarSenha();
    if (!senha()) { pedirSenha('Digite a senha em “Acesso para publicar no site”.'); return; }
    const a = Arte.parseMoney(S.avista), p = Arte.parseMoney(S.parcela);
    if (!title(S) || title(S) === 'Promoção') { toast('Preencha o nome do produto.', true); return; }
    if (isNaN(a) || (String(S.parcela || '').trim() && isNaN(p))) { toast('Confira o preço à vista e o valor da parcela.', true); return; }
    if (!P.img) { toast('Anexe a foto do produto antes de publicar.', true); return; }
    if (!confirm(`Publicar “${title(S)}” no site agora?\nEla aparece na seção “Ofertas” em cerca de 1 minuto.`)) return;
    publishing = true; $('#pubBtn').disabled = true;
    try {
      toast('Gerando as imagens…');
      const rec = await saveCurrent(true);
      const art = await encodeArt(renderForm());
      S.siteId = S.siteId || `${slug(title(S))}-${uid()}`; await dbPut({ ...rec, siteId: S.siteId });
      toast('Publicando…');
      const entry = { id: S.siteId, title: title(S), specs: S.resumo || '', avista: Arte.money(a).text, parcela: isNaN(p) ? '' : Arte.money(p).text, parcelas: S.parcelas, ext: art.ext };
      const rs = await api('publicar', { entry, imagens: { lg: await blobToB64(art.lg), sm: await blobToB64(art.sm) } });
      window.PROMOS_DATA = rs.lista; listSaved(); listPublished();
      toast('✅ Publicado! O site atualiza em cerca de 1 minuto.');
    } catch (e) { console.error(e); toast(e.message || 'Falha ao publicar.', true); }
    finally { publishing = false; $('#pubBtn').disabled = false; }
  }
  $('#pubBtn').addEventListener('click', publishCurrent);

  function listPublished() {
    const box = $('#published'), arr = window.PROMOS_DATA || [];
    box.innerHTML = arr.length ? arr.map(p => `
      <div class="pcard" data-id="${esc(p.id)}">
        <img src="${esc(p.img)}-sm.${esc(p.ext || 'webp')}${p.v ? '?v=' + p.v : ''}" alt="" loading="lazy">
        <b>${esc(p.title)}</b><small>R$ ${esc(p.avista)} à vista · ${p.parcela ? esc(p.parcelas || 12) + 'x R$ ' + esc(p.parcela) : 'até ' + esc(p.parcelas || 12) + 'x'}</small>
        <div class="acts"><button class="btn ghost sm" data-a="rm">Remover do site</button></div>
      </div>`).join('') : '<p class="empty">Nenhuma promoção publicada no site.</p>';
  }
  $('#published').addEventListener('click', async e => {
    const bt = e.target.closest('[data-a="rm"]'); if (!bt) return;
    const id = bt.closest('.pcard').dataset.id, p = (window.PROMOS_DATA || []).find(x => x.id === id);
    if (!confirm(`Remover “${p ? p.title : id}” do site?`)) return;
    guardarSenha(); if (!senha()) { pedirSenha('Digite a senha primeiro.'); return; }
    try { const rs = await api('remover', { id }); window.PROMOS_DATA = rs.lista; listPublished(); listSaved(); toast('Removida do site ✔ (some em ~1 minuto).'); }
    catch (err) { toast(err.message, true); }
  });

  /* =========================================================
     INÍCIO
     ========================================================= */
  (async function init() {
    try {
      await Arte.loadFonts(); assets = await Arte.loadAssets('');
      syncForm(); $('#loading').classList.add('off'); redraw();
    } catch (e) { $('#loading').textContent = 'Erro ao carregar recursos: ' + e.message; console.error(e); }
    listSaved(); listPublished();
  })();

  /* botão flutuante: volta para a prévia (celular) */
  const toP = $('#toPreview');
  new IntersectionObserver(([en]) => { toP.hidden = en.isIntersecting; }, { threshold: .15 }).observe($('#previewBox'));
  toP.addEventListener('click', () => $('#previewBox').scrollIntoView({ behavior: 'smooth', block: 'start' }));

  // atalho para testes
  window.__studio = { S: () => S, P, setFmt: f => $(`#fmtSeg [data-f="${f}"]`).click() };
})();
