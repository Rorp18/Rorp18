'use strict';
/* ===== CENDRES — moteur de jeu ===== */

/* ---------- Utilitaires ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rnd = n => Math.floor(Math.random() * n);
const d6 = () => 1 + rnd(6);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[rnd(a.length)];
const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const byId = (arr, id) => arr.find(x => x.id === id);
const sign = v => (v > 0 ? '+' : '−') + Math.abs(v);

/* ---------- État ---------- */
let view = 'home';        // home | setup | game
let setup = {
  mode: 'table', scen: 'hiver', len: 12,
  players: [{ name: '', role: 'medecin' }, { name: '', role: 'mecano' }, { name: '', role: 'chasseur' }]
};
let S = null;             // état de la partie
let R = null;             // résolution en cours (carte jouée)

const SC = () => byId(SCENARIOS, S.sc);
const alive = () => S.players.filter(p => p.alive);

/* ---------- Création de partie ---------- */
function startGame() {
  const sc = byId(SCENARIOS, setup.scen);
  const len = LENGTHS.find(l => l.days === setup.len);
  const players = setup.players.map((p, i) => {
    const r = byId(ROLES, p.role);
    return {
      name: p.name.trim() || ('Survivant ' + (i + 1)), role: r.id, hp: 6, max: 6,
      stats: { ...r.stats }, items: [{ id: r.item, u: ITEMS[r.item].u }], alive: true, dest: { step: 0, done: false }
    };
  });
  S = {
    mode: setup.mode, sc: sc.id, day: 1, max: len.days, goal: len.goal,
    players, res: { ...sc.start }, hope: sc.hope, def: setup.mode === 'destins' ? 3 : 1, prog: 0,
    log: [], dayLog: [], order: [], turn: 0, nightLines: [], phase: 'intro', end: null,
    decks: { ev: [], sc: [] }
  };
  R = null; view = 'game';
  render();
}

function draw(kind) {
  const d = S.decks[kind];
  if (!d.length) {
    const pool = kind === 'ev' ? EVENTS.filter(e => e.tags.includes('*') || e.tags.includes(S.sc)) : SCENES;
    d.push(...shuffle(pool.map(c => c.id)));
  }
  const id = d.pop();
  return byId(kind === 'ev' ? EVENTS : SCENES, id);
}

function note(t) { S.log.push({ d: S.day, t }); }

/* ---------- Déroulé d'une journée ---------- */
function startDay() {
  S.dayLog = [];
  const lead = alive().find(p => p.role === 'leader');
  if (lead) { S.hope = clamp(S.hope + 1, 0, 10); note(`🎖️ ${lead.name} remonte le moral du camp (+1 🕊️).`); }
  if (S.mode === 'table') {
    S.phase = 'dawn';
    openResolver({ card: draw('ev'), kind: 'event', label: `Aube du jour ${S.day} — Événement`, onDone: beginActions });
  } else {
    S.order = S.players.map((p, i) => i).filter(i => S.players[i].alive);
    S.turn = 0;
    beginScene();
  }
}

/* Mode Table : une action par survivant */
function beginActions() {
  S.phase = 'actions';
  S.order = S.players.map((p, i) => i).filter(i => S.players[i].alive);
  S.turn = 0;
  skipDead();
  if (S.turn >= S.order.length) return goNight();
  render();
}
function skipDead() { while (S.turn < S.order.length && !S.players[S.order[S.turn]].alive) S.turn++; }
function pickAction(id) {
  const a = byId(ACTIONS, id), ai = S.order[S.turn];
  openResolver({
    card: { i: a.i, n: a.n, text: a.desc, choices: [a] }, choice: a, kind: 'action', fixed: ai,
    label: `Tour de ${S.players[ai].name}`,
    onDone: () => { S.turn++; skipDead(); if (S.turn >= S.order.length) goNight(); else render(); }
  });
}

/* Mode Destins : une scène privée par survivant, puis un événement du camp */
function beginScene() {
  while (S.turn < S.order.length && !S.players[S.order[S.turn]].alive) S.turn++;
  if (S.turn >= S.order.length) { S.phase = 'recap'; return render(); }
  S.phase = 'pass';
  render();
}
function readyScene() {
  const pi = S.order[S.turn], p = S.players[pi];
  const d = DESTINIES[p.role];
  const due = !p.dest.done && p.dest.step < 3 && S.day >= Math.max(1, Math.ceil(S.max * [0.15, 0.45, 0.75][p.dest.step]))
    && (p.dest.last == null || S.day - p.dest.last >= 2);
  if (due) p.dest.last = S.day;
  const card = due ? destinyCard(p) : draw('sc');
  S.phase = 'scene';
  openResolver({
    card, kind: due ? 'destiny' : 'scene', fixed: pi, secret: true,
    label: due ? `Ton destin — ${d.n}` : `Scène personnelle de ${p.name}`,
    onDone: () => { S.turn++; beginScene(); }
  });
}
function destinyCard(p) {
  const d = DESTINIES[p.role], i = p.dest.step;
  return {
    i: d.i, n: `${d.n} (${i + 1}/3)`, text: d.steps[i], destiny: true,
    choices: [
      { l: 'Approche audacieuse', s: d.a, d: 9, w: ['Tu réussis brillamment : l\'étape est franchie, avec un petit bonus.', { dest: 1, hope: 1 }], f: ['Tu échoues et tu te blesses. Tu devras réessayer.', { hp: -1 }] },
      { l: 'Approche prudente', s: d.b, d: 7, w: ['Patiemment, tu franchis l\'étape.', { dest: 1 }], f: ['Ça ne marche pas. Le groupe en pâtit.', { hope: -1 }] }
    ]
  };
}
function recapNext() {
  S.phase = 'evening';
  openResolver({ card: draw('ev'), kind: 'event', label: `Soir du jour ${S.day} — Réunion du camp`, onDone: goNight });
}

/* ---------- Résolution d'une carte ---------- */
function openResolver(o) {
  R = { ...o, stage: o.choice ? 'prep' : 'choose', actor: o.fixed != null ? o.fixed : null, target: null, used: [], result: null, dice: null };
  if (o.choice) prepInit();
  if (o.choice && !o.choice.s) return doResolve();
  render();
}
function chosenAffordable(ch) {
  if (!ch.c) return true;
  return Object.keys(ch.c).every(k => S.res[k] >= ch.c[k]);
}
function bestActor(stat) {
  let best = null;
  alive().forEach(p => { if (!best || p.stats[stat] > best.stats[stat]) best = p; });
  return S.players.indexOf(best);
}
function prepInit() {
  const ch = R.choice;
  if (R.actor == null) R.actor = ch.s ? bestActor(ch.s) : S.players.findIndex(p => p.alive);
  if (ch.t === 'heal') {
    let t = null;
    alive().forEach(p => { if (!t || (p.hp < t.hp)) t = p; });
    R.target = S.players.indexOf(t);
  }
}
function chooseChoice(i) {
  const ch = R.card.choices[i];
  if (!chosenAffordable(ch)) return;
  R.choice = ch;
  if (R.actor == null && ch.s) R.actor = bestActor(ch.s);
  if (!ch.s) { if (R.actor == null) R.actor = S.players.findIndex(p => p.alive); return doResolve(); }
  prepInit();
  R.stage = 'prep';
  render();
}
function modifier() {
  const ch = R.choice, a = S.players[R.actor];
  let m = a.stats[ch.s] || 0;
  if (ch.pb && ch.pb[a.role]) m += ch.pb[a.role];
  R.used.forEach(k => { const [pi, ii] = k.split(':').map(Number); m += ITEMS[S.players[pi].items[ii].id].b; });
  return m;
}
function odds(mod, dc) {
  let n = 0;
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) {
    const crit = a === 6 && b === 6, fum = a === 1 && b === 1;
    if (crit || (!fum && a + b + mod >= dc)) n++;
  }
  return Math.round(n / 36 * 100);
}
function availableItems() {
  const ch = R.choice, out = [];
  S.players.forEach((p, pi) => {
    if (!p.alive) return;
    if (S.mode !== 'table' && pi !== R.actor) return;
    p.items.forEach((it, ii) => { if (ITEMS[it.id].stat === ch.s) out.push({ pi, ii, key: pi + ':' + ii, it, def: ITEMS[it.id] }); });
  });
  return out;
}
function toggleItem(key) {
  const i = R.used.indexOf(key);
  if (i >= 0) R.used.splice(i, 1);
  else { if (R.used.length >= 2) R.used.shift(); R.used.push(key); }
  render();
}
function rollNow() {
  const ch = R.choice;
  R.dice = [d6(), d6()];
  R.mod = modifier();
  R.stage = 'rolling';
  render();
  setTimeout(() => doResolve(), 900);
}

function pairOf(x, actor) { return typeof x === 'function' ? x(actor) : x; }

function doResolve() {
  const ch = R.choice, actor = S.players[R.actor];
  // coût
  if (ch.c) for (const k in ch.c) S.res[k] = Math.max(0, S.res[k] - ch.c[k]);
  let ok = true, crit = false, fumble = false, total = 0, pair;
  if (ch.s) {
    // objets utilisés
    const used = R.used.map(k => k.split(':').map(Number)).sort((a, b) => b[1] - a[1]);
    used.forEach(([pi, ii]) => { const it = S.players[pi].items[ii]; it.u--; if (it.u <= 0) S.players[pi].items.splice(ii, 1); });
    const [a, b] = R.dice;
    crit = a === 6 && b === 6; fumble = a === 1 && b === 1;
    total = a + b + R.mod;
    ok = crit || (!fumble && total >= ch.d);
    pair = ok ? pairOf(crit && ch.cw ? ch.cw : ch.w, actor) : pairOf(ch.f, actor);
  } else pair = pairOf(ch.w, actor);
  let fx = { ...pair[1] };
  if (crit && !ch.cw) fx = mergeFx(fx, { hope: 1 });
  if (fumble) fx = mergeFx(fx, { hp: -1 });
  const lines = applyFx(fx, R.actor, R.target);
  lines.push(...reap());
  R.result = { ok, crit, fumble, total, text: pair[0], lines };
  R.stage = 'result';
  const tag = ch.s ? (crit ? '🌟 ' : fumble ? '💥 ' : ok ? '✅ ' : '❌ ') : '';
  note(`${tag}${actor.name} — ${R.card.n} : ${pair[0]}`);
  S.dayLog.push({ who: actor.name, i: R.card.i, text: pair[0], ok });
  render();
}

function finishResolver() {
  const cb = R.onDone;
  R = null;
  if (checkEnd()) return;
  cb();
}

/* ---------- Effets ---------- */
function giveItem(pi, id) {
  const cand = [pi, ...S.players.map((p, i) => i)].filter(i => S.players[i].alive && S.players[i].items.length < 4);
  if (!cand.length) return null;
  const p = S.players[cand[0]];
  p.items.push({ id, u: ITEMS[id].u });
  return { p, id };
}
function applyFx(fx, ai, ti) {
  const out = [], a = S.players[ai];
  const push = (t, good) => out.push({ t, good });
  for (const k in fx) {
    const v = fx[k];
    if (RES[k]) {
      const before = S.res[k]; S.res[k] = Math.max(0, S.res[k] + v);
      const d = S.res[k] - before;
      if (d) push(`${sign(d)} ${RES[k].i} ${RES[k].n}`, d > 0);
    } else if (k === 'hope') {
      const before = S.hope; S.hope = clamp(S.hope + v, 0, 10);
      if (S.hope !== before) push(`${sign(S.hope - before)} 🕊️ Espoir`, S.hope > before);
    } else if (k === 'prog') {
      S.prog += v; push(`${sign(v)} 🎯 Objectif`, v > 0);
    } else if (k === 'def') {
      const before = S.def; S.def = clamp(S.def + v, 0, 5);
      if (S.def !== before) push(`${sign(S.def - before)} 🛡️ Défense`, S.def > before);
      else if (v > 0) push('🛡️ Défense au maximum', true);
    } else if (k === 'hp') {
      if (a.alive) { const b = a.hp; a.hp = clamp(a.hp + v, 0, a.max); if (a.hp !== b) push(`${a.name} ${sign(a.hp - b)} ❤️`, a.hp > b); }
    } else if (k === 'heal') {
      const t = S.players[ti != null ? ti : ai];
      if (t.alive) { const b = t.hp; t.hp = clamp(t.hp + v, 0, t.max); push(`${t.name} ${sign(t.hp - b)} ❤️`, true); }
    } else if (k === 'hpAll') {
      alive().forEach(p => { const b = p.hp; p.hp = clamp(p.hp + v, 0, p.max); if (p.hp !== b) push(`${p.name} ${sign(p.hp - b)} ❤️`, v > 0); });
    } else if (k === 'item') {
      const id = typeof v === 'string' ? v : pick(Object.keys(ITEMS));
      const g = giveItem(ai, id);
      if (g) push(`${ITEMS[id].i} ${ITEMS[id].n} → ${g.p.name}`, true);
      else push('Sacs pleins : objet abandonné', false);
    } else if (k === 'dest') {
      a.dest.step++;
      push(`${DESTINIES[a.role].i} Destin : étape ${a.dest.step}/3`, true);
      if (a.dest.step >= 3) {
        a.dest.done = true;
        const d = DESTINIES[a.role];
        note(`🌟 ${a.name} accomplit son destin « ${d.n} » : ${d.rt}`);
        push(`🌟 Destin accompli : ${d.rt}`, true);
        out.push(...applyFx(d.rf, ai, ti));
      }
    }
  }
  return out;
}
function reap() {
  const out = [];
  S.players.forEach(p => {
    if (p.alive && p.hp <= 0) {
      p.alive = false; S.hope = clamp(S.hope - 1, 0, 10);
      out.push({ t: `☠️ ${p.name} n'a pas survécu (−1 🕊️)`, good: false });
      note(`☠️ ${p.name} (${byId(ROLES, p.role).n}) est mort.`);
    }
  });
  return out;
}

/* ---------- Fin de partie ---------- */
function checkEnd() {
  if (!alive().length) return endGame('lose', 'Tous les survivants ont péri.');
  if (S.hope <= 0) return endGame('lose', 'Le dernier espoir s\'est éteint. Le groupe se disloque.');
  if (S.prog >= S.goal) return endGame('win', SC().win);
  return false;
}
function endGame(type, text) {
  S.phase = 'end'; S.end = { type, text }; R = null; render(); return true;
}

/* ---------- Nuit ---------- */
function goNight() {
  S.phase = 'night';
  const sc = SC(), L = [];
  const add = (i, t, good) => L.push({ i, t, good });
  const al = alive(); const n = al.length;
  // Mode Destins : les tâches communes du camp (pendant que chacun vit sa scène)
  if (S.mode === 'destins') {
    const w = Math.ceil(al.length * 0.4), f = Math.floor(al.length * 0.2);
    S.res.water += w; S.res.food += f;
    add('🏕️', `Pendant ce temps, le camp s'organise : corvées d'eau et de nourriture (+${w} 💧, +${f} 🥫).`, true);
  }
  // Consommation
  const cook = al.some(p => p.role === 'cuisinier');
  const needF = Math.max(0, n - (cook ? 1 : 0)), needW = n;
  const eatF = Math.min(S.res.food, needF), eatW = Math.min(S.res.water, needW);
  S.res.food -= eatF; S.res.water -= eatW;
  add('🍽️', `Le groupe consomme ${eatF} 🥫 et ${eatW} 💧${cook ? ' (le cuisinier fait des miracles)' : ''}.`);
  const lackF = needF - eatF, lackW = needW - eatW;
  let hurt = false;
  if (lackF + lackW > 0) {
    const order = shuffle(al.map(p => S.players.indexOf(p)));
    const names = [];
    for (let k = 0; k < lackF + lackW; k++) { const p = S.players[order[k % order.length]]; p.hp--; names.push(p.name); }
    S.hope = clamp(S.hope - 1, 0, 10); hurt = true;
    add('🥵', `${lackF ? 'Faim' : ''}${lackF && lackW ? ' et ' : ''}${lackW ? 'soif' : ''} : ${[...new Set(names)].join(', ')} souffre${new Set(names).size > 1 ? 'nt' : ''} (−1 ❤️ chacun, −1 🕊️).`, false);
  }
  // Froid
  if (sc.cold) {
    if (S.res.mat >= 1) { S.res.mat--; add('🔥', 'Le feu brûle toute la nuit (−1 🔧).', true); }
    else { alive().forEach(p => p.hp--); S.hope = clamp(S.hope - 1, 0, 10); hurt = true; add('🥶', 'Plus de bois : le froid mord. −1 ❤️ pour tous, −1 🕊️.', false); }
  }
  // Menace
  const T = d6() + d6() + Math.floor(S.day / 4) + sc.threatMod - (S.mode === 'destins' ? 1 : 0), D = 4 + 2 * S.def;
  add('🌑', `${pick(sc.threat)}`);
  add('🎲', `Menace ${T} contre Défense ${D} (🛡️ ${S.def}).`);
  if (T > D) {
    const dmg = Math.min(3, Math.ceil((T - D) / 3));
    const victims = shuffle(alive().map(p => S.players.indexOf(p)));
    const names = [];
    for (let k = 0; k < dmg; k++) { const p = S.players[victims[k % victims.length]]; if (p) { p.hp--; names.push(p.name); } }
    const lostF = S.res.food > 0 ? 1 : 0; S.res.food -= lostF;
    if (S.def > 0) S.def--;
    S.hope = clamp(S.hope - 1, 0, 10); hurt = true;
    add('💥', `La défense cède ! ${names.join(', ')} blessé(s) (−1 ❤️ chacun)${lostF ? ', −1 🥫 volé' : ''}, −1 🛡️, −1 🕊️.`, false);
  } else if (D >= T + 5) {
    S.hope = clamp(S.hope + 1, 0, 10);
    add('🏰', 'Votre camp est une forteresse : l\'ennemi n\'ose même pas approcher (+1 🕊️).', true);
  } else add('🛡️', 'Le camp tient bon.', true);
  // Fatigue
  if (S.day % 3 === 0) { S.hope = clamp(S.hope - 1, 0, 10); add('🌑', 'La fatigue pèse sur les esprits (−1 🕊️).', false); }
  // Morts
  reap().forEach(r => add('☠️', r.t.replace('☠️ ', ''), false));
  // Sommeil réparateur
  if (!hurt && alive().length) { alive().forEach(p => { p.hp = Math.min(p.max, p.hp + 1); }); add('😴', 'Bonne nuit de sommeil : +1 ❤️ pour tous.', true); }
  S.nightLines = L;
  L.forEach(l => note(`Nuit ${S.day} : ${l.t}`));
  if (checkEnd()) return;
  render();
}
function nextDay() {
  S.day++;
  if (S.day > S.max) return endGame('survive', SC().surv);
  startDay();
}

/* ============================================================
   VUES
   ============================================================ */
function render() {
  const app = $('#app');
  if (view === 'home') app.innerHTML = homeView();
  else if (view === 'setup') app.innerHTML = setupView();
  else app.innerHTML = gameView();
  window.scrollTo(0, 0);
}

function homeView() {
  return `<div class="home">
    <div class="logo">☢️</div>
    <h1>CENDRES</h1>
    <p class="tag">Un jeu de survie coopératif, au tour par tour, pour les groupes d'amis.</p>
    <p class="sub">Le monde s'est effondré. Gérez vos ressources, vos blessés et votre espoir. Chacun joue un rôle, personne ne survit seul.</p>
    <div class="btns">
      <button class="btn big" data-a="goSetup">▶ Nouvelle partie</button>
      <button class="btn ghost" data-a="rules">📖 Comment jouer</button>
    </div>
  </div>`;
}

function setupView() {
  const modeCard = (id, i, n, d) => `<button class="opt ${setup.mode === id ? 'on' : ''}" data-a="mode" data-v="${id}"><span class="oi">${i}</span><b>${n}</b><small>${d}</small></button>`;
  const used = setup.players.map(p => p.role);
  return `<div class="setup">
    <button class="back" data-a="goHome">← Retour</button>
    <h2>Préparer la partie</h2>

    <h3>1 · Mode de jeu</h3>
    <div class="opts two">
      ${modeCard('table', '🪑', 'Table commune', 'Tout le monde autour d\'un seul écran. On débat, on décide ensemble, chacun joue son action à son tour.')}
      ${modeCard('destins', '🧭', 'Destins séparés', 'Chacun vit sa propre scène en secret (on se passe l\'appareil), poursuit un destin personnel… et le groupe se retrouve le soir.')}
    </div>

    <h3>2 · Scénario</h3>
    <div class="opts two">
      ${SCENARIOS.map(s => `<button class="opt ${setup.scen === s.id ? 'on' : ''}" data-a="scen" data-v="${s.id}"><span class="oi">${s.i}</span><b>${s.n}</b><small>${s.blurb}</small><em>🎯 ${s.goalName}</em></button>`).join('')}
    </div>

    <h3>3 · Durée</h3>
    <div class="opts three">
      ${LENGTHS.map(l => `<button class="opt small ${setup.len === l.days ? 'on' : ''}" data-a="len" data-v="${l.days}"><b>${l.n}</b><small>${l.days} jours · ${l.t}</small></button>`).join('')}
    </div>

    <h3>4 · Survivants <span class="count">(${setup.players.length}/6)</span></h3>
    <div class="plist">
      ${setup.players.map((p, i) => {
        const r = byId(ROLES, p.role);
        return `<div class="prow">
          <input type="text" maxlength="14" placeholder="Prénom du joueur ${i + 1}" value="${esc(p.name)}" data-name="${i}">
          <select data-role="${i}">${ROLES.map(x => `<option value="${x.id}" ${x.id === p.role ? 'selected' : ''}>${x.i} ${x.n}</option>`).join('')}</select>
          ${setup.players.length > 1 ? `<button class="x" data-a="delP" data-v="${i}" title="Retirer">✕</button>` : ''}
          <div class="rinfo">${statsRow(r.stats)} <span>${r.perk}</span> · Départ : ${ITEMS[r.item].i} ${ITEMS[r.item].n}</div>
        </div>`;
      }).join('')}
      ${setup.players.length < 6 ? `<button class="btn ghost" data-a="addP">+ Ajouter un survivant</button>` : ''}
    </div>
    <div class="btns"><button class="btn big" data-a="start">⚡ Lancer la partie</button></div>
  </div>`;
}
function statsRow(st) {
  return `<span class="stats">${Object.keys(STATS).map(k => `<i title="${STATS[k].n}">${STATS[k].i}${st[k]}</i>`).join('')}</span>`;
}

function gameView() {
  const sc = SC();
  const hearts = p => p.alive ? '♥'.repeat(p.hp) + '<span class="lost">' + '♥'.repeat(p.max - p.hp) + '</span>' : '☠️';
  const actorIdx = R && R.actor != null && R.stage !== 'choose' ? R.actor : (S.phase === 'actions' ? S.order[S.turn] : (S.phase === 'pass' || S.phase === 'scene' ? S.order[S.turn] : -1));
  const hideCrew = S.mode === 'destins' && (S.phase === 'pass' || S.phase === 'scene');
  const phaseLbl = { intro: 'Introduction', dawn: 'Aube', actions: 'Journée', pass: 'Scènes', scene: 'Scènes', recap: 'Rapport', evening: 'Soir', night: 'Nuit', end: 'Fin' }[S.phase];
  return `<div class="game">
    <header class="top">
      <div class="dayc"><b>Jour ${Math.min(S.day, S.max)}</b><span>/ ${S.max}</span></div>
      <div class="ph">${sc.i} ${sc.n} · ${phaseLbl}</div>
      <div class="tb"><button data-a="log" title="Journal">📜</button><button data-a="quit" title="Quitter">⏏</button></div>
    </header>
    <section class="stocks">
      ${Object.keys(RES).map(k => `<div class="stock" title="${RES[k].n}"><span>${RES[k].i}</span><b>${S.res[k]}</b></div>`).join('')}
      <div class="stock" title="Défense du camp"><span>🛡️</span><b>${S.def}</b></div>
    </section>
    <section class="bars">
      <div class="bar" title="Espoir"><label>🕊️ Espoir ${S.hope}/10</label><div class="track"><i class="hopef" style="width:${S.hope * 10}%"></i></div></div>
      <div class="bar" title="${sc.goalName}"><label>🎯 ${sc.goalName} ${S.prog}/${S.goal}</label><div class="track"><i class="progf" style="width:${clamp(S.prog / S.goal * 100, 0, 100)}%"></i></div></div>
    </section>
    <section class="crew">
      ${S.players.map((p, i) => {
        const r = byId(ROLES, p.role);
        const itemsHtml = p.items.map(it => `<span class="itm" title="${ITEMS[it.id].n} (${it.u} usage${it.u > 1 ? 's' : ''})">${ITEMS[it.id].i}<sup>${it.u}</sup></span>`).join('');
        return `<div class="pc ${p.alive ? '' : 'dead'} ${i === actorIdx ? 'act' : ''}">
          <div class="pn">${r.i} <b>${esc(p.name)}</b></div>
          <div class="ph2">${hearts(p)}</div>
          ${hideCrew ? '' : `<div class="pit">${itemsHtml}</div>`}
        </div>`;
      }).join('')}
    </section>
    <main class="stage">${stageView()}</main>
  </div>`;
}

function stageView() {
  if (R) return resolverView();
  switch (S.phase) {
    case 'intro': return introView();
    case 'actions': return actionsView();
    case 'pass': return passView();
    case 'recap': return recapView();
    case 'night': return nightView();
    case 'end': return endView();
  }
  return '';
}

function introView() {
  const sc = SC();
  return `<div class="card intro">
    <div class="big">${sc.i}</div>
    <h2>${sc.n}</h2>
    <p>${sc.intro}</p>
    <p class="goal">🎯 Objectif : <b>${sc.goalName}</b> — faites progresser la jauge de ${S.goal} points, en survivant au maximum ${S.max} jours.</p>
    <p class="mode">${S.mode === 'table' ? '🪑 Table commune : un événement par matin, puis une action pour chacun.' : '🧭 Destins séparés : chacun vit une scène privée par jour, puis réunion du camp le soir.'}</p>
    <div class="btns"><button class="btn big" data-a="begin">Commencer le jour 1</button></div>
  </div>`;
}

function actionsView() {
  const pi = S.order[S.turn], p = S.players[pi], r = byId(ROLES, p.role);
  return `<div class="card">
    <div class="lbl">Journée — tour ${S.turn + 1}/${S.order.length}</div>
    <h2>${r.i} ${esc(p.name)}, que fais-tu aujourd'hui ?</h2>
    <p class="muted">${statsRow(p.stats)} · ${r.perk}</p>
    <div class="acts">
      ${ACTIONS.map(a => {
        const afford = chosenAffordable(a);
        const stat = a.s ? STATS[a.s].i + ' ' + (p.stats[a.s] + ((a.pb && a.pb[p.role]) || 0)) : '';
        return `<button class="act" data-a="pickAction" data-v="${a.id}" ${afford ? '' : 'disabled'}>
          <span class="ai">${a.i}</span><b>${a.n}</b><small>${a.desc}</small>
          <em>${a.s ? stat + ' · difficulté ' + a.d + '+' : 'sans jet'}${a.c ? ' · coût ' + Object.keys(a.c).map(k => a.c[k] + RES[k].i).join('') : ''}</em>
        </button>`;
      }).join('')}
    </div>
  </div>`;
}

function passView() {
  const p = S.players[S.order[S.turn]], r = byId(ROLES, p.role);
  return `<div class="card pass">
    <div class="big">📱</div>
    <h2>Passe l'appareil à<br><span class="who">${r.i} ${esc(p.name)}</span></h2>
    <p class="muted">Les autres, détournez les yeux : cette scène est personnelle.</p>
    <div class="btns"><button class="btn big" data-a="ready">Je suis ${esc(p.name)}</button></div>
  </div>`;
}

function recapView() {
  return `<div class="card">
    <div class="lbl">Rapport du camp — soir du jour ${S.day}</div>
    <h2>Ce que chacun raconte autour du feu</h2>
    <ul class="recap">${S.dayLog.map(e => `<li class="${e.ok ? 'ok' : 'ko'}"><span>${e.i}</span><div><b>${esc(e.who)}</b> — ${esc(e.text)}</div></li>`).join('') || '<li>Rien à signaler.</li>'}</ul>
    <div class="btns"><button class="btn big" data-a="recapNext">Réunion du camp →</button></div>
  </div>`;
}

function nightView() {
  return `<div class="card night">
    <div class="lbl">Nuit ${S.day}</div>
    <h2>🌙 La nuit tombe sur le camp</h2>
    <ul class="nlines">${S.nightLines.map(l => `<li class="${l.good === true ? 'good' : l.good === false ? 'bad' : ''}"><span>${l.i}</span>${esc(l.t)}</li>`).join('')}</ul>
    <div class="btns"><button class="btn big" data-a="nextDay">${S.day >= S.max ? 'Voir le dénouement' : 'Jour suivant →'}</button></div>
  </div>`;
}

function resolverView() {
  const c = R.card, ch = R.choice;
  let body = '';
  if (R.stage === 'choose') {
    body = `<div class="choices">${c.choices.map((x, i) => {
      const aff = chosenAffordable(x);
      return `<button class="choice" data-a="choice" data-v="${i}" ${aff ? '' : 'disabled'}>
        <b>${x.l}</b>
        <em>${x.s ? STATS[x.s].i + ' ' + STATS[x.s].n + ' · difficulté ' + x.d + '+' : 'sans jet'}${aff ? '' : ' · ressources insuffisantes'}</em></button>`;
    }).join('')}</div>`;
  } else if (R.stage === 'prep' || R.stage === 'rolling') {
    body = prepView();
  } else if (R.stage === 'result') {
    body = resultView();
  }
  return `<div class="card event ${c.destiny ? 'destiny' : ''}">
    <div class="lbl">${R.label || ''}</div>
    <div class="evh"><span class="evi">${c.i}</span><h2>${c.n}</h2></div>
    <p class="evt">${c.text}</p>
    ${ch && R.stage !== 'choose' ? `<div class="picked">▸ ${ch.l || ch.n}</div>` : ''}
    ${body}
  </div>`;
}

function prepView() {
  const ch = R.choice, rolling = R.stage === 'rolling';
  const a = S.players[R.actor];
  const mod = modifier();
  const fixed = R.fixed != null;
  const stat = STATS[ch.s];
  let h = '';
  if (!fixed) {
    h += `<div class="lbl2">Qui s'en charge ?</div><div class="chips">${S.players.map((p, i) => p.alive ? `<button class="chip ${R.actor === i ? 'on' : ''}" data-a="actor" data-v="${i}">${byId(ROLES, p.role).i} ${esc(p.name)} <small>${stat.i}${p.stats[ch.s]}</small></button>` : '').join('')}</div>`;
  } else h += `<div class="lbl2">${byId(ROLES, a.role).i} ${esc(a.name)} tente sa chance</div>`;
  if (ch.t === 'heal') {
    h += `<div class="lbl2">Qui soigner ?</div><div class="chips">${S.players.map((p, i) => p.alive ? `<button class="chip ${R.target === i ? 'on' : ''}" data-a="target" data-v="${i}">${esc(p.name)} <small>${p.hp}/${p.max}❤️</small></button>` : '').join('')}</div>`;
  }
  const items = availableItems();
  if (items.length) {
    h += `<div class="lbl2">Utiliser un objet (+bonus à ${stat.n}, max 2) :</div><div class="chips">${items.map(x => `<button class="chip item ${R.used.includes(x.key) ? 'on' : ''}" data-a="item" data-v="${x.key}">${x.def.i} ${x.def.n} <small>+${x.def.b} · ${x.it.u} usage${x.it.u > 1 ? 's' : ''}${S.mode === 'table' ? ' · ' + esc(S.players[x.pi].name) : ''}</small></button>`).join('')}</div>`;
  }
  const dice = R.dice || [0, 0];
  h += `<div class="rollbox">
    <div class="dice ${rolling ? 'shake' : ''}">${rolling ? `<span>${FACES[dice[0] - 1]}</span><span>${FACES[dice[1] - 1]}</span>` : '<span>🎲</span><span>🎲</span>'}</div>
    <div class="formula">2d6 + ${stat.i} ${a.stats[ch.s]}${mod - a.stats[ch.s] > 0 ? ' + bonus ' + (mod - a.stats[ch.s]) : ''} → il faut <b>${ch.d}</b> ou plus</div>
    <div class="odds">Chances de réussite : <b>${odds(mod, ch.d)}%</b></div>
    <div class="btns"><button class="btn big" data-a="roll" ${rolling ? 'disabled' : ''}>🎲 Lancer les dés</button></div>
  </div>`;
  return h;
}

function resultView() {
  const r = R.result, ch = R.choice;
  const title = !ch.s ? '' : r.crit ? '🌟 RÉUSSITE CRITIQUE !' : r.fumble ? '💥 FIASCO !' : r.ok ? '✅ Réussite' : '❌ Échec';
  const dice = ch.s ? `<div class="dice"><span>${FACES[R.dice[0] - 1]}</span><span>${FACES[R.dice[1] - 1]}</span></div><div class="formula">Total ${r.total} contre ${ch.d}</div>` : '';
  return `<div class="result ${!ch.s || r.ok ? 'ok' : 'ko'}">
    ${dice}
    ${title ? `<div class="rt">${title}</div>` : ''}
    <p class="rtext">${r.text}</p>
    <div class="fxs">${r.lines.map(l => `<span class="fx ${l.good ? 'good' : 'bad'}">${esc(l.t)}</span>`).join('') || '<span class="fx">Aucun effet</span>'}</div>
    <div class="btns"><button class="btn big" data-a="continue">Continuer</button></div>
  </div>`;
}

function endView() {
  const e = S.end, sc = SC();
  const t = { win: ['🏆', 'VICTOIRE', 'win'], survive: ['🌅', 'SURVIVANTS', 'surv'], lose: ['💀', 'DÉFAITE', 'lose'] }[e.type];
  return `<div class="card endc ${t[2]}">
    <div class="big">${t[0]}</div>
    <h2>${t[1]}</h2>
    <p class="evt">${e.text}</p>
    <div class="sum">
      <div><b>${Math.min(S.day, S.max)}</b><small>jours</small></div>
      <div><b>${alive().length}/${S.players.length}</b><small>survivants</small></div>
      <div><b>${S.prog}/${S.goal}</b><small>objectif</small></div>
      <div><b>${S.hope}</b><small>espoir</small></div>
    </div>
    <ul class="fates">${S.players.map(p => `<li class="${p.alive ? '' : 'dead'}">${byId(ROLES, p.role).i} <b>${esc(p.name)}</b> — ${p.alive ? 'a survécu (' + p.hp + '❤️)' : 'est tombé'}${p.dest.done ? ' · 🌟 destin accompli' : ''}</li>`).join('')}</ul>
    <div class="btns"><button class="btn big" data-a="again">↻ Rejouer</button><button class="btn ghost" data-a="log">📜 Journal</button><button class="btn ghost" data-a="goHome">Menu</button></div>
  </div>`;
}

/* ---------- Modales ---------- */
function showModal(html) {
  const m = $('#modal'); m.innerHTML = `<div class="mbox"><button class="mx" data-a="closeModal">✕</button>${html}</div>`; m.classList.remove('hidden');
}
function rulesHtml() {
  return `<h2>📖 Comment jouer</h2>
  <p><b>But :</b> faire avancer la jauge 🎯 de l'objectif avant la fin des jours, en gardant le groupe en vie et l'Espoir 🕊️ au-dessus de 0.</p>
  <h4>Ressources</h4>
  <p>🥫 Nourriture · 💧 Eau · 💊 Médicaments · 🔧 Matériel · 🛡️ Défense du camp (0 à 5). Chaque survivant a 6 ❤️.</p>
  <h4>Les jets de dés</h4>
  <p>Lance <b>2d6 + ta caractéristique</b> (💪 Force, 🎯 Adresse, 📚 Savoir, ❤️‍🔥 Cœur) + bonus d'objets. Tu réussis si le total atteint la <b>difficulté</b>. <b>Double 6 = réussite critique</b> (bonus) · <b>Double 1 = fiasco</b> (−1 ❤️ en plus).</p>
  <h4>Mode Table commune</h4>
  <p>Chaque jour : <b>Aube</b> → on tire une carte Événement, le groupe débat et choisit une option, puis choisit qui s'en charge. <b>Journée</b> → chaque survivant, à son tour, choisit une action (fouiller, chasser, puiser, renforcer, soigner, explorer…). <b>Nuit</b> → on mange, on boit, on subit la menace.</p>
  <h4>Mode Destins séparés</h4>
  <p>Chaque joueur vit une <b>scène personnelle</b> (l'appareil circule !) et poursuit un <b>destin en 3 étapes</b> propre à son rôle, qui rapporte un gros bonus au groupe une fois accompli. Le soir : rapport du camp et événement commun, puis la nuit.</p>
  <h4>La nuit</h4>
  <p>Chaque survivant consomme 1 🥫 et 1 💧 (manque = −1 ❤️ et −1 🕊️). Une menace attaque : si son score dépasse la défense du camp, des blessés tombent. Sans incident, tout le monde récupère 1 ❤️.</p>
  <h4>Fin de partie</h4>
  <p>🏆 Victoire : objectif atteint · 🌅 Survivants : fin des jours atteinte · 💀 Défaite : tous morts ou Espoir à 0.</p>`;
}
function logHtml() {
  const items = S.log.slice().reverse().map(l => `<li><b>J${l.d}</b> ${esc(l.t)}</li>`).join('');
  return `<h2>📜 Journal de bord</h2><ul class="logl">${items || '<li>Rien pour l\'instant.</li>'}</ul>`;
}

/* ---------- Événements ---------- */
function setRole(i, role) {
  const other = setup.players.findIndex((p, j) => j !== i && p.role === role);
  if (other >= 0) setup.players[other].role = setup.players[i].role; // échange
  setup.players[i].role = role;
  render();
}
function act(a, v) {
  switch (a) {
    case 'goSetup': view = 'setup'; return render();
    case 'goHome': view = 'home'; S = null; R = null; return render();
    case 'rules': return showModal(rulesHtml());
    case 'closeModal': return $('#modal').classList.add('hidden');
    case 'log': return showModal(logHtml());
    case 'quit': return showModal('<h2>Quitter la partie ?</h2><p>La partie en cours sera perdue.</p><div class="btns"><button class="btn" data-a="quitYes">Quitter</button><button class="btn ghost" data-a="closeModal">Continuer à jouer</button></div>');
    case 'quitYes': $('#modal').classList.add('hidden'); view = 'home'; S = null; R = null; return render();
    case 'mode': setup.mode = v; return render();
    case 'scen': setup.scen = v; return render();
    case 'len': setup.len = +v; return render();
    case 'addP': {
      if (setup.players.length >= 6) return;
      const free = ROLES.find(r => !setup.players.some(p => p.role === r.id));
      setup.players.push({ name: '', role: free.id }); return render();
    }
    case 'delP': setup.players.splice(+v, 1); return render();
    case 'start': return startGame();
    case 'again': return startGame();
    case 'begin': return startDay();
    case 'pickAction': return pickAction(v);
    case 'ready': return readyScene();
    case 'recapNext': return recapNext();
    case 'choice': return chooseChoice(+v);
    case 'actor': R.actor = +v; R.used = []; return render();
    case 'target': R.target = +v; return render();
    case 'item': return toggleItem(v);
    case 'roll': return rollNow();
    case 'continue': return finishResolver();
    case 'nextDay': return nextDay();
  }
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-a]');
  if (!t || t.disabled) return;
  if (t.id === 'modal') return;
  act(t.dataset.a, t.dataset.v);
});
document.addEventListener('input', e => {
  if (e.target.dataset && e.target.dataset.name !== undefined) setup.players[+e.target.dataset.name].name = e.target.value;
});
document.addEventListener('change', e => {
  if (e.target.dataset && e.target.dataset.role !== undefined) setRole(+e.target.dataset.role, e.target.value);
});
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') $('#modal').classList.add('hidden'); });

render();
