# Investigator skill: compliance with the subscription-AI standard (7-S)

**Status:** accepted · **Date:** 2026-09-27 · **Sprint:** S1 (Atlas de Fabric) · **Re-read before every
release** (the `/deploy-check` release box points here).

## Context

The only generative AI in Big-D is the `/investigar` skill. It runs on the user's Claude subscription
through Claude Code. Standard 7-S (estándares v2.15.0) and the constitution's rule 21 govern that use.
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

## Decision — how each 7-S rule is met

| 7-S rule | How Big-D meets it | Gate |
|---|---|---|
| 1. Official, unmodified binary; the user's own session | The user types `/investigar` in their own Claude Code session; the skill is a project skill with `disable-model-invocation: true` (only the user can trigger it) | Skill frontmatter, reviewed in the S1 PR |
| 2. The token never leaves the binary | No code in the repo reads, stores or forwards credentials; no env var, trace or log carries them | gitleaks (pre-commit + agent hook) |
| 3. Clean temp dir with empty MCP when invoking the binary non-interactively | **Not applicable**: nothing invokes the binary; the skill runs inside the interactive session. Its subagent gets only the tools it needs | This ADR |
| 4. Batches outside CI, small and spaced | **No batches.** One investigation per user command. CI never invokes Claude Code | CI workflow review; `planea-no-opera` test (no model SDK or domain in `src/`) |
| 5. Compliance ADR, re-read before each release | This document, with the sources and date above | `/deploy-check` release box |
| 6. Switch to a key-based provider | Roadmap D5, not wanted today; the proposal contract is provider-neutral, so an adapter would not change the pipeline | This ADR |
| 7. Never exposed to third parties | The app is private (Vercel protection); the public demo has no investigator; third parties would need their own API key | Zero-links rule; demo scope |

Use stays "ordinary, individual": the user investigates a platform when its traffic light asks for it.

## Consequences

The investigator is legitimate under the Consumer Terms as ordinary individual use of an Anthropic
product. Anything beyond that (scheduled runs, CI, offering the feature to others) needs a new ADR and,
per the terms, an API key under the Commercial Terms.
