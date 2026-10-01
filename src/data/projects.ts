import catalog from "./catalog.json";
export type ProjectLink = { label: string; href: string };
export type Project = {
  slug: string;
  name: string;
  summary: string;
  purpose: string;
  approach: string;
  categories: string[];
  technologies: string[];
  capabilities: string[];
  limitations: string[];
  maturity: string;
  status: string;
  githubUrl: string;
  links: ProjectLink[];
  sources: ProjectLink[];
  featured: boolean;
  accent: string;
  diagram: string;
  collection: string;
};
export const projects: Project[] = catalog;
export const featuredProjects = projects.filter((project) => project.featured);
export const coreProjects = projects.filter(
  (project) => project.collection === "core",
);
export const furtherProjects = projects.filter(
  (project) => project.collection === "further",
);
export const getProject = (slug: string) =>
  projects.find((project) => project.slug === slug);
