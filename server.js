#!/usr/bin/env node
/* ============================================================
   MiTutor — servidor (opcional)
   Sirve la app y conecta el Tutor IA con internet.
   Uso:  node server.js   (por defecto en el puerto 3000)
   ============================================================ */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
/* funciona tanto desde src/ (desarrollo) como desde la raíz (Render/Docker) */
const HTML_PATH = fs.existsSync(path.join(__dirname, '..', 'mitutor.html'))
  ? path.join(__dirname, '..', 'mitutor.html')
  : path.join(__dirname, 'index.html');
const KEYSTORE = path.join(path.dirname(HTML_PATH), 'data', 'ai-config.json');
function readKeystore() {
  /* 1) archivo guardado en caliente (si existe) */
  try { return JSON.parse(fs.readFileSync(KEYSTORE, 'utf8')); } catch (e) { }
  /* 2) configuración por variables de entorno (permanente en Render/Railway/etc.) */
  if (process.env.MITUTOR_KEY) {
    return {
      provider: process.env.MITUTOR_PROVIDER || 'gemini',
      model: process.env.MITUTOR_MODEL || 'gemini-3.6-flash',
      key: process.env.MITUTOR_KEY,
      level: process.env.MITUTOR_LEVEL || 'secundaria',
      savedAt: 'env'
    };
  }
  return null;
}
function writeKeystore(cfg) {
  try {
    fs.mkdirSync(path.dirname(KEYSTORE), { recursive: true });
    fs.writeFileSync(KEYSTORE, JSON.stringify(cfg, null, 2));
  } catch (e) { console.log('(no se pudo guardar en disco: ' + e.message + ')'); }
}

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}
function readBody(req, limitBytes) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > limitBytes) { reject(new Error('Archivo demasiado grande (máx. ~15 MB)')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
function withTimeout(ms, prom) {
  return Promise.race([
    prom,
    new Promise((_, rej) => setTimeout(() => rej(new Error('El modelo tardó demasiado (timeout)')), ms))
  ]);
}

function systemPrompt(level, mode) {
  const lv = { primaria: 'primaria (explica con ejemplos muy sencillos)', secundaria: 'secundaria/bachillerato', universidad: 'universidad (rigor académico)' }[level] || 'secundaria/bachillerato';
  if (mode === 'resolver') {
    return 'Eres MiTutor en modo RESOLVER COMPLETO, para estudiantes de nivel ' + lv + '. Reglas: ' +
      '1) Responde SIEMPRE en español claro y cálido. ' +
      '2) Cuando te envíen un ejercicio, RESUÉLVELO ENTERO de una sola vez: planteamiento, pasos numerados con la operación y el por qué de cada uno, resultado final bien destacado, verificación y un tip para recordar. ' +
      '3) Si el ejercicio tiene varios incisos o preguntas, resuélvelos TODOS en orden (a, b, c…). ' +
      '4) Si te envían una imagen o PDF, primero di qué ejercicio ves y luego resuélvelo completo. ' +
      '5) Aun dando la solución completa, EXPLICA cada paso de forma que el estudiante pueda reproducirla en un examen. ' +
      '6) Sé ordenado: numeración, saltos de línea y resultados en negrita. No preguntes al final: entrega la solución completa y un tip breve. ' +
      '7) NO uses LaTeX (nada de $, \\( \\) ni \\[ \\]): matemática con símbolos simples: x², √9, 3 ÷ 4, ×, ≠, ≈, fracciones como 3/4.';
  }
  return 'Eres MiTutor, un tutor profesional hispanohablante para estudiantes de nivel ' + lv + '. Reglas: ' +
    '1) Responde SIEMPRE en español claro y cálido. ' +
    '2) Para tareas de matemáticas: explica paso a paso, mostrando el procedimiento y el por qué de cada paso. Si te envían una imagen de un ejercicio, primero descríbelo y luego resuélvelo paso a paso. ' +
    '3) NO entregues la tarea hecha de golpe: guía al estudiante, dale el primer paso y verifica su comprensión con una pregunta corta al final. ' +
    '4) Para trabajos de investigación: enseña a estructurar, buscar fuentes y citar en APA; sugiere fuentes confiables. ' +
    '5) Fomenta la honestidad académica: nunca ayudes a plagiar. ' +
    '6) Sé breve y organizado: usa listas cortas. Si el estudiante pide «solo la respuesta», dila pero siempre con la explicación del método. ' +
    '7) NO uses LaTeX (nada de $, \\( \\) ni \\[ \\]): escribe la matemática con símbolos simples: x², √9, 3 ÷ 4, ×, ≠, ≈, y fracciones como 3/4.';
}

async function callGemini(key, model, messages, images, level, mode) {
  const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] }));
  if (images && images.length && contents.length) {
    const last = contents[contents.length - 1];
    for (const du of images) {
      const m = /^data:([a-z]+\/[a-z0-9+.-]+);/i.exec(String(du));
      last.parts.push({ inline_data: { mime_type: m ? m[1] : 'image/jpeg', data: String(du).split(',')[1] || '' } });
    }
  }
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model || 'gemini-3.6-flash') + ':generateContent?key=' + encodeURIComponent(key);
  const r = await withTimeout(70000, fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt(level, mode) }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 1400 }
    })
  }));
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j.error && j.error.message) || ('Error HTTP ' + r.status + ' de Google (¿llave o modelo incorrectos?)'));
  const out = ((j.candidates || [])[0] && j.candidates[0].content && j.candidates[0].content.parts || []).map(p => p.text || '').join('');
  if (!out.trim()) throw new Error('El modelo no devolvió texto (¿contenido bloqueado por seguridad?). Reformula la pregunta.');
  return out;
}

async function callOpenAICompat(base, key, model, messages, images, level, mode) {
  const msgs = [{ role: 'system', content: systemPrompt(level, mode) }].concat(messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text })));
  if (images && images.length && msgs.length) {
    const last = msgs[msgs.length - 1];
    last.content = [{ type: 'text', text: String(last.content || '') }].concat(images.map(du => ({ type: 'image_url', image_url: { url: String(du) } })));
  }
  const r = await withTimeout(70000, fetch(base + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({ model: model || 'gpt-4o-mini', messages: msgs, max_tokens: 1400 })
  }));
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j.error && (j.error.message || JSON.stringify(j.error))) || ('Error HTTP ' + r.status));
  const out = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '';
  if (!out.trim()) throw new Error('El modelo no devolvió texto.');
  return out;
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://localhost');
    if (req.method === 'OPTIONS') { json(res, 204, {}); return; }
    if ((u.pathname === '/' || u.pathname === '/index.html') && (req.method === 'GET' || req.method === 'HEAD')) {
      const html = fs.readFileSync(HTML_PATH);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(html);
      return;
    }
    if (u.pathname === '/api/ai' && req.method === 'GET') { json(res, 200, { ok: true, mode: 'server', app: 'MiTutor' }); return; }
    if (u.pathname === '/api/keystore' && req.method === 'GET') { json(res, 200, { cfg: readKeystore() }); return; }
    if (u.pathname === '/api/keystore' && req.method === 'POST') {
      try {
        const b = JSON.parse(await readBody(req, 1e6));
        if (b && b.clear) { try { fs.unlinkSync(KEYSTORE); } catch (e) { } json(res, 200, { ok: true, cleared: true }); return; }
        const c = b && b.cfg;
        if (!c || !c.key || typeof c.key !== 'string' || c.key.length < 10 || c.key.length > 300 || !['gemini', 'groq', 'openai', 'custom'].includes(c.provider)) {
          json(res, 200, { error: 'Configuración inválida' }); return;
        }
        writeKeystore({ provider: c.provider, model: c.model || '', key: c.key, level: c.level || 'secundaria', savedAt: new Date().toISOString() });
        json(res, 200, { ok: true });
      } catch (e) { json(res, 200, { error: String(e && e.message || e) }); }
      return;
    }
    if (u.pathname === '/api/ai' && req.method === 'POST') {
      const raw = await readBody(req, 15e6);
      let b;
      try { b = JSON.parse(raw); } catch (e) { json(res, 200, { error: 'Cuerpo JSON inválido' }); return; }
      const provider = b.provider || 'gemini';
      const messages = Array.isArray(b.messages) ? b.messages : [];
      const images = Array.isArray(b.images) ? b.images : [];
      if (!messages.length) { json(res, 200, { error: 'No hay mensajes' }); return; }
      try {
        let text;
        if (provider === 'gemini') {
          if (!b.key) throw new Error('Falta tu llave gratuita de Google AI Studio (mira la guía dentro de la app) 🔑');
          text = await callGemini(b.key, b.model, messages, images, b.level, b.mode);
        } else {
          const base = provider === 'openai' ? 'https://api.openai.com/v1' : provider === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://openrouter.ai/api/v1';
          if (!b.key) throw new Error('Falta la API key del proveedor elegido 🔑');
          text = await callOpenAICompat(base, b.key, b.model, messages, images, b.level, b.mode);
        }
        json(res, 200, { text });
      } catch (e) {
        json(res, 200, { error: String(e && e.message || e) });
      }
      return;
    }
    if (u.pathname === '/favicon.ico') { res.writeHead(204); res.end(); return; }
    json(res, 404, { error: 'Ruta no encontrada' });
  } catch (e) {
    try { json(res, 500, { error: String(e && e.message || e) }); } catch (e2) { }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('🎓 MiTutor sirviéndose en http://0.0.0.0:' + PORT);
  console.log('   El Tutor IA usará este servidor como puente a internet.');
  if (process.env.MITUTOR_KEY) console.log('   🔑 Llave cargada desde variables de entorno (permanente).');
});
