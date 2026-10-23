(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ================= CONFIG ================= */
  const CONFIG = {
    // Ads: set your AdSense publisher id (e.g. 'ca-pub-123…') and slot ids to serve real ads.
    adsenseClient: '',
    adSlots: { inline: '', side: '', rewards: '', game: '', rail: '', gameside: '' },
    interstitialEvery: 3,   // skippable interstitial every N finished games
  };
  const RANKS = [[1, 'Rookie', '#9aa1b3'], [3, 'Thinker', '#5aa9ff'], [5, 'Sharp Mind', '#3dd6a5'], [8, 'Strategist', '#ffb454'], [12, 'Brainiac', '#ff7aa8'], [18, 'Genius', '#c28bff'], [25, 'Mastermind', '#ff6b5e'], [35, 'Grandmaster', '#f2d45c'], [50, 'Legend', '#d6ff3d']];
  const DIFFS = [{ n: 'Easy', m: 1 }, { n: 'Normal', m: 1.5 }, { n: 'Hard', m: 2.5 }];
  const WHEEL = [{ t: '+20', c: 20, w: 20, col: '#ff6b5e' }, { t: '+50', c: 50, w: 14, col: '#ffb454' }, { t: '+15', c: 15, w: 22, col: '#f2d45c' }, { t: '+100', c: 100, w: 4, col: '#3dd6a5' }, { t: 'Coupon', cp: 150, w: 4, col: '#5aa9ff' }, { t: '2× XP', boost: 1, w: 12, col: '#c28bff' }, { t: '+30', c: 30, w: 16, col: '#ff7aa8' }, { t: '+75', c: 75, w: 8, col: '#4fd1e0' }];
  const MILES = [
    { lvl: 2, type: 'coins', amt: 50, name: '50 bonus coins' },
    { lvl: 3, type: 'coupon', value: 200, name: '200-credit coupon' },
    { lvl: 5, type: 'coupon', value: 400, name: '400-credit coupon' },
    { lvl: 8, type: 'coupon', value: 600, name: '600-credit coupon' },
    { lvl: 10, type: 'cash', amt: 2, name: '$2 cash reward' },
    { lvl: 15, type: 'coupon', value: 1000, name: '1,000-credit coupon' },
    { lvl: 20, type: 'cash', amt: 5, name: '$5 cash reward' },
    { lvl: 30, type: 'cash', amt: 10, name: '$10 cash reward' },
    { lvl: 50, type: 'cash', amt: 25, name: '$25 cash reward' },
  ];
  const PACKS = [
    { id: 'p1', cost: 150, value: 150 },
    { id: 'p2', cost: 400, value: 480 },
    { id: 'p3', cost: 800, value: 1000 },
  ];
  const CATALOG = [
    { id: 'c1', name: 'ShopNova 15% off', note: 'Instant code', cost: 150, kind: 'code', brand: 'ShopNova', icon: 'ticket' },
    { id: 'c2', name: 'FoodieGo free delivery', note: 'Instant code', cost: 200, kind: 'code', brand: 'FoodieGo', icon: 'ticket' },
    { id: 'c3', name: 'StreamBox 1 month free', note: 'Instant code', cost: 600, kind: 'code', brand: 'StreamBox', icon: 'ticket' },
    { id: 'c4', name: 'Mobile top-up', note: 'Reviewed within 7 days', cost: 300, kind: 'topup', icon: 'phone' },
    { id: 'c5', name: 'PayPal cash $2', note: 'Reviewed within 7 days', cost: 400, kind: 'cash', icon: 'cash' },
    { id: 'c6', name: 'Gift card $5', note: 'Emailed within 7 days', cost: 500, kind: 'gift', icon: 'gift' },
    { id: 'c7', name: 'Donate to charity', note: 'Instant', cost: 100, kind: 'donate', icon: 'heart' },
  ];
  const PROMOS = { PIXAQUEST: { coins: 100 }, WELCOME: { coupon: 200 } };
  const QUESTS = [
    { id: 'play', t: 'Play 3 puzzles', goal: 3, key: 'plays', coins: 15 },
    { id: 'win', t: 'Win 2 puzzles', goal: 2, key: 'wins', coins: 20 },
    { id: 'xp', t: 'Earn 150 XP', goal: 150, key: 'xp', coins: 30 },
  ];
  const BOTS = ['Aria', 'Kenji', 'Luna', 'Max', 'Zara', 'Omar', 'Mia', 'Leo', 'Nina', 'Raj', 'Eva', 'Sam', 'Ivy', 'Noah', 'Tara', 'Finn', 'Yuki', 'Cleo', 'Dev'];
  const MILE_ICON = { coins: ICON.coin, coupon: ICON.ticket, cash: ICON.cash };

  /* ================= STATE ================= */
  const KEY = 'pixaquest.v1', OLD_KEY = 'pixaton.v1';
  const fresh = () => ({ name: 'Player', xp: 0, coins: 0, played: 0, streak: 0, lastDay: '', days: [], best: {}, claimed: {}, claims: [], dailyDone: '', bonusDay: '', last: '', coupons: [], seen: {}, promos: {}, q: { day: '', plays: 0, wins: 0, xp: 0, claimed: {} }, week: { id: '', xp: 0 }, sound: true, haptics: true, ads: 0, onboarded: false, diff: 1, spinDay: '', boost: false, ach: {}, stars3: 0, qdone: 0 });
  let S;
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || localStorage.getItem(OLD_KEY) || '{}')); } catch { S = fresh(); }
  S.claims = S.claims.filter((c) => { if (c.code) { S.coupons.push({ id: 'm' + Math.random().toString(36).slice(2, 8), title: c.title, code: c.code, value: 200, used: false }); return false; } return true; });
  if (!S.avatar) S.avatar = AVATAR.random(S.name + Math.random());
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
  const ACH = [
    { id: 'first', t: 'First win', d: 'Win any puzzle', ok: () => S.played >= 1 },
    { id: 's3', t: 'On a roll', d: '3-day streak', ok: () => effStreak() >= 3 },
    { id: 's7', t: 'Unstoppable', d: '7-day streak', ok: () => effStreak() >= 7 },
    { id: 'l5', t: 'Sharp mind', d: 'Reach level 5', ok: () => levelOf(S.xp) >= 5 },
    { id: 'l10', t: 'Brainiac', d: 'Reach level 10', ok: () => levelOf(S.xp) >= 10 },
    { id: 'all', t: 'Explorer', d: 'Try every puzzle', ok: () => GAMES.every((g) => S.best[g.id] !== undefined) },
    { id: 'perf', t: 'Flawless', d: 'Earn 3 stars five times', ok: () => S.stars3 >= 5 },
    { id: 'q', t: 'Quest runner', d: 'Finish 10 quests', ok: () => S.qdone >= 10 },
    { id: 'coin', t: 'Saver', d: 'Hold 500 coins', ok: () => S.coins >= 500 },
  ];
  function checkAch() { ACH.forEach((a) => { if (!S.ach[a.id] && a.ok()) { S.ach[a.id] = 1; S.coins += 20; toast(`Achievement: ${a.t} (+20 coins)`); } }); }

  const thr = (n) => 30 * n * (n - 1);
  const levelOf = (xp) => { let n = 1; while (xp >= thr(n + 1)) n++; return n; };
  const rankOf = (lvl) => RANKS.filter((r) => r[0] <= lvl).pop();
  const dayStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const ago = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
  const weekId = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dayStr(d); };
  const effStreak = () => (S.lastDay === dayStr() || S.lastDay === dayStr(ago(1))) ? S.streak : 0;
  const dailyGame = () => GAMES[Math.floor(Date.now() / 864e5) % GAMES.length];
  const ensure = () => {
    if (S.week.id !== weekId()) S.week = { id: weekId(), xp: 0 };
    if (S.q.day !== dayStr()) S.q = { day: dayStr(), plays: 0, wins: 0, xp: 0, claimed: {} };
  };
  ensure();

  /* ================= SOUND & FX ================= */
  let ac;
  const vib = (n) => { try { S.haptics && navigator.vibrate && navigator.vibrate(n); } catch {} };
  const PENT = [0, 2, 4, 7, 9, 12, 14, 16];
  function tone(f, delay, dur, type = 'sine', vol = 0.06) {
    const t0 = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; o.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function sfx(kind, i = 0) {
    if (kind === 'good') vib(15); else if (kind === 'bad') vib([30, 40, 30]);
    if (!S.sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (kind === 'win') { [0, 4, 7, 12, 16].forEach((st, k) => tone(523 * 2 ** (st / 12), k * 0.08, 0.3)); return; }
      if (kind === 'good') { tone(523 * 2 ** (PENT[Math.min(i, 7)] / 12), 0, 0.22); return; }
      if (kind === 'bad') { tone(150, 0, 0.25, 'sawtooth', 0.05); return; }
      if (kind === 'note') { tone([330, 440, 550, 660][i], 0, 0.35); return; }
      tone(420, 0, 0.12);
    } catch {}
  }
  const cv = $('#fx'), cx = cv.getContext('2d'); let parts = [], raf = 0;
  const CONF = ['#d6ff3d', '#f1efe9', '#5aa9ff', '#ff7aa8'];
  function confetti(n = 100, ox = innerWidth / 2, oy = innerHeight / 3, cols = CONF, spread = 16) {
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    if (cv.width !== innerWidth || cv.height !== innerHeight) { cv.width = innerWidth; cv.height = innerHeight; }
    for (let i = 0; i < n; i++) parts.push({ x: ox, y: oy, vx: (Math.random() - .5) * spread, vy: Math.random() * -spread * .85 - 2, s: 4 + Math.random() * 5, c: cols[i % cols.length], r: Math.random() * 6, life: 70 + Math.random() * 40 });
    if (!raf) raf = requestAnimationFrame(tick);
    clearTimeout(confetti.t); confetti.t = setTimeout(() => { parts = []; raf = 0; cv.width = 1; }, 3500);
  }
  const center = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  function floatText(x, y, text, color) {
    const d = document.createElement('div'); d.className = 'ftx'; d.textContent = text; d.style.left = x + 'px'; d.style.top = y + 'px'; if (color) d.style.color = color;
    document.body.append(d); setTimeout(() => d.remove(), 900);
  }
  const fxApi = {
    burst: (el, color = '#d6ff3d', n = 18) => { const [x, y] = center(el); confetti(n, x, y, [color, '#f1efe9'], 9); },
    pop: (el, text, color) => { const [x, y] = center(el); floatText(x, y, text, color); },
    shake: (el) => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 320); },
  };
  function tick() {
    cx.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter((p) => p.life-- > 0);
    parts.forEach((p) => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.r += .2; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.globalAlpha = Math.min(1, p.life / 30); cx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); cx.restore(); });
    if (parts.length) raf = requestAnimationFrame(tick); else { raf = 0; cx.clearRect(0, 0, cv.width, cv.height); cv.width = 1; }
  }
  function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('#toasts').append(t); setTimeout(() => t.remove(), 3200); }
  function countUp(el, to, ms = 700) {
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) { el.textContent = to; return; }
    setTimeout(() => { el.textContent = to; }, ms + 80);
    const t0 = performance.now(); (function s(t) { const p = Math.min(1, (t - t0) / ms); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(s); })(t0);
  }
  const bump = () => { const c = $('#chipCoinBox'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); };

  /* ================= MODALS ================= */
  function modal(html, { onClose } = {}) {
    const m = $('#modal'); delete m.dataset.lock; if (!m._prev) m._prev = document.activeElement; m.innerHTML = html; $('#modalOv').hidden = false;
    m._close = onClose; setTimeout(() => { const f = m.querySelector('.btn.primary,button,input'); f && f.focus(); }, 40); return m;
  }
  function closeModal() { const m = $('#modal'); $('#modalOv').hidden = true; const c = m._close; m._close = null; const pv = m._prev; m._prev = null; c && c(); try { pv && pv.isConnected && pv.focus(); } catch {} }
  $('#modalOv').addEventListener('click', (e) => { if (e.target.id === 'modalOv' && !$('#modal').dataset.lock) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || $('#modalOv').hidden) return;
    const f = $$('button:not([disabled]),input,select,a[href]', $('#modal')).filter((x) => x.offsetParent !== null); if (!f.length) return;
    const first = f[0], last = f[f.length - 1], cur = document.activeElement;
    if (!$('#modal').contains(cur)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && cur === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && cur === last) { e.preventDefault(); first.focus(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modalOv').hidden && !$('#modal').dataset.lock) closeModal(); });

  /* ================= ADS ================= */
  function initAds() {
    if (CONFIG.adsenseClient) {
      window.adsbygoogle = window.adsbygoogle || []; if (getConsent() !== 'yes') window.adsbygoogle.requestNonPersonalizedAds = 1;
      const s = document.createElement('script'); s.async = true; s.crossOrigin = 'anonymous';
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(CONFIG.adsenseClient); document.head.append(s);
    }
    $$('.ad').forEach((el) => {
      const slot = CONFIG.adSlots[el.dataset.ad];
      if (CONFIG.adsenseClient && slot) {
        el.innerHTML = `<ins class="adsbygoogle" style="display:block;width:100%" data-ad-client="${esc(CONFIG.adsenseClient)}" data-ad-slot="${esc(slot)}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
      } else el.textContent = 'Ad space';
    });
  }
  // Rewarded / interstitial ad. Replace with your ad SDK call (rewarded ad, interstitial).
  function showAd({ rewarded, secs = 5 }, done) {
    let n = secs, ok = false, iv;
    const m = modal(`<p class="meta">${rewarded ? 'Rewarded ad' : 'Sponsored'}</p><h2>${rewarded ? 'Watch to double your rewards' : 'Back in a moment'}</h2><div class="adfake">Your ad plays here</div>
      <div class="center"><div class="countdown" id="adc">${n}</div></div>
      <div class="acts"><button class="btn primary" id="adx" disabled>${rewarded ? 'Claim bonus' : 'Skip ad'}</button></div>`, { onClose: () => { clearInterval(iv); done(ok); } });
    m.dataset.lock = '1';
    iv = setInterval(() => { n--; $('#adc', m).textContent = Math.max(n, 0); if (n <= 0) { clearInterval(iv); $('#adx', m).disabled = false; ok = true; } }, 1000);
    $('#adx', m).onclick = () => { delete m.dataset.lock; S.ads++; save(); closeModal(); };
  }

  /* ================= RENDER ================= */
  const nextMile = () => MILES.find((m) => !S.claimed[m.lvl]) || null;
  function renderTop() {
    const lvl = levelOf(S.xp), r = rankOf(lvl), a = thr(lvl), b = thr(lvl + 1);
    $('#chipCoins').textContent = S.coins; $('#chipLvl').textContent = lvl; $('#avBtn').innerHTML = AVATAR.svg(S.avatar, 30);
    $('#lvlBadge').textContent = lvl; $('#lvlBadge').style.setProperty('--rc', r[2]); $('#lvlBadge').style.setProperty('--p', Math.round((S.xp - a) / (b - a) * 100)); $('#heroRank').textContent = `${r[1]} · Level ${lvl}`;
    $('#xpFill').style.width = ((S.xp - a) / (b - a) * 100) + '%';
    $('#xpText').textContent = `${S.xp - a} / ${b - a} XP to level ${lvl + 1}`;
    const nm = nextMile(); $('#nextMile').textContent = nm ? `Next reward: ${nm.name} at level ${nm.lvl}` : 'All rewards claimed';
    $('#heroLine').textContent = S.played === 0 ? 'Solve your first puzzle' : `${b - S.xp} XP to level ${lvl + 1}`;
    const d = dailyGame(), done = S.dailyDone === dayStr(), last = GAMES.find((g) => g.id === S.last);
    const cta = $('#ctaPlay'), target = done ? (last || d) : d; cta.dataset.play = target.id; cta.textContent = 'Play';
    const fi = $('#featIcon'); fi.innerHTML = target.icon; fi.style.setProperty('--c', target.color);
    $('#featName').textContent = done ? target.name : `Daily: ${d.name}`;
    $('#featNote').textContent = S.boost ? '2× XP boost active for your next win' : done ? 'Daily bonus done. Keep climbing.' : 'Win it for double XP and coins';
  }
  let filter = 'All';
  function renderPlay() {
    const d = dailyGame(), done = S.dailyDone === dayStr();
    const tags = ['All', ...new Set(GAMES.map((g) => g.tag))];
    $('#filters').innerHTML = tags.map((t) => `<button class="${t === filter ? 'on' : ''}" data-filter="${t}" aria-pressed="${t === filter}">${t}</button>`).join('');
    $('#gameGrid').innerHTML = GAMES.filter((g) => filter === 'All' || g.tag === filter).map((g) => `<button class="gcard" style="--c:${g.color}" data-play="${g.id}">
      <span class="art art-${g.art}"><span class="gi">${g.icon}</span></span><span><h3>${g.name}</h3><p>${g.desc}</p></span>
      <span class="gfoot meta"><span>${g.tag} · ${g.time}</span>${g.id === d.id && !done ? '<span class="daily-t">Daily · 2×</span>' : `<span>${S.best[g.id] ? 'Best ' + S.best[g.id] : 'New'}</span>`}</span></button>`).join('');
    // bonus + streak
    const st = effStreak(), claimed = S.bonusDay === dayStr(), amt = 10 + 5 * Math.min(st, 6);
    let wk = ''; for (let i = 6; i >= 0; i--) { const d0 = ago(i), ds = dayStr(d0); wk += `<div class="wd ${S.days.includes(ds) ? 'on' : ''} ${i === 0 ? 'now' : ''}"><i></i>${'SMTWTFS'[d0.getDay()]}</div>`; }
    const risk = S.lastDay === dayStr(ago(1)) && st > 0;
    $('#bonus').innerHTML = `<h3>${st ? st + '-day streak' : 'Start a streak'}<span>${risk ? 'Play today to keep it' : 'Daily bonus'}</span></h3><div class="week" aria-hidden="true">${wk}</div>
      ${claimed ? '<button class="btn block" disabled>Bonus claimed. Back tomorrow</button>' : `<button class="btn primary block" data-bonus="1">Claim ${amt} coins</button>`}
      <button class="btn block spinbtn" data-spin="1" ${S.spinDay === dayStr() ? 'disabled' : ''}>${S.spinDay === dayStr() ? 'Lucky spin used. Back tomorrow' : 'Lucky spin'}</button>`;
    // quests
    $('#quests').innerHTML = `<h3>Today's quests<span>Resets at midnight</span></h3>` + QUESTS.map((q) => {
      const v = Math.min(S.q[q.key], q.goal), full = v >= q.goal, got = S.q.claimed[q.id];
      return `<div class="quest"><div class="q-top"><b>${q.t}</b>${got ? '<span class="meta">Done</span>' : full ? `<button class="btn primary sm" data-qclaim="${q.id}">Claim ${q.coins}</button>` : `<span class="q-r">${ICON.coin}${q.coins}</span>`}</div>
        <div class="bar thin"><i style="width:${v / q.goal * 100}%"></i></div></div>`;
    }).join('');
  }
  function renderRewards() {
    const lvl = levelOf(S.xp), nm = nextMile();
    if (nm) { const prev = MILES.filter((m) => m.lvl < nm.lvl).pop(), lo = prev ? thr(prev.lvl) : 0, hi = thr(nm.lvl), pct = Math.max(0, Math.min(100, (S.xp - lo) / (hi - lo) * 100));
      $('#journey').innerHTML = `<p class="meta">Next reward</p><b>${nm.name}</b><div class="bar" style="margin-top:12px"><i style="width:${pct}%"></i></div><div class="bar-meta meta"><span>Level ${lvl}</span><span>${Math.max(0, hi - S.xp).toLocaleString()} XP to level ${nm.lvl}</span></div>`; }
    else $('#journey').innerHTML = '<b>Every milestone claimed</b><p class="sec">You did it all. More rewards are coming.</p>';
    $('#miles').innerHTML = MILES.map((m) => {
      const claimed = S.claimed[m.lvl], can = !claimed && lvl >= m.lvl;
      return `<div class="mile ${m.type} ${can ? 'claimable' : ''} ${claimed ? 'done' : ''} ${!claimed && !can ? 'locked' : ''}"><span class="node"></span><div class="mi">${MILE_ICON[m.type]}</div>
        <div class="mt"><b>${m.name}</b><span>${claimed ? 'Claimed' : can ? 'Ready to claim' : `${(thr(m.lvl) - S.xp).toLocaleString()} XP to go`}</span></div>
        ${can ? `<button class="btn primary sm" data-claim="${m.lvl}">Claim</button>` : `<span class="lv">Level ${m.lvl}</span>`}</div>`;
    }).join('');
  }
  const unused = () => S.coupons.filter((c) => !c.used);
  function renderRedeem() {
    const w = S.coupons.slice().reverse();
    $('#wallet').innerHTML = w.length ? w.map((c) => `<div class="mile coupon ${c.used ? 'used' : ''}"><div class="mi">${ICON.ticket}</div>
      <div class="mt"><b>${esc(c.title)}</b><span><code class="cp">${esc(c.code)}</code>${c.used ? ' · Redeemed' : ''}</span></div>
      <span class="val">${c.value} cr</span>${c.used ? '' : `<button class="btn primary sm" data-usec="${c.id}">Redeem</button>`}</div>`).join('')
      : '<div class="empty"><b>No coupons yet</b>Reach level 3 or turn coins into a coupon below.</div>';
    const top = Math.max(0, ...unused().map((c) => c.value));
    $('#catalog').innerHTML = CATALOG.map((r) => `<div class="deal ${r.cost > top ? 'off' : ''}"><span class="gi" style="--c:#d6ff3d;width:40px;height:40px">${ICON[r.icon]}</span><div class="big" style="margin:8px 0 0">${r.name}</div><span class="meta">${r.note}</span>
      <div class="gfoot" style="margin-top:12px"><span class="cost">${r.cost} cr</span><button class="btn sm" data-reward="${r.id}" ${r.cost > top ? 'disabled' : ''}>Get</button></div></div>`).join('');
    $('#store').innerHTML = PACKS.map((d) => `<div class="deal"><span class="meta">Coupon pack</span><div class="big">${d.value} credits</div>
      <button class="btn sm" data-buy="${d.id}" ${S.coins >= d.cost ? '' : 'disabled'}><span class="coin-t">${ICON.coin}${d.cost} coins</span></button></div>`).join('');
  }
  function renderRanks() {
    let x = (S.week.id.split('-').join('') | 0); const rnd = () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
    const rows = BOTS.map((n) => ({ n, av: AVATAR.random(n), xp: Math.round(120 + rnd() * 1800) })); rows.push({ n: S.name, av: S.avatar, xp: S.week.xp, me: true });
    rows.sort((a, b) => b.xp - a.xp);
    $('#board').innerHTML = rows.slice(0, 12).concat(rows.slice(12).filter((r) => r.me)).map((r) => `<li class="${r.me ? 'me' : ''}"><span class="pos">${rows.indexOf(r) + 1}</span><span class="lav">${AVATAR.svg(r.av, 36)}</span><span class="nm">${esc(r.n)}${r.me ? ' (you)' : ''}</span><span class="xp">${r.xp.toLocaleString()} XP</span></li>`).join('');
    const cur = rankOf(levelOf(S.xp));
    $('#ladder').innerHTML = RANKS.map((r) => `<div class="rung ${r === cur ? 'cur' : r[0] < cur[0] ? 'past' : ''}" style="--rc:${r[2]}"><b>${r[1]}</b><span class="meta">Level ${r[0]}+</span></div>`).join('');
  }
  function renderProfile() {
    $('#nameIn').value = S.name;
    $('#profStats').innerHTML = [[levelOf(S.xp), 'Level'], [S.xp, 'Total XP'], [S.coins, 'Coins'], [S.played, 'Puzzles solved'], [effStreak(), 'Day streak'], [S.ads, 'Bonuses claimed']].map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('');
    AVATAR.mountEditor($('#charEditor'), { av: S.avatar, level: levelOf(S.xp), onChange: (a) => { S.avatar = a; save(); $('#avBtn').innerHTML = AVATAR.svg(a, 30); } });
    $('#ach').innerHTML = ACH.map((a) => `<div class="${S.ach[a.id] ? 'got' : 'lock'}"><b>${a.t}</b><span>${a.d}</span></div>`).join('');
    $('#claims').innerHTML = S.claims.length ? S.claims.slice().reverse().map((c) => `<div class="row"><span>${esc(c.title)}</span><span>${c.code ? `<code class="cp">${esc(c.code)}</code>` : esc(c.status)}</span></div>`).join('') : '<p class="sec">Nothing yet. Claimed rewards and redemptions show up here.</p>';
    $('#bests').innerHTML = GAMES.map((g) => `<div class="row"><span>${g.name}</span><b>${S.best[g.id] || '—'}</b></div>`).join('');
  }
  const renderers = { play: renderPlay, versus: () => VERSUS.renderView(), rewards: renderRewards, redeem: renderRedeem, ranks: renderRanks, profile: renderProfile };
  let view = 'play';
  function go(v) {
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion:reduce)').matches && v !== view) return void document.startViewTransition(() => go2(v));
    go2(v);
  }
  function go2(v) {
    ensure(); view = renderers[v] ? v : 'play'; $$('.view').forEach((e) => e.classList.toggle('on', e.id === 'view-' + view));
    $$('#tabs button').forEach((b) => { const on = b.dataset.view === view; b.classList.toggle('on', on); on ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'); });
    renderers[view](); renderTop(); history.replaceState(null, '', '#' + view); scrollTo({ top: 0 });
  }
  const refresh = () => { ensure(); checkAch(); renderers[view](); renderTop(); save(); };

  /* ================= CLAIMS ================= */
  const mkCode = (brand) => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 8; i++) s += a[Math.floor(Math.random() * a.length)]; return brand.slice(0, 3).toUpperCase() + '-' + s.slice(0, 4) + '-' + s.slice(4); };
  const addCoupon = (title, value) => { const c = { id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), title, code: mkCode('PXQ'), value, used: false }; S.coupons.push(c); return c; };
  const couponModal = (c) => { modal(`<p class="meta">Coupon added to your wallet</p><h2>${esc(c.title)}</h2><p>Worth <b style="color:var(--ac)">${c.value} credits</b>. Spend it on any reward you like.</p><p><code class="cp">${esc(c.code)}</code></p><div class="acts"><button class="btn primary" data-view-go="redeem">Choose a reward</button><button class="btn ghost" data-close>Later</button></div>`); };
  function claim(lvl) {
    const m = MILES.find((x) => x.lvl === +lvl); if (!m || S.claimed[m.lvl] || levelOf(S.xp) < m.lvl) return;
    if (m.type === 'coins') { S.coins += m.amt; S.claimed[m.lvl] = 1; S.claims.push({ title: m.name, status: 'Added to wallet' }); confetti(60); sfx('win'); toast(`+${m.amt} coins`); bump(); refresh(); }
    else if (m.type === 'coupon') { const c = addCoupon(m.name, m.value); S.claimed[m.lvl] = 1; S.claims.push({ title: m.name, status: 'Added to coupons' }); confetti(80); sfx('win'); refresh(); couponModal(c); }
    else {
      modal(`<p class="meta">Cash reward</p><h2>${esc(m.name)}</h2><p>Where should we send it? Payouts are reviewed within 7 days.</p>
        <form id="cashF"><select id="cm" aria-label="Payout method"><option>PayPal</option><option>UPI</option><option>Bank transfer</option></select><input id="ca" required maxlength="80" placeholder="Email, UPI ID or account details" aria-label="Payout details"><button class="btn primary" type="submit">Request payout</button></form>`);
      $('#cashF').onsubmit = (e) => { e.preventDefault(); if (!$('#ca').value.trim()) return;
        S.claimed[m.lvl] = 1; S.claims.push({ title: `${m.name} to ${$('#cm').value}`, status: 'Pending review' }); confetti(80); sfx('win'); refresh(); closeModal(); toast('Payout requested. Pending review'); };
    }
  }
  function buy(id) {
    const d = PACKS.find((x) => x.id === id); if (!d || S.coins < d.cost) return;
    S.coins -= d.cost; const c = addCoupon(`${d.value}-credit coupon`, d.value); sfx('win'); bump(); refresh(); couponModal(c);
  }
  // redeem: pick coupon then reward. Leftover credit becomes coins.
  function redeemUI(couponId, rewardId) {
    const c = S.coupons.find((x) => x.id === couponId), r = CATALOG.find((x) => x.id === rewardId);
    if (c && !c.used && !r) {
      modal(`<p class="meta">${esc(c.title)} · ${c.value} credits</p><h2>Choose your reward</h2><p>Leftover credit turns into coins.</p><div class="pick">${CATALOG.map((x) => `<button data-do="${c.id}|${x.id}" ${x.cost > c.value ? 'disabled' : ''}><span>${x.name}<small>${x.note}</small></span><b>${x.cost} cr</b></button>`).join('')}</div><div class="acts"><button class="btn ghost" data-close>Cancel</button></div>`);
    } else if (r && !c) {
      const ok = unused().filter((x) => x.value >= r.cost);
      modal(`<p class="meta">${r.cost} credits</p><h2>${r.name}</h2><p>Pay with a coupon. Leftover credit turns into coins.</p><div class="pick">${ok.map((x) => `<button data-do="${x.id}|${r.id}"><span>${esc(x.title)}<small>${esc(x.code)}</small></span><b>${x.value} cr</b></button>`).join('') || '<p class="sec">You have no coupon big enough yet.</p>'}</div><div class="acts"><button class="btn ghost" data-close>Cancel</button></div>`);
    } else if (c && r) {
      if (c.used || c.value < r.cost) return;
      if (['cash', 'topup', 'gift'].includes(r.kind)) {
        const ph = r.kind === 'topup' ? 'Mobile number' : r.kind === 'gift' ? 'Email for the gift card' : 'PayPal email or UPI ID';
        modal(`<p class="meta">${r.cost} credits</p><h2>${r.name}</h2><p>Reviewed within 7 days. We will use these details only to deliver it.</p><form id="rdF"><input id="rdA" required maxlength="80" placeholder="${ph}" aria-label="${ph}"><button class="btn primary" type="submit">Confirm</button></form>`);
        $('#rdF').onsubmit = (e) => { e.preventDefault(); if (!$('#rdA').value.trim()) return; finishRedeem(c, r, 'Pending review'); };
      } else finishRedeem(c, r);
    }
  }
  function finishRedeem(c, r, status) {
    c.used = true; const left = c.value - r.cost; if (left > 0) S.coins += left;
    const code = r.kind === 'code' ? mkCode(r.brand) : '';
    S.claims.push({ title: r.name, code, status: status || (r.kind === 'donate' ? 'Donated, thank you' : 'Done') });
    sfx('win'); confetti(80); refresh(); bump();
    modal(`<p class="meta">Redeemed</p><h2>${esc(r.name)}</h2>${code ? `<p>Your code</p><p><code class="cp">${code}</code></p>` : `<p>${status ? 'We will review and deliver it within 7 days.' : 'Thank you!'}</p>`}${left > 0 ? `<p>+${left} coins from leftover credit.</p>` : ''}<div class="acts"><button class="btn primary" data-close>Done</button></div>`);
  }
  function promo(codeRaw) {
    const k = codeRaw.trim().toUpperCase(), P = PROMOS[k];
    if (!k) return; if (!P) return toast('That code is not valid'); if (S.promos[k]) return toast('Code already used');
    S.promos[k] = 1;
    if (P.coins) { S.coins += P.coins; toast(`+${P.coins} coins`); bump(); }
    if (P.coupon) { const c = addCoupon('Welcome coupon', P.coupon); refresh(); couponModal(c); }
    sfx('win'); refresh();
  }
  function bonus() {
    if (S.bonusDay === dayStr()) return; const amt = 10 + 5 * Math.min(effStreak(), 6);
    S.bonusDay = dayStr(); S.coins += amt; sfx('win'); toast(`+${amt} coins`); bump(); refresh();
  }
  function qclaim(id) {
    const q = QUESTS.find((x) => x.id === id); if (!q || S.q.claimed[id] || S.q[q.key] < q.goal) return;
    S.q.claimed[id] = 1; S.qdone++; S.coins += q.coins; sfx('win'); toast(`+${q.coins} coins`); bump(); refresh();
  }

  /* ================= GAME HELPERS ================= */
  function comboHide() { const c = $('#combo'); if (c) c.hidden = true; }
  function comboShow(n) {
    const c = $('#combo'); if (!c) return; if (n < 2) { c.hidden = true; return; }
    c.hidden = false; c.firstElementChild.textContent = `Combo ×${n}`; c.lastElementChild.firstElementChild.style.width = Math.min(100, n * 10) + '%';
    c.style.setProperty('--h', (60 + n * 28) % 360); c.classList.remove('hit'); void c.offsetWidth; c.classList.add('hit');
  }
  function flash(color) { const d = document.createElement('div'); d.className = 'flash'; d.style.background = color; $('.game-shell').append(d); setTimeout(() => d.remove(), 500); }
  function spend(n) { if (S.coins < n) { toast('Not enough coins'); sfx('bad'); return false; } S.coins -= n; $('#chipCoins').textContent = S.coins; save(); return true; }
  function addPower({ label, cost, use }) {
    if (curDuel) return;
    const b = document.createElement('button'); b.className = 'pw'; b.innerHTML = `<span>${esc(label)}</span><b>${cost}</b>`;
    b.onclick = () => { if (b.disabled) return; if (!spend(cost)) return; use(b); sfx('win'); };
    $('#powers').append(b); return b;
  }

  /* ================= GAME FLOW ================= */
  let cleanup = null, sinceAd = 0;
  let runDiff = 1, curDuel = null;
  function startGame(id, opts = {}) {
    const g = GAMES.find((x) => x.id === id); if (!g) return;
    curDuel = opts.duel || null;
    if (!opts.skipPre && !curDuel) {
      S.seen[g.id] = 1; save();
      modal(`<p class="meta">${g.tag} · ${g.time}</p><h2>${g.name}</h2><p>${g.how}</p>
        <div class="diff" role="group" aria-label="Difficulty">${DIFFS.map((d, i) => `<button class="dch ${i === S.diff ? 'on' : ''}" data-diff="${i}" aria-pressed="${i === S.diff}"><b>${d.n}</b><span>${d.m}× XP</span></button>`).join('')}</div>
        <p class="meta">${S.best[g.id] ? 'Your best: ' + S.best[g.id] : 'No score yet. Set one!'}</p>
        <div class="acts"><button class="btn primary" id="howGo">Start</button><button class="btn ghost" data-close>Not now</button></div>`);
      $('#howGo').onclick = () => { closeModal(); startGame(id, { skipPre: true }); }; return;
    }
    runDiff = curDuel ? curDuel.diff : S.diff;
    stopGame(); $('#gameTitle').textContent = g.name; $('#gameHud').innerHTML = ''; $('#stage').innerHTML = '';
    $('#gameOv').hidden = false; document.body.style.overflow = 'hidden'; S.last = g.id; $('.game-shell').style.setProperty('--c', g.color); $('#powers').innerHTML = ''; comboHide();
    const stage = $('#stage'), cd = document.createElement('div'); cd.className = 'cd'; cd.setAttribute('aria-live', 'assertive'); stage.append(cd);
    let n = 3, t; cleanup = () => clearTimeout(t);
    const step = () => {
      if (n > 0) { cd.textContent = n--; cd.classList.remove('pulse'); void cd.offsetWidth; cd.classList.add('pulse'); sfx('tap'); t = setTimeout(step, 520); return; }
      stage.innerHTML = '';
      cleanup = g.mount(stage, {
        sfx, ...fxApi, diff: runDiff, seed: curDuel ? curDuel.seed : undefined, combo: comboShow, flash, spend, power: addPower,
        hud: (items) => { if (curDuel && curDuel.onHud) curDuel.onHud(items); $('#gameHud').innerHTML = items.filter(Boolean).map((i) => typeof i === 'string' ? `<span class="hud">${esc(i)}</span>` : `<span class="hud ${i.low ? 'low' : ''}">${esc(i.t)}</span>`).join(''); },
        end: (r) => finish(g, r),
      });
    };
    step();
  }
  function stopGame() { if (cleanup) { try { cleanup(); } catch {} cleanup = null; } }
  function closeGame() { stopGame(); $('#gameOv').hidden = true; document.body.style.overflow = ''; }
  $('#gameClose').onclick = () => { if (curDuel) { const d = curDuel; curDuel = null; closeGame(); d.onEnd({ win: false, score: 0, dnf: true, label: 'Quit' }); return; } closeGame(); refresh(); };

  function finish(g, r) {
    if (curDuel) { const d = curDuel; curDuel = null; stopGame(); flash(r.win ? g.color : '#ff6b5e'); setTimeout(() => closeGame(), 350); d.onEnd(r); return; }
    stopGame(); ensure(); flash(r.win ? g.color : '#ff6b5e');
    const today = dayStr(), isDaily = g.id === dailyGame().id && S.dailyDone !== today && r.win;
    if (S.lastDay !== today) { S.streak = S.lastDay === dayStr(ago(1)) ? S.streak + 1 : 1; S.lastDay = today; }
    if (!S.days.includes(today)) S.days = S.days.concat(today).slice(-60);
    const mul = 1 + 0.05 * Math.min(S.streak - 1, 10);
    const stars0 = r.win ? (r.quality > .75 ? 3 : r.quality > .4 ? 2 : 1) : 0;
    let xp = r.win ? 40 + r.quality * 80 + (stars0 === 3 ? 25 : 0) : 10 + r.quality * 20;
    const dm = DIFFS[runDiff].m, bst = S.boost && r.win; if (bst) S.boost = false;
    xp = Math.round(xp * mul * dm * (bst ? 2 : 1) * (isDaily ? 2 : 1)); const coins = Math.max(2, Math.round(xp / 3));
    if (isDaily) S.dailyDone = today;
    const before = levelOf(S.xp);
    const apply = (x, c) => { S.xp += x; S.coins += c; S.week.xp += x; S.q.xp += x; };
    apply(xp, coins); S.q.plays++; if (r.win) { S.played++; S.q.wins++; }
    const newBest = r.win && (!S.best[g.id] || r.score > S.best[g.id]); if (!S.best[g.id] || r.score > S.best[g.id]) S.best[g.id] = r.score;
    const nStars = stars0; if (nStars === 3) S.stars3++;
    checkAch(); save();
    let boosted = false, luShown = false;
    const show = () => {
      const after = levelOf(S.xp), up = after > before, rk = rankOf(after), b = thr(after + 1), mult = boosted ? 2 : 1;
      const newly = MILES.filter((m) => m.lvl > before && m.lvl <= after && !S.claimed[m.lvl]);
      $('#gameOv').hidden = true;
      if (up && !luShown) { luShown = true; sfx('win'); confetti(220); const mm = modal(`<div class="lu-badge">${after}</div><p class="meta">Level up</p><h2>${rk[1]}</h2><p>${newly.length ? 'Reward unlocked: ' + esc(newly[0].name) : 'Keep going. Your next reward is closer.'}</p><div class="acts"><button class="btn primary" id="luGo">Continue</button></div>`); mm.classList.add('c'); mm.dataset.lock = '1'; $('#luGo').onclick = () => { delete mm.dataset.lock; mm.classList.remove('c'); closeModal(); show(); }; return; }
      if (r.win && !up) { sfx('win'); confetti(90, undefined, undefined, [g.color, '#f1efe9', '#d6ff3d', '#ff7aa8']); }
      const toGo = b - S.xp;
      const m = modal(`<p class="meta">${r.win ? 'Puzzle solved' : 'Round over'}${r.label ? ' · ' + esc(r.label) : ''}${newBest ? '<span class="tag-best">New best</span>' : ''}</p>
        ${r.win ? `<div class="stars" aria-label="${nStars} of 3 stars">${[1, 2, 3].map((i) => `<svg viewBox="0 0 24 24" class="${i <= nStars ? 'on' : ''}" fill="currentColor"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.5 5.700 21l1.500-7L2 9.300l7-.8z"/></svg>`).join('')}</div>` : ''}
        <div class="res-xp" id="rx">0</div><p style="margin-top:0">XP earned${isDaily ? ' (daily 2×)' : ''}</p>
        <div class="res-rows"><div><span>Difficulty</span><b>${DIFFS[runDiff].n} ×${DIFFS[runDiff].m}${bst ? ' · 2× boost' : ''}</b></div>${nStars === 3 ? '<div><span>Perfect bonus</span><b>+25 XP</b></div>' : ''}<div><span>Coins</span><b>+${coins * mult}</b></div><div><span>Streak</span><b>${S.streak} day${S.streak > 1 ? 's' : ''}${mul > 1 ? ' (+' + Math.round((mul - 1) * 100) + '% XP)' : ''}</b></div><div><span>Next level</span><b>${toGo} XP</b></div></div>
        ${up ? `<div class="lvup">Level ${after} reached: ${rk[1]}</div>` : ''}
        ${newly.length ? `<div class="lvup">Reward unlocked: ${esc(newly[0].name)}</div>` : ''}
        <div class="acts"><button class="btn primary" id="again">Play again</button>
        ${boosted ? '' : '<button class="btn" id="dbl">Watch ad to double rewards</button>'}
        <button class="btn ghost" id="shr">Share result</button>
        <button class="btn ghost" id="home">${newly.length ? 'Claim reward' : 'Back to puzzles'}</button></div>`);
      m.dataset.lock = '1'; countUp($('#rx'), xp * mult);
      const dbl = $('#dbl'); if (dbl) dbl.onclick = () => { delete m.dataset.lock; closeModal(); showAd({ rewarded: true }, (ok) => { if (ok) { apply(xp, coins); boosted = true; save(); bump(); } show(); }); };
      $('#shr').onclick = () => shareText(`I ${r.win ? 'solved' : 'played'} ${g.name} on Pixaquest and earned ${xp * mult} XP. Can you beat me?`);
      $('#again').onclick = () => { closeModal(); sinceAd++; maybeInterstitial(() => startGame(g.id, { skipPre: true })); };
      $('#home').onclick = () => { closeModal(); closeGame(); sinceAd++; maybeInterstitial(() => go(newly.length ? 'rewards' : 'play')); };
      renderTop(); bump();
    };
    show();
  }
  function maybeInterstitial(next) { if (sinceAd >= CONFIG.interstitialEvery) { sinceAd = 0; showAd({ rewarded: false, secs: 3 }, () => next()); } else next(); }

  async function shareText(text) {
    const url = location.origin + location.pathname;
    try { if (navigator.share) { await navigator.share({ title: 'Pixaquest', text, url }); return; } await navigator.clipboard.writeText(text + ' ' + url); toast('Link copied'); } catch {}
  }
  function settings() {
    const row = (k, t, d) => `<div class="setrow"><span>${t}<small>${d}</small></span><button class="sw ${S[k] ? 'on' : ''}" role="switch" aria-checked="${!!S[k]}" aria-label="${t}" data-set="${k}"></button></div>`;
    modal(`<h2>Settings</h2>${row('sound', 'Sound', 'Game and reward sounds')}${row('haptics', 'Vibration', 'Feedback on phones')}
      <div class="acts"><button class="btn ghost" id="shApp">Invite a friend</button><button class="btn primary" data-close>Done</button></div>`);
    $('#shApp').onclick = () => shareText('I am training my brain and earning rewards on Pixaquest. Try it!');
  }
  function onboarding(done) {
    const m = modal(`<div class="welcome"><img class="wlogo" src="assets/logo-full.png" alt="Pixaquest" width="132" height="132"><div class="obav" id="obAv">${AVATAR.svg(S.avatar, 84)}</div><button class="btn ghost sm" id="obShuf" style="margin:0 auto 8px;display:flex">Shuffle character</button><p class="meta">Welcome</p><h2>Train your brain. Earn rewards.</h2>
      <ul><li><b>1</b>Solve puzzles to earn XP and coins.</li><li><b>2</b>Level up to unlock coupons and cash rewards.</li><li><b>3</b>Spend coupons on the reward you want.</li></ul>
      <label class="sec" for="obName">Pick a display name</label><input id="obName" maxlength="16" value="${S.name === 'Player' ? '' : esc(S.name)}" placeholder="Player" autocomplete="nickname">
      <div class="acts"><button class="btn primary" id="obGo">Start with 25 free coins</button></div></div>`, { onClose: () => { if (!S.onboarded) { S.onboarded = true; save(); } done(); } });
    m.dataset.lock = '1';
    $('#obShuf').onclick = () => { S.avatar = AVATAR.random(); $('#obAv').innerHTML = AVATAR.svg(S.avatar, 84); save(); renderTop(); };
    $('#obGo').onclick = () => { S.name = ($('#obName').value.trim() || 'Player').slice(0, 16); if (!S.onboarded) { S.onboarded = true; S.coins += 25; save(); } delete m.dataset.lock; closeModal(); refresh(); bump(); };
  }

  function spinUI() {
    if (S.spinDay === dayStr()) return toast('Come back tomorrow');
    const seg = 360 / WHEEL.length, grad = WHEEL.map((w, i) => `${w.col} ${i * seg}deg ${(i + 1) * seg}deg`).join(',');
    const m = modal(`<p class="meta">Daily reward</p><h2>Lucky spin</h2><div class="wheel-wrap"><div class="pointer"></div><div class="wheel" id="wheel" style="background:conic-gradient(${grad})">${WHEEL.map((w, i) => `<span style="--a:${i * seg + seg / 2}deg">${w.t}</span>`).join('')}</div></div>
      <div class="acts"><button class="btn primary" id="spinGo">Spin</button><button class="btn ghost" data-close id="spinX">Close</button></div>`);
    m.classList.add('c');
    $('#spinGo').onclick = () => {
      $('#spinGo').disabled = true; $('#spinX').disabled = true; m.dataset.lock = '1'; S.spinDay = dayStr(); save();
      let r = Math.random() * WHEEL.reduce((a, w) => a + w.w, 0), idx = 0; for (; idx < WHEEL.length - 1; idx++) { r -= WHEEL[idx].w; if (r <= 0) break; }
      const still = matchMedia('(prefers-reduced-motion:reduce)').matches, deg = 360 * 6 - (idx * seg + seg / 2), wh = $('#wheel');
      wh.style.transition = still ? 'none' : 'transform 4.2s cubic-bezier(.12,.65,.1,1)'; wh.style.transform = `rotate(${deg}deg)`;
      let k = 0; const tk = setInterval(() => { sfx('tap'); if (++k > 22) clearInterval(tk); }, 150);
      setTimeout(() => {
        clearInterval(tk); const w = WHEEL[idx]; delete m.dataset.lock; $('#spinX').disabled = false; sfx('win'); confetti(90);
        if (w.c) { S.coins += w.c; bump(); } if (w.cp) addCoupon('Lucky coupon', w.cp); if (w.boost) S.boost = true;
        $('#spinGo').textContent = w.c ? `You won ${w.c} coins` : w.cp ? 'You won a 150-credit coupon' : 'Next win pays 2× XP';
        refresh();
      }, still ? 50 : 4400);
    };
  }

  /* ================= CONSENT ================= */
  const CK = 'pixaquest.consent';
  const getConsent = () => { try { return localStorage.getItem(CK); } catch { return null; } };
  function consentBanner() {
    if (document.querySelector('.consent')) return;
    const d = document.createElement('div'); d.className = 'consent'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Cookie consent');
    d.innerHTML = '<span>We use cookies to run the site and to show ads. You can accept personalised ads or keep them non-personalised. See our <a href="privacy.html#cookies" style="color:var(--ac)">Cookie policy</a>.</span><div class="acts"><button class="btn primary sm" data-consent="yes">Accept</button><button class="btn sm" data-consent="no">Keep non-personalised</button></div>';
    document.body.append(d);
  }
  function setConsent(v) { try { localStorage.setItem(CK, v); } catch {} const b = document.querySelector('.consent'); b && b.remove(); toast(v === 'yes' ? 'Preferences saved' : 'Non-personalised ads only'); }

  /* ================= EVENTS ================= */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return; const d = t.dataset;
    if (d.view) go(d.view);
    else if (d.viewGo) { closeModal(); go(d.viewGo); }
    else if (d.filter) { filter = d.filter; renderPlay(); }
    else if (d.usec) redeemUI(d.usec);
    else if (d.reward) redeemUI(null, d.reward);
    else if (d.do) { const [ci, ri] = d.do.split('|'); redeemUI(ci, ri); }
    else if (d.consent) setConsent(d.consent);
    else if (d.set) { S[d.set] = !S[d.set]; t.classList.toggle('on', S[d.set]); t.setAttribute('aria-checked', !!S[d.set]); save(); if (S[d.set]) sfx('tap'); }
    else if (d.play) startGame(d.play);
    else if (d.claim) claim(d.claim);
    else if (d.buy) buy(d.buy);
    else if (d.bonus) bonus();
    else if (d.spin) spinUI();
    else if (d.diff !== undefined) { S.diff = +d.diff; save(); $$('.dch').forEach((b) => { const on = +b.dataset.diff === S.diff; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); }
    else if (d.qclaim) qclaim(d.qclaim);
    else if (d.close !== undefined) closeModal();
  });
  $('#ctaPlay').addEventListener('click', () => { const id = $('#ctaPlay').dataset.play; if (id) startGame(id); });
  $('#nameIn').addEventListener('input', (e) => { S.name = e.target.value.trim().slice(0, 16) || 'Player'; save(); });
  $('#resetBtn').onclick = () => { if (confirm('Erase all progress, coins and rewards on this device?')) { S = fresh(); ensure(); save(); go('play'); toast('Progress reset'); } };
  $('#promoF').addEventListener('submit', (e) => { e.preventDefault(); promo($('#promoIn').value); $('#promoIn').value = ''; });
  $('#cookieBtn').onclick = consentBanner;
  $('#setBtn').onclick = settings;
  const askConsent = () => { setTimeout(() => VERSUS.boot(), 350); if (getConsent() === null) setTimeout(consentBanner, 800); };
  if (!S.onboarded) setTimeout(() => onboarding(askConsent), 400); else askConsent();
  $('#yr').textContent = new Date().getFullYear();
  addEventListener('hashchange', () => { const v = location.hash.slice(1); if (v in renderers && v !== view) go(v); });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && location.hostname !== 'localhost') navigator.serviceWorker.register('sw.js').catch(() => {});

  const PXQ = {
    get S() { return S; }, GAMES, save, modal, closeModal, toast, confetti, sfx, startGame, closeGame, go,
    grant({ xp = 0, coins = 0 }) { const b = levelOf(S.xp); S.xp += xp; S.coins += coins; S.week.xp += xp; checkAch(); save(); renderTop(); bump(); const a = levelOf(S.xp); if (a > b) toast(`Level ${a}!`); },
    refreshView() { renderers[view] && renderers[view](); },
  };
  VERSUS.init(PXQ);
  $('#avBtn').onclick = () => { go('profile'); setTimeout(() => { const c = $('#char'); c && c.scrollIntoView({ behavior: 'smooth' }); }, 120); };
  initAds();
  go(location.hash.slice(1) in renderers ? location.hash.slice(1) : 'play');
})();
