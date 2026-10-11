# Changelog — contrato del diagramador

Versionado semántico del **contrato** (no de la implementación): MAJOR invalida mapas o gramáticas
existentes · MINOR agrega un campo opcional, una vista o una regla que no rechaza nada válido ·
PATCH aclara. Editar el contrato pasa por G-Metodo.

## [0.6.0] — 2026-10-04 · las 25 enmiendas y 12 fallas del S2 del piloto (`compare`, `diff` real, lado a lado; G-Metodo aprobado «apruebo el batch»)

**MINOR de API.** Ningún mapa ni gramática 0.5.0 deja de ser válido; cambian la API y las reglas de dibujo. Fuente:
`app-big-d/sprints/SPRINT_002-summary.md` § «Enmiendas al contrato del diagramador» y § «Registro de fallas»; retro
en `portafolio/big-d/sprints/SPRINT_002.md`.

- **§ 4.4 `compare`:** opciones `n`, `page`, `part: "all" | "header" | "rows"` (filas independientes), `marks`,
  `texts.lado`; precondiciones con error claro (F-031, F-033); banda vacía rotulada como vacía (F-032); avisos con
  prefijo de fila (F-034); `Geometria.variante` (`n1`/`n2`); **se retira `toCompareCSS`** (dos SVG por fila y una
  regla CSS del consumidor). El piloto usa dos estados (ninguna banda o todas) con un solo control.
- **§ 4.7 `diff`:** declara qué compara (nodos por nombre y madurez; bloques por nombre, F-030 → motor en S3) y qué
  no ve (textos, fuentes); **`diffToText`** con orden total (F-035); una píldora por clase, «retirado» en la fila
  anterior (F-028).
- **§ 4.8 y G7:** el lado a lado **no lleva insignias de vigencia**; el estado va en palabras en el rótulo de la fila
  (F-026: 44/75/22/30 avisos de la matriz).
- **§ 5.4:** paths de las marcas de diferencia (+ − → ▮), solo en el `<defs>` del lado a lado.
- **§ 5.6:** avisos nuevos `texto:` y `pistas:`; prefijo `<fila>/` en `compare`.
- **P13 cerrada (F-027):** reparación mínima de las pistas a menos de 9 u que tapan una punta de llegada; la punta
  mide 9 u.
- **§ 7:** V16 dibuja también el lado a lado a cada edad y **falla cerrado sin `texts`** en publicación (F-036); G7
  recorre `etiqueta_corta` (F-037). Carnadas: **A1 pasa a modo privado** (su dibujo no es lo que prueba; gap del
  rótulo de banda sin bloque declarado) y **C10 declara sus cuatro alertas V3** en `secundarios`.
- **§ 8:** `agingDates` exportada; `toSVG(geometry, { language })` sin `texts`; plurales elegidos por la regla del
  idioma; **§ 4.5 alineada con § 8** (`texts`/`queryDate`; eran `textos`/`fechaConsulta`); el lock registra el
  **commit de origen** (`origen: <sha>`) y la deriva frente a una versión publicada durante el sprint es «esperada».
- **§ 10/§ 11:** `compare` implementado; v1.0.0 al cierre del S3 del piloto.
- **§ 12:** afirmaciones sobre nodo o flujo (bloques y pasos editoriales, sin cita); «sin novedades» no renueva un
  nodo con afirmaciones «no verificables»; `conflicto_de_interes` solo en las citas de la propuesta; **el comando de
  aprobación sale de la pantalla de revisión** (S2-AUD-08).
- **G15:** el recorte a la cobertura ya está hecho; el recorte profundo solo por ADR.
- **Artefactos:** todos declaran `contrato_version` 0.6.0 (la 0.5.0 dejó 44 en 0.4.0); títulos de los esquemas al
  día; validación con `validar-artefactos.mjs` (Ajv 2020 estricto; el generador 0.3.0 → 0.4.0 queda retirado).
- **Fallas:** F-026…F-037 cerradas (pagadas en el piloto; F-030 con motor pendiente en el S3).
- **Pendiente del piloto (big-d S3):** renovar el lock a 0.6.0; `diff` de bloques; design system v0.6 con las 9
  extensiones del ADR `design-system-s2-extensions`; lo pendiente de la 0.5.0 (`papel`, condiciones, `fuente codigo`,
  `hexagono`, tabla de Inter).

## [0.5.0] — 2026-10-04 · las seis enmiendas de planlang S2 (segundo consumidor; estado `piloto`; G-Metodo aprobado «apruebo el batch»)

**MINOR de datos.** Todo mapa y gramática 0.4.0 válido sigue siéndolo: todas las adiciones son opcionales o
alternativas nuevas. Fuente: `app-planlang/packages/diagramador/CONTRATO.lock` → `enmiendas_propuestas` y
`decisions/010-conversion-grafo-a-mapa.md`; retro en `portafolio/planlang/sprints/SPRINT_002.md`.

- **`nodo.papel`** (`inicio` · `fin`): nodos terminales de un grafo (`__start__`/`__end__`) como dato; el motor
  dibuja el marcador junto a la tarjeta (antes se dibujaban fuera del mapa).
- **`condicion` en tres formas** (§ 3.4): tripleta `{senal, operador, valor}` · **función nombrada**
  `{funcion, entradas}` (`texas_y_no_aprobar`) · **rama por defecto** `{por_defecto: true}`; **V17**: a lo sumo una
  por defecto por origen. Se retiran las convenciones `senal: "texas-y-no-aprobar"` y `senal: "rama-por-defecto"`.
- **`fuente.tipo: "codigo"`** con `ruta` + `lineas` (sin URL): un nodo de un agente cita el archivo y las líneas que
  lo implementan; el motor lo escribe como `ruta:lineas`, nunca como enlace (regla 17 de cero enlaces).
- **Glifo `hexagono` vuelve** (path en § 5.4) para «regla» de `agentes-ia` (design system 1.0.0 de planlang): a 16 u
  con etiqueta corta; cada gramática elige entre `escudo` y `hexagono`. Gramática `agentes-ia` → **1.2.0**.
- **G15: una tabla de métricas por fuente** (Space Grotesk · Inter) y `options.fuente_metricas` en el consumidor;
  el lock fija la huella de la tabla que usa. La geometría es determinista por tabla.
- **Validación:** esquemas, 6 gramáticas y 6 ejemplos en verde con Ajv 2020, más seis pruebas de las formas nuevas (dos
  aceptan, una `condicion` incompleta, una `fuente codigo` con URL y un `papel` inválido se rechazan). El validador del
  spike de big-d (`scripts/node.mjs`, lógica 0.3.0) marcaba «FALLA · 0 alertas» en 5 ejemplos YA con el 0.4.0: está
  obsoleto frente al motor real del piloto, no es regresión del 0.5.0.
- **Pendiente del piloto (big-d):** implementar `papel`, las dos condiciones nuevas, `fuente.tipo: codigo`, el
  glifo y la tabla de Inter en el motor; planlang sigue con su conversor propio (`core/visor`) hasta entonces y
  actualiza su lock a 0.5.0 en el S3.

## [0.4.0] — 2026-10-01 · cierre del S1 del piloto: la primera implementación y el primer mapa real (estado `piloto`; G-Metodo aprobado)

**MINOR de datos.** Ningún mapa o gramática 0.3.0 válido deja de serlo, salvo los que tuvieran un paso que se
sigue a sí mismo o a uno posterior, o un flujo de un nodo hacia sí mismo (siempre fueron defectos). Campo
opcional nuevo: `escala_madurez[].etiqueta_corta`. Todos los artefactos regenerados y validados con el script de
la planeadora (`convertir-0.3.0.mjs`, VERSION 0.4.0).

- **Fuente:** `app-big-d/sprints/SPRINT_001-summary.md` § «Enmiendas al contrato del diagramador» (44) y
  § «Registro de fallas» (13 → F-013…F-025), auditoría C-1/A-5/A-6/M-1/M-23…M-26/B-38/B-39; retro en
  `portafolio/big-d/sprints/SPRINT_001.md`.
- **Geometría del carril y los canales (§ 5.3):** más de 2 saltos sin aviso (F-014) · pistas fijas a 6 u de las
  tarjetas, nunca sobre un borde; con más de 6, reparto parejo con piso de 4 u, máximo 10 (F-015, F-021) ·
  etiqueta de modos con > 2 marcadores en dos filas, segundo lugar en el tramo de llegada, etiqueta de salto a
  la mitad de su tramo, etiqueta en columna a 2 u, invariante ≤ 30 u (F-016) · fila de referencias llena a 4 u
  con corrimiento y «…» · vecinas directas solo con hueco (F-019) · carriles con cabecera de 200 u y ranuras
  152/50 · no partir dentro de un paréntesis corto.
- **Envejecimiento (§ 4.8, § 5.6, G11):** insignia montada ≤ mitad de la tarjeta + 4 u; la vista «bloque»
  reserva su lugar; la geometría expone la vigencia; `toText` recibe la fecha de consulta; **matriz de
  envejecimiento** (todo mapa a 4 edades, 0 avisos, 0 cruces) como gate (F-017, el crítico de la auditoría).
- **§ 5.6 nueva — avisos de geometría** con forma fija (`D11:`, `pistas:`, `fuera-del-lienzo:`, `encima:`,
  `etiqueta:`, `bloque-vacio:`, `canal:`, `carriles:`); `layout` reporta D11 (F-020).
- **Validación (§ 7):** informe en **tres listas** (errores · alertas · avisos) y `validateGrammar` · tabla de
  traducción de errores de esquema a regla e id · V3 alerta por bloque sin componentes (F-022) · **V4** flujo
  hacia sí mismo (F-024) · **V5** `sigue_de` solo hacia atrás, nunca a sí mismo (F-018) · **V16** «el mapa se
  dibuja» en modo publicación · `diff` sobre JSON canónico (F-023) · idioma no declarado con error claro (F-025).
- **API (§ 8):** vista `bloque` + `toBlockCards` (§ 4.10, pedido del usuario) · `toCard` (§ 4.5) · `toLegend` ·
  cadenas de interfaz en `options.texts` como mapas de idioma, plurales `{ one, other }` · `queryDate` · nombres
  de la API en inglés · campos de la geometría declarados · `geometricPrecision` obligatorio en el consumidor.
- **Marcas (§ 5.4):** «por revisar» = triángulo de precaución con «!» (pedido del usuario); paths de
  envía/recibe documentados como → y ← (D-S1-19); leyenda con las tres marcas en caja de 16 u y la **regla del
  haz** (§ 4.9).
- **Garantías:** G1 «Linux pendiente» cerrado por medición (30 golden files idénticos en 2 sistemas × 4
  motores) · G6 (c) incluye los flujos que comparten extremo, canal o fila (D-S1-25) · G15/P12 respondida:
  tabla sin kerning + 3 % es cota superior con `geometricPrecision` (F-013) · D12 admite el `data-dueno` del
  grupo (D-S1-20).
- **Modelo:** `escala_madurez[].etiqueta_corta` opcional (D-S1-17).
- **Carnadas: 34 casos** = 31 + **P1** mapa denso (se copia del paquete piloto; debe dibujarse sin avisos) +
  **P2/P3** (V5) · `esperado.json` gana `secundarios` legítimos en C03 (V3), C06 (V5) y C07 (V12) (D-S1-03).
- **§ 12 nuevo — contrato de la propuesta** (afirmación = entidad + id + cita literal; rechazo en cascada;
  retiro con motivo y cita verificada; «sin novedades» no esquiva nada; validar y dibujar antes de aprobar).
- **Preguntas:** P12 respondida; **P13** (orden de pistas por destino) abierta para el S2.
- **Estado del reusable: `semilla` → `piloto`.** La v1.0.0 se sella con `compare` (S2).
- **Constitución del piloto:** `portafolio/big-d/ordenes/CLAUDE-md-para-app.md` regenerada (traía V1–V12,
  franjas arriba, angosta 380 y «v0.2.0 hoy»).
- **Fallas:** F-013 a F-025 cerradas por regla (ya pagadas en el piloto).

## [0.3.0] — 2026-09-27 · G-Diseño del piloto + bilingüe integral + pedido de planlang (estado `semilla`; G-Metodo aprobado)

**MAJOR de datos:** invalida los mapas y gramáticas 0.2.0. Todos los artefactos del contrato se entregan
convertidos por `portafolio/big-d/investigacion/spike-diagramador/scripts/convertir-0.3.0.mjs` y validados
con Ajv 2020 contra los esquemas nuevos; nada se editó a mano.

- **Fuentes:** `app-big-d/docs/diseno/diagramador-tokens.md` (propuesta de la Etapa de Diseño, sellada por el
  usuario en G-Diseño 2026-09-27), la auditoría F1 (bilingüe integral) y la carnada pendiente de planlang.
- **Modelo (§ 3):**
  - **mapas de idioma** `{es, en}` en todo texto que se dibuja o se lee; diccionarios por idioma; la
    gramática declara `idiomas` e `idioma_base` (§ 3.0; G7, V14);
  - madurez por **`nivel`** (−1..4, medidor) en lugar de `glifo` textual;
  - **`limites.nodos_por_banda_max`** (V11; 6 en el piloto);
  - **`condicion { senal, operador, valor }`** en el flujo y `exige_condicion` en el modo (V13);
  - enums: glifos `escudo` y `barras` (salen `hexagono` y `pentagono`); marcador `ida-y-vuelta` (sale `reloj`).
- **Garantías:** G5 con alineación por banda en el nivel 2 · G7 texto siempre en tinta · G10 «Saltar el
  diagrama» · **G11 reescrita** (una sola disposición horizontal, escala 1, lienzo deslizable; angosta
  retirada) · G12 con `media` y árbol independiente de la preferencia · G13 contraste sobre la tarjeta ·
  G15 con cobertura (V15).
- **Vistas:** § 4.1 una línea con etiqueta de modos + referencias de franja · § 4.2 referencias en el
  nivel 2 · § 4.4 `compare` con N declarado por el consumidor, nivel 2 alineado por banda y **nivel por
  banda** en el mismo SVG · § 4.8 insignia compacta y «se marca la excepción».
- **§ 5 Gramática visual (nueva):** codificación tarjeta + filete + glifo · paleta de un matiz por tipo con
  **umbral declarado** (ΔE ≥ 0,10 / 0,06 / 0,03) · constantes de geometría de la dirección «plano» ·
  paths de glifos, marcadores y marcas · tipografía del piloto (Space Grotesk + JetBrains Mono).
- **Reglas de dibujo:** D1 siempre horizontal con franjas abajo · D4 regreso entre vecinas · D5 y D8
  precisadas (ids de `<defs>` con espacio de nombres) · **D13** toda marca es un path · **D14** texto en
  tinta · **D15** referencias de franja.
- **Validación:** G7, V11, V13, V14, V15 nuevas; `validate` recibe `coverage`; el informe gana `idioma`.
- **Gramáticas:** `plataformas-datos` v0.2.0 (ES/EN; **Orquestación transversal, orden 3** — desviación
  declarada de § 10.6, P9) · `agentes-ia` v1.1.0 (ES/EN, `condicional` con `exige_condicion`, madurez
  4/1/0, `nodos_por_banda_max: 8`, **id `pausa_humana` → `pausa-humana`** porque el patrón no admite guion
  bajo: F-012) · cuatro `prueba-*` convertidas (solo ES, `nodos_por_banda_max: 6`).
- **Ejemplos:** Plataforma Ejemplo bilingüe (textos EN de la Etapa de Diseño) · **`agente-ejemplo`** nuevo
  (ficticio, bilingüe, dos rutas condicionales, pausa con reanudación) · cuatro de prueba convertidos.
- **Carnadas: 31 casos** = C01–C17 convertidos (C12 alerta en los dos idiomas) + **C18** siete nodos en una
  banda (V11) + **C19** carácter fuera de la fuente (V15) + **C20** condicional sin condición (V13) +
  **C21** texto sin un idioma (V14) + GC1–GC4 + **GC5** idioma base no declarado (G7) + A1–A2 + **A3** flujo
  agregado con los cuatro modos + 2 mapas reales. `esperado.json` gana `fase` (1 esquema · 2 código) y
  `cobertura`.
- **Fallas registradas:** F-006 a F-012 (todas cerradas por regla; el piloto las implementa).
- **Preguntas:** P4, P5, P9, P10 y P11 respondidas; P12 (kerning) nueva.
- **Aviso a planlang:** el conversor desde LangGraph debe emitir mapas de idioma, `condicion` en cada arista
  condicional, madurez por id (`implementado` · `en-construccion` · `exigido-por-el-plan`) e ids con guion.

## Gramática `agentes-ia` v1.0.0 registrada — 2026-09-26 (batch G-Metodo de la F1 de planlang; el contrato sigue en 0.2.0)

- **Qué:** `gramaticas/agentes-ia.json`, promovida desde `prueba-agentes-ia` (spike de big-d). Tipos de
  nodo = los cinco de la especificación de planlang (RF-08.2): `modelo` · `herramienta` · `regla` ·
  `pausa_humana` · `enrutador`. Bandas: entrada · orquestación · agentes · reglas y guardias · pausa
  humana · salida; transversales: guardarraíles · trazas y costo. Modos: secuencia · condicional (la
  señal, el operador y el valor van en `que_viaja`) · reanudación. Madurez: implementado ·
  exigido-por-el-plan · en-construcción (para marcar lo que el plan pide y el grafo no tiene, RF-08.5).
- **Segundo consumidor declarado:** planlang (visor M8). El conversor desde el grafo compilado de
  LangGraph (`get_graph().to_json()` + JSON propio con las ramas de cada arista condicional) vive en
  planlang; las trazas de casos entran como **recorridos**; las fuentes de nodo son enlaces permanentes
  al código.
- **Carnada pendiente (para el contrato 0.3.0, junto con los tokens del G-Diseño de big-d):** un flujo
  con `modo_id = condicional` y `que_viaja` sin señal debe fallar. Hoy el esquema no distingue el
  contenido de `que_viaja`; se propone un campo opcional `condicion {senal, operador, valor}` y la
  regla «condicional ⇒ condicion obligatoria». Registrada aquí para que no se pierda.
- Validación estructural: claves requeridas completas, órdenes de banda únicos por clase, tokens de
  color únicos, vigencia coherente.

## [0.2.0] — 2026-09-26 · F1: el contrato probado (estado `semilla`)

- **Evidencia:** el spike en la máquina del usuario
  (`portafolio/big-d/investigacion/spike-diagramador/`) y la investigación
  técnica del diagramador (206 fuentes). Las dos llegaron por su cuenta a la misma arquitectura.
- **Artefactos nuevos:**
  - `esquema/`: JSON Schema 2020-12 de la gramática y del mapa;
  - `gramaticas/`: `plataformas-datos` y cuatro gramáticas de prueba de generalidad;
  - `ejemplos/`: la Plataforma Ejemplo ficticia y cuatro mapas de prueba;
  - `carnadas/`: 17 de mapa, 4 de gramática y 2 de aceptación, con `esperado.json`.
- **Garantías:**
  - G1 precisada: referencia en el build, identidad en los 3 navegadores y serialización canónica;
  - G2 ampliada a las funciones `Math.*` inexactas, `localeCompare`, `Intl` y la medición de texto en el
    DOM;
  - G5 y G6 reescritas de forma medible;
  - G10 pasa a HTML;
  - G11 ampliada: texto dentro del lienzo, disposiciones ancha y angosta;
  - G12 con la animación en una capa CSS aparte;
  - G13 con un solo SVG para los dos temas;
  - **G15 nueva:** las métricas de texto son un dato.
- **Reglas de dibujo:**
  - D2 precisada: altura uniforme de nodo y encabezado fijo en toda banda;
  - D4: ruteo por canales;
  - D7 más estricta;
  - D8 sin SVGO, con manifiesto;
  - D9 con roles `graphics-*`;
  - **nuevas:** D11 (cero cruces), D12 (propiedad de cada elemento) y la leyenda generada (§ 4.9).
- **Modelo:**
  - `glosario` del mapa (F-001);
  - bloque opcional anclado en una banda (F-005);
  - `bifurca` `paralela` / `alternativa` (V12);
  - `llegadas` en el recorrido de referencia;
  - flujo agregado como dato;
  - API partida en `layout` y `toSVG`;
  - informe de validación con forma fija.
- **Fallas registradas:** F-001 a F-005 (tres cerradas; en F-002, F-003 y F-004 queda cerrada la regla y
  la implementación la paga el piloto).
- **Medido:**
  - 55/55 salidas idénticas en Node, Chromium 153, Firefox 155 y WebKit 26.6;
  - 24/24 carnadas;
  - los 5 usos validan;
  - ELK rompe G5 y G6 y dagre desordena las capas.
- **Pendiente de otros:** bilingüe [Auditoría]; paleta, fuente, orientación, dibujo del nivel 1 y P9
  [G-Diseño].

## [0.1.0] — 2026-09-26 · nacimiento (estado `semilla`)

- **Origen:** F0 #11, admisión de `big-d`. Pedido del usuario: la diagramación
  de infraestructuras como objeto reusable que evoluciona con sus fallas.
- **Fuente:** `corpus/raw/[APP Bigdata Planeador] - Requerimientos v1.1.md`, secciones 4.8, 4.9,
  6.12–6.16, 10.6, RF-09.5/9.6, RF-11 y RNF-12, generalizadas a los cinco usos declarados.
- **Contenido:** vocabulario · 14 garantías con su verificación · modelo conceptual (gramática, mapa,
  nodo, flujo, recorrido) y su correspondencia con el piloto · 8 vistas · 10 reglas de dibujo ·
  10 reglas de validación con 13 carnadas · consumo por paquete aislado con copia fijada · prueba de
  generalidad con 5 usos · 8 preguntas abiertas · Gaps.
- **Novedad frente a los requerimientos:** la clase de banda `carril` (actores), exigida por el uso
  «procesos y recorridos de negocio».
- **Siguiente:** v0.2.0 en F1 (esquemas, gramáticas, carnadas y spike del motor de disposición).
