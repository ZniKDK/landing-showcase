/* «Зелёная волна»: дорога с машинами, маршрут вдоль страницы, квиз ПДД,
   калькулятор с рычагом КПП, группы с обратным отсчётом. */
(function () {
  'use strict';

  var M = window.Motion;
  var PRICES = window.PRICES;
  var GROUPS = window.GROUPS;

  // ---------- Дорога под hero: разметка и машины ----------
  var road = document.querySelector('.road');
  var roadAnims = [];
  var cars = road.querySelectorAll('.road-car');

  if (!M.reduced()) {
    roadAnims.push(road.querySelector('.road-lines').animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-60px)' }],
      { duration: 380, iterations: Infinity, easing: 'linear' }
    ));
    cars.forEach(function (car, i) {
      roadAnims.push(car.animate(
        [{ transform: 'translateX(-120px)' }, { transform: 'translateX(calc(100vw + 40px))' }],
        { duration: i ? 5200 : 8000, delay: i ? 1800 : 0, iterations: Infinity, easing: 'linear' }
      ));
    });
  }

  // Чем быстрее прокрутка, тем быстрее едет дорога; при замедлении — стоп-сигналы
  var lastY = scrollY;
  var speed = 1;
  var brakeTimer = null;
  M.onScroll(function (y) {
    var v = Math.abs(y - lastY);
    lastY = y;
    var target = 1 + Math.min(v / 12, 4);
    if (target > speed) speed = target;
  });
  (function tick() {
    var prev = speed;
    speed = Math.max(1, speed * 0.94);
    roadAnims.forEach(function (a) { a.playbackRate = speed; });
    if (prev > 1.6 && speed < prev) {
      cars.forEach(function (c) { c.classList.add('is-braking'); });
      clearTimeout(brakeTimer);
      brakeTimer = setTimeout(function () {
        cars.forEach(function (c) { c.classList.remove('is-braking'); });
      }, 400);
    }
    requestAnimationFrame(tick);
  })();

  // ---------- Маршрут вдоль страницы ----------
  var rail = document.querySelector('.rail');
  var railCar = rail.querySelector('.rail-car');
  var stopsBox = rail.querySelector('.rail-stops');
  var STOPS = [
    ['program', 'Программа'], ['quiz', 'Квиз'], ['price', 'Стоимость'],
    ['team', 'Инструкторы'], ['groups', 'Группы'], ['signup', 'Запись']
  ];
  var stopEls = STOPS.map(function (s) {
    var a = document.createElement('a');
    a.href = '#' + s[0];
    a.tabIndex = -1;
    a.innerHTML = '<span>' + s[1] + '</span>';
    stopsBox.appendChild(a);
    return a;
  });

  function placeStops() {
    var max = document.documentElement.scrollHeight - innerHeight;
    var h = rail.clientHeight;
    var pos = STOPS.map(function (s, i) {
      var top = document.getElementById(s[0]).offsetTop - 100;
      stopEls[i].dataset.at = Math.min(top, max);
      return Math.min(Math.max(top / max, 0), 1) * h;
    });
    // Последние секции упираются в конец прокрутки — раздвигаем точки, чтобы не слипались
    for (var i = pos.length - 2; i >= 0; i--) pos[i] = Math.min(pos[i], pos[i + 1] - 22);
    pos.forEach(function (p, i) { stopEls[i].style.top = p + 'px'; });
  }

  addEventListener('load', placeStops);
  addEventListener('resize', placeStops);
  placeStops();

  M.onScroll(function (y) {
    var max = document.documentElement.scrollHeight - innerHeight;
    var p = max > 0 ? y / max : 0;
    railCar.style.transform = 'translateY(' + (p * (rail.clientHeight - 40)) + 'px)';
    stopEls.forEach(function (a) { a.classList.toggle('is-passed', y >= +a.dataset.at - 4); });
  });

  // ---------- Программа: знаки опускаются по очереди ----------
  document.querySelectorAll('.stage').forEach(function (s, i) { s.style.setProperty('--i', i); });
  M.reveal('.stage', 0.3);

  // ---------- Квиз ПДД ----------
  function octagon(cx, cy, r) {
    var pts = [];
    for (var i = 0; i < 8; i++) {
      var a = Math.PI / 8 + i * Math.PI / 4;
      pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
    }
    return pts.join(' ');
  }

  var QUESTIONS = [
    {
      sign: '<svg viewBox="0 0 110 100" role="img" aria-label="Перевёрнутый треугольник с красной каймой"><path d="M8 10h94L55 92z" fill="#fff" stroke="#d7262f" stroke-width="9" stroke-linejoin="round"/></svg>',
      q: 'Что означает этот знак?',
      options: ['Уступите дорогу', 'Движение без остановки запрещено', 'Главная дорога'],
      right: 0,
      note: 'Знак 2.4: уступите дорогу тем, кто едет по пересекаемой дороге.'
    },
    {
      sign: '<svg viewBox="0 0 100 100" role="img" aria-label="Красный восьмиугольник с надписью STOP"><polygon points="' + octagon(50, 50, 47) + '" fill="#fff"/><polygon points="' + octagon(50, 50, 42) + '" fill="#d7262f"/><text x="50" y="59" text-anchor="middle" font-family="Geologica, sans-serif" font-weight="800" font-size="25" fill="#fff">STOP</text></svg>',
      q: 'Что нужно сделать у этого знака?',
      options: ['Остановиться у стоп-линии, даже если помех нет', 'Остановиться, только если есть встречные машины', 'Снизить скорость до 20 км/ч'],
      right: 0,
      note: 'Знак 2.5: остановка обязательна всегда, затем уступить дорогу.'
    },
    {
      sign: '<svg viewBox="0 0 160 80" role="img" aria-label="Белый знак населённого пункта с надписью Москва"><rect x="3" y="3" width="154" height="74" rx="8" fill="#fff" stroke="#15171c" stroke-width="5"/><text x="80" y="50" text-anchor="middle" font-family="Geologica, sans-serif" font-weight="800" font-size="26" fill="#15171c">Москва</text></svg>',
      q: 'Вы въехали в город. Какая скорость разрешена, если других знаков нет?',
      options: ['40 км/ч', '60 км/ч', '80 км/ч'],
      right: 1,
      note: 'В населённых пунктах — не больше 60 км/ч (пункт 10.2 ПДД).'
    }
  ];

  var card = document.querySelector('.quiz-card');
  var lamps = document.querySelectorAll('.quiz-lights i');
  var qi = 0;
  var score = 0;

  function enter() {
    card.classList.remove('is-enter');
    void card.offsetWidth;
    card.classList.add('is-enter');
  }

  function renderQuestion() {
    var q = QUESTIONS[qi];
    card.innerHTML =
      '<p class="quiz-step">Вопрос ' + (qi + 1) + ' из ' + QUESTIONS.length + '</p>' +
      '<div class="quiz-sign">' + q.sign + '</div>' +
      '<h3 class="quiz-q">' + q.q + '</h3>' +
      '<div class="quiz-options" role="group" aria-label="Варианты ответа"></div>';
    var box = card.querySelector('.quiz-options');
    q.options.forEach(function (text, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.addEventListener('click', function () { answer(i); });
      box.appendChild(b);
    });
    enter();
  }

  function answer(i) {
    var q = QUESTIONS[qi];
    var buttons = card.querySelectorAll('.quiz-options button');
    var ok = i === q.right;
    buttons.forEach(function (b, k) {
      b.disabled = true;
      if (k === q.right) b.classList.add('is-ok');
    });
    if (!ok) buttons[i].classList.add('is-bad');
    else {
      score++;
      card.querySelector('.quiz-sign').classList.add('is-ok');
    }
    lamps[qi].classList.add(ok ? 'is-ok' : 'is-bad');

    var note = document.createElement('p');
    note.className = 'quiz-note';
    note.textContent = (ok ? 'Верно. ' : 'Не совсем. ') + q.note;
    card.appendChild(note);

    var next = document.createElement('button');
    next.type = 'button';
    next.className = 'btn btn-line';
    next.textContent = qi < QUESTIONS.length - 1 ? 'Следующий вопрос' : 'Узнать результат';
    next.addEventListener('click', function () {
      qi++;
      if (qi < QUESTIONS.length) renderQuestion();
      else renderResult();
    });
    card.appendChild(next);
    next.focus({ preventScroll: true });
  }

  function renderResult() {
    var text = score === 3
      ? 'Теория вам почти не страшна. Можно сразу больше времени уделить вождению.'
      : score === 2
        ? 'Хорошая база. За 6 недель теории доведём до уверенных 20 из 20.'
        : 'Нормально для старта: так отвечают почти все до обучения. Разберём каждый билет.';
    card.innerHTML =
      '<p class="quiz-step">Результат</p>' +
      '<p class="quiz-result">' + score + ' из ' + QUESTIONS.length + '</p>' +
      '<p class="quiz-note">' + text + '</p>' +
      '<div class="hero-cta"><a class="btn btn-go" href="#signup"><span class="lights" aria-hidden="true"><i></i><i></i><i></i></span>Записаться</a>' +
      '<button class="btn btn-line" type="button" data-restart>Пройти ещё раз</button></div>';
    card.querySelector('[data-restart]').addEventListener('click', function () {
      qi = 0;
      score = 0;
      lamps.forEach(function (l) { l.className = ''; });
      renderQuestion();
    });
    enter();
  }

  renderQuestion();

  // ---------- Калькулятор ----------
  var gear = 'manual';
  var months = 1;
  var seg = document.querySelector('.segmented');
  var gate = document.querySelector('.shifter-gate');
  var knob = document.querySelector('.shifter-knob');
  var extra = document.getElementById('extra');
  var extraOut = document.getElementById('extra-out');
  var totalEl = document.querySelector('[data-total]');
  var monthText = document.querySelector('[data-month-text]');
  var GATES = {
    manual: 'M16 16v48M40 16v48M64 16v48M16 40h48',
    auto: 'M40 12v56M40 12v0M40 12v0M40 40h0'
  };
  var KNOB_PATH = {
    manual: ['translate(0px,0px)', 'translate(-24px,0px)', 'translate(-24px,-24px)'],
    auto: ['translate(0px,0px)', 'translate(0px,22px)']
  };

  function moveKnob() {
    var path = KNOB_PATH[gear];
    gate.style.d = 'path("' + GATES[gear] + '")';
    knob.style.transform = path[path.length - 1];
    if (M.reduced()) return;
    knob.animate(path.map(function (t) { return { transform: t }; }), { duration: 550, easing: 'cubic-bezier(.3,1.2,.5,1)' });
  }

  function radioGroup(root, attr, onPick) {
    var items = Array.from(root.querySelectorAll('[role=radio]'));
    function pick(btn, focus) {
      items.forEach(function (b) {
        var on = b === btn;
        b.setAttribute('aria-checked', on);
        b.tabIndex = on ? 0 : -1;
      });
      if (focus) btn.focus();
      onPick(btn.dataset[attr]);
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[role=radio]');
      if (b) pick(b);
    });
    root.addEventListener('keydown', function (e) {
      var cur = items.indexOf(document.activeElement);
      if (cur < 0) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); pick(items[(cur + 1) % items.length], true); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); pick(items[(cur - 1 + items.length) % items.length], true); }
    });
  }

  function recalc() {
    var hours = parseInt(extra.value, 10);
    extraOut.textContent = hours;
    extra.style.setProperty('--fill', (hours / extra.max * 100) + '%');
    var total = PRICES[gear] + hours * PRICES.extraHour;
    M.tweenNumber(totalEl, total, { duration: 500 });
    if (months === 1) monthText.textContent = 'Оплата одним платежом';
    else monthText.textContent = 'или ' + months + ' платежей по ' + M.format(Math.ceil(total / months / 100) * 100, 0) + ' ₽ без переплаты';
    var box = totalEl.parentNode;
    box.classList.remove('is-flash');
    void box.offsetWidth;
    box.classList.add('is-flash');
  }

  radioGroup(seg, 'gear', function (v) {
    gear = v;
    seg.classList.toggle('is-auto', v === 'auto');
    moveKnob();
    recalc();
  });
  radioGroup(document.querySelector('.pills'), 'months', function (v) {
    months = parseInt(v, 10);
    recalc();
  });
  extra.addEventListener('input', recalc);
  M.onVisible(document.querySelector('.board'), recalc, 0.3);

  // ---------- Группы с обратным отсчётом ----------
  var groupsEl = document.querySelector('.groups');
  var select = document.getElementById('f-group');
  var DAY = 86400000;

  function plural(n, one, few, many) {
    var a = n % 10;
    var b = n % 100;
    if (a === 1 && b !== 11) return one;
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
    return many;
  }

  var timers = GROUPS.map(function (g) {
    var start = new Date();
    start.setHours(0, 0, 0, 0);
    start = new Date(start.getTime() + g.inDays * DAY);
    var hm = g.time.split(':');
    start.setHours(+hm[0], +hm[1]);

    var li = document.createElement('li');
    li.className = 'group';
    var date = start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' });
    li.innerHTML =
      '<div><h3>' + g.name + '</h3><p class="group-date">старт ' + date + ', ' + g.time + '</p></div>' +
      '<div class="countdown" aria-label="До старта">' +
      '<span><b data-u="d">0</b><small>дн</small></span><span><b data-u="h">00</b><small>ч</small></span>' +
      '<span><b data-u="m">00</b><small>мин</small></span><span><b data-u="s">00</b><small>сек</small></span></div>' +
      '<div><p class="seats-left">Осталось ' + g.seats + ' ' + plural(g.seats, 'место', 'места', 'мест') + ' из ' + g.total + '</p>' +
      '<div class="seats-bar"><i style="--taken:' + Math.round((g.total - g.seats) / g.total * 100) + '%"></i></div></div>' +
      '<a class="btn btn-go" href="#signup"><span class="lights" aria-hidden="true"><i></i><i></i><i></i></span>Записаться</a>';
    li.querySelector('a').addEventListener('click', function () { select.value = g.name; });
    groupsEl.appendChild(li);
    M.onVisible(li, function () { li.classList.add('is-in'); }, 0.4);

    var opt = document.createElement('option');
    opt.textContent = g.name;
    select.appendChild(opt);

    return { start: start, el: li };
  });

  var noGroup = document.createElement('option');
  noGroup.textContent = 'Пока не решил';
  select.appendChild(noGroup);

  function pad(v) {
    return String(v).padStart(2, '0');
  }

  function updateCountdowns() {
    var now = Date.now();
    timers.forEach(function (t) {
      var left = Math.max(0, t.start - now);
      var vals = {
        d: Math.floor(left / DAY),
        h: pad(Math.floor(left / 3600000) % 24),
        m: pad(Math.floor(left / 60000) % 60),
        s: pad(Math.floor(left / 1000) % 60)
      };
      Object.keys(vals).forEach(function (u) {
        var b = t.el.querySelector('[data-u=' + u + ']');
        var v = String(vals[u]);
        if (b.textContent !== v) {
          b.textContent = v;
          if (!M.reduced()) {
            b.classList.remove('is-flip');
            void b.offsetWidth;
            b.classList.add('is-flip');
          }
        }
      });
    });
  }

  updateCountdowns();
  setInterval(updateCountdowns, 1000);
})();
