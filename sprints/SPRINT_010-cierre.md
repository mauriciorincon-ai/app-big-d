---
sprint: 010
app: big-d
hito: H-2 «Producto completo» (ensayo general pendiente)
opened: 2026-11-12
closed: 2026-11-13
branch: sprint-010/mostrarlo-al-mundo
pr: PENDIENTE
---

# Sprint 010 · cierre

- **Nombre:** Mostrarlo al mundo. **Objetivo:** demo pública (paquete estático para hoja-de-vida), brochure con escenas, guía como UN recorrido con `cubre`, jerga con Ngram, capturas de portafolio.
- **Resultado:** todo construido; la demo, el brochure y la guía recorren de punta a punta. 026-5 ya estaba pagado en S8 (`22201fc`): aquí solo la guía y el e2e. Estado: construido, auditado y pagado.
- **Tiempo estimado:** 4,75 h. **Real** (`node scripts/horas-sprint.mjs`, `origin/main..HEAD`): 21 commits, 2 sesiones, **3,2 h activas** (span 23,9 h). F1 1,2 h · F2 0,5 h · F3 1,5 h (a la hora de escribir esto; el cierre suma ≈ 0,2 h). **Diferencia:** ≈ −1,3 h (−27 %). Ninguna fase pasó más del 50 %.
- **Modelo por fase:** F1 y F2 según su plan; F3 Sonnet 5.5 · medium; cierre Haiku 5.5 · low, sin desvío. **Haiku 5.5:** el cierre se escribió con él; bastó (texto corto, cifras pegadas). **Relevos:** ninguno.
- **Tokens:** subagentes: 1 auditor (Sonnet 5.5 · high, solo lectura). Pedidos: `/compact` (F1→F2 y F2→F3, hechos), `/model` y `/effort` por fase. Las cifras las mide la planeadora.
- **Verificación (corrida final):** tsc y lint limpios · Vitest 2313 pasan + 1 omitida (2314; 97,96 % líneas, 6222/6351) · e2e 1245 · determinismo 27 (23 pasan, 4 omitidas a propósito: axe de la demo a 380 px, oscuro y claro, solo en Chromium) · total 3586.
- **Servidores:** `lsof` LISTEN en este repo: 0 (queda el test-server de la extensión Playwright de VS Code, que no cuenta).
- **Huellas:** `NUCLEO.SHA256SUMS` sin cambios. `CONTRATO.lock` sin cambios. Nuevo `tests/determinismo/DEMO.SHA256SUMS` (huella inicial c0633ab23044… y la de cada archivo del paquete; `pnpm demo:huellas`; el test la compara con un build nuevo).
- **Commits:** F1 8773c0d · 8d65ec5 · 70ae449 · 7c9bd4f. F2 85b7fd7 · 27ae784 · 9e93c9c · c80ca51 · 201fb3d. F3 ca57977 · 425d532 · 9a99f27 · 84efcab · ea0e528 · 3c26aac (+ pagos: 6aafcdf · 44705c2 · 287ebfb · f079c1d · ef29ba3 · ec0fcdc).
- **Decisiones:** la demo evalúa con estado de exploración (no aprueba nada) y sin la plataforma ficticia · `worker-src 'self'` global · e2e de la demo en la config de determinismo, puerto 3401 · fuentes OFL con su licencia · datos del cliente como bloque JSON dentro de la página (sin `fetch`) · textos en `src/lib/i18n/demo.ts` · el generador del brochure se niega a escribir si las huellas de los órdenes difieren, o si E2 ya no es empate técnico · la barra de E2 estaba mal y se vio en la captura.
- **Frases reescritas (jerga):** «el perfil del caso está en borrador» → «…aún no está aprobado» · «La comparación no puntúa todavía» → «La comparación aún no da resultados» · demo: «Vigencia de las evidencias calculada al {fecha}» → «Qué tan al día está cada evidencia, contando los días hasta el {fecha} y no hasta hoy» (y su par en inglés). «Big» y «Fabric» pasan a `permitidas` (nombres propios).
- **Auditoría** (4 casillas, Sonnet 5.5 · high): 0 críticos, 0 altos, 11 medios, 10 bajos; veredicto «requiere ajustes». **Los 21 pagados:** cliente de la demo (respuesta vieja de neutralidad, error del Worker, caja oculta que el CSS mostraba vacía: error real que halló el test nuevo) · 6aafcdf; ids únicos y pista de los mapas · 6aafcdf; N derivado en pruebas y textos sin «tres» · 6aafcdf, 44705c2; fecha de vigencia visible · 6aafcdf; nombres propios en `permitidas` · 6aafcdf, ec0fcdc; axe claro/oscuro y 380 px · 6aafcdf; `reordenada` con N = 2 · 6aafcdf; generador y escenas con N, reloj en el e2e · 44705c2; fecha fija del doble build, huecos de `fugas.mjs` con sus carnadas rojas, huellas versionadas · 287ebfb; encuadre F11 con su árbol y texto (F6 documentado: depende de `propuestas/`) · f079c1d; README y nota de design-sync, BLUEPRINT con su test, export «1 a 6, 8, 9 y 10», URL local de la guía, recuento · ef29ba3, ec0fcdc.
- **Desviaciones:** el criterio del sprint pide la guía por URL; la guía lleva la dirección local `127.0.0.1:3401` y su test la admite solo así. `design-system.md` no sube de versión (la constitución fija 0.7.0).
- **Deuda:** ninguna imposible.
- **Aprendizajes:** (1) un test que hace clic y escribe seguidos halló un error de CSS que ninguna lectura vio. (2) Un número derivado de los datos cuesta lo mismo que un literal y no caduca. (3) El gate de fugas se mide con carnadas, no con el paquete limpio.
- **Enmiendas al contrato del reusable:** ninguna (no se tocó `packages/`).
- **Recomendación para el siguiente:** el ensayo general del H-2 sobre la guía; el paquete `out-demo/` + manifiesto va a hoja-de-vida por PR de contenido (lo hace el dueño; aquí no se escribe allí). **Esfuerzo-beneficio:** alto.
- **Para mergear:** squash y borrar la rama; después `/cierre-sprint big-d`.
