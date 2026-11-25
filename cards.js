/* Lumi · Cartas brillantes: monstruos propios de Lumi que salen de vez en cuando como premio.
   - Salen cuando un ejercicio sale muy bien (≥ 90 % y 3 estrellas) y a tiempo (contra reloj: le ganó al reloj;
     si no, no más lento que sus partidas anteriores de ese juego). Probabilidad 35 %, seguro a la 5.ª vez seguida
     que lo merece, como mucho 2 por día y nunca en dos partidas seguidas. La primera vez que lo merece, sale seguro.
   - Cada carta vale el doble de puntos (se suman otra vez los puntos de esa partida).
   - 12 tipos × 2 etapas = 24 monstruos. Si vuelve a salir uno que ya tiene, evoluciona. A veces sale «brillante» (otros colores).
   - Todos los dibujos son originales de Lumi (SVG). No usar personajes, nombres ni diseños de otras marcas.
   Archivo aparte de index.html (como progress.js). Expone window.LumiCards. */
(function(){
'use strict';
const LG=()=>{ const l=(document.documentElement.lang||'es').slice(0,2); return l==='ca'||l==='en'? l : 'es'; };
const TX={
  es:{won:'¡Ganaste una carta!', evo:'¡{0} evolucionó!', itIs:'¡Es {0}!', evoSay:'¡{0} evolucionó a {1}!', shiny:'¡Y es brillante!', double:'Vale el doble de puntos.', ok:'¡Genial!', close:'Cerrar',
      album:'Cartas brillantes', count:'{0} de {1} monstruos', shinyN:'{0} brillantes', how:'Salen de vez en cuando, si un ejercicio sale muy bien y a tiempo. Cada carta vale el doble de puntos. Si sale uno que ya tienes, evoluciona.',
      tilt:'Muévela con el dedo', own:'Imagen de la carta del día', ownNote:'Elige una imagen tuya para la felicitación diaria. Se guarda solo en este dispositivo: no se sube ni se comparte.', ownPick:'Elegir imagen', ownDel:'Quitar', ownBig:'No se pudo guardar la imagen.', sup:'¡{0}, has estado increíble!', sup0:'¡Has estado increíble!', daily:'¡Has ganado la carta de hoy!', howDay:'Todos los días, el primer ejercicio que te sale bien te da la carta del día.', nw:'¡Nueva!', r1:'Común', r2:'Rara', sh:'Brillante',
      fire:'Fuego', water:'Agua', plant:'Planta', elec:'Eléctrico', rock:'Roca', air:'Aire', ice:'Hielo', night:'Noche', bug:'Bicho', metal:'Metal', star:'Estrella', dino:'Dragón'},
  ca:{won:'Has guanyat una carta!', evo:'{0} ha evolucionat!', itIs:'És {0}!', evoSay:'{0} ha evolucionat a {1}!', shiny:'I és brillant!', double:'Val el doble de punts.', ok:'Genial!', close:'Tanca',
      album:'Cartes brillants', count:'{0} de {1} monstres', shinyN:'{0} brillants', how:'Surten de tant en tant, quan un exercici surt molt bé i a temps. Cada carta val el doble de punts. Si en surt un que ja tens, evoluciona.',
      tilt:'Mou-la amb el dit', own:'Imatge de la carta del dia', ownNote:'Tria una imatge teva per a la felicitació diària. Es desa només en aquest dispositiu: no es puja ni es comparteix.', ownPick:'Tria una imatge', ownDel:'Treu-la', ownBig:'No s’ha pogut desar la imatge.', sup:'{0}, has estat increïble!', sup0:'Has estat increïble!', daily:'Has guanyat la carta d’avui!', howDay:'Cada dia, el primer exercici que et surt bé et dona la carta del dia.', nw:'Nova!', r1:'Comuna', r2:'Rara', sh:'Brillant',
      fire:'Foc', water:'Aigua', plant:'Planta', elec:'Elèctric', rock:'Roca', air:'Aire', ice:'Gel', night:'Nit', bug:'Bitxo', metal:'Metall', star:'Estrella', dino:'Drac'},
  en:{won:'You won a card!', evo:'{0} evolved!', itIs:"It's {0}!", evoSay:'{0} evolved into {1}!', shiny:"And it's shiny!", double:"It's worth double points.", ok:'Great!', close:'Close',
      album:'Shiny cards', count:'{0} of {1} monsters', shinyN:'{0} shiny', how:'They appear now and then when an exercise goes really well and on time. Each card is worth double points. If you get one you already have, it evolves.',
      tilt:'Move it with your finger', own:'Card of the day image', ownNote:'Choose an image of your own for the daily celebration. It is stored only on this device: never uploaded or shared.', ownPick:'Choose image', ownDel:'Remove', ownBig:'The image could not be saved.', sup:'{0}, you were amazing!', sup0:'You were amazing!', daily:"You won today's card!", howDay:'Every day, the first exercise you do well gives you the card of the day.', nw:'New!', r1:'Common', r2:'Rare', sh:'Shiny',
      fire:'Fire', water:'Water', plant:'Plant', elec:'Electric', rock:'Rock', air:'Air', ice:'Ice', night:'Night', bug:'Bug', metal:'Metal', star:'Star', dino:'Dragon'}};
const t=k=>(TX[LG()]||TX.es)[k]||TX.es[k]||k;
const F=(s,...a)=>String(s).replace(/\{(\d)\}/g,(m,i)=>a[+i]!=null? a[+i] : '');

/* ---------- reglas ---------- */
const CHANCE=.35, PITY=4, MAXDAY=2, GAP=1, KEEP=120;
const NOSPEED=new Set(['wait','breathe','memory','cups','gonogo','pop']);
function median(a){ const s=a.slice().sort((x,y)=>x-y); const n=s.length; return n? (n%2? s[(n-1)/2] : (s[n/2-1]+s[n/2])/2) : null; }

/* ---------- dibujos (originales) ---------- */
const DK='#1B2B5A';
const E=(x,y,r=6.5)=>`<ellipse cx="${x}" cy="${y}" rx="${r*.82}" ry="${r}" fill="${DK}"/><circle cx="${x+r*.28}" cy="${y-r*.38}" r="${r*.36}" fill="#fff"/><circle cx="${x-r*.3}" cy="${y+r*.42}" r="${r*.15}" fill="#fff"/>`;
const M=(x,y,w=9)=>`<path d="M${x-w/2} ${y} Q${x} ${y+w*.62} ${x+w/2} ${y}" stroke="${DK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
const B=(x1,x2,y)=>`<ellipse cx="${x1}" cy="${y}" rx="5" ry="3" fill="#FF8A80" opacity=".6"/><ellipse cx="${x2}" cy="${y}" rx="5" ry="3" fill="#FF8A80" opacity=".6"/>`;
const FACE=(x1,x2,y,r)=>E(x1,y,r)+E(x2,y,r)+M((x1+x2)/2,y+9)+B(x1-7,x2+7,y+8);
const BROWS=(x1,x2,y)=>`<path d="M${x1-6} ${y-11} L${x1+5} ${y-8}" stroke="${DK}" stroke-width="2.6" stroke-linecap="round"/><path d="M${x2+6} ${y-11} L${x2-5} ${y-8}" stroke="${DK}" stroke-width="2.6" stroke-linecap="round"/>`;
const FEET=(c,x1=50,x2=70,y=103)=>`<ellipse cx="${x1}" cy="${y}" rx="8" ry="4.5" fill="${c}"/><ellipse cx="${x2}" cy="${y}" rx="8" ry="4.5" fill="${c}"/>`;
const circles=(l,fill)=>l.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('');
const flower=(x,y,c='#F48FB1',r=4)=>[0,72,144,216,288].map(a=>{ const q=a*Math.PI/180; return `<circle cx="${(x+Math.cos(q)*r*1.2).toFixed(1)}" cy="${(y+Math.sin(q)*r*1.2).toFixed(1)}" r="${r}" fill="${c}"/>`; }).join('')+`<circle cx="${x}" cy="${y}" r="${r*.8}" fill="#FFEB3B"/>`;

const TYPES={fire:{c:'#FF7043', bg:'#FFE3D6', i:'🔥'}, water:{c:'#29B6F6', bg:'#D7F1FF', i:'💧'}, plant:{c:'#66BB6A', bg:'#E3F5DA', i:'🌿'},
  elec:{c:'#FBC02D', bg:'#FFF6C7', i:'⚡'}, rock:{c:'#8D6E63', bg:'#EFE6DF', i:'⛰️'}, air:{c:'#7E9CF5', bg:'#E5ECFF', i:'☁️'},
  ice:{c:'#4DD0E1', bg:'#E0F7FA', i:'❄️'}, night:{c:'#7E57C2', bg:'#E6DEF7', i:'🌙'}, bug:{c:'#9CCC65', bg:'#EEF7DD', i:'🐞'},
  metal:{c:'#78909C', bg:'#E3EAEE', i:'⚙️'}, star:{c:'#EC407A', bg:'#FCE1EC', i:'⭐'}, dino:{c:'#26A69A', bg:'#D9F2EF', i:'🐉'}};

const CARDS=[
 {id:'chispi', name:'Chispi', type:'fire', st:1, evo:'fogaro', svg:
  `<path d="M60 18 C70 34 88 44 86 70 C85 90 72 102 60 102 C48 102 35 90 34 70 C33 54 44 48 46 36 C50 44 54 46 56 40 C58 32 56 26 60 18Z" fill="#FF7043"/>`+
  `<path d="M60 50 C66 58 76 64 74 79 C73 90 66 96 60 96 C54 96 47 90 46 79 C46 67 56 62 60 50Z" fill="#FFB74D"/>`+FEET('#E64A19',50,70,101)+FACE(51,69,72)},
 {id:'fogaro', name:'Fógaro', type:'fire', st:2, svg:
  `<path d="M24 66 C11 62 9 49 14 42 C18 53 25 54 29 58Z" fill="#FF7043"/><path d="M96 66 C109 62 111 49 106 42 C102 53 95 54 91 58Z" fill="#FF7043"/>`+
  `<path d="M60 8 C66 21 74 21 78 12 C83 27 96 40 96 66 C96 92 80 108 60 108 C40 108 24 92 24 66 C24 40 37 27 42 12 C46 21 54 21 60 8Z" fill="#F4511E"/>`+
  `<path d="M60 26 C64 34 70 34 72 28 C78 40 84 48 84 66 C84 84 74 96 60 96 C46 96 36 84 36 66 C36 48 42 40 48 28 C50 34 56 34 60 26Z" fill="#FF8A50"/>`+
  `<ellipse cx="60" cy="82" rx="18" ry="14" fill="#FFCC80"/>`+FEET('#BF360C',46,74,106)+BROWS(50,70,58)+FACE(50,70,58,7)},
 {id:'goti', name:'Goti', type:'water', st:1, evo:'olavio', svg:
  `<path d="M60 14 C60 14 30 50 30 74 A30 30 0 0 0 90 74 C90 50 60 14 60 14Z" fill="#4FC3F7"/><ellipse cx="44" cy="66" rx="5" ry="10" fill="#fff" opacity=".65"/>`+
  FEET('#0288D1',50,70,104)+FACE(52,68,74)},
 {id:'olavio', name:'Olavio', type:'water', st:2, svg:
  `<path d="M58 40 C55 22 70 12 86 16 C77 19 73 27 80 34 C71 31 65 36 63 43Z" fill="#4FC3F7"/>`+
  `<path d="M20 98 C16 70 30 42 58 39 C86 36 102 56 100 80 C99 93 91 101 80 101 L28 101 C24 101 21 100 20 98Z" fill="#0288D1"/>`+
  `<ellipse cx="60" cy="86" rx="25" ry="12" fill="#B3E5FC"/><path d="M18 80 C8 78 6 70 10 64 C13 70 18 72 22 72Z" fill="#4FC3F7"/><path d="M100 78 C110 76 112 68 108 62 C105 68 100 70 96 70Z" fill="#4FC3F7"/>`+
  `<circle cx="96" cy="36" r="4" fill="none" stroke="#fff" stroke-width="2"/><circle cx="104" cy="25" r="3" fill="none" stroke="#fff" stroke-width="2"/>`+BROWS(50,72,64)+FACE(50,72,64,7)},
 {id:'musgui', name:'Musgui', type:'plant', st:1, evo:'floron', svg:
  `<line x1="60" y1="38" x2="60" y2="22" stroke="#558B2F" stroke-width="3"/><path d="M60 30 C66 24 72 26 74 30 C68 32 64 32 60 30Z" fill="#8BC34A"/>`+flower(60,19)+
  circles([[60,70,32],[34,62,8],[86,62,8],[40,46,8],[80,46,8],[60,40,8]],'#7CB342')+circles([[44,88,4],[78,84,5],[70,52,3]],'#689F38')+
  FEET('#558B2F',48,72,103)+FACE(50,70,68)},
 {id:'floron', name:'Florón', type:'plant', st:2, svg:
  `<path d="M22 70 C8 68 6 56 12 50 C16 58 22 60 28 60Z" fill="#66BB6A"/><path d="M98 70 C112 68 114 56 108 50 C104 58 98 60 92 60Z" fill="#66BB6A"/>`+
  circles([[40,64,22],[80,64,22],[60,46,26],[60,76,28]],'#43A047')+circles([[38,52,9],[82,50,9],[60,30,10]],'#4CAF50')+
  flower(36,44,'#F48FB1',4)+flower(86,42,'#CE93D8',4)+flower(60,24,'#FFAB91',4.5)+
  `<rect x="44" y="96" width="9" height="12" rx="3" fill="#6D4C41"/><rect x="67" y="96" width="9" height="12" rx="3" fill="#6D4C41"/>`+BROWS(50,70,68)+FACE(50,70,68,7)},
 {id:'luci', name:'Luci', type:'elec', st:1, evo:'farolon', svg:
  `<circle cx="60" cy="56" r="36" fill="#FFF59D" opacity=".55"/>`+
  `<ellipse cx="34" cy="44" rx="17" ry="10" fill="#B3E5FC" opacity=".9" transform="rotate(-30 34 44)"/><ellipse cx="86" cy="44" rx="17" ry="10" fill="#B3E5FC" opacity=".9" transform="rotate(30 86 44)"/>`+
  `<path d="M52 34 Q46 22 42 18 M68 34 Q74 22 78 18" stroke="${DK}" stroke-width="2.4" fill="none"/><circle cx="42" cy="17" r="3.5" fill="#FFCA28"/><circle cx="78" cy="17" r="3.5" fill="#FFCA28"/>`+
  `<circle cx="60" cy="56" r="24" fill="#FFE066" stroke="#F9A825" stroke-width="2"/><rect x="50" y="78" width="20" height="14" rx="4" fill="#90A4AE"/><path d="M50 83 H70 M50 88 H70" stroke="#607D8B" stroke-width="2"/>`+
  `<path d="M58 96 L54 104 L60 102 L57 110" stroke="#FBC02D" stroke-width="3" fill="none" stroke-linejoin="round"/>`+FACE(52,68,54)},
 {id:'farolon', name:'Farolón', type:'elec', st:2, svg:
  `<path d="M48 22 Q60 6 72 22" stroke="#546E7A" stroke-width="5" fill="none"/><path d="M34 36 L86 36 L76 22 L44 22Z" fill="#546E7A"/>`+
  `<path d="M14 52 L24 60 L18 64 L28 74" stroke="#FFCA28" stroke-width="3.5" fill="none" stroke-linejoin="round"/><path d="M106 52 L96 60 L102 64 L92 74" stroke="#FFCA28" stroke-width="3.5" fill="none" stroke-linejoin="round"/>`+
  `<rect x="34" y="36" width="52" height="52" rx="12" fill="#FFE066" stroke="#546E7A" stroke-width="4"/><circle cx="60" cy="64" r="18" fill="#FFF9C4"/>`+
  `<rect x="30" y="86" width="60" height="11" rx="5" fill="#546E7A"/><rect x="42" y="97" width="10" height="10" rx="3" fill="#455A64"/><rect x="68" y="97" width="10" height="10" rx="3" fill="#455A64"/>`+BROWS(51,69,60)+FACE(51,69,60,6.5)},
 {id:'piedri', name:'Piedri', type:'rock', st:1, evo:'criston', svg:
  `<path d="M58 48 L64 30 L70 50Z" fill="#80DEEA" stroke="#26C6DA" stroke-width="1.5"/>`+
  `<ellipse cx="60" cy="74" rx="35" ry="27" fill="#A1887F"/><ellipse cx="52" cy="62" rx="21" ry="11" fill="#BCAAA4" opacity=".75"/>`+
  `<path d="M86 66 L80 72 L84 78" stroke="#795548" stroke-width="2" fill="none"/>`+FEET('#6D4C41',48,72,101)+FACE(50,70,74)},
 {id:'criston', name:'Cristón', type:'rock', st:2, svg:
  `<path d="M40 54 L46 20 L56 50Z" fill="#4DD0E1" stroke="#00ACC1" stroke-width="2"/><path d="M54 48 L63 8 L73 48Z" fill="#80DEEA" stroke="#00ACC1" stroke-width="2"/><path d="M70 52 L82 24 L88 58Z" fill="#4DD0E1" stroke="#00ACC1" stroke-width="2"/>`+
  `<path d="M63 8 L63 48" stroke="#E0F7FA" stroke-width="2"/>`+
  `<path d="M22 102 L26 66 L42 50 L78 48 L96 64 L100 102Z" fill="#8D6E63"/><path d="M30 66 L44 54 L60 54 L50 70Z" fill="#A1887F"/>`+
  `<rect x="10" y="74" width="16" height="18" rx="7" fill="#795548"/><rect x="94" y="74" width="16" height="18" rx="7" fill="#795548"/>`+BROWS(50,72,78)+FACE(50,72,78,7)},
 {id:'nubi', name:'Nubi', type:'air', st:1, evo:'nubarron', svg:
  `<rect x="46" y="84" width="8" height="16" rx="4" fill="#7E9CF5"/><rect x="66" y="84" width="8" height="16" rx="4" fill="#7E9CF5"/>`+
  circles([[40,64,22],[60,52,26],[80,64,22],[60,72,24]],'#C5D3F7')+circles([[40,64,20],[60,52,24],[80,64,20],[60,72,22]],'#fff')+
  `<path d="M96 36 q8 -4 12 2 q-6 2 -10 -1" stroke="#90CAF9" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M12 44 q8 -6 14 0" stroke="#90CAF9" stroke-width="2.4" fill="none" stroke-linecap="round"/>`+FACE(52,68,62)},
 {id:'nubarron', name:'Nubarrón', type:'air', st:2, svg:
  ['#EF5350','#FFA726','#FFEE58','#66BB6A','#42A5F5'].map((c,k)=>`<path d="M${14+k*5} 92 A${46-k*5} ${46-k*5} 0 0 1 ${106-k*5} 92" stroke="${c}" stroke-width="5" fill="none"/>`).join('')+
  circles([[32,72,22],[56,58,28],[84,66,24],[60,82,24],[92,84,14],[28,88,14]],'#C5D3F7')+circles([[32,72,20],[56,58,26],[84,66,22],[60,82,22],[92,84,12],[28,88,12]],'#F5F8FF')+
  `<path d="M100 40 q10 -6 14 2 q-8 2 -12 -2" stroke="#7E9CF5" stroke-width="2.6" fill="none" stroke-linecap="round"/>`+BROWS(50,70,70)+FACE(50,70,70,7)},
 /* ---- segunda tanda (también originales) ---- */
 {id:'copi', name:'Copi', type:'ice', st:1, evo:'glaciar', svg:
  `<path d="M60 16 L72 36 L94 40 L82 60 L90 84 L60 96 L30 84 L38 60 L26 40 L48 36Z" fill="#80DEEA"/><path d="M60 30 L68 44 L82 48 L74 62 L78 78 L60 86 L42 78 L46 62 L38 48 L52 44Z" fill="#E0F7FA"/>`+
  `<path d="M40 30 l4 6 M80 30 l-4 6" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`+FEET('#00ACC1',50,70,100)+FACE(52,68,62)},
 {id:'glaciar', name:'Glaciar', type:'ice', st:2, svg:
  `<path d="M40 30 L46 6 L56 28Z" fill="#B2EBF2"/><path d="M56 26 L62 2 L70 26Z" fill="#E0F7FA"/><path d="M68 28 L78 8 L82 32Z" fill="#B2EBF2"/>`+
  `<path d="M22 100 L18 62 L34 34 L60 24 L88 34 L102 62 L98 100Z" fill="#26C6DA"/><path d="M32 100 L30 66 L42 44 L60 38 L80 44 L90 66 L88 100Z" fill="#B2EBF2"/>`+
  `<path d="M18 70 L4 62 L14 84Z" fill="#80DEEA"/><path d="M102 70 L116 62 L106 84Z" fill="#80DEEA"/><ellipse cx="60" cy="88" rx="18" ry="9" fill="#E0F7FA"/>`+FEET('#00838F',46,74,104)+BROWS(50,70,66)+FACE(50,70,66,7)},
 {id:'lunita', name:'Lunita', type:'night', st:1, evo:'sombron', svg:
  `<path d="M34 46 L28 20 L48 36Z" fill="#7E57C2"/><path d="M86 46 L92 20 L72 36Z" fill="#7E57C2"/><path d="M35 40 L32 27 L42 35Z" fill="#F8BBD0"/><path d="M85 40 L88 27 L78 35Z" fill="#F8BBD0"/>`+
  `<ellipse cx="60" cy="68" rx="30" ry="30" fill="#9575CD"/><ellipse cx="60" cy="80" rx="17" ry="14" fill="#D1C4E9"/>`+
  `<path d="M88 84 C104 86 108 72 100 66 C102 74 96 78 88 76Z" fill="#7E57C2"/><path d="M56 44 a7 7 0 1 0 8 0 a5 5 0 1 1 -8 0Z" fill="#FFF59D"/>`+FEET('#5E35B1',50,70,100)+FACE(51,69,68)},
 {id:'sombron', name:'Sombrón', type:'night', st:2, svg:
  `<path d="M28 60 C4 50 2 28 10 18 C14 30 20 30 24 26 C24 36 30 38 36 36Z" fill="#5E35B1"/><path d="M92 60 C116 50 118 28 110 18 C106 30 100 30 96 26 C96 36 90 38 84 36Z" fill="#5E35B1"/>`+
  `<path d="M38 40 L32 12 L52 30Z" fill="#673AB7"/><path d="M82 40 L88 12 L68 30Z" fill="#673AB7"/>`+
  `<ellipse cx="60" cy="68" rx="34" ry="36" fill="#673AB7"/><ellipse cx="60" cy="82" rx="20" ry="18" fill="#B39DDB"/>`+
  [[30,22,2.5],[92,24,2],[18,74,2],[104,78,2.5]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#FFF59D"/>`).join('')+
  `<path d="M54 40 a8 8 0 1 0 12 0 a6 6 0 1 1 -12 0Z" fill="#FFF59D"/>`+FEET('#4527A0',46,74,105)+BROWS(50,70,64)+FACE(50,70,64,7)},
 {id:'bichi', name:'Bichi', type:'bug', st:1, evo:'mariposon', svg:
  `<path d="M50 34 C46 22 40 18 34 18" stroke="${DK}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M70 34 C74 22 80 18 86 18" stroke="${DK}" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="34" cy="18" r="3.5" fill="#EF5350"/><circle cx="86" cy="18" r="3.5" fill="#EF5350"/>`+
  `<ellipse cx="60" cy="68" rx="32" ry="30" fill="#EF5350"/><path d="M60 40 L60 98" stroke="${DK}" stroke-width="2.4"/>`+circles([[42,60,5],[78,60,5],[46,84,4.5],[74,84,4.5],[38,74,3],[82,74,3]],DK)+
  `<path d="M38 50 A24 20 0 0 1 82 50 A30 22 0 0 0 38 50Z" fill="#FFCDD2"/><ellipse cx="60" cy="52" rx="22" ry="16" fill="#FFE0B2"/>`+FEET('#B71C1C',50,70,101)+FACE(52,68,50,6)},
 {id:'mariposon', name:'Mariposón', type:'bug', st:2, svg:
  `<path d="M56 60 C30 20 4 30 10 56 C12 68 30 70 54 66Z" fill="#AB47BC"/><path d="M64 60 C90 20 116 30 110 56 C108 68 90 70 66 66Z" fill="#AB47BC"/>`+
  `<path d="M56 70 C34 76 20 90 30 102 C40 110 52 96 58 78Z" fill="#FF7043"/><path d="M64 70 C86 76 100 90 90 102 C80 110 68 96 62 78Z" fill="#FF7043"/>`+
  circles([[28,48,7],[92,48,7],[38,94,5],[82,94,5]],'#FFF59D')+circles([[28,48,3],[92,48,3]],'#EC407A')+
  `<path d="M54 30 C50 18 44 14 40 12" stroke="${DK}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M66 30 C70 18 76 14 80 12" stroke="${DK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`+
  `<ellipse cx="60" cy="74" rx="11" ry="26" fill="#8BC34A"/><circle cx="60" cy="44" r="17" fill="#AED581"/>`+BROWS(54,66,44)+FACE(54,66,44,5.5)},
 {id:'tuerqui', name:'Tuerqui', type:'metal', st:1, evo:'roboton', svg:
  `<line x1="60" y1="34" x2="60" y2="20" stroke="#546E7A" stroke-width="3"/><circle cx="60" cy="17" r="5" fill="#FFCA28"/>`+
  `<rect x="30" y="34" width="60" height="58" rx="14" fill="#90A4AE"/><rect x="38" y="42" width="44" height="34" rx="9" fill="#ECEFF1"/>`+
  `<rect x="20" y="54" width="10" height="20" rx="5" fill="#78909C"/><rect x="90" y="54" width="10" height="20" rx="5" fill="#78909C"/>`+circles([[42,84,2.5],[60,84,2.5],[78,84,2.5]],'#FFCA28')+FEET('#546E7A',48,72,98)+FACE(51,69,56,6)},
 {id:'roboton', name:'Robotón', type:'metal', st:2, svg:
  `<path d="M44 26 L40 8 L52 22Z" fill="#FFCA28"/><path d="M76 26 L80 8 L68 22Z" fill="#FFCA28"/>`+
  `<rect x="36" y="22" width="48" height="38" rx="12" fill="#78909C"/><rect x="42" y="28" width="36" height="24" rx="8" fill="#ECEFF1"/>`+
  `<rect x="26" y="58" width="68" height="42" rx="12" fill="#607D8B"/><rect x="8" y="60" width="18" height="30" rx="9" fill="#90A4AE"/><rect x="94" y="60" width="18" height="30" rx="9" fill="#90A4AE"/>`+
  `<circle cx="60" cy="78" r="12" fill="#4FC3F7"/><circle cx="60" cy="78" r="6" fill="#E1F5FE"/><rect x="40" y="98" width="14" height="12" rx="4" fill="#455A64"/><rect x="66" y="98" width="14" height="12" rx="4" fill="#455A64"/>`+BROWS(52,68,40)+FACE(52,68,40,5.5)},
 {id:'estreli', name:'Estreli', type:'star', st:1, evo:'cometon', svg:
  `<path d="M60 14 L72 44 L104 46 L79 66 L88 98 L60 80 L32 98 L41 66 L16 46 L48 44Z" fill="#FFD54F" stroke="#FFB300" stroke-width="3" stroke-linejoin="round"/>`+
  `<circle cx="22" cy="24" r="3" fill="#F48FB1"/><circle cx="100" cy="22" r="2.5" fill="#F48FB1"/><circle cx="104" cy="84" r="2.5" fill="#fff"/>`+FACE(52,68,58,6)},
 {id:'cometon', name:'Cometón', type:'star', st:2, svg:
  `<path d="M6 104 C30 80 44 70 58 62 L66 78 C50 84 30 94 6 104Z" fill="#F48FB1"/><path d="M4 86 C26 70 40 62 54 56 L58 66 C42 72 26 78 4 86Z" fill="#CE93D8"/><path d="M22 110 C40 96 54 88 66 82 L70 90 C56 96 42 102 22 110Z" fill="#FFAB91"/>`+
  `<path d="M74 10 L85 38 L114 40 L92 59 L99 88 L74 72 L49 88 L56 59 L34 40 L63 38Z" fill="#FFCA28" stroke="#FF8F00" stroke-width="3" stroke-linejoin="round"/>`+
  `<path d="M74 26 L80 42 L96 44 L84 54 L88 70 L74 61 L60 70 L64 54 L52 44 L68 42Z" fill="#FFF59D"/>`+BROWS(67,81,50)+FACE(67,81,50,5.5)},
 {id:'dini', name:'Dini', type:'dino', st:1, evo:'dragolin', svg:
  `<path d="M82 84 C104 88 110 72 102 62 C102 72 94 76 84 72Z" fill="#26A69A"/>`+[[46,26],[60,20],[74,26]].map(([x,y])=>`<path d="M${x-7} ${y+14} L${x} ${y} L${x+7} ${y+14}Z" fill="#FFB74D"/>`).join('')+
  `<ellipse cx="60" cy="66" rx="30" ry="32" fill="#4DB6AC"/><ellipse cx="60" cy="80" rx="17" ry="15" fill="#E0F2F1"/>`+
  `<ellipse cx="32" cy="72" rx="6" ry="9" fill="#26A69A"/><ellipse cx="88" cy="72" rx="6" ry="9" fill="#26A69A"/>`+FEET('#00796B',48,72,101)+FACE(51,69,60)},
 {id:'dragolin', name:'Dragolín', type:'dino', st:2, svg:
  `<path d="M30 58 C8 40 4 20 12 8 C18 22 26 22 30 18 C30 30 38 34 44 36Z" fill="#00897B"/><path d="M90 58 C112 40 116 20 108 8 C102 22 94 22 90 18 C90 30 82 34 76 36Z" fill="#00897B"/>`+
  `<path d="M88 92 C112 98 118 78 108 68 C108 80 100 84 90 80Z" fill="#00897B"/><path d="M108 68 l8 -6 l-2 10Z" fill="#FFB74D"/>`+
  `<path d="M44 26 L48 8 L56 24Z" fill="#FFB74D"/><path d="M76 26 L72 8 L64 24Z" fill="#FFB74D"/>`+
  `<ellipse cx="60" cy="66" rx="34" ry="38" fill="#26A69A"/><ellipse cx="60" cy="82" rx="20" ry="20" fill="#FFE0B2"/>`+[72,80,88].map(y=>`<path d="M46 ${y} Q60 ${y+4} 74 ${y}" stroke="#FFB74D" stroke-width="2" fill="none"/>`).join('')+
  `<path d="M52 74 q-4 6 -8 2 M68 74 q4 6 8 2" stroke="#FF7043" stroke-width="0" fill="none"/>`+FEET('#00695C',46,74,105)+BROWS(50,70,56)+FACE(50,70,56,7)},
];
const BYID={}; CARDS.forEach((c,k)=>{ c.no=k+1; BYID[c.id]=c; });
CARDS.forEach(c=>{ if(c.evo) BYID[c.evo].from=c.id; });

/* ---------- lógica ---------- */
function st(save){ return (save&&save.cards)||{}; }
function owned(save){ const g=st(save).got||{}; return CARDS.filter(c=>g[c.id]||g[c.id+'*']).length; }
function wpick(list){ const tot=list.reduce((s,x)=>s+x.w,0); let r=Math.random()*tot; for(const x of list){ if((r-=x.w)<0) return x; } return list[list.length-1]; }
function choose(save){ const g=st(save).got||{}; const has=id=>!!(g[id]||g[id+'*']); const pool=[];
  CARDS.filter(c=>c.st===1).forEach(c=>{ if(!has(c.id)) pool.push({id:c.id, w:6}); else if(!has(c.evo)) pool.push({id:c.evo, w:4, evo:c.id}); });
  const x= pool.length? wpick(pool) : {id:CARDS[Math.floor(Math.random()*CARDS.length)].id, w:1};
  const shiny= Math.random() < (pool.length? .1 : .3);
  const key=x.id+(shiny?'*':'');
  return {id:x.id, evo:x.evo||null, shiny, isNew:!g[key]}; }

/* Decide si esta partida gana carta. o={game, acc, stars, total, secs, timed, beat, today} */
function roll(save, o){ const C=st(save); const spd= o.total && o.secs>0? o.secs/o.total : null; const sp=(C.sp||{})[o.game]||[];
  let fast=true;
  if(o.timed) fast=!!o.beat;
  else if(!NOSPEED.has(o.game) && spd && sp.length>=2) fast= spd <= median(sp)*1.05;
  const good= o.acc>=.9 && o.stars>=3; const elig= good && fast;
  const todayN=(C.log||[]).filter(x=>x.d===o.today).length; const since= C.since==null? GAP : C.since;
  let give=false;
  if(elig && todayN<MAXDAY && since>=GAP){ const first=!(C.log||[]).length; give= first || (C.miss||0)>=PITY || Math.random()<CHANCE; }
  if(o.force) give=true;
  /* carta del día: una vez por día, en el primer ejercicio que sale bien (2 estrellas o más) o, si no, desde el tercero */
  const daily= !!o.sup || (o.daily!==false && C.dday!==o.today && (o.stars>=2 || (o.nth||0)>=3));
  if(daily) give=true;
  const card= give? choose(save) : null; if(card && daily) card.sup=true;
  return {card, spd: o.timed? null : spd, elig, daily}; }

/* Guarda el resultado en el progreso del niño (dentro de update). o={game, today, bonus} */
function apply(n, r, o){ const C=n.cards=n.cards||{}; C.got=C.got||{}; C.log=C.log||[]; C.sp=C.sp||{};
  if(r.spd && r.spd>=.3 && r.spd<=600){ const a=C.sp[o.game]=(C.sp[o.game]||[]); a.push(Math.round(r.spd*10)/10); if(a.length>6) a.splice(0,a.length-6); }
  if(r.card){ const k=r.card.id+(r.card.shiny?'*':''); C.got[k]=(C.got[k]||0)+1; C.log.push({id:r.card.id, s:r.card.shiny?1:undefined, d:o.today, g:o.game, p:o.bonus});
    if(C.log.length>KEEP) C.log=C.log.slice(-KEEP); C.miss=0; C.since=0; if(r.daily) C.dday=o.today;
    if(o.bonus){ n.points=(n.points||0)+o.bonus; const d=n.days&&n.days[o.today]; if(d) d.points=(d.points||0)+o.bonus; } }
  else { C.since=(C.since==null? GAP : C.since)+1; if(r.elig) C.miss=(C.miss||0)+1; }
  return n; }

/* qué dice Lumi */
const supText=card=> card.kid? F(t('sup'), card.kid) : t('sup0');
function sayFor(card){ const c=BYID[card.id]; const out= card.sup? [supText(card), t('daily')] : [t('won')];
  if(card.evo) out.push(F(t('evoSay'), BYID[card.evo].name, c.name)); else out.push(F(t('itIs'), c.name));
  if(card.shiny) out.push(t('shiny')); out.push(t('double')); return out; }

/* ---------- estilos ---------- */
const CSS=`
.lc-ov{position:fixed; inset:0; z-index:90; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:max(12px,env(safe-area-inset-top)) 16px max(12px,env(safe-area-inset-bottom));
  background:radial-gradient(circle at 50% 46%, rgba(64,48,140,.88), rgba(10,12,40,.95) 70%); overflow:hidden; text-align:center; animation:lc-fade .35s both; touch-action:none; -webkit-user-select:none; user-select:none}
.lc-ov h2{color:#FFE57F; margin:0; font-size:clamp(26px,6.4vw,46px); line-height:1.1; text-shadow:0 0 18px rgba(255,214,0,.75), 0 3px 0 rgba(0,0,0,.35); position:relative; z-index:2; animation:lc-pop .6s .25s both}
.lc-ov .lc-sub{color:#fff; margin:0; font-size:clamp(17px,3.6vw,24px); font-weight:800; position:relative; z-index:2; animation:lc-fade .5s 1.6s both}
.lc-ov .btn{position:relative; z-index:2; animation:lc-fade .4s 1.9s both}
.lc-rays{position:absolute; left:50%; top:47%; width:170vmax; height:170vmax; margin:-85vmax 0 0 -85vmax; pointer-events:none;
  background:repeating-conic-gradient(from 0deg, rgba(255,232,140,.30) 0deg 9deg, rgba(255,232,140,0) 9deg 24deg);
  -webkit-mask-image:radial-gradient(circle, #000 8%, transparent 46%); mask-image:radial-gradient(circle, #000 8%, transparent 46%); animation:lc-rot 16s linear infinite, lc-fade 1s both; will-change:transform}
.lc-glow{position:absolute; left:50%; top:47%; width:70vmin; height:70vmin; margin:-35vmin 0 0 -35vmin; border-radius:50%; pointer-events:none;
  background:radial-gradient(circle, rgba(255,240,170,.55), rgba(255,200,80,0) 62%); animation:lc-pulse 2.4s ease-in-out infinite}
.lc-spk{position:absolute; inset:0; pointer-events:none}
.lc-spk i{position:absolute; font-style:normal; color:#FFF59D; text-shadow:0 0 8px #FFD54F; animation:lc-tw 1.8s ease-in-out infinite; opacity:0}
.lc-stage{position:relative; z-index:2; perspective:900px; -webkit-perspective:900px}
.lc-float{transform-style:preserve-3d; -webkit-transform-style:preserve-3d; animation:lc-float 4.2s 2s ease-in-out infinite}
.lc-tilt{transform-style:preserve-3d; -webkit-transform-style:preserve-3d; transition:transform .25s ease-out}
.lc-card{position:relative; transform-style:preserve-3d; -webkit-transform-style:preserve-3d}
.lc-card.spin{animation:lc-in 1.9s cubic-bezier(.18,.72,.25,1) both}
.lc-front,.lc-back{-webkit-backface-visibility:hidden; backface-visibility:hidden}
.lc-back{position:absolute; inset:0; transform:rotateY(180deg); border-radius:7%; overflow:hidden; display:flex; align-items:center; justify-content:center;
  background:radial-gradient(circle at 50% 50%, #3D5AFE 0, #1A237E 60%); border:.45em solid #FFD54F; box-sizing:border-box; color:#FFE57F; font-weight:800; font-size:1.7em; letter-spacing:.06em; text-shadow:0 0 10px rgba(255,214,0,.8)}
.lc-back span{display:block; transform:rotate(-12deg)}
.lc-face{position:relative; box-sizing:border-box; border-radius:7%; padding:.42em; overflow:hidden; display:flex; flex-direction:column; text-transform:none;
  background:linear-gradient(135deg,#ECEFF1,#B0BEC5 40%,#FAFAFA 55%,#90A4AE); box-shadow:0 .6em 1.6em rgba(0,0,0,.35); color:#1B2B5A; line-height:1.1}
.lc-face.r2{background:linear-gradient(135deg,#FFF3B0,#F9A825 35%,#FFF8E1 52%,#F57F17 80%,#FFE082)}
.lc-face.shy{background:linear-gradient(135deg,#FF8A80,#FFD180,#FFFF8D,#B9F6CA,#80D8FF,#B388FF,#FF80AB); background-size:300% 300%; animation:lc-shim 4s ease-in-out infinite alternate}
.lc-in{flex:1; display:flex; flex-direction:column; border-radius:.55em; overflow:hidden; background:#FFFDF6; min-height:0}
.lc-top{display:flex; align-items:center; gap:.3em; padding:.32em .45em .22em; font-weight:800}
.lc-top b{font-size:1.25em; letter-spacing:.02em; flex:1; text-align:left; white-space:nowrap; overflow:hidden; text-overflow:ellipsis}
.lc-x2{background:#E53935; color:#fff; border-radius:.6em; padding:.05em .4em; font-size:.85em}
.lc-art{position:relative; flex:1; margin:0 .4em; border-radius:.45em; min-height:0; display:flex; align-items:center; justify-content:center; box-shadow:inset 0 0 0 .14em rgba(0,0,0,.12)}
.lc-art svg{width:100%; height:100%; display:block}
.lc-face.shy .lc-art svg{filter:hue-rotate(150deg) saturate(1.25)}
.lc-type{position:absolute; left:.3em; top:.3em; color:#fff; border-radius:.6em; padding:.1em .4em; font-size:.72em; font-weight:800; box-shadow:0 .08em .2em rgba(0,0,0,.2)}
.lc-bot{display:flex; align-items:center; gap:.35em; padding:.3em .45em .32em; font-size:.8em; font-weight:800}
.lc-bot .st{color:#F9A825; letter-spacing:.05em} .lc-bot .sp{flex:1} .lc-bot .no{color:#5C6B8A}
.lc-new{position:absolute; right:-.2em; top:2.1em; transform:rotate(12deg); background:#00C853; color:#fff; font-weight:800; border-radius:.5em; padding:.1em .45em; font-size:.85em; box-shadow:0 .15em .4em rgba(0,0,0,.3); z-index:3}
.lc-foil{position:absolute; inset:0; border-radius:inherit; pointer-events:none; mix-blend-mode:color-dodge; opacity:.55;
  background:linear-gradient(115deg, transparent 22%, rgba(255,0,140,.45) 32%, rgba(255,235,0,.45) 41%, rgba(0,255,170,.45) 50%, rgba(0,170,255,.45) 59%, rgba(170,0,255,.45) 68%, transparent 78%);
  background-size:260% 260%; background-position:var(--fx,20%) var(--fy,20%); animation:lc-shim 3.4s ease-in-out infinite alternate}
.lc-glare{position:absolute; inset:0; border-radius:inherit; pointer-events:none; mix-blend-mode:overlay;
  background:radial-gradient(circle at var(--mx,35%) var(--my,25%), rgba(255,255,255,.75), rgba(255,255,255,0) 48%)}
.lc-face.mini .lc-foil{animation:none; opacity:.35}
.lc-album{margin:4px 0 14px; text-align:center}
.lc-album h3{margin:4px 0}
.lc-grid{display:grid; grid-template-columns:repeat(auto-fill,minmax(96px,1fr)); gap:10px; width:min(560px,80vw); margin:8px auto}
.lc-cell{position:relative; border:0; padding:0; background:none; font:inherit; display:flex; justify-content:center; cursor:pointer}
.lc-cell.off{cursor:default}
.lc-cell.off .lc-face{background:#CFD8DC; box-shadow:none}
.lc-cell.off .lc-art svg{filter:brightness(0); opacity:.16}
.lc-cell .lc-cnt{position:absolute; right:2px; bottom:2px; background:#1B2B5A; color:#fff; border-radius:10px; font-size:12px; padding:1px 6px; font-weight:800}
.lc-cell .lc-sh{position:absolute; left:2px; top:-4px; font-size:16px}
.lc-ov.sup{background:radial-gradient(circle at 50% 47%, #FFFDE7 0, #FFEB3B 16%, #FFC107 34%, #EF6C00 56%, #4E2A04 80%, #140B02 100%)}
.lc-ov.sup .lc-rays{background:repeating-conic-gradient(from 0deg, rgba(255,255,255,.6) 0deg 4deg, rgba(255,255,255,0) 4deg 15deg); animation-duration:9s, 1s}
.lc-ov.sup h2{color:#fff; font-size:clamp(30px,8vw,64px); line-height:1.02; text-transform:uppercase; text-shadow:-2px -2px 0 #8A2B00, 2px -2px 0 #8A2B00, -2px 2px 0 #8A2B00, 2px 2px 0 #8A2B00, 0 5px 0 #8A2B00, 0 9px 14px rgba(0,0,0,.45); animation:lc-pop .7s .2s both, lc-beat 1.2s 1.2s ease-in-out infinite}
.lc-ov.sup h2 span{display:block} .lc-ov.sup h2 span+span{font-size:.66em; color:#FFF59D; margin-top:.12em}
.lc-ov.sup .lc-sub{color:#fff; text-shadow:0 2px 0 rgba(0,0,0,.45)}
.lc-bolts{position:absolute; inset:0; width:100%; height:100%; pointer-events:none}
.lc-bolts path{fill:none; stroke:#fff; stroke-width:.9; stroke-linejoin:miter; filter:drop-shadow(0 0 3px #FFF176) drop-shadow(0 0 8px #FFD600); opacity:0; animation:lc-zap 1.7s linear infinite; vector-effect:non-scaling-stroke; stroke-width:5px}
.lc-face.sup{background:linear-gradient(135deg,#FFF59D,#FFB300 30%,#FFFDE7 50%,#FF6F00 78%,#FFE082); box-shadow:0 0 0 .18em #fff, 0 0 2.2em rgba(255,235,59,.95), 0 .6em 1.6em rgba(0,0,0,.4)}
.lc-face.sup .lc-art{background:radial-gradient(circle at 50% 55%, #FFFDE7 0, #FFEB3B 34%, #FF8F00 78%, #5D2E00 120%) !important; overflow:hidden}
.lc-face.sup .lc-art svg.mon{animation:lc-jump 1.15s ease-in-out infinite; position:relative}
.lc-zap{position:absolute; inset:0; width:100%; height:100%} .lc-face.sup .lc-type{z-index:2}
.lc-zap path{fill:none; stroke:#fff; stroke-width:2.2; stroke-linejoin:miter; opacity:.9; animation:lc-zap 1.3s linear infinite}
.lc-day{position:absolute; left:-.3em; bottom:2.6em; transform:rotate(-10deg); background:#D50000; color:#fff; font-weight:800; border-radius:.5em; padding:.1em .45em; font-size:.8em; box-shadow:0 .15em .4em rgba(0,0,0,.3); z-index:3}
@keyframes lc-zap{0%,100%{opacity:0} 8%{opacity:1} 16%{opacity:.25} 24%{opacity:1} 40%{opacity:0}}
@keyframes lc-jump{0%,100%{transform:translateY(3%) rotate(-3deg)} 50%{transform:translateY(-6%) rotate(3deg)}}
@keyframes lc-beat{0%,100%{transform:scale(1)} 50%{transform:scale(1.05)}}
@keyframes lc-in{0%{transform:scale(.12) rotateY(0deg); opacity:0} 12%{opacity:1} 72%{transform:scale(1.08) rotateY(1080deg)} 100%{transform:scale(1) rotateY(1080deg)}}
@keyframes lc-float{0%,100%{transform:translateY(0) rotateY(-9deg)} 50%{transform:translateY(-10px) rotateY(9deg)}}
@keyframes lc-shim{from{background-position:0% 0%} to{background-position:100% 100%}}
@keyframes lc-rot{to{transform:rotate(360deg)}}
@keyframes lc-pulse{0%,100%{transform:scale(.92); opacity:.8} 50%{transform:scale(1.06); opacity:1}}
@keyframes lc-tw{0%,100%{opacity:0; transform:scale(.4)} 50%{opacity:1; transform:scale(1.15)}}
@keyframes lc-fade{from{opacity:0} to{opacity:1}}
@keyframes lc-pop{0%{transform:scale(.3); opacity:0} 70%{transform:scale(1.12); opacity:1} 100%{transform:scale(1)}}
@media (prefers-reduced-motion: reduce){ .lc-card.spin{animation:lc-fade .6s both} .lc-float,.lc-rays,.lc-glow,.lc-spk i,.lc-foil,.lc-face.shy,.lc-face.sup .lc-art svg.mon,.lc-ov.sup h2{animation:none} .lc-bolts path,.lc-zap path{animation:none; opacity:.7} .lc-spk i{opacity:.8} }
`;
function injectCss(){ if(document.getElementById('lc-css')) return; const s=document.createElement('style'); s.id='lc-css'; s.textContent=CSS; document.head.appendChild(s); }
if(document.head) injectCss(); else document.addEventListener('DOMContentLoaded', injectCss);

/* ---------- componentes ---------- */
const R=()=>window.React; const H=()=>window.htm.bind(window.React.createElement);

const OWN_KEY='lumi-carta-img';
const ownGet=()=>{ try{ return localStorage.getItem(OWN_KEY)||''; }catch(e){ return ''; } };
const ownSet=v=>{ try{ if(v) localStorage.setItem(OWN_KEY,v); else localStorage.removeItem(OWN_KEY); return true; }catch(e){ return false; } };
function ownLoad(file){ return new Promise((res,rej)=>{ const u=URL.createObjectURL(file); const im=new Image(); im.onload=()=>{ try{ let w=im.naturalWidth, hh=im.naturalHeight; const k=Math.min(1, 1000/Math.max(w,hh)); w=Math.round(w*k); hh=Math.round(hh*k);
      const cv=document.createElement('canvas'); cv.width=w; cv.height=hh; cv.getContext('2d').drawImage(im,0,0,w,hh); URL.revokeObjectURL(u); res(cv.toDataURL('image/jpeg',.82)); }catch(e){ rej(e); } }; im.onerror=rej; im.src=u; }); }
function OwnImg(){ const h=H(); const [img,setImg]=R().useState(ownGet()); const [err,setErr]=R().useState('');
  const pick=e=>{ const f=e.target.files&&e.target.files[0]; e.target.value=''; if(!f) return; ownLoad(f).then(d=>{ if(ownSet(d)){ setImg(d); setErr(''); } else setErr(t('ownBig')); }).catch(()=>setErr(t('ownBig'))); };
  return h`<div className="lc-own" data-notr><span className="small">${t('own')}</span>
    <div className="seg">${img && h`<img src=${img} alt="" style=${{height:'64px', borderRadius:'8px', marginRight:'8px'}}/>`}<label className="btn" style=${{cursor:'pointer'}}>${t('ownPick')}<input type="file" accept="image/*" onChange=${pick} style=${{display:'none'}}/></label>${img && h`<button onClick=${()=>{ ownSet(''); setImg(''); }}>${t('ownDel')}</button>`}</div>
    <p className="small muted">${err||t('ownNote')}</p></div>`; }
function Face({card, w, mini, isNew}){ const h=H(); const c=BYID[card.id]; const T0=TYPES[c.type];
  const own= card.sup && !mini && card.own!==false? ownGet() : '';
  if(own) return h`<div className="lc-face sup own" style=${{width:w+'px', height:Math.round(w*1.4)+'px', fontSize:(w*.072).toFixed(1)+'px'}}><img src=${own} alt="" style=${{width:'100%', height:'100%', objectFit:'cover', borderRadius:'inherit', display:'block'}}/><div className="lc-glare"></div></div>`;
  return h`<div className=${'lc-face'+(c.st>1?' r2':'')+(card.shiny?' shy':'')+(card.sup?' sup':'')+(mini?' mini':'')} style=${{width:w+'px', height:Math.round(w*1.4)+'px', fontSize:(w*.072).toFixed(1)+'px'}}>
    <div className="lc-in">
      <div className="lc-top"><b>${c.name.toUpperCase()}</b><span className="lc-x2">×2</span></div>
      <div className="lc-art" style=${{background:T0.bg}}><span className="lc-type" style=${{background:T0.c}}>${T0.i} ${t(c.type)}</span>
        ${card.sup && h`<svg className="lc-zap" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${ZAP_IN.map((d,k)=>h`<path key=${k} d=${d} style=${{animationDelay:(k*.21)+'s'}}/>`)}</svg>`}
        <svg className="mon" viewBox="0 0 120 120" aria-hidden="true" dangerouslySetInnerHTML=${{__html:c.svg}}></svg></div>
      <div className="lc-bot"><span className="st">${c.st>1?'★★':'★'}</span><span className="sp">${card.shiny? '✨ '+t('sh') : t(c.st>1?'r2':'r1')}</span><span className="no">${String(c.no).padStart(2,'0')}/${CARDS.length}</span></div>
    </div>
    <div className="lc-foil"></div><div className="lc-glare"></div>
    ${isNew && !mini && h`<span className="lc-new">${t('nw')}</span>`}
    ${card.sup && !mini && h`<span className="lc-day">⚡ ${new Date().toLocaleDateString(LG(),{day:'numeric',month:'short'})}</span>`}
  </div>`; }

/* rayos (dibujo propio) para la carta del día */
const ZAP_IN=['M8 0 L20 22 L13 25 L27 46','M92 0 L80 20 L88 24 L74 44','M0 62 L16 58 L12 68 L30 66','M100 58 L84 62 L89 70 L70 72','M22 100 L30 82 L24 80 L36 66','M80 100 L72 84 L79 80 L66 68'];
const ZAP_OUT=['M0 8 L14 16 L9 20 L24 30 L19 34 L33 42','M100 6 L86 15 L92 20 L76 29 L82 34 L67 43','M0 52 L12 50 L8 56 L22 55 L18 61 L30 60','M100 50 L88 49 L92 56 L78 55 L82 62 L70 61','M4 100 L16 86 L10 83 L24 71 L18 68 L32 58','M96 100 L84 87 L90 83 L76 72 L82 68 L68 59','M38 0 L42 10 L37 12 L44 24','M62 100 L58 90 L63 88 L56 76','M60 0 L57 9 L62 11 L56 22','M40 100 L43 91 L38 89 L45 78'];
const SPK=[[8,18,22,0],[86,14,18,.4],[14,70,16,.9],[90,64,24,.2],[24,40,14,1.3],[78,38,14,.7],[50,8,18,1.1],[12,88,20,.5],[88,88,16,1.5],[50,92,14,.3]];
function Reveal({card, mode='win', onClose, say, tone}){ const React=R(), h=H(); const {useEffect, useRef}=React; const c=BYID[card.id];
  const tilt=useRef(null), face=useRef(null), stage=useRef(null);
  const w=Math.max(150, Math.round(Math.min(window.innerWidth*.68, 300, (window.innerHeight-(mode==='win'? (card.sup? 300 : 250) : 170))/1.4)));
  useEffect(()=>{ let a=true; const ts=[];
    if(tone && sup) try{ [523,659,784,1047,1319,1568].forEach((f,i)=>tone(f,.04+i*.09,.4)); [1047,1319,1568,2093].forEach((f,i)=>tone(f,.75+i*.07,.7)); }catch(e){}
    if(tone) try{ [784,988,1175,1568,1976].forEach((f,i)=>tone(f,(sup?1.5:.05)+i*.11,.35)); ts.push(setTimeout(()=>{ if(a) [1319,1568,2093].forEach((f,i)=>tone(f,i*.08,.5)); },1750)); }catch(e){}
    if(say) ts.push(setTimeout(()=>{ if(a) say(mode==='win'? sayFor(card) : [c.name]); }, mode==='win'? 450 : 100));
    return ()=>{ a=false; ts.forEach(clearTimeout); }; },[]);
  function move(e){ const st0=stage.current, tl=tilt.current; if(!st0||!tl) return; const r=st0.getBoundingClientRect();
    const dx=Math.max(-1,Math.min(1,(e.clientX-(r.left+r.width/2))/(r.width/2))), dy=Math.max(-1,Math.min(1,(e.clientY-(r.top+r.height/2))/(r.height/2)));
    tl.style.transform=`rotateX(${(-dy*16).toFixed(1)}deg) rotateY(${(dx*20).toFixed(1)}deg)`;
    const f=face.current&&face.current.firstChild; if(f){ f.style.setProperty('--mx',(50+dx*45).toFixed(0)+'%'); f.style.setProperty('--my',(50+dy*45).toFixed(0)+'%'); } }
  function leave(){ if(tilt.current) tilt.current.style.transform=''; }
  const sup= mode==='win' && !!card.sup; const stx= sup? supText(card) : ''; const cut= stx.indexOf(',');
  const title= sup? stx : mode!=='win'? c.name.toUpperCase() : card.evo? F(t('evo'), BYID[card.evo].name.toUpperCase()) : t('won');
  return h`<div className=${'lc-ov'+(sup?' sup':'')} role="dialog" aria-label=${title} onPointerMove=${move} onPointerDown=${move} onPointerUp=${leave} onPointerLeave=${leave}>
    <div className="lc-rays"></div><div className="lc-glow"></div>
    <div className="lc-spk">${SPK.map(([x,y,s,d],k)=>h`<i key=${k} style=${{left:x+'%', top:y+'%', fontSize:s+'px', animationDelay:(d+(mode==='win'?1.2:0))+'s'}}>✦</i>`)}</div>
    ${sup && h`<svg className="lc-bolts" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${ZAP_OUT.map((d,k)=>h`<path key=${k} d=${d} style=${{animationDelay:(k*.17)+'s'}}/>`)}</svg>`}
    ${sup && cut>0? h`<h2><span>${stx.slice(0,cut+1)}</span><span>${stx.slice(cut+1).trim()}</span></h2>` : h`<h2>${title}</h2>`}
    <div className="lc-stage" ref=${stage}><div className="lc-float"><div className="lc-tilt" ref=${tilt}>
      <div className=${'lc-card'+(mode==='win'?' spin':'')} style=${{fontSize:(w*.072).toFixed(1)+'px'}}>
        <div className="lc-front" ref=${face}><${Face} card=${card} w=${w} isNew=${mode==='win' && card.isNew}/></div>
        <div className="lc-back"><span>✦ LUMI ✦</span></div>
      </div></div></div></div>
    ${mode==='win' && h`<p className="lc-sub">${sup? t('daily')+' ' : ''}${t('double')}</p>`}
    <button className="btn sun" onClick=${e=>{ e.stopPropagation(); onClose&&onClose(); }}>${mode==='win'? t('ok')+' ✨' : t('close')}</button>
  </div>`; }

function Album({save, say, tone}){ const React=R(), h=H(); const [open,setOpen]=React.useState(null); const g=st(save).got||{};
  const n=owned(save), shN=CARDS.filter(c=>g[c.id+'*']).length;
  return h`<div className="lc-album">
    <h3>✨ ${t('album')}</h3>
    <p className="small"><b>${F(t('count'), n, CARDS.length)}</b>${shN? ' · ✨ '+F(t('shinyN'), shN) : ''}</p>
    <div className="lc-grid">${CARDS.map(c=>{ const k= g[c.id+'*']? c.id+'*' : g[c.id]? c.id : null; const cnt=(g[c.id]||0)+(g[c.id+'*']||0);
      return k? h`<button key=${c.id} className="lc-cell" onClick=${()=>setOpen({id:c.id, shiny:k.endsWith('*')})} aria-label=${c.name}><${Face} card=${{id:c.id, shiny:k.endsWith('*')}} w=${96} mini=${true}/>${cnt>1 && h`<span className="lc-cnt">×${cnt}</span>`}</button>`
        : h`<div key=${c.id} className="lc-cell off" aria-hidden="true"><${Face} card=${{id:c.id}} w=${96} mini=${true}/></div>`; })}</div>
    <p className="small muted">${t('howDay')} ${t('how')}</p>
    ${open && h`<${Reveal} card=${open} mode="view" say=${say} tone=${null} onClose=${()=>setOpen(null)}/>`}
  </div>`; }

window.LumiCards={CARDS, BYID, TYPES, roll, apply, choose, sayFor, owned, Reveal, Album, Face, OwnImg, t, rules:{CHANCE, PITY, MAXDAY, GAP}};
})();
