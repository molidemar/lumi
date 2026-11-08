/* Lumi · Test de coeficiente intelectual (estimación) para 12 a 100 años.
   Diseño propio inspirado en la ESTRUCTURA pública de las escalas Wechsler (WAIS-V) y Stanford-Binet 5
   y en el modelo CHC (Cattell-Horn-Carroll). No usa preguntas, láminas ni baremos de esos tests.
   - 7 áreas: razonamiento fluido, comprensión verbal, visoespacial, memoria de trabajo, velocidad de procesamiento,
     razonamiento cuantitativo (que no está como índice en WAIS) y atención sostenida (tipo CPT, que WAIS no mide).
   - Dificultad adaptativa pregunta a pregunta (modelo de respuesta al ítem, estimación EAP) en los tres modos;
     el modo preciso además sigue hasta que el error de medida es chico.
   - Edad: se compara con lo esperable para la edad (curvas de desarrollo y envejecimiento aproximadas de la literatura).
     El sexo se guarda solo como dato: no cambia el puntaje (los tests modernos no usan normas por sexo).
   - Los parámetros de dificultad y las curvas por edad son estimaciones de diseño, no baremos medidos:
     el resultado es un CI ESTIMADO con su margen de error, no un diagnóstico clínico.
   Archivo aparte de index.html para no chocar con otros cambios. Expone window.LumiIQ. */
(function(){
'use strict';
const {useState,useEffect,useRef,useMemo}=React;
const h=htm.bind(React.createElement);
const LG=()=>{ const l=(document.documentElement.lang||'es').slice(0,2); return l==='ca'||l==='en'? l : 'es'; };
const LI=()=>({es:0,ca:1,en:2})[LG()];

/* ---------- utilidades ---------- */
const rnd=n=>Math.floor(Math.random()*n);
const ri=(a,b)=>a+rnd(b-a+1);
const pick=a=>a[rnd(a.length)];
const shuffle=a=>{ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=rnd(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const now=()=>(typeof performance!=='undefined'? performance.now() : Date.now());
function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function ncdf(z){ const t=1/(1+.2316419*Math.abs(z)); const d=.3989423*Math.exp(-z*z/2);
  const p=d*t*(.3193815+t*(-.3565638+t*(1.781478+t*(-1.821256+t*1.330274)))); return z>0? 1-p : p; }
function nqi(p){ /* inversa de la normal (Acklam) */ p=clamp(p,1e-6,1-1e-6);
  const a=[-39.6968302866538,220.946098424521,-275.928510446969,138.357751867269,-30.6647980661472,2.50662827745924],
        b=[-54.4760987982241,161.585836858041,-155.698979859887,66.8013118877197,-13.2806815528857],
        c=[-.00778489400243029,-.322396458041136,-2.40075827716184,-2.54973253934373,4.37466414146497,2.93816398269878],
        d=[.00778469570904146,.32246712907004,2.445134137143,3.75440866190742];
  const pl=.02425; let q,r;
  if(p<pl){ q=Math.sqrt(-2*Math.log(p)); return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
  if(p>1-pl){ q=Math.sqrt(-2*Math.log(1-p)); return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
  q=p-.5; r=q*q; return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1); }

/* ---------- textos (es · ca · en) ---------- */
const S={
  title:['Test de coeficiente intelectual','Test de coeficient intel·lectual','IQ test'],
  sub:['Para 12 a 100 años · 7 áreas · se adapta a cada respuesta','De 12 a 100 anys · 7 àrees · s\'adapta a cada resposta','Ages 12 to 100 · 7 areas · adapts to every answer'],
  back:['Volver','Tornar','Back'],
  quit:['Salir del test','Sortir del test','Leave the test'],
  quitQ:['¿Salir? Se pierde lo hecho en este test.','Sortir? Es perd el que has fet en aquest test.','Leave? Progress in this test will be lost.'],
  yesQuit:['Sí, salir','Sí, surt','Yes, leave'], no:['No','No','No'],
  mode:['Modo','Mode','Mode'],
  quick:['Rápido','Ràpid','Quick'], medium:['Medio','Mitjà','Standard'], precise:['Preciso','Precís','Precise'],
  quickD:['Unos 12 minutos. Una primera idea, con más margen de error.','Uns 12 minuts. Una primera idea, amb més marge d\'error.','About 12 minutes. A first idea, with a wider margin of error.'],
  mediumD:['Unos 25 minutos. Buen equilibrio entre tiempo y precisión.','Uns 25 minuts. Bon equilibri entre temps i precisió.','About 25 minutes. A good balance of time and precision.'],
  preciseD:['Unos 45 minutos. Sigue hasta que la medida es estable: el margen más chico.','Uns 45 minuts. Continua fins que la mesura és estable: el marge més petit.','About 45 minutes. Keeps going until the measure is stable: the smallest margin.'],
  who:['¿Quién hace el test?','Qui fa el test?','Who is taking the test?'],
  age:['Edad','Edat','Age'], years:['años','anys','years'],
  sex:['Sexo (opcional)','Sexe (opcional)','Sex (optional)'],
  sexF:['Femenino','Femení','Female'], sexM:['Masculino','Masculí','Male'], sexX:['Prefiero no decirlo','Prefereixo no dir-ho','Prefer not to say'],
  sexNote:['Se guarda como dato. No cambia el puntaje: los tests serios comparan por edad, no por sexo.','Es desa com a dada. No canvia la puntuació: els tests seriosos comparen per edat, no per sexe.','Saved as information only. It does not change the score: serious tests compare by age, not by sex.'],
  ageErr:['Poné una edad entre 12 y 100 años.','Posa una edat entre 12 i 100 anys.','Enter an age between 12 and 100.'],
  start:['Empezar el test','Comença el test','Start the test'],
  tips:['Antes de empezar: un lugar tranquilo, sin papel, calculadora ni ayuda de nadie. Si se puede, en horizontal y con el sonido apagado.','Abans de començar: un lloc tranquil, sense paper, calculadora ni ajuda de ningú. Si es pot, en horitzontal i amb el so apagat.','Before you start: a quiet place, no paper, calculator or help from anyone. Landscape and sound off if possible.'],
  disc:['Es un CI ESTIMADO, no un diagnóstico. Las preguntas y las curvas por edad son propias y aproximadas: no reemplaza una evaluación con un psicólogo. No detecta TDAH, autismo ni otros trastornos.','És un CI ESTIMAT, no un diagnòstic. Les preguntes i les corbes per edat són pròpies i aproximades: no substitueix una avaluació amb un psicòleg. No detecta TDAH, autisme ni altres trastorns.','This is an ESTIMATED IQ, not a diagnosis. Items and age curves are our own and approximate: it does not replace an assessment by a psychologist. It does not detect ADHD, autism or other conditions.'],
  hist:['Resultados anteriores','Resultats anteriors','Previous results'],
  kidNote:['Este perfil es de {0} años. El test es para 12 a 100: para un adulto, mejor creá su propio perfil, así su plan no se mezcla con el de los chicos.','Aquest perfil és de {0} anys. El test és de 12 a 100: per a un adult, millor crea el seu propi perfil, així el seu pla no es barreja amb el dels nens.','This profile is {0} years old. The test is for ages 12 to 100: for an adult, better create their own profile so their plan does not mix with the children\'s.'],
  testN:['Prueba {0} de {1}','Prova {0} de {1}','Task {0} of {1}'],
  example:['Ver un ejemplo','Veure un exemple','Try an example'],
  go:['Empezar','Comença','Start'], goOn:['Seguir','Continua','Continue'],
  exampleT:['Ejemplo (no cuenta)','Exemple (no compta)','Example (does not count)'],
  right:['¡Correcto!','Correcte!','Correct!'], wrongWas:['La respuesta era: {0}','La resposta era: {0}','The answer was: {0}'],
  ok:['OK','OK','OK'], yes:['SÍ','SÍ','YES'], noB:['NO','NO','NO'],
  watch:['Mirá…','Mira…','Watch…'], yourTurn:['Ahora vos','Ara tu','Your turn'],
  tapBtn:['TOCAR','TOCA','TAP'],
  timeLeft:['{0} s','{0} s','{0} s'],
  computing:['Calculando…','Calculant…','Calculating…'],
  /* informe */
  estIQ:['CI estimado','CI estimat','Estimated IQ'],
  range:['Rango probable (95 %): {0} a {1}','Rang probable (95 %): {0} a {1}','Likely range (95%): {0} to {1}'],
  pct:['Mejor que el {0} % de las personas de {1} años','Millor que el {0} % de les persones de {1} anys','Higher than {0}% of people aged {1}'],
  areas:['Por áreas','Per àrees','By area'],
  attIdx:['Atención sostenida (aparte del CI)','Atenció sostinguda (a part del CI)','Sustained attention (separate from IQ)'],
  strong:['Puntos fuertes','Punts forts','Strengths'], weak:['Para reforzar','Per reforçar','To strengthen'],
  noneWeak:['Ningún área queda claramente por debajo. Para mantener: un poco de todo cada día.','Cap àrea queda clarament per sota. Per mantenir: una mica de tot cada dia.','No area is clearly below the rest. To maintain: a bit of everything every day.'],
  apply:['Aplicar el plan de refuerzo','Aplica el pla de reforç','Apply the training plan'],
  applied:['Plan aplicado: los ejercicios diarios darán más lugar a {0}.','Pla aplicat: els exercicis diaris donaran més lloc a {0}.','Plan applied: daily exercises will give more room to {0}.'],
  train:['Entrenar','Entrena','Train'],
  trainT:['Entrenamiento: {0}','Entrenament: {0}','Training: {0}'],
  trainNote:['No cuenta para el CI. Ojo: entrenar con el mismo tipo de ejercicio sube el puntaje del test por práctica; para medir el progreso, repetí el test cada 3 meses o más.','No compta per al CI. Compte: entrenar amb el mateix tipus d\'exercici puja la puntuació del test per pràctica; per mesurar el progrés, repeteix el test cada 3 mesos o més.','Does not count towards IQ. Note: training on the same item types raises test scores through practice; to measure progress, retake the test every 3 months or more.'],
  trainDone:['{0} de {1} bien','{0} de {1} bé','{0} of {1} correct'],
  again:['Otra vez','Una altra vegada','Again'],
  validity:['Algunas respuestas parecen hechas al azar, con apuro o con distracciones. El resultado puede quedar por debajo de lo real: conviene repetirlo con calma otro día.','Algunes respostes semblen fetes a l\'atzar, amb pressa o amb distraccions. El resultat pot quedar per sota del real: convé repetir-lo amb calma un altre dia.','Some answers look random, rushed or distracted. The result may be lower than the true one: consider retaking it calmly another day.'],
  how:['Cómo se calcula','Com es calcula','How it is calculated'],
  howT:['Cada respuesta ajusta la dificultad de la siguiente y la estimación de cada área (modelo de respuesta al ítem). Cada área se compara con lo esperable a tu edad y se pasa a la escala de CI (media 100, desvío 15). El CI combina razonamiento, verbal, visoespacial, memoria, velocidad y cálculo; la atención se informa aparte. El rango suma el error de medida y la incertidumbre de las curvas por edad, que son aproximadas.','Cada resposta ajusta la dificultat de la següent i l\'estimació de cada àrea (model de resposta a l\'ítem). Cada àrea es compara amb el que s\'espera a la teva edat i es passa a l\'escala de CI (mitjana 100, desviació 15). El CI combina raonament, verbal, visuoespacial, memòria, velocitat i càlcul; l\'atenció s\'informa a part. El rang suma l\'error de mesura i la incertesa de les corbes per edat, que són aproximades.','Each answer adjusts the difficulty of the next one and the estimate for each area (item response theory). Each area is compared with what is expected at your age and placed on the IQ scale (mean 100, SD 15). The IQ combines reasoning, verbal, visual-spatial, memory, speed and maths; attention is reported separately. The range adds measurement error and the uncertainty of the age curves, which are approximate.'],
  mins:['{0} min','{0} min','{0} min'],
  modeOf:['Modo {0}','Mode {0}','{0} mode'],
  del:['Borrar','Esborra','Delete'],
  sexL:['Sexo: {0}','Sexe: {0}','Sex: {0}'],
};
const t=(k,...a)=>{ const v=S[k]; let s=v? v[LI()] : k; return s.replace(/\{(\d)\}/g,(m,i)=>a[+i]); };
const T3=a=>a[LI()];

/* ---------- áreas ---------- */
const AREAS=[
  {k:'gf', n:['Razonamiento fluido','Raonament fluid','Fluid reasoning'], subs:['mat','ser'], w:1.25,
    tip:['Lógica: series, matrices y laberintos. Pensar la regla antes de responder.','Lògica: sèries, matrius i laberints. Pensar la regla abans de respondre.','Logic: series, matrices and mazes. Find the rule before answering.']},
  {k:'gc', n:['Comprensión verbal','Comprensió verbal','Verbal comprehension'], subs:['voc','ana'], w:1.25,
    tip:['Lenguaje: leer cada día, buscar palabras nuevas y explicar con palabras propias lo leído.','Llenguatge: llegir cada dia, buscar paraules noves i explicar amb paraules pròpies el que s\'ha llegit.','Language: read every day, look up new words and retell what you read in your own words.']},
  {k:'gv', n:['Visoespacial','Visuoespacial','Visual-spatial'], subs:['rot'], w:1,
    tip:['Imaginar figuras giradas: rompecabezas, laberintos, mapas y construcciones.','Imaginar figures girades: trencaclosques, laberints, mapes i construccions.','Picture rotated shapes: puzzles, mazes, maps and building toys.']},
  {k:'gwm', n:['Memoria de trabajo','Memòria de treball','Working memory'], subs:['dfw','dbw','cor'], w:1,
    tip:['Memoria: recordar secuencias cada vez más largas, en orden y al revés.','Memòria: recordar seqüències cada vegada més llargues, en ordre i a l\'inrevés.','Memory: recall ever longer sequences, forwards and backwards.']},
  {k:'gs', n:['Velocidad de procesamiento','Velocitat de processament','Processing speed'], subs:['sym'], w:.75,
    tip:['Velocidad: búsquedas visuales con tiempo, sin perder la precisión.','Velocitat: cerques visuals amb temps, sense perdre la precisió.','Speed: timed visual searches without losing accuracy.']},
  {k:'gq', n:['Cálculo y razonamiento numérico','Càlcul i raonament numèric','Maths and numerical reasoning'], subs:['cal'], w:1,
    tip:['Cálculo: primero sumas y restas seguras, después tablas, porcentajes y problemas.','Càlcul: primer sumes i restes segures, després taules, percentatges i problemes.','Maths: first solid addition and subtraction, then times tables, percentages and word problems.']},
  {k:'att', n:['Atención sostenida','Atenció sostinguda','Sustained attention'], subs:['cpt'], w:0,
    tip:['Atención: juegos de esperar y reaccionar solo cuando toca, en sesiones cortas y diarias.','Atenció: jocs d\'esperar i reaccionar només quan toca, en sessions curtes i diàries.','Attention: games of waiting and reacting only when needed, in short daily sessions.']},
];
const AREA=Object.fromEntries(AREAS.map(a=>[a.k,a]));
/* áreas de los juegos de Lumi (las claves son las de GAMES en index.html) que refuerza cada área del test */
const FOCUS={gf:['Lógica'], gc:['Comprensión','Lectura'], gv:['Lógica'], gwm:['Memoria'], gs:['Concentración'], gq:['Matemática'], att:['Atención','Concentración','Paciencia']};

/* Media esperada por edad, en unidades theta (0 = adulto joven de 20 a 34 años, desvío 1).
   Aproximación de las tendencias publicadas (desarrollo hasta ~20 años; caída temprana de velocidad,
   razonamiento y memoria; vocabulario que crece hasta ~60). No es un baremo medido. */
const NORM={
  gf:[[12,-1.1],[13,-.9],[14,-.7],[15,-.5],[16,-.35],[17,-.22],[18,-.12],[20,-.04],[25,.02],[30,0],[35,-.08],[40,-.18],[45,-.3],[50,-.43],[55,-.58],[60,-.75],[65,-.93],[70,-1.12],[75,-1.33],[80,-1.55],[85,-1.78],[90,-2],[100,-2.4]],
  gv:[[12,-1.05],[13,-.86],[14,-.67],[15,-.48],[16,-.33],[17,-.21],[18,-.12],[20,-.04],[25,.02],[30,0],[35,-.07],[40,-.16],[45,-.27],[50,-.39],[55,-.53],[60,-.69],[65,-.86],[70,-1.04],[75,-1.24],[80,-1.45],[85,-1.67],[90,-1.89],[100,-2.3]],
  gs:[[12,-1.25],[13,-1],[14,-.8],[15,-.6],[16,-.42],[17,-.28],[18,-.16],[20,-.04],[25,.03],[30,-.02],[35,-.12],[40,-.25],[45,-.4],[50,-.56],[55,-.74],[60,-.93],[65,-1.13],[70,-1.35],[75,-1.58],[80,-1.82],[85,-2.06],[90,-2.3],[100,-2.75]],
  gwm:[[12,-.95],[13,-.78],[14,-.62],[15,-.48],[16,-.35],[17,-.24],[18,-.15],[20,-.05],[25,.02],[30,0],[35,-.05],[40,-.11],[45,-.18],[50,-.27],[55,-.37],[60,-.49],[65,-.62],[70,-.77],[75,-.94],[80,-1.12],[85,-1.32],[90,-1.52],[100,-1.9]],
  gc:[[12,-1.45],[13,-1.25],[14,-1.06],[15,-.88],[16,-.72],[17,-.58],[18,-.46],[20,-.28],[25,-.06],[30,.08],[35,.2],[40,.3],[45,.38],[50,.44],[55,.48],[60,.5],[65,.48],[70,.4],[75,.28],[80,.12],[85,-.08],[90,-.3],[100,-.75]],
  gq:[[12,-1.2],[13,-.98],[14,-.78],[15,-.6],[16,-.45],[17,-.32],[18,-.22],[20,-.1],[25,0],[30,.02],[35,.02],[40,0],[45,-.03],[50,-.07],[55,-.12],[60,-.2],[65,-.3],[70,-.42],[75,-.56],[80,-.72],[85,-.9],[90,-1.1],[100,-1.5]],
  att:[[12,-.85],[13,-.7],[14,-.56],[15,-.44],[16,-.33],[17,-.24],[18,-.16],[20,-.06],[25,0],[30,0],[35,-.03],[40,-.07],[45,-.12],[50,-.18],[55,-.25],[60,-.33],[65,-.43],[70,-.55],[75,-.69],[80,-.85],[85,-1.02],[90,-1.2],[100,-1.55]],
};
function normMu(area, age){ const p=NORM[area]; age=clamp(+age||30,12,100);
  for(let i=1;i<p.length;i++) if(age<=p[i][0]){ const [a0,v0]=p[i-1],[a1,v1]=p[i]; return v0+(v1-v0)*(age-a0)/(a1-a0); }
  return p[p.length-1][1]; }

/* ---------- modelo de respuesta al ítem ---------- */
const GRID=[]; for(let x=-6;x<=6.0001;x+=.05) GRID.push(x);
const p3=(th,b,c,a)=>c+(1-c)/(1+Math.exp(-a*(th-b)));
function eap(resp, mu, sd=1.15){ if(!resp.length) return {th:mu, se:sd};
  const lw=GRID.map(th=>{ let s=-.5*((th-mu)/sd)**2; for(const r of resp){ const p=p3(th,r.b,r.c||0,r.a||1.6); s+= r.ok? Math.log(p) : Math.log(1-p); } return s; });
  const m=Math.max(...lw); let w0=0,w1=0,w2=0; GRID.forEach((th,i)=>{ const w=Math.exp(lw[i]-m); w0+=w; w1+=w*th; w2+=w*th*th; });
  const th=w1/w0; return {th, se:Math.sqrt(Math.max(1e-6,w2/w0-th*th))}; }

/* ---------- 1. Matrices ---------- */
const MSH=['circle','square','triangle','pentagon','hexagon','star','cross'];
const ARROW=7;
const DOM={shape:[0,1,2,3,4,5,6], count:[1,2,3,4], fill:[0,1,2,3], size:[0,1,2], rot:[0,1,2,3,4,5,6,7]};
const MAT_LV=[null,
  {r:[['count','prog']],o:6,d:2},
  {r:[['shape','dist']],o:6,d:2},
  {r:[['count','prog'],['shape','row']],o:6,d:2},
  {r:[['shape','dist'],['fill','prog']],o:6,d:2},
  {r:[['shape','dist'],['count','dist']],o:8,d:1},
  {r:[['shape','dist'],['count','prog'],['fill','dist']],o:8,d:1},
  {r:[['rot','prog'],['count','dist'],['fill','prog']],o:8,d:1},
  {r:[['shape','dist'],['count','dist'],['fill','dist']],o:8,d:1,mix:1},
  {r:[['shape','dist'],['count','prog'],['fill','dist'],['size','dist']],o:8,d:1,mix:1},
  {r:[['rot','prog'],['count','dist'],['fill','dist'],['size','prog']],o:8,d:1,mix:1}];
function attrFn(attr, rule, mix, dirN){ const dom=DOM[attr];
  if(rule==='row'){ const vs=shuffle(dom).slice(0,3); return (r)=>vs[r]; }
  if(rule==='dist'){ const vs=shuffle(dom).slice(0,3); const dir=1+((dirN||0)%2); return (r,c)=>vs[(c+dir*r)%3]; }
  if(attr==='rot'){ const st=pick([1,2,3]); const v0=[rnd(8),rnd(8),rnd(8)]; return (r,c)=>(v0[r]+c*st)%8; }
  const lo=dom[0], hi=dom[dom.length-1]; const step=pick([1,-1]); const starts=dom.filter(v=>v+2*step>=lo && v+2*step<=hi);
  const v0=mix? [pick(starts),pick(starts),pick(starts)] : Array(3).fill(pick(starts)); return (r,c)=>v0[r]+c*step; }
const mkey=o=>[o.shape,o.count,o.fill,o.size,o.rot].join(',');
function genMat(lv){ const L=MAT_LV[lv]; const rules=Object.fromEntries(L.r); const fn={};
  const hasRot=!!rules.rot; let dn=rnd(2);
  for(const a of ['shape','count','fill','size','rot']){
    if(rules[a]) fn[a]=attrFn(a, rules[a], L.mix, rules[a]==='dist'? dn++ : 0);
    else { const v= a==='shape'? (hasRot? ARROW : pick([0,1,2,3,4])) : a==='count'? pick([1,1,2]) : a==='fill'? pick([0,1,2]) : a==='size'? pick([1,2]) : 0; fn[a]=()=>v; } }
  const cells=[]; for(let r=0;r<3;r++) for(let c=0;c<3;c++){ const o={}; for(const a in fn) o[a]=fn[a](r,c); cells.push(o); }
  const ans=cells[8]; const active=L.r.map(x=>x[0]);
  const vary=[...new Set([...active, ...(hasRot? ['count','fill','size'] : ['shape','count','fill','size'])])];
  const seen=new Set([mkey(ans)]); const opts=[ans]; let g=0;
  const alt=(k,cur)=>{ const inM=[...new Set(cells.map(c=>c[k]))].filter(v=>v!==cur); const dom=(k==='shape'&&hasRot)? [ARROW] : DOM[k].filter(v=>v!==cur);
    return inM.length && Math.random()<.75? pick(inM) : (dom.length? pick(dom) : cur); };
  while(opts.length<L.o && g++<600){ const o={...ans}; const nd= L.d===2 && Math.random()<.6? 2 : 1;
    const ks=shuffle(Math.random()<.8? active : vary).slice(0,nd); if(nd===2 && ks.length<2) ks.push(pick(vary.filter(k=>k!==ks[0])));
    ks.forEach(k=>{ if(k) o[k]=alt(k,o[k]); }); const kk=mkey(o); if(!seen.has(kk)){ seen.add(kk); opts.push(o); } }
  const order=shuffle(opts.map((_,i)=>i));
  return {kind:'choice', sub:'mat', lv, cells, opts:order.map(i=>opts[i]), answer:order.indexOf(0), c:1/opts.length}; }
const FILLS=['#FFFFFF','#C9C9C9','#6E6E6E','#141414'];
const POS={1:[[50,50]],2:[[29,50],[71,50]],3:[[50,27],[27,71],[73,71]],4:[[29,29],[71,29],[29,71],[71,71]]};
const RB={1:36,2:20,3:19,4:18}; const SZ=[.55,.78,1];
function polyPts(cx,cy,r,n,start){ const p=[]; for(let i=0;i<n;i++){ const a=(start+i*360/n)*Math.PI/180; p.push((cx+r*Math.cos(a)).toFixed(1)+','+(cy+r*Math.sin(a)).toFixed(1)); } return p.join(' '); }
function shapeEl(o,cx,cy,r,key){ const f=FILLS[o.fill], st={fill:f, stroke:'#111', strokeWidth:3, strokeLinejoin:'round'};
  switch(o.shape){
    case 0: return h`<circle key=${key} cx=${cx} cy=${cy} r=${r*.9} style=${st}/>`;
    case 1: return h`<polygon key=${key} points=${polyPts(cx,cy,r*1.05,4,45)} style=${st}/>`;
    case 2: return h`<polygon key=${key} points=${polyPts(cx,cy+r*.12,r*1.1,3,-90)} style=${st}/>`;
    case 3: return h`<polygon key=${key} points=${polyPts(cx,cy,r,5,-90)} style=${st}/>`;
    case 4: return h`<polygon key=${key} points=${polyPts(cx,cy,r,6,0)} style=${st}/>`;
    case 5: { const p=[]; for(let i=0;i<10;i++){ const rr=i%2? r*.45 : r*1.05; const a=(-90+i*36)*Math.PI/180; p.push((cx+rr*Math.cos(a)).toFixed(1)+','+(cy+rr*Math.sin(a)).toFixed(1)); } return h`<polygon key=${key} points=${p.join(' ')} style=${st}/>`; }
    case 6: { const a=r*.34, b=r*.95; const pts=[[-a,-b],[a,-b],[a,-a],[b,-a],[b,a],[a,a],[a,b],[-a,b],[-a,a],[-b,a],[-b,-a],[-a,-a]].map(([x,y])=>(cx+x).toFixed(1)+','+(cy+y).toFixed(1)).join(' '); return h`<polygon key=${key} points=${pts} style=${st}/>`; }
    default: { const pts=[[0,-1],[.62,-.1],[.24,-.1],[.24,1],[-.24,1],[-.24,-.1],[-.62,-.1]].map(([x,y])=>(cx+x*r).toFixed(1)+','+(cy+y*r).toFixed(1)).join(' ');
      return h`<polygon key=${key} points=${pts} transform=${`rotate(${o.rot*45} ${cx} ${cy})`} style=${st}/>`; } } }
function MatCell({o, q}){ if(q) return h`<div className="iq-cell q">?</div>`;
  const r=RB[o.count]*SZ[o.size]; return h`<div className="iq-cell"><svg viewBox="0 0 100 100" aria-hidden="true">${POS[o.count].map(([x,y],i)=>shapeEl(o,x,y,r,i))}</svg></div>`; }

/* ---------- 2. Rotación mental ---------- */
const ROT_LV=[null,{n:4,ang:[90,270],near:0},{n:5,ang:[90,270],near:0},{n:5,ang:[180],near:0},{n:6,ang:[90,180,270],near:0},{n:6,ang:[90,180,270],near:1},
  {n:7,ang:[90,180,270],near:1},{n:7,ang:[45,135,225,315],near:1},{n:8,ang:[90,180,270],near:2},{n:8,ang:[45,135,225,315],near:2},{n:9,ang:[45,135,225,315],near:2}];
const norm=cs=>{ const mx=Math.min(...cs.map(c=>c[0])), my=Math.min(...cs.map(c=>c[1])); return cs.map(([x,y])=>[x-mx,y-my]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]); };
const ckey=cs=>norm(cs).map(c=>c.join('.')).join('|');
const rot90=cs=>cs.map(([x,y])=>[y,-x]);
const mirror=cs=>cs.map(([x,y])=>[-x,y]);
function rotKeys(cs){ const k=[]; let c=cs; for(let i=0;i<4;i++){ k.push(ckey(c)); c=rot90(c); } return k; }
const canon=cs=>rotKeys(cs).sort()[0];
const NB=[[1,0],[-1,0],[0,1],[0,-1]];
function connected(cs){ const s=new Set(cs.map(c=>c.join('.'))); const seen=new Set([cs[0].join('.')]); const st=[cs[0]];
  while(st.length){ const [x,y]=st.pop(); for(const [dx,dy] of NB){ const k=(x+dx)+'.'+(y+dy); if(s.has(k)&&!seen.has(k)){ seen.add(k); st.push([x+dx,y+dy]); } } } return seen.size===cs.length; }
function genPoly(n){ for(let g=0;g<400;g++){ const cs=[[0,0]]; const s=new Set(['0.0']);
    while(cs.length<n){ const [x,y]=pick(cs); const [dx,dy]=pick(NB); const k=(x+dx)+'.'+(y+dy); if(!s.has(k)){ s.add(k); cs.push([x+dx,y+dy]); } }
    const nn=norm(cs); const w=Math.max(...nn.map(c=>c[0]))+1, hh=Math.max(...nn.map(c=>c[1]))+1; if(Math.max(w,hh)>(n<=6?4:5)) continue;
    if(rotKeys(nn).includes(canon(mirror(nn))) || rotKeys(mirror(nn)).includes(ckey(nn))) continue; return nn; } return norm([[0,0],[1,0],[2,0],[2,1]]); }
function nearPoly(cs){ for(let g=0;g<200;g++){ const i=rnd(cs.length); const rest=cs.filter((_,j)=>j!==i); if(!connected(rest)) continue;
    const s=new Set(rest.map(c=>c.join('.'))); const cand=[]; rest.forEach(([x,y])=>NB.forEach(([dx,dy])=>{ const k=(x+dx)+'.'+(y+dy); if(!s.has(k) && !(x+dx===cs[i][0]&&y+dy===cs[i][1])) cand.push([x+dx,y+dy]); }));
    if(!cand.length) continue; const nn=norm([...rest, pick(cand)]); return nn; } return null; }
function genRot(lv){ const L=ROT_LV[lv];
  for(let g=0;g<200;g++){ const S0=genPoly(L.n); const M=mirror(S0); const used=new Set([canon(S0), canon(M)]); const dis=[{cs:M}];
    let ok=true; for(let k=0;k<2;k++){ let d=null; for(let q=0;q<60&&!d;q++){ const nb=nearPoly(S0); if(!nb) continue; const c= k<L.near? nb : mirror(nb); const kk=canon(c); if(!used.has(kk)){ used.add(kk); d={cs:c}; } } if(!d){ ok=false; break; } dis.push(d); }
    if(!ok) continue; const opts=[{cs:S0}, ...dis].map(o=>({cs:o.cs, ang:pick(L.ang)+ (Math.random()<.5? 0 : 0)}));
    const order=shuffle([0,1,2,3]); return {kind:'choice', sub:'rot', lv, target:S0, opts:order.map(i=>opts[i]), answer:order.indexOf(0), c:.25}; }
  return genRot(Math.max(1,lv-1)); }
function PolySvg({cs, ang=0, size}){ const w=Math.max(...cs.map(c=>c[0]))+1, hh=Math.max(...cs.map(c=>c[1]))+1; const u=Math.min(64/Math.max(w,hh), 18);
  const ox=50-w*u/2, oy=50-hh*u/2;
  return h`<svg viewBox="0 0 100 100" width=${size} height=${size} aria-hidden="true"><g transform=${`rotate(${ang} 50 50)`}>${cs.map(([x,y],i)=>h`<rect key=${i} x=${ox+x*u} y=${oy+y*u} width=${u} height=${u} style=${{fill:'#9A9A9A', stroke:'#111', strokeWidth:2.5}}/>`)}</g></svg>`; }

/* ---------- 3. Series numéricas ---------- */
function genSer(lv){ let s=[], len=5;
  for(let g=0;g<50;g++){ s=[]; len=5;
    switch(lv){
      case 1:{ const a=ri(1,10), d=ri(2,5); for(let i=0;i<6;i++) s.push(a+i*d); break; }
      case 2:{ if(Math.random()<.5){ const d=ri(2,6), a=ri(30,60); for(let i=0;i<6;i++) s.push(a-i*d); } else { const a=ri(1,5); for(let i=0;i<6;i++) s.push(a*2**i); } break; }
      case 3:{ const a=ri(1,9), d0=ri(1,3); let v=a; for(let i=0;i<6;i++){ s.push(v); v+=d0+i; } break; }
      case 4:{ if(Math.random()<.5){ const a=ri(1,4), k=3; let v=a; for(let i=0;i<5;i++){ s.push(v); v*=k; } len=4; } else { const m=ri(1,5); let v=m*64; for(let i=0;i<6;i++){ s.push(v); v/=2; } } break; }
      case 5:{ const a=ri(5,20), p=ri(3,7), q=ri(1,p-1); let v=a; for(let i=0;i<8;i++){ s.push(v); v+= i%2? -q : p; } len=7; break; }
      case 6:{ const a=ri(1,9), d1=ri(2,5), b=ri(20,40), d2=-ri(1,4); for(let i=0;i<5;i++){ s.push(a+i*d1); s.push(b+i*d2); } s=s.slice(0,9); len=8; break; }
      case 7:{ const a=ri(1,9), d0=ri(1,4), dd=ri(2,4); let v=a, d=d0; for(let i=0;i<6;i++){ s.push(v); v+=d; d+=dd; } break; }
      case 8:{ if(Math.random()<.5){ let x=ri(1,4), y=ri(2,6); s=[x,y]; for(let i=0;i<5;i++) s.push(s[s.length-1]+s[s.length-2]); s=s.slice(0,7); len=6; }
               else { let v=ri(1,4); for(let i=0;i<6;i++){ s.push(v); v=v*2+1; } } break; }
      case 9:{ if(Math.random()<.5){ const o=ri(1,3), k=ri(-2,4); for(let i=0;i<6;i++) s.push((i+o)**2+k); }
               else { let v=ri(4,9); const k=ri(2,5); for(let i=0;i<7;i++){ s.push(v); v= i%2? v-k : v*2; } len=6; } break; }
      default:{ const ty=rnd(3);
        if(ty===0){ let v=ri(1,9); const d=ri(1,3); let st=d; for(let i=0;i<6;i++){ s.push(v); v+=st; st*=2; } }
        else if(ty===1){ const a=ri(2,9), d=ri(3,7), b=ri(1,3); for(let i=0;i<5;i++){ s.push(a+i*d); s.push(b*2**i); } s=s.slice(0,9); len=8; }
        else { let v=ri(2,5); const k=ri(1,3); for(let i=0;i<6;i++){ s.push(v); v=v*3-k; } len=5; } } }
    s=s.slice(0,len+1); if(s.length===len+1 && s.every(v=>Number.isInteger(v)&&v>=0&&v<100000)) break; }
  return {kind:'num', sub:'ser', lv, seq:s.slice(0,len), answer:s[len], c:.02}; }

/* ---------- 4. Cálculo mental y problemas ---------- */
const WP={
  w1:[
    (x=ri(20,95),y=ri(5,x-5))=>[x-y,[`Tenés ${x} € y gastás ${y} €. ¿Cuántos euros te quedan?`,`Tens ${x} € i en gastes ${y}. Quants euros et queden?`,`You have €${x} and spend €${y}. How many euros are left?`]],
    (x=ri(4,12),y=ri(3,9))=>[x*y,[`Cada caja trae ${x} lápices. ¿Cuántos lápices hay en ${y} cajas?`,`Cada capsa porta ${x} llapis. Quants llapis hi ha en ${y} capses?`,`Each box holds ${x} pencils. How many pencils are in ${y} boxes?`]],
    (y=ri(3,8),q=ri(3,12))=>[q,[`Se reparten ${y*q} caramelos entre ${y} chicos, en partes iguales. ¿Cuántos recibe cada uno?`,`Es reparteixen ${y*q} caramels entre ${y} nens, a parts iguals. Quants en rep cadascun?`,`${y*q} sweets are shared equally among ${y} children. How many does each one get?`]]],
  w2:[
    (n=ri(2,5),p=ri(3,9),bill=(n*p<50?50:100))=>[bill-n*p,[`Comprás ${n} cuadernos a ${p} € cada uno y pagás con un billete de ${bill} €. ¿Cuánto te devuelven?`,`Compres ${n} llibretes a ${p} € cadascuna i pagues amb un bitllet de ${bill} €. Quant et tornen?`,`You buy ${n} notebooks at €${p} each and pay with a €${bill} note. How much change do you get?`]],
    (a=ri(20,45),b=ri(5,15),c=ri(3,18))=>[a-b+c,[`Un autobús sale con ${a} pasajeros. En la primera parada bajan ${b} y suben ${c}. ¿Cuántos pasajeros hay ahora?`,`Un autobús surt amb ${a} passatgers. A la primera parada en baixen ${b} i en pugen ${c}. Quants passatgers hi ha ara?`,`A bus leaves with ${a} passengers. At the first stop ${b} get off and ${c} get on. How many passengers are there now?`]],
    (a=ri(6,25))=>[3*a,[`Ana tiene el doble de libros que Luis, y Luis tiene ${a}. ¿Cuántos libros tienen entre los dos?`,`L'Anna té el doble de llibres que en Lluís, i en Lluís en té ${a}. Quants llibres tenen entre tots dos?`,`Anna has twice as many books as Luis, and Luis has ${a}. How many books do they have altogether?`]]],
  w3:[
    (a=ri(2,5),u=ri(2,6),b=ri(6,12))=>[u*b,[`Si ${a} kg de manzanas cuestan ${a*u} €, ¿cuántos euros cuestan ${b} kg?`,`Si ${a} kg de pomes costen ${a*u} €, quants euros costen ${b} kg?`,`If ${a} kg of apples cost €${a*u}, how many euros do ${b} kg cost?`]],
    (p=pick([40,60,80,120,160,200,240]),q=pick([10,25,50]))=>[p*(100+q)/100,[`Un precio de ${p} € sube un ${q} %. ¿Cuál es el precio nuevo, en euros?`,`Un preu de ${p} € puja un ${q} %. Quin és el preu nou, en euros?`,`A price of €${p} goes up by ${q}%. What is the new price, in euros?`]],
    (p=pick([40,60,80,120,160,200,240]),q=pick([10,25,50]))=>[p*(100-q)/100,[`Una prenda de ${p} € tiene un ${q} % de descuento. ¿Cuánto se paga, en euros?`,`Una peça de ${p} € té un ${q} % de descompte. Quant es paga, en euros?`,`An item costing €${p} has a ${q}% discount. How much do you pay, in euros?`]],
    ()=>{ for(;;){ const w=ri(2,6), d=ri(3,12), w2=ri(2,12); if(w2!==w && (w*d)%w2===0) return [w*d/w2,[`${w} obreros construyen un muro en ${d} días. Al mismo ritmo, ¿cuántos días tardarían ${w2} obreros?`,`${w} obrers construeixen un mur en ${d} dies. Al mateix ritme, quants dies hi trigarien ${w2} obrers?`,`${w} workers build a wall in ${d} days. At the same rate, how many days would ${w2} workers take?`]]; } }]};
function genCal(lv){ let q, a, word=false;
  switch(lv){
    case 1:{ const x=ri(2,9), y=ri(1,9); q=`${x} + ${y}`; a=x+y; break; }
    case 2:{ if(Math.random()<.5){ const x=ri(11,89), y=ri(2,9); q=`${x} + ${y}`; a=x+y; } else { const x=ri(10,18), y=ri(2,9); q=`${x} − ${y}`; a=x-y; } break; }
    case 3:{ const x=ri(25,89), y=ri(12,x-5); if(Math.random()<.5){ q=`${x} + ${y}`; a=x+y; } else { q=`${x} − ${y}`; a=x-y; } break; }
    case 4:{ const x=ri(3,9), y=ri(3,9); if(Math.random()<.6){ q=`${x} × ${y}`; a=x*y; } else { q=`${x*y} ÷ ${x}`; a=y; } break; }
    case 5:{ const [r,qs]=pick(WP.w1)(); a=r; q=T3(qs); word=true; break; }
    case 6:{ if(Math.random()<.5){ const x=ri(12,49), y=ri(3,9); q=`${x} × ${y}`; a=x*y; } else { const x=ri(320,899), y=ri(120,x-50); q=`${x} − ${y}`; a=x-y; } break; }
    case 7:{ if(Math.random()<.6){ const p=pick([10,20,25,50,75]); const n=pick([20,40,60,80,120,200,240,360]); q= LG()==='en'? `${p}% of ${n}` : `${p} % ${LG()==='ca'?'de':'de'} ${n}`; a=p*n/100; if(!Number.isInteger(a)){ q=`10 % de ${n}`; a=n/10; } }
             else { const d=pick([3,4,5,8]), nn=ri(1,d-1), m=d*ri(3,12); q= LG()==='en'? `${nn}/${d} of ${m}` : `${nn}/${d} de ${m}`; a=nn*m/d; } break; }
    case 8:{ const [r,qs]=pick(WP.w2)(); a=r; q=T3(qs); word=true; break; }
    case 9:{ if(Math.random()<.5){ const x=ri(2,9), y=ri(3,9), z=ri(3,9); q=`${x} + ${y} × ${z}`; a=x+y*z; } else { const x=ri(12,29), y=ri(12,19); q=`${x} × ${y}`; a=x*y; } break; }
    default:{ const [r,qs]=pick(WP.w3)(); a=r; q=T3(qs); word=true; } }
  if(LG()==='en') q=q.replace(/(\d) %/g,'$1%');
  return {kind:'num', sub:'cal', lv, q, word, answer:a, c:.02}; }

/* ---------- 5. Vocabulario y analogías (propios, por nivel) ---------- */
/* [nivel, es, ca, en]; cada idioma: palabra|correcta|distractor|distractor|distractor */
const VOC=[
 [1,'CONTENTO|alegre|triste|cansado|lento','CONTENT|alegre|trist|cansat|lent','HAPPY|glad|sad|tired|slow'],
 [1,'COMENZAR|empezar|terminar|comer|saltar','COMENÇAR|iniciar|acabar|menjar|saltar','BEGIN|start|finish|eat|jump'],
 [1,'VELOZ|rápido|pesado|oscuro|frío','VELOÇ|ràpid|pesat|fosc|fred','RAPID|fast|heavy|dark|cold'],
 [2,'ANCIANO|viejo|joven|alto|rico','ANCIÀ|vell|jove|alt|ric','ELDERLY|old|young|tall|rich'],
 [2,'SOLICITAR|pedir|negar|romper|mirar','SOL·LICITAR|demanar|negar|trencar|mirar','REQUEST|ask|deny|break|watch'],
 [2,'ENOJADO|furioso|tranquilo|dormido|limpio','ENFADAT|furiós|tranquil|adormit|net','ANGRY|furious|calm|asleep|clean'],
 [3,'ESCASO|insuficiente|abundante|caro|lejano','ESCÀS|insuficient|abundant|car|llunyà','SCARCE|insufficient|plentiful|expensive|distant'],
 [3,'SINCERO|honesto|falso|tímido|cruel','SINCER|honest|fals|tímid|cruel','SINCERE|honest|false|shy|cruel'],
 [3,'OBSTÁCULO|impedimento|ayuda|camino|premio','OBSTACLE|impediment|ajuda|camí|premi','OBSTACLE|hindrance|help|path|prize'],
 [4,'PERSPICAZ|agudo|torpe|amable|lento','PERSPICAÇ|agut|maldestre|amable|lent','SHREWD|astute|clumsy|kind|slow'],
 [4,'EFÍMERO|pasajero|eterno|frágil|oscuro','EFÍMER|passatger|etern|fràgil|fosc','EPHEMERAL|fleeting|eternal|fragile|dark'],
 [4,'MITIGAR|atenuar|agravar|ocultar|medir','MITIGAR|atenuar|agreujar|amagar|mesurar','MITIGATE|alleviate|aggravate|conceal|measure'],
 [5,'PRÓDIGO|derrochador|avaro|sabio|perdido','PRÒDIG|malgastador|avar|savi|perdut','PRODIGAL|wasteful|miserly|wise|lost'],
 [5,'INEXORABLE|implacable|flexible|invisible|inútil','INEXORABLE|implacable|flexible|invisible|inútil','INEXORABLE|relentless|flexible|invisible|useless'],
 [5,'ACÉRRIMO|férreo|tibio|agrio|antiguo','ACÈRRIM|ferm|tebi|agre|antic','STAUNCH|steadfast|lukewarm|sour|ancient'],
 [6,'PUSILÁNIME|cobarde|valiente|diminuto|pacífico','PUSIL·LÀNIME|covard|valent|diminut|pacífic','PUSILLANIMOUS|cowardly|brave|tiny|peaceful'],
 [6,'VETUSTO|antiguo|nuevo|robusto|vestido','VETUST|antic|nou|robust|vestit','ARCHAIC|antiquated|modern|sturdy|clothed'],
 [6,'CONSPICUO|sobresaliente|oculto|sospechoso|breve','CONSPICU|destacat|ocult|sospitós|breu','CONSPICUOUS|noticeable|hidden|suspicious|brief'],
 [7,'ABSTRUSO|incomprensible|evidente|rudo|ausente','ABSTRÚS|incomprensible|evident|rude|absent','ABSTRUSE|obscure|obvious|rude|absent'],
 [7,'INICUO|injusto|inocente|inicial|igual','INIC|injust|innocent|inicial|igual','INIQUITOUS|wicked|innocent|initial|equal'],
 [7,'FALAZ|engañoso|veraz|feliz|rápido','FAL·LAÇ|enganyós|veraç|feliç|ràpid','FALLACIOUS|misleading|truthful|happy|quick'],
 [8,'ESPURIO|ilegítimo|genuino|áspero|espumoso','ESPURI|il·legítim|genuí|aspre|escumós','SPURIOUS|illegitimate|genuine|rough|foamy'],
 [8,'ÍNCLITO|ilustre|desconocido|inclinado|incluido','ÍNCLIT|il·lustre|desconegut|inclinat|inclòs','PELLUCID|transparent|murky|pale|slippery'],
 [8,'ABYECTO|despreciable|admirable|abierto|objetivo','ABJECTE|menyspreable|admirable|obert|objectiu','ABJECT|wretched|admirable|open|objective']];
/* [nivel, es, ca, en]; cada idioma: A|B|C|correcta|distractor|distractor|distractor  ->  A es a B como C es a … */
const ANA=[
 [1,'PÁJARO|VOLAR|PEZ|nadar|agua|aletas|comer','OCELL|VOLAR|PEIX|nedar|aigua|aletes|menjar','BIRD|FLY|FISH|swim|water|fins|eat'],
 [1,'DÍA|NOCHE|CALOR|frío|sol|verano|fuego','DIA|NIT|CALOR|fred|sol|estiu|foc','DAY|NIGHT|HOT|cold|sun|summer|fire'],
 [1,'MANO|GUANTE|PIE|zapato|pierna|dedo|caminar','MÀ|GUANT|PEU|sabata|cama|dit|caminar','HAND|GLOVE|FOOT|shoe|leg|toe|walk'],
 [2,'LIBRO|LEER|CUCHILLO|cortar|cocina|filo|tenedor','LLIBRE|LLEGIR|GANIVET|tallar|cuina|tall|forquilla','BOOK|READ|KNIFE|cut|kitchen|blade|fork'],
 [2,'CACHORRO|PERRO|POTRO|caballo|vaca|establo|galope','CADELL|GOS|POLLÍ|cavall|vaca|estable|galop','PUPPY|DOG|FOAL|horse|cow|stable|gallop'],
 [2,'PINTOR|CUADRO|ESCRITOR|novela|pluma|lector|palabra','PINTOR|QUADRE|ESCRIPTOR|novel·la|ploma|lector|paraula','PAINTER|PAINTING|WRITER|novel|pen|reader|word'],
 [3,'TERMÓMETRO|TEMPERATURA|BALANZA|peso|precio|equilibrio|mercado','TERMÒMETRE|TEMPERATURA|BALANÇA|pes|preu|equilibri|mercat','THERMOMETER|TEMPERATURE|SCALE|weight|price|balance|market'],
 [3,'SEMILLA|ÁRBOL|HUEVO|ave|nido|cáscara|yema','LLAVOR|ARBRE|OU|au|niu|closca|rovell','SEED|TREE|EGG|bird|nest|shell|yolk'],
 [3,'SED|BEBER|CANSANCIO|descansar|correr|sudar|bostezar','SET|BEURE|CANSAMENT|descansar|córrer|suar|badallar','THIRST|DRINK|FATIGUE|rest|run|sweat|yawn'],
 [4,'CAPÍTULO|LIBRO|ESCENA|obra|actor|telón|aplauso','CAPÍTOL|LLIBRE|ESCENA|obra|actor|teló|aplaudiment','CHAPTER|BOOK|SCENE|play|actor|curtain|applause'],
 [4,'SEQUÍA|AGUA|HAMBRUNA|alimento|pobreza|enfermedad|desierto','SEQUERA|AIGUA|FAM|aliment|pobresa|malaltia|desert','DROUGHT|WATER|FAMINE|food|poverty|disease|desert'],
 [4,'ARQUITECTO|PLANO|COMPOSITOR|partitura|piano|concierto|oído','ARQUITECTE|PLÀNOL|COMPOSITOR|partitura|piano|concert|oïda','ARCHITECT|BLUEPRINT|COMPOSER|score|piano|concert|ear'],
 [5,'SEGUNDO|MINUTO|CENTÍMETRO|metro|regla|kilo|distancia','SEGON|MINUT|CENTÍMETRE|metre|regle|quilo|distància','SECOND|MINUTE|CENTIMETRE|metre|ruler|kilogram|distance'],
 [5,'GENEROSO|TACAÑO|VALIENTE|cobarde|héroe|fuerte|miedo','GENERÓS|GASIU|VALENT|covard|heroi|fort|por','GENEROUS|STINGY|BRAVE|cowardly|hero|strong|fear'],
 [5,'VACUNA|ENFERMEDAD|CINTURÓN DE SEGURIDAD|lesión|coche|conductor|velocidad','VACUNA|MALALTIA|CINTURÓ DE SEGURETAT|lesió|cotxe|conductor|velocitat','VACCINE|ILLNESS|SEATBELT|injury|car|driver|speed'],
 [6,'ORUGA|MARIPOSA|RENACUAJO|rana|estanque|pez|larva','ERUGA|PAPALLONA|CAPGRÒS|granota|bassa|peix|larva','CATERPILLAR|BUTTERFLY|TADPOLE|frog|pond|fish|larva'],
 [6,'AMANECER|OCASO|PRÓLOGO|epílogo|prefacio|capítulo|autor','ALBA|CAPVESPRE|PRÒLEG|epíleg|prefaci|capítol|autor','DAWN|DUSK|PROLOGUE|epilogue|preface|chapter|author'],
 [6,'ÁRBOL|BOSQUE|ESTRELLA|galaxia|cielo|luz|planeta','ARBRE|BOSC|ESTEL|galàxia|cel|llum|planeta','TREE|FOREST|STAR|galaxy|sky|light|planet'],
 [7,'ESCULTOR|CINCEL|CIRUJANO|bisturí|hospital|paciente|quirófano','ESCULTOR|CISELL|CIRURGIÀ|bisturí|hospital|pacient|quiròfan','SCULPTOR|CHISEL|SURGEON|scalpel|hospital|patient|theatre'],
 [7,'AXIOMA|DEMOSTRACIÓN|CIMIENTO|edificio|ladrillo|arquitecto|suelo','AXIOMA|DEMOSTRACIÓ|FONAMENT|edifici|maó|arquitecte|terra','AXIOM|PROOF|FOUNDATION|building|brick|architect|ground'],
 [7,'SILENCIADOR|RUIDO|FILTRO|impureza|agua|café|colador','SILENCIADOR|SOROLL|FILTRE|impuresa|aigua|cafè|colador','SILENCER|NOISE|FILTER|impurity|water|coffee|strainer'],
 [8,'SÍNTOMA|ENFERMEDAD|INDICIO|delito|detective|prueba|juez','SÍMPTOMA|MALALTIA|INDICI|delicte|detectiu|prova|jutge','SYMPTOM|DISEASE|CLUE|crime|detective|evidence|judge'],
 [8,'MISÁNTROPO|HUMANIDAD|XENÓFOBO|extranjeros|fronteras|miedo|patria','MISANTROP|HUMANITAT|XENÒFOB|estrangers|fronteres|por|pàtria','MISANTHROPE|HUMANITY|XENOPHOBE|foreigners|borders|fear|homeland'],
 [8,'PARADOJA|CONTRADICCIÓN|METÁFORA|comparación|poesía|mentira|rima','PARADOXA|CONTRADICCIÓ|METÀFORA|comparació|poesia|mentida|rima','PARADOX|CONTRADICTION|METAPHOR|comparison|poetry|lie|rhyme']];
function genWord(bank, sub, lv, used){ let best=null;
  for(let d=0; d<8 && !best; d++){ const c=bank.map((x,i)=>i).filter(i=>!used.has(sub+i) && Math.abs(bank[i][0]-lv)===d); if(c.length) best=pick(c); }
  if(best===null){ best=rnd(bank.length); } used.add(sub+best); const row=bank[best]; const p=row[1+LI()].split('|');
  if(sub==='voc'){ const opts=shuffle([0,1,2,3]); return {kind:'choice', sub, lv:row[0], word:p[0], opts:opts.map(i=>p[1+i]), answer:opts.indexOf(0), c:.25}; }
  const opts=shuffle([0,1,2,3]); return {kind:'choice', sub, lv:row[0], w1:p[0], w2:p[1], w3:p[2], opts:opts.map(i=>p[3+i]), answer:opts.indexOf(0), c:.25}; }

/* ---------- configuración de las pruebas de potencia (dificultad por nivel en theta) ---------- */
const PW={
  mat:{levels:10, b:lv=>-2.6+(lv-1)*.53, gen:genMat, limit:60},
  rot:{levels:10, b:lv=>-2.3+(lv-1)*.5, gen:genRot, limit:30},
  ser:{levels:10, b:lv=>-2.6+(lv-1)*.52, gen:genSer, limit:60},
  cal:{levels:10, b:lv=>-3+(lv-1)*.53, gen:genCal, limit:60},
  voc:{levels:8, b:lv=>-2.6+(lv-1)*.68, gen:(lv,u)=>genWord(VOC,'voc',lv,u), limit:25},
  ana:{levels:8, b:lv=>-2.4+(lv-1)*.65, gen:(lv,u)=>genWord(ANA,'ana',lv,u), limit:35}};
function chooseLevel(P, th){ let best=1, bd=1e9; for(let lv=1;lv<=P.levels;lv++){ const d=Math.abs(P.b(lv)-(th+.15))+Math.random()*.3; if(d<bd){ bd=d; best=lv; } } return best; }

/* ---------- modos ---------- */
const MODES={
  quick:  {min:12, seq:['voc','mat','dfw','dbw','sym','rot','ser','cal','ana','cpt'], n:{voc:[6,6],mat:[5,5],rot:[5,5],ser:[4,4],cal:[5,5],ana:[4,4]}, span:{dfw:3,dbw:3,cor:0}, sym:45, cpt:60},
  medium: {min:25, seq:['voc','mat','dfw','dbw','sym','rot','ser','cal','cor','ana','cpt'], n:{voc:[9,9],mat:[9,9],rot:[8,8],ser:[7,7],cal:[8,8],ana:[7,7]}, span:{dfw:5,dbw:5,cor:5}, sym:90, cpt:120},
  precise:{min:45, seq:['voc','mat','dfw','dbw','sym','rot','ser','cal','cor','ana','cpt'], n:{voc:[12,18],mat:[12,20],rot:[10,16],ser:[9,14],cal:[10,16],ana:[10,14]}, span:{dfw:7,dbw:7,cor:7}, sym:120, cpt:180, se:.35}};
const SUBN={
  voc:['Vocabulario','Vocabulari','Vocabulary'], ana:['Analogías','Analogies','Analogies'], mat:['Matrices','Matrius','Matrices'],
  ser:['Series de números','Sèries de números','Number series'], rot:['Rotación mental','Rotació mental','Mental rotation'], cal:['Cálculo mental','Càlcul mental','Mental maths'],
  dfw:['Dígitos en orden','Dígits en ordre','Digits forwards'], dbw:['Dígitos al revés','Dígits a l\'inrevés','Digits backwards'], cor:['Cuadrados que se encienden','Quadrats que s\'encenen','Lighting squares'],
  sym:['Búsqueda de símbolos','Cerca de símbols','Symbol search'], cpt:['Atención sostenida','Atenció sostinguda','Sustained attention']};
const SUBI={
  voc:['Elegí la palabra que significa lo mismo (o casi lo mismo) que la palabra en mayúsculas.','Tria la paraula que vol dir el mateix (o gairebé el mateix) que la paraula en majúscules.','Choose the word that means the same (or nearly the same) as the word in capitals.'],
  ana:['Completá la relación: la tercera palabra se relaciona con la respuesta igual que la primera con la segunda.','Completa la relació: la tercera paraula es relaciona amb la resposta igual que la primera amb la segona.','Complete the relation: the third word relates to the answer as the first relates to the second.'],
  mat:['Mirá cómo cambian las figuras en cada fila y en cada columna, y elegí la que completa el hueco.','Mira com canvien les figures a cada fila i a cada columna, i tria la que completa el forat.','Look at how the shapes change across each row and down each column, and pick the one that fills the gap.'],
  ser:['Descubrí la regla de la serie y escribí el número que sigue.','Descobreix la regla de la sèrie i escriu el número que ve.','Find the rule of the series and type the next number.'],
  rot:['Elegí la figura que es la misma que la de arriba, solo que girada. Las otras están dadas vuelta como en un espejo o tienen un cuadrado cambiado.','Tria la figura que és la mateixa que la de dalt, només que girada. Les altres estan girades com en un mirall o tenen un quadrat canviat.','Choose the shape that is the same as the one at the top, only rotated. The others are mirrored or have one square moved.'],
  cal:['Resolvé de cabeza, sin papel ni calculadora, y escribí el resultado.','Resol-ho de cap, sense paper ni calculadora, i escriu el resultat.','Work it out in your head, without paper or calculator, and type the result.'],
  dfw:['Vas a ver números de a uno. Cuando terminen, escribilos en el mismo orden.','Veuràs números d\'un en un. Quan acabin, escriu-los en el mateix ordre.','You will see digits one at a time. When they finish, type them in the same order.'],
  dbw:['Vas a ver números de a uno. Cuando terminen, escribilos al revés: del último al primero.','Veuràs números d\'un en un. Quan acabin, escriu-los a l\'inrevés: de l\'últim al primer.','You will see digits one at a time. When they finish, type them in reverse: from last to first.'],
  cor:['Algunos cuadrados se encienden de a uno. Cuando terminen, tocalos en el mismo orden.','Alguns quadrats s\'encenen d\'un en un. Quan acabin, toca\'ls en el mateix ordre.','Some squares light up one at a time. When they finish, tap them in the same order.'],
  sym:['¿Está el símbolo de la izquierda en el grupo de la derecha? Respondé SÍ o NO lo más rápido que puedas, sin equivocarte. Tenés {0} segundos.','Hi ha el símbol de l\'esquerra al grup de la dreta? Respon SÍ o NO tan de pressa com puguis, sense equivocar-te. Tens {0} segons.','Is the symbol on the left in the group on the right? Answer YES or NO as fast as you can without mistakes. You have {0} seconds.'],
  cpt:['Van a aparecer letras de a una. Tocá el botón con cada letra, MENOS con la X. Dura {0} segundos: mantené la atención hasta el final.','Apareixeran lletres d\'una en una. Toca el botó amb cada lletra, MENYS amb la X. Dura {0} segons: mantén l\'atenció fins al final.','Letters will appear one at a time. Tap the button for every letter EXCEPT X. It lasts {0} seconds: stay focused until the end.']};

/* ---------- componentes comunes ---------- */
function TimeBar({limit, onEnd}){ const [left,setLeft]=useState(limit); const t0=useRef(now()); const done=useRef(false);
  useEffect(()=>{ const id=setInterval(()=>{ const l=limit-(now()-t0.current)/1000; setLeft(l); if(l<=0 && !done.current){ done.current=true; clearInterval(id); onEnd(); } },200); return ()=>clearInterval(id); },[]);
  return h`<div className="iq-time" aria-hidden="true"><i style=${{width:clamp(left/limit,0,1)*100+'%', background: left<limit*.2? 'var(--coral,#FF4D4D)' : 'var(--berry,#7B5CFF)'}}></i></div>`; }
function Keypad({val, setVal, onOk, max=6}){ const add=d=>setVal(v=>(v+d).slice(0,max));
  useEffect(()=>{ const k=e=>{ if(/^[0-9]$/.test(e.key)) add(e.key); else if(e.key==='Backspace') setVal(v=>v.slice(0,-1)); else if(e.key==='Enter' && val) onOk(); };
    window.addEventListener('keydown',k); return ()=>window.removeEventListener('keydown',k); },[val]);
  return h`<div className="iq-kp"><div className="iq-disp" aria-live="polite">${val||' '}</div>
    <div className="iq-keys">${['1','2','3','4','5','6','7','8','9'].map(d=>h`<button key=${d} className="iq-key" onClick=${()=>add(d)}>${d}</button>`)}
      <button className="iq-key soft" aria-label="⌫" onClick=${()=>setVal(v=>v.slice(0,-1))}>⌫</button><button className="iq-key" onClick=${()=>add('0')}>0</button>
      <button className="iq-key ok" disabled=${!val} onClick=${onOk}>${t('ok')}</button></div></div>`; }
function answerText(it){ if(it.kind==='num') return String(it.answer); if(it.sub==='voc'||it.sub==='ana') return it.opts[it.answer]; return '✓'; }

/* ---------- prueba de potencia adaptativa ---------- */
function PowerSub({sub, mode, mu, practice, train, onDone}){
  const P=PW[sub]; const s=useRef({resp:[], used:new Set(), n:0, th:mu-.8}); const [it,setIt]=useState(null); const [fb,setFb]=useState(null); const [val,setVal]=useState('');
  const [mn,mx]= practice? [1,1] : train? [10,10] : MODES[mode].n[sub]; const seStop=!practice&&!train&&MODES[mode].se;
  function next(){ const st=s.current;
    if(st.n>=mx || (seStop && st.n>=mn && eap(st.resp,mu).se<seStop) || (!seStop && st.n>=mn)){ onDone({resp:st.resp}); return; }
    const th= st.resp.length? eap(st.resp,mu).th : st.th; const lv= practice? 1 : chooseLevel(P, th);
    const item=P.gen(lv, st.used); item.b=P.b(item.lv); st.n++; setVal(''); setIt({...item, key:st.n, t0:now()}); }
  useEffect(next,[]);
  function answer(v){ if(!it || fb) return; const ok= v!==null && (it.kind==='num'? +v===it.answer : v===it.answer);
    s.current.resp.push({b:it.b, c:it.c, a:1.6, ok, rt:Math.round(now()-it.t0), lv:it.lv, to:v===null});
    if(practice||train){ setFb({ok, pick:v}); setTimeout(()=>{ setFb(null); next(); }, ok? 700 : 2200); } else next(); }
  if(!it) return null;
  const optCls=i=> 'iq-opt'+(fb? (i===it.answer? ' good' : fb.pick===i? ' bad' : '') : '');
  let body;
  if(sub==='mat') body=h`<div className="iq-matwrap"><div className="iq-mat">${it.cells.map((o,i)=>h`<${MatCell} key=${i} o=${o} q=${i===8}/>`)}</div>
      <div className="iq-mopts">${it.opts.map((o,i)=>h`<button key=${i} className=${optCls(i)} aria-label=${String(i+1)} onClick=${()=>answer(i)}><${MatCell} o=${o}/></button>`)}</div></div>`;
  else if(sub==='rot') body=h`<div className="iq-rotwrap"><div className="iq-rtarget"><${PolySvg} cs=${it.target} size=${'100%'}/></div>
      <div className="iq-ropts">${it.opts.map((o,i)=>h`<button key=${i} className=${optCls(i)} aria-label=${String(i+1)} onClick=${()=>answer(i)}><${PolySvg} cs=${o.cs} ang=${o.ang} size=${'100%'}/></button>`)}</div></div>`;
  else if(sub==='voc') body=h`<p className="iq-q">${t('vocQ')}</p><p className="iq-word">${it.word}</p>
      <div className="iq-wopts">${it.opts.map((o,i)=>h`<button key=${i} className=${optCls(i)} onClick=${()=>answer(i)}>${o}</button>`)}</div>`;
  else if(sub==='ana') body=h`<p className="iq-q">${t('anaQ', it.w1, it.w2, it.w3)}</p>
      <div className="iq-wopts">${it.opts.map((o,i)=>h`<button key=${i} className=${optCls(i)} onClick=${()=>answer(i)}>${o}</button>`)}</div>`;
  else if(sub==='ser') body=h`<p className="iq-seq">${it.seq.join(' · ')} · <b>?</b></p><${Keypad} val=${val} setVal=${setVal} onOk=${()=>answer(val)}/>`;
  else body=h`<p className=${it.word? 'iq-q' : 'iq-seq'}>${it.q}${it.word? '' : ' = ?'}</p><${Keypad} val=${val} setVal=${setVal} onOk=${()=>answer(val)}/>`;
  return h`<div className="iq-stage" key=${it.key}>
    ${!practice && !train && h`<${TimeBar} key=${'t'+it.key} limit=${P.limit} onEnd=${()=>answer(null)}/>`}
    ${body}
    ${fb && h`<p className=${'iq-fb '+(fb.ok?'good':'bad')}>${fb.ok? t('right') : t('wrongWas', answerText(it))}</p>`}
  </div>`; }
S.vocQ=['¿Qué palabra significa lo mismo que…','Quina paraula vol dir el mateix que…','Which word means the same as…'];
S.anaQ=['{0} es a {1} como {2} es a…','{0} és a {1} com {2} és a…','{0} is to {1} as {2} is to…'];

/* ---------- memoria: dígitos y cuadrados (escalera adaptativa) ---------- */
const SPAN_REF={dfw:6.6, dbw:4.9, cor:5.5}; /* largo que un adulto joven medio acierta la mitad de las veces (aprox.) */
const CORSI=[[16,16],[58,13],[84,30],[32,42],[66,48],[12,70],[48,72],[86,74],[30,88]];
function SpanSub({sub, mode, practice, train, onDone}){
  const total= practice? 1 : train? 6 : MODES[mode].span[sub]; const s=useRef({resp:[], L: practice? 3 : sub==='dfw'? 4 : 3, n:0});
  const [ph,setPh]=useState('wait'); const [seq,setSeq]=useState([]); const [lit,setLit]=useState(-1); const [val,setVal]=useState(''); const [taps,setTaps]=useState([]); const [fb,setFb]=useState(null);
  const alive=useRef(true); useEffect(()=>()=>{ alive.current=false; },[]);
  async function run(){ const st=s.current; if(st.n>=total){ onDone({resp:st.resp}); return; } st.n++;
    const L=st.L; const sq=[]; if(sub==='cor'){ const idx=shuffle([0,1,2,3,4,5,6,7,8]); while(sq.length<L) sq.push(idx[sq.length%9]); }
    else { while(sq.length<L){ const d=rnd(10); if(sq[sq.length-1]!==d) sq.push(d); } }
    setSeq(sq); setVal(''); setTaps([]); setPh('show'); await wait(700);
    for(let i=0;i<sq.length;i++){ if(!alive.current) return; setLit(i); await wait(sub==='cor'? 700 : 800); setLit(-1); await wait(sub==='cor'? 250 : 200); }
    if(alive.current) setPh('input'); }
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  useEffect(()=>{ run(); },[]);
  function submit(ans){ const st=s.current; const want= sub==='dbw'? seq.slice().reverse() : seq; const ok= ans.join(',')===want.join(',');
    st.resp.push({b:(st.L-SPAN_REF[sub])/1, c:0, a:1.8, ok, L:st.L}); st.L=clamp(st.L+(ok?1:-1), 2, 10);
    setPh('fb'); if(practice||train){ setFb(ok); setTimeout(()=>{ setFb(null); run(); }, ok?800:2000); } else setTimeout(run, 350); }
  function tapBlock(i){ if(ph!=='input') return; const nt=[...taps,i]; setTaps(nt); setLit(-2-i); setTimeout(()=>setLit(-1),180); if(nt.length===seq.length) setTimeout(()=>submit(nt),250); }
  const want= sub==='dbw'? seq.slice().reverse() : seq;
  if(sub==='cor') return h`<div className="iq-stage">
      <p className="iq-q">${ph==='show'? t('watch') : ph==='input'? t('yourTurn') : ' '}</p>
      <div className="iq-corsi">${CORSI.map(([x,y],i)=>h`<button key=${i} className=${'iq-blk'+((ph==='show'&&seq[lit]===i)||lit===-2-i?' on':'')} style=${{left:x+'%', top:y+'%'}} disabled=${ph!=='input'} aria-label=${String(i+1)} onClick=${()=>tapBlock(i)}></button>`)}</div>
      ${fb!==null && h`<p className=${'iq-fb '+(fb?'good':'bad')}>${fb? t('right') : t('wrongWas', '—')}</p>`}</div>`;
  return h`<div className="iq-stage">
    ${ph==='show'? h`<p className="iq-digit">${lit>=0? seq[lit] : ' '}</p>` : ph==='input'? h`<p className="iq-q">${t('yourTurn')}</p><${Keypad} val=${val} setVal=${setVal} max=${12} onOk=${()=>submit(val.split('').map(Number))}/>` : h`<p className="iq-digit"> </p>`}
    ${fb!==null && h`<p className=${'iq-fb '+(fb?'good':'bad')}>${fb? t('right') : t('wrongWas', want.join(' '))}</p>`}</div>`; }

/* ---------- velocidad: búsqueda de símbolos ---------- */
const DOTS=[[12,12],[50,12],[88,12],[12,50],[50,50],[88,50],[12,88],[50,88],[88,88]];
const SEGS=(()=>{ const s=[]; for(let r=0;r<3;r++) for(let c=0;c<3;c++){ const i=r*3+c; if(c<2) s.push([i,i+1]); if(r<2) s.push([i,i+3]); if(c<2&&r<2){ s.push([i,i+4]); s.push([i+1,i+3]); } } return s; })();
function glyph(r){ const g=new Set(); while(g.size<3) g.add(Math.floor(r()*SEGS.length)); return [...g].sort((a,b)=>a-b); }
const gk=g=>g.join(',');
function variant(g){ const s=new Set(g); const out=[...s]; out[rnd(out.length)]=(()=>{ let x; do{ x=rnd(SEGS.length); }while(s.has(x)); return x; })(); return out.sort((a,b)=>a-b); }
function Glyph({g}){ return h`<svg viewBox="0 0 100 100" aria-hidden="true">${g.map(i=>{ const [a,b]=SEGS[i]; return h`<line key=${i} x1=${DOTS[a][0]} y1=${DOTS[a][1]} x2=${DOTS[b][0]} y2=${DOTS[b][1]} style=${{stroke:'#111', strokeWidth:9, strokeLinecap:'round'}}/>`; })}</svg>`; }
function symTrial(){ const r=Math.random; const tg=glyph(r); const has=Math.random()<.5; const grp=[]; const seen=new Set([gk(tg)]);
  while(grp.length<5){ const g= Math.random()<.45? variant(tg) : glyph(r); const k=gk(g); if(!seen.has(k)){ seen.add(k); grp.push(g); } }
  if(has) grp[rnd(5)]=tg; return {tg, grp, has}; }
function SymSub({mode, practice, train, onDone}){ const dur= practice? 0 : train? 45 : MODES[mode].sym;
  const s=useRef({ok:0, bad:0, n:0, t0:now(), rts:[]}); const [tr,setTr]=useState(symTrial); const [fb,setFb]=useState(null); const [left,setLeft]=useState(dur); const fin=useRef(false);
  useEffect(()=>{ if(practice) return; const id=setInterval(()=>{ const l=dur-(now()-s.current.t0)/1000; setLeft(l); if(l<=0 && !fin.current){ fin.current=true; clearInterval(id); end(); } },200); return ()=>clearInterval(id); },[]);
  function end(){ const st=s.current; const mins=dur/60; const rate=(st.ok-st.bad)/mins; const th=clamp((rate-34)/8, -4, 3.5);
    onDone({th, se: dur>=120? .3 : dur>=90? .34 : .42, ok:st.ok, bad:st.bad, rate:Math.round(rate*10)/10}); }
  function answer(v){ if(fin.current) return; const st=s.current; const ok=v===tr.has; st.n++; if(ok) st.ok++; else st.bad++;
    if(practice){ setFb(ok); setTimeout(()=>{ setFb(null); if(st.n>=4){ fin.current=true; onDone({}); } else setTr(symTrial()); }, ok?500:1300); return; }
    setTr(symTrial()); }
  return h`<div className="iq-stage">
    ${!practice && h`<div className="iq-time"><i style=${{width:clamp(left/dur,0,1)*100+'%'}}></i></div>`}
    <div className="iq-sym"><div className="iq-symt"><${Glyph} g=${tr.tg}/></div><span className="iq-sep"></span>
      <div className="iq-symg">${tr.grp.map((g,i)=>h`<div key=${i} className="iq-symc"><${Glyph} g=${g}/></div>`)}</div></div>
    <div className="iq-yn"><button className="iq-ynb yes" onClick=${()=>answer(true)}>${t('yes')}</button><button className="iq-ynb no" onClick=${()=>answer(false)}>${t('noB')}</button></div>
    ${fb!==null && h`<p className=${'iq-fb '+(fb?'good':'bad')}>${fb? t('right') : t('wrongWas', tr.has? t('yes') : t('noB'))}</p>`}
  </div>`; }

/* ---------- atención sostenida (tocar con todas las letras menos la X) ---------- */
const LET='ABCDEFHKLMOPRTU'.split('');
function CptSub({mode, practice, train, onDone}){ const dur= practice? 15 : train? 60 : MODES[mode].cpt;
  const s=useRef(null); const [cur,setCur]=useState(null); const [flash,setFlash]=useState(null); const [left,setLeft]=useState(dur);
  useEffect(()=>{ const isis=[1000,1500,2000]; const trials=[]; let tt=0; let prevX=false;
    while(tt<dur*1000){ const isi=pick(isis); const x= !prevX && Math.random()<.2; prevX=x; trials.push({ch: x? 'X' : pick(LET), x, on:tt, isi, resp:null}); tt+=isi; }
    s.current={trials, i:-1, t0:now(), timers:[]}; let alive=true;
    const step=i=>{ if(!alive) return; const st=s.current; if(i>=trials.length){ finish(); return; } st.i=i; trials[i].at=now(); setCur({ch:trials[i].ch, k:i});
      st.timers.push(setTimeout(()=>{ if(alive) setCur(c=>c&&c.k===i? {ch:'', k:i} : c); },250)); st.timers.push(setTimeout(()=>step(i+1), trials[i].isi)); };
    st0(); function st0(){ s.current.timers.push(setTimeout(()=>step(0),800)); }
    const id=setInterval(()=>setLeft(dur-(now()-s.current.t0)/1000),250);
    function finish(){ clearInterval(id); const tr=s.current.trials; const go=tr.filter(x=>!x.x), nx=tr.filter(x=>x.x);
      const hits=go.filter(x=>x.resp!==null), com=nx.filter(x=>x.resp!==null).length;
      const H=(hits.length+.5)/(go.length+1), F=(com+.5)/(nx.length+1); const dp=nqi(H)-nqi(F);
      const rts=hits.map(x=>x.resp); const m=rts.reduce((a,b)=>a+b,0)/Math.max(1,rts.length); const sd=Math.sqrt(rts.reduce((a,b)=>a+(b-m)**2,0)/Math.max(1,rts.length));
      const cv= m? sd/m : .5; const th=clamp(.75*(dp-2.7)/.75 + .25*(.24-cv)/.07, -4, 3);
      onDone({th, se: dur>=180? .33 : dur>=120? .4 : .5, om:go.length-hits.length, com, nGo:go.length, nX:nx.length, rt:Math.round(m), cv:Math.round(cv*100)/100, dp:Math.round(dp*100)/100}); }
    return ()=>{ alive=false; clearInterval(id); s.current.timers.forEach(clearTimeout); }; },[]);
  function tap(e){ e.preventDefault(); const st=s.current; if(!st || st.i<0) return; const tr=st.trials[st.i]; if(tr.resp!==null) return; tr.resp=Math.round(now()-tr.at);
    if(practice){ setFlash(tr.x? 'bad' : 'good'); setTimeout(()=>setFlash(null),250); } }
  return h`<div className="iq-stage">
    <div className="iq-time"><i style=${{width:clamp(left/dur,0,1)*100+'%'}}></i></div>
    <div className=${'iq-letter'+(flash? ' '+flash : '')}>${cur? cur.ch : ''}</div>
    <button className="iq-tap" onPointerDown=${tap}>${t('tapBtn')}</button>
  </div>`; }

/* ---------- puntuación ---------- */
const R_AREAS=.45;  /* correlación media supuesta entre áreas para combinar el CI */
const MODEL_SE=.2;  /* incertidumbre extra de las curvas por edad (en desvíos) */
function classify(v){ const L=[[130,['Muy alto','Molt alt','Very high']],[120,['Alto','Alt','High']],[110,['Medio alto','Mitjà alt','High average']],[90,['Medio','Mitjà','Average']],[80,['Medio bajo','Mitjà baix','Low average']],[70,['Bajo','Baix','Low']],[-1,['Muy bajo','Molt baix','Very low']]];
  return T3(L.find(x=>v>=x[0])[1]); }
function scoreAll(data, age, mode){
  const areas={}; let invalid=0;
  AREAS.forEach(A=>{ const mu=normMu(A.k, age); let th, se;
    if(A.k==='gs'||A.k==='att'){ const d=data[A.subs[0]]; if(!d||d.th===undefined) return; th=d.th; se=d.se; }
    else { const resp=A.subs.flatMap(s=>(data[s]&&data[s].resp)||[]); if(!resp.length) return; const e=eap(resp, mu); th=e.th; se=e.se;
      const to=resp.filter(r=>r.to).length; if(to/resp.length>.4) invalid++; }
    const z=th-mu; const v=clamp(Math.round(100+15*z),40,160); const s2=Math.sqrt(se*se+MODEL_SE*MODEL_SE);
    areas[A.k]={v, z:Math.round(z*100)/100, se:Math.round(se*100)/100, lo:clamp(Math.round(v-1.96*15*s2),40,160), hi:clamp(Math.round(v+1.96*15*s2),40,160)}; });
  const ks=AREAS.filter(A=>A.w>0 && areas[A.k]); const W=ks.map(A=>A.w);
  let num=0, den=0, err=0; ks.forEach((A,i)=>{ num+=W[i]*areas[A.k].z; err+=(W[i]*areas[A.k].se)**2; ks.forEach((B,j)=>{ den+=W[i]*W[j]*(i===j? 1 : R_AREAS); }); });
  const zc=num/Math.sqrt(den); const sec=Math.sqrt(err/den + MODEL_SE*MODEL_SE);
  const iq=clamp(Math.round(100+15*zc),40,160);
  const c=data.cpt; if(c && c.nGo && c.om/c.nGo>.35) invalid++; const sy=data.sym; if(sy && sy.ok!==undefined && sy.bad>sy.ok*.5) invalid++;
  return {iq, lo:clamp(Math.round(iq-1.96*15*sec),40,160), hi:clamp(Math.round(iq+1.96*15*sec),40,160), pct:Math.round(ncdf(zc)*1000)/10,
    areas, mode, age:+age, invalid:invalid>0, details:{sym:data.sym&&{ok:data.sym.ok,bad:data.sym.bad,rate:data.sym.rate}, cpt:data.cpt&&{om:data.cpt.om,com:data.cpt.com,rt:data.cpt.rt,cv:data.cpt.cv,dp:data.cpt.dp}}}; }
function weakAreas(r){ const ks=Object.keys(r.areas); if(!ks.length) return []; const m=ks.reduce((a,k)=>a+r.areas[k].v,0)/ks.length;
  return ks.filter(k=>r.areas[k].v<90 || r.areas[k].v<=m-12).sort((a,b)=>r.areas[a].v-r.areas[b].v); }
function strongAreas(r){ const ks=Object.keys(r.areas); if(!ks.length) return []; const m=ks.reduce((a,k)=>a+r.areas[k].v,0)/ks.length;
  return ks.filter(k=>r.areas[k].v>=110 && r.areas[k].v>=m+8).sort((a,b)=>r.areas[b].v-r.areas[a].v); }
function focusFor(r, avail){ const f=[...new Set(weakAreas(r).slice(0,3).flatMap(k=>FOCUS[k]))]; return avail? f.filter(a=>avail.includes(a)) : f; }

/* ---------- pantallas ---------- */
function Instr({sub, i, n, mode, onPractice, onStart, train}){ const m=MODES[mode]||MODES.medium;
  const txt=T3(SUBI[sub]).replace('{0}', sub==='sym'? (train?45:m.sym) : sub==='cpt'? (train?60:m.cpt) : '');
  return h`<div className="iq-stage iq-instr">
    ${!train && h`<p className="small muted">${t('testN', i+1, n)}</p>`}
    <h2>${T3(SUBN[sub])}</h2><p className="iq-lead">${txt}</p>
    <div className="row" style=${{justifyContent:'center'}}>
      <button className="btn soft small" onClick=${onPractice}>${t('example')}</button>
      <button className="btn small" onClick=${onStart}>${t('go')} ▶</button></div></div>`; }
function SubRunner({sub, mode, mu, practice, train, onDone}){
  if(PW[sub]) return h`<${PowerSub} sub=${sub} mode=${mode} mu=${mu} practice=${practice} train=${train} onDone=${onDone}/>`;
  if(sub==='sym') return h`<${SymSub} mode=${mode} practice=${practice} train=${train} onDone=${onDone}/>`;
  if(sub==='cpt') return h`<${CptSub} mode=${mode} practice=${practice} train=${train} onDone=${onDone}/>`;
  return h`<${SpanSub} sub=${sub} mode=${mode} practice=${practice} train=${train} onDone=${onDone}/>`; }
const AREA_OF=Object.fromEntries(AREAS.flatMap(A=>A.subs.map(s=>[s,A.k])));
function Runner({mode, age, onFinish, onQuit}){ const seq=MODES[mode].seq; const [i,setI]=useState(0); const [ph,setPh]=useState('instr'); const data=useRef({}); const [ask,setAsk]=useState(false);
  const sub=seq[i]; const mu=normMu(AREA_OF[sub], age);
  function done(res){ data.current[sub]=res; if(i+1>=seq.length){ setPh('calc'); setTimeout(()=>onFinish(data.current),400); } else { setI(i+1); setPh('instr'); } }
  return h`<div className="iq">
    <div className="row"><button className="btn soft small" onClick=${()=>setAsk(true)}>✕ ${t('quit')}</button><span className="spacer"></span>
      <span className="iq-prog">${seq.map((s,j)=>h`<i key=${s} className=${j<i?'on':j===i?'cur':''}></i>`)}</span></div>
    ${ask? h`<div className="iq-stage"><p className="iq-lead">${t('quitQ')}</p><div className="row" style=${{justifyContent:'center'}}><button className="btn danger small" onClick=${onQuit}>${t('yesQuit')}</button><button className="btn soft small" onClick=${()=>setAsk(false)}>${t('no')}</button></div></div>`
    : ph==='instr'? h`<${Instr} key=${'i'+i} sub=${sub} i=${i} n=${seq.length} mode=${mode} onPractice=${()=>setPh('prac')} onStart=${()=>setPh('test')}/>`
    : ph==='prac'? h`<div className="iq-stage" style=${{flex:'0 0 auto'}}><p className="small muted">${t('exampleT')}</p></div><${SubRunner} key=${'p'+i} sub=${sub} mode=${mode} mu=${mu} practice=${true} onDone=${()=>setPh('instr2')}/>`
    : ph==='instr2'? h`<div className="iq-stage"><h2>${T3(SUBN[sub])}</h2><button className="btn small" onClick=${()=>setPh('test')}>${t('go')} ▶</button></div>`
    : ph==='test'? h`<${SubRunner} key=${'t'+i} sub=${sub} mode=${mode} mu=${mu} onDone=${done}/>`
    : h`<div className="iq-stage"><p className="iq-lead">${t('computing')}</p></div>`}
  </div>`; }
function Trainer({area, onBack}){ const A=AREA[area]; const subs=A.subs; const [i,setI]=useState(0); const [ph,setPh]=useState('instr'); const [res,setRes]=useState(null); const sub=subs[i%subs.length];
  function done(r){ const resp=r.resp; setRes(resp? {ok:resp.filter(x=>x.ok).length, n:resp.length} : r.ok!==undefined? {ok:r.ok, n:r.ok+r.bad} : r.nGo? {ok:r.nGo-r.om+(r.nX-r.com), n:r.nGo+r.nX} : null); setPh('done'); }
  return h`<div className="iq">
    <div className="row"><button className="icon-btn" onClick=${onBack} aria-label=${t('back')}>←</button><h2>${t('trainT', T3(A.n))}</h2></div>
    ${ph==='instr'? h`<${Instr} key=${'i'+i} sub=${sub} train=${true} mode="medium" onPractice=${()=>setPh('test')} onStart=${()=>setPh('test')}/><p className="note">${t('trainNote')}</p>`
    : ph==='test'? h`<${SubRunner} key=${'t'+i} sub=${sub} mode="medium" mu=${0} train=${true} onDone=${done}/>`
    : h`<div className="iq-stage"><p className="iq-big2">${res? t('trainDone', res.ok, res.n) : '✓'}</p>
        <div className="row" style=${{justifyContent:'center'}}><button className="btn small" onClick=${()=>{ setI(i+1); setPh('instr'); }}>${t('again')} ▶</button><button className="btn soft small" onClick=${onBack}>${t('back')}</button></div></div>`}
  </div>`; }
function Bar({v, lo, hi}){ const x=a=>clamp((a-40)/120*100,0,100);
  return h`<span className="iq-track"><span className="iq-mid" style=${{left:x(100)+'%'}}></span><span className="iq-ci" style=${{left:x(lo)+'%', width:(x(hi)-x(lo))+'%'}}></span><span className=${'iq-dot '+(v>=110?'hi':v>=90?'mid':'lo')} style=${{left:x(v)+'%'}}></span></span>`; }
function Report({r, canApply, onApply, onTrain, onBack, applied, avail, trA}){ const weak=weakAreas(r), strong=strongAreas(r); const focus=focusFor(r, avail); const [how,setHow]=useState(false);
  const order=AREAS.filter(A=>A.w>0 && r.areas[A.k]); const att=r.areas.att;
  const date=new Date(r.date||Date.now()).toLocaleDateString(LG()==='en'?'en-GB':LG()==='ca'?'ca-ES':'es-ES');
  return h`<div className="iq"><div className="row"><button className="icon-btn" onClick=${onBack} aria-label=${t('back')}>←</button><h2>${t('estIQ')}</h2></div>
    <div className="scroll"><div className="iq-col">
      <div className="iq-card iq-head"><div className="iq-big">${r.iq}</div><div className="iq-headtx">
        <b>${classify(r.iq)}</b><span>${t('range', r.lo, r.hi)}</span><span>${t('pct', (r.pct>=99.9? 99.9 : r.pct<=.1? .1 : r.pct).toLocaleString(LG()==='en'?'en-GB':LG()==='ca'?'ca-ES':'es-ES'), r.age)}</span>
        <span className="small muted">${date} · ${t('modeOf', t(r.mode))}${r.sex&&r.sex!=='x'? ' · '+t('sexL', t(r.sex==='f'?'sexF':'sexM')) : ''}</span></div></div>
      ${r.invalid && h`<p className="note">${t('validity')}</p>`}
      <div className="iq-card"><h3>${t('areas')}</h3>
        ${order.map(A=>{ const a=r.areas[A.k]; return h`<div key=${A.k} className="iq-row"><span className="iq-lab">${T3(A.n)}</span><${Bar} v=${a.v} lo=${a.lo} hi=${a.hi}/><b className="iq-v">${a.v}</b><button className="iq-tr" onClick=${()=>onTrain(A.k)}>${t('train')}</button></div>`; })}
        ${att && h`<div className="iq-row att"><span className="iq-lab">${t('attIdx')}</span><${Bar} v=${att.v} lo=${att.lo} hi=${att.hi}/><b className="iq-v">${att.v}</b><button className="iq-tr" onClick=${()=>onTrain('att')}>${t('train')}</button></div>`}
        <p className="small muted iq-scale"><span>40</span><span>70</span><span>100</span><span>130</span><span>160</span></p></div>
      <div className="iq-card">
        ${strong.length>0 && h`<h3>${t('strong')}</h3><ul className="iq-ul">${strong.map(k=>h`<li key=${k}><b>${T3(AREA[k].n)}</b> · ${r.areas[k].v}</li>`)}</ul>`}
        <h3>${t('weak')}</h3>
        ${weak.length? h`<ul className="iq-ul">${weak.map(k=>h`<li key=${k}><b>${T3(AREA[k].n)}</b> · ${r.areas[k].v}. ${T3(AREA[k].tip)}</li>`)}</ul>` : h`<p className="small">${t('noneWeak')}</p>`}
        ${canApply && weak.length>0 && (applied? h`<p className="note">${t('applied', focus.map(x=>trA? trA(x) : x).join(', '))}</p>` : h`<div><button className="btn small" onClick=${()=>onApply(r)}>🎯 ${t('apply')}</button></div>`)}
      </div>
      <p className="note">${t('disc')}</p>
      <div className="iq-card"><button className="iq-link" onClick=${()=>setHow(!how)}>${how?'▾':'▸'} ${t('how')}</button>${how && h`<p className="small">${t('howT')}</p>`}</div>
    </div></div></div>`; }
function IQApp({name, age:pAge, history, onSave, onBack, onApply, onDelete, canApply, areas:avail, tr:trA}){
  history=history||[];
  const [stage,setStage]=useState('intro'); const [mode,setMode]=useState('medium'); const [age,setAge]=useState(pAge>=12? String(Math.min(100,pAge)) : '');
  const [sex,setSex]=useState(''); const [res,setRes]=useState(null); const [area,setArea]=useState(null); const [applied,setApplied]=useState(false); const [err,setErr]=useState('');
  const t0=useRef(0);
  useEffect(()=>{ const el=document.querySelector('.iq-root .scroll'); if(el) el.scrollTop=0; },[stage]);
  const A=+age; const okAge=Number.isInteger(A) && A>=12 && A<=100;
  function start(){ if(!okAge){ setErr(t('ageErr')); return; } setErr(''); t0.current=Date.now(); setStage('run'); }
  function finish(data){ const r=scoreAll(data, A, mode); r.sex=sex||''; r.date=new Date().toISOString(); r.min=Math.round((Date.now()-t0.current)/60000); r.lang=LG(); r.id='iq'+Date.now();
    setRes(r); setApplied(false); setStage('report'); try{ onSave&&onSave(r); }catch(e){} }
  let body;
  if(stage==='run') body=h`<${Runner} mode=${mode} age=${A} onFinish=${finish} onQuit=${()=>setStage('intro')}/>`;
  else if(stage==='report') body=h`<${Report} r=${res} canApply=${canApply} applied=${applied} avail=${avail} trA=${trA} onApply=${r=>{ onApply&&onApply(focusFor(r, avail), weakAreas(r).slice(0,3), r); setApplied(true); }} onTrain=${k=>{ setArea(k); setStage('train'); }} onBack=${()=>setStage('intro')}/>`;
  else if(stage==='train') body=h`<${Trainer} key=${area} area=${area} onBack=${()=>setStage(res? 'report' : 'intro')}/>`;
  else body=h`<div className="iq">
    <div className="row"><button className="icon-btn" onClick=${onBack} aria-label=${t('back')}>←</button><div><h2>🧠 ${t('title')}</h2><p className="small muted" style=${{margin:0}}>${t('sub')}</p></div></div>
    <div className="scroll"><div className="iq-col">
      ${pAge && pAge<12 && h`<p className="note">${t('kidNote', pAge)}</p>`}
      <div className="iq-card"><h3>${t('mode')}</h3><div className="iq-modes">${['quick','medium','precise'].map(k=>h`<button key=${k} className=${'iq-mode'+(mode===k?' on':'')} onClick=${()=>setMode(k)}>
          <b>${k==='quick'?'⚡':k==='medium'?'⚖️':'🎯'} ${t(k)}</b><span className="small">${t(k+'D')}</span></button>`)}</div></div>
      <div className="iq-card"><h3>${t('who')}</h3>
        <div className="row"><span>${t('age')}</span><button className="iq-step" onClick=${()=>setAge(String(clamp((A||30)-1,12,100)))} aria-label="−">−</button>
          <input className="iq-age" inputMode="numeric" value=${age} maxLength="3" onChange=${e=>setAge(e.target.value.replace(/\D/g,'').slice(0,3))}/>
          <button className="iq-step" onClick=${()=>setAge(String(clamp((A||29)+1,12,100)))} aria-label="+">+</button><span>${t('years')}</span></div>
        <span className="small">${t('sex')}</span>
        <div className="seg">${[['f','sexF'],['m','sexM'],['x','sexX']].map(([k,l])=>h`<button key=${k} className=${sex===k?'on':''} onClick=${()=>setSex(sex===k?'':k)}>${t(l)}</button>`)}</div>
        <p className="small muted" style=${{margin:0}}>${t('sexNote')}</p>
        ${err && h`<p className="acct-err">${err}</p>`}</div>
      <p className="note">${t('tips')}</p>
      <div><button className="btn" onClick=${start}>${t('start')} ▶</button></div>
      <p className="small muted">${t('disc')}</p>
      ${history.length>0 && h`<div className="iq-card"><h3>${t('hist')}</h3>${history.slice().reverse().map(r=>h`<div key=${r.id||r.date} className="iq-hrow">
          <button className="iq-hbtn" onClick=${()=>{ setRes(r); setApplied(false); setStage('report'); }}><b>${r.iq}</b><span>${new Date(r.date).toLocaleDateString(LG()==='en'?'en-GB':LG()==='ca'?'ca-ES':'es-ES')} · ${t(r.mode)} · ${r.age} ${t('years')}</span><span className="small muted">${r.lo}–${r.hi}</span></button>
          ${onDelete && h`<button className="btn soft small" onClick=${()=>onDelete(r.id||r.date)}>${t('del')}</button>`}</div>`)}</div>`}
    </div></div></div>`;
  return h`<div className="screen adult iq-root" data-notr>${body}</div>`; }

/* ---------- estilos ---------- */
const CSS=`
.iq-root{gap:10px}
.iq{flex:1;min-height:0;display:flex;flex-direction:column;gap:12px}
.iq-col{display:flex;flex-direction:column;gap:14px;max-width:860px;margin:0 auto}
.iq-card{background:var(--card,#fff);border-radius:24px;padding:16px 18px;box-shadow:0 4px 0 var(--line,#B9D7F0);display:flex;flex-direction:column;gap:10px}
.iq-modes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.iq-mode{border:none;border-radius:20px;padding:12px 14px;background:var(--sky-2,#EEF9FF);box-shadow:0 4px 0 var(--line,#B9D7F0);text-align:left;display:flex;flex-direction:column;gap:4px}
.iq-mode b{font-family:var(--f-display);font-size:24px} .iq-mode.on{outline:5px solid var(--berry,#7B5CFF);background:var(--berry-2,#E9E3FF)}
.iq-step{width:52px;height:52px;border-radius:16px;border:none;background:var(--card,#fff);box-shadow:0 4px 0 var(--line,#B9D7F0);font-size:28px;font-weight:800}
.iq-age{width:92px;font-size:30px;text-align:center;border-radius:14px;border:3px solid var(--line,#B9D7F0);padding:6px;font-family:var(--f-display);font-weight:800;color:var(--ink)}
.iq-prog{display:flex;gap:5px;flex-wrap:wrap} .iq-prog i{width:16px;height:10px;border-radius:9px;background:var(--guide,#D3E6F5)} .iq-prog i.on{background:var(--leaf,#1DB954)} .iq-prog i.cur{background:var(--berry,#7B5CFF)}
.iq-stage{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;overflow-y:auto;text-align:center;padding:4px 0}
.iq-instr h2{font-size:clamp(28px,5vmin,44px)} .iq-lead{font-size:clamp(20px,3vmin,26px);max-width:720px;margin:0}
.iq-q{font-family:var(--f-display);font-weight:800;font-size:clamp(22px,3.6vmin,32px);margin:0;max-width:820px}
.iq-word{font-family:var(--f-display);font-weight:800;font-size:clamp(34px,6vmin,56px);margin:0;letter-spacing:1px}
.iq-seq{font-family:var(--f-display);font-weight:800;font-size:clamp(28px,5.5vmin,50px);margin:0;word-spacing:4px}
.iq-seq b{color:var(--berry,#7B5CFF)}
.iq-wopts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;width:min(640px,100%)}
.iq-opt{border:3px solid var(--line,#B9D7F0);background:#fff;border-radius:18px;padding:8px;min-height:62px;font-size:24px;font-family:var(--f-body);color:var(--ink);display:flex;align-items:center;justify-content:center}
.iq-opt:active{transform:translateY(2px)} .iq-opt.good{border-color:var(--leaf,#1DB954);background:var(--leaf-2,#D2F7DF)} .iq-opt.bad{border-color:var(--coral,#FF4D4D);background:var(--coral-2,#FFE0E0)}
.iq-matwrap{display:flex;gap:22px;align-items:center;justify-content:center;flex-wrap:wrap;--c:min(19vmin,104px);--o:min(14vmin,80px)}
.iq-mat{display:grid;grid-template-columns:repeat(3,var(--c));gap:6px;padding:8px;background:#fff;border-radius:16px;border:3px solid #222}
.iq-cell{width:var(--c);height:var(--c);background:#fff;border:2px solid #444;border-radius:8px;display:flex;align-items:center;justify-content:center}
.iq-cell svg{width:100%;height:100%} .iq-cell.q{font-family:var(--f-display);font-weight:800;font-size:calc(var(--c)*.5);background:#F2F2F2;color:#555}
.iq-mopts{display:grid;grid-template-columns:repeat(4,auto);gap:8px}
.iq-mopts .iq-opt{padding:4px;min-height:0} .iq-mopts .iq-cell{width:var(--o);height:var(--o);border:none}
.iq-rotwrap{display:flex;flex-direction:column;align-items:center;gap:16px}
.iq-rtarget{width:min(26vmin,150px);height:min(26vmin,150px);background:#fff;border:3px solid #222;border-radius:16px}
.iq-ropts{display:grid;grid-template-columns:repeat(4,auto);gap:10px} .iq-ropts .iq-opt{width:min(20vmin,120px);height:min(20vmin,120px);padding:4px}
.iq-kp{display:flex;flex-direction:column;align-items:center;gap:10px}
.iq-disp{min-width:220px;min-height:62px;font-size:40px;font-family:var(--f-display);font-weight:800;background:#fff;border-radius:16px;padding:4px 16px;border:3px solid var(--line,#B9D7F0);letter-spacing:3px}
.iq-keys{display:grid;grid-template-columns:repeat(3,76px);gap:8px}
.iq-key{height:58px;border-radius:16px;border:none;background:#fff;box-shadow:0 4px 0 var(--line,#B9D7F0);font-size:28px;font-family:var(--f-display);font-weight:800;color:var(--ink)}
.iq-key:active{box-shadow:0 1px 0 var(--line,#B9D7F0);transform:translateY(3px)} .iq-key.ok{background:var(--leaf,#1DB954);color:#fff;font-size:22px} .iq-key:disabled{opacity:.4} .iq-key.soft{background:var(--sky-2,#EEF9FF)}
.iq-time{height:10px;width:min(620px,100%);background:var(--guide,#D3E6F5);border-radius:99px;overflow:hidden;flex:0 0 auto} .iq-time i{display:block;height:100%;background:var(--berry,#7B5CFF);transition:width .2s linear}
.iq-fb{font-family:var(--f-display);font-weight:800;font-size:24px;margin:0} .iq-fb.good{color:var(--leaf-dark,#128A3D)} .iq-fb.bad{color:var(--coral-dark,#C62828)}
.iq-digit{font-family:var(--f-display);font-weight:800;font-size:min(34vmin,200px);line-height:1;margin:0;min-height:1em}
.iq-corsi{position:relative;width:min(70vmin,460px);height:min(56vmin,370px);background:#fff;border-radius:20px;border:3px solid #222}
.iq-blk{position:absolute;width:13%;aspect-ratio:1;transform:translate(-50%,-50%);border:none;border-radius:10px;background:#5C6BC0;box-shadow:0 3px 0 #303F9F}
.iq-blk.on{background:var(--sun,#FFC21A);box-shadow:0 0 0 6px #FFE58A} .iq-blk:disabled{opacity:1}
.iq-sym{display:flex;align-items:center;gap:14px;flex-wrap:wrap;justify-content:center}
.iq-symt,.iq-symc{width:min(13vmin,84px);height:min(13vmin,84px);background:#fff;border:2px solid #444;border-radius:12px;padding:4px} .iq-symt{border:4px solid var(--berry,#7B5CFF)}
.iq-symt svg,.iq-symc svg{width:100%;height:100%} .iq-symg{display:flex;gap:8px} .iq-sep{width:4px;height:70px;background:#999;border-radius:4px}
.iq-yn{display:flex;gap:18px} .iq-ynb{min-width:150px;min-height:76px;border:none;border-radius:999px;font-family:var(--f-display);font-weight:800;font-size:32px;color:#fff}
.iq-ynb.yes{background:var(--leaf,#1DB954);box-shadow:0 5px 0 var(--leaf-dark,#128A3D)} .iq-ynb.no{background:var(--coral,#FF4D4D);box-shadow:0 5px 0 var(--coral-dark,#C62828)}
.iq-ynb:active{transform:translateY(3px);box-shadow:none}
.iq-letter{font-family:var(--f-display);font-weight:800;font-size:min(36vmin,220px);line-height:1;min-height:1em;width:1.2em;border-radius:24px}
.iq-letter.good{background:var(--leaf-2,#D2F7DF)} .iq-letter.bad{background:var(--coral-2,#FFE0E0)}
.iq-tap{width:min(80vw,520px);min-height:110px;border:none;border-radius:32px;background:var(--berry,#7B5CFF);color:#fff;font-family:var(--f-display);font-weight:800;font-size:36px;box-shadow:0 6px 0 #4B32C3;touch-action:none}
.iq-tap:active{transform:translateY(4px);box-shadow:0 2px 0 #4B32C3}
.iq-head{flex-direction:row;align-items:center;gap:20px;flex-wrap:wrap}
.iq-big{font-family:var(--f-display);font-weight:800;font-size:min(26vmin,140px);line-height:.9;color:var(--berry,#7B5CFF)}
.iq-big2{font-family:var(--f-display);font-weight:800;font-size:40px;margin:0}
.iq-headtx{display:flex;flex-direction:column;gap:4px} .iq-headtx b{font-family:var(--f-display);font-size:30px}
.iq-row{display:grid;grid-template-columns:minmax(120px,210px) 1fr 44px auto;gap:10px;align-items:center}
.iq-row.att{border-top:2px dashed var(--line,#B9D7F0);padding-top:10px}
.iq-lab{font-size:17px;line-height:1.15} .iq-v{font-family:var(--f-display);font-size:24px;text-align:right}
.iq-track{position:relative;height:16px;background:var(--guide,#D3E6F5);border-radius:99px}
.iq-mid{position:absolute;top:-4px;bottom:-4px;width:2px;background:var(--ink-2,#4A5C85)}
.iq-ci{position:absolute;top:4px;height:8px;background:#9FB3D9;border-radius:99px}
.iq-dot{position:absolute;top:50%;width:20px;height:20px;border-radius:50%;transform:translate(-50%,-50%);border:3px solid #fff;box-shadow:0 1px 3px #0005}
.iq-dot.hi{background:var(--leaf,#1DB954)} .iq-dot.mid{background:var(--sun-dark,#E09A00)} .iq-dot.lo{background:var(--coral,#FF4D4D)}
.iq-tr{border:none;background:var(--berry-2,#E9E3FF);color:var(--ink);border-radius:99px;padding:6px 12px;font-size:15px;font-weight:700}
.iq-scale{display:flex;justify-content:space-between;margin:0 calc(54px + 7em) 0 calc(min(210px,30%) + 10px)}
.iq-ul{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px;font-size:17px}
.iq-link{border:none;background:none;text-align:left;font-weight:700;padding:0;font-size:18px;color:var(--ink)}
.iq-hrow{display:flex;gap:10px;align-items:center}
.iq-hbtn{flex:1;border:none;background:var(--sky-2,#EEF9FF);border-radius:16px;padding:8px 14px;display:flex;gap:12px;align-items:center;text-align:left;flex-wrap:wrap}
.iq-hbtn b{font-family:var(--f-display);font-size:28px;color:var(--berry,#7B5CFF)}
@media (max-width:640px){
  .iq-modes{grid-template-columns:1fr} .iq-wopts{grid-template-columns:1fr} .iq-mopts{grid-template-columns:repeat(4,auto)}
  .iq-matwrap{--c:min(24vw,96px);--o:min(17vw,72px)} .iq-ropts .iq-opt{width:min(21vw,100px);height:min(21vw,100px)}
  .iq-row{grid-template-columns:1fr 40px auto;grid-template-areas:"l v b" "t t t"} .iq-row .iq-lab{grid-area:l} .iq-row .iq-v{grid-area:v} .iq-row .iq-tr{grid-area:b} .iq-row .iq-track{grid-area:t}
  .iq-scale{display:none} .iq-keys{grid-template-columns:repeat(3,68px)} .iq-key{height:52px}
  .iq-symt,.iq-symc{width:15vw;height:15vw} .iq-symg{gap:4px} .iq-sep{height:50px}
}
@media (max-height:620px){ .iq-keys{grid-template-columns:repeat(6,58px)} .iq-key{height:48px} .iq-digit{font-size:28vmin} }
`;
try{ const st=document.createElement('style'); st.id='lumi-iq-css'; st.textContent=CSS; document.head.appendChild(st); }catch(e){}

/* ---------- textos nuevos de index.html (clave en español → ca / en) ---------- */
const DICT_IDX={
  ca:{'Test de coeficiente intelectual':'Test de coeficient intel·lectual','Para 12 a 100 años: razonamiento, lenguaje, visoespacial, memoria, velocidad, cálculo y atención. Da un CI estimado con su margen de error y un plan de refuerzo.':'De 12 a 100 anys: raonament, llenguatge, visuoespacial, memòria, velocitat, càlcul i atenció. Dona un CI estimat amb el seu marge d\'error i un pla de reforç.',
    'Hacer el test':'Fes el test','Último resultado: CI estimado {0} ({1}–{2}), {3}.':'Últim resultat: CI estimat {0} ({1}–{2}), {3}.','Áreas a reforzar':'Àrees a reforçar',
    'Las áreas marcadas aparecen más seguido en el plan de cada día. Sirve para cualquier edad: por ejemplo, Atención y Concentración para un chico que se distrae, o Matemática para un adulto que quiere aprender a sumar.':'Les àrees marcades surten més sovint al pla de cada dia. Serveix per a qualsevol edat: per exemple, Atenció i Concentració per a un nen que es distreu, o Matemàtiques per a un adult que vol aprendre a sumar.',
    'Ninguna marcada: el plan rota todo y da más lugar a lo que le cuesta.':'Cap marcada: el pla ho fa rotar tot i dona més lloc al que li costa.','Adulto':'Adult','13 a 100':'13 a 100','¿Qué edad?':'Quina edat?',
    'Para adultos, los ejercicios diarios son los de los chicos más grandes y se adaptan solos al nivel (más fáciles si cuesta). El test de CI está en la zona de padres.':'Per als adults, els exercicis diaris són els dels nens més grans i s\'adapten sols al nivell (més fàcils si costa). El test de CI és a la zona de pares.',
    'Los perfiles de adulto no participan en el top 10.':'Els perfils d\'adult no participen en el top 10.','Plan de refuerzo aplicado.':'Pla de reforç aplicat.'},
  en:{'Test de coeficiente intelectual':'IQ test','Para 12 a 100 años: razonamiento, lenguaje, visoespacial, memoria, velocidad, cálculo y atención. Da un CI estimado con su margen de error y un plan de refuerzo.':'Ages 12 to 100: reasoning, language, visual-spatial, memory, speed, maths and attention. Gives an estimated IQ with its margin of error and a training plan.',
    'Hacer el test':'Take the test','Último resultado: CI estimado {0} ({1}–{2}), {3}.':'Latest result: estimated IQ {0} ({1}–{2}), {3}.','Áreas a reforzar':'Areas to strengthen',
    'Las áreas marcadas aparecen más seguido en el plan de cada día. Sirve para cualquier edad: por ejemplo, Atención y Concentración para un chico que se distrae, o Matemática para un adulto que quiere aprender a sumar.':'Marked areas appear more often in the daily plan. Works at any age: for example, Attention and Focus for a child who gets distracted, or Maths for an adult who wants to learn to add.',
    'Ninguna marcada: el plan rota todo y da más lugar a lo que le cuesta.':'None marked: the plan rotates everything and gives more room to what is hard.','Adulto':'Adult','13 a 100':'13 to 100','¿Qué edad?':'What age?',
    'Para adultos, los ejercicios diarios son los de los chicos más grandes y se adaptan solos al nivel (más fáciles si cuesta). El test de CI está en la zona de padres.':'For adults, daily exercises are those for the oldest children and adapt to the level by themselves (easier if it is hard). The IQ test is in the parents\' area.',
    'Los perfiles de adulto no participan en el top 10.':'Adult profiles do not take part in the top 10.','Plan de refuerzo aplicado.':'Training plan applied.'}};

window.LumiIQ={App:IQApp, dict:DICT_IDX, FOCUS, focusFor, weakAreas, classify,
  /* para pruebas automáticas */ _t:{eap, normMu, scoreAll, genMat, genRot, genSer, genCal, genWord, VOC, ANA, PW, MODES, symTrial, canon, mirror, rotKeys}};
})();
