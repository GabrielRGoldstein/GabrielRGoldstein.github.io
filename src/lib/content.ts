import experienceData from "../data/experience.json";
import projectsData from "../data/projects.json";
import siteData from "../data/site.json";
import {
  experienceListSchema,
  projectsSchema,
  siteSchema,
  type Experience,
  type Project,
  type Site,
} from "../schemas/content";

export interface PortfolioContent {
  site: Site;
  projects: Project[];
  experience: Experience[];
}

export function validatePortfolioContent(input: {
  site: unknown;
  projects: unknown;
  experience: unknown;
}): PortfolioContent {
  const projects = validateProjects(input.projects);

  return {
    site: validateSite(input.site),
    projects: projects.filter(({ selected }) => selected),
    experience: validateExperience(input.experience),
  };
}

export function validateSite(input: unknown): Site {
  return siteSchema.parse(input);
}

export function validateExperience(input: unknown): Experience[] {
  const experience = experienceListSchema.parse(input);
  const seenIds = new Set<string>();

  for (const role of experience) {
    if (seenIds.has(role.id)) {
      throw new Error(`Duplicate experience id "${role.id}".`);
    }

    seenIds.add(role.id);
  }

  return [...experience].sort((left, right) => left.order - right.order);
}

export function validateProjects(input: unknown): Project[] {
  const projects = projectsSchema.parse(input);
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const seenOrders = new Set<number>();

  for (const project of projects) {
    if (seenIds.has(project.id)) {
      throw new Error(`Duplicate project id "${project.id}".`);
    }

    if (seenSlugs.has(project.slug)) {
      throw new Error(`Duplicate project slug "${project.slug}".`);
    }

    if (seenOrders.has(project.order)) {
      throw new Error(`Duplicate project order "${project.order}".`);
    }

    seenIds.add(project.id);
    seenSlugs.add(project.slug);
    seenOrders.add(project.order);
  }

  return [...projects].sort((left, right) => left.order - right.order);
}

export const portfolioContent = validatePortfolioContent({
  site: siteData,
  projects: projectsData,
  experience: experienceData,
});
