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

const curriculumParts = new Set(["Novice", "Journeyman", "Master"]);

function manifestDocsBook(): boolean {
  for (const raw of Object.values(manifests)) {
    if (raw && typeof raw === "object" && (raw as { docsBook?: unknown }).docsBook === true) return true;
  }
  return false;
}

/** Novice, Journeyman, and Master rows, only after docs/book is in the manifest. */
export function loadCurriculumRows(chapters: ChapterSource[]): BookRow[] {
  if (!manifestDocsBook()) return [];
  return loadBookRows(chapters).filter((row) => curriculumParts.has(row.part));
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
