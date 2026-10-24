/* Eighteen puzzle games. Each mount(stage, ctx) returns a cleanup fn.
   ctx: sfx, hud, end({win,quality,score,label}), burst(el,color,n), pop(el,text,color), shake(el),
        diff (0 easy,1 normal,2 hard), combo(n), flash(color), power({label,cost,use(btn)}) */
(function () {
  let RND = Math.random;
  const T = (k, v) => I18N.t(k, v), H = (k, v) => `${T('hud.' + k)} ${v}`;
  const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstChild; };
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(RND() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const ri = (a, b) => a + Math.floor(RND() * (b - a + 1));
  const pick = (arr, d) => arr[d];

  /* ---------- 1. Memory Match ---------- */
  function memory(stage, ctx) {
    const E = ['●', '▲', '■', '◆', '★', '✚', '♥', '☾', '⬢', '✦'], COL = ['#d6ff3d', '#ff7aa8', '#5aa9ff', '#ffb454', '#8b7bff', '#3dd6a5', '#ff6b5e', '#f1efe9', '#4fd1e0', '#f2d45c'];
    const P = pick([6, 8, 10], ctx.diff), cols = P === 10 ? 5 : 4, set = E.slice(0, P);
    const deck = shuffle([...set, ...set]);
    let open = [], moves = 0, pairs = 0, lock = true, t0 = Date.now(), timer, combo = 0, bonus = 0, ended = false;
    const grid = $(`<div class="board-g mem" style="grid-template-columns:repeat(${cols},1fr)"></div>`);
    deck.forEach((e, i) => {
      const c = $(`<div class="card3d"><button aria-label="Card ${i + 1}"><span class="f"></span><span class="b" style="color:${COL[E.indexOf(e)]}">${e}</span></button></div>`);
      c.firstChild.onclick = () => {
        if (lock || c.classList.contains('flip') || c.classList.contains('done')) return;
        c.classList.add('flip'); ctx.sfx('tap'); open.push({ c, e });
        if (open.length === 2) {
          moves++; lock = true; const [a, b] = open, col = COL[E.indexOf(a.e)];
          if (a.e === b.e) {
            setTimeout(() => {
              a.c.classList.add('done'); b.c.classList.add('done'); a.c.classList.remove('flip'); b.c.classList.remove('flip'); open = []; lock = false;
              pairs++; combo++; bonus += combo * 20; ctx.sfx('good', combo); ctx.combo(combo); ctx.burst(a.c, col, 14); ctx.burst(b.c, col, 14); ctx.pop(b.c, combo > 1 ? T('combo', { n: combo }) : T('pop.match'), col);
              if (pairs === P && !ended) { ended = true; const s = Math.round((Date.now() - t0) / 1000); ctx.end({ win: true, quality: clamp(1 - (moves - P) / (P * 1.7)) * .8 + clamp(1 - s / (P * 11)) * .2, score: Math.max(0, 1000 - moves * 30 - s * 3) + bonus, label: T('lbl.movesTime', { m: moves, s }) }); }
              hud();
            }, 350);
          } else { combo = 0; ctx.combo(0); setTimeout(() => { a.c.classList.remove('flip'); b.c.classList.remove('flip'); open = []; lock = false; ctx.sfx('bad'); }, 750); }
          hud();
        }
      };
      grid.append(c);
    });
    const hud = () => ctx.hud([H('moves', moves), H('pairs', `${pairs}/${P}`), `${Math.round((Date.now() - t0) / 1000)}s`]);
    stage.append(grid); const all = [...grid.children]; all.forEach((c) => c.classList.add('flip')); ctx.hud([T('hud.memorize')]);
    const pk = setTimeout(() => { all.forEach((c) => c.classList.remove('flip')); lock = false; t0 = Date.now(); timer = setInterval(hud, 1000); hud(); }, pick([2000, 1600, 1300], ctx.diff));
    ctx.power({ label: T('pw.peek'), cost: 10, use: () => { if (lock) return; lock = true; const un = all.filter((c) => !c.classList.contains('done') && !c.classList.contains('flip')); un.forEach((c) => c.classList.add('flip')); setTimeout(() => { un.forEach((c) => c.classList.remove('flip')); lock = false; }, 900); } });
    return () => { clearTimeout(pk); clearInterval(timer); };
  }

  /* ---------- 2. Slide Master ---------- */
  function slide(stage, ctx) {
    const N = pick([3, 3, 4], ctx.diff), NN = N * N; let t = Array.from({ length: NN }, (_, i) => (i + 1) % NN), moves = 0, done = false, lastMoved = -1;
    const nb = (z) => { const r = Math.floor(z / N), c = z % N, o = []; if (r > 0) o.push(z - N); if (r < N - 1) o.push(z + N); if (c > 0) o.push(z - 1); if (c < N - 1) o.push(z + 1); return o; };
    let prev = -1;
    for (let i = 0; i < pick([24, 70, 160], ctx.diff); i++) { const z = t.indexOf(0), o = nb(z).filter((x) => x !== prev), m = o[ri(0, o.length - 1)]; [t[z], t[m]] = [t[m], t[z]]; prev = z; }
    const solved = () => t.every((x, k) => x === (k + 1) % NN);
    if (solved()) { [t[NN - 2], t[NN - 1]] = [t[NN - 1], t[NN - 2]]; }
    const board = $('<div class="slide-board"></div>'), tiles = {}, sz = 100 / N;
    const hud = () => ctx.hud([H('moves', moves)]);
    const place = () => t.forEach((v, i) => { if (v) { tiles[v].style.setProperty('--x', i % N); tiles[v].style.setProperty('--y', Math.floor(i / N)); } });
    const tryMove = (i) => {
      if (done) return; const z = t.indexOf(0);
      if (!nb(z).includes(i)) { ctx.sfx('bad'); return; }
      lastMoved = t[i]; [t[z], t[i]] = [t[i], t[z]]; moves++; ctx.sfx('tap'); place(); hud();
      if (solved()) { done = true; Object.values(tiles).forEach((e) => e.classList.add('ok')); ctx.sfx('win'); ctx.burst(board, '#3dd6a5', 40);
        const par = pick([14, 24, 70], ctx.diff); setTimeout(() => ctx.end({ win: true, quality: clamp(1 - (moves - par) / (par * 2.2)), score: Math.max(0, 1000 - moves * 8) + N * 100, label: T('lbl.moves', { n: moves }) }), 800); }
    };
    for (let v = 1; v < NN; v++) { const e = $(`<button class="tile2" aria-label="Tile ${v}" style="--h:${150 + v * (210 / NN)};width:${sz}%;height:${sz}%"><i style="font-size:${N === 4 ? '1.5rem' : '2rem'}">${v}</i></button>`); e.onclick = () => tryMove(t.indexOf(v)); tiles[v] = e; board.append(e); }
    const key = (e) => { const z = t.indexOf(0), i = { ArrowLeft: z % N < N - 1 ? z + 1 : -1, ArrowRight: z % N > 0 ? z - 1 : -1, ArrowUp: z + N, ArrowDown: z - N }[e.key]; if (i === undefined) return; e.preventDefault(); if (i >= 0 && i < NN) tryMove(i); };
    document.addEventListener('keydown', key); place(); hud();
    ctx.power({ label: T('pw.hint'), cost: 10, use: () => { const z = t.indexOf(0), md = (a, b) => Math.abs(Math.floor(a / N) - Math.floor(b / N)) + Math.abs((a % N) - (b % N));
      let best = null, bd = 99; nb(z).forEach((i) => { const v = t[i]; if (v === lastMoved) return; const d = md(z, v - 1) - md(i, v - 1); if (d < bd) { bd = d; best = v; } });
      if (best === null) best = t[nb(z)[0]]; tiles[best].classList.add('hint'); setTimeout(() => tiles[best].classList.remove('hint'), 1400); } });
    stage.append(board, $(`<p class="hint" style="margin-top:12px">${T('hint.slide')}</p>`));
    return () => document.removeEventListener('keydown', key);
  }

  /* ---------- 3. Word Scramble ---------- */
  const WORDS = ['planet', 'puzzle', 'rocket', 'jungle', 'silver', 'garden', 'bridge', 'castle', 'dragon', 'forest', 'island', 'marble', 'pirate', 'rabbit', 'sunset', 'cherry', 'dancer', 'engine', 'flower', 'guitar', 'hunter', 'insect', 'knight', 'legend', 'magnet', 'thunder', 'whisper', 'diamond', 'journey', 'mystery', 'pyramid', 'compass', 'harvest', 'lantern', 'volcano', 'penguin', 'blanket', 'cabinet', 'captain', 'balance', 'crystal', 'phantom', 'horizon', 'blizzard'];
  function words(stage, ctx) {
    const lenMax = pick([6, 7, 8], ctx.diff), lenMin = pick([5, 6, 7], ctx.diff);
    const pool0 = WORDS.filter((w) => w.length >= lenMin && w.length <= lenMax), list = shuffle(pool0.length >= 5 ? pool0 : WORDS).slice(0, 5);
    let idx = 0, solved = 0, left = pick([90, 75, 55], ctx.diff), skips = 2, cur = '', pool = [], over = false, combo = 0;
    const lw = $('<div class="letters"></div>'), lp = $('<div class="letters"></div>');
    const ctl = $(`<div class="center"><div><button class="btn ghost sm" data-a="clear">${T('w.clear')}</button> <button class="btn ghost sm" data-a="skip">${T('w.skip')}</button></div><p class="hint">${T('hint.words')}</p></div>`);
    const hud = () => ctx.hud([H('word', `${Math.min(idx + 1, 5)}/5`), H('solved', solved), { t: `${left}s`, low: left <= 10 }, H('skips', skips)]);
    const load = () => { if (idx >= 5) return fin(); const w = list[idx]; let s = w; while (s === w) s = shuffle(w.split('')).join(''); pool = s.split('').map((ch, i) => ({ ch, i, used: false })); cur = ''; draw(); };
    const draw = () => { const w = list[idx]; if (!w) return; lw.innerHTML = ''; lp.innerHTML = '';
      for (let i = 0; i < w.length; i++) lw.append($(`<div class="lett slot">${cur[i] || ''}</div>`));
      pool.forEach((p) => { const b = $(`<button class="lett ${p.used ? 'used' : ''}">${p.ch}</button>`); b.onclick = () => add(p); lp.append(b); }); hud(); };
    const add = (p) => { if (p.used || cur.length >= list[idx].length) return; p.used = true; cur += p.ch; ctx.sfx('tap'); check(); draw(); };
    const check = () => { const w = list[idx]; if (cur.length < w.length) return;
      if (cur === w) { solved++; combo++; ctx.sfx('good', combo); ctx.combo(combo); ctx.burst(lw, '#5aa9ff', 20); ctx.pop(lw, T('pop.word'), '#5aa9ff'); lw.querySelectorAll('.lett').forEach((l) => l.classList.add('good')); idx++; setTimeout(load, 500); }
      else { combo = 0; ctx.combo(0); ctx.sfx('bad'); ctx.shake(lw); pool.forEach((p) => (p.used = false)); cur = ''; } };
    const key = (e) => { if (e.target.tagName === 'INPUT') return; const k = e.key.toLowerCase();
      if (k === 'backspace') { const last = cur.slice(-1); if (last) { const p = pool.find((x) => x.used && x.ch === last); if (p) p.used = false; cur = cur.slice(0, -1); draw(); } }
      else if (/^[a-z]$/.test(k)) { const p = pool.find((x) => !x.used && x.ch === k); if (p) add(p); } };
    ctl.onclick = (e) => { const a = e.target.dataset.a; if (a === 'clear') { pool.forEach((p) => (p.used = false)); cur = ''; draw(); } if (a === 'skip' && skips > 0) { skips--; combo = 0; ctx.combo(0); idx++; load(); } };
    document.addEventListener('keydown', key);
    const timer = setInterval(() => { left--; if (left <= 0) fin(); else hud(); }, 1000);
    function fin() { if (over) return; over = true; clearInterval(timer); ctx.end({ win: solved >= 3, quality: solved / 5 * .85 + clamp(left / 75) * .15, score: solved * 200 + Math.max(0, left) * 4, label: T('lbl.words', { n: solved }) }); }
    const box = $('<div class="center"></div>'); stage.append(box); box.append(lw, lp, ctl); load();
    ctx.power({ label: T('pw.reveal'), cost: 10, use: () => { const w = list[idx]; if (!w) return; if (!w.startsWith(cur)) { pool.forEach((p) => (p.used = false)); cur = ''; } const p = pool.find((x) => !x.used && x.ch === w[cur.length]); if (p) add(p); } });
    ctx.power({ label: T('pw.secs', { n: 10 }), cost: 15, use: () => { left += 10; hud(); } });
    return () => { clearInterval(timer); document.removeEventListener('keydown', key); };
  }

  /* ---------- 4. Math Sprint ---------- */
  function math(stage, ctx) {
    const D = ctx.diff; let left = pick([60, 45, 35], D), score = 0, pts = 0, streak = 0, best = 0, ans = 0, over = false;
    const q = $('<div class="q"></div>'), inp = $('<input class="ans" inputmode="numeric" autocomplete="off" aria-label="Answer">');
    const hud = () => ctx.hud([{ t: `${left}s`, low: left <= 8 }, H('correct', score), streak >= 5 ? { t: `🔥 ${H('streak', streak)} ×${(1 + Math.floor(streak / 5) * .5).toFixed(1)}` } : H('streak', streak)]);
    const next = () => {
      const lvl = Math.min(3, Math.floor(score / 5) + D), ops = lvl === 0 ? ['+', '-'] : lvl === 1 ? ['+', '-', '×'] : ['+', '-', '×', '×'];
      const op = ops[ri(0, ops.length - 1)]; let a, b;
      if (op === '+') { a = ri(5, 20 + lvl * 25); b = ri(5, 20 + lvl * 25); ans = a + b; }
      else if (op === '-') { a = ri(15, 40 + lvl * 40); b = ri(3, a - 1); ans = a - b; }
      else { a = ri(2, 9 + lvl * 3); b = ri(2, 9 + lvl * 2); ans = a * b; }
      q.textContent = `${a} ${op} ${b}`; inp.value = ''; hud();
    };
    inp.oninput = () => { if (+inp.value === ans && inp.value !== '') { score++; streak++; best = Math.max(best, streak); pts += 100 * (1 + Math.floor(streak / 5) * .5); if (streak > 0 && streak % 5 === 0) ctx.flash('#ffb454'); ctx.sfx('good', streak); ctx.combo(streak); ctx.pop(q, streak % 5 === 0 ? '+2s' : '+1', '#ffb454'); if (streak % 5 === 0) { left += 2; ctx.burst(q, '#ffb454', 20); } next(); } };
    inp.onkeydown = (e) => { if (e.key === 'Enter' && inp.value !== '' && +inp.value !== ans) { streak = 0; ctx.combo(0); ctx.sfx('bad'); ctx.shake(q); inp.value = ''; hud(); } };
    const timer = setInterval(() => { left--; if (left <= 0) { if (over) return; over = true; clearInterval(timer); ctx.end({ win: score >= 8, quality: clamp(score / (22 + D * 6)), score: Math.round(pts) + best * 20, label: T('lbl.mathEnd', { n: score, b: best }) }); } else hud(); }, 1000);
    stage.append(q, inp, $(`<p class="hint" style="margin-top:14px">${T('hint.math')}</p>`));
    next(); setTimeout(() => inp.focus(), 100);
    ctx.power({ label: T('pw.secs', { n: 8 }), cost: 15, use: () => { left += 8; hud(); inp.focus(); } });
    return () => clearInterval(timer);
  }

  /* ---------- 5. Pattern Echo ---------- */
  function pattern(stage, ctx) {
    const cols = ['#ff6b5e', '#3dd6a5', '#5aa9ff', '#ffb454'], seq = []; let pos = 0, accept = false, ended = false, to = [];
    const base = pick([660, 600, 520], ctx.diff);
    const wrap = $('<div class="pads"></div>');
    const pads = cols.map((c, i) => { const b = $(`<button class="pad" style="--c:${c}" aria-label="Pad ${i + 1}" disabled></button>`); b.onclick = () => press(i); wrap.append(b); return b; });
    const hud = (m) => ctx.hud([H('round', seq.length), m || '']);
    const flash = (i, ms = 380) => { pads[i].classList.add('lit'); ctx.sfx('note', i); to.push(setTimeout(() => pads[i].classList.remove('lit'), ms)); };
    const playSeq = () => { accept = false; pads.forEach((p) => (p.disabled = true)); pos = 0; hud(T('hud.watch')); const gap = Math.max(280, base - seq.length * 25);
      seq.forEach((s, k) => to.push(setTimeout(() => flash(s), 700 + k * gap)));
      to.push(setTimeout(() => { accept = true; pads.forEach((p) => (p.disabled = false)); hud(T('hud.yourturn')); }, 700 + seq.length * gap)); };
    const play = () => { seq.push(ri(0, 3)); playSeq(); };
    function press(i) {
      if (!accept || ended) return; flash(i, 200); ctx.burst(pads[i], cols[i], 8);
      if (i !== seq[pos]) { ended = true; ctx.sfx('bad'); ctx.shake(wrap); const r = seq.length - 1; return void setTimeout(() => ctx.end({ win: r >= 5, quality: clamp(r / (11 + ctx.diff * 3)), score: r * 150, label: T('lbl.round', { n: r }) }), 600); }
      if (++pos === seq.length) { accept = false; ctx.combo(seq.length); ctx.pop(wrap, `${H('round', seq.length)} ✓`, '#3dd6a5'); to.push(setTimeout(play, 800)); }
    }
    const kd = (e) => { const i = '1234'.indexOf(e.key); if (i >= 0) press(i); }; document.addEventListener('keydown', kd);
    stage.append(wrap, $(`<p class="hint" style="margin-top:12px">${T('hint.pattern')}</p>`)); to.push(setTimeout(play, 600));
    ctx.power({ label: T('pw.replay'), cost: 10, use: () => { if (!accept) return; to.forEach(clearTimeout); to = []; playSeq(); } });
    return () => { to.forEach(clearTimeout); document.removeEventListener('keydown', kd); };
  }

  /* ---------- 6. Lights Out ---------- */
  function lights(stage, ctx) {
    const N = 5; let g = Array(N * N).fill(false), moves = 0, done = false;
    const tog = (i) => { const r = Math.floor(i / N), c = i % N; [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < N && cc >= 0 && cc < N) g[rr * N + cc] = !g[rr * N + cc]; }); };
    const presses = pick([5, 9, 14], ctx.diff), sol = new Set(shuffle([...Array(N * N).keys()]).slice(0, presses)); sol.forEach(tog);
    if (!g.some(Boolean)) { tog(12); sol.add(12); }
    const grid = $('<div class="board-g lights"></div>'); let hintI = -1;
    const hud = () => ctx.hud([H('moves', moves), H('lights', g.filter(Boolean).length)]);
    const draw = () => { grid.innerHTML = ''; g.forEach((on, i) => { const b = $(`<button class="lt ${on ? 'on' : ''} ${i === hintI ? 'hint' : ''}" aria-label="Light ${i + 1} ${on ? 'on' : 'off'}"></button>`);
      b.onclick = () => { if (done) return; tog(i); sol.has(i) ? sol.delete(i) : sol.add(i); hintI = -1; moves++; ctx.sfx('tap'); draw(); hud();
        if (!g.some(Boolean)) { done = true; ctx.sfx('win'); ctx.burst(grid, '#f2d45c', 50); setTimeout(() => ctx.end({ win: true, quality: clamp(1 - (moves - presses) / (presses * 2 + 8)), score: Math.max(0, 1000 - moves * 20), label: T('lbl.moves', { n: moves }) }), 700); } };
      grid.append(b); }); };
    draw(); hud(); stage.append(grid, $(`<p class="hint" style="margin-top:12px">${T('hint.lights')}</p>`));
    ctx.power({ label: T('pw.hint'), cost: 10, use: () => { const a = [...sol]; if (!a.length) return; hintI = a[ri(0, a.length - 1)]; draw(); } });
    return () => {};
  }

  /* ---------- 7. Merge ---------- */
  function merge(stage, ctx) {
    const GOAL = pick([128, 256, 512], ctx.diff);
    let g = Array(16).fill(0), score = 0, moves = 0, over = false, prev = Array(16).fill(0), combo = 0, snap = null;
    const addT = () => { const e = g.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0); if (e.length) g[e[ri(0, e.length - 1)]] = RND() < .9 ? 2 : 4; };
    addT(); addT();
    const ix = (d, i, j) => [i * 4 + j, j * 4 + i, i * 4 + (3 - j), (3 - j) * 4 + i][d];
    const slideLine = (l) => { const a = l.filter(Boolean), o = []; let gain = 0; for (let k = 0; k < a.length; k++) { if (a[k] === a[k + 1]) { o.push(a[k] * 2); gain += a[k] * 2; k++; } else o.push(a[k]); } while (o.length < 4) o.push(0); return [o, gain]; };
    const canMove = () => g.some((v, i) => !v || (i % 4 < 3 && v === g[i + 1]) || (i < 12 && v === g[i + 4]));
    const grid = $('<div class="board-g m2048" style="touch-action:none"></div>');
    const draw = () => { grid.innerHTML = ''; g.forEach((v, i) => { const l = v ? Math.log2(v) : 0, hue = (l * 36 + 70) % 360; grid.append($(`<div class="mt2 ${v && v !== prev[i] ? 'pp' : ''}" style="${v ? `background:hsl(${hue} 55% ${Math.max(26, 52 - l * 2)}%);color:${l >= 5 ? '#14170a' : '#fff'}` : ''}">${v || ''}</div>`)); }); prev = g.slice(); ctx.hud([H('score', score), H('best', Math.max(...g)), H('goal', GOAL)]); };
    const move = (d) => {
      if (over) return; const before = { g: g.slice(), score, moves }; let ch = false, tg = 0;
      for (let i = 0; i < 4; i++) { const idx = [0, 1, 2, 3].map((j) => ix(d, i, j)); const [o, gain] = slideLine(idx.map((k) => g[k])); idx.forEach((k, j) => { if (g[k] !== o[j]) ch = true; g[k] = o[j]; }); score += gain; tg += gain; }
      if (!ch) return; snap = before; if (tg) { combo++; ctx.combo(combo); ctx.pop(grid, '+' + tg, '#d6ff3d'); ctx.sfx('good', combo); } else { combo = 0; ctx.combo(0); ctx.sfx('tap'); }
      moves++; addT(); draw();
      const mx = Math.max(...g);
      if (mx >= GOAL) { over = true; ctx.sfx('win'); ctx.burst(grid, '#d6ff3d', 60); setTimeout(() => ctx.end({ win: true, quality: clamp(1 - (moves - GOAL / 3) / 220), score, label: T('lbl.mergeWin', { g: GOAL, n: moves }) }), 700); }
      else if (!canMove()) { over = true; setTimeout(() => ctx.end({ win: false, quality: clamp(mx / GOAL) * .8, score, label: T('lbl.besttile', { n: mx }) }), 500); }
    };
    const key = (e) => { const d = { ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, ArrowDown: 3 }[e.key]; if (d !== undefined) { e.preventDefault(); move(d); } };
    let sx, sy;
    grid.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    grid.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return; move(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 0 : 2) : (dy < 0 ? 1 : 3)); });
    document.addEventListener('keydown', key); draw();
    ctx.power({ label: T('pw.undo'), cost: 10, use: () => { if (!snap || over) return; g = snap.g; score = snap.score; moves = snap.moves; snap = null; combo = 0; ctx.combo(0); prev = g.slice(); draw(); } });
    stage.append(grid, $(`<p class="hint">${T('hint.merge', { n: GOAL })}</p>`));
    return () => document.removeEventListener('keydown', key);
  }

  /* ---------- 8. Mini Sudoku ---------- */
  function sudoku(stage, ctx) {
    const base = (r, c) => (r * 2 + Math.floor(r / 2) + c) % 4;
    const dm = shuffle([1, 2, 3, 4]), rows = shuffle([0, 1]).flatMap((b) => shuffle([0, 1]).map((x) => b * 2 + x)), cols = shuffle([0, 1]).flatMap((b) => shuffle([0, 1]).map((x) => b * 2 + x));
    const sol = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) sol.push(dm[base(rows[r], cols[c])]);
    const fixed = Array(16).fill(false); shuffle([...Array(16).keys()]).slice(0, pick([9, 7, 5], ctx.diff)).forEach((i) => (fixed[i] = true));
    const v = sol.map((x, i) => (fixed[i] ? x : 0)); let sel = -1, moves = 0, t0 = Date.now(), done = false;
    const conflict = (i) => { const x = v[i]; if (!x) return false; const r = Math.floor(i / 4), c = i % 4; for (let k = 0; k < 16; k++) { if (k === i || v[k] !== x) continue; const kr = Math.floor(k / 4), kc = k % 4; if (kr === r || kc === c || (Math.floor(kr / 2) === Math.floor(r / 2) && Math.floor(kc / 2) === Math.floor(c / 2))) return true; } return false; };
    const grid = $('<div class="board-g sdk"></div>'), padEl = $('<div class="sdk-pad"></div>');
    const draw = () => { grid.innerHTML = ''; v.forEach((x, i) => { const r = Math.floor(i / 4), c = i % 4;
      const b = $(`<button class="sc ${fixed[i] ? 'fx' : ''} ${i === sel ? 'sel' : ''} ${conflict(i) ? 'bad' : ''}" style="${c === 1 ? 'margin-right:6px;' : ''}${r === 1 ? 'margin-bottom:6px;' : ''}" aria-label="Row ${r + 1} column ${c + 1}">${x || ''}</button>`);
      b.onclick = () => { if (!fixed[i] && !done) { sel = i; draw(); } }; grid.append(b); }); ctx.hud([H('moves', moves), `${Math.round((Date.now() - t0) / 1000)}s`]); };
    const setV = (i, n) => { v[i] = n; moves++; ctx.sfx(n && conflict(i) ? 'bad' : 'tap'); draw(); check(); };
    [1, 2, 3, 4, 0].forEach((n) => { const b = $(`<button class="btn">${n || T('sdk.erase')}</button>`); b.onclick = () => { if (sel < 0 || done) return; setV(sel, n); }; padEl.append(b); });
    const key = (e) => { if (done) return; if (/^[0-4]$/.test(e.key) && sel >= 0) setV(sel, +e.key); };
    document.addEventListener('keydown', key);
    const check = () => { if (v.every(Boolean) && v.every((_, i) => !conflict(i))) { done = true; const s = Math.round((Date.now() - t0) / 1000); ctx.sfx('win'); ctx.burst(grid, '#ff9f6b', 50); setTimeout(() => ctx.end({ win: true, quality: clamp(1 - (moves - 9) / 25) * .6 + clamp(1 - s / 150) * .4, score: Math.max(0, 1000 - s * 4 - moves * 5), label: T('lbl.sudokuEnd', { s, m: moves }) }), 600); } };
    const tm = setInterval(() => !done && draw(), 1000);
    ctx.power({ label: T('pw.hint'), cost: 15, use: () => { const e = v.map((x, i) => (!fixed[i] && v[i] !== sol[i] ? i : -1)).filter((i) => i >= 0); if (!e.length) return; const i = e[ri(0, e.length - 1)]; fixed[i] = true; setV(i, sol[i]); } });
    draw(); stage.append(grid, padEl, $(`<p class="hint">${T('hint.sudoku')}</p>`));
    return () => { clearInterval(tm); document.removeEventListener('keydown', key); };
  }

  /* ---------- 9. Color Clash ---------- */
  function stroop(stage, ctx) {
    const ALL = [['red', '#ff6b5e'], ['green', '#3dd6a5'], ['blue', '#5aa9ff'], ['yellow', '#ffd25e'], ['pink', '#ff7aa8']].map(([k, c]) => [T('col.' + k), c]), C = ALL.slice(0, ctx.diff === 2 ? 5 : 4), K = C.length;
    let left = pick([40, 30, 24], ctx.diff), ok = 0, lives = 3, cur, ended = false, streak = 0, rev = false;
    const word = $('<div class="q"></div>'), btns = $('<div class="sdk-pad"></div>');
    const hud = () => ctx.hud([{ t: `${left}s`, low: left <= 6 }, H('correct', ok), H('lives', lives)]);
    const rule = $(`<p class="hint" style="margin:0 0 6px;font-weight:600"></p>`);
    const next = () => { const w = ri(0, K - 1); let c = ri(0, K - 1); if (RND() < .8) while (c === w) c = ri(0, K - 1); rev = ok >= 4 && RND() < .3; cur = rev ? w : c; word.textContent = C[w][0]; word.style.color = C[c][1]; rule.textContent = rev ? T('stroop.word') : T('hint.stroop'); rule.style.color = rev ? '#ff7aa8' : ''; hud(); };
    C.forEach(([n, col], i) => { const b = $(`<button class="btn" style="border-color:${col}">${n}</button>`);
      b.onclick = () => { if (ended) return; if (i === cur) { ok++; streak++; ctx.sfx('good', streak); ctx.combo(streak); ctx.pop(word, rev ? '+2' : '+1', C[cur][1]); if (rev) ok++; if (streak % 6 === 0) { left += 2; ctx.pop(word, '+2s', '#d6ff3d'); } } else { lives--; streak = 0; ctx.combo(0); ctx.sfx('bad'); ctx.shake(word); if (lives <= 0) return fin(); } next(); }; btns.append(b); });
    const timer = setInterval(() => { left--; if (left <= 0) fin(); else hud(); }, 1000);
    function fin() { if (ended) return; ended = true; clearInterval(timer); ctx.end({ win: ok >= 10, quality: clamp(ok / (24 + ctx.diff * 4)), score: ok * 100 + lives * 50, label: T('lbl.correct', { n: ok }) }); }
    stage.append(rule, word, btns); next();
    ctx.power({ label: T('pw.secs', { n: 5 }), cost: 10, use: () => { left += 5; hud(); } });
    return () => clearInterval(timer);
  }

  /* ---------- 10. Odd Tile ---------- */
  function odd(stage, ctx) {
    let round = 0, left = pick([50, 45, 40], ctx.diff), lives = 3, ended = false, streak = 0, oddEl = null;
    const grid = $('<div class="board-g" style="width:min(100%,360px)"></div>');
    const hud = () => ctx.hud([{ t: `${left}s`, low: left <= 8 }, H('round', round), H('lives', lives)]);
    const next = () => { round++; const n = Math.min(7, 3 + Math.floor(round / 3)), h = ri(0, 360), diff = Math.max(3.5, pick([26, 20, 15], ctx.diff) - round * 1.2), oi = ri(0, n * n - 1);
      grid.style.gridTemplateColumns = `repeat(${n},1fr)`; grid.innerHTML = '';
      for (let i = 0; i < n * n; i++) { const b = $(`<button class="ot" aria-label="Tile ${i + 1}" style="background:hsl(${h} 60% ${i === oi ? 55 + diff : 55}%)"></button>`); if (i === oi) oddEl = b;
        b.onclick = () => { if (ended) return; if (i === oi) { streak++; ctx.sfx('good', streak); ctx.combo(streak); ctx.burst(b, '#4fd1e0', 10); if (streak % 5 === 0) left += 3; next(); } else { lives--; streak = 0; ctx.combo(0); ctx.sfx('bad'); if (lives <= 0) fin(); else { ctx.shake(grid); hud(); } } }; grid.append(b); } hud(); };
    const timer = setInterval(() => { left--; if (left <= 0) fin(); else hud(); }, 1000);
    function fin() { if (ended) return; ended = true; clearInterval(timer); const r = round - 1; ctx.end({ win: r >= 8, quality: clamp(r / (20 + ctx.diff * 4)), score: r * 120, label: T('lbl.found', { n: r }) }); }
    stage.append(grid, $(`<p class="hint" style="margin-top:12px">${T('hint.odd')}</p>`)); next();
    ctx.power({ label: T('pw.spot'), cost: 10, use: () => { if (oddEl) { oddEl.classList.add('hint'); setTimeout(() => oddEl && oddEl.classList.remove('hint'), 1200); } } });
    return () => clearInterval(timer);
  }

  /* ---------- 11. Number Recall ---------- */
  function recall(stage, ctx) {
    let len = pick([3, 4, 5], ctx.diff), ended = false, to = [], num = '', phase = 'show';
    const box = $('<div class="q" style="letter-spacing:.2em"></div>'), form = $(`<form class="center"><input class="ans" inputmode="numeric" autocomplete="off" aria-label="Number"><button class="btn primary" type="submit">${T('check')}</button></form>`), inp = form.querySelector('input');
    const hud = (m) => ctx.hud([H('digits', len), m || '']);
    const mask = () => '• '.repeat(len).trim();
    const show = () => { phase = 'show'; num = Array.from({ length: len }, () => ri(0, 9)).join(''); box.textContent = num; form.style.display = 'none'; hud(T('hud.mem2')); inp.value = '';
      to.push(setTimeout(() => { phase = 'type'; box.textContent = mask(); form.style.display = ''; hud(T('hud.typeit')); inp.focus(); }, 800 + len * pick([550, 450, 350], ctx.diff))); };
    form.onsubmit = (e) => { e.preventDefault(); if (ended || phase !== 'type') return;
      if (inp.value.trim() === num) { ctx.sfx('good', len - 3); ctx.combo(len - 2); ctx.burst(box, '#ff7aa8', 16); len++; show(); }
      else { ended = true; ctx.sfx('bad'); ctx.shake(box); box.textContent = num; const r = len - 1; to.push(setTimeout(() => ctx.end({ win: r >= pick([5, 6, 7], ctx.diff), quality: clamp((r - 2) / 8), score: r * 150, label: T('lbl.digits', { n: r }) }), 900)); } };
    const wrap = $('<div class="center"></div>'); stage.append(wrap); wrap.append(box, form); show();
    ctx.power({ label: T('pw.again'), cost: 10, use: () => { if (phase !== 'type') return; box.textContent = num; to.push(setTimeout(() => { if (!ended) box.textContent = mask(); }, 1200)); } });
    return () => to.forEach(clearTimeout);
  }

  /* ---------- 12. Mine Sweep ---------- */
  function sweep(stage, ctx) {
    const N = pick([8, 8, 10], ctx.diff), M = pick([8, 10, 18], ctx.diff);
    let cells = Array.from({ length: N * N }, () => ({ m: false, o: false, f: false, n: 0 })), placed = false, flagMode = false, over = false, t0 = null, tm, flags = 0, lastLP = 0;
    const nbrs = (i) => { const r = Math.floor(i / N), c = i % N, o = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < N && cc >= 0 && cc < N) o.push(rr * N + cc); } return o; };
    const grid = $(`<div class="board-g sweep" style="grid-template-columns:repeat(${N},1fr)"></div>`), tools = $('<div class="sdk-pad"></div>'), fb = $(`<button class="btn">${T('sw.flagoff')}</button>`);
    const hud = () => ctx.hud([H('mines', M - flags), `${t0 ? Math.round((Date.now() - t0) / 1000) : 0}s`]);
    const place = (safe) => { const ex = new Set([safe, ...nbrs(safe)]); shuffle([...Array(N * N).keys()].filter((i) => !ex.has(i))).slice(0, M).forEach((i) => (cells[i].m = true)); cells.forEach((c, i) => (c.n = nbrs(i).filter((k) => cells[k].m).length)); placed = true; t0 = Date.now(); tm = setInterval(hud, 1000); };
    const reveal = (i) => { const st = [i]; let cnt = 0; while (st.length) { const k = st.pop(), c = cells[k]; if (c.o || c.f) continue; c.o = true; cnt++; if (c.n === 0) nbrs(k).forEach((x) => !cells[x].o && st.push(x)); } return cnt; };
    const win = () => { over = true; clearInterval(tm); const s = Math.round((Date.now() - t0) / 1000); ctx.sfx('win'); ctx.burst(grid, '#ff8a6b', 60); setTimeout(() => ctx.end({ win: true, quality: clamp(1 - s / (N * 20)) * .7 + .3, score: Math.max(0, 1500 - s * 5), label: `${s}s` }), 700); };
    const act = (i, flag) => {
      if (over) return; const c = cells[i];
      if (flag) { if (c.o) return; c.f = !c.f; flags += c.f ? 1 : -1; ctx.sfx('tap'); draw(); return; }
      if (c.f || c.o) return; if (!placed) place(i);
      if (c.m) { over = true; clearInterval(tm); cells.forEach((x) => { if (x.m) x.o = true; }); draw(); ctx.sfx('bad'); ctx.shake(grid); const op = cells.filter((x) => x.o && !x.m).length;
        return void setTimeout(() => ctx.end({ win: false, quality: clamp(op / (N * N - M)) * .5, score: op * 20, label: T('lbl.mine') }), 1100); }
      const n = reveal(i); ctx.sfx('good', Math.min(7, Math.floor(n / 3))); draw(); if (n > 4) ctx.pop(grid, `+${n}`, '#ff8a6b');
      if (cells.every((x) => x.m || x.o)) win();
    };
    function draw() { grid.innerHTML = ''; cells.forEach((c, i) => { const b = $(`<button class="mc ${c.o ? 'open' : ''} ${c.o && c.m ? 'boom' : ''}" data-n="${c.o && !c.m ? c.n : ''}" aria-label="Cell ${i + 1}">${c.o ? (c.m ? '✹' : (c.n || '')) : (c.f ? '⚑' : '')}</button>`);
      b.onclick = () => { if (Date.now() - lastLP < 700) return; act(i, flagMode); }; b.oncontextmenu = (e) => { e.preventDefault(); act(i, true); };
      let lp; b.onpointerdown = () => { lp = setTimeout(() => { lastLP = Date.now(); act(i, true); }, 420); }; b.onpointerup = b.onpointerleave = () => clearTimeout(lp); grid.append(b); }); hud(); }
    fb.onclick = () => { flagMode = !flagMode; fb.textContent = T(flagMode ? 'sw.flagon' : 'sw.flagoff'); fb.classList.toggle('primary', flagMode); };
    tools.append(fb); draw(); stage.append(grid, tools, $(`<p class="hint">${T('hint.sweep')}</p>`));
    ctx.power({ label: T('pw.safe'), cost: 20, use: () => { if (over) return; if (!placed) place(Math.floor(N * N / 2)); const s = cells.map((c, i) => (!c.m && !c.o ? i : -1)).filter((i) => i >= 0); if (!s.length) return; const i = s[ri(0, s.length - 1)]; cells[i].f = false; reveal(i); draw(); if (cells.every((x) => x.m || x.o)) win(); } });
    return () => clearInterval(tm);
  }

  /* ---------- 13. Code Breaker ---------- */
  function code(stage, ctx) {
    const ALL = ['#ff6b5e', '#ffb454', '#f2d45c', '#3dd6a5', '#5aa9ff', '#c28bff', '#ff7aa8'], NC = pick([5, 6, 7], ctx.diff), COLS = ALL.slice(0, NC), MAX = pick([10, 8, 7], ctx.diff), secret = shuffle([...Array(NC).keys()]).slice(0, 4);
    let rows = [], cur = [null, null, null, null], over = false;
    const board = $('<div class="cb-board"></div>'), pal = $('<div class="cb-pal"></div>'), chk = $(`<button class="btn primary">${T('check')}</button>`), hintBox = $('<p class="hint" style="min-height:22px"></p>');
    const hud = () => ctx.hud([H('try', `${Math.min(rows.length + 1, MAX)}/${MAX}`)]);
    const pegs = (ex, pa) => `<span class="pegs">${[0, 1, 2, 3].map((k) => `<i class="${k < ex ? 'ex' : k < ex + pa ? 'pa' : ''}"></i>`).join('')}</span>`;
    const draw = () => {
      board.innerHTML = '';
      for (let r = 0; r < MAX; r++) {
        const row = $('<div class="cb-row"></div>');
        if (r < rows.length) { rows[r].g.forEach((c) => row.append($(`<span class="cb-dot" style="background:${COLS[c]}"></span>`))); row.insertAdjacentHTML('beforeend', pegs(rows[r].ex, rows[r].pa)); }
        else if (r === rows.length && !over) { cur.forEach((c, k) => { const b = $(`<button class="cb-dot slot ${c === null ? '' : 'f'}" style="${c === null ? '' : 'background:' + COLS[c]}" aria-label="Slot ${k + 1}"></button>`); b.onclick = () => { cur[k] = null; draw(); }; row.append(b); }); row.classList.add('cur'); }
        else for (let k = 0; k < 4; k++) row.append($('<span class="cb-dot ghost"></span>'));
        board.append(row);
      }
      chk.disabled = over || cur.includes(null); hud();
    };
    const put = (c) => { if (over) return; const k = cur.indexOf(null); if (k < 0) return; cur[k] = c; ctx.sfx('tap'); draw(); };
    COLS.forEach((col, c) => { const b = $(`<button class="cb-dot pick" style="background:${col}" aria-label="Color ${c + 1}"></button>`); b.onclick = () => put(c); pal.append(b); });
    const submit = () => {
      if (over || cur.includes(null)) return;
      const ex = cur.filter((c, k) => c === secret[k]).length, pa = cur.filter((c) => secret.includes(c)).length - ex;
      rows.push({ g: cur.slice(), ex, pa }); cur = [null, null, null, null];
      if (ex === 4) { over = true; draw(); ctx.sfx('win'); ctx.burst(board, '#6bc8ff', 60); const n = rows.length; setTimeout(() => ctx.end({ win: true, quality: clamp(1 - (n - 3) / (MAX - 2)), score: (MAX + 1 - n) * 150, label: T('lbl.cracked', { n }) }), 800); }
      else if (rows.length >= MAX) { over = true; draw(); ctx.sfx('bad'); board.insertAdjacentHTML('beforeend', `<div class="cb-row">${secret.map((c) => `<span class="cb-dot" style="background:${COLS[c]}"></span>`).join('')}</div>`); setTimeout(() => ctx.end({ win: false, quality: .15, score: 0, label: T('lbl.notcracked') }), 1500); }
      else { ctx.sfx('good', ex); draw(); }
    };
    chk.onclick = submit;
    const key = (e) => { if (e.key === 'Enter') submit(); else if (e.key === 'Backspace') { const k = cur.map((x) => x !== null).lastIndexOf(true); if (k >= 0) { cur[k] = null; draw(); } } else { const c = +e.key - 1; if (c >= 0 && c < NC) put(c); } };
    document.addEventListener('keydown', key); draw();
    const row2 = $('<div class="sdk-pad"></div>'); row2.append(chk);
    stage.append(board, pal, row2, hintBox, $(`<p class="hint">${T('hint.code')}</p>`));
    let revealed = 0;
    ctx.power({ label: T('pw.spot2'), cost: 20, use: () => { if (over || revealed >= 3) return; const k = revealed++; hintBox.innerHTML = (hintBox.innerHTML || '') + `${T('code.spot', { n: k + 1 })} <span class="cb-dot" style="display:inline-block;width:16px;height:16px;vertical-align:middle;background:${COLS[secret[k]]}"></span> &nbsp;`; } });
    return () => document.removeEventListener('keydown', key);
  }

  /* ---------- 14. Target Rush ---------- */
  function rush(stage, ctx) {
    const D = ctx.diff; let left = 30, score = 0, combo = 0, lives = pick([4, 3, 2], D), over = false, active = 0; const to = [], need = pick([10, 12, 15], D), speed = pick([1.25, 1, .8], D);
    const arena = $('<div class="arena"></div>');
    const hud = () => ctx.hud([{ t: `${left}s`, low: left <= 6 }, H('hits', score), H('lives', lives)]);
    const wave = () => { if (over) return; const n = score >= 12 ? 2 : 1; for (let i = 0; i < n; i++) spawn(); };
    const resolved = () => { active--; if (!over && active <= 0) to.push(setTimeout(wave, 160)); };
    function spawn() {
      active++; const life = Math.max(700, 1500 * speed - score * 35), size = Math.max(46, 76 - score * 1.2);
      const r = RND(), kind = score >= 4 && r < .13 ? 'gold' : score >= 6 && r < .30 ? 'bomb' : 'norm', col = kind === 'gold' ? '#f2d45c' : kind === 'bomb' ? '#ff6b5e' : '#4fd1e0';
      const b = $(`<button class="tg ${kind}" aria-label="${kind === 'bomb' ? 'Bomb' : 'Target'}" style="left:${ri(4, 80)}%;top:${ri(4, 80)}%;width:${size}px;height:${size}px;--d:${life}ms"><i></i>${kind === 'bomb' ? '<em>✕</em>' : kind === 'gold' ? '<em>★</em>' : ''}</button>`); let done = false;
      b.onpointerdown = (e) => { e.preventDefault(); if (done || over) return; done = true;
        if (kind === 'bomb') { combo = 0; ctx.combo(0); lives--; ctx.sfx('bad'); ctx.burst(b, col, 22); ctx.pop(b, T('rush.bomb'), col); b.remove(); ctx.shake(arena); hud(); if (lives <= 0) return fin(); return resolved(); }
        combo++; const gain = kind === 'gold' ? 3 : 1; score += gain; if (kind === 'gold') { left += 2; ctx.flash(col); } ctx.sfx('good', combo); ctx.combo(combo); ctx.burst(b, col, kind === 'gold' ? 28 : 12); ctx.pop(b, kind === 'gold' ? T('rush.gold') : combo > 2 ? `×${combo}` : '+1', col); b.remove(); hud(); resolved(); };
      to.push(setTimeout(() => { if (done || over) return; done = true; b.remove(); if (kind === 'bomb') return resolved(); if (kind === 'norm') { combo = 0; ctx.combo(0); lives--; ctx.sfx('bad'); ctx.shake(arena); hud(); if (lives <= 0) return fin(); } resolved(); }, life));
      arena.append(b);
    }
    const timer = setInterval(() => { left--; if (left <= 0) fin(); else hud(); }, 1000);
    function fin() { if (over) return; over = true; clearInterval(timer); arena.innerHTML = ''; ctx.end({ win: score >= need, quality: clamp(score / (need * 2.3)), score: score * 100, label: T('lbl.hits', { n: score }) }); }
    stage.append(arena, $(`<p class="hint" style="margin-top:12px">${T('hint.rush', { n: need })}</p>`)); hud(); wave();
    ctx.power({ label: T('pw.life'), cost: 15, use: () => { lives++; hud(); } });
    return () => { clearInterval(timer); over = true; to.forEach(clearTimeout); };
  }

  /* ---------- 15. Wavelength ---------- */
  const SPECTRA = [
    ['Cold', 'Hot', [['Ice cube', 3], ['Fridge', 12], ['Spring day', 40], ['Bath water', 62], ['Sauna', 85], ['Lava', 98]]],
    ['Small', 'Big', [['Ant', 3], ['Mouse', 10], ['Dog', 35], ['Horse', 60], ['Elephant', 85], ['Whale', 97]]],
    ['Slow', 'Fast', [['Snail', 2], ['Turtle', 8], ['Jogger', 25], ['Bicycle', 38], ['Car', 60], ['Jet', 90]]],
    ['Cheap', 'Expensive', [['Chewing gum', 4], ['Burger', 15], ['Sneakers', 45], ['Laptop', 62], ['New car', 82], ['Yacht', 97]]],
    ['Soft', 'Hard', [['Cloud', 3], ['Pillow', 10], ['Sponge', 25], ['Wood', 65], ['Rock', 88], ['Diamond', 98]]],
    ['Quiet', 'Loud', [['Whisper', 5], ['Library', 12], ['Rainfall', 30], ['Traffic', 60], ['Concert', 85], ['Jet engine', 97]]],
    ['Sweet', 'Sour', [['Candy', 8], ['Ripe mango', 20], ['Apple', 40], ['Orange', 58], ['Lemon', 92], ['Vinegar', 98]]],
    ['Ancient', 'Modern', [['Dinosaur', 2], ['Castle', 15], ['Typewriter', 35], ['Old TV', 58], ['Smartphone', 90], ['Robot', 97]]],
    ['Boring', 'Thrilling', [['Watching paint dry', 3], ['Waiting in line', 12], ['Board game', 38], ['Movie night', 55], ['Roller coaster', 85], ['Skydiving', 97]]],
    ['Safe', 'Dangerous', [['Teddy bear', 3], ['Bicycle helmet', 10], ['Kitchen knife', 40], ['Campfire', 55], ['Shark', 85], ['Volcano', 96]]],
  ];
  function wave(stage, ctx) {
    const R = 5, rounds = shuffle(SPECTRA).slice(0, R).map(([a, b, items]) => ({ a, b, it: items[ri(0, items.length - 1)] }));
    let idx = 0, pts = 0, scoreSum = 0, locked = false, hintUsed = false, over = false;
    const bar = $('<div class="wv-bar"><i class="wv-band" hidden></i><i class="wv-tgt" hidden></i><i class="wv-guess"></i></div>'), tgt = bar.querySelector('.wv-tgt'), gs = bar.querySelector('.wv-guess'), band = bar.querySelector('.wv-band');
    const ends = $('<div class="wv-ends"><b></b><b></b></div>'), q = $('<div class="q wv-q"></div>');
    const rng = $('<input class="wv-range" type="range" min="0" max="100" value="50" aria-label="Position on the spectrum">');
    const go = $(`<button class="btn primary">${T('wv.lock')}</button>`), msg = $('<p class="hint" style="min-height:22px;margin-top:10px"></p>');
    const hud = () => ctx.hud([H('round', `${Math.min(idx + 1, R)}/${R}`), H('score', pts)]);
    const sync = () => { gs.style.left = rng.value + '%'; };
    const load = () => { const r = rounds[idx]; locked = false; hintUsed = false; ends.children[0].textContent = r.a; ends.children[1].textContent = r.b; q.textContent = r.it[0]; tgt.hidden = true; band.hidden = true; rng.disabled = false; go.disabled = false; msg.textContent = T('wv.hint'); rng.value = 50; sync(); hud(); };
    rng.oninput = sync;
    go.onclick = () => {
      if (locked || over) return; locked = true; rng.disabled = true; go.disabled = true;
      const r = rounds[idx], target = r.it[1], d = Math.abs(+rng.value - target), p = d <= 4 ? 4 : d <= 10 ? 3 : d <= 18 ? 2 : d <= 30 ? 1 : 0;
      pts += p; scoreSum += Math.max(0, Math.round(100 - d * 2.5)); tgt.style.left = target + '%'; tgt.hidden = false;
      if (p >= 3) { ctx.sfx('win'); ctx.burst(bar, '#4fd1e0', 26); } else if (p) ctx.sfx('good', p); else { ctx.sfx('bad'); ctx.shake(bar); }
      ctx.combo(p >= 3 ? ++streak : (streak = 0)); ctx.pop(bar, p === 4 ? T('wv.bull') : p ? `+${p}` : T('wv.miss'), p >= 3 ? '#4fd1e0' : '#ff6b5e');
      msg.textContent = T('wv.off', { n: Math.round(d) }); hud();
      setTimeout(() => { idx++; if (idx >= R) fin(); else load(); }, 1700);
    };
    let streak = 0;
    function fin() { if (over) return; over = true; ctx.end({ win: pts >= 9, quality: clamp(pts / 20), score: scoreSum + pts * 20, label: T('wv.lbl', { n: pts }) }); }
    const kd = (e) => { if (e.key === 'Enter' && !locked) go.click(); };
    document.addEventListener('keydown', kd);
    stage.append($('<div class="center"></div>')); const box = stage.firstChild; box.append(ends, bar, q, rng, go, msg); load();
    ctx.power({ label: T('pw.hint'), cost: 10, use: () => { if (locked || hintUsed) return; hintUsed = true; const t = rounds[idx].it[1]; band.style.left = Math.max(0, t - 18) + '%'; band.style.width = (Math.min(100, t + 18) - Math.max(0, t - 18)) + '%'; band.hidden = false; } });
    return () => document.removeEventListener('keydown', kd);
  }

  /* ---------- 16. Snake ---------- */
  function snake(stage, ctx) {
    const N = 15, tick = pick([150, 120, 95], ctx.diff), need = pick([6, 8, 10], ctx.diff);
    let body = [[7, 7], [6, 7], [5, 7]], dir = [1, 0], next = [1, 0], food = null, gold = null, apples = 0, pts = 0, left = 75, over = false, combo = 0;
    const cv = $('<canvas class="snk" width="450" height="450" aria-label="Snake board"></canvas>'), g = cv.getContext('2d'), C = 450 / N;
    const free = (x, y) => !body.some(([a, b]) => a === x && b === y) && !(food && food[0] === x && food[1] === y) && !(gold && gold[0] === x && gold[1] === y);
    const spawn = () => { for (let k = 0; k < 200; k++) { const x = ri(0, N - 1), y = ri(0, N - 1); if (free(x, y)) return [x, y]; } return null; };
    food = spawn();
    const draw = () => {
      g.fillStyle = '#12151b'; g.fillRect(0, 0, 450, 450);
      g.fillStyle = 'rgba(255,255,255,.035)'; for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if ((x + y) % 2) g.fillRect(x * C, y * C, C, C);
      const dot = (p, col, r) => { g.fillStyle = col; g.beginPath(); g.arc(p[0] * C + C / 2, p[1] * C + C / 2, C * r, 0, 7); g.fill(); };
      if (food) dot(food, '#ff6b5e', .36); if (gold) dot(gold, '#f2d45c', .42);
      body.forEach((p, i) => { g.fillStyle = i ? `hsl(${150 - i * 3} 60% ${52 - Math.min(i, 14)}%)` : '#d6ff3d'; g.beginPath(); g.roundRect(p[0] * C + 2, p[1] * C + 2, C - 4, C - 4, 7); g.fill(); });
    };
    const hud = () => ctx.hud([H('score', apples), { t: `${left}s`, low: left <= 10 }, `${apples}/${need}`]);
    const turn = (d) => { if (d[0] === -dir[0] && d[1] === -dir[1]) return; next = d; };
    const step = () => {
      if (over) return; dir = next; const h = [body[0][0] + dir[0], body[0][1] + dir[1]];
      if (h[0] < 0 || h[1] < 0 || h[0] >= N || h[1] >= N || body.slice(0, -1).some(([a, b]) => a === h[0] && b === h[1])) return crash();
      body.unshift(h); let ate = false;
      if (food && h[0] === food[0] && h[1] === food[1]) { ate = true; apples++; combo++; pts += 100; ctx.sfx('good', combo); ctx.combo(combo); ctx.burst(cv, '#ff6b5e', 14); food = spawn(); if (apples % 4 === 0 && !gold) { gold = spawn(); setTimeout(() => { gold = null; }, 6000); } }
      else if (gold && h[0] === gold[0] && h[1] === gold[1]) { ate = true; apples += 2; pts += 300; left += 5; gold = null; ctx.sfx('win'); ctx.flash('#f2d45c'); ctx.pop(cv, T('snk.gold'), '#f2d45c'); }
      if (!ate) body.pop();
      if (!food) food = spawn(); hud(); draw();
    };
    const crash = () => { over = true; clearInterval(iv); clearInterval(tm); ctx.sfx('bad'); ctx.shake(cv); setTimeout(() => ctx.end({ win: apples >= need, quality: clamp(apples / (need * 2)), score: pts + body.length * 5, label: T('snk.lbl', { n: apples }) }), 600); };
    const iv = setInterval(step, tick);
    const tm = setInterval(() => { left--; if (left <= 0) { over = true; clearInterval(iv); clearInterval(tm); ctx.end({ win: apples >= need, quality: clamp(apples / (need * 2)), score: pts + body.length * 5, label: T('snk.lbl', { n: apples }) }); } else hud(); }, 1000);
    const KEYS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1] };
    const kd = (e) => { const d = KEYS[e.key]; if (d) { e.preventDefault(); turn(d); } };
    let sx, sy; cv.style.touchAction = 'none';
    cv.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    cv.addEventListener('touchmove', (e) => { const dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) > 22) { turn(Math.abs(dx) > Math.abs(dy) ? [dx < 0 ? -1 : 1, 0] : [0, dy < 0 ? -1 : 1]); sx = e.touches[0].clientX; sy = e.touches[0].clientY; } }, { passive: true });
    document.addEventListener('keydown', kd);
    const pad = $('<div class="snk-pad"><button aria-label="Up">▲</button><div><button aria-label="Left">◀</button><button aria-label="Down">▼</button><button aria-label="Right">▶</button></div></div>');
    const dirs = [[0, -1], [-1, 0], [0, 1], [1, 0]]; [...pad.querySelectorAll('button')].forEach((b, i) => { b.onclick = () => turn(dirs[i]); });
    stage.append(cv, pad, $(`<p class="hint">${T('snk.hint', { n: need })}</p>`)); draw(); hud();
    ctx.power({ label: T('pw.secs', { n: 10 }), cost: 15, use: () => { left += 10; hud(); } });
    return () => { over = true; clearInterval(iv); clearInterval(tm); document.removeEventListener('keydown', kd); };
  }

  /* ---------- 17. Word Guess ---------- */
  const W5 = ['about', 'above', 'actor', 'adult', 'after', 'again', 'alarm', 'alive', 'angle', 'apple', 'arrow', 'beach', 'beard', 'berry', 'black', 'blade', 'blank', 'bread', 'brick', 'brush', 'candy', 'chair', 'chalk', 'charm', 'chess', 'chill', 'cloud', 'clown', 'coast', 'crane', 'crown', 'dance', 'dream', 'drink', 'earth', 'eagle', 'field', 'flame', 'flute', 'frost', 'fruit', 'ghost', 'giant', 'grape', 'grass', 'happy', 'heart', 'honey', 'house', 'juice', 'knife', 'lemon', 'light', 'magic', 'mango', 'maple', 'music', 'night', 'ocean', 'olive', 'paint', 'peace', 'pearl', 'piano', 'pizza', 'plant', 'queen', 'quick', 'radio', 'river', 'robot', 'salad', 'shark', 'sheep', 'shine', 'smile', 'snake', 'spice', 'storm', 'sugar', 'table', 'tiger', 'toast', 'train', 'water', 'whale', 'wheel', 'youth', 'zebra'];
  function wordle(stage, ctx) {
    const MAX = pick([7, 6, 5], ctx.diff), word = W5[ri(0, W5.length - 1)];
    let guesses = [], cur = '', over = false, states = {}, hinted = 0;
    const board = $('<div class="wd-grid"></div>'), kb = $('<div class="wd-kb"></div>'), msg = $('<p class="hint" style="min-height:22px;margin:8px 0"></p>');
    const rate = (g) => { const res = Array(5).fill('x'), left = word.split(''); g.split('').forEach((c, i) => { if (c === word[i]) { res[i] = 'g'; left[i] = null; } }); g.split('').forEach((c, i) => { if (res[i] === 'x') { const k = left.indexOf(c); if (k >= 0) { res[i] = 'y'; left[k] = null; } } }); return res; };
    const hud = () => ctx.hud([H('try', `${Math.min(guesses.length + 1, MAX)}/${MAX}`)]);
    const draw = () => {
      board.innerHTML = '';
      for (let r = 0; r < MAX; r++) { const row = $('<div class="wd-row"></div>'); const g = guesses[r], res = g && rate(g.w);
        for (let c = 0; c < 5; c++) row.append($(`<span class="wd-t ${g ? res[c] : ''} ${!g && r === guesses.length && cur[c] ? 'f' : ''}">${g ? g.w[c] : r === guesses.length ? (cur[c] || '') : ''}</span>`));
        board.append(row); }
      kb.querySelectorAll('button[data-k]').forEach((b) => { b.className = 'wd-k ' + (states[b.dataset.k] || ''); }); hud();
    };
    const type = (ch) => { if (over || cur.length >= 5) return; cur += ch; ctx.sfx('tap'); draw(); };
    const del = () => { if (over) return; cur = cur.slice(0, -1); draw(); };
    const submit = () => {
      if (over) return; if (cur.length < 5) { ctx.shake(board); msg.textContent = T('wd.short'); return; }
      msg.textContent = ''; const res = rate(cur); guesses.push({ w: cur });
      res.forEach((r, i) => { const c = cur[i], rank = { x: 0, y: 1, g: 2 }; if (!states[c] || rank[r] > rank[{ x: 'x', y: 'y', g: 'g' }[states[c]] || 'x']) states[c] = r; });
      const won = cur === word; cur = ''; draw();
      if (won) { over = true; ctx.sfx('win'); ctx.burst(board, '#3dd6a5', 50); const n = guesses.length; setTimeout(() => ctx.end({ win: true, quality: clamp(1 - (n - 1) / MAX), score: (MAX + 1 - n) * 150 + 100 - hinted * 40, label: T('wd.lbl', { n }) }), 800); }
      else if (guesses.length >= MAX) { over = true; ctx.sfx('bad'); msg.textContent = T('wd.was', { w: word.toUpperCase() }); setTimeout(() => ctx.end({ win: false, quality: .1, score: 0, label: T('wd.lost') }), 1800); }
      else ctx.sfx('good', res.filter((x) => x === 'g').length);
    };
    ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'].forEach((row, i) => { const r = $('<div class="wd-krow"></div>'); if (i === 2) { const e = $(`<button class="wd-k wide">${T('wd.enter')}</button>`); e.onclick = submit; r.append(e); }
      row.split('').forEach((c) => { const b = $(`<button class="wd-k" data-k="${c}">${c}</button>`); b.onclick = () => type(c); r.append(b); });
      if (i === 2) { const d = $('<button class="wd-k wide" aria-label="Delete">⌫</button>'); d.onclick = del; r.append(d); } kb.append(r); });
    const kd = (e) => { if (e.ctrlKey || e.metaKey || e.altKey) return; const k = e.key.toLowerCase(); if (k === 'enter') submit(); else if (k === 'backspace') del(); else if (/^[a-z]$/.test(k)) type(k); };
    document.addEventListener('keydown', kd);
    stage.append(board, msg, kb); draw();
    ctx.power({ label: T('pw.reveal'), cost: 15, use: () => { if (over || hinted >= 2) return; const known = new Set(guesses.flatMap((g) => rate(g.w).map((r, i) => (r === 'g' ? i : -1)))); const idxs = [0, 1, 2, 3, 4].filter((i) => !known.has(i)); if (!idxs.length) return; const i = idxs[ri(0, idxs.length - 1)]; hinted++; msg.textContent = T('wd.letter', { n: i + 1, c: word[i].toUpperCase() }); } });
    return () => document.removeEventListener('keydown', kd);
  }

  /* ---------- 18. Tic-Tac-Toe ---------- */
  function tictac(stage, ctx) {
    const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]], ROUNDS = 3, skill = pick([.35, .75, .95], ctx.diff);
    let b, round = 0, wins = 0, draws = 0, losses = 0, turn = 'X', busy = false, over = false, to = [];
    const win = (bd) => { for (const [a, c, d] of LINES) if (bd[a] && bd[a] === bd[c] && bd[a] === bd[d]) return bd[a]; return bd.every(Boolean) ? 'D' : null; };
    const minimax = (bd, who) => { const w = win(bd); if (w === 'O') return 1; if (w === 'X') return -1; if (w === 'D') return 0; let best = who === 'O' ? -2 : 2; for (let i = 0; i < 9; i++) if (!bd[i]) { bd[i] = who; const v = minimax(bd, who === 'O' ? 'X' : 'O'); bd[i] = ''; best = who === 'O' ? Math.max(best, v) : Math.min(best, v); } return best; };
    const aiMove = () => { const e = [...Array(9).keys()].filter((i) => !b[i]); if (RND() > skill) return e[ri(0, e.length - 1)];
      let bestV = -2, moves = []; e.forEach((i) => { b[i] = 'O'; const v = minimax(b, 'X'); b[i] = ''; if (v > bestV) { bestV = v; moves = [i]; } else if (v === bestV) moves.push(i); }); return moves[ri(0, moves.length - 1)]; };
    const grid = $('<div class="ttt"></div>'), msg = $('<p class="hint" style="min-height:22px;margin-top:12px"></p>');
    const hud = () => ctx.hud([H('round', `${Math.min(round + 1, ROUNDS)}/${ROUNDS}`), `${T('ttt.w')} ${wins}`, `${T('ttt.l')} ${losses}`]);
    const draw = (line) => { grid.innerHTML = ''; b.forEach((v, i) => { const c = $(`<button class="ttt-c ${v} ${line && line.includes(i) ? 'hit' : ''}" aria-label="Cell ${i + 1} ${v || 'empty'}">${v === 'X' ? '✕' : v === 'O' ? '◯' : ''}</button>`); c.onclick = () => play(i); grid.append(c); }); hud(); };
    const newRound = () => { b = Array(9).fill(''); turn = round % 2 === 0 ? 'X' : 'O'; busy = false; draw(); msg.textContent = turn === 'X' ? T('ttt.you') : T('ttt.ai'); if (turn === 'O') { busy = true; to.push(setTimeout(ai, 600)); } };
    const check = () => { const w = win(b); if (!w) return false; busy = true;
      const line = LINES.find(([x, y, z]) => b[x] && b[x] === b[y] && b[x] === b[z]); draw(line);
      if (w === 'X') { wins++; ctx.sfx('win'); ctx.burst(grid, '#3dd6a5', 40); ctx.combo(wins); msg.textContent = T('ttt.won'); } else if (w === 'O') { losses++; ctx.sfx('bad'); ctx.shake(grid); ctx.combo(0); msg.textContent = T('ttt.lost'); } else { draws++; ctx.sfx('tap'); msg.textContent = T('ttt.draw'); }
      hud(); round++; to.push(setTimeout(() => { if (round >= ROUNDS) fin(); else newRound(); }, 1400)); return true; };
    function play(i) { if (busy || over || b[i]) return; b[i] = 'X'; ctx.sfx('tap'); draw(); if (check()) return; busy = true; msg.textContent = T('ttt.ai'); to.push(setTimeout(ai, 450)); }
    function ai() { if (over) return; b[aiMove()] = 'O'; draw(); if (check()) return; busy = false; msg.textContent = T('ttt.you'); }
    function fin() { if (over) return; over = true; const pts = wins * 3 + draws; ctx.end({ win: wins >= 2 || (wins >= 1 && losses === 0), quality: clamp(pts / 9), score: wins * 300 + draws * 100, label: T('ttt.lbl', { w: wins, d: draws, l: losses }) }); }
    stage.append(grid, msg, $(`<p class="hint">${T('ttt.hint')}</p>`)); newRound();
    ctx.power({ label: T('pw.hint'), cost: 10, use: () => { if (busy || over) return; let bestV = -2, mv = []; [...Array(9).keys()].filter((i) => !b[i]).forEach((i) => { b[i] = 'X'; const v = -minimax(b, 'O'); b[i] = ''; if (v > bestV) { bestV = v; mv = [i]; } else if (v === bestV) mv.push(i); }); const c = grid.children[mv[0]]; if (c) { c.classList.add('hint'); setTimeout(() => c.classList.remove('hint'), 1400); } } });
    return () => { over = true; to.forEach(clearTimeout); };
  }

  const svg = (d) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  window.ICON = {
    memory: svg('<rect x="3" y="6" width="11" height="14" rx="2"/><rect x="10" y="4" width="11" height="14" rx="2"/>'),
    slide: svg('<rect x="4" y="4" width="4.5" height="4.5"/><rect x="9.8" y="4" width="4.5" height="4.5"/><rect x="15.5" y="4" width="4.5" height="4.5"/><rect x="4" y="9.8" width="4.5" height="4.5"/><rect x="9.8" y="9.8" width="4.5" height="4.5"/><rect x="15.5" y="9.8" width="4.5" height="4.5"/><rect x="4" y="15.5" width="4.5" height="4.5"/><rect x="9.8" y="15.5" width="4.5" height="4.5"/>'),
    words: svg('<path d="M5 19L12 5l7 14M8 14h8"/>'),
    math: svg('<path d="M4 8h7M7.5 4.5v7M13 15l6 5M19 15l-6 5M13 8h6"/>'),
    pattern: svg('<circle cx="7" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><circle cx="7" cy="17" r="3"/><circle cx="17" cy="17" r="3"/>'),
    lights: svg('<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.5.4.5 1.1.5 1.6h6c0-.5 0-1.2.5-1.6A6 6 0 0012 3z"/>'),
    merge: svg('<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" fill="currentColor"/>'),
    sudoku: svg('<path d="M4 4h16v16H4zM9.3 4v16M14.7 4v16M4 9.3h16M4 14.7h16"/>'),
    stroop: svg('<circle cx="12" cy="12" r="8"/><path d="M12 4v16"/><path d="M12 12h8" />'),
    odd: svg('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor"/>'),
    recall: svg('<path d="M9 4L7 20M17 4l-2 16M4 9h16M3.5 15h16"/>'),
    sweep: svg('<circle cx="12" cy="13" r="6"/><path d="M12 7V4M7 8L5 6M17 8l2-2M5 13H2M22 13h-3"/>'),
    code: svg('<circle cx="7" cy="8" r="3"/><circle cx="17" cy="8" r="3"/><circle cx="7" cy="17" r="3" fill="currentColor"/><circle cx="17" cy="17" r="3"/>'),
    rush: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.8" fill="currentColor"/>'),
    wave: svg('<path d="M3 15c3 0 3-6 6-6s3 6 6 6 3-6 6-6"/><path d="M12 4v16" stroke-dasharray="2 2"/>'),
    snake: svg('<path d="M5 18h9a4 4 0 000-8H9a3 3 0 010-6h9"/><circle cx="18" cy="4" r="1" fill="currentColor"/>'),
    wordle: svg('<rect x="3" y="5" width="5" height="5" rx="1"/><rect x="9.500" y="5" width="5" height="5" rx="1" fill="currentColor"/><rect x="16" y="5" width="5" height="5" rx="1"/><rect x="3" y="12" width="5" height="5" rx="1"/><rect x="9.500" y="12" width="5" height="5" rx="1"/>'),
    tictac: svg('<path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><path d="M4.500 4.500l3 3M7.500 4.500l-3 3"/><circle cx="12" cy="12" r="1.800"/>'),
    ticket: svg('<path d="M3 9a2 2 0 002-2V6h14v1a2 2 0 002 2v2a2 2 0 000 2v2a2 2 0 00-2 2v1H5v-1a2 2 0 00-2-2v-2a2 2 0 000-2z"/><path d="M13 7v10" stroke-dasharray="2 2"/>'),
    cash: svg('<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>'),
    coin: svg('<circle cx="12" cy="12" r="8"/><path d="M12 8v8"/>'),
    gift: svg('<rect x="4" y="9" width="16" height="11" rx="2"/><path d="M12 9v11M3 6h18v3H3z"/>'),
    phone: svg('<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>'),
    heart: svg('<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>'),
  };
  window.GAMES = [
    { id: 'memory', icon: ICON.memory, color: '#8b7bff', art: 'dots', tag: 'Memory', time: 60, mount: memory },
    { id: 'slide', icon: ICON.slide, color: '#3dd6a5', art: 'grid', tag: 'Logic', time: 120, mount: slide },
    { id: 'words', icon: ICON.words, color: '#5aa9ff', art: 'stripes', tag: 'Language', time: 75, mount: words },
    { id: 'math', icon: ICON.math, color: '#ffb454', art: 'cross', tag: 'Speed', time: 45, mount: math },
    { id: 'pattern', icon: ICON.pattern, color: '#ff7aa8', art: 'rings', tag: 'Focus', time: 120, mount: pattern },
    { id: 'lights', icon: ICON.lights, color: '#f2d45c', art: 'dots', tag: 'Logic', time: 120, mount: lights },
    { id: 'merge', icon: ICON.merge, color: '#d6ff3d', art: 'check', tag: 'Logic', time: 180, mount: merge },
    { id: 'sudoku', icon: ICON.sudoku, color: '#ff9f6b', art: 'grid', tag: 'Logic', time: 120, mount: sudoku },
    { id: 'stroop', icon: ICON.stroop, color: '#c28bff', art: 'split', tag: 'Focus', time: 30, mount: stroop },
    { id: 'odd', icon: ICON.odd, color: '#4fd1e0', art: 'check', tag: 'Focus', time: 45, mount: odd },
    { id: 'sweep', icon: ICON.sweep, color: '#ff8a6b', art: 'check', tag: 'Logic', time: 180, mount: sweep },
    { id: 'code', icon: ICON.code, color: '#6bc8ff', art: 'dots', tag: 'Logic', time: 180, mount: code },
    { id: 'rush', icon: ICON.rush, color: '#4fd1e0', art: 'rings', tag: 'Speed', time: 30, mount: rush },
    { id: 'recall', icon: ICON.recall, color: '#ff7aa8', art: 'lines', tag: 'Memory', time: 120, mount: recall },
    { id: 'wave', icon: ICON.wave, color: '#4fd1e0', art: 'stripes', tag: 'Focus', time: 90, mount: wave },
    { id: 'snake', icon: ICON.snake, color: '#8bd63d', art: 'grid', tag: 'Speed', time: 75, mount: snake },
    { id: 'wordle', icon: ICON.wordle, color: '#3dd6a5', art: 'check', tag: 'Language', time: 120, mount: wordle },
    { id: 'tictac', icon: ICON.tictac, color: '#ff9f6b', art: 'cross', tag: 'Logic', time: 60, mount: tictac },
  ];
  GAMES.forEach((g) => ['name', 'desc', 'how'].forEach((f) => Object.defineProperty(g, f, { get: () => I18N.t('g.' + g.id + '.' + f[0]) })));
  GAMES.forEach((g) => { const m = g.mount; g.mount = (stage, ctx) => { RND = ctx.seed != null ? mulberry(ctx.seed) : Math.random; return m(stage, ctx); }; });
})();
