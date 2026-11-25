/* Lumi · Leer palabras (lectura guiada por sílabas con el micrófono), Sopa de letras, niveles de explorador y tamaño de las letras para trazar.
   - Leer palabras: se pinta la sílaba que hay que decir, después la siguiente y al final la palabra entera. Lumi escucha (oído de Lumi: Whisper en el
     dispositivo) y ayuda: si no sale, la dice ella parte por parte y el niño repite. Cada 50 palabras leídas sube una etapa (palabras con más letras).
   - Sopa de letras: desde los 5 años, 12 niveles (5×5 con 3 palabras en horizontal … 12×12 con 12 palabras en todas las direcciones). También en papel.
   - Niveles de explorador: muchos niveles cortos según los puntos, con barra en el inicio y festejo al subir.
   Archivo aparte de index.html (como progress.js y cards.js). Expone window.LumiLeer; index.html le pasa sus piezas en LumiLeer.core. */
(function(){
'use strict';
const LG=()=>{ const l=(document.documentElement.lang||'es').slice(0,2); return l==='ca'||l==='en'? l : 'es'; };
const core=()=>window.LumiLeer.core||{};
const R=()=>window.React;
const H=()=>core().html || window.htm.bind(window.React.createElement);

const TX={
 es:{ intro:'Lee la parte pintada. Después, toda la palabra.', listen:'Te escucho…', think:'Pensando…', lumi:'Escucha a Lumi…', you:'¡Ahora tú!', whole:'¡Ahora toda junta!',
      together:'La leemos juntos.', help:'Ayuda', skip:'Seguir', again:'Otra vez', readOk:'Lo leyó bien', hard:'Le costó', tapMode:'Toca la parte pintada, escucha y repite.',
      noMic:'Sin micrófono: que lo lea en voz alta y un adulto toca.', words:'Palabras leídas', stageUp:'¡{0} palabras leídas!', stageSay:'¡Leíste {0} palabras! Ahora vienen palabras más largas.',
      st:'Palabras de {0} letras', stMax:'Palabras largas', next:'Faltan {0} para palabras más largas',
      wsIntro:'Busca las palabras escondidas. Pasa el dedo de la primera letra a la última.', wsLeft:'Faltan {0}', wsAll:'¡Las encontraste todas!', wsHint:'Toca una palabra y te enseño dónde empieza.',
      level:'Nivel {0}', lvUp:'¡Subiste al nivel {0}!', toNext:'Faltan {0} puntos para el nivel {1}', rankUp:'¡Ahora eres {0}!', prog:'Mis avances', ranks:'Niveles', sopas:'Sopas de letras resueltas', cards:'Cartas',
      r1:'Semilla', r2:'Chispa', r3:'Estrella', r4:'Cometa', r5:'Cohete', r6:'Planeta', r7:'Galaxia', r8:'Leyenda',
      shRead:'Lee en voz alta', shReadNote:'Lee cada parte y después toda la palabra. Pinta la estrella cuando la leas.', shWs:'Encuentra las palabras escondidas', shWsNote:'Rodea cada palabra. Táchala de la lista cuando la encuentres.',
      row:'fila', col:'columna' },
 ca:{ intro:'Llegeix la part pintada. Després, tota la paraula.', listen:'T’escolto…', think:'Pensant…', lumi:'Escolta la Lumi…', you:'Ara tu!', whole:'Ara tota junta!',
      together:'La llegim junts.', help:'Ajuda', skip:'Segueix', again:'Una altra vegada', readOk:'Ho ha llegit bé', hard:'Li ha costat', tapMode:'Toca la part pintada, escolta i repeteix.',
      noMic:'Sense micròfon: que ho llegeixi en veu alta i un adult toca.', words:'Paraules llegides', stageUp:'{0} paraules llegides!', stageSay:'Has llegit {0} paraules! Ara venen paraules més llargues.',
      st:'Paraules de {0} lletres', stMax:'Paraules llargues', next:'En falten {0} per a paraules més llargues',
      wsIntro:'Busca les paraules amagades. Passa el dit de la primera lletra a l’última.', wsLeft:'En falten {0}', wsAll:'Les has trobat totes!', wsHint:'Toca una paraula i t’ensenyo on comença.',
      level:'Nivell {0}', lvUp:'Has pujat al nivell {0}!', toNext:'Falten {0} punts per al nivell {1}', rankUp:'Ara ets {0}!', prog:'Els meus avenços', ranks:'Nivells', sopas:'Sopes de lletres resoltes', cards:'Cartes',
      r1:'Llavor', r2:'Espurna', r3:'Estrella', r4:'Cometa', r5:'Coet', r6:'Planeta', r7:'Galàxia', r8:'Llegenda',
      shRead:'Llegeix en veu alta', shReadNote:'Llegeix cada part i després tota la paraula. Pinta l’estrella quan l’hagis llegit.', shWs:'Troba les paraules amagades', shWsNote:'Encercla cada paraula. Ratlla-la de la llista quan la trobis.',
      row:'fila', col:'columna' },
 en:{ intro:'Read the coloured part. Then the whole word.', listen:"I'm listening…", think:'Thinking…', lumi:'Listen to Lumi…', you:'Your turn!', whole:'Now the whole word!',
      together:"Let's read it together.", help:'Help', skip:'Go on', again:'Again', readOk:'Read it well', hard:'It was hard', tapMode:'Tap the coloured part, listen and repeat.',
      noMic:'No microphone: read it out loud and a grown-up taps.', words:'Words read', stageUp:'{0} words read!', stageSay:'You read {0} words! Longer words are coming now.',
      st:'{0}-letter words', stMax:'Long words', next:'{0} to go for longer words',
      wsIntro:'Find the hidden words. Slide your finger from the first letter to the last.', wsLeft:'{0} to go', wsAll:'You found them all!', wsHint:'Tap a word and I will show you where it starts.',
      level:'Level {0}', lvUp:'You reached level {0}!', toNext:'{0} points to level {1}', rankUp:'Now you are {0}!', prog:'My progress', ranks:'Levels', sopas:'Word searches solved', cards:'Cards',
      r1:'Seed', r2:'Spark', r3:'Star', r4:'Comet', r5:'Rocket', r6:'Planet', r7:'Galaxy', r8:'Legend',
      shRead:'Read out loud', shReadNote:'Read each part and then the whole word. Colour the star when you have read it.', shWs:'Find the hidden words', shWsNote:'Circle each word. Cross it off the list when you find it.',
      row:'row', col:'column' }};
const t=k=>(TX[LG()]||TX.es)[k]||TX.es[k]||k;
const F=(s,...a)=>String(s).replace(/\{(\d)\}/g,(m,i)=>a[+i]!=null? a[+i] : '');
/* nombres de los juegos para el diccionario de index.html (la fuente es el castellano) */
const dict={
 ca:{'Leer palabras':'Llegir paraules','Sopa de letras':'Sopa de lletres','¡Encontraste todas las palabras!':'Has trobat totes les paraules!','Leer en voz alta':'Llegir en veu alta'},
 en:{'Leer palabras':'Read words','Sopa de letras':'Word search','¡Encontraste todas las palabras!':'You found all the words!','Leer en voz alta':'Read out loud'}};

/* ---------- palabras por idioma: SÍ-LA-BAS|dibujo ---------- */
const RAW={
es:`LA EL MI TU SÍ|👍 NO|🙅 YO|🙋 UN ME TE SU VA DA VE ES EN DE LO YA TÉ|☕
SOL|☀️ PAN|🍞 MAR|🌊 LUZ|💡 PIE|🦶 O-SO|🐻 U-VA|🍇 O-JO|👁️ A-LA|🪽 SAL|🧂 PEZ|🐟 RED|🥅 REY|🤴 DOS|2️⃣ U-NO|1️⃣ MES|📅 RÍ-O|🏞️ DÍ-A|🌞 TÍ-O|👨 TÍ-A|👩 A-VE|🐦 A-JO|🧄 O-LA|🌊 GOL|⚽ BUS|🚌 FIN|🏁 PAZ|🕊️ O-RO|🥇 U-ÑA|💅 MÁS|➕ HOY VOY SOY LAS LOS U-NA CON SIN POR MIL|💯 A-MO|❤️
MA-MÁ|👩 PA-PÁ|👨 CA-SA|🏠 GA-TO|🐱 PA-TO|🦆 MA-NO|✋ LU-NA|🌙 SO-PA|🍲 PE-LO|💇 DE-DO|☝️ NU-BE|☁️ RA-NA|🐸 VA-CA|🐄 LO-BO|🐺 TO-RO|🐂 PE-RA|🍐 BO-TA|👢 CO-CO|🥥 FO-CA|🦭 RO-SA|🌹 CA-MA|🛏️ MO-TO|🏍️ GO-TA|💧 TA-ZA|☕ CO-PA|🏆 DA-DO|🎲 LO-RO|🦜 MO-NO|🐒 SA-PO|🐸 BE-SO|💋 VE-LA|🕯️ MA-PA|🗺️ LU-PA|🔍 TA-CO|🌮 KI-WI|🥝 NI-ÑO|👦 NI-ÑA|👧 PI-ÑA|🍍 BE-BÉ|👶 SO-FÁ|🛋️ FLOR|🌸 TREN|🚂 A-GUA|💦 HO-LA|👋 O-CHO|8️⃣ DIEZ|🔟 SEIS|6️⃣ CO-CHE|🚗 BO-CA|👄 CA-RA|🙂 HA-DA|🧚 ZU-MO|🧃 LA-TA|🥫 MA-GO|🧙 NI-DO|🪹 PA-VO|🦃 PI-NO|🌲 RA-TA|🐀 RI-SA|😄 RO-PA|👕 TE-LE|📺 VA-SO|🥛 LE-ÓN|🦁 IS-LA|🏝️ AR-CO|🏹 BO-TE|⛵ PA-LA RA-MA|🌿 PU-MA|🐆 HI-JO|👦 MI-MO|🤗 SI-LLA|🪑
PE-RRO|🐶 LI-BRO|📖 LE-CHE|🥛 PO-LLO|🐥 QUE-SO|🧀 HUE-VO|🥚 TI-GRE|🐯 GLO-BO|🎈 PIZ-ZA|🍕 TAR-TA|🎂 CA-BRA|🐐 RA-TÓN|🐭 LI-MÓN|🍋 A-VIÓN|✈️ ZO-RRO|🦊 LÁ-PIZ|✏️ BAR-CO|⛵ PLA-TO|🍽️ DU-CHA|🚿 LLA-VE|🔑 GO-RRO|🧢 MAN-GO|🥭 RE-LOJ|⌚ RO-BOT|🤖 NIE-VE|❄️ PLA-YA|🏖️ ÁR-BOL|🌳 FUE-GO|🔥 RUE-DA|🛞 NA-RIZ|👃 CIN-CO|5️⃣ SIE-TE|7️⃣ NUE-VE|9️⃣ VER-DE|🟢 NE-GRO|⚫ PIA-NO|🎹 A-BE-JA|🐝 O-VE-JA|🐑 O-RE-JA|👂 A-RA-ÑA|🕷️ A-MI-GO|🤝 CIE-LO|🌤️ CAR-TA|✉️ TRES|3️⃣
PE-LO-TA|⚽ TO-MA-TE|🍅 PA-LO-MA|🕊️ BA-NA-NA|🍌 PA-YA-SO|🤡 CO-NE-JO|🐰 JI-RA-FA|🦒 PE-PI-NO|🥒 ZA-PA-TO|👞 CO-HE-TE|🚀 PÁ-JA-RO|🐦 CA-MI-SA|👕 CO-RO-NA|👑 PI-RA-TA|🏴‍☠️ HE-LA-DO|🍦 CA-MIÓN|🚚 DRA-GÓN|🐉 DEL-FÍN|🐬 TI-JE-RA|✂️ CO-CI-NA|🍳 SAN-DÍ-A|🍉 MU-ÑE-CA|🪆 ES-CO-BA|🧹 PUER-TA|🚪 LLU-VIA|🌧️ A-BUE-LO|👴 A-BUE-LA|👵 MÚ-SI-CA|🎵 CUA-TRO|4️⃣ ES-PE-JO|🪞 GA-LLE-TA|🍪
BA-LLE-NA|🐋 CA-BA-LLO|🐴 CE-BO-LLA|🧅 TOR-TU-GA|🐢 GA-LLI-NA|🐔 CA-ME-LLO|🐫 CU-CHA-RA|🥄 MO-CHI-LA|🎒 MAN-ZA-NA|🍎 NA-RAN-JA|🍊 CA-RA-COL|🐌 VEN-TA-NA|🪟 BO-TE-LLA|🍼 TI-BU-RÓN|🦈 CAN-GU-RO|🦘 BOM-BE-RO|🧑‍🚒 ES-CUE-LA|🏫 CA-MI-NO|🛣️ PE-LU-CHE|🧸 MON-TA-ÑA|⛰️
ES-TRE-LLA|⭐ GUI-TA-RRA|🎸 PIN-GÜI-NO|🐧 E-LE-FAN-TE|🐘 MA-RI-PO-SA|🦋 DI-NO-SAU-RIO|🦖 BI-CI-CLE-TA|🚲 CHO-CO-LA-TE|🍫 CO-CO-DRI-LO|🐊 PA-RA-GUAS|☂️ ZA-NA-HO-RIA|🥕 HE-LI-CÓP-TE-RO|🚁 TE-LÉ-FO-NO|📞 CA-LA-BA-ZA|🎃 MUR-CIÉ-LA-GO|🦇 HAM-BUR-GUE-SA|🍔 SE-MÁ-FO-RO|🚦 AS-TRO-NAU-TA|🧑‍🚀 U-NI-COR-NIO|🦄 AR-CO-Í-RIS|🌈 CA-RA-ME-LO|🍬 HI-PO-PÓ-TA-MO|🦛`,
ca:`EL LA UN MÀ|✋ PA|🍞 PI|🌲 SÍ|👍 NO|🙅 JO|🙋 TU TE|☕ OU|🥚 OS|🐻 ES EM ET HI VA DE
SOL|☀️ MAR|🌊 PEU|🦶 NAS|👃 GAT|🐱 GOS|🐶 POP|🐙 CUC|🪱 REI|🤴 RIU|🏞️ NIU|🪹 ULL|👁️ MEL|🍯 SAL|🧂 DIT|☝️ CEL|🌤️ BUS|🚌 DOS|2️⃣ SIS|6️⃣ SET|7️⃣ NOU|9️⃣ DEU|🔟 U-NA|1️⃣ A-VI|👴 O-CA|🪿 A-LA|🪽 NEU|❄️ NIT|🌙 DI-A|🌞 COR|❤️ GOL|⚽ FI|🏁 PAU|🕊️ MES|📅 AMB PER
CA-SA|🏠 LLUM|💡 TREN|🚂 PEIX|🐟 FLOR|🌸 GALL|🐓 NE-NA|👧 MA-RE|👩 PA-RE|👨 PO-MA|🍎 PE-RA|🍐 RO-DA|🛞 LLOP|🐺 VA-CA|🐄 MO-TO|🏍️ GO-TA|💧 CO-PA|🏆 SO-PA|🍲 RO-SA|🌹 FO-CA|🦭 MI-CO|🐒 I-LLA|🏝️ À-NEC|🦆 BLAU|🔵 VERD|🟢 CINC|5️⃣ VUIT|8️⃣ LLIT|🛏️ PONT|🌉 PORC|🐷 DRAC|🐉 LLE-Ó|🦁 DO-FÍ|🐬 CO-ET|🚀 A-VI-Ó|✈️ BO-CA|👄 CA-RA|🙂 FA-DA|🧚 LLO-RO|🦜 MA-PA|🗺️ NEN|👦 TAS-SA|☕ GOT|🥛 A-MIC|🤝
TAU-LA|🍽️ AR-BRE|🌳 LLU-NA|🌙 GE-LAT|🍦 TI-GRE|🐯 BAR-CA|⛵ PLU-JA|🌧️ POR-TA|🚪 ES-TEL|⭐ RO-BOT|🤖 CA-MI-Ó|🚚 PIZ-ZA|🍕 NÚ-VOL|☁️ LLI-MA|🍋 FOR-MI-GA|🐜 A-BE-LLA|🐝 O-VE-LLA|🐑 PI-A-NO|🎹 QUA-TRE|4️⃣ NE-GRE|⚫ CA-BRA|🐐 CLAU|🔑 FOC|🔥
GLO-BUS|🎈 PI-LO-TA|⚽ CO-NILL|🐰 LLI-BRE|📖 LLA-PIS|✏️ CA-VALL|🐴 PLAT-JA|🏖️ RA-TO-LÍ|🐭 GI-RA-FA|🦒 BA-LE-NA|🐋 ES-CO-LA|🏫 PLÀ-TAN|🍌 PIN-GÜÍ|🐧 CAR-GOL|🐌 SA-BA-TA|👞 CA-MI-SA|👕 CO-RO-NA|👑 PI-RA-TA|🏴‍☠️ MÚ-SI-CA|🎵 CUI-NA|🍳 PO-LLET|🐥 GUI-NEU|🦊 FOR-MAT-GE|🧀
GRA-NO-TA|🐸 TOR-TU-GA|🐢 E-LE-FANT|🐘 MA-DUI-XA|🍓 TA-RON-JA|🍊 SÍN-DRI-A|🍉 GA-LLI-NA|🐔 CU-LLE-RA|🥄 AM-PO-LLA|🍼 BOM-BER|🧑‍🚒 TI-SO-RES|✂️ MUN-TA-NYA|⛰️ GA-LE-TA|🍪
PA-PA-LLO-NA|🦋 TO-MÀ-QUET|🍅 XO-CO-LA-TA|🍫 BI-CI-CLE-TA|🚲 DI-NO-SAU-RE|🦖 GUI-TAR-RA|🎸 PA-LLAS-SO|🤡 FI-NES-TRA|🪟 MOT-XI-LLA|🎒 CO-CO-DRIL|🐊 PA-RAI-GUA|☂️ PAS-TA-NA-GA|🥕 HE-LI-CÒP-TER|🚁 TE-LÈ-FON|📞 CA-RA-BAS-SA|🎃 HAM-BUR-GUE-SA|🍔 SE-MÀ-FOR|🚦 AS-TRO-NAU-TA|🧑‍🚀 U-NI-CORN|🦄 CA-RA-MEL|🍬`,
en:`GO NO|🙅 ME|🙋 WE HE UP|⬆️ IN ON IT IS MY SO AT AN BE DO TO US
CAT|🐱 DOG|🐶 SUN|☀️ HAT|🎩 BUS|🚌 PIG|🐷 BED|🛏️ CUP|☕ BEE|🐝 COW|🐄 FOX|🦊 HEN|🐔 BAT|🦇 BOX|📦 CAR|🚗 EGG|🥚 EYE|👁️ KEY|🔑 LEG|🦵 MAP|🗺️ NET|🥅 OWL|🦉 PEN|🖊️ RED|🔴 SEA|🌊 TEN|🔟 TOY|🧸 ANT|🐜 ARM|💪 ICE|🧊 PAN|🍳 VAN|🚐 WEB|🕸️ MUM|👩 DAD|👨 ONE|1️⃣ TWO|2️⃣ SIX|6️⃣
FISH|🐟 FROG|🐸 DUCK|🦆 BEAR|🐻 BIRD|🐦 BOOK|📖 BALL|⚽ CAKE|🎂 STAR|⭐ MOON|🌙 TREE|🌳 SHIP|🚢 BOAT|⛵ DOOR|🚪 HAND|✋ FOOT|🦶 MILK|🥛 RAIN|🌧️ SNOW|❄️ LI-ON|🦁 KING|🤴 RING|💍 DRUM|🥁 KITE|🪁 GOAT|🐐 WOLF|🐺 CRAB|🦀 NOSE|👃 BLUE|🔵 FIVE|5️⃣ FOUR|4️⃣ NINE|9️⃣ BA-BY|👶 ROSE|🌹 LEAF|🍃 CORN|🌽 PEAR|🍐 SOCK|🧦 SHOE|👞 COAT|🧥 BELL|🔔 FIRE|🔥
AP-PLE|🍎 TI-GER|🐯 RO-BOT|🤖 HORSE|🐴 MOUSE|🐭 SHEEP|🐑 SNAKE|🐍 WHALE|🐋 ZE-BRA|🦓 HOUSE|🏠 TRAIN|🚂 PLANE|✈️ TRUCK|🚚 CHAIR|🪑 CLOCK|⏰ SPOON|🥄 BREAD|🍞 PIZ-ZA|🍕 LEM-ON|🍋 WA-TER|💧 CLOUD|☁️ SMILE|😄 GREEN|🟢 SEV-EN|7️⃣ EIGHT|8️⃣ THREE|3️⃣ HAP-PY|😀 PAN-DA|🐼 CAN-DY|🍬 PUP-PY|🐶
RAB-BIT|🐰 MON-KEY|🐒 BA-NA-NA|🍌 OR-ANGE|🍊 FLOW-ER|🌸 ROCK-ET|🚀 DRAG-ON|🐉 PI-RATE|🏴‍☠️ GUI-TAR|🎸 PEN-CIL|✏️ WIN-DOW|🪟 CHEESE|🧀 TUR-TLE|🐢 SPI-DER|🕷️ CAR-ROT|🥕 TO-MA-TO|🍅 BUT-TER|🧈 YEL-LOW|🟡 KIT-TEN|🐱 SCHOOL|🏫
DOL-PHIN|🐬 GI-RAFFE|🦒 PEN-GUIN|🐧 CHICK-EN|🐔 RAIN-BOW|🌈 U-NI-CORN|🦄 BI-CY-CLE|🚲 MON-STER|👾 COOK-IE|🍪 BAL-LOON|🎈
EL-E-PHANT|🐘 DI-NO-SAUR|🦖 BUT-TER-FLY|🦋 UM-BREL-LA|☂️ CROC-O-DILE|🐊 CHOC-O-LATE|🍫 HEL-I-COP-TER|🚁 HAM-BUR-GER|🍔 STRAW-BER-RY|🍓 KAN-GA-ROO|🦘 AS-TRO-NAUT|🧑‍🚀 TEL-E-PHONE|📞 MOUN-TAIN|⛰️ SAND-WICH|🥪 BACK-PACK|🎒`};
const flat=s=>String(s).normalize('NFD').replace(/[̀-̂̄-̨̦-ͯ]/g,'').normalize('NFC').toUpperCase();   /* sin acentos, pero la Ñ (tilde ̃) y la Ç quedan */
const letters=w=>flat(w).replace(/[^A-ZÑÇ]/g,'');
const LISTS={};
function words(lang){ lang=lang||LG(); if(LISTS[lang]) return LISTS[lang]; const seen=new Set(); const out=[];
  (RAW[lang]||RAW.es).split(/\s+/).filter(Boolean).forEach(tok=>{ const [a,e]=tok.split('|'); const s=a.split('-'); const w=s.join(''); if(seen.has(w)) return; seen.add(w);
    out.push({w, s, e:e||'', n:letters(w).length, g:letters(w)}); });
  return (LISTS[lang]=out); }

/* ---------- etapas de lectura: cada 50 palabras leídas, palabras con más letras ---------- */
const STEP=50, STAGES=6;
const stageOf=n=>Math.max(1,Math.min(STAGES, 1+Math.floor((n||0)/STEP)));
const STAGE_LEN=[null,[2,4],[3,5],[4,6],[5,7],[6,8],[7,9]];
function stageLabel(st){ return st>=STAGES? t('stMax') : F(t('st'), STAGE_LEN[st][0]+'–'+STAGE_LEN[st][1]); }
function sessionLens(n){ const st=stageOf(n), k=(n||0)%STEP;
  if(st===1) return k<17? [2,2,3,3,3,4] : k<34? [2,3,3,4,4,4] : [3,3,4,4,4,4];
  const top=STAGE_LEN[st][1]; return [top-2, top-1, top-1, top, top, top]; }
function shuffled(a, r){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function pickWords(n, recent, r, lang){ r=r||Math.random; const W=words(lang); const rec=new Set(recent||[]); const used=new Set(); const out=[];
  sessionLens(n).forEach(len=>{ const fit=x=> len>=8? x.n>=8 : x.n===len; let pool=shuffled(W.filter(x=>fit(x) && !used.has(x.w)), r);
    if(!pool.length) pool=shuffled(W.filter(x=>Math.abs(x.n-len)<=1 && !used.has(x.w)), r); if(!pool.length) return;
    const pic=r()<.8; const w=pool.find(x=>!rec.has(x.w) && (!pic || x.e)) || pool.find(x=>!rec.has(x.w)) || pool[0]; used.add(w.w); out.push(w); });
  return out; }

/* ---------- comparar lo que oyó con la palabra (amable con un niño que empieza a leer) ---------- */
function phon(s, lang){ s=String(s).toLowerCase().normalize('NFD').replace(/[̀-̂̄-̨̦-ͯ]/g,'').normalize('NFC').replace(/[^a-zñç]/g,'');
  if((lang||LG())==='es') s=s.replace(/h/g,'').replace(/v/g,'b').replace(/z/g,'s').replace(/c(?=[ei])/g,'s').replace(/qu/g,'k').replace(/c/g,'k').replace(/ll/g,'y').replace(/gu(?=[ei])/g,'g').replace(/w/g,'u').replace(/x/g,'ks').replace(/(.)\1+/g,'$1');
  else if((lang||LG())==='ca') s=s.replace(/h/g,'').replace(/v/g,'b').replace(/ç/g,'s').replace(/(.)\1+/g,'$1');
  return s; }
function lev(a,b){ const m=a.length,n=b.length; if(!m) return n; if(!n) return m; let p=Array.from({length:n+1},(_,j)=>j); for(let i=1;i<=m;i++){ const c=[i]; for(let j=1;j<=n;j++) c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1)); p=c; } return p[n]; }
/* devuelve 'word' (dijo la palabra), 'parts' (dijo las partes por separado) o '' */
/* casi: empieza igual y se parece (un error más que lo permitido) */
function near(word, heard){ const a=phon(word); return String(heard||'').split(/\s+/).map(phon).filter(Boolean).some(b=> b[0]===a[0] && lev(a,b)<=(a.length<=4?1:a.length<=7?2:3)); }
function judge(word, heard, lang){ const tg=phon(word, lang); if(!tg) return 'word';
  const C=core(); const toks=(C.heardWords? C.heardWords(heard) : String(heard).split(/\s+/)).map(x=>phon(x, lang)).filter(Boolean); if(!toks.length) return '';
  const tol= tg.length<=4? 0 : tg.length<=7? 1 : 2;
  const near=c=> c===tg || lev(c,tg)<=tol || (tg.length>=2 && c.length>tg.length && c.length-tg.length<=2 && c.startsWith(tg)) || (tg.length>=5 && tg.startsWith(c) && tg.length-c.length<=1);
  if(toks.some(near)) return 'word';
  for(let i=0;i<toks.length;i++){ let j=toks[i]; for(let k=i+1;k<Math.min(toks.length,i+5);k++){ j+=toks[k]; if(near(j)) return 'parts'; } }
  return ''; }

/* ---------- niveles de explorador (según los puntos) ---------- */
const need=lv=>150+50*(lv-1);
const RANKS=[[1,'🌱','r1'],[3,'✨','r2'],[6,'⭐','r3'],[10,'☄️','r4'],[15,'🚀','r5'],[20,'🪐','r6'],[30,'🌌','r7'],[40,'👑','r8']];
function rank(points){ let lv=1, left=Math.max(0,Math.floor(points||0)); while(left>=need(lv) && lv<999){ left-=need(lv); lv++; }
  let k=0; RANKS.forEach((x,i)=>{ if(lv>=x[0]) k=i; }); return {lv, into:left, need:need(lv), icon:RANKS[k][1], title:t(RANKS[k][2]), k}; }

/* ---------- letras para trazar: cada vez más pequeñas ---------- */
function traceScale(save, level){ const L=(save&&save.letters)||{}; const total=Object.values(L).reduce((a,b)=>a+(+b||0),0); const age=(save&&save.settings&&save.settings.age)||5;
  const steps=Math.floor(total/10)+Math.max(0,(level||1)-1)+(age>=6? 3 : age>=5? 1 : 0); return Math.max(.36, 1-.08*steps); }
const traceTol=(tol, sc)=>tol*(1+(1-sc)*.7);

/* ---------- guardar el avance (dentro de record de index.html) ---------- */
function onRecord(n, game, extra){ const x=extra&&extra.leer; if(game==='readw'){ const r=n.readw=n.readw||{n:0}; if(x){ r.n=(r.n||0)+(x.ok||0); r.rec=[...(x.words||[]), ...(r.rec||[])].slice(0,60); r.plays=(r.plays||0)+1; }
    n.levels.readw=stageOf(r.n); }
  if(game==='wsearch' && x){ const w=n.wsearch=n.wsearch||{}; w.n=(w.n||0)+1; w.words=(w.words||0)+(x.found||0); } }

/* ---------- estilos ---------- */
const CSS=`
.ll-read{gap:clamp(8px,2vmin,18px)}
.ll-count{display:flex; align-items:center; gap:10px; background:var(--card); border-radius:999px; padding:6px 16px; box-shadow:0 3px 0 var(--line); font-weight:800; font-size:clamp(14px,2.2vmin,18px); max-width:94vw}
.ll-count .bar{width:clamp(90px,22vw,220px); height:12px; border-radius:8px; background:#E3EAF4; overflow:hidden} .ll-count .bar i{display:block; height:100%; border-radius:8px; background:linear-gradient(90deg,#FFB300,#FF7043); transition:width .6s}
.ll-pic{font-family:var(--f-emoji); font-size:clamp(64px,15vmin,130px); line-height:1.1; min-height:1.15em; transition:filter .4s, transform .4s}
.ll-pic.hid{filter:blur(14px) grayscale(1) opacity(.35); transform:scale(.8)} .ll-pic.pop{animation:ll-pop .6s both}
.ll-word{display:flex; justify-content:center; flex-wrap:wrap; font-family:var(--f-display); font-weight:800; font-size:clamp(54px,15vmin,150px); line-height:1.05; letter-spacing:.03em; text-transform:uppercase; user-select:none; -webkit-user-select:none; max-width:96vw}
.ll-word.long{font-size:clamp(38px,9.5vmin,104px)} .ll-word.xl{font-size:clamp(30px,7vmin,78px)}
.ll-syl{position:relative; padding:0 .06em .16em; color:#B4C0D4; border:none; background:none; font:inherit; letter-spacing:inherit; transition:color .25s, transform .25s; cursor:pointer}
.ll-syl::after{content:''; position:absolute; left:.1em; right:.1em; bottom:0; height:.09em; border-radius:.06em; background:currentColor; opacity:.55}
.ll-syl.cur{color:#2962FF; animation:ll-bob 1s ease-in-out infinite} .ll-syl.cur::after{opacity:1}
.ll-syl.model{color:#F4511E; transform:scale(1.08)} .ll-syl.done{color:#1DB954} .ll-syl.miss{color:#8A97AD}
.ll-word.all .ll-syl.cur{animation:none} .ll-word.all{animation:ll-bob 1.1s ease-in-out infinite}
.ll-word.good .ll-syl{color:#1DB954; animation:none} .ll-word.good{animation:ll-pop .5s both}
.ll-mic{display:flex; align-items:center; gap:12px; min-height:64px; font-weight:800; font-size:clamp(17px,2.8vmin,24px); color:var(--ink-2)}
.ll-ear{width:58px; height:58px; border-radius:50%; display:grid; place-items:center; font-size:30px; background:var(--card); box-shadow:0 0 0 4px rgba(29,185,84,.25); transition:box-shadow .08s; flex:none}
.ll-ear.off{box-shadow:0 0 0 4px #E3EAF4; filter:grayscale(1); opacity:.7}
.ll-acts{display:flex; gap:10px; flex-wrap:wrap; justify-content:center}
.ll-stage{position:fixed; inset:0; z-index:80; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; text-align:center; padding:20px; background:radial-gradient(circle at 50% 45%, rgba(255,214,79,.96), rgba(255,138,0,.96) 75%); animation:ll-fade .3s both}
.ll-stage b{font-family:var(--f-display); font-size:clamp(30px,8vmin,72px); color:#fff; text-shadow:0 4px 0 rgba(0,0,0,.2); line-height:1.1; animation:ll-pop .6s both}
.ll-stage span{font-size:clamp(70px,20vmin,170px); animation:ll-pop .6s .1s both} .ll-stage p{margin:0; color:#5D2E00; font-weight:800; font-size:clamp(18px,3.4vmin,28px)}

.ws{display:flex; gap:clamp(10px,2.4vmin,24px); align-items:center; justify-content:center; width:100%; flex:1; min-height:0}
.ws-wrap{flex:1; min-width:0; min-height:0; align-self:stretch; display:grid; place-items:center}
.ws-grid{position:relative; display:grid; background:var(--card); border-radius:22px; box-shadow:0 6px 0 var(--line); touch-action:none; user-select:none; -webkit-user-select:none; padding:6px; box-sizing:border-box}
.ws-grid span{display:grid; place-items:center; font-family:var(--f-display); font-weight:800; color:var(--ink); text-transform:uppercase; line-height:1; position:relative; z-index:1; pointer-events:none}
.ws-grid span.h{animation:ll-pulse .5s ease-in-out 5; color:#D81B60}
.ws-grid svg{position:absolute; inset:6px; width:calc(100% - 12px); height:calc(100% - 12px); pointer-events:none; overflow:visible}
.ws-grid.bad{animation:ll-shake .35s}
.ws-list{display:flex; flex-direction:column; gap:8px; flex:none; max-height:100%; overflow-y:auto; padding:4px}
.ws-w{display:flex; align-items:center; gap:8px; border:none; background:var(--card); border-radius:16px; padding:6px 14px; box-shadow:0 3px 0 var(--line); font-family:var(--f-display); font-weight:800; font-size:clamp(18px,3.2vmin,30px); color:var(--ink); text-transform:uppercase; cursor:pointer; letter-spacing:.04em}
.ws-w i{font-style:normal; font-family:var(--f-emoji); font-size:1.15em} .ws-w.ok{background:var(--leaf-2); color:#128A3D; text-decoration:line-through; box-shadow:none}
@media (orientation:portrait), (max-width:700px){ .ws{flex-direction:column} .ws-list{flex-direction:row; flex-wrap:wrap; justify-content:center; max-height:none; overflow:visible} .ws-w{font-size:clamp(16px,4vw,26px); padding:5px 12px} }

.lv-bar{display:flex; align-items:center; gap:10px; background:var(--card); border-radius:999px; padding:5px 14px 5px 6px; box-shadow:0 3px 0 var(--line); font-weight:800; font-size:clamp(13px,2vmin,17px); min-width:0; border:none; color:var(--ink); font-family:inherit; cursor:pointer; text-align:left}
.lv-bar .ic{width:38px; height:38px; border-radius:50%; display:grid; place-items:center; font-size:22px; background:linear-gradient(135deg,#FFE082,#FFB300); flex:none; font-family:var(--f-emoji)}
.lv-bar .tx{display:flex; flex-direction:column; gap:3px; min-width:0; flex:1} .lv-bar .tx b{white-space:nowrap; overflow:hidden; text-overflow:ellipsis}
.lv-bar .tr{height:10px; border-radius:6px; background:#E3EAF4; overflow:hidden; min-width:90px} .lv-bar .tr i{display:block; height:100%; border-radius:6px; background:linear-gradient(90deg,#7B5CFF,#00B8D4); transition:width 1.1s cubic-bezier(.2,.8,.2,1)}
.lv-bar .nx{color:var(--ink-2); font-size:.85em; white-space:nowrap; flex:none}
.lv-bar.big{padding:8px 18px 8px 8px; width:min(520px,90vw); font-size:clamp(15px,2.4vmin,20px)} .lv-bar.big .ic{width:50px; height:50px; font-size:30px} .lv-bar.big .tr{height:14px}
.lv-up{display:flex; flex-direction:column; align-items:center; gap:4px; animation:ll-pop .7s .5s both}
.lv-up b{font-family:var(--f-display); font-size:clamp(26px,5.6vmin,44px); color:#fff; background:linear-gradient(135deg,#7B5CFF,#D81B60); padding:4px 22px; border-radius:999px; box-shadow:0 5px 0 rgba(0,0,0,.18)}
.lv-prog{text-align:center; margin:2px 0 14px; display:flex; flex-direction:column; align-items:center; gap:8px}
.lv-ladder{display:flex; flex-wrap:wrap; gap:8px; justify-content:center; max-width:560px}
.lv-ladder span{display:flex; flex-direction:column; align-items:center; gap:1px; width:62px; padding:6px 2px; border-radius:14px; background:#EEF2F8; font-size:11px; font-weight:800; color:var(--ink-2); opacity:.55}
.lv-ladder span i{font-style:normal; font-size:26px; font-family:var(--f-emoji); filter:grayscale(1)} .lv-ladder span.on{background:#FFF3C4; opacity:1; color:var(--ink)} .lv-ladder span.on i{filter:none} .lv-ladder span.now{outline:3px solid #FFB300}
.lv-facts{display:flex; flex-wrap:wrap; gap:8px; justify-content:center}
@keyframes ll-bob{0%,100%{transform:translateY(0)} 50%{transform:translateY(-.05em)}}
@keyframes ll-pop{0%{transform:scale(.4); opacity:0} 70%{transform:scale(1.12); opacity:1} 100%{transform:scale(1)}}
@keyframes ll-fade{from{opacity:0} to{opacity:1}}
@keyframes ll-pulse{0%,100%{transform:scale(1)} 50%{transform:scale(1.5)}}
@keyframes ll-shake{0%,100%{transform:translateX(0)} 25%{transform:translateX(-7px)} 75%{transform:translateX(7px)}}
@media (prefers-reduced-motion: reduce){ .ll-syl.cur,.ll-word.all{animation:none} }
`;
function injectCss(){ if(document.getElementById('ll-css')) return; const s=document.createElement('style'); s.id='ll-css'; s.textContent=CSS; document.head.appendChild(s); }
if(document.head) injectCss(); else document.addEventListener('DOMContentLoaded', injectCss);

/* ================= Leer palabras ================= */
function ReadWords({api, save}){ const React=R(), h=H(), C=core(); const {useState, useEffect, useRef, useMemo}=React;
  const n0=(save.readw&&save.readw.n)||0;
  const items=useMemo(()=>{ const q=/[?&]leer=([^&]+)/.exec(location.search);      /* ?leer=MA-NO,SOL para probar con palabras elegidas */
    if(q){ const l=decodeURIComponent(q[1]).toUpperCase().split(',').filter(Boolean).map(a=>{ const s=a.split('-'), w=s.join(''); const k=words().find(x=>x.w===w); return k||{w, s, e:'', n:letters(w).length, g:letters(w)}; }); if(l.length) return l; }
    return pickWords(n0, save.readw&&save.readw.rec); },[]);
  const S=useRef({i:0, step:0, tryN:0, nudge:0, okN:0, readN:0, read:[], att:null, alive:true, seq:0}).current;
  const [, bump]=useState(0); const re=()=>bump(x=>x+1);
  const [phase,setPhase]=useState('wait');     /* wait | listen | think | model | good | tap */
  const [lvl,setLvl]=useState(0); const [mk,setMk]=useState(-1); const [up,setUp]=useState(0);
  const hasMic=!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && C.micListen);
  const mic=useRef(hasMic);
  const W=()=>items[Math.min(S.i, items.length-1)]; const STEPS=()=>{ const x=W(); return x.s.length>1? x.s.length+1 : 1; }; const LAST=()=>STEPS()-1;   /* siempre la palabra actual (las funciones de abajo viven más que un render) */
  const w=W(); const steps=STEPS(); const last=steps-1;
  const sayRaw=p=>C.Voice? C.Voice.say(p) : Promise.resolve();
  const low=s=>String(s).toLowerCase();
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  useEffect(()=>{ S.alive=true; try{ if(C.OIDO && C.OIDO.usable() && !C.OIDO.asrOk) C.OIDO.loadAsr().catch(()=>{}); }catch(e){}
    try{ C.Voice && C.Voice.prep && C.Voice.prep(items.flatMap(x=>[low(x.w), ...(x.s.length>1? x.s.map(low) : [])])); }catch(e){}
    (async()=>{ await sleep(350); if(!S.alive) return; try{ await api.say(t('intro')); }catch(e){} if(S.alive) listen(); })();
    return ()=>{ S.alive=false; S.seq++; closeMic(); try{ C.Voice && C.Voice.stop(); }catch(e){} }; },[]);
  useEffect(()=>{ api.setProg(S.i/items.length); },[S.i]);

  function closeMic(){ const A=S.att; S.att=null; if(A){ try{ A.kill(); }catch(e){} } try{ C.micOff && C.micOff(); }catch(e){} }
  async function listen(){ if(!S.alive) return; const my=++S.seq;
    if(!mic.current){ setPhase('tap'); return; }
    setPhase('wait'); try{ await C.whenQuiet(()=>S.alive && my===S.seq); }catch(e){} if(!S.alive || my!==S.seq) return; open(my); }
  function open(my){ closeMic(); try{ C.micOn(); }catch(e){} setPhase('listen'); setLvl(0);
    const t0=Date.now(); let run=0, inSeg=false, lastOn=0, segs=0, wordSeg=false, stepAt=t0, ended=false, why='', tFirst=0, tSeg=0, tWord=0;
    const finish=y=>{ if(ended) return; ended=true; why=y; try{ L.stop(); }catch(e){} };
    const L=C.micListen({ endSil:()=>5000, cap:26000, noSpeech:8000,
      onLevel:(v,on)=>{ if(!S.alive || my!==S.seq || ended) return; setLvl(v); const now=Date.now(); const gap= S.step>=LAST()? 650 : 330;
        if(on){ if(!run) tSeg=now-60; run+=60; lastOn=now; if(run>=120 && !inSeg){ inSeg=true; if(!tFirst) tFirst=tSeg; if(S.step>=LAST()) tWord=tSeg; } }
        else if(inSeg){ if(now-lastOn>=gap){ inSeg=false; run=0; segs++; if(S.step<LAST()){ S.step++; stepAt=now; re(); } else { wordSeg=true; finish('word'); } } }
        else { if(now-lastOn>400) run=0; if(segs>0 && now-Math.max(lastOn,stepAt)>2700) finish('idle'); } },
      onEnd:({audio, heard, why:y0})=>{ try{ C.micOff(); }catch(e){} if(S.att && S.att.L===L) S.att=null; if(!S.alive || my!==S.seq) return; setLvl(0);
        const y= why || y0;
        if(String(y0).startsWith('error')){ mic.current=false; setPhase('tap'); return; }
        if(!heard || !audio || !segs){ fail(my, true); return; }
        /* al oído le llega solo la palabra entera (las sílabas sueltas lo confunden) */
        let a=audio; if(wordSeg && tWord>tFirst){ const from=Math.floor((tWord-tFirst+350-320)*16); if(from>0 && a.length-from>4000) a=a.subarray(from); }
        evaluate(my, a, y, wordSeg); } });
    S.att={L, kill:()=>{ ended=true; try{ L.stop(); }catch(e){} }}; }
  async function evaluate(my, audio, why, wordSeg){ const O=C.OIDO; let res=null;
    if(O && O.usable() && O.asrOk){ setPhase('think'); try{ const r=await Promise.race([O.hear(audio, 4, C.asrPrompt? C.asrPrompt(W().w) : low(W().w)), sleep(12000).then(()=>null)]); if(r && typeof r.text==='string'){ res=judge(W().w, r.text);
        /* el oído se confunde con palabras sueltas y voces de niño: si no entendió nada parecido, la segunda vez vale haberla dicho entera */
        if(!res && (/^\s*[\[(]/.test(r.text) || !phon(r.text))) res=null; else if(!res && wordSeg && (S.tryN>=1 || near(W().w, r.text))) res='word'; window.LumiLeer.last={w:W().w, heard:r.text, res, why}; } }catch(e){ res=null; } }
    if(!S.alive || my!==S.seq) return;
    if(res===null) res= wordSeg? 'word' : (why==='idle' && S.step>=LAST())? 'parts' : '';      /* sin oído: vale haber dicho todas las partes y la palabra */
    if(res==='word' || (res==='parts' && wordSeg)){ good(my); return; }
    if(res==='parts' && S.nudge<1){ S.nudge++; S.step=LAST(); re(); setPhase('wait'); await sayRaw(t('whole')); if(S.alive && my===S.seq) listen(); return; }
    fail(my, false); }
  async function good(my){ const first=S.tryN===0; S.readN++; if(first) S.okN++; S.read.push(W().w); S.step=STEPS(); setPhase('good'); re(); api.sfx('ok'); if(api.hit) api.hit(W().w);
    const tot=n0+S.readN; const stUp= tot%STEP===0 && stageOf(tot)>stageOf(tot-1);
    await sayRaw([C.pick? C.pick(C.PRAISE) : '', low(W().w)]); if(!S.alive || my!==S.seq) return;
    if(stUp){ setUp(tot); api.sfx('star'); await sayRaw(F(t('stageSay'), tot)); await sleep(700); if(!S.alive || my!==S.seq) return; setUp(0); }
    else await sleep(450);
    nextWord(my); }
  function nextWord(my){ if(!S.alive || my!==S.seq) return; if(S.i+1>=items.length){ S.seq++; api.setProg(1); api.done(S.okN, items.length, {leer:{ok:S.readN, words:S.read}}); return; }
    S.i++; S.step=0; S.tryN=0; S.nudge=0; setMk(-1); setPhase('wait'); re(); listen(); }
  async function fail(my, silent){ S.tryN++; if(api.miss && S.tryN===1) api.miss(W().w);
    if(S.tryN>=3){ await model(my, t('together')); if(!S.alive || my!==S.seq) return; S.step=STEPS(); setPhase('good'); re(); await sleep(600); nextWord(my); return; }
    await model(my, null); if(!S.alive || my!==S.seq) return; S.step=0; S.nudge=0; re(); await sayRaw(t('you')); if(S.alive && my===S.seq) listen(); }
  /* Lumi la lee parte por parte, pintando cada una, y después toda junta */
  async function model(my, lead){ closeMic(); setPhase('model'); setMk(-1); if(lead) await sayRaw(lead);
    if(W().s.length>1){ for(let k=0;k<W().s.length;k++){ if(!S.alive || my!==S.seq) return; setMk(k); await sayRaw(low(W().s[k])); await sleep(220); } }
    if(!S.alive || my!==S.seq) return; setMk(99); await sayRaw(low(W().w)); await sleep(250); setMk(-1); }
  async function helpNow(){ const my=++S.seq; closeMic(); await model(my, null); if(!S.alive || my!==S.seq) return; S.step=0; S.nudge=0; re(); if(mic.current){ await sayRaw(t('you')); if(S.alive && my===S.seq) listen(); } else setPhase('tap'); }
  function skip(){ const my=++S.seq; closeMic(); try{ C.Voice.stop(); }catch(e){} api.sfx('tap'); nextWord(my); }
  /* sin micrófono: tocar cada parte (Lumi la dice) y un adulto confirma */
  async function tapSyl(k){ if(phase!=='tap'){ if(phase==='model') return; const my=++S.seq; closeMic(); setPhase('model'); setMk(k); await sayRaw(low(k>=W().s.length? W().w : W().s[k])); if(!S.alive || my!==S.seq) return; setMk(-1); listen(); return; }
    if(k!==S.step && !(S.step>=LAST())) return; const my=S.seq; setMk(S.step>=LAST()? 99 : k); await sayRaw(low(S.step>=LAST()? W().w : W().s[k])); if(!S.alive || my!==S.seq) return; setMk(-1); if(S.step<LAST()){ S.step++; re(); } }

  const tot=n0+S.readN; const into=tot%STEP; const stage=stageOf(tot);
  const cls=k=>{ if(mk===99 || mk===k) return 'model'; if(phase==='good') return 'done'; if(S.step>=last && steps>1) return 'cur'; if(k<S.step) return 'done'; if(k===S.step) return 'cur'; return ''; };
  const size= w.n>=9? ' xl' : w.n>=6? ' long' : '';
  const ring= phase==='listen'? {boxShadow:`0 0 0 ${4+Math.round(lvl*20)}px rgba(29,185,84,${(.25+lvl*.35).toFixed(2)})`} : null;
  const status= phase==='listen'? t('listen') : phase==='think'? t('think') : phase==='model'? t('lumi') : phase==='tap'? t('tapMode') : '';
  return h`<div className="stage ll-read">
    <div className="ll-count" data-noread><span>📚 ${t('words')}: ${tot}</span>${stage<STAGES && h`<div className="bar" title=${F(t('next'), STEP-into)}><i style=${{width:(into/STEP*100)+'%'}}></i></div>`}<span>${stage<STAGES? into+'/'+STEP : '🏅'}</span></div>
    <div className=${'ll-pic'+(phase==='good'? ' pop' : ' hid')} aria-hidden="true">${w.e||'⭐'}</div>
    <div className=${'ll-word'+size+(phase==='good'?' good':'')+(S.step>=last && steps>1 && phase!=='good'?' all':'')} data-noread data-notr aria-label=${w.w}>
      ${w.s.map((s,k)=>h`<button key=${S.i+'-'+k} className=${'ll-syl '+cls(k)} onClick=${()=>tapSyl(S.step>=last? w.s.length : k)}>${s}</button>`)}</div>
    <div className="ll-mic" data-noread><div className=${'ll-ear'+(phase==='listen'?'':' off')} style=${ring}>${phase==='think'? '🤔' : phase==='model'? '🔊' : '👂'}</div><span>${status}</span></div>
    <div className="ll-acts">
      <button className="btn soft small" disabled=${phase==='model'||phase==='good'||phase==='think'} onClick=${()=>{ try{ C.Sfx.unlock(); }catch(e){} helpNow(); }}>🔊 ${t('help')}</button>
      ${phase==='tap' && S.step>=last && h`<button className="btn small" onClick=${()=>{ const my=++S.seq; good(my); }}>✅ ${t('readOk')}</button>`}
      ${(phase==='tap' || S.tryN>=1) && phase!=='good' && h`<button className="btn soft small" onClick=${skip}>${t('skip')} ▶</button>`}
    </div>
    ${phase==='tap' && !mic.current && h`<p className="small muted" data-noread>${t('noMic')}</p>`}
    ${up>0 && h`<div className="ll-stage"><span>🏅</span><b>${F(t('stageUp'), up)}</b><p>${stageLabel(stageOf(up))}</p></div>`}
  </div>`; }

/* ================= Sopa de letras ================= */
/* [tamaño, palabras, letras mín, letras máx, direcciones]  h=→  v=↓  d=↘↗  r=al revés */
const WS_CFG=[null,[5,3,3,4,'h'],[6,4,3,4,'h'],[6,4,3,5,'hv'],[7,5,3,5,'hv'],[8,6,3,6,'hv'],[8,6,4,7,'hvd'],[9,7,4,8,'hvd'],[10,8,4,8,'hvd'],[10,8,4,9,'hvdr'],[11,9,4,10,'hvdr'],[12,10,5,11,'hvdr'],[12,12,5,12,'hvdr']];
const WS_COL=['#FF7043','#29B6F6','#66BB6A','#FBC02D','#AB47BC','#EC407A','#26A69A','#8D6E63','#5C6BC0','#FFA726','#7CB342','#00ACC1'];
const ABC={es:'AAAAEEEEIIOOOUUBCDFGJLLMMNNPPRRSSTTVZ', ca:'AAAAEEEEIIOOOUUBCDFGJLLMMNNPPRRSSTTVX', en:'AAAEEEEIIOOOUUBCDFGHKLLMMNNPPRRSSTTWY'};
function dirsFor(code){ const d=[]; if(code.includes('h')) d.push([1,0]); if(code.includes('v')) d.push([0,1]); if(code.includes('d')) d.push([1,1],[1,-1]);
  if(code.includes('r')) d.slice().forEach(([x,y])=>d.push([-x,-y])); return d; }
function lineStr(g, n, a, dx, dy, len){ let s=''; let x=a%n, y=Math.floor(a/n); for(let k=0;k<len;k++){ if(x<0||y<0||x>=n||y>=n) return null; s+=g[y*n+x]; x+=dx; y+=dy; } return s; }
function countWord(g, n, wd){ let c=0; const D=[[1,0],[0,1],[1,1],[1,-1],[-1,0],[0,-1],[-1,-1],[-1,1]]; for(let a=0;a<n*n;a++) for(const [dx,dy] of D){ if(lineStr(g,n,a,dx,dy,wd.length)===wd) c++; } return wd===wd.split('').reverse().join('')? c/2 : c; }
function makeSearch(level, r, lang, over){ r=r||Math.random; lang=lang||LG(); const cfg=(over||WS_CFG[Math.max(1,Math.min(12,level||1))]); const [n,k,mn,mx,code]=cfg; const dirs=dirsFor(code);
  const pool=shuffled(words(lang).filter(x=>x.e && x.g.length>=mn && x.g.length<=Math.min(mx,n) && x.g.length===x.n), r);
  for(let attempt=0; attempt<40; attempt++){ const g=Array(n*n).fill(''); const placed=[]; const cand=shuffled(pool, r);
    for(const wd of cand){ if(placed.length>=k) break; if(placed.some(p=>p.g.includes(wd.g) || wd.g.includes(p.g))) continue; let ok=false;
      for(let tr=0; tr<60 && !ok; tr++){ const [dx,dy]=dirs[Math.floor(r()*dirs.length)]; const L=wd.g.length;
        const x0= dx>0? Math.floor(r()*(n-L+1)) : dx<0? L-1+Math.floor(r()*(n-L+1)) : Math.floor(r()*n); const y0= dy>0? Math.floor(r()*(n-L+1)) : dy<0? L-1+Math.floor(r()*(n-L+1)) : Math.floor(r()*n);
        const cells=[]; let fit=true, cross=0; for(let q=0;q<L;q++){ const c=(y0+dy*q)*n+(x0+dx*q); if(g[c] && g[c]!==wd.g[q]){ fit=false; break; } if(g[c]) cross++; cells.push(c); }
        if(!fit || (level<6 && cross>0) || cross>1) continue; cells.forEach((c,q)=>{ g[c]=wd.g[q]; }); placed.push({w:wd.w, g:wd.g, e:wd.e, cells}); ok=true; } }
    if(placed.length<Math.min(k, pool.length)) continue;
    const abc=ABC[lang]||ABC.es; const base=g.slice(); let good=false;
    for(let f=0; f<30 && !good; f++){ for(let c=0;c<n*n;c++) if(!base[c]) g[c]=abc[Math.floor(r()*abc.length)]; good=placed.every(p=>countWord(g,n,p.g)===1); }
    if(good) return {n, grid:g, words:placed, level}; }
  /* último recurso: sin comprobar repeticiones */
  const g=Array(n*n).fill('').map(()=>'A'); return {n, grid:g, words:[], level}; }

function WordSearch({api}){ const React=R(), h=H(), C=core(); const {useState, useEffect, useRef, useMemo}=React;
  const P=useMemo(()=>makeSearch(api.level||1),[]); const n=P.n;
  const [found,setFound]=useState([]); const [sel,setSel]=useState(null); const [anchor,setAnchor]=useState(null); const [hint,setHint]=useState(-1); const [bad,setBad]=useState(0); const [size,setSize]=useState(320);
  const wrap=useRef(null), grid=useRef(null), drag=useRef(null), hinted=useRef(new Set()), fin=useRef(false), alive=useRef(true), idle=useRef(null);
  useEffect(()=>{ alive.current=true; api.say(t('wsIntro')); if(!P.words.length){ api.done(1,1,{leer:{found:0}}); }
    const rs=()=>{ const el=wrap.current; if(!el) return; const b=el.getBoundingClientRect(); setSize(Math.max(200, Math.floor(Math.min(b.width, b.height, 760)))); };
    rs(); let ro=null; if(window.ResizeObserver){ ro=new ResizeObserver(rs); ro.observe(wrap.current); } else window.addEventListener('resize', rs);
    return ()=>{ alive.current=false; clearTimeout(idle.current); if(ro) ro.disconnect(); else window.removeEventListener('resize', rs); }; },[]);
  useEffect(()=>{ api.setProg(found.length/Math.max(1,P.words.length)); clearTimeout(idle.current);
    if(found.length<P.words.length) idle.current=setTimeout(()=>{ if(alive.current && !fin.current) api.say(t('wsHint')); }, 45000); },[found.length]);
  const cellAt=e=>{ const b=grid.current.getBoundingClientRect(); const pad=6; const cs=(b.width-pad*2)/n; const x=Math.floor((e.clientX-b.left-pad)/cs), y=Math.floor((e.clientY-b.top-pad)/cs); return (x<0||y<0||x>=n||y>=n)? -1 : y*n+x; };
  const snap=(a,c)=>{ const ax=a%n, ay=Math.floor(a/n), cx=c%n, cy=Math.floor(c/n); let dx=cx-ax, dy=cy-ay; if(!dx && !dy) return a; const len=Math.max(Math.abs(dx),Math.abs(dy));
    const ang=Math.round(Math.atan2(dy,dx)/(Math.PI/4)); const ux=[1,1,0,-1,-1,-1,0,1][(ang+8)%8], uy=[0,1,1,1,0,-1,-1,-1][(ang+8)%8]; let L=len;
    while(L>0){ const x=ax+ux*L, y=ay+uy*L; if(x>=0&&y>=0&&x<n&&y<n) return y*n+x; L--; } return a; };
  const line=(a,b)=>{ const ax=a%n, ay=Math.floor(a/n), bx=b%n, by=Math.floor(b/n); const L=Math.max(Math.abs(bx-ax),Math.abs(by-ay)); const ux=Math.sign(bx-ax), uy=Math.sign(by-ay); const out=[]; for(let q=0;q<=L;q++) out.push((ay+uy*q)*n+(ax+ux*q)); return out; };
  function tryPick(a,b){ const cells=line(a,b); const s=cells.map(c=>P.grid[c]).join(''), rv=s.split('').reverse().join('');
    const k=P.words.findIndex((wd,j)=>!found.some(f=>f.k===j) && (wd.g===s || wd.g===rv));
    if(k<0){ if(cells.length>1){ api.sfx('no'); setBad(x=>x+1); } return; }
    const nf=[...found, {k, a, b}]; setFound(nf); setHint(-1); api.sfx('ok'); const all=nf.length>=P.words.length;
    if(all){ fin.current=true; const c=P.words.filter((x,j)=>!hinted.current.has(j)).length; api.sfx('star');
      Promise.resolve(C.Voice? C.Voice.say([P.words[k].w.toLowerCase(), t('wsAll')]) : null).then(()=>setTimeout(()=>{ if(alive.current) api.done(c, P.words.length, {leer:{found:P.words.length}}); }, 500)); }
    else if(C.Voice) C.Voice.say(P.words[k].w.toLowerCase()); }
  function down(e){ if(fin.current) return; const c=cellAt(e); if(c<0) return; e.preventDefault(); try{ grid.current.setPointerCapture(e.pointerId); }catch(_){} drag.current={a:c, moved:false}; setSel({a:c, b:c}); }
  function move(e){ const d=drag.current; if(!d) return; const c=cellAt(e); if(c<0) return; const b=snap(d.a,c); if(b!==d.a) d.moved=true; setSel({a:d.a, b}); }
  function upE(e){ const d=drag.current; drag.current=null; if(!d){ return; } const s=sel; setSel(null);
    if(d.moved && s && s.b!==s.a){ setAnchor(null); tryPick(s.a, s.b); return; }
    if(anchor!=null && anchor!==d.a){ const b=snap(anchor, d.a); setAnchor(null); tryPick(anchor, b); } else { setAnchor(d.a); api.sfx('tap'); } }
  function hintWord(j){ if(found.some(f=>f.k===j) || fin.current) return; hinted.current.add(j); setHint(P.words[j].cells[0]); if(C.Voice) C.Voice.say(P.words[j].w.toLowerCase()); setTimeout(()=>{ if(alive.current) setHint(x=> x===P.words[j].cells[0]? -1 : x); }, 3000); }
  const cs=(size-12)/n; const ctr=c=>[(c%n+.5)*cs, (Math.floor(c/n)+.5)*cs];
  const band=(a,b,col,key,op)=>{ const [x1,y1]=ctr(a), [x2,y2]=ctr(b); return h`<line key=${key} x1=${x1} y1=${y1} x2=${x2} y2=${y2} stroke=${col} strokeWidth=${cs*.74} strokeLinecap="round" opacity=${op}/>`; };
  return h`<div className="stage"><div className="ws">
    <div className="ws-wrap" ref=${wrap}><div ref=${grid} className=${'ws-grid'+(bad?' bad':'')} key=${'g'+bad} style=${{width:size+'px', height:size+'px', gridTemplateColumns:`repeat(${n},1fr)`, gridTemplateRows:`repeat(${n},1fr)`, fontSize:(cs*.6).toFixed(1)+'px'}}
      onPointerDown=${down} onPointerMove=${move} onPointerUp=${upE} onPointerCancel=${()=>{ drag.current=null; setSel(null); }} role="grid" aria-label=${t('shWs')}>
      <svg viewBox=${`0 0 ${size-12} ${size-12}`} aria-hidden="true">${found.map(f=>band(f.a,f.b,WS_COL[f.k%WS_COL.length],'f'+f.k,.5))}${anchor!=null && band(anchor,anchor,'#2962FF','an',.3)}${sel && band(sel.a,sel.b,'#2962FF','s',.35)}</svg>
      ${P.grid.map((ch,c)=>h`<span key=${c} className=${c===hint?'h':''}>${ch}</span>`)}</div></div>
    <div className="ws-list" data-noread>${P.words.map((wd,j)=>{ const ok=found.some(f=>f.k===j); return h`<button key=${j} className=${'ws-w'+(ok?' ok':'')} style=${ok? null : {borderLeft:'8px solid '+WS_COL[j%WS_COL.length]}} onClick=${()=>hintWord(j)} aria-label=${wd.w}><i>${wd.e}</i>${wd.g}</button>`; })}</div>
  </div></div>`; }

/* ================= niveles: barra, festejo y panel de avances ================= */
function RankBar({points, from, big, onClick}){ const React=R(), h=H(); const a=rank(points); const b0= from!=null? rank(from) : a;
  const [pct,setPct]=React.useState(from!=null && b0.lv===a.lv? b0.into/b0.need*100 : from!=null? 0 : a.into/a.need*100);
  React.useEffect(()=>{ const id=setTimeout(()=>setPct(a.into/a.need*100), 350); return ()=>clearTimeout(id); },[points]);
  return h`<button className=${'lv-bar'+(big?' big':'')} onClick=${onClick} data-say=${F(t('level'), a.lv)+'. '+a.title+'. '+F(t('toNext'), a.need-a.into, a.lv+1)} aria-label=${F(t('level'), a.lv)+' · '+a.title}>
    <span className="ic">${a.icon}</span><span className="tx"><b>${F(t('level'), a.lv)} · ${a.title}</b><span className="tr"><i style=${{width:Math.max(3,pct)+'%'}}></i></span></span><span className="nx">${a.into}/${a.need} ⭐</span></button>`; }
/* en la pantalla de premio: la barra avanza y, si subió de nivel, lo festeja */
function RankUp({total, points, game, save}){ const h=H(); const before=rank(Math.max(0,(total||0)-(points||0))), now=rank(total||0); const upLv=now.lv>before.lv;
  const rw= game==='readw' && save && save.readw? save.readw.n||0 : null;
  return h`<div style=${{display:'flex', flexDirection:'column', alignItems:'center', gap:'8px'}}>
    ${upLv && h`<div className="lv-up"><b>⬆️ ${F(t('lvUp'), now.lv)}</b>${now.k>before.k && h`<span className="chip">${now.icon} ${F(t('rankUp'), now.title)}</span>`}</div>`}
    <${RankBar} points=${total} from=${Math.max(0,(total||0)-(points||0))} big=${true}/>
    ${rw!=null && h`<span className="chip">📚 ${t('words')}: ${rw}${stageOf(rw)<STAGES? ' · '+(rw%STEP)+'/'+STEP : ''}</span>`}
  </div>`; }
/* lo que dice Lumi al terminar un ejercicio: agrega la subida de nivel */
function rewardSay(base, total, points){ const a=rank(Math.max(0,(total||0)-(points||0))), b=rank(total||0); if(b.lv<=a.lv) return base; const l=Array.isArray(base)? base.slice() : [base]; l.push(F(t('lvUp'), b.lv)); if(b.k>a.k) l.push(F(t('rankUp'), b.title)); return l; }
function leveled(total, points){ return rank(total||0).lv>rank(Math.max(0,(total||0)-(points||0))).lv; }
function Progress({save}){ const h=H(); const a=rank(save.points||0); const rw=(save.readw&&save.readw.n)||0; const ws=(save.wsearch&&save.wsearch.n)||0; const st=stageOf(rw);
  const cards= window.LumiCards? window.LumiCards.owned(save)+'/'+window.LumiCards.CARDS.length : null;
  return h`<div className="lv-prog"><h3>🏆 ${t('prog')}</h3><${RankBar} points=${save.points||0} big=${true}/>
    <div className="lv-ladder">${RANKS.map((x,i)=>h`<span key=${i} className=${(a.lv>=x[0]?'on':'')+(a.k===i?' now':'')}><i>${x[1]}</i>${t(x[2])}<small>${F(t('level'), x[0])}</small></span>`)}</div>
    <div className="lv-facts"><span className="chip">📚 ${t('words')}: ${rw}</span><span className="chip">${'🏅'.repeat(Math.max(0,st-1))||'📖'} ${stageLabel(st)}</span><span className="chip">🔠 ${t('sopas')}: ${ws}</span>${cards && h`<span className="chip">🃏 ${t('cards')}: ${cards}</span>`}</div>
  </div>`; }

/* ================= fichas en papel (blanco y negro) ================= */
function sheetPlan(save, key, round){ const C=core(); const seed=(C.dayNum? C.dayNum(key) : 1)*4421+(round||0)*97+5; const r=C.mulberry? C.mulberry(seed) : Math.random;
  const lv=Math.max(1,Math.min(12,(save.levels&&save.levels.wsearch)||1)); const cfg=WS_CFG[lv].slice(); cfg[0]=Math.min(14,cfg[0]+2); cfg[1]=Math.min(14,cfg[1]+2);
  const n=(save.readw&&save.readw.n)||0; const a=pickWords(n, [], r), b=pickWords(n, a.map(x=>x.w), r);
  return {ws:makeSearch(lv, r, LG(), cfg), rw:[...a, ...b.filter(x=>!a.some(y=>y.w===x.w))].slice(0,10)}; }
function sheet(game, plan, k){ const P=plan&&plan.leer; if(!P || (game!=='wsearch' && game!=='readw')) return false; const {x, C, font, text, emo, sub, note, foot, PW}=k;
  if(game==='readw'){ sub(t('shRead'),250); note(t('shReadNote'),290); const W=P.rw; const rows=Math.ceil(W.length/2);
    W.forEach((wd,j)=>{ const col=j%2, row=Math.floor(j/2); const ox=90+col*560, oy=390+row*Math.min(250, 1200/rows);
      if(wd.e) emo(wd.e, ox+50, oy, 84); font(800, wd.n>=8? 46 : wd.n>=6? 58 : 70, 'Baloo'); let px=ox+120;
      wd.s.forEach((s,q)=>{ const wpx=x.measureText(s).width; text(s, px, oy, C.ink, 'left', true); if(wd.s.length>1){ x.strokeStyle=C.ink2; x.lineWidth=4; x.beginPath(); x.moveTo(px+4, oy+44); x.quadraticCurveTo(px+wpx/2, oy+66, px+wpx-4, oy+44); x.stroke(); } px+=wpx+14; });
      const sx=ox+500, sy=oy; x.strokeStyle=C.ink2; x.lineWidth=3; x.beginPath(); for(let q=0;q<10;q++){ const rr= q%2? 11 : 26, an=-Math.PI/2+q*Math.PI/5; const X=sx+Math.cos(an)*rr, Y=sy+Math.sin(an)*rr; q? x.lineTo(X,Y) : x.moveTo(X,Y); } x.closePath(); x.stroke(); });
    return true; }
  const S=P.ws; sub(t('shWs'),250); note(t('shWsNote'),290); const n=S.n; const gs=Math.min(1000, PW-240), cs=gs/n, gx=(PW-gs)/2, gy=340;
  x.strokeStyle=C.ink; x.lineWidth=4; x.strokeRect(gx,gy,gs,gs); x.lineWidth=1; x.strokeStyle=C.line; for(let q=1;q<n;q++){ x.beginPath(); x.moveTo(gx+q*cs,gy); x.lineTo(gx+q*cs,gy+gs); x.moveTo(gx,gy+q*cs); x.lineTo(gx+gs,gy+q*cs); x.stroke(); }
  font(800, Math.round(cs*.6), 'Baloo'); S.grid.forEach((ch,c)=>text(ch, gx+(c%n+.5)*cs, gy+(Math.floor(c/n)+.5)*cs+2, C.ink, 'center', true));
  const ly=gy+gs+70; const cols=4; S.words.forEach((wd,j)=>{ const ox=100+(j%cols)*((PW-200)/cols), oy=ly+Math.floor(j/cols)*84; emo(wd.e, ox+26, oy, 46); font(800,32,'Baloo'); text(wd.g, ox+62, oy+2, C.ink, 'left', true, (PW-200)/cols-70); });
  const arrow=wd=>{ const a=wd.cells[0], b=wd.cells[1]; const dx=Math.sign((b%n)-(a%n)), dy=Math.sign(Math.floor(b/n)-Math.floor(a/n)); return ({'1,0':'→','-1,0':'←','0,1':'↓','0,-1':'↑','1,1':'↘','-1,-1':'↖','1,-1':'↗','-1,1':'↙'})[dx+','+dy]||''; };
  foot('Soluciones: '+S.words.map(wd=>`${wd.g} ${t('row')} ${Math.floor(wd.cells[0]/n)+1}, ${t('col')} ${(wd.cells[0]%n)+1} ${arrow(wd)}`).join('   '));
  return true; }

window.LumiLeer={core:null, dict, t, words, pickWords, stageOf, stageLabel, sessionLens, judge, phon, makeSearch, WS_CFG, rank, need, RANKS, traceScale, traceTol, onRecord, ReadWords, WordSearch, RankBar, RankUp, rewardSay, leveled, Progress, sheetPlan, sheet, STEP, STAGES};
})();
