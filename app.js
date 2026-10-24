(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const t = I18N.t, nf = I18N.n;

  /* ================= CONFIG ================= */
  const CONFIG = {
    // Ads: set your AdSense publisher id (e.g. 'ca-pub-123…') and slot ids to serve real ads.
    adsenseClient: '',
    adSlots: { inline: '', side: '', rewards: '', game: '', rail: '', gameside: '' },
    interstitialEvery: 3,   // skippable interstitial every N finished games
  };
  const RANKS = [[1, '#9aa1b3'], [3, '#5aa9ff'], [5, '#3dd6a5'], [8, '#ffb454'], [12, '#ff7aa8'], [18, '#c28bff'], [25, '#ff6b5e'], [35, '#f2d45c'], [50, '#d6ff3d']];
  const DIFF_M = [1, 1.5, 2.5], DIFF_K = ['easy', 'normal', 'hard'];
  const dn = (i) => t('diff.' + DIFF_K[i]);
  const WHEEL = [{ t: '+20', c: 20, w: 20, col: '#ff6b5e' }, { t: '+50', c: 50, w: 14, col: '#ffb454' }, { t: '+15', c: 15, w: 22, col: '#f2d45c' }, { t: '+100', c: 100, w: 4, col: '#3dd6a5' }, { k: 'wheel.coupon', cp: 150, w: 4, col: '#5aa9ff' }, { t: '2× XP', boost: 1, w: 12, col: '#c28bff' }, { t: '+30', c: 30, w: 16, col: '#ff7aa8' }, { t: '+75', c: 75, w: 8, col: '#4fd1e0' }];
  const MILES = [
    { lvl: 2, type: 'coins', amt: 50 },
    { lvl: 3, type: 'coupon', value: 200 },
    { lvl: 5, type: 'coupon', value: 400 },
    { lvl: 8, type: 'coupon', value: 600 },
    { lvl: 10, type: 'cash', amt: 2 },
    { lvl: 15, type: 'coupon', value: 1000 },
    { lvl: 20, type: 'cash', amt: 5 },
    { lvl: 30, type: 'cash', amt: 10 },
    { lvl: 50, type: 'cash', amt: 25 },
  ];
  const mname = (m) => t('mile.' + m.type, { n: nf(m.amt || m.value) });
  const PACKS = [
    { id: 'p1', cost: 150, value: 150 },
    { id: 'p2', cost: 400, value: 480 },
    { id: 'p3', cost: 800, value: 1000 },
  ];
  const CATALOG = [
    { id: 'c1', note: 'code', cost: 150, kind: 'code', brand: 'ShopNova', icon: 'ticket' },
    { id: 'c2', note: 'code', cost: 200, kind: 'code', brand: 'FoodieGo', icon: 'ticket' },
    { id: 'c3', note: 'code', cost: 600, kind: 'code', brand: 'StreamBox', icon: 'ticket' },
    { id: 'c4', note: 'review', cost: 300, kind: 'topup', icon: 'phone' },
    { id: 'c5', note: 'review', cost: 400, kind: 'cash', icon: 'cash' },
    { id: 'c6', note: 'email', cost: 500, kind: 'gift', icon: 'gift' },
    { id: 'c7', note: 'instant', cost: 100, kind: 'donate', icon: 'heart' },
  ];
  const rname = (r) => t('cat.' + r.id), rnote = (r) => t('cat.n.' + r.note);
  const PROMOS = { PIXAQUEST: { coins: 100 }, WELCOME: { coupon: 200 } };
  const QUESTS = [
    { id: 'play', goal: 3, key: 'plays', coins: 15 },
    { id: 'win', goal: 2, key: 'wins', coins: 20 },
    { id: 'xp', goal: 150, key: 'xp', coins: 30 },
  ];
  const BOTS = ['Aria', 'Kenji', 'Luna', 'Max', 'Zara', 'Omar', 'Mia', 'Leo', 'Nina', 'Raj', 'Eva', 'Sam', 'Ivy', 'Noah', 'Tara', 'Finn', 'Yuki', 'Cleo', 'Dev'];
  const FREEZE_COST = 60, FREEZE_MAX = 2;
  const STREAK_MS = [[3, 30], [7, 100], [14, 250], [30, 600]];
  const FLAME = '<svg class="ic flame" viewBox="0 0 24 24" aria-hidden="true"><use href="#flameG"/></svg>';
  const MILE_ICON = { coins: ICON.coin, coupon: ICON.ticket, cash: ICON.cash };

  /* ================= STATE ================= */
  const KEY = 'pixaquest.v1', OLD_KEY = 'pixaton.v1';
  const fresh = () => ({ name: 'Player', xp: 0, coins: 0, played: 0, streak: 0, lastDay: '', days: [], best: {}, claimed: {}, claims: [], dailyDone: '', bonusDay: '', last: '', coupons: [], seen: {}, promos: {}, q: { day: '', plays: 0, wins: 0, xp: 0, claimed: {} }, week: { id: '', xp: 0 }, sound: true, haptics: true, ads: 0, onboarded: false, diff: 1, spinDay: '', boost: false, ach: {}, stars3: 0, qdone: 0, freezes: 0, bestStreak: 0, sm: {}, visit: '' });
  let S;
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || localStorage.getItem(OLD_KEY) || '{}')); } catch { S = fresh(); }
  S.claims = S.claims.filter((c) => { if (c.code) { S.coupons.push({ id: 'm' + Math.random().toString(36).slice(2, 8), title: c.title, code: c.code, value: 200, used: false }); return false; } return true; });
  if (!S.avatar) S.avatar = AVATAR.random(S.name + Math.random());
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
  const ACH = [
    { id: 'first', ok: () => S.played >= 1 },
    { id: 's3', ok: () => effStreak() >= 3 },
    { id: 's7', ok: () => effStreak() >= 7 },
    { id: 'l5', ok: () => levelOf(S.xp) >= 5 },
    { id: 'l10', ok: () => levelOf(S.xp) >= 10 },
    { id: 'all', ok: () => GAMES.every((g) => S.best[g.id] !== undefined) },
    { id: 'perf', ok: () => S.stars3 >= 5 },
    { id: 'q', ok: () => S.qdone >= 10 },
    { id: 'coin', ok: () => S.coins >= 500 },
  ];
  function checkAch() { ACH.forEach((a) => { if (!S.ach[a.id] && a.ok()) { S.ach[a.id] = 1; S.coins += 20; toast(t('ach.toast', { n: t('ach.' + a.id + '.t') })); } }); }

  const thr = (n) => 30 * n * (n - 1);
  const levelOf = (xp) => { let n = 1; while (xp >= thr(n + 1)) n++; return n; };
  const rankOf = (lvl) => { const r = RANKS.filter((x) => x[0] <= lvl).pop(); return { lvl: r[0], name: t('rank.' + r[0]), col: r[1] }; };
  const dayStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const ago = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
  const weekId = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dayStr(d); };
  const effStreak = () => (S.lastDay === dayStr() || S.lastDay === dayStr(ago(1))) ? S.streak : 0;
  const dailyGame = () => { const A = GAMES.filter((g) => g.cat === 'arcade'); return A[Math.floor(Date.now() / 864e5) % A.length]; };
  const dayDiff = (a, b) => Math.round((new Date(b + 'T00:00') - new Date(a + 'T00:00')) / 864e5);
  const notes = [];
  const ensure = () => {
    // a freeze quietly covers missed days, but only when it can cover all of them
    const missed = S.lastDay && S.streak > 0 ? dayDiff(S.lastDay, dayStr()) - 1 : 0;
    if (missed > 0 && S.freezes >= missed) { S.freezes -= missed; S.lastDay = dayStr(ago(1)); notes.push(t('streak.used', { n: S.streak })); save(); }
    if (effStreak() > S.bestStreak) S.bestStreak = effStreak();
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
  const confCols = () => (THEME.resolved === 'light' ? ['#4d7c0f', '#8b7bff', '#ff6b5e', '#5aa9ff'] : ['#d6ff3d', '#f1efe9', '#5aa9ff', '#ff7aa8']);
  function confetti(n = 100, ox = innerWidth / 2, oy = innerHeight / 3, cols = confCols(), spread = 16) {
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
    burst: (el, color = '#d6ff3d', n = 18) => { const [x, y] = center(el); confetti(n, x, y, [color, THEME.resolved === 'light' ? '#16181d' : '#f1efe9'], 9); },
    pop: (el, text, color) => { const [x, y] = center(el); floatText(x, y, text, color); },
    shake: (el) => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 320); },
  };
  function tick() {
    cx.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter((p) => p.life-- > 0);
    parts.forEach((p) => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.r += .2; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.globalAlpha = Math.min(1, p.life / 30); cx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); cx.restore(); });
    if (parts.length) raf = requestAnimationFrame(tick); else { raf = 0; cx.clearRect(0, 0, cv.width, cv.height); cv.width = 1; }
  }
  function toast(msg) { const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg; $('#toasts').append(el); setTimeout(() => el.remove(), 3200); }
  function countUp(el, to, ms = 700) {
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) { el.textContent = to; return; }
    setTimeout(() => { el.textContent = to; }, ms + 80);
    const t0 = performance.now(); (function s(now) { const p = Math.min(1, (now - t0) / ms); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(s); })(t0);
  }
  const bump = () => { const c = $('#chipCoinBox'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); };

  /* ================= MODALS ================= */
  function modal(html, { onClose } = {}) {
    const m = $('#modal'); delete m.dataset.lock; if (!m._prev) m._prev = document.activeElement; m.innerHTML = html; $('#modalOv').hidden = false;
    m._close = onClose; setTimeout(() => { const f = m.querySelector('.btn.primary,button,input'); f && f.focus(); }, 40); return m;
  }
  function closeModal() { const m = $('#modal'); $('#modalOv').hidden = true; m.classList.remove('c', 'wide'); const c = m._close; m._close = null; const pv = m._prev; m._prev = null; c && c(); try { pv && pv.isConnected && pv.focus(); } catch {} }
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
      } else el.textContent = t('ad.space');
    });
  }
  // Rewarded / interstitial ad. Replace with your ad SDK call (rewarded ad, interstitial).
  function showAd({ rewarded, secs = 5 }, done) {
    let n = secs, ok = false, iv;
    const m = modal(`<p class="meta">${rewarded ? t('ad.rewarded') : t('ad.sponsored')}</p><h2>${rewarded ? t('ad.double') : t('ad.back')}</h2><div class="adfake">${t('ad.plays')}</div>
      <div class="center"><div class="countdown" id="adc">${n}</div></div>
      <div class="acts"><button class="btn primary" id="adx" disabled>${rewarded ? t('ad.claim') : t('ad.skip')}</button></div>`, { onClose: () => { clearInterval(iv); done(ok); } });
    m.dataset.lock = '1';
    iv = setInterval(() => { n--; $('#adc', m).textContent = Math.max(n, 0); if (n <= 0) { clearInterval(iv); $('#adx', m).disabled = false; ok = true; } }, 1000);
    $('#adx', m).onclick = () => { delete m.dataset.lock; S.ads++; save(); closeModal(); };
  }

  /* ================= RENDER ================= */
  const nextMile = () => MILES.find((m) => !S.claimed[m.lvl]) || null;
  const fmtTime = (s) => (s % 60 === 0 ? t('u.min', { n: s / 60 }) : t('u.sec', { n: s }));
  function renderTop() {
    const lvl = levelOf(S.xp), r = rankOf(lvl), a = thr(lvl), b = thr(lvl + 1);
    $('#chipCoins').textContent = nf(S.coins); $('#chipLvl').textContent = lvl; $('#avBtn').innerHTML = AVATAR.svg(S.avatar, 30);
    $('#lvlBadge').textContent = lvl; $('#lvlBadge').style.setProperty('--rc', r.col); $('#lvlBadge').style.setProperty('--p', Math.round((S.xp - a) / (b - a) * 100)); $('#heroRank').textContent = `${r.name} · ${t('u.level', { n: lvl })}`;
    $('#xpFill').style.width = ((S.xp - a) / (b - a) * 100) + '%';
    $('#xpText').textContent = t('hero.xp', { a: nf(S.xp - a), b: nf(b - a), n: lvl + 1 });
    const nm = nextMile(); $('#nextMile').textContent = nm ? t('hero.next', { name: mname(nm), n: nm.lvl }) : t('hero.allclaimed');
    const st = effStreak(), atRisk = st > 0 && S.lastDay !== dayStr(), cs = $('#chipStreak');
    $('#chipStreakN').textContent = st; cs.classList.toggle('on', st > 0); cs.classList.toggle('risk', atRisk);
    const rk = $('#risk');
    if (atRisk) {
      const h = Math.max(1, 24 - new Date().getHours());
      rk.hidden = false;
      rk.innerHTML = `${FLAME}<div><b>${t('risk.t', { n: st, h })}</b><span>${S.freezes ? t('risk.freeze') : t('risk.d')}</span></div>${!S.freezes ? `<button class="btn sm" data-freeze="1">${t('risk.buy', { n: FREEZE_COST })}</button>` : ''}`;
    } else rk.hidden = true;
    $('#heroLine').textContent = S.played === 0 ? t('hero.first') : t('hero.togo', { n: nf(b - S.xp), l: lvl + 1 });
    const d = dailyGame(), done = S.dailyDone === dayStr(), last = GAMES.find((g) => g.id === S.last);
    const cta = $('#ctaPlay'), target = done ? (last || d) : d; cta.dataset.play = target.id;
    const fi = $('#featIcon'); fi.innerHTML = target.icon; fi.style.setProperty('--c', target.color);
    $('#featName').textContent = done ? target.name : t('hero.daily', { name: target.name });
    $('#featNote').textContent = S.boost ? t('hero.boost') : done ? t('hero.dailydone') : t('hero.dailytip');
  }
  let filter = 'Arcade';
  function renderPlay() {
    const d = dailyGame(), done = S.dailyDone === dayStr();
    const tags = ['Arcade', '3D', 'Brain'], inCat = (g) => filter === 'Arcade' ? g.cat === 'arcade' : filter === '3D' ? g.is3d : g.cat === 'brain';
    $('#filters').innerHTML = tags.map((x) => `<button class="${x === filter ? 'on' : ''}" data-filter="${x}" aria-pressed="${x === filter}">${t('tag.' + x)}</button>`).join('');
    const q = ($('#gSearch').value || '').trim().toLowerCase(), bdg = (g) => g.isNew ? `<i class="bdg new">${t('badge.new')}</i>` : g.hot ? `<i class="bdg hot">🔥 ${t('badge.hot')}</i>` : '';
    $('#trend').innerHTML = GAMES.filter((g) => g.hot && g.cat === 'arcade').map((g) => `<button class="tcard" style="--c:${g.color}" data-play="${g.id}"><span class="art">${g.banner}</span>${bdg(g)}<span class="tname"><b>${g.name}</b><span>${t('tag.' + g.tag)}</span></span><span class="tplay" aria-hidden="true">▶</span></button>`).join('');
    $('#gameGrid').innerHTML = GAMES.filter((g) => (q ? true : inCat(g)) && (!q || g.name.toLowerCase().includes(q))).map((g) => `<button class="gcard" style="--c:${g.color}" data-play="${g.id}">
      <span class="art art-${g.art}">${g.banner || ''}${bdg(g)}<span class="gi">${g.icon}</span><span class="tplay" aria-hidden="true">▶</span></span><span><h3>${g.name}</h3><p>${g.desc}</p></span>
      <span class="gfoot meta"><span>${t('tag.' + g.tag)} · ${fmtTime(g.time)}</span>${g.id === d.id && !done ? `<span class="daily-t">${t('card.daily')}</span>` : `<span>${S.best[g.id] ? t('card.best', { n: nf(S.best[g.id]) }) : t('card.new')}</span>`}</span></button>`).join('') || `<p class="lead">${t('play.none')}</p>`;
    // bonus + streak
    const st = effStreak(), claimed = S.bonusDay === dayStr(), amt = 10 + 5 * Math.min(st, 6);
    let wk = ''; for (let i = 6; i >= 0; i--) { const d0 = ago(i), ds = dayStr(d0); wk += `<div class="wd ${S.days.includes(ds) ? 'on' : ''} ${i === 0 ? 'now' : ''}"><i></i>${d0.toLocaleDateString(I18N.lang, { weekday: 'narrow' })}</div>`; }
    const risk = S.lastDay === dayStr(ago(1)) && st > 0;
    $('#bonus').innerHTML = `<h3>${st ? t('bonus.streak', { n: st }) : t('bonus.start')}<span>${risk ? t('bonus.risk') : t('bonus.daily')}</span></h3><div class="week" aria-hidden="true">${wk}</div>
      <p class="road meta">${(() => { const nx = STREAK_MS.find(([d]) => d > S.streak && !S.sm[d]); return nx ? `${FLAME} ${t('streak.road', { d: nx[0], c: nx[1] })}` : t('streak.roadall'); })()}</p>
      ${claimed ? `<button class="btn block" disabled>${t('bonus.claimed')}</button>` : `<button class="btn primary block" data-bonus="1">${t('bonus.claim', { n: amt })}</button>`}
      <button class="btn block spinbtn" data-spin="1" ${S.spinDay === dayStr() ? 'disabled' : ''}>${S.spinDay === dayStr() ? t('spin.used') : t('spin.btn')}</button>`;
    // quests
    $('#quests').innerHTML = `<h3>${t('quest.title')}<span>${t('quest.reset')}</span></h3>` + QUESTS.map((q) => {
      const v = Math.min(S.q[q.key], q.goal), full = v >= q.goal, got = S.q.claimed[q.id];
      return `<div class="quest"><div class="q-top"><b>${t('quest.' + q.id)}</b>${got ? `<span class="meta">${t('quest.done')}</span>` : full ? `<button class="btn primary sm" data-qclaim="${q.id}">${t('quest.claim', { n: q.coins })}</button>` : `<span class="q-r">${ICON.coin}${q.coins}</span>`}</div>
        <div class="bar thin"><i style="width:${v / q.goal * 100}%"></i></div></div>`;
    }).join('');
  }
  function renderRewards() {
    const lvl = levelOf(S.xp), nm = nextMile();
    if (nm) { const prev = MILES.filter((m) => m.lvl < nm.lvl).pop(), lo = prev ? thr(prev.lvl) : 0, hi = thr(nm.lvl), pct = Math.max(0, Math.min(100, (S.xp - lo) / (hi - lo) * 100));
      $('#journey').innerHTML = `<p class="meta">${t('rw.next')}</p><b>${mname(nm)}</b><div class="bar" style="margin-top:12px"><i style="width:${pct}%"></i></div><div class="bar-meta meta"><span>${t('u.level', { n: lvl })}</span><span>${t('rw.xpto', { n: nf(Math.max(0, hi - S.xp)), l: nm.lvl })}</span></div>`; }
    else $('#journey').innerHTML = `<b>${t('rw.all')}</b><p class="sec">${t('rw.all.d')}</p>`;
    $('#miles').innerHTML = MILES.map((m) => {
      const claimed = S.claimed[m.lvl], can = !claimed && lvl >= m.lvl;
      return `<div class="mile ${m.type} ${can ? 'claimable' : ''} ${claimed ? 'done' : ''} ${!claimed && !can ? 'locked' : ''}"><span class="node"></span><div class="mi">${MILE_ICON[m.type]}</div>
        <div class="mt"><b>${mname(m)}</b><span>${claimed ? t('rw.claimed') : can ? t('rw.ready') : t('rw.togo', { n: nf(thr(m.lvl) - S.xp) })}</span></div>
        ${can ? `<button class="btn primary sm" data-claim="${m.lvl}">${t('rw.claim')}</button>` : `<span class="lv">${t('u.level', { n: m.lvl })}</span>`}</div>`;
    }).join('');
  }
  const unused = () => S.coupons.filter((c) => !c.used);
  function renderRedeem() {
    const w = S.coupons.slice().reverse();
    $('#wallet').innerHTML = w.length ? w.map((c) => `<div class="mile coupon ${c.used ? 'used' : ''}"><div class="mi">${ICON.ticket}</div>
      <div class="mt"><b>${esc(c.title)}</b><span><code class="cp">${esc(c.code)}</code>${c.used ? ' · ' + t('rd.redeemed') : ''}</span></div>
      <span class="val">${t('u.cr', { n: nf(c.value) })}</span>${c.used ? '' : `<button class="btn primary sm" data-usec="${c.id}">${t('rd.redeem')}</button>`}</div>`).join('')
      : `<div class="empty"><b>${t('rd.empty')}</b>${t('rd.empty.d')}</div>`;
    const top = Math.max(0, ...unused().map((c) => c.value));
    $('#catalog').innerHTML = CATALOG.map((r) => `<div class="deal ${r.cost > top ? 'off' : ''}"><span class="gi" style="--c:var(--ac);width:40px;height:40px">${ICON[r.icon]}</span><div class="big" style="margin:8px 0 0">${rname(r)}</div><span class="meta">${rnote(r)}</span>
      <div class="gfoot" style="margin-top:12px"><span class="cost">${t('u.cr', { n: r.cost })}</span><button class="btn sm" data-reward="${r.id}" ${r.cost > top ? 'disabled' : ''}>${t('rd.get')}</button></div></div>`).join('');
    $('#store').innerHTML = PACKS.map((d) => `<div class="deal"><span class="meta">${t('rd.pack')}</span><div class="big">${t('u.credits', { n: nf(d.value) })}</div>
      <button class="btn sm" data-buy="${d.id}" ${S.coins >= d.cost ? '' : 'disabled'}><span class="coin-t">${ICON.coin}${t('u.coins', { n: nf(d.cost) })}</span></button></div>`).join('');
  }
  function renderRanks() {
    let x = (S.week.id.split('-').join('') | 0); const rnd = () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
    const rows = BOTS.map((n) => ({ n, av: { ...AVATAR.random(n), frame: AVATAR.hash(n) % AVATAR.FRAMES.length }, xp: Math.round(120 + rnd() * 1800) })); rows.push({ n: S.name, av: S.avatar, xp: S.week.xp, me: true });
    rows.sort((a, b) => b.xp - a.xp);
    $('#board').innerHTML = rows.slice(0, 12).concat(rows.slice(12).filter((r) => r.me)).map((r) => `<li class="${r.me ? 'me' : ''}"><span class="pos">${rows.indexOf(r) + 1}</span><span class="lav">${AVATAR.framed(r.av, 36)}</span><span class="nm">${esc(r.n)}${r.me ? ' ' + t('rk.you') : ''}${r.me ? `<small>${t('ti.' + AVATAR.TITLES[S.avatar.title || 0].n)}</small>` : ''}</span><span class="xp">${t('u.xp', { n: nf(r.xp) })}</span></li>`).join('');
    const cur = rankOf(levelOf(S.xp));
    $('#ladder').innerHTML = RANKS.map((r) => `<div class="rung ${r[0] === cur.lvl ? 'cur' : r[0] < cur.lvl ? 'past' : ''}" style="--rc:${r[1]}"><b>${t('rank.' + r[0])}</b><span class="meta">${t('rk.lvplus', { n: r[0] })}</span></div>`).join('');
  }

  /* ---------- account ---------- */
  const AIC = {
    overview: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
    character: '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/><path d="M8.500 14.500q3.500 3 7 0"/>',
    achievements: '<path d="M8 4h8v5a4 4 0 01-8 0zM8 6H5v1a3 3 0 003 3M16 6h3v1a3 3 0 01-3 3M12 13v4M9 20h6M10 17h4"/>',
    activity: '<path d="M4 13h4l2-6 4 12 2-6h4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.600 5.600l2.100 2.100M16.300 16.300l2.100 2.100M5.600 18.400l2.100-2.100M16.300 7.700l2.100-2.100"/>',
  };
  const aico = (k) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${AIC[k]}</svg>`;
  const ATABS = ['overview', 'character', 'achievements', 'activity', 'settings'];
  let acctTab = 'overview';

  const themePreview = (k) => `<span class="tp tp-${k}" aria-hidden="true"><i></i><i></i><i></i></span>`;
  const themeGrid = () => `<div class="themes" role="radiogroup" aria-label="${t('theme.title')}">${['system', 'light', 'dark'].map((k) => `<button class="themeopt ${THEME.pref === k ? 'on' : ''}" role="radio" aria-checked="${THEME.pref === k}" data-theme-set="${k}">${themePreview(k)}<b>${t('theme.' + k)}</b></button>`).join('')}</div>`;
  const langGrid = () => `<div class="langs" role="radiogroup" aria-label="${t('lang.title')}">${I18N.LANGS.map(([c, n]) => `<button class="langopt ${I18N.lang === c ? 'on' : ''}" role="radio" aria-checked="${I18N.lang === c}" data-lang="${c}" lang="${c}"><b>${n}</b><small>${c.toUpperCase()}</small></button>`).join('')}</div>`;
  const switchRow = (k, title, desc) => `<div class="setrow"><span>${title}<small>${desc}</small></span><button class="sw ${S[k] ? 'on' : ''}" role="switch" aria-checked="${!!S[k]}" aria-label="${title}" data-set="${k}"></button></div>`;

  function acctBody() {
    const lvl = levelOf(S.xp);
    if (acctTab === 'character') return '<div class="panel" id="charEditor"></div>';
    if (acctTab === 'achievements') {
      const got = ACH.filter((a) => S.ach[a.id]).length;
      return `<div class="sect-h"><h3>${t('acct.achievements')}</h3><span class="meta">${t('ach.count', { a: got, b: ACH.length })}</span></div><div class="bar thin"><i style="width:${got / ACH.length * 100}%"></i></div>
        <div class="ach">${ACH.map((a) => `<div class="${S.ach[a.id] ? 'got' : 'lock'}"><b>${t('ach.' + a.id + '.t')}</b><span>${t('ach.' + a.id + '.d')}</span></div>`).join('')}</div>`;
    }
    if (acctTab === 'activity') {
      return `<div class="panel">${S.claims.length ? S.claims.slice().reverse().map((c) => `<div class="row"><span>${esc(c.title)}</span><span>${c.code ? `<code class="cp">${esc(c.code)}</code>` : esc(c.status)}</span></div>`).join('') : `<p class="sec">${t('acct.activity.empty')}</p>`}</div>`;
    }
    if (acctTab === 'settings') {
      return `<div class="set-grid">
        <div class="panel"><h3>${t('theme.title')}</h3><p class="sec">${t('theme.d')}</p>${themeGrid()}</div>
        <div class="panel"><h3>${t('lang.title')}</h3><p class="sec">${t('lang.d')}</p>${langGrid()}</div>
        <div class="panel"><h3>${t('set.play')}</h3>${switchRow('sound', t('set.sound'), t('set.sound.d'))}${switchRow('haptics', t('set.haptics'), t('set.haptics.d'))}
          <div class="setrow"><span>${t('set.diff')}<small>${t('set.diff.d')}</small></span></div>
          <div class="diff" role="group" aria-label="${t('set.diff')}">${DIFF_M.map((m, i) => `<button class="dch ${i === S.diff ? 'on' : ''}" data-dset="${i}" aria-pressed="${i === S.diff}"><b>${dn(i)}</b><span>${m}× XP</span></button>`).join('')}</div></div>
        <div class="panel"><h3>${t('set.more')}</h3><div class="stack"><button class="btn" id="shApp">${t('set.invite')}</button><button class="btn ghost" id="cookieBtn2">${t('foot.cookieset')}</button></div>
          <div class="danger-zone"><div><b>${t('set.reset')}</b><small>${t('set.reset.d')}</small></div><button class="btn ghost danger sm" id="resetBtn">${t('set.reset.b')}</button></div></div>
      </div>`;
    }
    const best = S.bestStreak, cur = effStreak(), nx = STREAK_MS.find(([d]) => d > cur);
    let wk = ''; for (let i = 6; i >= 0; i--) { const d0 = ago(i), ds = dayStr(d0); wk += `<div class="wd ${S.days.includes(ds) ? 'on' : ''} ${i === 0 ? 'now' : ''}"><i></i>${d0.toLocaleDateString(I18N.lang, { weekday: 'narrow' })}</div>`; }
    const ups = AVATAR.unlocks({ level: lvl, streak: best }).filter((u) => u.locked).sort((a, b) => a.left - b.left).filter((u, i, arr) => arr.findIndex((x) => x.name === u.name && x.kind === u.kind) === i).slice(0, 3);
    const streakCard = `<div class="panel streak-card ${cur ? 'hot' : ''}"><div class="sc-top">${FLAME}<div><b>${t('bonus.streak', { n: cur })}</b><span class="meta">${t('streak.best', { n: best })}</span></div></div>
      <div class="week" aria-hidden="true">${wk}</div>
      ${nx ? `<div class="bar thin"><i style="width:${Math.min(100, cur / nx[0] * 100)}%"></i></div><p class="meta">${t('streak.road', { d: nx[0], c: nx[1] })}</p>` : `<p class="meta">${t('streak.roadall')}</p>`}
      <div class="freeze"><span class="fz-i" aria-hidden="true">❄️</span><span><b>${t('streak.freeze')}</b><small>${t('streak.freeze.d')}</small></span>
        ${S.freezes >= FREEZE_MAX ? `<span class="meta">${t('streak.freeze.max')}</span>` : `<button class="btn sm" data-freeze="1" ${S.coins < FREEZE_COST ? 'disabled' : ''}>${t('streak.freeze.buy', { n: FREEZE_COST })}</button>`}</div>
      ${S.freezes ? `<p class="meta fz-have">${t('streak.freeze.have', { n: S.freezes })}</p>` : ''}</div>`;
    const nextCard = `<div class="panel"><div class="sect-h" style="margin:0 0 12px"><h3>${t('next.title')}</h3><button class="btn ghost sm" data-acct="character">${t('acct.style')}</button></div>
      ${ups.length ? ups.map((u) => `<div class="upx"><span class="up-k">${u.kind === 'pet' ? '🐾' : u.kind === 'frame' ? '◎' : u.kind === 'title' ? '✦' : '✨'}</span><b>${esc(u.name)}</b><span class="meta">${u.lvl ? t('next.lvl', { n: u.lvl }) : t('next.day', { n: u.streak })} · ${t('next.lvl.left', { n: u.left })}</span></div>`).join('') : `<p class="sec">${t('next.none')}</p>`}</div>`;
    const stats = [[lvl, 'stat.level'], [nf(S.xp), 'stat.xp'], [nf(S.coins), 'stat.coins'], [nf(S.played), 'stat.solved'], [effStreak(), 'stat.streak'], [S.ads, 'stat.bonuses']];
    return `<div class="ov-grid">${streakCard}${nextCard}</div><div class="stats">${stats.map(([v, l]) => `<div><b>${v}</b><span>${t(l)}</span></div>`).join('')}</div>
      <div class="sect-h"><h3>${t('acct.best')}</h3></div>
      <div class="bests">${GAMES.map((g) => `<div class="best" style="--c:${g.color}"><span class="gi">${g.icon}</span><span class="bn">${g.name}</span><b>${S.best[g.id] ? nf(S.best[g.id]) : '—'}</b></div>`).join('')}</div>`;
  }
  const heroAv = () => `${AVATAR.framed(S.avatar, 104, { live: true })}<span class="acct-edit" aria-hidden="true">${aico('character')}</span>`;
  function renderProfile() {
    const lvl = levelOf(S.xp), r = rankOf(lvl), a = thr(lvl), b = thr(lvl + 1), pct = (S.xp - a) / (b - a) * 100;
    $('#acct').innerHTML = `<div class="panel acct-hero" style="--rc:${r.col}">
        <button class="acct-av" data-acct="character" aria-label="${t('acct.edit')}">${heroAv()}</button>
        <div class="acct-id">
          <label class="meta" for="nameIn">${t('acct.name')}</label>
          <input id="nameIn" class="acct-name" maxlength="16" autocomplete="nickname" value="${esc(S.name)}">
          <div class="acct-sub"><span class="rank-pill">${r.name}</span><span class="title-pill">${t('ti.' + AVATAR.TITLES[S.avatar.title || 0].n)}</span><span class="meta">${t('u.level', { n: lvl })} · ${t('u.xp', { n: nf(S.xp) })}</span></div>
          <div class="bar"><i style="width:${pct}%"></i></div>
          <div class="bar-meta meta"><span>${t('hero.xp', { a: nf(S.xp - a), b: nf(b - a), n: lvl + 1 })}</span></div>
        </div>
      </div>
      <div class="acct-tabs" role="tablist" aria-label="${t('nav.account')}">${ATABS.map((k) => `<button role="tab" id="atab-${k}" class="${k === acctTab ? 'on' : ''}" aria-selected="${k === acctTab}" aria-controls="acct-body" data-acct="${k}">${aico(k)}<span>${t('acct.' + k)}</span></button>`).join('')}</div>
      <div class="acct-body" id="acct-body" role="tabpanel" aria-labelledby="atab-${acctTab}">${acctBody()}</div>`;
    if (acctTab === 'character') AVATAR.mountEditor($('#charEditor'), { av: S.avatar, level: lvl, streak: S.bestStreak, t, onChange: (av) => { S.avatar = av; save(); $('#avBtn').innerHTML = AVATAR.svg(av, 30); const h = $('.acct-av'); if (h) h.innerHTML = heroAv(); const tp = $('.title-pill'); if (tp) tp.textContent = t('ti.' + AVATAR.TITLES[av.title || 0].n); } });
    const sh = $('#shApp'); if (sh) sh.onclick = () => shareText(t('share.invite'));
    const rs = $('#resetBtn'); if (rs) rs.onclick = () => { if (confirm(t('set.reset.confirm'))) { S = fresh(); S.avatar = AVATAR.random(); ensure(); save(); go('play'); toast(t('set.reset.done')); } };
    const ck = $('#cookieBtn2'); if (ck) ck.onclick = consentBanner;
  }
  function acctGo(k) { if (!ATABS.includes(k)) return; acctTab = k; renderProfile(); const tb = $('#atab-' + k); tb && tb.scrollIntoView({ block: 'nearest', inline: 'center' }); }

  const renderers = { play: renderPlay, versus: () => VERSUS.renderView(), rewards: renderRewards, redeem: renderRedeem, ranks: renderRanks, profile: renderProfile };
  let view = 'play';
  function go(v) {
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion:reduce)').matches && v !== view) { const vt = document.startViewTransition(() => go2(v)); [vt.ready, vt.finished].forEach((p) => p.catch(() => {})); return; }
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
  const couponModal = (c) => { modal(`<p class="meta">${t('cp.added')}</p><h2>${esc(c.title)}</h2><p>${t('cp.worth', { v: `<b style="color:var(--ac)">${t('u.credits', { n: nf(c.value) })}</b>` })}</p><p><code class="cp">${esc(c.code)}</code></p><div class="acts"><button class="btn primary" data-view-go="redeem">${t('cp.choose')}</button><button class="btn ghost" data-close>${t('cp.later')}</button></div>`); };
  function claim(lvl) {
    const m = MILES.find((x) => x.lvl === +lvl); if (!m || S.claimed[m.lvl] || levelOf(S.xp) < m.lvl) return;
    const nm = mname(m);
    if (m.type === 'coins') { S.coins += m.amt; S.claimed[m.lvl] = 1; S.claims.push({ title: nm, status: t('st.wallet') }); confetti(60); sfx('win'); toast(t('toast.coins', { n: m.amt })); bump(); refresh(); }
    else if (m.type === 'coupon') { const c = addCoupon(nm, m.value); S.claimed[m.lvl] = 1; S.claims.push({ title: nm, status: t('st.coupons') }); confetti(80); sfx('win'); refresh(); couponModal(c); }
    else {
      modal(`<p class="meta">${t('cash.kicker')}</p><h2>${esc(nm)}</h2><p>${t('cash.d')}</p>
        <form id="cashF"><select id="cm" aria-label="${t('cash.method')}"><option value="PayPal">PayPal</option><option value="UPI">UPI</option><option value="Bank">${t('cash.bank')}</option></select><input id="ca" required maxlength="80" placeholder="${t('cash.ph')}" aria-label="${t('cash.aria')}"><button class="btn primary" type="submit">${t('cash.go')}</button></form>`);
      $('#cashF').onsubmit = (e) => { e.preventDefault(); if (!$('#ca').value.trim()) return;
        const sel = $('#cm'); S.claimed[m.lvl] = 1; S.claims.push({ title: t('claim.to', { n: nm, m: sel.options[sel.selectedIndex].text }), status: t('st.pending') }); confetti(80); sfx('win'); refresh(); closeModal(); toast(t('cash.toast')); };
    }
  }
  function buy(id) {
    const d = PACKS.find((x) => x.id === id); if (!d || S.coins < d.cost) return;
    S.coins -= d.cost; const c = addCoupon(t('mile.coupon', { n: nf(d.value) }), d.value); sfx('win'); bump(); refresh(); couponModal(c);
  }
  // redeem: pick coupon then reward. Leftover credit becomes coins.
  function redeemUI(couponId, rewardId) {
    const c = S.coupons.find((x) => x.id === couponId), r = CATALOG.find((x) => x.id === rewardId);
    if (c && !c.used && !r) {
      modal(`<p class="meta">${esc(c.title)} · ${t('u.credits', { n: nf(c.value) })}</p><h2>${t('rdm.choose')}</h2><p>${t('rdm.left')}</p><div class="pick">${CATALOG.map((x) => `<button data-do="${c.id}|${x.id}" ${x.cost > c.value ? 'disabled' : ''}><span>${rname(x)}<small>${rnote(x)}</small></span><b>${t('u.cr', { n: x.cost })}</b></button>`).join('')}</div><div class="acts"><button class="btn ghost" data-close>${t('cancel')}</button></div>`);
    } else if (r && !c) {
      const ok = unused().filter((x) => x.value >= r.cost);
      modal(`<p class="meta">${t('u.credits', { n: r.cost })}</p><h2>${rname(r)}</h2><p>${t('rdm.pay')}</p><div class="pick">${ok.map((x) => `<button data-do="${x.id}|${r.id}"><span>${esc(x.title)}<small>${esc(x.code)}</small></span><b>${t('u.cr', { n: nf(x.value) })}</b></button>`).join('') || `<p class="sec">${t('rdm.none')}</p>`}</div><div class="acts"><button class="btn ghost" data-close>${t('cancel')}</button></div>`);
    } else if (c && r) {
      if (c.used || c.value < r.cost) return;
      if (['cash', 'topup', 'gift'].includes(r.kind)) {
        const ph = t('rdm.ph.' + r.kind);
        modal(`<p class="meta">${t('u.credits', { n: r.cost })}</p><h2>${rname(r)}</h2><p>${t('rdm.review')}</p><form id="rdF"><input id="rdA" required maxlength="80" placeholder="${ph}" aria-label="${ph}"><button class="btn primary" type="submit">${t('rdm.confirm')}</button></form>`);
        $('#rdF').onsubmit = (e) => { e.preventDefault(); if (!$('#rdA').value.trim()) return; finishRedeem(c, r, t('st.pending')); };
      } else finishRedeem(c, r);
    }
  }
  function finishRedeem(c, r, status) {
    c.used = true; const left = c.value - r.cost; if (left > 0) S.coins += left;
    const code = r.kind === 'code' ? mkCode(r.brand) : '', nm = rname(r);
    S.claims.push({ title: nm, code, status: status || (r.kind === 'donate' ? t('st.donated') : t('st.done')) });
    sfx('win'); confetti(80); refresh(); bump();
    modal(`<p class="meta">${t('rdm.done')}</p><h2>${esc(nm)}</h2>${code ? `<p>${t('rdm.code')}</p><p><code class="cp">${code}</code></p>` : `<p>${status ? t('rdm.deliver') : t('rdm.thanks')}</p>`}${left > 0 ? `<p>${t('rdm.leftover', { n: left })}</p>` : ''}<div class="acts"><button class="btn primary" data-close>${t('done')}</button></div>`);
  }
  function promo(codeRaw) {
    const k = codeRaw.trim().toUpperCase(), P = PROMOS[k];
    if (!k) return; if (!P) return toast(t('promo.bad')); if (S.promos[k]) return toast(t('promo.used'));
    S.promos[k] = 1;
    if (P.coins) { S.coins += P.coins; toast(t('toast.coins', { n: P.coins })); bump(); }
    if (P.coupon) { const c = addCoupon(t('cp.welcome'), P.coupon); refresh(); couponModal(c); }
    sfx('win'); refresh();
  }
  function bonus() {
    if (S.bonusDay === dayStr()) return; const amt = 10 + 5 * Math.min(effStreak(), 6);
    S.bonusDay = dayStr(); S.coins += amt; sfx('win'); toast(t('toast.coins', { n: amt })); bump(); refresh();
  }
  function buyFreeze() {
    if (S.freezes >= FREEZE_MAX) return toast(t('streak.freeze.max')); if (S.coins < FREEZE_COST) return toast(t('game.nocoins'));
    S.coins -= FREEZE_COST; S.freezes++; sfx('win'); toast(t('streak.bought')); bump(); refresh();
  }
  function qclaim(id) {
    const q = QUESTS.find((x) => x.id === id); if (!q || S.q.claimed[id] || S.q[q.key] < q.goal) return;
    S.q.claimed[id] = 1; S.qdone++; S.coins += q.coins; sfx('win'); toast(t('toast.coins', { n: q.coins })); bump(); refresh();
  }

  /* ================= GAME HELPERS ================= */
  function comboHide() { const c = $('#combo'); if (c) c.hidden = true; }
  function comboShow(n) {
    const c = $('#combo'); if (!c) return; if (n < 2) { c.hidden = true; return; }
    c.hidden = false; c.firstElementChild.textContent = t('combo', { n });
    const shout = { 5: 'combo.5', 10: 'combo.10', 15: 'combo.15', 20: 'combo.20' }[n];
    if (shout) { const st = $('#stage'); fxApi.pop(st, t(shout), `hsl(${(60 + n * 28) % 360} 85% 62%)`); fxApi.burst(st, '#ffb454', 40); sfx('win'); } c.lastElementChild.firstElementChild.style.width = Math.min(100, n * 10) + '%';
    c.style.setProperty('--h', (60 + n * 28) % 360); c.classList.remove('hit'); void c.offsetWidth; c.classList.add('hit');
  }
  function flash(color) { const d = document.createElement('div'); d.className = 'flash'; d.style.background = color; $('.game-shell').append(d); setTimeout(() => d.remove(), 500); }
  function spend(n) { if (S.coins < n) { toast(t('game.nocoins')); sfx('bad'); return false; } S.coins -= n; $('#chipCoins').textContent = nf(S.coins); save(); return true; }
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
      modal(`<p class="meta">${t('tag.' + g.tag)} · ${fmtTime(g.time)}</p><h2>${g.name}</h2><p>${g.how}</p>
        <div class="diff" role="group" aria-label="${t('set.diff')}">${DIFF_M.map((m, i) => `<button class="dch ${i === S.diff ? 'on' : ''}" data-diff="${i}" aria-pressed="${i === S.diff}"><b>${dn(i)}</b><span>${m}× XP</span></button>`).join('')}</div>
        <p class="meta">${S.best[g.id] ? t('pre.best', { n: nf(S.best[g.id]) }) : t('pre.nobest')}</p>
        <div class="acts"><button class="btn primary" id="howGo">${t('pre.start')}</button><button class="btn ghost" data-close>${t('pre.notnow')}</button></div>`);
      $('#howGo').onclick = () => { closeModal(); startGame(id, { skipPre: true }); }; return;
    }
    runDiff = curDuel ? curDuel.diff : S.diff;
    stopGame(); $('#gameTitle').textContent = g.name; $('#gameHud').innerHTML = ''; $('#stage').innerHTML = '';
    $('#gameOv').hidden = false; document.body.style.overflow = 'hidden'; S.last = g.id; $('.game-shell').style.setProperty('--c', g.color); $('#gameOv').style.setProperty('--c', g.color); $('#powers').innerHTML = ''; comboHide(); bsVal = 0; $('#bigScore').hidden = true; $('#bigScore b').textContent = '0'; $('#bigScore small').textContent = S.best[g.id] ? t('card.best', { n: nf(S.best[g.id]) }) : t('hud.score');
    const stage = $('#stage'), cd = document.createElement('div'); cd.className = 'cd'; cd.setAttribute('aria-live', 'assertive'); stage.append(cd);
    let n = 3, tm; cleanup = () => clearTimeout(tm);
    const step = () => {
      if (n > 0) { cd.textContent = n--; cd.classList.remove('pulse'); void cd.offsetWidth; cd.classList.add('pulse'); sfx('tap'); tm = setTimeout(step, 520); return; }
      stage.innerHTML = '';
      cleanup = g.mount(stage, {
        sfx, ...fxApi, diff: runDiff, seed: curDuel ? curDuel.seed : undefined, combo: comboShow, flash, spend, power: addPower,
        hud: (items) => { if (curDuel && curDuel.onHud) curDuel.onHud(items); items = bigScore(items); $('#gameHud').innerHTML = items.filter(Boolean).map((i) => typeof i === 'string' ? `<span class="hud">${esc(i)}</span>` : `<span class="hud ${i.low ? 'low' : ''}">${esc(i.t)}</span>`).join(''); },
        end: (r) => finish(g, r),
      });
    };
    step();
  }
  /* pulls the "Score N" HUD chip out into a big animated live counter with +N pops */
  let bsVal = 0, bsRaf;
  function bigScore(items) {
    const box = $('#bigScore'), lab = t('hud.score'); let hit = null;
    const rest = items.filter((i) => { const m = typeof i === 'string' && i.startsWith(lab + ' ') && /^[\d,.]+$/.test(i.slice(lab.length + 1)) ? +i.slice(lab.length + 1).replace(/[,.]/g, '') : null; if (m !== null && hit === null) { hit = m; return false; } return true; });
    if (hit === null) { if (bsVal === 0) box.hidden = true; return items; }
    box.hidden = false; const el = box.querySelector('b'), d = hit - bsVal;
    if (d > 0 && (d >= 20 || performance.now() - (bigScore.lp || 0) > 350)) { bigScore.lp = performance.now(); const f = document.createElement('i'); f.textContent = '+' + nf(d); box.append(f); setTimeout(() => f.remove(), 900); box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump'); }
    const from = bsVal, t0 = performance.now(); bsVal = hit; cancelAnimationFrame(bsRaf);
    const tick = (n) => { const k = Math.min(1, (n - t0) / 300); el.textContent = nf(Math.round(from + (hit - from) * k)); if (k < 1) bsRaf = requestAnimationFrame(tick); }; bsRaf = requestAnimationFrame(tick);
    return rest;
  }
  function stopGame() { if (cleanup) { try { cleanup(); } catch {} cleanup = null; } }
  function closeGame() { stopGame(); $('#gameOv').hidden = true; document.body.style.overflow = ''; }
  $('#gameClose').onclick = () => { if (curDuel) { const d = curDuel; curDuel = null; closeGame(); d.onEnd({ win: false, score: 0, dnf: true, label: t('game.quit.label') }); return; } closeGame(); refresh(); };

  function finish(g, r) {
    if (curDuel) { const d = curDuel; curDuel = null; stopGame(); flash(r.win ? g.color : '#ff6b5e'); setTimeout(() => closeGame(), 350); d.onEnd(r); return; }
    stopGame(); ensure(); flash(r.win ? g.color : '#ff6b5e');
    const today = dayStr(), isDaily = g.id === dailyGame().id && S.dailyDone !== today && r.win;
    const ctxBefore = { level: levelOf(S.xp), streak: S.bestStreak };
    if (S.lastDay !== today) { S.streak = S.lastDay === dayStr(ago(1)) ? S.streak + 1 : 1; S.lastDay = today; }
    S.bestStreak = Math.max(S.bestStreak, S.streak);
    let smGot = 0; STREAK_MS.forEach(([d, c]) => { if (S.streak >= d && !S.sm[d]) { S.sm[d] = 1; S.coins += c; smGot += c; } });
    if (!S.days.includes(today)) S.days = S.days.concat(today).slice(-60);
    const mul = 1 + 0.05 * Math.min(S.streak - 1, 10);
    const stars0 = r.win ? (r.quality > .75 ? 3 : r.quality > .4 ? 2 : 1) : 0;
    let xp = r.win ? 40 + r.quality * 80 + (stars0 === 3 ? 25 : 0) : 10 + r.quality * 20;
    const dm = DIFF_M[runDiff], bst = S.boost && r.win; if (bst) S.boost = false;
    xp = Math.round(xp * mul * dm * (bst ? 2 : 1) * (isDaily ? 2 : 1)); const coins = Math.max(2, Math.round(xp / 3));
    if (isDaily) S.dailyDone = today;
    const before = levelOf(S.xp);
    const apply = (x, c) => { S.xp += x; S.coins += c; S.week.xp += x; S.q.xp += x; };
    apply(xp, coins); S.q.plays++; if (r.win) { S.played++; S.q.wins++; }
    const newBest = r.win && (!S.best[g.id] || r.score > S.best[g.id]); if (!S.best[g.id] || r.score > S.best[g.id]) S.best[g.id] = r.score;
    const nStars = stars0; if (nStars === 3) S.stars3++;
    checkAch(); save();
    const ctxAfter = () => ({ level: levelOf(S.xp), streak: S.bestStreak }), cosmNew = () => {
      const was = AVATAR.unlocks(ctxBefore), names = new Set(); AVATAR.unlocks(ctxAfter()).forEach((u, i) => { if (!u.locked && was[i] && was[i].locked) names.add(u.name); });
      return [...names].slice(0, 3).join(', ');
    };
    let boosted = false, luShown = false;
    const show = () => {
      const after = levelOf(S.xp), up = after > before, rk = rankOf(after), b = thr(after + 1), mult = boosted ? 2 : 1;
      const newly = MILES.filter((m) => m.lvl > before && m.lvl <= after && !S.claimed[m.lvl]);
      $('#gameOv').hidden = true;
      if (up && !luShown) { luShown = true; sfx('win'); confetti(220); const mm = modal(`<div class="lu-badge">${after}</div><p class="meta">${t('lu.kicker')}</p><h2>${rk.name}</h2><p>${newly.length ? t('lu.unlocked', { name: esc(mname(newly[0])) }) : t('lu.keep')}</p>${cosmNew() ? `<p class="cosm">✨ ${t('lu.cosm', { name: esc(cosmNew()) })}</p>` : ''}<div class="acts"><button class="btn primary" id="luGo">${t('continue')}</button></div>`); mm.classList.add('c'); mm.dataset.lock = '1'; $('#luGo').onclick = () => { delete mm.dataset.lock; mm.classList.remove('c'); closeModal(); show(); }; return; }
      if (r.win && !up) { sfx('win'); confetti(90, undefined, undefined, [g.color, ...confCols()]); }
      const toGo = b - S.xp;
      const cosm = cosmNew();
      const m = modal(`<p class="meta">${r.win ? t('res.solved') : t('res.over')}${r.label ? ' · ' + esc(r.label) : ''}${newBest ? `<span class="tag-best">${t('res.newbest')}</span>` : ''}</p>
        ${r.win ? `<div class="stars" aria-label="${t('res.stars', { n: nStars })}">${[1, 2, 3].map((i) => `<svg viewBox="0 0 24 24" class="${i <= nStars ? 'on' : ''}" fill="currentColor"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.5 5.7 21l1.5-7L2 9.300l7-.8z"/></svg>`).join('')}</div>` : ''}
        <div class="res-xp" id="rx">0</div><p style="margin-top:0">${t('res.xp')}${isDaily ? ' ' + t('res.daily') : ''}</p>
        <div class="res-rows"><div><span>${t('res.diff')}</span><b>${dn(runDiff)} ×${dm}${bst ? ' · ' + t('res.boost') : ''}</b></div>${nStars === 3 ? `<div><span>${t('res.perfect')}</span><b>+25 XP</b></div>` : ''}<div><span>${t('res.coins')}</span><b>+${coins * mult}</b></div><div><span>${t('res.streak')}</span><b>${t('bonus.streak', { n: S.streak })}${mul > 1 ? ' (+' + Math.round((mul - 1) * 100) + '% XP)' : ''}</b></div><div><span>${t('res.next')}</span><b>${t('u.xp', { n: nf(toGo) })}</b></div></div>
        ${up || smGot || cosm || newly.length ? `<div class="lvups">${up ? `<p>${t('res.lvl', { n: after, name: rk.name })}</p>` : ''}${smGot ? `<p>${FLAME} ${t('streak.ms', { n: nf(smGot) })}</p>` : ''}${cosm ? `<p>✨ ${t('lu.cosm', { name: esc(cosm) })}</p>` : ''}${newly.length ? `<p>🎁 ${t('lu.unlocked', { name: esc(mname(newly[0])) })}</p>` : ''}</div>` : ''}
        <div class="acts"><button class="btn primary" id="again">${t('res.again')}</button>
        ${boosted ? '' : `<button class="btn" id="dbl">${t('res.double')}</button>`}
        <button class="btn ghost" id="shr">${t('res.share')}</button>
        <button class="btn ghost" id="home">${newly.length ? t('res.claim') : t('res.back')}</button></div>`);
      m.dataset.lock = '1'; countUp($('#rx'), xp * mult);
      const dbl = $('#dbl'); if (dbl) dbl.onclick = () => { delete m.dataset.lock; closeModal(); showAd({ rewarded: true }, (ok) => { if (ok) { apply(xp, coins); boosted = true; save(); bump(); } show(); }); };
      $('#shr').onclick = () => shareText(t(r.win ? 'share.solved' : 'share.played', { game: g.name, n: nf(xp * mult) }));
      $('#again').onclick = () => { closeModal(); sinceAd++; maybeInterstitial(() => startGame(g.id, { skipPre: true })); };
      $('#home').onclick = () => { closeModal(); closeGame(); sinceAd++; maybeInterstitial(() => go(newly.length ? 'rewards' : 'play')); };
      renderTop(); bump();
    };
    show();
  }
  function maybeInterstitial(next) { if (sinceAd >= CONFIG.interstitialEvery) { sinceAd = 0; showAd({ rewarded: false, secs: 3 }, () => next()); } else next(); }

  async function shareText(text) {
    const url = location.origin + location.pathname;
    try { if (navigator.share) { await navigator.share({ title: 'Pixaquest', text, url }); return; } await navigator.clipboard.writeText(text + ' ' + url); toast(t('toast.copied')); } catch {}
  }
  function langModal() {
    const m = modal(`<h2>${t('lang.title')}</h2><p>${t('lang.d')}</p>${langGrid()}<div class="acts"><button class="btn primary" data-close>${t('done')}</button></div>`);
    m.classList.add('wide');
  }
  function onboarding(done) {
    const m = modal(`<div class="welcome"><img class="wlogo" src="assets/logo-full.png" alt="Pixaquest" width="132" height="132"><div class="obav" id="obAv">${AVATAR.svg(S.avatar, 84)}</div><button class="btn ghost sm" id="obShuf" style="margin:0 auto 8px;display:flex">${t('ob.shuffle')}</button><p class="meta">${t('ob.welcome')}</p><h2>${t('ob.title')}</h2>
      <ul><li><b>1</b>${t('ob.1')}</li><li><b>2</b>${t('ob.2')}</li><li><b>3</b>${t('ob.3')}</li></ul>
      <label class="sec" for="obName">${t('ob.name')}</label><input id="obName" maxlength="16" value="${S.name === 'Player' ? '' : esc(S.name)}" placeholder="Player" autocomplete="nickname">
      <div class="acts"><button class="btn primary" id="obGo">${t('ob.go')}</button></div></div>`, { onClose: () => { if (!S.onboarded) { S.onboarded = true; save(); } done(); } });
    m.dataset.lock = '1';
    $('#obShuf').onclick = () => { S.avatar = AVATAR.random(); $('#obAv').innerHTML = AVATAR.svg(S.avatar, 84); save(); renderTop(); };
    $('#obGo').onclick = () => { S.name = ($('#obName').value.trim() || 'Player').slice(0, 16); if (!S.onboarded) { S.onboarded = true; S.coins += 25; save(); } delete m.dataset.lock; closeModal(); refresh(); bump(); };
  }

  function spinUI() {
    if (S.spinDay === dayStr()) return toast(t('spin.tomorrow'));
    const wl = (w) => w.t || t(w.k);
    const seg = 360 / WHEEL.length, grad = WHEEL.map((w, i) => `${w.col} ${i * seg}deg ${(i + 1) * seg}deg`).join(',');
    const m = modal(`<p class="meta">${t('spin.kicker')}</p><h2>${t('spin.title')}</h2><div class="wheel-wrap"><div class="pointer"></div><div class="wheel" id="wheel" style="background:conic-gradient(${grad})">${WHEEL.map((w, i) => `<span style="--a:${i * seg + seg / 2}deg">${wl(w)}</span>`).join('')}</div></div>
      <div class="acts"><button class="btn primary" id="spinGo">${t('spin.go')}</button><button class="btn ghost" data-close id="spinX">${t('close')}</button></div>`);
    m.classList.add('c');
    $('#spinGo').onclick = () => {
      $('#spinGo').disabled = true; $('#spinX').disabled = true; m.dataset.lock = '1'; S.spinDay = dayStr(); save();
      let r = Math.random() * WHEEL.reduce((a, w) => a + w.w, 0), idx = 0; for (; idx < WHEEL.length - 1; idx++) { r -= WHEEL[idx].w; if (r <= 0) break; }
      const still = matchMedia('(prefers-reduced-motion:reduce)').matches, deg = 360 * 6 - (idx * seg + seg / 2), wh = $('#wheel');
      wh.style.transition = still ? 'none' : 'transform 4.2s cubic-bezier(.12,.65,.1,1)'; wh.style.transform = `rotate(${deg}deg)`;
      let k = 0; const tk = setInterval(() => { sfx('tap'); if (++k > 22) clearInterval(tk); }, 150);
      setTimeout(() => {
        clearInterval(tk); const w = WHEEL[idx]; delete m.dataset.lock; $('#spinX').disabled = false; sfx('win'); confetti(90);
        if (w.c) { S.coins += w.c; bump(); } if (w.cp) addCoupon(t('cp.lucky'), w.cp); if (w.boost) S.boost = true;
        $('#spinGo').textContent = w.c ? t('spin.coins', { n: w.c }) : w.cp ? t('spin.coupon', { n: w.cp }) : t('spin.boost');
        refresh();
      }, still ? 50 : 4400);
    };
  }

  /* ================= CONSENT ================= */
  const CK = 'pixaquest.consent';
  const getConsent = () => { try { return localStorage.getItem(CK); } catch { return null; } };
  function consentBanner() {
    if (document.querySelector('.consent')) return;
    const d = document.createElement('div'); d.className = 'consent'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', t('consent.aria'));
    d.innerHTML = `<span>${t('consent.text', { link: `<a href="privacy.html#cookies" style="color:var(--ac)">${t('consent.link')}</a>` })}</span><div class="acts"><button class="btn primary sm" data-consent="yes">${t('consent.yes')}</button><button class="btn sm" data-consent="no">${t('consent.no')}</button></div>`;
    document.body.append(d);
  }
  function setConsent(v) { try { localStorage.setItem(CK, v); } catch {} const b = document.querySelector('.consent'); b && b.remove(); toast(v === 'yes' ? t('consent.saved') : t('consent.np')); }

  /* ================= EVENTS ================= */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
    if (d.view) go(d.view);
    else if (d.viewGo) { closeModal(); go(d.viewGo); }
    else if (d.acct) acctGo(d.acct);
    else if (d.themeSet) THEME.set(d.themeSet);
    else if (d.lang) { I18N.set(d.lang, true).then(() => { if (!$('#modalOv').hidden && $('#modal').classList.contains('wide')) langModal(); }); }
    else if (d.dset !== undefined) { S.diff = +d.dset; save(); renderProfile(); }
    else if (d.filter) { filter = d.filter; renderPlay(); }
    else if (d.usec) redeemUI(d.usec);
    else if (d.reward) redeemUI(null, d.reward);
    else if (d.do) { const [ci, ri] = d.do.split('|'); redeemUI(ci, ri); }
    else if (d.consent) setConsent(d.consent);
    else if (d.set) { S[d.set] = !S[d.set]; b.classList.toggle('on', S[d.set]); b.setAttribute('aria-checked', !!S[d.set]); save(); if (S[d.set]) sfx('tap'); }
    else if (d.play) startGame(d.play);
    else if (d.claim) claim(d.claim);
    else if (d.buy) buy(d.buy);
    else if (d.bonus) bonus();
    else if (d.spin) spinUI();
    else if (d.diff !== undefined) { S.diff = +d.diff; save(); $$('.dch', $('#modal')).forEach((x) => { const on = +x.dataset.diff === S.diff; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); }); }
    else if (d.qclaim) qclaim(d.qclaim);
    else if (d.freeze) buyFreeze();
    else if (d.close !== undefined) closeModal();
  });
  // arrow keys move between account tabs (WAI-ARIA tabs pattern)
  document.addEventListener('keydown', (e) => {
    const tb = e.target.closest && e.target.closest('.acct-tabs button'); if (!tb || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const i = ATABS.indexOf(tb.dataset.acct), rtl = document.documentElement.dir === 'rtl', step = (e.key === 'ArrowRight') !== rtl ? 1 : -1;
    const n = e.key === 'Home' ? 0 : e.key === 'End' ? ATABS.length - 1 : (i + step + ATABS.length) % ATABS.length;
    e.preventDefault(); acctGo(ATABS[n]); const nb = $('#atab-' + ATABS[n]); nb && nb.focus();
  });
  $('#ctaPlay').addEventListener('click', () => { const id = $('#ctaPlay').dataset.play; if (id) startGame(id); });
  document.addEventListener('input', (e) => { if (e.target.id === 'gSearch') renderPlay(); if (e.target.id === 'nameIn') { S.name = e.target.value.trim().slice(0, 16) || 'Player'; save(); } });
  $('#promoF').addEventListener('submit', (e) => { e.preventDefault(); promo($('#promoIn').value); $('#promoIn').value = ''; });
  $('#cookieBtn').onclick = consentBanner;
  $('#themeBtn').onclick = () => THEME.toggle();
  $('#langBtn').onclick = langModal;
  addEventListener('hashchange', () => { const v = location.hash.slice(1); if (v in renderers && v !== view) go(v); });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && location.hostname !== 'localhost') navigator.serviceWorker.register('sw.js').catch(() => {});

  const PXQ = {
    get S() { return S; }, GAMES, save, modal, closeModal, toast, confetti, sfx, startGame, closeGame, go,
    grant({ xp = 0, coins = 0 }) { const b = levelOf(S.xp); S.xp += xp; S.coins += coins; S.week.xp += xp; checkAch(); save(); renderTop(); bump(); const a = levelOf(S.xp); if (a > b) toast(t('toast.level', { n: a })); },
    refreshView() { renderers[view] && renderers[view](); },
  };
  VERSUS.init(PXQ);
  $('#avBtn').onclick = () => { acctTab = 'character'; go('profile'); };

  /* ================= BOOT ================= */
  const askConsent = () => { setTimeout(() => VERSUS.boot(), 350); if (getConsent() === null) setTimeout(consentBanner, 800); };
  const retext = () => {
    I18N.apply(); $('#yr').textContent = new Date().getFullYear();
    $('#themeBtn').title = t('theme.toggle');
    const open = document.querySelector('.consent'); if (open) { open.remove(); consentBanner(); }
    renderers[view](); renderTop();
  };
  THEME.onchange = () => { if (view === 'profile') renderProfile(); };
  I18N.ready.then(() => {
    I18N.onchange = retext;
    I18N.apply(); initAds();
    if (!S.onboarded) setTimeout(() => onboarding(askConsent), 400); else askConsent();
    if (S.onboarded && S.visit && dayDiff(S.visit, dayStr()) >= 3) { S.coins += 25; notes.push(t('back.toast', { n: 25 })); }
    S.visit = dayStr(); save(); notes.forEach((m, i) => setTimeout(() => toast(m), 1200 + i * 600)); notes.length = 0;
    $('#yr').textContent = new Date().getFullYear();
    go(location.hash.slice(1) in renderers ? location.hash.slice(1) : 'play');
  });
})();
