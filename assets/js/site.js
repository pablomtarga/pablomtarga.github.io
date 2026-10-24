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

  /* ---------- language: English, Portuguese, Spanish ---------- */
  const TAG = { en: 'en', pt: 'pt-BR', es: 'es' };
  const lang = () => ({ 'pt-BR': 'pt', es: 'es' }[root.lang] || 'en');
  const say3 = (o) => o[lang()];
  const cap = (l) => l[0].toUpperCase() + l.slice(1);
  function setLang(l, save) {
    root.lang = TAG[l] || 'en';
    // each page carries its own title and description in every language on <body>
    const title = document.body.dataset['title' + cap(l)];
    const desc = document.body.dataset['desc' + cap(l)];
    if (title) document.title = title;
    const d = $('meta[name="description"]');
    if (d && desc) d.setAttribute('content', desc);
    $$('[data-en]').forEach((el) => {
      const v = el.dataset[l] || el.dataset.en;
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
    document.dispatchEvent(new Event('langchange'));
  }
  setLang(lang());
  $$('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang, true)));

  // builds <span class="en">…</span><span class="pt">…</span><span class="es">…</span> without innerHTML
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

  /* ---------- links that open a new tab say so to screen readers ---------- */
  $$('a[target="_blank"]').forEach((a) => {
    if ($('.newtab', a)) return;
    const note = spans3({ en: ' (opens in a new tab)', pt: ' (abre em outra aba)', es: ' (se abre en otra pestaña)' });
    note.className = 'sr-only newtab';
    a.append(note);
  });

  /* ---------- mobile menu ---------- */
  const menuBtn = $('.menu-btn');
  const menu = $('#menu');
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
    onChange(matchMedia('(min-width: 834px)'), (e) => { if (e.matches) closeMenu(); });
  }

  /* ---------- on scroll: bar colour follows the section, the A'DAM photo zooms and softens ---------- */
  const nav = $('.nav');
  const zones = $$('main > *, footer');
  const stage = $('.stage');
  const stageBg = $('.stage__bg');
  const credit = $('.hero__credit');
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
    // the photo credit fades out over the first part of the scroll
    if (credit) credit.style.opacity = Math.max(0, 1 - scrollY / 160).toFixed(2);
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  onChange(reduce, () => { if (stageBg) stageBg.style.removeProperty('--p'); queue(); });
  paint();

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
    $$('main section[id]').forEach((s) => spy.observe(s));
  }

  /* ---------- Contact me: LinkedIn or the form, shown on hover or focus; Esc or a choice closes it ---------- */
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

  /* ---------- drawers slide open and closed; a second click mid-way reverses from where it is ---------- */
  $$('details.drawer').forEach((d) => {
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
      anim = d.animate({ height: [`${start}px`, `${end}px`] }, { duration: opening ? 520 : 380, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' });
      if (opening) body.animate({ opacity: [0, 1], transform: ['translateY(-10px)', 'none'] }, { duration: 420, delay: 80, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' });
      anim.onfinish = () => {
        anim = null;
        d.style.overflow = '';
        if (!opening) { d.open = false; d.classList.remove('is-closing'); }
      };
    });
  });

  /* ---------- photos open bigger, with the place they were taken ---------- */
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
      img.src = thumb.currentSrc || thumb.src;
      img.alt = thumb.alt;
      where.textContent = shots[at].dataset['place' + cap(lang())] || shots[at].dataset.placeEn;
      count.textContent = `${at + 1} / ${shots.length}`;
      if (swap) { img.classList.remove('is-swapping'); void img.offsetWidth; img.classList.add('is-swapping'); }
    };
    shots.forEach((b, i) => b.addEventListener('click', () => { show(i); box.showModal(); }));
    $('.lb-prev', box).addEventListener('click', () => show(at - 1, true));
    $('.lb-next', box).addEventListener('click', () => show(at + 1, true));
    $('.lb-close', box).addEventListener('click', () => box.close());
    // a click on the dark area around the photo closes it
    box.addEventListener('click', (e) => { if (e.target === box) box.close(); });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(at - 1, true); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(at + 1, true); }
    });
    // swipe left or right on a phone
    let startX = null;
    box.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') startX = e.clientX; });
    box.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) show(at + (dx < 0 ? 1 : -1), true);
    });
    box.addEventListener('close', () => { shots[at].focus({ preventScroll: true }); });
    document.addEventListener('langchange', () => { if (box.open) show(at); });
  }

  /* ---------- app clip: plays while visible; pause button; respects reduced motion and data saver ---------- */
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
    const linkedIn = () => {
      const a = document.createElement('a');
      a.href = 'https://www.linkedin.com/in/pablomtarga';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'LinkedIn';
      return a;
    };
    const opened = () => {
      note.replaceChildren();
      spans3({
        en: ['Opening your email app. If nothing opens, message me on ', linkedIn(), '.'],
        pt: ['Abrindo o seu app de e-mail. Se nada abrir, me chame no ', linkedIn(), '.'],
        es: ['Abriendo tu app de correo. Si no se abre nada, escríbeme por ', linkedIn(), '.']
      }, note);
      note.dataset.state = 'ok';
    };
    const resetNote = () => { if (note.dataset.state) { note.replaceChildren(...noteStart.map((n) => n.cloneNode(true))); delete note.dataset.state; } };
    const consent = form.elements.consent;
    ['name', 'message', 'consent'].forEach((n) => form.elements[n].addEventListener('input', (e) => e.target.setCustomValidity('')));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // spaces alone do not count as an answer
      [form.elements.name, form.elements.message].forEach((f) => {
        f.setCustomValidity(f.value.trim() ? '' : say3({ en: 'Please fill in this field.', pt: 'Preencha este campo.', es: 'Rellena este campo.' }));
      });
      consent.setCustomValidity(consent.checked ? '' : say3({ en: 'Tick this box to send your message.', pt: 'Marque esta caixa para enviar.', es: 'Marca esta casilla para enviar el mensaje.' }));
      if (!form.reportValidity()) { resetNote(); return; }
      const clean = (s, max) => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
      const oneLine = (s, max) => clean(s, max).replace(/[\r\n]+/g, ' ');
      const name = oneLine(form.elements.name.value, 80);
      const topic = form.elements.topic.options[form.elements.topic.selectedIndex].text;
      const msg = clean(form.elements.message.value, 600);
      const subject = say3({ en: 'Portfolio enquiry: ', pt: 'Contato pelo portfólio: ', es: 'Contacto desde el portfolio: ' }) + topic + ' · ' + name;
      const body = [
        say3({ en: 'Name: ', pt: 'Nome: ', es: 'Nombre: ' }) + name,
        say3({ en: 'Topic: ', pt: 'Assunto: ', es: 'Asunto: ' }) + topic,
        '',
        msg
      ].join('\n');
      opened();
      // the address is assembled here so it never appears in the page or its source
      const to = ['pablomtarga', 'icloud.com'].join('@');
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }
})();
