/* Versus: friend rooms, duels and trials.
   Transport: WebRTC via PeerJS public broker (works across devices). Falls back to BroadcastChannel
   (same browser, different tabs) when the broker can't be reached. Host is authoritative. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = Math.random().toString(36).slice(2, 8);
  const CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', MAXP = 6, PREFIX = 'pixaquest-';
  const mkCode = () => Array.from({ length: 5 }, () => CH[Math.floor(Math.random() * CH.length)]).join('');
  const T = (k, v) => I18N.t(k, v);
  // STUN finds each laptop's public address; TURN relays when a strict router/firewall blocks direct links.
  const PEER_OPTS = {
    debug: 0,
    config: {
      iceCandidatePoolSize: 4,
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:global.stun.twilio.com:3478'] },
        { urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turns:openrelay.metered.ca:443?transport=tcp'], username: 'openrelayproject', credential: 'openrelayproject' }
      ]
    }
  };
  const PING_MS = 4000, DEAD_MS = 14000;
  let API = null, room = null, lobbyOpen = false, pendingProg = null, progT = 0, progTimer = null;

  function unlockModal() {
    const m = $('#modal');
    if (m) delete m.dataset.lock;
  }

  /* ---------------- transports ---------------- */
  function loadPeer() {
    return new Promise((res, rej) => {
      if (window.Peer) return res();
      const urls = ['https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'];
      const tryLoad = (i) => {
        if (i >= urls.length) return rej(new Error('load'));
        const s = document.createElement('script'); s.src = urls[i];
        s.onload = res; s.onerror = () => { s.remove(); tryLoad(i + 1); };
        document.head.append(s);
      };
      tryLoad(0); setTimeout(() => rej(new Error('timeout')), 9000);
    });
  }

  function wrapPeerConn(conn) {
    const h = {}, q = [];
    conn.on('data', (d) => (h.data ? h.data(d) : q.push(d)));
    conn.on('close', () => h.close && h.close());
    conn.on('error', () => h.close && h.close());
    return {
      send: (o) => { try { conn.send(o); } catch {} },
      close: () => { try { conn.close(); } catch {} },
      onData: (f) => { h.data = f; while (q.length) f(q.shift()); },
      onClose: (f) => (h.close = f)
    };
  }

  async function peerHost(code) {
    await loadPeer();
    return new Promise((res, rej) => {
      let resolved = false;
      const peer = new window.Peer(PREFIX + code, PEER_OPTS);
      const t = setTimeout(() => { if (!resolved) { try { peer.destroy(); } catch {} rej(new Error('timeout')); } }, 10000);
      let cb = () => {};

      peer.on('open', () => {
        resolved = true;
        clearTimeout(t);
        res({
          kind: 'peer',
          onConn: (f) => (cb = f),
          close: () => { try { peer.destroy(); } catch {} }
        });
      });

      peer.on('connection', (conn) => {
        const w = wrapPeerConn(conn);
        if (conn.open) cb(w);
        else conn.on('open', () => cb(w));
      });

      peer.on('disconnected', () => { if (resolved && !peer.destroyed) setTimeout(() => { try { peer.reconnect(); } catch {} }, 800); });

      peer.on('error', (e) => {
        if (!resolved) { clearTimeout(t); try { peer.destroy(); } catch {} rej(e); }
      });
    });
  }

  /* Relay channel: same shape as BroadcastChannel but carried over the public ntfy.sh pub/sub service
     (plain HTTPS + server-sent events), so it works through any router, firewall or school/work Wi-Fi
     when a direct WebRTC link cannot be made. Chatty messages are coalesced to stay inside its rate limit. */
  const SLOW = { room: 1200, prog: 1500, ping: 1e9, pong: 1e9 };
  function relayChannel(code) {
    return new Promise((res, rej) => {
      const url = 'https://ntfy.sh/pxq-r-' + code;
      let es, dead = false, last = {}, pend = {}, chain = Promise.resolve();
      try { es = new EventSource(url + '/sse'); } catch (e) { return rej(e); }
      const ch = {
        onmessage: null,
        postMessage(o) {
          if (dead) return;
          const t = o.data && o.data.t, gap = SLOW[t], key = o.to + ':' + t;
          if (gap === undefined) return post(o);
          if (gap >= 1e9) return; // relay peers are not heartbeat-checked
          const wait = (last[key] || 0) + gap - Date.now();
          if (wait <= 0) { last[key] = Date.now(); return post(o); }
          if (!pend[key]) setTimeout(() => { const m = pend[key]; delete pend[key]; last[key] = Date.now(); if (m && !dead) post(m); }, wait);
          pend[key] = o; // latest wins
        },
        close() { dead = true; try { es.close(); } catch {} }
      };
      const post = (o) => { chain = chain.then(() => send(o, 0)); };
      const send = (o, n) => fetch(url, { method: 'POST', body: JSON.stringify(o) }).then((r) => { if (r.status === 429 && n < 4) return new Promise((k) => setTimeout(k, 2500)).then(() => send(o, n + 1)); }).catch(() => {});
      es.onmessage = (e) => {
        try { const d = JSON.parse(e.data); if (d.event === 'message' && ch.onmessage) ch.onmessage({ data: JSON.parse(d.message) }); } catch {}
      };
      const t = setTimeout(() => { ch.close(); rej(new Error('relay timeout')); }, 6000);
      es.onopen = () => { clearTimeout(t); es.onopen = null; res(ch); };
    });
  }

  function chanHost(ch, kind) {
    const conns = new Map();
    let cb = () => {};
    ch.onmessage = (e) => {
      const m = e.data; if (!m || m.to !== 'host') return;
      let c = conns.get(m.from);
      if (!c) {
        if (m.data && m.data.t !== 'hello') return;
        const h = {}, q = [];
        c = {
          h,
          relay: kind === 'relay',
          send: (o) => ch.postMessage({ to: m.from, data: o }),
          close: () => conns.delete(m.from),
          onData: (f) => { h.data = f; while (q.length) f(q.shift()); },
          onClose: (f) => (h.close = f),
          _q: q
        };
        conns.set(m.from, c);
        cb(c);
      }
      if (m.data && m.data.t === 'bye') {
        if (c.h.close) c.h.close();
        conns.delete(m.from);
        return;
      }
      if (c.h.data) c.h.data(m.data);
      else c._q.push(m.data);
    };
    return { kind, onConn: (f) => (cb = f), close: () => ch.close() };
  }
  const localHost = (code) => chanHost(new BroadcastChannel('pxq-' + code), 'local');

  async function peerJoin(code) {
    await loadPeer();
    return new Promise((res, rej) => {
      let resolved = false;
      const peer = new window.Peer(undefined, PEER_OPTS);
      const t = setTimeout(() => { if (!resolved) { try { peer.destroy(); } catch {} rej(new Error('timeout')); } }, 9000);

      peer.on('open', () => {
        const conn = peer.connect(PREFIX + code, { serialization: 'json', reliable: true });
        conn.on('open', () => {
          resolved = true;
          clearTimeout(t);
          const w = wrapPeerConn(conn);
          w.close = () => { try { conn.close(); peer.destroy(); } catch {} };
          res(w);
        });
        conn.on('error', (e) => { if (!resolved) { clearTimeout(t); try { peer.destroy(); } catch {} rej(e); } });
      });

      peer.on('error', (e) => {
        if (!resolved) { clearTimeout(t); try { peer.destroy(); } catch {} rej(e); }
      });
    });
  }

  const localJoin = (code) => chanJoin(new BroadcastChannel('pxq-' + code), 1800);
  async function relayJoin(code) { return chanJoin(await relayChannel(code), 9000, true); }
  async function relayHost(code) { return chanHost(await relayChannel(code), 'relay'); }
  function chanJoin(ch, wait, relay) {
    return new Promise((res, rej) => {
      const h = {}, q = [];
      let ok = false;
      const w = {
        relay: !!relay,
        send: (o) => ch.postMessage({ to: 'host', from: uid, data: o }),
        close: () => {
          try { ch.postMessage({ to: 'host', from: uid, data: { t: 'bye' } }); ch.close(); } catch {}
        },
        onData: (f) => { h.data = f; while (q.length) f(q.shift()); },
        onClose: (f) => (h.close = f)
      };

      ch.onmessage = (e) => {
        const m = e.data; if (!m || m.to !== uid) return;
        if (!ok) { ok = true; clearTimeout(t); res(w); }
        if (h.data) h.data(m.data);
        else q.push(m.data);
      };

      const t = setTimeout(() => { ch.close(); rej(new Error('no host')); }, wait);
      w.send({ t: 'hello', id: uid, name: API.S.name, av: API.S.avatar });
    });
  }

  /* ---------------- helpers ---------------- */
  const isLocalhost = () => /^(localhost|127\.|\[::1\]|)$/.test(location.hostname);
  const me = () => ({ id: room && room.host ? 'host' : uid, name: API.S.name, av: API.S.avatar });
  const link = () => {
    const u = new URL(location.href); u.search = ''; u.hash = '';
    u.searchParams.set('room', room.code);
    if (room.local) u.searchParams.set('l', '1');
    return u.toString();
  };
  const pick3 = () => {
    const a = (API.GAMES || []).map((g) => g.id);
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a.slice(0, 3);
  };
  const gname = (id) => ((API.GAMES || []).find((g) => g.id === id) || {}).name || id;
  const S = () => room && room.state;
  const player = (id) => (S() ? S().players.find((p) => p.id === id) : null);

  /* ---------------- host logic ---------------- */
  function bcast(msg) { room.conns.forEach((c) => c.send(msg)); }
  function push() { if (room && room.host) bcast({ t: 'room', state: room.state }); render(); }

  function hostRecv(conn, m, setPid) {
    if (!m || !room || !room.state) return;
    if (m.id) room.seen.set(m.id, Date.now());
    if (m.t === 'pong') return;
    if (m.t === 'hello') {
      const s = room.state;
      if (s.players.length >= MAXP && !player(m.id)) { conn.send({ t: 'full' }); conn.close(); return; }
      if (room.banned.has(m.id)) { conn.send({ t: 'kick' }); conn.close(); return; }
      setPid(m.id); room.conns.set(m.id, conn); room.seen.set(m.id, Date.now());
      if (!player(m.id)) {
        s.players.push({ id: m.id, name: String(m.name || 'Player').slice(0, 16), av: m.av, status: 'lobby', prog: '', pts: 0, in: false });
        API.toast(T('v.joined', { n: String(m.name || 'Player').slice(0, 16) }));
        API.sfx('good');
      }
      conn.send({ t: 'room', state: s }); push();
    } else if (m.t === 'done') {
      const p = player(m.id); if (!p || !p.in || p.status === 'done') return;
      room.scores.set(m.id, { score: Math.max(0, Math.round(+m.score || 0)), label: String(m.label || '').slice(0, 40), win: !!m.win, dnf: !!m.dnf });
      p.status = 'done'; push(); checkAll();
    } else if (m.t === 'prog') {
      const p = player(m.id); if (p) { p.prog = String(m.p || '').slice(0, 30); schedulePush(); }
    }
  }

  let pushT = 0;
  function schedulePush() { if (pushT) return; pushT = setTimeout(() => { pushT = 0; push(); }, 450); }

  function removePlayer(id, kicked) {
    if (!room || !room.host) return; const p = player(id); if (!p) return;
    room.state.players = room.state.players.filter((x) => x.id !== id);
    room.conns.delete(id); room.scores.delete(id); room.seen.delete(id);
    if (!kicked) API.toast(T('v.left', { n: p.name }));
    push(); checkAll();
  }

  function checkAll() {
    const s = S(); if (!room || !room.host || !s || s.phase !== 'playing') return;
    if (!s.players.some((p) => p.in && p.status === 'playing')) finishRound();
  }

  function startRound() {
    const s = S(); if (!room || !room.host || !s) return;
    const ins = s.players.length; if (ins < 2) return API.toast(T('v.need2'));
    const next = s.phase === 'results' && s.round < s.rounds - 1;
    s.rounds = s.cfg.mode === 'trials' ? 3 : 1;
    s.round = next ? s.round + 1 : 0;
    if (!next) s.players.forEach((p) => (p.pts = 0));
    const gameId = s.cfg.mode === 'trials' ? s.cfg.games[s.round] : s.cfg.game;
    const seed = (Math.random() * 4294967296) >>> 0;
    s.phase = 'playing';
    s.players.forEach((p) => { p.status = 'playing'; p.in = true; p.prog = ''; });
    room.scores.clear();
    const msg = { t: 'start', round: s.round, rounds: s.rounds, gameId, seed, diff: s.cfg.diff };
    bcast(msg); push(); playLocal(msg);
  }

  function finishRound() {
    const s = S(); if (!s) return;
    const N = s.players.filter((p) => p.in).length;
    const rows = s.players.filter((p) => p.in).map((p) => {
      const sc = room.scores.get(p.id) || { score: 0, label: 'Did not finish', dnf: true };
      return { id: p.id, name: p.name, av: p.av, score: sc.score, label: sc.label, dnf: !!sc.dnf, win: !!sc.win };
    });

    // Fix DNF sorting
    rows.sort((a, b) => (a.dnf ? 1 : 0) - (b.dnf ? 1 : 0) || b.score - a.score);

    let rank = 0;
    rows.forEach((r, i) => {
      if (i === 0 || r.score !== rows[i - 1].score || r.dnf !== rows[i - 1].dnf) rank = i;
      r.pts = r.dnf ? 0 : Math.max(1, N - rank);
      r.rank = rank + 1;
      const p = player(r.id);
      if (p) { p.pts += r.pts; r.total = p.pts; } else r.total = r.pts;
    });

    const final = s.round >= s.rounds - 1;
    s.phase = 'results';
    const res = { t: 'results', round: s.round, rounds: s.rounds, gameId: s.cur ? s.cur.gameId : '', rows, final };
    bcast(res); push(); showResults(res);
  }

  function resetToLobby() {
    const s = S(); if (!s) return;
    s.phase = 'lobby'; s.round = -1;
    s.players.forEach((p) => { p.status = 'lobby'; p.in = false; p.prog = ''; });
    unlockModal();
    API.closeModal();
    push();
  }

  /* ---------------- play / results ---------------- */
  function playLocal(m) {
    unlockModal();
    API.closeModal();
    const s = S(); if (s) s.cur = { gameId: m.gameId };
    setBar(true);
    API.startGame(m.gameId, { duel: { seed: m.seed, diff: m.diff, onHud: onHud, onEnd: (r) => reportDone(r, m) } });
    const ov = $('#vsOv'); if (ov) ov.hidden = true;
  }

  function onHud(items) {
    if (!Array.isArray(items)) return;
    pendingProg = items.filter(Boolean).map((i) => (typeof i === 'string' ? i : i.t)).slice(0, 2).join(' · ');
    const send = () => {
      progT = Date.now();
      if (room.host) {
        const p = player('host');
        if (p) { p.prog = pendingProg; schedulePush(); }
      } else if (room.conn) {
        room.conn.send({ t: 'prog', id: uid, p: pendingProg });
      }
    };
    if (Date.now() - progT >= 500) {
      clearTimeout(progTimer);
      progTimer = null;
      send();
    } else if (!progTimer) {
      progTimer = setTimeout(send, 500);
    }
  }

  function reportDone(r) {
    const done = { t: 'done', id: me().id, score: r.score || 0, win: !!r.win, label: r.label || '', dnf: !!r.dnf };
    setBar(false);
    if (!r.dnf) {
      API.modal(`<p class="meta">${T('v.finished')}</p><h2>${esc(r.label || T('done'))}</h2><p>${T('v.waitothers', { s: `<b style="color:var(--ac)">${Math.round(r.score || 0)}</b>` })}</p><div class="acts"><button class="btn ghost" data-close>${T('v.hide')}</button></div>`);
    }
    if (room.host) hostRecv({ send() {}, close() {} }, done, () => {});
    else if (room.conn) room.conn.send(done);
  }

  function showResults(res) {
    API.closeGame(); setBar(false);
    const mine = res.rows.find((r) => r.id === me().id), top = res.rows[0];
    const coins = mine ? 8 + mine.pts * 6 : 0, xp = mine ? 20 + mine.pts * 12 : 0;
    if (mine) API.grant({ xp, coins });
    if (mine && mine.rank === 1 && !mine.dnf) { API.confetti(160); API.sfx('win'); } else API.sfx('good');

    const rows = res.rows.map((r) => `<li class="vsr ${r.id === me().id ? 'me' : ''}"><span class="pos">${r.rank}</span><span class="vsav">${AVATAR.svg(r.av, 40)}</span><span class="nm">${esc(r.name)}<small>${esc(r.dnf ? T('v.dnf') : r.label || '')}</small></span><span class="sc">${r.dnf ? '—' : r.score}</span><span class="pt">+${r.pts}<small>${r.total} pts</small></span></li>`).join('');
    const host = room.host;
    const acts = host ? (res.final ? `<button class="btn primary" data-vs="again">${T('v.newmatch')}</button>` : `<button class="btn primary" data-vs="next">${T('v.nextround')}</button>`) : `<button class="btn" disabled>${res.final ? T('v.waithost') : T('v.waitnext')}</button>`;
    const m = API.modal(`<p class="meta">${res.rounds > 1 ? `${T('v.roundof', { a: res.round + 1, b: res.rounds })} · ` : ''}${esc(gname(res.gameId))}${res.final && res.rounds > 1 ? ' · ' + T('v.final') : ''}</p>
      <h2>${top && !top.dnf ? T('v.wins', { n: esc(top.name) }) : T('v.results')}</h2><ol class="vsrows">${rows}</ol>
      ${mine ? `<p class="meta" style="text-align:center">${T('v.earned', { xp, c: coins })}</p>` : ''}
      <div class="acts">${acts}<button class="btn ghost" data-vs="lobby">${host ? T('v.backlobby') : T('close')}</button></div>`);
    m.dataset.lock = '1';
  }

  /* ---------------- client recv ---------------- */
  function clientRecv(m) {
    if (!m) return;
    if (room) room.lastRecv = Date.now();
    if (m.t === 'ping') { if (room && room.conn) room.conn.send({ t: 'pong', id: uid }); return; }
    if (m.t === 'room') {
      room.state = m.state;
      if (m.state.phase === 'lobby') {
        unlockModal();
        API.closeModal();
        openLobby();
      }
      render();
    } else if (m.t === 'start') {
      playLocal(m);
    } else if (m.t === 'results') {
      showResults(m);
    } else if (m.t === 'kick') {
      leave(false, T('v.kicked'));
    } else if (m.t === 'closed') {
      leave(false, T('v.closed'));
    } else if (m.t === 'full') {
      leave(false, T('v.full'));
    }
  }

  /* ---------------- connection health ---------------- */
  function startBeat() {
    room.lastRecv = Date.now();
    room.hb = setInterval(() => {
      if (!room) return;
      const now = Date.now();
      if (room.host) {
        bcast({ t: 'ping' });
        [...room.conns.entries()].forEach(([id, c]) => { if (!c.relay && now - (room.seen.get(id) || now) > DEAD_MS) removePlayer(id); });
      } else if (!room.conn.relay && now - room.lastRecv > DEAD_MS) {
        leave(false, T('v.disc'));
      }
    }, PING_MS);
  }

  /* ---------------- room lifecycle ---------------- */
  async function create() {
    if (room) return openLobby();
    API.toast(T('v.creating'));
    let code = mkCode(), peerTr = null, relayTr = null;
    try {
      peerTr = await peerHost(code);
    } catch (e) {
      if (e && e.type === 'unavailable-id') {
        code = mkCode();
        try { peerTr = await peerHost(code); } catch { peerTr = null; }
      }
    }
    // always also listen on the HTTPS relay: it is the path that works when WebRTC is blocked between two networks
    try { relayTr = await relayHost(code); } catch { relayTr = null; }
    const local = !peerTr && !relayTr, trs = [peerTr, relayTr, localHost(code)].filter(Boolean);
    const tr = { onConn: (f) => trs.forEach((x) => x.onConn(f)), close: () => trs.forEach((x) => x.close()) };

    const firstGame = API.GAMES && API.GAMES[0] ? API.GAMES[0].id : '';
    const cfg = { mode: 'duel', game: firstGame, games: pick3(), diff: (API.S && API.S.diff) ?? 1 };
    room = {
      code, host: true, local, tr,
      conns: new Map(), scores: new Map(), banned: new Set(), seen: new Map(), hb: 0,
      state: {
        code, hostId: 'host', phase: 'lobby', cfg, round: -1, rounds: 1,
        players: [{ id: 'host', name: API.S.name, av: API.S.avatar, status: 'lobby', prog: '', pts: 0, in: false }]
      }
    };

    tr.onConn((conn) => {
      let pid = null;
      conn.onData((m) => hostRecv(conn, m, (id) => (pid = id)));
      conn.onClose(() => pid && removePlayer(pid));
    });

    startBeat();
    if (local) API.toast(T('v.offline'));
    openLobby(); API.refreshView();
  }

  async function join(code) {
    code = String(code || '').trim().toUpperCase();
    if (code.length < 4) return API.toast(T('v.entercode'));
    if (room) return API.toast(T('v.leavefirst'));

    API.toast(T('v.joining'));
    let conn = null, local = false, netErr = false;
    const forceLocal = new URLSearchParams(location.search).get('l') === '1';

    if (!forceLocal) {
      try { if (new URLSearchParams(location.search).get('relay') === '1') throw new Error('relay only'); conn = await peerJoin(code); } catch (e) { netErr = !(e && e.type === 'peer-unavailable'); }
      if (!conn) {
        API.toast(T('v.relaying'));
        try { conn = await relayJoin(code); netErr = false; } catch { conn = null; }
      }
    }
    if (!conn) {
      try { conn = await localJoin(code); local = true; netErr = false; } catch {
        return API.toast(T(netErr ? 'v.neterr' : 'v.notfound'));
      }
    }

    room = { code, host: false, local, conn, state: null, lastRecv: Date.now(), hb: 0 };
    conn.onData(clientRecv);
    conn.onClose(() => setTimeout(() => room && !room.host && leave(false, T('v.disc')), 400));

    // Always send hello once listeners are set
    conn.send({ t: 'hello', id: uid, name: API.S.name, av: API.S.avatar });

    startBeat();
    openLobby(); API.refreshView();
  }

  function leave(silent, why) {
    if (!room) return;
    try {
      if (room.host) {
        bcast({ t: 'closed' });
        if (room.tr) room.tr.close();
      } else if (room.conn) {
        room.conn.send({ t: 'bye' });
        room.conn.close();
      }
    } catch {}
    if (room.hb) clearInterval(room.hb);
    room = null; lobbyOpen = false;
    const ov = $('#vsOv'); if (ov) ov.hidden = true;
    API.closeGame(); setBar(false);
    unlockModal(); API.closeModal();
    if (why) API.toast(why);
    API.refreshView();
  }

  function kick(id) {
    if (!room || !room.host || id === 'host') return;
    const c = room.conns.get(id), p = player(id);
    room.banned.add(id);
    if (c) { c.send({ t: 'kick' }); setTimeout(() => c.close(), 80); }
    removePlayer(id, true);
    API.toast(T('v.removed', { n: p ? p.name : 'Player' }));
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(link()); API.toast(T('v.copied')); } catch { API.toast(link()); }
  }

  async function shareLink() {
    const text = T('v.sharetext', { c: room.code });
    try {
      if (navigator.share) { await navigator.share({ title: 'Pixaquest', text, url: link() }); return; }
    } catch { return; }
    copyLink();
  }

  /* ---------------- UI ---------------- */
  function openLobby() {
    lobbyOpen = true;
    const ov = $('#vsOv'); if (ov) ov.hidden = false;
    render();
  }

  function setBar(on) {
    const b = $('#vsbar'); if (!b) return;
    b.hidden = !on; if (on) renderBar();
  }

  function renderBar() {
    const b = $('#vsbar'); if (!b || b.hidden || !room || !room.state) return;
    b.innerHTML = room.state.players.filter((p) => p.in).map((p) =>
      `<div class="vsb ${p.status === 'done' ? 'done' : ''} ${p.id === me().id ? 'me' : ''}">
        <span class="vsav">${AVATAR.svg(p.av, 30)}</span>
        <span class="nm">${esc(p.name)}</span>
        <small>${p.status === 'done' ? T('v.finished') : esc(p.prog || T('v.playing'))}</small>
      </div>`
    ).join('');
  }

  function render() {
    renderBar(); renderBanner();
    const ov = $('#vsOv');
    if (!room || !room.state || !lobbyOpen || !ov || ov.hidden) return;
    const s = room.state, host = room.host, c = s.cfg, inGame = s.phase === 'playing';

    const players = s.players.map((p) =>
      `<li class="vsp ${p.id === me().id ? 'me' : ''}">
        <span class="vsav">${AVATAR.svg(p.av, 56)}</span>
        <span class="nm">
          <span class="nrow">${esc(p.name)}${p.id === s.hostId ? `<em>${T('v.host')}</em>` : ''}${p.id === me().id ? `<em class="you">${T('v.you')}</em>` : ''}</span>
          <small>${p.status === 'playing' ? T('v.playing2') : p.status === 'done' ? T('v.finished') : T('v.ready')}</small>
        </span>
        ${host && p.id !== 'host' ? `<button class="btn ghost sm" data-vs="kick:${p.id}" aria-label="${T('v.remove')} ${esc(p.name)}">${T('v.remove')}</button>` : ''}
      </li>`
    ).join('');

    const empty = Array.from({ length: Math.max(0, 2 - s.players.length) }, () =>
      `<li class="vsp empty"><span class="vsav ph"></span><span class="nm">${T('v.waitfriend')}<small>${T('v.sharelink')}</small></span></li>`
    ).join('');

    const gameSel = host
      ? `<select id="vsGame" aria-label="Game">${(API.GAMES || []).map((g) => `<option value="${g.id}" ${c.game === g.id ? 'selected' : ''}>${g.name}</option>`).join('')}</select>`
      : esc(gname(c.game));

    const cfg = `<div class="panel vsc"><h3>${T('v.settings')}</h3>
      <div class="vsseg" role="group" aria-label="${T('v.mode')}">
        <button class="${c.mode === 'duel' ? 'on' : ''}" data-vs="mode:duel" ${host ? '' : 'disabled'}>${T('vs.duel')}<small>${T('v.1game')}</small></button>
        <button class="${c.mode === 'trials' ? 'on' : ''}" data-vs="mode:trials" ${host ? '' : 'disabled'}>${T('vs.trials')}<small>${T('v.3games')}</small></button>
      </div>
      ${c.mode === 'duel' ? `<div class="vsrow"><span>${T('v.game')}</span>${gameSel}</div>` : `<div class="vsrow"><span>${T('v.games')}</span><span class="vsgames">${c.games.map((g) => `<b>${esc(gname(g))}</b>`).join('')}${host ? `<button class="btn ghost sm" data-vs="reroll">${T('v.reroll')}</button>` : ''}</span></div>`}
      <div class="vsrow"><span>${T('set.diff')}</span><span class="vsdiff">${['easy', 'normal', 'hard'].map((n, i) => `<button class="${c.diff === i ? 'on' : ''}" data-vs="diff:${i}" ${host ? '' : 'disabled'}>${T('diff.' + n)}</button>`).join('')}</span></div>
      <p class="meta">${T(c.mode === 'trials' ? 'v.rules3' : 'v.rules')}</p></div>`;

    const startBtn = host
      ? `<button class="btn primary lg block" data-vs="start" ${s.players.length < 2 || inGame ? 'disabled' : ''}>${inGame ? T('v.inprogress') : s.players.length < 2 ? T('v.waitplayers') : T('v.start')}</button>`
      : `<button class="btn lg block" disabled>${inGame ? T('v.inprogress') : T('v.waitstart')}</button>`;

    ov.innerHTML = `<div class="vs-shell" role="dialog" aria-modal="true" aria-label="${T('v.lobby')}">
      <div class="vs-head">
        <div>
          <p class="meta">${room.local ? T('v.localroom') : T('v.onlineroom')} · ${T('v.players', { a: s.players.length, b: MAXP })}</p>
          <h2>${T('v.room')} <span class="vscode">${esc(room.code)}</span></h2>
        </div>
        <div class="vs-actions">
          <button class="btn sm" data-vs="copy">${T('v.copy')}</button>
          <button class="btn sm" data-vs="share">${T('v.share')}</button>
          <button class="btn ghost sm" data-vs="min" aria-label="${T('v.min')}">${T('v.min')}</button>
        </div>
      </div>
      <div class="vslink"><code>${esc(link())}</code></div>
      ${isLocalhost() && !room.local ? `<p class="vswarn" role="note">${T('v.localwarn')}</p>` : ''}
      ${room.local ? `<p class="vswarn" role="note">${T('v.offline')}</p>` : ''}
      <ul class="vsplayers">${players}${empty}</ul>${cfg}${startBtn}
      <p style="margin-top:12px;text-align:center"><button class="btn ghost danger sm" data-vs="leave">${host ? T('v.closeroom') : T('v.leave')}</button></p>
    </div>`;
  }

  function renderBanner() {
    const el = $('#vsActive'); if (!el) return;
    el.innerHTML = room ? `<div class="panel vsban"><div><p class="meta">${T('v.inroom')}</p><b>${T('v.room')} ${esc(room.code)}</b> · ${T('v.nplayers', { n: room.state ? room.state.players.length : 1 })}</div><button class="btn primary sm" data-vs="open">${T('v.openlobby')}</button></div>` : '';
  }

  function onClick(e) {
    const t = e.target.closest('[data-vs]'); if (!t) return;
    const [k, v] = t.dataset.vs.split(':');
    if (k === 'copy') copyLink();
    else if (k === 'share') shareLink();
    else if (k === 'leave') leave();
    else if (k === 'min') { lobbyOpen = false; const ov = $('#vsOv'); if (ov) ov.hidden = true; API.go('versus'); }
    else if (k === 'open') openLobby();
    else if (k === 'kick') kick(v);
    else if (k === 'mode') { if (room && room.host) { room.state.cfg.mode = v; push(); } }
    else if (k === 'diff') { if (room && room.host) { room.state.cfg.diff = +v; push(); } }
    else if (k === 'reroll') { if (room && room.host) { room.state.cfg.games = pick3(); push(); } }
    else if (k === 'start') startRound();
    else if (k === 'next') { unlockModal(); API.closeModal(); startRound(); }
    else if (k === 'again') { unlockModal(); API.closeModal(); resetToLobby(); openLobby(); }
    else if (k === 'lobby') { unlockModal(); API.closeModal(); if (room && room.host) resetToLobby(); openLobby(); }
  }

  function init(api) {
    API = api;
    document.addEventListener('click', onClick);
    document.addEventListener('change', (e) => {
      if (e.target.id === 'vsGame' && room && room.host) {
        room.state.cfg.game = e.target.value; push();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lobbyOpen && !$('#vsOv')?.hidden && $('#modalOv')?.hidden && $('#gameOv')?.hidden) {
        lobbyOpen = false;
        const ov = $('#vsOv'); if (ov) ov.hidden = true;
      }
    });
    const createBtn = $('#vsCreate'); if (createBtn) createBtn.onclick = create;
    const joinF = $('#vsJoinF');
    if (joinF) {
      joinF.onsubmit = (e) => { e.preventDefault(); const c = $('#vsCode'); if (c) join(c.value); };
    }
    window.addEventListener('beforeunload', () => {
      try {
        if (room) {
          if (room.host) bcast({ t: 'closed' });
          else if (room.conn) room.conn.send({ t: 'bye' });
        }
      } catch {}
    });
  }

  function boot() {
    const p = new URLSearchParams(location.search), code = p.get('room');
    if (!code) return;
    API.go('versus');
    const inp = $('#vsCode'); if (inp) inp.value = code.toUpperCase();
    API.modal(`<p class="meta">${T('v.invite')}</p><h2>${T('v.joinq', { c: esc(code.toUpperCase()) })}</h2><div class="acts"><button class="btn primary" id="vsJoinGo">${T('v.joinroom')}</button><button class="btn ghost" data-close>${T('pre.notnow')}</button></div>`);
    const btn = $('#vsJoinGo');
    if (btn) btn.onclick = () => { API.closeModal(); join(code); };
  }

  window.VERSUS = { init, boot, render, inRoom: () => !!room, renderView: renderBanner };
})();