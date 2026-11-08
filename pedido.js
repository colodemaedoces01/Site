/* Colo de Mãe · carrinho que monta a mensagem do pedido para o WhatsApp.
   Para mudar preços: edite PRODUTOS e PANETONES abaixo (e o texto no index.html). */
(function () {
  'use strict';

  var WHATSAPP = '5511995528128';

  // price: null = "preço a combinar"
  var PRODUTOS = {
    // Doces da semana sem preço no site: valor combinado pelo WhatsApp (muda com a quantidade).
    // Tabela de referência: pão de mel 8 · cone 8 · bolo de pote 12,50 · torta 6,50 o pedaço
    'pao-de-mel':     { nome: 'Pão de mel', price: null },
    'cone':           { nome: 'Cone trufado', price: null },
    'bolo-pote':      { nome: 'Bolo de pote', price: null },
    'torta-pedaco':   { nome: 'Torta salgada (pedaço)', price: null },
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

  // Recheados já vêm com cobertura. Tradicionais vêm sem; cobertura opcional custa COB_EXTRA.
  var COBERTURAS = ['Chocolate ao leite', 'Chocolate meio amargo', 'Chocolate branco com coco', 'Pistache'];
  var SEM_COB = 'Sem cobertura', MESMO_SABOR = 'Mesmo sabor do recheio';
  var COB_EXTRA = 2;

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
    $('cart-total').textContent = s.ask && s.total === 0 ? 'a combinar' : brl(s.total);
    $('cart-ask').hidden = !(s.ask && s.total > 0);
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
  var cobRecheado = null;
  // Monta as opções de cobertura conforme o tipo (recheado ou tradicional)
  function fillCobertura(recheado) {
    var sel = bf.cobertura, prev = sel.value;
    var opts = recheado ? COBERTURAS.concat(MESMO_SABOR) : [SEM_COB].concat(COBERTURAS);
    sel.textContent = '';
    opts.forEach(function (o) {
      var op = document.createElement('option');
      op.value = o;
      op.textContent = o;
      sel.appendChild(op);
    });
    // Nos tradicionais o adicional aparece no rótulo (no campo o texto ficaria cortado)
    $('cob-label').textContent = recheado ? 'Cobertura' : 'Cobertura (+ ' + brl(COB_EXTRA) + ')';
    // Ao trocar para tradicional, volta para "Sem cobertura"
    sel.value = recheado && opts.indexOf(prev) >= 0 ? prev : opts[0];
  }
  function builderState() {
    var tipo = bf.tipo.value, tam = +bf.tamanho.value, recheado = /recheado/.test(tipo);
    bf.querySelector('.only-filled').hidden = !recheado;
    if (recheado !== cobRecheado) { fillCobertura(recheado); cobRecheado = recheado; }
    var cob = bf.cobertura.value;
    var extra = !recheado && cob !== SEM_COB ? COB_EXTRA : 0;
    var qtd = Math.max(1, Math.min(50, parseInt(bf.qtd.value, 10) || 1));
    var price = PANETONES[tipo][tam] + extra;
    $('builder-price').textContent = brl(price * qtd) + (qtd > 1 ? ' (' + qtd + ' × ' + brl(price) + ')' : '');
    return { tipo: tipo, tam: tam, recheado: recheado, qtd: qtd, price: price, cob: cob };
  }
  bf.addEventListener('change', builderState);
  bf.addEventListener('input', builderState);
  bf.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var s = builderState();
    var det = [];
    if (s.recheado) det.push('recheio ' + bf.recheio.value);
    if (s.cob === SEM_COB) det.push('sem cobertura');
    else det.push('cobertura ' + (s.cob === MESMO_SABOR ? 'de ' + bf.recheio.value : s.cob) + (s.recheado ? '' : ' (+ ' + brl(COB_EXTRA) + ')'));
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
    var totalTxt = s.ask && s.total === 0 ? 'a combinar' : brl(s.total) + (s.ask ? ' + itens a combinar' : '');
    linhas.push('', '*Total:* ' + totalTxt, '');
    linhas.push('*Nome:* ' + f.nome.value.trim());
    linhas.push('*Receber:* ' + f.receber.value);
    if (f.data.value) { var d = f.data.value.split('-'); linhas.push('*Para:* ' + d[2] + '/' + d[1] + '/' + d[0]); }
    if (f.obs.value.trim()) linhas.push('*Observações:* ' + f.obs.value.trim());
    window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(linhas.join('\n')), '_blank', 'noopener');
  });

  render();
})();
