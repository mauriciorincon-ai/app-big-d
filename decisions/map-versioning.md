# Map versioning: archive the approved bytes

**Status:** accepted · **Date:** 2026-10-04 · **Sprint:** S2 (Databricks and Snowflake, side by side)

## Context

Before S2 nothing kept an old map.

- **Approving overwrote the map.** The human-only approval script in `scripts/` replaced
  `data/mapas/<id>.mapa.yaml`, so the differences page planned for S2 (`/[lang]/atlas/[platform]/versiones`,
  D-S2-08) had nothing to read.
- **Approved bytes are untouchable.** An approved map is never edited by hand. Its SHA-256 over canonical JSON must
  match the last line of `data/revisiones/<id>.jsonl` (M-16).
- **The contract moved under an approved map.** It went from 0.3.0 to 0.4.0, and V1 requires the same minor
  version, so Fabric v0.1.0 (approved in S1 under 0.3.0) would have broken the build.

## Decision

1. **Archive on approval.**
   - Before writing a map with a new version, the approval script copies the current map **byte for byte** to
     `data/mapas/versiones/<id>-<version>.mapa.yaml`.
   - If that file already exists with other bytes, nothing is written and the approval stops.
   - Re-approving the same version ("no news") archives nothing.
2. **The loader checks every archived version.**
   - The file name follows the pattern.
   - The platform has a published map.
   - The content validates in publication mode (V1–V16, coverage, four ages).
   - `sujeto_id` matches the name, and the version matches the name.
   - The version is older than the current one.
   - Versions load oldest first.
3. **Every archived version is one a person approved.**
   - `mapasSinAprobacion` checks that each archived file's fingerprint and version match a line of the revision
     history.
   - It also checks that every approved non-current version is archived.
4. **Old contracts migrate in memory.**
   - `migrar()` raises `contrato_version` only when the document validates the same (D-S2-01). The CHANGELOG
     declares 0.4.0 a MINOR change.
   - The YAML on disk keeps its approved bytes, so its fingerprint still matches.
5. **The page draws what the contract can mark.**
   - Each pair is shown with `compare([previous, next], { marks: diff })` and `diffToText`.
   - What changes without changing the drawing (component texts, sources) is counted in the app with canonical
     JSON, so "no changes in the drawing" does not read as "nothing changed".
   - Each block opens the window of its own version. Only the current version links to the components level.

## Gates

- `tests/unit/datos.test.ts`: every broken archive shape names its file.
- `tests/unit/mapas-aprobados.test.ts`: an archived version nobody approved, or an approved one missing from the
  archive, breaks.
- `tests/unit/investigador/scripts.test.ts`: the approval archives the previous version byte for byte, and the
  loader reads it.
- `tests/unit/versiones.test.ts`: pairs newest first, marks and list, texts and sources, windows per version, key
  order is not a change.
- `atlas-vigencias`: the page draws at every state-change date of every version.
- `tests/e2e/versiones.spec.ts`.

## Consequences

**First real use.** Fabric v0.2.0 was approved on 2026-10-04 and archived v0.1.0 automatically. That run exposed a
loader defect: when a current map failed to load, its archive also reported a false "no published map". It was
fixed the same day.

**What the archive keeps.** One file per approved version stays in the repository. Archived versions keep whatever
they said, including vocabulary the current gate rejects ("lago de datos" in Fabric v0.1.0). The vocabulary gate
reads current maps only, and the differences page does not show those texts.

**Amendments for the contract.** `diff` could report text and source changes as classes of its own, and
`diffToText` is an extension of the pilot.
