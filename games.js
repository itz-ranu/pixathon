/* Six puzzle games. Each mount(stage, ctx) returns a cleanup fn.
   ctx: { hud([{t,low}|string]), end({win,quality,score,label}), sfx(name) }  quality in 0..1 */
(function () {
  const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstChild; };
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  /* ---------- 1. Memory Match ---------- */
  function memory(stage, ctx) {
    const E = ['🦊', '🐼', '🦁', '🐙', '🦄', '🐢', '🦋', '🍉'];
    const deck = shuffle([...E, ...E]);
    let open = [], moves = 0, pairs = 0, lock = false, t0 = Date.now(), timer;
    const grid = $('<div class="board-g mem"></div>');
    deck.forEach((e, i) => {
      const c = $(`<div class="card3d"><button aria-label="Card ${i + 1}"><span class="f"></span><span class="b">${e}</span></button></div>`);
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
    const cols = ['#ff5d73', '#2dd4a0', '#4aa3ff', '#ffb020'], seq = []; let pos = 0, accept = false, ended = false, to = [];
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

  window.GAMES = [
    { id: 'memory', name: 'Memory Match', icon: '🧠', color: '#7c5cff', tag: 'Memory', desc: 'Find all 8 pairs with the fewest moves.', mount: memory },
    { id: 'slide', name: 'Slide Master', icon: '🧩', color: '#2dd4a0', tag: 'Logic', desc: 'Slide tiles into order. Plan ahead.', mount: slide },
    { id: 'words', name: 'Word Scramble', icon: '🔤', color: '#4aa3ff', tag: 'Language', desc: 'Unscramble 5 words before time runs out.', mount: words },
    { id: 'math', name: 'Math Sprint', icon: '⚡', color: '#ffb020', tag: 'Speed', desc: '45 seconds. Answer as many as you can.', mount: math },
    { id: 'pattern', name: 'Pattern Echo', icon: '🎵', color: '#ff5d9e', tag: 'Focus', desc: 'Repeat the growing light-and-sound pattern.', mount: pattern },
    { id: 'lights', name: 'Lights Out', icon: '💡', color: '#ffd25e', tag: 'Strategy', desc: 'Switch off every light on the 5×5 grid.', mount: lights },
  ];
})();
