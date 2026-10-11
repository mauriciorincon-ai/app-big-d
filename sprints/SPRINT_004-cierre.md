---
sprint: 004
app: big-d
hito: H-1 Vitrina funcional
opened: 2026-10-11
closed: 2026-10-11
branch: sprint-004/instrumento
pr: ver el PR de la rama
---

# Sprint 004 — El instrumento · cierre

- **Resultado:** instrumento y gate listos; validación en verde (7/7 sembrados, 9/9 referencias, 7/7 propiedades, 6/6 aprobaciones). El perfil sigue en borrador hasta que tú corras el comando desde su pantalla.
- **Estado:** completo, salvo la aprobación del perfil (DECISIÓN) y el lote del hito.
- **Tiempo estimado / real:** 6 h / 1,5 h (`node scripts/horas-sprint.mjs`, medido antes de este commit; cuenta commits, no el plan previo al primer commit).

| Fase                   | Modelo            | Estimado |  Real | Commits              |
| ---------------------- | ----------------- | -------: | ----: | -------------------- |
| F1 Adopción y perfil   | Sonnet 5.5 medium |      2 h | 0,5 h | `b500f97`            |
| F2 Instrumento y gates | Sonnet 5.5 medium |    2,5 h | 0,2 h | `6d9a5fa`            |
| F3 Evidencia y cierre  | Haiku 5.5         |    1,5 h | 0,8 h | `456cb95`, `b397883` |

F3 con Haiku bastó: una corrección en la guía (parada «de 6» → «de 8») y un formato de Prettier; no hubo dos fallos en el mismo problema.

## Auditoría (una pasada, subagente Sonnet 5.5 independiente)

Cuatro casillas: cobertura D-S4-01…13 · frases caducadas · campos sin lector · número cableado. Veredicto: requiere ajustes; 0 críticos, 2 altos.

- **A1 pagado** `b397883`: manual §10 describía un botón activo y una recarga que no sirve.
- **A2 pagado** `b397883`: `docs/brochure-export.json` (`promesa.diferencial`) afirmaba funciones de E3.
- Pagados además: M3 `tests/e2e/lib/rutas.ts:40-46`, M5 historial del manual, M6 frases condicionales.

**Lote del hito:**

- M1 `data/casos/hospital-futuro.yaml:97,105,113` · P4–P6 sin procedencia (ver DECISIÓN).
- M2 `scripts/demo-rojo.sh` · el rojo RF-09.4 no está en el script; `decisions/publication-gate.md` cita una corrida no repetible.
- M4 `src/lib/i18n/es.ts:225` · «Mismos bytes en todos los motores» muestra una huella que el build no recalcula.
- M7 `src/lib/instrumento/leer.ts:11` · `JSON.parse` con cast, sin validar.
- B1 `scripts/instrumento/validar.mjs:12` · no borra `.vercel/output` (desviación).
- B2 `src/engine/instrumento.ts` (`Validacion.version`), `propiedades[].corridas/semilla`, `RevisionCaso.desde/caso`: campos sin lector.
- B3 `scripts/aprobar.mjs` (`escribirCaso`) · YAML y revisión en dos escrituras; un fallo entre ellas deja un aprobado sin revisión.
- B4 `tests/e2e/sembrada/perfil-aprobado.spec.ts:24` · 11 criterios fijos.
- B5 `tests/e2e/caso.spec.ts` · reformateado entero con Prettier.
- B6 `docs/MANUAL-DE-USO.md:239` · «siete errores» como texto fijo.
- B7 `src/app/[idioma]/casos/[caso]/page.tsx:209` · «faltan N decisiones» arriba mientras el editor queda abajo.
- B8 `tests/e2e/instrumento.spec.ts` · axe solo critical/serious, como el resto del repo.

## Demos en rojo (mutación temporal, restaurada)

- (a) `src/lib/investigador/aprobados.ts:115`: el gate nombra «editado a mano».
- (b) `src/lib/investigador/aprobar-caso.ts:35` (`--desde`): rechaza con «que cambió desde el comando».
- (c) `src/lib/datos/conocimiento.ts:210` (suma): el build dice «detectados 6 de 7 · no se publica», sin `out/`; al restaurar vuelve a «7 de 7».

## Desviaciones y decisiones

- D-S4-08: rojo con mutación real, no con `demo-rojo.sh` (ver M2).
- B1: `.vercel/output` no se borra (`validar.mjs:12`).
- CV Viva: el export pasa de 8 a 12 funcionalidades.
- **DECISIÓN del perfil:** P4–P6 (`una`, `gestionado`, `coexistir`) son las propuestas; el asistente no corrió `aprobar.mjs`. Falta que confirmes que las respondiste tú (M1); si no, vuelven a `null`.
- Huellas `NUCLEO.SHA256SUMS` y lock del contrato (57/57) sin cambios.

Para mergear: squash y borrar la rama; después corre `/cierre-sprint big-d`.
