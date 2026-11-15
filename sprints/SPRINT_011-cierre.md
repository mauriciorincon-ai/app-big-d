---
sprint: 011
app: big-d
hito: H-2 «Producto completo» (ensayo general pendiente)
opened: 2026-11-14
closed: 2026-11-14
branch: sprint-011/sin-cabos-sueltos
pr: 30
---

# Sprint 011 · cierre

- **Nombre:** Sin cabos sueltos. **Objetivo:** dependabot #29 con CI verde y cerrado; capturas de portafolio reproducibles (F15–F21, F19 sin pantalla); `build:demo` reproduce sus huellas sin variables.
- **Resultado:** las tres fases hechas y auditadas; hallazgos pagados. **Estado:** construido, auditado y pagado. Falta la CI del PR #30 (ver «Verificación»).
- **Tiempo estimado:** 2 h. **Real** (`node scripts/horas-sprint.mjs`, `origin/main..HEAD`, antes de este cierre): 6 commits, 1 sesión, **1,3 h activas**. F1 0,5 h · F2 0,3 h · F3 0,5 h. **Diferencia:** −0,7 h (−35 %). Ninguna fase pasó del 50 % de su estimado.
- **Fases (plan → real):** F1 dependencias 0,75 → 0,5 h · F2 capturas y demo 0,75 → 0,3 h · F3 auditoría y cierre 0,5 → 0,5 h.
- **Modelo por fase:** F1 y F2 según su plan (sin registro de modelo en esta sesión). F3 Sonnet 5.5 · medium, coincidió con el activo. Auditor: Sonnet 5.5 · high, solo lectura. Cierre: Haiku 5.5 · low (`/model claude-haiku-5-5` confirmado; `/effort low` sin confirmar).
- **Haiku 5.5:** el cierre se escribió con él (texto corto, cifras pegadas de la salida de `horas-sprint.mjs`). **Relevos:** ninguno.
- **Verificación local:** tsc y lint limpios · Vitest de capturas y demo 31/31 · `demo:huellas --comprobar` al día · capturas `out` 18 encuadres, 0 fallas; `out-demo` 1 encuadre, 0 fallas. **CI:** pendiente, corre con el PR #30; se lee al final.
- **Servidores:** `lsof` LISTEN en este repo: 0.
- **Huellas:** `NUCLEO.SHA256SUMS` sin cambios. `CONTRATO.lock` sin cambios. `DEMO.SHA256SUMS` sin cambios (`--comprobar` al día).
- **Dependencias (F1, 44bbdc6):** 9 pines exactos del #29 (next 16.4.6, @sentry/nextjs 11.12.0, @playwright/test 1.65.0, tailwindcss 4.3.5, vite 8.3.8, entre otros). `supports-color` 8.1.1 sale del lock (lo dejó de pedir @sentry/bundler-plugins 11.12.0); su entrada en `scripts/degradaciones-permitidas.json` **se borra en la primera rama tras el merge**, porque el gate falla si queda vieja.
- **Commits:** F1 44bbdc6 · F2 996b98c, f72d757 · F3 0cc751b, 49ac375, 6343866.
- **Auditoría** (4 casillas, Sonnet 5.5 · high, solo lectura): 0 críticos, 0 altos, 1 medio, 15 bajos; veredicto «requiere ajustes», pagado en F3.

| Hallazgo                                                                                                | Sev. | Pago                                                                         |
| ------------------------------------------------------------------------------------------------------- | ---- | ---------------------------------------------------------------------------- |
| C-1 `contiene` de F16/F17/F18 coincidía con el resumen del `<details>` cerrado; tests sin exigir `paso` | M    | pagado · 0cc751b                                                             |
| C-2 mensaje de `--arbol` engañoso para out-demo y out-sembrada                                          | B    | pagado · 0cc751b                                                             |
| C-3 mensaje de huellas «de hoy» tras la fecha fija                                                      | B    | pagado · 49ac375                                                             |
| C-4 `construir.mjs` importaba la fecha desde `huellas.mjs` (dependencia invertida)                      | B    | pagado · 49ac375 (módulo `scripts/demo/fecha.mjs`)                           |
| C-5 limpieza del tmp de `out-demo`                                                                      | —    | sin hallazgo (revisado)                                                      |
| C-6 cabecera sin los tres comandos del criterio «toma las 21»                                           | B    | pagado · 0cc751b                                                             |
| C-7 pre-release `@emnapi/*@2.0.0-beta.2` en el lock (solo desarrollo, wasm32)                           | B    | deuda con sitio: no leído a fondo, no se instala en darwin/linux             |
| C-8 comentario de `paquete.test.ts` describía el esquema anterior                                       | B    | pagado · 49ac375                                                             |
| C-9 manual cita la fecha fija sin test que la ate                                                       | B    | pagado · 49ac375 (test de la nota ES/EN)                                     |
| C-10 fecha congelada: vigencia de la demo no envejece                                                   | B    | decisión del sprint, anotada aquí; `FECHA_FIJA` se renueva al cerrar un hito |
| S-1 comentario de `compression` con «14.2.6 (la última)»                                                | B    | pagado · 6343866                                                             |
| S-2 entrada de `supports-color` a borrar tras el merge                                                  | B    | instrucción de este cierre (ver «Dependencias»)                              |
| F-1 a F-3 comentarios de capturas con 15 encuadres y dos árboles                                        | B    | pagado · 0cc751b                                                             |
| F-4 `.env.example` sin la nota de `build:demo`                                                          | B    | pagado · 6343866                                                             |

- **Frases caducadas:** revisadas en manual, README, guía, brochure y comentarios de los scripts tocados; ninguna caduca. Las frases de evidencia de este cierre salen de las corridas de arriba.
- **Desviaciones:** ninguna del plan. Un criterio queda «Parcial» hasta el cierre: «`pnpm capturas:producto --portafolio` toma las 21» necesita tres corridas (una por árbol); ya está en la cabecera del script (C-6 pagado).
- **Deuda (imposible):** ninguna.
- **Aprendizajes:** (1) un `contiene` que busca un texto presente también con el detalle cerrado no prueba el paso: hay que buscar algo que solo aparece abierto. (2) Prettier no es la herramienta de estos archivos: reformateó seis archivos ajenos al cambio; se revirtieron.
- **Para mergear:** squash y borrar la rama; después `/cierre-sprint big-d`.
