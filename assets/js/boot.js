/* boot.js — roda antes da página aparecer na tela.
   1. Marca que o JavaScript funciona (class="js" na página), para o CSS saber.
   2. Escolhe o idioma, para a página nunca piscar no idioma errado:
      - se o endereço tiver ?lang=pt (ou en, es), usa esse e guarda a escolha;
      - senão, usa a escolha guardada da última visita (chave "ptp:lang");
      - senão, inglês. (De propósito não segue o idioma do navegador.)
   Escrito em JavaScript antigo (var, function) para funcionar até em navegadores velhos. */
(function () {
  var d = document.documentElement, l = null, ok = { en: 1, pt: 1, es: 1 };
  d.classList.add('js');
  try { l = new URLSearchParams(location.search).get('lang'); } catch (e) {}
  if (ok[l]) { try { localStorage.setItem('ptp:lang', l); } catch (e) {} }
  try { if (!ok[l]) l = localStorage.getItem('ptp:lang'); } catch (e) {}
  if (!ok[l]) l = 'en';
  d.lang = l === 'pt' ? 'pt-BR' : l;
})();
