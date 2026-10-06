/* Данные клиента. Меняйте здесь — тексты в HTML подхватят значения автоматически. */
window.SITE = {
  name: 'Стебель',
  phone: '+7 (900) 000-00-01',
  email: 'hello@stebel.example',
  telegram: 'stebel_demo',
  // Адрес функции приёма заявок (см. проект landing-demo). Пусто — демо-режим.
  endpoint: ''
};

/* Цветы конструктора: цена за стебель в рублях. type — как рисовать (см. app.js) */
window.FLOWERS = [
  { id: 'rose', name: 'Пионовидная роза', price: 390, type: 'rose' },
  { id: 'ranunculus', name: 'Ранункулюс', price: 290, type: 'ranunculus' },
  { id: 'daisy', name: 'Хризантема-ромашка', price: 190, type: 'daisy' },
  { id: 'tulip', name: 'Тюльпан', price: 150, type: 'tulip' },
  { id: 'euca', name: 'Эвкалипт', price: 120, type: 'eucalyptus' },
  { id: 'gyps', name: 'Гипсофила', price: 160, type: 'gypsophila' }
];

window.WRAPS = [
  { id: 'kraft', name: 'Крафт', price: 250 },
  { id: 'calka', name: 'Калька', price: 300 },
  { id: 'ribbon', name: 'Только лента', price: 0 }
];
