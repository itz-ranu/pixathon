/* Theme: 'system' | 'light' | 'dark'. Loaded in <head> (blocking) so the right palette paints first.
   <html data-theme> always holds the resolved value; the saved choice lives in localStorage. */
(function () {
  const K = 'pixaquest.theme', mq = matchMedia('(prefers-color-scheme: light)'), root = document.documentElement;
  const read = () => { try { const v = localStorage.getItem(K); return v === 'light' || v === 'dark' ? v : 'system'; } catch { return 'system'; } };
  let pref = read();
  const resolve = () => (pref === 'system' ? (mq.matches ? 'light' : 'dark') : pref);
  function apply(animate) {
    const r = resolve();
    if (animate === true && !matchMedia('(prefers-reduced-motion: reduce)').matches) { root.classList.add('theme-anim'); setTimeout(() => root.classList.remove('theme-anim'), 380); } root.dataset.theme = r; root.dataset.pref = pref;
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = r === 'light' ? '#f6f5f1' : '#0e1013';
    if (THEME.onchange) THEME.onchange(pref, r);
  }
  const THEME = {
    get pref() { return pref; }, get resolved() { return resolve(); },
    set(p) { pref = p === 'light' || p === 'dark' ? p : 'system'; try { pref === 'system' ? localStorage.removeItem(K) : localStorage.setItem(K, pref); } catch {} apply(true); },
    toggle() { THEME.set(resolve() === 'light' ? 'dark' : 'light'); },
    onchange: null,
  };
  window.THEME = THEME;
  mq.addEventListener('change', () => { if (pref === 'system') apply(true); });
  // early language direction so RTL pages do not flash LTR
  try { const l = localStorage.getItem('pixaquest.lang'); if (l) { root.lang = l; if (l === 'ar') root.dir = 'rtl'; } } catch {}
  root.dataset.theme = resolve(); root.dataset.pref = pref;
  document.addEventListener('DOMContentLoaded', () => apply(), { once: true });
})();
