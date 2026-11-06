(() => {
  "use strict";

  const state = {
    data: null,
    category: "all",
    size: "all",
    sort: "default",
    activeImage: 0,
    currentItem: null,
  };

  const els = {
    cats: document.getElementById("filter-categories"),
    size: document.getElementById("filter-size"),
    sort: document.getElementById("sort-order"),
    grid: document.getElementById("item-grid"),
    count: document.getElementById("catalog-count"),
    empty: document.getElementById("empty-state"),
    emptyReset: document.getElementById("empty-reset"),
    modal: document.getElementById("item-modal"),
    modalMain: document.getElementById("modal-main"),
    modalThumbs: document.getElementById("modal-thumbs"),
    modalDemo: document.getElementById("modal-demo"),
    modalTitle: document.getElementById("modal-title"),
    modalPrice: document.getElementById("modal-price"),
    modalCat: document.getElementById("modal-cat"),
    modalSize: document.getElementById("modal-size"),
    modalDesc: document.getElementById("modal-desc"),
  };

  function sizeLabel(size) {
    const labels = (state.data && state.data.sizeLabels) || {};
    return labels[size] || size;
  }

  function categoryLabel(id) {
    const found = state.data.categories.find((c) => c.id === id);
    return found ? found.label : id;
  }

  function filteredItems() {
    let items = state.data.items.filter((item) => {
      const catOk = state.category === "all" || item.category === state.category;
      const sizeOk =
        state.size === "all" || (item.sizes || []).includes(state.size);
      return catOk && sizeOk;
    });

    if (state.sort === "title") {
      items = [...items].sort((a, b) =>
        a.title.localeCompare(b.title, "ru", { sensitivity: "base" })
      );
    }
    return items;
  }

  function renderCategories() {
    els.cats.innerHTML = "";
    const all = document.createElement("button");
    all.type = "button";
    all.textContent = "Все";
    all.dataset.value = "all";
    els.cats.appendChild(all);

    state.data.categories.forEach((cat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = cat.label;
      btn.dataset.value = cat.id;
      els.cats.appendChild(btn);
    });

    els.cats.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      state.category = btn.dataset.value;
      render();
    });
  }

  function renderSizeOptions() {
    const used = new Set();
    state.data.items.forEach((item) => {
      (item.sizes || []).forEach((s) => used.add(s));
    });
    const order = state.data.sizes || [];
    const sizes = [
      ...order.filter((s) => used.has(s)),
      ...[...used].filter((s) => !order.includes(s)),
    ];

    els.size.innerHTML = "";
    const all = document.createElement("option");
    all.value = "all";
    all.textContent = "размер";
    els.size.appendChild(all);

    sizes.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = sizeLabel(s);
      els.size.appendChild(opt);
    });
  }

  function syncFilters() {
    els.cats.querySelectorAll("button").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.value === state.category);
    });
    els.size.value = state.size;
    els.sort.value = state.sort;
  }

  const kindLabels = {
    looks: "образ",
    sets: "комплект",
    dresses: "платье",
    tops: "топ",
    skirts: "юбка",
    shoes: "обувь",
    accessories: "аксессуар",
  };

  function displayTitle(item) {
    const name = (item.title || "").trim();
    if (!name) return "";
    const kind = kindLabels[item.category] || "образ";
    return `${kind} "${name}"`;
  }

  function displaySizes(item) {
    const sizes = item.sizes || [];
    if (!sizes.length) return "";
    const labels = sizes.map(sizeLabel);
    if (labels.length === 1) return `размер ${labels[0]}`;
    return `размер ${labels[0]}–${labels[labels.length - 1]}`;
  }

  function renderCard(item) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "item";
    btn.setAttribute("aria-label", `${item.title}. Подробнее`);

    const media = document.createElement("div");
    media.className = "item-media";
    if (item.demo) {
      const badge = document.createElement("span");
      badge.className = "badge-demo";
      badge.textContent = "демо";
      media.appendChild(badge);
    }
    const img = document.createElement("img");
    img.src = item.images[0];
    img.alt = item.title;
    img.loading = "lazy";
    media.appendChild(img);

    const title = document.createElement("h3");
    title.className = "item-title";
    title.textContent = displayTitle(item);

    const price = document.createElement("p");
    price.className = "item-price";
    price.textContent = displaySizes(item);

    btn.append(media, title, price);
    btn.addEventListener("click", () => openModal(item));
    return btn;
  }

  function render() {
    const items = filteredItems();
    els.grid.innerHTML = "";
    items.forEach((item) => els.grid.appendChild(renderCard(item)));
    els.count.textContent = `Найдено: ${items.length}`;
    els.empty.hidden = items.length > 0;
    syncFilters();
  }

  function showModalImage(index) {
    const item = state.currentItem;
    if (!item) return;
    const images = item.images || [];
    state.activeImage = ((index % images.length) + images.length) % images.length;

    els.modalMain.innerHTML = "";
    const img = document.createElement("img");
    img.src = images[state.activeImage];
    img.alt = item.title;
    els.modalMain.appendChild(img);

    els.modalThumbs.querySelectorAll("button").forEach((b, i) => {
      b.classList.toggle("is-active", i === state.activeImage);
    });
  }

  function openModal(item) {
    state.currentItem = item;
    state.activeImage = 0;

    els.modalDemo.hidden = !item.demo;
    els.modalTitle.textContent = displayTitle(item);
    els.modalPrice.textContent = displaySizes(item);
    els.modalCat.textContent = categoryLabel(item.category).toLowerCase();
    els.modalDesc.textContent = item.description;

    els.modalSize.innerHTML = "";
    (item.sizes || []).forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = sizeLabel(s);
      els.modalSize.appendChild(opt);
    });
    if (!item.sizes || !item.sizes.length) {
      const opt = document.createElement("option");
      opt.textContent = "—";
      els.modalSize.appendChild(opt);
    }

    els.modalThumbs.innerHTML = "";
    (item.images || []).forEach((src, i) => {
      const thumb = document.createElement("button");
      thumb.type = "button";
      thumb.setAttribute("aria-label", `Фото ${i + 1}`);
      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      thumb.appendChild(img);
      thumb.addEventListener("click", () => showModalImage(i));
      els.modalThumbs.appendChild(thumb);
    });
    els.modalThumbs.hidden = (item.images || []).length < 2;

    showModalImage(0);

    els.modal.hidden = false;
    els.modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeModal() {
    els.modal.hidden = true;
    els.modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    state.currentItem = null;
  }

  function bindUi() {
    els.size.addEventListener("change", () => {
      state.size = els.size.value;
      render();
    });
    els.sort.addEventListener("change", () => {
      state.sort = els.sort.value;
      render();
    });
    els.emptyReset.addEventListener("click", () => {
      state.category = "all";
      state.size = "all";
      state.sort = "default";
      render();
    });
    els.modal.querySelectorAll("[data-close]").forEach((el) => {
      el.addEventListener("click", closeModal);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !els.modal.hidden) closeModal();
    });
  }


  function applyShotMode() {
    const shot = new URLSearchParams(location.search).get("shot");
    if (shot === "catalog") {
      const hero = document.querySelector(".hero");
      if (hero) hero.style.display = "none";
      const cat = document.getElementById("catalog");
      if (cat) cat.scrollIntoView();
    }
  }

  async function init() {
    try {
      const res = await fetch("items.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state.data = await res.json();
    } catch (err) {
      els.count.textContent = "Найдено: 0";
      els.empty.hidden = false;
      els.empty.textContent =
        "Не удалось загрузить каталог. Откройте через локальный сервер (см. README).";
      console.error(err);
      return;
    }

    renderCategories();
    renderSizeOptions();
    bindUi();
    render();
    applyShotMode();
  }

  init();
})();
