---
sprint: 005
app: big-d
hito: H-1 Vitrina funcional
opened: 2026-10-11
closed: 2026-10-11
branch: sprint-005/decisiones
pr: por abrir (rama sprint-005/decisiones)
---

# Sprint 005 — Las decisiones · cierre

- **Resultado:** `/es|en/casos/hospital-futuro/decisiones` con ondas, fichas con evidencia citada, riesgos AIAG-VDA, supuestos y aprobación del plan. Plan real en borrador, aprobable (0 bloqueos). **Estado:** completo salvo el lote; PR por abrir, squash lo hace el usuario.
- **Tiempo:** estimado 4 h · real (`horas-sprint.mjs`, medido antes de este commit):

```
### Horas del sprint (`scripts/horas-sprint.mjs`, rango `origin/main..HEAD`, heurística git-hours: huecos ≤ 2 h + 0,5 h por sesión)
| Commits | Sesiones | Horas activas | Span (primer → último commit) |
|---:|---:|---:|---|
| 7 | 1 | 2,3 h | 2026-10-11 18:04 → 2026-10-11 19:51 (1,8 h) |

| Fase | Commits | Horas activas |
|---|---:|---:|
| F1 | 2 | 0,6 h |
| F2 | 1 | 0,6 h |
| F3 | 4 | 1,0 h |
```

- **Fases:** F1 `d761267`, `ee6e86b` · F2 `584516f` · F3 `3b67d84`, `f9168e4`, `cee8c56` + merge de main. Estimado 1,5 + 1,5 + 1 h; real 0,6 + 0,6 + 1,0 h.
- **Modelo por fase:** F1 y F2 Sonnet 5.5 medium; F3 Haiku 5.5 medium. Haiku bastó: dos expectativas mías (tabla plegada, número de bloqueos) corregidas leyendo el DOM; el defecto de 380 px era de F2, no de Haiku, y no hubo dos fallos en lo mismo. Esfuerzo «low» del cierre: no verificable desde esta sesión.
- **Auditoría** (una pasada, subagente Sonnet 5.5 independiente, 4 casillas; detalle `sprints/SPRINT_005-auditoria.md`): 0 críticos · 1 alto pagado `cee8c56` (A-1, textos que prometían informe y reapertura) · 8 medios y 14 bajos al lote con `archivo:línea`. Pagados además M-1 (orden de la tabla AIAG-VDA) y M-2 (motivo `falta-evidencia`).
- **Lote del hito:** M-3 campos sin lector en `src/engine/plan.ts:69,95,100,102,114,123` · M-4 prueba del comando en `src/app/[idioma]/casos/[caso]/decisiones/page.tsx:82-85` · M-5 gate de `supuesto.vence` · M-6 brochure del S4 (`docs/brochure-export.json:155,182-203`) · M-7 guía (`docs/GUIA-DE-PRUEBA.html:112-116,432`) · M-8 carnadas con 2 y 4 plataformas · B-1 a B-14 con su `archivo:línea` en `sprints/SPRINT_005-auditoria.md`. Observados aquí: tabla de riesgos cortada en el teléfono (marco con scroll propio, `Plan.tsx`); ondas vacías con un ciclo (causa por confirmar en el paquete).
- **Verificación:** e2e completo 960 pasan, 0 fallan, 9 saltados (condicionados, ya existían) · suite unitaria 102 archivos, 1914 pruebas en verde · `build-como-proveedor` 69 páginas idénticas · CSP 56 páginas · cero enlaces árbol limpio · lock `instrumentos-de-plan` 18/18 y diagramador 57/57 · demos en rojo: `planesSinAprobacion` (plan editado) y `--desde` viejo, restauradas. Lighthouse en CI (3 corridas, mediana).
- **Defecto de F2 cazado en F3:** la pantalla de decisiones no importaba `investigador.css` y el comando desbordaba a 630 px; corregido importando la hoja (`3b67d84`).
- **Desviaciones:** el README del paquete no se tocó (la procedencia va en la cabecera del lock: `# copia de: app-planlang@2642110`); las citas se validan por evidencia y componentes, no por ids libres; `evaluables` excluye las plataformas que el caso elimina, no las ficticias; la excepción de aislamiento del núcleo se declara en `tests/unit/nucleo/aislamiento.test.ts`; la CI sigue en 3 corridas de Lighthouse; el repo sigue permitiendo merge commit (lo cambia el usuario).
- **Enmiendas al contrato de instrumentos-de-plan:** opciones por plataforma; residual con cambio de categoría; `responsable` y `costo_prueba` (gratis · bajo · medio) en supuestos; `capacidad_id` o `criterio_id` en decisiones; `estado` (pendiente · esperando-prueba · decidida); riesgos ordenados como en B-13.
- **Opciones sin fuente para `/investigar`:** ninguna; las 29 citas resuelven a evidencia aprobada de su plataforma.
- **Pendiente del usuario:** el plan sigue en borrador. Si corres el comando de la pantalla, sube `plan.yaml` y `data/revisiones/planes/hospital-futuro.jsonl` en el mismo PR.

Para mergear: squash y borrar la rama; después corre `/cierre-sprint big-d`.
