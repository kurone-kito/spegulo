# Guidelines for AI Agents

This project is a generic Node.js project template using pnpm.
It is currently optimized for GitHub Copilot tooling, but `AGENTS.md`
exists so Codex can still receive the minimum project rules
immediately, without depending on a redirect.

## Setup commands

- Install dependencies: `corepack enable && pnpm install`
- Lint: `pnpm run lint`
- Lint and auto-fix: `pnpm run lint:fix`
- Test: `pnpm run test`
- Clean: `pnpm run clean`

## Immediate rules

- Match the conversational language to the user's language.
- Write comments and documentation in English unless there is a clear
  project-specific reason otherwise.
- **Always** run `pnpm run lint:fix` after any change, no matter how
  small. Then verify with `pnpm run lint` before committing.
- If uncertainty, hidden risk, or missing context blocks a safe change,
  stop and ask a concise question before proceeding.
- Keep changes small and reviewable. If you create commits, follow the
  project's Conventional Commits rules and keep each commit atomic.
- Do not modify community documents (`CODE_OF_CONDUCT*`,
  `CONTRIBUTING*`) without explicit approval.

## Boundaries

- **Always do**: run lint:fix, follow Conventional Commits, use LF
  line endings, keep commits atomic, write docs in English
- **Ask first**: adding/removing dependencies, changing architecture,
  modifying CI workflows, altering `@kurone-kito/*-config` packages
- **Never do**: commit secrets or credentials, modify community
  documents without approval, disable linter rules without
  justification, skip review of AI-generated code

## Project standards

- **Indentation**: 2 spaces
- **Line endings**: LF only
- **Trailing whitespace**: trimmed except in Markdown
- **Final newline**: always present
- **File naming**: lowercase with hyphens unless a platform convention
  requires otherwise

## Commit rules

This project follows
[Conventional Commits](https://www.conventionalcommits.org/).
A `.gitmessage` template is available at the repository root.
Write user-facing, lowercase subjects, keep them under 72 characters,
and split unrelated changes into separate atomic commits.

## Onboarding detection

When starting a session, check whether this repository is the base
template or a derived project:

- If the repository name is exactly `pnpm-project-template`, it is
  the base template — no action needed.
- If the name differs **and** this file still contains the phrase
  `generic Node.js project template using pnpm`, the guidelines
  have not been customized yet.

In that case, **proactively propose an onboarding workflow** to
customize the project's documentation, tooling, and AI guidelines.
See the full onboarding checklist in
[.github/copilot-instructions.md](.github/copilot-instructions.md).

## IDD Workflow

This project uses Issue-Driven Development (IDD) with parallel AI
agents. Start with [docs/idd-workflow.md](docs/idd-workflow.md) for the
cross-agent entry path and phase routing.

Before starting IDD work, open
`.github/instructions/idd-overview-core.instructions.md`. Codex CLI
and OpenCode agents should open the routed phase file manually when the
current step changes.

The policy values this repository selected are recorded in
[.github/copilot-instructions.md](.github/copilot-instructions.md)
under "IDD Policy Configuration", mirrored machine-readably in
`.github/idd/config.json`.

The optional issue-authoring companion is installed at
`.agents/skills/issue-authoring/`; use it to draft issue sets before the
execution loop starts.

## Canonical reference

The full, Copilot-first project guidance lives in
[.github/copilot-instructions.md](.github/copilot-instructions.md).
When that file uses Copilot-specific workflow names, apply the intent
in Codex using Codex's own interaction model rather than following the
product terms literally.
