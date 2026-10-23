(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ================= CONFIG ================= */
  const CONFIG = {
    // Ads: set your AdSense publisher id (e.g. 'ca-pub-123…') and slot ids to serve real ads.
    adsenseClient: '',
    adSlots: { top: '', inline: '', rewards: '', game: '' },
    interstitialEvery: 3,           // show a skippable interstitial every N finished games
    rewardedBonus: 1,               // watching a rewarded ad grants +100% of the round's rewards
  };
  const RANKS = [
    [1, 'Rookie', '🌱'], [3, 'Thinker', '💭'], [5, 'Sharp Mind', '🔍'], [8, 'Strategist', '♟️'], [12, 'Brainiac', '🧠'],
    [18, 'Genius', '⚡'], [25, 'Mastermind', '🔮'], [35, 'Grandmaster', '👑'], [50, 'Legend', '🏆'],
  ];
  const MILES = [
    { lvl: 2, type: 'coins', amt: 50, name: '50 bonus coins', icon: '🪙' },
    { lvl: 3, type: 'coupon', brand: 'ShopNova', off: '10% off', name: '10% off at ShopNova', icon: '🎟️' },
    { lvl: 5, type: 'coupon', brand: 'FoodieGo', off: '$5 off', name: '$5 off at FoodieGo', icon: '🍔' },
    { lvl: 8, type: 'coupon', brand: 'StreamBox', off: '1 month free', name: '1 month free StreamBox', icon: '🎬' },
    { lvl: 10, type: 'cash', amt: 2, name: '$2 cash reward', icon: '💵' },
    { lvl: 15, type: 'coupon', brand: 'ShopNova', off: '25% off', name: '25% off at ShopNova', icon: '🛍️' },
    { lvl: 20, type: 'cash', amt: 5, name: '$5 cash reward', icon: '💵' },
    { lvl: 30, type: 'cash', amt: 10, name: '$10 cash reward', icon: '💰' },
    { lvl: 50, type: 'cash', amt: 25, name: '$25 cash reward', icon: '🤑' },
  ];
  const STORE = [
    { id: 's1', brand: 'ShopNova', off: '5% off', cost: 150 },
    { id: 's2', brand: 'FoodieGo', off: 'Free delivery', cost: 250 },
    { id: 's3', brand: 'BookNest', off: '15% off e-books', cost: 400 },
    { id: 's4', brand: 'StreamBox', off: '7-day free trial', cost: 600 },
  ];
  const BOTS = ['Aria', 'Kenji', 'Luna', 'Max', 'Zara', 'Omar', 'Mia', 'Leo', 'Nina', 'Raj', 'Eva', 'Sam', 'Ivy', 'Noah', 'Tara', 'Finn', 'Yuki', 'Cleo', 'Dev'];

  /* ================= STATE ================= */
  const KEY = 'pixaton.v1';
  const fresh = () => ({ name: 'Player', xp: 0, coins: 0, played: 0, streak: 0, lastDay: '', best: {}, claimed: {}, claims: [], dailyDone: '', week: { id: '', xp: 0 }, sound: true, ads: 0 });
  let S;
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { S = fresh(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };

  const thr = (n) => 30 * n * (n - 1);                      // total XP needed to reach level n
  const levelOf = (xp) => { let n = 1; while (xp >= thr(n + 1)) n++; return n; };
  const rankOf = (lvl) => RANKS.filter((r) => r[0] <= lvl).pop();
  const dayStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const weekId = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dayStr(d); };
  if (S.week.id !== weekId()) S.week = { id: weekId(), xp: 0 };
  const dailyGame = () => GAMES[Math.floor(Date.now() / 864e5) % GAMES.length];

  /* ================= SOUND & FX ================= */
  let ac;
  function sfx(kind, i = 0) {
    if (!S.sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain(); o.connect(g); g.connect(ac.destination);
      const f = { tap: 420, good: 660, bad: 160, note: [330, 440, 550, 660][i], win: 880 }[kind] || 400;
      o.type = kind === 'bad' ? 'sawtooth' : 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.08, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + (kind === 'note' ? 0.35 : 0.18));
      o.start(); o.stop(ac.currentTime + 0.4);
    } catch {}
  }
  const cv = $('#fx'), cx = cv.getContext('2d'); let parts = [], raf = 0;
  function confetti(n = 140) {
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    cv.width = innerWidth; cv.height = innerHeight;
    const cols = ['#7c5cff', '#2dd4a0', '#ffd25e', '#ff5d9e', '#4aa3ff'];
    for (let i = 0; i < n; i++) parts.push({ x: innerWidth / 2, y: innerHeight / 3, vx: (Math.random() - .5) * 16, vy: Math.random() * -14 - 3, s: 5 + Math.random() * 6, c: cols[i % 5], r: Math.random() * 6, life: 110 + Math.random() * 50 });
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    cx.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter((p) => p.life-- > 0);
    parts.forEach((p) => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.r += .2; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.globalAlpha = Math.min(1, p.life / 40); cx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); cx.restore(); });
    raf = parts.length ? requestAnimationFrame(tick) : 0; if (!raf) cx.clearRect(0, 0, cv.width, cv.height);
  }
  function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('#toasts').append(t); setTimeout(() => t.remove(), 3200); }

  /* ================= MODALS ================= */
  function modal(html, { left = false, onClose } = {}) {
    const m = $('#modal'); m.className = 'modal' + (left ? ' left' : ''); m.innerHTML = html; $('#modalOv').hidden = false;
    m._close = onClose; setTimeout(() => { const f = m.querySelector('button,input'); f && f.focus(); }, 50); return m;
  }
  function closeModal() { const m = $('#modal'); $('#modalOv').hidden = true; const c = m._close; m._close = null; c && c(); }
  $('#modalOv').addEventListener('click', (e) => { if (e.target.id === 'modalOv' && !$('#modal').dataset.lock) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modalOv').hidden && !$('#modal').dataset.lock) closeModal(); });

  /* ================= ADS ================= */
  function initAds() {
    if (CONFIG.adsenseClient) {
      const s = document.createElement('script'); s.async = true; s.crossOrigin = 'anonymous';
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(CONFIG.adsenseClient); document.head.append(s);
    }
    $$('.ad').forEach((el) => {
      const slot = CONFIG.adSlots[el.dataset.ad];
      if (CONFIG.adsenseClient && slot) {
        el.classList.add('filled'); el.innerHTML = `<ins class="adsbygoogle" style="display:block;width:100%" data-ad-client="${esc(CONFIG.adsenseClient)}" data-ad-slot="${esc(slot)}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
      } else el.textContent = 'Ad space — add your AdSense IDs in app.js CONFIG';
    });
  }
  // Rewarded / interstitial ad. Replace the body with your ad SDK call (e.g. Google Ad Manager rewarded, AdinPlay, etc.).
  function showAd({ rewarded, secs = 5 }, done) {
    let n = secs, ok = false; let iv;
    const m = modal(`<h2>${rewarded ? '🎁 Watch to double rewards' : 'Sponsored'}</h2><div class="adfake">Your ad plays here</div>
      <div class="countdown" id="adc">${n}</div><p>${rewarded ? 'Stay until the end to claim your bonus.' : 'Skippable shortly.'}</p>
      <div class="acts"><button class="btn" id="adx" disabled>${rewarded ? 'Claim bonus' : 'Skip ad'}</button></div>`, { onClose: () => { clearInterval(iv); done(ok); } });
    m.dataset.lock = '1';
    iv = setInterval(() => { n--; $('#adc', m).textContent = Math.max(n, 0); if (n <= 0) { clearInterval(iv); const b = $('#adx', m); b.disabled = false; ok = true; } }, 1000);
    $('#adx', m).onclick = () => { delete m.dataset.lock; S.ads++; save(); closeModal(); };
  }

  /* ================= RENDER ================= */
  function nextMile() { return MILES.find((m) => !S.claimed[m.lvl]) || null; }
  function renderTop() {
    const lvl = levelOf(S.xp), r = rankOf(lvl);
    $('#chipCoins').textContent = S.coins; $('#chipLvl').textContent = lvl;
    $('#heroRank').textContent = `${r[2]} ${r[1]} · Level ${lvl}`;
    const a = thr(lvl), b = thr(lvl + 1);
    $('#xpFill').style.width = ((S.xp - a) / (b - a) * 100) + '%';
    $('#xpText').textContent = `${S.xp - a} / ${b - a} XP to level ${lvl + 1}`;
    const nm = nextMile(); $('#nextMile').textContent = nm ? `Next reward: ${nm.name} (Lv ${nm.lvl})` : 'All milestones claimed!';
    $('#stStreak').textContent = S.streak; $('#stPlayed').textContent = S.played; $('#stXp').textContent = S.xp;
  }
  function renderPlay() {
    const d = dailyGame(), done = S.dailyDone === dayStr();
    $('#daily').innerHTML = `<div class="ico">${done ? '✅' : '🔥'}</div><div class="t"><b>Daily challenge: ${d.name}</b><br><span class="muted" style="margin:0">${done ? 'Completed — come back tomorrow for a fresh one.' : 'Win it today for double XP and coins.'}</span></div>${done ? '' : '<button class="btn gold" data-play="' + d.id + '">Play now</button>'}`;
    $('#gameGrid').innerHTML = GAMES.map((g) => `<button class="gcard ${g.id === d.id && !done ? 'daily-pick' : ''}" style="--c:${g.color}" data-play="${g.id}">
      <span class="gi">${g.icon}</span><span><h3>${g.name}</h3><p>${g.desc}</p><span class="tag">${g.tag}</span></span>
      ${S.best[g.id] ? `<span class="best">Best ${S.best[g.id]}</span>` : ''}</button>`).join('');
  }
  function renderRewards() {
    const lvl = levelOf(S.xp);
    $('#miles').innerHTML = MILES.map((m) => {
      const claimed = S.claimed[m.lvl], can = !claimed && lvl >= m.lvl;
      return `<div class="mile ${m.type} ${can ? 'claimable' : ''} ${!claimed && !can ? 'locked' : ''}"><div class="mi">${m.icon}</div>
        <div class="mt"><b>${m.name}</b><span>${claimed ? 'Claimed' : can ? 'Ready to claim!' : `Unlocks at level ${m.lvl} (${(thr(m.lvl) - S.xp).toLocaleString()} XP to go)`}</span></div>
        <button class="btn ${can ? 'ok' : 'ghost'} sm" data-claim="${m.lvl}" ${can ? '' : 'disabled'}>${claimed ? '✓' : can ? 'Claim' : '🔒'}</button></div>`;
    }).join('');
    $('#store').innerHTML = STORE.map((d) => `<div class="deal"><small>${d.brand}</small><div class="big">${d.off}</div>
      <button class="btn gold sm" data-buy="${d.id}" ${S.coins >= d.cost ? '' : 'disabled'}><span class="coin"></span> ${d.cost} coins</button></div>`).join('');
  }
  function renderRanks() {
    const seed = (S.week.id + '').split('-').join('') | 0; let x = seed;
    const rnd = () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
    const rows = BOTS.map((n) => ({ n, xp: Math.round(120 + rnd() * 1800) })); rows.push({ n: S.name, xp: S.week.xp, me: true });
    rows.sort((a, b) => b.xp - a.xp);
    $('#board').innerHTML = rows.slice(0, 12).concat(rows.slice(12).filter((r) => r.me)).map((r) => `<li class="${r.me ? 'me' : ''}"><span class="pos">#${rows.indexOf(r) + 1}</span><span class="nm">${esc(r.n)}${r.me ? ' (you)' : ''}</span><span class="xp">${r.xp.toLocaleString()} XP</span></li>`).join('');
    const lvl = levelOf(S.xp), cur = rankOf(lvl);
    $('#ladder').innerHTML = RANKS.map((r) => `<div class="rung ${r === cur ? 'cur' : ''}"><div class="e">${r[2]}</div><b>${r[1]}</b><small>Level ${r[0]}+</small></div>`).join('');
  }
  function renderProfile() {
    $('#nameIn').value = S.name;
    $('#profStats').innerHTML = [[levelOf(S.xp), 'Level'], [S.xp, 'Total XP'], [S.coins, 'Coins'], [S.played, 'Puzzles solved'], [S.streak, 'Day streak'], [S.ads, 'Bonuses claimed']].map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('');
    $('#claims').innerHTML = S.claims.length ? S.claims.slice().reverse().map((c) => `<div class="row"><span>${esc(c.title)}</span><span>${c.code ? `<code class="cp">${esc(c.code)}</code>` : esc(c.status)}</span></div>`).join('') : '<p class="muted" style="margin:0">Nothing yet — reach level 2 to claim your first reward.</p>';
    $('#bests').innerHTML = GAMES.map((g) => `<div class="row"><span>${g.icon} ${g.name}</span><b>${S.best[g.id] || '—'}</b></div>`).join('');
  }
  const renderers = { play: renderPlay, rewards: renderRewards, ranks: renderRanks, profile: renderProfile };
  let view = 'play';
  function go(v) {
    view = renderers[v] ? v : 'play'; $$('.view').forEach((e) => e.classList.toggle('on', e.id === 'view-' + view));
    $$('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.view === view));
    renderers[view](); renderTop(); history.replaceState(null, '', '#' + view); scrollTo({ top: 0 });
  }
  const refresh = () => { renderers[view](); renderTop(); save(); };

  /* ================= REWARD CLAIMS ================= */
  const mkCode = (brand) => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 8; i++) s += a[Math.floor(Math.random() * a.length)]; return brand.slice(0, 3).toUpperCase() + '-' + s.slice(0, 4) + '-' + s.slice(4); };
  function claim(lvl) {
    const m = MILES.find((x) => x.lvl === +lvl); if (!m || S.claimed[m.lvl] || levelOf(S.xp) < m.lvl) return;
    if (m.type === 'coins') { S.coins += m.amt; S.claimed[m.lvl] = 1; S.claims.push({ title: m.name, status: 'Added to wallet' }); confetti(); sfx('win'); toast(`+${m.amt} coins!`); refresh(); }
    else if (m.type === 'coupon') {
      const code = mkCode(m.brand); S.claimed[m.lvl] = 1; S.claims.push({ title: m.name, code }); confetti(); sfx('win'); refresh();
      modal(`<div class="big">${m.icon}</div><h2>${esc(m.name)}</h2><p>Your coupon code:</p><p><code class="cp" style="font-size:22px">${code}</code></p><div class="acts"><button class="btn" id="cpy">Copy code</button><button class="btn ghost" data-close>Done</button></div>`);
      $('#cpy').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(code); toast('Copied!'); };
    } else {
      modal(`<div class="big">${m.icon}</div><h2>${esc(m.name)}</h2><p>Where should we send it? Payouts are reviewed within 7 days.</p>
        <form id="cashF"><select id="cm" aria-label="Payout method"><option>PayPal</option><option>UPI</option><option>Bank transfer</option></select><input id="ca" required maxlength="80" placeholder="Email / UPI ID / account details" aria-label="Payout details"><button class="btn ok" type="submit">Request payout</button></form>`);
      $('#cashF').onsubmit = (e) => { e.preventDefault(); const det = $('#ca').value.trim(); if (!det) return;
        S.claimed[m.lvl] = 1; S.claims.push({ title: `${m.name} → ${$('#cm').value}`, status: 'Pending review' }); confetti(); sfx('win'); refresh(); closeModal(); toast('Payout requested — pending review'); };
    }
  }
  function buy(id) {
    const d = STORE.find((x) => x.id === id); if (!d || S.coins < d.cost) return;
    S.coins -= d.cost; const code = mkCode(d.brand); S.claims.push({ title: `${d.brand}: ${d.off}`, code }); sfx('win'); refresh();
    modal(`<div class="big">🎟️</div><h2>${esc(d.brand)}: ${esc(d.off)}</h2><p>Your code:</p><p><code class="cp" style="font-size:22px">${code}</code></p><div class="acts"><button class="btn" data-close>Done</button></div>`);
  }

  /* ================= GAME FLOW ================= */
  let cleanup = null, curGame = null, sinceAd = 0;
  function startGame(id) {
    const g = GAMES.find((x) => x.id === id); if (!g) return; curGame = g;
    stopGame(); $('#gameTitle').textContent = `${g.icon} ${g.name}`; $('#gameHud').innerHTML = ''; $('#stage').innerHTML = '';
    $('#gameOv').hidden = false; document.body.style.overflow = 'hidden';
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
    stopGame();
    const today = dayStr(), isDaily = g.id === dailyGame().id && S.dailyDone !== today && r.win;
    // streak
    if (S.lastDay !== today) { const y = new Date(); y.setDate(y.getDate() - 1); S.streak = S.lastDay === dayStr(y) ? S.streak + 1 : 1; S.lastDay = today; }
    const streakMul = 1 + 0.05 * Math.min(S.streak - 1, 10);
    let xp = r.win ? 20 + r.quality * 40 : 5 + r.quality * 10;
    xp = Math.round(xp * streakMul * (isDaily ? 2 : 1)); let coins = Math.max(1, Math.round(xp / 5));
    if (isDaily) S.dailyDone = today;
    const before = levelOf(S.xp);
    const apply = (x, c) => { S.xp += x; S.coins += c; S.week.xp += x; };
    apply(xp, coins); if (r.win) S.played++;
    if (!S.best[g.id] || r.score > S.best[g.id]) S.best[g.id] = r.score;
    save();
    let boosted = false;
    const show = () => {
      const after = levelOf(S.xp), up = after > before, rk = rankOf(after);
      const newly = MILES.filter((m) => m.lvl > before && m.lvl <= after && !S.claimed[m.lvl]);
      if (r.win) { sfx('win'); confetti(up ? 260 : 90); }
      const stars = r.quality > .75 ? '⭐⭐⭐' : r.quality > .4 ? '⭐⭐' : '⭐';
      modal(`<div class="big">${r.win ? '🎉' : '💪'}</div><h2>${r.win ? 'Puzzle solved!' : 'Good effort!'}</h2><p>${esc(r.label || '')} · ${r.win ? stars : ''}</p>
        ${isDaily ? '<p style="color:var(--gold)">🔥 Daily challenge — double rewards!</p>' : ''}
        <div class="rw"><div><b>+${xp * (boosted ? 2 : 1)}</b><span>XP</span></div><div><b>+${coins * (boosted ? 2 : 1)}</b><span>Coins</span></div><div><b>${S.streak}🔥</b><span>Day streak</span></div></div>
        ${up ? `<p style="color:var(--ok);font-weight:700">⬆ Level ${after} — ${rk[2]} ${rk[1]}!</p>` : ''}
        ${newly.length ? `<p style="color:var(--gold)">🎁 Reward unlocked: ${esc(newly[0].name)}</p>` : ''}
        <div class="acts">${boosted ? '' : `<button class="btn gold" id="dbl">🎁 Watch ad · double rewards</button>`}
        <button class="btn" id="again">Play again</button><button class="btn ghost" id="home">${newly.length ? 'Go to rewards' : 'Back to games'}</button></div>`);
      const m = $('#modal'); m.dataset.lock = '1';
      const dbl = $('#dbl'); if (dbl) dbl.onclick = () => { delete m.dataset.lock; closeModal(); showAd({ rewarded: true }, (ok) => { if (ok) { apply(xp, coins); boosted = true; save(); toast('Bonus applied!'); } show(); }); };
      $('#again').onclick = () => { delete m.dataset.lock; closeModal(); sinceAd++; maybeInterstitial(() => startGame(g.id)); };
      $('#home').onclick = () => { delete m.dataset.lock; closeModal(); closeGame(); sinceAd++; maybeInterstitial(() => go(newly.length ? 'rewards' : 'play')); };
      if (newly.length) toast('🎁 New reward unlocked!');
      renderTop();
    };
    show();
  }
  function maybeInterstitial(next) {
    if (sinceAd >= CONFIG.interstitialEvery) { sinceAd = 0; showAd({ rewarded: false, secs: 3 }, () => next()); } else next();
  }

  /* ================= LEGAL ================= */
  const LEGAL = {
    terms: ['Terms of Use', '<p>Pixaton is a skill-based puzzle site. Rewards (coupons and cash) are promotional, have no guaranteed value, and may be changed or withdrawn. Cash payouts require identity and anti-fraud review and are limited to one account per person.</p><p>Cheating, automation or multiple accounts will void rewards.</p><p><i>Template text — have counsel review before launch.</i></p>'],
    privacy: ['Privacy', '<p>Progress is stored in your browser (localStorage). If advertising is enabled, ad partners may use cookies to serve and measure ads; you can control this via your browser and the consent banner.</p><p>Payout details you enter are used only to process your reward.</p><p><i>Template text — update to match your actual data practices and local law (GDPR/CCPA).</i></p>'],
    ads: ['Ads & rewards', '<p>Pixaton is free thanks to advertising. Optional rewarded ads give you bonus XP and coins. Interstitial ads appear occasionally between rounds.</p>'],
  };

  /* ================= EVENTS ================= */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.view) go(t.dataset.view);
    else if (t.dataset.play) startGame(t.dataset.play);
    else if (t.dataset.claim) claim(t.dataset.claim);
    else if (t.dataset.buy) buy(t.dataset.buy);
    else if (t.dataset.close !== undefined) closeModal();
    else if (t.dataset.legal) { const [h, b] = LEGAL[t.dataset.legal]; modal(`<h2>${h}</h2><div class="legal">${b}</div><div class="acts"><button class="btn" data-close>Close</button></div>`, { left: true }); }
  });
  $('#nameIn').addEventListener('input', (e) => { S.name = e.target.value.trim().slice(0, 16) || 'Player'; save(); });
  $('#resetBtn').onclick = () => { if (confirm('Erase all progress, coins and rewards on this device?')) { S = fresh(); S.week = { id: weekId(), xp: 0 }; save(); go('play'); toast('Progress reset'); } };
  $('#yr').textContent = new Date().getFullYear();

  addEventListener('hashchange', () => { const v = location.hash.slice(1); if (v in renderers && v !== view) go(v); });
  initAds();
  go(location.hash.slice(1) in renderers ? location.hash.slice(1) : 'play');
})();
