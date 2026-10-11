---
sprint: 003
app: big-d
status: closed
opened: 2026-10-04
closed: 2026-10-10
branch: sprint-003/comparador
pr: "#8"
---
# Sprint 003 Summary — Big-D «El comparador» (cierre mínimo, directiva 2026-10-06)
**Outcome: parcial.** La base, el núcleo y las pantallas existen, y las 33 evidencias reales las aprobó una persona. El
perfil del caso no se aprobó, así que la comparación con el dato real todavía no puntúa.
## Qué se construyó
- `src/engine/`, puro y entero: puntaje con tope por madurez y evidencia limitante, total, empate, sensibilidad exacta,
  pros y contras, y SMAA exacto en un Web Worker con gate de contrato. Misma huella en Node y en 3 navegadores.
- `data/` con Zod (`archivo:línea:col`): 6 capacidades, 11 criterios, escala y convenciones. 44 evidencias aprobadas
  (33 reales y 11 del ensayo) y la instantánea `2026-10-06.1`. `scripts/instantanea.mjs`.
- `/base`, `/casos/[caso]` y `/comparacion`, fieles a la maqueta. La comparación completa se prueba con la base sembrada.
- Modo evidencias de `/investigar` con su pantalla de revisión (mirada M1 aprobada). Aprobadas P0 a P3.
- Fase 0, hecha el 2026-10-04, antes de la directiva: kit v1.39.0, contrato v0.6.0 (lock 57/57 con `origen`), DS v0.6.
## Qué no
- La parada de DECISIÓN del perfil: `data/casos/hospital-futuro.yaml` sigue en borrador; no hay modo caso para aprobar.
- La fase 4, por la directiva: `/instrumento`, el gate RF-09.4, la matriz de envejecimiento, Lighthouse de las rutas
  nuevas, la guía, el manual, los ADRs y `design-sync/`.
## Desviaciones frente al plan
- La fase 0 se queda en la rama: ya estaba hecha cuando llegó la directiva. El resto está en la bitácora, § «Desviación
  del plan»: muestreo por cajas, perfil en borrador desde la fase 2, caso «Hospital Ficticio del Futuro», componentes
  por id del mapa.
## Auditoría (`sprints/SPRINT_003-auditoria.md`)
Una pasada con un auditor independiente: 0 críticos y 2 altos pagados, cada uno con su rojo. AU-S3-01: las
instantáneas solo congelan lo aprobado. AU-S3-02: `POR_PAGINA` en lugar de un 3.
## Deuda
- **Medios:** AU-S3-03, la frontera de la aprobación se puede saltar (`scripts/investigar/comun.mjs:72`,
  `candado.mjs:12`). AU-S3-04, `origen: curador` sin control (`src/lib/investigador/evidencias.ts:41`).
- **Bajos:** AU-S3-05 a 11, cada uno con su sitio en la auditoría. Además: los estados vacíos de `/base` no tienen
  prueba de navegador, las 4 pruebas de gitleaks se saltan en CI (K-S3-6) y el margen de LCP está por debajo del 10 %.
## Commits
Primero: `d4de420` (2026-10-04). Último de código: `bfdf9d1` (2026-10-10). El cierre agrega este summary.
## Para mergear
Mergea con **squash** y borra la rama. Después corre `/cierre-sprint big-d` y avisa a la planeadora.
