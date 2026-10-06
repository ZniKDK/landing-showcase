/* «Стебель»: процедурные иллюстрации в стиле ризографа, конструктор букета,
   каталог с фильтром, маршрут курьера, стопка отзывов, лепестки после заказа. */
(function () {
  'use strict';

  var M = window.Motion;
  var FLOWERS = window.FLOWERS;
  var WRAPS = window.WRAPS;
  var SVGNS = 'http://www.w3.org/2000/svg';

  // ---------- Рисование цветов ----------
  // Каждый цветок — набор фигур, у каждой своя «краска» (ink).
  // Так одну и ту же иллюстрацию можно разложить на слои-формы, как при ризопечати.

  function n(v) {
    return Math.round(v * 10) / 10;
  }

  // Спираль из полуокружностей — серединка розы
  function spiral(R) {
    var k = R / 4.5;
    var x = 0;
    var d = 'M' + n(-k / 2) + ' 0';
    for (var i = 1; i <= 4; i++) {
      var rad = k * i;
      x = i % 2 ? x + 2 * rad : x - 2 * rad;
      d += ' A' + n(rad) + ' ' + n(rad) + ' 0 0 1 ' + n(x - k / 2) + ' 0';
    }
    return d;
  }

  function shapes(type, r, rand) {
    var out = [];
    var i;
    if (type === 'rose') {
      out.push({ ink: 'pink', s: '<circle class="f-pink" r="' + n(r) + '"/>' });
      out.push({ ink: 'blue', s: '<path class="s-blue" d="' + spiral(r * 0.8) + '"/>' });
    } else if (type === 'ranunculus') {
      out.push({ ink: 'pink', s: '<circle class="f-dots-pink" r="' + n(r) + '"/>' });
      out.push({ ink: 'pink', s: '<circle class="s-pink" r="' + n(r * 0.97) + '"/>' });
      out.push({ ink: 'blue', s: '<circle class="s-blue" r="' + n(r * 0.62) + '"/><circle class="s-blue" r="' + n(r * 0.3) + '"/>' });
    } else if (type === 'daisy') {
      var petals = '';
      for (i = 0; i < 12; i++) {
        petals += '<ellipse class="s-blue" cy="' + n(-r * 0.58) + '" rx="' + n(r * 0.19) + '" ry="' + n(r * 0.4) + '" transform="rotate(' + i * 30 + ')"/>';
      }
      out.push({ ink: 'blue', s: petals });
      out.push({ ink: 'yellow', s: '<circle class="f-yellow" r="' + n(r * 0.32) + '"/>' });
      out.push({ ink: 'pink', s: '<circle class="f-dots-pink" r="' + n(r * 0.3) + '"/>' });
    } else if (type === 'tulip') {
      var cup = 'M' + n(-0.6 * r) + ' ' + n(-0.5 * r) + ' Q' + n(-0.78 * r) + ' ' + n(0.72 * r) + ' 0 ' + n(0.78 * r) +
        ' Q' + n(0.78 * r) + ' ' + n(0.72 * r) + ' ' + n(0.6 * r) + ' ' + n(-0.5 * r) +
        ' L' + n(0.3 * r) + ' ' + n(-0.12 * r) + ' L0 ' + n(-0.62 * r) + ' L' + n(-0.3 * r) + ' ' + n(-0.12 * r) + 'Z';
      var inner = 'M' + n(-0.3 * r) + ' ' + n(-0.12 * r) + ' L0 ' + n(-0.62 * r) + ' L' + n(0.3 * r) + ' ' + n(-0.12 * r) + ' Q0 ' + n(0.5 * r) + ' ' + n(-0.3 * r) + ' ' + n(-0.12 * r) + 'Z';
      out.push({ ink: 'blue', s: '<path class="f-blue" d="' + cup + '"/>' });
      out.push({ ink: 'pink', s: '<path class="f-pink" d="' + inner + '"/>' });
    } else if (type === 'eucalyptus') {
      var leaves = '<path class="s-green" d="M0 ' + n(r) + ' Q' + n(r * 0.2) + ' 0 0 ' + n(-r) + '"/>';
      for (i = 0; i < 5; i++) {
        var side = i % 2 ? 1 : -1;
        leaves += '<circle class="f-green" cx="' + n(side * r * 0.3) + '" cy="' + n(r * 0.8 - i * r * 0.42) + '" r="' + n(r * (0.34 - i * 0.03)) + '"/>';
      }
      out.push({ ink: 'green', s: leaves });
    } else if (type === 'gypsophila') {
      var blue = '';
      var pink = '';
      for (i = 0; i < 14; i++) {
        var a = rand() * Math.PI * 2;
        var d = Math.sqrt(rand()) * r;
        var dot = '<circle cx="' + n(Math.cos(a) * d) + '" cy="' + n(Math.sin(a) * d) + '" r="' + n(r * (0.08 + rand() * 0.07)) + '"/>';
        if (i % 3) blue += dot;
        else pink += dot;
      }
      out.push({ ink: 'blue', s: '<g class="f-blue">' + blue + '</g>' });
      out.push({ ink: 'pink', s: '<g class="f-pink">' + pink + '</g>' });
    }
    return out;
  }

  // Цветок целиком (все краски в одной группе)
  function flowerSVG(type, r, x, y, rot, rand) {
    return '<g transform="translate(' + n(x) + ' ' + n(y) + ') rotate(' + n(rot) + ')">' +
      shapes(type, r, rand).map(function (p) { return p.s; }).join('') + '</g>';
  }

  // Разложить набор цветов по слоям-краскам
  function plates(items, rand) {
    var byInk = { yellow: '', green: '', pink: '', blue: '' };
    items.forEach(function (it) {
      shapes(it.type, it.r, rand).forEach(function (p) {
        byInk[p.ink] += '<g transform="translate(' + n(it.x) + ' ' + n(it.y) + ') rotate(' + n(it.rot || 0) + ')">' + p.s + '</g>';
      });
    });
    return byInk;
  }

  // ---------- Hero: букет, который «печатается» слоями ----------
  var TIE = { x: 200, y: 372 };
  var HERO = [
    { type: 'eucalyptus', x: 82, y: 128, r: 46, rot: -42 },
    { type: 'eucalyptus', x: 326, y: 138, r: 46, rot: 38 },
    { type: 'gypsophila', x: 214, y: 78, r: 32 },
    { type: 'gypsophila', x: 96, y: 222, r: 28 },
    { type: 'gypsophila', x: 318, y: 238, r: 26 },
    { type: 'tulip', x: 168, y: 96, r: 30, rot: -14 },
    { type: 'tulip', x: 284, y: 96, r: 27, rot: 16 },
    { type: 'daisy', x: 118, y: 162, r: 33 },
    { type: 'daisy', x: 292, y: 212, r: 30 },
    { type: 'ranunculus', x: 262, y: 150, r: 36 },
    { type: 'ranunculus', x: 226, y: 252, r: 31 },
    { type: 'rose', x: 196, y: 176, r: 50 },
    { type: 'rose', x: 142, y: 244, r: 38 }
  ];

  var hero = document.querySelector('.bouquet');
  (function buildHero() {
    var rand = M.seeded(7);
    var p = plates(HERO, rand);
    var stems = HERO.map(function (f) {
      return '<path class="s-green stem" pathLength="1" d="M' + f.x + ' ' + f.y + ' Q' + n((f.x + TIE.x) / 2 + (f.x < TIE.x ? -12 : 12)) + ' ' + n((f.y + TIE.y) / 2) + ' ' + TIE.x + ' ' + TIE.y + ' L' + n(TIE.x + (f.x - TIE.x) * 0.12) + ' 452"/>';
    }).join('');
    var wrap = '<path class="f-yellow" d="M78 262 L322 262 L234 432 L166 432Z"/><path class="f-dots-yellow" d="M78 262 L200 262 L200 432 L166 432Z"/>';
    var bow = '<ellipse class="s-pink" cx="178" cy="368" rx="22" ry="10" transform="rotate(-20 178 368)"/><ellipse class="s-pink" cx="222" cy="368" rx="22" ry="10" transform="rotate(20 222 368)"/><path class="s-pink" d="M196 372 L176 420 M204 372 L230 414"/>';
    hero.innerHTML =
      '<g class="plate" data-ink="yellow">' + wrap + p.yellow + '</g>' +
      '<g class="plate" data-ink="green">' + stems + p.green + '</g>' +
      '<g class="plate" data-ink="pink">' + p.pink + bow + '</g>' +
      '<g class="plate" data-ink="blue">' + p.blue + '</g>';
  })();

  // Где слой стоит «в покое» (лёгкое несовмещение — примета ризографа) и откуда прилетает
  var REST = { yellow: [0, 0], green: [0, 0], pink: [2, -1.5], blue: [-1.5, 1.5] };
  var FROM = { yellow: [0, -36], green: [-30, 16], pink: [28, 22], blue: [18, -28] };
  var DEPTH = { yellow: 4, green: 8, pink: -6, blue: -10 };
  var heroPlates = Array.from(hero.querySelectorAll('.plate'));

  heroPlates.forEach(function (pl, i) {
    var ink = pl.dataset.ink;
    pl.style.transform = 'translate(' + REST[ink][0] + 'px,' + REST[ink][1] + 'px)';
    if (M.reduced()) return;
    pl.animate([
      { transform: 'translate(' + FROM[ink][0] + 'px,' + FROM[ink][1] + 'px)', opacity: 0 },
      { opacity: 1, offset: 0.4 },
      { transform: pl.style.transform, opacity: 1 }
    ], { duration: 1100, delay: 200 + i * 220, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
  });

  // Стебли прорисовываются
  if (!M.reduced()) {
    hero.querySelectorAll('.stem').forEach(function (s, i) {
      s.style.strokeDasharray = '1';
      s.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 900, delay: 500 + i * 40, easing: 'ease-out', fill: 'backwards' });
    });
  }

  // Слои чуть расходятся за курсором — объём без 3D
  var heroArt = document.querySelector('.hero-art');
  if (!M.reduced() && matchMedia('(pointer: fine)').matches) {
    heroArt.addEventListener('pointermove', function (e) {
      var r = heroArt.getBoundingClientRect();
      var mx = (e.clientX - r.left) / r.width - 0.5;
      var my = (e.clientY - r.top) / r.height - 0.5;
      heroPlates.forEach(function (pl) {
        var ink = pl.dataset.ink;
        pl.style.transition = 'transform .4s ease-out';
        pl.style.transform = 'translate(' + n(REST[ink][0] + mx * DEPTH[ink]) + 'px,' + n(REST[ink][1] + my * DEPTH[ink]) + 'px)';
      });
    });
    heroArt.addEventListener('pointerleave', function () {
      heroPlates.forEach(function (pl) {
        var ink = pl.dataset.ink;
        pl.style.transform = 'translate(' + REST[ink][0] + 'px,' + REST[ink][1] + 'px)';
      });
    });
  }

  // Печать-штамп вращается при прокрутке
  var stamp = document.querySelector('.stamp svg');
  M.onScroll(function (y) {
    stamp.style.setProperty('--rot', n(y * 0.3) + 'deg');
  });

  // Заголовки «совмещаются» при появлении
  M.reveal('.print', 0.5);

  // ---------- Конструктор букета ----------
  var SIZE = { rose: 40, ranunculus: 33, daisy: 31, tulip: 29, eucalyptus: 40, gypsophila: 29 };
  var MAX = 25;
  var CENTER = { x: 200, y: 190 };
  var BTIE = { x: 200, y: 360 };
  var stage = document.querySelector('.builder-stage');
  var gFlowers = stage.querySelector('.b-flowers');
  var gStems = stage.querySelector('.b-stems');
  var gWrap = stage.querySelector('.b-wrap');
  var gRibbon = stage.querySelector('.b-ribbon');
  var list = document.querySelector('.flower-list');
  var wrapBox = document.querySelector('.wrap-options');
  var orderBtn = document.querySelector('[data-order-built]');
  var counts = {};
  var bunch = []; // экземпляры цветов в порядке добавления
  var wrapId = WRAPS[0].id;
  var keySeq = 0;

  // Место i-го цветка: «подсолнечная» спираль (золотой угол) — ровно и естественно
  function slot(i) {
    var a = i * 2.39996;
    var rad = i ? 20 + 21 * Math.sqrt(i) : 0;
    return { x: CENTER.x + Math.cos(a) * rad, y: CENTER.y + Math.sin(a) * rad * 0.82 };
  }

  function byId(id) {
    return FLOWERS.filter(function (f) { return f.id === id; })[0];
  }

  function iconSVG(type) {
    var r = type === 'eucalyptus' ? 20 : 18;
    return '<svg class="riso" viewBox="-24 -24 48 48" aria-hidden="true">' + flowerSVG(type, r, 0, 0, 0, M.seeded(3)) + '</svg>';
  }

  FLOWERS.forEach(function (f) {
    counts[f.id] = 0;
    var li = document.createElement('li');
    li.className = 'flower-row';
    li.dataset.id = f.id;
    li.innerHTML = iconSVG(f.type) +
      '<div><h3>' + f.name + '</h3><p>' + f.price + ' ₽ за стебель</p></div>' +
      '<div class="stepper">' +
      '<button type="button" data-step="-1" aria-label="Убрать: ' + f.name + '" disabled>−</button>' +
      '<output aria-label="' + f.name + ', штук">0</output>' +
      '<button type="button" data-step="1" aria-label="Добавить: ' + f.name + '">+</button></div>';
    list.appendChild(li);
  });

  WRAPS.forEach(function (w, i) {
    var label = document.createElement('label');
    label.innerHTML = '<input type="radio" name="wrap" value="' + w.id + '"' + (i === 0 ? ' checked' : '') + '>' +
      '<span>' + w.name + (w.price ? ' +' + w.price + ' ₽' : '') + '</span>';
    wrapBox.appendChild(label);
  });

  function drawWrap() {
    var has = bunch.length > 0;
    var cone = 'M104 272 L296 272 L230 424 L170 424Z';
    var half = 'M104 272 L200 272 L200 424 L170 424Z';
    var html = '';
    if (has && wrapId === 'kraft') html = '<path class="f-yellow" d="' + cone + '"/><path class="f-dots-yellow" d="' + half + '"/>';
    if (has && wrapId === 'calka') html = '<path class="f-lines-blue" style="opacity:.55" d="' + cone + '"/><path class="s-blue" d="' + cone + '"/>';
    gWrap.innerHTML = html;
    gRibbon.innerHTML = has
      ? '<ellipse class="s-pink" cx="180" cy="358" rx="20" ry="9" transform="rotate(-20 180 358)"/><ellipse class="s-pink" cx="220" cy="358" rx="20" ry="9" transform="rotate(20 220 358)"/><path class="s-pink" d="M196 362 L178 404 M204 362 L226 400"/>'
      : '';
  }

  function drawStems(newKey) {
    gStems.innerHTML = '';
    bunch.forEach(function (b, i) {
      var p = slot(i);
      var line = document.createElementNS(SVGNS, 'line');
      line.setAttribute('class', 's-green');
      line.setAttribute('x1', n(p.x));
      line.setAttribute('y1', n(p.y));
      line.setAttribute('x2', n(BTIE.x + (p.x - BTIE.x) * 0.08));
      line.setAttribute('y2', 430);
      if (b.key === newKey) {
        var len = Math.hypot(p.x - BTIE.x, 430 - p.y);
        line.style.setProperty('--len', n(len));
        line.style.strokeDasharray = n(len);
      } else {
        line.style.animation = 'none';
      }
      gStems.appendChild(line);
    });
  }

  function layout() {
    bunch.forEach(function (b, i) {
      var p = slot(i);
      b.el.style.transform = 'translate(' + n(p.x) + 'px,' + n(p.y) + 'px)';
    });
  }

  function plural(k) {
    var a = k % 10;
    var b = k % 100;
    if (a === 1 && b !== 11) return 'стебель';
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return 'стебля';
    return 'стеблей';
  }

  function updateTotals() {
    var total = 0;
    FLOWERS.forEach(function (f) { total += counts[f.id] * f.price; });
    var wrap = WRAPS.filter(function (w) { return w.id === wrapId; })[0];
    if (bunch.length) total += wrap.price;
    M.tweenNumber(document.querySelector('[data-total]'), total, { duration: 450 });
    document.querySelector('[data-stems]').textContent = bunch.length;
    document.querySelector('[data-stems-word]').textContent = plural(bunch.length);
    stage.classList.toggle('has-flowers', bunch.length > 0);
    orderBtn.disabled = bunch.length === 0;
    list.querySelectorAll('.flower-row').forEach(function (row) {
      var c = counts[row.dataset.id];
      row.classList.toggle('has-count', c > 0);
      row.querySelector('[data-step="-1"]').disabled = c === 0;
      row.querySelector('[data-step="1"]').disabled = bunch.length >= MAX;
    });
    return total;
  }

  function add(id) {
    if (bunch.length >= MAX) return;
    var f = byId(id);
    var key = ++keySeq;
    var g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('class', 'b-flower');
    g.innerHTML = '<g>' + flowerSVG(f.type, SIZE[f.type], 0, 0, (key * 47) % 360, M.seeded(key)) + '</g>';
    var p = slot(bunch.length);
    g.style.transform = 'translate(' + n(p.x) + 'px,' + n(p.y) + 'px)';
    gFlowers.appendChild(g);
    bunch.push({ id: id, key: key, el: g });
    counts[id]++;
    drawStems(key);
    drawWrap();
  }

  function remove(id) {
    for (var i = bunch.length - 1; i >= 0; i--) {
      if (bunch[i].id === id) {
        var gone = bunch.splice(i, 1)[0];
        counts[id]--;
        gone.el.classList.add('is-leaving');
        setTimeout(function () { gone.el.remove(); }, M.reduced() ? 0 : 300);
        layout();
        drawStems(null);
        drawWrap();
        return;
      }
    }
  }

  list.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-step]');
    if (!btn) return;
    var row = btn.closest('.flower-row');
    if (btn.dataset.step === '1') add(row.dataset.id);
    else remove(row.dataset.id);
    var out = row.querySelector('output');
    out.textContent = counts[row.dataset.id];
    out.classList.remove('is-tick');
    void out.offsetWidth;
    out.classList.add('is-tick');
    updateTotals();
  });

  wrapBox.addEventListener('change', function (e) {
    wrapId = e.target.value;
    drawWrap();
    updateTotals();
  });

  function orderText(text) {
    var comment = document.getElementById('f-comment');
    comment.value = text;
    document.getElementById('order').scrollIntoView({ behavior: M.reduced() ? 'auto' : 'smooth' });
    setTimeout(function () { document.getElementById('f-name').focus({ preventScroll: true }); }, 600);
  }

  orderBtn.addEventListener('click', function () {
    var total = updateTotals();
    var parts = FLOWERS.filter(function (f) { return counts[f.id]; }).map(function (f) {
      return f.name + ' × ' + counts[f.id];
    });
    var wrap = WRAPS.filter(function (w) { return w.id === wrapId; })[0];
    orderText('Букет из конструктора: ' + parts.join(', ') + '. Упаковка: ' + wrap.name.toLowerCase() + '. Сумма: ' + M.format(total, 0) + ' ₽');
  });

  // Стартовый букет, чтобы конструктор не был пустым
  ['rose', 'rose', 'euca', 'daisy', 'gyps'].forEach(add);
  FLOWERS.forEach(function (f) {
    list.querySelector('[data-id="' + f.id + '"] output').textContent = counts[f.id];
  });
  updateTotals();

  // ---------- Каталог ----------
  var BOUQUETS = [
    { name: 'Розовый шум', comp: 'Пионовидные розы, ранункулюсы, гипсофила', price: 4900, kind: 'mix', mix: { rose: 3, ranunculus: 3, gypsophila: 3 } },
    { name: 'Ромашки и всё', comp: '25 хризантем-ромашек', price: 2400, kind: 'mono', mix: { daisy: 9 } },
    { name: 'Голубая калька', comp: 'Тюльпаны, гипсофила, эвкалипт в кальке', price: 3600, kind: 'mix', mix: { tulip: 4, gypsophila: 3, eucalyptus: 2 } },
    { name: 'Тюльпаны, 25 штук', comp: 'Тюльпаны одного сорта, перевязаны лентой', price: 2900, kind: 'mono', mix: { tulip: 8 } },
    { name: 'Коробка «Утро»', comp: 'Розы и эвкалипт в шляпной коробке', price: 5200, kind: 'box', mix: { rose: 4, eucalyptus: 3 } },
    { name: 'Эвкалипт и ранункулюсы', comp: 'Ранункулюсы и веточки эвкалипта', price: 2800, kind: 'mix', mix: { ranunculus: 4, eucalyptus: 3 } }
  ];

  function cardArt(b, seed) {
    var rand = M.seeded(seed);
    var items = [];
    var types = [];
    Object.keys(b.mix).forEach(function (t) {
      for (var i = 0; i < b.mix[t]; i++) types.push(t);
    });
    // Зелень — по краям, крупные цветы — в центре
    types.sort(function (a, c) { return (c === 'eucalyptus') - (a === 'eucalyptus'); }).reverse();
    types.forEach(function (t, i) {
      var a = i * 2.39996;
      var rad = i ? 10 + 15 * Math.sqrt(i) : 0;
      items.push({ type: t, x: 100 + Math.cos(a) * rad, y: 84 + Math.sin(a) * rad * 0.8, r: SIZE[t] * 0.62, rot: rand() * 360 });
    });
    var p = plates(items, rand);
    var stems = items.map(function (it) {
      return '<line class="s-green" x1="' + n(it.x) + '" y1="' + n(it.y) + '" x2="' + n(100 + (it.x - 100) * 0.1) + '" y2="188"/>';
    }).join('');
    var base = b.kind === 'box'
      ? '<rect class="f-yellow" x="48" y="118" width="104" height="72" rx="10"/><rect class="f-lines-blue" x="48" y="118" width="104" height="14" rx="4"/>'
      : '<path class="s-pink" d="M84 158 Q100 150 116 158 M92 156 L86 182 M108 156 L116 180"/>';
    return '<svg class="riso" viewBox="0 0 200 200" aria-hidden="true">' +
      '<g class="plate">' + stems + p.green + p.yellow + '</g>' +
      '<g class="plate">' + (b.kind === 'box' ? base : '') + '</g>' +
      '<g class="plate plate-pink">' + p.pink + (b.kind === 'box' ? '' : base) + '</g>' +
      '<g class="plate plate-blue">' + p.blue + '</g></svg>';
  }

  var cardsEl = document.querySelector('.cards');
  BOUQUETS.forEach(function (b, i) {
    var li = document.createElement('li');
    li.className = 'card';
    li.dataset.kind = b.kind;
    li.dataset.price = b.price;
    li.innerHTML = '<div class="card-art">' + cardArt(b, i + 11) + '</div>' +
      '<h3>' + b.name + '</h3><p>' + b.comp + '</p>' +
      '<div class="card-foot"><span class="card-price">' + M.format(b.price, 0) + ' ₽</span>' +
      '<button class="btn btn-line" type="button">Заказать</button></div>';
    li.querySelector('button').addEventListener('click', function () {
      orderText('Готовый букет «' + b.name + '», ' + M.format(b.price, 0) + ' ₽');
    });
    cardsEl.appendChild(li);
  });

  function matches(card, filter) {
    if (filter === 'all') return true;
    if (filter === 'cheap') return +card.dataset.price <= 3000;
    if (filter === 'mix') return card.dataset.kind === 'mix' || card.dataset.kind === 'box';
    return card.dataset.kind === filter;
  }

  // Фильтр с FLIP-анимацией: карточки плавно переезжают на новые места
  document.querySelector('.chips').addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c === chip); });
    var cards = Array.from(cardsEl.children);
    var first = new Map();
    cards.forEach(function (c) { if (!c.hidden) first.set(c, c.getBoundingClientRect()); });
    cards.forEach(function (c) { c.hidden = !matches(c, chip.dataset.filter); });
    if (M.reduced()) return;
    cards.forEach(function (c) {
      if (c.hidden) return;
      var last = c.getBoundingClientRect();
      var was = first.get(c);
      if (was) {
        c.animate([
          { transform: 'translate(' + (was.left - last.left) + 'px,' + (was.top - last.top) + 'px)' },
          { transform: 'none' }
        ], { duration: 500, easing: 'cubic-bezier(.2,.8,.2,1)' });
      } else {
        c.animate([
          { transform: 'scale(.85) rotate(-3deg)', opacity: 0 },
          { transform: 'none', opacity: 1 }
        ], { duration: 450, delay: 120, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'backwards' });
      }
    });
  });

  // ---------- Маршрут курьера ----------
  var route = document.querySelector('.route');
  var path = route.querySelector('.route-path');
  var done = route.querySelector('.route-done');
  var courier = route.querySelector('.courier');
  var stepsLi = document.querySelectorAll('.route-steps li');
  var total = path.getTotalLength();
  done.setAttribute('pathLength', '1');
  done.style.strokeDasharray = '1';

  M.onScroll(function () {
    var r = route.getBoundingClientRect();
    var p = Math.min(Math.max((innerHeight * 0.75 - r.top) / (innerHeight * 0.55), 0), 1);
    done.style.strokeDashoffset = 1 - p;
    var pt = path.getPointAtLength(p * total);
    var pt2 = path.getPointAtLength(Math.min(p * total + 4, total));
    var sx = r.width / 1000;
    var sy = r.height / 140;
    var ang = Math.atan2((pt2.y - pt.y) * sy, (pt2.x - pt.x) * sx) * 180 / Math.PI;
    courier.style.transform = 'translate(' + n(pt.x * sx) + 'px,' + n(pt.y * sy) + 'px) rotate(' + n(ang) + 'deg)';
    stepsLi.forEach(function (li, i) {
      li.classList.toggle('is-reached', p > 0 && p >= i / (stepsLi.length - 1) - 0.04);
    });
  });

  // ---------- Отзывы-стопка ----------
  var stack = document.querySelector('.stack');
  var order = Array.from(stack.querySelectorAll('.review'));

  function arrange() {
    order.forEach(function (card, i) {
      card.style.setProperty('--depth', i);
      card.style.zIndex = order.length - i;
      card.classList.toggle('is-top', i === 0);
      card.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    });
  }

  function flyOut(dir) {
    var top = order[0];
    var finish = function () {
      order.push(order.shift());
      top.style.transform = '';
      top.style.opacity = '';
      arrange();
    };
    if (M.reduced()) {
      finish();
      return;
    }
    top.classList.remove('is-dragging');
    top.style.transform = 'translate(' + dir * 120 + '%, -6%) rotate(' + dir * 18 + 'deg)';
    top.style.opacity = '0';
    setTimeout(finish, 320);
  }

  arrange();
  document.querySelector('[data-next-review]').addEventListener('click', function () { flyOut(1); });

  var dragX = 0;
  var startX = 0;
  var dragging = null;
  stack.addEventListener('pointerdown', function (e) {
    var card = e.target.closest('.review');
    if (card !== order[0]) return;
    dragging = card;
    startX = e.clientX;
    dragX = 0;
    card.setPointerCapture(e.pointerId);
    card.classList.add('is-dragging');
  });
  stack.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    dragX = e.clientX - startX;
    dragging.style.transform = 'translateX(' + dragX + 'px) rotate(' + n(dragX / 18) + 'deg)';
  });
  function endDrag() {
    if (!dragging) return;
    var card = dragging;
    dragging = null;
    card.classList.remove('is-dragging');
    if (Math.abs(dragX) > 90) flyOut(dragX > 0 ? 1 : -1);
    else card.style.transform = '';
  }
  stack.addEventListener('pointerup', endDrag);
  stack.addEventListener('pointercancel', endDrag);

  // ---------- Лепестки после отправки заказа ----------
  var form = document.querySelector('form[data-lead-form]');
  form.addEventListener('formsent', function () {
    if (M.reduced()) return;
    var btn = form.querySelector('[type=submit]').getBoundingClientRect();
    var colors = ['var(--pink)', 'var(--green)', 'var(--blue)', 'var(--yellow)'];
    for (var i = 0; i < 28; i++) {
      var petal = document.createElement('span');
      petal.className = 'petal';
      petal.style.background = colors[i % colors.length];
      petal.style.left = (btn.left + btn.width / 2) + 'px';
      petal.style.top = (btn.top + btn.height / 2) + 'px';
      document.body.appendChild(petal);
      var dx = (Math.random() - 0.5) * 520;
      var dy = -80 - Math.random() * 260;
      var rot = (Math.random() - 0.5) * 720;
      petal.animate([
        { transform: 'translate(-50%,-50%) scale(.3)', opacity: 1 },
        { transform: 'translate(' + n(dx) + 'px,' + n(dy) + 'px) rotate(' + n(rot / 2) + 'deg) scale(1)', opacity: 1, offset: 0.45 },
        { transform: 'translate(' + n(dx * 1.2) + 'px,' + n(dy + 320) + 'px) rotate(' + n(rot) + 'deg) scale(.8)', opacity: 0 }
      ], { duration: 1600 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = (function (el) {
        return function () { el.remove(); };
      })(petal);
    }
  });

  // Минимальная дата доставки — сегодня
  var date = document.getElementById('f-date');
  date.min = new Date().toISOString().slice(0, 10);
})();
