// Runs in <head> before the page paints: marks JS as available and picks the language,
// so the page never flashes the wrong language. English unless the visitor chose otherwise.
(function () {
  var d = document.documentElement, l = null, ok = { en: 1, pt: 1, es: 1 };
  d.classList.add('js');
  try { l = new URLSearchParams(location.search).get('lang'); } catch (e) {}
  if (ok[l]) { try { localStorage.setItem('ptp:lang', l); } catch (e) {} }
  try { if (!ok[l]) l = localStorage.getItem('ptp:lang'); } catch (e) {}
  if (!ok[l]) l = 'en';
  d.lang = l === 'pt' ? 'pt-BR' : l;
})();
