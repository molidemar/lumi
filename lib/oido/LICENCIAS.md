# Oído y voz de Lumi (todo corre en el dispositivo, gratis)

| Pieza | Licencia | Origen |
|---|---|---|
| Whisper base (modelo, `models/whisper-base/`) | MIT | OpenAI, versión ONNX de onnx-community/whisper-base |
| Transformers.js 3.7.6 (`transformers.min.js`) | Apache 2.0 | Hugging Face |
| ONNX Runtime Web 1.22 (`ort.webgpu.min.mjs`, `ort-wasm-simd-threaded.jsep.*`) | MIT | Microsoft |
| Piper y voces Daniela (es_AR), Ona (ca_ES), Jenny (en_GB) (`models/piper/`) | MIT (motor); ver la ficha de cada voz en rhasspy/piper-voices | Rhasspy |
| piper_phonemize + espeak-ng (`piper_phonemize.*`) | GPL-3.0 (módulo aparte; código en github.com/rhasspy/espeak-ng y github.com/wide-video/piper-phonemize) | @diffusionstudio/piper-wasm 1.0.0 |

Los modelos se bajaron con `.github/workflows/oido.yml`. Los archivos de más de 90 MB van partidos en `.part0`, `.part1`… (`.parts.json` dice cuántos) y el worker los une al bajarlos.
