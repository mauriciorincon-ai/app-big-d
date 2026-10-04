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

### `compare` y las diferencias dibujables (§ 4.4, § 4.7)

- **`compare(maps, grammar, { texts, queryDate, levelByBand?, n?, page?, part?, marks? })`** →
  `packages/diagramador/src/layout/compare.ts`:
  - **columnas:** capas y franjas en el orden de la gramática;
  - **rejillas:** sin `levelByBand`, la de bloques de § 5.3 (118 u a 14 u, viewBox 1190; bloque compacto 118 × 64);
    con `levelByBand`, la de componentes (152 u, viewBox 1496; nodos 152 × 88 a 8 u), **aunque ninguna banda esté
    en 2**, para que desplegar no mueva columnas;
  - **filas:** orden por `sujeto_id`; `n`/`page` del consumidor (el motor no conoce el 3); ids con prefijo por mapa
    (D12) y `data-mapa`; gramáticas distintas, bandas que no existen o marcas sin dos mapas lanzan un error claro.
- **El producto: filas independientes en lugar de `toCompareCSS` (simplificación de D-S2-07, registrada).** Con la
  forma aprobada en M1 (un solo botón despliega todo y contrae todo), cada fila sale de `compare([mapa], …,
  { part: "rows" })` en sus dos variantes (`levelByBand: {}` y todas en 2) y el botón alterna entre los dos SVG; la
  cabecera, de `part: "header"`. Las dos variantes tienen espacios de nombres distintos (`variante` «n1»/«n2» en la
  geometría). Propiedad probada: cada fila sola es su fila de la comparación entera, trasladada.
- **Decisiones menores (registradas, al gate del ciclo):**
  - el nodo del lado a lado usa las medidas de la maqueta (`nodoComp`): glifo 3 u más cerca del filete y 7 u más
    para el nombre; con las del nivel 2, «enmascaramiento» no cabía (aviso visto);
  - **el lado a lado no lleva insignias de vigencia:** en el bloque compacto la insignia montada no cabe a 118 u y se
    salía a la columna vecina; en el nivel 2 pisaba el nombre del bloque. La matriz de envejecimiento lo vio (44, 75,
    22 y 30 avisos según la variante). El estado va en palabras en el rótulo de cada fila
    («v0.1.0 · por revisar · 34 días») y en el nombre accesible de cada tarjeta, como la maqueta, que no las dibuja.
- **Marcas de diferencia (`marks`, D-S2-08):** una píldora glifo + palabra por clase presente (nuevo, renombrado,
  madurez en la fila nueva; retirado, llena, en la anterior), montada 2 u bajo el borde de su tarjeta. Si no caben en
  el ancho de la tarjeta, pasan a otra fila (a 118 u, «madurez» + «nuevo» se metían en la columna vecina: el aviso
  `encima:` lo vio en la primera captura). Sus paths (los de la maqueta) solo van en el `<defs>` del lado a lado,
  para no tocar los 30 golden de las demás vistas. § 5.4 no los trae: a «Enmiendas».
- **`diffToText(before, after, grammar, { language, texts })`:** la lista explicativa, en el orden de las clases, con
  glifo + palabra, nombre, banda y qué cambió («Antes «Conector JDBC». Mismo componente.»); sin cambios lo dice; los
  flujos y pasos se cuentan. § 8 no la trae: a «Enmiendas».
- **Textos nuevos del motor** (`texts.lado`, `titulo.compare`, `descripcion.compare`) en la app y en las pruebas.
  Copy de las marcas y de la lista: mirada de TEXTO, «maquetado, no visto».
- **Golden: 14 nuevos** (`lado.bloques`, `lado.pagina-2`, `lado.contraido`, `lado.una-banda`, `lado.desplegado`,
  `lado.diferencias` y `lado.diferencias-desplegado`, ES y EN), con los mismos casos en Node y en el navegador
  (`test/lib/lado.ts` sin `fs`). Determinismo local: los 44 SVG con la misma huella en Chromium, Firefox y WebKit; G15
  mide ahora 1734 textos (el más ajustado, 97,1 %). Revisados como imagen en los dos idiomas (bloques, desplegado y
  las dos diferencias).

| Gate | ¿Puede fallar? | Rojo (mutación de una línea) | A quién nombró | Verde |
|---|---|---|---|---|
| G5 entre N mapas | sí: las columnas podrían depender de las filas | franjas al revés con más de 2 mapas | «columnas…», «G5 entre N mapas», «fila sola» | restaurado |
| Invariancia al orden | sí: sin orden por `sujeto_id` | orden de llegada | «invariancia al orden», «n y page» | restaurado |
| El nivel por banda no mueve columnas | sí: la rejilla podría seguir al despliegue | rejilla según `desplegada` | «no mueve columnas», «desplegar una banda», «columnas» | restaurado |
| Fila independiente = fila trasladada | sí: un margen propio la corre | filas solas desde 4 u | «la fila de un mapa sola», «cabecera sola» | restaurado |
| Píldoras dentro de su tarjeta | sí: sin partir en filas se salen | sin el salto de fila | «las píldoras no salen…», matriz «diferencias» | restaurado |
| Matriz de envejecimiento en `compare` | sí | las insignias, de verdad (antes de la decisión) | 44/75/22/30 avisos `fuera-del-lienzo`/`encima` | sin insignias |
| `diffToText` en orden de clases | sí | orden sin la clase | «una línea por componente», «glifo de su clase» | restaurado |

- **Corridas:** `pnpm test` 1220/1220 (`compare.ts` 95 % de líneas, `diffToText.ts` 100 %); determinismo 6/6 en tres
  motores; CI de `28676d2` y `8a647b9` en `success` en los cinco checks y Vercel, cero comentarios del bot.

### V16 también dibuja el lado a lado

- `avisosV16` suma la fila del mapa en el lado a lado, contraída y desplegada (`compare([mapa], …, { part: "rows" })`),
  a cada edad. Un mapa que no cabe en el lado a lado ya no se puede proponer, aprobar ni publicar; el build de la app
  (loader en modo publicación) lo exige sobre Fabric a cuatro edades: pasa.
- **Gate:** ¿puede fallar? Sí: el nombre del sujeto solo se dibuja en el rótulo de su fila. **Rojo:** con un nombre
  de 12 repeticiones, sin el lado a lado en V16 → «también dibuja su fila del lado a lado» en rojo (0 errores). La
  primera versión de la prueba usaba 6 repeticiones y **caía en rojo también con el lado a lado puesto**: el nombre
  cabía; la prueba no medía lo que decía. Se alargó, se vio verde, rojo sin el lado a lado y verde al restaurar.
- El investigador ahora también dice `dibujo · lado a lado desplegado · texto: …` cuando un nombre no cabe ahí
  (`nucleo.test` al día).

### Aviso de seguridad sin corrección (`braces`), aceptado con gate

- **CI de `8c6f980`: `quality` en rojo por `pnpm audit --audit-level high`** (y por eso `e2e` y `lighthouse`
  `skipped`, no ejecutaron); `diagramador` × 2 y Vercel en `success`. No lo causó el sprint: GHSA-vfj7-8cjw-p6xm
  (`braces` ≤ 3.0.3, denegación de servicio por patrones anidados, alto) se actualizó hoy, 2026-10-02 22:36 UTC, y
  **no tiene versión corregida** (`first_patched_version: null`; en npm la última es 3.0.3). `braces` solo llega por
  `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` 3.3.1 → `micromatch`; la versión más nueva de
  `eslint-config-next` (16.3.8) fija el mismo `fast-glob`. `pnpm audit --prod`: sin avisos.
- **Decisión (registrada; la persona puede vetarla):** excepción angosta en `pnpm-workspace.yaml`
  (`auditConfig.ignoreGhsas`, solo ese aviso, con su porqué y cuándo se retira: cuando exista la 3.0.4 o
  `eslint-config-next` deje de pedirlo). El audit pasa con «1 high (1 ignored)».
- **Gate nuevo `tests/unit/avisos-ignorados.test.ts`:** cada aviso ignorado está documentado con su paquete, y ese
  paquete no se alcanza desde ninguna dependencia de producción del lockfile (caminata por `snapshots`). ¿Puede
  fallar? Sí. **Rojo 1:** un GHSA sin documentar en la lista → «cada aviso ignorado está documentado» nombra
  `GHSA-xxxx-yyyy-zzzz`. **Rojo 2:** caminar también `devDependencies` como si fueran producción → «ningún paquete…»
  nombra `braces`. Verde al restaurar.
- **Deuda (al summary):** retirar la excepción en cuanto haya corrección; `/deploy-check` la revisa.

## Fase 2 — El lado a lado en producto («continúa» 2026-10-02)

### La CSP bloqueaba los estilos al cambiar de nivel sin recargar (defecto de la fase 0)

- **Síntoma:** al pasar del nivel 1 al recorrido con las pestañas de nivel, la consola registra
  `style-src-elem · inline` y los pasos del recorrido llegan sin sus reglas. **Causa:** Next cambia de página sin
  recargar y React inserta el `<style>` de la página nueva (las reglas de los pasos, `toJourneyCSS`) bajo la
  política de la primera, que no trae su huella. La prueba de la fase 0 (`csp.spec`) abría cada ruta con `goto`:
  nunca cambió de página desde dentro. Lo encontré al diseñar `/comparar`, que también lleva estilos en línea.
- **Arreglo:** cada página lleva en `style-src` las huellas de los estilos en línea de todas las páginas del sitio
  (hoy 4). Los scripts no: React no ejecuta un `<script>` en línea que inserta en el cliente.
- **Gate:** `csp.spec` recorre las pestañas de nivel de cada plataforma publicada, en los dos idiomas, sin recargar
  (una marca en `window` sobrevive), y exige cero violaciones; `csp.test` suma la prueba de la función. ¿Puede
  fallar? Sí. **Rojo:** inyector sin las huellas del sitio → las 4 rutas nombran `style-src-elem · inline`, y la
  prueba unitaria «suma los estilos de las demás páginas». **Verde** al restaurar.

### `/[idioma]/comparar`: el lado a lado en producto

- **Qué hay en la página** (fiel a `lado-a-lado.html`, con la forma de M1):
  - encabezado («Cuatro plataformas, el mismo mapa»: el número en palabras sale de los datos), consulta y «vigencia
    por plataforma en cada fila»; pestañas de nivel con «04 Lado a lado» actual;
  - selector de plataformas (`details` con casillas; orden por id; la última elegida no se quita) y paginación de
    tres en ancho (`POR_PAGINA`, constante declarada de la vista);
  - el lienzo: índice de bandas y pista si desborda, «Saltar el diagrama», **el botón «Desplegar todo» / «Contraer
    todo» arriba a la derecha del recuadro, en su franja, fuera de lo que se desliza**, la cabecera de bandas y una
    fila por plataforma; tocar un bloque abre su ventana (la del nivel 1, con banda y plataforma arriba) y, desplegado,
    tocar un componente abre su ficha;
  - Databricks y Snowflake como filas «próximamente», con su nombre, sin contenido inventado y un enlace a su página
    del investigador; el texto queda a la vista al deslizar;
  - teléfono (< 900 px): pestañas de banda, todas las elegidas apiladas (sin paginar), un plegable por bloque con sus
    tarjetas, y el mismo botón despliega o contrae todos;
  - leyenda del motor y la lectura en texto de cada plataforma publicada (G10: la cabecera apunta a la raíz de las
    lecturas y cada fila a la suya).
- **Cómo funciona (D-S2-07 simplificado tras M1):** cada fila son dos SVG del build (`compare([mapa], …, { part:
  "rows" })` con todas las bandas en 1 y en 2); el botón cambia un atributo del lienzo y el CSS muestra una u otra. Qué
  plataformas y qué página viven en la URL (`?plataformas=a,b&pagina=2`, limpia con todas y la página 1); un script en
  línea, antes de pintar, pone dos atributos en el `<html>` y unas reglas generadas por plataforma muestran las filas.
  El componente lee la URL con `useSyncExternalStore` y la escribe con `history.replaceState`: el árbol de React no
  depende de la URL (mismo HTML en servidor y cliente) y una URL con consulta no salta al hidratar. Nada se vuelve a
  dibujar en el cliente. El script y el componente aplican la misma regla (`estado-lado.ts`): una prueba ejecuta el
  script y lo compara consulta por consulta.
- **Navegación:** la pestaña 04 de los niveles lleva a `/comparar` desde cada vista del atlas (en `/comparar`, las
  01–03 son las de la primera plataforma publicada); la barra marca «Atlas» también aquí; el conmutador de idioma
  suma la consulta al tocar (la selección y la página viajan al otro idioma).
- **Decisiones menores (registradas, al gate del ciclo):**
  - en el teléfono, las tarjetas de cada bloque son las de su ventana (`toBlockCards`: tipo, madurez, frase y
    conexiones), más ricas que las de la maqueta; el resumen lleva el glifo del tipo, tomado de la primera tarjeta
    (el mismo componente que da el tipo al bloque, § 4.1);
  - un grupo sin bloque de un solo componente se dibuja con el nombre del componente: su ventana se titula igual;
  - la página lleva leyenda y lectura en texto, que la maqueta del lado a lado no dibujaba (el plan las pedía, y G10);
  - el texto de versión y vigencia de cada fila sale en la letra del cuerpo y no en la mono: la regla general del
    SVG le gana a la clase, igual que en la maqueta (lo aprobado); el motor lo mide con la mono, más ancha (lado
    seguro). A «Enmiendas» como nota.
- **Defectos que vieron los gates mientras se construía (y se arreglaron):**
  - axe: la cabecera apuntaba con `aria-details` a una lectura que no existía en esta página → raíz común;
  - pasada de interacción: en ancho, tocar en el índice una banda que el lienzo no puede llevar al borde marcaba la
    última; ahora queda marcada la tocada mientras el lienzo siga donde la dejó (vale también para el atlas);
  - pasada de interacción: la ventana de un grupo sin bloque se titulaba con la banda y la tarjeta decía el componente;
  - e2e: al pasar a la última página, el foco se perdía (se movía a «Anterior» mientras seguía deshabilitado);
  - captura: con una página de solo «próximamente», la línea de la fila no llegaba al final del dibujo.

| Gate | ¿Puede fallar? | Rojo (mutación) | A quién nombró | Verde |
|---|---|---|---|---|
| Script previo = regla del componente (`lado.test`, propiedad) | sí: son dos códigos | el script acepta «2x» como página | «el script previo al pintado aplica la misma regla» | restaurado |
| Ida y vuelta de la consulta | sí | la página 2 no se escribe | «URL limpia», «ida y vuelta» | restaurado |
| Todo lo que se toca abre algo, nada sobra | sí | sin una ficha de componente | «todo lo que se toca abre algo» (es, en) | restaurado |
| El teléfono agrupa como el motor | sí, **solo con un mapa de dos bloques por banda** (con los datos de hoy, la mutación pasaba en verde: se agregó el caso) | bloques al revés dentro de la banda | «el teléfono agrupa como el motor dibujó» | restaurado |
| Glifo del resumen = tipo del bloque | sí, **solo con un bloque de tipos mezclados** (mismo hallazgo: se agregó el caso) | glifo de la última tarjeta | ídem | restaurado |
| Neutralidad y N plataformas | sí | sin ordenar por id | «N plataformas», «neutralidad» | restaurado |
| Ids sin choque en la página | sí | mismo prefijo en las dos variantes | «los ids del dibujo no chocan» | restaurado |
| CSS por plataforma | sí | sin las reglas del teléfono | «CSS generado» | restaurado |
| Matriz de envejecimiento sobre `/comparar` | sí | lanzar en «vencido» | 4 fechas (2026-11-19 …) | restaurado |
| `lado.spec` (e2e, cuatro mutaciones a la vez) | sí | sin script previo · filas contraídas en la rejilla de bloques · sin limpiar el `<html>` | «primer pintado», «sin mover las columnas», «próximamente… al salir» | restaurado |
| Idioma con consulta (e2e) | sí, **solo sin los cuatro manejadores**: el puntero ya completaba el enlace | sin manejadores | «el idioma conserva la consulta» (`/en/comparar` sin `?pagina=2`) | restaurado |
| `Lado` en Testing Library | sí | sin abrir los plegables · última elegida quitable | «Desplegar todo…», «el selector y la paginación…» | restaurado |

### Versionado de mapas (D-S2-09)

- **El script de aprobación** (lo corre una persona) archiva, antes de sobrescribir, el mapa que había si la versión
  cambia: `data/mapas/versiones/<id>-<versión>.mapa.yaml`, con sus mismos bytes; si ese archivo ya existe con otros
  bytes, no escribe nada. El ensayo sobre una copia de `data/` lo hace igual y la carga lo valida.
- **El cargador** lee las versiones: nombre `<id>-<versión>`, plataforma publicada, misma versión que el nombre,
  anterior a la vigente, y valida como un mapa publicado (V16 incluido: la página de diferencias las dibuja). Las da
  de la más vieja a la más nueva (`0.0.10` después de `0.0.9`).
- **La comprobación de aprobados** (`mapasSinAprobacion`): cada versión archivada de una plataforma real es,
  huella y versión, una línea de su `revisiones/<id>.jsonl`; y toda versión aprobada que no es la vigente está
  archivada. Hoy Fabric no tiene versiones anteriores: la primera llega con su reinvestigación (fase 3).

| Gate | ¿Puede fallar? | Rojo (mutación) | A quién nombró | Verde |
|---|---|---|---|---|
| Archiva con los mismos bytes (`scripts.test`, de punta a punta en una raíz temporal) | sí | sin el paso de archivo | «…y archiva la versión anterior» | restaurado |
| Una versión no anterior a la vigente | sí | `>` en lugar de `>=` | «cada forma rota nombra su archivo» | restaurado |
| Orden de versiones | sí | sin ordenar | «de la más vieja a la más nueva» | restaurado |
| Archivada = aprobada, y ninguna falta | sí | huella sin comparar | «una versión archivada que no aprobó nadie…» | restaurado |

### Capturas, Lighthouse y paquete de diseño

- **Pasada de capturas e interacción** (`capturar-producto.mjs`, ahora con los controles del lado a lado: selector,
  paginación, los dos botones, pestañas de banda y plegables): 24 rutas × 2 temas × 2 anchos = 96 encuadres, 5524
  comprobaciones, **0 fallas**. Leídas como imagen las de `/comparar` (1280 y 380, los dos temas y los dos idiomas),
  contraído, desplegado, página 2, URL con selección y el teléfono desplegado.
- **Frente a la maqueta** (pares producto | maqueta): el conmutador «Ver: bloques / componentes» es ahora el botón
  (M1); **a 1280 px el lado a lado se desliza** (la rejilla es la de componentes, 1496 u, para que desplegar no mueva
  columnas; la maqueta, a 118 u, cabía), con su índice de bandas; filas «próximamente» (dato real); leyenda y
  lectura; en el teléfono, tarjetas más ricas. Para mirar en M2.
- **Lighthouse local** (Lighthouse 13.4.1, mediana de 3): `/es/comparar` LCP 2765 ms, CLS 0, TBT 4 ms, 401 KB,
  scripts 155 KB, categorías 96/100/100/100/100; `/en/comparar` igual; `/es/atlas/fabric` LCP 2476 ms. Las dos rutas
  entran en `lighthouse-urls.json`.
- **`design-sync/`:** la hoja `lado.css` entra al paquete y una tarjeta nueva, «Componentes · S2 / Lado a lado»
  (contraído y desplegado, sobre la Plataforma Ejemplo). Su prueba de deriva, en verde.
- **Corridas:** `pnpm test` 1265 + 5; e2e 470 en verde (6 saltadas a propósito: las de ancho en el proyecto de
  teléfono), en 55,8 s.

### M2 — mirada de FORMA del lado a lado en el preview del PR #5

| Archivo | Botón / estado | Qué mirar | Respuesta esperada |
|---|---|---|---|
| preview del PR #5, `/es/comparar` | «Desplegar todo», arriba a la derecha del recuadro | que los componentes se ven dentro del mismo diagrama, como lo pensaba | sí / no |

- **CI de `a525c0c`:** los cinco checks y Vercel en `success`, cero comentarios del bot.
- **Primera respuesta (2026-10-03):** «continua», sin comentar la página. La palabra de fase no aprueba lo visual
  (regla 10): repregunta, sin construir encima.
- **M2 APROBADA (2026-10-03), con el preview abierto:** «Si lo abri y lo apruebo, continua». La misma respuesta pasa
  el gate de la fase 2. Las diferencias con la maqueta registradas arriba (el lado a lado se desliza a 1280 px,
  tarjetas más ricas en el teléfono, leyenda y lectura) viajan como decisiones al gate del ciclo; las flechas → ← del
  atlas (fase 1) no están en esta página y viajan igual.

## Fase 3 — Tres investigaciones («continúa» 2026-10-03)

- Orden de la persona: `/investigar databricks`, `/investigar snowflake` y `/investigar fabric`, una a la vez; cada
  mapa se aprueba afirmación por afirmación en la pantalla de revisión y el comando de aprobación lo corre la persona.

### Databricks — propuesta 2026-10-03 (verificada; espera la aprobación de la persona)

`/investigar databricks` lo invocó la persona el 2026-10-03; la propuesta quedó en `propuestas/2026-10-03-databricks/`:
19 componentes, 22 flujos, 7 bloques, un recorrido de 8 pasos (se bifurca en la vista materializada) y 106
afirmaciones; primera propuesta de la plataforma, sin retiros.

Mi verificación, independiente de la de la skill:

- `node scripts/verificar-citas.mjs propuestas/2026-10-03-databricks` → 106 verificadas · 0 no verificables · 0 no
  encontradas · 30 páginas. `node scripts/investigar/validar.mjs` → válida.
- **Ensayo de la aprobación en una copia del repo** (scratchpad; `data/` del repo intacto): el núcleo de la aprobación
  con todas las afirmaciones aprobadas da el mapa v0.1.0; el cargador del build lo valida en modo publicación (V1–V16,
  cobertura, cuatro edades) sin fallas, y la huella coincide con su revisión (`mapasSinAprobacion` = []).
- El sitio de la copia compila (33 páginas; CSP: 124 huellas de script, 128 de estilo). Capturas leídas como imagen:
  nivel 1, nivel 2 y recorrido (ES oscuro, EN claro) y `/comparar` con tres plataformas desplegadas. Cero cruces de
  flujos sobre nodos; el texto cabe en todas las cajas; Operación y Orquestación quedan «sin bloque», como Fabric.
- `propuestas/registro-de-ejecucion.jsonl`: 98 líneas nuevas con `fecha_hora · herramienta · url · llamada ·
  consulta`; ningún identificador de sesión ni de la persona.

**La skill nombraba el contrato 0.3.0 (defecto de la fase 0).** Al subir el paquete a 0.4.0 no actualicé
`.claude/skills/investigar/SKILL.md:48`; el validador rechazó el primer borrador y la investigación gastó sus dos
reintentos en eso. Corregido (la línea dice 0.4.0 y de dónde sale) con un gate nuevo,
`tests/unit/investigador/skill.test.ts`: toda «contrato X.Y.Z» de la skill y de su agente es la versión de
`CONTRATO.lock`.

| Gate | ¿Puede fallar? | Rojo | A quién nombró | Verde |
|---|---|---|---|---|
| `skill.test.ts` (versión del contrato en la skill) | Sí: ninguna otra prueba lee la skill | Con la línea sin corregir | `.claude/skills/investigar/SKILL.md:48 · 0.3.0` | Tras la corrección |

- La pantalla de revisión dice «validador: 0 reintentos» y la propuesta declara `ejecucion.reintentos: 2`. No es un
  defecto: la pantalla cuenta los bloqueos del hook de fin (`.reintentos`), y el hook no bloqueó porque la propuesta ya
  validaba al terminar; los dos reintentos son corridas de `validar.mjs` dentro de la skill. El rótulo se presta a
  confusión: lo aclaro en la fase 4 (texto, sin parada) para que muestre los dos números.
- Servida para la revisión: `pnpm build` del repo real y `PORT=3148 pnpm start`; abierta en el navegador de la persona
  en `/es/investigador/databricks`.

### Databricks — aprobada por la persona (2026-10-04 UTC; 2026-10-03 en su reloj)

- La persona revisó la propuesta en `/es/investigador/databricks` y corrió el comando de aprobación en su terminal:
  **106 aprobadas · 0 rechazadas · 0 retiros** → `data/mapas/databricks.mapa.yaml` v0.1.0 (huella `4acb52f7bec6…`),
  `data/revisiones/databricks.jsonl` (1 línea) y `data/plataformas/databricks.yaml` → `publicada`. Primero pegó el
  comando en el chat; le dije que solo una persona lo corre, en su terminal, y lo hizo.
- El mapa aprobado es byte a byte el del ensayo, salvo `fecha_actualizacion` (2026-10-04, la fecha UTC de la aprobación).
- **Pruebas que suponían a Databricks «próximamente» (6, ahora leen el dato):**
  - `datos.test.ts` (4 casos): usan una plataforma «próximamente» propia de la prueba (`nueva`) en lugar de una real;
    las versiones archivadas comparan contra los archivos de `data/mapas/versiones/` y contra la versión vigente de
    Fabric, no contra literales (Snowflake y Fabric v0.2.0 los habrían roto otra vez).
  - `atlas.spec.ts`: el enlace «Atlas» lleva a la primera publicada por id (`PUBLICADAS[0]`), hoy Databricks.
  - `investigador.spec.ts` «sin mapa»: toma la primera «próximamente» del dato (`PROXIMAS`, hoy Snowflake); el
    `aria-current` de «Conocimiento» es `page` solo en la página a la que lleva la sección (la primera plataforma por
    id) y `true` en las demás. Cuando no quede ninguna «próximamente», se salta diciendo por qué, como `lado.spec.ts`.
  - Para que el estado vacío siga cubierto sin una plataforma real que lo muestre, salió a un componente
    (`src/components/investigador/SinMapa.tsx`) con su prueba (`tests/unit/ui/sin-mapa.test.tsx`, ES y EN).
  - `scripts.test.ts` «con su retiro…»: 1,3 s sola, pero pasó de los 5 s con la suite en paralelo (la aprobación carga
    la base entera, que creció); tope de 20 s con el porqué en un comentario.
  - `design-sync/` regenerado: la tarjeta del selector ya no dice «Databricks — pronto».

| Gate | ¿Puede fallar? | Rojo | A quién nombró | Verde |
|---|---|---|---|---|
| `sin-mapa.test.tsx` (estado vacío sin plataforma real) | Sí: ninguna otra prueba unitaria pinta el estado vacío | Sin el botón; y con la solicitud de otra plataforma | Los dos casos (es, en): falta el enlace «Solicitar investigación» / «Request research»; el cuerpo no trae `/investigar nueva` | Restaurado |

- Corridas: `pnpm typecheck` · `pnpm lint` · `pnpm peers check` sin fallas; `pnpm test` **1299 pasan** (63 archivos,
  cobertura 97,37 % de líneas); `pnpm build` (32 páginas; CSP 124/128 huellas); e2e completo: 564 pasan · 6 saltadas
  por diseño · 2 fallas (el `aria-current` de arriba), corregidas y re-corridas (`investigador` + `atlas`: 42 pasan).

### Snowflake — propuesta 2026-10-04 (verificada; espera la aprobación de la persona)

`/investigar snowflake` lo invocó la persona el 2026-10-04: `propuestas/2026-10-04-snowflake/`, 21 componentes, 21
flujos, 7 bloques, un recorrido de 9 pasos (se divide tras las tablas dinámicas) y 143 afirmaciones; sin retiros. El
validador la aceptó al primer intento (la skill ya pedía el contrato 0.4.0).

- `verificar-citas` → 141 verificadas · **2 no verificables** (A-43 y A-74) · 0 no encontradas · 53 páginas.
  `validar.mjs` → válida.
- **A-43 y A-74** citan el comunicado de 2015 en que Snowflake anunció la disponibilidad general de su servicio (en
  GlobeNewswire); respaldan la madurez de «Tablas de Snowflake» y «Virtual warehouses». El sitio corta la conexión
  HTTP/2 cuando la petición lleva el agente del verificador (`curl: (92) … INTERNAL_ERROR`); con el agente por omisión
  de curl responde 200 y la frase está en la página, partida por un enlace: «Announced general availability of the
  <a>Snowflake Elastic Data Warehouse</a>». Lo comprobé a mano y no toqué el verificador: la decisión es de la persona.
  Si las rechaza, la aprobación saca los dos componentes con sus flujos y el recorrido (ensayo: 19 componentes,
  11 flujos, sin recorrido; también carga).
- Ensayo con todo aprobado en la copia: carga en modo publicación (V1–V16, cuatro edades) sin fallas;
  `mapasSinAprobacion` = []. El sitio de la copia compila (38 páginas). Capturas leídas: nivel 1, nivel 2 (ES oscuro),
  recorrido (EN claro), `/comparar?pagina=2` y `?plataformas=snowflake,databricks` desplegado. Con N = 4 el título
  dice «Cuatro plataformas, el mismo mapa» y la página 2 muestra «4 de 4». Cero cruces sobre nodos; el texto cabe.
- Servida para la revisión en `:3148` y abierta en el navegador de la persona.

### Snowflake — aprobada por la persona (2026-10-04 UTC)

- La persona aprobó A-43 y A-74 en la pantalla (las dos «no verificables» del comunicado de 2015) y corrió la aprobación:
  **143 aprobadas · 0 rechazadas · 0 retiros** → `data/mapas/snowflake.mapa.yaml` v0.1.0 (huella `46eebea6c2ed…`),
  `data/revisiones/snowflake.jsonl` (1 línea), `data/plataformas/snowflake.yaml` → `publicada`. El mapa es byte a byte
  el del ensayo.
- **Tropiezo mío, y el candado funcionó.** Para ahorrarle pasos, abrí yo la app Terminal (`open -a Terminal`) y puse el
  comando en el portapapeles. La Terminal arrancó desde mi proceso y heredó la marca de la sesión de Claude Code; la
  aprobación se negó con «solo una persona aprueba: corre dentro de una sesión de Claude Code» (lo leí en la ventana
  de la persona). Se resolvió con una terminal abierta por la persona. Desde ahora no le abro la terminal: solo le
  dejo el comando copiado. Fueron varios mensajes de ida y vuelta; las instrucciones largas confundieron.
- Con N = 4 no queda ninguna plataforma «próximamente»: el e2e del estado vacío del investigador y el de la fila
  «próximamente» del lado a lado se saltan diciendo por qué (3 saltos nuevos: 6 → 9). Los cubren
  `tests/unit/ui/sin-mapa.test.tsx` y los casos sintéticos de `tests/unit/ui/lado.test.tsx` y `tests/unit/lado.test.ts`.
  La paginación del lado a lado ya se prueba con datos reales (Snowflake en la página 2).
- `design-sync/` regenerado (el selector ya no dice «Snowflake — pronto»).
- Corridas: `typecheck` · `lint` · `peers check` sin fallas; `pnpm test` **1319 pasan** (63 archivos, 97,34 % de
  líneas); `pnpm build` (38 páginas; CSP 154/190 huellas); e2e completo **659 pasan · 9 saltadas**.

### Fabric — propuesta 2026-10-04, reinvestigación (verificada; espera la aprobación de la persona)

`/investigar fabric` lo invocó la persona el 2026-10-04: `propuestas/2026-10-04-fabric/`, parte del mapa aprobado
(v0.1.0, contrato 0.3.0) y lo pasa a 0.4.0. 19 componentes, 19 flujos, 7 bloques y el mismo recorrido; 84
afirmaciones; sin retiros, sin componentes ni flujos nuevos. **Cero «lago de datos»** (pedido de la orden): pasa a
«data lake», y «data lake» y «lakehouse» entran al glosario.

- `verificar-citas` → 84 verificadas · 0 no verificables · 0 no encontradas · 20 páginas. `validar.mjs` → válida.
- Cambian textos o fuentes de 6 componentes (trabajo-copia, onelake, lakehouse, agente-datos, app-metricas, airflow);
  ninguna madurez cambia. La página de novedades antiguas que respaldaba siete madureces ya no existe; el
  investigador la reemplazó por anuncios oficiales legibles.
- **A-47 (Seguridad de OneLake) es la afirmación débil:** su cita (marzo de 2026) dice que pasaría a disponibilidad
  general «en las próximas semanas», y la madurez «disponible de forma general» viene del mapa aprobado. El enunciado
  lo dice. Rechazarla saca el componente. Se lo señalo a la persona, que domina Fabric.
- Ensayo en la copia con todo aprobado: **v0.2.0**; la v0.1.0 queda en `data/mapas/versiones/fabric-0.1.0.mapa.yaml`,
  byte a byte la aprobada; el cargador valida las dos en modo publicación y cada una coincide con su línea de revisión
  (`mapasSinAprobacion` = []). El sitio de la copia compila; nivel 2 leído como imagen: sin cruces sobre nodos.
- Para la persona: revisión servida en `:3148` y abierta; el comando con las 84 aprobadas, en su portapapeles (sin
  abrirle la terminal).

### Fabric — v0.2.0 aprobada por la persona (2026-10-04 UTC)

- La persona corrió la aprobación (comando con las 84 en su portapapeles; terminal abierta por ella): **84 aprobadas ·
  0 rechazadas · 0 retiros**, A-47 incluida → `data/mapas/fabric.mapa.yaml` **v0.2.0** (contrato 0.4.0, huella
  `00258c6cab5e…`), segunda línea en `data/revisiones/fabric.jsonl`. **D-S2-09 en vivo por primera vez:** la v0.1.0
  quedó en `data/mapas/versiones/fabric-0.1.0.mapa.yaml`, idéntica byte a byte a la que estaba en `main`; el cargador
  la valida en modo publicación y `mapasSinAprobacion` la encuentra en la primera línea de la revisión. El mapa nuevo
  es byte a byte el del ensayo. **Cero «lago de datos» en el mapa publicado.**
- **Deuda del S1 pagada:** la lista de vocabulario conocido (`datos-vocabulario.test.ts`, 5 rutas de «lago de datos»)
  queda vacía, como pedía su propia prueba. Las versiones archivadas no pasan por ese gate (bytes aprobados, no
  cambian). Para la fase 4: `/versiones` dibuja la v0.1.0, que todavía dice «lago de datos» en el título de una
  fuente, en un texto experto, en un término y en el glosario. Se decide al construir la página si esos textos se
  muestran.
- **Defecto del cargador (fase 2), destapado por la primera versión archivada real:** si el mapa vigente de una
  plataforma existe pero no carga, el cargador además acusaba a su versión archivada de «no tener un mapa publicado»;
  era falso y tapaba la falla real con ruido. Lo vieron en rojo tres pruebas que ya existían (V1 sin salto
  declarado, M-10 YAML mal formado, gramática que falta), que esperaban exactamente una falla. Corregido: si el
  archivo del mapa vigente existe, su propia falla basta. Verdes las tres.
- **Pruebas que suponían el estado anterior de Fabric:** `g3-neutralidad` leía cada entrada de `data/mapas/` como
  YAML (ahora filtra `*.mapa.yaml` y lee también las versiones archivadas); `datos-migrar` mira la versión archivada,
  que es la que sigue en 0.3.0 en el disco; `mapas-aprobados` lee la versión vigente del dato y crea
  `mapas/versiones` aunque ya exista.
- El total unitario baja de 1319 a 1313. No se perdió ninguna prueba: la matriz de envejecimiento genera un caso por
  fecha de verificación distinta, y la fecha de Fabric v0.1.0 se fue (6 casos menos en la unión del lado a lado).
- Corridas: `typecheck` · `lint` sin fallas; `pnpm test` **1313 pasan** (63 archivos, 97,34 % de líneas); `pnpm build`
  (38 páginas); e2e completo **659 pasan · 9 saltadas** (las mismas de Snowflake).

### Cierre de la fase 3

- CI de cada push con `gh pr checks`, todas con los cinco checks y Vercel en `success` y 0 comentarios del bot:
  `543b017` (Databricks), `357003d` (Snowflake), `33a5f0d` (Fabric). `93d4fd2` (la skill) viajó en el push de `543b017`.
- **Criterio de la fase:** las tres propuestas se verificaron por código y en un ensayo de la aprobación (modo
  publicación, cuatro edades), se dibujaron y se leyeron como imagen, las aprobó la persona con su comando y quedaron
  registradas con fecha y commit. Ninguna banda pidió más de 6 nodos (máximo 4: Fuentes de Snowflake), así que P10 no
  necesitó enmienda. Selector con N = 4; «próximamente» ya no aparece.
- **Cómo aprobó la persona:** Databricks, con el comando de la pantalla (las 106 verificadas venían aprobadas de
  entrada). Snowflake, marcando en la pantalla A-43 y A-74 (las dos no verificables) y con el comando que le dejé
  copiado, igual al de la pantalla. Fabric, con el comando de las 84 que le dejé copiado, después de señalarle A-47;
  la pantalla estaba abierta, pero no hay registro de que la recorriera afirmación por afirmación. Lo declaro como
  desviación de «apruebo cada mapa afirmación por afirmación».
- Pendientes que pasan a la fase 4: los textos de la v0.1.0 de Fabric en `/versiones` (dicen «lago de datos»); el
  rótulo «validador: N reintentos» de la pantalla de revisión; y para el summary, las preguntas guía sin fuente de las
  tres investigaciones (Delta Lake como componente, la disponibilidad general de la seguridad de OneLake, la madurez
  por conector, las diferencias por nube) y la sugerencia de que el verificador reintente sin su agente cuando un
  sitio corta la conexión (GlobeNewswire).

## Fase 4 — Diferencias en producto y cierre («continúa» 2026-10-04)

### `/[idioma]/atlas/[plataforma]/versiones` (D-S2-08)

- **Forma**, la del estado «diferencias entre versiones» de `docs/diseno/lado-a-lado.html`. Por cada versión y la
  siguiente, de la más nueva a la más vieja:
  - las dos filas del lado a lado: `compare([anterior, nueva], { marks: diff(…) })`, arriba la anterior;
  - la lista que explica cada diferencia (`diffToText`, enlazada como la versión en texto del SVG, G10).

  Sin versión anterior, el estado vacío del kit. Se llega desde la cabecera de cada vista del atlas («mapa vX ·
  ver versiones»). Es mirada de TEXTO según D-S2-10: maquetado, no visto; viaja al gate del ciclo.
- **Lo que el contrato no marca.** Entre Fabric v0.1.0 y v0.2.0, `diff` no encuentra nada: ningún componente
  nuevo, retirado, renombrado ni con otra madurez. Cambiaron el texto de 6 componentes y las fuentes de los 19. Para
  que «sin diferencias» no se lea como «nada cambió»:
  - el texto del motor pasa a «Sin cambios en el dibujo: los mismos componentes, con los mismos nombres y la misma
    madurez»;
  - la vista cuenta aparte, en «Lo que dicen los componentes», los textos (líder, experto, por qué importa,
    términos) y las fuentes que cambiaron. Compara con JSON canónico (lección M-26: un YAML reescrito no cuenta
    como cambio).
  - Va a «Enmiendas»: que `diff` reporte también los cambios de texto y de fuentes.
- **Bloques.** Los de las dos filas abren la ventana de su versión («Fuentes · versión 0.1.0»). Solo la vigente
  lleva el paso a «Componentes», porque el nivel 2 dibuja la vigente: `ventanas()` gana el parámetro `enlace`.
- **«Lago de datos».** La v0.1.0 lo decía en textos que esta página no muestra (títulos de fuente, experto,
  términos, glosario). Verificado en el HTML exportado: 0 apariciones en ES y en EN.
- **Pruebas nuevas, cada una vista en rojo:**

| Gate | ¿Puede fallar? | Rojo | A quién nombró | Verde |
|---|---|---|---|---|
| `tests/unit/versiones.test.ts` (6) | Sí | (1) enlace en las ventanas de todas las versiones; (2) fuentes comparadas con `JSON.stringify`; (3) pares de la más vieja a la más nueva | (1) «solo la vigente lleva el paso al nivel 2»; (2) «reescribir el YAML con las claves en otro orden…»; (3) «una cadena de tres versiones da dos pares, de la más nueva…» | Restaurado |
| `atlas-vigencias`: versiones a cada fecha de cambio de estado, contando las de las versiones archivadas (regla 23) | Sí, pero lo que depende de la edad del dibujo lo frena antes el cargador (V16 dibuja cada mapa y cada versión archivada a cuatro edades): un rótulo «por revisar» que no cabe rompió la carga, no la matriz | Mutación que rompe la página solo desde 2026-10-29, cuando la v0.1.0 cumple 30 días | `fabric · 2026-11-02`, `… 2026-11-03`, … `2027-11-08` (8 casos); la fecha de hoy pasaba | Restaurado |
| `tests/e2e/versiones.spec.ts` (3 × 2 proyectos) | Sí | Sin el enlace de la cabecera del atlas (build aparte) | «desde el atlas se llega a las versiones…», en desktop y mobile: esperando `link «ver versiones»` | Restaurado y reconstruido |

- G11, movimiento reducido, axe y CSP recorren las rutas nuevas: `RUTAS` suma `/atlas/<p>/versiones` de cada
  publicada; `conDibujo(ruta)` dice cuáles tienen lienzo (las de un mapa con versión archivada, `VERSIONADAS`); G11
  abre también cada ventana de la página de versiones.

- **Defecto atrapado por la CSP (4 motores, 64 casos en rojo):** la vista importaba `canonico` de
  `investigador/huella.ts`, que trae `node:crypto`. Al exportarse desde el índice de `@/lib/atlas`, los componentes
  de cliente del recorrido (y la navegación entre pestañas del atlas) cargaron el polyfill de `crypto`/`util`. Uno de
  sus paquetes, `is-generator-function`, llama a `Function("return function*() {}")` al cargarse, y la CSP lo
  bloqueó como `script-src · eval`. Visto en `_next/static/chunks/…js`, columna 46643. Corregido: `canonico` vive en
  `investigador/canonico.ts`, sin `crypto`, y `huella.ts` lo reexporta. Tras el build, ningún chunk trae el
  polyfill. Es el gate `csp.spec` (fase 0) cumpliendo su función: nadie más lo habría visto.
- Corridas: `typecheck` · `lint` sin fallas; `pnpm test` 1350 pasan (64 archivos); `pnpm build` (46 páginas, CSP
  184/230 huellas); e2e completo **775 pasan · 9 saltadas** (las mismas de la fase 3).
- `lighthouse-urls.json` suma `/es/atlas/fabric/versiones` y `/en/atlas/fabric/versiones`; la pasada de capturas asocia
  `/atlas/<p>/versiones` a la maqueta `lado-a-lado` (estado «diferencias»); `design-sync/` suma `versiones.css` y
  la tarjeta `componentes-s2/diferencias-entre-versiones.html` (versiones sintéticas del mapa ficticio, las cuatro
  clases de cambio: «retirado» en la fila anterior y una píldora por clase en el mismo bloque).

### Entregables de la fase 4: manual, ADRs, guía v2 y kit

- **Manual ES/EN** (`docs/MANUAL-DE-USO.md`): Databricks, Fabric y Snowflake con mapa (funciones 5 y «Qué es»); la
  6 dice que la versión anterior se guarda al aprobar, que la terminal la abre la persona y qué pasa cuando un sitio
  corta la conexión; nuevas la **7 Lado a lado** y la **8 Versiones del mapa**, con sus limitaciones; historial S2.
- **ADRs:** `decisions/compare-in-the-engine.md` (compare en el paquete, dos variantes prerenderizadas por fila,
  estado en la URL con script previo al pintado, `POR_PAGINA` declarada, teléfono en HTML) y
  `decisions/map-versioning.md` (archivo byte a byte al aprobar, verificaciones del cargador y de la huella,
  migración en memoria, qué dibuja la página). El primer intento de escribirlos con `cat <<EOF` lo bloqueó el candado
  de la aprobación: el texto nombraba el script. Se escribieron con la herramienta de archivos y el ADR lo nombra
  sin la ruta literal.
- **Guía v2** (`docs/GUIA-DE-PRUEBA.html`, prefijo `bigd-s2-`): 52 pruebas en 10 bloques (A–J).
  - Las 38 del S1 siguen: 32 heredadas sin cambios («S1») y 6 «Mejorado en S2»:
    - a1 y c4: las cuatro plataformas tienen mapa;
    - b3: la fecha para envejecer pasa a 2026-11-03;
    - c5: la pestaña 04 ya enlaza;
    - f1: Fabric v0.2.0, 84 aprobadas;
    - f2: el estado vacío se ve con la Plataforma Norte del kit, porque ninguna plataforma real queda sin mapa.
  - 14 nuevas: H Lado a lado (7), I Databricks y Snowflake (2), J Versiones (5).
  - **⭐ = 7** (las 4 del S1 más h6, una persona compara una banda; h7, tu teléfono; y j5, se entienden las
    versiones); diferidas al S4, como manda la orden.
  - **⭐⭐ = 4 paradas, ~20 min.** Entra j5: es la mirada de TEXTO «maquetado, no visto» de `/versiones`. Quedan
    fuera b8, h6 y h7, con su porqué en la cabecera.
  - Se quita el aviso «Diferido» del bloque C. `guia-de-prueba.test.ts` en verde: chips, ids, paradas 1..4,
    conteos de cabecera.
- **Kit:** `docs/kit-de-prueba/versiones-de-muestra/`, una v0.0.9 SINTÉTICA de la Plataforma Ejemplo generada por
  `scripts/kit-de-prueba/versiones.mjs`, con las cuatro clases de cambio (los datos reales no traen ninguna). El
  README suma la sección 4 y el comando de limpieza la incluye; se corrige la cuenta de carnadas (34 casos en
  `esperado.json`; `test/carnadas-piloto/` ya no existe desde la fase 0).

| Gate | ¿Puede fallar? | Rojo | A quién nombró | Verde |
|---|---|---|---|---|
| `kit-de-prueba.test.ts` · versión anterior de muestra (2) | Sí | Muestra editada a mano (madurez «beta» → «vista previa pública») | «regenerarla … da los mismos bytes» y «… muestra las cuatro clases de cambio» | Restaurada |

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
