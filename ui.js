// UI polish: sliding nav pill, header state, card spotlight/tilt, scroll reveal. Purely visual; no app logic.
(() => {
  const tabs = document.getElementById('tabs'), top = document.querySelector('.top');
  const pill = () => {
    const on = tabs && tabs.querySelector('button.on'); if (!on) return;
    tabs.style.setProperty('--ix', on.offsetLeft + 'px'); tabs.style.setProperty('--iw', on.offsetWidth + 'px'); tabs.style.setProperty('--io', 1);
  };
  if (tabs) {
    new MutationObserver(pill).observe(tabs, { subtree: true, attributes: true, attributeFilter: ['class'] });
    if (window.ResizeObserver) { const ro = new ResizeObserver(pill); ro.observe(tabs); tabs.querySelectorAll('button').forEach((b) => ro.observe(b)); }
    addEventListener('resize', pill); addEventListener('load', pill); document.fonts && document.fonts.ready.then(pill);
    new MutationObserver(() => requestAnimationFrame(pill)).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] });
    pill(); setTimeout(pill, 300);
  }
  const onScroll = () => top && top.classList.toggle('stuck', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // spotlight + tilt follow the pointer (delegated, survives re-renders)
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (fine) document.addEventListener('pointermove', (e) => {
    const c = e.target.closest && e.target.closest('.gcard'); if (!c) return;
    const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    c.style.setProperty('--mx', x + 'px'); c.style.setProperty('--my', y + 'px');
    c.style.setProperty('--ry', ((x / r.width - .5) * 7).toFixed(2) + 'deg'); c.style.setProperty('--rx', ((.5 - y / r.height) * 7).toFixed(2) + 'deg');
  }, { passive: true });
  document.addEventListener('pointerout', (e) => { const c = e.target.closest && e.target.closest('.gcard'); if (c && !c.contains(e.relatedTarget)) { c.style.removeProperty('--rx'); c.style.removeProperty('--ry'); } });

  // staggered scroll reveal for dynamically rendered cards/panels
  if (!('IntersectionObserver' in window)) { document.documentElement.classList.add('rv-off'); return; }
  const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -6% 0px' });
  const SEL = '.gcard,.tcard,.panel,.deal,.mile,.rung,.board li,.stats div,.best';
  const scan = () => {
    document.querySelectorAll(SEL).forEach((el) => {
      if (el.dataset.rv || el.closest('.overlay')) return; el.dataset.rv = 1;
      const sib = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
      el.style.setProperty('--i', Math.min(sib, 10)); el.classList.add('rv'); io.observe(el);
    });
  };
  new MutationObserver(() => requestAnimationFrame(scan)).observe(document.getElementById('main'), { childList: true, subtree: true });
  scan();
})();
