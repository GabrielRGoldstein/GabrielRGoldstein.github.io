# Security Policy

## Supported version

Security fixes apply to the latest commit on `main`. This repository produces a static Astro site and does not contain a backend, runtime database, or authentication service.

## Reporting a vulnerability

Email **ggoldstein771@gmail.com** with the subject `Security report: portfolio` and include:

- the affected path or component;
- steps to reproduce;
- the potential impact;
- any suggested mitigation; and
- only the minimum evidence needed to demonstrate the issue.

Please do not open a public issue or publish exploit details before the report has been assessed and a fix has been released. Do not include credentials, personal data, or unrelated third-party information in a report.

GitHub private vulnerability reporting is enabled and API-verified for the public [`GabrielRGoldstein/GabrielRGoldstein.github.io`](https://github.com/GabrielRGoldstein/GabrielRGoldstein.github.io) repository. Use [Report a vulnerability](https://github.com/GabrielRGoldstein/GabrielRGoldstein.github.io/security/advisories/new) when possible; email remains the private fallback.

## Scope notes

Repository automation validates source, dependencies, generated static output, and browser behavior. GitHub Pages is the selected static host and reports managed HTTPS enforcement. Response headers, caching, redirects, and production-origin behavior are accepted only from direct observations of the deployed site; repository configuration alone is not evidence of those controls.
