# Platform investigator with generative AI: why code alone is not enough

**Status:** accepted (2026-09-29) · proposed 2026-09-27 · **Sprint:** S1 (Atlas de Fabric)

> From the planner's draft (`investigacion/2026-09-26-tecnica-nucleo.md`, «Borrador del ADR código
> primero de M8») and the kit template. Written **before** the feature exists, as the constitution's
> «code first, generative AI after» rule requires.

## 1. The feature, in one user sentence

"When a platform's layer turns amber, I launch an investigation and receive a proposed updated map,
with sources I can check, to approve or reject claim by claim."

## 2. What was tried with CODE first

| Deterministic attempt | What it solved | Where it fell short | Evidence |
|---|---|---|---|
| Re-verifying the quotes of approved evidence (`curl` + literal search on the raw page) | Detects that a source **changed or disappeared**, at zero cost and without a model | Does not say **what** changed nor how the component should be rewritten | `scripts/verificar-citas.mjs` and its tests over saved pages (quote present / absent / JavaScript-only page) — S1 phase 3 |
| Hashing vendor "what's new" pages and alerting on change | Signals that there is news | Cannot map news to layers, components and maturity, nor tell a rename from a new product | Not built: vendor pages and formats were not verified (planner Gaps); kept out of scope |
| Rule-based extraction (selectors, regular expressions) over documentation | Extracts titles and dates | Breaks on layout changes; cannot write the two registers (leader / expert) nor justify maturity | Not built; same reason |
| Manual curation with the same schema template | Solves everything, with quality | Hours per platform; it is the bottleneck the investigator relieves. **Kept as the fallback** | The Plataforma Ejemplo map is written by hand (generated from the contract's example); the S1 log does not time it per layer, so the "hours" are an estimate, not a measurement |

## 3. Where the model enters, and where it does NOT

- **Enters:** reading the official sources the skill points to and drafting the proposal — components,
  flows, the reference journey, leader and expert explanations in **both languages**, suggested
  maturity with a justification, and one **verbatim quote per claim**.
- **Does NOT enter:** the trigger (a human types `/investigar`); the grammar and the approved map it
  reads (data); the source log (hook); schema and grammar validation (code, 2 retries); quote
  verification (`curl`, code); the diff and "no news" (code); **approval (a human, with a script no
  agent may run — a hook blocks it)**; drawing the atlas and every computation of the core.
- **Model input:** platform, layer, the grammar, the approved map and its dates. Only public vendor
  documentation; no personal data; no user identifier in any external request (a hook blocks it).
- **Model output:** files under `propuestas/<date>-<platform>[-layer]/` that must pass the Zod schema
  and the diagramador's validator; never free text into `data/`.

## 4. Deterministic fallback

Without a model (no subscription, usage limit, invalid output after 2 retries) the atlas keeps showing
the **approved map** with its traffic light and exact days; quote re-verification still runs; a curator
can write the proposal by hand with the same schema, and the validator treats it identically. A failed
run leaves `error-validacion.json` with the reason. The atlas, the core and the report never depend on
the model.

## 5. Provider, cost and privacy

- **Provider:** Claude Code with the user's own subscription, interactive, in the user's session (see
  the 7-S compliance ADR). Provider independence lives in the contract: any executor that leaves a valid
  proposal in `propuestas/` is accepted. A key-based adapter is roadmap D5 and not wanted today.
- **Cost:** US$0 marginal (no API keys). The run log (`propuestas/registro-de-ejecucion.jsonl`) records
  every source the model consulted (35 in the first real run), not subscription consumption: Claude Code
  does not expose it to hooks, and nothing here measures it.
- **Privacy:** public documentation and fictional content only; the public repo receives nothing personal.
- **HITL:** the user reviews the code-computed diff with each quote and its verification result, and
  approves claim by claim; the approval script is human-only.

## Consequences

Gains: an atlas that stays current on demand, with mechanical traceability of every source. Accepts:
operational dependency on the Claude Code CLI and the human cost of reviewing diffs. The human stop of
S1 phase 3 (the Fabric map approved claim by claim) is where the experience is judged.

## Evidence (S1, phase 3 — why this is now accepted)

- **The code does what the table above says, with tests.** `scripts/verificar-citas.mjs` (quote present,
  absent, page built with JavaScript) and the validator, the approval core and the hooks run in
  `tests/unit/investigador/` over a temporary root and a `file://` mirror, never the network.
- **The first real run** (`/investigar fabric`, 2026-09-27; `sprints/SPRINT_001-implementation-log.md`, § 3c):
  a proposal with 80 claims that passed the validator on the first try; **80/80 quotes verified by code**
  against the raw page; approved claim by claim by a person, who ran the approval command in their own
  terminal (recorded 2026-09-29 UTC in `data/revisiones/fabric.jsonl`).
- **The model did not become the backbone:** without it, the atlas, the traffic light and quote
  re-verification keep working; the proposal is a file any curator can write.
- **The S1 audit hardened the human stop** (findings A-1…A-4, M-15…M-22): the model now writes only its
  `propuesta.json`, the approval refuses to run inside a Claude Code session, retirements are named in the
  command, and «no news» can no longer bypass a rejection or the one-quote-per-claim rule.
- **Nothing leaves the map without an argument** (the person's request at the removals look, 2026-09-30,
  D-S1-56): a component, or a flow whose two ends stay, leaves only with an official quote that the code
  verifies; a flow that loses one of its ends leaves with the code's own argument. Without the proof, the model
  keeps the element and asks a guiding question.

