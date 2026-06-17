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
    var sel = document.getElementById('ppEstado');
    var estado = sel ? sel.value : '';
    var input = document.getElementById('ppSearch');
    var q = (input ? input.value : '').toLowerCase().trim();
    var visible = 0;
    cards().forEach(function (c) {
      var matchEstado = !estado || (c.getAttribute('data-estado') || '') === estado;
      var matchSearch = !q || (c.getAttribute('data-search') || '').toLowerCase().indexOf(q) > -1;
      var show = matchEstado && matchSearch;
      c.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    var empty = document.getElementById('ppEmpty');
    if (empty) empty.style.display = (visible === 0) ? 'block' : 'none';
  };

  function ppInit() {
    if (!document.getElementById('ppList')) return;
    // format prices (empty => 0 €)
    document.querySelectorAll('.pp-precio').forEach(function (el) { el.textContent = fmtEur(el.getAttribute('data-v')); });
    var sel = document.getElementById('ppEstado');
    if (!sel) return;
    // build the "Filtrar por Estado" options from the estados present in the list
    var seen = {};
    cards().forEach(function (c) {
      var e = (c.getAttribute('data-estado') || '').trim();
      if (e) { seen[e] = true; }
    });
    Object.keys(seen).sort().forEach(function (e) {
      var o = document.createElement('option');
      o.value = e;
      o.textContent = e;
      sel.appendChild(o);
    });
  }

  if (document.readyState !== 'loading') { ppInit(); }
  else { document.addEventListener('DOMContentLoaded', ppInit); }
})();
