---
documento: Gramática visual del diagramador — propuesta para el CONTRATO v0.3.0
estado: propuesta (mirada 1, ronda 2: dirección visual por elegir)
fecha: 2026-09-26
contrato_base: reusables/diagramador/CONTRATO.md v0.2.0 (planeadora, solo lectura)
referencia_visual: docs/diseno/atlas-direcciones.html (ronda 2) · docs/diseno/atlas-nivel-1.html (ronda 1, no aprobada)
autor: Etapa de Diseño de Big-D (piloto del reusable)
---

# Gramática visual del diagramador — propuesta para el CONTRATO v0.3.0

> Este documento es la **propuesta** de la Etapa de Diseño de Big-D. La planeadora decide si la
> absorbe en el `CONTRATO.md` v0.3.0 (G-Metodo). Nada de aquí es contrato hasta entonces. Todo lo
> que dice se ve dibujado en `docs/diseno/atlas-nivel-1.html`, trazado sobre la Plataforma Ejemplo
> (ficticia) del contrato, en ancho y en 380 px, oscuro y claro, español e inglés.

> **Ronda 2 (2026-09-26).** El usuario miró la ronda 1 y no la aprobó: «visualmente horrible; el
> diagrama no lo quiero vertical sino horizontal y con desplazamiento lateral por si se hace muy
> grande». Cambios ya aplicados aquí: **P5 lo decide el usuario** (§ 1: siempre horizontal, jamás se
> transpone; § 9.2 queda retirado) y **la paleta pasa a un matiz propio por tipo** (§ 5, medida con
> los mismos umbrales). La dirección visual (A carriles · B plano · C bloques, en
> `atlas-direcciones.html`) está por elegir; con ella se reescriben §§ 4, 6–9 y 13 en la ronda 3.

## 0. Las decisiones, en una tabla

| #     | Pregunta del contrato                    | Propuesta                                                                                                                     | Sección |
| ----- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------- |
| P5    | Orientación del eje                      | **Decisión del usuario: siempre horizontal**, en todo ancho; si no cabe, desplazamiento lateral con índice de capas (ronda 2) | § 1     |
| D1    | ¿Dónde van las transversales?            | **Abajo, a todo lo ancho.** Su cabecera va a la izquierda; sus conexiones, alineadas bajo la capa que tocan (ronda 2)         | § 2     |
| P9    | Orquestación, ¿capa o transversal?       | **Transversal**, tercera franja. La maqueta muestra las dos para juzgar                                                       | § 3     |
| P4    | Flujo agregado con varios modos a 380 px | **Una línea con etiqueta de modos.** La alternativa de una línea por modo se ve en la maqueta                                 | § 4     |
| —     | Flujos con una franja en el nivel 1      | **Referencias escritas junto al elemento** (flecha + marcador + nombre). Las líneas entran en el nivel 2                      | § 4.3   |
| Gaps  | Paleta validada y umbral de distancia    | **Un matiz propio por tipo** (ronda 2), claridad buscada por tema, **umbral declarado** y gate en CI                          | § 5     |
| —     | Glifos de tipo                           | Se mantienen 6; **hexágono pasa a escudo y pentágono a barras**                                                               | § 6     |
| —     | Símbolos de estado                       | **Se dibujan, jamás se escriben**: la fuente no trae ✓ ✕ ▶ β (medido)                                                         | § 6.3   |
| —     | Marcadores de modo                       | Se mantienen 3; **«reloj» de _a demanda_ pasa a «ida y vuelta»**                                                              | § 7     |
| P11   | Fuente con tabla de métricas             | **Atkinson Hyperlegible Next** (y Mono), SIL OFL 1.1, variable 200–800                                                        | § 8     |
| G11   | Tipografía y pisos                       | Letra mínima 12 u a escala 1 en todo ancho: el lienzo se desliza, jamás se escala (ronda 2)                                   | § 8.3   |
| D2    | Geometría realizable por reglas          | Constantes y fórmulas en § 9; la referencia salió de ellas con **0 cruces D11**                                               | § 9     |
| P10   | Densidad máxima por banda                | **Estimada: 6 nodos por banda** (`limites.nodos_por_banda_max`). Se mide en el piloto                                         | § 10    |
| § 4.8 | Semáforo dentro del diagrama             | **Se marca la excepción**: lo vigente no lleva insignia; _por revisar_ y _vencido_ sí                                         | § 11    |
| § 3.7 | Bilingüe                                 | **La geometría no depende del idioma**: cajas y alturas se calculan con el texto más largo de los idiomas declarados          | § 12    |
| G12   | Capa CSS de animación del recorrido      | Hoja aparte con `media="(prefers-reduced-motion: no-preference)"`; el SVG no cambia                                           | § 15    |

## 1. P5 — Orientación del eje

**Decisión del usuario (mirada 1, ronda 1, 2026-09-26): siempre horizontal.** Las capas van en
columnas de izquierda a derecha, en el orden de la gramática, **en todo ancho**. El diagrama jamás se
transpone ni se encoge: si no cabe en su contenedor, el lienzo se desliza de lado.

- **Lo que cambia respecto de D1.** D1 pedía transponer en angosto (cada banda una fila, de arriba
  abajo). La ronda 1 lo dibujó así y el usuario lo rechazó: en el teléfono el mapa dejaba de parecerse
  al de escritorio. Ahora hay **una sola disposición**, la misma en el teléfono y en el escritorio.
- **Desplazamiento lateral con ayudas (propuesta de garantía nueva para el contrato).** El lienzo va
  en un contenedor con desplazamiento horizontal propio (la página no se desborda); cuando no cabe
  aparecen un **índice de capas** que lleva a cada columna, **sombras de borde** que dicen que hay más
  a un lado, y una pista escrita («Desliza de lado para ver las seis capas»). Con teclado, el lienzo
  es enfocable y las flechas lo mueven. Con movimiento reducido, el salto es instantáneo.
- **G11 se cumple por construcción.** A escala 1, el texto más chico del lienzo mide 12 px en
  pantalla en cualquier ancho; no hay escalado que lo baje del piso. La altura del lienzo del ejemplo
  (≈ 610–665 u según la dirección) cabe en la altura de un teléfono.
- **Evidencia que se mantiene.** Fabric lee «ingest, store, process, enrich, serve» de izquierda a
  derecha y Databricks dibuja sus carriles igual (investigación técnica § 1.5).

## 2. Franjas transversales

**Propuesta: abajo, a todo lo ancho, en las dos disposiciones.**

- **Por qué abajo.** El spike las puso arriba y sus preguntas cayeron encima de los nodos (F-004).
  Abajo funcionan como cimiento, que es como Fabric dibuja su capa de plataforma. Además, lo primero
  que se lee es Fuentes.
- **Cabecera a la izquierda en ancho.** Una franja es una fila: su cabecera ocupa el ancho de la
  primera columna más su canal (190 u), y sus elementos van en las ranuras alineadas con las
  columnas 2 en adelante. Así su texto nunca cruza un canal por donde pase una línea.
- **En angosto.** Las franjas son filas como las capas, al final, con una barra lateral de 4 u y la
  frase «Abarca todas las capas». Franjas laterales a 380 px dejarían 252 px para los nodos: se
  descartan.
- **D1 dice «perpendiculares al eje y lo abarcan entero».** En ancho se cumple al pie de la letra.
  En angosto se cumple por la barra y la frase, no por la geometría. La planeadora debe decidir si
  eso basta o si D1 se reescribe.

## 3. P9 — Orquestación, ¿capa o transversal?

**Propuesta: transversal**, tercera franja (después de Gobierno y de Operación: primero el dato,
luego el control, al final el dinero). Es una nota de la gramática `plataformas-datos`, no del
motor. La maqueta trae el estado **«P9: orquestación como capa»** para juzgar las dos.

| Criterio               | Como capa 5                                                                                     | Como transversal                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| El camino del dato     | Ningún registro pasa por ella. Su único flujo va **hacia atrás** (Programador → Canalizaciones) | Sale del eje de las capas, que queda solo para el movimiento del dato                                 |
| Nivel 1                | La fila principal gana un hueco de «1 componente»                                               | «1 componente» en una franja, que es lo esperable en lo transversal                                   |
| Ancho medido           | 7 columnas: viewBox de **1398 u**; el lienzo ancho exige un contenedor de **≥ 1198 px**         | 6 columnas: viewBox de **1200 u**; contenedor de **≥ 1029 px**                                        |
| Los criterios del caso | Ninguno de los 11 criterios separa la orquestación                                              | El tipo `cap-transformacion` ya se llama «Transformación **y** orquestación»                          |
| La práctica            | La especificación § 10.6 la puso como capa 5                                                    | Databricks la agrupa con las capacidades comunes; Reis y Housley la tratan como corriente transversal |
| Costo del cambio       | Ninguno                                                                                         | Nota en la gramática + una línea de CHANGELOG + declarar la desviación de § 10.6                      |

## 4. P4 — Flujos agregados en el nivel 1

### 4.1 Propuesta: una línea con etiqueta de modos

- **Un par de bloques, una línea.** Si el par tiene un solo modo, la línea lleva el trazo de ese
  modo (§ 7). Si tiene varios, es un **haz**: línea sólida de 4 u.
- **La etiqueta (chip).** Una píldora de 18 u de alto con los marcadores de sus modos en el orden
  de la gramática, de ancho `6 + 16 × k`. Todo flujo lleva la suya, también los de un solo modo,
  porque el modo es trazo **y** marcador (G7).
- **Dónde va.** En el tramo horizontal más largo: en el carril exprés, centrada bajo la columna más
  cercana a la mitad del tramo; en los demás, en el tramo de entrada, lejos de la punta de flecha
  (9 u). En el canal lateral angosto la etiqueta se apila en vertical (18 u de ancho), porque allí
  no hay sitio a lo ancho.
- **Si no cabe**, la calculadora lo reporta; no se dibuja encima de nada.

### 4.2 La alternativa medida: una línea por modo

En el mapa de ejemplo las dos se leen, también a 380 px: compáralas en la maqueta. La diferencia
aparece con la densidad.

- Cada modo añade un puerto por borde y una punta de flecha. Un par con los 4 modos pone 4 líneas
  donde la propuesta pone 1.
- **Medido:** en una versión anterior de la referencia, con las franjas dibujadas como líneas, el
  Almacén central recibía 4 entradas en sus 88 u de alto y **dos marcadores se pisaban**. Con la
  etiqueta, el mismo par ocupa un solo puerto.

Si el usuario prefiere la alternativa, el cambio es una opción del renderizador, no del dato.

### 4.3 Las franjas en el nivel 1: referencias, no líneas

Los flujos que tocan una franja **no se dibujan como líneas en el nivel 1**. Se escriben junto al
elemento de la franja, uno por renglón: flecha (hacia o desde), marcadores de modo y nombre del
elemento con el que conecta. Ejemplo: «hacia · ida y vuelta · Almacén central».

- **Por qué.** Con las líneas, el carril exprés pedía 6 pistas y el canal junto a Gobierno 5
  (medido en la primera versión); para un líder era una maraña. Sin ellas, el carril baja a 2
  pistas y el dibujo cuenta el camino del dato. Es divulgación progresiva: el nivel 2 dibuja todo.
- **Nada se pierde.** El modo sigue en marcador y la conexión en texto; la lectura en texto (G10)
  la repite.
- **Cambio al contrato:** § 4.1 debe decir que en el nivel 1 un flujo agregado con una franja se
  representa como referencia.

### 4.4 Regreso entre columnas vecinas

Un flujo hacia atrás entre columnas contiguas **sale por la izquierda del origen y entra por la
derecha del destino**, por el canal que comparten. El bucle Almacén ↔ Preparación se dibuja como
dos flechas en su canal, sin bajar al carril. En angosto es el mismo par de conectores entre dos
filas: uno baja y otro sube.

## 5. Paleta

### 5.1 Método

- **El color es de la gramática, no de la interfaz.** La interfaz es monocroma. Los 8 matices se
  reservan a los tipos de nodo; flujos, etiquetas, insignias y semáforo van en tinta.
- **Codificación del nodo.** Relleno tintado de croma bajo del matiz, borde de 2 u y glifo en el
  matiz, **texto siempre en tinta**. El contraste del texto no depende del matiz.
- **Un matiz propio por tipo (ronda 2).** Cada tipo tiene su matiz en OKLCH, igual en los dos
  temas, elegido por significado y repartido en la rueda: azul la ingesta, violeta el almacenamiento,
  naranja la transformación, rojo el gobierno, verde el consumo, magenta la IA, cian la operación y un
  pizarra casi neutro para lo externo (está **fuera** de la plataforma). La ronda 1 usaba cuatro
  familias × dos claridades (dos azules, dos turquesas, mostaza y oliva); el usuario la vio apagada y
  repetida.
- **Búsqueda determinista de la claridad.** `pnpm paleta:buscar` fija matiz y croma tope por tipo y
  busca la claridad de cada uno, por tema, dentro de un rango (el naranja jamás baja a marrón; no hay
  amarillo). Tres arranques fijos y descenso por coordenadas; maximiza la peor distancia entre pares
  bajo 7 vistas —normal, y protan, deutan y tritan con severidad 0,6 y 1,0 (Machado, Oliveira y
  Fernandes, 2009)— con la condición de que cada trazo pase 3:1 sobre sup-1, sup-2 y su relleno.
- **Fuente de verdad.** `scripts/paleta/generar-tokens.mjs` declara el OKLCH y genera
  `docs/diseno/assets/tokens.json` y `tokens.css`. El gate falla si alguien los edita a mano.

### 5.2 Los 8 tipos

| Token  | Tipo               | Familia        | Oscuro    | Claro     | Trazo/sup-1 oscuro | Trazo/sup-1 claro | Glifo/relleno oscuro | Glifo/relleno claro |
| ------ | ------------------ | -------------- | --------- | --------- | ------------------ | ----------------- | -------------------- | ------------------- |
| tipo-1 | cap-ingesta        | azul (250°)    | `#95c9ff` | `#0060a6` | 10.44              | 6.24              | 8.21                 | 5.73                |
| tipo-2 | cap-almacenamiento | violeta (295°) | `#ac8ff8` | `#8264c8` | 6.95               | 4.37              | 5.56                 | 3.97                |
| tipo-3 | cap-transformacion | naranja (62°)  | `#f09638` | `#ca7400` | 7.88               | 3.35              | 6.29                 | 3.04                |
| tipo-4 | cap-gobierno       | rojo (22°)     | `#e36364` | `#c4474b` | 5.39               | 4.62              | 4.35                 | 4.21                |
| tipo-5 | cap-consumo        | verde (148°)   | `#6ace7c` | `#017f31` | 9.27               | 4.93              | 7.19                 | 4.56                |
| tipo-6 | cap-ia             | magenta (345°) | `#fa87cb` | `#9e3378` | 8.12               | 6.29              | 6.56                 | 5.69                |
| tipo-7 | tipo-externo       | pizarra (250°) | `#7a8b9e` | `#39495a` | 5.20               | 8.84              | 4.09                 | 8.11                |
| tipo-8 | tipo-operacion     | cian (205°)    | `#1fbdcb` | `#0098a4` | 7.95               | 3.34              | 6.17                 | 3.10                |

### 5.3 Umbral declarado y resultado

**Umbrales (convención de Big-D, no evidencia publicada):** ΔE en OKLab del peor par ≥ 0,10 en
visión normal, ≥ 0,06 en la severidad del usuario (0,6) y ≥ 0,03 en dicromacia (1,0). En
acromatopsia no se exige distancia por pares: allí la información la cargan glifo y etiqueta (G7),
y así se ve en las capturas de escala de grises.

| Vista      | Umbral          | Peor par oscuro         | Peor par claro          |
| ---------- | --------------- | ----------------------- | ----------------------- |
| normal     | 0.1             | 0.124 (tipo-1 ~ tipo-8) | 0.124 (tipo-4 ~ tipo-6) |
| protan-0.6 | 0.06            | 0.074 (tipo-6 ~ tipo-8) | 0.080 (tipo-1 ~ tipo-2) |
| deutan-0.6 | 0.06            | 0.081 (tipo-3 ~ tipo-5) | 0.099 (tipo-4 ~ tipo-5) |
| tritan-0.6 | 0.06            | 0.086 (tipo-5 ~ tipo-8) | 0.100 (tipo-3 ~ tipo-4) |
| protan-1.0 | 0.03            | 0.069 (tipo-6 ~ tipo-8) | 0.045 (tipo-3 ~ tipo-5) |
| deutan-1.0 | 0.03            | 0.058 (tipo-6 ~ tipo-8) | 0.061 (tipo-4 ~ tipo-5) |
| tritan-1.0 | 0.03            | 0.038 (tipo-3 ~ tipo-6) | 0.046 (tipo-1 ~ tipo-5) |
| grises     | — (no se exige) | 0.002 (tipo-3 ~ tipo-8) | 0.001 (tipo-3 ~ tipo-8) |

### 5.4 Neutros

| Neutro  | Oscuro    | Claro     | Uso                                             |
| ------- | --------- | --------- | ----------------------------------------------- |
| fondo   | `#0b0f14` | `#f2f4f6` | fondo de página                                 |
| sup-1   | `#12161c` | `#f9fafc` | carriles y lienzo del diagrama, barra de la app |
| sup-2   | `#1b2128` | `#ffffff` | tarjetas, controles, etiquetas                  |
| linea   | `#383e45` | `#d1d5d9` | filetes decorativos (vetada como texto)         |
| tinta-1 | `#e8ebf1` | `#161b21` | texto principal, marcas, foco                   |
| tinta-2 | `#b9bec6` | `#3d434a` | texto secundario, flujos                        |
| tinta-3 | `#70757c` | `#878d94` | guías y rejillas (vetada como texto)            |

Contrastes medidos: tinta-1 sobre sup-1 **15,2:1** (oscuro) y **16,6:1** (claro); tinta-2 sobre
el fondo **10,3:1** y **9,1:1**; tinta-1 sobre el relleno de nodo más exigente **11,8:1** y
**15,0:1**. Las tintas vetadas como texto (tinta-3, linea) no llegan a 4,5:1, y el gate lo exige:
si llegaran, el veto sobraría. tinta-3 sí pasa 3:1 (3,9 y 3,2), así que sirve para guías gráficas.
Ronda 2: el claro pasa de papel crema a un papel frío casi blanco.

### 5.5 Gate

`tests/unit/paleta-diagramador.test.ts`: sin deriva entre generador y archivos; cada trazo ≥ 3:1
sobre sup-1, sup-2 y su relleno; toda tinta de texto ≥ 4,5:1 sobre fondo, superficies y rellenos;
los umbrales de § 5.3 por tema y vista. Se vio fallar con el naranja del spike (`#e69f00`, 2,09:1
en claro).

## 6. Glifos

Caja de 16 × 16 centrada en (0, 0); pintan con `currentColor`. El color lo pone la clase del uso.

### 6.1 Tipos de nodo

| Glifo     | Pintura     | Path                                                                                                   |
| --------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| triangulo | lleno       | `M0,-7.5 L7.5,6 L-7.5,6 Z`                                                                             |
| cuadrado  | lleno       | `M-6.5,-6.5 H6.5 V6.5 H-6.5 Z`                                                                         |
| rombo     | lleno       | `M0,-8 L8,0 L0,8 L-8,0 Z`                                                                              |
| escudo    | lleno       | `M0,-7.5 L6.5,-5 V0 C6.5,4 3.5,6.3 0,7.8 C-3.5,6.3 -6.5,4 -6.5,0 V-5 Z`                                |
| circulo   | lleno       | `M0,-7 A7,7 0 1 1 0,7 A7,7 0 1 1 0,-7 Z`                                                               |
| estrella  | lleno       | `M0.0,-8.2 L2.1,-2.8 L7.8,-2.5 L3.3,1.1 L4.8,6.6 L0.0,3.5 L-4.8,6.6 L-3.3,1.1 L-7.8,-2.5 L-2.1,-2.8 Z` |
| anillo    | trazo 2.6 u | `M0,-6 A6,6 0 1 1 0,6 A6,6 0 1 1 0,-6 Z`                                                               |
| barras    | lleno       | `M-7.5,2 H-4 V7.5 H-7.5 Z M-1.75,-2.5 H1.75 V7.5 H-1.75 Z M4,-7.5 H7.5 V7.5 H4 Z`                      |

### 6.2 Dos cambios propuestos

- **Hexágono → escudo** (`cap-gobierno`). A 12 px, círculo, hexágono y pentágono se confunden:
  difieren en pocos píxeles de borde. El escudo es distinto por su punta y dice «protección».
- **Pentágono → barras** (`tipo-operacion`). Tres barras crecientes, como un medidor: distintas de
  toda forma redonda y ligadas a vigilar y pagar.

Los códigos cortos se vuelven mapas de idioma: ING/ING, ALM/STO, TRA/TRA, GOB/GOV, CON/CON, IA/AI,
EXT/EXT, OPE/OPS.

### 6.3 Marcas de estado: se dibujan, jamás se escriben (hallazgo medido)

Atkinson Hyperlegible Next y Mono **no traen** ✓ ✕ ▶ ⇉ → β α (sí traen · • — « » ≤ ≥ ± ≈ −). Un
carácter fuera de la fuente cae en la fuente de respaldo del sistema: su ancho cambia entre
navegadores y rompe G15 y el byte a byte de G1. Por eso **toda marca es un path**:

| Marca   | Path (caja 12)                            |
| ------- | ----------------------------------------- |
| vigente | `M-4.5,0.5 L-1.5,3.5 L4.5,-3.5`           |
| revisar | `M0,-5 V1.5 M0,4.2 V4.6`                  |
| vencido | `M-3.8,-3.8 L3.8,3.8 M3.8,-3.8 L-3.8,3.8` |
| hacia   | `M-5,0 H4 M1,-3.5 L4.5,0 L1,3.5`          |
| desde   | `M5,0 H-4 M-1,-3.5 L-4.5,0 L-1,3.5`       |

**Madurez: medidor.** Un rectángulo de 7 × 11 que se llena según el nivel: anunciado vacío con
contorno discontinuo, beta un cuarto, vista previa privada la mitad, vista previa pública tres
cuartos, disponible lleno; retirado vacío y tachado. Siempre con la palabra al lado. **Cambio al
esquema:** `nivel_madurez.glifo` (1–3 caracteres) se reemplaza por `nivel` (entero de −1 a 4);
«β» y «✓» desaparecen como caracteres.

El gate `maqueta-vocabulario` exige que todo carácter visible de la maqueta exista en la fuente.

## 7. Modos de flujo: trazo y marcador

Siempre en tinta (tinta-2), grosor 2 u. El periodo del patrón cabe al menos 3 veces en el tramo
más corto.

| Modo         | Trazo                                            | Marcador                         | Path del marcador (caja 12)                                                              |
| ------------ | ------------------------------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------- |
| Por lotes    | discontinuo `8 5`                                | cuadros                          | `M-5.5,-2.5 H-1.5 V1.5 H-5.5 Z M1.5,-2.5 H5.5 V1.5 H1.5 Z M-5.5,3.5 H5.5`                |
| Continuo     | sólido                                           | onda                             | `M-6,0 C-4.5,-4.5 -1.5,-4.5 0,0 S4.5,4.5 6,0`                                            |
| A demanda    | punteado `0.1 5.5`, extremo redondo, 2,8 u       | **ida y vuelta** (antes «reloj») | `M-5.5,-2.5 H4 M1.5,-5 L4.5,-2.5 L1.5,0 M5.5,2.5 H-4 M-1.5,0 L-4.5,2.5 L-1.5,5`          |
| Sin copia    | doble: 6,5 u en tinta con 2,5 u de lienzo encima | enlace                           | `M-1.2,-3 H-3.5 A3,3 0 0 0 -3.5,3 H-1.2 M1.2,-3 H3.5 A3,3 0 0 1 3.5,3 H1.2 M-2.5,0 H2.5` |
| Varios (haz) | sólido 4 u                                       | la etiqueta lista los modos      | —                                                                                        |

**Cambio propuesto: «reloj» → «ida y vuelta».** _A demanda_ es «viaja cuando alguien lo pide»: una
pregunta y su respuesta. Un reloj dice «a una hora», que es lo que hace _por lotes_. El esquema
cambia el enum `marcador`: sale `reloj`, entra `ida-y-vuelta`.

## 8. Tipografía

### 8.1 P11 — Atkinson Hyperlegible Next

- **La familia.** Atkinson Hyperlegible Next para interfaz y diagrama; Atkinson Hyperlegible Mono
  para huellas, semillas, identificadores y comandos. Del Braille Institute, sin marca de ningún
  fabricante de datos.
- **Licencia verificada en el paquete:** SIL OFL 1.1 (`METADATA.pb` del repositorio de Google
  Fonts). Los `OFL.txt` viajan junto a cada archivo.
- **Por qué esta.** Es la única de las evaluadas que distingue I/l/1 y O/0 **con sus glifos por
  defecto**, sin rasgos OpenType, y la tabla de métricas de G15 no puede depender de rasgos. Trae ñ,
  ¿, ¡ y tildes. Inter necesita `ss02`/`cv05` para distinguir; IBM Plex es marca de IBM; Source
  Sans 3 distingue el cero solo con `zero`.
- **Archivos.** Variables `wght` 200–800 en woff2 (48 KB + 26 KB), con huella SHA-256 en
  `docs/diseno/assets/fuentes/cobertura.json`.
- **Prototipo de la tabla G15.** `docs/diseno/assets/fuentes/metricas.json` guarda el avance de
  cada carácter a peso 400 y 700 (unidades de em, 1000), más ascendente 984, descendente −316,
  altura de mayúscula 668 y altura x 496. La referencia se trazó midiendo con esa tabla y un margen
  del 3 %, sin kerning. El kerning de Atkinson es negativo en su mayoría, así que la suma es una
  cota superior.

### 8.2 Tamaños

| Uso                     | Ancho (u)     | Angosto (u)   | Peso      |
| ----------------------- | ------------- | ------------- | --------- |
| Nombre de banda         | 16 / línea 20 | 14 / línea 18 | 700       |
| Pregunta de banda       | 15 / línea 19 | 13 / línea 17 | 400       |
| Nombre de bloque        | 16 / línea 20 | 15 / línea 19 | 700       |
| «N componentes»         | 16            | 15            | 400       |
| Referencias de franja   | 15            | 13            | 400       |
| Madurez, «+N», insignia | 14            | 13            | 400 / 700 |

### 8.3 El piso de 12 px sin escalar

La vista elige la disposición por el **ancho del contenedor**:
`umbral = ancho del viewBox × 12 / letra mínima del lienzo`.

| Lienzo         | viewBox | Letra mínima | Ancho desde                  |
| -------------- | ------- | ------------ | ---------------------------- |
| Ancho, 6 capas | 1200 u  | 14 u         | 1029 px                      |
| Ancho, 7 capas | 1398 u  | 14 u         | 1198 px                      |
| Angosto        | 348 u   | 13 u         | 321 px (teléfonos de 360 px) |

Por debajo de 321 px el angosto baja del piso: se declara 360 px como el teléfono más estrecho
soportado.

## 9. Geometría

### 9.1 Ancho

| Constante            | Valor                                                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Márgenes laterales   | 33 u                                                                                                                                                            |
| Columna              | 144 u (texto a 6 u del borde: 132 u útiles; «Almacenamiento» en negrita mide 126 u)                                                                             |
| Canal entre columnas | 54 u, 5 pistas cada 10 u desde 7 u                                                                                                                              |
| viewBox              | `2 × 33 + n × 144 + (n − 1) × 54`                                                                                                                               |
| Cabecera de capa     | altura fija = la mayor de la gramática en cualquier idioma: `10 + líneas del nombre × 20 + 4 + líneas de la pregunta × 19 + 10`                                 |
| Bloque de nivel 1    | 144 × 88, esquina 6                                                                                                                                             |
| Puertos              | adelante sale por la derecha y entra por la izquierda; atrás al revés. `k` puertos en un borde, en `y + round(88 × i / (k + 1))`, ordenados por columna del par |
| Carril exprés        | bajo las columnas, pistas cada 22 u (cabe la etiqueta de 18 u)                                                                                                  |
| Franja               | a todo lo ancho; altura = máx(cabecera, 88 + 24, 24 + 24 × referencias)                                                                                         |

**Reglas de ruteo:** adelante contiguo, por el canal compartido; atrás contiguo, § 4.4; todo lo
demás baja al carril por el canal de salida, lo recorre y sube por el canal de entrada. Pistas por
coloreo de intervalos, en orden determinista. **D11 por construcción:** los tramos verticales solo
corren en canales y los horizontales solo en el carril o en tramos de entrada y salida.

### 9.2 Angosto (380 px, lienzo 348) — RETIRADO en la ronda 2

> Retirado por la decisión de P5 (§ 1): ya no existe disposición angosta. Se conserva la tabla
> como registro de lo que la ronda 1 midió.

| Constante         | Valor                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Cabecera de fila  | de 0 a 132 u (texto de 116 u; 112 u en franjas, tras la barra)                                                                 |
| Bloque            | desde 132 u; ancho `348 − 10 − 12 × (T − 1) − 10 − 132` (184 u con T = 2) × 76                                                 |
| Hueco entre filas | 30 u                                                                                                                           |
| Filas contiguas   | conector vertical por el hueco, del borde inferior del de arriba al superior del de abajo, en `x + round(ancho × i / (k + 1))` |
| No contiguas      | canal lateral derecho, pistas cada 12 u; puertos en el borde derecho, el más lejano arriba; los tramos cortos por dentro       |

### 9.3 Lo que midió la referencia

| Lienzo                          | viewBox    | Carril o canal | Cruces D11                     | Avisos |
| ------------------------------- | ---------- | -------------- | ------------------------------ | ------ |
| Ancho, orquestación transversal | 1200 × 694 | 2 pistas       | 0 (y 0 con una línea por modo) | 0      |
| Ancho, orquestación capa        | 1398 × 572 | 2 pistas       | 0                              | 0      |
| Angosto, transversal            | 348 × 1267 | 2 pistas       | 0 (y 0 con una línea por modo) | 0      |
| Angosto, capa                   | 348 × 1233 | 2 pistas       | 0                              | 0      |

El arnés de capturas (`scripts/capturar-maqueta.mjs`) midió en Chromium 5 estados × 2 temas ×
2 idiomas × 2 anchos: **0 desplazamientos horizontales, 0 textos fuera del lienzo, 0 textos
encima de una caja ajena, fuente cargada**. Es la medida de G11 que la prueba del piloto repetirá
en tres navegadores.

## 10. P10 — Densidad por banda (estimada)

- **Angosto:** la altura de una fila con `r` renglones de nodos es `16 + 76 × r + 16 × (r − 1)`.
  Con 9 bandas de un renglón el lienzo mide unas 1270 u (medido). Un techo sensato de 2400 u, unas
  tres pantallas, deja sitio a unos 13 renglones más en todo el mapa.
- **Propuesta:** `limites.nodos_por_banda_max: 6`, dos renglones de 3 en el nivel 2 angosto, con
  su carnada: siete nodos en una banda debe fallar.
- **Nivel 1:** un bloque muestra un glifo por componente hasta 4 y luego «+N».
- **G5 en angosto.** En el nivel 1 cada banda tiene un solo elemento y la altura de fila depende
  solo de la gramática, así que G5 se cumple. En el nivel 2 la altura depende de los nodos: para
  alinear lado a lado hay que reservar por banda el máximo de los mapas comparados. Se decide en el
  piloto.

## 11. Vigencia y madurez: se marca la excepción

- **Dentro del diagrama**, lo vigente y lo disponible **no se marcan**. Así el ojo va a lo que pide
  acción. La leyenda lo dice.
- **Insignia de vigencia:** símbolo dibujado + días («34 d»). _Por revisar_: contorno de 2 u.
  _Vencido_: fondo lleno de tinta, marca y texto en el color del lienzo. El texto completo
  («por revisar · 34 días») va en la píldora del mapa, en la leyenda y en la lectura en texto.
  **Cambio a § 4.8:** dentro del lienzo basta la forma compacta.
- **Dónde va la insignia:** donde no hay puertos. En ancho monta el borde superior del bloque; en
  angosto va en su fila inferior.
- **El semáforo no usa matiz.** No reutiliza ningún color de capacidad y sobrevive en escala de
  grises y en colores forzados. El contrato dice «+ color»; aquí ese canal es el peso y el relleno
  de la tinta.

## 12. Idioma

- **La geometría no depende del idioma.** Alturas de cabecera, cortes de caja y umbrales se
  calculan con el texto más largo de los idiomas declarados. Los SVG de español e inglés tienen las
  mismas cajas y difieren solo en el texto. Así G5 vale también entre idiomas.
- El motor emite un SVG por idioma (§ 3.7). La maqueta pinta ambos textos en el mismo SVG y oculta
  uno.
- **Textos EN redactados en esta etapa**, porque la gramática y el mapa v0.2.0 son solo ES: ver § 16.

## 13. Leyenda, glosario y nota de marcas

La leyenda se genera de la gramática, con los mismos paths: tipos (glifo + código + nombre), modos
(trazo + marcador + nombre + frase), madurez (medidor + nombre) y vigencia (marca + regla de días).
La nota de marcas se genera también:

> Databricks, Microsoft Fabric y Snowflake son marcas de sus respectivos titulares. Aquí se nombran
> solo para identificarlas; su uso no implica respaldo de los titulares. Big-D no usa logos ni
> colores de marca: el color de este mapa dice qué capacidad es, nunca de quién.

## 14. Accesibilidad

- Raíz `graphics-document document` con `<title>` por idioma; banda `group` con nombre y pregunta;
  elemento `graphics-symbol img`, enfocable, con nombre, frase y componentes; flujos y etiquetas
  `aria-hidden`.
- **Foco:** borde de 3,5 u en tinta-1; se distingue por grosor, no por color.
- **Colores forzados:** la hoja del diagrama pasa todo a `Canvas` y `CanvasText`; quedan glifo,
  trazo, marcador y texto.
- **Lectura en texto (G10)** bajo el diagrama, con «Saltar el diagrama» antes. Al activar un bloque,
  su línea aparece en una ficha breve.

## 15. Animación del recorrido (G12)

Se propone aquí y se dibuja en la mirada 2 (`atlas-recorrido.html`).

- **El recorrido se lee sin animación.** Vista estática de todos los pasos por defecto; anterior y
  siguiente cambian un atributo del contenedor (`data-paso`).
- **La animación vive en `recorrido-animacion.css`**, enlazada con
  `media="(prefers-reduced-motion: no-preference)"`. Con «reducir movimiento» la hoja no se aplica y
  `document.getAnimations()` queda vacío. El SVG no cambia.
- **Qué se anima:** un trazo de marcha sobre una **copia** del tramo que entra al paso activo (jamás
  el patrón del modo) y un pulso de escala de 1 a 1,06 en el halo del paso activo, 1,2 s. Pausable;
  nunca arranca solo.
- **El paso activo, sin color:** borde de 4 u, halo, insignia numerada y «Paso n de N». Lo visitado
  va a 3 u; lo pendiente, a opacidad 0,35. Una bifurcación lleva sufijos 6a y 6b.

## 16. Cambios propuestos al esquema y a la gramática

| Dónde                                              | Cambio                                                                                                         |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `gramatica.schema.json` · `tipo_de_nodo.glifo`     | enum: salen `hexagono` y `pentagono`; entran `escudo` y `barras`                                               |
| `gramatica.schema.json` · `modo_de_flujo.marcador` | enum: sale `reloj`; entra `ida-y-vuelta`                                                                       |
| `gramatica.schema.json` · `nivel_madurez`          | `glifo` (1–3 caracteres) pasa a `nivel` (de −1 a 4)                                                            |
| `gramatica.schema.json` · `limites`                | nuevo `nodos_por_banda_max` (6 en `plataformas-datos`)                                                         |
| Todo texto                                         | mapa `{ es, en }` (ya decidido en § 3.7); `etiqueta_corta` también                                             |
| `plataformas-datos.json`                           | `orquestacion`: `clase: transversal`, `orden: 3`; nota de linaje en `descripcion`                              |
| CONTRATO § 4.1                                     | en el nivel 1, los flujos con una franja se dan como referencias (§ 4.3)                                       |
| CONTRATO § 4.8                                     | forma compacta de la insignia dentro del lienzo (§ 11)                                                         |
| CONTRATO D1                                        | confirmar la lectura de «abarcan el eje» en angosto (§ 2)                                                      |
| Carnadas nuevas                                    | siete nodos en una banda · un carácter fuera de la fuente en un texto · un flujo agregado con 4 modos a 380 px |

### Textos EN redactados (gramática)

| id             | ES                                                                                                      | EN                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| fuentes        | Fuentes · ¿De dónde vienen los datos?                                                                   | Sources · Where does the data come from?                                            |
| ingesta        | Ingesta · ¿Cómo entran los datos a la plataforma?                                                       | Ingestion · How does data get into the platform?                                    |
| almacenamiento | Almacenamiento · ¿Dónde y en qué formato se guardan?                                                    | Storage · Where is it kept, and in what format?                                     |
| procesamiento  | Procesamiento y transformación · ¿Con qué motor se limpian, combinan y preparan?                        | Processing and transformation · What engine cleans, joins and prepares it?          |
| orquestacion   | Orquestación · ¿Quién decide qué se ejecuta y cuándo?                                                   | Orchestration · Who decides what runs, and when?                                    |
| consumo        | Consumo · ¿Cómo llegan a tableros, reportes y aplicaciones?                                             | Consumption · How does it reach dashboards, reports and apps?                       |
| ia             | Inteligencia artificial · ¿Cómo se construyen modelos y agentes sobre los datos?                        | Artificial intelligence · How are models and agents built on the data?              |
| gobierno       | Gobierno y seguridad · ¿Quién puede ver qué, y cómo se audita?                                          | Governance and security · Who can see what, and how is it audited?                  |
| operacion      | Operación y costo · ¿Cómo se vigila, se despliega y se paga?                                            | Operations and cost · How is it monitored, deployed and paid for?                   |
| por-lotes      | Por lotes · Viaja en tandas programadas.                                                                | In batches · Travels in scheduled batches.                                          |
| continuo       | Continuo · Viaja a medida que ocurre.                                                                   | Continuous · Travels as it happens.                                                 |
| a-demanda      | A demanda · Viaja cuando alguien lo pide.                                                               | On request · Travels when someone asks for it.                                      |
| sin-copia      | Sin copia · Se lee en su lugar, sin copiarlo.                                                           | No copy · Read where it lives, never copied.                                        |
| madurez        | Disponible de forma general · Vista previa pública · Vista previa privada · Beta · Anunciado · Retirado | Generally available · Public preview · Private preview · Beta · Announced · Retired |
| vigencia       | vigente · por revisar · vencido                                                                         | current · review due · expired                                                      |

Los textos EN de los bloques y nodos del mapa de ejemplo están en la maqueta (lectura en texto).

## 17. Lo que esta referencia no probó

- **Kerning:** la tabla es sin kerning, una cota superior. Falta medir la diferencia contra los tres
  motores en dos sistemas operativos (investigación técnica § 14.6).
- **Más de un elemento por banda** en el nivel 1, y franjas con varios elementos: las reglas lo
  prevén (ranuras, y referencias en la ranura siguiente), pero el mapa de ejemplo no lo ejercita.
- **Mapas reales:** la densidad (P10) y los cruces se miden en el piloto con Fabric.
- **Solo Chromium** en la pasada de capturas; el piloto repite en Firefox y WebKit.
- **Cómo se trazó la referencia.** Con una calculadora de geometría que aplica las reglas de § 9
  sobre la tabla de métricas. Vive fuera del repo a propósito: no es el motor y no adelanta el
  paquete del diagramador antes de G-Diseño. El SVG versionado es el artefacto, y las fórmulas de
  este documento bastan para reproducirlo.
