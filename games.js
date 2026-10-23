/* Fourteen puzzle games. Each mount(stage, ctx) returns a cleanup fn.
   ctx: sfx, hud, end({win,quality,score,label}), burst(el,color,n), pop(el,text,color), shake(el),
        diff (0 easy,1 normal,2 hard), combo(n), flash(color), power({label,cost,use(btn)}) */
(function () {
  const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstChild; };
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
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
              pairs++; combo++; bonus += combo * 20; ctx.sfx('good', combo); ctx.combo(combo); ctx.burst(a.c, col, 14); ctx.burst(b.c, col, 14); ctx.pop(b.c, combo > 1 ? 'Combo ×' + combo : 'Match', col);
              if (pairs === P && !ended) { ended = true; const s = Math.round((Date.now() - t0) / 1000); ctx.end({ win: true, quality: clamp(1 - (moves - P) / (P * 1.7)) * .8 + clamp(1 - s / (P * 11)) * .2, score: Math.max(0, 1000 - moves * 30 - s * 3) + bonus, label: `${moves} moves · ${s}s` }); }
              hud();
            }, 350);
          } else { combo = 0; ctx.combo(0); setTimeout(() => { a.c.classList.remove('flip'); b.c.classList.remove('flip'); open = []; lock = false; ctx.sfx('bad'); }, 750); }
          hud();
        }
      };
      grid.append(c);
    });
    const hud = () => ctx.hud([`Moves ${moves}`, `Pairs ${pairs}/${P}`, `${Math.round((Date.now() - t0) / 1000)}s`]);
    stage.append(grid); const all = [...grid.children]; all.forEach((c) => c.classList.add('flip')); ctx.hud(['Memorize…']);
    const pk = setTimeout(() => { all.forEach((c) => c.classList.remove('flip')); lock = false; t0 = Date.now(); timer = setInterval(hud, 1000); hud(); }, pick([2000, 1600, 1300], ctx.diff));
    ctx.power({ label: 'Peek', cost: 10, use: () => { if (lock) return; lock = true; const un = all.filter((c) => !c.classList.contains('done') && !c.classList.contains('flip')); un.forEach((c) => c.classList.add('flip')); setTimeout(() => { un.forEach((c) => c.classList.remove('flip')); lock = false; }, 900); } });
    return () => { clearTimeout(pk); clearInterval(timer); };
  }

  /* ---------- 2. Slide Master ---------- */
  function slide(stage, ctx) {
    const N = pick([3, 3, 4], ctx.diff), T = N * N; let t = Array.from({ length: T }, (_, i) => (i + 1) % T), moves = 0, done = false, lastMoved = -1;
    const nb = (z) => { const r = Math.floor(z / N), c = z % N, o = []; if (r > 0) o.push(z - N); if (r < N - 1) o.push(z + N); if (c > 0) o.push(z - 1); if (c < N - 1) o.push(z + 1); return o; };
    let prev = -1;
    for (let i = 0; i < pick([24, 70, 160], ctx.diff); i++) { const z = t.indexOf(0), o = nb(z).filter((x) => x !== prev), m = o[ri(0, o.length - 1)]; [t[z], t[m]] = [t[m], t[z]]; prev = z; }
    const solved = () => t.every((x, k) => x === (k + 1) % T);
    if (solved()) { [t[T - 2], t[T - 1]] = [t[T - 1], t[T - 2]]; }
    const board = $('<div class="slide-board"></div>'), tiles = {}, sz = 100 / N;
    const hud = () => ctx.hud([`Moves ${moves}`]);
    const place = () => t.forEach((v, i) => { if (v) { tiles[v].style.setProperty('--x', i % N); tiles[v].style.setProperty('--y', Math.floor(i / N)); } });
    const tryMove = (i) => {
      if (done) return; const z = t.indexOf(0);
      if (!nb(z).includes(i)) { ctx.sfx('bad'); return; }
      lastMoved = t[i]; [t[z], t[i]] = [t[i], t[z]]; moves++; ctx.sfx('tap'); place(); hud();
      if (solved()) { done = true; Object.values(tiles).forEach((e) => e.classList.add('ok')); ctx.sfx('win'); ctx.burst(board, '#3dd6a5', 40);
        const par = pick([14, 24, 70], ctx.diff); setTimeout(() => ctx.end({ win: true, quality: clamp(1 - (moves - par) / (par * 2.2)), score: Math.max(0, 1000 - moves * 8) + N * 100, label: `${moves} moves` }), 800); }
    };
    for (let v = 1; v < T; v++) { const e = $(`<button class="tile2" aria-label="Tile ${v}" style="--h:${150 + v * (210 / T)};width:${sz}%;height:${sz}%"><i style="font-size:${N === 4 ? '1.5rem' : '2rem'}">${v}</i></button>`); e.onclick = () => tryMove(t.indexOf(v)); tiles[v] = e; board.append(e); }
    const key = (e) => { const z = t.indexOf(0), i = { ArrowLeft: z % N < N - 1 ? z + 1 : -1, ArrowRight: z % N > 0 ? z - 1 : -1, ArrowUp: z + N, ArrowDown: z - N }[e.key]; if (i === undefined) return; e.preventDefault(); if (i >= 0 && i < T) tryMove(i); };
    document.addEventListener('keydown', key); place(); hud();
    ctx.power({ label: 'Hint', cost: 10, use: () => { const z = t.indexOf(0), md = (a, b) => Math.abs(Math.floor(a / N) - Math.floor(b / N)) + Math.abs((a % N) - (b % N));
      let best = null, bd = 99; nb(z).forEach((i) => { const v = t[i]; if (v === lastMoved) return; const d = md(z, v - 1) - md(i, v - 1); if (d < bd) { bd = d; best = v; } });
      if (best === null) best = t[nb(z)[0]]; tiles[best].classList.add('hint'); setTimeout(() => tiles[best].classList.remove('hint'), 1400); } });
    stage.append(board, $('<p class="hint" style="margin-top:12px">Tap a tile or use arrow keys. Fewer moves = more XP.</p>'));
    return () => document.removeEventListener('keydown', key);
  }

  /* ---------- 3. Word Scramble ---------- */
  const WORDS = ['planet', 'puzzle', 'rocket', 'jungle', 'silver', 'garden', 'bridge', 'castle', 'dragon', 'forest', 'island', 'marble', 'pirate', 'rabbit', 'sunset', 'cherry', 'dancer', 'engine', 'flower', 'guitar', 'hunter', 'insect', 'knight', 'legend', 'magnet', 'thunder', 'whisper', 'diamond', 'journey', 'mystery', 'pyramid', 'compass', 'harvest', 'lantern', 'volcano', 'penguin', 'blanket', 'cabinet', 'captain', 'balance', 'crystal', 'phantom', 'horizon', 'blizzard'];
  function words(stage, ctx) {
    const lenMax = pick([6, 7, 8], ctx.diff), lenMin = pick([5, 6, 7], ctx.diff);
    const pool0 = WORDS.filter((w) => w.length >= lenMin && w.length <= lenMax), list = shuffle(pool0.length >= 5 ? pool0 : WORDS).slice(0, 5);
    let idx = 0, solved = 0, left = pick([90, 75, 55], ctx.diff), skips = 2, cur = '', pool = [], over = false, combo = 0;
    const lw = $('<div class="letters"></div>'), lp = $('<div class="letters"></div>');
    const ctl = $('<div class="center"><div><button class="btn ghost sm" data-a="clear">Clear</button> <button class="btn ghost sm" data-a="skip">Skip</button></div><p class="hint">Tap letters or type on your keyboard</p></div>');
    const hud = () => ctx.hud([`Word ${Math.min(idx + 1, 5)}/5`, `Solved ${solved}`, { t: `${left}s`, low: left <= 10 }, `Skips ${skips}`]);
    const load = () => { if (idx >= 5) return fin(); const w = list[idx]; let s = w; while (s === w) s = shuffle(w.split('')).join(''); pool = s.split('').map((ch, i) => ({ ch, i, used: false })); cur = ''; draw(); };
    const draw = () => { const w = list[idx]; if (!w) return; lw.innerHTML = ''; lp.innerHTML = '';
      for (let i = 0; i < w.length; i++) lw.append($(`<div class="lett slot">${cur[i] || ''}</div>`));
      pool.forEach((p) => { const b = $(`<button class="lett ${p.used ? 'used' : ''}">${p.ch}</button>`); b.onclick = () => add(p); lp.append(b); }); hud(); };
    const add = (p) => { if (p.used || cur.length >= list[idx].length) return; p.used = true; cur += p.ch; ctx.sfx('tap'); check(); draw(); };
    const check = () => { const w = list[idx]; if (cur.length < w.length) return;
      if (cur === w) { solved++; combo++; ctx.sfx('good', combo); ctx.combo(combo); ctx.burst(lw, '#5aa9ff', 20); ctx.pop(lw, '+1 word', '#5aa9ff'); lw.querySelectorAll('.lett').forEach((l) => l.classList.add('good')); idx++; setTimeout(load, 500); }
      else { combo = 0; ctx.combo(0); ctx.sfx('bad'); ctx.shake(lw); pool.forEach((p) => (p.used = false)); cur = ''; } };
    const key = (e) => { if (e.target.tagName === 'INPUT') return; const k = e.key.toLowerCase();
      if (k === 'backspace') { const last = cur.slice(-1); if (last) { const p = pool.find((x) => x.used && x.ch === last); if (p) p.used = false; cur = cur.slice(0, -1); draw(); } }
      else if (/^[a-z]$/.test(k)) { const p = pool.find((x) => !x.used && x.ch === k); if (p) add(p); } };
    ctl.onclick = (e) => { const a = e.target.dataset.a; if (a === 'clear') { pool.forEach((p) => (p.used = false)); cur = ''; draw(); } if (a === 'skip' && skips > 0) { skips--; combo = 0; ctx.combo(0); idx++; load(); } };
    document.addEventListener('keydown', key);
    const timer = setInterval(() => { left--; if (left <= 0) fin(); else hud(); }, 1000);
    function fin() { if (over) return; over = true; clearInterval(timer); ctx.end({ win: solved >= 3, quality: solved / 5 * .85 + clamp(left / 75) * .15, score: solved * 200 + Math.max(0, left) * 4, label: `${solved}/5 words` }); }
    const box = $('<div class="center"></div>'); stage.append(box); box.append(lw, lp, ctl); load();
    ctx.power({ label: 'Reveal letter', cost: 10, use: () => { const w = list[idx]; if (!w) return; if (!w.startsWith(cur)) { pool.forEach((p) => (p.used = false)); cur = ''; } const p = pool.find((x) => !x.used && x.ch === w[cur.length]); if (p) add(p); } });
    ctx.power({ label: '+10 seconds', cost: 15, use: () => { left += 10; hud(); } });
    return () => { clearInterval(timer); document.removeEventListener('keydown', key); };
  }

  /* ---------- 4. Math Sprint ---------- */
  function math(stage, ctx) {
    const D = ctx.diff; let left = pick([60, 45, 35], D), score = 0, streak = 0, best = 0, ans = 0, over = false;
    const q = $('<div class="q"></div>'), inp = $('<input class="ans" inputmode="numeric" autocomplete="off" aria-label="Answer">');
    const hud = () => ctx.hud([{ t: `${left}s`, low: left <= 8 }, `Correct ${score}`, `Streak ${streak}`]);
    const next = () => {
      const lvl = Math.min(3, Math.floor(score / 5) + D), ops = lvl === 0 ? ['+', '-'] : lvl === 1 ? ['+', '-', '×'] : ['+', '-', '×', '×'];
      const op = ops[ri(0, ops.length - 1)]; let a, b;
      if (op === '+') { a = ri(5, 20 + lvl * 25); b = ri(5, 20 + lvl * 25); ans = a + b; }
      else if (op === '-') { a = ri(15, 40 + lvl * 40); b = ri(3, a - 1); ans = a - b; }
      else { a = ri(2, 9 + lvl * 3); b = ri(2, 9 + lvl * 2); ans = a * b; }
      q.textContent = `${a} ${op} ${b}`; inp.value = ''; hud();
    };
    inp.oninput = () => { if (+inp.value === ans && inp.value !== '') { score++; streak++; best = Math.max(best, streak); ctx.sfx('good', streak); ctx.combo(streak); ctx.pop(q, streak % 5 === 0 ? '+2s' : '+1', '#ffb454'); if (streak % 5 === 0) { left += 2; ctx.burst(q, '#ffb454', 20); } next(); } };
    inp.onkeydown = (e) => { if (e.key === 'Enter' && inp.value !== '' && +inp.value !== ans) { streak = 0; ctx.combo(0); ctx.sfx('bad'); ctx.shake(q); inp.value = ''; hud(); } };
    const timer = setInterval(() => { left--; if (left <= 0) { if (over) return; over = true; clearInterval(timer); ctx.end({ win: score >= 8, quality: clamp(score / (22 + D * 6)), score: score * 100 + best * 20, label: `${score} correct · best streak ${best}` }); } else hud(); }, 1000);
    stage.append(q, inp, $('<p class="hint" style="margin-top:14px">Type the answer. It submits itself when correct. Enter clears a wrong guess. Every 5 streak adds 2 seconds.</p>'));
    next(); setTimeout(() => inp.focus(), 100);
    ctx.power({ label: '+8 seconds', cost: 15, use: () => { left += 8; hud(); inp.focus(); } });
    return () => clearInterval(timer);
  }

  /* ---------- 5. Pattern Echo ---------- */
  function pattern(stage, ctx) {
    const cols = ['#ff6b5e', '#3dd6a5', '#5aa9ff', '#ffb454'], seq = []; let pos = 0, accept = false, ended = false, to = [];
    const base = pick([660, 600, 520], ctx.diff);
    const wrap = $('<div class="pads"></div>');
    const pads = cols.map((c, i) => { const b = $(`<button class="pad" style="--c:${c}" aria-label="Pad ${i + 1}" disabled></button>`); b.onclick = () => press(i); wrap.append(b); return b; });
    const hud = (m) => ctx.hud([`Round ${seq.length}`, m || '']);
    const flash = (i, ms = 380) => { pads[i].classList.add('lit'); ctx.sfx('note', i); to.push(setTimeout(() => pads[i].classList.remove('lit'), ms)); };
    const playSeq = () => { accept = false; pads.forEach((p) => (p.disabled = true)); pos = 0; hud('Watch…'); const gap = Math.max(280, base - seq.length * 25);
      seq.forEach((s, k) => to.push(setTimeout(() => flash(s), 700 + k * gap)));
      to.push(setTimeout(() => { accept = true; pads.forEach((p) => (p.disabled = false)); hud('Your turn'); }, 700 + seq.length * gap)); };
    const play = () => { seq.push(ri(0, 3)); playSeq(); };
    function press(i) {
      if (!accept || ended) return; flash(i, 200); ctx.burst(pads[i], cols[i], 8);
      if (i !== seq[pos]) { ended = true; ctx.sfx('bad'); ctx.shake(wrap); const r = seq.length - 1; return void setTimeout(() => ctx.end({ win: r >= 5, quality: clamp(r / (11 + ctx.diff * 3)), score: r * 150, label: `Reached round ${r}` }), 600); }
      if (++pos === seq.length) { accept = false; ctx.combo(seq.length); ctx.pop(wrap, `Round ${seq.length} ✓`, '#3dd6a5'); to.push(setTimeout(play, 800)); }
    }
    const kd = (e) => { const i = '1234'.indexOf(e.key); if (i >= 0) press(i); }; document.addEventListener('keydown', kd);
    stage.append(wrap, $('<p class="hint" style="margin-top:12px">Tap the pads or press 1–4.</p>')); to.push(setTimeout(play, 600));
    ctx.power({ label: 'Replay', cost: 10, use: () => { if (!accept) return; to.forEach(clearTimeout); to = []; playSeq(); } });
    return () => { to.forEach(clearTimeout); document.removeEventListener('keydown', kd); };
  }

  /* ---------- 6. Lights Out ---------- */
  function lights(stage, ctx) {
    const N = 5; let g = Array(N * N).fill(false), moves = 0, done = false;
    const tog = (i) => { const r = Math.floor(i / N), c = i % N; [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < N && cc >= 0 && cc < N) g[rr * N + cc] = !g[rr * N + cc]; }); };
    const presses = pick([5, 9, 14], ctx.diff), sol = new Set(shuffle([...Array(N * N).keys()]).slice(0, presses)); sol.forEach(tog);
    if (!g.some(Boolean)) { tog(12); sol.add(12); }
    const grid = $('<div class="board-g lights"></div>'); let hintI = -1;
    const hud = () => ctx.hud([`Moves ${moves}`, `Lights ${g.filter(Boolean).length}`]);
    const draw = () => { grid.innerHTML = ''; g.forEach((on, i) => { const b = $(`<button class="lt ${on ? 'on' : ''} ${i === hintI ? 'hint' : ''}" aria-label="Light ${i + 1} ${on ? 'on' : 'off'}"></button>`);
      b.onclick = () => { if (done) return; tog(i); sol.has(i) ? sol.delete(i) : sol.add(i); hintI = -1; moves++; ctx.sfx('tap'); draw(); hud();
        if (!g.some(Boolean)) { done = true; ctx.sfx('win'); ctx.burst(grid, '#f2d45c', 50); setTimeout(() => ctx.end({ win: true, quality: clamp(1 - (moves - presses) / (presses * 2 + 8)), score: Math.max(0, 1000 - moves * 20), label: `${moves} moves` }), 700); } };
      grid.append(b); }); };
    draw(); hud(); stage.append(grid, $('<p class="hint" style="margin-top:12px">Tapping a light flips it and its neighbours. Turn them all off.</p>'));
    ctx.power({ label: 'Hint', cost: 10, use: () => { const a = [...sol]; if (!a.length) return; hintI = a[ri(0, a.length - 1)]; draw(); } });
    return () => {};
  }

  /* ---------- 7. Merge ---------- */
  function merge(stage, ctx) {
    const GOAL = pick([128, 256, 512], ctx.diff);
    let g = Array(16).fill(0), score = 0, moves = 0, over = false, prev = Array(16).fill(0), combo = 0, snap = null;
    const addT = () => { const e = g.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0); if (e.length) g[e[ri(0, e.length - 1)]] = Math.random() < .9 ? 2 : 4; };
    addT(); addT();
    const ix = (d, i, j) => [i * 4 + j, j * 4 + i, i * 4 + (3 - j), (3 - j) * 4 + i][d];
    const slideLine = (l) => { const a = l.filter(Boolean), o = []; let gain = 0; for (let k = 0; k < a.length; k++) { if (a[k] === a[k + 1]) { o.push(a[k] * 2); gain += a[k] * 2; k++; } else o.push(a[k]); } while (o.length < 4) o.push(0); return [o, gain]; };
    const canMove = () => g.some((v, i) => !v || (i % 4 < 3 && v === g[i + 1]) || (i < 12 && v === g[i + 4]));
    const grid = $('<div class="board-g m2048" style="touch-action:none"></div>');
    const draw = () => { grid.innerHTML = ''; g.forEach((v, i) => { const l = v ? Math.log2(v) : 0, hue = (l * 36 + 70) % 360; grid.append($(`<div class="mt2 ${v && v !== prev[i] ? 'pp' : ''}" style="${v ? `background:hsl(${hue} 55% ${Math.max(26, 52 - l * 2)}%);color:${l >= 5 ? '#14170a' : 'var(--tx)'}` : ''}">${v || ''}</div>`)); }); prev = g.slice(); ctx.hud([`Score ${score}`, `Best ${Math.max(...g)}`, `Goal ${GOAL}`]); };
    const move = (d) => {
      if (over) return; const before = { g: g.slice(), score, moves }; let ch = false, tg = 0;
      for (let i = 0; i < 4; i++) { const idx = [0, 1, 2, 3].map((j) => ix(d, i, j)); const [o, gain] = slideLine(idx.map((k) => g[k])); idx.forEach((k, j) => { if (g[k] !== o[j]) ch = true; g[k] = o[j]; }); score += gain; tg += gain; }
      if (!ch) return; snap = before; if (tg) { combo++; ctx.combo(combo); ctx.pop(grid, '+' + tg, '#d6ff3d'); ctx.sfx('good', combo); } else { combo = 0; ctx.combo(0); ctx.sfx('tap'); }
      moves++; addT(); draw();
      const mx = Math.max(...g);
      if (mx >= GOAL) { over = true; ctx.sfx('win'); ctx.burst(grid, '#d6ff3d', 60); setTimeout(() => ctx.end({ win: true, quality: clamp(1 - (moves - GOAL / 3) / 220), score, label: `${GOAL} in ${moves} moves` }), 700); }
      else if (!canMove()) { over = true; setTimeout(() => ctx.end({ win: false, quality: clamp(mx / GOAL) * .8, score, label: `Best tile ${mx}` }), 500); }
    };
    const key = (e) => { const d = { ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, ArrowDown: 3 }[e.key]; if (d !== undefined) { e.preventDefault(); move(d); } };
    let sx, sy;
    grid.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    grid.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return; move(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 0 : 2) : (dy < 0 ? 1 : 3)); });
    document.addEventListener('keydown', key); draw();
    ctx.power({ label: 'Undo', cost: 10, use: () => { if (!snap || over) return; g = snap.g; score = snap.score; moves = snap.moves; snap = null; combo = 0; ctx.combo(0); prev = g.slice(); draw(); } });
    stage.append(grid, $(`<p class="hint">Swipe or use arrow keys. Merge equal tiles to reach ${GOAL}.</p>`));
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
      b.onclick = () => { if (!fixed[i] && !done) { sel = i; draw(); } }; grid.append(b); }); ctx.hud([`Moves ${moves}`, `${Math.round((Date.now() - t0) / 1000)}s`]); };
    const setV = (i, n) => { v[i] = n; moves++; ctx.sfx(n && conflict(i) ? 'bad' : 'tap'); draw(); check(); };
    [1, 2, 3, 4, 0].forEach((n) => { const b = $(`<button class="btn">${n || 'Erase'}</button>`); b.onclick = () => { if (sel < 0 || done) return; setV(sel, n); }; padEl.append(b); });
    const key = (e) => { if (done) return; if (/^[0-4]$/.test(e.key) && sel >= 0) setV(sel, +e.key); };
    document.addEventListener('keydown', key);
    const check = () => { if (v.every(Boolean) && v.every((_, i) => !conflict(i))) { done = true; const s = Math.round((Date.now() - t0) / 1000); ctx.sfx('win'); ctx.burst(grid, '#ff9f6b', 50); setTimeout(() => ctx.end({ win: true, quality: clamp(1 - (moves - 9) / 25) * .6 + clamp(1 - s / 150) * .4, score: Math.max(0, 1000 - s * 4 - moves * 5), label: `${s}s · ${moves} moves` }), 600); } };
    const tm = setInterval(() => !done && draw(), 1000);
    ctx.power({ label: 'Hint', cost: 15, use: () => { const e = v.map((x, i) => (!fixed[i] && v[i] !== sol[i] ? i : -1)).filter((i) => i >= 0); if (!e.length) return; const i = e[ri(0, e.length - 1)]; fixed[i] = true; setV(i, sol[i]); } });
    draw(); stage.append(grid, padEl, $('<p class="hint">Fill the grid so every row, column and 2×2 box has 1–4 once. Keys 1–4 work.</p>'));
    return () => { clearInterval(tm); document.removeEventListener('keydown', key); };
  }

  /* ---------- 9. Color Clash ---------- */
  function stroop(stage, ctx) {
    const ALL = [['RED', '#ff6b5e'], ['GREEN', '#3dd6a5'], ['BLUE', '#5aa9ff'], ['YELLOW', '#ffd25e'], ['PINK', '#ff7aa8']], C = ALL.slice(0, ctx.diff === 2 ? 5 : 4), K = C.length;
    let left = pick([40, 30, 24], ctx.diff), ok = 0, lives = 3, cur, ended = false, streak = 0;
    const word = $('<div class="q"></div>'), btns = $('<div class="sdk-pad"></div>');
    const hud = () => ctx.hud([{ t: `${left}s`, low: left <= 6 }, `Correct ${ok}`, `Lives ${lives}`]);
    const next = () => { const w = ri(0, K - 1); let c = ri(0, K - 1); if (Math.random() < .8) while (c === w) c = ri(0, K - 1); cur = c; word.textContent = C[w][0]; word.style.color = C[c][1]; hud(); };
    C.forEach(([n, col], i) => { const b = $(`<button class="btn" style="border-color:${col}">${n}</button>`);
      b.onclick = () => { if (ended) return; if (i === cur) { ok++; streak++; ctx.sfx('good', streak); ctx.combo(streak); ctx.pop(word, '+1', C[cur][1]); if (streak % 6 === 0) { left += 2; ctx.pop(word, '+2s', '#d6ff3d'); } } else { lives--; streak = 0; ctx.combo(0); ctx.sfx('bad'); ctx.shake(word); if (lives <= 0) return fin(); } next(); }; btns.append(b); });
    const timer = setInterval(() => { left--; if (left <= 0) fin(); else hud(); }, 1000);
    function fin() { if (ended) return; ended = true; clearInterval(timer); ctx.end({ win: ok >= 10, quality: clamp(ok / (24 + ctx.diff * 4)), score: ok * 100 + lives * 50, label: `${ok} correct` }); }
    stage.append($('<p class="hint" style="margin:0 0 6px">Tap the COLOR of the text, not the word.</p>'), word, btns); next();
    ctx.power({ label: '+5 seconds', cost: 10, use: () => { left += 5; hud(); } });
    return () => clearInterval(timer);
  }

  /* ---------- 10. Odd Tile ---------- */
  function odd(stage, ctx) {
    let round = 0, left = pick([50, 45, 40], ctx.diff), lives = 3, ended = false, streak = 0, oddEl = null;
    const grid = $('<div class="board-g" style="width:min(100%,360px)"></div>');
    const hud = () => ctx.hud([{ t: `${left}s`, low: left <= 8 }, `Round ${round}`, `Lives ${lives}`]);
    const next = () => { round++; const n = Math.min(7, 3 + Math.floor(round / 3)), h = ri(0, 360), diff = Math.max(3.5, pick([26, 20, 15], ctx.diff) - round * 1.2), oi = ri(0, n * n - 1);
      grid.style.gridTemplateColumns = `repeat(${n},1fr)`; grid.innerHTML = '';
      for (let i = 0; i < n * n; i++) { const b = $(`<button class="ot" aria-label="Tile ${i + 1}" style="background:hsl(${h} 60% ${i === oi ? 55 + diff : 55}%)"></button>`); if (i === oi) oddEl = b;
        b.onclick = () => { if (ended) return; if (i === oi) { streak++; ctx.sfx('good', streak); ctx.combo(streak); ctx.burst(b, '#4fd1e0', 10); if (streak % 5 === 0) left += 3; next(); } else { lives--; streak = 0; ctx.combo(0); ctx.sfx('bad'); if (lives <= 0) fin(); else { ctx.shake(grid); hud(); } } }; grid.append(b); } hud(); };
    const timer = setInterval(() => { left--; if (left <= 0) fin(); else hud(); }, 1000);
    function fin() { if (ended) return; ended = true; clearInterval(timer); const r = round - 1; ctx.end({ win: r >= 8, quality: clamp(r / (20 + ctx.diff * 4)), score: r * 120, label: `${r} found` }); }
    stage.append(grid, $('<p class="hint" style="margin-top:12px">Tap the tile with a slightly different shade. Every 5 in a row adds 3 seconds.</p>')); next();
    ctx.power({ label: 'Spot it', cost: 10, use: () => { if (oddEl) { oddEl.classList.add('hint'); setTimeout(() => oddEl && oddEl.classList.remove('hint'), 1200); } } });
    return () => clearInterval(timer);
  }

  /* ---------- 11. Number Recall ---------- */
  function recall(stage, ctx) {
    let len = pick([3, 4, 5], ctx.diff), ended = false, to = [], num = '', phase = 'show';
    const box = $('<div class="q" style="letter-spacing:.2em"></div>'), form = $('<form class="center"><input class="ans" inputmode="numeric" autocomplete="off" aria-label="Number"><button class="btn primary" type="submit">Check</button></form>'), inp = form.querySelector('input');
    const hud = (m) => ctx.hud([`Digits ${len}`, m || '']);
    const mask = () => '• '.repeat(len).trim();
    const show = () => { phase = 'show'; num = Array.from({ length: len }, () => ri(0, 9)).join(''); box.textContent = num; form.style.display = 'none'; hud('Memorize'); inp.value = '';
      to.push(setTimeout(() => { phase = 'type'; box.textContent = mask(); form.style.display = ''; hud('Type it'); inp.focus(); }, 800 + len * pick([550, 450, 350], ctx.diff))); };
    form.onsubmit = (e) => { e.preventDefault(); if (ended || phase !== 'type') return;
      if (inp.value.trim() === num) { ctx.sfx('good', len - 3); ctx.combo(len - 2); ctx.burst(box, '#ff7aa8', 16); len++; show(); }
      else { ended = true; ctx.sfx('bad'); ctx.shake(box); box.textContent = num; const r = len - 1; to.push(setTimeout(() => ctx.end({ win: r >= pick([5, 6, 7], ctx.diff), quality: clamp((r - 2) / 8), score: r * 150, label: `${r} digits` }), 900)); } };
    const wrap = $('<div class="center"></div>'); stage.append(wrap); wrap.append(box, form); show();
    ctx.power({ label: 'Show again', cost: 10, use: () => { if (phase !== 'type') return; box.textContent = num; to.push(setTimeout(() => { if (!ended) box.textContent = mask(); }, 1200)); } });
    return () => to.forEach(clearTimeout);
  }

  /* ---------- 12. Mine Sweep ---------- */
  function sweep(stage, ctx) {
    const N = pick([8, 8, 10], ctx.diff), M = pick([8, 10, 18], ctx.diff);
    let cells = Array.from({ length: N * N }, () => ({ m: false, o: false, f: false, n: 0 })), placed = false, flagMode = false, over = false, t0 = null, tm, flags = 0, lastLP = 0;
    const nbrs = (i) => { const r = Math.floor(i / N), c = i % N, o = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < N && cc >= 0 && cc < N) o.push(rr * N + cc); } return o; };
    const grid = $(`<div class="board-g sweep" style="grid-template-columns:repeat(${N},1fr)"></div>`), tools = $('<div class="sdk-pad"></div>'), fb = $('<button class="btn">Flag mode: off</button>');
    const hud = () => ctx.hud([`Mines ${M - flags}`, `${t0 ? Math.round((Date.now() - t0) / 1000) : 0}s`]);
    const place = (safe) => { const ex = new Set([safe, ...nbrs(safe)]); shuffle([...Array(N * N).keys()].filter((i) => !ex.has(i))).slice(0, M).forEach((i) => (cells[i].m = true)); cells.forEach((c, i) => (c.n = nbrs(i).filter((k) => cells[k].m).length)); placed = true; t0 = Date.now(); tm = setInterval(hud, 1000); };
    const reveal = (i) => { const st = [i]; let cnt = 0; while (st.length) { const k = st.pop(), c = cells[k]; if (c.o || c.f) continue; c.o = true; cnt++; if (c.n === 0) nbrs(k).forEach((x) => !cells[x].o && st.push(x)); } return cnt; };
    const win = () => { over = true; clearInterval(tm); const s = Math.round((Date.now() - t0) / 1000); ctx.sfx('win'); ctx.burst(grid, '#ff8a6b', 60); setTimeout(() => ctx.end({ win: true, quality: clamp(1 - s / (N * 20)) * .7 + .3, score: Math.max(0, 1500 - s * 5), label: `${s}s` }), 700); };
    const act = (i, flag) => {
      if (over) return; const c = cells[i];
      if (flag) { if (c.o) return; c.f = !c.f; flags += c.f ? 1 : -1; ctx.sfx('tap'); draw(); return; }
      if (c.f || c.o) return; if (!placed) place(i);
      if (c.m) { over = true; clearInterval(tm); cells.forEach((x) => { if (x.m) x.o = true; }); draw(); ctx.sfx('bad'); ctx.shake(grid); const op = cells.filter((x) => x.o && !x.m).length;
        return void setTimeout(() => ctx.end({ win: false, quality: clamp(op / (N * N - M)) * .5, score: op * 20, label: 'Hit a mine' }), 1100); }
      const n = reveal(i); ctx.sfx('good', Math.min(7, Math.floor(n / 3))); draw(); if (n > 4) ctx.pop(grid, `+${n}`, '#ff8a6b');
      if (cells.every((x) => x.m || x.o)) win();
    };
    function draw() { grid.innerHTML = ''; cells.forEach((c, i) => { const b = $(`<button class="mc ${c.o ? 'open' : ''} ${c.o && c.m ? 'boom' : ''}" data-n="${c.o && !c.m ? c.n : ''}" aria-label="Cell ${i + 1}">${c.o ? (c.m ? '✹' : (c.n || '')) : (c.f ? '⚑' : '')}</button>`);
      b.onclick = () => { if (Date.now() - lastLP < 700) return; act(i, flagMode); }; b.oncontextmenu = (e) => { e.preventDefault(); act(i, true); };
      let lp; b.onpointerdown = () => { lp = setTimeout(() => { lastLP = Date.now(); act(i, true); }, 420); }; b.onpointerup = b.onpointerleave = () => clearTimeout(lp); grid.append(b); }); hud(); }
    fb.onclick = () => { flagMode = !flagMode; fb.textContent = 'Flag mode: ' + (flagMode ? 'on' : 'off'); fb.classList.toggle('primary', flagMode); };
    tools.append(fb); draw(); stage.append(grid, tools, $('<p class="hint">Tap to reveal. Long-press, right-click or Flag mode to mark mines. First tap is always safe.</p>'));
    ctx.power({ label: 'Safe cell', cost: 20, use: () => { if (over) return; if (!placed) place(Math.floor(N * N / 2)); const s = cells.map((c, i) => (!c.m && !c.o ? i : -1)).filter((i) => i >= 0); if (!s.length) return; const i = s[ri(0, s.length - 1)]; cells[i].f = false; reveal(i); draw(); if (cells.every((x) => x.m || x.o)) win(); } });
    return () => clearInterval(tm);
  }

  /* ---------- 13. Code Breaker ---------- */
  function code(stage, ctx) {
    const ALL = ['#ff6b5e', '#ffb454', '#f2d45c', '#3dd6a5', '#5aa9ff', '#c28bff', '#ff7aa8'], NC = pick([5, 6, 7], ctx.diff), COLS = ALL.slice(0, NC), MAX = pick([10, 8, 7], ctx.diff), secret = shuffle([...Array(NC).keys()]).slice(0, 4);
    let rows = [], cur = [null, null, null, null], over = false;
    const board = $('<div class="cb-board"></div>'), pal = $('<div class="cb-pal"></div>'), chk = $('<button class="btn primary">Check</button>'), hintBox = $('<p class="hint" style="min-height:22px"></p>');
    const hud = () => ctx.hud([`Try ${Math.min(rows.length + 1, MAX)}/${MAX}`]);
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
      if (ex === 4) { over = true; draw(); ctx.sfx('win'); ctx.burst(board, '#6bc8ff', 60); const n = rows.length; setTimeout(() => ctx.end({ win: true, quality: clamp(1 - (n - 3) / (MAX - 2)), score: (MAX + 1 - n) * 150, label: `Cracked in ${n}` }), 800); }
      else if (rows.length >= MAX) { over = true; draw(); ctx.sfx('bad'); board.insertAdjacentHTML('beforeend', `<div class="cb-row">${secret.map((c) => `<span class="cb-dot" style="background:${COLS[c]}"></span>`).join('')}</div>`); setTimeout(() => ctx.end({ win: false, quality: .15, score: 0, label: 'Code not cracked' }), 1500); }
      else { ctx.sfx('good', ex); draw(); }
    };
    chk.onclick = submit;
    const key = (e) => { if (e.key === 'Enter') submit(); else if (e.key === 'Backspace') { const k = cur.map((x) => x !== null).lastIndexOf(true); if (k >= 0) { cur[k] = null; draw(); } } else { const c = +e.key - 1; if (c >= 0 && c < NC) put(c); } };
    document.addEventListener('keydown', key); draw();
    const row2 = $('<div class="sdk-pad"></div>'); row2.append(chk);
    stage.append(board, pal, row2, hintBox, $('<p class="hint">Find the hidden 4 colors (no repeats). Filled peg: right color, right spot. Hollow peg: right color, wrong spot.</p>'));
    let revealed = 0;
    ctx.power({ label: 'Reveal a spot', cost: 20, use: () => { if (over || revealed >= 3) return; const k = revealed++; hintBox.innerHTML = (hintBox.innerHTML || '') + `Spot ${k + 1}: <span class="cb-dot" style="display:inline-block;width:16px;height:16px;vertical-align:middle;background:${COLS[secret[k]]}"></span> &nbsp;`; } });
    return () => document.removeEventListener('keydown', key);
  }

  /* ---------- 14. Target Rush ---------- */
  function rush(stage, ctx) {
    const D = ctx.diff; let left = 30, score = 0, combo = 0, lives = pick([4, 3, 2], D), over = false, active = 0; const to = [], need = pick([10, 12, 15], D), speed = pick([1.25, 1, .8], D);
    const arena = $('<div class="arena"></div>');
    const hud = () => ctx.hud([{ t: `${left}s`, low: left <= 6 }, `Hits ${score}`, `Lives ${lives}`]);
    const wave = () => { if (over) return; const n = score >= 12 ? 2 : 1; for (let i = 0; i < n; i++) spawn(); };
    const resolved = () => { active--; if (!over && active <= 0) to.push(setTimeout(wave, 160)); };
    function spawn() {
      active++; const life = Math.max(700, 1500 * speed - score * 35), size = Math.max(46, 76 - score * 1.2);
      const b = $(`<button class="tg" aria-label="Target" style="left:${ri(4, 80)}%;top:${ri(4, 80)}%;width:${size}px;height:${size}px;--d:${life}ms"><i></i></button>`); let done = false;
      b.onpointerdown = (e) => { e.preventDefault(); if (done || over) return; done = true; combo++; score++; ctx.sfx('good', combo); ctx.combo(combo); ctx.burst(b, '#4fd1e0', 12); ctx.pop(b, combo > 2 ? `×${combo}` : '+1', '#4fd1e0'); b.remove(); hud(); resolved(); };
      to.push(setTimeout(() => { if (done || over) return; done = true; b.remove(); combo = 0; ctx.combo(0); lives--; ctx.sfx('bad'); ctx.shake(arena); hud(); if (lives <= 0) fin(); else resolved(); }, life));
      arena.append(b);
    }
    const timer = setInterval(() => { left--; if (left <= 0) fin(); else hud(); }, 1000);
    function fin() { if (over) return; over = true; clearInterval(timer); arena.innerHTML = ''; ctx.end({ win: score >= need, quality: clamp(score / (need * 2.3)), score: score * 100, label: `${score} hits` }); }
    stage.append(arena, $(`<p class="hint" style="margin-top:12px">Tap targets before the ring closes. Hit ${need} to win.</p>`)); hud(); wave();
    ctx.power({ label: '+1 life', cost: 15, use: () => { lives++; hud(); } });
    return () => { clearInterval(timer); over = true; to.forEach(clearTimeout); };
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
    ticket: svg('<path d="M3 9a2 2 0 002-2V6h14v1a2 2 0 002 2v2a2 2 0 000 2v2a2 2 0 00-2 2v1H5v-1a2 2 0 00-2-2v-2a2 2 0 000-2z"/><path d="M13 7v10" stroke-dasharray="2 2"/>'),
    cash: svg('<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>'),
    coin: svg('<circle cx="12" cy="12" r="8"/><path d="M12 8v8"/>'),
    gift: svg('<rect x="4" y="9" width="16" height="11" rx="2"/><path d="M12 9v11M3 6h18v3H3z"/>'),
    phone: svg('<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>'),
    heart: svg('<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>'),
  };
  window.GAMES = [
    { id: 'memory', name: 'Memory Match', icon: ICON.memory, color: '#8b7bff', art: 'dots', tag: 'Memory', time: '1 min', desc: 'Find every pair. Chain matches for combos.', how: 'Cards flash briefly, then hide. Flip two at a time and match every pair. Chain matches for combo points. Peek costs 10 coins.', mount: memory },
    { id: 'slide', name: 'Slide Master', icon: ICON.slide, color: '#3dd6a5', art: 'grid', tag: 'Logic', time: '2 min', desc: 'Slide tiles into order. Plan ahead.', how: 'Tap a tile next to the gap, or use arrow keys. Put the tiles in order. Hard mode is a 4×4 board. Fewer moves earn more XP.', mount: slide },
    { id: 'words', name: 'Word Scramble', icon: ICON.words, color: '#5aa9ff', art: 'stripes', tag: 'Language', time: '75 sec', desc: 'Unscramble 5 words before time runs out.', how: 'Tap letters (or type) to spell each word. You have 2 skips. Solve at least 3 to win. Power-ups can reveal a letter or add time.', mount: words },
    { id: 'math', name: 'Math Sprint', icon: ICON.math, color: '#ffb454', art: 'cross', tag: 'Speed', time: '45 sec', desc: 'Answer as many sums as you can.', how: 'Type the answer. It submits itself when correct. Every 5 in a row adds 2 seconds. Get 8 right to win.', mount: math },
    { id: 'pattern', name: 'Pattern Echo', icon: ICON.pattern, color: '#ff7aa8', art: 'rings', tag: 'Focus', time: '2 min', desc: 'Repeat the growing light-and-sound pattern.', how: 'Watch the pads light up, then repeat the order. It speeds up as it grows. Reach round 5 to win. Keys 1–4 work.', mount: pattern },
    { id: 'lights', name: 'Lights Out', icon: ICON.lights, color: '#f2d45c', art: 'dots', tag: 'Logic', time: '2 min', desc: 'Switch off every light on the grid.', how: 'Tapping a light flips it and the four next to it. Turn every light off in as few taps as you can. Hint shows a cell to tap.', mount: lights },
    { id: 'merge', name: 'Merge', icon: ICON.merge, color: '#d6ff3d', art: 'check', tag: 'Logic', time: '3 min', desc: 'Merge tiles to hit the goal tile.', how: 'Swipe or use arrow keys. Equal tiles merge. Reach the goal tile (128, 256 or 512) before the board fills. Undo is available.', mount: merge },
    { id: 'sudoku', name: 'Mini Sudoku', icon: ICON.sudoku, color: '#ff9f6b', art: 'grid', tag: 'Logic', time: '2 min', desc: 'A quick 4×4 number grid.', how: 'Pick an empty cell, then a number. Every row, column and 2×2 box must contain 1 to 4 once. Hint fills a cell for you.', mount: sudoku },
    { id: 'stroop', name: 'Color Clash', icon: ICON.stroop, color: '#c28bff', art: 'split', tag: 'Focus', time: '30 sec', desc: 'Name the color, ignore the word.', how: 'A color name appears in a different ink color. Tap the button for the INK color. 3 mistakes end the round.', mount: stroop },
    { id: 'odd', name: 'Odd Tile', icon: ICON.odd, color: '#4fd1e0', art: 'check', tag: 'Focus', time: '45 sec', desc: 'Spot the tile with a different shade.', how: 'One tile has a slightly different shade. Tap it. The grid grows and the difference shrinks. 3 mistakes end the round.', mount: odd },
    { id: 'sweep', name: 'Mine Sweep', icon: ICON.sweep, color: '#ff8a6b', art: 'check', tag: 'Logic', time: '3 min', desc: 'Clear the field without hitting a mine.', how: 'Tap to reveal a cell. Numbers show how many mines touch it. Long-press or Flag mode marks mines. Clear every safe cell to win. Your first tap is always safe.', mount: sweep },
    { id: 'code', name: 'Code Breaker', icon: ICON.code, color: '#6bc8ff', art: 'dots', tag: 'Logic', time: '3 min', desc: 'Crack the hidden 4-color code.', how: 'Pick 4 colors and press Check. A filled peg means right color and spot. A hollow peg means right color, wrong spot. Crack it before you run out of tries.', mount: code },
    { id: 'rush', name: 'Target Rush', icon: ICON.rush, color: '#4fd1e0', art: 'rings', tag: 'Speed', time: '30 sec', desc: 'Hit targets before they vanish.', how: 'Targets pop up and shrink. Tap them before the ring closes. Build combos. Run out of lives and the round ends.', mount: rush },
    { id: 'recall', name: 'Number Recall', icon: ICON.recall, color: '#ff7aa8', art: 'lines', tag: 'Memory', time: '2 min', desc: 'Memorize a number, then type it.', how: 'A number flashes briefly. Type it back from memory. Each success adds one digit.', mount: recall },
  ];
})();
