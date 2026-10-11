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

- **Resultado:** instrumento y gate listos; validación en verde (7/7 sembrados, 9/9 referencias, 7/7 propiedades, 6/6 aprobaciones). El perfil queda en borrador; aprobarlo no bloquea el merge.
- **Estado:** completo; queda el lote del hito.
- **Tiempo:** estimado 6 h · real 1,5 h (`horas-sprint.mjs`, medido antes de este commit; cuenta commits).
- **Fases:** F1 `b500f97` Sonnet 5.5 medium, 0,5 h de 2 h · F2 `6d9a5fa` Sonnet 5.5 medium, 0,2 h de 2,5 h · F3 `456cb95`, `b397883` Haiku 5.5, 0,8 h de 1,5 h. Haiku bastó: una corrección en la guía y un formato; no hubo dos fallos en lo mismo.
- **Auditoría** (una pasada, subagente Sonnet 5.5 independiente; 4 casillas): 0 críticos, 2 altos, ambos pagados en `b397883`: A1 manual §10 (botón y recarga falsos), A2 `docs/brochure-export.json` (`promesa.diferencial` afirmaba funciones de E3). Pagados además M3 `tests/e2e/lib/rutas.ts:40-46`, M5 historial, M6 frases condicionales.
- **Lote del hito:**
  - M2 `scripts/demo-rojo.sh` · el rojo RF-09.4 no está en el script; `decisions/publication-gate.md` cita una corrida no repetible.
  - M4 `src/lib/i18n/es.ts:225` · «Mismos bytes en todos los motores» muestra una huella que el build no recalcula.
  - M7 `src/lib/instrumento/leer.ts:11` · `JSON.parse` con cast, sin validar.
  - B1 `scripts/instrumento/validar.mjs:12` · no borra `.vercel/output` (desviación).
  - B2 `src/engine/instrumento.ts` (`Validacion.version`) · `propiedades[].corridas/semilla` · `RevisionCaso.desde/caso`: campos sin lector.
  - B3 `scripts/aprobar.mjs` (`escribirCaso`) · YAML y revisión en dos escrituras.
  - B4 `tests/e2e/sembrada/perfil-aprobado.spec.ts:24` · 11 criterios fijos.
  - B5 `tests/e2e/caso.spec.ts` · reformateado entero con Prettier.
  - B6 `docs/MANUAL-DE-USO.md:239` · «siete errores» como texto fijo.
  - B7 `src/app/[idioma]/casos/[caso]/page.tsx:209` · «faltan N decisiones» arriba, editor abajo.
  - B8 `tests/e2e/instrumento.spec.ts` · axe solo critical/serious, como el resto del repo.
- **Demos en rojo** (mutación temporal, restaurada): (a) `aprobados.ts:115` → «editado a mano»; (b) `aprobar-caso.ts:35` (`--desde`) → «que cambió desde el comando»; (c) `conocimiento.ts:210` (suma) → «detectados 6 de 7 · no se publica», sin `out/`.
- **Desviaciones:** D-S4-08 rojo con mutación real, no con `demo-rojo.sh` (M2); B1 `.vercel/output` no se borra; CV Viva pasa de 8 a 12 funcionalidades; Lighthouse calienta servidor y Chrome con una corrida descartada (la primera URL, `/es`, daba TBT 815 y 554 ms en frío).
- **DECISIÓN del perfil (cerrada):** el usuario delegó el caso el 2026-10-11 y pidió calidad, no mínimos. Se rehízo con la razón de cada peso y rango en `data/casos/hospital-futuro.yaml`: IA 5→8 (es el objetivo), dependencia 2→5 (una sola plataforma), rangos de ±10 a ±40 según certeza, requisito de auditoría y notas en cada opción; P4–P6 = `una`, `gestionado`, `coexistir`. Resultado: empate técnico (Databricks 73,25 · Fabric 73,00 · Snowflake 70,75 de 100). El asistente no corrió `aprobar.mjs`; el perfil sigue en borrador.

Para mergear: squash y borrar la rama; después corre `/cierre-sprint big-d`.
