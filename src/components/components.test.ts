import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";

import GithubIdentity from "../components/GithubIdentity.astro";
import Hero from "../components/Hero.astro";
import ProjectCard from "../components/ProjectCard.astro";
import ProjectGrid from "../components/ProjectGrid.astro";
import SiteHeader from "../components/SiteHeader.astro";
import { portfolioContent } from "../lib/content";
import IndexPage from "../pages/index.astro";

const productionOrigin = "https://gabrielrgoldstein.github.io";

describe("SiteHeader", () => {
  it("renders the required navigation from validated site content", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SiteHeader, {
      props: { site: portfolioContent.site },
    });

    expect(html).toContain("Gabriel Goldstein, back to top");
    expect(html).toContain('href="#work"');
    expect(html).toContain('href="#experience"');
    expect(portfolioContent.site.resumeUrl).toBe(
      "/documents/gabriel-goldstein-resume.pdf",
    );
    expect(html).toContain('href="/documents/gabriel-goldstein-resume.pdf"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('data-analytics-event="resume_download"');
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
    expect(html).toContain('data-analytics-event="github_profile_click"');
    expect(html).toContain('rel="me noreferrer"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain(
      `src="${portfolioContent.site.github.avatarFallback}"`,
    );
    expect(html).toContain("/images/avatar-96.webp 96w");
    expect(html).toContain("/images/avatar-128.webp 128w");
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
  const unlinkedProject = portfolioContent.projects.find(
    ({ repositoryUrl, liveUrl }) => repositoryUrl === null && liveUrl === null,
  )!;

  it("renders an authored project with an honest audited-link state", async () => {
    const project = unlinkedProject;
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProjectCard, {
      props: { project },
    });

    expect(html).toContain(`data-project-id="${project.id}"`);
    expect(html).toContain(`src="${project.cover.src}"`);
    const responsiveCandidates = project.cover.sources
      ?.map(({ src, width }) => `${src} ${width}w`)
      .concat(`${project.cover.src} ${project.cover.width}w`)
      .join(", ");
    expect(html).toContain(`srcset="${responsiveCandidates}"`);
    expect(html).toContain(
      'sizes="(max-width: 53.125rem) calc(100vw - clamp(2.5rem, 8vw, 3.5rem) - 2px), (max-width: 81rem) calc((100vw - 4.75rem) / 2), 610px"',
    );
    expect(html).toContain(`alt="${project.cover.alt}"`);
    expect(html).toContain(`width="${project.cover.width}"`);
    expect(html).toContain(`height="${project.cover.height}"`);
    expect(html).toContain(project.title);
    expect(html).toContain(project.summary);
    expect(html).toContain(
      `${String(project.order).padStart(2, "0")} / Featured`,
    );
    expect(html).toContain("Public project links are pending review.");
    expect(html).not.toContain("Project links pending");
    expect(html).not.toContain("href=");

    for (const technology of project.stack) {
      expect(html).toContain(`>${technology}</li>`);
    }
  });

  it("keeps homepage cards compact while retaining technical detail in the dialog", async () => {
    const project = unlinkedProject;
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProjectCard, {
      props: { project, layout: "wide" },
    });
    const dialogStart = html.indexOf("<dialog");
    const cardHtml = html.slice(0, dialogStart);
    const dialogHtml = html.slice(dialogStart);

    expect(cardHtml).toContain(project.title);
    expect(cardHtml).toContain(project.summary);
    expect(cardHtml).not.toContain("<noscript>");
    expect(cardHtml).not.toContain("project-card__stack");
    expect(cardHtml).not.toContain("Project links pending");
    expect(cardHtml).toContain("project-card__fallback-details");
    expect(cardHtml).toContain("data-project-dialog-fallback");
    expect(dialogHtml).toContain("project-dialog__stack");
    expect(dialogHtml).toContain("Public project links are pending review.");

    for (const technology of project.stack) {
      expect(cardHtml).toContain(`>${technology}</li>`);
      expect(dialogHtml).toContain(`>${technology}</li>`);
    }
  });

  it("renders an accessible static project dialog relationship for progressive enhancement", async () => {
    const project = portfolioContent.projects[0];
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProjectCard, {
      props: { project, layout: "wide" },
    });
    const dialogId = `project-${project.slug}-dialog`;

    expect(html).toContain(`<dialog id="${dialogId}"`);
    expect(html).not.toContain(`<dialog id="${dialogId}" open`);
    expect(html).toContain(`aria-controls="${dialogId}"`);
    expect(html).toContain("data-project-dialog-trigger");
    expect(html).toContain("data-project-dialog-close");
    expect(html).not.toContain('data-analytics-event="project_open"');
    expect(html).toContain(`data-analytics-project-id="${project.slug}"`);
    expect(html).toContain(`Explore ${project.title}`);
    expect(html).toContain(`aria-labelledby="${dialogId}-title"`);
    expect(html).toContain(`aria-describedby="${dialogId}-summary"`);
  });

  it("applies an authored safe focal position to the homepage cover", async () => {
    const project = {
      ...portfolioContent.projects[0],
      cover: {
        ...portfolioContent.projects[0].cover,
        objectPosition: "top" as const,
      },
    };
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProjectCard, {
      props: { project },
    });
    const cardEnd = html.indexOf("</article>");
    const cardHtml = html.slice(0, cardEnd);

    expect(cardHtml).toContain('style="object-position: top"');
  });

  it("uses an authored full-aspect gallery image inside the project dialog", async () => {
    const project = {
      ...portfolioContent.projects[0],
      gallery: [
        {
          src: "/images/projects/discord-clone-detail.webp",
          alt: "Full Discord Clone application interface",
          width: 1600,
          height: 1067,
        },
      ],
    };
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProjectCard, {
      props: { project },
    });
    const dialogStart = html.indexOf("<dialog");
    const dialogHtml = html.slice(dialogStart);

    expect(dialogHtml).toContain(
      'src="/images/projects/discord-clone-detail.webp"',
    );
    expect(dialogHtml).toContain(
      'alt="Full Discord Clone application interface"',
    );
    expect(dialogHtml).toContain('width="1600"');
    expect(dialogHtml).toContain('height="1067"');
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
    expect(html.match(/data-analytics-project-id=/g)).toHaveLength(5);
    expect(html.match(/data-analytics-event="project_open"/g)).toBeNull();
    expect(
      html.match(/data-analytics-event="project_repository_click"/g),
    ).toHaveLength(2);
    expect(
      html.match(/data-analytics-event="project_demo_click"/g),
    ).toHaveLength(2);
    expect(html).toContain('data-analytics-event="project_repository_click"');
    expect(html).toContain('data-analytics-event="project_demo_click"');
    expect(html.match(/target="_blank"/g)).toHaveLength(4);
    expect(html.match(/rel="noreferrer"/g)).toHaveLength(4);
    expect(html).not.toContain("Project links pending");
  });

  it("uses only authored responsive image sources and dimensions", async () => {
    const project = {
      ...portfolioContent.projects[0],
      cover: {
        src: "/images/projects/custom-original.webp",
        alt: "Custom project cover",
        width: 1200,
        height: 750,
        sources: [{ src: "/images/projects/custom-small.webp", width: 500 }],
      },
    };
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProjectCard, {
      props: { project },
    });

    expect(html).toContain(
      'srcset="/images/projects/custom-small.webp 500w, /images/projects/custom-original.webp 1200w"',
    );
    expect(html).toContain('width="1200"');
    expect(html).toContain('height="750"');
    expect(html).not.toContain(`${project.slug}-640.webp`);
  });

  it("renders a base cover without inventing responsive sources", async () => {
    const project = {
      ...portfolioContent.projects[0],
      cover: {
        src: "/images/projects/base-only.webp",
        alt: "Base-only project cover",
        width: 900,
        height: 600,
      },
    };
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProjectCard, {
      props: { project },
    });

    expect(html).toContain('src="/images/projects/base-only.webp"');
    expect(html).not.toContain("srcset=");
    expect(html).toContain('width="900"');
    expect(html).toContain('height="600"');
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
    expect(html).toContain('<div class="section-header__intro">');
    expect(html).toMatch(
      /<div class="section-header__intro">[\s\S]*?<h2 id="work-title">Selected projects<\/h2>[\s\S]*?<p>Production-minded work spanning real-time systems, AI, commerce, and data\.<\/p>[\s\S]*?<\/div>/,
    );
    expect(html).toContain(
      `<span class="section-header__count">${portfolioContent.projects.length} selected projects</span>`,
    );
    expect(html).not.toContain('class="section-header__summary"');
    expect(html.match(/data-project-id=/g)).toHaveLength(
      portfolioContent.projects.length,
    );

    const titleOffsets = portfolioContent.projects.map((project) =>
      html.indexOf(project.title),
    );
    expect(titleOffsets.every((offset) => offset >= 0)).toBe(true);
    expect(titleOffsets).toEqual([...titleOffsets].sort((a, b) => a - b));
  });

  it("renders seven selected projects with one Sketch 11 asymmetric pair", async () => {
    const projects = Array.from({ length: 7 }, (_, index) => ({
      ...portfolioContent.projects[index % portfolioContent.projects.length],
      id: `project-${index + 1}`,
      slug: `project-${index + 1}`,
      order: index + 1,
      title: `Project ${index + 1}`,
    }));
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProjectGrid, {
      props: { projects },
    });

    expect(html.match(/data-project-id=/g)).toHaveLength(7);
    expect(html).toContain("7 selected projects");
    expect(html).toContain(
      "Production-minded work spanning real-time systems, AI, commerce, and data.",
    );
    expect(html.match(/data-project-layout="wide"/g)).toHaveLength(1);
    expect(html.match(/data-project-layout="narrow"/g)).toHaveLength(1);
    expect(html.match(/data-project-layout="standard"/g)).toHaveLength(5);

    const titleOffsets = projects.map((project) => html.indexOf(project.title));
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
    expect(html).toContain('data-analytics-event="email_click"');
    expect(html).toContain(`href="${portfolioContent.site.github.profileUrl}"`);
    expect(html).toContain('data-analytics-event="github_profile_click"');
    expect(html).toContain('rel="me noreferrer"');
    expect(html).toContain(`href="${portfolioContent.site.resumeUrl}"`);
    expect(html).toContain('data-analytics-event="resume_download"');
    expect(html).toContain('download="Gabriel-Goldstein-Resume.pdf"');
    expect(portfolioContent.site.linkedinUrl).toBe(
      "https://www.linkedin.com/in/gabriel-g-b77158121/",
    );
    expect(html).toContain(
      `href="${portfolioContent.site.linkedinUrl}" target="_blank" rel="noreferrer"`,
    );
    expect(html).toContain('data-analytics-event="linkedin_click"');
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
    const { default: SiteFooter } =
      await import("../components/SiteFooter.astro");
    const container = await AstroContainer.create();
    const html = await container.renderToString(SiteFooter, {
      props: { site: portfolioContent.site },
    });

    expect(html).toContain("<footer");
    expect(html).toContain(
      `© ${new Date().getUTCFullYear()} ${portfolioContent.site.name}`,
    );
    expect(html).toContain(portfolioContent.site.location);
    expect(html).not.toContain(portfolioContent.site.email);
  });
});

describe("ExperienceList", () => {
  it("renders every validated experience role as complete static content", async () => {
    const { default: ExperienceList } =
      await import("../components/ExperienceList.astro");
    const container = await AstroContainer.create();
    const html = await container.renderToString(ExperienceList, {
      props: { experience: portfolioContent.experience },
    });

    expect(html).toContain('id="experience"');
    expect(html).toContain('aria-labelledby="experience-title"');
    expect(html).toMatch(
      /<header class="section-header">[\s\S]*?<div class="section-header__intro">[\s\S]*?<h2 id="experience-title">Experience<\/h2>[\s\S]*?<p>Public-safe impact across systems integration, security automation, data engineering, and product work\.<\/p>/,
    );
    expect(html.match(/data-experience-id=/g)).toHaveLength(
      portfolioContent.experience.length,
    );
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
    const { default: ExperienceList } =
      await import("../components/ExperienceList.astro");
    const container = await AstroContainer.create();
    const html = await container.renderToString(ExperienceList, {
      props: { experience: portfolioContent.experience },
    });

    expect(html.match(/data-experience-toggle(?:\s|>)/g)).toHaveLength(
      portfolioContent.experience.length,
    );
    expect(html.match(/data-experience-panel/g)).toHaveLength(
      portfolioContent.experience.length,
    );
    expect(html.match(/<button[^>]*hidden/g)).toHaveLength(
      portfolioContent.experience.length,
    );
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

  it("keeps location out of the scan line while retaining it in static details", async () => {
    const { default: ExperienceList } =
      await import("../components/ExperienceList.astro");
    const entry = portfolioContent.experience[0];
    const container = await AstroContainer.create();
    const html = await container.renderToString(ExperienceList, {
      props: { experience: [entry] },
    });
    const headingStart = html.indexOf(
      '<header class="experience-row__heading">',
    );
    const headingEnd = html.indexOf("</header>", headingStart);
    const panelStart = html.indexOf("data-experience-panel");
    const headingHtml = html.slice(headingStart, headingEnd);
    const panelHtml = html.slice(panelStart);

    expect(headingHtml).not.toContain(entry.location);
    expect(panelHtml).toContain(entry.location);
    expect(panelHtml).toContain('class="experience-row__details-meta"');
  });

  it("formats experience periods as concise years while preserving exact machine dates", async () => {
    const { default: ExperienceList } =
      await import("../components/ExperienceList.astro");
    const container = await AstroContainer.create();
    const html = await container.renderToString(ExperienceList, {
      props: { experience: portfolioContent.experience },
    });

    expect(html).toContain('<time datetime="2026-06">2026</time>');
    expect(html).toContain("Present");
    expect(html).toContain('<time datetime="2023-12">2023</time>');
    expect(html).toContain('<time datetime="2024-10">2024</time>');
    expect(html).toContain('<time datetime="2020-12">2020</time>');
    expect(html).toContain('<time datetime="2022-06">2022</time>');
    expect(html).not.toContain(">Jun 2026</time>");
    expect(html).not.toContain(">Dec 2023</time>");
  });
});

describe("Playwright configuration", () => {
  it("runs browser regressions against the generated production preview", async () => {
    const { default: playwrightConfig } =
      await import("../../playwright.config");
    const webServer = playwrightConfig.webServer;

    expect(Array.isArray(webServer)).toBe(false);
    expect(webServer).toMatchObject({
      command: expect.stringContaining("preview"),
      reuseExistingServer: false,
    });
    expect(webServer).not.toMatchObject({
      command: expect.stringContaining("dev"),
    });
  });

  it("uses a separate fail-closed configuration for the exact production origin", async () => {
    const previousProductionUrl = process.env.PRODUCTION_URL;
    process.env.PRODUCTION_URL = productionOrigin;
    let productionConfig;
    let requireProductionUrl: ((value?: string) => string) | undefined;

    try {
      const productionModule =
        await import("../../playwright.production.config");
      productionConfig = productionModule.default;
      requireProductionUrl = productionModule.requireProductionUrl;
    } catch {
      productionConfig = undefined;
      requireProductionUrl = undefined;
    } finally {
      if (previousProductionUrl === undefined)
        delete process.env.PRODUCTION_URL;
      else process.env.PRODUCTION_URL = previousProductionUrl;
    }

    expect(productionConfig).toBeDefined();
    expect(productionConfig?.webServer).toBeUndefined();
    expect(productionConfig?.workers).toBe(1);
    expect(productionConfig?.use).toMatchObject({ baseURL: productionOrigin });
    expect(requireProductionUrl?.(productionOrigin)).toBe(productionOrigin);
    for (const invalidUrl of [
      undefined,
      "http://gabrielrgoldstein.github.io",
      "https://example.com",
      "https://user:password@gabrielrgoldstein.github.io",
      `${productionOrigin}/portfolio/`,
      `${productionOrigin}/?preview=true`,
      `${productionOrigin}/#preview`,
    ]) {
      expect(() => requireProductionUrl?.(invalidUrl)).toThrow(
        /production[_ ]url/i,
      );
    }
  });
});

describe("SeoHead", () => {
  it("renders complete share metadata when a canonical deployment URL is available", async () => {
    const { default: SeoHead } = await import("../components/SeoHead.astro");
    const container = await AstroContainer.create();
    const canonicalUrl = new URL("https://portfolio.example/work");
    const html = await container.renderToString(SeoHead, {
      props: {
        title: portfolioContent.site.meta.title,
        description: portfolioContent.site.meta.description,
        canonicalUrl,
      },
    });

    expect(html).toContain(
      `<title>${portfolioContent.site.meta.title}</title>`,
    );
    expect(html).toContain(
      `name="description" content="${portfolioContent.site.meta.description}"`,
    );
    expect(html).toContain(`rel="canonical" href="${canonicalUrl.href}"`);
    expect(html).toContain('property="og:type" content="website"');
    expect(html).toContain(`property="og:url" content="${canonicalUrl.href}"`);
    expect(html).toContain(
      'property="og:image" content="https://portfolio.example/og/portfolio-card.png"',
    );
    expect(html).toContain('property="og:image:width" content="1200"');
    expect(html).toContain('property="og:image:height" content="630"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain(
      'name="twitter:image" content="https://portfolio.example/og/portfolio-card.png"',
    );
  });

  it("does not fabricate a canonical deployment origin", async () => {
    const { default: SeoHead } = await import("../components/SeoHead.astro");
    const container = await AstroContainer.create();
    const html = await container.renderToString(SeoHead, {
      props: {
        title: portfolioContent.site.meta.title,
        description: portfolioContent.site.meta.description,
      },
    });

    expect(html).not.toContain('rel="canonical"');
    expect(html).not.toContain('property="og:url"');
    expect(html).not.toMatch(/https?:\/\/localhost/);
    expect(html).toContain(
      'property="og:image" content="/og/portfolio-card.png"',
    );
  });
});

describe("index page", () => {
  it("renders share metadata without inventing the deferred deployment URL", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(IndexPage);

    expect(html).toContain(
      `<title>${portfolioContent.site.meta.title}</title>`,
    );
    expect(html).toContain(
      `property="og:title" content="${portfolioContent.site.meta.title}"`,
    );
    expect(html).toContain(
      'property="og:image" content="/og/portfolio-card.png"',
    );
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).not.toContain('rel="canonical"');
    expect(html).not.toContain('property="og:url"');
    expect(html).not.toMatch(/https?:\/\/localhost/);
  });

  it("renders the validated top half without project-shell placeholders", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(IndexPage);

    expect(html).toContain(portfolioContent.site.hero.summary);
    expect(html).toContain('<main id="main-content" tabindex="-1">');
    expect(html).toContain(`@${portfolioContent.site.github.username}`);
    expect(html).not.toContain(
      "Structural placeholder establishing final card proportions",
    );
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
    expect(html).toContain(
      `© ${new Date().getUTCFullYear()} ${portfolioContent.site.name}`,
    );
    expect(html).not.toContain(
      "Compact role rows will become accessible disclosures",
    );
    expect(html).not.toContain("Software engineering role");
    expect(html).not.toContain('id="about"');
    expect(html.match(/<script/g)).toHaveLength(3);
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
