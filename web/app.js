(() => {
  const DATA = window.__GIFTS__;
  if (!DATA || !DATA.people) {
    document.body.innerHTML = "<p style='padding:2rem;font-family:system-ui'>Missing gifts data. Run build.py.</p>";
    return;
  }

  const STORE_KEY = "gift-board-v1";
  const STATUSES = ["idea", "shortlist", "bought"];
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function loadStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {}; }
    catch { return {}; }
  }
  function saveStore(store) {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }

  let store = loadStore();
  if (!store.status) store.status = {};
  if (!store.budgets) store.budgets = { ...(DATA.budgetDefaults || {}) };
  DATA.ideas.forEach((idea) => {
    if (!store.status[idea.id]) store.status[idea.id] = "idea";
  });

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function personById(id) {
    return DATA.people.find((p) => p.id === id);
  }

  function money(n) {
    return `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }

  function spentFor(personId) {
    return DATA.ideas
      .filter((i) => i.personId === personId && store.status[i.id] === "bought")
      .reduce((sum, i) => sum + (Number(i.approx) || 0), 0);
  }

  function setView(name) {
    $$(".tab").forEach((t) => {
      const on = t.dataset.view === name;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    $$(".view").forEach((v) => v.classList.toggle("active", v.id === `view-${name}`));
    if (location.hash.slice(1) !== name) history.replaceState(null, "", `#${name}`);
  }

  function updatePills() {
    const bought = Object.values(store.status).filter((s) => s === "bought").length;
    const short = Object.values(store.status).filter((s) => s === "shortlist").length;
    $("#peoplePill").textContent = `${DATA.people.length} people`;
    const cap = Object.values(store.budgets).reduce((a, b) => a + Number(b || 0), 0);
    $("#budgetPill").textContent = `Cap ${money(cap)} · EXAMPLE`;
    $("#footStat").textContent = `${short} shortlist · ${bought} bought`;
  }

  function ageLabel(born) {
    if (!born) return "";
    const [y, m, d] = born.split("-").map(Number);
    const today = new Date();
    let age = today.getFullYear() - y;
    const hadBday = today.getMonth() + 1 > m || (today.getMonth() + 1 === m && today.getDate() >= d);
    if (!hadBday) age -= 1;
    return ` · ~${age} yrs`;
  }

  function renderPeople() {
    $("#peopleRoot").innerHTML = DATA.people.map((p) => `
      <article class="person-card" style="--person-color:${escapeHtml(p.color)}">
        <h3>${p.emoji} ${escapeHtml(p.name)}</h3>
        <p class="person-role">${escapeHtml(p.role)}</p>
        <div class="person-occ">
          <span>${escapeHtml(p.occasion)}</span>
          <span class="person-date">${escapeHtml(p.date)}</span>
        </div>
        <p class="person-notes">${escapeHtml(p.bornLabel || "")}${p.born ? escapeHtml(ageLabel(p.born)) : ""}</p>
        <p class="person-notes">${escapeHtml(p.notes || "")}</p>
      </article>`).join("");
  }

  function ideaCard(idea) {
    const person = personById(idea.personId);
    const st = store.status[idea.id] || "idea";
    return `<article class="idea-card" data-id="${escapeHtml(idea.id)}">
      <div>
        <p class="idea-title">${escapeHtml(idea.label)} ${idea.example ? '<span class="ex-label">EXAMPLE</span>' : ""} ${idea.apple ? '<span class="apple-badge">Apple-friendly</span>' : ""}</p>
        <div class="idea-meta">
          <span class="chip">${person ? escapeHtml(person.name) : ""}</span>
          <span class="chip cat">${escapeHtml(idea.category)}</span>
          <span class="chip price">${money(idea.approx)}</span>
          <span class="chip">${escapeHtml(st)}</span>
        </div>
        <p class="idea-note">${escapeHtml(idea.note || "")}</p>
      </div>
      <div class="status-row">
        ${STATUSES.map((s) => `<button type="button" class="btn sm status-btn${st === s ? " active" : ""}" data-id="${escapeHtml(idea.id)}" data-status="${s}">${s}</button>`).join("")}
      </div>
    </article>`;
  }

  function bindStatusButtons(root) {
    root.querySelectorAll(".status-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        store.status[btn.dataset.id] = btn.dataset.status;
        saveStore(store);
        renderIdeas();
        renderBought();
        renderBudget();
        updatePills();
      });
    });
  }

  function renderIdeas() {
    const filter = $("#filterPerson").value;
    const list = DATA.ideas.filter((i) => !filter || i.personId === filter);
    const root = $("#ideasRoot");
    root.innerHTML = list.length ? list.map(ideaCard).join("") : `<p class="empty">No ideas for this filter.</p>`;
    bindStatusButtons(root);
  }

  function renderBought() {
    const list = DATA.ideas.filter((i) => {
      const s = store.status[i.id];
      return s === "shortlist" || s === "bought";
    });
    const root = $("#boughtRoot");
    root.innerHTML = list.length ? list.map(ideaCard).join("") : `<p class="empty">Nothing shortlisted or bought yet — flip status on Ideas.</p>`;
    bindStatusButtons(root);
  }

  function renderBudget() {
    const root = $("#budgetRoot");
    root.innerHTML = DATA.people.map((p) => {
      const cap = Number(store.budgets[p.id] || 0);
      const spent = spentFor(p.id);
      const pct = cap > 0 ? Math.min(100, Math.round((spent / cap) * 100)) : 0;
      const over = spent > cap && cap > 0;
      return `<div class="budget-row" data-person="${escapeHtml(p.id)}">
        <div>
          <strong>${p.emoji} ${escapeHtml(p.name)}</strong>
          <div class="budget-bar${over ? " over" : ""}"><span style="width:${pct}%"></span></div>
          <span class="hint">${money(spent)} spent of ${money(cap)}${over ? " · over" : ""}</span>
        </div>
        <div>
          <label>Cap (EXAMPLE)</label>
          <input type="number" min="0" step="5" data-budget="${escapeHtml(p.id)}" value="${cap}">
        </div>
        <div>
          <label>Bought (auto)</label>
          <input type="text" readonly value="${money(spent)}">
        </div>
        <button type="button" class="btn ghost sm" data-goto="${escapeHtml(p.id)}">Ideas</button>
      </div>`;
    }).join("");

    root.querySelectorAll("[data-budget]").forEach((inp) => {
      inp.addEventListener("change", () => {
        store.budgets[inp.dataset.budget] = Number(inp.value) || 0;
        saveStore(store);
        renderBudget();
        updatePills();
      });
    });
    root.querySelectorAll("[data-goto]").forEach((btn) => {
      btn.addEventListener("click", () => {
        $("#filterPerson").value = btn.dataset.goto;
        setView("ideas");
        renderIdeas();
      });
    });

    const totalCap = Object.values(store.budgets).reduce((a, b) => a + Number(b || 0), 0);
    const totalSpent = DATA.people.reduce((a, p) => a + spentFor(p.id), 0);
    $("#budgetTotal").innerHTML = `<span>Total EXAMPLE cap ${money(totalCap)}</span><span>Bought tally ${money(totalSpent)}</span>`;
  }

  function fillFilter() {
    const sel = $("#filterPerson");
    sel.innerHTML = `<option value="">All people</option>` + DATA.people.map((p) =>
      `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join("");
  }

  function renderAll() {
    fillFilter();
    renderPeople();
    renderIdeas();
    renderBudget();
    renderBought();
    updatePills();
  }

  $$(".tab").forEach((t) => t.addEventListener("click", () => {
    setView(t.dataset.view);
    if (t.dataset.view === "ideas") renderIdeas();
    if (t.dataset.view === "bought") renderBought();
    if (t.dataset.view === "budget") renderBudget();
  }));
  $("#filterPerson").addEventListener("change", renderIdeas);

  $("#btnExport").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "gift-board-save.json";
    a.click();
    $("#aboutHint").textContent = "Exported save JSON.";
  });
  $("#btnReset").addEventListener("click", () => {
    if (!confirm("Reset all statuses and budgets to defaults?")) return;
    store = { status: {}, budgets: { ...(DATA.budgetDefaults || {}) } };
    DATA.ideas.forEach((idea) => { store.status[idea.id] = "idea"; });
    saveStore(store);
    renderAll();
    $("#aboutHint").textContent = "Reset to EXAMPLE defaults.";
  });

  window.addEventListener("hashchange", () => {
    const h = location.hash.slice(1) || "people";
    if (["people", "ideas", "budget", "bought", "about"].includes(h)) setView(h);
  });

  renderAll();
  const start = location.hash.slice(1) || "people";
  setView(["people", "ideas", "budget", "bought", "about"].includes(start) ? start : "people");
})();
