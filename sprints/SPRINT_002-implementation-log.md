---
sprint: 002
app: big-d
feature: lado-a-lado-databricks-snowflake
branch: sprint-002/lado-a-lado
orden: portafolio/big-d/ordenes/SPRINT_002-orden.md (planeadora, G-Plan 2026-10-01)
plan: aprobado 2026-10-01 · «construye» 2026-10-02
---

# Sprint 002 — bitácora de implementación (Big-D · «Databricks y Snowflake, lado a lado»)

## Plan aprobado (resumen)

Cinco fases con parada al final de cada una (espera «continúa»):

| Fase | Qué | Parada humana |
| ---- | --- | ------------- |
| 0 | Setup, constitución, contrato v0.4.0 (lock 57/57, API en inglés, V16, 34 casos), migración en memoria, deuda del S1 (CSP, LCP, homepage), kit v1.32.1/v1.33.0 | «continúa» |
| 1 | Resto de la conformidad v0.4.0, `compare` (nivel por banda, filas independientes, `toCompareCSS`), diferencias dibujables, P13 | **M1**: mirada de FORMA del boceto «en el mismo diagrama», antes de construir el nivel por banda |
| 2 | `/[idioma]/comparar` en producto + versionado de mapas | **M2**: gate de FORMA del lado a lado sobre el preview (indiferible) |
| 3 | `/investigar databricks`, `snowflake` y `fabric` | tres paradas de contenido, afirmación por afirmación |
| 4 | `/[idioma]/atlas/[plataforma]/versiones`, e2e, guía v2, manual, ADRs, `design-sync/`, `/audita-sprint`, `/deploy-check`, summary | aprobación de la fase 2 de la auditoría |

Decisiones D-S2-01 a D-S2-11 y los siete hechos que cambiaron el trabajo: en el plan aprobado, copiados en
«Desviación del plan» al final de esta bitácora.

## Fase 0 — Setup, contrato v0.4.0 y deuda (2026-10-02)

### Supuestos del kit

| # | Supuesto | Resultado |
| - | -------- | --------- |
| K1 | `githooks/pre-commit` ejecutable y `core.hooksPath = githooks` | ✓ 100755 · `githooks` |
| K2 | scripts `typecheck · lint · test · test:e2e · build · start · prepare` | ✓ (`test` con `--coverage`) |
| K3 | `pnpm peers check` limpio | ✓ «No peer dependency issues found» |
| K4 | `ci.yml` con los 5 checks de la ruleset `main-protegida` | ✓ `quality · e2e · lighthouse · diagramador (ubuntu-latest) · diagramador (macos-latest)`, los cinco exigidos |
| K5 | Carnada canónica bloqueada por el hook de escritura | ✓ `tests/unit/gitleaks-escritura.test.ts` 2/2 |
| K6 | Cero PRs de dependencias abiertos | ✓ 0 abiertos |
| K7 | `githooks/pre-commit` falla cerrado sin gitleaks (kit v1.32.1) | ✗ solo avisaba y dejaba pasar, y ninguna prueba lo cubría → se paga en esta fase con su prueba |

### Constitución, comandos y kit (v1.32.1 · v1.33.0)

- **`CLAUDE.md` fusionado, no copiado.** Base: la del repo, con sus deltas del S1. Se reemplazan los tres
  bloques que la planeadora regeneró con el contrato v0.4.0: la línea de sincronización de la cabecera, la regla
  dura 7 y la viñeta del diagramador en «Patrones de dominio». Se suman la regla 23 (matriz de envejecimiento y LCP
  por perfil) y la regla 17 de v1.32.1 (el campo homepage apunta al propio repo), y una nota de los deltas del S2.
  Comprobación: `diff` contra `ordenes/CLAUDE-md-para-app.md` deja solo los deltas de la app (S1 y S2).
- **`/deploy-check`:** la casilla de la matriz de envejecimiento en § 9 (con las pruebas de Big-D que la cumplen) y
  la línea del homepage de v1.32.1. La casilla 7-S del kit no se duplica: la de Big-D vive en § 10 desde el S1.
- **`.github/dependabot.yml`** igual al del kit: ignora los majors de `@types/node` (la CI corre Node 22 y el
  paquete está en `^22`).
- **`githooks/pre-commit`** igual al del kit: falla cerrado sin gitleaks, con escape `KIT_SIN_GITLEAKS=1`.

### Gates nuevos: ¿puede fallar? · rojo · a quién nombró · verde

| Gate | ¿Puede fallar? | Rojo | A quién nombró | Verde |
|---|---|---|---|---|
| `tests/unit/githooks-pre-commit.test.ts` (K7) | Sí: el hook viejo salía con 0 sin gitleaks | La prueba contra el hook viejo: 1 de 3 en rojo, «expected +0 to be 1» | «sin gitleaks bloquea el commit y dice cómo seguir» | 3/3 con el hook del kit (sin gitleaks bloquea; con `KIT_SIN_GITLEAKS=1` pasa; con gitleaks bloquea la carnada en un repo temporal y deja pasar un archivo limpio) |
| `tests/unit/datos-migrar.test.ts` (D-S2-01) | Sí: con el motor en 0.4.0 y sin migración, la carga del dato real se rompe | Antes de `migrarContrato`: `mapas-aprobados.test` 2/2 en rojo, «data/mapas/fabric.mapa.yaml · V1 · /contrato_version · fabric · contrato 0.3.0 incompatible con el motor (0.4.0)» | el mapa aprobado de Fabric | 5/5: sube 0.3.x en memoria sin tocar el objeto ni el archivo (sigue en 0.3.0 en el disco y su huella aprobada vale); 0.2.0 sigue fallando en V1; un flujo de un nodo a sí mismo sigue siendo V4 tras migrar |
| `carnadas.test.ts`: una carnada que falla reporta su entrada esperada, sus `secundarios` y nada más (34 casos) | Sí: cualquier hallazgo no declarado | Sin los `secundarios` en la lista permitida: 3 de 36 en rojo | C03 (V2 · captura-cambios), C06 (V4 · f-semantico-tablero) y C07 (V5 · admision-paciente): exactamente los tres que declaran secundarios | 36/36; «detectó 34 de 34» |
| `packages/diagramador/test/madurez-corta.test.ts` (`etiqueta_corta`) | Sí: un motor que dibuja el nombre largo | `rotuloMadurez` devolviendo el nombre: 4 de 5 en rojo | nivel 1 y nivel 2, es y en: «dibuja la etiqueta corta y no el nombre largo» | 5/5 (incluye G2: una etiqueta de más de 4 caracteres no valida) |
| `packages/diagramador/test/v16.test.ts` (V16 y las cuatro edades) | Sí: un validador que no dibuja | `validate` sin agregar lo que dibuja: 2 de 9 en rojo | «en publicación, un nombre que no cabe es error V16…» y «en privado, los mismos avisos se informan sin rechazar» | 9/9: `sumarDias` contra casos conocidos y como inversa de `diasEntre` (fast-check, semilla 20261002, 300 corridas); `agingDates`; V16 en los dos modos, sin `texts` y sobre un mapa con errores |
| `tests/unit/csp.test.ts` + `tests/e2e/csp.spec.ts` (D-S2-05) | Sí: una huella que falta, un `style=` o un `on…=` en línea | Se quitó una huella de `out/es/atlas/fabric.html` y se cargó con el mismo escucha de `securitypolicyviolation`: «script-src-elem · inline» en esa página; 0 en la intacta. La unitaria se niega a publicar `style=` y `onload=` y nombra el archivo | la página y la directiva | unitaria 5/5; e2e 96/96 en los cuatro proyectos (cada ruta: meta sin `unsafe-inline`, hidrata, el tema cambia, la ficha abre, cero violaciones y cero errores; la maqueta, su cabecera) |
| `tests/unit/servidor-config.test.ts` (maqueta y `github.silent`) | Sí | Con `github.silent` todavía en `vercel.json`, «sin la opción muerta» en rojo | `vercel.json` | 3/3: la CSP de la maqueta igual en los dos servidores, sin scripts en línea ni `unsafe-eval` |

### Contrato v0.4.0 copiado, lock 57/57 y migración en memoria

- **Copia byte a byte** con `cp` de los 51 archivos de `reusables/diagramador/` (las cuatro carpetas se reemplazan
  enteras: nada viejo queda). `node scripts/contrato/fijar.mjs` → **57 archivos** (51 del contrato + 6 de
  `metricas/`); `node scripts/contrato/verificar.mjs` → «v0.4.0, 57 archivos idénticos a su origen».
- `CONTRATO_VERSION` = 0.4.0; esquemas standalone regenerados. `contrato-lock.test` compara la versión del lock
  con la del paquete en lugar de un literal.
- **P1–P3 desde `carnadas/`**: se retira `test/carnadas-piloto/` y cinco pruebas del paquete leen de ahí. P2 cambió
  de contenido en la v0.4.0 (el paso `px` ahora está en `modelo-semantico`, justo después de p5) y sigue dando
  exactamente un V5 en `admision-paciente/px`.
- **Gramática y Plataforma Ejemplo regeneradas** desde el contrato (`desde-contrato.mjs`): solo cambia
  `contrato_version`. El kit de prueba se regenera (la muestra nace del ejemplo); la base incompleta, que es un
  dato fijo, sube a 0.4.0 a mano y sigue fallando solo por su V3.
- **Migración en memoria (D-S2-01):** `src/lib/datos/migrar.ts`. `fabric.mapa.yaml` queda en 0.3.0 en el disco,
  con la huella que aprobó la persona.

### API en inglés, `etiqueta_corta` y V16 dentro del paquete

- **API v0.4.0 (§ 8):** `texts`, `queryDate` y `group` en las opciones; plurales `{ one, other }`. Todas las llamadas
  de la app, de las pruebas y de la entrada de determinismo, al día; los 30 golden quedan iguales byte a byte.
- **`etiqueta_corta`** de la madurez (opcional, ≤ 4 caracteres por G2): es lo que se dibuja en bloques y nodos; el nombre
  accesible conserva el nombre largo. La gramática del piloto no la declara todavía: ningún dibujo cambia.
- **V16 en el paquete.** `validate(map, grammar, { mode, coverage?, texts?, queryDate? })` dibuja el mapa a cuatro
  edades (`agingDates`: hoy, umbral 1, umbral 2 y +100 días) cuando recibe las cadenas de interfaz. En publicación,
  todo aviso es error; en privado, aviso. Sin `texts`, V16 no corre y el informe lo declara, igual que V15 sin
  cobertura: es el único modo de dibujar sin que el paquete traiga palabras (D-S1-06). Va a «Enmiendas».
  - El loader del build lo corre sobre cada mapa publicado con la fecha de consulta; el investigador (`validarPropuesta`
    y `aprobar`) lo usa en lugar de su `dibujo.ts`, que se retira. Los mensajes conservan su forma `dibujo · …`.
  - La cuarta edad (+100 días) es nueva para el investigador: antes dibujaba en tres fechas.
- **Inconsistencia del contrato que V16 destapó (va a «Enmiendas»):** A1 se declara «acepta» en publicación, pero su
  nodo de `ia` («Agente de preguntas sobre datos» / «Data question agent») queda solo en su banda —A1 no tiene bloque
  ahí— y su nombre ocupa 3 líneas donde caben 2. V16 lo rechaza. La copia fijada no se toca: `carnadas.test` fija
  esos dos avisos exactos, y si la planeadora corrige A1 la prueba lo dirá. Propuesta: acortar el nombre en A1 o
  declarar A1 en modo privado.

### CSP del export estático (deuda del S1, D-S2-05)

- **`scripts/csp/inyectar.mjs`**, último paso de `pnpm build` (lo mismo en Vercel y en `pnpm start`): huella SHA-256
  de cada `<script>` y `<style>` en línea de cada página del producto y `<meta http-equiv="Content-Security-Policy">`
  justo después de `<meta charSet>`. Política: `default-src self`; `script-src` y `style-src` con `self` y las
  huellas; `img-src self data:`; `font-src self`; `connect-src self` (más el origen de Sentry solo si el
  build trae su DSN); `object-src none`; `base-uri` y `form-action self`. Ningún `unsafe-inline`. Correrlo
  dos veces da los mismos bytes. Se niega a publicar un `style=` o un `on…=` en línea.
- Build: «csp: 24 páginas · 78 huellas de script · 4 de estilo».
- `ConmutadorIdioma`: el `style="display:contents"` pasa a la clase `.alterna-par` (era el único `style=` del producto).
- **La maqueta** (`/diseno/**`, sin scripts en línea; 187 `style=` y un `<style>`) lleva una CSP de cabecera fija
  —`script-src self`, `style-src self unsafe-inline`— en `vercel.json` y `serve.json`. Se retira con la
  maqueta (A-25, S4).
- **`vercel build` sin conexión** (`pnpm dlx vercel@60.1.3 build --yes`, con un `.vercel/project.json` escrito a mano y
  borrado después; sin deploy ni sesión): corre el paso («csp: 24 páginas…»), `static/es/atlas/fabric.html` trae su
  meta y la única regla con cabecera CSP es `^/diseno(?:/(.*))$`. La prueba final es la mirada M2 en el preview.
- **`github.silent` fuera de `vercel.json`:** dejó de existir en 2023 (la documentación de Vercel lo lista en
  «Legacy»); el bot siguió comentando con él puesto. La persona apagó los comentarios en la configuración Git del
  proyecto; se verifica en cada push del PR.

### Fuentes y LCP (deuda del S1, D-S2-04) y el campo homepage (D-S2-11)

- **El recorte ya estaba hecho, verificado por el constructor:** un lector del `cmap` de cada WOFF2 (directorio de
  tablas + brotli de Node, en el scratchpad) contra `cobertura.json`: Space Grotesk 464 = 464 y JetBrains Mono
  432 = 432, cero de más y cero de menos (35.724 y 47.412 bytes). Lo que ahorraría bytes (glifos alternos, rasgos,
  ejes) cambia `docs/diseno/assets/fuentes/` (solo lectura) y la cadena G15: va a «Enmiendas».
- **ADR `decisions/lcp-budget-by-profile.md`:** techo de 3,0 s por el estándar 5 v2.17.0 y la regla 23 (perfil
  «texto medido con tabla de métricas + `display: block`»); `perf-budget.json` sigue en 2900 ms, que la CI
  afirma con mediana de 3. La medida con las rutas nuevas va al cierre del sprint.
- **ADR `decisions/csp-static-export.md`** con el porqué de la meta, la política y sus gates.
- **Campo homepage:** de «prueba» a la URL del propio repo (`gh repo edit --homepage`; verificado con
  `gh repo view`), como pide la regla 17 de v1.32.1. Se re-verifica tras el merge.

### Corridas de la fase 0 y un tropiezo

- **Local (2026-10-02):** `pnpm test` 1054/1054 en 57 archivos, 98,7 % de líneas; `E2E_PUERTO=3147 pnpm test:e2e`
  412/412 en 48,4 s, sin reintentos (las 320 del S1 más `csp.spec` en los cuatro proyectos).
- **Tropiezo:** el commit de la CSP subió sin correr la suite entera: `design-sync/` copia `base.css` y la clase
  `.alterna-par` lo dejó desfasado (`design-sync.test` en rojo). La CI de `9604802` lo vio: `quality` en rojo y, por colgar de él,
  `e2e` y `lighthouse` `skipped` (no ejecutaron). Se regeneró en `4c94f5a`. Desde aquí, antes de cada push: `pnpm test`
  entero, no solo las pruebas tocadas.
- **CI de `4c94f5a`:** `quality`, `e2e`, `lighthouse`, `diagramador (ubuntu-latest)` y `diagramador (macos-latest)` en
  `success` propio, más Vercel. **Cero comentarios de `vercel[bot]`** en el PR #5 (y desaparece el check «Vercel Preview
  Comments»): el interruptor que apagó la persona funciona.

## Fase 1 — Conformidad v0.4.0, `compare`, diferencias y P13 («continúa» 2026-10-02)

### Bitácora reparada

- Un reemplazo de texto de la fase 0 tomó el `$` y el acento grave de `^/diseno(?:/(.*))$` como la secuencia
  «todo lo anterior a la coincidencia» y copió media bitácora dentro de la sección de la CSP: frontmatter, plan y
  fase 0 aparecían dos veces. Se reconstruyó: el texto de cada sección quedó como estaba, sin la copia. Desde aquí
  las ediciones de la bitácora se hacen con reemplazo literal, sin plantillas de sustitución.

### M1 — mirada de FORMA de «en el mismo diagrama» (D-S2-06)

| Archivo | Botón / estado | Qué mirar | Respuesta esperada |
|---|---|---|---|
| `docs/propuestas-de-diseno/lado-mismo-diagrama.html` (doble clic) | abre con «Almacenamiento» desplegada; tocar el nombre de otra banda, o uno de sus bloques, abre esa; tocar la abierta la cierra | que los componentes se ven dentro del mismo diagrama, la banda abierta en las tres plataformas, sin otra pantalla | sí / no |

- **El boceto** lo genera `scripts/propuestas/lado-mismo-diagrama.mjs` con los datos y las medidas de la maqueta
  (que no se toca): rejilla de 9 × 152 u (viewBox 1496), bloques de 152 × 64 y, en la banda abierta, el nombre del
  bloque y su pila de nodos de 152 × 88 a 8 u. La columna abierta lleva fondo, «cerrar» y un chevrón hacia arriba
  (el color nunca va solo); las demás, un chevrón hacia abajo. Un SVG pregenerado por estado (ninguna + 9 bandas);
  un script de 30 líneas muestra el que toca y devuelve el foco a la cabecera.
- **Pasada de capturas e interacción** (Chromium, 1600 px, leídas como imagen): oscuro ES y claro EN; tocar un
  bloque de IA abre IA, tocar su cabecera la cierra, Enter la vuelve a abrir; cero errores de consola.
- **Ajuste menor decidido en el boceto (al gate del ciclo):** en el bloque cerrado, el medidor de madurez se coloca
  tras la cuenta medida; la maqueta lo fija a 52 u y a 118 u roza «comp.». `compare` lo colocará igual.
- **Fuera del boceto, decidido y registrado:** en el producto, tocar un componente abre su ficha (`toCard`) y el
  nombre del bloque abierto, la ficha del bloque; en el teléfono no cambia nada respecto de la maqueta.
- **Primera vuelta (2026-10-02), una banda a la vez:** la persona, con el boceto abierto: «Mas o menos me gustaria que
  fuera un solo boton despliga todo y contrae todo». No es un sí: la forma cambia.
- **Segunda vuelta (2026-10-02), un solo botón:** «Desplegar todo» abre cada bloque en sus componentes, en todas las
  bandas y todas las plataformas, dentro del mismo diagrama (mismas 9 columnas de 152 u; cada fila crece hasta su
  celda más alta); el mismo botón dice entonces «Contraer todo» y vuelve a los bloques (`aria-expanded`, chevrón y
  palabra: el color no interviene). Las cabeceras de banda dejan de ser control. En el producto, tocar un bloque
  abre su ficha, como en la maqueta, y tocar un componente, la suya; en el teléfono, el mismo botón despliega o
  contrae los componentes de la banda que se ve. Pasada de capturas e interacción: contraído → desplegado →
  contraído con clic y desplegado con Enter, oscuro ES y claro EN, cero errores de consola.
- **Lo que cambia en el plan si la segunda vuelta se aprueba:** el producto usa dos estados del nivel por banda
  (ninguna banda o todas); `compare` conserva `levelByBand` por banda como pide § 4.4, y la fila independiente
  trae los dos niveles completos. `toCompareCSS` alterna una sola clase por fila.
- **M1 APROBADA (2026-10-02), con el boceto abierto:** «Excelente pero pon el boton en la parte superior derecha del
  recuadro del diagrama». Ajuste aplicado en el boceto en el mismo acto (sin nueva parada, regla de segundas
  vueltas): el botón vive en una franja propia arriba a la derecha, dentro del recuadro del diagrama, fuera de la
  zona que se desliza; queda quieto al desplazar el lienzo y no tapa la cabecera de las bandas (capturas a 1600 y
  1100 px, desplegado y con el lienzo desplazado). El producto lo pone en el mismo lugar; su veredicto final viaja
  con M2 en el preview.

### Conformidad v0.4.0, primer bloque (avisos, vistas, marcas, V8, V3, haz, paréntesis)

- **Avisos con forma fija (§ 5.6):** `layout` devuelve `avisos: { vista, tipo, id, mensaje }[]`, uno por mensaje, con
  `mensaje` que empieza por «<tipo>: ». Tipos: `D11`, `pistas`, `fuera-del-lienzo`, `encima`, `etiqueta`,
  `bloque-vacio`, `canal`, `carriles` y **`texto`**, extensión del piloto (un texto con más líneas que su caja, una
  palabra que no cabe sola, una cabecera de franja más alta que su fila): el contrato no nombra el aviso más común
  y V16 vive de él. Va a «Enmiendas».
- **`etiqueta:`** nuevo en el motor: el invariante «toda etiqueta a ≤ 30 u de su trazo» lo medía solo una prueba;
  ahora `layout` lo reporta (`lejanas`, en coordenadas dobladas para que el centro sea entero, G1).
- **`cruces`** en la geometría (§ 8): los mismos cruces de `crossings`, siempre vacíos en un dibujo publicable.
- **Vistas `nivel1`/`nivel2`** (§ 8, D-S2-02): renombradas en el motor, la app, las pruebas y los 30 golden
  (`git mv`). Los textos de la app (`titulo`/`descripcion`) cambian de clave.
- **Envía/recibe horizontales (§ 5.4):** `→` y `←`, los paths del contrato. La maqueta dibuja ↑/↓ y el S1 la
  siguió; 0.4.0 resolvió D-S1-19 por el path horizontal. **Desvío de fidelidad declarado**, para la mirada M2: en
  la referencia de franja la «→» queda junto a marcadores horizontales como «⇄» de «a demanda».
- **Golden:** los 30 regenerados; un script los comparó con los de `HEAD` y **los 30 difieren solo en el nombre de
  la vista (`dg-nivel1`, `data-vista`) y en los dos paths de `<defs>`**. Ninguna coordenada se movió.
- **V8 para el `enum` de `estado`** (§ 7; antes V1). Un `estado` ausente sigue siendo V1 (es `required`).
- **V3 (alerta, F-022): bloque sin componentes.** Destapa la **segunda inconsistencia del contrato**: C10 agrega
  cuatro bloques vacíos para llegar a 11 y su `esperado.json` no declara las cuatro alertas. Se fijan exactas, como A1
  (`ALERTAS_CONOCIDAS`), con su prueba. Va a «Enmiendas».
- **Regla del haz (§ 4.9) en la leyenda del motor:** `texts.leyenda.haz`, como párrafo bajo los modos (la maqueta la
  escribe así, sin dibujo). La app deja de escribir su `notaModos`: el mismo texto pasa a las cadenas del motor y la
  rejilla de la leyenda se ajusta (la sección de modos ocupa las dos filas). Capturas: igual que antes.
- **Paréntesis corto (§ 5.3):** el corte voraz trata como una pieza el paréntesis que cabe entero en una línea. Ningún
  golden cambió. **G3 lo vio:** el comentario citaba el ejemplo del contrato con un nombre de plataforma; se cambió
  por uno neutro («Compute capacity (F SKU)»).
- **Matriz de envejecimiento:** `envejecer.test` toma las edades de `agingDates` (hoy, umbral 1, umbral 2, +100 días)
  en lugar de su lista propia de tres fechas más una fija.

| Gate | ¿Puede fallar? | Rojo | A quién nombró | Verde |
|---|---|---|---|---|
| Paréntesis corto (`unidades.test`) | sí: el corte voraz partía cualquier espacio | el motor anterior (`git stash` del cambio) | `["Compute capacity (F", "SKU)"]` | con el cambio |
| V8 por `enum` de `estado` | sí: la tabla lo mandaba a V1 | antes del cambio | `estado fuera del enum → V8` | con el cambio |
| V3 alerta por bloque vacío | sí: nada lo decía | antes del cambio | `vacio · el bloque no tiene componentes` | con el cambio |
| `etiqueta:` (`lejanas`) | sí: límite exacto 30 u | umbral corrido 0,2 u | «a 30,1 u sí, con el flujo y la distancia» | restaurado |
| `cruces` en la geometría | sí: los constructores lo dejan vacío | `geo.cruces = []` | «cada cruce de `crossings` aparece como aviso D11» | restaurado |

- **Corridas:** `pnpm test` 1057/1057 (98,75 % de líneas); e2e 412/412 en 58,3 s; CI de `0743576` (boceto M1) en
  `success` en los cinco checks y Vercel, cero comentarios del bot.

### P13 — la punta de una flecha de llegada no queda sobre la pista de otro flujo

- **Medida antes de la regla:** el detector `puntas` (los últimos 9 u del último tramo de cada llegada, 4,5 u a cada
  lado, contra los tramos verticales de los demás flujos) da **2 en el nivel 2 y 2 en el recorrido de P1, 2 en el
  nivel 2 de Fabric** (`f-lakehouse-agente` bajo `f-dataflow-warehouse`, `f-replica-spark` bajo `f-onelake-spark`) y
  **0 en los 19 dibujos de los mapas del contrato**. Solo la pista más externa de un canal (a 6 u de la tarjeta) cae
  dentro de una punta de 9 u; con más de 6 pistas repartidas, también solo la más externa.
- **Regla (decisión menor, registrada; va a «Enmiendas» como respuesta a P13):** asignar SIEMPRE junto a la columna
  las pistas de los flujos que entran a ella, como proponía el contrato, corre casi toda línea del dibujo aprobado
  hacia su destino (un canal con un solo flujo dejaría de ir por el centro). Se toma la forma mínima: las pistas se
  asignan como siempre y una posición a menos de 9 u de una tarjeta solo la usa un tramo que no tape ninguna punta
  de ese lado; si la tapa, cambia de lugar con el tramo más cercano del canal que no esté junto a una tarjeta y que
  ahí no tape ninguna. Si no hay con quién, `layout` lo dice: `pistas: <flujo> corre bajo la punta de <flujo>`.
- **Después:** 0 en P1, en Fabric y en los mapas del contrato; **los 30 golden, idénticos** (no tenían el caso).
  Capturas de Fabric nivel 2 antes y después, leídas como imagen: solo se mueven los dos tramos; las dos puntas
  quedan limpias.
- **Gate:** `densidad.test` (P13 en los 19 dibujos del contrato y las 3 vistas de P1) y el aviso en `layout`, que
  las pruebas del atlas (Fabric a cuatro edades) ya exigen en cero. ¿Puede fallar? Sí: sin la reparación hay 4
  puntas. **Rojo:** reparación apagada → `P1 · nivel2` y `P1 · recorrido` en rojo en `densidad.test`, y en la app
  `mapas-aprobados` nombra `data/mapas/fabric.mapa.yaml · V16 · nivel2 · pistas: f-lakehouse-agente corre bajo la
  punta de f-dataflow-warehouse`. **Verde** al restaurarla: `pnpm test` 1081/1081.

## Desviación del plan

Lo que el plan aprobado ya declaró frente a la orden y a `SPRINT_002.md`:

1. **El subconjunto de fuentes ya estaba hecho.** Los cmap de `space-grotesk.woff2` y `jetbrains-mono.woff2`
   son exactamente los rangos de `cobertura.json` (464 y 432 puntos de código). Recortar a la cobertura no
   ahorra un byte. Lo que ahorraría (glifos alternos, rasgos GSUB/GPOS, ejes) toca `docs/diseno/` (solo
   lectura) y la cadena G15. Se paga la deuda con medida y ADR (D-S2-04), y el recorte profundo va a «Enmiendas».
2. **CSP por `<meta>` inyectado tras el build, no por cabecera en `vercel.json`** (D-S2-05). Las huellas cambian
   en cada build (el payload de Next lleva el build ID) y el export estático no admite cabeceras ni nonces.
3. **Fase 0 recortada** a lo que lista la orden más lo mínimo para seguir en verde; los otros desajustes con el
   contrato v0.4.0 (avisos como objeto, marcas horizontales, V8, alerta V3, `cruces`, regla del haz,
   paréntesis corto, cuatro edades) van a la fase 1 (D-S2-03).
4. **Dos contradicciones del contrato v0.4.0:** § 4.5 (`textos`/`fechaConsulta`) contra § 8 (`texts`/`queryDate`),
   y § 8 (`nivel1`/`nivel2`) contra el código (`nivel-1`/`nivel-2`). Manda § 8 (D-S2-02).
5. **Migración 0.3.0 → 0.4.0 en memoria** (D-S2-01): V1 exige la misma versión menor y el mapa aprobado de
   Fabric no se corrige a mano.
6. **Versionado de mapas** (D-S2-09): nada conservaba una versión anterior; `aprobar` la archiva antes de
   sobrescribir.
7. **La constitución de la planeadora no trae los deltas del S1** (reglas 10, 15, 17, 18, 21 y 22): se fusiona,
   no se copia; se suman la regla 23 y la regla 17 de v1.32.1.
8. **Mirada M1 agregada** (D-S2-10): la forma de «en el mismo diagrama» se aprueba en un boceto antes de
   construir el nivel por banda.
9. **Extensiones del contrato** que van a «Enmiendas»: filas independientes y `toCompareCSS` (D-S2-07),
   `marks` y `diffToText` (D-S2-08), el estado del lado a lado en la URL.
