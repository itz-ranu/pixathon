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
  const RANKS = [[1, 'Rookie'], [3, 'Thinker'], [5, 'Sharp Mind'], [8, 'Strategist'], [12, 'Brainiac'], [18, 'Genius'], [25, 'Mastermind'], [35, 'Grandmaster'], [50, 'Legend']];
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
  const fresh = () => ({ name: 'Player', xp: 0, coins: 0, played: 0, streak: 0, lastDay: '', days: [], best: {}, claimed: {}, claims: [], dailyDone: '', bonusDay: '', last: '', coupons: [], seen: {}, promos: {}, q: { day: '', plays: 0, wins: 0, xp: 0, claimed: {} }, week: { id: '', xp: 0 }, sound: true, ads: 0 });
  let S;
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || localStorage.getItem(OLD_KEY) || '{}')); } catch { S = fresh(); }
  S.claims = S.claims.filter((c) => { if (c.code) { S.coupons.push({ id: 'm' + Math.random().toString(36).slice(2, 8), title: c.title, code: c.code, value: 200, used: false }); return false; } return true; });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };

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
  const vib = (n) => { try { navigator.vibrate && navigator.vibrate(n); } catch {} };
  function sfx(kind, i = 0) {
    if (kind === 'good') vib(15); else if (kind === 'bad') vib([30, 40, 30]);
    if (!S.sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain(); o.connect(g); g.connect(ac.destination);
      const f = { tap: 420, good: 660, bad: 160, note: [330, 440, 550, 660][i], win: 880 }[kind] || 400;
      o.type = kind === 'bad' ? 'sawtooth' : 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.06, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + (kind === 'note' ? 0.35 : 0.18));
      o.start(); o.stop(ac.currentTime + 0.4);
    } catch {}
  }
  const cv = $('#fx'), cx = cv.getContext('2d'); let parts = [], raf = 0;
  function confetti(n = 100) {
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    cv.width = innerWidth; cv.height = innerHeight;
    const cols = ['#d6ff3d', '#f1efe9', '#5aa9ff', '#ff7aa8'];
    for (let i = 0; i < n; i++) parts.push({ x: innerWidth / 2, y: innerHeight / 3, vx: (Math.random() - .5) * 16, vy: Math.random() * -14 - 3, s: 5 + Math.random() * 5, c: cols[i % 4], r: Math.random() * 6, life: 90 + Math.random() * 40 });
    if (!raf) raf = requestAnimationFrame(tick);
    clearTimeout(confetti.t); confetti.t = setTimeout(() => { parts = []; raf = 0; cv.width = 1; }, 3500);
  }
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
    const m = $('#modal'); delete m.dataset.lock; m.innerHTML = html; $('#modalOv').hidden = false;
    m._close = onClose; setTimeout(() => { const f = m.querySelector('.btn.primary,button,input'); f && f.focus(); }, 40); return m;
  }
  function closeModal() { const m = $('#modal'); $('#modalOv').hidden = true; const c = m._close; m._close = null; c && c(); }
  $('#modalOv').addEventListener('click', (e) => { if (e.target.id === 'modalOv' && !$('#modal').dataset.lock) closeModal(); });
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
    $('#chipCoins').textContent = S.coins; $('#chipLvl').textContent = lvl;
    $('#lvlBadge').textContent = lvl; $('#heroRank').textContent = `${r[1]} · Level ${lvl}`;
    $('#xpFill').style.width = ((S.xp - a) / (b - a) * 100) + '%';
    $('#xpText').textContent = `${S.xp - a} / ${b - a} XP to level ${lvl + 1}`;
    const nm = nextMile(); $('#nextMile').textContent = nm ? `Next reward: ${nm.name} at level ${nm.lvl}` : 'All rewards claimed';
    $('#heroLine').textContent = S.played === 0 ? 'Solve your first puzzle' : `${b - S.xp} XP to level ${lvl + 1}`;
    const d = dailyGame(), done = S.dailyDone === dayStr(), last = GAMES.find((g) => g.id === S.last);
    const cta = $('#ctaPlay'); const target = done ? (last || d) : d; cta.dataset.play = target.id;
    cta.textContent = done ? `Play ${target.name} again` : `Play daily: ${d.name}`;
    $('#ctaNote').textContent = done ? 'Daily bonus done. Keep climbing.' : 'Win it for double XP and coins.';
  }
  let filter = 'All';
  function renderPlay() {
    const d = dailyGame(), done = S.dailyDone === dayStr();
    const tags = ['All', ...new Set(GAMES.map((g) => g.tag))];
    $('#filters').innerHTML = tags.map((t) => `<button class="${t === filter ? 'on' : ''}" data-filter="${t}" aria-pressed="${t === filter}">${t}</button>`).join('');
    $('#gameGrid').innerHTML = GAMES.filter((g) => filter === 'All' || g.tag === filter).map((g) => `<button class="gcard" style="--c:${g.color}" data-play="${g.id}">
      <span class="gi">${g.icon}</span><span><h3>${g.name}</h3><p>${g.desc}</p></span>
      <span class="gfoot meta"><span>${g.tag} · ${g.time}</span>${g.id === d.id && !done ? '<span class="daily-t">Daily · 2×</span>' : `<span>${S.best[g.id] ? 'Best ' + S.best[g.id] : 'New'}</span>`}</span></button>`).join('');
    // bonus + streak
    const st = effStreak(), claimed = S.bonusDay === dayStr(), amt = 10 + 5 * Math.min(st, 6);
    let wk = ''; for (let i = 6; i >= 0; i--) { const d0 = ago(i), ds = dayStr(d0); wk += `<div class="wd ${S.days.includes(ds) ? 'on' : ''} ${i === 0 ? 'today' : ''}"><i></i>${'SMTWTFS'[d0.getDay()]}</div>`; }
    const risk = S.lastDay === dayStr(ago(1)) && st > 0;
    $('#bonus').innerHTML = `<h3>${st ? st + '-day streak' : 'Start a streak'}<span>${risk ? 'Play today to keep it' : 'Daily bonus'}</span></h3><div class="week" aria-hidden="true">${wk}</div>
      ${claimed ? '<button class="btn block" disabled>Bonus claimed. Back tomorrow</button>' : `<button class="btn primary block" data-bonus="1">Claim ${amt} coins</button>`}`;
    // quests
    $('#quests').innerHTML = `<h3>Today's quests<span>Resets at midnight</span></h3>` + QUESTS.map((q) => {
      const v = Math.min(S.q[q.key], q.goal), full = v >= q.goal, got = S.q.claimed[q.id];
      return `<div class="quest"><div class="q-top"><b>${q.t}</b>${got ? '<span class="meta">Done</span>' : full ? `<button class="btn primary sm" data-qclaim="${q.id}">Claim ${q.coins}</button>` : `<span class="q-r">${ICON.coin}${q.coins}</span>`}</div>
        <div class="bar thin"><i style="width:${v / q.goal * 100}%"></i></div></div>`;
    }).join('');
  }
  function renderRewards() {
    const lvl = levelOf(S.xp);
    $('#miles').innerHTML = MILES.map((m) => {
      const claimed = S.claimed[m.lvl], can = !claimed && lvl >= m.lvl;
      return `<div class="mile ${m.type} ${can ? 'claimable' : ''} ${!claimed && !can ? 'locked' : ''}"><div class="mi">${MILE_ICON[m.type]}</div>
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
    const rows = BOTS.map((n) => ({ n, xp: Math.round(120 + rnd() * 1800) })); rows.push({ n: S.name, xp: S.week.xp, me: true });
    rows.sort((a, b) => b.xp - a.xp);
    $('#board').innerHTML = rows.slice(0, 12).concat(rows.slice(12).filter((r) => r.me)).map((r) => `<li class="${r.me ? 'me' : ''}"><span class="pos">${rows.indexOf(r) + 1}</span><span class="nm">${esc(r.n)}${r.me ? ' (you)' : ''}</span><span class="xp">${r.xp.toLocaleString()} XP</span></li>`).join('');
    const cur = rankOf(levelOf(S.xp));
    $('#ladder').innerHTML = RANKS.map((r) => `<div class="rung ${r === cur ? 'cur' : r[0] < cur[0] ? 'past' : ''}"><b>${r[1]}</b><span class="meta">Level ${r[0]}+</span></div>`).join('');
  }
  function renderProfile() {
    $('#nameIn').value = S.name;
    $('#profStats').innerHTML = [[levelOf(S.xp), 'Level'], [S.xp, 'Total XP'], [S.coins, 'Coins'], [S.played, 'Puzzles solved'], [effStreak(), 'Day streak'], [S.ads, 'Bonuses claimed']].map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('');
    $('#claims').innerHTML = S.claims.length ? S.claims.slice().reverse().map((c) => `<div class="row"><span>${esc(c.title)}</span><span>${c.code ? `<code class="cp">${esc(c.code)}</code>` : esc(c.status)}</span></div>`).join('') : '<p class="sec">Nothing yet. Claimed rewards and redemptions show up here.</p>';
    $('#bests').innerHTML = GAMES.map((g) => `<div class="row"><span>${g.name}</span><b>${S.best[g.id] || '—'}</b></div>`).join('');
  }
  const renderers = { play: renderPlay, rewards: renderRewards, redeem: renderRedeem, ranks: renderRanks, profile: renderProfile };
  let view = 'play';
  function go(v) {
    ensure(); view = renderers[v] ? v : 'play'; $$('.view').forEach((e) => e.classList.toggle('on', e.id === 'view-' + view));
    $$('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.view === view));
    renderers[view](); renderTop(); history.replaceState(null, '', '#' + view); scrollTo({ top: 0 });
  }
  const refresh = () => { ensure(); renderers[view](); renderTop(); save(); };

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
    S.q.claimed[id] = 1; S.coins += q.coins; sfx('win'); toast(`+${q.coins} coins`); bump(); refresh();
  }

  /* ================= GAME FLOW ================= */
  let cleanup = null, sinceAd = 0;
  function startGame(id, skipHow) {
    const g = GAMES.find((x) => x.id === id); if (!g) return;
    if (!S.seen[g.id] && !skipHow) {
      S.seen[g.id] = 1; save();
      modal(`<p class="meta">${g.tag} · ${g.time}</p><h2>${g.name}</h2><p>${g.how}</p><div class="acts"><button class="btn primary" id="howGo">Start</button><button class="btn ghost" data-close>Not now</button></div>`);
      $('#howGo').onclick = () => { closeModal(); startGame(id, true); }; return;
    }
    stopGame(); $('#gameTitle').textContent = g.name; $('#gameHud').innerHTML = ''; $('#stage').innerHTML = '';
    $('#gameOv').hidden = false; document.body.style.overflow = 'hidden'; S.last = g.id;
    cleanup = g.mount($('#stage'), {
      sfx,
      hud: (items) => { $('#gameHud').innerHTML = items.filter(Boolean).map((i) => typeof i === 'string' ? `<span class="hud">${esc(i)}</span>` : `<span class="hud ${i.low ? 'low' : ''}">${esc(i.t)}</span>`).join(''); },
      end: (r) => finish(g, r),
    });
  }
  function stopGame() { if (cleanup) { try { cleanup(); } catch {} cleanup = null; } }
  function closeGame() { stopGame(); $('#gameOv').hidden = true; document.body.style.overflow = ''; }
  $('#gameClose').onclick = () => { closeGame(); refresh(); };

  function finish(g, r) {
    stopGame(); ensure();
    const today = dayStr(), isDaily = g.id === dailyGame().id && S.dailyDone !== today && r.win;
    if (S.lastDay !== today) { S.streak = S.lastDay === dayStr(ago(1)) ? S.streak + 1 : 1; S.lastDay = today; }
    if (!S.days.includes(today)) S.days = S.days.concat(today).slice(-60);
    const mul = 1 + 0.05 * Math.min(S.streak - 1, 10);
    let xp = r.win ? 20 + r.quality * 40 : 5 + r.quality * 10;
    xp = Math.round(xp * mul * (isDaily ? 2 : 1)); const coins = Math.max(1, Math.round(xp / 5));
    if (isDaily) S.dailyDone = today;
    const before = levelOf(S.xp);
    const apply = (x, c) => { S.xp += x; S.coins += c; S.week.xp += x; S.q.xp += x; };
    apply(xp, coins); S.q.plays++; if (r.win) { S.played++; S.q.wins++; }
    if (!S.best[g.id] || r.score > S.best[g.id]) S.best[g.id] = r.score;
    save();
    let boosted = false;
    const show = () => {
      const after = levelOf(S.xp), up = after > before, rk = rankOf(after), b = thr(after + 1), mult = boosted ? 2 : 1;
      const newly = MILES.filter((m) => m.lvl > before && m.lvl <= after && !S.claimed[m.lvl]);
      $('#gameOv').hidden = true;
      if (r.win) { sfx('win'); confetti(up ? 200 : 70); }
      const toGo = b - S.xp;
      const m = modal(`<p class="meta">${r.win ? 'Puzzle solved' : 'Round over'}${r.label ? ' · ' + esc(r.label) : ''}</p>
        <div class="res-xp" id="rx">0</div><p style="margin-top:0">XP earned${isDaily ? ' (daily 2×)' : ''}</p>
        <div class="res-rows"><div><span>Coins</span><b>+${coins * mult}</b></div><div><span>Streak</span><b>${S.streak} day${S.streak > 1 ? 's' : ''}${mul > 1 ? ' (+' + Math.round((mul - 1) * 100) + '% XP)' : ''}</b></div><div><span>Next level</span><b>${toGo} XP</b></div></div>
        ${up ? `<div class="lvup">Level ${after} reached: ${rk[1]}</div>` : ''}
        ${newly.length ? `<div class="lvup">Reward unlocked: ${esc(newly[0].name)}</div>` : ''}
        <div class="acts"><button class="btn primary" id="again">Play again</button>
        ${boosted ? '' : '<button class="btn" id="dbl">Watch ad to double rewards</button>'}
        <button class="btn ghost" id="home">${newly.length ? 'Claim reward' : 'Back to puzzles'}</button></div>`);
      m.dataset.lock = '1'; countUp($('#rx'), xp * mult);
      const dbl = $('#dbl'); if (dbl) dbl.onclick = () => { delete m.dataset.lock; closeModal(); showAd({ rewarded: true }, (ok) => { if (ok) { apply(xp, coins); boosted = true; save(); bump(); } show(); }); };
      $('#again').onclick = () => { closeModal(); sinceAd++; maybeInterstitial(() => startGame(g.id)); };
      $('#home').onclick = () => { closeModal(); closeGame(); sinceAd++; maybeInterstitial(() => go(newly.length ? 'rewards' : 'play')); };
      renderTop(); bump();
    };
    show();
  }
  function maybeInterstitial(next) { if (sinceAd >= CONFIG.interstitialEvery) { sinceAd = 0; showAd({ rewarded: false, secs: 3 }, () => next()); } else next(); }

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
    else if (d.play) startGame(d.play);
    else if (d.claim) claim(d.claim);
    else if (d.buy) buy(d.buy);
    else if (d.bonus) bonus();
    else if (d.qclaim) qclaim(d.qclaim);
    else if (d.close !== undefined) closeModal();
  });
  $('#ctaPlay').addEventListener('click', () => { const id = $('#ctaPlay').dataset.play; if (id) startGame(id); });
  $('#nameIn').addEventListener('input', (e) => { S.name = e.target.value.trim().slice(0, 16) || 'Player'; save(); });
  $('#resetBtn').onclick = () => { if (confirm('Erase all progress, coins and rewards on this device?')) { S = fresh(); ensure(); save(); go('play'); toast('Progress reset'); } };
  $('#promoF').addEventListener('submit', (e) => { e.preventDefault(); promo($('#promoIn').value); $('#promoIn').value = ''; });
  $('#cookieBtn').onclick = consentBanner;
  if (getConsent() === null) setTimeout(consentBanner, 1200);
  $('#yr').textContent = new Date().getFullYear();
  addEventListener('hashchange', () => { const v = location.hash.slice(1); if (v in renderers && v !== view) go(v); });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && location.hostname !== 'localhost') navigator.serviceWorker.register('sw.js').catch(() => {});

  initAds();
  go(location.hash.slice(1) in renderers ? location.hash.slice(1) : 'play');
})();
