/* «Аптайм»: живая карта сети, вкладки услуг, шаги, калькулятор тарифов. */
(function () {
  'use strict';

  var M = window.Motion;

  // ---------- Шапка и прогресс чтения ----------
  var header = document.querySelector('.header');
  M.onScroll(function (y) {
    header.classList.toggle('is-scrolled', y > 10);
  });
  M.scrollProgress(document.querySelector('.progress'));

  // ---------- Заголовок по словам ----------
  document.querySelectorAll('[data-split]').forEach(function (el) {
    M.splitText(el, 'words');
    el.classList.add('is-split');
  });

  // ---------- Карта сети в hero ----------
  var SVG = 'http://www.w3.org/2000/svg';
  var ROUTER = { id: 'gw', x: 260, y: 200, short: 'GW', label: 'Роутер' };
  var NODES = [
    { id: 'pc1', x: 80, y: 70, short: 'ПК', label: 'Бухгалтерия' },
    { id: 'pc2', x: 60, y: 200, short: 'ПК', label: 'Директор' },
    { id: 'pc3', x: 80, y: 330, short: 'ПК', label: 'Менеджеры' },
    { id: 'wifi', x: 260, y: 48, short: 'Wi‑Fi', label: 'Точка доступа' },
    { id: 'prn', x: 440, y: 70, short: 'МФУ', label: 'Принтер' },
    { id: 'srv', x: 460, y: 200, short: '1С', label: 'Сервер 1С' },
    { id: 'cam', x: 440, y: 330, short: 'CAM', label: 'Камера' },
    { id: 'nas', x: 260, y: 352, short: 'NAS', label: 'Бэкапы' }
  ];
  // Сбои, которые «замечает» мониторинг, и как их чинит дежурный
  var INCIDENTS = {
    prn: ['принтер: очередь печати зависла', 'перезапуск диспетчера печати', 'принтер печатает'],
    pc3: ['менеджеры: не открывается почта', 'восстановление профиля Outlook', 'почта работает'],
    wifi: ['wi-fi: скорость упала до 3 Мбит/с', 'смена канала 6 → 11, помехи ушли', 'wi-fi 280 Мбит/с'],
    srv: ['1С: база отвечает 9 секунд', 'перестроение индексов базы', '1С отвечает за 0,4 с'],
    nas: ['бэкап: ночная копия не завершилась', 'повтор копирования, 42 ГБ', 'копия проверена'],
    cam: ['камера: нет картинки', 'перезагрузка по PoE', 'камера в сети'],
    pc1: ['бухгалтерия: диск заполнен на 97 %', 'очистка временных файлов, 38 ГБ', 'свободно 41 %']
  };

  var svg = document.querySelector('.netmap-svg');
  var linksG = svg.querySelector('.links');
  var packetsG = svg.querySelector('.packets');
  var nodesG = svg.querySelector('.nodes');
  var log = document.querySelector('.term-log');
  var nodeEls = {};
  var linkEls = {};

  function make(tag, attrs, parent) {
    var el = document.createElementNS(SVG, tag);
    Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(el);
    return el;
  }

  function drawNode(n, isRouter) {
    var g = make('g', { class: 'node' + (isRouter ? ' is-router' : ''), transform: 'translate(' + n.x + ' ' + n.y + ')' }, nodesG);
    var r = isRouter ? 30 : 23;
    make('circle', { class: 'ring', r: r }, g);
    make('circle', { class: 'core', r: r }, g);
    make('text', {}, g).textContent = n.short;
    var label = make('text', { class: 'label', y: n.y > 300 || isRouter ? r + 16 : -r - 12 }, g);
    label.textContent = n.label;
    nodeEls[n.id] = g;
  }

  NODES.forEach(function (n) {
    linkEls[n.id] = make('line', { class: 'link', x1: ROUTER.x, y1: ROUTER.y, x2: n.x, y2: n.y }, linksG);
    drawNode(n);
  });
  drawNode(ROUTER, true);

  // Пакеты данных бегают по линиям между роутером и устройствами
  var running = false;
  function spawnPacket() {
    if (!running || M.reduced()) return;
    var n = NODES[Math.floor(Math.random() * NODES.length)];
    var alert = nodeEls[n.id].classList.contains('is-down');
    var dot = make('circle', { class: 'packet' + (alert ? ' is-alert' : ''), r: 3 }, packetsG);
    var out = Math.random() > 0.5;
    var a = out ? ROUTER : n;
    var b = out ? n : ROUTER;
    var anim = dot.animate([
      { transform: 'translate(' + a.x + 'px,' + a.y + 'px)', opacity: 0 },
      { opacity: 1, offset: 0.15 },
      { opacity: 1, offset: 0.85 },
      { transform: 'translate(' + b.x + 'px,' + b.y + 'px)', opacity: 0 }
    ], { duration: 900 + Math.random() * 600, easing: 'ease-in-out' });
    anim.onfinish = function () { dot.remove(); };
  }

  function now() {
    return new Date().toLocaleTimeString('ru-RU');
  }

  // Строка лога; если typed — печатаем по буквам
  function addLine(cls, text, typed) {
    var li = document.createElement('li');
    var t = document.createElement('span');
    t.className = 't';
    t.textContent = now() + ' ';
    var body = document.createElement('span');
    body.className = cls;
    li.appendChild(t);
    li.appendChild(body);
    log.appendChild(li);
    while (log.children.length > 6) log.firstElementChild.remove();
    if (!typed || M.reduced()) {
      body.textContent = text;
      return;
    }
    var i = 0;
    body.classList.add('caret');
    (function type() {
      body.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(type, 22);
      else body.classList.remove('caret');
    })();
  }

  var ids = Object.keys(INCIDENTS);
  var last = null;
  var timers = [];

  function incident() {
    if (!running) return;
    var id;
    do { id = ids[Math.floor(Math.random() * ids.length)]; } while (id === last);
    last = id;
    var steps = INCIDENTS[id];
    var node = nodeEls[id];
    var link = linkEls[id];

    node.classList.add('is-down');
    link.classList.add('is-alert');
    addLine('e', '✗ ' + steps[0]);
    timers.push(setTimeout(function () {
      node.classList.remove('is-down');
      node.classList.add('is-fixing');
      addLine('w', '→ ' + steps[1] + '…', true);
    }, 1800));
    timers.push(setTimeout(function () {
      node.classList.remove('is-fixing');
      node.classList.add('is-fixed');
      link.classList.remove('is-alert');
      addLine('o', '✓ ' + steps[2]);
    }, 4000));
    timers.push(setTimeout(function () {
      node.classList.remove('is-fixed');
    }, 5600));
    timers.push(setTimeout(incident, 6800));
  }

  var packetTimer = null;
  function start() {
    if (running) return;
    running = true;
    packetTimer = setInterval(spawnPacket, 180);
    timers.push(setTimeout(incident, 1400));
  }

  function stop() {
    running = false;
    clearInterval(packetTimer);
    timers.forEach(clearTimeout);
    timers = [];
    Object.keys(nodeEls).forEach(function (k) {
      nodeEls[k].classList.remove('is-down', 'is-fixing', 'is-fixed');
    });
    Object.keys(linkEls).forEach(function (k) { linkEls[k].classList.remove('is-alert'); });
  }

  addLine('o', 'monitor запущен: 9 устройств в сети');

  // Анимация работает, только пока карта на экране и вкладка активна
  var netmap = document.querySelector('.netmap');
  var mapVisible = false;
  function sync() {
    if (mapVisible && !document.hidden) start();
    else stop();
  }
  new IntersectionObserver(function (entries) {
    mapVisible = entries[0].isIntersecting;
    sync();
  }).observe(netmap);
  document.addEventListener('visibilitychange', sync);

  // ---------- Вкладки услуг ----------
  var tabsRoot = document.querySelector('[data-tabs]');
  var tabs = Array.from(tabsRoot.querySelectorAll('[role=tab]'));
  var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
  var panelTimers = [];

  function clearPanelTimers() {
    panelTimers.forEach(clearTimeout);
    panelTimers = [];
  }

  // Отдельная «живая» анимация для каждой панели
  var panelAnim = {
    'p-ws': function (p) {
      var items = p.querySelectorAll('.checklist li');
      var timer = p.querySelector('.timer');
      items.forEach(function (li) { li.classList.remove('is-done'); });
      items.forEach(function (li, i) {
        panelTimers.push(setTimeout(function () {
          li.classList.add('is-done');
          timer.textContent = '00:' + String(Math.round((i + 1) / items.length * 47)).padStart(2, '0');
        }, 400 + i * 520));
      });
    },
    'p-net': function (p) {
      var fill = p.querySelector('.gauge-fill');
      var needle = p.querySelector('.gauge-needle');
      var share = 0.94;
      fill.animate([{ strokeDashoffset: 100 }, { strokeDashoffset: 100 - share * 100 }], { duration: 1400, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
      needle.animate([{ transform: 'rotate(-90deg)' }, { transform: 'rotate(' + (share * 180 - 90) + 'deg)' }], { duration: 1400, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'forwards' });
      var val = p.querySelector('[data-gauge]');
      val.dataset.value = 0;
      M.tweenNumber(val, 940, { duration: 1400 });
    },
    'p-bak': function (p) {
      var bar = p.querySelector('.backup-bar i');
      var pct = p.querySelector('[data-backup-pct]');
      var files = p.querySelectorAll('.backup-files li');
      var marks = [0.45, 0.6, 0.68, 1];
      files.forEach(function (f) { f.classList.remove('is-done'); });
      var dur = M.reduced() ? 1 : 2600;
      var t0 = performance.now();
      (function step(t) {
        var k = Math.min((t - t0) / dur, 1);
        bar.style.transform = 'scaleX(' + k + ')';
        pct.textContent = Math.round(k * 100) + ' %';
        files.forEach(function (f, i) { if (k >= marks[i]) f.classList.add('is-done'); });
        if (k < 1 && p.classList.contains('is-active')) requestAnimationFrame(step);
      })(t0);
    },
    'p-sec': function () { /* анимации на CSS */ }
  };

  function select(index, focus) {
    clearPanelTimers();
    tabs.forEach(function (t, i) {
      var on = i === index;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
      panels[i].classList.toggle('is-active', on);
    });
    // Перезапуск CSS-анимаций полосы
    var bar = tabs[index].querySelector('.tab-bar i');
    bar.style.animation = 'none';
    void bar.offsetWidth;
    bar.style.animation = '';
    if (focus) tabs[index].focus();
    panelAnim[panels[index].id](panels[index]);
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () {
      tabsRoot.classList.add('is-manual');
      select(i);
    });
    // Полоса заполнилась — переходим к следующей вкладке
    tab.querySelector('.tab-bar i').addEventListener('animationend', function () {
      if (!tabsRoot.classList.contains('is-manual')) select((i + 1) % tabs.length);
    });
  });

  tabsRoot.querySelector('[role=tablist]').addEventListener('keydown', function (e) {
    var cur = tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; });
    var next = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (cur + 1) % tabs.length;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (cur - 1 + tabs.length) % tabs.length;
    if (next !== null) {
      e.preventDefault();
      tabsRoot.classList.add('is-manual');
      select(next, true);
    }
  });

  // Пауза автопереключения под курсором и пока блок не виден
  if (M.reduced()) tabsRoot.classList.add('is-manual');
  tabsRoot.classList.add('is-paused');
  tabsRoot.addEventListener('pointerenter', function () { tabsRoot.classList.add('is-paused'); });
  tabsRoot.addEventListener('pointerleave', function () { tabsRoot.classList.remove('is-paused'); });
  M.onVisible(tabsRoot, function () {
    tabsRoot.classList.remove('is-paused');
    select(0);
  }, 0.3);

  // ---------- Цифры ----------
  M.counters('[data-count]');

  // ---------- Шаги: линия идёт за прокруткой ----------
  var stepsEl = document.querySelector('.steps');
  var stepItems = stepsEl.querySelectorAll('.step');
  M.onScroll(function () {
    var r = stepsEl.getBoundingClientRect();
    var p = Math.min(Math.max((innerHeight * 0.85 - r.top) / (innerHeight * 0.45), 0), 1);
    stepsEl.style.setProperty('--line', p);
    stepItems.forEach(function (s, i) {
      s.classList.toggle('is-lit', p >= i / (stepItems.length - 1) - 0.02);
    });
  });

  // ---------- Калькулятор тарифов ----------
  var seats = document.getElementById('seats');
  var seatsOut = document.getElementById('seats-out');
  var plans = document.querySelectorAll('.plan');

  function recalc(animate) {
    var n = parseInt(seats.value, 10);
    seatsOut.textContent = n;
    seats.style.setProperty('--fill', ((n - seats.min) / (seats.max - seats.min) * 100) + '%');
    plans.forEach(function (plan) {
      var price = Math.max(n * plan.dataset.rate, plan.dataset.min);
      M.tweenNumber(plan.querySelector('[data-price]'), price, { duration: animate ? 450 : 1200 });
      var box = plan.querySelector('.plan-price');
      box.classList.remove('is-bump');
      void box.offsetWidth;
      box.classList.add('is-bump');
    });
  }

  seats.addEventListener('input', function () { recalc(true); });
  M.onVisible(document.querySelector('.plans'), function () { recalc(false); }, 0.3);
  M.spotlight('.plan');

  // Кнопка «Выбрать» подставляет тариф в форму
  document.querySelectorAll('[data-plan]').forEach(function (a) {
    a.addEventListener('click', function () {
      document.getElementById('f-plan').value = a.dataset.plan;
    });
  });

  // ---------- FAQ ----------
  M.accordion('.acc');
})();
