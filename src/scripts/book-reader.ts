const bookNavigation = document.querySelector<HTMLDetailsElement>("#book-navigation");
const mobile = window.matchMedia("(max-width: 979px)");
function syncNavigation() { if (bookNavigation) bookNavigation.open = !mobile.matches; }
syncNavigation();
mobile.addEventListener("change", syncNavigation);

document.querySelector<HTMLButtonElement>("[data-book-print]")?.addEventListener("click", () => window.print());

const input = document.querySelector<HTMLInputElement>("#book-search-input");
const results = document.querySelector<HTMLOListElement>("#book-search-results");
const searchStatus = document.querySelector<HTMLParagraphElement>("#book-search-status");
const chapters = document.querySelector<HTMLElement>("#book-chapters");
type SearchEntry = { title: string; url: string; text: string };
let indexPromise: Promise<SearchEntry[]> | undefined;
let searchSequence = 0;
let searchTimer: ReturnType<typeof setTimeout>;
function loadIndex() {
  indexPromise ??= fetch("/book/search-index.json").then((response) => {
    if (!response.ok) throw new Error("Search index unavailable");
    return response.json() as Promise<SearchEntry[]>;
  }).catch((error) => { indexPromise = undefined; throw error; });
  return indexPromise;
}
async function searchBook() {
  if (!input || !results || !searchStatus || !chapters) return;
  const sequence = ++searchSequence;
  const term = input.value.trim().toLocaleLowerCase();
  results.replaceChildren();
  results.hidden = true;
  chapters.hidden = false;
  searchStatus.textContent = term.length === 1 ? "Enter at least two characters." : "";
  if (term.length < 2) return;
  searchStatus.textContent = "Searching the book…";
  try {
    const index = await loadIndex();
    if (sequence !== searchSequence) return;
    const matches = index.filter((entry) => `${entry.title} ${entry.text}`.toLocaleLowerCase().includes(term));
    chapters.hidden = true;
    results.hidden = matches.length === 0;
    searchStatus.textContent = matches.length ? `${matches.length} matching ${matches.length === 1 ? "chapter" : "chapters"}.` : "No chapters found. Try a different phrase.";
    for (const entry of matches) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = entry.url;
      const title = document.createElement("strong");
      title.textContent = entry.title;
      const snippet = document.createElement("span");
      const position = entry.text.toLocaleLowerCase().indexOf(term);
      const start = Math.max(0, position - 45);
      snippet.textContent = `${start ? "…" : ""}${entry.text.slice(start, start + 145)}…`;
      link.append(title, snippet);
      item.append(link);
      results.append(item);
    }
  } catch {
    if (sequence !== searchSequence) return;
    searchStatus.textContent = "Search couldn’t load. You can still browse the contents below.";
  }
}
input?.addEventListener("input", () => {
  ++searchSequence;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { void searchBook(); }, 160);
});
input?.addEventListener("keydown", (event) => {
  if (event.key === "Escape") { input.value = ""; clearTimeout(searchTimer); void searchBook(); }
});

for (const pre of document.querySelectorAll<HTMLPreElement>(".book-prose pre")) {
  const code = pre.querySelector("code");
  if (!code || !navigator.clipboard) continue;
  const wrapper = document.createElement("div");
  wrapper.className = "book-code-block";
  pre.replaceWith(wrapper);
  wrapper.append(pre);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "book-copy-code";
  button.textContent = "Copy";
  button.setAttribute("aria-label", "Copy this code example");
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(code.textContent ?? "");
      button.textContent = "Copied";
    } catch { button.textContent = "Select to copy"; }
    setTimeout(() => { button.textContent = "Copy"; }, 1800);
  });
  wrapper.append(button);
}
for (const heading of document.querySelectorAll<HTMLHeadingElement>(".book-prose h2[id], .book-prose h3[id], .book-prose h4[id]")) {
  const link = document.createElement("a");
  link.className = "book-heading-anchor";
  link.href = `#${heading.id}`;
  link.textContent = "#";
  link.setAttribute("aria-label", `Link to ${heading.textContent}`);
  heading.append(link);
}

export {};
