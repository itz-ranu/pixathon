/* Six puzzle games. Each mount(stage, ctx) returns a cleanup fn.
   ctx: { hud([{t,low}|string]), end({win,quality,score,label}), sfx(name) }  quality in 0..1 */
(function () {
  const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstChild; };
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  /* ---------- 1. Memory Match ---------- */
  function memory(stage, ctx) {
    const E = ['●', '▲', '■', '◆', '★', '✚', '♥', '☾'], COL = ['#d6ff3d', '#ff7aa8', '#5aa9ff', '#ffb454', '#8b7bff', '#3dd6a5', '#ff6b5e', '#f1efe9'];
    const deck = shuffle([...E, ...E]);
    let open = [], moves = 0, pairs = 0, lock = false, t0 = Date.now(), timer;
    const grid = $('<div class="board-g mem"></div>');
    deck.forEach((e, i) => {
      const c = $(`<div class="card3d"><button aria-label="Card ${i + 1}"><span class="f"></span><span class="b" style="color:${COL[E.indexOf(e)]}">${e}</span></button></div>`);
      c.firstChild.onclick = () => {
        if (lock || c.classList.contains('flip') || c.classList.contains('done')) return;
        c.classList.add('flip'); ctx.sfx('tap'); open.push({ c, e });
        if (open.length === 2) {
          moves++; lock = true;
          const [a, b] = open;
          if (a.e === b.e) {
            setTimeout(() => { a.c.classList.add('done'); b.c.classList.add('done'); a.c.classList.remove('flip'); b.c.classList.remove('flip'); open = []; lock = false; pairs++; ctx.sfx('good');
              if (pairs === 8) { const s = Math.round((Date.now() - t0) / 1000); ctx.end({ win: true, quality: clamp(1 - (moves - 8) / 14) * 0.8 + clamp(1 - s / 90) * 0.2, score: Math.max(0, 1000 - moves * 30 - s * 3), label: `${moves} moves · ${s}s` }); }
              hud(); }, 350);
          } else setTimeout(() => { a.c.classList.remove('flip'); b.c.classList.remove('flip'); open = []; lock = false; ctx.sfx('bad'); }, 750);
          hud();
        }
      };
      grid.append(c);
    });
    const hud = () => ctx.hud([`Moves ${moves}`, `Pairs ${pairs}/8`, `${Math.round((Date.now() - t0) / 1000)}s`]);
    timer = setInterval(hud, 1000); hud();
    stage.append(grid);
    return () => clearInterval(timer);
  }

  /* ---------- 2. Slide Puzzle ---------- */
  function slide(stage, ctx) {
    let t = [1, 2, 3, 4, 5, 6, 7, 8, 0], moves = 0, done = false;
    const nb = (z) => { const r = Math.floor(z / 3), c = z % 3, o = []; if (r > 0) o.push(z - 3); if (r < 2) o.push(z + 3); if (c > 0) o.push(z - 1); if (c < 2) o.push(z + 1); return o; };
    let prev = -1;
    for (let i = 0; i < 70; i++) { const z = t.indexOf(0); const o = nb(z).filter((x) => x !== prev); const m = o[ri(0, o.length - 1)]; [t[z], t[m]] = [t[m], t[z]]; prev = z; }
    if (t.every((v, i) => v === (i + 1) % 9)) t = [1, 2, 3, 4, 5, 6, 0, 7, 8];
    const grid = $('<div class="board-g slide"></div>');
    const hud = () => ctx.hud([`Moves ${moves}`]);
    const draw = () => {
      grid.innerHTML = '';
      t.forEach((v, i) => {
        const b = $(`<button class="tile ${v ? '' : 'empty'}" aria-label="${v || 'empty'}">${v || ''}</button>`);
        b.onclick = () => {
          if (done) return; const z = t.indexOf(0);
          if (!nb(z).includes(i)) { ctx.sfx('bad'); b.classList.add('shake'); return; }
          [t[z], t[i]] = [t[i], t[z]]; moves++; ctx.sfx('tap'); draw(); hud();
          if (t.every((x, k) => x === (k + 1) % 9)) { done = true; grid.querySelectorAll('.tile:not(.empty)').forEach((e) => e.classList.add('ok')); ctx.sfx('good');
            setTimeout(() => ctx.end({ win: true, quality: clamp(1 - (moves - 20) / 80), score: Math.max(0, 1000 - moves * 8), label: `${moves} moves` }), 700); }
        };
        grid.append(b);
      });
    };
    draw(); hud(); stage.append(grid, $('<p class="hint" style="margin-top:12px">Slide tiles into order 1–8. Fewer moves = more XP.</p>'));
    return () => {};
  }

  /* ---------- 3. Word Scramble ---------- */
  const WORDS = ['planet', 'puzzle', 'rocket', 'jungle', 'silver', 'garden', 'bridge', 'castle', 'dragon', 'forest', 'island', 'marble', 'pirate', 'rabbit', 'sunset', 'thunder', 'whisper', 'diamond', 'journey', 'mystery', 'pyramid', 'compass', 'harvest', 'lantern', 'volcano', 'penguin', 'blanket', 'cabinet', 'captain', 'balance', 'cherry', 'dancer', 'engine', 'flower', 'guitar', 'hunter', 'insect', 'knight', 'legend', 'magnet'];
  function words(stage, ctx) {
    const list = shuffle(WORDS).slice(0, 5); let idx = 0, solved = 0, left = 75, skips = 2, cur = '', pool = [];
    const lw = $('<div class="letters" id="wslots"></div>'), lp = $('<div class="letters"></div>');
    const ctl = $('<div class="center"><div><button class="btn ghost sm" data-a="clear">Clear</button> <button class="btn ghost sm" data-a="skip">Skip</button></div><p class="hint">Tap letters or type on your keyboard</p></div>');
    const hud = () => ctx.hud([`Word ${idx + 1}/5`, `Solved ${solved}`, { t: `${left}s`, low: left <= 10 }, `Skips ${skips}`]);
    const load = () => {
      if (idx >= 5) return fin();
      const w = list[idx]; let s = w; while (s === w) s = shuffle(w.split('')).join('');
      pool = s.split('').map((ch, i) => ({ ch, i, used: false })); cur = ''; draw();
    };
    const draw = () => {
      const w = list[idx]; lw.innerHTML = ''; lp.innerHTML = '';
      for (let i = 0; i < w.length; i++) lw.append($(`<div class="lett slot" style="display:grid;place-items:center">${cur[i] || ''}</div>`));
      pool.forEach((p) => { const b = $(`<button class="lett ${p.used ? 'used' : ''}">${p.ch}</button>`); b.onclick = () => add(p); lp.append(b); });
      hud();
    };
    const add = (p) => { if (p.used || cur.length >= list[idx].length) return; p.used = true; cur += p.ch; ctx.sfx('tap'); check(); draw(); };
    const check = () => {
      const w = list[idx]; if (cur.length < w.length) return;
      if (cur === w) { solved++; ctx.sfx('good'); lw.querySelectorAll('.lett').forEach((l) => l.classList.add('good')); idx++; setTimeout(load, 500); }
      else { ctx.sfx('bad'); lw.classList.add('shake'); setTimeout(() => lw.classList.remove('shake'), 300); pool.forEach((p) => (p.used = false)); cur = ''; }
    };
    const key = (e) => { if (e.target.tagName === 'INPUT') return; const k = e.key.toLowerCase();
      if (k === 'backspace') { const last = cur.slice(-1); if (last) { const p = pool.find((x) => x.used && x.ch === last); if (p) p.used = false; cur = cur.slice(0, -1); draw(); } }
      else if (/^[a-z]$/.test(k)) { const p = pool.find((x) => !x.used && x.ch === k); if (p) add(p); } };
    ctl.onclick = (e) => { const a = e.target.dataset.a; if (a === 'clear') { pool.forEach((p) => (p.used = false)); cur = ''; draw(); } if (a === 'skip' && skips > 0) { skips--; idx++; load(); } };
    document.addEventListener('keydown', key);
    const timer = setInterval(() => { left--; if (left <= 0) fin(); else hud(); }, 1000);
    let over = false;
    function fin() { if (over) return; over = true; clearInterval(timer); ctx.end({ win: solved >= 3, quality: solved / 5 * 0.85 + clamp(left / 75) * 0.15, score: solved * 200 + left * 4, label: `${solved}/5 words` }); }
    stage.append($('<div class="center"></div>')); const box = stage.firstChild; box.append(lw, lp, ctl); load();
    return () => { clearInterval(timer); document.removeEventListener('keydown', key); };
  }

  /* ---------- 4. Math Sprint ---------- */
  function math(stage, ctx) {
    let left = 45, score = 0, streak = 0, best = 0, ans = 0;
    const q = $('<div class="q"></div>'), inp = $('<input class="ans" inputmode="numeric" autocomplete="off" aria-label="Answer">');
    const hud = () => ctx.hud([{ t: `${left}s`, low: left <= 8 }, `Correct ${score}`, `Streak ${streak}`]);
    const next = () => {
      const lvl = Math.min(3, Math.floor(score / 5)); const ops = lvl === 0 ? ['+', '-'] : lvl === 1 ? ['+', '-', '×'] : ['+', '-', '×', '×'];
      const op = ops[ri(0, ops.length - 1)]; let a, b;
      if (op === '+') { a = ri(5, 20 + lvl * 25); b = ri(5, 20 + lvl * 25); ans = a + b; }
      else if (op === '-') { a = ri(15, 40 + lvl * 40); b = ri(3, a - 1); ans = a - b; }
      else { a = ri(2, 9 + lvl * 3); b = ri(2, 9 + lvl * 2); ans = a * b; }
      q.textContent = `${a} ${op} ${b}`; inp.value = ''; hud();
    };
    inp.oninput = () => { if (+inp.value === ans && inp.value !== '') { score++; streak++; best = Math.max(best, streak); ctx.sfx('good'); next(); } };
    inp.onkeydown = (e) => { if (e.key === 'Enter' && inp.value !== '' && +inp.value !== ans) { streak = 0; ctx.sfx('bad'); q.classList.add('shake'); setTimeout(() => q.classList.remove('shake'), 300); inp.value = ''; hud(); } };
    const timer = setInterval(() => { left--; if (left <= 0) { clearInterval(timer); ctx.end({ win: score >= 8, quality: clamp(score / 22), score: score * 100 + best * 20, label: `${score} correct · best streak ${best}` }); } else hud(); }, 1000);
    stage.append(q, inp, $('<p class="hint" style="margin-top:14px">Type the answer — it submits instantly when correct. Enter clears a wrong guess.</p>'));
    next(); setTimeout(() => inp.focus(), 100);
    return () => clearInterval(timer);
  }

  /* ---------- 5. Pattern Memory ---------- */
  function pattern(stage, ctx) {
    const cols = ['#ff6b5e', '#3dd6a5', '#5aa9ff', '#ffb454'], seq = []; let pos = 0, accept = false, ended = false, to = [];
    const wrap = $('<div class="pads"></div>');
    const pads = cols.map((c, i) => { const b = $(`<button class="pad" style="--c:${c}" aria-label="Pad ${i + 1}" disabled></button>`); b.onclick = () => press(i); wrap.append(b); return b; });
    const hud = (m) => ctx.hud([`Round ${seq.length}`, m || '']);
    const flash = (i, ms = 380) => { pads[i].classList.add('lit'); ctx.sfx('note', i); to.push(setTimeout(() => pads[i].classList.remove('lit'), ms)); };
    const play = () => { accept = false; pads.forEach((p) => (p.disabled = true)); seq.push(ri(0, 3)); pos = 0; hud('Watch…');
      seq.forEach((s, k) => to.push(setTimeout(() => flash(s), 700 + k * 600)));
      to.push(setTimeout(() => { accept = true; pads.forEach((p) => (p.disabled = false)); hud('Your turn'); }, 700 + seq.length * 600)); };
    function press(i) {
      if (!accept || ended) return; flash(i, 200);
      if (i !== seq[pos]) { ended = true; ctx.sfx('bad'); const r = seq.length - 1; return setTimeout(() => ctx.end({ win: r >= 5, quality: clamp(r / 12), score: r * 150, label: `Reached round ${r}` }), 500); }
      if (++pos === seq.length) { accept = false; to.push(setTimeout(play, 700)); }
    }
    stage.append(wrap); to.push(setTimeout(play, 600));
    return () => to.forEach(clearTimeout);
  }

  /* ---------- 6. Lights Out ---------- */
  function lights(stage, ctx) {
    const N = 5; let g = Array(N * N).fill(false), moves = 0, done = false;
    const tog = (i) => { const r = Math.floor(i / N), c = i % N; [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < N && cc >= 0 && cc < N) g[rr * N + cc] = !g[rr * N + cc]; }); };
    const presses = ri(7, 12); const picks = shuffle([...Array(N * N).keys()]).slice(0, presses); picks.forEach(tog);
    if (!g.some(Boolean)) tog(12);
    const grid = $('<div class="board-g lights"></div>');
    const hud = () => ctx.hud([`Moves ${moves}`, `Lights ${g.filter(Boolean).length}`]);
    const draw = () => { grid.innerHTML = ''; g.forEach((on, i) => { const b = $(`<button class="lt ${on ? 'on' : ''}" aria-label="Light ${i + 1} ${on ? 'on' : 'off'}"></button>`);
      b.onclick = () => { if (done) return; tog(i); moves++; ctx.sfx('tap'); draw(); hud();
        if (!g.some(Boolean)) { done = true; ctx.sfx('good'); setTimeout(() => ctx.end({ win: true, quality: clamp(1 - (moves - presses) / 25), score: Math.max(0, 1000 - moves * 20), label: `${moves} moves` }), 600); } };
      grid.append(b); }); };
    draw(); hud(); stage.append(grid, $('<p class="hint" style="margin-top:12px">Tapping a light flips it and its neighbours. Turn them all off.</p>'));
    return () => {};
  }

  /* ---------- 7. Merge 256 (2048-style) ---------- */
  function merge(stage, ctx) {
    let g = Array(16).fill(0), score = 0, moves = 0, over = false;
    const addT = () => { const e = g.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0); if (e.length) g[e[ri(0, e.length - 1)]] = Math.random() < .9 ? 2 : 4; };
    addT(); addT();
    const ix = (d, i, j) => [i * 4 + j, j * 4 + i, i * 4 + (3 - j), (3 - j) * 4 + i][d];
    const slideLine = (l) => { const a = l.filter(Boolean), o = []; let gain = 0; for (let k = 0; k < a.length; k++) { if (a[k] === a[k + 1]) { o.push(a[k] * 2); gain += a[k] * 2; k++; } else o.push(a[k]); } while (o.length < 4) o.push(0); return [o, gain]; };
    const canMove = () => g.some((v, i) => !v || (i % 4 < 3 && v === g[i + 1]) || (i < 12 && v === g[i + 4]));
    const grid = $('<div class="board-g m2048" style="touch-action:none"></div>');
    const draw = () => { grid.innerHTML = ''; g.forEach((v) => { const l = v ? Math.log2(v) : 0; grid.append($(`<div class="mt2" style="${v ? `background:color-mix(in srgb,var(--ac) ${Math.min(100, l * 10)}%,var(--s3));color:${l >= 6 ? 'var(--ac-ink)' : 'var(--tx)'}` : ''}">${v || ''}</div>`)); }); ctx.hud([`Score ${score}`, `Best tile ${Math.max(...g)}`, 'Goal 256']); };
    const move = (d) => {
      if (over) return; let ch = false;
      for (let i = 0; i < 4; i++) { const idx = [0, 1, 2, 3].map((j) => ix(d, i, j)); const [o, gain] = slideLine(idx.map((k) => g[k])); idx.forEach((k, j) => { if (g[k] !== o[j]) ch = true; g[k] = o[j]; }); score += gain; }
      if (!ch) return; moves++; addT(); ctx.sfx('tap'); draw();
      const mx = Math.max(...g);
      if (mx >= 256) { over = true; ctx.sfx('good'); setTimeout(() => ctx.end({ win: true, quality: clamp(1 - (moves - 90) / 200), score, label: `256 in ${moves} moves` }), 600); }
      else if (!canMove()) { over = true; setTimeout(() => ctx.end({ win: false, quality: clamp(mx / 256) * .8, score, label: `Best tile ${mx}` }), 500); }
    };
    const key = (e) => { const d = { ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, ArrowDown: 3 }[e.key]; if (d !== undefined) { e.preventDefault(); move(d); } };
    let sx, sy;
    grid.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    grid.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return; move(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 0 : 2) : (dy < 0 ? 1 : 3)); });
    document.addEventListener('keydown', key); draw();
    stage.append(grid, $('<p class="hint">Swipe or use arrow keys. Merge equal tiles to reach 256.</p>'));
    return () => document.removeEventListener('keydown', key);
  }

  /* ---------- 8. Mini Sudoku 4x4 ---------- */
  function sudoku(stage, ctx) {
    const base = (r, c) => (r * 2 + Math.floor(r / 2) + c) % 4;
    const dm = shuffle([1, 2, 3, 4]), rows = shuffle([0, 1]).flatMap((b) => shuffle([0, 1]).map((x) => b * 2 + x)), cols = shuffle([0, 1]).flatMap((b) => shuffle([0, 1]).map((x) => b * 2 + x));
    const sol = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) sol.push(dm[base(rows[r], cols[c])]);
    const fixed = Array(16).fill(false); shuffle([...Array(16).keys()]).slice(0, 7).forEach((i) => (fixed[i] = true));
    const v = sol.map((x, i) => (fixed[i] ? x : 0)); let sel = -1, moves = 0, t0 = Date.now(), done = false;
    const conflict = (i) => { const x = v[i]; if (!x) return false; const r = Math.floor(i / 4), c = i % 4; for (let k = 0; k < 16; k++) { if (k === i || v[k] !== x) continue; const kr = Math.floor(k / 4), kc = k % 4; if (kr === r || kc === c || (Math.floor(kr / 2) === Math.floor(r / 2) && Math.floor(kc / 2) === Math.floor(c / 2))) return true; } return false; };
    const grid = $('<div class="board-g sdk"></div>'), pad = $('<div class="sdk-pad"></div>');
    const draw = () => { grid.innerHTML = ''; v.forEach((x, i) => { const r = Math.floor(i / 4), c = i % 4;
      const b = $(`<button class="sc ${fixed[i] ? 'fx' : ''} ${i === sel ? 'sel' : ''} ${conflict(i) ? 'bad' : ''}" style="${c === 1 ? 'margin-right:6px;' : ''}${r === 1 ? 'margin-bottom:6px;' : ''}" aria-label="Row ${r + 1} column ${c + 1}">${x || ''}</button>`);
      b.onclick = () => { if (!fixed[i] && !done) { sel = i; draw(); } }; grid.append(b); }); ctx.hud([`Moves ${moves}`, `${Math.round((Date.now() - t0) / 1000)}s`]); };
    [1, 2, 3, 4, 0].forEach((n) => { const b = $(`<button class="btn">${n || 'Erase'}</button>`); b.onclick = () => { if (sel < 0 || done) return; v[sel] = n; moves++; ctx.sfx('tap'); draw(); check(); }; pad.append(b); });
    const check = () => { if (v.every(Boolean) && v.every((_, i) => !conflict(i))) { done = true; const s = Math.round((Date.now() - t0) / 1000); ctx.sfx('good'); setTimeout(() => ctx.end({ win: true, quality: clamp(1 - (moves - 9) / 25) * .6 + clamp(1 - s / 150) * .4, score: Math.max(0, 1000 - s * 4 - moves * 5), label: `${s}s · ${moves} moves` }), 500); } };
    const tm = setInterval(() => !done && draw(), 1000);
    draw(); stage.append(grid, pad, $('<p class="hint">Fill the grid so every row, column and 2×2 box has 1–4 once.</p>'));
    return () => clearInterval(tm);
  }

  /* ---------- 9. Color Clash (Stroop) ---------- */
  function stroop(stage, ctx) {
    const C = [['RED', '#ff6b5e'], ['GREEN', '#3dd6a5'], ['BLUE', '#5aa9ff'], ['YELLOW', '#ffd25e']];
    let left = 30, ok = 0, lives = 3, cur, ended = false;
    const word = $('<div class="q"></div>'), btns = $('<div class="sdk-pad"></div>');
    const hud = () => ctx.hud([{ t: `${left}s`, low: left <= 6 }, `Correct ${ok}`, `Lives ${lives}`]);
    const next = () => { const w = ri(0, 3); let c = ri(0, 3); if (Math.random() < .75) while (c === w) c = ri(0, 3); cur = c; word.textContent = C[w][0]; word.style.color = C[c][1]; hud(); };
    C.forEach(([n, col], i) => { const b = $(`<button class="btn" style="border-color:${col}">${n}</button>`);
      b.onclick = () => { if (ended) return; if (i === cur) { ok++; ctx.sfx('good'); } else { lives--; ctx.sfx('bad'); word.classList.add('shake'); setTimeout(() => word.classList.remove('shake'), 300); if (lives <= 0) return fin(); } next(); }; btns.append(b); });
    const timer = setInterval(() => { left--; if (left <= 0) fin(); else hud(); }, 1000);
    function fin() { if (ended) return; ended = true; clearInterval(timer); ctx.end({ win: ok >= 10, quality: clamp(ok / 24), score: ok * 100 + lives * 50, label: `${ok} correct` }); }
    stage.append($('<p class="hint" style="margin:0 0 6px">Tap the COLOR of the text, not the word.</p>'), word, btns); next();
    return () => clearInterval(timer);
  }

  /* ---------- 10. Odd Tile ---------- */
  function odd(stage, ctx) {
    let round = 0, left = 45, lives = 3, ended = false;
    const grid = $('<div class="board-g" style="width:min(100%,360px)"></div>');
    const hud = () => ctx.hud([{ t: `${left}s`, low: left <= 8 }, `Round ${round}`, `Lives ${lives}`]);
    const next = () => { round++; const n = Math.min(7, 3 + Math.floor(round / 3)), h = ri(0, 360), diff = Math.max(4, 20 - round * 1.2), oi = ri(0, n * n - 1);
      grid.style.gridTemplateColumns = `repeat(${n},1fr)`; grid.innerHTML = '';
      for (let i = 0; i < n * n; i++) { const b = $(`<button class="ot" aria-label="Tile ${i + 1}" style="background:hsl(${h} 60% ${i === oi ? 55 + diff : 55}%)"></button>`);
        b.onclick = () => { if (ended) return; if (i === oi) { ctx.sfx('good'); next(); } else { lives--; ctx.sfx('bad'); if (lives <= 0) fin(); else { grid.classList.add('shake'); setTimeout(() => grid.classList.remove('shake'), 300); hud(); } } }; grid.append(b); } hud(); };
    const timer = setInterval(() => { left--; if (left <= 0) fin(); else hud(); }, 1000);
    function fin() { if (ended) return; ended = true; clearInterval(timer); const r = round - 1; ctx.end({ win: r >= 8, quality: clamp(r / 20), score: r * 120, label: `${r} found` }); }
    stage.append(grid, $('<p class="hint" style="margin-top:12px">Tap the tile with a slightly different shade.</p>')); next();
    return () => clearInterval(timer);
  }

  /* ---------- 11. Number Recall ---------- */
  function recall(stage, ctx) {
    let len = 3, ended = false, to = [], num = '';
    const box = $('<div class="q" style="letter-spacing:.2em"></div>'), form = $('<form class="center"><input class="ans" inputmode="numeric" autocomplete="off" aria-label="Number"><button class="btn primary" type="submit">Check</button></form>'), inp = form.querySelector('input');
    const hud = (m) => ctx.hud([`Digits ${len}`, m || '']);
    const show = () => { num = Array.from({ length: len }, () => ri(0, 9)).join(''); box.textContent = num; form.style.display = 'none'; hud('Memorize'); inp.value = '';
      to.push(setTimeout(() => { box.textContent = '• '.repeat(len).trim(); form.style.display = ''; hud('Type it'); inp.focus(); }, 1000 + len * 450)); };
    form.onsubmit = (e) => { e.preventDefault(); if (ended) return;
      if (inp.value.trim() === num) { ctx.sfx('good'); len++; show(); }
      else { ended = true; ctx.sfx('bad'); box.textContent = num; const r = len - 1; to.push(setTimeout(() => ctx.end({ win: r >= 6, quality: clamp((r - 2) / 8), score: r * 150, label: `${r} digits` }), 900)); } };
    stage.append($('<div class="center"></div>')); stage.firstChild.append(box, form); show();
    return () => to.forEach(clearTimeout);
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
    ticket: svg('<path d="M3 9a2 2 0 002-2V6h14v1a2 2 0 002 2v2a2 2 0 000 2v2a2 2 0 00-2 2v1H5v-1a2 2 0 00-2-2v-2a2 2 0 000-2z"/><path d="M13 7v10" stroke-dasharray="2 2"/>'),
    cash: svg('<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>'),
    coin: svg('<circle cx="12" cy="12" r="8"/><path d="M12 8v8"/>'),
    gift: svg('<rect x="4" y="9" width="16" height="11" rx="2"/><path d="M12 9v11M3 6h18v3H3z"/>'),
    phone: svg('<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>'),
    heart: svg('<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>'),
  };
  window.GAMES = [
    { id: 'memory', name: 'Memory Match', icon: ICON.memory, color: '#8b7bff', tag: 'Memory', time: '1 min', desc: 'Find all 8 pairs with the fewest moves.', how: 'Flip two cards at a time. Match all 8 pairs. Fewer moves and less time earn more XP.', mount: memory },
    { id: 'slide', name: 'Slide Master', icon: ICON.slide, color: '#3dd6a5', tag: 'Logic', time: '2 min', desc: 'Slide tiles into order. Plan ahead.', how: 'Tap a tile next to the gap to slide it. Put the tiles in order 1 to 8. Fewer moves earn more XP.', mount: slide },
    { id: 'words', name: 'Word Scramble', icon: ICON.words, color: '#5aa9ff', tag: 'Language', time: '75 sec', desc: 'Unscramble 5 words before time runs out.', how: 'Tap letters (or type) to spell each word. You have 75 seconds and 2 skips. Solve at least 3 to win.', mount: words },
    { id: 'math', name: 'Math Sprint', icon: ICON.math, color: '#ffb454', tag: 'Speed', time: '45 sec', desc: 'Answer as many sums as you can.', how: 'Type the answer. It submits itself when correct. Press Enter to clear a wrong guess. Get 8 right to win.', mount: math },
    { id: 'pattern', name: 'Pattern Echo', icon: ICON.pattern, color: '#ff7aa8', tag: 'Focus', time: '2 min', desc: 'Repeat the growing light-and-sound pattern.', how: 'Watch the pads light up, then repeat the order. The pattern grows each round. Reach round 5 to win.', mount: pattern },
    { id: 'lights', name: 'Lights Out', icon: ICON.lights, color: '#f2d45c', tag: 'Logic', time: '2 min', desc: 'Switch off every light on the grid.', how: 'Tapping a light flips it and the four next to it. Turn every light off in as few taps as you can.', mount: lights },
    { id: 'merge', name: 'Merge 256', icon: ICON.merge, color: '#d6ff3d', tag: 'Logic', time: '3 min', desc: 'Merge tiles to reach 256.', how: 'Swipe or use arrow keys to slide all tiles. Equal tiles merge. Reach 256 before the board fills up.', mount: merge },
    { id: 'sudoku', name: 'Mini Sudoku', icon: ICON.sudoku, color: '#ff9f6b', tag: 'Logic', time: '2 min', desc: 'A quick 4×4 number grid.', how: 'Pick an empty cell, then a number. Every row, column and 2×2 box must contain 1 to 4 once.', mount: sudoku },
    { id: 'stroop', name: 'Color Clash', icon: ICON.stroop, color: '#c28bff', tag: 'Focus', time: '30 sec', desc: 'Name the color, ignore the word.', how: 'A color name appears in a different ink color. Tap the button for the INK color. 3 mistakes end the round.', mount: stroop },
    { id: 'odd', name: 'Odd Tile', icon: ICON.odd, color: '#4fd1e0', tag: 'Focus', time: '45 sec', desc: 'Spot the tile with a different shade.', how: 'One tile has a slightly different shade. Tap it. The grid grows and the difference shrinks. 3 mistakes end the round.', mount: odd },
    { id: 'recall', name: 'Number Recall', icon: ICON.recall, color: '#ff7aa8', tag: 'Memory', time: '2 min', desc: 'Memorize a number, then type it.', how: 'A number flashes briefly. Type it back from memory. Each success adds one digit. Reach 6 digits to win.', mount: recall },
  ];
})();
