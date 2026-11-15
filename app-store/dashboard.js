import {
  appleSources, appStoreUrl, competitors, devices, ideas, keywordStatuses, liveListing, outcomes,
  priorities, releaseStatuses, seed, snapshotDate, taskCategories, taskStatuses
} from "./data.js";
import { byDate, byVersion, checkLabel, cleanMetadata, decodeWorkspace, metadataLimits, movement, newId, replaceOrPrepend, storageKey, textLength, today } from "./model.js";

const routes = {
  overview: "Overview", keywords: "Keyword tests", listing: "Listing workshop",
  competitors: "Competitors", versions: "Release history", log: "Visibility log"
};
const filters = { store: "US", device: "iPhone", status: "", version: "", keyword: "" };
const panel = document.getElementById("panel");
const dialog = document.getElementById("editor");
const editorForm = document.getElementById("editor-form");
const toast = document.getElementById("toast");
const storageWarning = document.getElementById("storage-warning");
const sectionTitle = document.getElementById("section-title");
let storeIssue = "";
let editorSave;
let toastTimer;
let state = initialWorkspace();

const escape = value => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[character]);
const external = (url, label, className = "") => `<a class="${className}" href="${url}" target="_blank" rel="noopener">${escape(label)} <span aria-hidden="true">→</span></a>`;
const button = (action, text, id = "", className = "button", label = "") => `<button type="button" class="${className}" data-action="${action}"${id ? ` data-id="${escape(id)}"` : ""}${label ? ` aria-label="${escape(label)}"` : ""}>${escape(text)}</button>`;
const activeRoute = () => Object.hasOwn(routes, location.hash.slice(1)) ? location.hash.slice(1) : "overview";
const versionRow = id => state.versions.find(row => row.id === id);
const keywordRow = id => state.keywords.find(row => row.id === id);
const latestLive = () => byVersion(state.versions.filter(row => row.status === "Live"))[0];
const dateLabel = date => date ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(date + "T00:00:00Z")) : "—";
const pill = (text, tone = "") => `<span class="pill ${tone}">${escape(text)}</span>`;
const statusTone = status => ["Done", "Testing", "Live", "Improved"].includes(status) ? "green"
  : ["In progress", "Watching", "Mixed"].includes(status) ? "amber" : status === "Declined" ? "red" : "";
const statusPill = status => pill(status, statusTone(status));
const heading = (title, description, actions = "") => `<header class="section-head"><div><h1>${title}</h1><p>${description}</p></div>${actions ? `<div class="actions">${actions}</div>` : ""}</header>`;
const empty = (title, description, actions = "") => `<div class="empty"><strong>${title}</strong><p>${description}</p>${actions}</div>`;
const header = cells => `<thead><tr>${cells.map(cell => `<th scope="col">${cell}</th>`).join("")}</tr></thead>`;
const latestRating = store => byDate(state.ratings.filter(row => row.store === store))[0];
const ratingValue = row => row?.average == null ? "—" : row.average.toFixed(1);
const checksFor = (store, device, keywordId) => byDate(state.checks.filter(row => row.store === store && row.device === device
  && (!keywordId || row.keywordId === keywordId)));
const versionText = id => versionRow(id)?.version ?? "—";

function initialWorkspace() {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? decodeWorkspace(raw) : structuredClone(seed);
  } catch {
    storeIssue = "Saved records could not be loaded. Restore a backup if you have one.";
    return structuredClone(seed);
  }
}

function saveWorkspace(next, message, refresh = true) {
  decodeWorkspace(JSON.stringify(next));
  state = next;
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    storeIssue = "";
  } catch {
    storeIssue = "Your browser could not save these edits. Export a backup before closing this page.";
  }
  if (refresh) render();
  else showStorageStatus();
  showToast(storeIssue ? "Updated for this session" : message);
}

function showStorageStatus() {
  document.getElementById("storage-label").textContent = storeIssue ? "Storage needs attention" : "Saved in this browser";
  storageWarning.hidden = !storeIssue;
  storageWarning.textContent = storeIssue;
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}

function render() {
  const route = activeRoute();
  sectionTitle.textContent = routes[route];
  panel.setAttribute("aria-label", routes[route]);
  for (const link of document.querySelectorAll("nav[aria-label='Dashboard'] a")) {
    if (link.hash === "#" + route) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  showStorageStatus();
  panel.innerHTML = views[route]();
}

function renderOverview() {
  const latest = state.keywords.map(row => checksFor("US", "iPhone", row.id)[0]).filter(Boolean);
  const visible = latest.filter(row => row.rank !== null).length;
  const rating = latestRating("US");
  const done = state.tasks.filter(row => row.status === "Done").length;
  const activeVersion = latestLive();
  return `<section class="hero">
    <div class="hero-copy">
      <p class="overline"><span class="status-dot" aria-hidden="true"></span> U.S. App Store</p>
      <h1>App Store<br>Discoverability</h1>
      <p>Track search positions, test listing changes, and see what moves after each release.</p>
      <div class="actions">${button("search-check", "+ Record a search", "", "button button-accent")}${external(appStoreUrl, "View live listing", "text-button invert")}</div>
    </div><div class="hero-visual" aria-hidden="true"></div>
  </section>
  <section class="stats" aria-label="Workspace metrics">
    ${stat("Keywords tracked", state.keywords.length, state.keywords.filter(row => row.status === "Testing").length + " testing")}
    ${stat("Visible terms", latest.length ? visible + " / " + latest.length : "—", latest.length ? "Latest U.S. iPhone checks" : "U.S. iPhone checks pending")}
    ${stat("App Store rating", ratingValue(rating), rating ? `${rating.count} U.S. ratings · ${dateLabel(rating.date)}` : "U.S. ratings pending", rating?.average != null)}
    ${stat("Latest live version", activeVersion?.status === "Live" ? escape(activeVersion.version) : "—", "iOS release history")}
  </section>
  <div class="two-column">
    <section class="sheet">
      <header class="card-header"><div><h2>Search targets</h2><p>Latest U.S. iPhone observations</p></div><a class="text-button" href="#keywords">All keywords →</a></header>
      ${state.keywords.length ? `<div class="table-scroll"><table class="compact-table">${header(["Keyword", "Priority", "Latest position"])}<tbody>
        ${state.keywords.slice(0, 6).map(row => `<tr><td><strong>${escape(row.term)}</strong></td><td>${pill(row.priority, row.priority === "Core" ? "green" : "")}</td><td class="num">${checkLabel(checksFor("US", "iPhone", row.id)[0])}</td></tr>`).join("")}
      </tbody></table></div>` : empty("Add a keyword to start.", "Create your first keyword test.", button("keyword", "Add keyword"))}
    </section>
    <section class="card">
      <header class="card-header"><div><h2>Listing checklist</h2><p>Screenshots, description, and metadata</p></div><a class="text-button" href="#listing">View tasks →</a></header>
      <div class="progress"><progress value="${done}" max="${state.tasks.length || 1}" aria-label="Listing tasks completed"></progress><span class="num">${done}/${state.tasks.length}</span></div>
      <ul class="task-list">${state.tasks.slice(0, 5).map(task => `<li>${button("task", task.name, task.id, "text-button")}${statusPill(task.status)}</li>`).join("")}</ul>
    </section>
  </div>`;
}

function stat(label, value, detail, star = false) {
  return `<article><p class="stat-label">${label}</p><strong class="num">${value}${star ? ' <span class="stat-star" aria-hidden="true">★</span>' : ""}</strong><p class="subline">${detail}</p></article>`;
}

function optionList(values, selected) {
  return values.map(value => {
    const [key, label] = Array.isArray(value) ? value : [value, value];
    return `<option value="${escape(key)}"${key === selected ? " selected" : ""}>${escape(label)}</option>`;
  }).join("");
}

function filter(name, label, values) {
  return `<label>${label}<select data-filter="${name}">${optionList(values, filters[name])}</select></label>`;
}

function storefronts() {
  return [...new Set(["US", "CA", "GB", "AU", ...state.checks.map(row => row.store), ...state.ratings.map(row => row.store)])].sort();
}

function summaryMovement(current, before) {
  const result = movement(current, before);
  return `<span class="movement ${result.direction}">${result.label}</span>`;
}

function renderKeywords() {
  const rows = state.keywords.filter(row => !filters.status || filters.status === row.status);
  return `${heading("Keyword tests", "Check the same search on the same storefront and device. Count organic app results and record how far you looked.", button("keyword", "+ Add keyword", "", "button button-primary"))}
    <div class="filters"><div class="filter-bar">
      ${filter("store", "Storefront", storefronts())}${filter("device", "Device", devices)}${filter("status", "Status", [["", "All"], ...keywordStatuses])}
    </div><p>Changes compare the two latest checks for each term in this storefront and device.</p></div>
    ${rows.length ? `<div class="keyword-grid">${rows.map(row => {
      const [current, previous] = checksFor(filters.store, filters.device, row.id);
      return `<article class="keyword-card">
        <div class="actions">${pill(row.priority, row.priority === "Core" ? "green" : "")}${statusPill(row.status)}</div>
        <h2>${escape(row.term)}</h2>
        <strong class="rank num">${checkLabel(current)}</strong>
        <p class="small muted">${summaryMovement(current, previous)}${current ? " · " + dateLabel(current.date) : ""}</p>
        <p class="small muted">${escape(row.hypothesis)}</p>
        <div class="actions">${button("search-check", "Log check", row.id, "button", "Log check for " + row.term)}
          ${button("keyword", "Edit", row.id, "text-button", "Edit " + row.term)}</div>
      </article>`;
    }).join("")}</div>` : `<section class="sheet">${empty("No keywords in this view.", "Pick another status or add a new keyword.")}</section>`}
    <section class="card"><h2>Collect your baseline</h2>
      <p class="card-intro">Search each phrase on your iPhone before a listing change. Log the organic rank or the number of results you checked. Repeat after the release with the same storefront, device, and scan depth.</p>
      ${external(appleSources.search, "Apple’s search guidance", "text-button")}
    </section>`;
}

function metadataFields(draft, description = false, titleRequired = false) {
  return [
    field("title", "Title", draft.title, titleRequired ? "required" : "", "", true, true),
    field("subtitle", "Subtitle", draft.subtitle, "", "", true, true),
    area("keywords", "Keyword field", draft.keywords, "Use commas between terms and spaces inside multiword phrases. Apple caps this field at 100 bytes.", true),
    description ? area("description", "Description", draft.description, "", true, true) : ""
  ].join("");
}

function renderListing() {
  return `${heading("Listing workshop", "Compare the public listing with your draft and record what you plan to ship.", external(appStoreUrl, "View live listing", "button"))}
    <div class="even-columns">
      <section class="card">
        <header class="card-header"><div><h2>Public listing</h2><p>U.S. storefront · ${dateLabel(snapshotDate)} · iOS ${liveListing.version}</p></div></header>
        <p class="card-intro">Copy the live keyword field from App Store Connect into the release record.</p>
        <dl class="dl"><dt>Title</dt><dd>${liveListing.title}</dd><dt>Subtitle</dt><dd>${liveListing.subtitle}</dd><dt>Keywords</dt><dd>Available in App Store Connect</dd></dl>
        <p class="card-intro">Apple lists the title, subtitle, keyword field, category, and user behavior among search factors. Use the screenshots and description to show what golfers get after opening the listing.</p>
        <div class="actions">${external(appleSources.information, "Title and subtitle limits", "text-button")}${external(appleSources.keywords, "Keyword field limits", "text-button")}</div>
      </section>
      <section class="card">
        <h2>Metadata test ideas</h2>
        <p class="card-intro">Start with the subtitle and keyword test. Log the current ranks first, then use the second idea in a separate release if you want to test the title.</p>
        <ul class="idea-list">${ideas.map(idea => `<li class="idea"><h3>${escape(idea.name)}</h3>
          <dl class="dl"><dt>Title</dt><dd>${escape(idea.title)}</dd><dt>Subtitle</dt><dd>${escape(idea.subtitle)}</dd></dl>
          <p>${escape(idea.hypothesis)}</p>${button("apply-idea", "Load into draft", idea.id)}</li>`).join("")}</ul>
      </section>
    </div>
    <section class="card" id="draft-card">
      <h2>Working draft</h2><p class="card-intro">Apple’s limits are 30 characters each for the title and subtitle and 100 bytes for keywords. Check for words already used in the title, subtitle, or category.</p>
      <form id="draft-form"><div class="form-grid">${metadataFields(state.draft, true, true)}</div>
        <p id="draft-error" class="form-error" role="alert" hidden></p>
        <div class="actions aligned-actions"><button class="button button-primary" type="submit">Save draft</button>${button("copy-keywords", "Copy keywords")}</div>
      </form>
    </section>
    <section class="sheet">
      <header class="card-header"><div><h2>Screenshots &amp; description tasks</h2><p>Update status or assign the task to a release.</p></div>${button("task", "+ Add task")}</header>
      ${state.tasks.length ? `<div class="table-scroll"><table class="log-table">${header(["Task", "Category", "Status", "Release", ""])}<tbody>${state.tasks.map(task => `<tr>
        <td><strong>${escape(task.name)}</strong>${task.notes ? `<small class="notes">${escape(task.notes)}</small>` : ""}</td>
        <td>${escape(task.category)}</td><td>${statusPill(task.status)}</td><td>${versionText(task.versionId)}</td>
        <td>${button("task", "Edit", task.id, "text-button", "Edit " + task.name)}</td></tr>`).join("")}</tbody></table></div>` : empty("No tasks yet.", "Add a screenshot, description, or metadata task.")}</section>`;
}

function renderCompetitors() {
  const self = { name: liveListing.title, subtitle: liveListing.subtitle, rating: "4.3", count: "6", price: "Free · In-app purchases",
    positioning: "Automatic and manual ball tracing with a 3D replay of the same shot.",
    takeaway: "Lead with the imported swing, traced ball flight, and 3D replay of the real hole.", url: appStoreUrl };
  return `${heading("Competitors", "Compare how golf tracer apps describe their value on the U.S. App Store.")}
    <section class="sheet">
      <header class="card-header"><div><h2>App Store comparison</h2><p>U.S. listings checked ${dateLabel(snapshotDate)}</p></div></header>
      <div class="table-scroll"><table class="competitor-table">${header(["App", "Subtitle", "Rating & price", "Positioning", "What SkyTrace can test"])}<tbody>
        ${[self, ...competitors].map(app => `<tr><td>${external(app.url, app.name)}</td><td>${escape(app.subtitle)}</td>
          <td><strong class="num">${app.rating} ★ · ${app.count}</strong><small>${escape(app.price)}</small></td>
          <td>${escape(app.positioning)}</td><td>${escape(app.takeaway)}</td></tr>`).join("")}
      </tbody></table></div><p class="source-line">Ratings and counts are point-in-time listing figures. Check keyword placement in Keyword tests.</p>
    </section>`;
}

function renderVersions() {
  return `${heading("Release history", "Record the exact metadata and creative changes that went out, then add an outcome when you have a before-and-after check.", button("version", "+ Add release", "", "button button-primary"))}
    ${state.versions.length ? `<ul class="version-list">${byVersion(state.versions).map(row => {
      const checkCount = state.checks.filter(check => check.versionId === row.id).length;
      const ratingCount = state.ratings.filter(rating => rating.versionId === row.id).length;
      return `<li class="card version-card">
        <div class="card-header"><div>
          <div class="badges"><h2>iOS ${escape(row.version)}</h2>${statusPill(row.status)}${statusPill(row.outcome)}</div>
          <p>${row.date ? dateLabel(row.date) + " · " : ""}${checkCount} search ${checkCount === 1 ? "check" : "checks"} · ${ratingCount} rating ${ratingCount === 1 ? "entry" : "entries"}</p>
        </div>${button("version", "Edit release", row.id, "button", "Edit release " + row.version)}</div>
        <p class="description">${escape(row.changes)}</p>
        ${row.evidence ? `<p class="evidence">${escape(row.evidence)}</p>` : ""}
        ${row.title || row.subtitle || row.keywords ? `<details${row.id === latestLive()?.id ? " open" : ""}><summary>Metadata recorded</summary><dl class="dl">
          <dt>Title</dt><dd>${escape(row.title || "—")}</dd><dt>Subtitle</dt><dd>${escape(row.subtitle || "—")}</dd><dt>Keywords</dt><dd>${escape(row.keywords || "Awaiting entry")}</dd>
        </dl></details>` : ""}
        <div class="actions">${button("version-log", "View checks →", row.id, "text-button", "View checks for " + row.version)}</div>
      </li>`;
    }).join("")}</ul>` : `<section class="sheet">${empty("No releases yet.", "Add a release to link future checks to a listing change.")}</section>`}`;
}

function renderLog() {
  const allChecks = checksFor(filters.store, filters.device);
  const rows = allChecks.filter(row => (!filters.version || row.versionId === filters.version) && (!filters.keyword || row.keywordId === filters.keyword));
  const ratingHistory = byDate(state.ratings.filter(row => row.store === filters.store));
  const ratings = ratingHistory.filter(row => !filters.version || row.versionId === filters.version);
  const changeFromPriorVersion = row => allChecks.slice(allChecks.indexOf(row) + 1)
    .find(older => older.keywordId === row.keywordId && older.versionId !== row.versionId);
  return `${heading("Visibility log", "Record organic ranks and App Store ratings by release and storefront.",
    button("rating", "+ Log rating", "", "button"))}
    <div class="filters"><div class="filter-bar">
      ${filter("store", "Storefront", storefronts())}${filter("device", "Device", devices)}
      ${filter("version", "Release", [["", "All"], ...versionChoices()])}
      ${filter("keyword", "Keyword", [["", "All"], ...state.keywords.map(row => [row.id, row.term])])}
    </div></div>
    <section class="sheet">
      <header class="card-header"><div><h2>Search visibility</h2><p>Release comparison uses the nearest older check for the same term, storefront, and device on a different release.</p></div></header>
      ${rows.length ? `<div class="table-scroll"><table class="log-table">${header(["Date", "Keyword", "Release", "Position", "Prior release", "Notes", ""])}<tbody>
        ${rows.map(row => {
          const prior = changeFromPriorVersion(row);
          return `<tr><td>${dateLabel(row.date)}</td><td><strong>${escape(keywordRow(row.keywordId)?.term)}</strong></td><td>${versionText(row.versionId)}</td>
            <td><strong class="num">${checkLabel(row)}</strong><small>Top ${row.depth} checked</small></td>
            <td>${prior ? `${summaryMovement(row, prior)}<small>${versionText(prior.versionId)} · ${checkLabel(prior)}</small>` : "—"}</td>
            <td class="notes">${escape(row.notes || "—")}</td><td>${button("edit-check", "Edit", row.id, "text-button", "Edit search check for " + keywordRow(row.keywordId)?.term)}</td></tr>`;
        }).join("")}</tbody></table></div>` : empty("No checks in this view.", "Record an organic rank or how many results you looked through.", button("search-check", "Record a search"))}
    </section>
    <section class="sheet">
      <header class="card-header"><div><h2>Rating snapshots</h2><p>Ratings come from the selected storefront. Changes compare the prior snapshot in that storefront.</p></div></header>
      ${ratings.length ? `<div class="table-scroll"><table class="log-table">${header(["Date", "Release", "Average", "Count", "Count change", "Notes", ""])}<tbody>
        ${ratings.map(row => {
          const before = ratingHistory[ratingHistory.indexOf(row) + 1];
          const difference = before ? row.count - before.count : null;
          return `<tr><td>${dateLabel(row.date)}</td><td>${versionText(row.versionId)}</td>
            <td class="num"><strong>${ratingValue(row)}${row.average == null ? "" : " ★"}</strong></td><td class="num">${row.count}</td>
            <td class="num">${difference == null ? "—" : difference > 0 ? "+" + difference : difference}</td>
            <td class="notes">${escape(row.notes || "—")}</td><td>${button("rating", "Edit", row.id, "text-button", "Edit rating on " + dateLabel(row.date))}</td></tr>`;
        }).join("")}</tbody></table></div>` : empty("No ratings in this view.", "Log the average and number of ratings on the App Store listing.", button("rating", "Log a rating"))}
    </section>`;
}

const views = {
  overview: renderOverview, keywords: renderKeywords, listing: renderListing,
  competitors: renderCompetitors, versions: renderVersions, log: renderLog
};

function field(name, label, value = "", attributes = "", hint = "", wide = false, count = false) {
  return `<label class="field${wide ? " wide" : ""}">
    ${fieldLabel(name, label, value, count)}
    <input name="${name}" value="${escape(value)}" ${attributes}>
    ${hint ? `<span class="field-hint">${hint}</span>` : ""}
  </label>`;
}

function area(name, label, value = "", hint = "", count = false, long = false, attributes = "") {
  return `<label class="field wide">${fieldLabel(name, label, value, count)}
    <textarea name="${name}" rows="${long ? 6 : 3}" ${attributes}>${escape(value)}</textarea>
    ${hint ? `<span class="field-hint">${hint}</span>` : ""}
  </label>`;
}

function fieldLabel(name, label, value, count) {
  const counter = count ? `<span class="counter" aria-hidden="true" data-counter="${name}">${textLength(value, name)} / ${metadataLimits[name]}</span>` : "";
  return `<span class="field-label"><span>${label}</span>${counter}</span>`;
}

function select(name, label, values, selected, wide = false, required = true) {
  return `<label class="field${wide ? " wide" : ""}"><span class="field-label">${label}</span>
    <select name="${name}"${required ? " required" : ""}>${optionList(values, selected)}</select>
  </label>`;
}

function versionChoices() {
  return byVersion(state.versions).map(row => [row.id, row.version + (row.status === "Planned" ? " (planned)" : "")]);
}

function openEditor({title, description = "", fields, save, submit = "Save"}) {
  document.getElementById("editor-title").textContent = title;
  document.getElementById("editor-description").textContent = description;
  document.getElementById("editor-fields").innerHTML = fields;
  document.getElementById("editor-submit").textContent = submit;
  editorForm.querySelector("#editor-error").hidden = true;
  editorSave = save;
  dialog.showModal();
  adjustResultInput(editorForm);
}

function editKeyword(id) {
  const current = keywordRow(id);
  const row = current ?? { id: newId(), term: "", priority: "High", status: "Queued", hypothesis: "" };
  openEditor({
    title: current ? "Edit keyword test" : "Add keyword test",
    fields: `<div class="form-grid">${field("term", "Search phrase", row.term, "required maxlength='100'", "", true)}
      ${select("priority", "Priority", priorities, row.priority)}
      ${select("status", "Status", keywordStatuses, row.status)}
      ${area("hypothesis", "Hypothesis or notes", row.hypothesis, "", false, false, "maxlength='5000'")}</div>`,
    save: data => {
      const term = data.term.trim();
      if (!term) throw new Error("Enter a search phrase.");
      if (state.keywords.some(item => item.id !== row.id && item.term.toLowerCase() === term.toLowerCase())) {
        throw new Error("This search phrase is already tracked.");
      }
      if (current && current.term.toLowerCase() !== term.toLowerCase() && state.checks.some(check => check.keywordId === row.id)) {
        throw new Error("This phrase has a search history. Add the revised phrase as a new keyword test.");
      }
      const updated = { ...row, term, priority: data.priority, status: data.status, hypothesis: data.hypothesis.trim() };
      saveWorkspace({ ...state, keywords: replaceOrPrepend(state.keywords, updated) }, "Keyword saved");
    }
  });
}

function editTask(id) {
  const current = state.tasks.find(row => row.id === id);
  const row = current ?? { id: newId(), name: "", category: "Screenshots", status: "To do", versionId: "", notes: "" };
  openEditor({
    title: current ? "Edit listing task" : "Add listing task",
    fields: `<div class="form-grid">${field("name", "Task", row.name, "required maxlength='170'", "", true)}
      ${select("category", "Category", taskCategories, row.category)}
      ${select("status", "Status", taskStatuses, row.status)}
      ${select("versionId", "Release", [["", "Unassigned"], ...versionChoices()], row.versionId, true, false)}
      ${area("notes", "Notes", row.notes, "", false, false, "maxlength='5000'")}</div>`,
    save: data => {
      if (!data.name.trim()) throw new Error("Give the task a name.");
      const updated = { ...row, name: data.name.trim(), category: data.category, status: data.status, versionId: data.versionId, notes: data.notes.trim() };
      saveWorkspace({ ...state, tasks: replaceOrPrepend(state.tasks, updated) }, "Task saved");
    }
  });
}

function editVersion(id) {
  const current = versionRow(id);
  const row = current ?? { id: newId(), version: "", status: "Planned", date: "", title: "", subtitle: "", keywords: "", changes: "", outcome: "Pending", evidence: "" };
  openEditor({
    title: current ? "Edit release" : "Add release",
    description: "Record what changed or what you plan to test. Use the outcome and evidence fields after you measure it.",
    fields: `<div class="form-grid">
      ${field("version", "iOS version", row.version, "required inputmode='decimal' placeholder='1.9.0' pattern='[0-9]{1,8}([.][0-9]{1,8}){0,2}'")}
      ${select("status", "Status", releaseStatuses, row.status)}
      ${field("date", "Release date", row.date, "type='date'")}
      ${select("outcome", "Discovery outcome", outcomes, row.outcome)}
      ${area("changes", "Changes", row.changes, "Summarize the metadata, screenshot, or description changes for this version.", false, false, "required maxlength='5000'")}
      <div class="field wide">${button("version-draft", "Fill metadata from saved draft")}</div>
      ${metadataFields(row)}
      ${area("evidence", "Outcome notes", row.evidence, "Include the term, before and after positions, dates, and any other changes that could have affected the result.", false, false, "maxlength='5000'")}
      </div>`,
    save: data => {
      const version = data.version.trim();
      if (state.versions.some(item => item.id !== row.id && item.version === version)) throw new Error("This iOS version is already recorded.");
      if (!data.changes.trim()) throw new Error("Describe the changes for this release.");
      const updated = {
        ...row, ...cleanMetadata(data, true), version, status: data.status, date: data.date,
        changes: data.changes.trim(), outcome: data.outcome, evidence: data.evidence.trim()
      };
      saveWorkspace({ ...state, versions: replaceOrPrepend(state.versions, updated) }, "Release saved");
    }
  });
}

function storeField(store) {
  return `${field("store", "Storefront", store, "required minlength='2' maxlength='2' pattern='[A-Za-z]{2}' list='storefront-list' autocapitalize='characters'", "Two-letter App Store country code.")}
    <datalist id="storefront-list">${optionList(storefronts(), "")}</datalist>`;
}

function editSearchCheck(keywordId, checkId) {
  if (!state.versions.length) return editVersion();
  if (!state.keywords.length) return editKeyword();
  const current = state.checks.find(row => row.id === checkId);
  const row = current ?? {
    id: newId(), keywordId: keywordId || filters.keyword || state.keywords[0].id,
    versionId: filters.version || latestLive()?.id || versionChoices()[0][0], date: today(), store: filters.store, device: filters.device,
    depth: 25, rank: null, notes: ""
  };
  openEditor({
    title: current ? "Edit search check" : "Log search visibility",
    description: "Count organic app results in the App Store search tab. Skip sponsored placements.",
    fields: `<div class="form-grid">
      ${select("keywordId", "Keyword", state.keywords.map(item => [item.id, item.term]), row.keywordId)}
      ${select("versionId", "iOS release", versionChoices(), row.versionId)}
      ${field("date", "Check date", row.date, "type='date' required")}${storeField(row.store)}
      ${select("device", "Device", devices, row.device)}
      ${field("depth", "Results checked", row.depth, "type='number' inputmode='numeric' min='1' max='500' step='1' required")}
      ${select("result", "Result", [["ranked", "Found"], ["outside", "Outside checked results"]], current && row.rank === null ? "outside" : "ranked")}
      ${field("rank", "Organic rank", row.rank, "type='number' inputmode='numeric' min='1' max='500' step='1'")}
      ${area("notes", "Notes", row.notes, "Optional. Record comparators, device changes, or an unusual search result.", false, false, "maxlength='5000'")}
    </div>`,
    save: data => {
      const depth = Number(data.depth);
      const rank = data.result === "ranked" ? Number(data.rank) : null;
      if (rank !== null && rank > depth) throw new Error("The organic rank must be within the number of results checked.");
      const next = { ...row, keywordId: data.keywordId, versionId: data.versionId, date: data.date,
        store: data.store.toUpperCase(), device: data.device, rank, depth, notes: data.notes.trim() };
      saveWorkspace({ ...state, checks: replaceOrPrepend(state.checks, next) }, "Search check saved");
    }
  });
}

function editRating(id) {
  if (!state.versions.length) return editVersion();
  const current = state.ratings.find(row => row.id === id);
  const row = current ?? { id: newId(), date: today(), store: filters.store, versionId: filters.version || latestLive()?.id || versionChoices()[0][0], average: "", count: "", notes: "" };
  openEditor({
    title: current ? "Edit rating snapshot" : "Log rating snapshot",
    description: "Use the displayed average and rating count from the selected App Store storefront.",
    fields: `<div class="form-grid">
      ${field("date", "Check date", row.date, "type='date' required")}${storeField(row.store)}
      ${select("versionId", "iOS release", versionChoices(), row.versionId, true)}
      ${field("count", "Rating count", row.count, "type='number' inputmode='numeric' min='0' max='999999999' step='1' required")}
      ${field("average", "Average out of 5", row.average, "type='number' inputmode='decimal' min='1' max='5' step='0.1'")}
      ${area("notes", "Notes", row.notes, "", false, false, "maxlength='5000'")}
    </div>`,
    save: data => {
      const count = Number(data.count);
      if (count > 0 && !data.average) throw new Error("Enter the displayed rating average.");
      if (count === 0 && data.average) throw new Error("Clear the average when the rating count is zero.");
      const next = { ...row, date: data.date, store: data.store.toUpperCase(), versionId: data.versionId,
        average: count === 0 ? null : Number(data.average), count, notes: data.notes.trim() };
      saveWorkspace({ ...state, ratings: replaceOrPrepend(state.ratings, next) }, "Rating saved");
    }
  });
}

function adjustResultInput(form) {
  const result = form.elements.namedItem("result");
  if (!result) return;
  const rank = form.elements.namedItem("rank");
  rank.disabled = result.value !== "ranked";
  rank.required = !rank.disabled;
  rank.closest(".field").hidden = rank.disabled;
}

function editBackup() {
  openEditor({
    title: "Backup & restore",
    description: "Edits live in this browser. Download a backup to keep a copy or move your workspace to another device.",
    fields: `<div class="form-grid"><div class="field wide">${button("export", "Download backup")}</div>
      <label class="field wide"><span class="field-label">Restore from a backup</span>
      <input type="file" name="backup" accept=".json,application/json" required>
      <span class="field-hint">Restoring replaces the records saved in this browser.</span></label></div>`,
    submit: "Restore backup",
    save: async data => {
      if (data.backup.size > 4_000_000) throw new Error("Choose a backup smaller than 4 MB.");
      let backup;
      try {
        backup = decodeWorkspace(await data.backup.text());
      } catch {
        throw new Error("Choose a valid Golf SkyTracer dashboard backup.");
      }
      Object.assign(filters, { store: "US", device: "iPhone", status: "", version: "", keyword: "" });
      saveWorkspace(backup, "Backup restored");
    }
  });
}

function exportWorkspace() {
  const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `skytrace-app-store-${today()}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("Backup downloaded");
}

function populateMetadata(form, content) {
  for (const name of Object.keys(metadataLimits)) {
    const control = form.elements.namedItem(name);
    if (control && name in content) {
      control.value = content[name];
      updateCounter(control);
    }
  }
}

function updateCounter(control) {
  if (!Object.hasOwn(metadataLimits, control.name)) return;
  const counter = control.closest(".field").querySelector("[data-counter]");
  if (!counter) return;
  const length = textLength(control.value, control.name);
  const limit = metadataLimits[control.name];
  counter.textContent = `${length} / ${limit}`;
  counter.classList.toggle("invalid", length > limit);
}

function versionLog(id) {
  filters.version = id;
  filters.keyword = "";
  if (activeRoute() === "log") render();
  else location.hash = "log";
}

async function copyKeywords() {
  const field = document.getElementById("draft-form").elements.namedItem("keywords");
  try {
    await navigator.clipboard.writeText(field.value);
    showToast("Keywords copied");
  } catch {
    field.focus();
    field.select();
    showToast("Keywords selected");
  }
}

function applyIdea(id) {
  const idea = ideas.find(item => item.id === id);
  const form = document.getElementById("draft-form");
  populateMetadata(form, idea);
  form.elements.namedItem("title").focus();
  showToast("Idea loaded. Save draft to keep it.");
}

const actions = {
  "keyword": editKeyword, "task": editTask, "version": editVersion, "rating": editRating,
  "search-check": editSearchCheck, "edit-check": id => editSearchCheck("", id),
  "backup": editBackup, "export": exportWorkspace, "version-log": versionLog,
  "apply-idea": applyIdea, "copy-keywords": copyKeywords,
  "version-draft": () => populateMetadata(editorForm, state.draft),
  "close": () => dialog.close()
};

document.addEventListener("click", event => {
  const control = event.target.closest("button[data-action]");
  if (control) actions[control.dataset.action]?.(control.dataset.id ?? "");
});

document.addEventListener("input", event => updateCounter(event.target));

document.addEventListener("change", event => {
  const name = event.target.dataset.filter;
  if (name) {
    filters[name] = event.target.value;
    render();
    panel.querySelector(`[data-filter="${name}"]`)?.focus();
  }
  if (event.target.name === "result" && event.target.form === editorForm) adjustResultInput(editorForm);
});

document.addEventListener("submit", async event => {
  const form = event.target;
  if (![editorForm.id, "draft-form"].includes(form.id)) return;
  event.preventDefault();
  const error = form.querySelector(".form-error");
  const data = Object.fromEntries(new FormData(form));
  try {
    if (form === editorForm) {
      const submit = document.getElementById("editor-submit");
      submit.disabled = true;
      try {
        await editorSave(data);
        dialog.close();
      } finally {
        submit.disabled = false;
      }
    } else {
      const draft = cleanMetadata(data);
      saveWorkspace({ ...state, draft }, "Draft saved", false);
      populateMetadata(form, draft);
      error.hidden = true;
    }
  } catch (failure) {
    error.textContent = failure.message;
    error.hidden = false;
  }
});

document.querySelector(".skip-link").addEventListener("click", event => {
  event.preventDefault();
  document.getElementById("content").focus();
});

window.addEventListener("hashchange", () => {
  render();
  window.scrollTo(0, 0);
});

render();
