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
