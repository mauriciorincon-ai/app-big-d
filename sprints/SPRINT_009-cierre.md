---
sprint: 009
app: big-d
hito: H-2 «Producto completo» (ensayo general pendiente)
opened: 2026-11-11
closed: 2026-11-12
branch: sprint-009/preguntar-investigar-crecer
pr: 27
---

# Sprint 009 · cierre

- **Nombre:** Preguntar, investigar y crecer.
- **Objetivo planeado:** entrevistador, ejecutor con el modelo del sistema, 4.ª plataforma (BigQuery) y detector de jerga ES/EN.
- **Resultado:** los cuatro entregables construidos; BigQuery entra como «próximamente» con su propuesta. **Construido; falta la parada final del dueño (mapa de BigQuery).**
- **Tiempo estimado:** 4 h. **Tiempo real** (`node scripts/horas-sprint.mjs`, `origin/main..HEAD`): 2,2 h activas en 3 sesiones (span 20,7 h). F1 0,5 h · F2 1,2 h · F3 0,5 h.
- **Diferencia:** −1,8 h (−45 %). Ninguna fase pasó más del 50 %.
- **Modelo por fase:** F1 Sonnet 5.5 · medium · F2 Opus 5.5 · medium · F3 Sonnet 5.5 · medium · cierre Haiku 5.5 · low. Sin desvío de modelo.
- **Relevos:** ninguno.
- **Tokens:** F2 1 Explore (Haiku 5.5); F3 1 auditor general-purpose (Sonnet 5.5 · high, solo lectura). Pedidos: `/compact` (F1→F2), `/model opus` (F2), `/compact` + `/model sonnet` + `/effort medium` (F2→F3), `/model haiku` + `/effort low` (cierre).
- **Verificación:** tsc y lint limpios. Vitest 2276 pasan (97,96 % líneas). e2e: 971 + 262 pasan en los cuatro navegadores. Determinismo 9/9.
- **Servidores:** `lsof` LISTEN en 3400/3401 de este repo: 0.
- **Huellas:** `NUCLEO.SHA256SUMS` sin cambios (determinismo 9/9). `CONTRATO.lock` sin cambios. `data/convenciones/jerga.yaml` re-derivado y en verde.
- **F1 (commits):** fdd939d · e3c2409 · f5270cf.
- **F2 (commits):** a4d001b · 21cfaba · 767151a · d2f7d9e · b6b03ee · a60b5f4 · 51fec54.
- **F3 (commits):** 17c3b4e (guía, manual, export) · c855d69 (e2e) · bc87c2e (lighthouse, jerga) · 8770f9a (auditoría, bajos) · 5badf9d (auditoría, medios) · 43163c0 (revisión del mapa).
- **Auditoría** (4 casillas, Sonnet 5.5 · high, solo lectura): 0 críticos, 0 altos, 4 medios, 5 bajos. Todos pagados: medios (README, fila de IA y fecha del BLUEPRINT, cifras del export) · 5badf9d; bajos (truncado silencioso de frases, trozos sin leer no dichos, timeout de la llamada al modelo, limpieza del temporal, guarda del modelo falso) · 8770f9a.
- **Desviaciones:**
  - La nota de la planeadora (SPRINT_009 §4, 2026-11-12) dice que se verificó Google Books Ngram (CC BY 3.0) como vía (b) del detector. `decisions/jargon-detector.md` y `jerga.yaml` dicen que no se halló una lista «sin ambigüedad» y no mencionan Ngram. Se usa la vía d (jerga por dato) y no se incorpora Ngram.
  - La propuesta de capa `evidencias` de BigQuery no existe: exige mapa aprobado (ver pendientes).
  - La guía sigue por paradas (no como un solo recorrido con `cubre`): decisión del sprint, la matriz pasa a S10.
- **Causas:** `ejecucion.modelo` llevaba texto en español y se veía en inglés. Corregido; citas re-verificadas 42/42.
- **Decisión del dueño (2026-11-12, escrita):** «Vamos a revisarlo en la prueba completa de H-2». Eligió la propuesta A (`/investigar`, 42 afirmaciones); la pantalla del mapa ahora muestra el mapa completo antes que una capa rehecha (43163c0). Mapa y evidencias de BigQuery se aprueban en el ensayo general; las evidencias exigen el mapa aprobado.
- **Aprendizajes:** (1) con el dato real aprobado, los e2e del entrevistador se omiten; la prueba del editor vive en la copia. (2) El modelo del Mac rinde menos caracteres por token en texto técnico: el trozo se parte en dos al desbordar.
- **Dos caminos, comparados en la capa de ingesta de BigQuery:** `/investigar` 4/4 componentes, 42/42 citas verificadas; modelo del sistema 3/4 componentes, 3/3 citas verificadas, 26 descartadas por el código. La revisión de una persona sigue siendo obligatoria en ambos.
- **Enmienda propuesta a la constitución (regla dura 2):** «La única IA es `/investigar`, que corre a demanda: con Claude Code (skill) o con el modelo del sistema de macOS (`scripts/investigar/sistema.mjs`), sin claves ni descargas.» La planeadora la aplica.
- **Recomendación para S10:** matriz `cubre` de la guía como un recorrido. **Esfuerzo-beneficio:** alto.
- **Para mergear:** squash y borrar la rama; después `/cierre-sprint big-d`.
