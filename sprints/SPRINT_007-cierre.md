---
sprint: 007
app: big-d
hito: H-1 «El H-1 se cierra»
opened: 2026-10-12
closed: 2026-10-12
branch: sprint-007/cierre-h1
pr: 20
---

# Sprint 007 · cierre

- **Resultado:** lote S3–S6 = 61 ids: 54 pagados, 6 cerrados con razón y sitio, 1 declarado (S5-B-13). Construido; **gate humano pendiente** (STOP).
- **Tiempo:** estimado 5 h (2,5 + 1,5 + 1). Real, piso de `horas-sprint`: 2,9 h (abajo).
- **Modelo por fase:** F1 Sonnet 5.5 · F2 Sonnet 5.5 · F3 Haiku 5.5 (medium; cierre low). Sin desvío. Haiku bastó para guía, manual y brochure; no bastó para el Worker caído (M1): dos intentos fallidos → relevo a Sonnet 5.5.
- **Entregables:** lote (`SPRINT_007-lote.md`), e2e y capturas en inglés, BLUEPRINT, design system v0.7.0 y design-sync, constitución contra el código, guía `bigd-s7-` (8 paradas ⭐⭐, dos aprobaciones), manual ES/EN, brochure, copia aprobada, webServer e2e secuencial, LCP.
- **No completado:** detector de jerga (aplazado: sin licencia verificable, `decisions/jargon-detector.md`); deuda de abajo.
- **Desviaciones:** la tabla FORMA/TEXTO de `docs/diseno/README.md` tiene dos filas (editor del perfil e instrumento); decisiones e informe no tienen fila. j5 pasa a ⭐; h6 y h7 se funden con b1 y b11.
- **Verificación:** `pnpm test` 2186/2186 (96,48 % sentencias, 97,82 % líneas); sobre la copia aprobada, 2185/2185 antes de la última prueba. e2e 1156 pasan, 9 se saltan (condición del dato). Determinismo 9/9. Lighthouse sobre la copia aprobada: presupuestos y categorías en verde; LCP mediana informe, decisiones y base 2609 ms (**margen 10,0 %, en el límite**), comparación 2256 ms, instrumento 2455 ms.
- **Huellas:** `NUCLEO.SHA256SUMS` +2 líneas (F1, declarado). Lock del diagramador sin cambios.
- **Gate en rojo (S6-B5):** `informe-legible` con `palabras_max: 3` → «× aprobaciones · informe-legible · … 36 palabras, 79 sílabas» y «no se publica: sin validación en verde no hay out/ (RF-09.4)».
- **Enmiendas al contrato de `instrumentos-de-plan`:** (a) con un ciclo, `ondas: []` también para decisiones que no tocan el ciclo; (b) orden de riesgos: app prioridad → severidad → RPN; paquete prioridad → RPN → id (deliberado).
- **Auditoría** (independiente, Sonnet 5.5, solo lectura): alcance completo salvo lo declarado · 0 críticos, 0 altos · medios: M2 pagado (`124225e`), M1, M3, M5 declarados · frases caducadas: dos pasadas, tres corregidas (`d0addb6`) · campos sin lector: B2 declarado. Parte B en `SPRINT_007-auditoria.md`.
- **Deuda con sitio:** M1 `Exploracion.tsx:149-156` · M3 `construir.ts:48-50`, `Informe.tsx:103` · M5 CI sin estado aprobado (fecha propuesta 2026-10-19) · B2 `simulacion.ts:82,89,335` · B3 `investigar/comun.mjs:85` · B4 `gates-en-rojo.test.ts:42-51` · B5 `e2e-servidor.test.ts:15-28` · B6 `e2e/servir.mjs:46-54` · B10 `sin-plataformas-cableadas.test.ts:35-37`.
- **Lote (commit · ids):** fa4f6c8 · AU-S3-03/04/11, S4-B3, INFRA-gitleaks · a9026cd · AU-S3-05/08, S5-M-3, S5-B-9, S6-M3/M7, S6-B4 · 063066e · AU-S3-06/07, S4-M7, S4-B2, S5-B-1/2/3/6/11 · 8575fba · S4-M2, S5-B-10, S6-B5 · 2265571 · S6-M1/M2/M4/M5/M6, S6-B1/B2/B3/B6/B8 · 0a8fe7e · S4-B4, INFRA-webserver · 5a5ac24 · S4-B6/B7/B8 · 7fb502a · S5-B-4/5/7/8 · 952d442 · S5-M-5/M-8 · cf3abb2 · S5-obs-tabla/ciclo · a52cffa · S5-M-7, S5-obs-chips · e37ff30 · S4-M4 · b8e1aa0 · S5-M-4 · 712e731 · S6-B7 · 69c97e8 · INFRA-lcp · brochure · S5-M-6 · 124225e · M2 de auditoría · d0addb6 · B1, B7–B9 · cerrados: AU-S3-09/10, S4-B1/B5, S5-B-12/14 · declarado: S5-B-13.
- **Aprendizaje y recomendación:** las pruebas que leen el dato del repo no ven el estado aprobado; el ensayo en copia es el camino y hoy es manual (M5). Pagar M1 con Sonnet 5.5 antes de tocar el Worker otra vez.
- **Propuesta de `CLAUDE.md`** (no editado; lo aplica la planeadora): design system v0.7.0; estructura de `src/app`, `src/engine`, `src/lib`, `scripts/` y `packages/`; quitar «pendientes de E3»; regla 11, quitar el detector de jerga hasta que exista.
- **Para mergear:** squash y borrar la rama; después `/cierre-sprint big-d`.

### Horas del sprint (`scripts/horas-sprint.mjs`, rango `origin/main..HEAD`, heurística git-hours: huecos ≤ 2 h + 0,5 h por sesión)

| Commits | Sesiones | Horas activas | Span (primer → último commit)               |
| ------: | -------: | ------------: | ------------------------------------------- |
|      29 |        1 |         2,9 h | 2026-10-12 08:03 → 2026-10-12 10:28 (2,4 h) |

| Fase | Commits | Horas activas |
| ---- | ------: | ------------: |
| F1   |      18 |         1,7 h |
| F2   |       7 |         0,4 h |
| F3   |       4 |         0,8 h |
