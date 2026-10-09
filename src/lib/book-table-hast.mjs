import GithubSlugger from "github-slugger";
import { defineHastPlugin } from "satteri";

function classesOf(properties) {
  const value = properties?.className;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value.split(/\s+/);
  return [];
}

/**
 * Wrap each Book table in a keyboard-focusable region. Sätteri is Astro's
 * Markdown processor; this hast plugin is the rendering-path equivalent of a
 * rehype plugin. Heading ids are assigned with the same slugger Astro uses,
 * before its heading pass, so the region name matches the heading permalink.
 */
export function bookTableHastPlugin() {
  const slugger = new GithubSlugger();
  let lastHeadingId = "";
  let captions = 0;
  return defineHastPlugin({
    name: "book-table-scroll",
    element: {
      filter: [],
      visit(node, ctx) {
        const tag = node.tagName;
        if (/^h[1-6]$/.test(tag)) {
          const existing = node.properties?.id;
          if (typeof existing === "string" && existing) lastHeadingId = existing;
          else {
            lastHeadingId = slugger.slug(ctx.textContent(node));
            ctx.setProperty(node, "id", lastHeadingId);
          }
          return;
        }
        if (tag !== "table") return;
        const parent = ctx.parent(node);
        if (parent?.type === "element" && parent.tagName === "div" && classesOf(parent.properties).includes("book-table-scroll")) {
          return;
        }
        const properties = {
          className: ["book-table-scroll"],
          tabIndex: 0,
          role: "region",
        };
        const caption = node.children?.find((child) => child.type === "element" && child.tagName === "caption");
        if (caption && caption.type === "element") {
          const existing = caption.properties?.id;
          const id = typeof existing === "string" && existing ? existing : `book-table-caption-${captions}`;
          captions += 1;
          if (id !== existing) ctx.setProperty(caption, "id", id);
          properties.ariaLabelledBy = id;
        } else if (lastHeadingId) {
          properties.ariaLabelledBy = lastHeadingId;
        } else {
          properties.ariaLabel = "Table";
        }
        ctx.wrapNode(node, {
          type: "element",
          tagName: "div",
          properties,
          children: [],
        });
      },
    },
  });
}
