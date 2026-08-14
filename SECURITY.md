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

GitHub private vulnerability reporting cannot be promised for this local-only repository. Batch 8 will revisit private vulnerability reporting after a repository destination exists and the feature can be enabled and verified. Until then, email is the supported private channel.

## Scope notes

Repository automation can validate source, dependencies, generated static output, and browser behavior. Hosting controls such as TLS, response headers, caching, and production-origin behavior remain outside this policy until a deployment platform and production URL are selected and verified.
