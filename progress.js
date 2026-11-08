/* Lumi · Progresión de dificultad y evaluación de ubicación.
   Reglas (ver el documento «Lumi: plan de progresión de dificultad y evaluación de nivel»):
   - Aprendizaje para el dominio (Bloom/Guskey): subir solo con 90 % de media y ninguna partida bajo 80 %.
   - Fluidez (Kumon, Precision Teaching): además, más rápido que al llegar al nivel, o casi perfecto sin enlentecerse.
   - Práctica espaciada (Cepeda y otros, 2006): el dominio se confirma en días distintos, con un mínimo de 7 días por nivel (pedido de Guido).
   - Si le resulta fácil antes de los 7 días, se recomienda al padre pasar a Medio o Difícil (easyHint / Easy).
   - Zona de aprendizaje (~85 %): entre 60 % y 89 % el nivel se mantiene.
   - Bajar: dos partidas seguidas bajo 60 %. Tras 14 días sin jugar, la primera partida es de repaso.
   El tope de nivel por edad lo pone index.html (capLv) y se pasa como o.cap.
   Archivo aparte de index.html para no chocar con otros cambios. Expone window.LumiProg. */
(function(){
'use strict';
const LG=()=>{ const l=(document.documentElement.lang||'es').slice(0,2); return l==='ca'||l==='en'? l : 'es'; };

/* ---------- reglas ---------- */
const RULES={
  k:{sess:4, days:3, wait:7, mean:.9, min:.8, perDay:1},   /* 2 a 6 años */
  s:{sess:3, days:2, wait:7, mean:.9, min:.8, perDay:2},   /* 7 a 12 años */
  a:{sess:2, days:2, wait:7, mean:.85, min:.7, perDay:3}   /* adultos */
};
const MASTER=.9, LOW=.6, PAUSE=14, KEEP=24;
/* juegos donde la duración la marca el propio juego (secuencias, respiración, espera): no se mide la velocidad */
const NOSPEED=new Set(['wait','breathe','memory','cups','gonogo','pop']);
const grp=age=>(age||5)<=6? 'k' : (age||5)<=12? 's' : 'a';
const rulesFor=age=>RULES[grp(age)];
function dnum(key){ const [y,m,d]=String(key).split('-').map(Number); return Math.round(Date.UTC(y,(m||1)-1,d||1)/864e5); }
const ddiff=(a,b)=>dnum(b)-dnum(a);
const r2=(v,k)=>Math.round(v*k)/k;
function median(a){ const s=a.slice().sort((x,y)=>x-y); const n=s.length; return n? (n%2? s[(n-1)/2] : (s[n/2-1]+s[n/2])/2) : null; }
function todayKey(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

function track(n, game, lv, today){ const P=n.prog=n.prog||{}; let p=P[game];
  if(!p || p.lv!==lv) p=P[game]={lv, since:today, h:[]}; return p; }

/* Evalúa si con el historial actual corresponde subir. Devuelve {ok, need:[[clave, n]]} */
function check(p, game, age, today, P){ const R=rulesFor(age); const hs=p.h.filter(x=>!x.r); const need=[];
  if(hs.length<R.sess) need.push(['sess', R.sess-hs.length]);
  const good=new Set(hs.filter(x=>x.a>=MASTER).map(x=>x.d)).size; if(good<R.days) need.push(['days', R.days-good]);
  if(R.wait){ const waited=ddiff(p.since, today); if(waited<R.wait) need.push(['wait', R.wait-waited]); }
  const l3=hs.slice(-3); const mean=l3.length? r2(l3.reduce((s,x)=>s+x.a,0)/l3.length,1000) : 0; const mn=l3.length? Math.min(...l3.map(x=>x.a)) : 0;
  if(l3.length && (mean<R.mean || mn<R.min)) need.push(['acc', Math.round(R.mean*100)]);
  if(!NOSPEED.has(game)){ const t=hs.filter(x=>x.s); if(t.length>=4){ const base=median(t.slice(0,2).map(x=>x.s)), rec=median(t.slice(-2).map(x=>x.s));
      const fast= rec<=base*.85 || (mean>=.95 && rec<=base*1.1); if(!fast) need.push(['speed', 0]); } }
  const up=P&&P._up; if(!need.length && up && up.d===today && up.c>=R.perDay) need.push(['today', 0]);
  return {ok:!need.length, need}; }

/* Registra una partida y devuelve el nivel nuevo.
   o = {lv, max, age, acc, stars, mode, mins, total, practice, timed, today, cap} */
function step(n, game, o){ const today=o.today||todayKey(); const lv=o.lv||1, max=o.max||12, age=o.age||5;
  const cap=typeof o.cap==='function'? o.cap : (l=>l); const p=track(n, game, lv, today); const P=n.prog;
  let acc=+o.acc||0, spd=null;
  if(o.mode==='papel'){ acc= o.stars>=3? .9 : o.stars===2? .75 : .5; }
  else if(o.total && o.mins>0 && !o.timed){ spd=o.mins*60/o.total; if(!(spd>=.3 && spd<=600)) spd=null; } /* contra reloj: el tiempo no se compara */
  const last=p.h.length? p.h[p.h.length-1] : (P[game+'_last']? {d:P[game+'_last']} : null);
  const review= !!(last && last.d && ddiff(last.d, today)>=PAUSE);
  const prev=p.h.length? p.h[p.h.length-1] : null;
  p.h.push({d:today, a:r2(acc,1000), s:spd? r2(spd,10) : null, r:review?1:undefined}); if(p.h.length>KEEP) p.h=p.h.slice(-KEEP);
  P[game+'_last']=today;
  let nl=lv;
  if(acc<LOW && (review || (prev && prev.a<LOW))) nl=lv-1;
  else if(!review && acc>=LOW && check(p, game, age, today, P).ok) nl=lv+1;
  nl=Math.max(1, Math.min(max, nl));
  if(nl>lv){ const c=cap(nl); if(c<=lv) nl=lv; else { const u=P._up; P._up={d:today, c:(u&&u.d===today? u.c : 0)+1}; } }
  if(nl!==lv) P[game]={lv:nl, since:today, h:[]};
  return nl; }

/* ---------- textos ---------- */
const TX={
 es:{sess:'{0} partidas más', days:'{0} días más con 90 %', wait:'esperar {0} días', acc:'llegar a {0} % de media', speed:'responder con más soltura', today:'mañana (hoy ya subió otro juego)',
   ready:'Listo: sube en la próxima partida buena', need:'Para subir: ', top:'En el tope de su edad',
   explain:'Cada juego sube de nivel solo cuando hay dominio: varias partidas, 90 % de aciertos confirmado en {0} días distintos, al menos {1} días en el nivel y más soltura al responder (el tiempo por respuesta). Si le cuesta, repite; si le sale fácil antes de tiempo, acá te recomendamos pasar a Medio o Difícil. Como mucho sube {2} juego(s) por día. Entre 60 % y 89 % se queda en el nivel, que es donde aprende; con dos partidas seguidas bajo 60 % baja uno. En papel, 3 estrellas cuentan como 90 % y 2 estrellas como 75 %. Al lado de cada juego ves en qué edad y dificultad está y qué le falta para subir. Lo que le cuesta vuelve a aparecer. Puntos = estrellas × 10 × nivel.',
   title:'🧭 Evaluación de nivel', go:'Hacer la evaluación', easy:'Le está resultando fácil: en {0} de {1} juegos ya domina su nivel antes de los 7 días. Te recomendamos pasar a {2}.', raise:'Pasar a {0}', raised:'Listo: ahora en {0}. Los juegos que estaban más abajo suben a ese nivel.', dname:['Fácil','Medio','Difícil'], short:'Varias pruebas cortas seguidas que recomiendan en qué nivel o edad conviene empezar, por área. Es orientativa: nada cambia hasta que tocás «Aplicar».', open:'🧭 Evaluación de nivel',
   lead:'Varias pruebas cortas, por área, con los juegos de Lumi. Empiezan en lo esperable para {0} años y suben o bajan según cómo le va, hasta encontrar su nivel. Tarda entre 10 y 20 minutos.',
   kids:'Con chicos chicos conviene hacerla en 2 o 3 tandas: lo hecho queda guardado y se sigue donde quedó.',
   orient:'Es una orientación basada en cómo jugó esos días, no un diagnóstico ni una nota. Un día cansado puede dar un nivel más bajo: conviene repetirla cada 2 o 3 meses.',
   batch:'Tanda {0}', pend:'Pendiente', trying:'Probando…', start:'▶ Empezar', cont:'▶ Seguir', pause:'Buen momento para una pausa. Cuando quieran, sigan con la tanda siguiente.',
   result:'Resultado', area:'Área', level:'Nivel', rec:'Le recomendamos empezar como {0} años · {1}.', recSame:'Coincide con su edad.', recUp:'Va por encima de lo esperable para su edad en algunas áreas.', recDown:'Algunas áreas conviene reforzarlas desde más abajo.',
   apply:'Aplicar estos niveles', applied:'Niveles aplicados. Desde hoy cada juego sube con las reglas de dominio.', again:'Empezar de nuevo', back:'Volver', hist:'Evaluaciones anteriores',
   capNote:'Si algún nivel pasa el tope de su edad, Lumi lo deja en el tope.', of:'nivel {0} de {1}', tries:'{0} pruebas', try1:'1 prueba', weak:'Para reforzar: {0}.', strong:'Va adelantado en: {0}.', diff:['fácil','medio','difícil'], lastOk:'Última prueba: {0} % de aciertos', back2:'← Volver'},
 ca:{sess:'{0} partides més', days:'{0} dies més amb un 90 %', wait:'esperar {0} dies', acc:'arribar a un {0} % de mitjana', speed:'respondre amb més soltesa', today:'demà (avui ja ha pujat un altre joc)',
   ready:'A punt: puja a la propera partida bona', need:'Per pujar: ', top:'Al límit de la seva edat',
   explain:'Cada joc puja de nivell només quan hi ha domini: diverses partides, un 90 % d\'encerts confirmat en {0} dies diferents, almenys {1} dies al nivell i més soltesa en respondre (el temps per resposta). Si li costa, repeteix; si li surt fàcil abans d\'hora, aquí et recomanem passar a Mitjà o Difícil. Com a molt puja {2} joc(s) per dia. Entre el 60 % i el 89 % es queda al nivell, que és on aprèn; amb dues partides seguides per sota del 60 % baixa un nivell. En paper, 3 estrelles compten com un 90 % i 2 estrelles com un 75 %. Al costat de cada joc veus a quina edat i dificultat és i què li falta per pujar. El que li costa torna a sortir. Punts = estrelles × 10 × nivell.',
   title:'🧭 Avaluació de nivell', go:'Fer l\'avaluació', easy:'Li està resultant fàcil: en {0} de {1} jocs ja domina el nivell abans dels 7 dies. Et recomanem passar a {2}.', raise:'Passar a {0}', raised:'Fet: ara a {0}. Els jocs que eren més avall pugen a aquest nivell.', dname:['Fàcil','Mitjà','Difícil'], short:'Unes quantes proves curtes seguides que recomanen per quin nivell o edat convé començar, per àrea. És orientativa: no canvia res fins que toques «Aplicar».', open:'🧭 Avaluació de nivell',
   lead:'Unes quantes proves curtes, per àrea, amb els jocs de Lumi. Comencen pel que és esperable als {0} anys i pugen o baixen segons com li va, fins a trobar el seu nivell. Dura entre 10 i 20 minuts.',
   kids:'Amb infants petits val més fer-la en 2 o 3 tandes: el que s\'ha fet queda desat i es continua on s\'havia quedat.',
   orient:'És una orientació basada en com ha jugat aquells dies, no un diagnòstic ni una nota. Un dia cansat pot donar un nivell més baix: val la pena repetir-la cada 2 o 3 mesos.',
   batch:'Tanda {0}', pend:'Pendent', trying:'Provant…', start:'▶ Començar', cont:'▶ Continuar', pause:'Bon moment per fer una pausa. Quan vulgueu, continueu amb la tanda següent.',
   result:'Resultat', area:'Àrea', level:'Nivell', rec:'Us recomanem començar com a {0} anys · {1}.', recSame:'Coincideix amb la seva edat.', recUp:'Va per sobre del que és esperable per a la seva edat en algunes àrees.', recDown:'Algunes àrees val més reforçar-les des de més avall.',
   apply:'Aplicar aquests nivells', applied:'Nivells aplicats. A partir d\'avui cada joc puja amb les regles de domini.', again:'Tornar a començar', back:'Tornar', hist:'Avaluacions anteriors',
   capNote:'Si algun nivell passa el límit de la seva edat, Lumi el deixa al límit.', of:'nivell {0} de {1}', tries:'{0} proves', try1:'1 prova', weak:'Per reforçar: {0}.', strong:'Va avançat en: {0}.', diff:['fàcil','mitjà','difícil'], lastOk:'Última prova: {0} % d\'encerts', back2:'← Tornar'},
 en:{sess:'{0} more games', days:'{0} more days at 90 %', wait:'wait {0} days', acc:'reach a {0} % average', speed:'answer more fluently', today:'tomorrow (another game already went up today)',
   ready:'Ready: goes up on the next good game', need:'To go up: ', top:'At the top for their age',
   explain:'Each game only goes up a level when there is mastery: several games, 90 % correct confirmed on {0} different days, at least {1} days at the level and more fluent answers (time per answer). If it is hard, they repeat; if it is easy early, we recommend switching to Medium or Hard here. At most {2} game(s) go up per day. Between 60 % and 89 % it stays at the level, which is where learning happens; two games in a row below 60 % take it down one level. On paper, 3 stars count as 90 % and 2 stars as 75 %. Next to each game you see its age and difficulty and what is missing to go up. Whatever is hard comes back again. Points = stars × 10 × level.',
   title:'🧭 Level check', go:'Take the check', easy:'It is coming easily: in {0} of {1} games they already master their level before the 7 days. We recommend switching to {2}.', raise:'Switch to {0}', raised:'Done: now on {0}. Games that were lower go up to that level.', dname:['Easy','Medium','Hard'], short:'A few short tests in a row that recommend which level or age to start at, by area. It is only guidance: nothing changes until you tap «Apply».', open:'🧭 Level check',
   lead:'A few short tests per area, using Lumi\'s games. They start at what is expected at {0} and go up or down depending on how it goes, until they find the right level. It takes 10 to 20 minutes.',
   kids:'With young children it is best done in 2 or 3 rounds: progress is saved and you continue where you left off.',
   orient:'It is guidance based on how they played on those days, not a diagnosis or a grade. A tired day can give a lower level: repeat it every 2 or 3 months.',
   batch:'Round {0}', pend:'Pending', trying:'Testing…', start:'▶ Start', cont:'▶ Continue', pause:'Good time for a break. Continue with the next round whenever you like.',
   result:'Result', area:'Area', level:'Level', rec:'We recommend starting as {0} years · {1}.', recSame:'It matches their age.', recUp:'Above what is expected for their age in some areas.', recDown:'Some areas are better reinforced from lower down.',
   apply:'Apply these levels', applied:'Levels applied. From today each game goes up with the mastery rules.', again:'Start again', back:'Back', hist:'Previous checks',
   capNote:'If a level is above the top for their age, Lumi keeps it at the top.', of:'level {0} of {1}', tries:'{0} tests', try1:'1 test', weak:'To reinforce: {0}.', strong:'Ahead in: {0}.', diff:['easy','medium','hard'], lastOk:'Last test: {0} % correct', back2:'← Back'}
};
const t=k=>(TX[LG()]||TX.es)[k]!==undefined? (TX[LG()]||TX.es)[k] : TX.es[k];
const f=(k,...a)=>String(t(k)).replace(/\{(\d)\}/g,(m,i)=>a[+i]);

function status(save, g, max, cap){ const age=(save.settings&&save.settings.age)||5; const lv=(save.levels&&save.levels[g])||1; const P=save.prog||{};
  let p=P[g]; if(!p || p.lv!==lv) p={lv, since:todayKey(), h:[]};
  if(lv>=(max||12) || (typeof cap==='function' && cap(lv+1)<=lv)) return t('top');
  const c=check(p, g, age, todayKey(), P); if(c.ok) return t('ready');
  return t('need')+c.need.map(([k,v])=>f(k,v)).join(' · '); }
function explain(age){ const R=rulesFor(age); return f('explain', R.days, R.wait, R.perDay); }

/* ---------- evaluación de ubicación ---------- */
/* escalera: arranca en lo esperable para la edad; ≥85 % sube 2 (luego 1), <60 % baja 2 (luego 1), en medio se queda; máx. 3 pruebas */
function nextTry(tries, start, max){ if(!tries.length) return Math.max(1, Math.min(max, start));
  if(tries.length>=3) return null; const last=tries[tries.length-1]; const first=tries.length===1; const big= max>=6;
  let nx= last.acc>=.85? last.lv+(first&&big?2:1) : last.acc<.6? last.lv-(first&&big?2:1) : null;
  if(nx===null) return null; nx=Math.max(1, Math.min(max, nx)); if(tries.some(x=>x.lv===nx)) {
    /* ya probado: si subía y el de arriba ya estaba probado, terminamos */ return null; }
  /* tras subir y fallar, probar el intermedio */
  return nx; }
function placed(tries){ if(!tries.length) return null;
  const hi=a=>{ const l=tries.filter(x=>x.acc>=a).map(x=>x.lv); return l.length? Math.max(...l) : null; };
  const v=hi(.75); if(v!=null) return v; const w=hi(.6); if(w!=null) return w; return Math.max(1, Math.min(...tries.map(x=>x.lv))-1); }

function placeNew(n, games){ n.place={t0:todayKey(), age:(n.settings&&n.settings.age)||5, g:{}}; games.forEach(x=>{ n.place.g[x.g]={tries:[], done:false, start:x.start, max:x.max}; }); return n.place; }
function placeAdd(n, g, lv, acc, secs){ const pl=n.place; if(!pl || !pl.g[g]) return; const s=pl.g[g];
  s.tries.push({lv, acc:r2(acc,1000), s:secs? r2(secs,10) : null, d:todayKey()});
  if(nextTry(s.tries, s.start, s.max)===null){ s.done=true; s.res=placed(s.tries); } }

/* edad + dificultad cuyos niveles por juego se parecen más a lo ubicado (cerca de su edad) */
function recommend(res, age, levelsFor, maxLv, ages){ let best=null;
  (ages||[2,3,4,5,6,7,8,9,10,11,12]).filter(a=>Math.abs(a-age)<=3).forEach(a=>{ [0,1,2].forEach(k=>{ const L=levelsFor(a, ['facil','medio','dificil'][k]); let d=0, n=0;
      Object.entries(res).forEach(([g,lv])=>{ if(lv==null) return; const e=Math.min(maxLv(g), L[g]||1); d+=(lv-e)*(lv-e); n++; });
      if(!n) return; const sc=d/n + Math.abs(a-age)*.05 + Math.abs(k-1)*.02; if(!best || sc<best.sc) best={sc, age:a, k}; }); });
  return best; }

function Place(props){ const {save, update, games, levelsFor, maxLv, label, onPlay, onBack, toast, ages}=props;
  const React=window.React; const h=window.htm.bind(React.createElement);
  const st=save.settings||{}; const age=st.age||5; const pl=save.place && save.place.age===age? save.place : null;
  const batches=[]; games.forEach((x,i)=>{ const b=Math.floor(i/2); (batches[b]=batches[b]||[]).push(x); });
  const S=g=>(pl&&pl.g[g])||{tries:[],done:false};
  const allDone= !!pl && games.every(x=>S(x.g).done);
  const nextG= pl && games.find(x=>!S(x.g).done);
  function go(){ let p=pl; if(!p){ update(n=>{ placeNew(n, games); return n; }); }
    const x= p? nextG : games[0]; if(!x) return; const s=p? S(x.g) : {tries:[]}; const lv=nextTry(s.tries, x.start, x.max); if(lv==null) return; onPlay(x.g, lv); }
  const res={}; if(pl) games.forEach(x=>{ res[x.g]=S(x.g).done? S(x.g).res : null; });
  const rec= allDone? recommend(res, age, levelsFor, maxLv, ages) : null;
  const curB= pl? batches.findIndex(b=>b.some(x=>!S(x.g).done)) : 0;
  const pauseNow= pl && !allDone && curB>0 && batches[curB].every(x=>!S(x.g).tries.length) && age<=6;
  function apply(){ update(n=>{ const L=levelsFor(rec.age, ['facil','medio','dificil'][rec.k]); const today=todayKey();
      Object.keys(n.levels).forEach(g=>{ const v= res[g]!=null? res[g] : (L[g]||n.levels[g]); n.levels[g]=Math.max(1, Math.min(maxLv(g), v)); });
      n.prog={_up:n.prog&&n.prog._up}; if(rec.age===age) n.settings.diff=['facil','medio','dificil'][rec.k];
      n.placeHist=[...(n.placeHist||[]), {d:today, age, rec:[rec.age, rec.k], res}].slice(-10); n.place=null; return n; });
    if(toast) toast(t('applied')); onBack(); }
  const lab=(g,lv)=> maxLv(g)===12? label(lv) : f('of', lv, maxLv(g));
  return h`<div className="screen adult">
    <div className="row"><button className="icon-btn" onClick=${onBack} aria-label=${t('back')}>←</button><h2>${t('title')}</h2></div>
    <div className="scroll"><div style=${{display:'flex',flexDirection:'column',gap:'14px',maxWidth:'860px',margin:'0 auto'}}>
      <div className="panel">
        <p>${f('lead', age)}</p>${age<=6 && h`<p className="small muted">${t('kids')}</p>`}
        ${batches.map((b,i)=>h`<div key=${i}><h3>${f('batch', i+1)}</h3>
          ${b.map(x=>{ const s=S(x.g); return h`<div key=${x.g} className="skill"><span className="emoji">${x.icon}</span><span>${x.area} <span className="muted small">· ${x.name}${s.tries.length? ' · '+(s.tries.length===1? t('try1') : f('tries', s.tries.length)) : ''}</span></span>
            <span className="lvlnum">${s.done? lab(x.g, s.res) : s.tries.length? t('trying') : t('pend')}</span></div>`; })}</div>`)}
        ${pauseNow && h`<p className="note">${t('pause')}</p>`}
        ${!allDone && h`<div className="row"><button className="btn" onClick=${go}>${pl? t('cont') : t('start')}</button>${pl && h`<button className="btn soft small" onClick=${()=>update(n=>{ n.place=null; return n; })}>${t('again')}</button>`}</div>`}
      </div>
      ${allDone && rec && h`<div className="panel"><h3>${t('result')}</h3>
        <p><b>${f('rec', rec.age, t('diff')[rec.k])}</b> ${rec.age===age? t('recSame') : rec.age>age? t('recUp') : t('recDown')}</p>
        ${(()=>{ const E=levelsFor(age,'medio'); const lo=games.filter(x=>res[x.g]!=null && res[x.g]<Math.min(x.max,E[x.g]||1)).map(x=>x.area); const hi=games.filter(x=>res[x.g]!=null && res[x.g]>(E[x.g]||1)).map(x=>x.area);
          return h`${lo.length? h`<p>${f('weak', lo.join(', '))}</p>` : ''}${hi.length? h`<p>${f('strong', hi.join(', '))}</p>` : ''}`; })()}
        <p className="small muted">${t('capNote')}</p>
        <div className="row"><button className="btn" onClick=${apply}>${t('apply')}</button><button className="btn soft small" onClick=${()=>update(n=>{ n.place=null; return n; })}>${t('again')}</button></div></div>`}
      <p className="note">${t('orient')}</p>
      ${(save.placeHist||[]).length>0 && h`<div className="panel"><h3>${t('hist')}</h3>
        ${(save.placeHist||[]).slice().reverse().map((x,j)=>h`<div key=${j} className="skill"><span className="emoji">🧭</span><span>${x.d}</span><span className="lvlnum">${f('rec', x.rec[0], t('diff')[x.rec[1]])}</span></div>`)}</div>`}
    </div></div></div>`; }


/* ---------- «le resulta fácil»: recomendar Medio o Difícil ---------- */
const DIFF_KEYS=['facil','medio','dificil'];
function easyHint(save, games){ const st=save.settings||{}; const age=st.age||5; const P=save.prog||{}; const today=todayKey(); let easy=0, n=0;
  (games||[]).forEach(g=>{ const lv=(save.levels||{})[g]||1; const p=P[g]; if(!p || p.lv!==lv || !p.h.length) return; n++;
    const c=check(p, g, age, today, P); if(c.need.length && c.need.every(([k])=>k==='wait'||k==='today')) easy++; });
  const k=Math.max(0, DIFF_KEYS.indexOf(st.diff||'medio')); if(k>=2 || n<2 || easy*2<n) return null;
  return {easy, n, next:k+1}; }
function Easy({save, games, update, levelsFor, maxLv, toast}){ const React=window.React; const h=window.htm.bind(React.createElement);
  const e=easyHint(save, games); if(!e) return null; const name=t('dname')[e.next];
  function raise(){ const age=(save.settings&&save.settings.age)||5; const key=DIFF_KEYS[e.next];
    update(n=>{ n.settings.diff=key; const L=levelsFor(age, key); Object.keys(n.levels).forEach(g=>{ const v=Math.min(maxLv(g), L[g]||1); if(v>n.levels[g]) n.levels[g]=v; }); return n; });
    if(toast) toast(f('raised', name)); }
  return h`<div className="note"><p>${f('easy', e.easy, e.n, name)}</p><button className="btn small" onClick=${raise}>${f('raise', name)}</button></div>`; }

window.LumiProg={easyHint, Easy, RULES, rulesFor, step, check, status, explain, nextTry, placed, placeNew, placeAdd, recommend, Place, t, f};
})();
