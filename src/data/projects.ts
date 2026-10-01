export type ProjectLink = {
  label: string;
  href: string;
  primary?: boolean;
};

export type Project = {
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  status: string;
  featured: boolean;
  accent: string;
  visual: {
    src: string;
    alt: string;
    kind: "emblem" | "banner" | "cover";
  };
  links: ProjectLink[];
};

/**
 * Portfolio catalog. Add future ambitious projects here; keep `featured`
 * sparse so the site stays a selection, not a dump of every repo.
 */
export const projects: Project[] = [
  {
    slug: "orange",
    name: "Orange",
    tagline: "Cryptography you can check.",
    summary:
      "A language and toolchain for specifying, implementing, and verifying cryptography — so mathematical intent, native code, and assurance evidence stay connected instead of living in separate tools.",
    status: "Pre-alpha · solo",
    featured: true,
    accent: "#F54F1F",
    visual: {
      src: "/projects/orange/book-cover.svg",
      alt: "The Orange Book cover: the Orange emblem on a field of Orange",
      kind: "cover",
    },
    links: [
      {
        label: "Repository",
        href: "https://github.com/chasebryan/orange",
        primary: true,
      },
      {
        label: "The Orange Book",
        href: "https://github.com/chasebryan/orange/blob/main/docs/THE_ORANGE_BOOK.md",
      },
      {
        label: "Orange School",
        href: "https://github.com/chasebryan/orange-school",
      },
    ],
  },
];

export const featuredProjects = projects.filter((p) => p.featured);

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
