import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";

import GithubIdentity from "../components/GithubIdentity.astro";
import Hero from "../components/Hero.astro";
import ProjectCard from "../components/ProjectCard.astro";
import ProjectGrid from "../components/ProjectGrid.astro";
import SiteHeader from "../components/SiteHeader.astro";
import { portfolioContent } from "../lib/content";
import IndexPage from "../pages/index.astro";

describe("SiteHeader", () => {
  it("renders the required navigation from validated site content", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SiteHeader, {
      props: { site: portfolioContent.site },
    });

    expect(html).toContain("Gabriel Goldstein, back to top");
    expect(html).toContain('href="#work"');
    expect(html).toContain('href="#experience"');
    expect(html).toContain("Résumé — link pending");
    expect(html).toContain('href="#contact"');
    expect(html).not.toContain("About");

    const work = html.indexOf("Work");
    const experience = html.indexOf("Experience");
    const resume = html.indexOf("Résumé");
    const contact = html.indexOf("Contact");

    expect(work).toBeLessThan(experience);
    expect(experience).toBeLessThan(resume);
    expect(resume).toBeLessThan(contact);
  });
});

describe("GithubIdentity", () => {
  it("renders the configured GitHub profile as a labeled external identity link", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(GithubIdentity, {
      props: { github: portfolioContent.site.github },
    });

    expect(html).toContain(`href="${portfolioContent.site.github.profileUrl}"`);
    expect(html).toContain('rel="me noreferrer"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain(`src="${portfolioContent.site.github.avatarFallback}"`);
    expect(html).toContain(`alt="${portfolioContent.site.github.avatarAlt}"`);
    expect(portfolioContent.site.github.avatarAlt).toContain("GitHub avatar");
    expect(portfolioContent.site.github.avatarAlt).not.toMatch(/illustrat/i);
    expect(html).toContain('width="56"');
    expect(html).toContain('height="56"');
    expect(html).toContain("GitHub profile");
    expect(html).toContain(`@${portfolioContent.site.github.username}`);
  });
});

describe("Hero", () => {
  it("renders validated hero copy, practice areas, and GitHub identity", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Hero, {
      props: { site: portfolioContent.site },
    });

    expect(html).toContain('aria-labelledby="hero-title"');
    expect(html).toContain(portfolioContent.site.hero.eyebrow);
    expect(html).toContain(portfolioContent.site.hero.lead);
    expect(html).toContain(portfolioContent.site.hero.accent);
    expect(html).toContain(portfolioContent.site.hero.summary);
    expect(html).toContain(`@${portfolioContent.site.github.username}`);

    for (const practiceArea of portfolioContent.site.practiceAreas) {
      expect(html).toContain(`>${practiceArea}</li>`);
    }
  });
});

describe("ProjectCard", () => {
  it("renders an authored project without fabricating pending links", async () => {
    const project = portfolioContent.projects[0];
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProjectCard, {
      props: { project },
    });

    expect(html).toContain(`data-project-id="${project.id}"`);
    expect(html).toContain(`src="${project.cover.src}"`);
    expect(html).toContain(`alt="${project.cover.alt}"`);
    expect(html).toContain('width="1600"');
    expect(html).toContain('height="1000"');
    expect(html).toContain(project.title);
    expect(html).toContain(project.summary);
    expect(html).toContain("01 / Featured");
    expect(html).toContain("Project links pending");
    expect(html).not.toContain("href=");

    for (const technology of project.stack) {
      expect(html).toContain(`>${technology}</li>`);
    }
  });

  it("renders configured repository and live-demo destinations as safe external links", async () => {
    const project = {
      ...portfolioContent.projects[0],
      repositoryUrl: "https://github.com/example/project",
      liveUrl: "https://example.com/project",
    };
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProjectCard, {
      props: { project },
    });

    expect(html).toContain(`href="${project.repositoryUrl}"`);
    expect(html).toContain(`href="${project.liveUrl}"`);
    expect(html.match(/target="_blank"/g)).toHaveLength(2);
    expect(html.match(/rel="noreferrer"/g)).toHaveLength(2);
    expect(html).not.toContain("Project links pending");
  });
});

describe("ProjectGrid", () => {
  it("renders every validated project once in curated order", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProjectGrid, {
      props: { projects: portfolioContent.projects },
    });

    expect(html).toContain('id="work"');
    expect(html).toContain('aria-labelledby="work-title"');
    expect(html.match(/data-project-id=/g)).toHaveLength(portfolioContent.projects.length);

    const titleOffsets = portfolioContent.projects.map((project) => html.indexOf(project.title));
    expect(titleOffsets.every((offset) => offset >= 0)).toBe(true);
    expect(titleOffsets).toEqual([...titleOffsets].sort((a, b) => a - b));
  });
});

describe("index page", () => {
  it("renders the validated top half without project-shell placeholders", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(IndexPage);

    expect(html).toContain(portfolioContent.site.hero.summary);
    expect(html).toContain('<main id="main-content" tabindex="-1">');
    expect(html).toContain(`@${portfolioContent.site.github.username}`);
    expect(html).not.toContain("Structural placeholder establishing final card proportions");
    expect(html).not.toContain("Curated project content and filtering arrive");

    for (const project of portfolioContent.projects) {
      expect(html).toContain(`data-project-id="${project.id}"`);
      expect(html).toContain(project.title);
    }
  });
});
