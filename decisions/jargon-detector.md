# Jargon detector: not built in H-1, and why

**Status:** accepted (deferral) · **Date:** 2026-10-12 · **Sprint:** S7 (closing the hito H-1)

## Context

Hard rule 11 asks that the leader-facing texts pass a code-checked budget (≤ 50 words or ≤ 95 syllables, ≤ 1 defined term) **and a
jargon detector in both languages**. The budget exists since S6 (`src/engine/legibilidad.ts`, the `informe-legible` row of the
publication gate). The detector does not: the only thing that catches jargon today is the curated list `terminos_a_explicar`
(`data/convenciones/informe.yaml`), so a technical word nobody put on the list passes. RF-09.7 («detector de jerga») is rated
_deseable_, not required.

The S7 plan (D-S7-06) timeboxed the attempt to 20 minutes: find a Spanish and an English word-frequency list under a permissive
license, and build `src/engine/jerga.ts` (a text is flagged when a word is rarer than a threshold, is not in the glossary and is not
in an allow-list in the data). The repository has no `LICENSE` file, so «compatible» is read conservatively: MIT, Apache-2.0, CC0 or
CC BY with attribution; **CC BY-SA and anything non-commercial are out**.

## What was found (2026-10-12, 09:36–09:39, inside the 20-minute box)

| Source                                                                                 | Languages | License as found                                                                                                                                                                                                                    | Verdict                                                                                                            |
| -------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Leipzig Corpora Collection (news 2020, 100 K sentences; both downloaded and inspected) | es, en    | The mirrors and third-party cards say CC BY; the Wortschatz terms also speak of CC BY-NC for permission «free of charge solely for non-commercial … purposes». The official usage page sits behind a bot wall and could not be read | **Ambiguous → out.** A list whose commercial-use status cannot be read cannot be copied into a public repository   |
| Wikipedia and Wiktionary frequency lists, `wordfreq`, `FrequencyWords` (OpenSubtitles) | es, en    | CC BY-SA or share-alike content                                                                                                                                                                                                     | Out (D-S7-06)                                                                                                      |
| Norvig's most frequent English words | en only | not checked: English only, so it cannot satisfy «both languages» whatever its license | Half a solution: a detector for one language would give Spanish a weaker gate |

Nothing was copied into the repository; the downloaded files stayed outside it and were deleted from the working area.

## Decision

1. **The detector is not built in H-1.** It is declared here and in the closing note of S7 as a _deferred deseable_, not a hidden
   gap. `terminos_a_explicar` plus the measured budget stay as the gate, as they were.
2. **What would unblock it** (any one is enough): (a) the Wortschatz terms confirmed as plain CC BY 4.0 by their official page or by
   email, with the attribution text they ask for; (b) a Spanish list that is MIT, Apache-2.0, CC0 or CC BY; (c) a decision by the
   owner to give the repository a license and accept share-alike data; (d) deriving the frequency table from texts the project
   owns (the evidence quotes are vendor documentation: not ours to relicense).
3. **Shape, when it is built** (so the next sprint does not start from zero): `src/engine/jerga.ts`, pure and integer (rank
   buckets, no floats), `detectarJerga(texto, idioma, tabla, permitidas)` returning the rare words not in the glossary or the
   allow-list; the table and the allow-list live in `data/convenciones/` (rule 6: knowledge is data), with the corpus citation the
   license asks for; a row `jerga` in the publication gate beside `informe-legible`, with its red demo in
   `tests/unit/gates-en-rojo.test.ts`; and a unit test per language with a sentence of plain Spanish or English and one full of
   jargon. The leader summary is the first surface (it is already measured); the rest of the leader texts follow.

## Consequences

- Rule 11 is met in its measurable half (budget, defined terms, glossary) and **not** in its detector half. The S7 closing note says
  so in the constitution-versus-code table (`sprints/SPRINT_007-auditoria.md`, rule 11) and proposes the wording for `CLAUDE.md`.
- No dependency, no data file and no license question is added to the repository.
- The next hito can pay it with a one-line license confirmation; nothing here makes that harder.
