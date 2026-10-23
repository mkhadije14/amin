(function () {
  var D = window.AMIN_DATA;
  var $ = function (id) { return document.getElementById(id); };

  // تخزين بسيط (حجم الخط، آخر صفحة، رؤية الترحيب)
  function load(key, fallback) {
    try { var v = localStorage.getItem('amin.' + key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem('amin.' + key, JSON.stringify(value)); } catch (e) {}
  }

  $('message').textContent = D.message;

  // حجم الخط
  var size = load('size', 24);
  function applySize() { document.documentElement.style.setProperty('--text-size', size + 'px'); }
  applySize();
  document.querySelectorAll('[data-size]').forEach(function (b) {
    b.addEventListener('click', function () {
      size = Math.max(18, Math.min(44, size + 3 * Number(b.dataset.size)));
      save('size', size);
      applySize();
    });
  });

  // القوائم
  var LISTS = {
    sabah: { title: 'أذكار الصباح والمساء', items: D.sabahMasa },
    adiya: { title: 'أدعية صحت عن النبي صلى الله عليه وسلم', items: D.adiya }
  };

  function renderList(key) {
    var list = LISTS[key];
    $('list-title').textContent = list.title;
    var box = $('list-items');
    box.textContent = '';
    list.items.forEach(function (item, i) {
      var card = document.createElement('article');
      card.className = 'card';
      var num = document.createElement('span');
      num.className = 'num';
      num.textContent = i + 1;
      var text = document.createElement('p');
      text.className = 'text';
      text.textContent = item.t;
      var foot = document.createElement('div');
      foot.className = 'foot';
      var src = document.createElement('span');
      src.className = 'src';
      src.textContent = item.s;
      foot.appendChild(src);
      if (item.c > 0) {
        var count = 0;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'counter';
        var show = function () {
          var done = count >= item.c;
          btn.textContent = done ? 'تمّ' : count + ' من ' + item.c;
          btn.classList.toggle('done', done);
          btn.setAttribute('aria-label', done ? 'تمّ، اضغط لإعادة العدّ' : 'عدّ ' + count + ' من ' + item.c);
        };
        btn.addEventListener('click', function () {
          count = count >= item.c ? 0 : count + 1;
          if (navigator.vibrate && count === item.c) navigator.vibrate(120);
          show();
        });
        show();
        foot.appendChild(btn);
      }
      card.appendChild(num);
      card.appendChild(text);
      card.appendChild(foot);
      box.appendChild(card);
    });
  }

  // صفحات أبي
  var page = load('page', 0);
  function pageSrc(i) { return 'pages/page-' + String(i + 1).padStart(2, '0') + '.jpg'; }
  function showPage() {
    $('page-img').src = pageSrc(page);
    $('page-img').alt = 'الصفحة ' + (page + 1) + ' من أذكار أبي، بخط اليد';
    $('page-num').textContent = 'الصفحة ' + (page + 1) + ' من ' + D.pages;
    $('prev').disabled = page === 0;
    $('next').disabled = page === D.pages - 1;
    $('viewer').scrollTop = 0;
    save('page', page);
  }
  $('next').addEventListener('click', function () { if (page < D.pages - 1) { page++; showPage(); } });
  $('prev').addEventListener('click', function () { if (page > 0) { page--; showPage(); } });
  $('zoom').addEventListener('click', function () { $('viewer').classList.toggle('zoomed'); });

  // التنقل
  function route() {
    var h = location.hash.replace('#', '');
    if (!h) h = load('seenWelcome', false) ? 'home' : 'welcome';
    document.querySelectorAll('.screen').forEach(function (s) { s.hidden = true; });
    if (h === 'sabah' || h === 'adiya') {
      renderList(h);
      $('list').hidden = false;
    } else if (h === 'khassa') {
      showPage();
      $('khassa').hidden = false;
    } else if (h === 'welcome') {
      save('seenWelcome', true);
      $('welcome').hidden = false;
    } else {
      $('home').hidden = false;
    }
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  route();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js'); });
  }
})();
