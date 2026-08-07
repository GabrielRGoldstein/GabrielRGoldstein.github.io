# Portfolio Agent Notes

## Scope

- Production code lives in this `site/` repository.
- The parent `../sketches/` directory is read-only design reference material.
- Follow `docs/IMPLEMENTATION_STATUS.md` and complete only the active implementation batch.
- Preserve the locked original gallery layout, Refined DMG palette, Geist typography, and Study 2 contact footer.
- Do not introduce React, Tailwind, a CMS, a database, or runtime server behavior without a revised plan and explicit approval.

## Commands

Use npm scripts from this directory:

```bash
npm run dev
npm run check
npm run build
npm run preview
```

In the Hermes Windows Git Bash environment, call `npm.cmd` if the `npm` wrapper reports a TTY error. Start long-running development servers with the terminal tool's background mode rather than a trailing shell `&`.

## Required checkpoint

Before ending a batch:

1. Run the batch's verification commands.
2. Update `docs/IMPLEMENTATION_STATUS.md` with the result and next exact command.
3. Finish with a focused Git commit.
