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
  var MIN = 20, MAX = 60;
  var size = load('textSize', 30);
  function applySize() { document.documentElement.style.setProperty('--text-size', size + 'px'); }
  function setSize(v) { size = Math.round(Math.max(MIN, Math.min(MAX, v))); applySize(); save('textSize', size); }
  applySize();
  document.querySelectorAll('[data-size]').forEach(function (b) {
    b.addEventListener('click', function () { setSize(size + 4 * Number(b.dataset.size)); });
  });

  // تكبير النص وتصغيره بإصبعين
  var pinchStart = 0, pinchSize = size;
  function gap(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); }
  var listBox = $('list-items');
  listBox.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) { pinchStart = gap(e.touches); pinchSize = size; }
  }, { passive: true });
  listBox.addEventListener('touchmove', function (e) {
    if (e.touches.length === 2 && pinchStart) {
      e.preventDefault();
      setSize(pinchSize * gap(e.touches) / pinchStart);
    }
  }, { passive: false });
  listBox.addEventListener('touchend', function (e) { if (e.touches.length < 2) pinchStart = 0; });

  // القوائم
  var LISTS = {
    sabah: { title: 'أذكار الصباح والمساء', items: D.sabahMasa },
    adiya: { title: 'أدعية صحت عن النبي صلى الله عليه وسلم', items: D.adiya },
    karb: { title: 'أدعية الكرب', items: D.karb },
    salat: { title: 'الصلاة على النبي صلى الله عليه وسلم', items: D.salat },
    mukh: { title: 'أدعية من مخ الدعاء', sub: 'من كتاب مخ الدعاء', items: D.mukh },
    salawat: { title: 'صلوات على النبي صلى الله عليه وسلم من مخ الدعاء', sub: 'من كتاب مخ الدعاء', items: D.salawat }
  };

  // المفضلة: تُحفظ في الهاتف بمفتاح من اسم القسم وبداية النص
  var favs = load('favs', []);
  function favKey(listKey, item) { return listKey + ':' + item.t.slice(0, 60); }
  function isFav(k) { return favs.indexOf(k) !== -1; }
  function toggleFav(k) {
    if (isFav(k)) favs.splice(favs.indexOf(k), 1); else favs.push(k);
    save('favs', favs);
    updateFavCount();
  }
  function updateFavCount() { $('fav-count').textContent = favs.length ? '(' + favs.length + ')' : ''; }
  function favEntries() {
    var out = [];
    favs.forEach(function (k) {
      var listKey = k.split(':')[0];
      var list = LISTS[listKey];
      if (!list) return;
      list.items.forEach(function (item) {
        if (favKey(listKey, item) === k) out.push({ item: item, listKey: listKey });
      });
    });
    return out;
  }
  updateFavCount();

  function renderList(key) {
    var isFavList = key === 'fav';
    var list = isFavList
      ? { title: 'المفضلة', sub: 'ما اخترته من الأقسام', entries: favEntries() }
      : LISTS[key];
    var entries = list.entries || list.items.map(function (item) { return { item: item, listKey: key }; });
    $('list-title').textContent = list.title;
    $('list-sub').textContent = list.sub || 'من كتاب تحفة الذاكرين';
    var box = $('list-items');
    box.textContent = '';
    if (isFavList && !entries.length) {
      var empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'لا يوجد شيء في المفضلة بعد. اضغط على النجمة ☆ بجانب أي ذكر أو دعاء لإضافته هنا.';
      box.appendChild(empty);
      return;
    }
    var items = entries.map(function (e) { return e.item; });
    // فهرس الأقسام الفرعية إن وجدت
    var groups = items.filter(function (item) { return item.g; });
    if (groups.length && !isFavList) {
      var nav = document.createElement('nav');
      nav.className = 'chips';
      groups.forEach(function (item, gi) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.textContent = item.g;
        chip.addEventListener('click', function () {
          var target = document.getElementById('group-' + gi);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        nav.appendChild(chip);
      });
      box.appendChild(nav);
    }
    var groupIndex = 0;
    entries.forEach(function (entry, i) {
      var item = entry.item;
      if (item.g && !isFavList) {
        var gh = document.createElement('h2');
        gh.className = 'group-title';
        gh.id = 'group-' + groupIndex++;
        gh.textContent = item.g;
        box.appendChild(gh);
      }
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
      var top = document.createElement('div');
      top.className = 'card-top';
      top.appendChild(num);
      if (isFavList) {
        var from = document.createElement('span');
        from.className = 'from';
        from.textContent = LISTS[entry.listKey].title;
        top.appendChild(from);
      }
      var k = favKey(entry.listKey, item);
      var star = document.createElement('button');
      star.type = 'button';
      star.className = 'star';
      var paintStar = function () {
        var on = isFav(k);
        star.textContent = on ? '★' : '☆';
        star.classList.toggle('on', on);
        star.setAttribute('aria-label', on ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة');
      };
      star.addEventListener('click', function () {
        toggleFav(k);
        if (isFavList) { renderList('fav'); return; }
        paintStar();
      });
      paintStar();
      top.appendChild(star);
      card.appendChild(top);
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
    if (LISTS[h] || h === 'fav') {
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
