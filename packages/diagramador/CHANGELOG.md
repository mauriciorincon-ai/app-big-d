# Changelog — contrato del diagramador

Versionado semántico del **contrato** (no de la implementación): MAJOR invalida mapas o gramáticas
existentes · MINOR agrega un campo opcional, una vista o una regla que no rechaza nada válido ·
PATCH aclara. Editar el contrato pasa por G-Metodo.

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
