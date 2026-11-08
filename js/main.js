/* МАРТдекор — общая логика прототипа: шапка, подвал, карточки, каталог, позиция, статья, «Моя подборка». */
(function () {
  var T = window.typo || function (s) { return s; };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var t = function (s) { return esc(T(s)); };
  var money = function (n) { return T(n.toLocaleString("ru-RU").replace(/ /g, " ") + " ₽"); };
  var secById = function (id) { return SECTIONS.filter(function (s) { return s.id === id; })[0]; };
  var styleById = function (id) { return STYLES.filter(function (s) { return s.id === id; })[0]; };
  var itemById = function (id) { return ITEMS.filter(function (i) { return i.id === id; })[0]; };
  var STATUS = { "in": "В наличии в салоне", few: "Мало на складе", order: "Под заказ" };
  var page = document.body.getAttribute("data-page");

  /* ── шапка и подвал ── */
  var nav = [["catalog.html", "Каталог", "catalog"], ["index.html#podbor", "Подбор по проекту", "podbor"], ["index.html#styles", "Идеи", "styles"], ["designers.html", "Дизайнерам", "designers"], ["index.html#visit", "Контакты", "visit"]];
  var header = $("#header");
  if (header) {
    header.innerHTML =
      '<div class="top"><div class="wrap">' +
      '<a class="logo" href="index.html"><span class="logo-arch"><i></i><i></i><i></i></span><span><small>интерьерный салон</small><b>МАРТдекор</b></span></a>' +
      '<nav class="nav" id="nav">' + nav.map(function (n) { return '<a href="' + n[0] + '"' + (page === n[2] ? ' class="on"' : "") + ">" + t(n[1]) + "</a>"; }).join("") + "</nav>" +
      '<div class="top-cta"><a class="phone" href="tel:+79094200420">' + T("+7 (909) 420‑04‑20") + "</a>" +
      '<button class="bag-btn" id="bagBtn" type="button"><i class="ti ti-bookmarks"></i><span class="lbl">Моя подборка</span><span class="count" id="bagCount">0</span></button>' +
      '<button class="burger" id="burger" type="button" aria-label="Меню"><i class="ti ti-menu-2"></i></button></div>' +
      "</div></div>";
    $("#burger").onclick = function () { $("#nav").classList.toggle("open"); };
  }
  var footer = $("#footer");
  if (footer) {
    footer.innerHTML =
      '<footer><div class="wrap">' +
      '<div><a class="logo" href="index.html"><span class="logo-arch"><i></i><i></i><i></i></span><span><small>интерьерный салон</small><b>МАРТдекор</b></span></a>' +
      '<p style="margin-top:16px">' + t("Все материалы для стен в одном месте. Ростов-на-Дону, с 2018 года.") + "</p></div>" +
      "<div><b>Салон</b>" + t("пр. Михаила Нагибина, 30Л, дизайн-центр WEST") + "<br>" + t("пн–пт 10:00–19:00") + "<br>" + t("сб–вс 10:00–17:00") + "</div>" +
      '<div><b>Связаться</b><a href="tel:+79094200420">' + T("+7 (909) 420‑04‑20") + '</a><a href="tel:+79094209420">' + T("+7 (909) 420‑94‑20") + '</a><a href="mailto:info@martdecor.ru">info@martdecor.ru</a>' + t("WhatsApp, Telegram, MAX") + "</div>" +
      '<div><b>Разделы</b><a href="catalog.html">Каталог</a><a href="designers.html">Дизайнерам и мастерам</a><a href="index.html#faq">Частые вопросы</a><a href="index.html#visit">Как добраться</a></div>' +
      '<div class="proto-note">' + t("Прототип сайта для салона «МАРТдекор». Подготовила Виктория, ноябрь 2026. Цены и характеристики — с martdecor.online и martdecor.ru на 08.11.2026; наличие показано для примера; фото — заглушки.") + "</div>" +
      "</div></footer>";
  }

  /* ── подборка (вместо корзины: оплата всё равно после консультации) ── */
  var KEY = "martdecor-podborka";
  var bag = {};
  try { bag = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { bag = {}; }
  var save = function () { try { localStorage.setItem(KEY, JSON.stringify(bag)); } catch (e) {} renderBag(); syncAddButtons(); };
  var add = function (id, q) { bag[id] = (bag[id] || 0) + (q || 1); save(); };

  document.body.insertAdjacentHTML("beforeend",
    '<aside class="drawer" id="drawer" aria-label="Моя подборка"><div class="drawer-head"><h3>Моя подборка</h3><button class="x" id="drawerX" type="button" aria-label="Закрыть"><i class="ti ti-x"></i></button></div>' +
    '<div class="drawer-body" id="drawerBody"></div>' +
    '<div class="drawer-foot"><div class="sum"><span>Ориентировочно</span><span id="bagSum">0 ₽</span></div>' +
    '<p class="small muted">' + t("Это не заказ. Менеджер проверит наличие, пересчитает количество под вашу площадь и пришлёт счёт.") + "</p>" +
    '<form class="form" id="bagForm"><input required placeholder="Имя"><input required type="tel" placeholder="Телефон или мессенджер">' +
    '<label class="check"><input type="checkbox"> ' + t("Я дизайнер или мастер") + "</label>" +
    '<button class="btn btn-main" type="submit">Отправить подборку менеджеру</button><div class="ok" id="bagOk">' + t("Подборка отправлена. Менеджер свяжется с вами в рабочее время салона.") + "</div></form></div></aside>" +
    '<div class="drawer-bg" id="drawerBg"></div>');

  var openDrawer = function () { $("#drawer").classList.add("open"); $("#drawerBg").classList.add("open"); };
  var closeDrawer = function () { $("#drawer").classList.remove("open"); $("#drawerBg").classList.remove("open"); };
  $("#drawerX").onclick = closeDrawer;
  $("#drawerBg").onclick = closeDrawer;
  if ($("#bagBtn")) $("#bagBtn").onclick = openDrawer;

  function renderBag() {
    var ids = Object.keys(bag).filter(function (id) { return itemById(id) && bag[id] > 0; });
    var n = ids.reduce(function (a, id) { return a + bag[id]; }, 0);
    var sum = ids.reduce(function (a, id) { return a + bag[id] * itemById(id).price; }, 0);
    if ($("#bagCount")) $("#bagCount").textContent = n;
    $("#bagSum").textContent = money(sum);
    $("#drawerBody").innerHTML = ids.length ? ids.map(function (id) {
      var it = itemById(id);
      return '<div class="d-item"><b>' + t(it.name) + '</b><span class="price" style="font-size:15px">' + money(it.price * bag[id]) + "</span>" +
        '<div class="qty"><button type="button" data-q="-1" data-id="' + id + '">−</button><input readonly value="' + bag[id] + '"><button type="button" data-q="1" data-id="' + id + '">+</button></div>' +
        '<span class="small muted" style="align-self:center">' + t(money(it.price) + " за " + it.unit) + "</span>" +
        '<button class="rm" type="button" data-rm="' + id + '">Убрать</button></div>';
    }).join("") : '<p class="muted">' + t("Пока пусто. Добавляйте материалы кнопкой с закладкой — соберём из них подборку для вашего проекта.") + "</p>";
    $$("[data-q]", $("#drawerBody")).forEach(function (b) {
      b.onclick = function () { var id = b.getAttribute("data-id"); bag[id] = Math.max(1, bag[id] + +b.getAttribute("data-q")); save(); };
    });
    $$("[data-rm]", $("#drawerBody")).forEach(function (b) { b.onclick = function () { delete bag[b.getAttribute("data-rm")]; save(); }; });
  }
  function syncAddButtons() {
    $$(".add[data-add]").forEach(function (b) {
      var on = !!bag[b.getAttribute("data-add")];
      b.classList.toggle("in", on);
      b.innerHTML = on ? '<i class="ti ti-check"></i>' : '<i class="ti ti-bookmark-plus"></i>';
      b.title = on ? "В подборке" : "Добавить в подборку";
    });
  }
  $("#bagForm").onsubmit = function (e) { e.preventDefault(); $("#bagOk").classList.add("show"); };

  /* ── карточка позиции ── */
  function card(it) {
    var s = secById(it.sec);
    return '<article class="card rv"><a href="item.html?id=' + it.id + '" class="ph ' + s.tone + '"><span>' + t("Фото: " + it.name.split(" ").slice(0, 3).join(" ") + ", крупно фактура") + "</span></a>" +
      '<div class="card-body"><span class="sec">' + t(s.name) + "</span>" +
      '<h3><a href="item.html?id=' + it.id + '">' + t(it.name) + "</a></h3>" +
      '<div class="line">' + t(it.line) + "</div>" +
      '<span class="status ' + it.status + '">' + t(STATUS[it.status]) + "</span>" +
      '<div class="card-foot"><span class="price">' + money(it.price) + " <small>" + t("за " + it.unit) + "</small></span>" +
      '<button class="add" type="button" data-add="' + it.id + '"></button></div></div></article>';
  }
  function bindAdd(root) {
    $$(".add[data-add]", root).forEach(function (b) {
      b.onclick = function () { var id = b.getAttribute("data-add"); if (bag[id]) { delete bag[id]; save(); } else { add(id); } };
    });
    syncAddButtons();
  }
  window.MD = { card: card, bindAdd: bindAdd };

  /* ── открыто сейчас (Ростов — московское время) ── */
  function openNow() {
    var now = new Date(Date.now() + (new Date().getTimezoneOffset() + 180) * 60000);
    var h = SALON.hours[now.getDay()], m = now.getHours() + now.getMinutes() / 60;
    var on = m >= h[0] && m < h[1];
    var tomorrow = SALON.hours[(now.getDay() + 1) % 7];
    return { on: on, text: on ? "Открыто до " + h[1] + ":00" : (m < h[0] ? "Откроется сегодня в " + h[0] + ":00" : "Откроется завтра в " + tomorrow[0] + ":00") };
  }
  $$("[data-open]").forEach(function (el) {
    var o = openNow();
    el.innerHTML = '<span class="open-dot' + (o.on ? " on" : "") + '"></span>' + t(o.text);
  });

  /* ── главная ── */
  if (page === "home") {
    $("#sections").innerHTML = SECTIONS.map(function (s) {
      var from = Math.min.apply(null, ITEMS.filter(function (i) { return i.sec === s.id; }).map(function (i) { return i.price; }));
      return '<a class="sec-card rv" href="catalog.html?sec=' + s.id + '"><div class="ph ' + s.tone + '"><span>' + t("Фото раздела «" + s.name + "»") + "</span></div>" +
        "<h3>" + t(s.name) + '</h3><div class="from">' + T("от " + money(from)) + '</div><div class="f">' + t(s.fact) + "</div></a>";
    }).join("") +
      '<a class="sec-card rv" href="catalog.html" style="background:var(--wine);color:#fff;border-color:var(--wine);justify-content:center">' +
      '<h3 style="font-size:30px">' + t("Весь каталог") + '</h3><p style="margin-top:10px;opacity:.85">' + t("Здесь — выборка для прототипа. На сайте будет весь ассортимент с поиском и фильтрами.") + '</p><span style="margin-top:14px;font-weight:600">' + t("Открыть каталог →") + "</span></a>";
    $("#picks").innerHTML = ["px202f", "d1021", "tan", "charmant"].map(function (id) { return card(itemById(id)); }).join("");
    bindAdd($("#picks"));
    $("#styleCards").innerHTML = STYLES.map(function (s) {
      return '<a class="style-card rv" href="article.html?id=' + s.id + '"><div class="ph ' + s.tone + '"><span>' + t("Фото интерьера: " + s.name.toLowerCase()) + "</span></div><h3>" + t(s.name) + "</h3><p>" + t(s.short) + "</p></a>";
    }).join("");
    $("#reviews").innerHTML = REVIEWS.map(function (r) {
      return '<div class="review rv"><q>' + t(r.text) + '</q><div class="who"><b style="color:var(--ink)">' + t(r.who) + "</b><br>" + t(r.date + ", Яндекс Карты") + "</div></div>";
    }).join("");
  }

  /* ── каталог ── */
  if (page === "catalog") {
    var q = new URLSearchParams(location.search);
    var state = { sec: q.get("sec") || "", style: q.get("style") || "", text: "", stock: false, sort: "pop" };
    $("#fSec").innerHTML = '<button class="chip" data-sec="">Все разделы</button>' + SECTIONS.map(function (s) { return '<button class="chip" data-sec="' + s.id + '">' + t(s.name) + "</button>"; }).join("");
    $("#fStyle").innerHTML = '<button class="chip" data-style="">Любой</button>' + STYLES.map(function (s) { return '<button class="chip" data-style="' + s.id + '">' + t(s.name) + "</button>"; }).join("");
    var draw = function () {
      $$("[data-sec]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-sec") === state.sec); });
      $$("[data-style]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-style") === state.style); });
      var list = ITEMS.filter(function (i) {
        var hay = (i.name + " " + i.brand + " " + i.line + " " + secById(i.sec).name).toLowerCase();
        return (!state.sec || i.sec === state.sec) && (!state.style || i.styles.indexOf(state.style) >= 0) &&
          (!state.text || hay.indexOf(state.text.toLowerCase()) >= 0) && (!state.stock || i.status !== "order");
      });
      if (state.sort === "asc") list.sort(function (a, b) { return a.price - b.price; });
      if (state.sort === "desc") list.sort(function (a, b) { return b.price - a.price; });
      var s = secById(state.sec);
      $("#catTitle").textContent = T(s ? s.name : "Каталог материалов для стен");
      $("#found").textContent = T("Найдено: " + list.length);
      $("#catGrid").innerHTML = list.length ? list.map(card).join("") : '<div class="empty" style="grid-column:1/-1">' + t("Ничего не нашлось. Попробуйте другое слово или напишите нам — подберём по фото.") + "</div>";
      bindAdd($("#catGrid"));
      reveal();
    };
    $$("[data-sec]").forEach(function (b) { b.onclick = function () { state.sec = b.getAttribute("data-sec"); draw(); }; });
    $$("[data-style]").forEach(function (b) { b.onclick = function () { state.style = b.getAttribute("data-style"); draw(); }; });
    $("#fText").oninput = function (e) { state.text = e.target.value.trim(); draw(); };
    $("#fStock").onchange = function (e) { state.stock = e.target.checked; draw(); };
    $("#fSort").onchange = function (e) { state.sort = e.target.value; draw(); };
    draw();
  }

  /* ── позиция ── */
  if (page === "item") {
    var it = itemById(new URLSearchParams(location.search).get("id")) || ITEMS[0];
    var s = secById(it.sec);
    document.title = it.name + " — МАРТдекор";
    $("#crumbs").innerHTML = '<a href="index.html">Главная</a> / <a href="catalog.html">Каталог</a> / <a href="catalog.html?sec=' + s.id + '">' + t(s.name) + "</a>";
    $("#gallery").innerHTML = '<div class="ph ' + s.tone + '"><span>' + t("Фото: " + it.name + " — общий вид") + '</span></div><div class="ph flat ' + s.tone + '"><span>' + t("Фото: фрагмент крупно") + '</span></div><div class="ph flat ' + s.tone + '"><span>' + t("Фото: в интерьере клиента салона") + "</span></div>";
    $("#iSec").textContent = T(s.name + " · " + it.brand);
    $("#iName").textContent = T(it.name);
    $("#iLine").textContent = T(it.line);
    $("#iPrice").innerHTML = money(it.price) + " <small>" + t("за " + it.unit) + "</small>";
    $("#iStatus").className = "status " + it.status;
    $("#iStatus").innerHTML = t(STATUS[it.status]) + ' <span class="demo-tag">для примера</span>';
    $("#iAbout").textContent = T(it.about);
    $("#iSpecs").innerHTML = it.specs.map(function (r) { return "<tr><td>" + t(r[0]) + "</td><td>" + t(r[1]) + "</td></tr>"; }).join("");
    $("#iStyles").innerHTML = it.styles.map(function (id) { return '<a class="tag" href="article.html?id=' + id + '">' + t(styleById(id).name) + "</a>"; }).join("");
    $("#iSrc").innerHTML = 'Источник: <a href="' + it.src + '" target="_blank" rel="noopener">' + esc(it.src.replace("https://", "").slice(0, 60)) + "…</a>";
    var qty = $("#qty");
    $$("[data-step]").forEach(function (b) { b.onclick = function () { qty.value = Math.max(1, (+qty.value || 1) + +b.getAttribute("data-step")); }; });
    $("#iAdd").onclick = function () { add(it.id, +qty.value || 1); openDrawer(); };
    var rel = ITEMS.filter(function (x) { return x.id !== it.id && (x.sec === it.sec || x.styles.some(function (st) { return it.styles.indexOf(st) >= 0; })); }).slice(0, 4);
    $("#related").innerHTML = rel.map(card).join("");
    bindAdd($("#related"));
  }

  /* ── статья ── */
  if (page === "article") {
    var id = new URLSearchParams(location.search).get("id");
    if (!ARTICLES[id]) id = "nature";
    var a = ARTICLES[id], st = styleById(id);
    document.title = a.title + " — МАРТдекор";
    $("#aTitle").textContent = T(a.title);
    $("#aLead").textContent = T(a.lead);
    $("#aPh").className = "ph " + st.tone;
    $("#aPh").innerHTML = "<span>" + t("Фото интерьера в стиле «" + st.name + "» — из проектов клиентов салона") + "</span>";
    $("#aBody").innerHTML = a.body.map(function (p) { return "<p>" + t(p) + "</p>"; }).join("");
    $("#aColors").innerHTML = a.colors.map(function (c) { return '<span class="sw"><i style="background:' + c[1] + '"></i>' + t(c[0]) + "</span>"; }).join("");
    $("#aNeed").innerHTML = a.need.map(function (n) { return "<li>" + t(n) + "</li>"; }).join("");
    $("#aTag").textContent = T("Стиль: " + a.tag);
    $("#aItems").innerHTML = ITEMS.filter(function (i) { return i.styles.indexOf(id) >= 0; }).slice(0, 4).map(card).join("");
    bindAdd($("#aItems"));
    $("#aMore").innerHTML = STYLES.filter(function (s) { return s.id !== id; }).map(function (s) { return '<a class="tag" href="article.html?id=' + s.id + '">' + t(s.name) + "</a>"; }).join("");
  }

  /* ── формы-заявки (демо) ── */
  $$("form[data-demo]").forEach(function (f) {
    f.onsubmit = function (e) { e.preventDefault(); var ok = $(".ok", f); if (ok) ok.classList.add("show"); };
  });

  /* ── появление при прокрутке ── */
  function reveal() {
    var els = $$(".rv:not(.vis)");
    if (!("IntersectionObserver" in window) || /Headless/.test(navigator.userAgent)) { els.forEach(function (e) { e.classList.add("vis"); }); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("vis"); io.unobserve(x.target); } });
    }, { rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (e) { io.observe(e); });
  }
  renderBag();
  syncAddButtons();
  reveal();
})();
