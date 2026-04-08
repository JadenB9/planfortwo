# Contributing

PlanForTwo is a personal portfolio project built and maintained by Jaden Butler. The repository is published primarily as a demonstration of full-stack and security-focused engineering work, not as an open invitation for outside contribution.

## What this means in practice

- **External pull requests are not actively solicited.** I'm happy that you want to look around, but I'm unlikely to merge unsolicited feature PRs. If you really want to send one, please open an issue first so we can talk about whether it fits the direction of the project.
- **Bug reports are welcome.** If you find something broken, especially a regression or an edge case I missed, open a GitHub issue with reproduction steps.
- **Security issues do not go through this file.** See [`SECURITY.md`](./SECURITY.md) and email me directly.
- **Forks for learning are encouraged.** If you want to fork this to study how it's built, please do. The code is licensed under [AGPL-3.0](./LICENSE) — you're free to read, learn, and modify it, but if you run a modified version as a network service, you must also publish your changes under the same license.

## If you do want to send a PR

1. Open an issue first describing what you'd like to change and why.
2. Wait for a response before doing significant work — I'd rather not have you waste your time on something I can't accept.
3. If we agree on the change, fork the repo, create a feature branch, and follow the conventions below.

## Code conventions

These are enforced by tooling and CI; PRs that don't follow them will fail checks.

- **TypeScript strict mode.** No `any`, no implicit returns. Use `unknown` and narrow.
- **Validation at every boundary.** Zod schemas in `packages/validators` are shared between the API and the web app. Never trust input that didn't pass through one.
- **Server Components by default** in the Next.js app. Add `"use client"` only when you actually need browser-only state or events.
- **Service-layer pattern** for the API. Route handlers do auth, validation, and delegation. All business logic and database access lives in `apps/api/src/services/`.
- **Tests live next to the code.** `routes/foo.ts` has `routes/foo.test.ts`. New features need tests covering the happy path and at least one error path.
- **Run the gates before pushing:** `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm format:check`, `pnpm audit`. CI runs all of these and will block on any failure.
- **Commit messages:** conventional-style prefixes (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, `security:`). Keep the subject under 72 characters. Body explains the why, not the what.

## Project layout

The full architecture, file naming conventions, and gotchas live in [`README.md`](./README.md). If something looks weird (it sometimes does), check the gotchas section there before assuming it's a bug.

## Code of conduct

Be kind, be specific, be constructive. Don't be the reason a maintainer burns out.
