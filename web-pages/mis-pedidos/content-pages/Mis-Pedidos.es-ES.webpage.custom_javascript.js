(function () {
  function fmtEur(v) {
    var n = parseFloat(v);
    if (isNaN(n)) n = 0;
    var parts = n.toFixed(2).split('.');
    var intp = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (parts[1] === '00' ? intp : intp + ',' + parts[1]) + ' €';
  }

  function cards() { return Array.prototype.slice.call(document.querySelectorAll('#ppList .pp-card')); }

  window.ppFilter = function () {
    var estadoEl = document.getElementById('ppEstado');
    var estado = estadoEl ? estadoEl.value : '';
    var tipoEl = document.getElementById('ppTipo');
    var tipo = tipoEl ? tipoEl.value : '';
    var input = document.getElementById('ppSearch');
    var q = (input ? input.value : '').toLowerCase().trim();
    var visible = 0;
    cards().forEach(function (c) {
      var matchEstado = !estado || (c.getAttribute('data-estado') || '') === estado;
      var matchTipo = !tipo || (c.getAttribute('data-tipo') || '') === tipo;
      var matchSearch = !q || (c.getAttribute('data-search') || '').toLowerCase().indexOf(q) > -1;
      var show = matchEstado && matchTipo && matchSearch;
      c.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    var empty = document.getElementById('ppEmpty');
    if (empty) empty.style.display = (visible === 0) ? 'block' : 'none';
  };

  // Build a custom dropdown (matches the "Gestión Comercial" header menu).
  // Parameterized so the same builder powers both filters (Estado + Tipo de
  // Pedido). The chosen value is kept on a hidden input so ppFilter() stays
  // simple; options are the distinct values found on the cards + the default.
  function buildFilter(cfg) {
    var wrap = document.getElementById(cfg.wrap);
    var trigger = document.getElementById(cfg.trigger);
    var menu = document.getElementById(cfg.menu);
    var hidden = document.getElementById(cfg.hidden);
    var label = document.getElementById(cfg.label);
    if (!wrap || !trigger || !menu || !hidden || !label) return;

    var seen = {};
    cards().forEach(function (c) {
      var v = (c.getAttribute(cfg.attr) || '').trim();
      if (v) { seen[v] = true; }
    });
    var values = [''].concat(Object.keys(seen).sort());

    menu.innerHTML = '';
    values.forEach(function (v) {
      var opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'pp-filter-opt';
      opt.setAttribute('role', 'option');
      opt.setAttribute('data-value', v);
      opt.textContent = v === '' ? cfg.defaultLabel : v;
      if (v === hidden.value) opt.classList.add('active');
      opt.addEventListener('click', function () {
        hidden.value = v;
        label.textContent = v === '' ? cfg.defaultLabel : v;
        Array.prototype.forEach.call(menu.children, function (ch) { ch.classList.remove('active'); });
        opt.classList.add('active');
        closeMenu();
        window.ppFilter();
      });
      menu.appendChild(opt);
    });

    function openMenu() {
      // close any other open filter first, so only one is open at a time
      Array.prototype.forEach.call(document.querySelectorAll('.pp-filter.open'), function (w) {
        if (w !== wrap) { w.classList.remove('open'); }
      });
      wrap.classList.add('open'); trigger.setAttribute('aria-expanded', 'true');
    }
    function closeMenu() { wrap.classList.remove('open'); trigger.setAttribute('aria-expanded', 'false'); }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (wrap.classList.contains('open')) closeMenu(); else openMenu();
    });
    menu.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () { closeMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  function ppInit() {
    if (!document.getElementById('ppList')) return;
    // format prices (empty => 0 €)
    document.querySelectorAll('.pp-precio').forEach(function (el) { el.textContent = fmtEur(el.getAttribute('data-v')); });
    buildFilter({ wrap: 'ppFilterWrap', trigger: 'ppFilterTrigger', menu: 'ppFilterMenu', hidden: 'ppEstado', label: 'ppFilterLabel', attr: 'data-estado', defaultLabel: 'Filtrar por Estado' });
    buildFilter({ wrap: 'ppTipoWrap', trigger: 'ppTipoTrigger', menu: 'ppTipoMenu', hidden: 'ppTipo', label: 'ppTipoLabel', attr: 'data-tipo', defaultLabel: 'Filtrar por Tipo de Pedido' });
  }

  if (document.readyState !== 'loading') { ppInit(); }
  else { document.addEventListener('DOMContentLoaded', ppInit); }
})();
