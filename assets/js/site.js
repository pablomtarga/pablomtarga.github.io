/* =============================================================================
   PT Solutions · Pablo Targa — comportamento do site (todas as páginas usam este arquivo)

   O que este arquivo faz, na ordem em que aparece:
    1. Configuração (chave do formulário e LinkedIn)  ← o que você talvez queira trocar
    2. Ferramentas pequenas usadas pelo resto
    3. Idioma: troca entre EN / PT / ES e lembra a escolha
    4. Links que abrem outra aba avisam isso a leitores de tela
    5. Menu do celular (botão ≡)
    6. Ao rolar: cor da barra do topo, zoom da foto do A'DAM, crédito da foto
    7. Link da barra do topo marcado conforme a seção visível
    8. Botão "Contact me" com as opções LinkedIn ou formulário
    9. Gavetas "More skills" e "Curiosities" abrindo devagar
   10. Fotos ampliadas (galeria)
   11. Vídeo do Iron (página de Apps)
   12. Abas dos agentes de IA (página de Apps)
   13. Cartão de serviço ou link ?topic= → formulário com o assunto já escolhido
   14. Formulário de contato (envia pelo Web3Forms)

   Não usa nenhuma biblioteca. Mudou este arquivo? Suba o "?v=" nas páginas
   (ou rode FERRAMENTAS/nova-versao.py).
   Por segurança (CSP), nunca use innerHTML: crie elementos como em spans3() abaixo.
   ============================================================================= */
(() => {
  'use strict';

  /* == 1. Configuração ========================================================= */
  const CONFIG = {
    // chave do Web3Forms, o serviço que entrega o formulário no e-mail do Pablo.
    // Ela pode ficar à vista: não revela o e-mail, que fica guardado no Web3Forms.
    // Para receber em outro e-mail, crie uma chave nova em web3forms.com e troque aqui.
    formKey: '470607c5-9f63-4436-9844-d2914566b308',
    // endereço do Web3Forms. Se mudar, mude também o connect-src do CSP no index.html.
    formUrl: 'https://api.web3forms.com/submit',
    // hCaptcha ("I am human"), exigido pelo Web3Forms. Esta é a chave pública que o
    // Web3Forms dá para o plano grátis (não é sua e não revela nada).
    captchaKey: '50b2fe65-b00b-4b9e-ad62-3ba471098be2',
    captchaUrl: 'https://js.hcaptcha.com/1/api.js?render=explicit&recaptchacompat=off',
    linkedIn: 'https://www.linkedin.com/in/pablomtarga',
    // prefixo das informações guardadas no navegador (hoje só o idioma: "ptp:lang")
    storagePrefix: 'ptp:'
  };

  /* == 2. Ferramentas pequenas usadas pelo resto =============================== */
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);            // acha um elemento
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];   // acha todos
  const reduce = matchMedia('(prefers-reduced-motion: reduce)'); // visitante pediu menos animação?
  const onChange = (mq, fn) => (mq.addEventListener ? mq.addEventListener('change', fn) : mq.addListener(fn));
  // guarda e lê do navegador sem quebrar no modo anônimo (que às vezes bloqueia)
  const store = {
    get(k) { try { return localStorage.getItem(CONFIG.storagePrefix + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(CONFIG.storagePrefix + k, v); } catch (e) { /* modo anônimo */ } }
  };

  /* == 3. Idioma: EN / PT / ES ================================================= */
  // O boot.js já escolheu o idioma antes da página aparecer. Aqui ficam a troca
  // pelos botões e os textos que não estão em <span class="en/pt/es">.
  const TAG = { en: 'en', pt: 'pt-BR', es: 'es' };
  const lang = () => ({ 'pt-BR': 'pt', es: 'es' }[root.lang] || 'en');
  // escolhe o texto do idioma atual: say3({ en: 'Hi', pt: 'Oi', es: 'Hola' })
  const say3 = (o) => o[lang()];
  const cap = (l) => l[0].toUpperCase() + l.slice(1);
  function setLang(l, save) {
    root.lang = TAG[l] || 'en';
    // título da aba e descrição para o Google: cada página guarda os três no <body>
    // (data-title-en, data-title-pt, data-title-es e o mesmo para data-desc-...)
    const title = document.body.dataset['title' + cap(l)];
    const desc = document.body.dataset['desc' + cap(l)];
    if (title) document.title = title;
    const d = $('meta[name="description"]');
    if (d && desc) d.setAttribute('content', desc);
    // elementos com data-en / data-pt / data-es: opções da lista, rótulos para leitor
    // de tela (aria-label) e descrições de imagens (alt)
    $$('[data-en]').forEach((el) => {
      const v = el.dataset[l] || el.dataset.en;
      const attr = el.dataset.attr;
      if (attr) { if (attr === 'aria-label' || attr === 'alt') el.setAttribute(attr, v); }
      else el.textContent = v;
    });
    $$('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
    if (save) {
      store.set('lang', l);
      // um ?lang= no endereço passaria por cima da escolha na próxima visita
      if (location.search.includes('lang=')) history.replaceState(null, '', location.pathname + location.hash);
    }
    // avisa as outras partes (ex.: a foto ampliada atualiza o local no novo idioma)
    document.dispatchEvent(new Event('langchange'));
  }
  setLang(lang());
  $$('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang, true)));

  // cria <span class="en">…</span><span class="pt">…</span><span class="es">…</span>
  // sem innerHTML (a segurança do site, CSP, bloqueia innerHTML)
  const spans3 = (o, wrap) => {
    const box = wrap || document.createElement('span');
    Object.entries(o).forEach(([cls, text]) => {
      const s = document.createElement('span');
      s.className = cls;
      s.append(...(Array.isArray(text) ? text : [text]));
      box.append(s);
    });
    return box;
  };

  /* == 4. Links que abrem outra aba avisam isso a leitores de tela ============= */
  $$('a[target="_blank"]').forEach((a) => {
    if ($('.newtab', a)) return;
    const note = spans3({ en: ' (opens in a new tab)', pt: ' (abre em outra aba)', es: ' (se abre en otra pestaña)' });
    note.className = 'sr-only newtab';
    a.append(note);
  });

  /* == 5. Menu do celular (botão ≡) ============================================ */
  const menuBtn = $('.menu-btn');
  const menu = $('#menu');
  // com o menu aberto, o resto da página fica "inerte" (o teclado não sai do menu)
  const behind = $$('.skip, main, footer');
  function closeMenu(focusBtn) {
    if (!menu || menu.hidden) return;
    menuBtn.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
    root.classList.remove('menu-open');
    behind.forEach((el) => { el.inert = false; });
    if (focusBtn) menuBtn.focus({ preventScroll: true });
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => {
      if (!menu.hidden) return closeMenu();
      menuBtn.setAttribute('aria-expanded', 'true');
      menu.hidden = false;
      root.classList.add('menu-open');
      behind.forEach((el) => { el.inert = true; });
      const first = $('a', menu);
      if (first) first.focus({ preventScroll: true });
    });
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(true); });
    // se a tela ficar larga (ex.: girar o tablet), fecha o menu
    onChange(matchMedia('(min-width: 834px)'), (e) => { if (e.matches) closeMenu(); });
  }

  /* == 6. Ao rolar a página ==================================================== */
  // a) a barra do topo fica escura sobre seções escuras (class="dark") e clara nas outras
  // b) a foto do A'DAM aproxima e escurece: o número --p vai de 0 (topo) a 1 (fim dos serviços)
  // c) o crédito da foto some aos poucos (só no computador; no celular ele fica mais abaixo)
  const nav = $('.nav');
  const zones = $$('main > *, footer');
  const stage = $('.stage');
  const stageBg = $('.stage__bg');
  const credit = $('.hero__credit');
  const wide = matchMedia('(min-width: 834px)');
  let queued = false;
  const paint = () => {
    queued = false;
    if (nav) {
      const y = nav.offsetHeight / 2;
      const under = zones.find((z) => { const r = z.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
      const theme = under && !under.matches('.dark') ? 'light' : 'dark';
      if (root.dataset.nav !== theme) root.dataset.nav = theme;
    }
    if (stage && stageBg && !reduce.matches) {
      const r = stage.getBoundingClientRect();
      const run = r.height - innerHeight;
      const p = run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 0;
      stageBg.style.setProperty('--p', p.toFixed(3));
    }
    if (credit) credit.style.opacity = wide.matches ? Math.max(0, 1 - scrollY / 160).toFixed(2) : '';
  };
  // no máximo uma atualização por quadro de tela, para a rolagem não travar
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  onChange(reduce, () => { if (stageBg) stageBg.style.removeProperty('--p'); queue(); });
  paint();

  /* == 7. Link da barra do topo marcado conforme a seção visível =============== */
  const navLinks = $$('.nav__link');
  if ('IntersectionObserver' in window && navLinks.length) {
    const byId = new Map(navLinks.filter((a) => a.getAttribute('href').startsWith('#')).map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        byId.forEach((x) => x.removeAttribute('aria-current'));
        const a = byId.get(e.target.id);
        if (a) a.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => spy.observe(s));
  }

  /* == 8. "Contact me" com as opções LinkedIn ou formulário ==================== */
  // O menu abre pelo CSS (mouse em cima ou foco do teclado). Aqui: Esc fecha, e
  // escolher uma opção fecha também.
  $$('.cta-menu').forEach((m) => {
    const reopen = () => m.classList.remove('is-closed');
    m.addEventListener('keydown', (e) => { if (e.key === 'Escape') m.classList.add('is-closed'); });
    m.addEventListener('click', (e) => {
      const choice = e.target.closest('.cta-menu__pop a');
      if (!choice) return;
      m.classList.add('is-closed');
      choice.blur();
    });
    m.addEventListener('pointerleave', reopen);
    m.addEventListener('focusout', (e) => { if (!m.contains(e.relatedTarget)) reopen(); });
  });

  /* == 9. Gavetas abrindo e fechando devagar =================================== */
  // Sem este código as gavetas (<details>) abririam de uma vez. Clicar de novo no
  // meio do movimento inverte a partir de onde está, sem pulo. Vale também para o
  // botão "Tools" de cada emprego (details.toolbox).
  $$('details.drawer, details.toolbox').forEach((d) => {
    const sum = $('summary', d);
    const body = sum.nextElementSibling;
    let anim = null;
    sum.addEventListener('click', (e) => {
      if (reduce.matches || typeof d.animate !== 'function') return;
      e.preventDefault();
      const opening = !d.open || d.classList.contains('is-closing');
      const start = d.getBoundingClientRect().height;
      if (anim) anim.cancel();
      d.classList.toggle('is-closing', !opening);
      if (opening) d.open = true;
      const end = opening ? sum.offsetHeight + body.offsetHeight : sum.offsetHeight;
      d.style.overflow = 'hidden';
      // 520 e 380 = duração em milissegundos para abrir e para fechar
      anim = d.animate({ height: [`${start}px`, `${end}px`] }, { duration: opening ? 520 : 380, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' });
      if (opening) body.animate({ opacity: [0, 1], transform: ['translateY(-10px)', 'none'] }, { duration: 420, delay: 80, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' });
      anim.onfinish = () => {
        anim = null;
        d.style.overflow = '';
        if (!opening) { d.open = false; d.classList.remove('is-closing'); }
      };
    });
  });

  /* == 10. Fotos ampliadas (galeria) =========================================== */
  // Cada foto da grade é um botão com data-full (endereço da foto grande) e
  // data-place-en / -pt / -es (o local). A foto grande só baixa quando é aberta.
  const box = $('#lightbox');
  const shots = $$('.ph');
  if (box && shots.length && typeof box.showModal === 'function') {
    const img = $('.lightbox__img', box);
    const where = $('.lightbox__where', box);
    const count = $('.lightbox__count', box);
    let at = 0;
    const show = (i, swap) => {
      at = (i + shots.length) % shots.length;
      const thumb = $('img', shots[at]);
      img.classList.add('is-loading');
      img.src = shots[at].dataset.full || thumb.currentSrc || thumb.src;
      img.alt = thumb.alt;
      where.textContent = shots[at].dataset['place' + cap(lang())] || shots[at].dataset.placeEn;
      count.textContent = `${at + 1} / ${shots.length}`;
      if (swap) { img.classList.remove('is-swapping'); void img.offsetWidth; img.classList.add('is-swapping'); }
    };
    img.addEventListener('load', () => img.classList.remove('is-loading'));
    shots.forEach((b, i) => b.addEventListener('click', () => { show(i); box.showModal(); }));
    $('.lb-prev', box).addEventListener('click', () => show(at - 1, true));
    $('.lb-next', box).addEventListener('click', () => show(at + 1, true));
    $('.lb-close', box).addEventListener('click', () => box.close());
    // clicar na área escura em volta da foto fecha
    box.addEventListener('click', (e) => { if (e.target === box) box.close(); });
    // setas do teclado passam as fotos (Esc fecha sozinho, é do próprio <dialog>)
    box.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(at - 1, true); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(at + 1, true); }
    });
    // no celular, arrastar para o lado passa a foto
    let startX = null;
    box.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') startX = e.clientX; });
    box.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) show(at + (dx < 0 ? 1 : -1), true);
    });
    // ao fechar, o foco volta para a foto que estava aberta
    box.addEventListener('close', () => { shots[at].focus({ preventScroll: true }); });
    document.addEventListener('langchange', () => { if (box.open) show(at); });
  }

  /* == 11. Vídeo do Iron (página de Apps) ====================================== */
  // Toca só enquanto aparece na tela. Não toca sozinho para quem pediu menos
  // animação ou está economizando dados. O botão pausa e retoma.
  $$('.clip').forEach((clipBox) => {
    const clip = $('video', clipBox);
    const clipBtn = $('.clip-btn', clipBox);
    if (!clip) return;
    const saveData = !!(navigator.connection && navigator.connection.saveData);
    let visible = false;
    let userPaused = reduce.matches || saveData;
    const label = () => {
      if (!clipBtn) return;
      const playing = !clip.paused;
      clipBtn.dataset.en = playing ? 'Pause video' : 'Play video';
      clipBtn.dataset.pt = playing ? 'Pausar vídeo' : 'Reproduzir vídeo';
      clipBtn.dataset.es = playing ? 'Pausar vídeo' : 'Reproducir vídeo';
      clipBtn.setAttribute('aria-label', clipBtn.dataset[lang()]);
      clipBtn.classList.toggle('is-paused', !playing);
    };
    const sync = () => {
      if (userPaused || !visible) clip.pause();
      else clip.play().catch(() => { /* navegador bloqueou: fica a imagem de capa */ });
    };
    clip.addEventListener('play', label);
    clip.addEventListener('pause', label);
    if (clipBtn) clipBtn.addEventListener('click', () => { userPaused = !clip.paused; if (!userPaused) visible = true; sync(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: 0.15 }).observe(clip);
    } else { visible = true; sync(); }
    onChange(reduce, () => { userPaused = reduce.matches; sync(); });
    label();
  });

  /* == 12. Abas dos agentes de IA (página de Apps) ============================= */
  // Clique ou setas ← → / Home / End trocam a aba.
  const chips = $$('.chip');
  function pick(chip, focus) {
    chips.forEach((c) => {
      const on = c === chip;
      c.setAttribute('aria-selected', String(on));
      c.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(c.getAttribute('aria-controls'));
      if (panel) panel.classList.toggle('is-on', on);
    });
    if (focus) { chip.focus(); chip.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce.matches ? 'auto' : 'smooth' }); }
  }
  chips.forEach((c, i) => {
    c.addEventListener('click', () => pick(c));
    c.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (step) { e.preventDefault(); pick(chips[(i + step + chips.length) % chips.length], true); }
      else if (e.key === 'Home') { e.preventDefault(); pick(chips[0], true); }
      else if (e.key === 'End') { e.preventDefault(); pick(chips[chips.length - 1], true); }
    });
  });

  /* == 13. Cartão de serviço ou link ?topic= → formulário com o assunto escolhido = */
  // data-topic no cartão precisa ser igual a um value da lista <select id="f-topic">
  $$('.svc__link[data-topic]').forEach((a) => a.addEventListener('click', () => {
    const topic = $('#f-topic');
    if (topic) topic.value = a.dataset.topic;
  }));
  // links de outras páginas fazem o mesmo pelo endereço: index.html?topic=design#contact
  const topicSelect = $('#f-topic');
  const topicAsked = new URLSearchParams(location.search).get('topic');
  if (topicSelect && topicAsked && [...topicSelect.options].some((o) => o.value === topicAsked)) topicSelect.value = topicAsked;

  /* == 14. Formulário de contato =============================================== */
  // Envia a mensagem pelo Web3Forms (serviço de formulários), que repassa para o
  // e-mail do Pablo. O endereço dele não aparece no site: fica guardado no Web3Forms,
  // ligado à chave CONFIG.formKey. O e-mail de quem escreve vira o "Responder para"
  // da mensagem, então basta clicar em Responder no app de e-mail.
  const form = $('#contact-form');
  if (form) {
    const note = $('.form__note', form);
    const btn = $('button[type="submit"]', form);
    const noteStart = [...note.childNodes].map((n) => n.cloneNode(true));
    const btnStart = [...btn.childNodes].map((n) => n.cloneNode(true));
    const linkedIn = () => {
      const a = document.createElement('a');
      a.href = CONFIG.linkedIn;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'LinkedIn';
      return a;
    };
    // troca o aviso embaixo do botão: 'ok' fica verde, 'err' fica vermelho
    const show = (state, texts) => {
      note.replaceChildren();
      spans3(texts, note);
      note.dataset.state = state;
    };
    const resetNote = () => { if (note.dataset.state) { note.replaceChildren(...noteStart.map((n) => n.cloneNode(true))); delete note.dataset.state; } };
    const sent = (name, email) => show('ok', {
      en: [`Thanks, ${name}. Your message is on its way, and I’ll reply to ${email}.`],
      pt: [`Obrigado, ${name}. Sua mensagem foi enviada, e eu respondo no ${email}.`],
      es: [`Gracias, ${name}. Tu mensaje está enviado, y te respondo a ${email}.`]
    });
    const failed = (tooMany) => show('err', tooMany ? {
      en: ['Too many tries in a row. Wait a minute and try again, or message me on ', linkedIn(), '.'],
      pt: ['Muitas tentativas seguidas. Espere um minuto e tente de novo, ou me chame no ', linkedIn(), '.'],
      es: ['Demasiados intentos seguidos. Espera un minuto y vuelve a intentarlo, o escríbeme por ', linkedIn(), '.']
    } : {
      en: ['Your message wasn’t sent. Check your connection and try again, or message me on ', linkedIn(), '.'],
      pt: ['A mensagem não foi enviada. Confira a conexão e tente de novo, ou me chame no ', linkedIn(), '.'],
      es: ['El mensaje no se ha enviado. Revisa tu conexión y vuelve a intentarlo, o escríbeme por ', linkedIn(), '.']
    });
    // enquanto envia: botão desligado e escrito "Sending…"
    let sending = false;
    const busy = (on) => {
      sending = on;
      btn.disabled = on;
      form.setAttribute('aria-busy', String(on));
      if (on) { btn.replaceChildren(); spans3({ en: 'Sending…', pt: 'Enviando…', es: 'Enviando…' }, btn); }
      else btn.replaceChildren(...btnStart.map((n) => n.cloneNode(true)));
    };
    // --- hCaptcha ---
    // Só carrega quando a pessoa começa a preencher o formulário: quem só visita o site
    // não manda nada para o hCaptcha. A segurança do site (Trusted Types) só deixa o
    // script entrar por esta "policy", e só com o endereço exato do hCaptcha.
    const captchaBox = $('.captcha', form);
    const captchaWait = [...captchaBox.childNodes].map((n) => n.cloneNode(true));
    const ttPolicy = window.trustedTypes ? window.trustedTypes.createPolicy('ptp-captcha', {
      createScriptURL: (u) => { if (u === CONFIG.captchaUrl) return u; throw new TypeError('script bloqueado: ' + u); }
    }) : null;
    let captchaId = null;
    let captchaLoad = null;
    const renderCaptcha = () => {
      if (captchaId !== null) window.hcaptcha.remove(captchaId);
      const slot = document.createElement('div');
      captchaBox.replaceChildren(slot);
      captchaId = window.hcaptcha.render(slot, {
        sitekey: CONFIG.captchaKey,
        hl: { en: 'en', pt: 'pt-BR', es: 'es' }[lang()],
        // celular muito estreito: versão compacta (a normal tem 303px de largura)
        size: captchaBox.clientWidth < 304 ? 'compact' : 'normal',
        callback: () => { if (note.dataset.state === 'err') resetNote(); }
      });
    };
    const loadCaptcha = () => {
      if (!captchaLoad) {
        captchaLoad = new Promise((ok, fail) => {
          const s = document.createElement('script');
          s.src = ttPolicy ? ttPolicy.createScriptURL(CONFIG.captchaUrl) : CONFIG.captchaUrl;
          s.async = true;
          s.addEventListener('load', ok);
          s.addEventListener('error', fail);
          document.head.append(s);
        }).then(renderCaptcha).catch(() => { captchaLoad = null; captchaBox.replaceChildren(...captchaWait.map((n) => n.cloneNode(true))); });
      }
      return captchaLoad;
    };
    form.addEventListener('focusin', loadCaptcha);
    form.addEventListener('pointerdown', loadCaptcha);
    // trocou o idioma e o captcha ainda não foi marcado: desenha de novo no idioma novo
    document.addEventListener('langchange', () => {
      if (captchaId !== null && !window.hcaptcha.getResponse(captchaId)) renderCaptcha();
    });
    const captchaMissing = () => show('err', {
      en: ['Tick the “I am human” check above the button, then send again.'],
      pt: ['Marque a verificação “Sou humano” acima do botão e envie de novo.'],
      es: ['Marca la verificación «Soy humano» encima del botón y vuelve a enviar.']
    });
    const captchaFailed = () => show('err', {
      en: ['The anti-spam check didn’t load, so the form can’t send. Message me on ', linkedIn(), '.'],
      pt: ['A verificação contra spam não carregou, então o formulário não consegue enviar. Me chame no ', linkedIn(), '.'],
      es: ['La verificación contra spam no se cargó, así que el formulario no puede enviar. Escríbeme por ', linkedIn(), '.']
    });

    const { consent, email } = form.elements;
    ['name', 'email', 'message', 'consent'].forEach((n) => form.elements[n].addEventListener('input', (e) => e.target.setCustomValidity('')));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (sending) return;
      // só espaços não contam como resposta
      [form.elements.name, email, form.elements.message].forEach((f) => {
        f.setCustomValidity(f.value.trim() ? '' : say3({ en: 'Please fill in this field.', pt: 'Preencha este campo.', es: 'Rellena este campo.' }));
      });
      // e-mail precisa ter @ e um ponto depois dele (nome@exemplo.com)
      if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        email.setCustomValidity(say3({ en: 'Enter a valid email, like name@example.com.', pt: 'Digite um e-mail válido, como nome@exemplo.com.', es: 'Escribe un correo válido, como nombre@ejemplo.com.' }));
      }
      consent.setCustomValidity(consent.checked ? '' : say3({ en: 'Tick this box to send your message.', pt: 'Marque esta caixa para enviar.', es: 'Marca esta casilla para enviar el mensaje.' }));
      if (!form.reportValidity()) { resetNote(); return; }
      // limpa caracteres invisíveis e corta no tamanho máximo de cada campo
      const clean = (s, max) => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
      const oneLine = (s, max) => clean(s, max).replace(/[\r\n]+/g, ' ');
      const name = oneLine(form.elements.name.value, 80);
      const from = oneLine(email.value, 120);
      const topic = form.elements.topic.options[form.elements.topic.selectedIndex].dataset.en;
      const msg = clean(form.elements.message.value, 600);
      // robô que marcou a caixa escondida: parece que deu certo, mas nada é enviado
      if (form.elements.botcheck.checked) { form.reset(); sent(name, from); return; }
      if (!CONFIG.formKey) { failed(false); return; }
      // o hCaptcha precisa estar marcado; se ainda não carregou, carrega agora
      await loadCaptcha();
      if (captchaId === null) { captchaFailed(); return; }
      const token = window.hcaptcha.getResponse(captchaId);
      if (!token) { captchaMissing(); captchaBox.scrollIntoView({ block: 'center' }); return; }
      busy(true);
      const stop = new AbortController();
      const timer = setTimeout(() => stop.abort(), 15000);
      try {
        const res = await fetch(CONFIG.formUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: CONFIG.formKey,
            // assunto sempre em inglês, para achar fácil na caixa de entrada
            subject: `Portfolio: ${topic} · ${name}`,
            from_name: 'PT Solutions site',
            name,
            email: from,
            topic,
            message: msg,
            // idioma em que a pessoa estava lendo o site: responda nele
            language: lang().toUpperCase(),
            'h-captcha-response': token
          }),
          signal: stop.signal
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) { form.reset(); sent(name, from); } else failed(res.status === 429);
      } catch {
        failed(false);
      } finally {
        clearTimeout(timer);
        busy(false);
        // cada marcação do captcha só vale para um envio
        window.hcaptcha.reset(captchaId);
      }
    });
  }
})();
