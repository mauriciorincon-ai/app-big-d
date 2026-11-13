# Jargon detector: deferred in H-1, built in S9

**Status:** accepted (built in S9 by route d; the S7 deferral is kept below as history) · **Date:** 2026-10-12, updated 2026-11-11 · **Sprint:** S7 (deferral), S9 (built)

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

## Update, 2026-11-11 (S9): built, by route (d)

The S7 plan said the next sprint could pay it with a one-line license confirmation. S9 (G-Plan decision 1a) re-ran the 20-minute
search on 2026-11-11 for a Spanish and an English frequency list under MIT, Apache-2.0, CC0 or CC BY. It found none without
ambiguity: the Leipzig lists are cited as CC BY 4.0 by secondary sources but the Wortschatz terms still speak of non-commercial
use and its official page was not verified; OpenSLR SLR21 and FrequencyWords are CC BY-SA; `wordfreq` mixes sources, some CC BY-SA;
Norvig's list is English only. Nothing was downloaded or copied. So the detector uses **route (d)**: the frequency table is
derived from texts the project owns.

- **Shape, as planned in § 3:** `src/engine/jerga.ts` (pure, integer: `detectarJerga(texto, tabla, permitidas, explicadas)`; the
  table is already the one of the language, so the signature has no `idioma`; `cuboDeCuenta` is the bucket rule: ≥ 50 uses → 1,
  ≥ 10 → 2, ≥ 3 → 3, else 4). A word of at least `largo_minimo` letters is flagged when it is not in the table, is not an allowed
  word and is not a form of a glossary term (platform names of the base are proper names and are allowed too).
- **Data:** `data/convenciones/jerga.yaml` (`cubos` per language, `umbral_cubo: 4`, `permitidas` written by a person, `fuente` with
  the derivation and license statement). `cubos` is **derived**, never edited by hand: `node scripts/jerga/derivar.mjs` reads the
  interface texts, the manual, and the `{es, en}` texts of criteria, capabilities, cases and conventions; it leaves out platforms
  and evidence (vendor documentation is not ours to relicense) and the single-word terms the grammar and the glossary ask to
  explain (jargon on purpose). `tests/unit/nucleo/jerga.test.ts` runs it with `--comprobar`: the file must be the derivation.
- **Gate:** the row `jerga` beside `informe-legible` in `src/lib/instrumento/validar.ts` (`resumenesConJerga`), on the same
  surface (the § 1 paragraph of every case with a plan, in both languages). Its red demo is in
  `tests/unit/gates-en-rojo.test.ts` (a word removed from the table turns the row red and names it); one unit test per language
  (plain sentence, jargon-full sentence).
- **Limits, said plainly:** a table from the project's own texts is small (about 1 700 words per language) and can only call
  «rare» what the project never wrote; it catches a technical word that sneaks in from data, not a rare word that is wrong for
  other reasons. When the table later grows from a licensed list, only `cubos` and `fuente` change.
