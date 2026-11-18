// JOMAB · menú, filtros de obras, visor de fotos, aparición al bajar y formulario → WhatsApp
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- menú del móvil ----
  const menu = $('.cab__menu'), nav = $('#nav');
  menu?.addEventListener('click', () => {
    const ab = nav.classList.toggle('abierta');
    menu.setAttribute('aria-expanded', ab);
  });
  $$('#nav a').forEach((a) => a.addEventListener('click', () => { nav.classList.remove('abierta'); menu?.setAttribute('aria-expanded', 'false'); }));

  // ---- sección actual en el menú ----
  if ('IntersectionObserver' in window) {
    const links = new Map($$('#nav a').map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { links.forEach((a) => a.classList.remove('actual')); links.get(e.target.id)?.classList.add('actual'); }
    }), { rootMargin: '-45% 0px -50% 0px' });
    links.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  // ---- filtros de obras ----
  const filtros = $$('.filtro');
  // se ven las primeras obras (6 en el móvil, 9 en pantallas grandes) y un botón para verlas todas
  const ver = $('#obras-ver');
  let actual = 'todas', todas = false;
  const filtrar = (f, abrir = false) => {
    if (f !== actual) todas = false;
    actual = f; if (abrir) todas = true;
    filtros.forEach((b) => { const on = b.dataset.f === f; b.classList.toggle('activo', on); b.setAttribute('aria-pressed', on); });
    const lim = matchMedia('(max-width: 699px)').matches ? 6 : 9;
    const si = $$('.obra').filter((li) => f === 'todas' || li.dataset.cat === f);
    $$('.obra').forEach((li) => { li.hidden = true; });
    si.forEach((li, k) => { li.hidden = !todas && k >= lim; });
    if (ver) {
      ver.hidden = todas || si.length <= lim;
      const nombre = f === 'todas' ? '' : ' de ' + $(`.filtro[data-f="${f}"]`).firstChild.textContent.trim().toLowerCase();
      ver.textContent = `Ver las ${si.length} obras${nombre}`;
    }
  };
  filtros.forEach((b) => b.addEventListener('click', () => filtrar(b.dataset.f)));
  ver?.addEventListener('click', () => {
    const k = $$('.obra').filter((li) => !li.hidden).length;
    filtrar(actual, true);
    $$('.obra').filter((li) => !li.hidden)[k]?.querySelector('button')?.focus({ preventScroll: true });
  });
  filtrar('todas');
  $$('[data-filtro]').forEach((a) => a.addEventListener('click', () => filtrar(a.dataset.filtro, true)));

  // ---- visor de fotos de cada obra ----
  const visor = $('#visor'), img = $('#visor-img'), mins = $('#visor-min');
  let obra = null, i = 0, desde = null;
  const url = (f, w) => `img/${f.id}-${w}.webp`;
  const mejor = (f) => f.a.find((a) => a >= Math.min(innerWidth * devicePixelRatio, 1400)) || f.a.at(-1);
  function mostrar(n) {
    if (!obra) return;
    i = (n + obra.f.length) % obra.f.length;
    const f = obra.f[i];
    img.src = url(f, mejor(f));
    img.width = f.w; img.height = f.h;
    img.alt = `${obra.t} · foto ${i + 1} de ${obra.f.length}`;
    $('#visor-n').textContent = `${i + 1} / ${obra.f.length}`;
    $$('button', mins).forEach((b, k) => b.setAttribute('aria-current', k === i));
    $$('button', mins)[i]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
    [1, -1].forEach((d) => { const g = obra.f[(i + d + obra.f.length) % obra.f.length]; new Image().src = url(g, mejor(g)); });
  }
  function abrir(id, el) {
    obra = window.OBRAS[id];
    if (!obra || !visor) return;
    desde = el;
    $('#visor-t').textContent = obra.t;
    $('#visor-cat').textContent = obra.cat + (obra.lugar ? ' · ' + obra.lugar : '');
    $('#visor-d').textContent = obra.d;
    const ig = $('#visor-ig');
    ig.hidden = !obra.ig; if (obra.ig) ig.href = obra.ig;
    mins.innerHTML = obra.f.map((f, k) => `<li><button type="button" aria-label="Foto ${k + 1}"><img src="img/${f.id}-${f.a[0]}.webp" alt="" loading="lazy"></button></li>`).join('');
    $$('button', mins).forEach((b, k) => b.addEventListener('click', () => mostrar(k)));
    visor.showModal();
    document.body.style.overflow = 'hidden';
    mostrar(0);
  }
  $$('[data-obra]').forEach((b) => b.addEventListener('click', () => abrir(b.dataset.obra, b)));
  $('.visor__ant')?.addEventListener('click', () => mostrar(i - 1));
  $('.visor__sig')?.addEventListener('click', () => mostrar(i + 1));
  $('.visor__cerrar')?.addEventListener('click', () => visor.close());
  visor?.addEventListener('close', () => { document.body.style.overflow = ''; desde?.focus(); });
  visor?.addEventListener('click', (e) => { if (e.target === visor) visor.close(); });
  document.addEventListener('keydown', (e) => {
    if (!visor?.open) return;
    if (e.key === 'ArrowLeft') mostrar(i - 1);
    if (e.key === 'ArrowRight') mostrar(i + 1);
  });
  // deslizar con el dedo
  let x0 = null;
  $('.visor__fig')?.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  $('.visor__fig')?.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) mostrar(i + (dx < 0 ? 1 : -1));
  });

  // ---- aparición suave al bajar ----
  if (!reduce && 'IntersectionObserver' in window) {
    const el = $$('.titulo, .srv, .paso, .obra, .valor, .piscinas__fotos, .impreso__fotos, .reformas__fotos, .compromisos__lista li, .zona__mapa, .insta__fotos li, .form, .datos li');
    el.forEach((e) => e.classList.add('rv'));
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    el.forEach((e, k) => { e.style.transitionDelay = `${(k % 4) * 60}ms`; io.observe(e); });
  }

  // ---- formulario → WhatsApp ----
  $('#form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target, d = Object.fromEntries(new FormData(f));
    let ok = true;
    ['nombre', 'telefono'].forEach((n) => { const c = f.elements[n]; const mal = !String(d[n] || '').trim(); c.classList.toggle('error', mal); if (mal && ok) { c.focus(); ok = false; } });
    if (!ok) return;
    const t = [`Hola, soy ${d.nombre.trim()}. Me gustaría pedir presupuesto.`, `· Qué necesito: ${d.tipo || '—'}`, d.poblacion ? `· Población: ${d.poblacion.trim()}` : '', `· Teléfono: ${d.telefono.trim()}`, d.mensaje ? `\n${d.mensaje.trim()}` : ''].filter(Boolean).join('\n');
    window.open(`https://wa.me/${window.WA}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
  });
})();
