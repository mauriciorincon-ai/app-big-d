# Sprint 002 — Auditoría final, Fase 1 (solo lectura) — Big-D

| Campo                         | Valor                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sprint                        | 002 · «Databricks y Snowflake, lado a lado»                                                                                                                                                                                                                                                                                                                            |
| Fecha                         | 2026-10-04                                                                                                                                                                                                                                                                                                                                                             |
| Branch                        | `sprint-002/lado-a-lado`                                                                                                                                                                                                                                                                                                                                               |
| PR                            | #5 (borrador)                                                                                                                                                                                                                                                                                                                                                          |
| Cabeza del branch             | `b8ce7b6`                                                                                                                                                                                                                                                                                                                                                              |
| Checks del PR sobre `b8ce7b6` | `quality`, `e2e`, `lighthouse`, `diagramador (ubuntu-latest)`, `diagramador (macos-latest)` y Vercel: los seis en `success` (`gh pr checks 5`, 2026-10-04)                                                                                                                                                                                                             |
| Quién auditó                  | Cuatro auditores independientes, uno por porción: A, el paquete `packages/diagramador/`; B, la app (`/comparar`, `/versiones`, CSP, UI, e2e); C, datos, investigador, versionado y kit; D, alcance, frases caducadas, guía heredada, documentos y CI. Más un consolidador independiente, que verificó cada Medio y cada punto dudoso. **Ninguno construyó el sprint.** |
| Alcance                       | `git diff origin/main...HEAD`: 27 commits, 276 archivos, +27 490 / −1 227 líneas                                                                                                                                                                                                                                                                                       |

**Archivos del diff por área:**

| Área                                                        | Archivos                                   |
| ----------------------------------------------------------- | ------------------------------------------ |
| `packages/diagramador/`                                     | 149 (golden, carnadas y pruebas incluidos) |
| `tests/unit`                                                | 21                                         |
| `src/lib`                                                   | 18                                         |
| `design-sync/`                                              | 10                                         |
| `src/components`                                            | 9                                          |
| `docs/` (manual, guía, kit, propuestas de diseño)           | 9                                          |
| `tests/e2e`                                                 | 8                                          |
| `scripts/`                                                  | 7                                          |
| `propuestas/`                                               | 7                                          |
| `data/` (5 mapas, 3 revisiones, 2 plataformas, 1 gramática) | 11                                         |
| `src/styles`                                                | 5                                          |
| `src/app`                                                   | 5                                          |
| `decisions/`                                                | 4 ADRs nuevos                              |
| Resto: CI, config, bitácora                                 | Otros                                      |

## Recomendación: **REQUIERE AJUSTES**

**No hay hallazgos Críticos ni Altos.** La integridad de lo aprobado está intacta:

- los tres mapas y la v0.1.0 archivada coinciden en bytes y en huella con sus revisiones;
- no hay fugas de identificadores ni datos de instituciones reales;
- no hay cardinalidad cableada en `src/`;
- el contrato fijado está 57/57.

Aun así, **no está listo para cierre**. Hay 15 Medios:

- **Un salto visible.** Al hidratar, la página pasa por el estado por defecto: con un enlace con consulta, las filas saltan (S2-AUD-04).
- **Un ítem de alcance sin construir y sin declarar:** la nota de marcas con los nombres reales (S2-AUD-05).
- **Documentos que dicen algo que la bitácora contradice.** Afirman que los tres mapas se aprobaron «afirmación por afirmación» (S2-AUD-08).
- **Una madurez publicada contra su cita.** Seguridad de OneLake figura como disponible general sin una cita que lo diga (S2-AUD-06).
- **Autoevaluación comercial de un fabricante** en un atlas que se presenta como neutral (S2-AUD-07).
- **Gates que nadie ve fallar.** Uno tiene registrado en la bitácora un rojo que no pudo ocurrir (S2-AUD-03, S2-AUD-09).
- **Una migración de un solo salto**, sin salida para las versiones archivadas (S2-AUD-10).
- **Registros incompletos de lo que el sprint cambió frente al plan y al contrato** (S2-AUD-11 a S2-AUD-15).
- **Un validador más laxo de lo que pide el contrato** (S2-AUD-01).
- **Una combinación de opciones de `compare` que da un dibujo falso sin avisar** (S2-AUD-02).

La directiva vigente es resolver todos los hallazgos al cierre, hasta los Bajos.

---

## 1. Resumen por severidad (conteo final, tras deduplicar)

| Severidad | Conteo | IDs                   |
| --------- | ------ | --------------------- |
| Crítico   | **0**  | —                     |
| Alto      | **0**  | —                     |
| Medio     | **15** | S2-AUD-01 a S2-AUD-15 |
| Bajo      | **34** | S2-AUD-16 a S2-AUD-49 |
| **Total** | **49** |                       |

**De dónde salen.** Los cuatro reportes sumaban 52 hallazgos: A 3 M + 9 B; B 2 M + 5 B; C 5 M + 8 B; D 6 M + 14 B. Al consolidar:

- **Fusiones.** Se fundieron cuatro pares o grupos: B-2 + D-14; C-3 + D-2; D-3 + A-12 + D-20; y D-10 absorbió el punto 4 de C-3.
- **Hallazgo nuevo.** La consolidación añadió S2-AUD-49.
- **Caso nuevo.** Se sumó un caso a S2-AUD-17 (`compare([])`).
- **Partes descartadas.** Las partes descartadas, con su evidencia, están en § 3-bis.

---

## 2. Cobertura de alcance (orden + plan aprobado)

**Fuentes:**

- la orden `portafolio/big-d/ordenes/SPRINT_002-orden.md`;
- `portafolio/big-d/sprints/SPRINT_002.md`;
- el plan aprobado (D-S2-01…11).

**Estados:**

- Completo;
- Parcial;
- No implementado;
- Implementado con desviación (se indica si está declarada o no);
- Pendiente de cierre (por diseño, todavía no toca).

### Fase 0: setup, contrato v0.4.0 y deuda del S1

| #   | Ítem                                                                                                             | Estado                                                                 | Evidencia / hallazgo                                                                                                                                                                                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `CLAUDE.md` sincronizado: v0.4.0, regla 23 y regla 17 de v1.32.1                                                 | Completo                                                               | `CLAUDE.md:8`, `:13-15`, `:86-97`, `:546-555`; se conservaron los deltas del S1                                                                                                                                                                   |
| 2   | Contrato copiado y `CONTRATO.lock`                                                                               | Completo                                                               | `packages/diagramador/CONTRATO.lock:4`; `node scripts/contrato/verificar.mjs`: «v0.4.0, 57 archivos idénticos»                                                                                                                                    |
| 3   | API en inglés: `group`, `texts`, `queryDate`, `validateGrammar`, `toLegend` con `texts`, plurales `{one, other}` | Completo                                                               | `packages/diagramador/src/index.ts:3`; `src/layout/contexto.ts` (`plural`). El plural elegido por `n === 1` fijo va a «Enmiendas» (S2-AUD-12)                                                                                                     |
| 4   | `escala_madurez[].etiqueta_corta`                                                                                | Implementado con desviación, no declarada                              | Se dibuja (`src/layout/contexto.ts:108`), pero G7 no la valida (`src/validar/textos.ts:30`) → **S2-AUD-01**                                                                                                                                       |
| 5   | V16 en modo publicación, a cuatro edades                                                                         | Completo, con un borde                                                 | `src/validar/index.ts:40-47`, `src/validar/v16.ts:17-24`. Sin `texts` falla abierto (`index.ts:43`) → **S2-AUD-19**                                                                                                                               |
| 6   | P1–P3 leídos de `carnadas/`; se retira `test/carnadas-piloto/`                                                   | Completo                                                               | `test/carnadas.test.ts:58-100`; 34/34                                                                                                                                                                                                             |
| 7   | Los `secundarios` de C03, C06 y C07                                                                              | Completo                                                               | `test/carnadas.test.ts:66`                                                                                                                                                                                                                        |
| 8   | Avisos de § 5.6 con sus nombres                                                                                  | Completo, con extensiones y un defecto de semántica                    | `src/layout/tipos.ts:14` (tipos `texto` y `pistas`, a «Enmiendas»); el `id` no siempre es un elemento → **S2-AUD-20**                                                                                                                             |
| 9   | P13 medida y propuesta                                                                                           | Completo; el detector no tiene prueba positiva                         | `src/layout/rutas.ts:182-263`, `src/layout/d11.ts:111` → **S2-AUD-22**                                                                                                                                                                            |
| 10  | § 12: verificar que describe el esquema del investigador (orden `:66`)                                           | **No implementado**                                                    | Ninguna mención en la bitácora; divergencia entre `src/lib/investigador/esquema.ts:27`, `:41` y `CONTRATO.md:567-568` → **S2-AUD-13**                                                                                                             |
| 11  | Subconjunto de fuentes                                                                                           | Implementado con desviación, declarada                                 | Bitácora `:751-754`; ADR `lcp-budget-by-profile`                                                                                                                                                                                                  |
| 12  | LCP medido y ADR                                                                                                 | Completo; el ADR conserva una frase en futuro                          | `decisions/lcp-budget-by-profile.md:38` → **S2-AUD-41**                                                                                                                                                                                           |
| 13  | CSP con huellas y e2e                                                                                            | Implementado con desviación (`<meta>` en lugar de cabecera), declarada | `scripts/csp/inyectar.mjs`; `tests/e2e/csp.spec.ts`. El ADR quedó desfasado → **S2-AUD-11**; la verificación en el preview es indirecta → **S2-AUD-32**                                                                                           |
| 14  | El campo homepage apunta al repo (D-S2-11)                                                                       | Completo                                                               | `gh repo view`: `homepageUrl` = `url`                                                                                                                                                                                                             |
| 15  | Comentarios del bot de Vercel apagados                                                                           | Completo                                                               | PR #5 sin comentarios de `vercel[bot]`                                                                                                                                                                                                            |
| 16  | Demo en rojo de cada gate nuevo                                                                                  | **Parcial**                                                            | Tablas de la bitácora (fase 0 `:43-51` … fase 4 `:718-720`). Pero el rojo de «Archivada = aprobada» (`:428`) no pudo ocurrir → **S2-AUD-09**; los avisos de `compare` solo se vieron en rojo por mutación, sin prueba que lo fije → **S2-AUD-03** |
| 17  | Supuestos del kit K1–K7                                                                                          | Completo                                                               | Bitácora `:31-41`                                                                                                                                                                                                                                 |
| 18  | `pre-commit` que falla cerrado                                                                                   | Completo                                                               | `githooks/pre-commit:16-22`; `tests/unit/githooks-pre-commit.test.ts`                                                                                                                                                                             |
| 19  | dependabot ignora los majors de `@types/node`                                                                    | Completo                                                               | `.github/dependabot.yml:22-26`                                                                                                                                                                                                                    |
| 20  | `/deploy-check`: casilla de la matriz y línea del homepage                                                       | Completo, con un puntero inexacto                                      | `.claude/commands/deploy-check.md:133-137` → **S2-AUD-45**                                                                                                                                                                                        |
| 21  | Migración 0.3 → 0.4 en memoria (D-S2-01)                                                                         | Completo, con deuda de diseño                                          | `src/lib/datos/migrar.ts:10-22`; un solo salto y sin salida para las archivadas → **S2-AUD-10**                                                                                                                                                   |

### Fase 1: conformidad con v0.4.0, `compare`, diferencias y P13

| #   | Ítem                                                                                  | Estado                                        | Evidencia / hallazgo                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 22  | Mirada M1 de FORMA, registrada (D-S2-10)                                              | Completo                                      | Bitácora `:156-191`                                                                                                                                                      |
| 23  | `compare`: rejillas 1190/1496, rótulo de 26 u, bloques de 118 × 64, nodos de 152 × 88 | Completo                                      | `src/layout/compare.ts:64-94`; `test/compare.test.ts:58-69`. No existe `src/svg/compare.ts` (lo serializa `toSVG`): desviación de archivos sin registrar → **S2-AUD-12** |
| 24  | Orden por `sujeto_id`, prefijo por mapa (D12), error con gramáticas distintas         | Implementado con desviación                   | `compare.ts:97-131`. Con `sujeto_id` repetido el orden no es total y los ids se duplican; `compare([])` no falla → **S2-AUD-17**                                         |
| 25  | `levelByBand` sin mover columnas                                                      | Completo, con un borde                        | `compare.ts:444-451`. Acepta niveles distintos de 1 y 2 → **S2-AUD-17**                                                                                                  |
| 26  | `n` y `page` del consumidor                                                           | Completo, con un borde                        | `compare.ts:114-121`. `page` sin `n` se ignora → **S2-AUD-17**                                                                                                           |
| 27  | Filas independientes (`part`)                                                         | Completo; extensión no declarada              | `compare.ts:58`, `:516`; propiedad en `test/compare.test.ts:142-163` → **S2-AUD-12**                                                                                     |
| 28  | `toCompareCSS` (D-S2-07)                                                              | No implementado (reemplazado tras M1)         | ADR `compare-in-the-engine` (Consequences). La bitácora `:770` lo lista como si existiera → **S2-AUD-12**                                                                |
| 29  | `marks` (D-S2-08)                                                                     | **Implementado con defectos**                 | `compare.ts:107-113`, `:143-156`. Con `n` o `page` pierde las marcas → **S2-AUD-02**; no comprueba que las marcas sean `diff(maps[0], maps[1])` → **S2-AUD-18**          |
| 30  | `diffToText`                                                                          | Completo; el comparador de bandas no es total | `src/texto/diffToText.ts:31` → **S2-AUD-23**                                                                                                                             |
| 31  | Banda vacía en `compare`                                                              | Implementado sin prueba                       | `compare.ts:320-343`, `:383-390`. El rótulo «sin bloque» sobra → **S2-AUD-16**                                                                                           |
| 32  | Regla del haz en la leyenda                                                           | Implementado sin prueba                       | `src/svg/leyenda.ts:42` → **S2-AUD-22**                                                                                                                                  |
| 33  | Marcas envía/recibe horizontales                                                      | Completo                                      | `src/svg/glifos.ts:35-36`; 30 golden regenerados                                                                                                                         |
| 34  | Paréntesis corto                                                                      | Completo                                      | `src/texto/metricas.ts:61-81`                                                                                                                                            |
| 35  | Matriz de envejecimiento sobre `compare` y `diff`                                     | Completo                                      | `test/compare.test.ts:291-340`; `tests/unit/atlas-vigencias.test.ts:36-55`. Los umbrales de la app están cableados → **S2-AUD-49**                                       |
| 36  | fast-check: G5 entre N mapas, orden, nivel por banda, fila independiente              | Completo                                      | `test/compare.test.ts:57-163` (semilla 20261002)                                                                                                                         |
| 37  | Golden de `compare` (14) y de `diff`                                                  | Completo                                      | 44 `.svg` = 44 líneas de `SHA256SUMS`, sin huérfanos                                                                                                                     |
| 38  | Determinismo en 3 navegadores × 2 sistemas                                            | Completo                                      | `tests/determinismo/entrada.ts:53-58`; `.github/workflows/ci.yml:87-106`                                                                                                 |
| 39  | D11 = 0 en todo, a cuatro edades                                                      | Completo                                      | El cargador exige V16 en publicación; job `diagramador` en `success`                                                                                                     |
| 40  | § 5.6 sobre lo dibujado por `compare` (lo usa V16)                                    | Implementado sin prueba que lo vea disparar   | `compare.ts:624-641` → **S2-AUD-03**                                                                                                                                     |

### Fase 2: el lado a lado en producto

| #   | Ítem                                                                                                       | Estado                                       | Evidencia / hallazgo                                                                                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 41  | `/[idioma]/comparar`: selector en la URL, paginación, una banda a la vez, ventana/ficha, lectura y leyenda | Completo                                     | `src/app/[idioma]/comparar/page.tsx:24-78`; `src/lib/atlas/lado.ts:115-236`; `src/lib/atlas/estado-lado.ts:8`. Construido en `src/components/atlas/` y no en `src/components/lado-a-lado/*` (orden `:91`): desviación de archivos sin registrar → **S2-AUD-12** |
| 42  | Script previo al pintado; «sin CLS ni salto al hidratar»                                                   | **Parcial**                                  | El script está bien (`estado-lado.ts:62-68`). Pero la hidratación reescribe el estado por defecto (`src/components/atlas/Lado.tsx:76-81`) → **S2-AUD-04**                                                                                                       |
| 43  | Botón único «Desplegar todo / Contraer todo» (M1)                                                          | Completo                                     | `Lado.tsx:110-124`; `src/styles/lado.css:21-33`                                                                                                                                                                                                                 |
| 44  | Nota de marcas con los tres nombres reales (`SPRINT_002.md:128`, `:159`, `:173`)                           | **No implementado; desviación no declarada** | `src/lib/i18n/es.ts:79-80` / `en.ts:79-80` conservan la nota genérica → **S2-AUD-05**                                                                                                                                                                           |
| 45  | Filas «próximamente» que llevan al investigador                                                            | Completo (hoy sin datos que lo ejerciten)    | `Lado.tsx:195-205`; `tests/unit/ui/lado.test.tsx:91`. Su e2e se salta → **S2-AUD-27**                                                                                                                                                                           |
| 46  | Pestaña 04, `NavSecciones`; el idioma conserva la consulta                                                 | Completo                                     | `CabeceraAtlas.tsx:59`; `Barra.tsx:22`; `ConmutadorIdioma.tsx:11`, `:30-33`                                                                                                                                                                                     |
| 47  | M2, gate de FORMA sobre el preview (indiferible)                                                           | Completo                                     | Bitácora `:451-465`                                                                                                                                                                                                                                             |
| 48  | Capturas comparadas con `lado-a-lado.html`                                                                 | Completo                                     | Bitácora `:433-441`                                                                                                                                                                                                                                             |
| 49  | Versionado de mapas (D-S2-09)                                                                              | Completo; dos ramas sin prueba               | `scripts/aprobar.mjs:34-48` (solo leído); `src/lib/datos/cargar.ts:182-213`; `src/lib/investigador/aprobados.ts:29-38` → **S2-AUD-09**                                                                                                                          |

### Fase 3: tres investigaciones

| #   | Ítem                                                                             | Estado                                                  | Evidencia / hallazgo                                                                                                         |
| --- | -------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 50  | `/investigar` ×3, validadas (V1–V16, cuatro edades) y dibujadas antes de aprobar | Completo                                                | `propuestas/2026-10-03-databricks`, `2026-10-04-snowflake`, `2026-10-04-fabric`; bitácora `:470-620`                         |
| 51  | Aprobadas «afirmación por afirmación», con fecha (orden `:145`)                  | **Implementado con desviación**                         | Fabric está declarada solo en el cuerpo de la bitácora (`:627-631`); Databricks no está declarada → **S2-AUD-08**            |
| 52  | Fabric v0.2.0 sin «lago de datos», con la v0.1.0 archivada byte a byte           | Completo, con un defecto de contenido                   | `data/mapas/fabric.mapa.yaml`; `data/mapas/versiones/fabric-0.1.0.mapa.yaml`. La madurez de A-47 es heredada → **S2-AUD-06** |
| 53  | Registro de las tres corridas                                                    | Completo                                                | `propuestas/registro-de-ejecucion.jsonl`, +303 líneas con 5 claves                                                           |
| 54  | Privacidad: sin ids de sesión ni de la persona                                   | Completo                                                | Barrido de C sobre el registro, las propuestas y los mapas                                                                   |
| 55  | Regla 12 (cero instituciones reales)                                             | Completo en lo vigente; falta un gate en las archivadas | `cargar.ts:170-176` → **S2-AUD-33**                                                                                          |
| 56  | La skill nombra el contrato vigente                                              | Completo; describe V16 como en 0.3.0                    | `.claude/skills/investigar/SKILL.md:48`; `:89-93` → **S2-AUD-35**                                                            |
| 57  | Neutralidad, vocabulario y presupuesto del líder                                 | **Parcial**                                             | Líder ≤ 21 palabras; autoevaluación comercial en Databricks → **S2-AUD-07**                                                  |
| 58  | «Próximamente» desaparece; N = 4                                                 | Completo                                                | `out/es/comparar.html`: «Cuatro plataformas, el mismo mapa»                                                                  |

### Fase 4: diferencias en producto y cierre

| #   | Ítem                                                       | Estado                                    | Evidencia / hallazgo                                                                                                         |
| --- | ---------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 59  | `/[idioma]/atlas/[plataforma]/versiones`, con estado vacío | Completo, con un defecto de cuenta        | `src/lib/atlas/versiones.ts:61-174`; `versiones/page.tsx`. Cuenta como cambio de fuente uno de solo la fecha → **S2-AUD-36** |
| 60  | e2e del happy path                                         | Completo                                  | `tests/e2e/lado.spec.ts:92`; `tests/e2e/versiones.spec.ts:12`                                                                |
| 61  | G11 × 3, movimiento reducido, axe en dos temas             | Completo, con huecos                      | `g11.spec.ts:86-104`; `reduced-motion.spec.ts:93-106`. axe no mira lo desplegado → **S2-AUD-25**                             |
| 62  | Lighthouse ≥ 90 en `/comparar` y `/versiones`              | Completo                                  | `lighthouse-urls.json:16-19`; CI en `success`. El atlas de Snowflake no se mide → **S2-AUD-31**                              |
| 63  | Guía v2: prefijo `bigd-s2-`, las 38 del S1 enteras, ⭐ = 7 | Completo, con defectos                    | `docs/GUIA-DE-PRUEBA.html` → **S2-AUD-15**, **S2-AUD-46**, **S2-AUD-08**, **S2-AUD-36**                                      |
| 64  | Kit «con los tres mapas y la v0.1.0 de Fabric»             | Implementado con desviación, no declarada | Se entregó una v0.0.9 sintética (`docs/kit-de-prueba/versiones-de-muestra/`) → **S2-AUD-12**, **S2-AUD-43**                  |
| 65  | Manual ES/EN: lado a lado, versiones y reinvestigación     | Completo, con frases caducadas            | `docs/MANUAL-DE-USO.md:146-184`, `:332-368` → **S2-AUD-42**, **S2-AUD-36**, **S2-AUD-08**                                    |
| 66  | Cuatro ADRs                                                | Completo, con desfases                    | → **S2-AUD-11**, **S2-AUD-41**, **S2-AUD-10**                                                                                |
| 67  | `design-sync/` en el PR                                    | Completo, con defecto                     | Una tarjeta con 112 ids repetidos → **S2-AUD-24**; README desfasado → **S2-AUD-44**                                          |
| 68  | Pasada final de capturas con interacción (regla 22)        | Completo                                  | Bitácora `:722-731`; `scripts/capturar-producto.mjs:275-326`                                                                 |
| 69  | Regla 23, matriz de envejecimiento                         | Completo, con umbrales cableados          | → **S2-AUD-49**                                                                                                              |
| 70  | Diseño «fiel… (extensiones por ADR)» (orden `:179`)        | **Parcial**                               | Solo el botón está en un ADR → **S2-AUD-14**                                                                                 |
| 71  | Observabilidad: confirmar `beforeSend` (orden, input 5)    | Completo en código, sin registro          | `instrumentation-client.ts:26` → **S2-AUD-47**                                                                               |

### Pendiente de cierre (por diseño, no son faltantes)

- La Fase 2 de esta auditoría.
- `sprints/SPRINT_002-summary.md`. Debe llevar: «Enmiendas al contrato del diagramador», «Fallas del diagramador», el ⭐ 3 → 7, M1/M2, las tres revisiones, la huella del lock, el LCP final y el registro de esta auditoría.
- `/deploy-check`, con la **relectura 7-S fechada antes del release** (hoy solo existe la del S1: `decisions/investigator-7s-compliance.md:27`).
- Decir en el summary que `lighthouse` corrió por primera vez sobre `/comparar` y `/versiones`.
- Sacar el PR #5 de borrador y re-emitir el checklist de aprovisionamiento.
- Re-verificar el homepage después del merge.

---

## 3. Hallazgos

**Ajuste.** Cada hallazgo trae:

- archivo y línea;
- el cambio exacto;
- el criterio observable;
- su demo en rojo, si el ajuste crea un gate.

**Decisiones de la persona.** Lo que pide su decisión va marcado con **«Decide la persona:»**, con una sola pregunta de sí o no. Al hacerla:

- se abre la página;
- se hace una pregunta por mensaje;
- se da la ubicación exacta.

**Mapas aprobados.** **Un mapa aprobado jamás se edita a mano.** Lo que está mal en un texto publicado se paga reinvestigando o se declara como deuda.

### Medios

#### S2-AUD-01 · Medio · G7 no valida los idiomas de `escala_madurez[].etiqueta_corta` (A-1)

- **Dónde:** `packages/diagramador/src/validar/textos.ts:30`.
- **Qué está mal:** `etiqueta_corta` de la madurez es un mapa de idioma nuevo en 0.4.0 y el motor lo dibuja (`src/layout/contexto.ts:108`). Pero `textosDeGramatica` solo recoge `escala_madurez[].nombre`. Así, una etiqueta con un idioma de menos o de más pasa `validateGrammar`, contra G7 (`CONTRATO.md:441`: «todo mapa de idioma y todo diccionario de la gramática trae exactamente los idiomas declarados»).
- **Evidencia:** la sonda de A, re-corrida por el consolidador. Con `{ es: "Prev" }`, `validateGrammar(g).errores` da `[]`; con `{ es, en, fr }`, también `[]`.
- **Ajuste ejecutable:**
  1. En `src/validar/textos.ts`, reemplazar la línea 30 por:
     ```ts
     g.escala_madurez.forEach((m, i) => {
       textos.push({
         ruta: ruta("escala_madurez", i, "nombre"),
         id: m.id,
         valor: m.nombre,
       });
       if (m.etiqueta_corta)
         textos.push({
           ruta: ruta("escala_madurez", i, "etiqueta_corta"),
           id: m.id,
           valor: m.etiqueta_corta,
         });
     });
     ```
  2. En `test/madurez-corta.test.ts`, dentro del primer `it`, agregar:
     ```ts
     const incompleta = {
       ...G,
       escala_madurez: G.escala_madurez.map((m) =>
         m.id === "beta" ? { ...m, etiqueta_corta: { es: "Beta" } } : m,
       ),
     };
     expect(validateGrammar(incompleta).errores.map((e) => e.regla)).toContain(
       "G7",
     );
     ```
     Si `beta` no existe en esa gramática, usa el `id` de cualquier nivel que tenga `etiqueta_corta`.
- **Ajuste verificado si:** la prueba nueva está en verde, y en rojo al revertir el paso 1; y `pnpm exec vitest run packages/diagramador` queda en verde (carnadas 34/34).
- **Demo en rojo:** revertir el paso 1 y ver la prueba roja. Registrar «rojo → verde» en la bitácora (regla 15).

#### S2-AUD-02 · Medio · `compare` con `marks` y `n` o `page` pierde las marcas sin avisar (A-2)

- **Dónde:**
  - `packages/diagramador/src/layout/compare.ts:107-121`, en `filasDe`;
  - `:143-156`, en `clasesDe`, que usa el índice `k` de la fila _dentro de la página_;
  - `:516-528`, donde ese `k` se pasa a `celda`.
- **Qué está mal:** con `marks`, `n: 1` y `page: 2`, la única fila es la versión nueva, pero se trata como «antes» (`k === 0`). No recibe ninguna marca de nuevo, renombrado ni madurez, y su prefijo pierde la versión. Es un resultado falso y silencioso con una combinación que la API acepta.
- **Evidencia:** sonda de A re-corrida. Sin paginar hay 4 marcas; con `n: 1, page: 2` da `PAGE2 [] [ 'plataforma-ejemplo' ]`.
- **Ajuste ejecutable:** se hace dentro del mismo cambio de `filasDe` que S2-AUD-17 y S2-AUD-18. El código completo de `filasDe` está en S2-AUD-17. La línea que paga este hallazgo es:
  ```ts
  if (o.n !== undefined || o.page !== undefined)
    throw new Error(
      "compare: las marcas de diferencia dibujan las dos versiones en una sola página (sin «n» ni «page»)",
    );
  ```
  En `test/compare.test.ts`, dentro del `it` «levelByBand con una banda que no existe, y marcas sin dos mapas, se dicen», agregar:
  ```ts
  expect(() =>
    compare([ANTES, DESPUES], G, {
      ...base,
      marks: diff(ANTES, DESPUES),
      n: 1,
      page: 2,
    }),
  ).toThrow(/sin «n» ni «page»/);
  ```
- **Ajuste verificado si:**
  - la prueba nueva pasa;
  - `tests/unit/versiones.test.ts` sigue en verde (la app no pagina las versiones);
  - el golden `lado.diferencias*` no cambia.
- **Demo en rojo:** quitar la línea y ver la prueba roja.

#### S2-AUD-03 · Medio · Ninguna prueba ve dispararse los avisos § 5.6 de `compare`, de los que depende V16 (A-3)

- **Dónde:** `packages/diagramador/src/layout/compare.ts:624-641`. El aviso `encima` está en `:630` y `fuera-del-lienzo` en `:641`.
- **Qué está mal:** V16 dibuja la fila del lado a lado con `compare([map], …)` (`src/validar/v16.ts:44-45`) y depende de estas dos comprobaciones para rechazar un mapa que no cabe. Pero:
  - las líneas 630 y 641 tienen cobertura 0;
  - todas las pruebas de `compare` solo afirman `avisos` igual a `[]`.

  Si se borran las líneas 624-641, la suite sigue en verde. La bitácora registra un rojo por mutación, pero ninguna prueba lo fija.

- **Evidencia:** las sondas 5 y 6 de A, re-corridas, dan `[["encima","plataforma-ejemplo-v0-2-0/marca renombrado entrada"],["fuera-del-lienzo","plataforma-ejemplo-v0-2-0/marca renombrado origen"]]`. `grep -n "encima\|fuera-del-lienzo" packages/diagramador/test/compare.test.ts` no da nada.
- **Ajuste ejecutable:** en `test/compare.test.ts`, dentro de `describe("compare — marcas de diferencia (§ 4.7)")`, agregar:
  ```ts
  it("§ 5.6 sobre lo dibujado: una píldora que pisa otra tarjeta o sale del lienzo se avisa", () => {
    const largo = (l: string) => ({
      ...TEXTOS[l]!,
      lado: {
        ...TEXTOS[l]!.lado,
        marcas: {
          ...TEXTOS[l]!.lado.marcas,
          renombrado: "renombradorenombradorenombrado",
        },
      },
    });
    const texts = { es: largo("es"), en: largo("en") };
    const d = structuredClone(DESPUES);
    const n = d.nodos.find((x) => x.banda_id === "fuentes")!;
    n.nombre = { es: `${n.nombre.es} X`, en: `${n.nombre.en} X` };
    const geo = compare([ANTES, d], G, {
      texts,
      queryDate: FECHA_LADO,
      marks: diff(ANTES, d),
    });
    expect(geo.avisos.map((a) => `${a.tipo} ${a.id}`)).toEqual([
      "encima plataforma-ejemplo-v0-2-0/marca renombrado entrada",
      "fuera-del-lienzo plataforma-ejemplo-v0-2-0/marca renombrado origen",
    ]);
  });
  ```
  Si S2-AUD-20 cambia el formato del `id`, ajusta la expectativa a lo que imprima la prueba, pero sin perder ningún aviso.
- **Ajuste verificado si:** la prueba pasa. Se pone roja al comentar `compare.ts:627-630` (desaparece `encima`) o `:631-641` (desaparece `fuera-del-lienzo`).
- **Demo en rojo:** esas dos mutaciones, registradas en la bitácora.

#### S2-AUD-04 · Medio · Al hidratar una URL con consulta, `<html>` pasa por el estado por defecto: las filas saltan (B-1)

- **Dónde:** `src/components/atlas/Lado.tsx:76-81`. La instantánea del servidor está en `:61-65`.
- **Qué está mal:** al hidratar, `useSyncExternalStore` usa la instantánea del servidor (`""`). Así `visibles` y `elegidas` son «todas, página 1», y el `useLayoutEffect` las **escribe** en `<html>`, encima de lo que dejó el script previo al pintado. La consulta real llega en el efecto pasivo, y entre los dos el navegador puede pintar:
  - con `?plataformas=fabric` en ancho se ve 1 fila, luego 3 y luego 1 (≈ 208 px de salto de la leyenda y la lectura);
  - en el teléfono pasa lo mismo con `data-lado-elegidas`.

  Rompe la promesa de D-S2-07: «sin CLS ni salto al hidratar». Ninguna prueba lo ve:
  - `lado.spec.ts:50-58` bloquea el JS;
  - `tests/unit/ui/lado.test.tsx:62-71` monta, pero no hidrata;
  - Lighthouse mide sin consulta.

- **Evidencia:** el consolidador re-corrió el experimento de B contra el `Lado.tsx` real: `AssertionError: ["a b c","d"]`. El estado por defecto se escribe antes que el real.
- **Ajuste ejecutable:**
  1. En `src/components/atlas/Lado.tsx`, reemplazar el bloque de las líneas 76-81 por:
     ```tsx
     // Los atributos que lee el CSS generado salen de la URL REAL, no del estado del render: al hidratar, el render usa
     // la instantánea del servidor (sin consulta), y escribir ese estado pisaría lo que ya puso el script previo (S2-AUD-04).
     useLayoutEffect(() => {
       const real = estadoDeConsulta(window.location.search, ids, porPagina);
       const h = document.documentElement;
       h.setAttribute(ATRIBUTO_VISIBLES, real.visibles.join(" "));
       h.setAttribute(ATRIBUTO_ELEGIDAS, real.elegidas.join(" "));
     }, [visibles, elegidas, ids, porPagina]);
     ```
     La limpieza al salir (`:86-93`) no cambia.
  2. En `tests/unit/ui/lado.test.tsx`, agregar el import `import { hydrateRoot } from "react-dom/client";` (y `renderToString` de `react-dom/server` si no está). Luego agregar esta prueba:
     ```tsx
     it("al hidratar con consulta, el <html> nunca pasa por el estado por defecto (lo dejó el script previo)", async () => {
       const raiz = document.createElement("div");
       raiz.innerHTML = renderToString(<Lado {...props()} />);
       document.body.appendChild(raiz);
       window.history.replaceState(null, "", "/es/comparar?plataformas=d");
       const h = document.documentElement;
       h.setAttribute("data-lado", "d"); // lo que dejó el script previo al pintado
       const vistos: string[] = [];
       const poner = h.setAttribute.bind(h);
       h.setAttribute = (k: string, v: string) => {
         if (k === "data-lado") vistos.push(v);
         poner(k, v);
       };
       let r: ReturnType<typeof hydrateRoot> | undefined;
       try {
         await act(async () => {
           r = hydrateRoot(raiz, <Lado {...props()} />);
         });
       } finally {
         delete (h as unknown as Record<string, unknown>).setAttribute; // vuelve el del prototipo
       }
       expect(vistos.length).toBeGreaterThan(0);
       expect(
         vistos.every((v) => v === "d"),
         JSON.stringify(vistos),
       ).toBe(true);
       act(() => r!.unmount());
       raiz.remove();
     });
     ```
  3. Registrar en la bitácora el síntoma vecino que se acepta: antes de hidratar, el resumen del selector y la paginación dicen «4 de 4» y «1–3 de 4». Es texto del HTML estático y se acepta.
- **Ajuste verificado si:**
  - `npx vitest run tests/unit/ui/lado.test.tsx` está en rojo con el código de hoy, nombrando `["a b c","d"]`, y en verde tras el paso 1;
  - las 5 pruebas previas siguen en verde;
  - `tests/e2e/lado.spec.ts` sigue en verde;
  - `pnpm lint` no da avisos.
- **Demo en rojo:** la del primer criterio, registrada en la bitácora.

#### S2-AUD-05 · Medio · La nota de marcas no nombra las plataformas reales, y no se declaró (B-2, D-14)

- **Dónde:**
  - `src/lib/atlas/lado.ts:232` (`leyenda: toLegend(...)`);
  - `src/lib/i18n/es.ts:79-80`, `en.ts:79-80` (`motor.leyenda.notaMarcas`, genérica);
  - `src/lib/i18n/tipos.ts:69-96` (`atlas.lado`).
- **Qué está mal:** `SPRINT_002.md` la exige tres veces: en `:128` («nota de marcas con los tres nombres reales»), en `:159` y en `:173`. `/comparar` muestra la nota genérica del S1, que no nombra ninguna marca. Ni la bitácora ni «Desviación del plan» lo registran.
- **Evidencia:** en `out/es/comparar.html` y `out/en/comparar.html`, ninguna frase de marca contiene «Databricks», «Fabric» ni «Snowflake».
- **Por qué se descarta el ajuste de D-14** (dejar el texto y registrar la decisión):
  - su premisa es falsa: la nota genérica no la aprobó la persona en el S1; la decidió el constructor sin mirada (D-S1-34; `sprints/SPRINT_001-implementation-log.md:1035`; `decisions/design-system-s1-extensions.md:12`; M-5 de la auditoría del S1);
  - nombrar las plataformas **desde el dato** no es una lista cableada (regla 4).
- **Ajuste ejecutable:**
  1. En `src/lib/i18n/tipos.ts`, dentro de `atlas.lado` y después de `numeros`, agregar:
     ```ts
     notaMarcas: readonly[(string, string)];
     y: string;
     ```
  2. En `src/lib/i18n/es.ts`, dentro de `atlas.lado`, agregar:
     ```ts
     notaMarcas: [
       "{marcas} es una marca de su titular; Big-D la nombra solo para identificar su producto, y nombrarla no implica respaldo. Big-D no usa logos ni colores de marca: el color de este mapa dice qué capacidad es, nunca de quién.",
       "{marcas} son marcas de sus titulares; Big-D las nombra solo para identificar sus productos, y nombrarlas no implica respaldo. Big-D no usa logos ni colores de marca: el color de este mapa dice qué capacidad es, nunca de quién.",
     ],
     y: " y ",
     ```
  3. En `src/lib/i18n/en.ts`, dentro de `atlas.lado`, agregar:
     ```ts
     notaMarcas: [
       "{marcas} is a trademark of its owner; Big-D names it only to identify its product, and naming it implies no endorsement. Big-D uses no logos or brand colours: colour on this map says which capability it is, never whose.",
       "{marcas} are trademarks of their owners; Big-D names them only to identify their products, and naming them implies no endorsement. Big-D uses no logos or brand colours: colour on this map says which capability it is, never whose.",
     ],
     y: " and ",
     ```
  4. En `src/lib/atlas/lado.ts`, justo antes de `return {` (línea 222), agregar:
     ```ts
     // Nota de marcas con los nombres reales (SPRINT_002, «Forma obligatoria»): del dato —las no ficticias, en orden de
     // id—, jamás una lista a mano. Sin ninguna real, la nota genérica del motor.
     const reales = plataformas
       .filter((p) => !p.ficticia)
       .map((p) => p.nombre[idioma]);
     const lista =
       reales.length > 1
         ? `${reales.slice(0, -1).join(", ")}${t.atlas.lado.y}${reales.at(-1)}`
         : (reales[0] ?? "");
     const tmLeyenda = reales.length
       ? {
           ...tm,
           [idioma]: {
             ...tm[idioma]!,
             leyenda: {
               ...tm[idioma]!.leyenda,
               notaMarcas: plantilla(
                 t.atlas.lado.notaMarcas[reales.length === 1 ? 0 : 1],
                 { marcas: lista },
               ),
             },
           },
         }
       : tm;
     ```
     Luego cambiar la línea 232 a `leyenda: toLegend(g, { language: idioma, texts: tmLeyenda }),`.
  5. En `tests/unit/lado.test.ts`, dentro de `describe("vista del lado a lado")`, agregar:
     ```ts
     it.each(IDIOMAS)(
       "en %s: la nota de marcas nombra cada plataforma real, del dato, y ninguna ficticia",
       (idioma) => {
         const nota = /<p class="dg-leyenda-nota">([^<]*)<\/p>/.exec(
           vistaLado(d, idioma, FECHA).leyenda,
         )![1]!;
         for (const p of d.plataformas)
           expect(nota.includes(p.nombre[idioma]), p.id).toBe(!p.ficticia);
       },
     );
     ```
  6. Es una mirada de TEXTO, que no bloquea. Registrar «maquetado, no visto» en la bitácora; viaja al gate del ciclo.
- **Ajuste verificado si:**
  - la prueba está en rojo sin el paso 4 y en verde con él;
  - tras construir, `out/es/comparar.html` contiene «Databricks, Microsoft Fabric y Snowflake son marcas de sus titulares», con los nombres de `data/plataformas/*.yaml`;
  - `out/en/comparar.html` contiene «… and Snowflake are trademarks of their owners»;
  - `tests/unit/design-sync.test.ts` sigue en verde (la tarjeta del bundle usa solo la plataforma ficticia).

#### S2-AUD-06 · Medio · La madurez de «Seguridad de OneLake» (Fabric v0.2.0) se publicó heredada, contra su única cita (C-1)

- **Dónde:**
  - `data/mapas/fabric.mapa.yaml:517` (nodo `seguridad-onelake`) y `:534` (`madurez: disponible-general`);
  - `propuestas/2026-10-04-fabric/propuesta.json:2201` (A-47);
  - `.claude/skills/investigar/SKILL.md:79` (sin regla para esto).
- **Qué está mal:** la cita de A-47 (blog de FabCon, marzo de 2026) dice «OneLake security **will be** generally available in the coming weeks». El enunciado admite: «No encontré una fuente oficial legible que confirme el paso… La madurez "disponible de forma general" viene del mapa aprobado». Choca con dos reglas:
  - regla 6: «jamás se completa por inferencia»;
  - regla 9: trazabilidad de cada dato a una evidencia con fecha.
- **Evidencia:** la bitácora (§ «Fabric — propuesta 2026-10-04», `:579-582`) la marca como «la afirmación débil»; se aprobó con las 84.
- **Ajuste ejecutable (no se edita el YAML):**
  1. En `.claude/skills/investigar/SKILL.md`, después de la línea 79, agregar:

     > «La madurez de un componente sale de una cita que la diga. Si no la encuentras, no la heredes del mapa aprobado: propón la madurez que la cita prueba y deja la duda como pregunta guía.»

     Y en `tests/unit/investigador/skill.test.ts`, una aserción que la exija: `expect(skill).toContain("no la heredes")`.

  2. Reinvestigar la capa de gobierno de Fabric (ver la decisión).
- **Decide la persona:** «¿Corres en este sprint `/investigar fabric gobierno`, para que la madurez de "Seguridad de OneLake" salga de una cita y no del mapa anterior?»
  - **Si dice sí:** la persona invoca la skill y aprueba en su pantalla. La v0.3.0 resultante o bien cita un pasaje oficial que dice «generally available», o bien baja la madurez a la que la cita prueba. La v0.2.0 queda archivada sola, por D-S2-09.
  - **Si dice no:** deuda aceptada **por decisión de la persona**, en el summary, con `data/mapas/fabric.mapa.yaml:534` y pago en el S3.
- **Ajuste verificado si:**
  - `grep -n "no la heredes" .claude/skills/investigar/SKILL.md` encuentra la línea, y la prueba de la skill está en rojo sin ella;
  - además, una de dos: la siguiente versión de Fabric trae una afirmación sobre `seguridad-onelake` cuya cita, verificada por código, contiene la madurez publicada; o el summary registra la deuda con la respuesta de la persona y su fecha.

#### S2-AUD-07 · Medio · El mapa publicado de Databricks repite la autoevaluación comercial del fabricante (C-2)

- **Dónde:**
  - `data/mapas/databricks.mapa.yaml:479-480` (`experto` del nodo 11, `sql-warehouse`: «… como la de mejor precio y rendimiento» / «its best price-performance»);
  - `:482-483` (`por_que_importa`: «según Databricks, el serverless da cómputo inmediato»);
  - `propuestas/2026-10-03-databricks/propuesta.json:2253` (A-47) y `:2307` (A-50);
  - `src/lib/datos/vocabulario.ts:5-9` (el gate no lo veta).
- **Qué está mal:** las frases están atribuidas, pero son publicidad del fabricante sobre sí mismo, en un atlas que se presenta neutral (regla 5). En el lado a lado solo una plataforma «se vende» en la ficha.
- **Evidencia:** el barrido del consolidador sobre los tres mapas. `mejor precio|best price|price-performance` solo aparece en `databricks.mapa.yaml:479-480`. Los «casi al instante» de Fabric y Snowflake son hechos con cita.
- **Ajuste ejecutable:**
  1. En `src/lib/datos/vocabulario.ts`, dentro de `VETADAS`, agregar:
     ```ts
     [/mejor (relaci[oó]n de )?precio|best price|optimal price|price[- ]performance|l[ií]der del mercado|industry[- ]leading/i, "autoevaluación comercial del fabricante: el atlas no la repite"],
     ```
     El consolidador comprobó que no toca `docs/diseno/` (lo lee `tests/unit/maqueta-vocabulario.test.ts`) ni otro mapa.
  2. En `tests/unit/datos-vocabulario.test.ts:17`, declarar la deuda en `CONOCIDAS`, con un comentario como el de «lago de datos» en el S1:
     ```ts
     const CONOCIDAS = new Set<string>([
       // Deuda (S2-AUD-07): autoevaluación comercial en el mapa de Databricks aprobado el 2026-10-04. Se paga la
       // próxima vez que se investigue su capa de consumo; la validación de toda propuesta nueva ya la rechaza.
       "data/mapas/databricks.mapa.yaml /nodos/11/experto/es",
       "data/mapas/databricks.mapa.yaml /nodos/11/experto/en",
     ]);
     ```
     Actualizar también el comentario de `:12-16`, que hoy dice «Deuda declarada: ninguna».
  3. En `tests/unit/investigador/nucleo.test.ts`, agregar un caso: una propuesta con «best price-performance» en un `experto` hace que `validarPropuesta` falle con `vocabulario · mapa/nodos/… · autoevaluación comercial del fabricante…`.
- **Decide la persona:** «¿Corres en este sprint `/investigar databricks consumo`, para que el mapa deje de repetir que el serverless es "el de mejor precio y rendimiento"?»
  - **Si dice sí:** se reinvestiga, se aprueba la v0.2.0 y se vacía `CONOCIDAS`.
  - **Si dice no:** la deuda queda declarada en la prueba (paso 2) y en el summary, con pago en el S3.
- **Ajuste verificado si:**
  - el caso de `nucleo.test.ts` está en rojo sin el paso 1;
  - `datos-vocabulario.test.ts` lista exactamente esas dos rutas, o ninguna si se reinvestigó;
  - la prueba «la deuda declarada existe de verdad» sigue en verde.

#### S2-AUD-08 · Medio · Los documentos dicen «aprobado afirmación por afirmación» y la bitácora no lo sostiene (C-3, D-2, D-3 ítem 15)

- **Dónde:**
  - Bitácora `sprints/SPRINT_002-implementation-log.md`:
    - `:627-631` (Fabric: «no hay registro de que la recorriera afirmación por afirmación. Lo declaro como desviación»; Databricks: «las 106 verificadas venían aprobadas de entrada»; Snowflake: «comando que le dejé copiado»);
    - `:589` y `:594` (el comando de las 84, armado por el constructor y en el portapapeles de la persona);
    - `:747-771` («Desviación del plan» no lo recoge).
  - Afirmaciones que lo contradicen:
    - `docs/GUIA-DE-PRUEBA.html:130-131` («Ya aprobado en el S2: … afirmación por afirmación»);
    - `docs/MANUAL-DE-USO.md:23`, `:193`, `:213`, `:377`;
    - `data/plataformas/fabric.yaml:1` (hermana que añade el consolidador).
- **Qué está mal:**
  - la orden (`:145`) exige tres paradas «afirmación por afirmación» y que se registren con fecha;
  - la aprobación fue humana (la persona corrió cada comando en su terminal, y el candado lo garantiza), pero no hay evidencia de revisión por afirmación en Databricks ni en Fabric;
  - los documentos afirman lo contrario, sobre la promesa central de la regla dura 2.
- **Evidencia:**
  - las líneas citadas de la bitácora;
  - por la hora de modificación de los archivos, entre el último `verificacion.json` y el mapa escrito hubo 8 min en Databricks (106 afirmaciones), 16 min en Snowflake (143) y 3 min en Fabric (84). Es una cifra indicativa.
- **Ajuste ejecutable:**
  1. **Textos.** Se aplican siempre, porque son ciertos en cualquier caso:

     | Lugar                              | Texto nuevo                                                                                                                                                                        |
     | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
     | Guía `:130-131`                    | «Los mapas de Databricks (106 afirmaciones), Snowflake (143) y Fabric v0.2.0 (84), aprobados por una persona, con la decisión sobre cada afirmación registrada (2026-10-04, UTC).» |
     | Manual ES `:22-23`                 | «… viene de documentación pública del fabricante, con fecha, y lo aprobó una persona; cada afirmación lleva su cita y su decisión registrada.»                                     |
     | Manual ES `:192-193`               | «… y una persona lo aprobó; la decisión sobre cada afirmación queda registrada.»                                                                                                   |
     | Manual EN `:212-213`               | «… and a person approved it; every claim carries its quote and its recorded decision.»                                                                                             |
     | Manual EN `:376-377`               | «… and a person approved it; the decision on each claim is on record.»                                                                                                             |
     | `data/plataformas/fabric.yaml:1-2` | `# Microsoft Fabric: su mapa lo propuso /investigar y lo aprobó una persona (data/revisiones/fabric.jsonl).` y `# Publicada desde el S1; v0.2.0 en el S2.`                         |

     Si la persona responde **sí** a la pregunta, la guía puede conservar «afirmación por afirmación».

  2. **Desviación.** Agregar el ítem en «Desviación del plan», según S2-AUD-12, ítem 15.
  3. **Regla operativa** en la bitácora y en el summary («Sugerencias de mejora al método»): «El comando de aprobación sale solo de la pantalla de revisión: el constructor no lo arma, no lo copia y no lo pega.»
- **Decide la persona:** «¿Leíste una por una, en la pantalla de revisión, las afirmaciones de Databricks, Snowflake y Fabric antes de correr cada comando de aprobación?»
  - **Si dice sí** (para las tres): se registra con fecha en la bitácora y se cierra la desviación.
  - **Si dice no**, o no para alguna: la desviación queda declarada en el ítem 15, con la respuesta y su fecha.
- **Ajuste verificado si:**
  - `grep -n "afirmación por afirmación\|claim by claim" docs/MANUAL-DE-USO.md docs/GUIA-DE-PRUEBA.html data/plataformas/*.yaml` solo devuelve líneas que describen la pantalla de revisión, o la parada B del S1 (que sí fue por afirmación);
  - la bitácora tiene la respuesta de la persona con su fecha.

#### S2-AUD-09 · Medio · Ninguna prueba muerde la huella de las versiones archivadas, y la bitácora registra un rojo que no pudo ocurrir (C-4)

- **Dónde:**
  - `src/lib/investigador/aprobados.ts:33` (`r.huella === h`);
  - `tests/unit/mapas-aprobados.test.ts:31-50`;
  - bitácora `sprints/SPRINT_002-implementation-log.md:428`;
  - rama sin prueba `scripts/aprobar.mjs:42-44` («ya existe con otro contenido»).
- **Qué está mal:** la prueba de `:31-50` archiva la versión `0.0.1`, que no está en ninguna revisión. Así falla por la versión, con o sin la comparación de huella. Al quitar `&& r.huella === h`, las tres pruebas siguen en verde: el «rojo» de la fila `:428` (mutación «huella sin comparar») no pudo darse. Además, la rama que se niega a sobrescribir un archivo existente con otros bytes no tiene prueba (`git grep "otro contenido" -- tests` vacío).
- **Evidencia:**
  - mutación de C en una copia: `Tests 3 passed (3)`;
  - el consolidador lo confirmó leyendo el código: con la mutación, la condición sigue siendo falsa para `0.0.1`.
- **Ajuste ejecutable:**
  1. En `tests/unit/mapas-aprobados.test.ts`, dentro del `describe`, agregar:
     ```ts
     it("una palabra cambiada a mano en una versión archivada lo rompe (la huella, no la versión)", () => {
       const otra = mkdtempSync(join(tmpdir(), "bigd-archivada-"));
       try {
         cpSync("data", otra, { recursive: true });
         const v = [...cargarDatos().versiones.values()].flat()[0]!;
         const ruta = join(
           otra,
           "mapas/versiones",
           v.archivo.split("/").at(-1)!,
         );
         const texto = readFileSync(ruta, "utf8");
         const i = texto.indexOf("lider:");
         writeFileSync(
           ruta,
           texto.slice(0, i) +
             texto.slice(i).replace(/(es: )(\S)/, "$1Casi $2"),
         );
         const f = mapasSinAprobacion(cargarDatos(otra), otra);
         expect(f).toEqual([
           expect.stringContaining(
             `${v.archivo} · no es la versión ${v.version} que aprobó una persona`,
           ),
         ]);
       } finally {
         rmSync(otra, { recursive: true, force: true });
       }
     });
     ```
  2. En `tests/unit/investigador/scripts.test.ts`, buscar el `it` que prueba el archivo de la versión anterior (`grep -n "archiva" tests/unit/investigador/scripts.test.ts`) y copiarlo como un caso nuevo. Justo antes de la aprobación que cambia de versión, escribir `data/mapas/versiones/<id>-<versión vigente>.mapa.yaml` en la raíz temporal, con bytes distintos de los del mapa vigente. El caso debe esperar:
     - `status` 1;
     - que stderr contenga «ya existe con otro contenido»;
     - que `data/mapas/<id>.mapa.yaml` conserve sus bytes.
  3. Corregir la fila `:428` de la bitácora: la mutación «huella sin comparar» la nombra la prueba nueva del paso 1, no «una versión archivada que no aprobó nadie…».
- **Ajuste verificado si:**
  - la prueba del paso 1 se pone roja al quitar `&& r.huella === h` de `aprobados.ts:33` y verde al restaurar;
  - la del paso 2 se pone roja al quitar la comparación `.equals(bytes)` de `aprobar.mjs:43` y verde al restaurar.

  Esa mutación se hace en el archivo, sin ejecutar el script fuera de la prueba.

- **Demo en rojo:** las dos mutaciones del criterio, registradas en la bitácora.

#### S2-AUD-10 · Medio · La migración da un solo salto y las versiones archivadas no tienen salida ante el próximo contrato o la próxima gramática (C-5)

- **Dónde:**
  - `src/lib/datos/migrar.ts:10-27`;
  - `src/lib/datos/cargar.ts:203-207` (validación de las archivadas);
  - `src/lib/investigador/aprobados.ts:29-38`;
  - `decisions/map-versioning.md:34-36`.
- **Qué está mal:**
  1. **Un solo salto.** `migradoDesde` solo migra si `COMPATIBLES[menor(v)] === menor(CONTRATO_VERSION)` (`migrar.ts:21`). Cuando el motor suba a 0.5 y se declare `"0.4": "0.5"`, la archivada `fabric-0.1.0` (contrato 0.3.0) no sube: V1 la rechaza y el build se rompe.
  2. **Sin salida.** Puede llegar un MINOR de gramática, una regla nueva, o un cambio del motor que haga fallar V16 sobre texto viejo. Entonces una archivada inválida no tiene cauce legal:
     - no se edita (son bytes aprobados);
     - no se reinvestiga (es historia);
     - no se borra (`aprobados.ts:36-38` exige que esté archivada).
  3. **El ADR dice otra cosa.** El ADR (`:35`) dice «raises `contrato_version` only when the document validates the same». El código sube siempre que el salto esté declarado; el comentario de `migrar.ts:5-6` es el correcto.
- **Evidencia:** lectura del código, confirmada por el consolidador. Hoy el riesgo no se materializa: C cargó la base en 2027-2030 sin fallas.
- **Ajuste ejecutable:**
  1. **Migración encadenada.** En `src/lib/datos/migrar.ts`, reemplazar `migradoDesde` y `migrarContrato` por:
     ```ts
     /** Sube el documento por la cadena de saltos declarados hasta `destino`; si la cadena no llega, lo deja igual (V1 lo nombrará). */
     export function migrar<T>(
       dato: T,
       compatibles: Readonly<Record<string, string>>,
       destino: string,
     ): T {
       const v = (dato as { contrato_version?: unknown } | null)
         ?.contrato_version;
       if (typeof v !== "string" || menor(v) === menor(destino)) return dato;
       let m = menor(v);
       for (
         let i = 0;
         i < Object.keys(compatibles).length && m !== menor(destino);
         i++
       ) {
         const sig = compatibles[m];
         if (sig === undefined) return dato;
         m = sig;
       }
       return m === menor(destino)
         ? ({ ...(dato as object), contrato_version: destino } as T)
         : dato;
     }
     /** ¿De qué versión viene el documento, si hubo que migrarlo? `undefined` si ya estaba en la del motor o no hay cadena. */
     export function migradoDesde(dato: unknown): string | undefined {
       return migrar(dato, COMPATIBLES, CONTRATO_VERSION) === dato
         ? undefined
         : (dato as { contrato_version: string }).contrato_version;
     }
     export function migrarContrato<T>(dato: T): T {
       return migrar(dato, COMPATIBLES, CONTRATO_VERSION);
     }
     ```
     En `tests/unit/datos-migrar.test.ts`, agregar:
     - `migrar({ contrato_version: "0.3.0" }, { "0.3": "0.4", "0.4": "0.5" }, "0.5.0").contrato_version` igual a `"0.5.0"`;
     - con `{ "0.3": "0.4" }` y `"0.5.0"`, el mismo objeto;
     - con `"0.5.0"` de origen, el mismo objeto.
  2. **Salida declarada para las archivadas.** El constructor la implementa y la declara en el ADR:
     - **Cargador.** En `src/lib/datos/cargar.ts`, en el bucle de las archivadas (`:203-207`), cuando una versión, con el YAML legible, el nombre bien formado y su plataforma publicada, **no valida** con el contrato vigente: no se empuja a `fallas`. Se guarda en `historicas: Map<string, { version: string; archivo: string; motivos: string[] }[]>`, un campo nuevo de `Datos`, con sus líneas de error como `motivos`. Un YAML roto o un nombre mal formado siguen rompiendo la carga.
     - **Aprobación.** En `src/lib/investigador/aprobados.ts:31-38`, recorrer `[...archivadas, ...historicas]` para la comparación de huella y para «ninguna aprobada falta». La integridad la siguen garantizando los bytes.
     - **Página de versiones.** En `src/lib/atlas/versiones.ts`, un par cuyo lado anterior sea histórico no dibuja. Muestra una línea de i18n:
       - `atlas.versiones.historica`: «v{version}: aprobada y archivada; las reglas de hoy ya no la dibujan.»;
       - EN: «v{version}: approved and archived; today's rules no longer draw it.»

       Es mirada de TEXTO: «maquetado, no visto».

     - **Gate.** En `tests/unit/datos.test.ts`, agregar `expect([...cargarDatos().historicas.values()].flat()).toEqual([])`, con el comentario «Hoy ninguna: si una versión pasa a histórica, es una decisión que se registra en la bitácora y se cambia esta prueba en el mismo commit». Así, que una versión pase a histórica nunca ocurre en silencio.
     - **Caso con datos.** En una copia de `data/`, cambiar `contrato_version` de la archivada a `0.2.0`. Esperar: `cargarDatos(copia)` no lanza y `historicas.get("fabric")` trae un motivo `V1`. `mapasSinAprobacion(cargarDatos(copia), copia)` debe dar exactamente una falla, la de huella de ese archivo: al cambiar sus bytes ya no es la versión aprobada. Eso prueba que la integridad también cubre las históricas.
  3. **ADR.** En `decisions/map-versioning.md:35`, reemplazar por: «raises `contrato_version` along the chain of jumps the CHANGELOG declares compatible; the validation of the new version decides the rest». Agregar una «Decision 6: archived versions that today's contract cannot validate become _historic_: listed, fingerprint-checked, not drawn; the build fails only if their bytes changed. Today there are none, and a test says so.».
- **Ajuste verificado si:**
  - las pruebas nuevas de `datos-migrar.test.ts` están en rojo con el código de un salto y en verde con la cadena;
  - la prueba de `historicas` vacías pasa;
  - el caso de la copia pasa;
  - el ADR coincide con el código.
- **Demo en rojo:** la de la cadena. Para el gate de `historicas`, forzar la copia del caso y ver que la aserción «hoy ninguna» falla si se apunta a esa copia.

#### S2-AUD-11 · Medio · El ADR de la CSP no describe el `style-src` que se publica (D-6)

- **Dónde:**
  - `decisions/csp-static-export.md:25` (la política), `:39-50` («Gates») y `:52-56` («Consequences»);
  - el código: `scripts/csp/inyectar.mjs:9-12`, `:37`, `:106`.
- **Qué está mal:** el ADR dice que `style-src` lleva «that page's hashes». Desde la fase 2, cada página lleva las huellas de los `<style>` en línea **de todo el sitio**, para la navegación sin recarga. Es una ampliación de una política de seguridad que no consta en su ADR, y el gate de navegación de `csp.spec` tampoco figura en «Gates». El ADR se escribió en este sprint.
- **Evidencia:** el comentario de `inyectar.mjs:9-12` («Los estilos en línea de TODAS las páginas van en la política de cada una») y la línea de log `:106` («… en el sitio»).
- **Ajuste ejecutable:**
  - En `:25`, reemplazar la frase de `script-src`/`style-src` por: «`script-src` with `'self'` plus that page's hashes; `style-src` with `'self'` plus the hashes of the inline `<style>` of **every page of the site**: a client-side navigation inserts the next page's `<style>` under the first page's policy (S2, phase 2). Scripts stay per page: React does not execute an inline `<script>` it inserts on the client.»
  - En «Gates», agregar: «`tests/e2e/csp.spec.ts` also walks the level tabs of every published platform in both languages without reloading and demands zero violations. It was seen red with the injector without the site's style hashes: four routes named `style-src-elem · inline`.»
  - En «Consequences», agregar: «The style allowance is site-wide; the script allowance is per page.»
- **Ajuste verificado si:** el texto del ADR coincide con `inyectar.mjs:9-12` y `:37`, y el rojo citado figura en la bitácora. Si no figura, citar la línea de la bitácora que lo registra o anotarlo como corrida nueva.

#### S2-AUD-12 · Medio · «Desviación del plan», «Enmiendas al contrato» y «Fallas del diagramador» están incompletas o son inexactas (D-3, A-12, D-20)

- **Dónde:**
  - `sprints/SPRINT_002-implementation-log.md:747-771`; el ítem 9 (`:770`) cita `toCompareCSS`, que no existe (`grep -rn toCompareCSS packages src` = 0);
  - el summary, por escribir.
- **Qué está mal:**
  - la sección solo trae las desviaciones del momento del plan (1–9); lo que se desvió después vive repartido o falta, y `CLAUDE.md` («Las dos casas») pide que viva ahí;
  - las extensiones del paquete frente a § 4.8, § 5.6 y § 8 no están juntas, y las «Enmiendas» no llevan `archivo:línea`;
  - las fallas del diagramador de este sprint no tienen síntoma y causa para el registro (regla 7).
- **Ajuste ejecutable:**
  1. **Reescribir el ítem 9 (`:770`):** «**Extensiones del contrato** que van a «Enmiendas»: filas independientes (`part: "header" | "rows"`) y dos variantes prerenderizadas por fila (`Geometria.variante`; `toCompareCSS` no se construyó: tras M1, una regla CSS alterna las dos variantes, ADR `compare-in-the-engine`), `marks` y `diffToText` (D-S2-08), y el estado del lado a lado en la URL.»
  2. **Agregar a «Desviación del plan»**, con el estado que tengan tras la Fase 2:

     | #   | Desviación                                                                                                                                                                                                       | Dónde está hoy                                                                          |
     | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
     | 10  | M1 cambió la forma de D-S2-06: de «una banda a la vez» a «un solo botón despliega y contrae todo»                                                                                                                | bitácora `:174-191`                                                                     |
     | 11  | El lado a lado no lleva insignias de vigencia. El estado va en palabras en el rótulo de la fila («v0.1.0 · por revisar · 34 días»), sin la marca dibujada que piden § 4.8 y G7; la forma la vio la persona en M2 | bitácora `:272-276`                                                                     |
     | 12  | A 1280 px el lado a lado se desliza (rejilla de 1496 u)                                                                                                                                                          | bitácora `:437-439`                                                                     |
     | 13  | Nota de marcas                                                                                                                                                                                                   | pagada en la auditoría (S2-AUD-05)                                                      |
     | 14  | El kit trae una v0.0.9 sintética de la Plataforma Ejemplo en lugar de «los tres mapas y Fabric v0.1.0»; esos viven en `data/` y el bloque J de la guía los usa                                                   | bitácora `:713-717`                                                                     |
     | 15  | Aprobación sin evidencia de revisión por afirmación (Databricks: verificadas aprobadas de entrada; Snowflake y Fabric: comando armado y copiado por el constructor), con la respuesta de la persona              | `:627-631`; S2-AUD-08                                                                   |
     | 16  | ⭐⭐ = 4 frente al ~6 de la orden                                                                                                                                                                                | pagada en la auditoría (S2-AUD-15), o decisión de la persona                            |
     | 17  | Archivos de la orden que no existen: `packages/diagramador/src/svg/compare.ts` (lo serializa `toSVG`) y `src/components/lado-a-lado/*` (está en `src/components/atlas/Lado.tsx`)                                 | orden `:91`; `SPRINT_002.md:183`, `:186`                                                |
     | 18  | Excepción del aviso de `braces` en el audit                                                                                                                                                                      | bitácora `:317-335`; `pnpm-workspace.yaml:18-26`; `tests/unit/avisos-ignorados.test.ts` |
     | 19  | § 12 no se verificó durante el sprint                                                                                                                                                                            | S2-AUD-13                                                                               |

  3. **En el summary, sección «Enmiendas al contrato del diagramador»**, una fila por ítem: § del contrato · qué hace el paquete · razón · `archivo:línea`.

     | Enmienda                                                                                 | `archivo:línea`                                                          |
     | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
     | `compare`: `part`, `n`/`page`, `marks`, `texts.lado`                                     | `packages/diagramador/src/layout/compare.ts:52-60`                       |
     | `Geometria.variante`                                                                     | `compare.ts:661`; `src/layout/tipos.ts:80`                               |
     | `agingDates` exportado                                                                   | `src/index.ts:5`; `src/validar/v16.ts:17`                                |
     | `validate` con `texts` y `queryDate`                                                     | `src/validar/index.ts:21-29`                                             |
     | V16 sin `texts`: aviso en privado y error en publicación (si S2-AUD-19 se paga)          | `src/validar/index.ts:43`                                                |
     | `toSVG` sin `texts` (§ 8 la pide; los títulos llegan hechos desde `layout`)              | `src/svg/toSVG.ts`                                                       |
     | Avisos `texto:` y `pistas: <x> corre bajo la punta de <y>`                               | `src/layout/tipos.ts:14`; `src/layout/d11.ts:111`                        |
     | Punta de flecha medida en 9 u (el contrato dice 8)                                       | `src/layout/d11.ts:97-98`                                                |
     | Lado a lado sin insignias de vigencia (§ 4.8, G7 del semáforo)                           | `compare.ts` (rótulo de la fila)                                         |
     | Plural elegido por `n === 1` fijo (§ 8 pide plurales «como dato por idioma»)             | `src/layout/contexto.ts` (`plural`)                                      |
     | Paths de diferencia fuera de § 5.4                                                       | `compare.ts` (`<defs>` del lado a lado)                                  |
     | `diffToText`                                                                             | `src/texto/diffToText.ts:25`                                             |
     | `diff` no ve cambios de texto ni de fuentes (la app los cuenta aparte)                   | `src/lib/atlas/versiones.ts:11`, `:32`, `:120-125`                       |
     | Contradicción § 4.5 frente a § 8 (`textos`/`fechaConsulta` contra `texts`/`queryDate`)   | `CONTRATO.md:239` frente a `:493-501`                                    |
     | Vistas `nivel1`/`nivel2`                                                                 | `CONTRATO.md:488`                                                        |
     | Inconsistencias A1 (V16) y C10 (V3) de las carnadas                                      | `test/carnadas.test.ts:27-32`, `:38-40`                                  |
     | § 12: entidades `bloque` y `paso`                                                        | S2-AUD-13                                                                |
     | Las fuentes de un mapa no llevan `conflicto_de_interes` (solo las citas de la propuesta) | esquema del mapa en el contrato; `src/lib/investigador/esquema.ts:17-21` |
     | P13 (pistas bajo la punta), en su forma mínima                                           | `src/layout/rutas.ts:182-263`                                            |
     | `Cruce` exportado con dos nombres                                                        | `src/index.ts:8`, `:17` (S2-AUD-21)                                      |
     | Recorte profundo de las fuentes                                                          | `decisions/lcp-budget-by-profile.md:35`                                  |

  4. **En el summary, sección «Fallas del diagramador (al registro)»**: síntoma · causa · regla · prueba o carnada que la cubre.
     - Insignias del lado a lado que se salían (44, 75, 22 y 30 avisos).
     - Las 4 puntas de P13 en P1 y Fabric.
     - Píldoras de marca que se metían en la columna vecina.
     - El `diff` que no ve cambios de texto ni de fuentes (Fabric v0.1.0 → v0.2.0 = «sin diferencias»).
     - Además, las que destapó esta auditoría:
       - marcas perdidas con `n`/`page` (S2-AUD-02);
       - «sin bloque» sobre una banda vacía (S2-AUD-16);
       - ids duplicados con un mapa repetido, y `compare([])` (S2-AUD-17);
       - avisos de filas fundidos (S2-AUD-20);
       - comparador de bandas no total (S2-AUD-23).
- **Ajuste verificado si:**
  - `grep -n toCompareCSS sprints/SPRINT_002-implementation-log.md` solo devuelve líneas que dicen que no se construyó;
  - «Desviación del plan» tiene los ítems 10-19, cada uno con su `archivo:línea` o su ID de hallazgo;
  - el summary trae las dos secciones con todos los ítems y su `archivo:línea`.

#### S2-AUD-13 · Medio · § 12 del contrato no se verificó contra el investigador, y difiere en las entidades (D-4)

- **Dónde:**
  - la orden (`ordenes/SPRINT_002-orden.md:66`): «§ 12 … verifica que coincide»;
  - `packages/diagramador/CONTRATO.md:567-568` («cada una sobre una entidad (`{ entidad, id }`: nodo, flujo, bloque, paso)»);
  - `src/lib/investigador/esquema.ts:27` y `:41` (`entidad: z.enum(["nodo", "flujo"])`).
- **Qué está mal:** la bitácora no menciona § 12 (`grep "§ 12"` vacío). En consecuencia, los bloques (`nombre`, `lider`) y los pasos del recorrido (`que_pasa`, `lider`, `experto`) entran al mapa aprobado sin afirmación con cita propia.
- **Ajuste ejecutable (registro; no se toca código salvo que la persona lo pida):**
  1. Agregar a la bitácora (fase 4) un párrafo «§ 12 contra el piloto», con las viñetas de `CONTRATO.md:567-580` contrastadas:
     - cita literal verificada por código ✓;
     - aprobar o rechazar por afirmación, con cascada ✓;
     - retiro con motivo y cita ✓;
     - «sin novedades» ✓;
     - validación en publicación a cuatro edades antes de aprobar ✓;
     - entidades ✗ (solo `nodo` y `flujo`).
  2. En el summary, «Enmiendas al contrato del diagramador»: «§ 12 lista `bloque` y `paso` como entidades de una afirmación; el piloto solo cita `nodo` y `flujo` (`src/lib/investigador/esquema.ts:27`, `:41`). Propuesta: que § 12 declare los bloques y los pasos como agrupación y narración editoriales, sin cita, o que el piloto los cite desde el S3.»
- **Ajuste verificado si:** el párrafo y la enmienda existen con sus `archivo:línea`.

#### S2-AUD-14 · Medio · Las extensiones del design system del S2 no tienen ADR (D-5)

- **Dónde:**
  - falta `decisions/design-system-s2-extensions.md` (el patrón del S1 es `decisions/design-system-s1-extensions.md`);
  - `design-system.md:169` (canoniza el conmutador «Ver: bloques / componentes», que M1 retiró);
  - `design-system.md:282-283` (deuda ya pagada);
  - la orden, `:179`: «fiel a la maqueta y al design system (extensiones por ADR)».
- **Qué está mal:** solo el botón «Desplegar todo» está en un ADR (`compare-in-the-engine`). El resto vive suelto en la bitácora como «decisiones menores». La fuente de verdad sigue describiendo lo que el producto ya no hace, mientras `design-sync/` ya muestra el botón.
- **Ajuste ejecutable:** crear `decisions/design-system-s2-extensions.md` con el formato del S1 y una fila por extensión. Cada fila dice su estado de mirada:

  | #   | Extensión                                                                                                                               | Mirada                                             |
  | --- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
  | 1   | Botón «Desplegar todo / Contraer todo» arriba a la derecha; reemplaza el conmutador de `design-system.md:169` y el despliegue por banda | Visto en M1 y M2                                   |
  | 2   | El lado a lado siempre en la rejilla de componentes (1496 u): a 1280 px se desliza                                                      | Visto en M2                                        |
  | 3   | Sin insignias de vigencia en el lado a lado; el estado va en palabras en el rótulo de la fila                                           | Visto en M2 (forma); enmienda a § 4.8 en S2-AUD-12 |
  | 4   | En el teléfono, las tarjetas son las de `toBlockCards`                                                                                  | Decidido, viaja al gate del ciclo                  |
  | 5   | Leyenda y lectura en texto en `/comparar`                                                                                               | Decidido                                           |
  | 6   | El rótulo de la fila en la letra del cuerpo, medido con la mono                                                                         | Decidido                                           |
  | 7   | Una píldora por clase de diferencia; «retirado» en la fila anterior                                                                     | Decidido                                           |
  | 8   | «Lo que dicen los componentes» y «Sin cambios en el dibujo» en `/versiones`: estructura nueva, clasificada TEXTO por D-S2-10            | Viaja a j5 (⭐⭐)                                  |
  | 9   | Envía y recibe horizontales (§ 5.4; la maqueta los dibuja ↑/↓)                                                                          | Decidido                                           |

  Cerrar el ADR con la nota: «`design-system.md:169` y `:282-283` quedaron desfasados: el selector filtra en producto, y la nota de marcas y el selector se diseñaron en el S1; la planeadora lo pliega en la próxima versión del design system». Citar el ADR en `design-sync/README.md:5-6` (ver S2-AUD-44).

- **Ajuste verificado si:** el ADR existe; la bitácora y el summary lo citan; cada fila dice su estado de mirada.

#### S2-AUD-15 · Medio · El ⭐⭐ deja fuera h6 y h7 con razones que contradicen su propia regla de selección (D-1)

- **Dónde:** `docs/GUIA-DE-PRUEBA.html`:
  - `:116-121` (cabecera del ⭐⭐);
  - `:320` (h6) y `:323` (h7);
  - las marcas «Parada N de 4» en `:189`, `:208`, `:214` y `:356`.
- **Qué está mal:** la regla 11 dice: «si el CI lo verifica por otro camino, NO entra».
  - **h6** queda fuera «porque su forma ya pasó tu mirada». Pero M2 fue de FORMA y la hizo la persona, no alguien sin formación técnica. El veredicto de h6 (si se entiende) solo puede ser humano.
  - **h7** queda fuera «porque las e2e lo prueban a 380 px». Pero b11, con las mismas e2e, sí entra, y M2 no se hizo en el teléfono.

  La orden (`:191`) y `SPRINT_002.md:8` estiman «~6 paradas»: son b1, b9, b11, h6, h7 y j5.

- **Ajuste ejecutable:**
  1. En `:320` y `:323`, agregar `data-corto` al `<li>` de h6 y de h7, y la marca `<span class="minimo">⭐⭐ Parada N de 6</span>`, como en `:189`.
  2. Renumerar en el orden del documento:
     - b1, 1 de 6 (`:189`);
     - b9, 2 de 6 (`:208`);
     - b11, 3 de 6 (`:214`);
     - h6, 4 de 6;
     - h7, 5 de 6;
     - j5, 6 de 6 (`:356`).
  3. En la cabecera `:116-121`, reemplazar por: «**Gate corto ⭐⭐: 6 paradas · ~20 min — es el que el cierre del ciclo exige.** Solo lo que únicamente una persona puede juzgar. Deja fuera 1 prueba ⭐, y sigue entera en el filtro ⭐: VoiceOver (b8), porque la lectura en texto la verifica el código por otro camino (equivale al mapa nodo a nodo y pasa axe en los dos temas). Para caber en ~20 min, h6 se hace con la misma persona de b1, y h7 con el mismo teléfono de b11, en la misma sentada.»
- **Ajuste verificado si:** `tests/unit/guia-de-prueba.test.ts` queda en verde (paradas 1..6 en orden; la cabecera coincide con los filtros) y el filtro «Gate corto» muestra 6.
- **Nota:** si la persona prefiere 4 paradas al ver la guía, la exclusión se reescribe como su decisión por el techo de tiempo, no por el CI, y se registra. No se le pregunta ahora: es un ajuste menor, regido por la regla.

### Bajos

#### S2-AUD-16 · Bajo · La banda vacía de `compare` no tiene prueba, y en el nivel 2 rotula «sin bloque» (A-4)

- **Dónde:**
  - `packages/diagramador/src/layout/compare.ts:320-343` (`vacia()`), `:370` y `:383-390`;
  - las líneas 321-342, 370 y 384-388 están sin cubrir.
- **Qué está mal:**
  - ningún caso ejecuta la ruta de la plataforma que no cubre una capa;
  - en el nivel 2, la celda dibuja «sin bloque» sobre «sin componentes»;
  - el texto de `vacia()` no se mide.
- **Evidencia:** la sonda 3 de A, re-corrida: `{"ia":2} avisos 0 | … sin bloque</tspan> … vacia-ia`.
- **Ajuste ejecutable:**
  1. En `compare.ts:383-390`, en la rama `!es.length` del nivel 2, cambiar el `dibujar` por `dibujar: (x, y) => [vacia(ctx, b, { x, y: y + ac, w: col, h: NODO_H })],`.
  2. En `vacia()` (`:335-340`), medir el texto en lugar de `unaLinea`:
     ```ts
     lineasPorIdioma(
       ctx,
       Object.fromEntries(
         ctx.idiomas.map((l) => [l, ctx.textos[l]!.lado.sinComponentes]),
       ),
       12,
       400,
       caja.w - 240,
       1,
       `vacia ${b.id}`,
     );
     ```
  3. En `test/compare.test.ts`, agregar un `it` con el ejemplo sin la banda `ia`. Hay que quitar sus nodos, bloques, flujos y pasos de recorrido, como en la sonda 3 de A. El `it` prueba `levelByBand` `undefined`, `{}` e `{ ia: 2 }` y afirma:
     - `geo.avisos` igual a `[]`;
     - el SVG contiene `vacia-ia` y `aria-label="Inteligencia artificial: sin componentes"`;
     - con `{ ia: 2 }`, el SVG no contiene `>sin bloque<`.
- **Ajuste verificado si:** la prueba pasa; esas líneas quedan cubiertas; los 44 golden no cambian.

#### S2-AUD-17 · Bajo · Precondiciones de `compare` sin verificar (A-5, más un caso de la consolidación)

- **Dónde:** `packages/diagramador/src/layout/compare.ts:97-121` (`filasDe`) y `:444-449`.
- **Qué está mal:**
  1. Un mapa repetido (mismo `sujeto_id` y versión) da ids duplicados (D12).
  2. Con el mismo sujeto y distinta versión, sin `marks`, el orden sale del orden de llegada (el `sort` empata): reordenar la entrada cambia los bytes (regla 5).
  3. `page` sin `n` se ignora en silencio.
  4. `levelByBand` acepta valores distintos de 1 y 2 (con 3, `variante` sale `"n1"`).
  5. **(consolidación)** `compare([])` no falla: devuelve una geometría de 11 900 × 760 sin filas, con el título «Lado a lado: ».
- **Evidencia:** sonda de A re-corrida:
  - `ids 55 unicos 45`;
  - `page sin n -> filas 4`;
  - `nivel3 ok, variante n1`;
  - `vacio 11900 760 0 lado {"es":"Lado a lado: ",…}`.
- **Ajuste ejecutable** (paga también S2-AUD-02 y S2-AUD-18):
  1. En `compare.ts`, cambiar `import type { Diferencias } from "../diff";` por `import { diff, type Diferencias } from "../diff";`.
  2. Agregar, antes de `filasDe`:
     ```ts
     const compararVersion = (a: string, b: string): number => {
       const x = a.split(".").map(Number),
         y = b.split(".").map(Number);
       return x[0]! - y[0]! || x[1]! - y[1]! || x[2]! - y[2]!;
     };
     ```
  3. Reemplazar el cuerpo de `filasDe`, desde el principio hasta `const ordenados = …` incluido (`:102-113`), por:
     ```ts
     if (!maps.length)
       throw new Error("compare: no hay ningún mapa que comparar");
     for (const m of maps)
       if (m.gramatica_id !== grammar.id)
         throw new Error(
           `compare: «${m.sujeto_id}» es de la gramática «${m.gramatica_id}» y se compara con «${grammar.id}» (§ 4.4)`,
         );
     const vistos = new Set<string>();
     for (const m of maps) {
       const k = `${m.sujeto_id}@${m.version}`;
       if (vistos.has(k))
         throw new Error(
           `compare: «${m.sujeto_id}» v${m.version} llega dos veces`,
         );
       vistos.add(k);
     }
     if (o.page !== undefined && o.n === undefined)
       throw new Error("compare: «page» pide «n»");
     if (o.marks) {
       if (maps.length !== 2)
         throw new Error(
           "compare: las marcas de diferencia comparan exactamente dos mapas, el anterior y el nuevo",
         );
       if (o.n !== undefined || o.page !== undefined)
         throw new Error(
           "compare: las marcas de diferencia dibujan las dos versiones en una sola página (sin «n» ni «page»)",
         );
       const [a, b] = maps as [Mapa, Mapa];
       if (a.sujeto_id !== b.sujeto_id)
         throw new Error(
           `compare: las marcas comparan dos versiones del mismo sujeto («${a.sujeto_id}» y «${b.sujeto_id}»)`,
         );
       if (JSON.stringify(diff(a, b)) !== JSON.stringify(o.marks))
         throw new Error("compare: «marks» no es diff(maps[0], maps[1])");
     }
     const ordenados = o.marks
       ? [...maps]
       : [...maps].sort(
           (a, b) =>
             compararCodigo(a.sujeto_id, b.sujeto_id) ||
             compararVersion(a.version, b.version),
         );
     ```
     El resto de `filasDe`, desde `if (o.n === undefined) return ordenados;`, no cambia.
  4. Tras la línea 448 (el bucle que valida las bandas de `levelByBand`), agregar:
     ```ts
     for (const [id, v] of Object.entries(options.levelByBand ?? {}))
       if (v !== 1 && v !== 2)
         throw new Error(
           `compare: el nivel de «${id}» es 1 o 2 (llegó ${String(v)})`,
         );
     ```
  5. En `test/compare.test.ts`, en el `describe` «N del consumidor, prefijos y errores», agregar:
     ```ts
     expect(() => compare([LADO[0]!, LADO[0]!], G, base)).toThrow(
       /llega dos veces/,
     );
     expect(() => compare(LADO, G, { ...base, page: 2 })).toThrow(/pide «n»/);
     expect(() =>
       compare(LADO, G, {
         ...base,
         levelByBand: { ia: 3 } as unknown as Record<string, 1 | 2>,
       }),
     ).toThrow(/es 1 o 2/);
     expect(() => compare([], G, base)).toThrow(/ningún mapa/);
     const otra = { ...structuredClone(ANTES), version: "0.3.0" };
     expect(toSVG(compare([otra, ANTES], G, base), { language: "es" })).toBe(
       toSVG(compare([ANTES, otra], G, base), { language: "es" }),
     );
     ```
- **Ajuste verificado si:**
  - las afirmaciones pasan y cada una está en rojo sin su línea;
  - los 44 golden quedan iguales;
  - `tests/unit/lado.test.ts`, `tests/unit/versiones.test.ts` y `packages/diagramador/test/v16.test.ts` siguen en verde.

#### S2-AUD-18 · Bajo · `marks` no comprueba que sea `diff(maps[0], maps[1])` (A-6)

- **Dónde:** `packages/diagramador/src/layout/compare.ts:59` y `:107-113`.
- **Qué está mal:** con las marcas en el orden invertido, o con mapas de sujetos distintos, dibuja marcas falsas sin error.
- **Evidencia:** sonda de A re-corrida: `sujetos distintos aceptado [ 'piloto-denso', 'plataforma-ejemplo' ]`; el orden invertido pone «renombrado» y «madurez» en la fila v0.1.0.
- **Ajuste ejecutable:** está incluido en el código de `filasDe` de S2-AUD-17 (las líneas `a.sujeto_id !== b.sujeto_id` y `JSON.stringify(diff(a, b)) !== …`). En `test/compare.test.ts`, agregar:
  ```ts
  expect(() =>
    compare([DESPUES, ANTES], G, { ...base, marks: diff(ANTES, DESPUES) }),
  ).toThrow(/no es diff/);
  expect(() =>
    compare([LADO[1]!, DESPUES], G, { ...base, marks: diff(ANTES, DESPUES) }),
  ).toThrow(/mismo sujeto/);
  ```
- **Ajuste verificado si:** las pruebas pasan; los golden `lado.diferencias*` no cambian; `tests/unit/versiones.test.ts` sigue en verde (la app llama con `[antes, despues]` y `diff(antes, despues)`, en `src/lib/atlas/versiones.ts:88-91`).

#### S2-AUD-19 · Bajo · V16 en modo publicación falla abierto si faltan las `texts` (A-7)

- **Dónde:**
  - `packages/diagramador/src/validar/index.ts:43` (A citaba `:41-42`; la línea real es la 43);
  - `test/v16.test.ts:92-96`, que consagra el comportamiento.
- **Qué está mal:** en publicación, sin `texts`, V16 no dibuja y solo deja un aviso: el mapa pasa sin haberse dibujado, contra § 7 («en modo `publicacion` el validador dibuja…»). Hoy la app siempre pasa `texts` (`src/lib/datos/cargar.ts:163`, `:205`; `src/lib/investigador/aprobar.ts:168`), así que el riesgo es para un segundo consumidor.
- **Ajuste ejecutable:**
  1. En `index.ts:43`, reemplazar por:
     ```ts
     if (!options.texts)
       (options.mode === "publicacion" ? errores : avisos).push(
         v16(
           "V16 no corrió: no se entregaron las cadenas de interfaz para dibujar (texts)",
         ),
       );
     ```
  2. En `test/v16.test.ts:92-96`, cambiar el `it` para que, en publicación, espere ese mensaje en `inf.errores.map((e) => e.mensaje)`. Agregar el caso `privado`, que lo deja en `avisos`.
  3. En `test/densidad.test.ts:21`, pasar `texts: TEXTOS` (ya importado): `validate(P1, G, { mode: "publicacion", coverage: COBERTURA, texts: TEXTOS })`.
  4. No cambian `test/validar-piloto.test.ts:12` ni `test/recorrido-orden.test.ts:20`: esos mapas tienen errores y V16 no corre. Tampoco `test/carnadas.test.ts:46`, que ya pasa `texts`.
  5. Agregar la línea a «Enmiendas» (S2-AUD-12).
- **Ajuste verificado si:** `pnpm exec vitest run packages/diagramador` y `pnpm test` quedan en verde, y la prueba nueva está en rojo con el código anterior.

#### S2-AUD-20 · Bajo · El `id` de un aviso no siempre es un elemento, y en `compare` se funden los avisos de distintas filas (A-8)

- **Dónde:**
  - `packages/diagramador/src/layout/piezas.ts:59`, `:68` (avisos `texto`, con frases como id);
  - `compare.ts:508-510` (la fila 0 comparte el contexto `base`);
  - `compare.ts:643-645` (deduplica por `mensaje`, sin prefijo de fila).
- **Evidencia:** sonda de A re-corrida. Dos mapas con el mismo bloque largo dan `avisos 2 [["nombre de origen","texto: nombre de origen (es): 9 líneas; caben 2"], …]`: un solo par, sin saber de qué plataforma es.
- **Ajuste ejecutable:**
  1. En `compare.ts:508-510`, reemplazar por `const ctxs = filas.map((m) => contexto(m, grammar, options, "compare"));`. `base` queda para la cabecera y § 5.6.
  2. Reemplazar `:643-645` por:
     ```ts
     const avisos: Aviso[] = [...base.avisos];
     ctxs.forEach((c, k) => {
       const p = pres[k]!;
       for (const a of c.avisos) {
         const id =
           a.id === p || a.id.startsWith(`${p}/`) ? a.id : `${p}/${a.id}`;
         if (!avisos.some((x) => x.id === id && x.mensaje === a.mensaje))
           avisos.push({ ...a, id });
       }
     });
     ```
  3. En `src/layout/tipos.ts`, en el JSDoc de `Aviso.id`, escribir: «el elemento que lo causa, o la descripción del texto (`texto`) o del canal (`canal`)».
  4. En `test/compare.test.ts`, agregar un `it` con `LADO[0]` y una copia con otro `sujeto_id`, cuyo primer bloque tenga un nombre de 9 líneas. Debe afirmar 4 avisos `texto`, 2 por fila, cada uno con el prefijo de su fila.
- **Ajuste verificado si:**
  - la prueba pasa;
  - los 44 golden no cambian (`contexto` es puro);
  - V16, `src/lib/investigador/validar.ts` y `sinAvisos` de `src/lib/atlas/lado.ts` siguen en verde (solo leen `mensaje`);
  - el `toEqual` de S2-AUD-03 se ajusta al formato nuevo si cambia.

#### S2-AUD-21 · Bajo · Campos de la geometría con otra semántica en `compare`, sin documentar y sin lector; un tipo con dos nombres (A-9)

- **Dónde:**
  - `packages/diagramador/src/layout/tipos.ts:88` (`filas[].banda`, que en `compare` guarda el prefijo del mapa);
  - `:98-103` (`vigencia.elementos`, que en `compare` lista filas; 0 lectores de la de `compare` en `src/`, `tests/` y `scripts/`);
  - `src/index.ts:8` (`Cruce as CruceGeo`, 0 lectores; `Cruce` ya sale en `:17`).
- **Ajuste ejecutable:**
  1. En el JSDoc de `tipos.ts:88`, agregar: «En `compare`, una fila por mapa: `banda` es el prefijo del mapa (D12).»
  2. En el JSDoc de `vigencia` (`:98-103`), agregar: «En `compare`, `elementos` es una entrada por fila (su prefijo) y `dias` el peor de todas.»
  3. En `test/compare.test.ts`, afirmar sobre `compare(LADO, G, base).vigencia`: `elementos.map((e) => e.id)` igual a los prefijos en orden de `sujeto_id`, y `dias` igual al máximo.
  4. En `src/index.ts:8`, quitar `Cruce as CruceGeo,`.
- **Ajuste verificado si:** `pnpm typecheck` y `pnpm test` quedan en verde, y `grep -rn CruceGeo src tests packages` da 0.

#### S2-AUD-22 · Bajo · La regla del haz y el detector P13 no tienen prueba que los vea fallar (A-10)

- **Dónde:**
  - `packages/diagramador/src/svg/leyenda.ts:42` y `test/texto.test.ts:40-51` (no busca el haz);
  - `src/layout/d11.ts:111-133` y `test/densidad.test.ts:168` (solo afirma `puntas(g)` igual a `[]`).
- **Ajuste ejecutable:**
  1. En `test/texto.test.ts`, tras la línea 51 (dentro del mismo `it`), agregar:
     ```ts
     expect(h).toContain(
       `<p class="dg-leyenda-haz">${TEXTOS[idioma]!.leyenda.haz}</p>`,
     );
     ```
  2. En `test/densidad.test.ts`, dentro del `describe` de P13, agregar:
     ```ts
     it("el detector ve una pista ajena bajo una punta", () => {
       const g = {
         trazados: [
           {
             id: "llega",
             origen: "a",
             destino: "b",
             puntos: [
               [0, 1000],
               [500, 1000],
             ],
           },
           {
             id: "ajena",
             origen: "c",
             destino: "d",
             puntos: [
               [460, 800],
               [460, 1200],
             ],
           },
         ],
       } as unknown as Geometria;
       expect(puntas(g)).toEqual([{ flujo: "llega", pista: "ajena" }]);
     });
     ```
     El consolidador verificó a mano esta geometría contra `d11.ts:111-133`: la punta va de x 410 a 500, y la pista ajena en x 460 cruza y 1000.
- **Ajuste verificado si:** las dos pruebas pasan; la del haz se pone roja al quitar el `<p class="dg-leyenda-haz">` de `leyenda.ts:42`; la de `puntas`, si `puntas` devuelve `[]`.

#### S2-AUD-23 · Bajo · El comparador de orden de bandas de `diffToText` no es total con tres clases (A-11)

- **Dónde:** `packages/diagramador/src/texto/diffToText.ts:31`.
- **Qué está mal:** `a.clase === b.clase ? a.orden - b.orden : a.clase === "capa" ? -1 : 1` devuelve 1 en los dos sentidos entre `carril` y `transversal`. Es un comparador inconsistente, y el orden puede variar entre motores (G1).
- **Ajuste ejecutable:** reemplazar la línea 31 por:
  ```ts
  const CLASE = { capa: 0, carril: 1, transversal: 2 } as const;
  const ordenBanda = new Map(
    [...grammar.bandas]
      .sort(
        (a, b) =>
          CLASE[a.clase] - CLASE[b.clase] ||
          a.orden - b.orden ||
          compararCodigo(a.id, b.id),
      )
      .map((b, i) => [b.id, i]),
  );
  ```
  Importar `compararCodigo` de `../util/orden` si no está. Agregar en `test/compare.test.ts` un `it` con la gramática `prueba-procesos`, en la que una versión quita un nodo y `diffToText` no lanza.
- **Ajuste verificado si:** las pruebas «diffToText — …» siguen con las mismas 4 líneas, y la rama queda cubierta.

#### S2-AUD-24 · Bajo · La tarjeta `componentes-s2/lado-a-lado.html` del bundle repite 112 ids (B-3)

- **Dónde:** `scripts/design-sync/bundle.ts:96` (`${lado(false)}${lado(true)}` en un mismo HTML) y `:218-226`.
- **Evidencia:** barrido del consolidador: 112 ids repetidos en esa tarjeta y 0 en las otras ocho.
- **Ajuste ejecutable:**
  1. En `bundle.ts:218-226`, partir la tarjeta en dos entradas, cada una con su fuente:
     - `["componentes-s2/lado-a-lado.html", "Componentes · S2", "Lado a lado", lado(false), …]`;
     - `["componentes-s2/lado-a-lado-desplegado.html", "Componentes · S2", "Lado a lado · desplegado", lado(true), …]`.
  2. En `tests/unit/design-sync.test.ts`, dentro del `it` «cada tarjeta abre con su marca @dsCard…» y tras la comprobación de `@import|url\(`, agregar:
     ```ts
     const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
     expect(ids.length, `${ruta}: ids repetidos`).toBe(new Set(ids).size);
     ```
  3. Correr `node scripts/design-sync/generar.mjs`.
- **Ajuste verificado si:** antes del paso 1 la prueba nueva está en rojo y nombra `components/componentes-s2/lado-a-lado.html`; después, `design-sync.test.ts` está en verde y ninguna tarjeta repite ids.
- **Demo en rojo:** la del criterio.

#### S2-AUD-25 · Bajo · axe nunca mira `/comparar` desplegado ni con la ficha abierta (B-4)

- **Dónde:** `tests/e2e/reduced-motion.spec.ts:93-106` (solo el estado inicial) y `tests/e2e/lado.spec.ts`.
- **Ajuste ejecutable:**
  1. En `tests/e2e/lado.spec.ts`, agregar `import AxeBuilder from "@axe-core/playwright";`.
  2. Al final del archivo, agregar:
     ```ts
     for (const [esquema, tema] of [
       ["dark", "oscuro"],
       ["light", "claro"],
     ] as const)
       test(`axe con todo desplegado y la ficha abierta (${tema})`, async ({
         page,
         isMobile,
       }) => {
         await page.emulateMedia({ colorScheme: esquema });
         await page.goto("/es/comparar");
         await listo(page);
         const boton = page.locator(
           isMobile ? ".lado-angosto .lado-todo" : ".lado-ancho .lado-todo",
         );
         await boton.click();
         await expect(boton).toHaveAttribute("aria-expanded", "true");
         if (!isMobile)
           await abrir(
             page.locator('.lado-fila [data-variante="n2"] .dg-nodo').first(),
             page.locator("#panel-ficha"),
           );
         const serias = (
           await new AxeBuilder({ page }).analyze()
         ).violations.filter(
           (v) => v.impact === "critical" || v.impact === "serious",
         );
         expect(
           serias,
           JSON.stringify(
             serias.map((v) => [v.id, v.nodes.map((n) => n.target)]),
           ),
         ).toEqual([]);
       });
     ```
- **Ajuste verificado si:** pasa en desktop-chromium y en mobile-chromium.
- **Demo en rojo:** cambiar por un momento `aria-controls={controla}` por `aria-controls="no-existe"` en `Lado.tsx:119-120`; axe falla con `aria-valid-attr-value`. Restaurar y registrar.

#### S2-AUD-26 · Bajo · «Sin volver a dibujar» se comprueba contando SVG, y eso también pasa con el defecto (B-5)

- **Dónde:** `tests/e2e/lado.spec.ts:20` y `:46-47`.
- **Ajuste ejecutable:**
  1. Cambiar la línea 20 por:
     ```ts
     const svgs = await page.locator(".lado-ancho svg").evaluateAll((ss) => {
       ss.forEach((s, i) => ((s as unknown as { __n: number }).__n = i));
       return ss.length;
     });
     ```
  2. Cambiar la línea 47 por:
     ```ts
     expect(
       await page
         .locator(".lado-ancho svg")
         .evaluateAll((ss) =>
           ss.map((s) => (s as unknown as { __n?: number }).__n),
         ),
     ).toEqual([...Array(svgs).keys()]);
     ```
- **Ajuste verificado si:** sigue en verde con el código de hoy.
- **Demo en rojo:** agregar por un momento `key={estado.pagina}` al `<div className="lado-filas">` de `Lado.tsx:187`; la prueba falla. Restaurar y registrar.

#### S2-AUD-27 · Bajo · La única comprobación e2e de «al salir, el `<html>` queda limpio» vive en una prueba que hoy siempre se salta (B-6)

- **Dónde:** `tests/e2e/lado.spec.ts:127-138`. Se salta con «todas publicadas» (las 4 están `publicada`); la aserción de `:136-137` es independiente de «próximamente».
- **Qué está mal:** la regla 15 dice que `skipped` no es verde, y la bitácora la cita como el gate que nombró la mutación «sin limpiar el `<html>`».
- **Ajuste ejecutable:**
  1. En la prueba «el idioma conserva la consulta…», después de la línea 124 (`expect(await filasVisibles(page))…`), agregar:
     ```ts
     // Al salir sin recargar (Link de Next), el <html> ya no guarda el estado del lado a lado.
     await page.locator(".niveles a", { hasText: "Visión general" }).click();
     await expect(page).toHaveURL(/\/es\/atlas\/[^/]+$/);
     expect(
       await page.evaluate(() => [
         document.documentElement.hasAttribute("data-lado"),
         document.documentElement.hasAttribute("data-lado-elegidas"),
       ]),
     ).toEqual([false, false]);
     ```
  2. Borrar las líneas 136-137 de la prueba que se salta.
- **Ajuste verificado si:** la comprobación corre en desktop-chromium (no aparece como `skipped`) y queda en verde.
- **Demo en rojo:** comentar por un momento la limpieza de `Lado.tsx:86-93`, reconstruir y ver `[true, true]`. Restaurar y registrar.

#### S2-AUD-28 · Bajo · La constante de la vista `POR_PAGINA` está copiada a mano en las e2e (B-7)

- **Dónde:** `tests/e2e/lado.spec.ts:9` (`const POR_PAGINA = 3;`) y `tests/e2e/g11.spec.ts:92`, `:97` (el literal `3`, tres veces).
- **Qué está mal:** es la constante de la vista, no N de plataformas, así que no es Alto. Pero tiene dos fuentes, y la regla 4 la quiere declarada una vez (`src/lib/atlas/estado-lado.ts:8`).
- **Ajuste ejecutable:**
  1. En `lado.spec.ts:9`, poner `import { POR_PAGINA } from "../../src/lib/atlas/estado-lado";`. El módulo no tiene imports.
  2. En `g11.spec.ts`, importar lo mismo y reemplazar `/ 3`, `* 3` y `pagina * 3` (`:92`, `:97`) por `POR_PAGINA`.
- **Ajuste verificado si:** `grep -nE "(/|\*) 3\b|= 3;" tests/e2e/*.ts` no devuelve nada, y `g11` y `lado` siguen en verde.

#### S2-AUD-29 · Bajo · La nota del selector dice «con más, se pagina» también en el teléfono, donde no hay paginación (D-9)

- **Dónde:**
  - `src/lib/i18n/es.ts:155` y `en.ts:155` (`atlas.lado.orden`);
  - se muestra en `src/components/atlas/Lado.tsx:135`, y `src/styles/lado.css:17-18` oculta `.paginacion` por debajo de 900 px.
- **Ajuste ejecutable:**
  - **ES:** «Orden por identificador, el mismo en los dos idiomas: ninguna va primero por ser quien es. En pantalla ancha se comparan hasta {n} a la vez y, con más, se pagina; en el teléfono van todas, una banda a la vez. Al menos una queda elegida.»
  - **EN:** «Ordered by identifier, the same in both languages: none goes first for being who it is. On a wide screen up to {n} compare at once and more than that paginates; on a phone they all show, one band at a time. At least one stays chosen.»
  - Es mirada de TEXTO: registrar «maquetado, no visto».
- **Ajuste verificado si:** las pruebas de i18n y `design-sync.test` siguen en verde (si `design-sync` pide regenerar, regenerar).

#### S2-AUD-30 · Bajo · El rótulo «validador: N reintentos» quedó sin aclarar, contra lo que prometió la fase 3 (D-15)

- **Dónde:**
  - la promesa, en la bitácora `:495-498` y `:632-633`;
  - `src/lib/i18n/es.ts:241`, `en.ts:241`, `tipos.ts:150`;
  - `src/lib/investigador/revision.ts:67-68`, `:188`, `:211`;
  - `src/app/[idioma]/investigador/[plataforma]/page.tsx:136`.
- **Ajuste ejecutable:**
  1. En `revision.ts`, dentro de `PropuestaVista`, agregar `/** Reintentos que declara la corrida (`ejecucion.reintentos`). */ reintentosDeclarados: number;`. En `:188`, poner `reintentosDeclarados: 0`, y en `:211`, `reintentosDeclarados: p?.ejecucion.reintentos ?? 0`.
  2. En `tipos.ts:150`, agregar `reintentosDeclarados: readonly [string, string];`.
  3. Textos:
     - en `es.ts:241`, `reintentos: ["validador al cerrar: {n} bloqueo", "validador al cerrar: {n} bloqueos"]` y `reintentosDeclarados: ["la corrida declara {n} reintento", "la corrida declara {n} reintentos"]`;
     - en `en.ts:241`, `["validator at the end: {n} block", "validator at the end: {n} blocks"]` y `["the run reports {n} retry", "the run reports {n} retries"]`.
  4. En `page.tsx:136`, agregar tras la línea `plural(t.propuesta.reintentos, p.reintentos),` esta otra: `plural(t.propuesta.reintentosDeclarados, p.reintentosDeclarados),`.
  5. Prueba unitaria en el archivo que hoy prueba `revision.ts` (`grep -rln "reintentos" tests/unit`): con `.reintentos` en 0 y `ejecucion.reintentos` en 2, la vista lleva los dos números.
- **Ajuste verificado si:** la prueba pasa y la pantalla de revisión muestra los dos rótulos. Es mirada de TEXTO.

#### S2-AUD-31 · Bajo · El atlas de Snowflake, el mapa más denso, no entra al Lighthouse de la CI (D-16)

- **Dónde:** `lighthouse-urls.json:1-20`. Snowflake tiene 21 componentes frente a 19 de Databricks y Fabric.
- **Ajuste ejecutable:**
  1. Agregar `"/es/atlas/snowflake"` y `"/en/atlas/snowflake/componentes"` a `lighthouse-urls.json`.
  2. Medir en local como en la bitácora `:733-744` (Lighthouse 13.4.1, mediana de 3) y registrar la cifra en la bitácora y en el summary.
- **Ajuste verificado si:** `lighthouse` queda en `success` en el PR con las URLs nuevas, y la cifra de Snowflake está en el summary, por debajo de 2900 ms.

#### S2-AUD-32 · Bajo · La CSP en el preview real se verificó solo de forma indirecta (D-17)

- **Dónde:** DoD de Seguridad de la orden (`:162`: «CSP verificada en el preview»); bitácora `:100-112`.
- **Qué está mal:**
  - el `vercel build` sin conexión usó un `.vercel/project.json` escrito a mano;
  - M2 probó que la página funciona, no que el `<meta>` esté.

  El riesgo es bajo: el mismo `pnpm build` inyecta la meta, y las e2e la exigen sobre `out/`.

- **Ajuste ejecutable:**
  1. El constructor intenta primero leer el log del build del preview, sin escribir su URL en el repo. Puede usar `vercel inspect <deployment> --logs` (si la CLI tiene sesión) o el enlace de Vercel de `gh pr checks 5`, y buscar la línea `csp: … páginas`. Registra esa línea con su fecha en la bitácora.
  2. Si no puede, hace la pregunta a la persona.
- **Decide la persona** (solo si el paso 1 no fue posible): «Abre el preview del PR #5 en /es/atlas/fabric, pulsa Cmd+Opt+U y busca con Cmd+F "Content-Security-Policy": ¿aparece?»
- **Ajuste verificado si:** la bitácora registra la comprobación en el preview real, con su fecha.

#### S2-AUD-33 · Bajo · La regla 12 (una ficticia solo cita dominios reservados) no se aplica a las versiones archivadas (C-6)

- **Dónde:** `src/lib/datos/cargar.ts:170-176`, que solo cubre el mapa vigente, y el bucle de las archivadas en `:187-212`.
- **Evidencia:** C cambió las 14 URL de la muestra del kit a `docs.snowflake.com` en una copia, y cargó sin fallas.
- **Ajuste ejecutable:**
  1. Extraer las líneas 171-176 a una función del mismo archivo:
     ```ts
     /** Regla 12 (cero datos reales): una plataforma ficticia solo cita dominios reservados para ejemplos (B-46). */
     function fuentesDeFicticia(
       mapa: Mapa,
       archivo: string,
       fallas: string[],
     ): void {
       mapa.nodos.forEach((n, i) =>
         n.fuentes.forEach((f, k) => {
           if (!esDominioDeEjemplo(f.url))
             fallas.push(
               `${archivo} · /nodos/${i}/fuentes/${k}/url · ${n.id} · una plataforma ficticia solo cita dominios reservados (example.org, *.invalid…)`,
             );
         }),
       );
     }
     ```
     Llamarla en `:171` con `if (p.ficticia) fuentesDeFicticia(mapa, archivo, fallas);`. Llamarla también tras la comprobación de `/version` de las archivadas (antes de `versiones.set`), con `if (vigente.plataforma.ficticia) fuentesDeFicticia(mapa, archivo, fallas);`.
  2. En `tests/unit/datos.test.ts`, en «versiones archivadas», agregar un caso. En una copia de `data/`, escribir `mapas/versiones/plataforma-ejemplo-0.0.1.mapa.yaml` a partir del mapa vigente de la Plataforma Ejemplo, con `version: 0.0.1` y la primera URL cambiada a `https://docs.databricks.com/x`. La carga debe fallar con una línea que empiece por `data/mapas/versiones/plataforma-ejemplo-0.0.1.mapa.yaml · /nodos/0/fuentes/0/url ·` y contenga «una plataforma ficticia solo cita dominios reservados».
- **Ajuste verificado si:** la prueba está en rojo sin la llamada nueva y en verde con ella.

#### S2-AUD-34 · Bajo · Ningún gate comprueba que la propuesta citada por cada revisión siga siendo la aprobada (C-7)

- **Dónde:** `src/lib/investigador/esquema.ts:91-99` (`esquemaRevision`, sin `propuesta_sha256`).
- **Qué está mal:** las afirmaciones, las citas y `conflicto_de_interes` solo viven en `propuestas/<carpeta>/`. Una edición a mano de `propuesta.json` o de `verificacion.json` pasaría sin ruido. Hoy todo coincide: lo verificaron C y la consolidación.
- **Ajuste ejecutable:** crear `tests/unit/propuestas-aprobadas.test.ts`. Para cada línea de cada `data/revisiones/*.jsonl` de una plataforma no ficticia, comprobar:
  1. la carpeta `propuestas/<propuesta>` existe;
  2. `verificacion.json.propuesta_sha256` es igual al SHA-256 de los bytes de `propuesta.json`;
  3. todo id de `aprobadas` y `rechazadas` es el `id` de una afirmación de esa propuesta;
  4. con `rechazadas` vacías, el mapa publicado o archivado de esa `mapa_version` es igual a `propuesta.mapa` en JSON canónico (`src/lib/investigador/canonico.ts`). Antes de comparar se quitan, en los dos, `estado`, `version`, `fecha_actualizacion` y el `fecha_verificacion` de cada nodo: son las mismas claves que la aprobación reescribe (`src/lib/investigador/aprobar.ts:62-72`).

  La prueba no llama al núcleo de la aprobación.

  Opcional, hacia adelante: un `propuesta_sha256` opcional en `esquemaRevision`, escrito por `aprobar.ts:181-189`. Cambia el núcleo humano: solo si la persona lo pide.

- **Ajuste verificado si:** la prueba está en verde hoy y en rojo al cambiar un carácter de una cita en una copia.
- **Demo en rojo:** esa mutación.

#### S2-AUD-35 · Bajo · La skill describe V16 como era en 0.3.0 (C-8)

- **Dónde:** `.claude/skills/investigar/SKILL.md:89-93`.
- **Qué está mal:** dice «hoy y en los días en que el mapa pasará a "por revisar" y a "vencido"». Desde 0.4.0 son cuatro edades (+100 días, `packages/diagramador/src/validar/v16.ts:22`), y también se dibuja la fila del lado a lado (`v16.ts:44-45`).
- **Ajuste ejecutable:** reescribir el paso así: «…el validador dibuja (V16) el nivel 1, el nivel 2, cada recorrido, la ventana de cada bloque y la fila del lado a lado (contraída y desplegada), en cuatro edades: hoy, el día en que pasa a "por revisar", el día en que vence y +100 días…». En `tests/unit/investigador/skill.test.ts`, agregar `expect(skill).toContain("cuatro edades")` y `expect(skill).toContain("lado a lado")`.
- **Ajuste verificado si:** la prueba está en rojo con el texto viejo y en verde con el nuevo.

#### S2-AUD-36 · Bajo · `/versiones` cuenta como «fuentes renovadas» los cambios de solo la fecha de consulta: dice 19 donde son 9 (C-9, y la parte de D-8 sobre «las fuentes de todos»)

- **Dónde:**
  - `src/lib/atlas/versiones.ts:123-125`;
  - `tests/unit/versiones.test.ts:100` (`toBe(19)` fija el defecto);
  - la guía, `docs/GUIA-DE-PRUEBA.html:345` (j1: «se renovaron las fuentes de 19»);
  - el manual, `docs/MANUAL-DE-USO.md:183-184` («seis textos y las fuentes de todos») y `:367-368` («everyone's sources»);
  - la bitácora, `:651` («las fuentes de los 19»).
- **Qué está mal:** compara `n.fuentes` entero, con su `fecha`, que la skill pone en el día de cada corrida. Con cualquier reinvestigación, «Las fuentes no cambiaron» (`src/lib/i18n/es.ts:196`) queda inalcanzable. La aprobación ya ignora esa fecha (`src/lib/investigador/aprobar.ts:70`, M-22).
- **Evidencia:** el cálculo del consolidador da 19 con la fecha y 9 sin ella: `bases-operacionales`, `almacenamiento-externo`, `espejo`, `trabajo-copia`, `base-espejada`, `onelake`, `seguridad-onelake`, `app-metricas` y `airflow`.
- **Ajuste ejecutable:**
  1. En `versiones.ts:123-125`, comparar sin la fecha:
     ```ts
     fuentes: siguen.filter(
       (n) => canonico(n.fuentes.map((f) => ({ ...f, fecha: "" }))) !== canonico(previos.get(n.id)!.fuentes.map((f) => ({ ...f, fecha: "" }))),
     ).length,
     ```
  2. En `tests/unit/versiones.test.ts:100`, poner `toBe(9)`. Agregar un caso con un par que solo difiere en `fuentes[].fecha`: debe dar `fuentes` 0 y mostrar «Las fuentes no cambiaron».
  3. Guía, j1 (`:345`): «… y se renovaron las fuentes de 9».
  4. Manual ES (`:183-184`): «(el texto de seis componentes y las fuentes de nueve)». Manual EN (`:367-368`): «(the text of six components and the sources of nine)».
  5. Si `design-sync.test` pide regenerar (la tarjeta de diferencias usa versiones sintéticas), regenerar.
- **Ajuste verificado si:**
  - la prueba nueva está en rojo con la comparación de hoy;
  - `versiones.test.ts` queda en verde con 9;
  - `out/es/atlas/fabric/versiones.html` dice «Se renovaron las fuentes de 9 componentes»;
  - `grep -n "everyone's\|fuentes de todos\|fuentes de 19" docs/` no da nada.

#### S2-AUD-37 · Bajo · En la versión de muestra del kit, «Cuadernos interactivos» habla de canalizaciones declarativas (C-10)

- **Dónde:** `scripts/kit-de-prueba/versiones.mjs:28-29`. El nodo `cuadernos` es un clon de `canalizacion-declarativa` con otro `id`, `orden` y `nombre`, y la prueba j4 de la guía lo abre.
- **Ajuste ejecutable:**
  1. En el `push` de la línea 29, dar a `cuadernos` sus propios `lider`, `experto` y `por_que_importa` `{ es, en }`, redactados y de ≤ 50 palabras. Por ejemplo, el líder: «Hojas donde un equipo escribe y prueba código sobre los datos, paso a paso.» / «Pages where a team writes and tries code on the data, step by step.»
  2. Quitar `terminos` si no aplican.
  3. Regenerar con `node scripts/kit-de-prueba/versiones.mjs`.
- **Ajuste verificado si:** `tests/unit/kit-de-prueba.test.ts` queda en verde con los bytes nuevos, y en el YAML de la muestra el líder de `cuadernos` es distinto del de `canalizacion-declarativa`.

#### S2-AUD-38 · Bajo · Databricks y Snowflake, ya publicadas, conservan el comentario de «próximamente» (C-11)

- **Dónde:** `data/plataformas/databricks.yaml:1` y `data/plataformas/snowflake.yaml:1`. La aprobación solo reescribe la línea de estado (`scripts/aprobar.mjs:56`).
- **Ajuste ejecutable:** reemplazar la línea 1 de cada archivo. No son mapas aprobados, así que se editan:
  - `# Databricks: su mapa lo propuso /investigar y lo aprobó una persona (data/revisiones/databricks.jsonl). Publicada en el S2.`;
  - el mismo texto para Snowflake.

  **Sin «afirmación por afirmación»**: ver S2-AUD-08.

- **Ajuste verificado si:** `grep -l "próximamente" data/plataformas/*.yaml` no devuelve ninguna plataforma con `estado: publicada`.

#### S2-AUD-39 · Bajo · El verificador da «no verificable» a una página que sí contiene la cita (C-12)

- **Dónde:** `scripts/verificar-citas.mjs:16` (agente propio) y `:32` (sin reintento).
- **Qué está mal:** GlobeNewswire corta HTTP/2 ante el agente del verificador (`curl: (92)`). A-43 y A-74 de Snowflake quedaron «no verificables» y se aprobaron como excepción humana. La aprobación está justificada: C comprobó con `curl` que el texto existe.
- **Ajuste ejecutable:**
  1. En `verificar-citas.mjs`, en `bajar()`, si `curl` sale con código 92 o 56, reintentar una vez con `--http1.1` y, si sigue fallando, sin `-A`.
  2. Registrar en el resultado de cada cita `reintento: "http1.1" | "sin-agente"` cuando aplique.
  3. Agregar una prueba con un servidor local que cierre la conexión según el `User-Agent`.
- **Ajuste verificado si:** al correr el verificador sobre `propuestas/2026-10-04-snowflake` con salida a una carpeta temporal, sin tocar los archivos de la propuesta, A-43 y A-74 salen «verificada». Anotarlo en «Sugerencias» del summary.

#### S2-AUD-40 · Bajo · Higiene del cargador de versiones (C-13)

- **Dónde:**
  - `src/lib/datos/cargar.ts:187` (ignora en silencio lo que no termina en `.mapa.yaml`);
  - `:192` (pone como ejemplo `fabric-0.1.0.mapa.yaml`, un nombre real en `src/lib/datos`);
  - `tests/unit/datos.test.ts:177` (cuenta los archivos sin filtrar: un `.DS_Store` la rompe).
- **Ajuste ejecutable:**
  1. En `cargar.ts:187`, listar todo menos lo que empieza por `.`; lo que no cumpla `VERSIONADO` ya cae en la falla «nombre» de `:192`.
  2. En `:192`, cambiar el ejemplo a `plataforma-ejemplo-0.1.0.mapa.yaml`.
  3. En `datos.test.ts:177`, filtrar con `.filter((f) => f.endsWith(".mapa.yaml"))`.
  4. Agregar un caso que cree `versiones/fabric-0.0.1.mapa.yml` en una copia y espere la falla «nombre».
- **Ajuste verificado si:** el caso nuevo está en rojo antes del paso 1, y `grep -n "fabric" src/lib/datos/cargar.ts` da 0.

#### S2-AUD-41 · Bajo · Cifras y requisitos desfasados en dos ADRs (D-7)

- **Dónde:**
  - `decisions/compare-in-the-engine.md:68` (2765 ms y 401 KB: la medida de la fase 2, con dos plataformas);
  - `:10-11` («and one on a phone»);
  - `decisions/lcp-budget-by-profile.md:38` (en futuro).
- **Ajuste ejecutable:**
  - **`compare-in-the-engine.md:68`:** «**Measured** (Lighthouse 13.4.1, median of 3, local, 2026-10-04, four platforms): `/es/comparar` LCP 2783 ms, CLS 0, TBT 11 ms, 469 KB (phase 2, two published platforms: 2765 ms, 401 KB).»
  - **`:10-11`:** «Three at a time on a wide screen, a declared constant of the view that paginates beyond; on a phone, one band at a time with every chosen platform stacked.»
  - **`lcp-budget-by-profile.md:38`:** «4. Measured again at the end of S2 (2026-10-04, local, median of 3): `/es/comparar` 2783 ms, `/es/atlas/fabric/versiones` 2613 ms, `/es/atlas/fabric` 2478 ms, `/es/atlas/databricks` 2465 ms. All are under the 2900 ms budget and the 3.0 s ceiling.» Sumar la de Snowflake (S2-AUD-31).
- **Ajuste verificado si:** `grep -n "is measured again\|one on a phone" decisions/` queda vacío, y `2765` solo aparece como cifra de la fase 2.

#### S2-AUD-42 · Bajo · El manual dice «Este primer ciclo construye el mapa común» (D-8)

- **Dónde:** `docs/MANUAL-DE-USO.md:188-189` (ES) y `:372-373` (EN).
- **Ajuste ejecutable:**
  - **ES:** «**¿Big-D recomienda una plataforma?** Todavía no. Hasta ahora Big-D construyó el mapa común: el atlas de cada plataforma, el lado a lado y las versiones de cada mapa. La comparación con evidencia, pesos y riesgos llega en los próximos sprints de este ciclo.»
  - **EN:** «**Does Big-D recommend a platform?** Not yet. So far Big-D has built the shared map: each platform's atlas, side by side and the versions of each map. The comparison with evidence, weights and risks comes in the next sprints of this cycle.»
- **Ajuste verificado si:** `grep -n "Este primer ciclo\|This first cycle" docs/MANUAL-DE-USO.md` queda vacío.

#### S2-AUD-43 · Bajo · El README del kit nombra bloques equivocados y no dice dónde viven los mapas reales (D-10, C-3 punto 4)

- **Dónde:** `docs/kit-de-prueba/README.md:3-4` («bloques F e I») y `:9` («(block F)»). El kit sirve a F (f2–f7) y a J (j4); I no usa kit.
- **Ajuste ejecutable:**
  - `:3-4`: «Los usa la guía de prueba (`docs/GUIA-DE-PRUEBA.html`, bloques F y J)».
  - `:9`: «The test guide (blocks F and J) uses them».
  - En la sección de las versiones de muestra (§ 4), agregar: «Los tres mapas reales y Fabric v0.1.0 viven en `data/` (`data/mapas/`, `data/mapas/versiones/`); el bloque J de la guía los usa. Esta muestra sintética existe para ver las cuatro marcas, que el par real de Fabric no tiene.»
- **Ajuste verificado si:** `grep -n "F e I\|block F)" docs/kit-de-prueba/README.md` queda vacío, y la línea nueva existe.

#### S2-AUD-44 · Bajo · El README de `design-sync/` no lista lo del S2 (D-11)

- **Dónde:** `design-sync/README.md:5-6` y `:15-22`.
- **Ajuste ejecutable:**
  - En `:15`, escribir «Las hojas del producto tal cual: tokens (generados y medidos), base, diagrama, atlas, lado a lado y versiones».
  - Tras `:22`, agregar una fila por cada tarjeta S2 que exista tras S2-AUD-24: `lado-a-lado.html`, `lado-a-lado-desplegado.html` y `diferencias-entre-versiones.html`, cada una con su grupo («Componentes · S2») y qué muestra.
  - En `:5-6`, agregar «y del S2 (`decisions/design-system-s2-extensions.md`)» (S2-AUD-14).
- **Ajuste verificado si:** la tabla tiene una fila por cada archivo de `design-sync/components/**`.

#### S2-AUD-45 · Bajo · `/deploy-check` atribuye la matriz de `compare` a una prueba que no la tiene (D-12)

- **Dónde:** `.claude/commands/deploy-check.md:135-137`. `packages/diagramador/test/envejecer.test.ts` no menciona `compare` ni `lado` (0 coincidencias); la matriz de `compare` está en `test/compare.test.ts:291`.
- **Ajuste ejecutable:** reemplazar por: «Big-D: `packages/diagramador/test/envejecer.test.ts` (cada mapa del contrato a cuatro edades, en todas sus vistas), `packages/diagramador/test/compare.test.ts` («compare — matriz de envejecimiento») y `tests/unit/atlas-vigencias.test.ts` (cada página, también `/comparar` y `/versiones`, en cada fecha), con la perilla `BIGD_FECHA_CONSULTA`.»
- **Ajuste verificado si:** cada archivo citado contiene lo que la casilla le atribuye.

#### S2-AUD-46 · Bajo · Guía: el ejemplo de h4 apunta a la página 2, y h6 se aparta de la ⭐ que fija la orden (D-13)

- **Dónde:**
  - `docs/GUIA-DE-PRUEBA.html:316` (h4: «por ejemplo «Ingesta · Snowflake»»; Snowflake está en la página 2);
  - `:320` (h6 pide «una persona» y «qué trae cada una»; la orden, en `:188`, pide «una persona sin formación técnica» y «en qué capa difieren»).
- **Ajuste ejecutable:**
  - h4: «(por ejemplo «Ingesta · Databricks»; Snowflake está en la página 2)».
  - h6: «Pídele a **una persona sin formación técnica** que compare dos plataformas en el lado a lado, sin explicarle nada, y que te diga **en qué capa difieren**. Esperado: lo lee por columnas (una banda, todas las plataformas) y nombra al menos una banda donde difieren y qué trae cada una ahí. Anota dónde se traba.»
  - Al cambiar el texto de h6, su origen pasa a seguir siendo «Nuevo · S2».
- **Ajuste verificado si:** `tests/unit/guia-de-prueba.test.ts` queda en verde y el texto de h6 coincide con la orden.

#### S2-AUD-47 · Bajo · Faltan dos registros en la bitácora (D-18)

- **Dónde:** `sprints/SPRINT_002-implementation-log.md`.
  - La orden (input 5) pide confirmar el `beforeSend` del kit; el código lo cumple (`instrumentation-client.ts:26` → `eventoSinContenido`; `tests/unit/observability.test.ts`), pero no está registrado.
  - La CI de `6d375de` quedó en rojo (`quality` por `braces`; `e2e` y `lighthouse` en `skipped`) y no se registró. Sí están `8c6f980` (`:319`) y `9604802` (`:139`).
- **Ajuste ejecutable:**
  - Una línea en la fase 0: «`beforeSend` del kit v1.33.0 confirmado: `instrumentation-client.ts:26` → `eventoSinContenido` (`src/lib/observability.ts`), con su prueba».
  - Otra en la fase 1: «CI de `6d375de`: el mismo rojo que `8c6f980` (`braces`), el mismo arreglo; `gh pr checks` no se leyó tras ese push».
- **Ajuste verificado si:** las dos líneas existen.

#### S2-AUD-48 · Bajo · La regla dura 4 de `CLAUDE.md` describe el teléfono distinto de la orden y del producto (D-19)

- **Dónde:** `CLAUDE.md:77` («tres a la vez en ancho y una en teléfono»). El producto muestra en el teléfono una banda a la vez, con todas las plataformas elegidas apiladas.
- **Ajuste ejecutable:** no se edita `CLAUDE.md`, porque es texto de la planeadora. En el summary, en «Sugerencias de mejora al método», escribir: «Regla 4: "muestra **tres a la vez en ancho** (constante declarada de la vista que pagina más allá) y, **en teléfono, una banda a la vez con todas las plataformas elegidas apiladas**".»
- **Ajuste verificado si:** la línea está en el summary.

#### S2-AUD-49 · Bajo · La matriz de envejecimiento de la app cablea los umbrales 30 y 60 en lugar de leerlos de la gramática (consolidación)

- **Dónde:**
  - `tests/unit/atlas-vigencias.test.ts:13` (`const DESPUES = [0, 29, 30, 59, 60, 400];`);
  - los umbrales viven en `data/gramaticas/*.yaml:244-245` (`umbral_revisar_dias: 30`, `umbral_vencido_dias: 60`);
  - `agingDates`, exportado en el S2 (`packages/diagramador/src/index.ts:5`), no tiene lector en la app.
- **Qué está mal:** el literal nació en el S1, pero el S2 extendió este gate a `/comparar` y `/versiones` sin tocarlo. Si la gramática cambia un umbral, la matriz seguiría mirando los días 29-30 y 59-60, y quedaría en verde sin haber construido la página el día en que algo cambia de estado (regla 23). Además, la app no mira `+100` días desde «hoy», que sí es una de las cuatro edades del motor.
- **Evidencia:** lectura. `agingDates` (`v16.ts:17-24`) da, para cada mapa: hoy, la verificación más vieja + `umbral_revisar_dias`, la más vieja + `umbral_vencido_dias` y hoy + 100.
- **Ajuste ejecutable:**
  1. En `atlas-vigencias.test.ts`, dentro de `casos`, calcular los desplazamientos de la gramática de cada atlas:
     ```ts
     const { umbral_revisar_dias: r, umbral_vencido_dias: v } =
       atlas.gramatica.vigencia;
     const despues = [0, r - 1, r, v - 1, v, 100, 400];
     ```
     Usar `despues` en lugar de `DESPUES`, y borrar la constante.
  2. Agregar este caso, que cruza la app con la definición del motor:
     ```ts
     it("cada mapa: sus cuatro edades del motor (agingDates) están en la matriz", () => {
       for (const atlas of d.atlas.values()) {
         const mias = new Set(
           casos.filter(([id]) => id === atlas.plataforma.id).map(([, f]) => f),
         );
         for (const f of agingDates(atlas.mapa, atlas.gramatica))
           expect(mias.has(f), `${atlas.plataforma.id} ${f}`).toBe(true);
       }
     });
     ```
     Importar `agingDates` de `diagramador`.
- **Ajuste verificado si:** la prueba pasa. Con el literal viejo (sin `100`) queda en rojo y nombra la fecha `hoy + 100` de cada plataforma.
- **Demo en rojo:** la del criterio, más poner `r + 1` en lugar de `r` (nombra el día de «por revisar»). Registrar ambas.

---

## 3-bis. Descartados o corregidos en la consolidación (con evidencia)

| Origen                   | Qué se descarta o corrige                                                                                                                       | Evidencia                                                                                                                                                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D-14                     | El ajuste (conservar la nota genérica «que la persona aprobó en el S1 (parada A)»; «nombrar tres sería una lista cableada») y su severidad Baja | La nota genérica la decidió el constructor sin mirada: D-S1-34, `sprints/SPRINT_001-implementation-log.md:1035`, `decisions/design-system-s1-extensions.md:12`, M-5 de `sprints/SPRINT_001-auditoria.md:256`. Nombrar desde el dato no cablea nada. Se adopta B-2, Medio (S2-AUD-05) |
| B-2                      | La cita «orden (`:140`) y plan (`:162`)» como fuentes de «los tres nombres»                                                                     | Esas líneas solo dicen «nota de marcas». La exigencia de los nombres está solo en `SPRINT_002.md:128`, `:159`, `:173`. El hallazgo se sostiene                                                                                                                                       |
| A, observación 1         | «`src/lib/datos/fecha.ts:19` duplica `sumarDias` del paquete con el mismo algoritmo»                                                            | `fecha.ts` no está en el diff del S2 (`git diff origin/main...HEAD --stat -- src/lib/datos/` no lo lista), y el algoritmo es otro: usa `Date.parse`, permitido fuera de `src/engine/` y del paquete. No es hallazgo del sprint                                                       |
| A, observación 2         | «`src/lib/atlas/lado.ts:186-200` lee el glifo con una regex sobre el HTML de `toBlockCards`»                                                    | El acoplamiento existe, pero lo cubre `tests/unit/lado.test.ts:189-191` (exige el color del glifo de cada bloque): si cambia el marcado del motor, se pone en rojo. No es hallazgo                                                                                                   |
| D, cobertura #4          | «`etiqueta_corta` Completo»                                                                                                                     | Contradicho por A-1 y re-verificado (sonda: G7 da `[]`). Pasa a «Implementado con desviación» (S2-AUD-01)                                                                                                                                                                            |
| D, «Pendiente de cierre» | «`e2e` y `lighthouse` de `b8ce7b6` en `IN_PROGRESS`»                                                                                            | Ya terminaron: los seis checks están en `success` (`gh pr checks 5`, 2026-10-04)                                                                                                                                                                                                     |
| A-7                      | La línea `validar/index.ts:41-42`                                                                                                               | La línea real es la `:43` (y la `:25`, el JSDoc, como dice D-20)                                                                                                                                                                                                                     |
| D-8                      | El texto propuesto para el manual: «las fuentes de todos los componentes»                                                                       | Sería falso tras S2-AUD-36 (son 9 de 19); se reemplaza por el texto de S2-AUD-36                                                                                                                                                                                                     |
| C-11                     | El modelo de comentario «el de `fabric.yaml`»                                                                                                   | Ese comentario dice «afirmación por afirmación» (S2-AUD-08). El texto nuevo de S2-AUD-38 no lo copia                                                                                                                                                                                 |
| D-18                     | «Solo figura `8c6f980`»                                                                                                                         | También figura `9604802` (bitácora `:139`); solo falta `6d375de`                                                                                                                                                                                                                     |

No hubo hallazgos falsos enteros. Todos los Medios se re-verificaron:

- por re-ejecución: S2-AUD-01, -02, -03 y -04 (sondas y experimento de hidratación);
- por lectura de código y datos: el resto.

---

## 4. ¿Qué frases caducaron?

El barrido se hizo por promesa aplazada, en ES y EN, sobre:

- el manual, el README y la guía;
- el kit y `design-sync/`;
- la i18n;
- los ADRs;
- `design-system.md`, `CLAUDE.md` y `/deploy-check`;
- la bitácora;
- los comentarios de `data/`.

| Archivo:línea                                                                                                                             | Frase (resumen)                                                                                                     | Veredicto                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `docs/MANUAL-DE-USO.md:30` / `:220`                                                                                                       | «Si alguna todavía no tiene mapa, dice «pronto»»                                                                    | Vigente: es condicional                                                             |
| `docs/MANUAL-DE-USO.md:58` / `:245`                                                                                                       | «si una capa aún no tiene componentes, aparece vacía»                                                               | Vigente                                                                             |
| `docs/MANUAL-DE-USO.md:101` / `:288`                                                                                                      | «Una plataforma que todavía no tenga mapa dice «pronto»»                                                            | Vigente: es condicional                                                             |
| `docs/MANUAL-DE-USO.md:129` / `:315`                                                                                                      | «la propuesta no se puede aprobar»                                                                                  | Vigente                                                                             |
| `docs/MANUAL-DE-USO.md:144` / `:330`                                                                                                      | «La pestaña «Base de conocimiento» llega en un próximo sprint»                                                      | Vigente (C9 es del S3)                                                              |
| `docs/MANUAL-DE-USO.md:188-189` / `:372-373`                                                                                              | «Todavía no. Este primer ciclo construye el mapa común…»                                                            | **Caducada** → S2-AUD-42                                                            |
| `docs/MANUAL-DE-USO.md:23`, `:193` / `:213`, `:377`                                                                                       | «lo aprobó una persona afirmación por afirmación»                                                                   | **Contradice la bitácora** → S2-AUD-08                                              |
| `docs/MANUAL-DE-USO.md:183-184` / `:367-368`                                                                                              | «las fuentes de todos» / «everyone's sources»                                                                       | **Falsa** tras contar bien (9 de 19), y mal redactada en EN → S2-AUD-36             |
| `README.md:8-9` / `:16-17`                                                                                                                | «Hoy: el atlas y el investigador; el núcleo que compara llega en los próximos sprints»                              | Vigente: el lado a lado y las versiones son parte del atlas                         |
| `docs/GUIA-DE-PRUEBA.html` (cabecera)                                                                                                     | «Gate mínimo ⭐… DIFERIDO al gate acumulado del S4»                                                                 | Vigente                                                                             |
| `docs/GUIA-DE-PRUEBA.html:116-121`                                                                                                        | razones para dejar h6 y h7 fuera del ⭐⭐                                                                           | **Falsas** frente a la regla de selección → S2-AUD-15                               |
| `docs/GUIA-DE-PRUEBA.html:130-131`                                                                                                        | «Fabric v0.2.0 (84), afirmación por afirmación»                                                                     | **Contradice la bitácora** → S2-AUD-08                                              |
| `docs/GUIA-DE-PRUEBA.html:316`                                                                                                            | «por ejemplo «Ingesta · Snowflake»»                                                                                 | Inexacta: Snowflake está en la página 2 → S2-AUD-46                                 |
| `docs/GUIA-DE-PRUEBA.html:345`                                                                                                            | «se renovaron las fuentes de 19»                                                                                    | **Falsa** tras contar bien → S2-AUD-36                                              |
| `docs/GUIA-DE-PRUEBA.html` (a1, f2, h2)                                                                                                   | «una sin mapa diría «pronto»», «Todavía no hay mapa de Plataforma Norte», «La última elegida no se puede desmarcar» | Vigentes                                                                            |
| `docs/kit-de-prueba/README.md:3-4` / `:9`                                                                                                 | «bloques F e I» / «(block F)»                                                                                       | **Caducada** → S2-AUD-43                                                            |
| `design-sync/README.md:15-22`                                                                                                             | tabla «Qué trae» sin el S2                                                                                          | **Caducada** → S2-AUD-44                                                            |
| `design-sync/README.md:40-42`                                                                                                             | «Pendiente del cierre del ciclo… todavía no tiene proyecto»                                                         | Vigente                                                                             |
| `src/lib/i18n/es.ts:79-80` / `en.ts:79-80`                                                                                                | nota de marcas genérica en `/comparar`                                                                              | No caduca, pero incumple el pedido → S2-AUD-05                                      |
| `src/lib/i18n/es.ts:155` / `en.ts:155`                                                                                                    | «Se comparan hasta {n} a la vez; con más, se pagina»                                                                | **Falsa en el teléfono** → S2-AUD-29                                                |
| `src/lib/i18n/es.ts:241` / `en.ts:241`                                                                                                    | «validador: {n} reintentos»                                                                                         | Ambigua, con una promesa de aclararla incumplida → S2-AUD-30                        |
| `src/lib/i18n/es.ts:138`, `:167-169`, `:232`, `:244-245`, `:263`, `:270` y `en.ts` ídem                                                   | estados «pronto», «todavía no…», «no se puede…», «la IA no puede»                                                   | Vigentes: son condicionales y los cubren pruebas                                    |
| `src/lib/i18n/en.ts:199`                                                                                                                  | «you will see here what changed»                                                                                    | Vigente (estado vacío)                                                              |
| `data/plataformas/databricks.yaml:1`, `snowflake.yaml:1`                                                                                  | «Se lista como «próximamente»… su mapa llega… (S2)»                                                                 | **Caducada** → S2-AUD-38                                                            |
| `data/plataformas/fabric.yaml:1`                                                                                                          | «lo aprobó una persona, afirmación por afirmación»                                                                  | Era cierta en el S1; **ya no** describe la v0.2.0 → S2-AUD-08                       |
| `.claude/skills/investigar/SKILL.md:89-93`                                                                                                | «hoy y en los días en que el mapa pasará a "por revisar" y a "vencido"»                                             | **Caducada** (cuatro edades y el lado a lado) → S2-AUD-35                           |
| `design-system.md:169`                                                                                                                    | «conmutador «Ver: bloques / componentes»»                                                                           | **Caducada** (M1) → S2-AUD-14                                                       |
| `design-system.md:282`                                                                                                                    | «El selector… no filtra en la maqueta»                                                                              | Cierta de la maqueta; pagada en producto → S2-AUD-14                                |
| `design-system.md:283`                                                                                                                    | «Nota de marcas y selector…: se diseñan en el S1»                                                                   | **Caducada** desde el S1 → S2-AUD-14                                                |
| `CLAUDE.md:77`                                                                                                                            | «tres a la vez en ancho y una en teléfono»                                                                          | Inexacta → S2-AUD-48 (enmienda a la planeadora)                                     |
| `CLAUDE.md:693`                                                                                                                           | «nivel por banda — S2»                                                                                              | Vigente: marca de origen                                                            |
| `decisions/compare-in-the-engine.md:10-11`                                                                                                | «and one on a phone»                                                                                                | Inexacta → S2-AUD-41                                                                |
| `decisions/compare-in-the-engine.md:68`                                                                                                   | «Measured… 2765 ms… 401 KB»                                                                                         | **Caducada** → S2-AUD-41                                                            |
| `decisions/lcp-budget-by-profile.md:38`                                                                                                   | «LCP is measured again at the end of S2…»                                                                           | **Caducada**: ya se midió → S2-AUD-41                                               |
| `decisions/lcp-budget-by-profile.md:35`                                                                                                   | «The deeper reduction is proposed, not done»                                                                        | Vigente                                                                             |
| `decisions/csp-static-export.md:25`                                                                                                       | «`style-src`… plus that page's hashes»                                                                              | **Caducada** desde la fase 2 → S2-AUD-11                                            |
| `decisions/map-versioning.md:35`                                                                                                          | «raises `contrato_version` only when the document validates the same»                                               | **Inexacta** → S2-AUD-10                                                            |
| `decisions/diagramador-architecture.md:8`, `:42`                                                                                          | «v0.3.0», «31/31»                                                                                                   | Vigente como registro fechado del S1                                                |
| `.claude/commands/deploy-check.md:135-137`                                                                                                | «`envejecer.test.ts` (… todas las vistas y `compare`)»                                                              | Inexacta → S2-AUD-45                                                                |
| `tests/unit/datos-vocabulario.test.ts:12-16`                                                                                              | «Deuda declarada: ninguna»                                                                                          | Pasará a falsa si se declara la deuda de S2-AUD-07; se actualiza en el mismo ajuste |
| bitácora `:428`                                                                                                                           | rojo de «huella sin comparar» nombrado por «una versión archivada que no aprobó nadie…»                             | **Falsa** → S2-AUD-09                                                               |
| bitácora `:498`                                                                                                                           | «lo aclaro en la fase 4» (rótulo de reintentos)                                                                     | **Promesa incumplida** → S2-AUD-30                                                  |
| bitácora `:770`                                                                                                                           | «`toCompareCSS` (D-S2-07)… van a «Enmiendas»»                                                                       | **Inexacta**: no se construyó → S2-AUD-12                                           |
| `src/app/[idioma]/investigador/[plataforma]/page.tsx:19`; `SinMapa.tsx:7`, `CampoPlataforma.tsx:9`, `Niveles.tsx:11-12`, `esquemas.ts:14` | estados «aún no / todavía no» genéricos                                                                             | Vigentes: describen mecanismos                                                      |

**Recordatorio para la Fase 2 (paso 4 de `/audita-sprint`):** repetir este barrido después del último ajuste, siguiendo cada ajuste hasta sus frases hermanas, e incluir el summary entre las superficies. Hay ajustes de este plan que fabrican copy nuevo: S2-AUD-05, -08, -10, -29, -30 y -36.

---

## 5. Campos del contrato sin consumidor (consolidado)

**Paquete (A + consolidación).** Tipos creados o ampliados: `Geometria` (de `compare`), `Aviso`, `OpcionesCompare`, `Diferencias`, y las exportaciones `agingDates`, `diffToText` y `CruceGeo`.

| Campo / exportación                           | Lectores fuera de su construcción y sus pruebas                                                            | Veredicto                                                                                                       |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `Geometria.variante`                          | `src/svg/toSVG.ts:44` (espacio de nombres del SVG)                                                         | Con lector                                                                                                      |
| `Geometria.cruces`                            | 0 en la app. Se lee para emitir los avisos D11 (`src/layout/index.ts:19`) y en `test/geometria.test.ts:87` | Lo pide el contrato (§ 5.6); su lector es un segundo consumidor. Se declara como API en «Enmiendas» (S2-AUD-12) |
| `Geometria.filas[].banda` (en `compare`)      | `src/lib/atlas/lado.ts` y `versiones.ts` usan las filas                                                    | Con lector, pero con **otra semántica sin documentar** → S2-AUD-21                                              |
| `Geometria.vigencia.elementos` (en `compare`) | **0**. La de `layout` sí la leen `src/lib/investigador/revision.ts:94` y `src/lib/atlas/vistas.ts:133`     | **Huérfano en `compare`** → S2-AUD-21 (documentar y probar)                                                     |
| `Aviso.id`                                    | Nadie lo lee como elemento: V16, la app y el investigador leen `mensaje`                                   | Semántica corregida → S2-AUD-20                                                                                 |
| `CruceGeo`                                    | **0**                                                                                                      | **Huérfano** → S2-AUD-21 (se quita)                                                                             |
| `agingDates`                                  | **0 en la app** (solo `v16.ts` y `test/compare.test.ts:294`)                                               | Gana lector con S2-AUD-49                                                                                       |
| `diffToText`                                  | `src/lib/atlas/versiones.ts`                                                                               | Con lector                                                                                                      |
| `OpcionesCompare.n` / `page`                  | Solo las pruebas del paquete: la app pagina con CSS sobre filas prerenderizadas                            | Entradas que exige § 4.4 («N del consumidor»), no salidas; se declaran en «Enmiendas»                           |
| `OpcionesCompare.marks`                       | `src/lib/atlas/versiones.ts:91`                                                                            | Con lector                                                                                                      |
| `Diferencias` (`diff`)                        | `src/lib/atlas/versiones.ts:88-91`; `src/lib/investigador/revision.ts:204`                                 | Con lector                                                                                                      |

**App (B).** No hay huérfanos:

- `VistaLado`: 12/12 campos, leídos en `comparar/page.tsx`;
- `FilaLado`: 6/6 (`Lado.tsx`, y `page.tsx:34` para `version`);
- `BandaAngosta`, `CeldaAngosta` y `ElementoAngosto`: todos, en `Lado.tsx:218-253`;
- `VistaVersiones` y `ParVersiones`: todos, en `versiones/page.tsx`;
- `EstadoLado` y `EstadoCompleto`: todos;
- i18n: `atlas.lado.*` (26 claves), `atlas.versiones.*` y `motor.lado.*` tienen lector (los dos primeros en la app; el último lo lee el paquete en `compare.ts` y `leyenda.ts`).

**Datos e investigador (C + consolidación):**

- `VersionArchivada { version, mapa, archivo }`: la leen `aprobados.ts:29-34` y `versiones.ts`. `Datos.versiones`: 6 lectores en `src/`.
- `migradoDesde`: solo lo usa `migrarContrato`, en su propio módulo, y `tests/unit/datos-migrar.test.ts`. Es una función exportada para pruebas; se acepta y no es hallazgo.
- Hay un campo **que falta** (no huérfano): `propuesta_sha256` en `esquemaRevision` → S2-AUD-34.

**Total:** 2 huérfanos (`CruceGeo` y `vigencia.elementos` de `compare`), 1 campo con semántica sin documentar (`filas[].banda`), 1 exportación sin lector en la app que gana uno (`agingDates`). Todo va en S2-AUD-21 y S2-AUD-49.

---

## 6. Ningún número de entidades cableado (consolidado)

**Entidades que el brief y la VISION declaran extensibles solo con datos:** N plataformas, N bandas (capas), N idiomas.

- **Paquete (A).**
  - Ningún `3` ni arreglo fijo de plataformas.
  - `N_LADO = 3` vive solo en `packages/diagramador/test/lib/lado.ts`, como constante del consumidor de prueba.
  - Las rejillas salen de `bandas.length` (`compare.ts:87-94`).
  - Ningún nombre de plataforma en `src/` (G3, `grep -i` de databricks, snowflake, fabric, onelake, azure, microsoft, spark y hospital: 0).
- **App (B + consolidación).**
  - `POR_PAGINA = 3` es la **constante declarada de la vista**, con su razón (`src/lib/atlas/estado-lado.ts:8`), y la vista pagina más allá: es aceptable.
  - El único otro `3` en las líneas nuevas de `src/` es el de las tres partes de un semver (`src/lib/datos/cargar.ts`, `compararVersion`), que no es cardinalidad.
  - Lo prueban `tests/unit/lado.test.ts:206-217`: «una quinta entra sola» y «reordenar no cambia un byte».
  - La lista `numeros` de la i18n (de «Cero» a «Diez») cae a cifras más allá (`tituloLado`): no es un tope.
  - La pestaña «Niveles» de `/comparar` usa la primera plataforma por `id`, una regla neutral y declarada.
- **e2e (B).** Las plataformas salen del dato (`tests/e2e/lib/rutas.ts`). Pero la constante de la vista está copiada a mano (`lado.spec.ts:9`; el literal en `g11.spec.ts:92`, `:97`) → **S2-AUD-28, Bajo**: es la constante de la vista, no N de plataformas.
- **Datos (C).** Sin `3` ni arreglos de tres en `src/lib/datos`, `src/lib/investigador`, `scripts/investigar`, `scripts/kit-de-prueba` ni `scripts/datos`.
- **Valores del dato cableados, no de cardinalidad.** Los umbrales 30/60 de la matriz de envejecimiento de la app → **S2-AUD-49, Bajo**.
- **Texto de la constitución.** `CLAUDE.md:77` describe mal el teléfono → S2-AUD-48.

**Veredicto:** ningún hallazgo Alto de cardinalidad.

---

## 7. La guía heredada contra la arquitectura de hoy

**Veredicto: las 38 pruebas con origen S1 (32 «S1» y 6 «Mejorado en S2») pueden pasar hoy. Ninguna pide lo que el producto prohíbe ni un estado que ya no existe.**

D las contrastó contra los datos, contra `out/` y con un render a 2026-11-03:

- **a1 y c4:** las cuatro plataformas, en orden de `id`.
- **b3:** «30 d» en los tres mapas reales a 2026-11-03.
- **b4:** el haz, con 3 `dg-haz` en Fabric.
- **b5:** espejo, trabajo-copia y la línea punteada del informe.
- **b10:** la nota de marcas genérica sigue en la leyenda del atlas.
- **d3:** 6a/6b.
- **e2:** «Tableros» y «Gobierno» en la plataforma de ejemplo.
- **f1:** «mapa aprobado v0.2.0 · 2 revisiones».
- **f2, f3 y f6:** `kit-de-prueba.test.ts` en verde.
- **g1:** la CSP de cabecera de `/diseno/**`.
- **Flechas:** el paso de envía/recibe a →/← no rompe ninguna prueba.

**Las 14 nuevas** coinciden con `es.ts` y `out/`, salvo:

- h4 y h6 (S2-AUD-46);
- j1, cuya cifra «19» pasa a «9» con S2-AUD-36;
- la caja «Ya aprobado en el S2» (S2-AUD-08);
- la selección del ⭐⭐ (S2-AUD-15).

**Conteos de hoy:** 52 pruebas (32 heredadas, 6 mejoradas, 14 nuevas); ⭐ = 7 (b1, b8, b9, b11, h6, h7, j5); ⭐⭐ = 4. Tras S2-AUD-15, el ⭐⭐ pasa a 6.

---

## 8. Lo revisado que está bien

- **Integridad de lo aprobado.**
  - Cada mapa vigente coincide en huella y versión con la última línea de su revisión.
  - `fabric-0.1.0` es byte a byte la de `origin/main` y coincide con la primera revisión de Fabric.
  - Cada mapa publicado es exactamente su propuesta, salvo `estado`, `version` y las fechas.
  - Ningún mapa ni revisión se editó después de su commit de aprobación.
- **Contrato fijado.** El lock v0.4.0 está 57/57 con la planeadora; las carnadas, 34/34; P1–P3 se leen de `carnadas/`.
- **Determinismo.**
  - Sin `Math.random`, `Date`, `Intl`, `localeCompare` ni `toLocale*` en el paquete.
  - `sumarDias` es entera y está probada con fast-check.
  - Los golden se regeneran solo con `ACTUALIZAR_GOLDEN=1`.
  - El job `diagramador` corre en 3 navegadores × 2 sistemas.
- **Pruebas reales, en su mayoría.** Las propiedades usan una semilla fija; `lejanas` tiene caso positivo y negativo. La bitácora registra el rojo de casi cada gate nuevo, incluidas dos pruebas que su propia demo mostró decorativas y se corrigieron. Las excepciones son S2-AUD-03, -09, -22, -26 y -27.
- **Seguridad.**
  - Nada de la URL llega al HTML.
  - Los ids son slugs validados.
  - `esc()` se usa en cada texto armado a mano.
  - La CSP va por `<meta>`, antes de todo script, sin `unsafe-inline`, y se niega a publicar `style=` u `on…=`.
  - El barrido de cero enlaces (`git grep -nE "vercel[.]app|workers[.]dev|pages[.]dev" -- ':!pnpm-lock.yaml'`) está vacío.
  - `gitleaks` y el `pre-commit` fallan cerrado.
- **DOM del export.** 0 ids duplicados, 0 referencias `aria-*`/`href="#"`/`url(#)` sin destino, 0 referencias entre SVG, 0 `style=` y 0 `on…=`.
- **Estado de la URL.** Los casos raros dan el mismo estado en el script y en el componente (propiedad en `vm`, `tests/unit/lado.test.ts:60-83`). `replaceState` conserva el `state` de Next.
- **Regla 5 (forma del árbol).** El HTML del servidor es siempre «todas, página 1»; `useReducedMotion` no ramifica el árbol.
- **Privacidad del investigador.** El registro tiene +303 líneas sin identificadores de la persona; los 103 URL citados se leyeron (WebFetch registrado); la verificación de cada propuesta es de esa propuesta.
- **Cargador.**
  - Orden numérico de las versiones.
  - Rechazo de una versión igual o mayor que la vigente.
  - Rechazo del nombre que no coincide con la versión y del `sujeto_id` ajeno.
  - Sin fallas en cascada falsas.
  - La migración no toca el archivo.
- **Aprobación.**
  - Archiva antes de sobrescribir.
  - Ensaya en una copia.
  - Escribe de forma atómica.
  - Escribe la revisión al final.
  - El candado «solo una persona aprueba» funcionó en vivo (bitácora `:560-564`).
- **Rendimiento.** `/es/comparar` mide 2783 ms de LCP (presupuesto 2900), CLS 0 y 469 KB, y no creció con N entre dos y cuatro plataformas.
- **Constitución, CI y homepage.**
  - La fusión de `CLAUDE.md` es correcta.
  - Hay cinco checks requeridos, y `diagramador` no tiene `needs`.
  - Los seis checks están en `success` sobre `b8ce7b6`.
  - El homepage apunta al repo, y no hay comentarios del bot.
- **Bilingüe (regla 20).** Todo texto nuevo existe en ES y en EN, redactado (concordancia de género en `numeros`).
- **Matriz de envejecimiento.** Cubre `compare`, `/comparar` y `/versiones`, salvo los umbrales cableados (S2-AUD-49).

---

## 9. Plan de la Fase 2

**Orden.** Primero el paquete, después la app, después los datos y sus pruebas, y al final los documentos. Así se reconstruye lo menos posible.

**Cómo trabaja el constructor:**

- **Cada gate nuevo nace con su demo en rojo**, en el mismo commit, y se registra en la bitácora: rojo → verde y a quién nombró (regla 15).
- **Tras cada push, `gh pr checks 5`.**
- **Antes de cada lote**, una línea en la bitácora: «Lote N: inicio»; al terminar, sus corridas.

### Lote 1 · Paquete `packages/diagramador/` (sin preguntar)

| Orden | Hallazgo                                                                                       | Archivo principal                                                   |
| ----- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1     | S2-AUD-17 (con S2-AUD-02 y S2-AUD-18): nuevo `filasDe`, `compararVersion`, `levelByBand` 1 o 2 | `src/layout/compare.ts`                                             |
| 2     | S2-AUD-20: un contexto por fila y avisos con prefijo                                           | `src/layout/compare.ts`, `src/layout/tipos.ts`                      |
| 3     | S2-AUD-16: banda vacía                                                                         | `src/layout/compare.ts`                                             |
| 4     | S2-AUD-03: prueba de § 5.6 (después del paso 2, por el formato del `id`)                       | `test/compare.test.ts`                                              |
| 5     | S2-AUD-01: G7 de `etiqueta_corta`                                                              | `src/validar/textos.ts`                                             |
| 6     | S2-AUD-19: V16 sin `texts` en publicación                                                      | `src/validar/index.ts`, `test/v16.test.ts`, `test/densidad.test.ts` |
| 7     | S2-AUD-21: JSDoc y `CruceGeo`                                                                  | `src/layout/tipos.ts`, `src/index.ts`                               |
| 8     | S2-AUD-22: haz y `puntas`                                                                      | `test/texto.test.ts`, `test/densidad.test.ts`                       |
| 9     | S2-AUD-23: comparador de bandas                                                                | `src/texto/diffToText.ts`                                           |

**Al cerrar el lote:**

- `pnpm exec vitest run packages/diagramador --coverage`;
- los **44 golden sin cambios** (`git status packages/diagramador/test/golden` vacío);
- `node scripts/contrato/verificar.mjs` (57/57);
- `pnpm lint` y `pnpm typecheck`.

### Lote 2 · App `src/`, `tests/`, `scripts/design-sync` (sin preguntar)

| Orden | Hallazgo                                          | Archivo principal                                                                   |
| ----- | ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1     | S2-AUD-04: hidratación                            | `src/components/atlas/Lado.tsx`, `tests/unit/ui/lado.test.tsx`                      |
| 2     | S2-AUD-05: nota de marcas desde el dato           | `src/lib/i18n/{tipos,es,en}.ts`, `src/lib/atlas/lado.ts`, `tests/unit/lado.test.ts` |
| 3     | S2-AUD-29: nota del selector                      | `src/lib/i18n/{es,en}.ts`                                                           |
| 4     | S2-AUD-30: dos rótulos de reintentos              | `revision.ts`, i18n, `investigador/[plataforma]/page.tsx`                           |
| 5     | S2-AUD-36 (código y prueba): fuentes sin la fecha | `src/lib/atlas/versiones.ts`, `tests/unit/versiones.test.ts`                        |
| 6     | S2-AUD-24: tarjeta partida y prueba de ids        | `scripts/design-sync/bundle.ts`, `tests/unit/design-sync.test.ts`                   |
| 7     | S2-AUD-25, -26, -27, -28: e2e                     | `tests/e2e/lado.spec.ts`, `tests/e2e/g11.spec.ts`                                   |
| 8     | S2-AUD-31: Lighthouse de Snowflake                | `lighthouse-urls.json`                                                              |
| 9     | S2-AUD-49: umbrales de la matriz                  | `tests/unit/atlas-vigencias.test.ts`                                                |

**Al cerrar el lote:**

- `node scripts/design-sync/generar.mjs`;
- `pnpm test`;
- **un solo** `pnpm build`;
- e2e completo;
- Lighthouse local de Snowflake (mediana de 3);
- `pnpm lint` y `pnpm typecheck`.

### Lote 3 · Datos, cargador, investigador y kit (sin preguntar)

| Orden | Hallazgo                                               | Archivo principal                                                                                                |
| ----- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| 1     | S2-AUD-10: migración encadenada y versiones históricas | `src/lib/datos/migrar.ts`, `cargar.ts`, `aprobados.ts`, `versiones.ts`, i18n, pruebas                            |
| 2     | S2-AUD-33: regla 12 en las archivadas                  | `src/lib/datos/cargar.ts`, `tests/unit/datos.test.ts`                                                            |
| 3     | S2-AUD-40: higiene del cargador                        | `src/lib/datos/cargar.ts`, `tests/unit/datos.test.ts`                                                            |
| 4     | S2-AUD-09: pruebas de la huella y del «ya existe»      | `tests/unit/mapas-aprobados.test.ts`, `tests/unit/investigador/scripts.test.ts`                                  |
| 5     | S2-AUD-34: propuestas aprobadas                        | `tests/unit/propuestas-aprobadas.test.ts` (nuevo)                                                                |
| 6     | S2-AUD-07 (gate y deuda): `VETADAS` y `CONOCIDAS`      | `src/lib/datos/vocabulario.ts`, `tests/unit/datos-vocabulario.test.ts`, `tests/unit/investigador/nucleo.test.ts` |
| 7     | S2-AUD-06 (regla) y S2-AUD-35: la skill                | `.claude/skills/investigar/SKILL.md`, `tests/unit/investigador/skill.test.ts`                                    |
| 8     | S2-AUD-39: reintento del verificador                   | `scripts/verificar-citas.mjs` y su prueba                                                                        |
| 9     | S2-AUD-37: muestra del kit                             | `scripts/kit-de-prueba/versiones.mjs` (regenerar)                                                                |
| 10    | S2-AUD-38: comentarios de plataformas                  | `data/plataformas/{databricks,snowflake}.yaml`                                                                   |

**Al cerrar el lote:**

- `pnpm test`;
- `pnpm build` (el cargador cambió);
- e2e de `versiones` y `datos`;
- `pnpm lint`.

**Advertencias:**

- Ningún mapa aprobado se toca.
- Ninguna prueba ejecuta el script de aprobación fuera de su raíz temporal.

### Lote 4 · Documentos y registros (sin preguntar)

| Orden | Hallazgo                                                                                                                                                                                                 | Archivo                                                                             |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1     | S2-AUD-08 (textos): guía, manual, `fabric.yaml`                                                                                                                                                          | `docs/GUIA-DE-PRUEBA.html`, `docs/MANUAL-DE-USO.md`, `data/plataformas/fabric.yaml` |
| 2     | S2-AUD-15 y S2-AUD-46: ⭐⭐ = 6, h4 y h6                                                                                                                                                                 | `docs/GUIA-DE-PRUEBA.html`                                                          |
| 3     | S2-AUD-36 (textos): j1, manual ES y EN                                                                                                                                                                   | `docs/GUIA-DE-PRUEBA.html`, `docs/MANUAL-DE-USO.md`                                 |
| 4     | S2-AUD-42: «Este primer ciclo»                                                                                                                                                                           | `docs/MANUAL-DE-USO.md`                                                             |
| 5     | S2-AUD-11: ADR de la CSP                                                                                                                                                                                 | `decisions/csp-static-export.md`                                                    |
| 6     | S2-AUD-41: ADRs de cifras                                                                                                                                                                                | `decisions/compare-in-the-engine.md`, `decisions/lcp-budget-by-profile.md`          |
| 7     | S2-AUD-10 (ADR)                                                                                                                                                                                          | `decisions/map-versioning.md`                                                       |
| 8     | S2-AUD-14: ADR de extensiones                                                                                                                                                                            | `decisions/design-system-s2-extensions.md` (nuevo)                                  |
| 9     | S2-AUD-44 y S2-AUD-43: READMEs                                                                                                                                                                           | `design-sync/README.md`, `docs/kit-de-prueba/README.md`                             |
| 10    | S2-AUD-45: `/deploy-check`                                                                                                                                                                               | `.claude/commands/deploy-check.md`                                                  |
| 11    | S2-AUD-12, -13, -47: bitácora («Desviación del plan» 9-19, § 12, `beforeSend`, `6d375de`, fila `:428`)                                                                                                   | `sprints/SPRINT_002-implementation-log.md`                                          |
| 12    | Summary: «Enmiendas» y «Fallas del diagramador» (S2-AUD-12, -13, -19), «Sugerencias al método» (S2-AUD-08 regla operativa, S2-AUD-39, S2-AUD-48), deuda aceptada, registro de esta auditoría y sus pagos | `sprints/SPRINT_002-summary.md`                                                     |

**Al cerrar el lote:**

- `pnpm test` (guía, kit y `design-sync`);
- **segunda pasada de «¿qué frases caducaron?»** sobre el diff de la Fase 2, incluido el summary;
- el barrido de cero enlaces sobre el árbol final, después del último `git add`.

### Lote 5 · Lo que decide la persona

Una pregunta por mensaje, con la página abierta por el constructor, en este orden.

| #   | Hallazgo  | Pregunta (sí/no)                                                                                                                                                                          | Qué pasa con cada respuesta                                                                                                                                                                                  |
| --- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P1  | S2-AUD-08 | «¿Leíste una por una, en la pantalla de revisión, las afirmaciones de Databricks, Snowflake y Fabric antes de correr cada comando de aprobación?»                                         | **Sí:** se registra con fecha y se cierra el ítem 15. **No** (o no en alguna): el ítem 15 queda declarado con la respuesta. Los textos neutros del Lote 4 valen en los dos casos                             |
| P2  | S2-AUD-06 | «¿Corres en este sprint `/investigar fabric gobierno`, para que la madurez de "Seguridad de OneLake" salga de una cita y no del mapa anterior?»                                           | **Sí:** la persona invoca la skill y aprueba en su pantalla; el constructor no arma el comando. **No:** deuda por decisión de la persona, con `data/mapas/fabric.mapa.yaml:534` y pago en el S3              |
| P3  | S2-AUD-07 | «¿Corres en este sprint `/investigar databricks consumo`, para que el mapa deje de repetir que el serverless es "el de mejor precio y rendimiento"?»                                      | **Sí:** reinvestigación y aprobación; se vacía `CONOCIDAS`. **No:** deuda declarada en `tests/unit/datos-vocabulario.test.ts` y en el summary, con `data/mapas/databricks.mapa.yaml:479-480` y pago en el S3 |
| P4  | S2-AUD-32 | Solo si el constructor no pudo leer el log del build del preview: «Abre el preview del PR #5 en /es/atlas/fabric, pulsa Cmd+Opt+U y busca con Cmd+F "Content-Security-Policy": ¿aparece?» | **Sí:** se registra con fecha. **No:** pasa a Alto y se investiga antes del merge                                                                                                                            |

**Miradas de TEXTO que no bloquean.** Se registran como «maquetado, no visto» y viajan al gate del ciclo:

- la nota de marcas (S2-AUD-05);
- la nota del selector (S2-AUD-29);
- los dos rótulos de reintentos (S2-AUD-30);
- la línea «histórica» de `/versiones` (S2-AUD-10);
- el texto nuevo de h6 (S2-AUD-46).

### ¿Hay hallazgos IMPOSIBLES de pagar en el sprint?

**Ninguno es imposible.** Dos dependen de una acción que solo la persona puede hacer, por la regla dura 2 (solo la persona invoca `/investigar` y aprueba):

- **S2-AUD-06:** la madurez de `data/mapas/fabric.mapa.yaml:534`;
- **S2-AUD-07**, su parte de contenido: `data/mapas/databricks.mapa.yaml:479-480`.

Si la persona responde «no» a P2 o a P3, pasan a deuda **por su decisión registrada**, no por imposibilidad. Sus partes mecánicas (la regla de la skill, el veto de vocabulario y la deuda declarada en la prueba) se pagan igual en el Lote 3.

Dos más se pagan con un registro, porque su destino es la planeadora:

- **S2-AUD-48:** `CLAUDE.md:77`, que el constructor no edita;
- **S2-AUD-13:** la enmienda a § 12, que la planeadora aplica.

El pago dentro del sprint es la sugerencia o la enmienda escrita en el summary.

---

**Aprueba la Fase 1 y fija el modelo de la Fase 2 con `/model` (un modelo menor basta si sigue este plan).**
