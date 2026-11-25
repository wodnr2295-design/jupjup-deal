/* =========================================================
   줍줍딜 — data/deals.json 렌더러
   · affiliateUrl 이 채워지면 그 링크를, 비어 있으면 searchUrl 사용
   ========================================================= */
(function () {
  "use strict";

  var state = { data: null, filter: "all", sort: "pick" };

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function won(n) { return Number(n).toLocaleString("ko-KR") + "원"; }
  function dotDate(iso) { return String(iso || "").replace(/-/g, "."); }

  function productUrl(p) {
    var aff = (p.affiliateUrl || "").trim();
    return aff || p.searchUrl || "#";
  }
  function isAffiliate(p) { return !!(p.affiliateUrl || "").trim(); }

  function catById(id) {
    var list = state.data.categories || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function productsOf(catId) {
    return (state.data.products || []).filter(function (p) { return p.category === catId; });
  }

  /* ---------- 정렬 ---------- */
  function sortProducts(list) {
    var arr = list.slice();
    if (state.sort === "price-asc") arr.sort(function (a, b) { return a.price - b.price; });
    else if (state.sort === "price-desc") arr.sort(function (a, b) { return b.price - a.price; });
    else arr.sort(function (a, b) { return (a.rank || 99) - (b.rank || 99); });
    return arr;
  }

  /* ---------- 카드 ---------- */
  function cardHTML(p) {
    var specs = Object.keys(p.specs || {}).map(function (k) {
      return "<li><span>" + esc(k) + "</span><b>" + esc(p.specs[k]) + "</b></li>";
    }).join("");
    var pros = (p.pros || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
    var cons = (p.cons || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
    var badge = p.badge
      ? '<span class="badge badge--' + esc(p.badgeType || "alt") + '">' + esc(p.badge) + "</span>"
      : "";
    var ctaLabel = isAffiliate(p) ? "최저가 보러가기" : "쿠팡에서 가격 보기";
    return [
      '<article class="card' + (p.badgeType === "pick" ? " card--pick" : "") + '">',
      '  <div class="card__top"><span class="rank">' + String(p.rank || 0).padStart(2, "0") + "</span>" + badge + "</div>",
      '  <h3 class="card__name">' + esc(p.name) + "</h3>",
      '  <p class="card__model">' + esc(p.model || "") + "</p>",
      '  <p class="price">' + Number(p.price).toLocaleString("ko-KR") + "<small>원</small></p>",
      '  <p class="card__note">' + esc(p.priceNote || "") + " · <b>가격 확인 " + esc(dotDate(p.priceCheckedAt)) + "</b></p>",
      '  <ul class="specs">' + specs + "</ul>",
      '  <div class="pc">',
      '    <div><h4>좋은 점</h4><ul class="pros">' + pros + "</ul></div>",
      '    <div><h4>아쉬운 점</h4><ul class="cons">' + cons + "</ul></div>",
      "  </div>",
      '  <p class="fit"><b>이런 분께</b>' + esc(p.fit || "") + "</p>",
      '  <a class="cta" href="' + esc(productUrl(p)) + '" target="_blank" rel="nofollow sponsored noopener">',
      "    " + ctaLabel + " <span>→</span>",
      "  </a>",
      "</article>"
    ].join("\n");
  }

  /* ---------- 표 ---------- */
  function tableHTML(cat, list) {
    var head = list.map(function (p) { return "<th>" + esc(p.tableName || p.brand || p.name) + "</th>"; }).join("");
    var body = (cat.rows || []).map(function (label) {
      var cells = list.map(function (p) {
        var v = (p.compare || {})[label];
        return "<td>" + esc(v == null || v === "" ? "—" : v) + "</td>";
      }).join("");
      return "<tr><th scope=\"row\">" + esc(label) + "</th>" + cells + "</tr>";
    }).join("");
    return [
      '<div class="table-wrap">',
      '  <div class="table-scroll">',
      "    <table>",
      '      <thead><tr><th scope="col">비교 항목</th>' + head + "</tr></thead>",
      "      <tbody>" + body + "</tbody>",
      "    </table>",
      "  </div>",
      '  <p class="table-hint">← 옆으로 밀면 전체 항목이 보입니다.</p>',
      "</div>"
    ].join("\n");
  }

  /* ---------- 섹션 ---------- */
  function sectionHTML(cat) {
    var list = sortProducts(productsOf(cat.id));
    if (!list.length) return "";
    var checks = (cat.checks || []).map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("");
    var lastChecked = list.map(function (p) { return p.priceCheckedAt || ""; }).sort().pop();
    return [
      '<section class="cat" id="' + esc(cat.id) + '" data-cat="' + esc(cat.id) + '"' +
        (state.filter !== "all" && state.filter !== cat.id ? " hidden" : "") + ">",
      '  <header class="cat__head">',
      '    <p class="cat__no">' + String(cat.order || 0).padStart(2, "0") + "</p>",
      "    <h2><span aria-hidden=\"true\">" + esc(cat.emoji || "") + "</span>" + esc(cat.label) + "</h2>",
      '    <p class="cat__lede">' + esc(cat.lede || "") + "</p>",
      '    <div class="cat__meta">',
      '      <span class="stamp">가격 확인 ' + esc(dotDate(lastChecked)) + "</span>",
      '      <ul class="checks">' + checks + "</ul>",
      "    </div>",
      "  </header>",
      '  <div class="grid">' + list.map(cardHTML).join("\n") + "</div>",
      tableHTML(cat, list),
      '  <p class="note">' + esc(cat.note || "") + "</p>",
      "</section>"
    ].join("\n");
  }

  /* ---------- 필터 칩 ---------- */
  function renderChips() {
    var cats = state.data.categories || [];
    var total = (state.data.products || []).length;
    var html = '<button class="chip" type="button" data-filter="all" aria-pressed="true">전체' +
      '<span class="chip__count">' + total + "</span></button>";
    cats.forEach(function (c) {
      html += '<button class="chip" type="button" data-filter="' + esc(c.id) + '" aria-pressed="false">' +
        esc(c.label) + '<span class="chip__count">' + productsOf(c.id).length + "</span></button>";
    });
    $("#chips").innerHTML = html;
  }

  /* ---------- 예산 ---------- */
  function renderBudget() {
    var el = $("#budgetGrid");
    if (!el) return;
    el.innerHTML = (state.data.budgets || []).map(function (b) {
      return '<div class="bud"><h3>' + esc(b.label) + "</h3><strong>" + esc(b.total) + "</strong>" +
        "<ul>" + (b.items || []).map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul></div>";
    }).join("");
  }

  /* ---------- FAQ ---------- */
  function renderFAQ() {
    var el = $("#faqList");
    if (!el) return;
    el.innerHTML = (state.data.faq || []).map(function (f) {
      return "<details><summary>" + esc(f.q) + "</summary><div class=\"faq__body\">" + f.a + "</div></details>";
    }).join("");
  }

  /* ---------- 통계 / 메타 ---------- */
  function renderMeta() {
    var prices = (state.data.products || []).map(function (p) { return p.price; });
    var min = Math.min.apply(null, prices), max = Math.max.apply(null, prices);
    $("#statCount").textContent = (state.data.products || []).length + "종";
    $("#statCat").textContent = (state.data.categories || []).length + "개";
    $("#statMin").textContent = won(min);
    $("#statMax").textContent = won(max);
    var upd = dotDate(state.data.site.updatedAt);
    $("#updatedAt").textContent = upd;
    $("#footUpdated").textContent = upd;
    $("#disclosureTop b").textContent = state.data.site.disclosure;
    $("#disclosureBottom b").textContent = state.data.site.disclosure;
    $("#contactMail").textContent = state.data.site.contact || "";
    $("#contactMail").href = "mailto:" + (state.data.site.contact || "");
    $("#srcList").innerHTML = (state.data.sources || []).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("");
    var brand = state.data.site.brand || "줍줍딜";
    $$("[data-brand]").forEach(function (n) { n.textContent = brand; });

    document.title = brand + " · " + (state.data.site.title || "가성비 큐레이션");
    var md = $("#metaDesc");
    if (md) md.setAttribute("content", state.data.site.title + " — " + (state.data.site.tagline || "") +
      ". " + (state.data.products || []).length + "개 모델의 실제 판매가와 스펙을 한눈에 비교합니다.");
  }

  /* ---------- 구조화 데이터 ---------- */
  function injectJSONLD() {
    var d = state.data;
    var itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": d.site.brand + " — " + d.site.title,
      "itemListElement": (d.products || []).map(function (p, i) {
        return {
          "@type": "ListItem", "position": i + 1,
          "item": {
            "@type": "Product",
            "name": p.name,
            "model": p.model,
            "brand": {"@type": "Brand", "name": p.brand},
            "offers": {
              "@type": "Offer", "price": p.price, "priceCurrency": "KRW",
              "availability": "https://schema.org/InStock", "url": productUrl(p)
            }
          }
        };
      })
    };
    var faq = {
      "@context": "https://schema.org", "@type": "FAQPage",
      "mainEntity": (d.faq || []).map(function (f) {
        return {
          "@type": "Question", "name": f.q,
          "acceptedAnswer": {"@type": "Answer", "text": f.a.replace(/<[^>]+>/g, "")}
        };
      })
    };
    [itemList, faq].forEach(function (obj) {
      var s = document.createElement("script");
      s.type = "application/ld+json";
      s.textContent = JSON.stringify(obj);
      document.head.appendChild(s);
    });
  }

  /* ---------- 렌더 ---------- */
  function renderSections() {
    var cats = (state.data.categories || []).slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    $("#sections").innerHTML = cats.map(sectionHTML).join("\n");
  }

  function applyFilter() {
    $$("#sections .cat").forEach(function (sec) {
      sec.hidden = !(state.filter === "all" || sec.dataset.cat === state.filter);
    });
    $$("#chips .chip").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.filter === state.filter));
    });
  }

  function bind() {
    $("#chips").addEventListener("click", function (e) {
      var btn = e.target.closest(".chip");
      if (!btn) return;
      state.filter = btn.dataset.filter;
      applyFilter();
      var bar = $(".filterbar");
      if (bar && window.scrollY > bar.offsetTop) {
        window.scrollTo({ top: bar.offsetTop - 56, behavior: "smooth" });
      }
    });
    var sel = $("#sortSelect");
    if (sel) {
      sel.addEventListener("change", function () {
        state.sort = sel.value;
        renderSections();
        applyFilter();
      });
    }
  }

  function fail() {
    $("#sections").innerHTML =
      '<div class="error-box"><b>가격표를 불러오지 못했습니다.</b><br>' +
      "인터넷 연결을 확인한 뒤 새로고침해 주세요. 잠시 후에도 그대로라면 문의 메일로 알려 주세요.</div>";
  }

  function boot() {
    fetch("data/deals.json?v=" + Date.now(), { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status + " — data/deals.json");
        return r.json();
      })
      .then(function (data) {
        state.data = data;
        renderMeta();
        renderChips();
        renderSections();
        renderBudget();
        renderFAQ();
        injectJSONLD();
        bind();
        var l = $(".loading");
        if (l) l.remove();
      })
      .catch(function (err) { console.warn("deals load failed", err); fail(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
