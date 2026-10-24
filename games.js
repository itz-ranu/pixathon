/* Thirty-two puzzle games. Each mount(stage, ctx) returns a cleanup fn.
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
      const bg = g.createRadialGradient(225, 225, 60, 225, 225, 330); bg.addColorStop(0, '#1b2a24'); bg.addColorStop(1, '#0c1210'); g.fillStyle = bg; g.fillRect(0, 0, 450, 450);
      g.fillStyle = 'rgba(255,255,255,.03)'; for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if ((x + y) % 2) g.fillRect(x * C, y * C, C, C);
      const dot = (p, col, r, glow) => { g.shadowColor = glow; g.shadowBlur = 18; g.fillStyle = col; g.beginPath(); g.arc(p[0] * C + C / 2, p[1] * C + C / 2, C * r * (1 + Math.sin(Date.now() / 160) * .05), 0, 7); g.fill(); g.shadowBlur = 0; g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(p[0] * C + C / 2 - C * .12, p[1] * C + C / 2 - C * .14, C * .08, 0, 7); g.fill(); };
      if (food) dot(food, '#ff4d5e', .36, '#ff4d5e'); if (gold) dot(gold, '#ffd23d', .42, '#ffd23d');
      for (let i = body.length - 1; i >= 0; i--) { const p = body[i], k = 1 - i / (body.length + 6); g.shadowColor = '#7dff6a'; g.shadowBlur = i ? 8 : 16; g.fillStyle = i ? `hsl(${110 + i * 2} 70% ${30 + k * 28}%)` : '#d6ff3d'; g.beginPath(); g.roundRect(p[0] * C + 2, p[1] * C + 2, C - 4, C - 4, i ? 9 : 11); g.fill(); }
      g.shadowBlur = 0; const h = body[0], ex = dir[0], ey = dir[1], cx0 = h[0] * C + C / 2, cy0 = h[1] * C + C / 2; g.fillStyle = '#fff'; [[-1, 1], [1, 1]].forEach(([s1]) => { const ox = ey !== 0 ? s1 * 6 : ex * 5, oy = ex !== 0 ? s1 * 6 : ey * 5; g.beginPath(); g.arc(cx0 + ox, cy0 + oy, 4, 0, 7); g.fill(); g.fillStyle = '#14170a'; g.beginPath(); g.arc(cx0 + ox + ex * 1.5, cy0 + oy + ey * 1.5, 2, 0, 7); g.fill(); g.fillStyle = '#fff'; });
    };
    const hud = () => ctx.hud([H('score', pts), { t: `${left}s`, low: left <= 10 }, `🍎 ${apples}/${need}`]);
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

  /* ---------- 19. Flap (Flappy-style) ---------- */
  function flap(stage, ctx) {
    const W = 360, VH = 480, FL = VH - 40, need = pick([5, 8, 12], ctx.diff), gap = pick([160, 140, 122], ctx.diff), PW = 56, BX = 90, R = 12;
    let y = VH / 2, vy = 0, pipes = [], score = 0, started = false, over = false, raf, last = 0, tick = 0;
    const cv = $(`<canvas class="snk flp" width="${W}" height="${VH}" aria-label="Flap game"></canvas>`), g = cv.getContext('2d');
    const hud = () => ctx.hud([H('score', score * 100), `${T('hud.goal')} ${score}/${need}`]);
    const jump = () => { if (over) return; started = true; vy = -7.4; ctx.sfx('tap'); for (let i = 0; i < 4; i++) feath.push({ x: BX - 8, y: y + 6, vx: -1 - RND() * 1.5, vy: RND() * 1.5, l: 1 }); };
    const addPipe = (x) => pipes.push({ x, top: ri(60, FL - gap - 60), done: false });
    addPipe(W + 40);
    let off = 0, feath = [];
    const draw = (now = 0) => {
      const sk = g.createLinearGradient(0, 0, 0, VH); sk.addColorStop(0, '#1c2a5e'); sk.addColorStop(.6, '#e0668f'); sk.addColorStop(1, '#ffb36b'); g.fillStyle = sk; g.fillRect(0, 0, W, VH);
      g.fillStyle = 'rgba(255,230,160,.9)'; g.beginPath(); g.arc(255, 300, 44, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.22)'; for (let i = 0; i < 4; i++) { const cx0 = (((i * 140 - off * .15) % (W + 140)) + W + 140) % (W + 140) - 70; g.beginPath(); g.ellipse(cx0, 70 + i * 55, 46, 14, 0, 0, 7); g.ellipse(cx0 + 22, 62 + i * 55, 28, 12, 0, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(70,45,120,.75)'; for (let i = 0; i < 12; i++) { const bx = (((i * 46 - off * .3) % (W + 70)) + W + 70) % (W + 70) - 35, bh = 70 + ((i * 41) % 80); g.fillRect(bx, FL - bh, 36, bh); }
      g.fillStyle = 'rgba(38,26,84,.95)'; for (let i = 0; i < 9; i++) { const bx = (((i * 58 - off * .55) % (W + 80)) + W + 80) % (W + 80) - 40, bh = 40 + ((i * 53) % 60); g.fillRect(bx, FL - bh, 44, bh); }
      pipes.forEach((p) => { const pg = g.createLinearGradient(p.x, 0, p.x + PW, 0); pg.addColorStop(0, '#1f8f55'); pg.addColorStop(.35, '#7dffa8'); pg.addColorStop(1, '#1a7a49'); g.fillStyle = pg; g.fillRect(p.x, 0, PW, p.top); g.fillRect(p.x, p.top + gap, PW, FL - p.top - gap); g.beginPath(); g.roundRect(p.x - 5, p.top - 18, PW + 10, 18, 5); g.roundRect(p.x - 5, p.top + gap, PW + 10, 18, 5); g.fill(); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(p.x + PW - 8, 0, 8, p.top - 18); g.fillRect(p.x + PW - 8, p.top + gap + 18, 8, FL - p.top - gap - 18); });
      g.fillStyle = '#6fdc5a'; g.fillRect(0, FL, W, 10); g.fillStyle = '#7a4b2a'; g.fillRect(0, FL + 10, W, VH - FL); g.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 20; i++) g.fillRect((((i * 24 - off) % (W + 24)) + W + 24) % (W + 24) - 12, FL + 12, 12, 8);
      feath.forEach((f) => { g.globalAlpha = clamp(f.l); g.fillStyle = '#fff6c4'; g.beginPath(); g.ellipse(f.x, f.y, 4, 2, f.l * 6, 0, 7); g.fill(); }); g.globalAlpha = 1;
      g.save(); g.translate(BX, y); g.rotate(clamp(vy / 12, -.5, 1)); g.shadowColor = 'rgba(255,220,80,.6)'; g.shadowBlur = 14;
      const bb = g.createRadialGradient(-3, -4, 2, 0, 0, R + 4); bb.addColorStop(0, '#fff3a6'); bb.addColorStop(1, '#f2a93d'); g.fillStyle = bb; g.beginPath(); g.ellipse(0, 0, R + 3, R, 0, 0, 7); g.fill(); g.shadowBlur = 0;
      g.fillStyle = '#e8862b'; g.save(); g.rotate(started ? Math.sin(now / 55) * .7 : .2); g.beginPath(); g.ellipse(-4, 3, 8, 5, 0, 0, 7); g.fill(); g.restore();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(6, -4, 5, 0, 7); g.fill(); g.fillStyle = '#14170a'; g.beginPath(); g.arc(7.500, -4, 2.200, 0, 7); g.fill(); g.fillStyle = '#ff6b3d'; g.beginPath(); g.moveTo(R, 0); g.lineTo(R + 10, 3); g.lineTo(R, 7); g.fill(); g.restore();
    };
    const die = () => { over = true; cancelAnimationFrame(raf); ctx.sfx('bad'); ctx.shake(cv); setTimeout(() => ctx.end({ win: score >= need, quality: clamp(score / (need * 2)), score: score * 100, label: T('flp.lbl', { n: score }) }), 600); };
    const loop = (now) => {
      if (over) return; const dt = Math.min((now - (last || now)) / 16.67, 2); last = now;
      feath.forEach((f) => { f.x += f.vx * dt; f.y += f.vy * dt; f.l -= .03 * dt; }); feath = feath.filter((f) => f.l > 0);
      if (started) {
        vy += .46 * dt; y += vy * dt; const sp = 2.6 * dt + Math.min(score, 20) * .02 * dt; off += sp * 1.2;
        pipes.forEach((p) => { p.x -= sp; });
        if (pipes[pipes.length - 1].x < W - 200) addPipe(W + 20); pipes = pipes.filter((p) => p.x > -PW - 10);
        for (const p of pipes) {
          if (!p.done && p.x + PW < BX - R) { p.done = true; score++; tick++; ctx.sfx('good', tick); ctx.combo(tick); hud(); }
          if (BX + R > p.x && BX - R < p.x + PW && (y - R < p.top || y + R > p.top + gap)) return die();
        }
        if (y + R > FL || y - R < 0) return die();
      } else y = VH / 2 + Math.sin(now / 200) * 6;
      draw(now); raf = requestAnimationFrame(loop);
    };
    const kd = (e) => { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); jump(); } };
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); jump(); }); cv.style.touchAction = 'none';
    document.addEventListener('keydown', kd);
    stage.append(cv, $(`<p class="hint">${T('flp.hint', { n: need })}</p>`)); hud(); draw(0); raf = requestAnimationFrame(loop);
    return () => { over = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); };
  }

  /* ---------- 20. Dino Dash (endless runner) ---------- */
  function dino(stage, ctx) {
    const W = 480, VH = 200, GY = 160, goal = pick([250, 400, 600], ctx.diff), DW = 24, DH = 30;
    let y = 0, vy = 0, obs = [], dist = 0, speed = 5, nextIn = 80, over = false, raf, last = 0, started = false;
    const cv = $(`<canvas class="snk dino" width="${W}" height="${VH}" aria-label="Dino runner"></canvas>`), g = cv.getContext('2d');
    const hud = () => ctx.hud([H('score', Math.floor(dist) * 10), `${T('hud.goal')} ${Math.floor(dist)}/${goal} m`]);
    const jump = () => { if (over) return; started = true; if (y === 0) { vy = 11.2; ctx.sfx('tap'); } };
    let off = 0, dust = [];
    const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
    const draw = () => {
      const night = clamp(Math.sin(dist / 70) * 1.3 + .1, 0, 1), top = mix([78, 130, 220], [10, 12, 36], night), bot = mix([255, 200, 150], [40, 30, 80], night);
      const sk = g.createLinearGradient(0, 0, 0, GY); sk.addColorStop(0, `rgb(${top})`); sk.addColorStop(1, `rgb(${bot})`); g.fillStyle = sk; g.fillRect(0, 0, W, H);
      if (night > .4) { g.fillStyle = `rgba(255,255,255,${night * .8})`; for (let i = 0; i < 24; i++) g.fillRect((i * 71) % W, (i * 29) % 100, 2, 2); }
      g.fillStyle = night > .5 ? '#e9e9ff' : '#fff2c4'; g.beginPath(); g.arc(400 - night * 30, 34 + night * 6, 15, 0, 7); g.fill();
      g.fillStyle = `rgba(${mix([90, 80, 150], [25, 22, 60], night)},.8)`; g.beginPath(); g.moveTo(0, GY); for (let x = 0; x <= W; x += 20) g.lineTo(x, GY - 36 - 22 * Math.sin((x + off * .2) / 60) - 12 * Math.sin((x + off * .2) / 23)); g.lineTo(W, GY); g.fill();
      g.fillStyle = `rgba(255,255,255,${.5 - night * .35})`; for (let i = 0; i < 3; i++) { const cx0 = (((i * 190 - off * .12) % (W + 120)) + W + 120) % (W + 120) - 60; g.beginPath(); g.ellipse(cx0, 30 + i * 22, 34, 9, 0, 0, 7); g.fill(); }
      g.fillStyle = `rgb(${mix([176, 140, 96], [50, 44, 70], night)})`; g.fillRect(0, GY, W, H - GY); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, GY, W, 3); for (let i = 0; i < 26; i++) g.fillRect((((i * 37 - off) % (W + 40)) + W + 40) % (W + 40) - 20, GY + 10 + (i % 3) * 9, 6 + (i % 4) * 3, 2);
      g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 8; obs.forEach((o) => { g.fillStyle = '#2f9d57'; g.beginPath(); g.roundRect(o.x, GY - o.h, o.w, o.h, 5); g.fill(); if (o.w >= 28) { g.beginPath(); g.roundRect(o.x - 6, GY - o.h * .65, 8, 6, 3); g.roundRect(o.x - 6, GY - o.h * .65 - 10, 6, 14, 3); g.roundRect(o.x + o.w - 2, GY - o.h * .5, 8, 6, 3); g.roundRect(o.x + o.w + 2, GY - o.h * .5 - 10, 6, 14, 3); g.fill(); } g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(o.x + 3, GY - o.h + 3, 3, o.h - 6); }); g.shadowBlur = 0;
      dust.forEach((d) => { g.globalAlpha = clamp(d.l); g.fillStyle = '#fff'; g.beginPath(); g.arc(d.x, d.y, d.r, 0, 7); g.fill(); }); g.globalAlpha = 1;
      const dy = GY - y, run = Math.floor(off / 9) % 2; g.shadowColor = 'rgba(214,255,61,.55)'; g.shadowBlur = 12; g.fillStyle = '#d6ff3d';
      g.beginPath(); g.roundRect(50, dy - DH, DW, DH - 8, 7); g.roundRect(60, dy - DH - 8, 22, 16, 6); g.fill(); g.beginPath(); g.moveTo(52, dy - 20); g.lineTo(38, dy - 14); g.lineTo(52, dy - 10); g.fill(); g.shadowBlur = 0;
      g.fillRect(54, dy - 9, 6, y > 0 ? 9 : run ? 9 : 4); g.fillRect(66, dy - 9, 6, y > 0 ? 9 : run ? 4 : 9);
      g.fillStyle = '#14170a'; g.beginPath(); g.arc(75, dy - DH - 1, 2.4, 0, 7); g.fill();
    };
    const die = () => { over = true; cancelAnimationFrame(raf); ctx.sfx('bad'); ctx.shake(cv); setTimeout(() => ctx.end({ win: dist >= goal, quality: clamp(dist / (goal * 1.6)), score: Math.floor(dist) * 10, label: T('dino.lbl', { n: Math.floor(dist) }) }), 600); };
    const loop = (now) => {
      if (over) return; const dt = Math.min((now - (last || now)) / 16.67, 2); last = now;
      if (started) {
        vy -= .62 * dt; y = Math.max(0, y + vy * dt); if (y === 0) vy = 0;
        speed = Math.min(5 + dist / 120, 11); dist += speed * dt * .06; off += speed * dt; if (y === 0 && RND() < .25) dust.push({ x: 52, y: GY - 2, vx: -1.5 - RND(), vy: -RND() * 1.2, l: 1, r: 2 + RND() * 2 }); dust.forEach((q) => { q.x += q.vx * dt; q.y += q.vy * dt; q.l -= .05 * dt; }); dust = dust.filter((q) => q.l > 0); obs.forEach((o) => { o.x -= speed * dt; }); obs = obs.filter((o) => o.x > -50);
        nextIn -= speed * dt; if (nextIn <= 0) { const n = ri(1, 3), w = 14 * n; obs.push({ x: W + 10, w, h: ri(26, 42) }); nextIn = ri(230, 380) * (1 + speed / 22); }
        for (const o of obs) if (o.x < 50 + DW - 4 && o.x + o.w > 50 + 4 && y < o.h - 4) return die();
        if (Math.floor(dist) % 50 === 0 && dist > 1 && !over) ctx.combo(Math.floor(dist / 50));
        hud();
      }
      draw(); raf = requestAnimationFrame(loop);
    };
    const kd = (e) => { if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); jump(); } };
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); jump(); }); cv.style.touchAction = 'none';
    document.addEventListener('keydown', kd);
    stage.append(cv, $(`<p class="hint">${T('dino.hint', { n: goal })}</p>`)); hud(); draw(); raf = requestAnimationFrame(loop);
    return () => { over = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); };
  }

  /* ---------- 21. Whack-a-Mole ---------- */
  function mole(stage, ctx) {
    const need = pick([14, 20, 26], ctx.diff), every = pick([800, 650, 520], ctx.diff), life = pick([1300, 1000, 780], ctx.diff);
    let left = 30, hits = 0, pts = 0, combo = 0, over = false, to = [], cells = [];
    const grid = $('<div class="mole-g"></div>');
    const hud = () => ctx.hud([H('score', pts), { t: `${left}s`, low: left <= 5 }, `${hits}/${need}`]);
    for (let i = 0; i < 9; i++) {
      const c = $(`<button class="mole-h" aria-label="Hole ${i + 1}"><span></span></button>`); c.state = null;
      c.onclick = () => {
        if (over || !c.state) return; const s = c.state; c.state = null; c.classList.remove('up', 'bomb'); c.firstChild.textContent = '';
        if (s === 'm') { hits++; combo++; pts += 100 + Math.min(combo, 5) * 10; ctx.sfx('good', combo); ctx.combo(combo); ctx.burst(c, '#ffb454', 12); }
        else { combo = 0; ctx.combo(0); pts = Math.max(0, pts - 150); ctx.sfx('bad'); ctx.shake(grid); ctx.pop(c, '−150', '#ff6b5e'); }
        hud();
      };
      cells.push(c); grid.append(c);
    }
    const spawn = () => {
      if (over) return; const free = cells.filter((c) => !c.state);
      if (free.length) { const c = free[ri(0, free.length - 1)], bomb = RND() < .15; c.state = bomb ? 'b' : 'm'; c.firstChild.textContent = bomb ? '💣' : '🐹'; c.classList.add('up'); c.classList.toggle('bomb', bomb);
        to.push(setTimeout(() => { if (c.state === 'm') combo = 0; c.state = null; c.classList.remove('up', 'bomb'); c.firstChild.textContent = ''; }, life)); }
      to.push(setTimeout(spawn, every * (.7 + RND() * .6)));
    };
    const tm = setInterval(() => { left--; if (left <= 0) { over = true; clearInterval(tm); ctx.end({ win: hits >= need, quality: clamp(hits / (need * 1.6)), score: pts, label: T('mole.lbl', { n: hits }) }); } else hud(); }, 1000);
    stage.append(grid, $(`<p class="hint">${T('mole.hint', { n: need })}</p>`)); hud(); spawn();
    ctx.power({ label: T('pw.secs', { n: 8 }), cost: 12, use: () => { left += 8; hud(); } });
    return () => { over = true; clearInterval(tm); to.forEach(clearTimeout); };
  }

  /* ---------- 23. Reaction Test ---------- */
  function react(stage, ctx) {
    const R = 5, goal = pick([400, 330, 270], ctx.diff);
    let round = 0, times = [], state = 'idle', t0 = 0, to, over = false;
    const box = $('<button class="rx" aria-live="polite"></button>');
    const hud = () => ctx.hud([H('round', `${Math.min(round + 1, R)}/${R}`), times.length ? `${Math.round(times[times.length - 1])} ms` : '']);
    const set = (s, cls, txt) => { state = s; box.className = 'rx ' + cls; box.textContent = txt; };
    const ready = () => { set('wait', 'wait', T('rx.wait')); to = setTimeout(() => { set('go', 'go', T('rx.go')); t0 = performance.now(); }, ri(1200, 3800)); hud(); };
    const done = () => {
      over = true; const avg = times.reduce((a, b) => a + b, 0) / R;
      ctx.end({ win: avg <= goal, quality: clamp(1 - (avg - 180) / 420), score: Math.max(0, Math.round(2000 - avg * 4)), label: T('rx.lbl', { n: Math.round(avg) }) });
    };
    box.onclick = () => {
      if (over) return;
      if (state === 'idle') ready();
      else if (state === 'wait') { clearTimeout(to); ctx.sfx('bad'); ctx.shake(box); set('idle', 'early', T('rx.early')); }
      else if (state === 'go') { const ms = performance.now() - t0; times.push(ms); round++; ctx.sfx('good', round); ctx.burst(box, '#3dd6a5', 14); if (round >= R) { hud(); set('idle', 'idle', `${Math.round(ms)} ms`); setTimeout(done, 700); } else { set('idle', 'idle', T('rx.res', { n: Math.round(ms) })); hud(); } }
    };
    set('idle', 'idle', T('rx.start')); stage.append(box, $(`<p class="hint">${T('rx.hint', { n: goal })}</p>`)); hud();
    return () => { over = true; clearTimeout(to); };
  }

  /* ---------- 24. Fruit Slice ---------- */
  function slice(stage, ctx) {
    const W = 360, VH = 480, need = pick([22, 32, 42], ctx.diff), every = pick([900, 740, 600], ctx.diff), FR = ['🍉', '🍊', '🍎', '🍋', '🍇', '🍓', '🍍', '🥝'], JC = ['#ff5c7a', '#ffa23d', '#ff4d4d', '#f2d45c', '#a56bff', '#ff4d6d', '#f2d45c', '#8bd63d'];
    let items = [], bits = [], trail = [], splats = [], pops = [], cut = 0, pts = 0, lives = 3, left = 50, over = false, raf, last = 0, since = 0, down = false, lp = null, swipe = 0, combo = 0, slow = 0, frenzy = 0, shakeT = 0, sinceCuts = 0;
    const cv = $(`<canvas class="snk slc" width="${W}" height="${VH}" aria-label="Fruit slice"></canvas>`), g = cv.getContext('2d');
    const hud = () => ctx.hud([H('score', pts), { t: `${left}s`, low: left <= 8 }, '♥'.repeat(lives) || '—', `🍉 ${cut}/${need}`]);
    const launch = (n = 1) => { for (let i = 0; i < n; i++) { const x = ri(60, W - 60), roll = RND(), k = roll < .1 ? -1 : roll < .15 && !slow ? -2 : ri(0, FR.length - 1); items.push({ x, y: VH + 30, vx: (W / 2 - x) * .012 + (RND() - .5) * 1.8, vy: -(13 + RND() * 3.4), r: 28, k, a: 0, va: (RND() - .5) * .14 }); } };
    const fin = () => { over = true; cancelAnimationFrame(raf); clearInterval(tm); setTimeout(() => ctx.end({ win: cut >= need, quality: clamp(cut / (need * 1.5)), score: pts, label: T('slc.lbl', { n: cut }) }), 450); };
    const pop = (x, y, txt, col) => pops.push({ x, y, txt, col, l: 1 });
    const hitSeg = (a, b, it) => { const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy || 1, t = clamp(((it.x - a.x) * dx + (it.y - a.y) * dy) / l2); return Math.hypot(a.x + t * dx - it.x, a.y + t * dy - it.y) < it.r + 6; };
    const doCut = (it) => {
      it.dead = true;
      if (it.k === -1) { lives--; combo = 0; ctx.combo(0); ctx.sfx('bad'); ctx.flash('#ff6b5e'); ctx.shake(cv); shakeT = 14; for (let i = 0; i < 24; i++) bits.push({ x: it.x, y: it.y, vx: (RND() - .5) * 14, vy: (RND() - .5) * 14, life: 1, c: i % 2 ? '#ffb454' : '#ff4d4d', r: 3 + RND() * 3 }); pop(it.x, it.y, '💥', '#fff'); hud(); if (lives <= 0) fin(); return; }
      if (it.k === -2) { slow = 4500; ctx.sfx('win'); ctx.flash('#5ad7ff'); pop(it.x, it.y, T('slc.ice'), '#7fe3ff'); for (let i = 0; i < 18; i++) bits.push({ x: it.x, y: it.y, vx: (RND() - .5) * 9, vy: (RND() - .5) * 9, life: 1, c: '#bff4ff', r: 2 + RND() * 3 }); return; }
      cut++; swipe++; sinceCuts++; combo++; const gain = 10 * (1 + Math.floor(swipe / 2)) * (frenzy > 0 ? 2 : 1); pts += gain; ctx.sfx('good', combo); ctx.combo(combo);
      pop(it.x, it.y - 14, '+' + gain, frenzy > 0 ? '#ffd23d' : '#fff');
      bits.push({ x: it.x, y: it.y, vx: -2.6, vy: -2.4, life: 1, e: FR[it.k], rot: -.05 }, { x: it.x, y: it.y, vx: 2.6, vy: -2.4, life: 1, e: FR[it.k], rot: .05 });
      for (let i = 0; i < 16; i++) bits.push({ x: it.x, y: it.y, vx: (RND() - .5) * 10, vy: (RND() - .5) * 10 - 2, life: 1, c: JC[it.k], r: 2 + RND() * 4 });
      splats.push({ x: it.x, y: it.y, r: 22 + RND() * 16, c: JC[it.k], l: 1 });
      if (swipe === 3) { ctx.pop(cv, T('slc.multi'), '#ffb454'); pts += 50; pop(W / 2, VH / 2, T('slc.multi') + ' +50', '#ffb454'); }
      if (sinceCuts >= 12) { sinceCuts = 0; frenzy = 5000; ctx.flash('#ffd23d'); ctx.sfx('win'); ctx.pop(cv, T('slc.frenzy'), '#ffd23d'); launch(4); }
      hud(); if (cut >= need) fin();
    };
    const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * VH / r.height }; };
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); down = true; swipe = 0; lp = pt(e); cv.setPointerCapture && cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', (e) => { if (!down || over) return; const p = pt(e); trail.push({ ...p, t: performance.now() }); if (lp) items.forEach((it) => { if (!it.dead && hitSeg(lp, p, it)) doCut(it); }); lp = p; });
    const up = () => { down = false; lp = null; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.style.touchAction = 'none';
    const draw = (now) => {
      const bg = g.createRadialGradient(W / 2, VH * .4, 40, W / 2, VH / 2, VH * .8); bg.addColorStop(0, slow > 0 ? '#1d3a52' : frenzy > 0 ? '#4a2a14' : '#2b1a34'); bg.addColorStop(1, '#0d0912'); g.fillStyle = bg; g.fillRect(0, 0, W, VH);
      g.save(); if (shakeT > 0) g.translate((RND() - .5) * shakeT, (RND() - .5) * shakeT);
      g.globalAlpha = .06; g.fillStyle = '#fff'; for (let i = 0; i < 6; i++) g.fillRect(0, 60 + i * 80, W, 2); g.globalAlpha = 1;
      splats.forEach((s) => { g.globalAlpha = s.l * .35; g.fillStyle = s.c; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.arc(s.x + s.r * .7, s.y + 4, s.r * .5, 0, 7); g.arc(s.x - s.r * .6, s.y - 6, s.r * .4, 0, 7); g.fill(); }); g.globalAlpha = 1;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      items.forEach((it) => { g.save(); g.translate(it.x, it.y); g.rotate(it.a); g.shadowColor = it.k === -1 ? '#ff2d4f' : it.k === -2 ? '#7fe3ff' : 'rgba(255,255,255,.35)'; g.shadowBlur = it.k < 0 ? 22 : 10; g.font = '54px serif'; g.fillText(it.k === -1 ? '💣' : it.k === -2 ? '🧊' : FR[it.k], 0, 2); g.restore(); });
      bits.forEach((b) => { g.globalAlpha = clamp(b.life); if (b.e) { g.save(); g.translate(b.x, b.y); g.rotate(b.rot * (1 - b.life) * 40); g.font = '40px serif'; g.fillText(b.e, 0, 0); g.restore(); } else { g.fillStyle = b.c; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.fill(); } }); g.globalAlpha = 1;
      trail = trail.filter((p) => now - p.t < 200);
      for (let i = 1; i < trail.length; i++) { const a = 1 - (now - trail[i].t) / 200; g.lineCap = 'round'; g.strokeStyle = `rgba(255,255,255,${a * .35})`; g.lineWidth = 14 * a; g.beginPath(); g.moveTo(trail[i - 1].x, trail[i - 1].y); g.lineTo(trail[i].x, trail[i].y); g.stroke(); g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = 4 * a + 1; g.stroke(); }
      pops.forEach((p) => { g.globalAlpha = clamp(p.l); g.fillStyle = p.col; g.font = '800 22px sans-serif'; g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 4; g.strokeText(p.txt, p.x, p.y - (1 - p.l) * 40); g.fillText(p.txt, p.x, p.y - (1 - p.l) * 40); }); g.globalAlpha = 1;
      if (frenzy > 0) { g.fillStyle = '#ffd23d'; g.font = '900 18px sans-serif'; g.fillText('⚡ ' + T('slc.frenzy') + ' x2', W / 2, 24); }
      if (slow > 0) { g.fillStyle = '#7fe3ff'; g.font = '900 16px sans-serif'; g.fillText('❄ ' + (slow / 1000).toFixed(1) + 's', W / 2, frenzy > 0 ? 46 : 24); }
      g.restore();
    };
    const loop = (now) => {
      if (over) return; const raw = Math.min((now - (last || now)) / 16.67, 2), dt = raw * (slow > 0 ? .45 : 1); last = now; since += dt * 16.67; slow = Math.max(0, slow - raw * 16.67); frenzy = Math.max(0, frenzy - raw * 16.67); shakeT = Math.max(0, shakeT - raw);
      if (since > (frenzy > 0 ? every * .5 : every)) { since = 0; launch(RND() < .3 ? ri(2, 3) : 1); }
      items.forEach((it) => { it.x += it.vx * dt; it.y += it.vy * dt; it.vy += .22 * dt; it.a += it.va * dt; if (it.y > VH + 40 && it.vy > 0 && !it.dead) { it.dead = true; if (it.k >= 0) combo = 0; } }); items = items.filter((it) => !it.dead);
      bits.forEach((b) => { b.x += b.vx * dt; b.y += b.vy * dt; b.vy += .25 * dt; b.life -= .02 * dt; }); bits = bits.filter((b) => b.life > 0);
      splats.forEach((s) => { s.l -= .004 * raw; }); splats = splats.filter((s) => s.l > 0); pops.forEach((p) => { p.l -= .025 * raw; }); pops = pops.filter((p) => p.l > 0);
      draw(performance.now()); raf = requestAnimationFrame(loop);
    };
    const tm = setInterval(() => { left--; if (left <= 0) fin(); else hud(); }, 1000);
    stage.append(cv, $(`<p class="hint">${T('slc.hint', { n: need })}</p>`)); hud(); raf = requestAnimationFrame(loop);
    ctx.power({ label: T('pw.life'), cost: 15, use: () => { if (lives < 5) { lives++; hud(); } } });
    return () => { over = true; cancelAnimationFrame(raf); clearInterval(tm); };
  }

  /* ---------- 25. Brick Breaker ---------- */
  function brick(stage, ctx) {
    const W = 360, VH = 480, rows = pick([4, 5, 6], ctx.diff), cols = 8, bw = W / cols, bh = 20, sp0 = pick([5, 6, 7], ctx.diff), pw = pick([96, 80, 66], ctx.diff), PY = VH - 36, R = 7, PAL = ['#ff5c7a', '#ffa23d', '#f2d45c', '#3dd6a5', '#5aa9ff', '#a56bff'];
    let bricks = [], px = W / 2, ball = { x: W / 2, y: PY - R - 2, vx: 0, vy: 0 }, launched = false, lives = 3, pts = 0, combo = 0, over = false, raf, last = 0, speed = sp0, total;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) bricks.push({ x: c * bw + 2, y: 50 + r * (bh + 4), w: bw - 4, h: bh, hp: r === 0 && ctx.diff > 0 ? 2 : 1, col: PAL[r % PAL.length] });
    total = bricks.length;
    const cv = $(`<canvas class="snk brk" width="${W}" height="${VH}" aria-label="Brick breaker"></canvas>`), g = cv.getContext('2d');
    const hud = () => ctx.hud([H('score', pts), '♥'.repeat(lives) || '—', `${total - bricks.length}/${total}`]);
    const fin = (win) => { over = true; cancelAnimationFrame(raf); ctx.sfx(win ? 'win' : 'bad'); setTimeout(() => ctx.end({ win, quality: win ? clamp(.5 + lives / 6) : clamp((total - bricks.length) / total * .6), score: pts + lives * 200, label: T('brk.lbl', { n: total - bricks.length }) }), 500); };
    const launch = () => { if (launched || over) return; launched = true; const a = (RND() - .5) * .8; ball.vx = speed * Math.sin(a); ball.vy = -speed * Math.cos(a); ctx.sfx('tap'); };
    const draw = () => {
      g.fillStyle = '#12151b'; g.fillRect(0, 0, W, VH);
      bricks.forEach((b) => { g.fillStyle = b.col; g.globalAlpha = b.hp > 1 ? 1 : .85; g.beginPath(); g.roundRect(b.x, b.y, b.w, b.h, 4); g.fill(); if (b.hp > 1) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); } }); g.globalAlpha = 1;
      g.fillStyle = '#d6ff3d'; g.beginPath(); g.roundRect(px - pw / 2, PY, pw, 12, 6); g.fill();
      g.fillStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 10; g.beginPath(); g.arc(ball.x, ball.y, R, 0, 7); g.fill(); g.shadowBlur = 0;
    };
    const loop = (now) => {
      if (over) return; const dt = Math.min((now - (last || now)) / 16.67, 2); last = now;
      if (!launched) { ball.x = px; ball.y = PY - R - 2; }
      else {
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.x < R) { ball.x = R; ball.vx = Math.abs(ball.vx); } if (ball.x > W - R) { ball.x = W - R; ball.vx = -Math.abs(ball.vx); } if (ball.y < R) { ball.y = R; ball.vy = Math.abs(ball.vy); }
        if (ball.vy > 0 && ball.y + R >= PY && ball.y + R <= PY + 14 && ball.x >= px - pw / 2 - R && ball.x <= px + pw / 2 + R) { const a = clamp((ball.x - px) / (pw / 2), -1, 1) * 1.05; ball.vx = speed * Math.sin(a); ball.vy = -speed * Math.cos(a); ball.y = PY - R; combo = 0; ctx.sfx('tap'); }
        for (const b of bricks) { const nx = clamp(ball.x, b.x, b.x + b.w), ny = clamp(ball.y, b.y, b.y + b.h), dx = ball.x - nx, dy = ball.y - ny;
          if (dx * dx + dy * dy < R * R) { if (Math.abs(dx) > Math.abs(dy)) ball.vx = -ball.vx; else ball.vy = -ball.vy; b.hp--; combo++; pts += 10 * Math.min(combo, 8); ctx.sfx('good', combo); ctx.combo(combo); if (b.hp <= 0) { bricks.splice(bricks.indexOf(b), 1); speed = Math.min(sp0 + 2.5, speed + .06); } hud(); break; } }
        if (!bricks.length) return fin(true);
        if (ball.y > VH + R) { lives--; combo = 0; ctx.combo(0); ctx.sfx('bad'); ctx.shake(cv); launched = false; hud(); if (lives <= 0) return fin(false); }
      }
      draw(); raf = requestAnimationFrame(loop);
    };
    const mv = (e) => { const r = cv.getBoundingClientRect(); px = clamp((e.clientX - r.left) * W / r.width, pw / 2, W - pw / 2); };
    cv.addEventListener('pointermove', mv); cv.addEventListener('pointerdown', (e) => { e.preventDefault(); mv(e); launch(); }); cv.style.touchAction = 'none';
    const kd = (e) => { if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); px = clamp(px - 26, pw / 2, W - pw / 2); } else if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); px = clamp(px + 26, pw / 2, W - pw / 2); } else if (e.key === ' ') { e.preventDefault(); launch(); } };
    document.addEventListener('keydown', kd);
    stage.append(cv, $(`<p class="hint">${T('brk.hint')}</p>`)); hud(); draw(); raf = requestAnimationFrame(loop);
    ctx.power({ label: T('pw.life'), cost: 15, use: () => { if (lives < 5) { lives++; hud(); } } });
    return () => { over = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); };
  }

  /* ---------- 26. Block Drop (falling blocks) ---------- */
  function blocks(stage, ctx) {
    const CW = 10, CH = 18, S = 24, goal = pick([5, 8, 12], ctx.diff), base = pick([750, 560, 400], ctx.diff);
    const SH = { I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], O: [[1, 1], [1, 1]], T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]] };
    const COL = { I: '#4fd1e0', O: '#f2d45c', T: '#a56bff', S: '#3dd6a5', Z: '#ff5c7a', J: '#5aa9ff', L: '#ffa23d' };
    let board = Array.from({ length: CH }, () => Array(CW).fill('')), bag = [], cur, nxt, lines = 0, pts = 0, over = false, raf, last = 0, acc = 0, combo = 0;
    const cv = $(`<canvas class="snk blk" width="${CW * S + 84}" height="${CH * S}" aria-label="Block drop"></canvas>`), g = cv.getContext('2d');
    const take = () => { if (!bag.length) bag = shuffle(Object.keys(SH)); const k = bag.pop(); return { k, m: SH[k], x: Math.floor((CW - SH[k].length) / 2), y: 0 }; };
    const rot = (m) => m[0].map((_, i) => m.map((r) => r[i]).reverse());
    const hit = (m, x, y) => m.some((r, j) => r.some((v, i) => v && (x + i < 0 || x + i >= CW || y + j >= CH || (y + j >= 0 && board[y + j][x + i]))));
    const hud = () => ctx.hud([H('score', pts), `${T('hud.lines')} ${lines}/${goal}`]);
    cur = take(); nxt = take();
    const fin = (win) => { over = true; cancelAnimationFrame(raf); ctx.sfx(win ? 'win' : 'bad'); setTimeout(() => ctx.end({ win, quality: clamp(lines / (goal * 1.3)), score: pts, label: T('blk.lbl', { n: lines }) }), 500); };
    const lock = () => {
      cur.m.forEach((r, j) => r.forEach((v, i) => { if (v && cur.y + j >= 0) board[cur.y + j][cur.x + i] = cur.k; }));
      const keep = board.filter((r) => r.some((c) => !c)), n = CH - keep.length;
      if (n) { board = [...Array.from({ length: n }, () => Array(CW).fill('')), ...keep]; lines += n; combo++; pts += [0, 100, 300, 500, 800][n] + combo * 20; ctx.sfx('good', combo); ctx.combo(combo); if (n >= 3) ctx.flash('#a56bff'); } else { combo = 0; ctx.combo(0); ctx.sfx('tap'); }
      hud(); if (lines >= goal) return fin(true);
      cur = nxt; nxt = take(); if (hit(cur.m, cur.x, cur.y)) fin(false);
    };
    const move = (dx) => { if (over || hit(cur.m, cur.x + dx, cur.y)) return; cur.x += dx; draw(); };
    const turn = () => { if (over) return; const m = rot(cur.m); for (const k of [0, -1, 1, -2, 2]) if (!hit(m, cur.x + k, cur.y)) { cur.m = m; cur.x += k; ctx.sfx('tap'); draw(); return; } };
    const drop = () => { if (over) return false; if (hit(cur.m, cur.x, cur.y + 1)) { lock(); return false; } cur.y++; return true; };
    const hard = () => { if (over) return; let n = 0; while (!hit(cur.m, cur.x, cur.y + 1)) { cur.y++; n++; } pts += n * 2; lock(); draw(); };
    const cell = (x, y, c, a = 1) => { g.globalAlpha = a; g.fillStyle = c; g.beginPath(); g.roundRect(x * S + 1, y * S + 1, S - 2, S - 2, 5); g.fill(); g.globalAlpha = 1; };
    const draw = () => {
      g.fillStyle = '#12151b'; g.fillRect(0, 0, cv.width, cv.height); g.fillStyle = 'rgba(255,255,255,.04)'; for (let x = 0; x < CW; x++) for (let y = 0; y < CH; y++) if ((x + y) % 2) g.fillRect(x * S, y * S, S, S);
      board.forEach((r, y) => r.forEach((k, x) => k && cell(x, y, COL[k])));
      if (!over) { let gy = cur.y; while (!hit(cur.m, cur.x, gy + 1)) gy++; cur.m.forEach((r, j) => r.forEach((v, i) => v && cell(cur.x + i, gy + j, COL[cur.k], .2))); cur.m.forEach((r, j) => r.forEach((v, i) => v && cell(cur.x + i, cur.y + j, COL[cur.k]))); }
      g.fillStyle = 'rgba(255,255,255,.5)'; g.font = '600 12px sans-serif'; g.textAlign = 'center'; g.fillText(T('blk.next'), CW * S + 42, 24);
      nxt.m.forEach((r, j) => r.forEach((v, i) => { if (v) { g.fillStyle = COL[nxt.k]; g.beginPath(); g.roundRect(CW * S + 8 + i * 18, 40 + j * 18, 16, 16, 4); g.fill(); } }));
    };
    const loop = (now) => { if (over) return; const dt = now - (last || now); last = now; acc += dt; const iv = Math.max(110, base - lines * 28); if (acc >= iv) { acc = 0; drop(); } draw(); raf = requestAnimationFrame(loop); };
    const kd = (e) => { const k = e.key; if (k === 'ArrowLeft' || k === 'a') { e.preventDefault(); move(-1); } else if (k === 'ArrowRight' || k === 'd') { e.preventDefault(); move(1); } else if (k === 'ArrowUp' || k === 'w') { e.preventDefault(); turn(); } else if (k === 'ArrowDown' || k === 's') { e.preventDefault(); if (drop()) pts++; } else if (k === ' ') { e.preventDefault(); hard(); } };
    document.addEventListener('keydown', kd);
    const pad = $('<div class="snk-pad"><div><button aria-label="Left">◀</button><button aria-label="Rotate">⟳</button><button aria-label="Right">▶</button><button aria-label="Down">▼</button><button aria-label="Drop">⤓</button></div></div>');
    const acts = [() => move(-1), turn, () => move(1), () => { drop(); }, hard]; [...pad.querySelectorAll('button')].forEach((b, i) => { b.onclick = acts[i]; });
    stage.append(cv, pad, $(`<p class="hint">${T('blk.hint', { n: goal })}</p>`)); hud(); draw(); raf = requestAnimationFrame(loop);
    ctx.power({ label: T('pw.clear'), cost: 20, use: () => { if (over) return; board = [...Array.from({ length: 4 }, () => Array(CW).fill('')), ...board.slice(0, CH - 4)]; draw(); } });
    return () => { over = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); };
  }

  /* ---------- 27. Doodle Hop ---------- */
  function hop(stage, ctx) {
    const W = 360, VH = 480, goal = pick([60, 120, 200], ctx.diff), gapMax = pick([80, 96, 110], ctx.diff);
    let px = W / 2, py = VH - 90, vx = 0, vy = -10, plats = [], climbed = 0, topY = VH, over = false, raf, last = 0, tx = null, keys = 0, combo = 0;
    const cv = $(`<canvas class="snk hop" width="${W}" height="${VH}" aria-label="Doodle hop"></canvas>`), g = cv.getContext('2d');
    const hud = () => ctx.hud([H('score', `${Math.floor(climbed / 8)} m`), `${T('hud.goal')} ${goal} m`]);
    const add = (y, first) => { const r = RND(), type = first ? 'n' : r < .14 ? 'm' : r < .24 ? 'b' : r < .3 ? 's' : 'n'; plats.push({ x: ri(0, W - 64), y, w: 64, t: type, d: RND() < .5 ? 1 : -1, gone: false }); };
    plats.push({ x: W / 2 - 32, y: VH - 50, w: 64, t: 'n', d: 1 }); topY = VH - 50;
    while (topY > -40) { topY -= ri(50, gapMax); add(topY); }
    const fin = (win) => { over = true; cancelAnimationFrame(raf); ctx.sfx(win ? 'win' : 'bad'); if (!win) ctx.shake(cv); setTimeout(() => ctx.end({ win, quality: clamp(climbed / 8 / (goal * 1.3)), score: Math.floor(climbed) , label: T('hop.lbl', { n: Math.floor(climbed / 8) }) }), 500); };
    const draw = () => {
      const bg = g.createLinearGradient(0, 0, 0, VH); bg.addColorStop(0, '#101a2e'); bg.addColorStop(1, '#1f2a1c'); g.fillStyle = bg; g.fillRect(0, 0, W, VH);
      g.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 24; i++) g.fillRect((i * 97) % W, (i * 53 + climbed * .15) % VH, 2, 2);
      plats.forEach((p) => { if (p.gone) return; g.fillStyle = p.t === 'b' ? '#b0703d' : p.t === 'm' ? '#5aa9ff' : '#3dd6a5'; g.beginPath(); g.roundRect(p.x, p.y, p.w, 12, 6); g.fill(); if (p.t === 's') { g.fillStyle = '#ff6b5e'; g.fillRect(p.x + p.w / 2 - 8, p.y - 8, 16, 8); } });
      g.fillStyle = '#d6ff3d'; g.beginPath(); g.roundRect(px - 14, py - 28, 28, 28, 9); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(px - 5, py - 18, 4.500, 0, 7); g.arc(px + 6, py - 18, 4.500, 0, 7); g.fill(); g.fillStyle = '#14170a'; g.beginPath(); g.arc(px - 4 + Math.sign(vx), py - 18, 2, 0, 7); g.arc(px + 7 + Math.sign(vx), py - 18, 2, 0, 7); g.fill();
    };
    const loop = (now) => {
      if (over) return; const dt = Math.min((now - (last || now)) / 16.67, 2); last = now;
      const want = tx != null ? clamp((tx - px) / 20, -6, 6) : keys * 5; vx += (want - vx) * .25 * dt; px += vx * dt; if (px < -10) px = W + 10; if (px > W + 10) px = -10;
      const prev = py; vy += .36 * dt; py += vy * dt;
      plats.forEach((p) => { if (p.t === 'm') { p.x += p.d * 1.4 * dt; if (p.x < 0 || p.x + p.w > W) p.d *= -1; } });
      if (vy > 0) for (const p of plats) { if (p.gone) continue; if (prev <= p.y + 2 && py >= p.y && px > p.x - 8 && px < p.x + p.w + 8) { if (p.t === 'b') { p.gone = true; ctx.sfx('bad'); continue; } vy = p.t === 's' ? -17 : -10.6; combo = p.t === 's' ? combo + 1 : 0; ctx.sfx(p.t === 's' ? 'win' : 'tap'); if (p.t === 's') ctx.pop(cv, T('hop.spring'), '#ff6b5e'); break; } }
      if (py < 220) { const d = 220 - py; py = 220; climbed += d; plats.forEach((p) => { p.y += d; }); topY += d; while (topY > -40) { topY -= ri(50, gapMax + Math.min(climbed / 60, 22)); add(topY); } plats = plats.filter((p) => p.y < VH + 20); hud(); if (climbed / 8 >= goal) return fin(true); }
      if (py > VH + 40) return fin(false);
      draw(); raf = requestAnimationFrame(loop);
    };
    const pt = (e) => { const r = cv.getBoundingClientRect(); tx = (e.clientX - r.left) * W / r.width; };
    cv.addEventListener('pointermove', pt); cv.addEventListener('pointerdown', pt); cv.style.touchAction = 'none';
    const kd = (e) => { if (e.key === 'ArrowLeft' || e.key === 'a') { keys = -1; tx = null; e.preventDefault(); } else if (e.key === 'ArrowRight' || e.key === 'd') { keys = 1; tx = null; e.preventDefault(); } }, ku = (e) => { if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) keys = 0; };
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
    stage.append(cv, $(`<p class="hint">${T('hop.hint', { n: goal })}</p>`)); hud(); draw(); raf = requestAnimationFrame(loop);
    return () => { over = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); };
  }

  /* ---------- 28. Space Blaster ---------- */
  function blaster(stage, ctx) {
    const W = 360, VH = 480, goal = pick([25, 40, 60], ctx.diff), spawnMs = pick([950, 760, 600], ctx.diff);
    let sx = W / 2, tgt = W / 2, bullets = [], foes = [], eb = [], fx = [], pups = [], kills = 0, pts = 0, lives = 3, over = false, raf, last = 0, shotT = 0, spawnT = 0, triple = 0, inv = 0, combo = 0;
    const cv = $(`<canvas class="snk blt" width="${W}" height="${VH}" aria-label="Space blaster"></canvas>`), g = cv.getContext('2d');
    const hud = () => ctx.hud([H('score', pts), '♥'.repeat(lives) || '—', `${kills}/${goal}`]);
    const boom = (x, y, c) => { for (let i = 0; i < 12; i++) fx.push({ x, y, vx: (RND() - .5) * 7, vy: (RND() - .5) * 7, l: 1, c }); };
    const fin = (win) => { over = true; cancelAnimationFrame(raf); ctx.sfx(win ? 'win' : 'bad'); setTimeout(() => ctx.end({ win, quality: clamp(kills / (goal * 1.2)), score: pts, label: T('blt.lbl', { n: kills }) }), 500); };
    const draw = (now) => {
      g.fillStyle = '#080a14'; g.fillRect(0, 0, W, VH); g.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 40; i++) g.fillRect((i * 83) % W, (i * 41 + now * (.02 + (i % 3) * .02)) % VH, 1.500, 1.500 + (i % 3));
      pups.forEach((p) => { g.fillStyle = '#f2d45c'; g.beginPath(); g.arc(p.x, p.y, 10, 0, 7); g.fill(); g.fillStyle = '#14170a'; g.font = '700 11px sans-serif'; g.textAlign = 'center'; g.fillText('x3', p.x, p.y + 4); });
      foes.forEach((f) => { g.fillStyle = f.hp > 1 ? '#ff7aa8' : '#ff6b5e'; g.beginPath(); g.moveTo(f.x, f.y + f.r); g.lineTo(f.x - f.r, f.y - f.r * .6); g.lineTo(f.x, f.y - f.r * .2); g.lineTo(f.x + f.r, f.y - f.r * .6); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.fillRect(f.x - 4, f.y - 4, 8, 3); });
      g.fillStyle = '#ffb454'; bullets.forEach((b) => g.fillRect(b.x - 2, b.y - 8, 4, 12)); g.fillStyle = '#ff7aa8'; eb.forEach((b) => { g.beginPath(); g.arc(b.x, b.y, 4, 0, 7); g.fill(); });
      fx.forEach((p) => { g.globalAlpha = clamp(p.l); g.fillStyle = p.c; g.fillRect(p.x, p.y, 3, 3); }); g.globalAlpha = 1;
      if (inv <= 0 || Math.floor(now / 80) % 2) { g.fillStyle = '#d6ff3d'; g.beginPath(); g.moveTo(sx, VH - 62); g.lineTo(sx - 18, VH - 24); g.lineTo(sx, VH - 32); g.lineTo(sx + 18, VH - 24); g.closePath(); g.fill(); g.fillStyle = '#4fd1e0'; g.beginPath(); g.arc(sx, VH - 40, 4, 0, 7); g.fill(); }
    };
    const loop = (now) => {
      if (over) return; const dt = Math.min((now - (last || now)) / 16.67, 2), ms = dt * 16.67; last = now; inv -= ms; triple -= ms;
      sx += (tgt - sx) * .25 * dt; shotT += ms; if (shotT > 190) { shotT = 0; bullets.push({ x: sx, y: VH - 66 }); if (triple > 0) { bullets.push({ x: sx - 14, y: VH - 58, vx: -1.3 }, { x: sx + 14, y: VH - 58, vx: 1.3 }); } ctx.sfx('tap'); }
      spawnT += ms; if (spawnT > spawnMs) { spawnT = 0; const tank = RND() < .22 + ctx.diff * .06; foes.push({ x: ri(30, W - 30), y: -20, r: tank ? 20 : 15, hp: tank ? 3 : 1, vx: (RND() - .5) * 1.6, ph: RND() * 6, sh: ri(40, 140) }); }
      bullets.forEach((b) => { b.y -= 9 * dt; b.x += (b.vx || 0) * dt; }); bullets = bullets.filter((b) => b.y > -10);
      eb.forEach((b) => { b.y += 4.2 * dt; }); eb = eb.filter((b) => b.y < VH + 10);
      foes.forEach((f) => { f.y += (1.1 + kills * .012) * dt; f.x += Math.sin(f.y / 30 + f.ph) * 1.2 * dt + f.vx * .3 * dt; f.sh--; if (f.sh === 0 && ctx.diff > 0) eb.push({ x: f.x, y: f.y + f.r }); });
      for (const f of foes) for (const b of bullets) if (!b.d && Math.abs(b.x - f.x) < f.r && Math.abs(b.y - f.y) < f.r) { b.d = 1; f.hp--; if (f.hp <= 0) { f.dead = 1; kills++; combo++; pts += 100; boom(f.x, f.y, '#ff6b5e'); ctx.sfx('good', combo); ctx.combo(combo); if (RND() < .1) pups.push({ x: f.x, y: f.y }); hud(); } }
      bullets = bullets.filter((b) => !b.d); foes = foes.filter((f) => !f.dead);
      pups.forEach((p) => { p.y += 2 * dt; if (Math.hypot(p.x - sx, p.y - (VH - 40)) < 26) { p.d = 1; triple = 8000; ctx.sfx('win'); ctx.pop(cv, T('blt.triple'), '#f2d45c'); } }); pups = pups.filter((p) => !p.d && p.y < VH + 20);
      if (inv <= 0) { const hitE = eb.find((b) => Math.hypot(b.x - sx, b.y - (VH - 40)) < 18) || foes.find((f) => Math.hypot(f.x - sx, f.y - (VH - 40)) < f.r + 14);
        if (hitE) { lives--; inv = 1600; combo = 0; ctx.combo(0); ctx.sfx('bad'); ctx.shake(cv); boom(sx, VH - 40, '#d6ff3d'); eb = eb.filter((b) => b !== hitE); foes = foes.filter((f) => f !== hitE); hud(); if (lives <= 0) return fin(false); } }
      foes = foes.filter((f) => { if (f.y > VH + 20) { combo = 0; return false; } return true; });
      fx.forEach((p) => { p.x += p.vx; p.y += p.vy; p.l -= .03 * dt; }); fx = fx.filter((p) => p.l > 0);
      if (kills >= goal) return fin(true);
      draw(now); raf = requestAnimationFrame(loop);
    };
    const pt = (e) => { const r = cv.getBoundingClientRect(); tgt = clamp((e.clientX - r.left) * W / r.width, 20, W - 20); };
    cv.addEventListener('pointermove', pt); cv.addEventListener('pointerdown', pt); cv.style.touchAction = 'none';
    const kd = (e) => { if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); tgt = clamp(tgt - 40, 20, W - 20); } else if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); tgt = clamp(tgt + 40, 20, W - 20); } };
    document.addEventListener('keydown', kd);
    stage.append(cv, $(`<p class="hint">${T('blt.hint', { n: goal })}</p>`)); hud(); draw(0); raf = requestAnimationFrame(loop);
    ctx.power({ label: T('pw.life'), cost: 15, use: () => { if (lives < 5) { lives++; hud(); } } });
    return () => { over = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); };
  }

  /* ---------- 29. Bubble Pop ---------- */
  function bubble(stage, ctx) {
    const W = 360, VH = 480, R = 16, D = 32, COLS = 10, X0 = 28, RH = 28, LIM = 13, nCol = pick([4, 5, 6], ctx.diff), every = pick([8, 6, 5], ctx.diff), PAL = ['#ff5c7a', '#ffa23d', '#f2d45c', '#3dd6a5', '#5aa9ff', '#a56bff'], SY = VH - 40;
    let grid = [], par = 0, shot = null, cur = ri(0, nCol - 1), nxt = ri(0, nCol - 1), ang = -Math.PI / 2, misses = 0, pts = 0, over = false, raf, combo = 0, falling = [];
    const rnd = () => ri(0, nCol - 1), ox = (r) => X0 + (((r + par) % 2) ? D / 2 : 0), cx = (r, c) => ox(r) + c * D, cy = (r) => 20 + r * RH;
    for (let r = 0; r < 6; r++) grid.push(Array.from({ length: COLS }, () => rnd()));
    const cv = $(`<canvas class="snk bub" width="${W}" height="${VH}" aria-label="Bubble pop"></canvas>`), g = cv.getContext('2d');
    const count = () => grid.reduce((a, r) => a + r.filter((x) => x != null).length, 0);
    const hud = () => ctx.hud([H('score', pts), `${T('hud.left')} ${count()}`]);
    const nb = (r, c) => { const o = ((r + par) % 2) ? 1 : 0, d = [[0, -1], [0, 1], [-1, o ? 0 : -1], [-1, o ? 1 : 0], [1, o ? 0 : -1], [1, o ? 1 : 0]]; return d.map(([dr, dc]) => [r + dr, c + dc]).filter(([a, b]) => a >= 0 && b >= 0 && b < COLS && a < grid.length); };
    const flood = (r, c, pred) => { const seen = new Set([r + ',' + c]), q = [[r, c]]; while (q.length) { const [a, b] = q.pop(); nb(a, b).forEach(([x, y]) => { const k = x + ',' + y; if (!seen.has(k) && grid[x][y] != null && pred(grid[x][y])) { seen.add(k); q.push([x, y]); } }); } return [...seen].map((k) => k.split(',').map(Number)); };
    const fin = (win) => { over = true; cancelAnimationFrame(raf); ctx.sfx(win ? 'win' : 'bad'); setTimeout(() => ctx.end({ win, quality: win ? clamp(1 - misses / 40) : .2, score: pts, label: T('bub.lbl', { n: pts }) }), 500); };
    const settle = (x, y) => {
      let r = clamp(Math.round((y - 20) / RH), 0, LIM), c = clamp(Math.round((x - ox(r)) / D), 0, COLS - 1);
      while (grid.length <= r) grid.push(Array(COLS).fill(null));
      if (grid[r][c] != null) { const alt = nb(r, c).concat(r + 1 < LIM + 2 ? [[r + 1, c]] : []).filter(([a, b]) => { while (grid.length <= a) grid.push(Array(COLS).fill(null)); return grid[a][b] == null; }).sort((p, q) => Math.hypot(cx(p[0], p[1]) - x, cy(p[0]) - y) - Math.hypot(cx(q[0], q[1]) - x, cy(q[0]) - y))[0]; if (!alt) return fin(false); [r, c] = alt; }
      grid[r][c] = shot.k; const grp = flood(r, c, (k) => k === shot.k);
      if (grp.length >= 3) { combo++; grp.forEach(([a, b]) => { falling.push({ x: cx(a, b), y: cy(a), vy: -2, k: grid[a][b] }); grid[a][b] = null; }); pts += grp.length * 10;
        const keep = new Set(); grid[0].forEach((v, c0) => { if (v != null) flood(0, c0, () => true).forEach(([a, b]) => keep.add(a + ',' + b)); });
        let drop = 0; grid.forEach((row, a) => row.forEach((v, b) => { if (v != null && !keep.has(a + ',' + b)) { falling.push({ x: cx(a, b), y: cy(a), vy: 0, k: v }); row[b] = null; drop++; } })); pts += drop * 20;
        ctx.sfx('good', combo); ctx.combo(combo); if (drop) ctx.pop(cv, T('bub.drop', { n: drop }), '#ffb454'); }
      else { combo = 0; ctx.combo(0); misses++; ctx.sfx('tap'); if (misses % every === 0) { par = 1 - par; grid.unshift(Array.from({ length: COLS }, () => rnd())); ctx.shake(cv); } }
      while (grid.length && grid[grid.length - 1].every((x) => x == null)) grid.pop();
      shot = null; cur = nxt; const have = [...new Set(grid.flat().filter((x) => x != null))]; nxt = have.length ? have[ri(0, have.length - 1)] : rnd(); hud();
      if (!count()) return fin(true); if (grid.length > LIM) fin(false);
    };
    const draw = () => {
      g.fillStyle = '#12151b'; g.fillRect(0, 0, W, VH); g.strokeStyle = 'rgba(255,107,94,.4)'; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(0, 20 + LIM * RH - 6); g.lineTo(W, 20 + LIM * RH - 6); g.stroke(); g.setLineDash([]);
      const bub = (x, y, k, a = 1) => { g.globalAlpha = a; g.fillStyle = PAL[k]; g.beginPath(); g.arc(x, y, R - 1, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(x - 5, y - 5, 4, 0, 7); g.fill(); g.globalAlpha = 1; };
      grid.forEach((row, r) => row.forEach((k, c) => k != null && bub(cx(r, c), cy(r), k))); falling.forEach((f) => bub(f.x, f.y, f.k, clamp(1 - (f.y - 0) / (VH * 1.1) + .3)));
      if (!shot) { g.strokeStyle = 'rgba(255,255,255,.35)'; g.setLineDash([4, 6]); g.beginPath(); g.moveTo(W / 2, SY); g.lineTo(W / 2 + Math.cos(ang) * 120, SY + Math.sin(ang) * 120); g.stroke(); g.setLineDash([]); bub(W / 2, SY, cur); } else bub(shot.x, shot.y, shot.k);
      bub(W / 2 - 60, SY + 6, nxt, .6);
    };
    const loop = () => {
      if (over) return;
      if (shot) { for (let s = 0; s < 3 && shot; s++) { shot.x += shot.vx; shot.y += shot.vy; if (shot.x < R) { shot.x = R; shot.vx = Math.abs(shot.vx); } if (shot.x > W - R) { shot.x = W - R; shot.vx = -Math.abs(shot.vx); }
        let stop = shot.y <= 20 + R - 8; if (!stop) grid.forEach((row, r) => row.forEach((k, c) => { if (k != null && Math.hypot(cx(r, c) - shot.x, cy(r) - shot.y) < D * .88) stop = true; })); if (stop) { settle(shot.x, shot.y); if (over) return; } } }
      falling.forEach((f) => { f.vy += .5; f.y += f.vy; }); falling = falling.filter((f) => f.y < VH + 30);
      draw(); raf = requestAnimationFrame(loop);
    };
    const aim = (e) => { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * VH / r.height; ang = Math.min(Math.atan2(y - SY, x - W / 2), -.2); if (ang > -.2 || y > SY) ang = x < W / 2 ? -Math.PI + .2 : -.2; };
    const fire = () => { if (shot || over) return; shot = { x: W / 2, y: SY, vx: Math.cos(ang) * 5.4, vy: Math.sin(ang) * 5.4, k: cur }; ctx.sfx('tap'); };
    cv.addEventListener('pointermove', aim); cv.addEventListener('pointerdown', (e) => { aim(e); fire(); }); cv.style.touchAction = 'none';
    const kd = (e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); ang = Math.max(-Math.PI + .2, ang - .08); } else if (e.key === 'ArrowRight') { e.preventDefault(); ang = Math.min(-.2, ang + .08); } else if (e.key === ' ') { e.preventDefault(); fire(); } };
    document.addEventListener('keydown', kd);
    stage.append(cv, $(`<p class="hint">${T('bub.hint')}</p>`)); hud(); draw(); raf = requestAnimationFrame(loop);
    ctx.power({ label: T('pw.swap'), cost: 8, use: () => { const t = cur; cur = nxt; nxt = t; } });
    return () => { over = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); };
  }

  /* ---------- 30. Road Hop (Crossy-style) ---------- */
  function road(stage, ctx) {
    const COLS = 9, S = 40, W = COLS * S, VH = 440, goal = pick([20, 32, 48], ctx.diff), spd = pick([.8, 1.1, 1.5], ctx.diff);
    let lanes = [], pl = 0, pc = 4, best = 0, hopT = 1, from = { l: 0, c: 4 }, over = false, raf, last = 0, idle = 0, cam = 0;
    const CAR = ['#ff5c7a', '#5aa9ff', '#f2d45c', '#a56bff', '#ffa23d'];
    const mk = (i) => {
      if (i < 2) return { t: 'g', o: [] };
      const r = RND(), t = i > 3 && r < .3 ? 'w' : r < .72 ? 'r' : 'g', dir = RND() < .5 ? 1 : -1, sp = (.02 + RND() * .03) * spd * (1 + Math.min(i, 40) / 60);
      const o = []; if (t === 'g') { for (let k = 0; k < COLS; k++) if (RND() < .16 && k !== 4) o.push({ x: k, w: 1 }); }
      else if (t === 'r') { let x = RND() * 3; while (x < COLS + 4) { const w = RND() < .3 ? 2 : 1; o.push({ x, w, c: CAR[ri(0, 4)] }); x += w + ri(2, 5); } }
      else { let x = RND() * 2; while (x < COLS + 4) { const w = ri(2, 3); o.push({ x, w }); x += w + ri(1, 2); } }
      return { t, dir, sp, o };
    };
    const lane = (i) => { while (lanes.length <= i + 12) lanes.push(mk(lanes.length)); return lanes[i]; };
    const hud = () => ctx.hud([H('score', best), `${T('hud.goal')} ${goal}`]);
    const cv = $(`<canvas class="snk road" width="${W}" height="${VH}" aria-label="Road hop"></canvas>`), g = cv.getContext('2d');
    const fin = (win, why) => { if (over) return; over = true; cancelAnimationFrame(raf); ctx.sfx(win ? 'win' : 'bad'); if (!win) { ctx.shake(cv); ctx.flash('#ff6b5e'); } setTimeout(() => ctx.end({ win, quality: clamp(best / (goal * 1.3)), score: best * 100, label: T('road.lbl', { n: best }) }), 600); };
    const here = () => { const L = lane(pl); if (L.t === 'r') { if (L.o.some((o) => pc + .3 < o.x + o.w && pc + .7 > o.x)) fin(false); } else if (L.t === 'w') { const lg = L.o.find((o) => pc + .5 > o.x && pc + .5 < o.x + o.w); if (!lg) fin(false); } };
    const move = (dl, dc) => {
      if (over || hopT < 1) return; const nl = pl + dl, nc = Math.round(pc) + dc; if (nl < 0 || nl < best - 4 || nc < 0 || nc >= COLS) return;
      const L = lane(nl); if (L.t === 'g' && L.o.some((o) => o.x === nc)) return;
      from = { l: pl, c: pc }; pl = nl; pc = nc; hopT = 0; idle = 0; ctx.sfx('tap'); if (pl > best) { best = pl; ctx.combo(best); hud(); }
    };
    const draw = () => {
      const camL = cam; g.fillStyle = '#12151b'; g.fillRect(0, 0, W, VH);
      for (let i = Math.floor(camL) - 3; i < camL + 12; i++) { const L = i < 0 ? { t: 'g', o: [] } : lane(i), y = VH - 110 - (i - camL) * S;
        g.fillStyle = L.t === 'g' ? (i % 2 ? '#2f7d4f' : '#348a57') : L.t === 'r' ? '#3a3f4a' : '#2a6db0'; g.fillRect(0, y, W, S);
        if (L.t === 'r') { g.fillStyle = 'rgba(255,255,255,.25)'; for (let k = 0; k < COLS; k++) g.fillRect(k * S + 8, y + S / 2 - 1, 16, 2); }
        L.o.forEach((o) => { if (L.t === 'g') { g.fillStyle = '#1e5a36'; g.beginPath(); g.arc(o.x * S + S / 2, y + S / 2, 14, 0, 7); g.fill(); g.fillStyle = '#6b4a2a'; g.fillRect(o.x * S + S / 2 - 3, y + S / 2 + 6, 6, 8); }
          else if (L.t === 'r') { g.fillStyle = o.c; g.beginPath(); g.roundRect(o.x * S + 2, y + 7, o.w * S - 4, S - 14, 6); g.fill(); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(o.x * S + (L.dir > 0 ? o.w * S - 14 : 6), y + 10, 8, S - 20); }
          else { g.fillStyle = '#8a5a30'; g.beginPath(); g.roundRect(o.x * S, y + 6, o.w * S, S - 12, 8); g.fill(); } }); }
      const t = hopT < 1 ? hopT : 1, l = from.l + (pl - from.l) * t, c = from.c + (pc - from.c) * t, y = VH - 110 - (l - camL) * S - Math.sin(t * Math.PI) * 14;
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(c * S + S / 2, VH - 110 - (l - camL) * S + S - 8, 12, 5, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.roundRect(c * S + 8, y + 6, 24, 26, 7); g.fill(); g.fillStyle = '#ff6b5e'; g.fillRect(c * S + 16, y + 2, 8, 6); g.fillStyle = '#ffb454'; g.fillRect(c * S + 25, y + 15, 7, 4); g.fillStyle = '#14170a'; g.beginPath(); g.arc(c * S + 22, y + 14, 2, 0, 7); g.fill();
    };
    const loop = (now) => {
      if (over) return; const dt = Math.min((now - (last || now)) / 16.67, 2); last = now; idle += dt * 16.67;
      if (idle > 9000) return fin(false);
      lanes.forEach((L) => { if (L.t === 'g') return; L.o.forEach((o) => { o.x += L.dir * L.sp * dt * (L.t === 'w' ? .6 : 1) * 3.2; const span = COLS + 6; if (L.dir > 0 && o.x > COLS + 3) o.x -= span + o.w; if (L.dir < 0 && o.x + o.w < -3) o.x += span + o.w; }); });
      if (hopT < 1) { hopT = Math.min(1, hopT + dt / 7); if (hopT >= 1) { from = { l: pl, c: pc }; here(); if (over) { draw(); return; } if (pl > 0 && pl % 10 === 0) ctx.sfx('good', pl / 10); if (best >= goal) return fin(true); } }
      else { const L = lane(pl); if (L.t === 'w') { pc += L.dir * L.sp * dt * .6 * 3.2; from.c = pc; if (pc < -.6 || pc > COLS - .4) return fin(false); } here(); }
      cam += (Math.max(pl, best - 1) - cam) * .12 * dt; draw(); raf = requestAnimationFrame(loop);
    };
    const kd = (e) => { const k = e.key; if (k === 'ArrowUp' || k === 'w' || k === ' ') { e.preventDefault(); move(1, 0); } else if (k === 'ArrowLeft' || k === 'a') { e.preventDefault(); move(0, -1); } else if (k === 'ArrowRight' || k === 'd') { e.preventDefault(); move(0, 1); } else if (k === 'ArrowDown' || k === 's') { e.preventDefault(); move(-1, 0); } };
    document.addEventListener('keydown', kd);
    let sx, sy; cv.style.touchAction = 'none';
    cv.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
    cv.addEventListener('pointerup', (e) => { const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) move(1, 0); else if (Math.abs(dx) > Math.abs(dy)) move(0, dx < 0 ? -1 : 1); else move(dy < 0 ? 1 : -1, 0); });
    const pad = $('<div class="snk-pad"><button aria-label="Forward">▲</button><div><button aria-label="Left">◀</button><button aria-label="Back">▼</button><button aria-label="Right">▶</button></div></div>');
    const dd = [[1, 0], [0, -1], [-1, 0], [0, 1]]; [...pad.querySelectorAll('button')].forEach((b, i) => { b.onclick = () => move(...dd[i]); });
    stage.append(cv, pad, $(`<p class="hint">${T('road.hint', { n: goal })}</p>`)); hud(); draw(); raf = requestAnimationFrame(loop);
    return () => { over = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); };
  }

  /* ================= real 3D games (three.js, loaded on demand) ================= */
  let THREE_P;
  const loadThree = () => THREE_P || (THREE_P = new Promise((res, rej) => {
    if (window.THREE) return res(window.THREE);
    const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload = () => res(window.THREE); s.onerror = () => { THREE_P = null; rej(new Error('three')); }; document.head.append(s);
  }));
  const with3d = (stage, build) => {
    let dead = false, inner = null; const host = $(`<div class="t3"><p class="hint">${T('t3.load')}</p></div>`); stage.append(host);
    loadThree().then((THREE) => { if (dead) return; host.innerHTML = ''; inner = build(THREE, host); }).catch(() => { host.innerHTML = `<p class="hint">${T('t3.err')}</p>`; });
    return () => { dead = true; if (inner) inner(); };
  };
  const mkR = (THREE, host, W, VH) => { const r = new THREE.WebGLRenderer({ antialias: true, alpha: true }); r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); r.setSize(W, VH, false); r.setClearColor(0, 0); r.domElement.className = 'snk t3c'; r.domElement.style.touchAction = 'none'; host.append(r.domElement); return r; };
  const kill = (r) => { r.dispose(); try { r.forceContextLoss(); } catch (e) {} };
  const lit3 = (THREE, scene, sky = 0xb4a8ff, ground = 0x1a1030) => { scene.add(new THREE.HemisphereLight(sky, ground, .95)); const d = new THREE.DirectionalLight(0xffffff, .85); d.position.set(4, 9, 5); scene.add(d); };
  const neon = (THREE, geo, color, em = .9) => new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: em, roughness: .35, metalness: .2 }));
  const edges = (THREE, mesh, color = 0xffffff) => { const l = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({ color, transparent: true, opacity: .55 })); mesh.add(l); return mesh; };

  /* ---------- 31. Neon Runner 3D ---------- */
  function runner(stage, ctx) {
    return with3d(stage, (THREE, host) => {
      const W = 360, VH = 480, goal = pick([15, 25, 40], ctx.diff), sp0 = pick([13, 16, 19], ctx.diff), LX = [-2.2, 0, 2.2];
      const r = mkR(THREE, host, W, VH), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(62, W / VH, .1, 140);
      scene.fog = new THREE.Fog(0x0b0716, 20, 80); cam.position.set(0, 3.5, 6.2); cam.lookAt(0, 1, -7); lit3(THREE, scene, 0x9a8cff, 0x120a24);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 220), new THREE.MeshStandardMaterial({ color: 0x15102c, roughness: .5, metalness: .4 })); floor.rotation.x = -Math.PI / 2; floor.position.z = -90; scene.add(floor);
      [-3.4, -1.1, 1.1, 3.4].forEach((x) => { const l = neon(THREE, new THREE.BoxGeometry(.06, .02, 220), 0x7a5cff, .8); l.position.set(x, .02, -90); scene.add(l); });
      const stripes = [], pillars = []; for (let i = 0; i < 22; i++) { const s = neon(THREE, new THREE.BoxGeometry(6.8, .02, .08), 0x4f3bd6, .5); s.position.set(0, .03, -i * 6); scene.add(s); stripes.push(s); }
      for (let i = 0; i < 14; i++) [-1, 1].forEach((sd) => { const p = neon(THREE, new THREE.BoxGeometry(.5, 3 + (i % 3), .5), sd < 0 ? 0xff4fd8 : 0x35e0ff, .7); p.position.set(sd * 5.2, 1.5, -i * 9); scene.add(p); pillars.push(p); });
      const pl = new THREE.Group(), body = edges(THREE, neon(THREE, new THREE.BoxGeometry(.9, .9, .9), 0xd6ff3d, .55)); pl.add(body);
      const sh = new THREE.Mesh(new THREE.CircleGeometry(.6, 20), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: .4 })); sh.rotation.x = -Math.PI / 2; scene.add(sh); scene.add(pl);
      const gT = new THREE.BoxGeometry(1.6, 2.6, 1.2), gL = new THREE.BoxGeometry(1.9, .8, 1), gO = new THREE.SphereGeometry(.36, 16, 12);
      let ents = [], lane = 1, px = 0, py = .45, vy = 0, orbs = 0, pts = 0, dist = 0, sp = sp0, nextRow = 0, over = false, raf, last = 0, shake = 0, combo = 0, spacing = 17;
      const hud = () => ctx.hud([H('score', pts), `◆ ${orbs}/${goal}`]);
      const add = (g, col, x, y, z, type) => { const m = type === 'o' ? neon(THREE, g, col, 1) : edges(THREE, neon(THREE, g, col, .55)); m.position.set(x, y, z); scene.add(m); ents.push({ m, type, x, z }); };
      const row = (z) => { const free = ri(0, 2); LX.forEach((x, i) => { if (i === free) { if (RND() < .7) for (let k = 0; k < 3; k++) add(gO, 0x35e0ff, x, .95, z - k * 2.4, 'o'); } else if (RND() < .62) { if (RND() < .5) add(gT, 0xff4fd8, x, 1.3, z, 't'); else add(gL, 0xffa23d, x, .4, z, 'l'); } }); };
      const fin = (win) => { over = true; cancelAnimationFrame(raf); ctx.sfx(win ? 'win' : 'bad'); if (!win) { ctx.flash('#ff4fd8'); ctx.shake(r.domElement); } setTimeout(() => ctx.end({ win, quality: clamp(orbs / (goal * 1.3)), score: pts, label: T('run.lbl', { n: orbs }) }), 550); };
      const go = (d) => { const n = clamp(lane + d, 0, 2); if (n !== lane) { lane = n; ctx.sfx('tap'); } };
      const jump = () => { if (py <= .46) { vy = 9.8; ctx.sfx('tap'); } };
      const loop = (now) => {
        if (over) return; const dt = Math.min((now - (last || now)) / 1000, .05); last = now; sp = Math.min(sp0 + dist / 90, sp0 + 11); dist += sp * dt; pts = Math.floor(dist) + orbs * 50;
        px += (LX[lane] - px) * Math.min(1, 14 * dt); vy -= 27 * dt; py += vy * dt; if (py < .45) { py = .45; vy = 0; }
        pl.position.set(px, py, 0); pl.rotation.y += dt * 1.4; pl.rotation.z = (LX[lane] - px) * -.12; sh.position.set(px, .03, 0); sh.scale.setScalar(clamp(1.1 - (py - .45) * .25, .4, 1));
        nextRow -= sp * dt; if (nextRow <= 0) { row(-75); nextRow = spacing; spacing = Math.max(11, spacing - .08); }
        ents.forEach((e) => { e.z += sp * dt; e.m.position.z = e.z; if (e.type === 'o') { e.m.rotation.y += dt * 4; e.m.position.y = .95 + Math.sin(now / 250 + e.x) * .12; } });
        for (const e of ents) { if (e.dead || e.z < -1 || e.z > 1) continue; const dx = Math.abs(e.x - px);
          if (e.type === 'o' && dx < 1 && Math.abs(py - .95) < 1.3) { e.dead = true; scene.remove(e.m); orbs++; combo++; ctx.sfx('good', combo); ctx.combo(combo); hud(); if (orbs >= goal) return fin(true); }
          else if (e.type === 't' && dx < 1.05) return fin(false);
          else if (e.type === 'l' && dx < 1.15 && py < 1.2) return fin(false); }
        ents = ents.filter((e) => { if (e.dead) return false; if (e.z > 9) { scene.remove(e.m); if (e.type === 'o') combo = 0; return false; } return true; });
        stripes.forEach((s) => { s.position.z += sp * dt; if (s.position.z > 8) s.position.z -= 132; }); pillars.forEach((p) => { p.position.z += sp * dt; if (p.position.z > 8) p.position.z -= 126; });
        cam.position.x += (px * .45 - cam.position.x) * .1; cam.lookAt(px * .3, 1, -7); hud(); r.render(scene, cam); raf = requestAnimationFrame(loop);
      };
      const kd = (e) => { const k = e.key; if (k === 'ArrowLeft' || k === 'a') { e.preventDefault(); go(-1); } else if (k === 'ArrowRight' || k === 'd') { e.preventDefault(); go(1); } else if (k === 'ArrowUp' || k === 'w' || k === ' ') { e.preventDefault(); jump(); } };
      document.addEventListener('keydown', kd); const cv = r.domElement; let sx, sy;
      cv.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
      cv.addEventListener('pointerup', (e) => { const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) jump(); else if (Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? -1 : 1); else if (dy < 0) jump(); });
      const pad = $('<div class="snk-pad"><div><button aria-label="Left">◀</button><button aria-label="Jump">⤒</button><button aria-label="Right">▶</button></div></div>'); const acts = [() => go(-1), jump, () => go(1)]; [...pad.querySelectorAll('button')].forEach((b, i) => { b.onclick = acts[i]; });
      host.append(pad, $(`<p class="hint">${T('run.hint', { n: goal })}</p>`)); hud(); raf = requestAnimationFrame(loop);
      return () => { over = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); kill(r); };
    });
  }

  /* ---------- 32. Helix Drop 3D ---------- */
  function helix(stage, ctx) {
    return with3d(stage, (THREE, host) => {
      const W = 360, VH = 480, levels = pick([10, 15, 22], ctx.diff), GAP = 2.4, RAD = 2.3, N = 12, dp = pick([.1, .18, .26], ctx.diff), BR = .32, BZ = 1.45;
      const r = mkR(THREE, host, W, VH), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(48, W / VH, .1, 100); lit3(THREE, scene, 0xcfd6ff, 0x2a1a50);
      const tower = new THREE.Group(); scene.add(tower);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, levels * GAP + 14, 28), new THREE.MeshStandardMaterial({ color: 0x6a5fd0, roughness: .45, metalness: .25 })); pole.position.y = -levels * GAP / 2 + 3; tower.add(pole);
      const rings = [], dth = Math.PI * 2 / N;
      for (let lv = 0; lv < levels; lv++) {
        const solid = Array(N).fill(true), gs = ri(0, N - 1), gn = ri(2, 3); for (let k = 0; k < gn; k++) solid[(gs + k) % N] = false;
        const danger = solid.map((s, i) => s && lv > 0 && RND() < dp && !(i === 0 && false)); const grp = new THREE.Group(); grp.position.y = -lv * GAP; const col = new THREE.Color().setHSL((lv * .07) % 1, .65, .6);
        for (let i = 0; i < N; i++) if (solid[i]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(RAD, RAD, .3, 6, 1, false, i * dth, dth - .02), new THREE.MeshStandardMaterial({ color: danger[i] ? 0xff2d4f : col, emissive: danger[i] ? 0xff2d4f : col, emissiveIntensity: danger[i] ? .55 : .12, roughness: .45 })); grp.add(m); }
        tower.add(grp); rings.push({ y: -lv * GAP, solid, danger, grp, passed: false });
      }
      const fin3 = new THREE.Mesh(new THREE.CylinderGeometry(RAD + .4, RAD + .4, .5, 32), new THREE.MeshStandardMaterial({ color: 0x3dd6a5, emissive: 0x3dd6a5, emissiveIntensity: .5 })); fin3.position.y = -levels * GAP; tower.add(fin3);
      const ball = neon(THREE, new THREE.SphereGeometry(BR, 24, 18), 0xffd23d, .35); ball.position.set(0, 2, BZ); scene.add(ball);
      let rot = 0, by = 2, bv = 0, pts = 0, passed = 0, over = false, raf, last = 0, combo = 0, smash = 0, sq = 0, drag = false, lx = 0;
      const hud = () => ctx.hud([H('score', pts), `${T('hud.round')} ${Math.min(passed + 1, levels)}/${levels}`]);
      const fin = (win) => { over = true; cancelAnimationFrame(raf); ctx.sfx(win ? 'win' : 'bad'); if (!win) { ctx.flash('#ff2d4f'); ctx.shake(r.domElement); } setTimeout(() => ctx.end({ win, quality: win ? .8 + clamp(1 - smash / 3) * .2 : clamp(passed / levels) * .6, score: pts, label: T('hlx.lbl', { n: passed }) }), 600); };
      const loop = (now) => {
        if (over) return; const dt = Math.min((now - (last || now)) / 1000, .033); last = now; const prev = by - BR; bv = Math.max(bv - 26 * dt, -19); by += bv * dt; sq = Math.max(0, sq - dt * 5);
        const la = (((-rot) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2), idx = Math.floor(la / dth) % N;
        if (bv < 0) {
          for (const rg of rings) { const top = rg.y + .15; if (prev >= top - .02 && by - BR <= top) { if (rg.solid[idx]) { if (rg.danger[idx]) { ball.material.color.set(0xff2d4f); return fin(false); } by = top + BR; bv = 9.6; sq = 1; combo = 0; ctx.sfx('tap'); } break; } }
          if (by - BR <= -levels * GAP + .25) { by = -levels * GAP + .25 + BR; pts += 500; return fin(true); }
        }
        rings.forEach((rg, i) => { if (!rg.passed && by - BR < rg.y - .2) { rg.passed = true; passed++; combo++; pts += 10 * combo; ctx.sfx('good', combo); ctx.combo(combo); hud(); rg.grp.visible = false; } });
        ball.position.set(0, by, BZ); ball.scale.set(1 + sq * .25, 1 - sq * .3, 1 + sq * .25); tower.rotation.y = rot;
        cam.position.set(0, by + 3.4, 10.5); cam.lookAt(0, by - 1.6, 0); r.render(scene, cam); raf = requestAnimationFrame(loop);
      };
      const cv = r.domElement; cv.addEventListener('pointerdown', (e) => { drag = true; lx = e.clientX; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); }); cv.addEventListener('pointermove', (e) => { if (!drag) return; rot += (e.clientX - lx) * .012; lx = e.clientX; });
      const up = () => { drag = false; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      const kd = (e) => { if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); rot -= .22; } else if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); rot += .22; } }; document.addEventListener('keydown', kd);
      host.append($(`<p class="hint">${T('hlx.hint', { n: levels })}</p>`)); hud(); raf = requestAnimationFrame(loop);
      return () => { over = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); kill(r); };
    });
  }

  /* ---------- 22. Stack Tower (3D) ---------- */
  function stack(stage, ctx) {
    return with3d(stage, (THREE, host) => {
      const W = 360, VH = 480, BH = .5, need = pick([12, 18, 25], ctx.diff), sp0 = pick([2.6, 3.4, 4.2], ctx.diff), asp = W / VH, VS = 6;
      const r = mkR(THREE, host, W, VH), scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-VS * asp, VS * asp, VS, -VS, .1, 100); lit3(THREE, scene, 0xffffff, 0x554a88);
      const col = (i) => new THREE.Color().setHSL(((i * 14) % 360) / 360, .62, .62);
      const box = (w, d, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, BH, d), new THREE.MeshStandardMaterial({ color: col(i), roughness: .5, metalness: .1 })); return m; };
      const placed = [{ x: 0, z: 0, w: 3.2, d: 3.2 }]; const b0 = box(3.2, 3.2, 0); b0.position.set(0, BH / 2, 0); scene.add(b0);
      const base = new THREE.Mesh(new THREE.BoxGeometry(3.3, 40, 3.3), new THREE.MeshStandardMaterial({ color: 0x1d1840 })); base.position.y = -20; scene.add(base);
      let cur = null, dir = 1, pos = -4.4, camY = 0, debris = [], perfect = 0, over = false, raf, last = 0, level = 0;
      const axis = () => (level % 2 === 0 ? 'x' : 'z');
      const spawn = () => { const p = placed[placed.length - 1]; cur = box(p.w, p.d, level + 1); cur.position.y = (level + 1) * BH + BH / 2; scene.add(cur); pos = -4.4; dir = 1; };
      spawn();
      const hud = () => ctx.hud([H('score', level), `${T('hud.goal')} ${need}`]);
      const fin = () => { over = true; cancelAnimationFrame(raf); setTimeout(() => ctx.end({ win: level >= need, quality: clamp(level / (need * 1.4)), score: level * 100 + perfect * 50, label: T('stk.lbl', { n: level }) }), 700); };
      const place = () => {
        if (over) return; const p = placed[placed.length - 1], a = axis(), sz = a === 'x' ? p.w : p.d, delta = pos - p[a], ov = sz - Math.abs(delta);
        if (ov <= 0) { debris.push({ m: cur, vy: 0, vx: 0, rv: .03 }); cur = null; ctx.sfx('bad'); ctx.flash('#ff6b5e'); return fin(); }
        let np = { x: p.x, z: p.z, w: p.w, d: p.d };
        if (Math.abs(delta) < .12) { perfect++; ctx.sfx('good', perfect); ctx.combo(perfect); ctx.pop(r.domElement, T('stk.perfect'), '#d6ff3d'); cur.scale.set(1.12, 1, 1.12); }
        else {
          perfect = 0; ctx.combo(0); ctx.sfx('tap'); const c = p[a] + delta / 2, rm = box(a === 'x' ? Math.abs(delta) : p.w, BH, 0); rm.geometry.dispose(); rm.geometry = new THREE.BoxGeometry(a === 'x' ? Math.abs(delta) : p.w, BH, a === 'z' ? Math.abs(delta) : p.d); rm.material = cur.material;
          const s = Math.sign(delta), rc = pos + s * ov / 2; rm.position.set(a === 'x' ? rc : p.x, cur.position.y, a === 'z' ? rc : p.z); scene.add(rm); debris.push({ m: rm, vy: 0, vx: s * .6, ax: a, rv: s * .05 });
          np[a] = c; if (a === 'x') np.w = ov; else np.d = ov; scene.remove(cur); cur = box(np.w, np.d, level + 1); cur.position.y = (level + 1) * BH + BH / 2; scene.add(cur);
        }
        if (Math.abs(delta) < .12) { np[a] = p[a]; }
        cur.position.x = np.x; cur.position.z = np.z; placed.push(np); level++; hud(); if (level >= 60) return fin();
        spawn();
      };
      const loop = (now) => {
        if (over && !debris.length) { r.render(scene, cam); return; } const dt = Math.min((now - (last || now)) / 1000, .05); last = now;
        if (cur && !over) { const a = axis(), p = placed[placed.length - 1], sp = sp0 + level * .1; pos += dir * sp * dt * 1.5; if (pos > 4.4) { pos = 4.4; dir = -1; } if (pos < -4.4) { pos = -4.4; dir = 1; }
          cur.position.x = a === 'x' ? pos : p.x; cur.position.z = a === 'z' ? pos : p.z; cur.scale.x += (1 - cur.scale.x) * .2; cur.scale.z += (1 - cur.scale.z) * .2; }
        debris.forEach((d) => { d.vy -= 24 * dt; d.m.position.y += d.vy * dt; d.m.rotation.z += d.rv; d.m.position.x += (d.ax === 'x' ? d.vx : 0) * dt * 2; }); debris = debris.filter((d) => { if (d.m.position.y < -14) { scene.remove(d.m); return false; } return true; });
        camY += ((placed.length * BH) - camY) * Math.min(1, 4 * dt); cam.position.set(8, camY + 7, 8); cam.lookAt(0, camY - 1.4, 0); r.render(scene, cam); raf = requestAnimationFrame(loop);
      };
      const cv = r.domElement; cv.addEventListener('pointerdown', (e) => { e.preventDefault(); place(); });
      const kd = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); place(); } }; document.addEventListener('keydown', kd);
      host.append($(`<p class="hint">${T('stk.hint', { n: need })}</p>`)); hud(); raf = requestAnimationFrame(loop);
      return () => { over = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); kill(r); };
    });
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
    flap: svg('<circle cx="10" cy="12" r="5"/><path d="M15 11l5 1-5 1M3 18h4M19 4v5M19 16v4"/>'),
    dino: svg('<path d="M6 20V9h6V5h6v6h-4v3h-3v6M3 20h18"/>'),
    mole: svg('<path d="M4 20a8 8 0 0116 0z"/><circle cx="9.500" cy="12" r="1" fill="currentColor"/><circle cx="14.500" cy="12" r="1" fill="currentColor"/>'),
    stack: svg('<rect x="7" y="15" width="10" height="5" rx="1"/><rect x="5" y="10" width="10" height="5" rx="1"/><rect x="9" y="5" width="10" height="5" rx="1"/>'),
    react: svg('<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>'),
    slice: svg('<circle cx="11" cy="13" r="6"/><path d="M4 4l16 16M14 5c1-1 3-2 5-1"/>'),
    brick: svg('<rect x="3" y="4" width="8" height="4" rx="1"/><rect x="13" y="4" width="8" height="4" rx="1"/><rect x="8" y="10" width="8" height="4" rx="1"/><circle cx="12" cy="18" r="1.500" fill="currentColor"/>'),
    blocks: svg('<rect x="9" y="3" width="6" height="6" rx="1"/><rect x="3" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/><rect x="15" y="9" width="6" height="6" rx="1"/>'),
    hop: svg('<rect x="4" y="19" width="9" height="2.500" rx="1"/><rect x="12" y="11" width="8" height="2.500" rx="1"/><rect x="8" y="3" width="7" height="6" rx="2"/>'),
    blaster: svg('<path d="M12 3l5 14-5-3-5 3z"/><path d="M12 19v3M5 6l2 2M19 6l-2 2"/>'),
    bubble: svg('<circle cx="8" cy="8" r="4"/><circle cx="16" cy="8" r="4"/><circle cx="12" cy="15" r="4"/>'),
    road: svg('<path d="M3 8h18M3 16h18"/><rect x="6" y="10" width="6" height="4" rx="1" fill="currentColor"/>'),
    runner: svg('<path d="M4 20L9 4h6l5 16M12 6v3M12 12v3"/><rect x="10" y="16" width="4" height="3" rx=".8" fill="currentColor"/>'),
    helix: svg('<path d="M5 6c4 2 10 2 14 0M5 12c4 2 10 2 14 0M5 18c4 2 10 2 14 0"/><circle cx="12" cy="3" r="1.500" fill="currentColor"/>'),
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
    { id: 'flap', icon: ICON.flap, color: '#f2d45c', art: 'rings', tag: 'Speed', time: 60, mount: flap },
    { id: 'dino', icon: ICON.dino, color: '#d6ff3d', art: 'lines', tag: 'Speed', time: 60, mount: dino },
    { id: 'mole', icon: ICON.mole, color: '#ffb454', art: 'dots', tag: 'Speed', time: 30, mount: mole },
    { id: 'stack', icon: ICON.stack, color: '#ff7aa8', art: 'stripes', tag: 'Focus', time: 60, mount: stack },
    { id: 'react', icon: ICON.react, color: '#3dd6a5', art: 'split', tag: 'Focus', time: 30, mount: react },
    { id: 'slice', icon: ICON.slice, color: '#ff5c7a', art: 'dots', tag: 'Speed', time: 45, mount: slice },
    { id: 'brick', icon: ICON.brick, color: '#5aa9ff', art: 'grid', tag: 'Focus', time: 120, mount: brick },
    { id: 'blocks', icon: ICON.blocks, color: '#a56bff', art: 'check', tag: 'Logic', time: 150, mount: blocks },
    { id: 'hop', icon: ICON.hop, color: '#3dd6a5', art: 'dots', tag: 'Speed', time: 90, mount: hop },
    { id: 'blaster', icon: ICON.blaster, color: '#ff7aa8', art: 'dots', tag: 'Speed', time: 120, mount: blaster },
    { id: 'bubble', icon: ICON.bubble, color: '#a56bff', art: 'rings', tag: 'Logic', time: 180, mount: bubble },
    { id: 'road', icon: ICON.road, color: '#ffa23d', art: 'lines', tag: 'Speed', time: 90, mount: road },
    { id: 'runner', icon: ICON.runner, color: '#ff4fd8', art: 'lines', tag: 'Speed', time: 90, mount: runner },
    { id: 'helix', icon: ICON.helix, color: '#ffd23d', art: 'rings', tag: 'Focus', time: 90, mount: helix },
  ];
  const HOT = ['runner', 'helix', 'flap', 'dino', 'slice', 'blocks', 'brick', 'bubble', 'hop', 'blaster', 'road', 'snake', 'stack', 'mole'], NEWG = ['runner', 'helix', 'stack', 'slice', 'brick', 'blocks', 'hop', 'blaster', 'bubble', 'road'];
  const ARC = ['slice', 'runner', 'helix', 'stack', 'flap', 'dino', 'hop', 'blaster', 'bubble', 'road', 'brick', 'blocks', 'snake', 'mole', 'rush', 'react', 'merge'];
  GAMES.forEach((g) => { g.cat = ARC.includes(g.id) ? 'arcade' : 'brain'; g.is3d = ['runner', 'helix', 'stack'].includes(g.id); });
  GAMES.sort((a, b) => (a.cat === b.cat ? 0 : a.cat === 'arcade' ? -1 : 1) || (ARC.indexOf(a.id) < 0 ? 0 : ARC.indexOf(a.id) - ARC.indexOf(b.id)));
  GAMES.forEach((g) => { g.hot = HOT.includes(g.id); g.isNew = NEWG.includes(g.id); });
  /* ---------- banner art: one illustrated scene per game ---------- */
  const M = (id) => {
    const r = (x, y, w, h, o = 1, rx = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="var(--c)" opacity="${o}"/>`;
    const w = (x, y, ww, h, o = .85, rx = 2) => `<rect x="${x}" y="${y}" width="${ww}" height="${h}" rx="${rx}" fill="#fff" opacity="${o}"/>`;
    const c = (x, y, rr, o = 1, col = 'var(--c)') => `<circle cx="${x}" cy="${y}" r="${rr}" fill="${col}" opacity="${o}"/>`;
    const t = (x, y, str, sz = 26, col = '#fff', o = .95) => `<text x="${x}" y="${y}" font-size="${sz}" font-weight="800" text-anchor="middle" fill="${col}" opacity="${o}" font-family="inherit">${str}</text>`;
    const grid = (n, f) => { let o = ''; for (let i = 0; i < n * n; i++) o += f(i % n, Math.floor(i / n), i); return o; };
    const L = {
      memory: () => `<g transform="rotate(-10 80 55)">${w(55, 22, 44, 58, .9, 6)}${r(60, 27, 34, 48, .35, 4)}</g><g transform="rotate(9 125 52)">${w(104, 20, 44, 58, .95, 6)}${c(126, 49, 11)}</g>`,
      slide: () => grid(3, (x, y, i) => i === 8 ? '' : w(62 + x * 26, 14 + y * 26, 23, 23, .3 + (i % 3) * .2, 5) + t(73.5 + x * 26, 31 + y * 26, i + 1, 13, '#fff', .9)),
      words: () => t(55, 66, 'A', 46) + t(100, 58, 'B', 36, 'var(--c)', 1) + t(145, 66, 'C', 46),
      math: () => t(55, 60, '+', 44) + t(100, 66, '×', 44, 'var(--c)', 1) + t(148, 60, '=', 44) + c(100, 50, 36, .12),
      pattern: () => c(70, 32, 17, .95, '#ff7aa8') + c(130, 32, 17, .35, '#5aa9ff') + c(70, 72, 17, .35, '#ffb454') + c(130, 72, 17, .95, '#3dd6a5'),
      lights: () => c(100, 44, 42, .18) + c(100, 44, 26, .35) + `<path d="M100 22a17 17 0 00-9 31c2 2 2 4 2 7h14c0-3 0-5 2-7a17 17 0 00-9-31z" fill="#f2d45c"/>` + w(92, 64, 16, 5, .8) + w(94, 72, 12, 4, .8),
      merge: () => w(34, 28, 40, 40, .35, 8) + t(54, 56, '2', 24) + w(80, 28, 40, 40, .6, 8) + t(100, 56, '4', 24) + r(126, 28, 40, 40, 1, 8) + t(146, 56, '8', 24, '#14170a'),
      sudoku: () => grid(5, (x, y, i) => w(50 + x * 20, 8 + y * 20, 18, 18, i % 7 === 0 ? .85 : .2, 3)) + t(79, 33, '5', 13, '#14170a') + t(119, 53, '3', 13, '#14170a') + t(59, 73, '9', 13, '#14170a'),
      stroop: () => t(70, 62, 'RED', 30, '#5aa9ff', 1) + t(138, 62, 'BLUE', 30, '#ff6b5e', 1),
      odd: () => grid(4, (x, y, i) => w(60 + x * 22, 8 + y * 22, 19, 19, i === 6 ? 1 : .25, 5)),
      sweep: () => grid(4, (x, y, i) => w(60 + x * 22, 8 + y * 22, 19, 19, i === 5 ? .12 : .3, 4)) + c(93, 41, 6, 1, '#ff6b5e') + t(115, 35, '2', 13, '#fff') + t(71, 57, '1', 13, '#fff'),
      code: () => c(66, 36, 13, 1, '#ff7aa8') + c(100, 36, 13, 1, '#5aa9ff') + c(134, 36, 13, .35, '#ffb454') + c(66, 72, 7, 1, '#fff') + c(84, 72, 7, .3, '#fff') + c(102, 72, 7, .3, '#fff'),
      rush: () => c(100, 50, 42, .2) + c(100, 50, 30, .45, '#fff') + c(100, 50, 18, .9) + c(100, 50, 6, 1, '#fff') + `<path d="M104 46l36-30" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
      recall: () => t(46, 62, '7', 40) + t(80, 62, '3', 40, 'var(--c)', 1) + t(114, 62, '9', 40) + t(150, 62, '?', 40, '#fff', .45),
      wave: () => `<path d="M10 62c20 0 20-34 40-34s20 34 40 34 20-34 40-34 20 34 40 34" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".9"/>` + w(112, 12, 6, 76, 1, 3) + c(115, 50, 10),
      snake: () => `<path d="M20 72h70c14 0 14-26 0-26H60c-14 0-14-26 0-26h80" fill="none" stroke="var(--c)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>` + c(140, 20, 8, 1, '#fff') + c(170, 60, 6, 1, '#ff6b5e'),
      wordle: () => ['S', 'M', 'I', 'L', 'E'].map((ch, i) => (i === 1 ? r : w)(30 + i * 28, 30, 25, 25, i === 1 ? 1 : i === 3 ? .5 : .22, 5) + t(42.5 + i * 28, 49, ch, 17, i === 1 ? '#14170a' : '#fff')).join(''),
      tictac: () => `<path d="M80 12v76M120 12v76M52 38h96M52 62h96" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".7"/>` + t(66, 34, '✕', 20, 'var(--c)', 1) + '<circle cx="100" cy="50" r="9" fill="none" stroke="#5aa9ff" stroke-width="4"/>' + t(134, 82, '✕', 20, 'var(--c)', 1),
      flap: () => w(30, 0, 22, 32, .5, 3) + w(30, 66, 22, 34, .5, 3) + w(150, 0, 22, 44, .5, 3) + w(150, 78, 22, 22, .5, 3) + c(96, 48, 15, 1, '#f2d45c') + c(102, 44, 4, 1, '#fff') + `<path d="M108 50l10 3-10 3z" fill="#ff7a3d"/>`,
      dino: () => w(0, 76, 200, 3, .4, 1) + w(40, 42, 24, 34, .95, 5) + w(54, 34, 22, 16, .95, 5) + c(70, 40, 2.500, 1, '#14170a') + r(120, 52, 9, 24, 1, 3) + r(134, 60, 8, 16, 1, 3) + c(168, 22, 8, .25, '#fff'),
      mole: () => [38, 100, 162].map((x, i) => `<ellipse cx="${x}" cy="72" rx="24" ry="9" fill="#000" opacity=".4"/>` + (i === 1 ? c(x, 52, 17, 1, '#b07a4a') + c(x - 6, 48, 2.500, 1, '#14170a') + c(x + 6, 48, 2.500, 1, '#14170a') + c(x, 56, 4, 1, '#ff9a9a') : '')).join(''),
      stack: () => [0, 1, 2, 3, 4].map((i) => `<rect x="${[62, 70, 58, 66, 74][i]}" y="${74 - i * 14}" width="${[78, 62, 84, 66, 52][i]}" height="12" rx="3" fill="hsl(${330 + i * 22} 70% 62%)"/>`).join(''),
      react: () => c(100, 50, 40, .25) + `<path d="M108 14L72 56h24l-6 30 38-44h-24z" fill="#fff" opacity=".95"/>`,
      slice: () => c(90, 56, 26, 1, '#ff5c7a') + c(90, 56, 18, .35, '#fff') + `<path d="M40 90L160 14" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M150 70l12 4M146 82l10 8" stroke="#ff5c7a" stroke-width="3" stroke-linecap="round"/>` + c(150, 30, 12, .9, '#ffa23d'),
      brick: () => [0, 1, 2].map((r_) => [0, 1, 2, 3, 4].map((k) => w(26 + k * 30, 10 + r_ * 14, 27, 11, .75, 3).replace('fill="#fff"', `fill="hsl(${200 + r_ * 40 + k * 6} 80% 66%)"`)).join('')).join('') + w(80, 82, 40, 6, 1, 3) + c(112, 60, 5, 1, '#fff'),
      hop: () => w(30, 78, 60, 8, .5, 4) + w(110, 50, 60, 8, .5, 4) + w(60, 28, 44, 8, .5, 4) + r(84, 6, 22, 22, 1, 7) + c(91, 15, 3, 1, '#14170a') + c(100, 15, 3, 1, '#14170a'),
      blaster: () => `<path d="M100 56l16 30-16-8-16 8z" fill="var(--c)"/>` + [[50, 20], [100, 14], [150, 22]].map(([x, y]) => `<path d="M${x} ${y + 12}l-11-18h22z" fill="#ff6b5e" opacity=".85"/>`).join('') + w(99, 30, 3, 18, 1, 1) + c(60, 60, 1.5, 1, '#fff') + c(150, 66, 1.5, 1, '#fff'),
      bubble: () => [[50, 24, 0], [82, 24, 1], [114, 24, 2], [146, 24, 0], [66, 52, 2], [98, 52, 0], [130, 52, 1]].map(([x, y, k]) => c(x, y, 15, .92, ['#ff5c7a', '#ffa23d', '#5aa9ff'][k])).join('') + c(100, 88, 11, 1, '#fff') + `<path d="M100 76V64" stroke="#fff" stroke-width="2" stroke-dasharray="3 3"/>`,
      road: () => w(0, 34, 200, 32, .18, 0) + r(30, 40, 40, 20, 1, 6) + r(120, 40, 36, 20, .7, 6) + w(78, 8, 22, 24, 1, 6) + c(94, 16, 2.5, 1, '#14170a') + w(0, 49, 200, 2, .25, 0),
      runner: () => `<path d="M60 100L92 28h16l32 72z" fill="#fff" opacity=".08"/><path d="M92 28L40 100M108 28l52 72" stroke="#fff" stroke-width="1.5" opacity=".35"/>` + r(70, 62, 22, 30, 1, 3) + r(112, 50, 24, 20, .7, 3) + c(100, 40, 5, 1, '#35e0ff') + `<rect x="92" y="70" width="16" height="16" rx="3" fill="#d6ff3d"/>`,
      helix: () => `<rect x="94" y="0" width="12" height="100" fill="#fff" opacity=".12"/>` + [20, 46, 72].map((y, i) => `<ellipse cx="100" cy="${y}" rx="${46 - i * 4}" ry="8" fill="hsl(${40 + i * 60} 70% 62%)"/><ellipse cx="${100 + (i - 1) * 16}" cy="${y}" rx="14" ry="5" fill="#0e1013" opacity=".7"/>`).join('') + c(100, 8, 7, 1, '#fff'),
      blocks: () => r(88, 14, 24, 24, 1, 4) + r(64, 38, 24, 24, .7, 4) + r(88, 38, 24, 24, .85, 4) + r(112, 38, 24, 24, .55, 4) + w(40, 74, 120, 12, .25, 3),
    };
    return (L[id] || (() => ''))();
  };
  GAMES.forEach((g) => { g.banner = `<svg class="bn" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="bg-${g.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--c)" stop-opacity=".55"/><stop offset="1" stop-color="#0e1013"/></linearGradient><radialGradient id="gl-${g.id}"><stop offset="0" stop-color="var(--c)" stop-opacity=".6"/><stop offset="1" stop-color="var(--c)" stop-opacity="0"/></radialGradient></defs><rect width="200" height="100" fill="url(#bg-${g.id})"/><circle cx="165" cy="12" r="60" fill="url(#gl-${g.id})"/><circle cx="20" cy="95" r="45" fill="url(#gl-${g.id})" opacity=".6"/>${M(g.id)}</svg>`; });
  GAMES.forEach((g) => ['name', 'desc', 'how'].forEach((f) => Object.defineProperty(g, f, { get: () => I18N.t('g.' + g.id + '.' + f[0]) })));
  GAMES.forEach((g) => { const m = g.mount; g.mount = (stage, ctx) => { RND = ctx.seed != null ? mulberry(ctx.seed) : Math.random; return m(stage, ctx); }; });
})();
