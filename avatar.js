/* Flat, friendly character builder. Pure SVG, no external assets.
   AVATAR.svg(av,size) -> markup   AVATAR.random(seed?) -> av   AVATAR.mountEditor(el,{av,level,onChange}) */
(function () {
  const SKINS = ['#f6d6b8', '#efc29b', '#d9a273', '#b87a4b', '#8a5a36', '#5e3b23'];
  const HAIRC = [{ c: '#2b2118' }, { c: '#5a3a22' }, { c: '#a0522d' }, { c: '#d9a441' }, { c: '#e8d8a0' }, { c: '#c7c7d0' }, { c: '#ff7aa8', lvl: 3 }, { c: '#5aa9ff', lvl: 3 }, { c: '#8b7bff', lvl: 5 }, { c: '#3dd6a5', lvl: 5 }];
  const SHIRTC = ['#d6ff3d', '#ff6b5e', '#ffb454', '#3dd6a5', '#5aa9ff', '#8b7bff', '#ff7aa8', '#f1efe9', '#2c3340', '#4fd1e0'];
  const BGC = ['#2a2f3d', '#3b2d5c', '#1f4a43', '#52301f', '#2b3e63', '#5a2b3f', '#3d4a1f', '#444b57'];
  const HAIRS = [{ n: 'Bald' }, { n: 'Short' }, { n: 'Side part' }, { n: 'Long' }, { n: 'Bun' }, { n: 'Curly', lvl: 2 }, { n: 'Mohawk', lvl: 4 }, { n: 'Pigtails', lvl: 2 }];
  const EYES = [{ n: 'Dots' }, { n: 'Wide' }, { n: 'Happy' }, { n: 'Sleepy' }, { n: 'Cool', lvl: 3 }, { n: 'Stars', lvl: 6 }, { n: 'Hearts', streak: 3 }];
  const MOUTHS = [{ n: 'Smile' }, { n: 'Grin' }, { n: 'Smirk' }, { n: 'Calm' }, { n: 'Tongue', lvl: 2 }, { n: 'Wow', lvl: 4 }, { n: 'Cat', streak: 5 }];
  const PATS = [{ n: 'Solid' }, { n: 'Stripes' }, { n: 'Dots' }, { n: 'Zigzag' }, { n: 'Checks', lvl: 4 }];
  const ACCS = [{ n: 'None' }, { n: 'Glasses' }, { n: 'Shades', lvl: 2 }, { n: 'Cap' }, { n: 'Headphones', lvl: 3 }, { n: 'Headband' }, { n: 'Crown', lvl: 10 }, { n: 'Star', lvl: 6 }, { n: 'Cat ears', lvl: 3 }, { n: 'Halo', streak: 7 }, { n: 'Horns', lvl: 8 }, { n: 'Flower' }];
  /* profile flair: frame ring, floating companion, title. Unlocks come from level or best streak. */
  const FRAMES = [{ n: 'none' }, { n: 'neon', lvl: 2 }, { n: 'aurora', lvl: 4 }, { n: 'flame', streak: 7 }, { n: 'gold', lvl: 10 }, { n: 'glitch', streak: 14 }, { n: 'galaxy', lvl: 15 }];
  const PETS = [{ n: 'none', e: '' }, { n: 'cat', e: '🐱' }, { n: 'fox', e: '🦊', lvl: 3 }, { n: 'alien', e: '👾', streak: 3 }, { n: 'octo', e: '🐙', lvl: 5 }, { n: 'dragon', e: '🐉', lvl: 12 }, { n: 'unicorn', e: '🦄', streak: 30 }];
  const TITLES = [{ n: 'rookie' }, { n: 'spark', streak: 3 }, { n: 'streaker', streak: 7 }, { n: 'sharp', lvl: 5 }, { n: 'brain', lvl: 10 }, { n: 'inferno', streak: 30 }, { n: 'legend', lvl: 25 }];
  let uid = 0;
  const dark = (hex, k = .82) => { const n = parseInt(hex.slice(1), 16); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v * k).toString(16).padStart(2, '0')).join(''); };

  function svg(av, size = 64) {
    const id = 'p' + (++uid), skin = SKINS[av.skin] || SKINS[0], hair = HAIRC[av.hairColor]?.c || HAIRC[0].c, shirt = SHIRTC[av.shirtColor] || SHIRTC[0], bg = BGC[av.bg] || BGC[0], ink = '#1c1c24';
    const pat = [
      '', `<pattern id="${id}" width="10" height="9" patternUnits="userSpaceOnUse"><rect width="10" height="4.5" fill="#fff" fill-opacity=".38"/></pattern>`,
      `<pattern id="${id}" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="4.5" cy="4.5" r="1.8" fill="#fff" fill-opacity=".45"/></pattern>`,
      `<pattern id="${id}" width="12" height="8" patternUnits="userSpaceOnUse"><path d="M0 6L3 2l3 4 3-4 3 4" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.6"/></pattern>`,
      `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#fff" fill-opacity=".3"/><rect x="5" y="5" width="5" height="5" fill="#fff" fill-opacity=".3"/></pattern>`,
    ][av.pattern] || '';
    const body = 'M16 100C16 79 31 70 50 70s34 9 34 30z';
    const back = [
      '', '', '', `<path d="M26 46C22 18 78 18 74 46L79 84C70 88 66 72 66 60H34c0 12-4 28-13 24z" fill="${hair}"/>`, '', '', '',
      `<circle cx="22" cy="56" r="8" fill="${hair}"/><circle cx="78" cy="56" r="8" fill="${hair}"/>`,
    ][av.hairStyle] || '';
    const front = [
      '',
      `<path d="M28 45C25 25 38 19 50 19s25 6 22 26c-6-9-14-13-22-13s-16 4-22 13z" fill="${hair}"/>`,
      `<path d="M28 47C23 24 44 15 59 21c11 4 16 14 13 26-6-12-22-17-34-10-4 2-8 6-10 10z" fill="${hair}"/>`,
      `<path d="M28 45C25 25 38 19 50 19s25 6 22 26c-6-9-14-13-22-13s-16 4-22 13z" fill="${hair}"/>`,
      `<path d="M28 45C25 25 38 19 50 19s25 6 22 26c-6-9-14-13-22-13s-16 4-22 13z" fill="${hair}"/><circle cx="50" cy="14" r="8" fill="${hair}"/>`,
      [[34, 26], [44, 21], [56, 21], [66, 26], [29, 36], [71, 36], [38, 30], [62, 30], [50, 24]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="${hair}"/>`).join(''),
      `<path d="M43 30C42 16 46 9 50 5c4 4 8 11 7 25z" fill="${hair}"/>`,
      `<path d="M28 45C25 25 38 19 50 19s25 6 22 26c-6-9-14-13-22-13s-16 4-22 13z" fill="${hair}"/><circle cx="24" cy="46" r="3" fill="${shirt}"/><circle cx="76" cy="46" r="3" fill="${shirt}"/>`,
    ][av.hairStyle] || '';
    const eyes = [
      `<circle cx="42" cy="47" r="2.7" fill="${ink}"/><circle cx="58" cy="47" r="2.7" fill="${ink}"/>`,
      [42, 58].map((x) => `<ellipse cx="${x}" cy="47" rx="4" ry="4.8" fill="#fff"/><circle cx="${x}" cy="48" r="2.4" fill="${ink}"/><circle cx="${x + 1}" cy="46.6" r=".9" fill="#fff"/>`).join(''),
      `<path d="M38 48q4-6 8 0M54 48q4-6 8 0" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`,
      `<path d="M38 47h8M54 47h8" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>`,
      `<rect x="38" y="44" width="8" height="5" rx="2" fill="${ink}"/><rect x="54" y="44" width="8" height="5" rx="2" fill="${ink}"/>`,
      [42, 58].map((x) => `<path d="M${x} 41.500l1.600 3.300 3.600.5-2.600 2.500.6 3.600-3.200-1.700-3.200 1.700.6-3.600-2.600-2.500 3.600-.5z" fill="#f2d45c" stroke="${ink}" stroke-width="1"/>`).join(''),
      [42, 58].map((x) => `<path d="M${x} 51c-7-4.500-6-10 -2.200-10 1.600 0 2.200 1 2.200 1s.6-1 2.200-1C${x + 6} 41 ${x + 7} 46.500 ${x} 51z" fill="#ff5d7a"/>`).join(''),
    ][av.eyes] || '';
    const mouth = [
      `<path d="M43 57q7 7 14 0" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`,
      `<path d="M42 56q8 13 16 0z" fill="#5b1f2a"/><path d="M44 56h12v2.5H44z" fill="#fff"/>`,
      `<path d="M44 59q8 3 14-4" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`,
      `<path d="M44 59h12" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>`,
      `<path d="M43 57q7 7 14 0" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="50" cy="63" rx="3.4" ry="3.8" fill="#ff7aa8"/>`,
      `<ellipse cx="50" cy="59" rx="3.600" ry="4.600" fill="#5b1f2a"/>`,
      `<path d="M42 57q4 5 8 0q4 5 8 0" fill="none" stroke="${ink}" stroke-width="2.200" stroke-linecap="round"/>`,
    ][av.mouth] || '';
    const acc = [
      '',
      `<g fill="none" stroke="${ink}" stroke-width="2"><circle cx="42" cy="47" r="7"/><circle cx="58" cy="47" r="7"/><path d="M49 47h2"/></g>`,
      `<g fill="${ink}"><rect x="34" y="42" width="15" height="10" rx="4"/><rect x="51" y="42" width="15" height="10" rx="4"/><rect x="48" y="45" width="4" height="2"/></g>`,
      `<path d="M27 40C27 18 73 18 73 40z" fill="${shirt}"/><path d="M24 40h40a3 3 0 010 6H24z" fill="${dark(shirt, .8)}"/>`,
      `<path d="M28 48C25 14 75 14 72 48" fill="none" stroke="#2a2f3a" stroke-width="4" stroke-linecap="round"/><rect x="22" y="44" width="9" height="16" rx="4" fill="${shirt}"/><rect x="69" y="44" width="9" height="16" rx="4" fill="${shirt}"/>`,
      `<path d="M28 35C40 28 60 28 72 35v5C60 34 40 34 28 40z" fill="${shirt}"/>`,
      `<path d="M33 25L36 8l9 11 5-13 5 13 9-11 3 17z" fill="#f2d45c" stroke="#d9a441" stroke-width="1"/>`,
      `<path d="M63 52l1.6 3.4 3.6.4-2.7 2.5.8 3.6-3.3-1.9-3.3 1.9.8-3.6-2.7-2.5 3.6-.4z" fill="#f2d45c"/>`,
      `<path d="M29 32L27 12l15 11zM71 32l2-20-15 11z" fill="${hair}" stroke="${dark(hair, .7)}" stroke-width="1.500" stroke-linejoin="round"/><path d="M31 27l-1-9 7 5zM69 27l1-9-7 5z" fill="#ff9ec0"/>`,
      `<ellipse cx="50" cy="12" rx="17" ry="5" fill="none" stroke="#ffe27a" stroke-width="3.500"/><ellipse cx="50" cy="12" rx="17" ry="5" fill="none" stroke="#fff6c9" stroke-opacity=".6" stroke-width="1"/>`,
      `<path d="M30 30C20 22 22 10 28 6c0 8 6 12 10 14zM70 30c10-8 8-20 2-24 0 8-6 12-10 14z" fill="#ff5d4a" stroke="#b92c1c" stroke-width="1.200" stroke-linejoin="round"/>`,
      `<g transform="translate(66 28)"><g fill="#ff7aa8">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(Math.cos(a * Math.PI / 180) * 5).toFixed(1)}" cy="${(Math.sin(a * Math.PI / 180) * 5).toFixed(1)}" r="3.600" />`).join('')}</g><circle r="2.800" fill="#f2d45c"/></g>`,
    ][av.acc] || '';
    return `<svg class="avsvg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${(window.I18N ? I18N.t('av.label') : 'Character')}"><defs>${pat}<clipPath id="${id}c"><rect width="100" height="100" rx="24"/></clipPath></defs>
      <g clip-path="url(#${id}c)"><rect width="100" height="100" fill="${bg}"/>
      ${back}<path d="${body}" fill="${shirt}"/>${pat ? `<path d="${body}" fill="url(#${id})"/>` : ''}
      <rect x="44" y="60" width="12" height="14" rx="4" fill="${dark(skin, .88)}"/>
      <circle cx="29" cy="49" r="4.2" fill="${skin}"/><circle cx="71" cy="49" r="4.2" fill="${skin}"/>
      <ellipse cx="50" cy="46" rx="21" ry="23" fill="${skin}"/>
      <circle cx="38" cy="55" r="4" fill="#ff7aa8" fill-opacity=".22"/><circle cx="62" cy="55" r="4" fill="#ff7aa8" fill-opacity=".22"/>
      ${front}<g class="blink">${eyes}</g>${mouth}${acc}</g></svg>`;
  }

  const lockOf = (o, ctx) => (o.lvl && ctx.level < o.lvl ? { lvl: o.lvl } : o.streak && ctx.streak < o.streak ? { streak: o.streak } : null);
  const T = (k, v) => (window.I18N ? I18N.t(k, v) : k);
  const pet = (av) => (PETS[av.pet] && PETS[av.pet].e) || '';
  const pname = (o) => T('av.o.' + o.n.toLowerCase().replace(/ /g, ''));
  /* every lockable thing, for "next unlock" teasers and level-up summaries. ctx = {level, streak(best)} */
  function unlocks(ctx) {
    const out = [];
    const add = (list, kind, label) => list.forEach((o) => { if (o.lvl || o.streak) out.push({ kind, name: label(o), lvl: o.lvl, streak: o.streak, locked: !!lockOf(o, ctx), left: o.lvl ? o.lvl - ctx.level : o.streak - ctx.streak }); });
    add(EYES, 'eyes', pname); add(MOUTHS, 'mouth', pname); add(ACCS, 'acc', pname); add(HAIRS, 'hair', pname); add(HAIRC, 'haircolor', (o) => T('av.haircolor'));
    add(FRAMES, 'frame', (o) => T('av.f.' + o.n)); add(PETS, 'pet', (o) => T('av.p.' + o.n)); add(TITLES, 'title', (o) => T('ti.' + o.n));
    return out;
  }
  /* avatar + frame ring + companion. opts: {ring:0-100 xp progress, live:true to animate} */
  function framed(av, size = 64, opts = {}) {
    const f = (FRAMES[av.frame] || FRAMES[0]).n, p = pet(av), ring = opts.ring;
    return `<span class="avf fr-${f}${opts.live ? ' live' : ''}" style="--sz:${size}px${ring != null ? `;--ring:${ring}` : ''}">${svg(av, size)}${p ? `<span class="pet" aria-hidden="true">${p}</span>` : ''}</span>`;
  }

  const rint = (n, rnd) => Math.floor(rnd() * n);
  const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  function random(seed) {
    let a = seed === undefined ? (Math.random() * 4294967296) >>> 0 : hash(seed);
    const rnd = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const free = (arr) => { const ok = arr.map((x, i) => (x.lvl || x.streak ? -1 : i)).filter((i) => i >= 0); return ok[rint(ok.length, rnd)]; };
    return { skin: rint(SKINS.length, rnd), hairStyle: free(HAIRS), hairColor: free(HAIRC), eyes: free(EYES), mouth: free(MOUTHS), shirtColor: rint(SHIRTC.length, rnd), pattern: free(PATS), acc: rnd() < .45 ? 0 : free(ACCS), bg: rint(BGC.length, rnd) };
  }

  const LOCK = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';
  function mountEditor(el, { av, level, streak = 0, onChange, t }) {
    const ctx = { level, streak }; let rolled = false;
    const T = t || ((k) => k), oname = (o) => (o.n ? T('av.o.' + o.n.toLowerCase().replace(/ /g, '')) : '');
    const set = (k, v) => { av[k] = v; onChange(av); draw(); };
    const group = (title, key, list, render) => `<div class="avg"><h4>${title}</h4><div class="avrow">${list.map((o, i) => {
      const lk = lockOf(o, ctx), locked = !!lk, why = lk ? (lk.lvl ? T('av.locked', { n: lk.lvl }) : T('av.lockedS', { n: lk.streak })) : '';
      return `<button type="button" class="avopt ${(av[key] || 0) === i ? 'on' : ''}" data-k="${key}" data-i="${i}" ${locked ? 'disabled' : ''} aria-pressed="${(av[key] || 0) === i}" aria-label="${title}: ${(o.label || oname(o)) || i + 1}${locked ? ' (' + why + ')' : ''}" title="${locked ? why : (o.label || oname(o))}">${render(i, o)}${locked ? `<span class="lk">${lk.lvl ? LOCK : '<span class="fl">🔥</span>'}<i>${lk.lvl || lk.streak}</i></span>` : ''}</button>`;
    }).join('')}</div></div>`;
    const sw = (c) => `<span class="sw2" style="background:${c}"></span>`;
    const prev = (key) => (i) => svg({ ...av, [key]: i }, 44);
    function draw() {
      const ft = (n) => T('av.f.' + n), ring = (n) => `<span class="avf fr-${n} mini"><i></i></span>`;
      el.innerHTML = `<div class="avedit"><div class="avbig${rolled ? ' roll' : ''}">${framed(av, 168, { live: true })}<div class="avbtns"><button type="button" class="btn sm dice" data-rand><span aria-hidden="true">🎲</span> ${T('av.random')}</button></div></div>
        <div class="avctl">
          ${group(T('av.frame'), 'frame', FRAMES.map((f) => ({ ...f, label: ft(f.n) })), (i) => ring(FRAMES[i].n))}
          ${group(T('av.pet'), 'pet', PETS.map((f) => ({ ...f, label: T('av.p.' + f.n) })), (i) => `<span class="emo">${PETS[i].e || '∅'}</span>`)}
          ${group(T('av.title'), 'title', TITLES.map((f) => ({ ...f, label: T('ti.' + f.n) })), (i) => `<span class="ttl">${T('ti.' + TITLES[i].n)}</span>`)}
          ${group(T('av.skin'), 'skin', SKINS.map(() => ({})), (i) => sw(SKINS[i]))}
          ${group(T('av.hair'), 'hairStyle', HAIRS, prev('hairStyle'))}
          ${group(T('av.haircolor'), 'hairColor', HAIRC.map((h) => ({ lvl: h.lvl })), (i) => sw(HAIRC[i].c))}
          ${group(T('av.eyes'), 'eyes', EYES, prev('eyes'))}
          ${group(T('av.mouth'), 'mouth', MOUTHS, prev('mouth'))}
          ${group(T('av.pattern'), 'pattern', PATS, prev('pattern'))}
          ${group(T('av.shirt'), 'shirtColor', SHIRTC.map(() => ({})), (i) => sw(SHIRTC[i]))}
          ${group(T('av.extras'), 'acc', ACCS, prev('acc'))}
          ${group(T('av.bg'), 'bg', BGC.map(() => ({})), (i) => sw(BGC[i]))}
        </div></div>`; rolled = false;
    }
    el.onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.rand !== undefined) { const keep = { frame: av.frame, pet: av.pet, title: av.title }; Object.assign(av, random(), keep); rolled = true; onChange(av); draw(); }
      else if (b.dataset.k) set(b.dataset.k, +b.dataset.i);
    };
    draw();
  }

  window.AVATAR = { svg, framed, random, mountEditor, hash, unlocks, lockOf, FRAMES, PETS, TITLES, pet };
})();
