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
    adiya: { title: 'أدعية صحت عن النبي صلى الله عليه وسلم', items: D.adiya },
    karb: { title: 'أدعية الكرب', items: D.karb },
    salat: { title: 'الصلاة على النبي صلى الله عليه وسلم', items: D.salat },
    mukh: { title: 'أدعية من مخ الدعاء', sub: 'من كتاب مخ الدعاء', items: D.mukh }
  };

  function renderList(key) {
    var list = LISTS[key];
    $('list-title').textContent = list.title;
    $('list-sub').textContent = list.sub || 'من كتاب تحفة الذاكرين';
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
      // رموز المصادر داخل النص بخط الواجهة حتى تظهر الأقواس صحيحة
      item.t.split(/(\([^)]*\))/).forEach(function (part) {
        if (!part) return;
        if (part.charAt(0) === '(') {
          var tag = document.createElement('span');
          tag.className = 'tag';
          tag.textContent = part;
          text.appendChild(tag);
        } else {
          text.appendChild(document.createTextNode(part));
        }
      });
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
      // عنوان الدعاء وما قبله وما بعده من كلام الكتاب
      [['h', 'card-title'], ['n', 'note']].forEach(function (k) {
        if (!item[k[0]]) return;
        var el = document.createElement(k[0] === 'h' ? 'h2' : 'p');
        el.className = k[1];
        el.textContent = item[k[0]];
        card.appendChild(el);
      });
      card.appendChild(text);
      if (item.a) {
        var after = document.createElement('p');
        after.className = 'note';
        after.textContent = item.a;
        card.appendChild(after);
      }
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
    if (LISTS[h]) {
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
