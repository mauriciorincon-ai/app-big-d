# Investigator skill: compliance with the subscription-AI standard (7-S)

**Status:** accepted · **Date:** 2026-09-27 · **Sprint:** S1 (Atlas de Fabric) · **Re-read before every
release**: the box «IA de construcción por suscripción (7-S)» in `.claude/commands/deploy-check.md` (§ 10)
points here and does not let a release out without a dated re-reading.

## Context

The only generative AI in Big-D is the `/investigar` skill. It runs on the user's Claude subscription
through Claude Code. Standard 7-S (estándares v2.15.0) and the constitution's rule on subscription build-AI govern that use.
The constitution applies 7-S in its simplest form: an **interactive** skill in the user's own session —
no batches, no automated `claude -p`, nothing in CI.

## Sources read (2026-09-27)

- Claude Code docs, *Legal and compliance* (`code.claude.com/docs/en/legal-and-compliance`): Free, Pro
  and Max use is under the Consumer Terms; "Advertised usage limits for Pro and Max plans assume ordinary,
  individual usage of Claude Code and the Agent SDK"; OAuth "is designed to support ordinary use of Claude
  Code"; developers "may not collect, store, or intermediate Claude.ai credentials or session tokens", nor
  "route requests through Free, Pro, or Max plan credentials on behalf of their users"; it does not prevent
  "an end user from signing in to the unmodified Claude Code binary with their own Claude subscription".
- Anthropic *Consumer Terms of Service* (effective October 8, 2025): forbids accessing the Services
  "through automated or non-human means, whether through a bot, script, or otherwise", except via an API
  key "or where we otherwise explicitly permit it"; "You may not share your Account login information …
  You also may not make your Account available to anyone else."

## Re-read before the S1 release (2026-09-30)

Both sources re-read on 2026-09-30, before the S1 merge to `main` (the first production deploy, private behind
Vercel protection):
- *Legal and compliance*: the same quotes as above (Consumer Terms for Free, Pro and Max; "ordinary, individual
  usage"; OAuth "designed to support ordinary use of Claude Code"; developers "may not collect, store, or
  intermediate Claude.ai credentials or session tokens" nor "route requests through Free, Pro, or Max plan
  credentials on behalf of their users"; nothing prevents "an end user from signing in to the unmodified Claude
  Code binary with their own Claude subscription"). The page now also details when customers may offer Claude
  Code in their own products (Commercial Terms, unmodified binary, no intermediated usage); Big-D offers nothing
  to third parties, so it does not apply.
- *Consumer Terms of Service*: still effective October 8, 2025, with the same two passages (no automated or
  non-human access except via an API key or where explicitly permitted; no sharing of account credentials).

**Changes in S1 that touch this posture:** none. The research button now leaves a GitHub issue instead of
copying the command (D-S1-57): it invokes nothing, and a person still types `/investigar` in their own session.
The launch guard (`sin-lanzar`) was confirmed live on 2026-09-30: the person's `/investigar` starts normally.

## Decision — how each 7-S rule is met

| 7-S rule | How Big-D meets it | Gate |
|---|---|---|
| 1. Official, unmodified binary; the user's own session | The user types `/investigar` in their own Claude Code session; the skill is a project skill with `disable-model-invocation: true` (only the user can trigger it), and no agent can launch the `investigador` subagent directly with the Agent tool | Skill frontmatter; `scripts/investigar/hooks/sin-lanzar.mjs` and its test (audit M-17) |
| 2. The token never leaves the binary | No code in the repo reads, stores or forwards credentials; no env var, trace or log carries them | gitleaks (pre-commit + agent hook) |
| 3. Clean temp dir with empty MCP when invoking the binary non-interactively | **Not applicable**: nothing invokes the binary; the skill runs inside the interactive session. Its subagent gets only the tools it needs | This ADR |
| 4. Batches outside CI, small and spaced | **No batches.** One investigation per user command. CI never invokes Claude Code | CI workflow review; `planea-no-opera` test (no model SDK or domain in `src/`) |
| 5. Compliance ADR, re-read before each release | This document, with the sources and date above | `/deploy-check` § 10, box «IA de construcción por suscripción (7-S)» |
| 6. Switch to a key-based provider | Roadmap D5, not wanted today; the proposal contract is provider-neutral, so an adapter would not change the pipeline | This ADR |
| 7. Never exposed to third parties | The app is private (Vercel protection); the public demo has no investigator; third parties would need their own API key | Zero-links rule; demo scope |

Use stays "ordinary, individual": the user investigates a platform when its traffic light asks for it.

## Consequences

The investigator is legitimate under the Consumer Terms as ordinary individual use of an Anthropic
product. Anything beyond that (scheduled runs, CI, offering the feature to others) needs a new ADR and,
per the terms, an API key under the Commercial Terms.
