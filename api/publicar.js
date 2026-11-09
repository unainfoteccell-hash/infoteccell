/* =========================================================
   Infoteccell — função da Vercel que publica promoções
   Recebe a SENHA da equipe e, se estiver certa, grava os
   arquivos no GitHub usando a chave guardada na Vercel.
   A chave NUNCA vai para o navegador.

   Variáveis de ambiente (Vercel → Settings → Environment Variables):
     ADMIN_SENHA   senha da equipe. Para uma senha por pessoa:  ana:senhaDaAna,joao:senhaDoJoao
     GITHUB_TOKEN  chave do GitHub (Contents: Read and write)
     GITHUB_REPO   (opcional) padrão: unainfoteccell-hash/infoteccell
     GITHUB_BRANCH (opcional) padrão: main
   ========================================================= */
'use strict';
const crypto = require('crypto');

const REPO = process.env.GITHUB_REPO || 'unainfoteccell-hash/infoteccell';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const PROMOS_FILE = 'data/promos.js';
const MAX_IMG = 700 * 1024;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}
async function readBody(req) {
  if (req.body !== undefined && req.body !== null) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > 4 * 1024 * 1024) throw new Error('Envio grande demais'); chunks.push(c); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

/* ---------- senha ---------- */
function usuarios() {
  return String(process.env.ADMIN_SENHA || '').split(',').map(s => s.trim()).filter(Boolean).map(s => {
    const i = s.indexOf(':');
    return i > 0 ? { nome: s.slice(0, i).trim(), senha: s.slice(i + 1) } : { nome: 'equipe', senha: s };
  });
}
const hash = s => crypto.createHash('sha256').update(String(s)).digest();
function autenticar(senha) {
  let achou = null;
  for (const u of usuarios()) { if (crypto.timingSafeEqual(hash(senha || ''), hash(u.senha))) achou = achou || u; }
  return achou;
}

/* ---------- GitHub ---------- */
async function gh(path, opts) {
  return fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...(opts || {}),
    headers: {
      Authorization: 'Bearer ' + process.env.GITHUB_TOKEN, Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'infoteccell-studio', 'Content-Type': 'application/json'
    }
  });
}
async function getFile(path) {
  const r = await gh(`/contents/${path}?ref=${encodeURIComponent(BRANCH)}`);
  if (r.status === 404) return null;
  if (r.status === 401 || r.status === 403) throw new Error('A chave do GitHub guardada na Vercel está inválida, vencida ou sem permissão.');
  if (!r.ok) throw new Error('GitHub respondeu ' + r.status);
  return r.json();
}
async function putFile(path, b64, message, sha, tentativa) {
  const r = await gh(`/contents/${path}`, { method: 'PUT', body: JSON.stringify({ message, content: b64, branch: BRANCH, ...(sha ? { sha } : {}) }) });
  if (r.status === 409 && !tentativa) { const f = await getFile(path); return putFile(path, b64, message, f && f.sha, true); }
  if (r.status === 401 || r.status === 403) throw new Error('A chave do GitHub guardada na Vercel está inválida, vencida ou sem permissão.');
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(`Falha ao gravar ${path}: ${j.message || r.status}`); }
  return r.json();
}
function lerPromos(texto) {
  const m = String(texto).match(/window\.PROMOS_DATA\s*=\s*(\[[\s\S]*\])\s*;?\s*$/);
  if (!m) throw new Error('Formato inesperado em data/promos.js');
  return JSON.parse(m[1]);
}
const montarPromos = arr => '/* Gerado pelo Estúdio de Promoções (admin.html). Pode editar à mão se precisar. */\nwindow.PROMOS_DATA = ' + JSON.stringify(arr, null, 2) + ';\n';
async function carregarPromos() {
  const f = await getFile(PROMOS_FILE);
  if (!f) return { lista: [], sha: null };
  return { lista: lerPromos(Buffer.from(f.content, 'base64').toString('utf8')), sha: f.sha };
}

/* ---------- validação ---------- */
const texto = (v, max) => { if (typeof v !== 'string') throw new Error('Dados inválidos'); const t = v.trim(); if (t.length > max) throw new Error('Texto muito longo'); return t; };
function validarEntrada(e) {
  if (!e || typeof e !== 'object') throw new Error('Dados da promoção ausentes');
  const id = texto(e.id, 90);
  if (!/^[a-z0-9][a-z0-9-]{2,88}$/.test(id)) throw new Error('Identificador inválido');
  const titulo = texto(e.title, 80); if (!titulo) throw new Error('Informe o nome do produto');
  const avista = texto(e.avista, 14), parcela = texto(e.parcela, 14);
  if (!/^\d{1,3}(\.\d{3})*,\d{2}$/.test(avista) || !/^\d{1,3}(\.\d{3})*,\d{2}$/.test(parcela)) throw new Error('Preço em formato inválido');
  const parcelas = Number(e.parcelas); if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 24) throw new Error('Número de parcelas inválido');
  const ext = e.ext === 'jpg' ? 'jpg' : 'webp';
  return { id, title: titulo, specs: texto(e.specs || '', 90), avista, parcela, parcelas, ext };
}
function validarImagem(b64, ext) {
  if (typeof b64 !== 'string' || !b64) throw new Error('Imagem ausente');
  const buf = Buffer.from(b64, 'base64');
  if (!buf.length || buf.length > MAX_IMG) throw new Error('Imagem inválida ou grande demais');
  const webp = buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP';
  const jpg = buf[0] === 0xff && buf[1] === 0xd8;
  if ((ext === 'webp' && !webp) || (ext === 'jpg' && !jpg)) throw new Error('Formato de imagem não confere');
  return buf.toString('base64');
}

/* ---------- ações ---------- */
async function publicar(body, user) {
  const e = validarEntrada(body.entry);
  const im = body.imagens || {};
  const lg = validarImagem(im.lg, e.ext), sm = validarImagem(im.sm, e.ext);
  const msg = `Promoção: ${e.title} (por ${user.nome})`;
  const base = `assets/img/promo-${e.id}`;
  for (const [k, b64] of [['lg', lg], ['sm', sm]]) {
    const caminho = `${base}-${k}.${e.ext}`, ex = await getFile(caminho);
    await putFile(caminho, b64, msg, ex && ex.sha);
  }
  const { lista, sha } = await carregarPromos();
  const nova = { id: e.id, title: e.title, specs: e.specs, avista: e.avista, parcela: e.parcela, parcelas: e.parcelas, img: base, ext: e.ext, v: Date.now(), ativo: true, studio: true };
  const i = lista.findIndex(x => x.id === e.id);
  if (i >= 0) lista[i] = nova; else lista.unshift(nova);
  await putFile(PROMOS_FILE, Buffer.from(montarPromos(lista), 'utf8').toString('base64'), msg, sha);
  return { ok: true, lista, quem: user.nome };
}
async function remover(body, user) {
  const id = texto(body.id, 90);
  if (!/^[a-z0-9][a-z0-9-]{1,88}$/.test(id)) throw new Error('Identificador inválido');
  const { lista, sha } = await carregarPromos();
  const item = lista.find(x => x.id === id);
  if (!item) return { ok: true, lista, quem: user.nome };
  const nova = lista.filter(x => x.id !== id);
  await putFile(PROMOS_FILE, Buffer.from(montarPromos(nova), 'utf8').toString('base64'), `Remove promoção: ${item.title} (por ${user.nome})`, sha);
  return { ok: true, lista: nova, quem: user.nome };
}
async function testar(user) {
  const r = await gh('');
  if (r.status === 401) throw new Error('Senha correta, mas a chave do GitHub na Vercel está inválida ou vencida.');
  if (!r.ok) throw new Error('Senha correta, mas não consegui falar com o repositório (GitHub respondeu ' + r.status + ').');
  const j = await r.json();
  if (!(j.permissions && j.permissions.push)) throw new Error('Senha correta, mas a chave do GitHub só tem leitura (precisa de “Contents: Read and write”).');
  return { ok: true, quem: user.nome, repo: j.full_name };
}

/* ---------- entrada ---------- */
module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') return send(res, 405, { ok: false, erro: 'Use POST.' });
    const origin = req.headers.origin;
    if (origin) {
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      let ok = false; try { ok = new URL(origin).host === host; } catch (e) { ok = false; }
      if (!ok) return send(res, 403, { ok: false, erro: 'Origem não permitida.' });
    }
    if (!usuarios().length || !process.env.GITHUB_TOKEN) {
      return send(res, 500, { ok: false, erro: 'O servidor ainda não foi configurado: faltam ADMIN_SENHA e/ou GITHUB_TOKEN nas variáveis da Vercel (depois é preciso fazer um novo deploy).' });
    }
    let body; try { body = await readBody(req); } catch (e) { return send(res, 400, { ok: false, erro: 'Pedido inválido.' }); }
    const user = autenticar(body && body.senha);
    if (!user) { await sleep(900); return send(res, 401, { ok: false, erro: 'Senha incorreta.' }); }
    if (body.acao === 'testar') return send(res, 200, await testar(user));
    if (body.acao === 'publicar') return send(res, 200, await publicar(body, user));
    if (body.acao === 'remover') return send(res, 200, await remover(body, user));
    return send(res, 400, { ok: false, erro: 'Ação desconhecida.' });
  } catch (e) {
    return send(res, 500, { ok: false, erro: e && e.message ? e.message : 'Erro inesperado.' });
  }
};
