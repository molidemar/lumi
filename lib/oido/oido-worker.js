/* Oído y voz de Lumi, en el dispositivo (sin internet una vez bajados los modelos, sin servicios de pago).
   - Oído: Whisper base (OpenAI, MIT) con Transformers.js (Apache 2.0) y ONNX Runtime Web (MIT). WebGPU si hay, si no WASM.
   - Voz: Piper (MIT) con las voces Sharvard (es_ES), Ona (ca_ES) y Jenny (en_GB); fonemas con espeak-ng (GPL-3, módulo aparte).
   Mensajes: {id, cmd, ...} → {id, ok, res|err}; progreso: {cmd:'prog', what, p}. */
import * as ort from './ort.webgpu.min.mjs';
const BASE = new URL('../../', import.meta.url).href;           // raíz de la web
const LIB = new URL('./', import.meta.url).href;
ort.env.wasm.wasmPaths = LIB; ort.env.wasm.numThreads = 1; ort.env.wasm.proxy = false;
// Transformers.js trae su propio ONNX Runtime (mismo .wasm, se baja una sola vez)
const post = (m, t) => self.postMessage(m, t || []);
const prog = (what, p, st) => post({ cmd: 'prog', what, p, st });
post({ cmd: 'boot' });   // el worker arrancó (si no llega, el problema es el arranque)

/* ---------- descargas con caché propia (Cache API) y progreso ---------- */
const CACHE = 'lumi-oido-1';
async function getBuf(url, what, share = 1, off = 0, own = true) {
  let cache = null; try { if (own) cache = await caches.open(CACHE); const hit = await cache.match(url); if (hit) return await hit.arrayBuffer(); } catch (e) {}
  const r = await fetch(url); if (!r.ok) throw new Error(url.split('/').pop() + ' ' + r.status);
  const tot = +r.headers.get('content-length') || 0; const rd = r.body.getReader(); const parts = []; let got = 0;
  for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; if (tot) prog(what, off + share * got / tot); }
  const b = new Blob(parts); try { cache && await cache.put(url, new Response(b)); } catch (e) {}
  return await b.arrayBuffer();
}
/* un archivo grande puede venir partido en .part0, .part1… (límite de GitHub) */
async function getModel(url, what) {
  let parts = null; try { const r = await fetch(url + '.parts.json'); if (r.ok) parts = await r.json(); } catch (e) {}
  if (!parts) return getBuf(url, what);
  const bufs = []; for (let i = 0; i < parts.length; i++) bufs.push(await getBuf(url + '.part' + i, what, 1 / parts.length, i / parts.length));
  const out = new Uint8Array(bufs.reduce((a, b) => a + b.byteLength, 0)); let o = 0; bufs.forEach(b => { out.set(new Uint8Array(b), o); o += b.byteLength; });
  return out.buffer;
}

/* ---------- OÍDO: Whisper ---------- */
let asr = null, asrP = null, asrDev = '';
async function hasGPU() { try { if (!navigator.gpu) return false; const a = await Promise.race([navigator.gpu.requestAdapter(), new Promise(r => setTimeout(() => r(null), 2500))]); return !!a; } catch (e) { return false; } }
/* prueba al cargar: una frase grabada conocida. Si Whisper no la entiende, este dispositivo lo hace mal (p. ej. WebGPU en iPhone/iPad
   devolvía letras sueltas en varios idiomas) y no se usa: mejor el oído ligero o el adulto que aprobar o suspender a ciegas. */
const PRUEBA = { es: 'el gato come pan', ca: 'el gat menja pa', en: 'the cat eats bread' };
async function clip(lang) {
  const r = await fetch(LIB + 'prueba/prueba-' + lang + '.pcm'); if (!r.ok) throw new Error('prueba ' + r.status);
  const i16 = new Int16Array(await r.arrayBuffer()); const pad = 4800; const out = new Float32Array(i16.length + 2 * pad);
  for (let i = 0; i < i16.length; i++) out[pad + i] = i16[i] / 32768; return out;
}
const norm = t => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
function lev(a, b) { let p = Array.from({ length: b.length + 1 }, (_, j) => j); for (let i = 1; i <= a.length; i++) { const c = [i]; for (let j = 1; j <= b.length; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[b.length]; }
/* parecido letra a letra: «el rato como pan» pasa (0,88); la basura de varios idiomas no (≈0,2) */
function passes(lang, text) { const w = norm(PRUEBA[lang]).join(' '), g = norm(text).join(' '); return g.length > 0 && 1 - lev(w, g) / Math.max(w.length, g.length) >= .6; }
async function asrLoad(force, size, lang) {
  if (asr) return { dev: asrDev }; if (asrP) return asrP;
  asrP = (async () => {
    prog('asr', .01, 'motor');
    const T = await import('./transformers.min.js');
    prog('asr', .03, 'motor');
    T.env.allowRemoteModels = false; T.env.allowLocalModels = true; T.env.localModelPath = BASE + 'models/'; T.env.useBrowserCache = true;
    if (T.env.backends && T.env.backends.onnx && T.env.backends.onnx.wasm) { T.env.backends.onnx.wasm.wasmPaths = LIB; T.env.backends.onnx.wasm.numThreads = 1; }
    /* progreso real en bytes: GitHub Pages manda los modelos comprimidos, así que el tamaño que anuncia no sirve; se usan los tamaños reales */
    const SIZE = { 'onnx/encoder_model_quantized.onnx': 23201314, 'onnx/encoder_model.onnx': 82468078, 'onnx/decoder_model_merged_quantized.onnx': 53693315, 'tokenizer.json': 2480466, 'tokenizer_config.json': 282682 };
    let got = {}, need = 1;
    const progress_callback = x => { if (!x || !x.file) return;
      if (x.status === 'progress') got[x.file] = Math.max(got[x.file] || 0, x.loaded || 0); else if (x.status === 'done') got[x.file] = SIZE[x.file] || got[x.file] || 0; else return;
      const all = Object.values(got).reduce((a, b) => a + b, 0); const built = x.status === 'done' && /\.onnx$/.test(x.file);   // al bajar un .onnx se empieza a montar
      prog('asr', Math.min(.85, .05 + .8 * all / need), all >= need * .98 || built ? 'montar' : 'descarga'); };
    // WebGPU solo si se pide expresamente: en iPhone/iPad (Safari 26) el decodificador q8 daba basura. WASM es igual de fiable en todos lados.
    const gpu = force === 'webgpu' && await hasGPU(); prog('asr', .05, 'descarga');
    const name = size === 'tiny' ? 'whisper-tiny' : 'whisper-base';
    const mk = async dev => { const dtype = dev === 'webgpu' && name === 'whisper-base' ? { encoder_model: 'fp32', decoder_model_merged: 'q8' } : { encoder_model: 'q8', decoder_model_merged: 'q8' };
      got = {}; need = SIZE[dtype.encoder_model === 'fp32' ? 'onnx/encoder_model.onnx' : 'onnx/encoder_model_quantized.onnx'] + SIZE['onnx/decoder_model_merged_quantized.onnx'] + SIZE['tokenizer.json'] + SIZE['tokenizer_config.json'];
      const model = await T.WhisperForConditionalGeneration.from_pretrained(name, { device: dev, dtype, progress_callback });
      prog('asr', .9, 'montar');
      const processor = await T.AutoProcessor.from_pretrained(name, { progress_callback }); return { model, processor, T }; };
    try { asr = await mk(gpu ? 'webgpu' : 'wasm'); asrDev = gpu ? 'webgpu' : 'wasm'; } catch (e) { if (!gpu) throw e; asr = await mk('wasm'); asrDev = 'wasm'; }
    const tk = asr.processor.tokenizer, id = t => tk.model.tokens_to_ids.get(t);
    asr.ids = { prev: id('<|startofprev|>'), sot: id('<|startoftranscript|>'), es: id('<|es|>'), ca: id('<|ca|>'), en: id('<|en|>'), tr: id('<|transcribe|>'), nots: id('<|notimestamps|>') };
    prog('asr', .95, 'ajuste');
    const L = PRUEBA[lang] ? lang : 'es'; let test = '';
    try { test = await run(await clip(L), L, '', 24); } catch (e) { test = 'error ' + (e && e.message || e); }   // también calienta
    if (!passes(L, test)) throw new Error('prueba: ' + (test || '—').slice(0, 60));
    prog('asr', 1); return { dev: asrDev, name, test };
  })();
  asrP.catch(() => { asrP = null; asr = null; });
  return asrP;
}
/* prompt: la frase que el chico tiene que leer. Whisper la usa como contexto (ortografía, nombres), no como respuesta. */
async function run(audio, lang, prompt, maxTok) {
  const { model, processor, ids } = asr; const inputs = await processor(audio);
  const head = [ids.sot, ids[lang] || ids.es, ids.tr, ids.nots];
  const pre = prompt ? [ids.prev, ...processor.tokenizer.encode(' ' + prompt.trim(), { add_special_tokens: false }).slice(-120)] : [];
  const dec = [...pre, ...head];
  const out = await model.generate({ ...inputs, decoder_input_ids: dec, max_new_tokens: maxTok, no_repeat_ngram_size: 4 });
  const seq = Array.from(out.tolist ? out.tolist()[0] : out[0]).map(Number).slice(dec.length);
  return processor.tokenizer.decode(seq, { skip_special_tokens: true }).trim();
}
async function transcribe({ audio, lang, words, prompt }) {
  await asrLoad(); const t0 = performance.now();
  const text = await run(audio, lang, prompt || '', Math.min(120, 12 + 4 * (words || 8)));
  return { text, ms: Math.round(performance.now() - t0), dev: asrDev };
}

/* ---------- VOZ: Piper ---------- */
const VOICES = { es: 'es_ES-sharvard-medium', ca: 'ca_ES-upc_ona-medium', en: 'en_GB-jenny_dioco-medium' };
const tts = {}; let phon = null;
async function phonemizer() {
  if (phon) return phon;
  phon = (async () => {
    // piper_phonemize.js es un script clásico: en un worker de módulo no hay importScripts, así que se evalúa a mano
    const src = await (await fetch(LIB + 'piper_phonemize.js')).text();
    const f = new Function('importScripts', src + '\nreturn createPiperPhonemize;'); const create = f(function () {}); // se cree en un worker clásico
    // lib/ ya lo guarda el service worker de la app: acá no se duplica
    const data = await getBuf(LIB + 'piper_phonemize.data', 'tts', .15, 0, false);
    const wasm = await getBuf(LIB + 'piper_phonemize.wasm', 'tts', .02, .15, false);
    return { create, data, wasm };
  })(); phon.catch(() => { phon = null; }); return phon;
}
async function runPhonemize(text, voice) {
  const P = await phonemizer();
  return await new Promise((resolve, reject) => {
    let done = false;
    P.create({
      print: d => { if (done) return; try { const j = JSON.parse(d); done = true; resolve(j.phoneme_ids); } catch (e) {} },
      printErr: m => { if (!done && /error/i.test(m)) { done = true; reject(new Error(m)); } },
      locateFile: u => u, getPreloadedPackage: () => P.data,
      instantiateWasm: (imports, ok) => { WebAssembly.instantiate(P.wasm, imports).then(r => ok(r.instance, r.module)).catch(reject); return {}; },
    }).then(M => { M.callMain(['-l', voice, '--input', JSON.stringify([{ text }]), '--espeak_data', '/espeak-ng-data']); }).catch(e => { if (!done) { done = true; reject(e); } });
  });
}
async function ttsLoad(lang) {
  const L = VOICES[lang] ? lang : 'es'; if (tts[L]) return tts[L];
  tts[L] = (async () => {
    const url = BASE + 'models/piper/' + VOICES[L] + '.onnx';
    const cfg = await (await fetch(url + '.json')).json();
    await phonemizer();
    const buf = await getModel(url, 'tts');
    const sess = await ort.InferenceSession.create(new Uint8Array(buf), { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
    prog('tts', 1); return { cfg, sess };
  })(); tts[L].catch(() => { delete tts[L]; }); return tts[L];
}
async function synth({ text, lang, speed }) {
  const L = VOICES[lang] ? lang : 'es'; const { cfg, sess } = await ttsLoad(L); const t0 = performance.now();
  const ids = await runPhonemize(text, cfg.espeak.voice);
  const inf = cfg.inference || {}; const ls = (inf.length_scale || 1) / Math.max(.5, Math.min(1.5, speed || 1));
  const feeds = { input: new ort.Tensor('int64', BigInt64Array.from(ids.map(BigInt)), [1, ids.length]), input_lengths: new ort.Tensor('int64', BigInt64Array.from([BigInt(ids.length)]), [1]),
    scales: new ort.Tensor('float32', Float32Array.from([inf.noise_scale ?? .667, ls, inf.noise_w ?? .8]), [3]) };
  if (cfg.num_speakers > 1) feeds.sid = new ort.Tensor('int64', BigInt64Array.from([BigInt((cfg.speaker_id_map && cfg.speaker_id_map.F) ?? 0)]), [1]);   // voz femenina si la hay
  const out = await sess.run(feeds); const pcm = out.output.data;
  const sr = cfg.audio.sample_rate; const pcm2 = new Float32Array(pcm); // copia transferible
  return { pcm: pcm2, sr, ms: Math.round(performance.now() - t0) };
}

/* ---------- cola: una cosa por vez, el oído tiene prioridad ---------- */
const q = []; let busy = false;
async function pump() {
  if (busy || !q.length) return; busy = true;
  q.sort((a, b) => (b.pri || 0) - (a.pri || 0)); const m = q.shift();
  try {
    let res;
    if (m.cmd === 'asrLoad') res = await asrLoad(m.force, m.size, m.lang);
    else if (m.cmd === 'asr') res = await transcribe(m);
    else if (m.cmd === 'ttsLoad') { await ttsLoad(m.lang); res = true; }
    else if (m.cmd === 'tts') res = await synth(m);
    else throw new Error('cmd ' + m.cmd);
    post({ id: m.id, ok: true, res }, res && res.pcm ? [res.pcm.buffer] : []);
  } catch (e) { post({ id: m.id, ok: false, err: String(e && e.message || e) }); }
  busy = false; pump();
}
const answer = (m, p) => p.then(res => post({ id: m.id, ok: true, res }), e => post({ id: m.id, ok: false, err: String(e && e.message || e) }));
self.onmessage = e => { const m = e.data || {};
  if (m.cmd === 'asrLoad') return answer(m, asrLoad(m.force, m.size, m.lang)); if (m.cmd === 'ttsLoad') return answer(m, ttsLoad(m.lang).then(() => true));  // las descargas no frenan la cola
  m.pri = m.cmd === 'asr' ? 2 : 1; q.push(m); pump(); };
