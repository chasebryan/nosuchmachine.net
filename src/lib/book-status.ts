export type ChapterStatus = "drafted" | "planned";

/** True in `astro dev`. Production builds omit empty copy slots. */
export const showContentSlots = !import.meta.env.PROD;

type ManifestEntry = {
  slug?: string;
  title?: string;
  part?: string;
  status?: string;
};

export type BookRow = {
  slug: string;
  title: string;
  part: string;
  status: ChapterStatus;
  href?: string;
};

type ChapterSource = { slug: string; title: string; part: string };

// The sync owner writes src/content/book/manifest.json. This glob stays empty
// until that file exists, and this module does not create it.
const manifests = import.meta.glob("../content/book/manifest.json", {
  eager: true,
  import: "default",
});

// Written by the book sync next to the snapshot. Not a fallback for manifest.json.
const provenances = import.meta.glob("../content/book/source/provenance.json", {
  eager: true,
  import: "default",
});

const commitPattern = /^[0-9a-f]{40}$/i;

export type BookSync = { commit: string; short: string; href: string };

/** Orange commit the hosted book was synced from, or null when provenance is missing or invalid. */
export function loadBookSync(): BookSync | null {
  for (const raw of Object.values(provenances)) {
    if (!raw || typeof raw !== "object") continue;
    const commit = (raw as { commit?: unknown }).commit;
    if (typeof commit !== "string" || !commitPattern.test(commit)) continue;
    return {
      commit,
      short: commit.slice(0, 7),
      href: `https://github.com/chasebryan/orange/commit/${commit}`,
    };
  }
  return null;
}

function entriesFrom(raw: unknown): ManifestEntry[] {
  if (Array.isArray(raw)) return raw as ManifestEntry[];
  if (raw && typeof raw === "object") {
    const record = raw as { chapters?: unknown; entries?: unknown };
    if (Array.isArray(record.chapters)) return record.chapters as ManifestEntry[];
    if (Array.isArray(record.entries)) return record.entries as ManifestEntry[];
  }
  return [];
}

export function loadChapterStatus(): Map<string, ChapterStatus> {
  const statuses = new Map<string, ChapterStatus>();
  for (const raw of Object.values(manifests)) {
    for (const entry of entriesFrom(raw)) {
      if (!entry?.slug) continue;
      if (entry.status === "drafted" || entry.status === "planned") {
        statuses.set(entry.slug, entry.status);
      }
    }
  }
  return statuses;
}

export function statusFor(
  statuses: Map<string, ChapterStatus>,
  slug: string,
): ChapterStatus {
  return statuses.get(slug) ?? "drafted";
}

function knownStatus(value: string | undefined, hasPage: boolean): ChapterStatus {
  if (value === "drafted" || value === "planned") return value;
  return hasPage ? "drafted" : "planned";
}

/** Rows from manifest.json when the sync owner has written it, otherwise the hosted chapters. */
export function loadBookRows(chapters: ChapterSource[]): BookRow[] {
  const bySlug = new Map(chapters.map((chapter) => [chapter.slug, chapter]));
  const manifest = manifestEntries().filter((entry) => entry.slug && entry.title);
  if (manifest.length > 0) {
    return manifest.map((entry) => {
      const slug = entry.slug!;
      const known = bySlug.get(slug);
      return {
        slug,
        title: entry.title!,
        part: entry.part?.trim() || known?.part || "",
        status: knownStatus(entry.status, Boolean(known)),
        href: known ? `/book/${slug}/` : undefined,
      };
    });
  }
  return chapters.map((chapter) => ({
    slug: chapter.slug,
    title: chapter.title,
    part: chapter.part,
    status: "drafted",
    href: `/book/${chapter.slug}/`,
  }));
}

const curriculumOrder = ["Novice", "Journeyman", "Master"] as const;
const curriculumParts = new Set<string>(curriculumOrder);

export type ManifestInfo = { docsBook: boolean; version: string };

/** Manifest flags, with safe defaults when manifest.json is absent. */
export function loadManifestInfo(): ManifestInfo {
  let docsBook = false;
  let version = "";
  for (const raw of Object.values(manifests)) {
    if (!raw || typeof raw !== "object") continue;
    const record = raw as { docsBook?: unknown; version?: unknown };
    if (record.docsBook === true) docsBook = true;
    if (!version && typeof record.version === "string") version = record.version.trim();
  }
  return { docsBook, version };
}

/** Hosted chapters from book.json. Manuscript rows do not come from the manifest. */
export function loadManuscriptRows(chapters: ChapterSource[]): BookRow[] {
  return chapters.map((chapter) => ({
    slug: chapter.slug,
    title: chapter.title,
    part: chapter.part,
    status: "drafted",
    href: `/book/${chapter.slug}/`,
  }));
}

/** Novice, Journeyman, and Master rows, only when the manifest says docsBook. */
export function loadCurriculumRows(chapters: ChapterSource[]): BookRow[] {
  if (!loadManifestInfo().docsBook) return [];
  const bySlug = new Map(chapters.map((chapter) => [chapter.slug, chapter]));
  const rows = manifestEntries()
    .filter((entry) => entry.slug && entry.title && curriculumParts.has((entry.part ?? "").trim()))
    .map((entry) => {
      const slug = entry.slug!;
      const known = bySlug.get(slug);
      return {
        slug,
        title: entry.title!,
        part: (entry.part ?? "").trim(),
        status: knownStatus(entry.status, Boolean(known)),
        href: known ? `/book/${slug}/` : undefined,
      };
    });
  return rows.sort(
    (a, b) =>
      curriculumOrder.indexOf(a.part as (typeof curriculumOrder)[number]) -
      curriculumOrder.indexOf(b.part as (typeof curriculumOrder)[number]),
  );
}

export function groupBookRows(rows: BookRow[]): { part: string; rows: BookRow[] }[] {
  const groups: { part: string; rows: BookRow[] }[] = [];
  for (const row of rows) {
    const current = groups.at(-1);
    if (current && current.part === row.part) current.rows.push(row);
    else groups.push({ part: row.part, rows: [row] });
  }
  return groups;
}

function manifestEntries(): ManifestEntry[] {
  const entries: ManifestEntry[] = [];
  for (const raw of Object.values(manifests)) entries.push(...entriesFrom(raw));
  return entries;
}
