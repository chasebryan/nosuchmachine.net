export type ChapterStatus = "drafted" | "planned";

type ManifestEntry = { slug?: string; status?: string };

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
