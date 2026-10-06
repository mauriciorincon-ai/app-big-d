---
sprint: 003
app: big-d
feature: el-comparador
branch: sprint-003/comparador
orden: portafolio/big-d/ordenes/SPRINT_003-orden.md (planeadora, G-Plan 2026-10-04)
plan: aprobado 2026-10-04 · «construye» 2026-10-04
---

# Sprint 003 — bitácora de implementación (Big-D · «El comparador»)

## Plan aprobado (resumen)

Cinco fases con parada al final de cada una (espera «continúa»):

| Fase | Qué | Parada humana |
| ---- | --- | ------------- |
| 0 | Constitución regenerada, kit v1.39.0, contrato v0.6.0 (+ lo pendiente de la 0.5.0) con lock 57/57 y `origen`, deuda del S2, DS v0.6, PR en borrador | «continúa» |
| 1 | Datos (capacidades, criterios, escala, convenciones, evidencias, caso) y núcleo `src/engine/` (puntaje, sensibilidad, pros y contras, huella, vigencia) con propiedades y la misma huella en 3 navegadores | «continúa» |
| 2 | SMAA en un Web Worker con su gate de contrato y las pantallas base, perfil y comparación | «continúa» (sin gate de FORMA: fidelidad a la maqueta) |
| 3 | M1 (boceto de la revisión de evidencias) · modo evidencias de `/investigar` · P0 ensayo con la Plataforma Ejemplo · P1–P3 databricks, snowflake, fabric · instantánea · parada de DECISIÓN del perfil | M1 sí/no · P0–P3 en tu terminal · D1… una pregunta por mensaje + tu comando |
| 4 | Instrumento y gate de publicación, matriz de envejecimiento, e2e, guía v3, manual, ADRs, `design-sync/`, `/audita-sprint`, `/deploy-check`, summary | aprobación de la fase 2 de la auditoría |

Tus respuestas en el plan (2026-10-04): las 11 evidencias de la Plataforma Ejemplo las propongo yo y las apruebas tú
como ensayo; el perfil queda «aprobado» con tu comando, armado por la pantalla del perfil.

## Fase 0 — Setup, contrato v0.6.0 y kit v1.39.0 (2026-10-04)

### Supuestos del kit

| # | Supuesto | Resultado |
| - | -------- | --------- |
| K1 | `githooks/pre-commit` ejecutable y `core.hooksPath = githooks` | ✓ 100755 · `githooks` |
| K2 | scripts `typecheck · lint · test · test:e2e · build · start` | ✓ los seis |
| K3 | `pnpm peers check` limpio | ✓ «No peer dependency issues found» |
| K4 | `ci.yml` con los 5 checks de la ruleset `main-protegida` | ✓ `quality, e2e, lighthouse, diagramador (ubuntu-latest), diagramador (macos-latest)` (leído con `gh api …/rulesets`) |
| K5 | Carnada canónica bloqueada por el hook de escritura | ✓ `gitleaks-escritura.test.ts` y `githooks-pre-commit.test.ts`, 5/5 (gitleaks 8.30.1) |
| K6 | Cero PRs de dependencias abiertos | ✓ 0 abiertos (el #6 se cerró al mergear el #7) |
| K7 | `build-como-proveedor.mjs --solo-detectar` | ✓ «aplica (output: "export")» |
| K8 | `demo-rojo.sh --debe-nombrar` sobre un gate existente | ✓ lint «cero IA en runtime»: `import "openai"` en `src/lib/observability.ts` → rojo nombrando «Cero IA en runtime» → restaurado (Python + cmp) → verde |
| K9 | El hook de secretos falla cerrado sin gitleaks (kit v1.37.0) | ✗ el de la app avisaba y dejaba pasar → se paga en esta fase (D-S3-02) |

### Fricciones con el kit (K-S3-n, van a «Sugerencias» del summary)

- **K-S3-1.** `scripts/demo-rojo.sh` guarda su respaldo en `.demo-rojo/`, pero la plantilla `gitignore.plantilla` del
  kit no lo ignora: un `git add -A` tras una demo lo subiría. Se añadió a `.gitignore`.
- **K-S3-2.** `tests/unit/hook-secretos.test.ts` del kit supone el hook de shell del kit (matcher exacto
  `Write|Edit`, `jq`, aviso en stdout). El de Big-D es un script de Node que también cubre MultiEdit y NotebookEdit y
  avisa en stderr (lo que Claude Code le muestra al agente al bloquear con 2). Se adaptó la prueba: busca el hook por
  su comando, pone `node` en el PATH vacío, fija `CLAUDE_PROJECT_DIR` y lee stderr. Además el hook del kit escribe
  su aviso en stdout: con exit 2, el agente no ve por qué lo bloquearon.
- **K-S3-3.** El `ci.yml` del kit corre `pnpm build` y luego `build-como-proveedor.mjs`, que vuelve a construir
  (`vercel build` corre `pnpm build`). Big-D construye una sola vez: solo el paso del proveedor, y luego su
  verificación de la meta CSP como superconjunto.
- **K-S3-4.** `plan-sprint.md` v1.36.0 reescribió (f) con las tres clases de mirada y perdió el ítem 10
  (`/audita-sprint` obligatoria), «`gh pr checks` tras CADA push» y «segundas vueltas sin parada». La app fusionó:
  el (f) del kit más esas tres cosas.
- **K-S3-5.** La constitución regenerada se contradice en dos puntos: la línea 181 dice que se compara
  `.next/output/static/` (el script compara `.vercel/output/static`), y la regla 10 dice «dos clases de mirada»
  mientras `plan-sprint` v1.36.0 dice tres. Se copió tal cual (la orden pide copia entera).

### Constitución (D-S3-01)

`CLAUDE.md` = copia byte a byte de `ordenes/CLAUDE-md-para-app.md` (`cmp` sin diferencias; 792 líneas; centinela «lo
que el proveedor publica no es lo que el build escribe» presente una vez). La copia solo pierde la historia de la
cabecera anterior, que queda aquí:

> Sincronizada con el CONTRATO v0.4.0 el 2026-10-01 (líneas del diagramador regeneradas: V1–V16, franjas abajo, sin
> angosta). Sincronizada antes el 2026-09-27 (S1, fase 0): sección Stack/IA + regla 7-S; aplica además los deltas del
> kit v1.30.0/v1.31.0. Deltas aplicados el 2026-09-27 (S1, fase 0), desde `kit-app/CLAUDE.md` v1.32.0: dos clases de
> mirada (regla 10), `gh pr checks` tras cada push y métrica `manual` (regla 15), «preview del PR #N» (regla 17),
> comprobación mecánica de dependencias (regla 18) y reglas 21 y 22. Deltas aplicados el 2026-10-02 (S2, fase 0):
> líneas del diagramador v0.4.0; desde `kit-app/CLAUDE.md` v1.33.0, la regla 23 y la regla 17 de v1.32.1.

Bajo las tres clases de mirada (kit v1.36.0), M1 —una pantalla nueva fuera de la maqueta aprobada— es de
**DECISIÓN** y abre parada, como dice el plan.

### Kit v1.34.0 → v1.39.0 (D-S3-02)

| Archivo | Qué se hizo |
| ------- | ----------- |
| `scripts/demo-rojo.sh` | copia (v1.38.0, `--debe-nombrar`, `--minimo-tests`) |
| `scripts/degradaciones-permitidas.json` | copia (`[]`) |
| `scripts/verificar-dependencias.mjs` + `tests/unit/verificar-dependencias.test.ts` | copia del kit: trae la «bajada forzada» de Big-D, la lista declarada y falla cerrado sin base |
| `scripts/build-como-proveedor.mjs` · `scripts/verificar-salida-publicada.mjs` · `tests/unit/salida-publicada.test.ts` | copia; en `quality` reemplazan el paso a mano del S2 (K-S3-3) |
| `scripts/lighthouse-margen.mjs` | copia; en `lighthouse` tras los dos `lhci assert` |
| `.claude/COMANDOS.md` · `.claude/commands/audita-sprint.md` · `.claude/skills/diseno-ui.md` | copia |
| `.claude/commands/plan-sprint.md` | fusión (K-S3-4) |
| `.claude/commands/deploy-check.md` | fusión: el del kit (§4 contra `merge-base`, perfil estático, homepage que se repara) con las casillas de Big-D (7-S con `/investigar` y la matriz con sus pruebas) |
| `.claude/settings.json` · `scripts/hooks/gitleaks-escritura.mjs` · `tests/unit/hook-secretos.test.ts` | el hook propio falla cerrado sin gitleaks o si gitleaks no termina en 0/1; `KIT_SIN_GITLEAKS=1` lo salta; prueba del kit adaptada (K-S3-2) |
| `decisions/audit-exception-braces.md` · `tests/unit/avisos-ignorados.test.ts` | ADR de la excepción (kit v1.34.0) y la prueba exige un ADR por aviso ignorado |
| `.gitignore` | `.demo-rojo/` (K-S3-1) |

### Gates nuevos de la fase (regla 15: ¿puede fallar? · rojo · a quién nombró · verde)

| Gate | ¿Puede fallar? | Rojo (mutación) | A quién nombró | Verde |
| ---- | -------------- | --------------- | -------------- | ----- |
| Hook de secretos falla cerrado (`hook-secretos.test.ts`) | Sí: si el hook vuelve a dejar pasar sin gitleaks | `process.exit(0)` antes del aviso «falta gitleaks» (`demo-rojo.sh`) | «sin gitleaks bloquea, y lo dice» | ✓ 4 pruebas, restaurado con cmp |
| ADR por aviso ignorado (`avisos-ignorados.test.ts`) | Sí: un `ignoreGhsas` sin ADR con fecha y condición de retiro | «## Retirement condition» → «## When to remove it» en el ADR (`demo-rojo.sh`) | «cada aviso ignorado tiene su ADR» | ✓ 4 pruebas |
| `verificar-dependencias.mjs` falla cerrado sin base | Sí | `node scripts/verificar-dependencias.mjs origin/no-existe` | «no puedo leer la rama base origin/no-existe … Un gate que no puede mirar no está verde» (exit 1) | ✓ `origin/main`: 669 paquetes, ninguno por debajo (exit 0) |

### Contrato v0.6.0 con lo pendiente de la 0.5.0 (D-S3-03, D-S3-04)

- **Copia y lock.** `node scripts/contrato/fijar.mjs --origen c8d3957 --copiar` copió los 51 archivos del contrato con
  `git show` desde el árbol de ese commit (no del HEAD, ni con un editor) y escribió el lock: `version: 0.6.0`,
  `origen: c8d395766dbc824d722d7eee4f567cfafac8f64b`, 57 huellas (51 + las 6 de `metricas/`). `verificar.mjs`
  compara contra ese commit y solo informa la deriva frente al HEAD: «✓ v0.6.0, 57 archivos idénticos a su origen
  (c8d3957) · el HEAD de la planeadora (c8a8dd3) no cambió reusables/diagramador desde el origen».
- **Versión y migración.** `CONTRATO_VERSION` 0.6.0 y los saltos 0.4 → 0.5 → 0.6 en memoria (el CHANGELOG los declara
  sin ruptura); Fabric, Databricks, Snowflake y sus versiones archivadas cargan con su huella aprobada.
  `desde-contrato.mjs` regeneró la gramática y la Plataforma Ejemplo; las recetas del kit de prueba, su muestra.
- **0.6.0.** Plurales por la regla del idioma (tabla propia es/en/de/it/fr/pt, sin `Intl`; un idioma sin regla es
  error) · `diff` compara bloques por id y nombre (F-030): píldora «renombrado» en el bloque del lado a lado y líneas
  de bloque en `diffToText` · `carnadas.test` sin `DIBUJO_CONOCIDO` ni `ALERTAS_CONOCIDAS` (A1 en privado: sus dos
  líneas de más llegan como avisos V16; C10 con sus cuatro V3 en `secundarios`) → **34/34**.
- **0.5.0.** `nodo.papel` (marcador dentro de la esquina superior derecha de la tarjeta; su palabra en el nombre
  accesible y en la lectura) · `condicion` en tres formas, V13 con mensaje de las tres y **V17** · fuente `codigo`
  escrita `ruta:lineas`, jamás como enlace (la app rechaza una fuente de código en una plataforma ficticia y el
  investigador solo cruza fuentes con URL) · glifo `hexagono` · `options.fuente_metricas` (una tabla por fuente,
  probada con una segunda tabla de fixture; Inter no entra al paquete y el lock se queda en 57).
- **Validador.** Con las formas alternativas (`anyOf`), Ajv reportaba cada forma: una fuente sin título daba cinco
  entradas. Se queda la forma más cercana. El validador compilado ya no lleva las anotaciones del esquema (`title`,
  `description`): la 0.6.0 nombra la gramática `agentes-ia` en una descripción y G3 lo cazó en el código del paquete.
- **Golden.** De los 44, cambian **solo** los 6 de `agente-ejemplo`, y solo por el glifo: un script reemplazó en la
  versión anterior `g-escudo` por `g-hexagono` en los `<use>` y quitó de la nueva la definición del hexágono, y los
  dos textos quedaron idénticos en los 6. Las definiciones nuevas (`g-hexagono`, `p-inicio`, `p-fin`) van al final
  del `<defs>` y solo en el SVG que las usa. Nace `lado.diferencias-bloque` (es/en): el renombre de un bloque, con su
  píldora (2 usos de la marca contra 1 en `lado.diferencias`). Determinismo: 6/6 en Chromium, Firefox y WebKit
  (local).
- **App.** `/versiones` de Databricks dice «Bloque; antes «Tableros»» y marca el bloque renombrado (prueba nueva en
  `versiones.test.ts`, es/en). El manual (ES/EN) deja de decir que la página no ve el renombre de un bloque.
- **Para «Enmiendas al contrato del diagramador»** (summary): el path del marcador de `papel` (§ 5.4 no lo trae; el
  piloto propone disco lleno para inicio y anillo con disco para fin, en caja de 12 u) · V17 no está en la tabla de
  § 7 ni fija su id (el piloto la reporta en cada rama por defecto que sobra, con el id del flujo) · el nombre
  `fuente_metricas` contradice la regla de § 8 de nombres de API en inglés · `diffToText` conserva la firma
  `(antes, después, gramática, opciones)`: necesita los nombres y las bandas de lo retirado, que el resultado de
  `diff` no trae · la etiqueta `f(entradas)` de § 3.4: ninguna regla de § 4/5 dice dónde se dibuja sobre la línea ni
  cómo se evita que pise otra cosa (G11, D11); el piloto la escribe en la lectura en texto (las tres formas) y no
  sobre el dibujo · los textos nuevos de interfaz (`papel`, `condicion`, `lado.detalle.bloque`,
  `ficha.tipoFuente.codigo`) son opcionales: un consumidor cuyos mapas no los usan no los trae, y si los usa sin
  ellos el motor da un error claro.

### Design system v0.6 (D-S3-17)

`design-system.md` 0.5.2 → **0.6.0** (el frontmatter decía 0.5.1): se funden las cinco decisiones del S1 y las nueve
filas del S2 (ADR `design-system-s1-extensions` y `design-system-s2-extensions`, que quedan como registro de cómo se
vio cada una), se corrigen las tres líneas que el ADR del S2 señaló (el conmutador «Ver: bloques / componentes», el
selector que no filtraba, la nota de marcas y el selector «del S1») y § 10 dice que la maqueta conserva lo
reemplazado. Sin mirada: documenta lo que la persona ya vio o un ADR decidió. `design-sync/README.md` cita la 0.6.0;
el bundle regenerado no cambia (`node scripts/design-sync/generar.mjs`, 11 archivos).

### Gates nuevos del contrato (regla 15)

| Gate | ¿Puede fallar? | Rojo (mutación) | A quién nombró | Verde |
| ---- | -------------- | --------------- | -------------- | ----- |
| Forma más cercana de un `anyOf` (`contrato-0-6.test.ts`) | Sí: sin el filtro, una fuente sin título da varias entradas | `formaMasCercana(errores)` → `errores` en `esquema.ts` | «una fuente sin título da UNA entrada» | ✓ 17 pruebas |
| V17 (`contrato-0-6.test.ts`) | Sí | la segunda rama por defecto ya no se cuenta | «V17: dos ramas por defecto» | ✓ 17 pruebas |
| `origen` en el lock (`contrato-lock.test.ts`) | Sí: un lock sin el commit de origen | la línea `origen:` comentada en `CONTRATO.lock` | «fija el commit de la planeadora» | ✓ 61 pruebas |
| `verificar.mjs` contra el commit | Sí | un espacio al final de `version: 0.6.0` en `CONTRATO.md` | «CONTRATO.md: la copia no coincide con CONTRATO.lock» | ✓ «57 archivos idénticos a su origen (c8d3957)» |

### Build como el proveedor y margen de Lighthouse (kit v1.37.0 / v1.39.0)

- `node scripts/build-como-proveedor.mjs` en local (vercel@60.1.3 sin conexión, adapter de Next): «✓ 59 páginas
  publicadas idénticas a out» (incluye las 13 de la maqueta en `diseno/`, que el verificador de la CSP no mira) y
  después `node scripts/csp/verificar-salida.mjs .vercel/output/static out`: «46 páginas … cada una con su meta e
  idéntica a out». Los dos pasos corren en `quality`.

| Gate | ¿Puede fallar? | Rojo (mutación) | A quién nombró | Verde |
| ---- | -------------- | --------------- | -------------- | ----- |
| Salida publicada = `out/` (`verificar-salida-publicada.mjs`) | Sí: un paso posterior al build que solo toca `out/` | un comentario tras el charset en `out/es.html`, después del build | «es.html: distinta de la de out (13796 vs 13847 bytes)» | ✓ restaurado |
| Cada URL medida tiene presupuesto (`lighthouse-margen.mjs`) | Sí, pero solo si una URL queda fuera de `perf-budget.json`; el margen bajo el 10 % avisa y no falla | `"path": "/*"` → `"/es/*"` | «la URL medida /en no cae bajo ningún path» (y las otras /en) | ✓ exit 0 |

### CI del PR #8 (borrador) y margen de Lighthouse

- **Push de `c764f3a`** (commits `d4de420`, `471c522`, `c764f3a`), corrida 37241742843, leída con `gh pr checks 8`
  y `gh run view`: `quality` · `e2e` · `lighthouse` · `diagramador (ubuntu-latest)` · `diagramador (macos-latest)`,
  los cinco con conclusión propia `success`; Vercel `pass`. Cero comentarios en el PR (ni del bot ni de nadie).
  Sigue en borrador y su cuerpo empieza con la línea del merge.
- **Cifras de la corrida:**
  - `quality`: 1443 pruebas pasan y 4 se saltan (1447).
  - `verificar-dependencias`: 669 paquetes, ninguno por debajo de `origin/main`.
  - `build-como-proveedor`: 59 páginas publicadas idénticas a `out/`.
  - CSP publicada: 46 páginas con su meta e idénticas a `out/`.
  - `diagramador`: 901 pruebas en Node y 6 huellas en 3 navegadores, en ubuntu y en macOS.
  - `e2e`: 785 pasan.
- **Primera vez en CI** (regla 15, «¿lo viste correr?»): el paso `build-como-proveedor.mjs` en `quality`,
  `lighthouse-margen.mjs` en `lighthouse` y las 3 pruebas del hook de secretos que no necesitan gitleaks. Sin
  corrida anterior no hay histórico contra el cual afirmar regresión o no-regresión.
- **K-S3-6.** El runner de CI no trae gitleaks. Las 4 pruebas que lo necesitan se saltan ahí:
  - `gitleaks-escritura` (2);
  - la de la carnada en `githooks-pre-commit` (1);
  - la de la carnada en `hook-secretos` (1).

  Corren en local (K5, 5/5 con gitleaks 8.30.1). Viene del estampado. La carnada solo se ve bloqueada en la máquina
  del usuario. Va a «Sugerencias» y a la auditoría como candidata: instalar gitleaks en `quality`, con su rojo.
- **Margen de Lighthouse:** `lighthouse-margen.mjs` avisó 4 veces, todas de LCP, con medianas de 3:
  - `/es/atlas/plataforma-ejemplo/recorrido`: 2706 ms;
  - `/en/atlas/plataforma-ejemplo/recorrido`: 2709 ms;
  - `/es/atlas/fabric/recorrido`: 2710 ms;
  - `/es/comparar`: 2733 ms.

  Contra el presupuesto de 2900 ms el margen va del 5,8 al 6,7 %; contra el techo de 3,0 s, del 8,9 al 9,8 %.
  **Decisión en `decisions/lcp-budget-by-profile.md` § «Margin against the budget»:** el margen bajo el 10 % se
  acepta a sabiendas, porque los 2900 ms ya son la alarma 100 ms bajo el techo del ADR. El presupuesto no se sube.
  El aviso sigue encendido, y la única palanca es el subconjunto de las fuentes, que va a «Enmiendas». La fase 4
  vuelve a medir con las 4 rutas nuevas.
- **Push de `d327a78`** (el ADR del margen y esta sección), corrida 37242950293: los cinco checks con conclusión
  propia `success`, Vercel `pass`, cero comentarios. `lighthouse-margen` avisó 5 veces, todas de LCP:
  - `/es/atlas/plataforma-ejemplo/recorrido`: 2712 ms;
  - `/en/atlas/plataforma-ejemplo/recorrido`: 2711 ms;
  - `/es/atlas/fabric/recorrido`: 2713 ms;
  - `/es/comparar`: 2727 ms;
  - `/en/comparar`: 2731 ms (nuevo en la lista).

  Margen del 5,8 al 6,5 %. La decisión del ADR lo cubre.

## Fase 1 — Datos y núcleo (2026-10-04)

«continúa» del usuario el 2026-10-04 tras el resumen de la fase 0.

### Qué se construyó

- **Núcleo `src/engine/`** (puro, entero, sin reloj ni azar, sin Zod y sin `node:`):
  - `puntaje.ts`: celdas con el tope por madurez antes del mínimo de las esenciales, evidencia limitante, totales en
    unidades (U = Σ peso × puntaje), orden con leximin y puesto compartido en el empate exacto, veredicto con la banda
    de empate del dato.
  - `sensibilidad.ts`: rectas exactas por plataforma, cortes racionales (inversión, entrada y salida del empate,
    puestos 2 y 3), estados por tramo sin evaluar en puntos medios, eventos en la rejilla alejándose del peso actual,
    `rango-vacio` con el mínimo que invertiría, `indefinida` con todo el peso en un criterio y `totalesCon` para la
    pantalla.
  - `pros-contras.ts` (contra el ancla y la mejor), `alertas.ts` (vigencia y madurez), `vigencia.ts` (días civiles
    enteros, copia del algoritmo del diagramador), `canonico.ts` (RFC 8785 estricto), `racional.ts`, `evaluar.ts`,
    `referencia.ts` (9 casos de RF-09.1 con su resultado esperado) y `tipos.ts`.
- **Datos `src/lib/datos/`:**
  - `conocimiento.ts`: esquemas Zod de capacidad, criterio, escala con la tabla de topes, convenciones, evidencia,
    caso e instantánea.
  - `posicion.ts`: lectura con `archivo:línea:col · id · campo · regla` y mensajes de Zod en español.
  - `cargar-conocimiento.ts`: el cargador, que cruza archivos, gramática, celdas, instantáneas y sellos.
  - `instantanea.ts`: contenido congelado, huella, cambios, siguiente versión, huella del caso y la entrada del núcleo.
- **Dato real:** `data/capacidades/` (6, con los nombres de la gramática), `data/criterios/` (11: 6 de capacidad y 5
  transversales de § 10.3), `data/escalas/esc-evidencia.yaml` (§ 11.1 con los topes de RF-04.2) y
  `data/convenciones/metodo.yaml` (70/50, 5 puntos, 30/60, anclas 4 y 2, rejilla de una décima, semilla 20261004 con
  tres de estabilidad, 10 000 aceptadas, tope de 5 000 000 intentos, z = 1,96 y la declaración de convención). Sin
  evidencias, instantáneas ni casos: llegan en la fase 3.
- **Pruebas:**
  - `tests/unit/nucleo/`: canónico, racionales y fechas; evaluar sobre el caso de la maqueta; los casos de
    referencia; 7 propiedades; huellas; aislamiento.
  - `tests/unit/datos-conocimiento.test.ts`: la base del repo, una base ficticia completa de punta a punta y 65 formas
    de dato roto, cada una con su línea.
  - `tests/unit/lib/base-sabana.ts`: arma en disco la base ficticia de la maqueta (Ejemplo, Norte, Sur y Este; 44
    evidencias; la instantánea; el caso aprobado con su sello).
- **Gate entre motores (D-S3-15):** `tests/determinismo/nucleo-casos.ts` (9 de referencia, 5 variantes del caso de
  la maqueta y 20 bases pseudoaleatorias fijas), `nucleo.spec.ts` (Chromium, Firefox y WebKit con `crypto.subtle`),
  `tests/unit/nucleo/huellas.test.ts` (Node) y `NUCLEO.SHA256SUMS` (34 sumas). El job `diagramador` corre ahora
  también `tests/unit/nucleo` en ubuntu y macOS.
- `fast-check` fijado exacto en 4.10.2 (D-S3-09).

### Comprobado contra la maqueta

- Totales del caso de la maqueta: Norte 31 500 U (78,75), Ejemplo 30 300 (75,75), Sur 25 500 (63,75); brecha de
  1 200 U < 2 000: empate técnico entre Norte y Ejemplo. Este sale por la restricción de residencia.
- Sensibilidad del gobierno (25 puntos, rango 0–50):
  - La inversión exacta cae en 16 250/11 centésimas (14,77 puntos), la misma fórmula de la maqueta (`tInv` =
    325/22). Bajando el peso, la rejilla la muestra en **14,7**: en 14,8 Norte todavía lidera.
  - La salida del empate cae en 35 000/11 (31,82) y la rejilla la muestra en **31,9**, como la maqueta.

### Correcciones a la maqueta (mirada de TEXTO, «maquetado, no visto» → ⭐)

- La inversión del gobierno dice «14,8» (redondeo); la pantalla dirá 14,7, el primer valor en que el cambio ya se ve.
- La evidencia limitante de Ejemplo es la IA y la de Norte la IA 0/4, y la IA no es esencial en el caso. Con la regla
  (el esencial más bajo; a igual puntaje, el de más peso):
  - Ejemplo: gobierno 3/4, que empata con cumplimiento 3/4 y gana por peso;
  - Norte: almacenamiento 3/4.

### Gates nuevos de la fase (regla 15: ¿puede fallar? · rojo · a quién nombró · verde)

Todas con `scripts/demo-rojo.sh --debe-nombrar` (y `--minimo-tests 1` en las de Vitest), 2026-10-04:

| Gate | ¿Puede fallar? | Rojo (mutación) | A quién nombró | Verde |
| ---- | -------------- | --------------- | -------------- | ----- |
| Monotonía corregida (E-1) | Sí | La redacción original: «la ventaja de p sobre cada q no baja al subir w_c» | «monotonía corregida». Contraejemplo con t1 = 0 y t2 = 1: la ventaja de p baja de 3 a 2,9997 aunque p tiene el máximo (empatado en 0) | ✓ 1 prueba |
| Invariancia al orden | Sí, pero no con la primera mutación | 1.ª: quitar el desempate por id de `ordenar` → **pasó**: las evaluadas ya llegan por id y el orden es estable (defensa redundante, se queda). 2.ª: quitar el `.sort` de las evaluadas | «invariancia al orden», con tres plataformas empatadas | ✓ 1 prueba |
| Huella del núcleo en 3 navegadores | Sí | La fecha de `sabana-tarde`, de 12-31 a 12-30 | «el núcleo da en este navegador las huellas que da en Node» en Chromium, Firefox y WebKit, con la huella de `sabana-tarde` | ✓ 3 |
| Huella del núcleo en Node | Sí, pero el conjunto no tocaba el día 60 | 1.ª: vencida desde el día 61 (`>=` → `>`) → **pasó**: ninguna entrada caía en el día 60. Se agregó `sabana-dia-60` (34 sumas) y se repitió | «cada resultado del núcleo tiene la huella fijada», con el diff en `sabana-dia-60` | ✓ 1 prueba |
| Carga: base incompleta (RF-01.2) | Sí | `fecha_verificacion` opcional en el esquema | «evidencia sin fecha de verificación» | ✓ 1 prueba |
| Casos de referencia (RF-09.1) | Sí | Ganadora clara con cualquier brecha ≥ 0 | «empate-exacto da lo esperado» | ✓ 1 prueba |
| Rejilla de la sensibilidad | Sí, pero no con la primera mutación | 1.ª: piso en vez de techo en el bucle de subida → **pasó**: es inocua (el bucle sube solo). 2.ª: redondeo al más cercano, como la maqueta | «la rejilla lo muestra en 31,9» (`expected 3180 to be 3190`) | ✓ 1 prueba |
| Oráculo de fuerza bruta | Sí | Sin los cortes de las rectas (solo los de la banda) | «oráculo de fuerza bruta». Contraejemplo de dos plataformas: pesos [1, 9999] | ✓ 1 prueba |
| Aislamiento del núcleo | Sí | `import { z } from "zod"` en `vigencia.ts` | «se queda dentro de src/engine» (`vigencia.ts → zod`) | ✓ 1 prueba |

### Corridas

- `pnpm typecheck`, `pnpm lint` y `pnpm peers check` limpios.
- `pnpm test`: 75 archivos y 1569 pruebas, con la cobertura en verde.
- Las 7 propiedades tardan unos 2,7 s, con semilla 20261004 y las corridas fijas.
- `playwright test -c playwright.determinismo.config.ts tests/determinismo/nucleo.spec.ts`: 3 de 3 en local.
- Cobertura de ramas:
  - `src/engine/`: de 88,9 % a 100 % por archivo;
  - los cuatro módulos nuevos de `src/lib/datos/`: de 70,5 % a 92,2 %.

### CI del push de la fase 1

- Push de `1f71c8c`, corrida 37246264327. `quality`, `e2e`, `lighthouse`, `diagramador (ubuntu-latest)` y
  `diagramador (macos-latest)` terminaron los cinco con conclusión propia `success`; Vercel en `pass`; el PR no tiene
  comentarios.
- **Primera vez en la CI** (regla 15, «¿lo viste correr?»): `tests/unit/nucleo` dentro del job `diagramador` y
  `nucleo.spec.ts`.
- **Cifras:**
  - `quality`: pasan 1565 pruebas y se saltan 4 (las de gitleaks, K-S3-6).
  - `diagramador`, en ubuntu y en macOS: 29 archivos y 954 pruebas en Node; 9 de 9 en los navegadores (6 del
    diagramador y el núcleo en Chromium, Firefox y WebKit).
  - `e2e`: pasan 785.
  - Build como el proveedor: 59 páginas idénticas a `out/`; la CSP está en las 46.
  - `lighthouse-margen`: 3 avisos de LCP (las dos rutas de `recorrido` de Ejemplo y la de Fabric), que cubre el ADR
    del margen.

### Decisiones de la fase (concretan D-S3-05 y D-S3-06)

- **Evidencias:**
  - Viven en `data/evidencias/<plataforma>/evi-<plataforma>-….yaml`.
  - Cada fuente lleva su `cita` textual y su `verificacion` (verificada o no verificable, fecha, HTTP y sha256).
  - `conflicto_de_interes` es la enumeración de E-18 más `propio-fabricante`: la lista de E-18 no tenía al propio
    fabricante, que es el caso de toda documentación oficial.
- **Topes por madurez:** anunciado y retirado tienen tope 2 y no suben con `acepta_vista_previa` (RF-04.2 al pie de
  la letra; la escala no dice más).
- **Caso:**
  - El sello es `aprobacion: {fecha, huella}`, sin «por»: cero identificadores.
  - Cada peso lleva `origen` (RF-03.3) y, además, `fijado_por` (quién del caso, como la maqueta).
  - Los criterios con peso 0 se declaran igual.
- **Instantánea:** es un JSON que se basta solo (`data/instantaneas/<versión>.json`, con el contenido congelado). El
  caso evalúa la instantánea, nunca la base viva.
- **Sensibilidad:** vigila los puestos 2 y 3 solo hasta N − 1, porque el último queda determinado por los demás.
- **Prueba con la base de la maqueta:** sus criterios que no están en la especificación se leen así:
  - equipo → habilidades;
  - apertura → dependencia;
  - operación → ecosistema.

## Fase 2 — SMAA, Worker y pantallas base, perfil y comparación (2026-10-04)

«continúa» del usuario el 2026-10-04 tras el resumen de la fase 1. Una pausa para compactar la sesión a mitad de fase
(«Haz pausa para hacer un compact»); se retomó con «continúa».

### Qué se construyó

- **Simulación (`src/engine/simulacion.ts`, `sfc32.ts`, `protocolo.ts`; `7d7ca27`):**
  - sfc32 del anexo A, con su sonda reproducida.
  - Muestreo exactamente uniforme sobre los puntos enteros del politopo: rangos redondeados hacia dentro, criterios
    fijos fuera, cada peso libre uniforme en su caja salvo el más ancho, que se despeja de la suma y se acepta si
    cabe.
  - Aceptabilidad por puesto en créditos enteros de mcm(1..N) por combinación (un empate exacto reparte 1/k), vector
    central por restos mayores, frecuencia de «las dos primeras a menos de la banda», zona gris y semiamplitud
    exactas con BigInt, semilla principal y tres de estabilidad (`frontera`).
  - Por pasos, con el mismo resultado para cualquier tamaño de paso; falla cerrada en el tope de intentos;
    N máximo 18.
- **Worker y su contrato (D-S3-08, regla 19):** `src/workers/simulacion.worker.ts` recorre el generador puro
  `atender`; `scripts/nucleo/fixture-simulacion.mjs` recorre el mismo y escribe `tests/fixtures/simulacion-worker.json`
  (9 mensajes); Zod valida el fixture en Vitest (`src/lib/caso/contrato-worker.ts`) y la pantalla lee con la guarda
  estructural `esRespuesta` (sin Zod en el navegador). Seis huellas de simulación se suman al conjunto entre motores
  (40 sumas).
- **Perfil del caso en borrador (`09f8527`):** `data/casos/hospital-sabana.yaml`, propuesto por el agente desde
  § 10.4, con las tres decisiones implícitas sin responder; un borrador puede no tener instantánea (`instantanea:
  null`) y se mira contra la base viva. Las decide la persona en la parada D… de la fase 3.
- **Base sembrada (D-S3-14):** `scripts/datos/construir-sembrada.mjs` arma la base ficticia de la maqueta en
  `.sembrada/datos` y construye el sitio con `BIGD_DATOS` hacia `out-sembrada/` (ignorados en git y en ESLint).
- **Navegación (D-S3-16):** la barra lleva las cuatro secciones de la maqueta (Instrumento pendiente, sin enlace,
  hasta la fase 4); `Pestanas` generaliza las pestañas de sección (05–06 Conocimiento; 07–10 Caso, con 09 y 10
  pendientes). El investigador enlaza su pestaña 06 a la base.
- **Pantallas:**
  - `/[idioma]/base` (maqueta `base.html`): evidencias con su cita, verificación, madurez, conflicto y «por qué este
    puntaje», con filtros (plataforma, criterio, estado); criterios; escala con los topes por madurez; convenciones
    del método con su declaración; instantáneas. Con una base que no carga, el build se detiene; en desarrollo la
    página muestra los errores con el formato del cargador.
  - `/[idioma]/casos/[caso]` (maqueta `perfil.html`): pesos y rangos con su origen, restricciones con lo que eliminan
    y por qué, decisiones implícitas (la elegida con un anillo lleno), «Aprobar perfil» deshabilitado con su razón,
    y el contexto y los requisitos plegados. Solo lectura.
  - `/[idioma]/casos/[caso]/comparacion` (maqueta `comparacion.html`): con el dato de hoy, el bloqueo honesto
    («perfil en borrador» y «faltan 33 evidencias aprobadas», por plataforma). Con la base sembrada: veredicto y
    totales, matriz, alertas de envejecimiento, sensibilidad de un factor (el criterio y el peso en la URL, totales
    con la fórmula racional exacta), robustez (la del perfil calculada en el build; la de un peso explorado, en el
    Worker, por pasos y cancelable) y pros y contras.
- **Piezas:** `src/lib/caso/` (`casos.ts` carga del build, `formato.ts` números sin `Intl`, `explorar.ts` reparto
  por restos mayores, `estado-exploracion.ts` estado en la URL, `rutas.ts`); `src/components/caso/` (`Comparacion`,
  `Exploracion`, `Barras` en SVG, `Iconos`, `MarcoTabla`); `src/components/base/FiltroEvidencias.tsx`; estilos
  `secciones.css` (lo común, movido de `investigador.css` sin cambiar su texto ni su orden), `caso.css` y
  `conocimiento.css`.
- **ADR** `decisions/design-system-s3-extensions.md`: 13 extensiones del design system, cada una con su razón.

### Decisiones de la fase

- **Muestreo de la simulación (desviación de D-S3-07):** «estrellas y barras» era exacto pero aceptaba el 0,47 % de
  los intentos en el caso de la maqueta (10,9 s para las cuatro semillas). El muestreo por cajas con el peso más
  ancho despejado es igual de exacto (uniforme sobre los mismos puntos enteros) y acepta el 90,3 % (89 ms). Las dos
  formas coinciden en estadística sobre el caso de la maqueta; la prueba χ² sobre un politopo enumerable cubre la
  nueva.
- **La robustez del perfil sale del build:** la página trae, en su HTML estático, la simulación con los pesos del
  perfil (la misma función pura que corre el Worker). El Worker solo corre al explorar otro peso. Así no hay un
  «calculando» al abrir la página.
- **Pesos explorados:** los totales y los eventos usan la fórmula racional exacta; los pesos enteros por restos
  mayores (a igual resto, el de menor id) solo entran a la simulación.
- **URL:** guarda `criterio` y `t` (centésimas), nunca el vector; una consulta que no cabe cae al peso del perfil.
  Mientras se arrastra el control, el peso vive en el componente y la URL se escribe tras 300 ms quieto
  (`history.replaceState` tiene cupo en Safari).
- **El leximin solo se nombra a igual total** (D-S3-06): la frase de la maqueta «el desempate leximin tampoco los
  separa», con totales distintos, no se dice.
- **En «se queda corta» no se dice «la mejor del conjunto»** (la mejor de un criterio en que todas quedan cortas):
  confundía.
- **Con la comparación sin calcular**, el subtítulo dice «N plataformas por comparar», no «puntuadas».
- **Todo `style=` fuera del HTML** (CSP del S2): las barras son SVG con posiciones en por ciento como atributos y
  el progreso es un `<progress>`.

### Gates nuevos de la fase (regla 15: ¿puede fallar? · rojo · a quién nombró · verde)

Todas con `scripts/demo-rojo.sh --debe-nombrar`, 2026-10-04:

| Gate | ¿Puede fallar? | Rojo (mutación) | A quién nombró | Verde |
| ---- | -------------- | --------------- | -------------- | ----- |
| χ² del muestreo | Sí | Un límite corrido en uno | «χ² sobre un politopo de 21 puntos» | ✓ |
| Empate exacto 1/k | Sí | Crédito entero a cada empatada (`parte = L`) | «un empate exacto de totales reparte el puesto 1/k» (900 esperado, 1800 recibido) | ✓ |
| Tope de intentos | Sí | Sin `agotada ||` | «el tope de intentos falla cerrado» (corrían las 4 semillas) | ✓ |
| Tamaño de paso | Sí | Reiniciar los intentos en cada llamada | «el resultado no depende del tamaño de paso» | ✓ |
| Zona gris exacta | Sí | `d*d` → `d` | «coinciden con el cálculo en coma flotante» | ✓ |
| Contrato Worker ↔ UI (fixture + Zod) | Sí | `aceptadas` → `aceptada` y fixture regenerado | «cumple el esquema Zod del lado que lee» (`unrecognized_keys`) | ✓ 7 pruebas |
| Costura de punta a punta, e2e (`tests/e2e/sembrada/`) | Sí | La guarda de la pantalla rechaza un resultado `completa` | «mover un peso cruza la costura» | ✓ 1 |
| Costura en Vitest (Worker falso con el `atender` real) | Sí | La misma | «mover el peso escribe la URL, pide la simulación» | ✓ 10 |
| INP con la CPU 4× | Sí, pero no con la primera mutación | 1.ª: un bucle de 120 ms en el manejador → **pasó**: el bucle mide tiempo de reloj y la CPU lenta no lo alarga (120 < 200). 2.ª: 250 ms | «toBeLessThanOrEqual», peor interacción 272 ms | ✓ 1 (24 ms) |
| Estado honesto con el dato real (`tests/e2e/caso.spec.ts`) | Sí | El motivo «borrador» escribe el de «todas descartadas» | «la comparación no puntúa» | ✓ 6 |
| Filtros de la base | Sí | `hidden={false}` | «los filtros de la base» | ✓ 1 |
| Brecha truncada (`formato.ts`) | Sí | Redondear en vez de truncar | «4,9975» | ✓ 7 |
| Reparto por restos mayores | Sí | Desempate por id invertido | «a igual resto» | ✓ 7 |
| Estado en la URL | Sí | Aceptar un peso fuera de la rejilla | «una que no cabe» | ✓ 7 |
| Instantánea citada que no existe | Sí | Caer a la base viva si no hay instantáneas | «un caso que cita una instantánea que no está» | ✓ 7 |
| Nada desborda a 380 px | Sí: se vio rojo sobre el defecto real | — (la comparación medía 383 px: los hijos de `.dos` no se encogían) | «a 380 px nada desborda la página» | ✓ tras `min-width: 0` |
| axe: marco de tabla enfocable | Sí: se vio rojo sobre el defecto real | — (`scrollable-region-focusable` en la tabla de aceptabilidad) | «sin violaciones serias», en los dos temas | ✓ tras `MarcoTabla` |

Las rutas nuevas entran solas (por `tests/e2e/lib/rutas.ts`) a las pruebas que recorren el sitio: CSP en cuatro
motores, G11, mismo árbol con movimiento reducido y axe en los dos temas. Esos gates ya se vieron en rojo en el S1 y
el S2; aquí corren por primera vez sobre estas rutas.

### Pasada de capturas (regla 22) y fidelidad a la maqueta

El arnés `scripts/capturar-producto.mjs` aprendió:

- la perilla `--arbol out-sembrada`;
- el emparejamiento de las tres rutas con sus maquetas;
- los controles nuevos: el selector de criterio, el control del peso (cambia el peso y la URL; cancela la simulación
  si todavía corre), los filtros (prueba cada opción hasta que una cambia la página), los marcos de tabla, varias
  lecturas plegadas y «Aprobar perfil» deshabilitado con su razón.

Corridas:

- Sitio sembrado, 6 rutas × 2 temas × 2 anchos con la maqueta al lado: 24 encuadres, 896 comprobaciones de
  interacción, 0 fallas. La primera corrida dio 8 fallas del arnés (la opción «Solo aprobadas» no cambia nada si todas
  están aprobadas); se corrigió el arnés, no la pantalla.
- Sitio real, las mismas 6 rutas con la maqueta: 24 encuadres, 408 comprobaciones, 0 fallas.
- Sitio real, todas las rutas, solo midiendo: 200 encuadres, 13 636 comprobaciones, 0 fallas. La primera corrida dio
  8 fallas: el chequeo nuevo del botón deshabilitado alcanzaba al «Anterior» del lado a lado; se limitó a «Aprobar
  perfil».

**Leído como imagen** (el resto de los 48 encuadres por pantalla quedó medido por el arnés, no leído):

| Encuadre | Qué encontré al leerlo | Arreglo |
| -------- | ---------------------- | ------- |
| Comparación sembrada, 1280, claro (página entera) | La columna de criterios con estilo de cabecera; la estrella del criterio esencial cae de línea; los porcentajes de la aceptabilidad se parten | `.tabla tbody th` con letra de cuerpo; `.esencial` en línea (Tailwind pone `svg { display: block }`); celdas sin partir |
| Control del peso, 1280, claro (ampliado) | La pista de la barra no se ve | La clase `.pista` chocaba con la pista de deslizar del atlas (`display: none`): las clases de las barras pasan a `barra-…` |
| Sensibilidad, decisiones, pesos, tarjeta de evidencia y criterios, 1280 (ampliados) | El radio deshabilitado y marcado casi no se ve; las barras de los pesos con anchos distintos por fila; el selector de criterio pegado al bloque; una sangría de más en la verificación | Anillo lleno / círculo vacío (ADR fila 4); columna de 200 px; `.filtros` a `secciones.css`; `dd > .mono` |
| Par comparación sembrada, 1280, oscuro + robustez ampliada | La barrita de aceptabilidad ocupa toda la celda y el porcentaje queda encima; falta la nota bajo la matriz; la frase del leximin con totales distintos | `.barra-svg.barra-mini` a 64 px; `matriz.nota`; el leximin solo a igual total |
| Totales, sensibilidad y pesos a 380, claro (ampliados) | «Ver puntajes» se estira a lo ancho | `justify-self: start` en teléfono |
| Base sembrada, 1280, oscuro (arriba y abajo) | Los números de la simulación sin separador de miles; la declaración pegada a la lista; la insignia «vigente» pegada a la versión | `entero()`; márgenes |
| Par comparación real, 1280, oscuro | «Tres plataformas puntuadas» cuando nada se puntuó | `subPendiente`: «por comparar» |
| Par perfil real, 1280, oscuro | «Aprobar perfil» quedaba después de las lecturas plegadas | Va tras las decisiones, como en la maqueta |
| Par base real, 1280, claro | El estado vacío dice que no hay evidencias y qué las trae | — |
| Par comparación sembrada en inglés, 1280, claro (tras los arreglos) | «Se queda corta» decía «la mejor del conjunto» | No se dice en esa lista |
| Comparación real, 1280, claro, y perfil real en inglés, 1280, oscuro (pasada final) | Los arreglos quedaron | — |

Diferencias de forma frente a la maqueta que quedan (todas en el ADR `design-system-s3-extensions`): el selector de
criterio y el control nativo del peso; el anillo de la opción elegida; las secciones de criterios, escala y
convenciones en la base; el contexto y los requisitos plegados en el perfil; las columnas de la matriz en el orden del
resultado (la maqueta las ordena por id).

### Corridas

- `pnpm typecheck` y `pnpm lint` limpios.
- `pnpm test`: 81 archivos y 1625 pruebas, con la cobertura en verde; `src/lib/caso` 99,2 % de sentencias y
  `src/components/caso` 93,7 %.
- `E2E_PUERTO=3147 pnpm test:e2e` (los dos sitios construidos por la configuración): 898 pasan y 9 se saltan.
- INP con la CPU 4×: la peor interacción midió 24 a 32 ms en las corridas locales (umbral 200).


### CI del push de la fase 2

- Push de `f7654d1` (con `7d7ca27` y `09f8527`), corrida 37253334325. `quality`, `e2e`, `lighthouse`,
  `diagramador (ubuntu-latest)` y `diagramador (macos-latest)` terminaron los cinco con conclusión propia `success`;
  Vercel en `pass`; el PR no tiene comentarios.
- **Primera vez en la CI** (regla 15, «¿lo viste correr?»): el segundo servidor de Playwright (el sitio sembrado),
  el proyecto `sembrada`, `tests/e2e/caso.spec.ts` y las rutas nuevas dentro de las pruebas que recorren el sitio.
- **Cifras:**
  - `quality`: pasan 1621 pruebas y se saltan 4 (las de gitleaks, K-S3-6). Build como el proveedor: 65 páginas
    idénticas a `out/`; la CSP está en las 52.
  - `diagramador`: 972 pruebas en Node (macOS) y 9 de 9 en los navegadores (el núcleo y la simulación en Chromium,
    Firefox y WebKit).
  - `e2e`: pasan 898 y se saltan 9. INP con la CPU 4× en el runner: peor interacción 72 ms en 21 eventos.
  - `lighthouse-margen`: los mismos 3 avisos de LCP de la fase 1 (los `recorrido` de Ejemplo y el de Fabric), que
    cubre el ADR del margen. Las rutas nuevas entran a Lighthouse en la fase 4.

## Mirada de la fase 2 y nombre del caso (2026-10-05)

- **Mirada de las tres pantallas.** Tras el compact el usuario respondió «Continua» sin comentar las pantallas; se le
  repreguntó «¿qué viste al abrirla?» con la comparación abierta en su navegador (el servidor de la base sembrada,
  puerto 3148, se había caído en la pausa y se levantó otra vez). Respuesta, 2026-10-05: «Cambiale hospital de la
  sabana a no se Hospital del futuro algo mas generico aqui en colombia hay uno cercano y no quiero confisiones». Leyó
  el título de la página: mirada registrada, con el nombre del caso como único ajuste pedido.
- **El ajuste (decidido sin re-preguntar: ajuste menor ya comentado).** El caso pasa a «Hospital Ficticio del Futuro»
  / «Fictional Hospital of the Future», id `hospital-futuro` (la URL también mostraba el nombre). Se conserva
  «Ficticio», como en las plataformas (regla 12). El perfil seguía en borrador (`propuesto_por_agente`): no se tocó
  nada aprobado.
- **Qué cambió.** `data/casos/hospital-futuro.yaml` (renombrado) · la base sembrada (`tests/unit/lib/base-futuro.ts`)
  y la entrada del núcleo de las pruebas (`tests/unit/nucleo/lib/futuro.ts`) · las pruebas que las usan · el
  generador de la maqueta (`scripts/maqueta/pantallas/`) y la maqueta regenerada con `pnpm maqueta` (4 archivos de
  `docs/diseno/`, 7 líneas, solo el nombre y la ruta del archivo del perfil; «sin avisos») · 5 sumas de
  `tests/determinismo/NUCLEO.SHA256SUMS`: las de las entradas del caso, porque el resultado lleva su id (las 9 de
  referencia y las 6 aleatorias, idénticas) · el fixture del Worker, regenerado sin diferencias.
- **Lo que conserva el nombre viejo, a propósito.** Esta bitácora y `sprints/ETAPA-DISENO-auditoria.md` (son historia)
  y el historial de git (no se reescribe). La planeadora no lo menciona (búsqueda sin coincidencias).
- **Corridas tras el renombre (2026-10-05, locales).** `pnpm typecheck` y `pnpm lint` limpios · `pnpm test`: 81
  archivos, 1625 pruebas en verde · `E2E_PUERTO=3147 pnpm test:e2e`: 898 en verde y 9 saltadas (2,2 min), INP de la base
  sembrada con CPU 4×: 16 ms · búsqueda de «sabana» fuera de `sprints/`: 0 coincidencias.

## Fase 3 — Contenido (desde 2026-10-05)

El usuario dio «Continua» al cierre de la fase 2 y la mirada de las tres pantallas quedó registrada arriba (el nombre
del caso fue su único ajuste).

### M1 — boceto de la revisión de evidencias (mirada de FORMA)

- **Qué es.** `scripts/propuestas/revision-evidencias.mjs` → `docs/propuestas-de-diseno/revision-evidencias.html`
  (+ `.js`): la revisión de una propuesta de evidencias con cuatro evidencias ficticias de la Plataforma Ejemplo
  (fuentes `example.org`). La escala, los topes y las madureces salen de `data/`; el comando lo arma
  `comandoAprobar` de la app (el boceto no lo redacta) y el aviso de arriba dice que no se corre.
- **Qué propone.** En cada tarjeta: la regla de 0 a 4 con el puntaje propuesto (borde grueso + glifo + «propuesto»),
  lo que el tope por madurez no deja contar en rayado y el nivel que sí cuenta en borde punteado («cuenta»); el texto
  del nivel propuesto; «¿Por qué N y no N−1 ni N+1?» con la justificación; la cita con su verificación; fuente,
  madurez, conflicto de interés, componentes, limitaciones y «esencial». Arriba, la escala completa en un
  desplegable. **Ninguna evidencia viene aprobada de entrada** (en los mapas, las verificadas sí): el código
  comprueba la cita, no el puntaje. Las rechazadas por el código entran rechazadas y sin botones.
- **Pasada de capturas e interacción (2026-10-05, Chromium, archivo local).** 380 y 1280 px en los dos temas y los
  dos idiomas, leídas como imagen; tocar «Aprobar» en todas las tarjetas → el comando aparece con
  `--aprobar A-1,A-2,A-3 --rechazar A-4 --retirar -`; cero errores de consola. Dos defectos que la pasada encontró y
  se corrigieron antes de mostrarlo: (1) el comando y las tres insignias se veían desde el principio (una regla
  `display` anulaba `hidden`); (2) a 380 px «soportado» y «propuesto» se salían de sus casillas (12 elementos) → en
  el teléfono la regla va en vertical, un nivel por renglón. Medido después: 0 elementos fuera de su casilla y sin
  desplazamiento lateral a 380, 480, 768, 900 y 1280 px en los dos idiomas. Regenerar da los mismos bytes.
- **Respuesta del usuario, 2026-10-05:** a «¿Te sirve esta forma de revisar cada evidencia?», con el boceto abierto en su
  navegador: «Si me sirve». **M1 aprobada**; la pantalla del producto obedece el boceto (incluido «ninguna viene
  aprobada de entrada»).

### Modo evidencias del investigador (D-S3-10, 2026-10-05)

- **Qué se construyó.** `src/lib/investigador/evidencias.ts` (esquema de la propuesta con `tipo: "evidencias"`,
  validador contra la base, núcleo de la aprobación, línea del historial, `componentesDeMapas`) · `aprobados.ts`
  (`evidenciasSinAprobacion`: cada evidencia aprobada tiene la huella de su revisión) · `revision.ts` (la propuesta de
  evidencias pendiente, aparte de la de mapa) · `RevisionEvidencias.tsx` (la pantalla del boceto M1) y su sección en
  `/[idioma]/investigador/[plataforma]` · `scripts/investigar/validar.mjs`, el hook de fin, `verificar-citas.mjs` y el
  script de aprobación ramifican por tipo · la skill y el agente documentan `/investigar <plataforma> evidencias` · el
  candado deja al investigador leer además `src/lib/datos/conocimiento.ts` · textos ES/EN · estilos de la regla.
- **Decisiones.**
  - La propuesta de MAPA no cambia: la de evidencias vive aparte y su historial va a
    `data/revisiones/evidencias/<plataforma>.jsonl`. La aprueba el mismo script; en la terminal, la misma frontera
    (`puedeAprobar`).
  - **Nada aprobado de entrada** (M1): el código comprueba la cita, no el puntaje. La que tiene una cita no encontrada
    entra rechazada y sin botones.
  - **`componentes` son ids del mapa aprobado** de la plataforma (la pantalla lee el nombre en cada idioma; el validador
    rechaza un id que el mapa no tiene; una plataforma sin mapa no tiene evidencias que proponer). Lo destapó la pasada
    de capturas: en inglés salían los nombres en español. El esquema de la base no cambia (la base sembrada sigue con
    texto); la exigencia vive en la propuesta.
  - `aprobada_por: "autor"`: un rol, no un nombre personal en un dato público (el mismo autor que declara su conflicto
    de interés al pie).
  - La verificación es **por fuente**: `verificacion.json` lleva `fuente` (desde 0) en cada resultado; una evidencia
    vale lo que su peor fuente.
  - Zod 4 no recorta un esquema con reglas: la evidencia se parte en `esquemaEvidenciaCampos` + reglas, sin cambiar lo
    que valida.
  - `.evidencia-meta` pasa a `secciones.css` (la usan la base y la revisión).
- **Gates nuevos (regla 15: ¿puede fallar? · rojo · a quién nombró · verde), corridos con `scripts/demo-rojo.sh
  --debe-nombrar --minimo-tests` el 2026-10-05; los ocho salieron con 0 (rojo nombrando lo esperado, restaurado con
  `cmp`, verde):**

| # | Gate | Mutación | Nombró | Verde |
|---|---|---|---|---|
| 1 | Validador: capacidad inexistente | `if (false && e.capacidad_id …` | «rechaza una capacidad que no existe» | 31 pruebas |
| 2 | Aprobación: cita no encontrada | `if (false && ev && …fuentes.some(` | «aprobar una cita no encontrada» | 31 |
| 3 | Integridad: huella editada a mano | `else if (false && huella(dato) !== r.huella)` | «una palabra cambiada a mano lo rompe» | 4 |
| 4 | Pantalla: nada aprobado de entrada | estado inicial aprueba las verificadas | «nada viene aprobado de entrada» | 4 |
| 5 | Hook de fin: valida la de evidencias | la línea del validador → `void cargarConocimiento;` | «el de fin hace seguir a una inválida» | 6 |
| 6 | Candado: solo el esquema de `src/lib/datos/` | la regla abre toda la carpeta | «nada más de src/lib/datos» | 6 |
| 7 | verificar-citas: el número de la fuente | sin `fuente` en el resultado | «una por fuente, con el número de la fuente» | 5 |
| 8 | Componentes: ids del mapa aprobado | `if (false && nodos && …)` | «un componente que no está en el mapa aprobado» | 34 |

- **Defectos que salieron construyendo, y su arreglo.**
  - **Contraste (axe, tema claro, 6 pruebas en rojo).** `.decidir .boton[aria-pressed="false"] { opacity: 0.6 }` (código
    del S1, no de la maqueta) dejaba bajo AA los botones sin decidir. En los mapas no se veía: ninguna prueba de
    navegador había mostrado una revisión pendiente. Con la de evidencias, donde nada viene decidido, axe lo nombró.
    Se quitó la regla. El botón presionado se distingue por el subrayado, la insignia de la tarjeta y el borde
    punteado con tachado de la rechazada. Rerun: `investigador` + `reduced-motion` en los proyectos, 312 en verde y
    2 saltadas.
  - Componentes en español en la página en inglés → ids del mapa (arriba).
  - Al ícono de la verificación le faltaba espacio.
- **P0 (ensayo), propuesta escrita.** `propuestas/2026-10-05-plataforma-ejemplo-evidencias/`: 11 evidencias de la
  Plataforma Ejemplo, una por criterio, con los puntajes de la maqueta (la de IA en vista previa, para que se vea el
  tope). Origen `curador`, fuentes `example.org`. La validación pasó. `verificar-citas`: las 11 «no verificables»
  (`example.org` responde 404 a cualquier ruta inventada: es honesto, nadie publicó esas páginas). Las 11 esperan la
  decisión de la persona.
- **Corridas (2026-10-05, locales).**
  - `pnpm typecheck` y `pnpm lint` limpios.
  - `pnpm test`: 86 archivos, 1679 pruebas en verde.
  - `E2E_PUERTO=3147 pnpm test:e2e`: 892 en verde, 9 saltadas y 6 en rojo (el contraste de arriba). Después del
    arreglo, las dos specs afectadas: 312 en verde y 2 saltadas.
  - Pasada de capturas de la revisión del ensayo (servidor en 3150): 380 y 1280 px en los dos temas y los dos
    idiomas, leída como imagen. 11 tarjetas, «Faltan 11 evidencias por decidir», ningún elemento fuera de su casilla,
    sin desplazamiento lateral y cero errores de consola o CSP. Al tocar «Aprobar» en todas, el comando aparece con
    las 11.
- **CI del push de `4e06c99`** (corrida 37394316885, leída con `gh pr checks 8` el 2026-10-05): `quality` 2m10s ·
  `diagramador` ubuntu 2m8s y macOS 1m43s · `e2e` 8m47s · `lighthouse` 14m5s · Vercel: los cinco checks y el
  despliegue con conclusión propia `success`. El `--watch` se cortó por un error de red local
  («can't assign requested address»); la lectura final se hizo con una segunda llamada.

### P0 — ensayo de aprobación: Plataforma Ejemplo (D-S3-11, 2026-10-05)

- **La decisión de la persona.** En la revisión de la propuesta (preview local, puerto 3150) marcó las 11 evidencias y
  copió el comando de la pantalla. Respuesta, 2026-10-05: «Listo todo aprobado», con el comando pegado en el chat
  (`--aprobar A-1,…,A-11 --rechazar - --retirar -`). Comparado con la propuesta: los mismos 11 ids y ningún rechazo.
- **Antes de su terminal: un ensayo en seco** del núcleo de la aprobación sobre una copia temporal de `data/`, sin el
  script y sin tocar el repo. Las 11 cargan con el cargador del build y `evidenciasSinAprobacion` no encontró nada.
- **El comando.** La persona pidió el comando en su portapapeles. Se copió con `pbcopy` el texto que armó la pantalla,
  sin cambios y con `cd ~/Code/app-big-d &&` delante. Ella abrió la Terminal y lo pegó. Salida (2026-10-05, hora local;
  2026-10-06 en UTC): «aprobar: evidencias de plataforma-ejemplo el 2026-10-06 (UTC) · 11 aprobadas · 0 rechazadas →
  data/evidencias/plataforma-ejemplo/».
- **Lo que escribió.** 11 archivos en `data/evidencias/plataforma-ejemplo/`, cada uno con la cabecera «APROBADA por una
  persona…», `aprobada_por: autor`, `fecha_aprobacion: 2026-10-06` y la verificación de su fuente («no verificable»,
  HTTP 404). Una línea en `data/revisiones/evidencias/plataforma-ejemplo.jsonl` con las 11 huellas.
- **Lo que el dato nuevo cambió en las pruebas.** Dos pruebas daban por hecho una base sin evidencias:
  - `scripts-evidencias.test.ts` comprobaba que `data/evidencias` no existiera en la copia del repo. Ahora comprueba
    que no se escribió nada de la plataforma de la prueba: ni su carpeta ni su línea de revisión.
  - `caso.spec.ts` esperaba el estado «sin evidencias» en `/base` (4 en rojo en la suite completa: dos idiomas y dos
    tamaños). Ahora cuenta las evidencias aprobadas de `data/evidencias/` y exige esa cantidad de tarjetas y el conteo
    en plural, así que sigue al dato cuando lleguen P1–P3. Demo en rojo con `scripts/demo-rojo.sh --debe-nombrar
    --minimo-tests 2`: en `src/app/[idioma]/base/page.tsx`, `evidencias.length === 0` pasó a `>= 0` (siempre vacía),
    con build. Rojo en los dos idiomas, nombrando «la base muestra las evidencias aprobadas». Restaurado con `cmp` y
    verde con 2 pruebas.
  - Con la base real, el estado «sin evidencias» de `/base` se queda sin prueba de navegador. Va a la pasada de
    capturas de la fase 4, sobre una base de `BIGD_DATOS` sin evidencias.
- **Corridas (2026-10-05, locales).**
  - `pnpm typecheck` y `pnpm lint` limpios.
  - `pnpm test`: 86 archivos, 1679 pruebas en verde (tras el ajuste).
  - `pnpm build`: 52 páginas con CSP.
  - `E2E_PUERTO=3147 pnpm test:e2e`: 894 en verde, 9 saltadas y 4 en rojo (las de arriba). Después del ajuste,
    `caso.spec.ts`: 12 en verde.
  - El build muestra en `/es` y `/en/investigador/plataforma-ejemplo` el veredicto «Evidencias aprobadas por una
    persona» y ya no muestra la propuesta pendiente.

### CI del push de `fb39b40`: dos avisos de seguridad nuevos (2026-10-05)

- **Qué pasó.** El push de `fb39b40` (corrida 37398213162) dejó `quality` en rojo en `pnpm audit --audit-level high`
  (`diagramador` ×2 y Vercel en verde; `e2e` y `lighthouse` quedaron saltados porque dependen de `quality`, y saltado
  no cuenta como verde). El código no tuvo que ver: entre `4e06c99` y `fb39b40` se publicaron dos avisos altos, ambos
  con versión corregida.
  - `source-map-js` < 1.2.2 (GHSA-68fv-2mgg-jv7q). Llega por PostCSS, Tailwind y Vite. El rango de PostCSS
    (`^1.2.1`) admite la corrección: `pnpm update source-map-js`.
  - `compression` < 1.8.2 (GHSA-vc2v-76pw-4v95). Llega solo por `serve` 14.2.6, la última versión, que la fija exacta
    en 1.8.1. Con parche publicado, la regla 18 no deja excepcionarla, así que va un override en
    `pnpm-workspace.yaml` (`compression: 1.8.2`), con su porqué y la condición de retiro en el comentario. Trae
    `destroy` 1.2.0 como dependencia nueva.
- **Comprobado (2026-10-05, local).** `pnpm audit --audit-level high`: queda solo `braces`, la excepción del S2.
  `verificar-dependencias`: 670 paquetes, ninguno por debajo de `origin/main`. `pnpm peers check` limpio.
  `pnpm test`: 86 archivos y 1679 pruebas. `pnpm build`: 52 páginas con CSP. `serve` con la `compression` nueva
  responde 200 y comprime con gzip. `caso.spec.ts` y `csp.spec.ts` en `desktop-chromium`: 65 en verde.

## Desviación del plan

Los hechos 1–10 y las decisiones D-S3-01…18 del plan aprobado (`Reglas del motor` incluidas) son la desviación de
la orden; se resumen aquí y se amplían a medida que ocurren:

- Cambian los 6 golden de `agente-ejemplo` (el glifo `hexagono`); la orden decía que no cambiaban.
- Criterios de la especificación § 10.3, no los de la maqueta; `criterio_id` en la evidencia transversal.
- «robusta» en lugar de «sólida»; `esencial` por criterio en el caso (el plan del sprint lo ponía en el criterio).
- M1 (la maqueta del investigador no tiene modo evidencias); ensayo P0 con la Plataforma Ejemplo; la aprobación del
  perfil por comando.
- Perilla `BIGD_DATOS`; huella del núcleo dentro del job `diagramador`; Zod fuera del navegador.
- «Estrellas y barras» en lugar de espaciados con restos mayores para el muestreo.
- Correcciones a la maqueta como mirada de TEXTO: evidencia limitante incoherente en Norte y Ejemplo, etiquetas de
  rango por punto entero, leximin dentro de la banda, crédito del empate al primero de la lista.
- K-S3-3: un solo build en `quality` (el kit construye dos veces).
- Fase 2: el muestreo por cajas con el peso más ancho despejado en lugar de «estrellas y barras» (los dos exactos; el
  segundo aceptaba el 0,47 %); el perfil en borrador entra en la fase 2 (la orden lo ponía en la 3) para que las
  pantallas muestren el estado honesto; `instantanea: null` en un borrador; la robustez del perfil se calcula en el
  build y el Worker solo corre al explorar; las 13 extensiones del ADR `design-system-s3-extensions`.
- 2026-10-05: el caso se llama «Hospital Ficticio del Futuro» (`hospital-futuro`) a pedido del usuario (antes «de la
  Sabana», que se confunde con una institución real cercana); la maqueta se regeneró con su generador.
- 2026-10-05 (D-S3-10): `componentes` de una evidencia propuesta son ids del mapa aprobado; `aprobada_por: "autor"`; el
  historial de evidencias en `data/revisiones/evidencias/`; se quitó la opacidad de los botones sin decidir (contraste).
