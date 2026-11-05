/* Colo de Mãe · carrinho que monta a mensagem do pedido para o WhatsApp.
   Para mudar preços: edite PRODUTOS e PANETONES abaixo (e o texto no index.html). */
(function () {
  'use strict';

  var WHATSAPP = '5511995528128';

  // price: null = "preço a combinar"
  var PRODUTOS = {
    'pao-de-mel':     { nome: 'Pão de mel', price: 8 },
    'cone':           { nome: 'Cone trufado', price: 8 },
    'bolo-pote':      { nome: 'Bolo de pote', price: 12.5 },
    'torta-pedaco':   { nome: 'Torta salgada (pedaço)', price: 6.5 },
    'bolo-inteiro':   { nome: 'Bolo inteiro', price: null },
    'pudim-p':        { nome: 'Pudim P (aro 15 cm)', price: 35 },
    'pudim-g':        { nome: 'Pudim G (aro 20 cm)', price: 70 },
    'torta-frutas':   { nome: 'Torta de Frutas Vermelhas', price: 70 },
    'taca-bombom':    { nome: 'Taça de Bombom 1250 ml', price: 130 },
    'taca-redvelvet': { nome: 'Taça de Red Velvet 1250 ml', price: 140 },
    'brownie':        { nome: 'Brownie', price: 70 },
    'mousse':         { nome: 'Mousse de Chocolate', price: null },
    'abacaxi':        { nome: 'Delícia de Abacaxi', price: null },
    'torta-frango':   { nome: 'Torta de Frango (aro 17 cm)', price: 77 },
    'torta-palmito':  { nome: 'Torta de Palmito (aro 17 cm)', price: 80 },
    'cuscuz':         { nome: 'Cuscuz Paulista', price: null }
  };

  // preços por tamanho: [100 g, 250 g, 500 g]
  var PANETONES = {
    'Panetone':           [10, 16, 30],
    'Chocotone':          [11, 17, 31],
    'Panetone recheado':  [13, 21, 35],
    'Chocotone recheado': [15, 25, 40]
  };
  var TAMANHOS = ['100 g', '250 g', '500 g'];

  var KEY = 'colodemae-pedido';
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { cart = []; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }

  function brl(v) { return 'R$ ' + v.toFixed(2).replace('.', ','); }
  function $(id) { return document.getElementById(id); }

  function add(item) {
    var found = cart.filter(function (c) { return c.key === item.key; })[0];
    if (found) found.qty += item.qty; else cart.push(item);
    save(); render();
    toast('Adicionado: ' + item.nome + (item.qty > 1 ? ' (' + item.qty + 'x)' : '') + ' ✓');
  }

  function totals() {
    var t = 0, n = 0, ask = false;
    cart.forEach(function (c) { n += c.qty; if (c.price == null) ask = true; else t += c.price * c.qty; });
    return { total: t, count: n, ask: ask };
  }

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function render() {
    var s = totals();
    $('cart-open').hidden = s.count === 0;
    $('cart-count').textContent = s.count;
    $('cart-bar-total').textContent = s.ask && s.total === 0 ? 'a combinar' : brl(s.total);
    $('cart-total').textContent = brl(s.total);
    $('cart-ask').hidden = !s.ask;
    $('cart-empty').hidden = s.count > 0;
    $('cart-sum').hidden = s.count === 0;
    $('cart-form').hidden = s.count === 0;

    var list = $('cart-list');
    list.textContent = '';
    cart.forEach(function (c, i) {
      var li = el('li');
      var info = el('div', 'ci-info');
      info.appendChild(el('b', null, c.nome));
      if (c.detalhe) info.appendChild(el('small', null, c.detalhe));
      info.appendChild(el('span', 'ci-price', c.price == null ? 'preço a combinar' : brl(c.price * c.qty)));
      var qty = el('div', 'ci-qty');
      var minus = el('button', null, '−'); minus.type = 'button'; minus.setAttribute('aria-label', 'Diminuir');
      var plus = el('button', null, '+'); plus.type = 'button'; plus.setAttribute('aria-label', 'Aumentar');
      minus.onclick = function () { c.qty--; if (c.qty < 1) cart.splice(i, 1); save(); render(); };
      plus.onclick = function () { c.qty++; save(); render(); };
      qty.appendChild(minus); qty.appendChild(el('span', null, String(c.qty))); qty.appendChild(plus);
      li.appendChild(info); li.appendChild(qty);
      list.appendChild(li);
    });
  }

  var toastTimer;
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  // Botões "+" dos produtos
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-add]');
    if (!b) return;
    var id = b.getAttribute('data-add'), p = PRODUTOS[id];
    if (p) add({ key: id, nome: p.nome, detalhe: '', price: p.price, qty: 1 });
  });

  // Monte seu panetone
  var bf = $('builder');
  function builderState() {
    var tipo = bf.tipo.value, tam = +bf.tamanho.value, recheado = /recheado/.test(tipo);
    bf.querySelector('.only-filled').hidden = !recheado;
    var cobOpt = bf.cobertura.querySelector('option:last-child');
    cobOpt.disabled = !recheado;
    if (!recheado && bf.cobertura.selectedIndex === bf.cobertura.options.length - 1) bf.cobertura.selectedIndex = 0;
    var qtd = Math.max(1, Math.min(50, parseInt(bf.qtd.value, 10) || 1));
    var price = PANETONES[tipo][tam];
    $('builder-price').textContent = brl(price * qtd) + (qtd > 1 ? ' (' + qtd + ' × ' + brl(price) + ')' : '');
    return { tipo: tipo, tam: tam, recheado: recheado, qtd: qtd, price: price };
  }
  bf.addEventListener('change', builderState);
  bf.addEventListener('input', builderState);
  bf.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var s = builderState();
    var det = [];
    if (s.recheado) det.push('recheio ' + bf.recheio.value);
    det.push('cobertura ' + (bf.cobertura.value === 'Mesmo sabor do recheio' ? 'de ' + bf.recheio.value : bf.cobertura.value));
    var nome = s.tipo + ' ' + TAMANHOS[s.tam];
    add({ key: [nome].concat(det).join('|'), nome: nome, detalhe: det.join(' · '), price: s.price, qty: s.qtd });
    bf.qtd.value = 1; builderState();
  });
  builderState();

  // Abrir / fechar carrinho
  var dlg = $('cart');
  $('cart-open').onclick = function () { dlg.showModal(); };
  $('cart-close').onclick = function () { dlg.close(); };
  dlg.addEventListener('click', function (ev) { if (ev.target === dlg) dlg.close(); });
  $('cart-clear').onclick = function () {
    if (confirm('Limpar todos os itens do pedido?')) { cart = []; save(); render(); dlg.close(); }
  };

  // Enviar pelo WhatsApp
  $('cart-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var f = ev.target, s = totals();
    // Sem emoji aqui: o link do WhatsApp corrompe emojis em alguns aparelhos (vira �).
    var linhas = ['Olá! Quero fazer um pedido pelo site da Colo de Mãe!', '', '*Pedido*'];
    cart.forEach(function (c) {
      var l = '• ' + c.qty + 'x ' + c.nome + (c.detalhe ? ' (' + c.detalhe + ')' : '');
      l += ' — ' + (c.price == null ? 'preço a combinar' : brl(c.price * c.qty));
      linhas.push(l);
    });
    linhas.push('', '*Total:* ' + brl(s.total) + (s.ask ? ' + itens a combinar' : ''), '');
    linhas.push('*Nome:* ' + f.nome.value.trim());
    linhas.push('*Receber:* ' + f.receber.value);
    if (f.data.value) { var d = f.data.value.split('-'); linhas.push('*Para:* ' + d[2] + '/' + d[1] + '/' + d[0]); }
    if (f.obs.value.trim()) linhas.push('*Observações:* ' + f.obs.value.trim());
    window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(linhas.join('\n')), '_blank', 'noopener');
  });

  render();
})();
