// Pablo Targa — portfolio behaviour. No dependencies.
(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const onChange = (mq, fn) => (mq.addEventListener ? mq.addEventListener('change', fn) : mq.addListener(fn));
  const store = {
    get(k) { try { return localStorage.getItem('ptp:' + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('ptp:' + k, v); } catch (e) { /* private mode */ } }
  };

  /* ---------- language ---------- */
  // each page carries its own title and description in both languages on <body>
  const meta = (l) => ({ title: document.body.dataset['title' + (l === 'pt' ? 'Pt' : 'En')], desc: document.body.dataset['desc' + (l === 'pt' ? 'Pt' : 'En')] });
  const lang = () => (root.lang === 'pt-BR' ? 'pt' : 'en');
  function setLang(l, save) {
    root.lang = l === 'pt' ? 'pt-BR' : 'en';
    const m = meta(l);
    if (m.title) document.title = m.title;
    const d = $('meta[name="description"]');
    if (d && m.desc) d.setAttribute('content', m.desc);
    $$('[data-en]').forEach((el) => {
      const v = el.dataset[l];
      if (v == null) return;
      const attr = el.dataset.attr;
      if (attr) { if (attr === 'aria-label' || attr === 'alt') el.setAttribute(attr, v); }
      else el.textContent = v;
    });
    $$('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
    if (save) {
      store.set('lang', l);
      // a ?lang= in the address would override the choice on the next visit
      if (location.search.includes('lang=')) history.replaceState(null, '', location.pathname + location.hash);
    }
  }
  setLang(lang());
  $$('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang, true)));

  /* ---------- mobile menu ---------- */
  const menuBtn = $('.menu-btn');
  const menu = $('#menu');
  const behind = $$('main, footer');
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
    onChange(matchMedia('(min-width: 834px)'), (e) => { if (e.matches) closeMenu(); });
  }

  /* ---------- flyouts: open on mouse hover, or with the chevron button from the keyboard ---------- */
  const flyItems = $$('.nav__item');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let openItem = null;
  let flyTimer = 0;
  function setFly(item) {
    clearTimeout(flyTimer);
    if (openItem === item) return;
    // moving from one flyout to the next swaps the content without dropping the panel again
    root.classList.toggle('fly-swap', !!(openItem && item));
    if (openItem) {
      openItem.classList.remove('is-open');
      $('.nav__chev', openItem).setAttribute('aria-expanded', 'false');
    }
    openItem = item;
    if (item) {
      item.classList.add('is-open');
      $('.nav__chev', item).setAttribute('aria-expanded', 'true');
    }
    root.classList.toggle('fly-open', !!item);
  }
  const later = (fn, ms) => { clearTimeout(flyTimer); flyTimer = setTimeout(fn, ms); };
  flyItems.forEach((item) => {
    $('.nav__chev', item).addEventListener('click', () => setFly(openItem === item ? null : item));
    item.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse' && fine.matches) later(() => setFly(item), openItem ? 0 : 180);
    });
    item.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') later(() => setFly(null), 220); });
    item.addEventListener('focusout', (e) => { if (openItem === item && !item.contains(e.relatedTarget)) setFly(null); });
    item.addEventListener('click', (e) => { if (e.target.closest('a')) setFly(null); });
  });
  const curtain = $('.nav-curtain');
  if (curtain) curtain.addEventListener('click', () => setFly(null));
  onChange(matchMedia('(max-width: 833px)'), (e) => { if (e.matches) setFly(null); });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (openItem) {
      const item = openItem;
      const inside = item.contains(document.activeElement);
      setFly(null);
      if (inside) $('.nav__chev', item).focus();
    }
    closeMenu(true);
  });

  /* ---------- the bar takes the colour of the section under it ---------- */
  const nav = $('.nav');
  const zones = $$('main > *, footer');
  if (nav && zones.length) {
    let queued = false;
    const paint = () => {
      queued = false;
      const y = nav.offsetHeight / 2;
      const under = zones.find((z) => { const r = z.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
      const theme = under && !under.matches('.dark') ? 'light' : 'dark';
      if (root.dataset.nav !== theme) root.dataset.nav = theme;
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    paint();
  }

  /* ---------- current section in the nav ---------- */
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
    $$('main > section[id]').forEach((s) => spy.observe(s));
  }

  /* ---------- app clip: plays while visible; pause button; respects reduced motion and data saver ---------- */
  $$('.clip').forEach((box) => {
    const clip = $('video', box);
    const clipBtn = $('.clip-btn', box);
    if (!clip) return;
    const saveData = !!(navigator.connection && navigator.connection.saveData);
    let visible = false;
    let userPaused = reduce.matches || saveData;
    const label = () => {
      if (!clipBtn) return;
      const playing = !clip.paused;
      clipBtn.dataset.en = playing ? 'Pause video' : 'Play video';
      clipBtn.dataset.pt = playing ? 'Pausar vídeo' : 'Reproduzir vídeo';
      clipBtn.setAttribute('aria-label', clipBtn.dataset[lang()]);
      clipBtn.classList.toggle('is-paused', !playing);
    };
    const sync = () => {
      if (userPaused || !visible) clip.pause();
      else clip.play().catch(() => { /* autoplay blocked: the poster stays */ });
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

  /* ---------- agent tickets (tabs) ---------- */
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

  /* ---------- contact form opens the visitor's email app ---------- */
  const form = $('#contact-form');
  if (form) {
    const note = $('.form__note', form);
    const noteStart = [...note.childNodes].map((n) => n.cloneNode(true));
    const say = (en, pt) => {
      const part = (cls, text, link) => {
        const span = document.createElement('span');
        span.className = cls;
        const a = document.createElement('a');
        a.href = 'https://www.linkedin.com/in/pablomtarga';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = 'LinkedIn';
        span.append(text, a, '.');
        return span;
      };
      note.replaceChildren(part('en', en), part('pt', pt));
      note.dataset.state = 'ok';
    };
    const resetNote = () => { if (note.dataset.state) { note.replaceChildren(...noteStart.map((n) => n.cloneNode(true))); delete note.dataset.state; } };
    const consent = form.elements.consent;
    ['name', 'message', 'consent'].forEach((n) => form.elements[n].addEventListener('input', (e) => e.target.setCustomValidity('')));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // spaces alone do not count as an answer
      [form.elements.name, form.elements.message].forEach((f) => {
        f.setCustomValidity(f.value.trim() ? '' : (lang() === 'pt' ? 'Preencha este campo.' : 'Please fill in this field.'));
      });
      consent.setCustomValidity(consent.checked ? '' : (lang() === 'pt' ? 'Marque esta caixa para enviar.' : 'Tick this box to send your message.'));
      if (!form.reportValidity()) { resetNote(); return; }
      const l = lang();
      const clean = (s, max) => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
      const oneLine = (s, max) => clean(s, max).replace(/[\r\n]+/g, ' ');
      const name = oneLine(form.elements.name.value, 80);
      const topic = form.elements.topic.options[form.elements.topic.selectedIndex].text;
      const msg = clean(form.elements.message.value, 600);
      const subject = (l === 'pt' ? 'Contato pelo portfólio: ' : 'Portfolio enquiry: ') + topic + ' · ' + name;
      const body = [
        (l === 'pt' ? 'Nome: ' : 'Name: ') + name,
        (l === 'pt' ? 'Assunto: ' : 'Topic: ') + topic,
        '',
        msg
      ].join('\n');
      say('Opening your email app. If nothing opens, message me on ', 'Abrindo o seu app de e-mail. Se nada abrir, me chame no ');
      // the address is assembled here so it never appears in the page or its source
      const to = ['pablomtarga', 'icloud.com'].join('@');
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }
})();
