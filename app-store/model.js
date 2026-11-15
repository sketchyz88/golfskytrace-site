import { devices, keywordStatuses, outcomes, priorities, releaseStatuses, taskCategories, taskStatuses } from "./data.js";

export const storageKey = "golfskytrace.app-store.workspace.v1";
export const metadataLimits = { title: 30, subtitle: 30, keywords: 100, description: 4000 };
export const textLength = (value, field) => field === "keywords" ? new TextEncoder().encode(value).length : Array.from(value).length;
export function today() {
  const date = new Date();
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) => String(part).padStart(index ? 2 : 4, "0")).join("-");
}
export const newId = () => globalThis.crypto?.randomUUID?.() ?? `entry-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const byDate = rows => [...rows].sort((a, b) => b.date.localeCompare(a.date));
export const byVersion = rows => [...rows].sort((a, b) => b.version.localeCompare(a.version, "en-US", { numeric: true }));
export const replaceOrPrepend = (items, item) => items.some(old => old.id === item.id)
  ? items.map(old => old.id === item.id ? item : old)
  : [item, ...items];

const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value))
  && new Date(value).toISOString().slice(0, 10) === value;
const validStore = value => /^[A-Z]{2}$/.test(value);
const validDepth = value => Number.isInteger(value) && value >= 1 && value <= 500;
const validVersion = value => /^\d{1,8}(?:\.\d{1,8}){0,2}$/.test(value);
const isText = (value, limit = 5000) => typeof value === "string" && value.length <= limit;
const requiredText = (value, limit) => isText(value, limit) && Boolean(value.trim());
const isId = value => typeof value === "string" && /^[\w-]{1,80}$/.test(value);
const validCheck = row => validDate(row.date) && validStore(row.store) && devices.includes(row.device)
  && validDepth(row.depth) && (row.rank === null || (validDepth(row.rank) && row.rank <= row.depth)) && isText(row.notes);
const validRating = row => validDate(row.date) && validStore(row.store) && Number.isInteger(row.count) && row.count >= 0
  && (row.count === 0 ? row.average === null : Number.isFinite(row.average) && row.average >= 1 && row.average <= 5)
  && isText(row.notes);

export function cleanMetadata(data, allowEmptyTitle = false) {
  const clean = {};
  for (const [field, limit] of Object.entries(metadataLimits)) {
    if (!(field in data)) continue;
    const value = field === "keywords"
      ? data[field].split(",").map(word => word.trim()).filter(Boolean).join(",")
      : data[field].trim();
    if (textLength(value, field) > limit) {
      throw new Error(`${field[0].toUpperCase() + field.slice(1)} can use up to ${limit} ${field === "keywords" ? "bytes" : "characters"}.`);
    }
    if (field === "title" && !(allowEmptyTitle && !value) && textLength(value) < 2) {
      throw new Error("The title needs at least two characters.");
    }
    if (field === "keywords" && value && value.split(",").some(word => textLength(word) < 3)) {
      throw new Error("Each keyword or phrase needs at least three characters.");
    }
    clean[field] = value;
  }
  return clean;
}

export function decodeWorkspace(raw) {
  const state = JSON.parse(raw);
  const validList = (rows, validate) => Array.isArray(rows) && rows.every(row => row && isId(row.id) && validate(row))
    && new Set(rows.map(row => row.id)).size === rows.length;
  const validMetadata = (row, fields, allowEmptyTitle) => fields.every(field => isText(row[field]))
    && Boolean(cleanMetadata(Object.fromEntries(fields.map(field => [field, row[field]])), allowEmptyTitle));
  const error = "Choose a valid Golf SkyTracer dashboard backup.";
  if (state?.schema !== 1 || !state.draft || !validMetadata(state.draft, Object.keys(metadataLimits), false)) throw new Error(error);
  if (!validList(state.keywords, row => requiredText(row.term, 100) && priorities.includes(row.priority)
    && keywordStatuses.includes(row.status) && isText(row.hypothesis))) throw new Error(error);
  if (!validList(state.versions, row => validVersion(row.version) && releaseStatuses.includes(row.status)
    && (!row.date || validDate(row.date)) && typeof row.date === "string" && requiredText(row.changes, 5000)
    && outcomes.includes(row.outcome) && isText(row.evidence) && validMetadata(row, ["title", "subtitle", "keywords"], true))) throw new Error(error);
  const versionIds = new Set(state.versions.map(item => item.id));
  const termIds = new Set(state.keywords.map(item => item.id));
  if (!validList(state.tasks, row => requiredText(row.name, 170) && taskCategories.includes(row.category)
      && taskStatuses.includes(row.status) && (row.versionId === "" || versionIds.has(row.versionId)) && isText(row.notes))
    || !validList(state.checks, row => validCheck(row) && versionIds.has(row.versionId) && termIds.has(row.keywordId))
    || !validList(state.ratings, row => validRating(row) && versionIds.has(row.versionId))) throw new Error(error);
  return state;
}

export const checkLabel = check => {
  if (!check) return "No checks yet";
  return check.rank === null ? `Outside top ${check.depth}` : `#${check.rank}`;
};

export function movement(current, before) {
  if (!before) return { label: current ? "First check" : "—", direction: "" };
  if (current.rank === null && before.rank === null) {
    return { label: current.depth === before.depth ? "Same range" : "Different scan depths", direction: "" };
  }
  if (before.rank === null) {
    return current.rank <= before.depth ? { label: "Now visible", direction: "up" } : { label: "Different scan depths", direction: "" };
  }
  if (current.rank === null) {
    return before.rank <= current.depth ? { label: "Lost visibility", direction: "down" } : { label: "Different scan depths", direction: "" };
  }
  const delta = before.rank - current.rank;
  if (delta === 0) return { label: "No movement", direction: "" };
  return { label: delta > 0 ? `↑ ${delta} places` : `↓ ${-delta} places`, direction: delta > 0 ? "up" : "down" };
}
