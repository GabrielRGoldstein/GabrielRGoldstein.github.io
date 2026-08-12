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
    expect(portfolioContent.site.resumeUrl).toBe("/documents/gabriel-goldstein-resume.pdf");
    expect(html).toContain('href="/documents/gabriel-goldstein-resume.pdf"');
    expect(html).toContain('target="_blank"');
    expect(html).not.toContain("Résumé — link pending");
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

describe("Contact", () => {
  it("renders all confirmed production contact actions", async () => {
    const { default: Contact } = await import("../components/Contact.astro");
    const container = await AstroContainer.create();
    const html = await container.renderToString(Contact, {
      props: { site: portfolioContent.site },
    });

    expect(html).toContain('id="contact"');
    expect(html).toContain('aria-labelledby="contact-title"');
    expect(html).toContain(portfolioContent.site.contact.heading);
    expect(html).toContain(portfolioContent.site.contact.label);
    expect(html).toContain(`href="mailto:${portfolioContent.site.email}"`);
    expect(html).toContain(`href="${portfolioContent.site.github.profileUrl}"`);
    expect(html).toContain('rel="me noreferrer"');
    expect(html).toContain(`href="${portfolioContent.site.resumeUrl}"`);
    expect(html).toContain('download="Gabriel-Goldstein-Resume.pdf"');
    expect(portfolioContent.site.linkedinUrl).toBe(
      "https://www.linkedin.com/in/gabriel-g-b77158121/",
    );
    expect(html).toContain(
      `href="${portfolioContent.site.linkedinUrl}" target="_blank" rel="noreferrer"`,
    );
    expect(html).not.toContain("LinkedIn — profile link pending confirmation");
    expect(html.match(/<a /g)).toHaveLength(4);
    expect(html).not.toContain('href="#"');
  });

  it("renders an unconfigured LinkedIn destination as non-interactive pending text", async () => {
    const { default: Contact } = await import("../components/Contact.astro");
    const site = {
      ...portfolioContent.site,
      linkedinUrl: null,
    };
    const container = await AstroContainer.create();
    const html = await container.renderToString(Contact, { props: { site } });

    expect(html).toContain("LinkedIn — profile link pending confirmation");
    expect(html).not.toContain("https://www.linkedin.com");
    expect(html.match(/target="_blank"/g)).toHaveLength(1);
    expect(html.match(/<a /g)).toHaveLength(3);
  });
});

describe("SiteFooter", () => {
  it("renders the validated identity and location with the current year", async () => {
    const { default: SiteFooter } = await import("../components/SiteFooter.astro");
    const container = await AstroContainer.create();
    const html = await container.renderToString(SiteFooter, {
      props: { site: portfolioContent.site },
    });

    expect(html).toContain("<footer");
    expect(html).toContain(`© ${new Date().getUTCFullYear()} ${portfolioContent.site.name}`);
    expect(html).toContain(portfolioContent.site.location);
    expect(html).not.toContain(portfolioContent.site.email);
  });
});

describe("ExperienceList", () => {
  it("renders every validated experience role as complete static content", async () => {
    const { default: ExperienceList } = await import("../components/ExperienceList.astro");
    const container = await AstroContainer.create();
    const html = await container.renderToString(ExperienceList, {
      props: { experience: portfolioContent.experience },
    });

    expect(html).toContain('id="experience"');
    expect(html).toContain('aria-labelledby="experience-title"');
    expect(html.match(/data-experience-id=/g)).toHaveLength(portfolioContent.experience.length);
    expect(html.match(/<script/g)).toHaveLength(1);
    expect(html).toContain('<script type="module"');
    expect(html).not.toMatch(/<script[^>]+src="https?:/);
    expect(html).not.toContain("client:");

    for (const entry of portfolioContent.experience) {
      expect(html).toContain(`data-experience-id="${entry.id}"`);
      expect(html).toContain(entry.role);
      expect(html).toContain(entry.company);
      expect(html).toContain(entry.location);
      expect(html).toContain(entry.publicSummary);

      for (const period of entry.periods) {
        expect(html).toContain(`datetime="${period.start}"`);
        if (period.end === null) {
          expect(html).toContain("Present");
        } else {
          expect(html).toContain(`datetime="${period.end}"`);
        }
      }

      for (const skill of entry.skills) {
        expect(html).toContain(`>${skill}</li>`);
      }

      for (const highlight of entry.highlights) {
        expect(html).toContain(`>${highlight}</li>`);
      }
    }
  });

  it("renders progressive disclosure hooks without hiding static content", async () => {
    const { default: ExperienceList } = await import("../components/ExperienceList.astro");
    const container = await AstroContainer.create();
    const html = await container.renderToString(ExperienceList, {
      props: { experience: portfolioContent.experience },
    });

    expect(html.match(/data-experience-toggle(?:\s|>)/g)).toHaveLength(
      portfolioContent.experience.length,
    );
    expect(html.match(/data-experience-panel/g)).toHaveLength(portfolioContent.experience.length);
    expect(html.match(/<button[^>]*hidden/g)).toHaveLength(portfolioContent.experience.length);
    expect(html).not.toContain("aria-expanded=");

    for (const entry of portfolioContent.experience) {
      const panelId = `${entry.id}-details`;
      expect(html).toContain(`aria-controls="${panelId}"`);
      expect(html).toContain(`id="${panelId}"`);

      const panelStart = html.indexOf(`id="${panelId}"`);
      const panelEnd = html.indexOf("</div>", panelStart);
      const panelHtml = html.slice(panelStart, panelEnd);
      expect(panelHtml).not.toContain(" hidden");

      for (const highlight of entry.highlights) {
        expect(html).toContain(`>${highlight}</li>`);
      }
      for (const skill of entry.skills) {
        expect(html).toContain(`>${skill}</li>`);
      }
    }
  });

  it("formats every experience period for people and machines", async () => {
    const { default: ExperienceList } = await import("../components/ExperienceList.astro");
    const container = await AstroContainer.create();
    const html = await container.renderToString(ExperienceList, {
      props: { experience: portfolioContent.experience },
    });

    expect(html).toContain('<time datetime="2026-06">Jun 2026</time>');
    expect(html).toContain("Present");
    expect(html).toContain('<time datetime="2023-12">Dec 2023</time>');
    expect(html).toContain('<time datetime="2024-10">Oct 2024</time>');
    expect(html).toContain('<time datetime="2020-12">Dec 2020</time>');
    expect(html).toContain('<time datetime="2022-06">Jun 2022</time>');
    expect(html).not.toContain('>2026-06</time>');
  });
});

describe("Playwright configuration", () => {
  it("runs browser regressions against the generated production preview", async () => {
    const { default: playwrightConfig } = await import("../../playwright.config");
    const webServer = playwrightConfig.webServer;

    expect(Array.isArray(webServer)).toBe(false);
    expect(webServer).toMatchObject({
      command: expect.stringContaining("preview"),
      reuseExistingServer: false,
    });
    expect(webServer).not.toMatchObject({ command: expect.stringContaining("dev") });
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

  it("renders the complete validated lower page without shell placeholders", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(IndexPage);

    for (const entry of portfolioContent.experience) {
      expect(html).toContain(`data-experience-id="${entry.id}"`);
      expect(html).toContain(entry.publicSummary);
    }

    expect(html).toContain(portfolioContent.site.contact.heading);
    expect(html).toContain('href="/documents/gabriel-goldstein-resume.pdf"');
    expect(html).toContain(`© ${new Date().getUTCFullYear()} ${portfolioContent.site.name}`);
    expect(html).not.toContain("Compact role rows will become accessible disclosures");
    expect(html).not.toContain("Software engineering role");
    expect(html).not.toContain('id="about"');
    expect(html.match(/<script/g)).toHaveLength(1);
    expect(html).toContain('<script type="module"');
    expect(html).not.toMatch(/<script[^>]+src="https?:/);
    expect(html).not.toContain("client:");

    const work = html.indexOf('id="work"');
    const experience = html.indexOf('id="experience"');
    const contact = html.indexOf('id="contact"');
    const footer = html.indexOf('<footer class="site-footer">');
    expect(work).toBeLessThan(experience);
    expect(experience).toBeLessThan(contact);
    expect(contact).toBeLessThan(footer);
  });
});
