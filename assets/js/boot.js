// Runs in <head> before the page paints: marks JS as available and picks the language,
// so the page never flashes the wrong language.
(function () {
  var d = document.documentElement, l = null;
  d.classList.add('js');
  try { l = new URLSearchParams(location.search).get('lang'); } catch (e) {}
  if (l === 'en' || l === 'pt') { try { localStorage.setItem('ptp:lang', l); } catch (e) {} }
  try { if (l !== 'en' && l !== 'pt') l = localStorage.getItem('ptp:lang'); } catch (e) {}
  if (l !== 'en' && l !== 'pt') l = /^pt/i.test(navigator.language || '') ? 'pt' : 'en';
  d.lang = l === 'pt' ? 'pt-BR' : 'en';
})();
