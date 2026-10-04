---
sprint: 002
app: big-d
status: closed
opened: 2026-10-01
closed: 2026-10-04
branch: sprint-002/lado-a-lado
pr: https://github.com/mauriciorincon-ai/app-big-d/pull/5
---
# Sprint 002 Summary — Big-D

> **Cierre de construcción**, con la auditoría pagada; **el merge lo hace la persona**. Este archivo viaja dentro
> del PR #5. Ciclo H1, sprint 2 de 4: no es cierre de ciclo, así que no hay brochure, BLUEPRINT ni `/design-sync`
> (van en S4). El ⭐ se difiere al acumulado del ciclo con sus contrapesos (abajo).
> Bitácora completa: `sprints/SPRINT_002-implementation-log.md`. Auditoría: `sprints/SPRINT_002-auditoria.md`.

## Outcome

**Sí, los tres outcomes.** Dos cambios de forma los pidió la persona, y el tercero llegó más lejos que la orden.

- **Principal: sí.** `/[idioma]/comparar` muestra las cuatro plataformas (Databricks, Microsoft Fabric, Snowflake y la
  Plataforma Ejemplo, ficticia) alineadas por banda.
  - En ancho van tres a la vez, con paginación; `POR_PAGINA` es una constante declarada de la vista. En el teléfono va
    una banda a la vez, con todas las plataformas apiladas.
  - Un solo botón, «Desplegar todo», abre los componentes de todas las bandas **en el mismo diagrama** sin mover las
    columnas. Lo pidió la persona en M1, arriba a la derecha del recuadro.
  - Tiene ventana por bloque y ficha por componente, un selector que filtra (el estado vive en la URL), leyenda y
    lectura en texto.
  - **Gate de FORMA aprobado sobre el preview del PR #5:** «Si lo abri y lo apruebo», 2026-10-03 (M2).
  - **Databricks y Snowflake** entraron como mapas reales que propuso `/investigar` y aprobó la persona: 106 y 143
    afirmaciones, con 0 rechazos. La persona confirmó que leyó cada afirmación antes de aprobar (P1, abajo).
- **Secundario: sí.**
  - `compare` existe en `packages/diagramador/`: N del consumidor, nivel por banda, filas independientes, marcas de
    diferencia y `diffToText`.
  - El contrato se renovó a **v0.4.0**: `CONTRATO.lock` con 57 huellas iguales a la planeadora de la orden. Pasan los
    **34/34 casos**, con sus `secundarios`, y P13 tiene regla y prueba.
  - Hay 44 golden files, con la misma huella en Node y en tres navegadores, en Linux y en macOS.
- **Terciario: sí, con cambios.**
  - **Fabric v0.2.0** salió sin «lago de datos».
  - `/[idioma]/atlas/[plataforma]/versiones` muestra la diferencia entre versiones, con glifo y palabra, y una lista
    explicativa.
  - En la auditoría la persona investigó dos capas más:
    - **Fabric v0.3.0** (gobierno, 102 afirmaciones) es el primer par real con marca dibujada;
    - **Databricks v0.2.0** (consumo, 131 afirmaciones) quitó la autoevaluación comercial del fabricante.
  - **Fuentes:** ya estaban recortadas a su cobertura (hecho medido), así que la deuda de LCP se pagó con medida y
    ADR: techo de 3,0 s, presupuesto de 2900 ms.
  - **CSP:** va como meta con huellas, no como cabecera (el export estático no la admite). Desde `2f11545` se sirve
    también en lo que Vercel publica. Ver S2-AUD-32.

## Qué se construyó

- **Diagramador** (`packages/diagramador/`, reusable de la casa):
  - conformidad con el contrato v0.4.0:
    - API en inglés (`texts`, `queryDate`, `group`) y plurales `{ one, other }`;
    - avisos `{ vista, tipo, id, mensaje }` (§ 5.6);
    - marcas de envío y recepción horizontales;
    - V8 para `estado`, alerta V3 por bloque vacío, `cruces`, regla del haz y paréntesis corto;
    - `etiqueta_corta`;
    - **V16 dentro de `validate`**: dibuja a cuatro edades, incluida la fila del lado a lado;
  - `compare(maps, grammar, { levelByBand, n, page, part, marks })`, con precondiciones que lanzan un error claro;
  - `diffToText`;
  - P13 en su forma mínima: ninguna pista corre bajo la punta de una flecha de llegada.
- **El lado a lado en producto** (`src/components/atlas/Lado.tsx`, `src/lib/atlas/lado.ts`):
  - dos SVG por fila, generados en el build;
  - un script previo al pintado para el estado de la URL, sin re-dibujar en el cliente;
  - la vista del teléfono en HTML;
  - navegación desde las pestañas del atlas.
- **Versiones de un mapa:**
  - la aprobación archiva byte a byte la versión anterior en `data/mapas/versiones/`;
  - el cargador las valida y comprueba su huella contra `data/revisiones/`;
  - migración en memoria, en cadena;
  - versiones históricas: listadas y no dibujadas;
  - la página `/versiones`, con «Lo que dicen los componentes» para lo que cambia sin cambiar el dibujo.
- **Datos:**
  - Databricks v0.2.0 y Snowflake v0.1.0;
  - Fabric v0.3.0, con v0.1.0 y v0.2.0 archivadas;
  - Databricks v0.1.0 archivada;
  - cinco revisiones nuevas con fecha y la propuesta que respaldan.
- **Investigador:**
  - la regla de madurez y V16 a cuatro edades en la skill;
  - el veto de vocabulario a la autoevaluación comercial;
  - el verificador de citas reintenta con HTTP/1.1 y sin su agente cuando un sitio corta la conexión;
  - el rótulo de reintentos aclarado.
- **Seguridad y build:**
  - CSP por meta con huellas, inyectada en cada carpeta que se publica;
  - el build de `quality` igual al de Vercel;
  - `pre-commit` que falla cerrado;
  - el campo homepage apunta al repo.
- **Lo que acompaña:**
  - guía de prueba v2: 52 pruebas en 10 bloques, ⭐ 7 y ⭐⭐ 6;
  - manual ES/EN (funciones 7 y 8);
  - `design-sync/` regenerado: dos tarjetas del lado a lado y una de diferencias;
  - 5 ADRs;
  - la constitución fusionada con el kit v1.33.0.

## DoD — checklist

| Estándar | Estado | Evidencia |
|---|---|---|
| **Testing** | ✅ | `pnpm test`: **1397/1397** en 65 archivos; cobertura total 98,9 % de líneas (97,4 % de sentencias), umbrales aplicados por `--coverage`. Paquete (comando del job `diagramador`): 868/868. e2e en la CI de `2f11545`: **785 pasan, 9 se saltan a propósito** (794 en 13 archivos, 4 proyectos), sin fallas ni reintentos marcados. fast-check: G5 entre N mapas, invariancia al orden, el nivel por banda no mueve columnas, fila independiente = fila trasladada. Matriz de envejecimiento sobre `compare`, `diff`, `/comparar` y `/versiones`, con los umbrales leídos de la gramática |
| **CI/CD** | ✅ | `quality` · `e2e` · `lighthouse` · `diagramador (ubuntu-latest)` · `diagramador (macos-latest)` · Vercel, con conclusión propia `success`. `gh pr checks` tras cada push. Sin jobs nuevos; `quality` cambió su paso de build (S2-AUD-32) y corrió con él por primera vez en `2f11545`. Dos rojos en la rama, los dos leídos y pagados: `9604802` (`design-sync` desfasado) y `8c6f980`/`6d375de` (aviso de `braces` sin corrección) |
| **Observabilidad** | ✅ | Sentry client-only, inerte sin DSN; `beforeSend` del kit v1.33.0 confirmado (`instrumentation-client.ts:26` → `eventoSinContenido`). Registro del investigador con las cinco corridas, sin identificadores (claves: fecha, herramienta, URL o consulta, huella de la llamada) |
| **Seguridad** | ✅ | `pnpm audit --audit-level high`: limpio con **1 aviso ignorado** (`braces`, sin versión corregida; gate `avisos-ignorados.test.ts`). gitleaks en cada commit; `pre-commit` falla cerrado sin gitleaks (demo en rojo). **CSP con huellas vista en el preview real** (P4). Lints G2/G3/«planea, no opera» en verde. Hooks del investigador. Barrido de cero enlaces limpio tras el último `git add`. Homepage = el repo |
| **Performance** | ✅ por ADR | Lighthouse en la CI sobre 21 URL, en `success`. LCP local (mediana de 3): `/es/comparar` 2783 ms · `/es/atlas/fabric/versiones` 2613 ms · `/es/atlas/snowflake` 2536 ms · `/es/atlas/fabric` 2478 ms. Por encima del 2500 del estándar y por debajo del presupuesto (2900) y del techo (3,0 s) del ADR `lcp-budget-by-profile`. `compare` se genera en el build; paginar, elegir y desplegar no re-dibujan |
| **UX/A11y** | ✅ | axe en los dos temas, incluido `/comparar` desplegado y con la ficha abierta. Teclado de punta a punta (selector, paginación, botón, ficha). G11 a 380 px en Chromium, Firefox y WebKit sobre `/comparar` y `/versiones`. `reduced-motion`: 266 pruebas, mismo árbol. Color nunca solo (marcas con glifo y palabra; vigencia en palabras). **Gate de FORMA aprobado** (M1 y M2) |
| **IA embebida** | ✅ | **Cero IA en runtime.** Cinco corridas de `/investigar` en la sesión de la persona (databricks, snowflake, fabric, fabric gobierno, databricks consumo), cada una aprobada por ella en su terminal. **Relectura de los términos el 2026-10-04**, antes de este release, en `decisions/investigator-7s-compliance.md`: sin cambios que toquen la postura (casilla 7-S de `/deploy-check`) |
| Manual | ✅ | `docs/MANUAL-DE-USO.md` ES/EN: 7 Lado a lado y 8 Versiones del mapa, con limitaciones (lo que `diff` no marca, versiones históricas, un bloque renombrado) |
| Guía de prueba | ✅ | `docs/GUIA-DE-PRUEBA.html` v2, prefijo `bigd-s2-`: 52 pruebas (38 del S1 enteras: 32 «S1» y 6 «Mejorado en S2»; 14 «Nuevo · S2»), ⭐ 7 diferidas al S4, ⭐⭐ 6 paradas ~20 min. Kit con la versión anterior sintética del ejemplo |
| Diseño | ✅ | Fiel a la maqueta salvo las extensiones del ADR `design-system-s2-extensions` (9 filas, cada una con su mirada). `design-sync/` regenerado en el PR (publicar es de S4) |
| ADRs | ✅ | `csp-static-export` · `lcp-budget-by-profile` · `compare-in-the-engine` · `map-versioning` · `design-system-s2-extensions` |
| Constitución | ✅ | `CLAUDE.md` fusionado (fase 0): líneas del diagramador v0.4.0, regla 23 y regla 17 de v1.32.1, sin perder los deltas del S1 |
| `CONTRATO.lock` | ✅ | v0.4.0, 57 huellas iguales a la planeadora de la orden (ver «CONTRATO.lock») |

## Métricas técnicas

| Criterio (SPRINT_002.md) | Meta | Medido |
|---|---|---|
| G5 en `compare` con 3 y 4 plataformas | columnas idénticas por banda, en bloques y desplegado | ✅ propiedad con fast-check; golden de 3 y 4 mapas |
| Determinismo de `compare` | mismo SVG en Node y 3 navegadores × 2 sistemas | ✅ 44 golden, `SHA256SUMS`, job `diagramador` |
| 380 px | una banda a la vez, todas apiladas, sin desplazar la página; G11 × 3 | ✅ e2e y pasada de capturas |
| N sin literal | ningún `3` en el motor ni en el dato | ✅ casilla 6 de la auditoría; `POR_PAGINA` declarada |
| Databricks y Snowflake | aprobados con registro; D11 = 0 a 4 edades; 0 avisos; V9 sin alertas | ✅ el cargador valida en publicación (V1–V16 a cuatro edades) |
| Fabric v0.2.0 y `diff` | sin «lago de datos»; el diff muestra los cambios aprobados | ✅, y además v0.3.0 con «+ nuevo» dibujado |
| LCP | medido tras el subconjunto; ADR si > 2,5 s | ✅ 2478–2783 ms; ADR con techo de 3,0 s |
| Casos del contrato | 34/34 | ✅ 34/34 con `secundarios`; dos inconsistencias del contrato fijadas exactas (A1, C10) |
| `CONTRATO.lock` | 57/57 | ✅ contra `143facf^` (ver abajo) |

## Gate ⭐ — diferimiento y contrapesos

| Contrapeso | Evidencia (archivo, cuenta medida, corrida) |
|---|---|
| Pasada de capturas del builder | Sobre el build de cierre (2026-10-04, datos finales y CSP en las dos carpetas): 44 rutas × 380/1280 × oscuro/claro = **176 encuadres, 13 020 comprobaciones de interacción, 0 fallas**. Leídos como imagen los que cambiaron: `/es/atlas/fabric/versiones` (oscuro 1280 y claro 380), `/es/atlas/databricks/componentes` (claro 1280) y `/es/comparar` (oscuro 1280). La pasada destapó un supuesto del arnés (un solo lienzo por página); se corrigió con su demo en rojo. Antes, en la fase 4: 176 encuadres y 11 588 comprobaciones, más la lectura que encontró la pista que faltaba en `/versiones` a 380 px. Carpeta efímera `<scratchpad>/capturas-cierre`; el registro vive en la bitácora |
| e2e de `reduced-motion` | `tests/e2e/reduced-motion.spec.ts`: **266 pruebas** (4 proyectos), con escucha de errores de hidratación; verde en la CI de cada commit, la última en `2f11545` |

**⭐ diferido: 3 pruebas nuevas al acumulado del ciclo (S1: 4 · S2: 3 = 7).**
- h6: una persona sin formación técnica compara dos plataformas en el lado a lado y dice en qué capa difieren.
- h7: el lado a lado en un teléfono real, una banda a la vez, con el dedo.
- j5: las diferencias entre dos versiones de Fabric, leídas sin la bitácora.

El gate de FORMA no viaja: se corrió y se aprobó (M2).

**Lo que viaja al gate humano del ciclo** (decidido por el constructor o «maquetado, no visto»):
- las extensiones del ADR `design-system-s2-extensions`: el deslizamiento a 1280 px, la vigencia en palabras en el
  rótulo, las tarjetas más ricas en el teléfono, las píldoras por clase y las flechas horizontales;
- miradas de TEXTO:
  - la nota de marcas;
  - la nota del selector;
  - los dos rótulos de reintentos;
  - la línea «histórica» de `/versiones`;
  - el texto de h6;
  - el copy de `/versiones`, que es j5 en el ⭐⭐.

## Registros de las paradas humanas

| Parada | Fecha | Respuesta de la persona |
|---|---|---|
| M1 · FORMA del boceto «en el mismo diagrama» | 2026-10-02 | Primera vuelta: «me gustaria que fuera un solo boton despliga todo y contrae todo». Segunda: «Excelente pero pon el boton en la parte superior derecha del recuadro del diagrama» → aprobada con el ajuste |
| M2 · FORMA del lado a lado en el preview del PR #5 | 2026-10-03 | Primero «continua» sin comentar (se repreguntó, sin construir encima); luego «Si lo abri y lo apruebo, continua» |
| Databricks v0.1.0 | 2026-10-04 UTC | 106 aprobadas · 0 rechazadas, con el comando de la pantalla |
| Snowflake v0.1.0 | 2026-10-04 | 143 aprobadas · 0 rechazadas (aprobó en la pantalla las dos «no verificables», A-43 y A-74) |
| Fabric v0.2.0 | 2026-10-04 | 84 aprobadas · 0 rechazadas |
| P1 (S2-AUD-08): ¿leíste una por una? | 2026-10-04 | «Si» |
| P2 (S2-AUD-06) → `/investigar fabric gobierno` | 2026-10-04 | Fabric **v0.3.0**: 102 aprobadas · 0 rechazadas («Listo todo aprobado») |
| P3 (S2-AUD-07) → `/investigar databricks consumo` | 2026-10-04 | Databricks **v0.2.0**: 131 aprobadas · 0 rechazadas |
| P4 (S2-AUD-32): ¿aparece la CSP en el preview? | 2026-10-04 | «No» → **Alto**, investigado y corregido; re-comprobado guardando la página del preview de `2f11545`: la meta está |

En las cinco aprobaciones el comando corrió en la Terminal de la persona, abierta por ella; el candado del script
de aprobación impide que lo corra un agente.

## Auditoría final (método v1.10.0): hallazgos y pagos

- **Fase 1 (2026-10-04):** cuatro auditores independientes en paralelo (paquete · app · datos e investigador ·
  alcance, frases, guía y documentos) y un quinto que consolidó. **0 Críticos · 0 Altos · 15 Medios · 34 Bajos**
  (49, cada uno con `archivo:línea`, ajuste ejecutable y criterio). Recomendación: «requiere ajustes». Reporte:
  `sprints/SPRINT_002-auditoria.md`.
- **Fase 2 (aprobada: «Si apruebo el plan de ajustes ajusta todo»):** **49/49 pagados**, en cuatro lotes más las
  preguntas de la persona. Cada gate nuevo tiene su rojo registrado en la bitácora.

| Lote | Hallazgos | Commit |
|---|---|---|
| 1 · Paquete | S2-AUD-01, -02, -03, -16, -17, -18, -19, -20, -21, -22, -23 | `3055d88` |
| 2 · Lado a lado, versiones y gates | -04, -05, -24, -25, -26, -27, -28, -29, -30, -31, -36, -49 | `6607e50` |
| 3 · Datos, cargador, investigador y kit | -06 (regla), -07 (gate), -09, -10, -33, -34, -35, -37, -38, -39, -40 | `6bd413a` |
| 4 · Documentos y registros | -08, -11, -12, -13, -14, -15, -41, -42, -43, -44, -45, -46, -47, -48 (registro) | `15247a3` |
| P2 · contenido de S2-AUD-06 | Fabric v0.3.0 | `f80abdb` |
| P3 · contenido de S2-AUD-07 | Databricks v0.2.0; `CONOCIDAS` vacía | `6cce62e` |
| P4 · S2-AUD-32 (**subió a Alto**) | la CSP no estaba en lo que Vercel publica; arreglo y gate nuevo | `2f11545` |

- **S2-AUD-32, el que más enseñó.** En Vercel, Next 16 compila con el adapter de Vercel: dentro de `next build` copia
  las páginas a `.next/output/static/`, y Vercel publica esa copia, no `out/`. El inyector corría después, solo
  sobre `out/`. Ninguna prueba local lo veía: el `vercel build` sin conexión de la fase 0 no tenía el adapter. Lo vio
  la persona al guardar la página del preview. Ahora el inyector escribe en las dos carpetas, y `quality` hace el
  build como Vercel y verifica lo publicado: rojo con el inyector anterior (92 fallas), verde con el arreglo (46
  páginas).
- **Segunda pasada de «¿qué frases caducaron?»** sobre el diff de la Fase 2 y sobre este summary: ver «Frases» al
  final de la bitácora.

## Enmiendas al contrato del diagramador

Para la planeadora (G-Metodo). Las rutas del paquete son relativas a `packages/diagramador/`.

| § | Enmienda | Qué hace el piloto | `archivo:línea` |
|---|---|---|---|
| § 4.4, § 8 | `compare` necesita más opciones que `levelByBand` | `n`/`page` (el consumidor pagina), `part: "all" \| "header" \| "rows"` (filas independientes), `marks` (marcas de diferencia), `texts.lado` | `src/layout/compare.ts:52-60` |
| § 8 | La geometría declara su variante | `Geometria.variante` («n1»/«n2») para que dos variantes de una fila no choquen en ids | `src/layout/compare.ts:711`; `src/layout/tipos.ts:83` |
| § 4.4 | `toCompareCSS` no hace falta | dos SVG por fila y una regla CSS que alterna; nunca se construyó (ADR `compare-in-the-engine`) | app `src/components/atlas/Lado.tsx` |
| § 4.7, § 8 | `diffToText` como salida del contrato | lista explicativa con glifo y palabra, por clase, con flujos y pasos contados | `src/texto/diffToText.ts:25` |
| § 4.7 | `diff` no ve cambios de texto ni de fuentes | la app los cuenta aparte en «Lo que dicen los componentes» (Fabric v0.1.0 → v0.2.0 da «sin cambios en el dibujo») | `src/diff.ts:1`; app `src/lib/atlas/versiones.ts:19`, `:146-160` |
| § 4.7 | `diff` no ve el renombre de un **bloque** | Databricks v0.2.0 renombró «Tableros» → «Tableros y aplicaciones» y la página no lo dice; el manual lo declara como limitación | `src/diff.ts:1` |
| § 5.4 | Paths de las marcas de diferencia (+, −, →, ▮) | los de la maqueta, solo en el `<defs>` del lado a lado | `src/svg/glifos.ts:43` |
| § 4.8, G7 del semáforo | El lado a lado no lleva insignias de vigencia | no caben a 118 u (la matriz de envejecimiento dio 44/75/22/30 avisos); el estado va en palabras en el rótulo de la fila | `src/layout/compare.ts:254`, `:551` |
| § 5.6 | Dos tipos de aviso nuevos | `texto:` (más líneas que la caja; palabra que no cabe; cabecera de franja más alta que su fila) y `pistas: <x> corre bajo la punta de <y>` | `src/layout/tipos.ts:14`; `src/layout/index.ts:23` |
| P13 | Respuesta, en su forma mínima | asignar siempre junto a la columna movía casi todo el dibujo aprobado; se reparan solo las pistas a menos de 9 u de una tarjeta que tapan una punta. Antes: 4 puntas (P1 y Fabric); después: 0, con los golden idénticos | `src/layout/rutas.ts:185`, `:240-257` |
| P13 | La punta de llegada mide 9 u, no 8 | el detector usa 9 u | `src/layout/d11.ts:98` |
| § 7 (V16) | V16 también dibuja la fila del lado a lado | contraída y desplegada, a cada edad | `src/validar/v16.ts:44-45` |
| § 7 (V16) | Sin `texts`, V16 no corre | en privado es aviso; en publicación, **error** (S2-AUD-19) | `src/validar/index.ts:45` |
| § 8 | `agingDates` como API | exportada; la app la usa para su matriz | `src/index.ts:5`; `src/validar/v16.ts:17` |
| § 8 | `toSVG` no recibe `texts` | los títulos llegan hechos desde `layout`; § 8 dice `toSVG(geometry, { language, texts, … })` | `src/svg/toSVG.ts:39` frente a `CONTRATO.md:492` |
| § 8 | Plurales por idioma | `{ one, other }` llegan como dato, pero la forma se elige con `n === 1` fijo; § 8 pide plurales «como dato por idioma» | `src/layout/contexto.ts:116` |
| § 4.5 frente a § 8 | Nombres de opciones contradictorios | § 4.5 dice `textos`/`fechaConsulta`; § 8, `texts`/`queryDate`. Manda § 8 | `CONTRATO.md:239` frente a `:492-501` |
| § 8 | Vistas `nivel1`/`nivel2` | el piloto adoptó los nombres de § 8 (antes `nivel-1`); solo registro | `CONTRATO.md:488` |
| Carnadas | A1 no pasa V16 en publicación | su nodo de `ia` ocupa 3 líneas donde caben 2; se fija exacto | `test/carnadas.test.ts:25-32` |
| Carnadas | C10 no declara sus cuatro alertas V3 | sus bloques vacíos disparan la alerta que la misma 0.4.0 introdujo; se fija exacto | `test/carnadas.test.ts:34-42` |
| § 12 | Entidades de una afirmación | § 12 lista nodo, flujo, bloque y paso; el piloto solo cita `nodo` y `flujo`. Propuesta: que § 12 declare bloques y pasos como agrupación y narración editoriales, sin cita, o que el piloto los cite desde el S3 | app `src/lib/investigador/esquema.ts:27`, `:41` |
| § 12 | «Sin novedades» renueva fechas de más | renueva la fecha de verificación de todos los nodos, también la de uno cuyas afirmaciones quedaron «no verificables» | app `src/lib/investigador/aprobar.ts:143-147`, `:161-164` |
| Esquema del mapa | Las fuentes de un mapa no llevan `conflicto_de_interes` | solo lo llevan las citas de la propuesta | app `src/lib/investigador/esquema.ts:17-21` |
| G15, fuentes | Recorte profundo de las dos woff2 | el subconjunto a la cobertura ya estaba hecho; ahorrar más exige quitar rasgos y estrechar ejes, y eso toca la maqueta y la cadena G15 | `decisions/lcp-budget-by-profile.md:35` |
| Lado a lado | Letra del rótulo de fila | se pinta con la letra del cuerpo (como la maqueta) y se mide con la mono, más ancha (lado seguro) | `src/layout/compare.ts:551` |

**El contrato v0.5.0** (`143facf`, publicado el 2026-10-04 durante este sprint: `papel`, condiciones, `fuente
codigo`, hexágono, métricas de Inter) no entra aquí. Su renovación va a la orden del S3.

## Registro de fallas del diagramador (síntoma · causa · regla · carnada)

| # | Síntoma | Causa | Regla | Prueba o carnada que la cubre |
|---|---|---|---|---|
| 1 | Las insignias de vigencia del lado a lado se salían de su columna (44, 75, 22 y 30 avisos según la variante) | la insignia montada no cabe en un bloque de 118 u y pisa el nombre en el nivel 2 | § 4.8, G11 | matriz de envejecimiento sobre `compare` (`test/compare.test.ts`); se decidió no dibujarlas |
| 2 | Cuatro puntas de flecha bajo la pista de otro flujo (P1 nivel 2 y recorrido; Fabric nivel 2) | la pista más externa corre a 6 u de la tarjeta, dentro de una punta de 9 u | P13 | `test/densidad.test.ts` (P13 en 19 dibujos y P1); aviso `pistas:` |
| 3 | Las píldoras «madurez» + «nuevo» se metían en la columna vecina | a 118 u no caben dos en una fila | § 5.6 `encima`, G11 | «las píldoras no salen de su tarjeta» y matriz «diferencias» |
| 4 | Fabric v0.1.0 → v0.2.0 daba «sin diferencias» con seis textos y nueve fuentes cambiados | `diff` solo compara nodos por nombre y madurez | § 4.7 | app `tests/unit/versiones.test.ts` (enmienda arriba) |
| 5 | Databricks v0.1.0 → v0.2.0 no dice que un bloque cambió de nombre | `diff` no compara bloques | § 4.7 | registrado; el manual lo declara (enmienda arriba) |
| 6 | Con `marks` y `n`/`page`, las marcas se perdían sin aviso | `n`/`page` paginaban y las marcas suponían dos filas | § 4.7 | `compare.test.ts`, precondiciones (S2-AUD-02) |
| 7 | Una banda vacía en el nivel 2 decía «sin bloque» | rotulaba con el texto de un grupo sin bloque | § 4.4 | `compare.test.ts`, «banda vacía» (S2-AUD-16) |
| 8 | Un mapa repetido duplicaba ids; `compare([])` dibujaba un vacío | faltaban precondiciones | D12, G14 | `compare.test.ts`, precondiciones (S2-AUD-17) |
| 9 | Los avisos de distintas filas se fundían en uno | el `id` del aviso no llevaba la fila | § 5.6 | avisos con prefijo `${fila}/${id}` (S2-AUD-20) |
| 10 | `diffToText` ordenaba mal con tres clases de banda | el comparador no era total | § 4.7 | `compare.test.ts`, carril y franja (S2-AUD-23) |
| 11 | V16 en publicación pasaba sin `texts` | fallaba abierto | § 7 | `test/v16.test.ts` (S2-AUD-19) |
| 12 | G7 no veía un idioma que faltara en `etiqueta_corta` | la validación de textos no la recorría | G7 | `test/madurez-corta.test.ts` (S2-AUD-01) |

## Decisiones no anticipadas

- **ADR `csp-static-export`:** meta con huellas tras el build; la maqueta con CSP de cabecera; desde S2-AUD-32,
  inyección en cada carpeta publicada y build como Vercel en la CI.
- **ADR `lcp-budget-by-profile`:** techo de 3,0 s por perfil (texto medido con tabla y `display: block`),
  presupuesto de 2900 ms; el subconjunto ya estaba hecho.
- **ADR `compare-in-the-engine`:** `compare` en el paquete, dos variantes por fila, el estado en la URL con script
  previo al pintado, `POR_PAGINA` declarada, el teléfono en HTML.
- **ADR `map-versioning`:** archivo byte a byte al aprobar, migración en cadena, versiones históricas, qué dibuja
  la página. Lleva su primer y segundo uso real.
- **ADR `design-system-s2-extensions`:** 9 extensiones del design system, cada una con su mirada.
- **Menores registradas en la bitácora:** filas independientes en lugar de `toCompareCSS` (D-S2-07 simplificada);
  la excepción de `braces`; `testTimeout` de 20 s.

## Bugs + resoluciones

| Bug | Cómo se vio | Resolución |
|---|---|---|
| La CSP no estaba en lo que Vercel publica (S2-AUD-32) | P4: la persona guardó la página del preview | inyección en `.next/output/static/`; gate `verificar-salida.mjs` en `quality` |
| La CSP bloqueaba los `<style>` al cambiar de nivel sin recargar | al diseñar `/comparar` | huellas de estilo de todo el sitio en cada página; `csp.spec` navega sin recargar |
| La CSP bloqueó un `Function()` del polyfill de `crypto` | `csp.spec` en 4 motores (64 casos en rojo) | `canonico` en un módulo sin `crypto` |
| Al hidratar una URL con consulta, las filas saltaban (S2-AUD-04) | auditoría | `Lado.tsx` escribe desde la URL real; prueba con `hydrateRoot` |
| `/versiones` a 380 px sin pista ni sombras | lectura de capturas | `ControlLienzo` por par |
| `design-sync` desfasado por una clase nueva (`9604802`) | CI `quality` en rojo | regenerado; desde entonces, `pnpm test` entero antes de cada push |
| Aviso alto de `braces` sin corrección (`8c6f980`, `6d375de`) | CI `quality` en rojo | excepción angosta con gate (deuda) |
| El verificador cortado por GlobeNewswire (HTTP/2) | corrida de Snowflake | reintentos con HTTP/1.1 y sin agente (S2-AUD-39) |
| Una prueba de huella rompía el YAML y no la huella | ensayo de Databricks v0.2.0 | «Casi» dentro de las comillas |
| El arnés de capturas suponía un lienzo por página | pasada de cierre (Fabric con dos pares) | recorre cada lienzo; demo en rojo |
| Una sustitución de texto duplicó media bitácora | relectura | reconstruida; ediciones literales desde entonces |

## Qué salió bien / qué generó fricción

- **Bien:**
  - M1 sobre un boceto barato cambió la forma antes de construirla: «un solo botón» salió de la persona y no de la
    maqueta;
  - los gates de CSP atraparon dos defectos que nadie más veía (el `<style>` al navegar y el `Function()` del
    polyfill);
  - la auditoría independiente y la Fase 2 «pagar todo» dejaron 49/49;
  - las preguntas de la persona (P2, P3) convirtieron dos deudas de contenido en mapas nuevos el mismo día;
  - la P4, hecha con la página guardada, encontró el único defecto de producción del sprint.
- **Fricción:**
  - las aprobaciones al principio no dejaron evidencia de lectura (S2-AUD-08), hasta la P1;
  - Cmd+Opt+U no abre el código en Safari sin su menú de desarrollo: la primera respuesta a la P4 pudo ser un falso
    «no». Guardar la página (Cmd+S) es la mecánica fiable;
  - la máquina cargada por otras sesiones dio tiempos agotados locales: la CI fue la referencia;
  - la planeadora publicó el contrato v0.5.0 a mitad del sprint.

## Sugerencias de mejora al método

1. **Gate de lo que el proveedor publica (kit, perfil `--estatico`; regla 15, «el modo»).** Un paso posterior al
   build que modifica `out/` (CSP, manifiestos, huellas) no llega a producción si el proveedor publica otra carpeta.
   Con Next 16 en Vercel, el adapter copia las páginas durante `next build`. El job `quality` del kit debería hacer
   el build como el proveedor (`vercel build` sin conexión, con `NEXT_ENABLE_ADAPTER=1`) y verificar lo publicado.
   Un `vercel build` local sin el adapter no reproduce el entorno de Vercel.
2. **La mirada del preview se hace con la página guardada** (Cmd+S), no con Cmd+Opt+U, que en Safari no hace nada
   sin el menú de desarrollo y lleva a buscar en la página visible.
3. **El comando de aprobación sale de la pantalla de revisión** (S2-AUD-08). Si el constructor lo deja en el
   portapapeles, lo extrae del HTML compilado de esa pantalla, comprueba que sus ids coinciden con los de la
   propuesta y avisa que no se pegue si la persona desmarcó algo. Así se hizo en P2 y P3.
4. **El verificador de citas reintenta con HTTP/1.1 y sin agente** cuando un servidor corta la conexión (S2-AUD-39).
   Vale para el patrón de citas comprobadas por código de cualquier app.
5. **Regla dura 4 de `CLAUDE.md`** (S2-AUD-48): dice «una en teléfono», y la orden y el producto muestran «una banda
   a la vez, con todas las plataformas apiladas». Que la planeadora la redacte así en la constitución de la app.
6. **Las mutaciones de una prueba de integridad deben romper lo que la prueba dice medir.** Una mutación que rompe
   el YAML pasa por el error equivocado y deja de medir la huella cuando cambian los datos.

## Deuda técnica aceptada

| Qué | Por qué | Dónde | Pago |
|---|---|---|---|
| Excepción del aviso alto de `braces` en `pnpm audit` | no hay versión corregida; solo llega por herramientas de desarrollo (gate: ninguna dependencia de producción lo alcanza) | `pnpm-workspace.yaml:18-26`; `tests/unit/avisos-ignorados.test.ts` | cuando exista `braces` 3.0.4 o `eslint-config-next` deje de pedirlo; `/deploy-check` lo revisa |
| Contrato v0.5.0 sin aplicar | llegó a la planeadora durante el sprint; la orden pide 0.4.0 | `packages/diagramador/CONTRATO.lock` | orden del S3 |
| CLI de Vercel fijado fuera del lockfile (`pnpm dlx vercel@60.1.3`) en `quality` | el gate de S2-AUD-32 necesita el builder de Vercel; dependabot no lo ve | `.github/workflows/ci.yml` | subirlo a mano cuando Vercel cambie su builder; re-verificar el rojo |
| Recorte profundo de las fuentes | toca la maqueta (solo lectura) y la cadena G15 | `decisions/lcp-budget-by-profile.md:35` | enmienda a la planeadora |

La deuda de vocabulario de Databricks (S2-AUD-07) y la madurez de «Seguridad de OneLake» (S2-AUD-06) **se pagaron**
con las investigaciones de P3 y P2: `CONOCIDAS` está vacía.

## Jobs y checks

`quality` · `e2e` · `lighthouse` · `diagramador (ubuntu-latest)` · `diagramador (macos-latest)` · Vercel, con
conclusión propia `success` en `2f11545`. Ningún job nuevo. `quality` corrió por primera vez el build como Vercel en
`2f11545` («csp publicada: 46 páginas…»): sin histórico de ese paso no se afirma regresión ni no-regresión. Cero
comentarios de `vercel[bot]` en el PR desde que la persona los apagó (fase 0).

## CONTRATO.lock

`packages/diagramador/CONTRATO.lock` v0.4.0, **57 archivos** (51 del contrato + 6 de `metricas/`). Contra la
planeadora anterior a `143facf` (`git archive 143facf^`, con `DIAGRAMADOR_ORIGEN`): **57/57 idénticos**. Contra la
planeadora de hoy, `scripts/contrato/verificar.mjs` dice «DERIVA» en 6 archivos: es el contrato v0.5.0, que va al
S3.

## Archivos clave

1. `packages/diagramador/src/layout/compare.ts`: el lado a lado del contrato.
2. `packages/diagramador/src/texto/diffToText.ts`: la lista de diferencias.
3. `src/components/atlas/Lado.tsx`: el lado a lado en producto.
4. `src/lib/atlas/versiones.ts`: la página de versiones y lo que `diff` no ve.
5. `src/lib/datos/cargar.ts`: versiones archivadas e históricas.
6. `src/lib/datos/migrar.ts`: migración en cadena.
7. `scripts/csp/inyectar.mjs`: la CSP en cada carpeta publicada.
8. `scripts/csp/verificar-salida.mjs`: el gate de lo que Vercel publica.
9. `scripts/verificar-citas.mjs`: citas con reintentos.
10. `decisions/compare-in-the-engine.md`: la forma del lado a lado.

## Cómo probar

- `pnpm install && pnpm test` (1397 pruebas con cobertura) y `pnpm build && pnpm start`:
  - `/es/comparar`: «Desplegar todo», «Siguiente», el selector;
  - `/es/atlas/fabric/versiones`: dos pares, con «+ nuevo» en Gobierno;
  - `/es/atlas/snowflake/versiones`: el estado vacío.
- `E2E_PUERTO=3147 pnpm test:e2e`, con el servidor libre en ese puerto.
- La guía `docs/GUIA-DE-PRUEBA.html`, con doble clic: bloques H (lado a lado), I (Databricks y Snowflake) y J
  (versiones); el ⭐⭐ tiene 6 paradas (~20 min).
- La CSP de lo publicado, como en la CI:
  `NEXT_ENABLE_ADAPTER=1 pnpm dlx vercel@60.1.3 build --yes` (con un `.vercel/project.json` mínimo) y
  `node scripts/csp/verificar-salida.mjs .vercel/output/static out`.
