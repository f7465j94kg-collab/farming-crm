(function () {
  function fmtEur(v) {
    var n = parseFloat(v);
    if (isNaN(n)) n = 0;
    var parts = n.toFixed(2).split('.');
    var intp = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (parts[1] === '00' ? intp : intp + ',' + parts[1]) + ' €';
  }

  function dpInit() {
    // format price (empty => 0 €), same as the stock list
    document.querySelectorAll('.dp-precio').forEach(function (el) {
      el.textContent = fmtEur(el.getAttribute('data-v'));
    });
  }

  if (document.readyState !== 'loading') { dpInit(); }
  else { document.addEventListener('DOMContentLoaded', dpInit); }
})();
