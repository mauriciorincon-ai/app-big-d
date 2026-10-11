# Design-system extensions from S3 (knowledge base, case profile, comparison)

**Status:** accepted · **Date:** 2026-10-04 · **Sprint:** S3 (the comparator), phase 2

## Context

`design-system.md` v0.6.0 is read-only for product work: S3 extends it by ADR (D-S3-17). Phase 2 put three mockup
screens in the product (phase 3 adds the evidence review, rows 14–16): `/[lang]/base` (`docs/diseno/base.html`), `/[lang]/casos/[case]` (`perfil.html`) and
`/[lang]/casos/[case]/comparacion` (`comparacion.html`). The mockup draws them as static states switched by the design
room bar; the product has to run them on real data, under the static export's CSP (no `style=` attribute, S2) and with
controls that work (rule 22). These are the places where the product departs from, or adds to, the mockup.

## Decision

| #   | Extension | Why | Look |
| --- | --------- | --- | ---- |
| 1   | The weight that moves in the sensitivity is a native `input type="range"` laid over the drawn bar (track, declared range, reversal and tie marks). The thumb is the mockup's dot | The mockup's `.peso-barra` is a `div` with `role="slider"` and no control behind it; a native range brings keyboard, screen reader value text and touch for free | Captures at the end of phase 2 |
| 2   | A criterion selector above the sensitivity («Criterio que se mueve»); the default is the heaviest criterion (ties by id), the mockup's case | The mockup fixes one criterion (governance); the product explores any of them | Captures at the end of phase 2 |
| 3   | Every bar (profile weights, totals, sensitivity, acceptability) is an SVG whose positions are percentage ATTRIBUTES (`x="25%"`), not inline styles | The export's CSP refuses `style=`; an SVG without `viewBox` keeps the dot round at any width | Same look as the mockup |
| 4   | An implicit decision shows its chosen option with a filled ring and the others with an empty circle, in a list, instead of disabled radio buttons | A disabled, checked radio is barely visible (low contrast, greyed by the browser) and is a control that does nothing; the profile is read-only | Captures at the end of phase 2 |
| 5   | The place number is written in the markup for every row of the totals («1 · », «2 · »), and a shared place repeats its number | The mockup prints «1 · » with CSS only for the leader; an exact tie shares the place (E-11) | Same look |
| 6   | The simulation progress is a native `<progress>`; the running state names the seed («semilla N (i de n)») | Native semantics; four seeds run, not one | TEXT look, «maquetado, no visto» |
| 7   | The robustness block says which weights its result belongs to («Robustez con los pesos del perfil» / «… con Gobierno y seguridad en 22»), and a cancelled run keeps the previous result with a note | Exploring a weight re-runs the simulation in the Worker; the reader must know which run they see | TEXT look, «maquetado, no visto» |
| 8   | Wide-table frames (`.tabla-marco`) are named, focusable regions | A frame that scrolls sideways must be reachable by keyboard (axe `scrollable-region-focusable`, caught by the phase-2 e2e) | No visual change |
| 9   | `/base` adds, under the evidence, the criteria, the scale with its maturity caps, the method conventions with their declaration, and the snapshots table (the mockup's «instantánea» state) | D-S3-05: the conventions live in data, enter the fingerprint and are visible on screen | Captures at the end of phase 2 |
| 10  | The profile adds the case context and the requirements (§ 10.4) as two collapsed readings (`.lectura-seccion`) | They are part of the case file; collapsed, the mockup's order stays | Captures at the end of phase 2 |
| 11  | Under the matrix, the evidence that aged by the evaluation date (to review, expired, or not generally available) | `alertas` of the engine result (RF-01.5) had no reader | TEXT look, «maquetado, no visto» |
| 12  | The bar's «Instrumento» section and the case tabs 09–10 are shown pending (no link) until their screens exist | The same rule as the atlas levels: never a control that does nothing | Same look as the atlas tabs |
| 13  | Thousands use a narrow no-break space in Spanish («10 000») and a comma in English («10,000»); no `Intl` | Rule 1 of the app: the same page in every browser | Same look |
| 14  | The evidence review (researcher, evidence mode) draws each piece of evidence on a 0-to-4 ruler: the proposed level with a thick border, a glyph and «propuesto»; the levels its maturity does not let count, hatched; the level that counts when the cap lowers it, dashed with «cuenta». Under it, the proposed level's text and «¿Por qué N y no …?». On a phone the ruler stands vertical, one level per line | The researcher mockup only reviews maps; this is the M1 sketch (`docs/propuestas-de-diseno/revision-evidencias.html`) | FORM look M1, approved 2026-10-05 («Si me sirve») |
| 15  | Nothing comes approved by default in the evidence review, and the decision buttons keep full contrast while undecided: the S1 rule that dimmed them to 60 % is removed, also for maps | The code checks the quote, not the score (M1); axe flagged the dimmed buttons in the light theme once a review with nothing decided reached the e2e | M1 look; axe |
| 16  | A piece of evidence names its components by the approved map's ids, and the review shows the map's name in the page's language | Rule 20: the data is bilingual; a free-text name came out in Spanish on the English page | Same look |

## Consequences

The product shows these extensions; `design-system.md` does not yet. The planning house folds them into the next
design-system version; until then this ADR, `design-system-s1-extensions.md` and `design-system-s2-extensions.md` are
the extensions. `design-sync/` is updated in this sprint's PR (rule 16).
