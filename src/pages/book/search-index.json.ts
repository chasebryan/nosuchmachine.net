import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { markdownToMdast, type MdastNode } from "satteri";
import book from "../../data/book.json";
import study from "../../data/study.json";

function searchableText(node: MdastNode): string {
  // Read Markdown as a tree so link destinations are omitted while literal
  // Orange syntax in code examples and inline code remains searchable.
  if ((node.type === "text" || node.type === "code" || node.type === "inlineCode") && "value" in node) {
    return String(node.value);
  }
  return "children" in node ? node.children.map(searchableText).join(" ") : "";
}

export const GET: APIRoute = async () => {
  const entries = [...await getCollection("book"), ...await getCollection("study")];
  const chapters = [...book.chapters, ...study.lessons];
  const index = chapters.map((chapter) => {
    const entry = entries.find((entry) => entry.id === chapter.slug)!;
    const text = searchableText(markdownToMdast(entry.body ?? ""))
      .replace(/\s+/g, " ")
      .trim();
    return { title: chapter.title, url: `/book/${chapter.slug}/`, text };
  });
  return new Response(JSON.stringify(index), { headers: { "Content-Type": "application/json; charset=utf-8" } });
};
