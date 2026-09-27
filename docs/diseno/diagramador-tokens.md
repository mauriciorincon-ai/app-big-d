---
documento: Gramática visual del diagramador — propuesta para el CONTRATO v0.3.0
estado: propuesta cerrada para G-Diseño (miradas 1–4 aprobadas 2026-09-26; ajustada tras la auditoría de la etapa 2026-09-27)
fecha: 2026-09-26
contrato_base: reusables/diagramador/CONTRATO.md v0.2.0 (planeadora, solo lectura)
referencia_visual: docs/diseno/atlas-nivel-1.html · atlas-nivel-2.html · atlas-recorrido.html · lado-a-lado.html (rondas 1–3 de la mirada 1 en el historial: f21519c · 5439920 · a05a217)
autor: Etapa de Diseño de Big-D (piloto del reusable)
---

# Gramática visual del diagramador — propuesta para el CONTRATO v0.3.0

> Este documento es la **propuesta** de la Etapa de Diseño de Big-D. La planeadora decide si la
> absorbe en el `CONTRATO.md` v0.3.0 (G-Metodo). Nada de aquí es contrato hasta entonces. Todo lo
> que dice se ve dibujado en `docs/diseno/atlas-nivel-1.html`, trazado sobre la Plataforma Ejemplo
> (ficticia) del contrato, en ancho y en 380 px, oscuro y claro, español e inglés.

> **Rondas 2–4 (2026-09-26).** El usuario no aprobó la ronda 1 («visualmente horrible; el diagrama
> no lo quiero vertical sino horizontal y con desplazamiento lateral»). Decisiones suyas ya
> aplicadas: **P5 siempre horizontal** (§ 1), **dirección visual B «plano»** (elegida entre tres,
> § 9), **Space Grotesk** (elegida entre tres, § 8) y la **paleta de un matiz por tipo** (§ 5). Lo
> que sigue describe la referencia de la ronda 4.

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
| P11   | Fuente con tabla de métricas             | **Space Grotesk** (elegida por el usuario) y JetBrains Mono, SIL OFL 1.1, variables `wght`                                    | § 8     |
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
  primera columna más su canal (200 u, § 9.1), y sus elementos van en las ranuras alineadas con las
  columnas 2 en adelante. Así su texto nunca cruza un canal por donde pase una línea.
- **En teléfono** es el mismo lienzo deslizado: la franja sigue abarcando todas las columnas,
  aunque solo se vean dos a la vez; el rótulo «Transversales · abarcan todas las capas» lo dice.
- **D1 dice «perpendiculares al eje y lo abarcan entero».** Se cumple al pie de la letra en todo
  ancho, porque ya no hay disposición angosta.

## 3. P9 — Orquestación, ¿capa o transversal?

**Propuesta: transversal**, tercera franja (después de Gobierno y de Operación: primero el dato,
luego el control, al final el dinero). Es una nota de la gramática `plataformas-datos`, no del
motor. La maqueta trae el estado **«P9: orquestación como capa»** para juzgar las dos.

| Criterio               | Como capa 5                                                                                     | Como transversal                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| El camino del dato     | Ningún registro pasa por ella. Su único flujo va **hacia atrás** (Programador → Canalizaciones) | Sale del eje de las capas, que queda solo para el movimiento del dato                                 |
| Nivel 1                | La fila principal gana un hueco de «1 componente»                                               | «1 componente» en una franja, que es lo esperable en lo transversal                                   |
| Ancho medido           | 7 columnas: viewBox de **1380 u**                                                              | 6 columnas: viewBox de **1178 u**; sin umbral de contenedor: si no cabe, el lienzo se desliza (§ 1)   |
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
- **Dónde va.** Entre columnas vecinas, en el centro del canal (corrida 4 u hacia el origen para
  no tocar la punta). En el carril exprés, en su pista: la conexión más cercana la centra en su
  tramo; la más lejana la pone en el tramo que queda libre tras el destino de la anterior.
- **Si no cabe**, la calculadora lo reporta; no se dibuja encima de nada.

### 4.2 La alternativa medida: una línea por modo

En el mapa de ejemplo las dos se leen, también a 380 px: compáralas en la maqueta. La diferencia
aparece con la densidad.

- Cada modo añade un puerto por borde y una punta de flecha. Un par con los 4 modos pone 4 líneas
  donde la propuesta pone 1.
- **Medido (ronda 1):** con las franjas dibujadas como líneas, el Almacén central recibía 4 entradas
  en sus 88 u de alto y **dos marcadores se pisaban**. Con la etiqueta, el mismo par ocupa un solo
  puerto. En la dirección B las líneas de un par vecino se reparten a 22 u alrededor del centro
  (ida primero, vuelta después): con 3 líneas ya ocupan 44 de las 104 u del bloque.

Si el usuario prefiere la alternativa, el cambio es una opción del renderizador, no del dato.

### 4.3 Las franjas en el nivel 1: referencias, no líneas

Los flujos que tocan una franja **no se dibujan como líneas en el nivel 1**. Se escriben como
**referencias** dentro de la franja, cada una **alineada bajo la columna de la capa con la que
conecta**: flecha (↑ envía hacia arriba, ↓ recibe), marcadores de modo y nombre del elemento.
Así la referencia se lee como el cruce de la fila de la franja con la columna de la capa, sin
línea. Ejemplo: en la franja Gobierno, bajo Almacenamiento, «↑ ⇄ Almacén central».

- **Por qué.** Con las líneas, el carril exprés pedía 6 pistas y el canal junto a Gobierno 5
  (medido en la primera versión); para un líder era una maraña. Sin ellas, el carril baja a 2
  pistas y el dibujo cuenta el camino del dato. Es divulgación progresiva: el nivel 2 dibuja todo.
- **Nada se pierde.** El modo sigue en marcador y la conexión en texto; la lectura en texto (G10)
  la repite.
- **También en el nivel 2 (mirada 2).** Los flujos entre un nodo de franja y un nodo de capa se
  escriben como referencias en la franja, bajo la columna del nodo de capa; el nivel 2 dibuja como
  líneas todos los flujos entre nodos de capas. Con las cuatro conexiones de franja del ejemplo
  dibujadas, cada una cruzaría el carril exprés o un canal ya ocupado. En el recorrido, si un paso
  toca una franja, su referencia se resalta como cualquier flujo.
- **Cambio al contrato:** § 4.1 y § 4.2 deben decir que un flujo con una franja se representa
  como referencia en los niveles 1 y 2.

### 4.4 Regreso entre columnas vecinas

Un flujo hacia atrás entre columnas contiguas **sale por la izquierda del origen y entra por la
derecha del destino**, por el canal que comparten. El bucle Almacén ↔ Preparación se dibuja como
dos flechas en su canal, sin bajar al carril, repartidas a 22 u alrededor del centro del bloque.

## 5. Paleta

### 5.1 Método

- **El color es de la gramática, no de la interfaz.** La interfaz es monocroma. Los 8 matices se
  reservan a los tipos de nodo; flujos, etiquetas, insignias y semáforo van en tinta.
- **Codificación del nodo (dirección B).** Tarjeta en `sup-2` con borde fino en `linea`, **filete
  izquierdo de 4 u y glifo en el matiz del tipo**, **texto siempre en tinta**. El contraste del texto no
  depende del matiz. (La ronda 1 proponía un relleno tintado por tipo, D7; la dirección B lo retiró y sus
  16 tokens `tipo-N-tinte` se eliminaron tras la auditoría, A-08.)
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
  Fernandes, 2009)— con la condición de que cada trazo pase 3:1 sobre sup-1 (lienzo) y sup-2 (tarjeta
  del nodo). Al retirar el relleno tintado, la búsqueda sin esa tercera condición movió dos claridades del
  tema claro (naranja 0,64 → 0,66 y rojo 0,57 → 0,58): la paleta es la salida de la búsqueda (D79).
- **Fuente de verdad.** `scripts/paleta/generar-tokens.mjs` declara el OKLCH y genera
  `docs/diseno/assets/tokens.json` y `tokens.css`. El gate falla si alguien los edita a mano.

### 5.2 Los 8 tipos

| Token  | Tipo               | Familia        | Oscuro    | Claro     | Trazo/sup-1 oscuro | Trazo/sup-1 claro | Glifo/sup-2 oscuro | Glifo/sup-2 claro |
| ------ | ------------------ | -------------- | --------- | --------- | ------------------ | ----------------- | ------------------ | ----------------- |
| tipo-1 | cap-ingesta | azul (250°) | `#95c9ff` | `#0060a6` | 10.44 | 6.24 | 9.33 | 6.51 |
| tipo-2 | cap-almacenamiento | violeta (295°) | `#ac8ff8` | `#8264c8` | 6.95 | 4.37 | 6.21 | 4.56 |
| tipo-3 | cap-transformacion | naranja (62°) | `#f09638` | `#d27908` | 7.88 | 3.10 | 7.05 | 3.24 |
| tipo-4 | cap-gobierno | rojo (22°) | `#e36364` | `#c74a4d` | 5.39 | 4.45 | 4.82 | 4.65 |
| tipo-5 | cap-consumo | verde (148°) | `#6ace7c` | `#017f31` | 9.27 | 4.93 | 8.29 | 5.15 |
| tipo-6 | cap-ia | magenta (345°) | `#fa87cb` | `#9e3378` | 8.12 | 6.29 | 7.25 | 6.57 |
| tipo-7 | tipo-externo | pizarra (250°) | `#7a8b9e` | `#39495a` | 5.20 | 8.84 | 4.65 | 9.23 |
| tipo-8 | tipo-operacion | cian (205°) | `#1fbdcb` | `#0098a4` | 7.95 | 3.34 | 7.11 | 3.48 |

### 5.3 Umbral declarado y resultado

**Umbrales (convención de Big-D, no evidencia publicada; D79):** ΔE en OKLab del peor par ≥ 0,10 en
visión normal, ≥ 0,06 en la severidad del usuario (0,6) y ≥ 0,03 en dicromacia (1,0). En
acromatopsia no se exige distancia por pares: allí la información la cargan glifo y etiqueta (G7),
y así se ve en las capturas de escala de grises.

**Desviación del plan aprobado (D8 → D79).** El plan pedía ≥ 0,10 también a severidad 0,6, ≥ 0,08 en
dicromacia y ΔL ≥ 0,05 entre tipos en grises. La paleta medida no llega (peor par 0,074 a 0,6 y 0,038 en
tritan 1,0), y separar 8 tipos por claridad a 0,05 pide 0,35 de rango de L: en el tema claro, los trazos
a 3:1 sobre `sup-2` viven por debajo de L ≈ 0,67 y los más oscuros se confunden con la tinta. Por eso la
regla 13 se cumple con **glifo + etiqueta**, no con el color. Los mínimos quedan escritos en el test como
literales: bajar el umbral y la paleta a la vez pone el gate en rojo.

| Vista      | Umbral          | Peor par oscuro         | Peor par claro          |
| ---------- | --------------- | ----------------------- | ----------------------- |
| normal | 0.1 | 0.124 (tipo-1 ~ tipo-8) | 0.129 (tipo-1 ~ tipo-7) |
| protan-0.6 | 0.06 | 0.074 (tipo-6 ~ tipo-8) | 0.080 (tipo-1 ~ tipo-2) |
| deutan-0.6 | 0.06 | 0.081 (tipo-3 ~ tipo-5) | 0.104 (tipo-4 ~ tipo-5) |
| tritan-0.6 | 0.06 | 0.086 (tipo-5 ~ tipo-8) | 0.106 (tipo-3 ~ tipo-4) |
| protan-1.0 | 0.03 | 0.069 (tipo-6 ~ tipo-8) | 0.052 (tipo-6 ~ tipo-7) |
| deutan-1.0 | 0.03 | 0.058 (tipo-6 ~ tipo-8) | 0.069 (tipo-4 ~ tipo-5) |
| tritan-1.0 | 0.03 | 0.038 (tipo-3 ~ tipo-6) | 0.046 (tipo-1 ~ tipo-5) |
| grises | — (no se exige) | 0.002 (tipo-3 ~ tipo-8) | 0.002 (tipo-1 ~ tipo-6) |

### 5.4 Neutros

| Neutro  | Oscuro    | Claro     | Uso                                             |
| ------- | --------- | --------- | ----------------------------------------------- |
| fondo   | `#0b0f14` | `#f2f4f6` | fondo de página                                 |
| sup-1   | `#12161c` | `#f9fafc` | carriles y lienzo del diagrama, barra de la app |
| sup-2   | `#1b2128` | `#ffffff` | tarjetas, controles, etiquetas                  |
| linea   | `#383e45` | `#d1d5d9` | filetes decorativos (vetada como texto)         |
| tinta-1 | `#e8ebf1` | `#161b21` | texto principal, marcas, foco                   |
| tinta-2 | `#b9bec6` | `#3d434a` | texto secundario, flujos                        |

Contrastes medidos: tinta-1 sobre sup-1 **15,2:1** (oscuro) y **16,6:1** (claro); tinta-2 sobre
el fondo **10,3:1** y **9,1:1**; tinta-1 sobre la tarjeta del nodo (`sup-2`) **13,6:1** y **17,3:1**. La tinta vetada como texto (`linea`) no llega a 4,5:1, y el gate lo exige: si llegara,
el veto sobraría. `tinta-3` (guías) se retiró tras la auditoría (A-08): ninguna regla la usaba; las
guías y rejillas van en `linea`.
Ronda 2: el claro pasa de papel crema a un papel frío casi blanco.

### 5.5 Gate

`tests/unit/paleta-diagramador.test.ts`: sin deriva entre generador y archivos; cada trazo y glifo
≥ 3:1 sobre sup-1 y sup-2; toda tinta de texto ≥ 4,5:1 sobre fondo y superficies; los umbrales de
§ 5.3 por tema y vista, que no pueden bajar de los mínimos escritos en el test. Se vio fallar con el
naranja del spike (`#e69f00`, 2,09:1 en claro) y con el umbral normal bajado a 0,05 en el generador.

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

Ninguna de las fuentes evaluadas trae completos ✓ ✕ ▶ ⇉ β α, y el subconjunto latino que se sirve
de Space Grotesk y JetBrains Mono los excluye a propósito (sí trae · • — « » ≤ ≥ ± ≈ −). Un
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

Siempre en tinta (tinta-2), grosor 1,6 u (a demanda 2,8 u, para que el punto se lea; haz 4 u), igual que `diagrama.css`. El periodo del patrón cabe al menos 3 veces en el tramo
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

### 8.1 P11 — Space Grotesk y JetBrains Mono

- **Elección del usuario (mirada 1, ronda 3).** Entre tres candidatas SIL OFL con carácter
  distinto —Manrope (geométrica), Space Grotesk (técnica), Onest (humanista)—, vistas en la misma
  página y en el mismo mapa (un SVG por fuente, recalculado con las métricas de cada una), el
  usuario eligió **Space Grotesk**. Atkinson Hyperlegible Next (rondas 1–2) la rechazó.
- **La familia.** Space Grotesk (Florian Karsten) para interfaz y diagrama, variable `wght`
  300–700; **JetBrains Mono** para huellas, semillas, fechas, códigos de tipo, números de capa y
  comandos, variable `wght` 100–800. Ninguna es marca de un fabricante de datos.
- **Licencia:** SIL OFL 1.1; `OFL-*.txt` junto a cada archivo.
- **Legibilidad.** Space Grotesk distingue I/l/1 por la forma de la «l» con pie y el «1» con base, y
  O/0 por el cero con punto en la mono; ñ, ¿, ¡, tildes y comillas latinas están en el
  subconjunto. Los símbolos de estado siguen dibujados (§ 6.3).
- **Archivos.** Subconjunto latino en woff2 (36 KB + 47 KB) con huella SHA-256 en `cobertura.json`
  y tabla de avances a 400 y 700 en `metricas.json` (G15: `unidades_por_em` 1000, ascendente 984,
  descendente −292, altura de mayúscula 700, altura de x 486).

### 8.2 Tamaños (dirección B)

| Uso                                    | Tamaño / línea (u)   | Peso      | Familia |
| -------------------------------------- | -------------------- | --------- | ------- |
| Número de capa, rótulo «Transversales» | 12, espaciado 0,1 em | 500       | mono    |
| Nombre de capa                         | 17 / 21              | 700       | sans    |
| Pregunta de capa                       | 14 / 19              | 400       | sans    |
| Nombre de bloque                       | 16 / 20              | 700       | sans    |
| «N componentes», madurez               | 13 / 18              | 400       | sans    |
| Nombre de franja · pregunta de franja  | 15 / 19 · 13 / 17    | 700 · 400 | sans    |
| Ficha compacta de franja               | 14 / 17 · 12 / 16    | 700 · 400 | sans    |
| Referencia de franja                   | 13                   | 700       | sans    |
| Insignia de vigencia                   | 12                   | 700       | mono    |

### 8.3 El piso de 12 px sin escalar

El lienzo se pinta **a escala 1 en todo ancho** (P5, § 1): la letra mínima mide 12 px en pantalla
siempre, y lo que no cabe se desliza. No hay umbral de contenedor ni disposición alternativa. Se
retira la fórmula `umbral = viewBox × 12 / letra mínima` de la ronda 1.

## 9. Geometría

### 9.1 Dirección B «plano» (la única disposición)

| Constante            | Valor                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Márgenes laterales   | 8 u (el aire lo pone el marco de la página)                                                                                                      |
| Columna              | 152 u; el texto usa todo el ancho de la columna («Almacenamiento» en 17/700 mide 129 u en Space Grotesk)                                         |
| Canal entre columnas | 50 u, con una guía punteada en su mitad                                                                                                          |
| viewBox              | `2 × 8 + n × 152 + (n − 1) × 50` → 1178 u con 6 capas, 1380 u con 7                                                                              |
| Cabecera de capa     | `4 + 16 (número) + 6 + líneas del nombre × 21 + 6 + líneas de la pregunta × 19 + 18`, con las líneas máximas de la gramática en cualquier idioma |
| Bloque de nivel 1    | 152 × 104, esquina 6, filete izquierdo de 4 u en el color del tipo, glifo antes del nombre                                                       |
| Puertos vecinos      | adelante sale por la derecha y entra por la izquierda; atrás al revés; las líneas del par a 22 u alrededor del centro                            |
| Carril exprés        | bajo los bloques, 2 pistas a 24 y 46 u del borde inferior; la conexión más lejana en la pista baja y con el puerto más a la izquierda            |
| Franja               | a todo lo ancho, 80 u de alto, filete superior; cabecera de 200 u, ficha compacta de 180 × 60; referencias bajo la columna que tocan             |
| Insignia de vigencia | píldora de 20 u montada sobre el borde superior del bloque, alineada a la derecha                                                                |

### 9.2 Angosto — RETIRADO

No existe disposición angosta (P5, § 1): en teléfono el mismo lienzo se desliza de lado con índice
de capas, sombras de borde y pista escrita (`assets/lienzo.js`). La geometría angosta de la ronda 1
queda en el historial (f21519c).

### 9.2 bis · Nivel 2 y recorrido (mirada 2)

| Constante                 | Valor                                                                                                                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nodo                      | 152 × 84, esquina 6, filete de tipo de 4 u, glifo + nombre en 13/700 (≤ 3 líneas), fila inferior: madurez (si no es disponible) y «N fuentes»                                            |
| Apilado                   | nodos de una banda en su columna, en el orden del mapa, a 40 u entre sí (cabe un flujo vertical con su etiqueta)                                                                         |
| Puertos                   | `k` puertos en un borde en `y + alto × i / (k + 1)`, ordenados por la fila del otro extremo                                                                                              |
| Vecinas con distinta fila | salida horizontal → pista vertical del canal (cada 10 u desde su mitad) → entrada horizontal; la etiqueta en el tramo de salida                                                          |
| Misma columna             | línea vertical en la mitad del nodo; la etiqueta a 24 u a la derecha                                                                                                                     |
| Saltos                    | salen por el borde inferior del nodo más bajo, van por el carril exprés (pistas a 24 y 46 u) y suben por el canal anterior al destino hasta entrar por la izquierda                      |
| Franja                    | altura `máx(64, 20 + 44 × k + 8 × (k − 1))` con `k` nodos en fichas compactas de 168 × 44 apiladas; referencias en la fila de su nodo                                                    |
| Recorrido                 | insignia de 24 u (30 si «6a») montada en la esquina superior izquierda del nodo; marca de rama a su derecha; estados por atributo `data-paso` del contenedor, CSS generado del recorrido |
| Medido                    | 1178 × 756 u, **0 cruces D11**, 0 avisos; las 4 conexiones de franja como referencia                                                                                                     |

### 9.2 ter · Lado a lado (mirada 2)

| Constante   | Valor                                                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Columnas    | las 9 bandas (capas y franjas), 118 u de ancho a 14 u; guía punteada entre capas y franjas; viewBox 1190 u                             |
| Fila        | 26 u de rótulo (nombre de la plataforma + versión y vigencia en mono) + bloques de 118 × 64; filas a 14 u                              |
| Bloque      | filete de tipo, glifo, nombre 12/700 (≤ 2 líneas), «N comp.» y madurez si no es disponible (si no caben las dos, manda la madurez)     |
| Sin bloque  | caja punteada «sin componentes»                                                                                                        |
| N           | tres plataformas por página en ancho (constante de vista declarada), paginación más allá; en < 900 px, una banda a la vez con **todas** las plataformas de la comparación apiladas, sin paginar. Orden por identificador de la plataforma, el mismo en los dos idiomas |
| Diferencias | píldora glifo + palabra bajo el bloque cambiado: nuevo (+), retirado (−, llena), renombrado (→), madurez (▮); lista explicativa debajo |
| Desplegados | vista «componentes»: columnas de 152 u a 14 u (viewBox 1496), cabecera del bloque hasta 2 líneas a 12/700, pila de nodos 152 × 88 a 8 u (glifo a 17 u, nombre desde 29 u, ≤ 3 líneas a 13/700); la fila mide su celda más alta; G5 se conserva porque solo crece la fila. Para el contrato: `compare` acepta el nivel 2 con alineación por banda, no por nodo |
| Componentes | cada bloque es activable (`data-nodo`): abre la lista de sus componentes (glifo + nombre + madurez + fuentes) en el panel; en < 900 px, desplegable bajo la fila. Pedido del usuario en la mirada 2; para el contrato: la vista `compare` expone los nodos de cada bloque agregado (G10 también aquí) |
| Mismo lienzo | intención del usuario en la mirada 4: los componentes se despliegan **en el mismo diagrama**, sin conmutador de vista. La maqueta conserva el conmutador (el usuario lo aprobó así); para el contrato: `compare` acepta un **nivel por banda** (una banda desplegada a nivel 2 en todas las plataformas y las demás a nivel 1, en el mismo SVG) y la fila desplegada crece sin mover las columnas (G5). El golden file de ese estado lo fija el sprint que implemente `compare` |

### 9.3 Lo que midió la referencia (ronda 4)

| Lienzo                                   | viewBox    | Carril   | Cruces D11 | Avisos |
| ---------------------------------------- | ---------- | -------- | ---------- | ------ |
| Orquestación transversal, etiqueta       | 1178 × 648 | 2 pistas | 0          | 0      |
| Orquestación transversal, línea por modo | 1178 × 648 | 2 pistas | 0          | 0      |
| Orquestación como capa, etiqueta         | 1380 × 558 | 2 pistas | 0          | 0      |

El arnés de capturas (`scripts/capturar-maqueta.mjs`) midió en Chromium 5 estados × 2 temas ×
2 idiomas × 2 anchos, más deuteranopía, protanopía, tritanopía y acromatopsia: **0 desplazamientos
horizontales de página, 0 textos fuera del lienzo, 0 textos encima de una caja ajena, fuente
cargada**. Es la medida de G11 que la prueba del piloto repetirá en tres navegadores.

## 10. P10 — Densidad por banda (estimada)

- **Nivel 2 en la dirección B:** los nodos de una banda se apilan en su columna de 152 u, uno por
  renglón, con la altura del bloque de nivel 1 (104 u) como techo por nodo. Con 6 nodos la columna
  mide unas 700 u más la cabecera: una pantalla y media de teléfono, deslizable en vertical.
- **Propuesta:** `limites.nodos_por_banda_max: 6`, con su carnada: siete nodos en una banda debe
  fallar. Se mide en el piloto con la referencia del nivel 2 (mirada 2).
- **Nivel 1:** un bloque muestra un glifo de su tipo y «N componentes» (dirección B); si la banda tiene un solo componente, su nombre (D34).
- **G5 (bandas alineadas lado a lado).** En el nivel 1 la altura de la fila depende solo de la
  gramática, así que G5 se cumple. En el nivel 2 depende de los nodos: para alinear lado a lado hay
  que reservar por banda el máximo de los mapas comparados. Se decide en el
  piloto.

## 11. Vigencia y madurez: se marca la excepción

- **Dentro del diagrama**, lo vigente y lo disponible **no se marcan**. Así el ojo va a lo que pide
  acción. La leyenda lo dice.
- **Insignia de vigencia:** símbolo dibujado + días («34 d»). _Por revisar_: contorno de 2 u.
  _Vencido_: fondo lleno de tinta, marca y texto en el color del lienzo. El texto completo
  («por revisar · 34 días») va en la píldora del mapa, en la leyenda y en la lectura en texto.
  **Cambio a § 4.8:** dentro del lienzo basta la forma compacta.
- **Dónde va la insignia:** donde no hay puertos: montada sobre el borde superior del bloque,
  alineada a la derecha.
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
La nota de marcas **no se dibujó en la maqueta** (se retiró con el cromo de la ronda 3): se diseña en el S1, el primer sprint con nombres reales, junto al selector de plataforma del atlas. Su texto propuesto:

> Databricks, Microsoft Fabric y Snowflake son marcas de sus respectivos titulares. Aquí se nombran
> solo para identificarlas; su uso no implica respaldo de los titulares. Big-D no usa logos ni
> colores de marca: el color de este mapa dice qué capacidad es, nunca de quién.

## 14. Accesibilidad

- Raíz `graphics-document document` con nombre accesible por idioma (en la maqueta, `aria-label` que cambia con el conmutador; el serializador del motor emite un SVG por idioma con su `<title>`); banda `group` con nombre y pregunta;
  elemento `graphics-symbol img`, enfocable, con nombre, frase y componentes; flujos y etiquetas
  `aria-hidden`.
- **Foco y selección:** borde de 2 u en tinta-1 (el normal es de 1 u en `linea`); se distingue por
  grosor y tinta, no por color.
- **Colores forzados:** la hoja del diagrama pasa todo a `Canvas` y `CanvasText`; quedan glifo,
  trazo, marcador y texto.
- **Lectura en texto (G10)** bajo el diagrama, plegada en un `details`. Al activar un bloque, su
  línea aparece en una ficha breve bajo el lienzo. El lienzo es una región enfocable que se desplaza
  con las flechas.

## 15. Animación del recorrido (G12)

Implementada en la referencia (`atlas-recorrido.html`):

- **El controlador cambia un atributo** (`data-paso="todos|p1…p8"`) del contenedor; el CSS generado
  del recorrido decide qué nodo es activo (borde 3 u), visitado (normal) o pendiente (opacidad 0,35) y
  qué flujo se resalta. El SVG no cambia.
- **Hoja aparte** `recorrido-animacion.css` cargada con `media="(prefers-reduced-motion:
no-preference)"`: transiciones de opacidad y grosor (240–320 ms) y, mientras se reproduce, la
  línea activa «fluye» con `stroke-dashoffset` (1,2 s). Con movimiento reducido la hoja no se carga
  y el botón «Reproducir» queda en el DOM oculto por CSS (`display: none`): el árbol no depende de la
  preferencia (regla 5-a del CLAUDE.md; en React, `useReducedMotion()` jamás decide qué se pinta).
- **Vista estática por defecto:** todos los pasos numerados. La reproducción avanza un paso cada
  2 s y se detiene al final; «Anterior», «Siguiente» y las flechas del teclado la detienen.
- **Numeración con rama:** 1–5, 6a → 7a (tablero) y 6b (agente); el nodo que bifurca lleva la marca
  «⇉» dibujada.

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
| CONTRATO G11, D1, G5, § 4, P10                     | se retira la disposición angosta (P5 del usuario, D29). G11 pasa a: «una sola disposición a escala 1 (piso de 12 px); si no cabe, el lienzo se desliza de lado con índice de capas, sombras de borde y pista escrita; la página jamás desborda» |
| CONTRATO § 4.2                                     | en el nivel 2, los flujos con una franja también se dan como referencias (D44, § 4.3)                          |
| CONTRATO § 4.4 `compare`                           | acepta el nivel 2 alineado por banda (D63) y un **nivel por banda** en el mismo SVG (D75, § 9.2 ter)           |
| CONTRATO G10                                       | la raíz del SVG enlaza la lectura en texto y cada vista lleva «Saltar el diagrama»                             |
| Codificación del nodo                              | tarjeta en `sup-2` + filete de 4 u y glifo del tipo; texto en tinta (D7 retirado: sin rellenos tintados)       |
| Serializador (D8)                                  | los ids de `<defs>` llevan espacio de nombres por SVG: una página con varios lienzos no repite ids             |
| Umbral de paleta (Gaps)                            | ΔE ≥ 0,10 normal · ≥ 0,06 a severidad 0,6 · ≥ 0,03 en dicromacia; grises por glifo + etiqueta (D79, § 5.3)     |
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
