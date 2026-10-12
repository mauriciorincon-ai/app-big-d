---
sprint: 006
app: big-d
hito: H-1 Vitrina funcional
opened: 2026-10-11
closed: 2026-10-11
branch: sprint-006/informe
pr: 19
---

# Sprint 006 — El informe · cierre

**Objetivo:** informe completo y reproducible (C19–C20): hoja de ruta con origen, alistamiento y 14 secciones en ES y EN. **Estado:** construido en 3 fases, listo para PR; con el dato real sale en borrador, y el propio informe lo dice. **Estimado:** 4 h (F1 1 h · F2 2 h · F3 1 h).

**Tiempo real** (`node scripts/horas-sprint.mjs` al cerrar la construcción, rango hasta F3; cuenta solo commits, el trabajo previo al primero no entra):

```
### Horas del sprint (`scripts/horas-sprint.mjs`, rango `origin/main..HEAD`, heurística git-hours: huecos ≤ 2 h + 0,5 h por sesión)

| Commits | Sesiones | Horas activas | Span (primer → último commit) |
|---:|---:|---:|---|
| 3 | 1 | 1,2 h | 2026-10-11 22:53 → 2026-10-11 23:33 (0,7 h) |

| Fase | Commits | Horas activas |
|---|---:|---:|
| F1 | 1 | 0,5 h |
| F2 | 1 | 0,4 h |
| F3 | 1 | 0,3 h |
```

- **Entregables:** `data/convenciones/informe.yaml`; `src/engine/{legibilidad,hoja-de-ruta,alertas-evidencias,informe}.ts`; `src/lib/informe/*`; componentes y página `informe/`; fila `informe-legible` (8/8); e2e (11); manual §14; brochure en 14; guía bloque P (70 pruebas); README.
- **Desviaciones:** núcleo plano (`src/engine/informe.ts`, no carpeta); sin semanas (el plan no trae duraciones); brochure +1 porque su test lo exige; la prueba sembrada cuenta su propio plan (5 decisiones, no 7).
- **Decisiones:** convenciones fuera de la instantánea (D-S6-01); presupuesto de lectura en código (D-S6-02); sin semanas (D-S6-03).
- **Auditoría:** Crítico 0 · Alto 0 · Medio 7 · Bajo 8, sin ajustes en el sprint. Deuda M1–M7 y B1–B8 en `sprints/SPRINT_006-auditoria.md`, al lote del hito; visibles M1 («0,0 puntos de ventaja») y M2 (ids duplicados).
- **Modelo por fase:** F1 Sonnet 5.5 · F2 Sonnet 5.5 · F3 Haiku 5.5 (bastó para e2e y docs; la depuración del build fue larga) · auditoría Sonnet 5.5 (subagente) · relevo a Sonnet 5.5 para el LCP del informe, que Lighthouse dio en rojo (2955 > 2900 ms).
- **Desvío de la regla 29:** en F3 el build de Turbopack falló cuatro veces antes del diagnóstico; superé el límite de dos intentos sobre lo mismo. Cada intento cambió una variable, pero lo declaro.
- **Aprendizaje:** (a) los webServers de la app y la sembrada hacen `pnpm build` a la vez sobre el mismo `.next`; una caché dañada sigue fallando: `rm -rf .next` (local, la CI está verde). (b) El LCP simulado sube ~150 ms (un RTT) por cada hoja CSS extra de la ruta: el informe cargaba 6 y ahora 1 por `@import` (2912 → 2615 ms).
- **Huellas y locks:** `NUCLEO.SHA256SUMS` +10 líneas nuevas, ninguna existente cambió; locks 57/57 y 18/18; enmiendas al contrato: no aplican.
- **Observación:** con un ciclo, `ordenarDecisiones` no devuelve ondas (G2); candidata a enmienda en la planeadora.
- **Para mergear:** squash y borrar la rama; después `/cierre-sprint big-d`.
