# A second investigator executor: the macOS system model

**Status:** accepted (2026-11-12) · **Sprint:** S9 (Preguntar, investigar y crecer) · decision «2a» of the S9 G-Plan
(2026-11-11) · rule of 2026-10-18: _system model → local model → the route does not exist_.

Builds on [investigator-code-first.md](investigator-code-first.md) § 5: «provider independence lives in the
contract: any executor that leaves a valid proposal in `propuestas/` is accepted». This ADR names the second executor
and what it may and may not do. It does not change the first one ([investigator-7s-compliance.md](investigator-7s-compliance.md)).

## Decision

`scripts/investigar/sistema.mjs` is a second executor of the same contract. It uses **only** the macOS system model
(`FoundationModels`, `SystemLanguageModel.default`), on the user's computer:

- **Nothing paid, no key, nothing installed or downloaded.** A ~100-line Swift bridge
  (`scripts/investigar/sistema/puente.swift`) is compiled at run time with the Command Line Tools' `swiftc` into a
  temporary folder (keyed by the source's hash). It does not use the `@Generable` macros (they need Xcode's plugin);
  the output schema is built at run time (`DynamicGenerationSchema`), and the component id is an `anyOf` of the
  layer's ids, so the model cannot invent one.
- **Nothing leaves the computer** except reads of public vendor documentation, done by the script with the same
  `curl` the citation verifier uses (`scripts/investigar/bajar.mjs`, shared). The bridge reads stdin and writes
  stdout; a test forbids network APIs in it. Every read is logged in `propuestas/registro-de-ejecucion.jsonl`.
- **If the model is not available, it says so and writes nothing** (exit 3, with the system's reason: device not
  eligible, Apple Intelligence off, model not ready, or Spanish/English missing). Turning Apple Intelligence on is a
  system protection: matrix and the user's «yes», never the builder alone (rule 24).
- **Scope: one layer, on top of a full-map proposal by `/investigar`.** The grammar requires 5–8 blocks (V7), so a
  layer cannot stand alone, and a ~3B model with an 8 192-token window cannot see a whole platform. The executor
  re-supports the components of one band: it reads their sources in chunks (3 500 characters, at most 12 per page)
  and asks, per chunk, for a statement in each language and a literal quote. It does **not** draw new components
  or flows: the map is the base's, unchanged.
- **Code decides, before and after.** Before writing, the code discards any quote that is not in the downloaded page,
  any component outside the list, any quote that is not a sentence (code, a heading, a list: fewer than two function words), any statement copied from the component names, and any statement not in its own language (function-word count); the count by reason is printed. These checks came from the first real run (2026-11-12, Snowflake storage layer, on a temporary copy): two literal «quotes» that were a SQL line and a repeated heading, a Spanish statement written in English and an English one copied from the prompt. What code cannot check (that a literal sentence really supports the statement) stays with the person who reviews. After writing, the
  proposal goes through the same Zod schema, the same diagramador validation (`validar.mjs`) and the same citation
  verification (`verificar-citas.mjs`) as the skill's, and the verification must hash this very proposal.
- **Traceability.** `ejecucion.herramienta: "modelo-del-sistema"`, `ejecucion.base` (the base folder) and
  `ejecucion.propias` (the ids it wrote). The rest of the statements come from the base with their quotes and are
  verified again. The review screen says it in one line. `base`/`propias` exist only with this executor (schema).
- **Never approves.** Approval stays with a person, with the command the review screen builds.
- **CI** runs it with a fake model (`tests/unit/investigador/lib/modelo-falso.mjs`, via `BIGD_MODELO_FALSO`), which the
  script refuses on the real repository. The real bridge runs only on demand, on a Mac (rule 25: the default test
  command touches no hardware or permissions).

## Alternatives

- **A paid API or a key:** rejected by the rule of 2026-10-18 and by the constitution (no wired provider, no keys).
- **A downloaded local model (Ollama, MLX):** second in the rule's order; not needed while the system model exists, and
  it would install software.
- **The system model drafting a whole map:** rejected; the window is too short and the grammar needs every band.

## Consequences

- Two executors, one contract: the closing note of S9 compares both on one BigQuery layer (statements, verified
  quotes, code rejections).
- The constitution's hard rule 2 names `/investigar` as the only AI feature; this executor is a second way to run that
  same feature. The wording is proposed as an amendment in the S9 closing note (the planner owns the constitution).
- If the system model changes (a macOS release), the bridge recompiles on the next run; the contract does not move.
