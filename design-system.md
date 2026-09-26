---
version: 0.3.0
estado: completo para la mirada 2 (Etapa de Diseño, F2a); se sella en G-Diseño
fecha: 2026-09-26
fuente_en_codigo: docs/diseno/assets/ (tokens.css GENERADO · bigd.css · diagrama.css · fuentes.css)
gramatica_del_diagrama: docs/diseno/diagramador-tokens.md
---

# Big-D — design system

> **Fuente de verdad visual de Big-D.** Versión 0.3: completa para la mirada 2, con todos los
> componentes canon y sus estados, vistos en `docs/diseno/kit.html` y en las páginas del atlas. Lo
> que toca al diagrama vive en `docs/diseno/diagramador-tokens.md`, porque es contrato del
> reusable y no estilo de esta app. Se sella en G-Diseño.

## 1. Personalidad

**Un instrumento de medición que se lee como un mapa.** Big-D no vende ninguna plataforma: las mide
con la misma regla y lo muestra.

| Es                                                                       | No es                                                                                  |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| **Instrumental**: cada marca significa algo y se puede comprobar         | **De fabricante**: sin logos, sin colores de marca, ninguna plataforma al centro       |
| **Sobrio**: superficies planas, tinta, un solo canal de color            | **Decorativo**: sin degradados, sin sombras, sin brillo ni partículas                  |
| **Legible**: la letra de lectura fácil, el líder entiende en dos minutos | **Tablero genérico**: sin rejillas de tarjetas iguales ni cifras gigantes sin contexto |

## 2. Tesis

1. **El color es de la gramática, no de la interfaz.** La interfaz es monocroma: superficie y tinta.
   Los 8 matices se reservan a los tipos de componente del diagrama, y ahí van siempre con glifo y
   etiqueta (regla dura 13). Así el color nunca compite consigo mismo.
2. **Se marca la excepción, no la norma.** Lo vigente y lo disponible no llevan marca; lo que pide
   acción sí, con símbolo, texto y días.
3. **La misma plantilla para todas.** Toda plataforma se ve con el mismo mapa, en orden alfabético
   en los selectores. Neutralidad que se ve (regla dura 5).
4. **Oscuro primario, claro igual de cuidado.** Los dos temas salen del mismo generador y pasan el
   mismo gate.

## 3. Tokens

Los colores se declaran en OKLCH en `scripts/paleta/generar-tokens.mjs` y se generan a
`docs/diseno/assets/tokens.{json,css}`. **Jamás se editan a mano**: el gate
`paleta-diagramador` detecta la deriva.

### 3.1 Color — neutros

| Token     | Oscuro    | Claro     | Uso                                                              |
| --------- | --------- | --------- | ---------------------------------------------------------------- |
| `fondo`   | `#0b0f14` | `#f2f4f6` | fondo de página                                                  |
| `sup-1`   | `#12161c` | `#f9fafc` | barra de la app, carriles y lienzo del diagrama                  |
| `sup-2`   | `#1b2128` | `#ffffff` | tarjetas, controles, etiquetas, paneles elevados                 |
| `linea`   | `#383e45` | `#d1d5d9` | filetes que separan secciones (**vetada como texto**)            |
| `tinta-1` | `#e8ebf1` | `#161b21` | texto principal, títulos, marcas, foco, fondo de lo seleccionado |
| `tinta-2` | `#b9bec6` | `#3d434a` | texto secundario, flujos, bordes de control                      |
| `tinta-3` | `#70757c` | `#878d94` | guías y rejillas (**vetada como texto**)                         |

Oscuro: superficie azul negra fría, tinta clara. Claro: papel frío casi blanco, tinta azul negra (ronda 2; la ronda 1 usaba un crema cálido).

### 3.2 Color — tipos de componente

Un matiz propio por tipo, con claridad por tema (ronda 2). Tabla completa, método, umbral y medidas en
`diagramador-tokens.md` § 5. Resumen: azul (ingesta), violeta (almacenamiento), naranja
(transformación), rojo (gobierno), verde (consumo), magenta (IA), pizarra casi neutro (externo) y
cian (operación). Cada uno tiene su relleno tintado (`tipo-N-tinte`) para tarjetas e insignias.

### 3.3 Tipografía

**Space Grotesk** (interfaz y diagrama) y **JetBrains Mono** (huellas, fechas, versiones, códigos,
comandos, números de capa, ojos de sección). Elegida por el usuario en la mirada 1 (ronda 3) entre
Manrope, Space Grotesk y Onest; Atkinson Hyperlegible (rondas 1–2) fue rechazada. Ambas SIL OFL 1.1,
variables `wght`, subconjunto latino servido desde el sitio.

| Rol                                   | Familia        | Tamaño / línea                                        | Peso             |
| ------------------------------------- | -------------- | ----------------------------------------------------- | ---------------- |
| Título de página (h1)                 | Space Grotesk  | 32 / 35 en teléfono · 46 / 51 desde 720 px, −0,025 em | 800              |
| Ojo de sección («ATLAS · NIVEL 1 …»)  | JetBrains Mono | 12, mayúsculas, +0,12 em                              | 600              |
| Subtítulo                             | Space Grotesk  | 17 / 26                                               | 400              |
| Cuerpo                                | Space Grotesk  | 16 / 25                                               | 400              |
| Navegación, pestañas, leyenda         | Space Grotesk  | 14 a 15                                               | 400 · 700 activo |
| Metadatos (vigencia, fechas, versión) | JetBrains Mono | 13 / 18                                               | 500              |
| Pie                                   | JetBrains Mono | 12 / 19                                               | 500              |

- **Sin cursiva:** solo se sirve la redonda. La cursiva sintética está prohibida.
- **Caracteres fuera de la fuente, prohibidos en texto.** ✓ ✕ ▶ → β se dibujan como SVG. Lo vigila
  el gate `maqueta-vocabulario` contra `fuentes/cobertura.json`.
- Diagrama: tamaños propios, piso de 12 px a escala 1 (`diagramador-tokens.md` § 8.2).

### 3.4 Espacio, radios, filetes y sombras

| Token             | Valor                                                      | Uso                                                                     |
| ----------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| `--e-1` … `--e-7` | 4 · 8 · 12 · 16 · 24 · 32 · 48 px                          | toda distancia sale de esta escala                                      |
| `--radio-control` | 6 px                                                       | botones, conmutadores, selector                                         |
| `--radio-caja`    | 8 px                                                       | bandas, fichas, paneles                                                 |
| píldora           | 999 px                                                     | vigencia, estados                                                       |
| filete            | 1 px `linea` entre secciones · 1 px `tinta-2` en controles |                                                                         |
| **sombras**       | **ninguna**                                                | la elevación es un paso de superficie (`sup-1` → `sup-2`) más un filete |

Página: ancho máximo 1280 px; margen lateral 16 px en teléfono y 32 px desde 720 px.

### 3.5 Movimiento

| Movimiento                        | Duración / curva                    | Dónde                                     | Con «reducir movimiento»                          |
| --------------------------------- | ----------------------------------- | ----------------------------------------- | ------------------------------------------------- |
| Cambio de estado de un control    | 120 ms, ease                        | subrayado de pestañas, alternadores, foco | igual (es un cambio de color, no de forma)        |
| Sombras de borde del lienzo       | 120 ms, opacidad                    | `lienzo-marco` al deslizar                | igual                                             |
| Desplazamiento al elegir una capa | `scroll-behavior: smooth`           | índice de capas                           | salto instantáneo (`auto`)                        |
| Recorrido: avance de paso         | 240–320 ms, ease, opacidad y grosor | `atlas-recorrido.html`                    | sin transición: el atributo cambia y el CSS pinta |
| Recorrido: línea activa «fluye»   | 1,2 s lineal, `stroke-dashoffset`   | solo mientras se reproduce                | la hoja `recorrido-animacion.css` **no se carga** |
| Reproducción automática           | un paso cada 2 s                    | botón «Reproducir»                        | el botón **no existe**                            |
| Indicador de carga                | 1,4 s lineal, rotación              | estado «Simulación en curso»              | estático: la barra de progreso basta              |

Reglas: solo `opacity`, `stroke-*` y `transform`; nada arranca solo salvo la reproducción que el
usuario pidió; **la forma del árbol jamás depende de la preferencia de movimiento** (regla de
desarrollo 5-a): el SVG del recorrido es el mismo con y sin movimiento; cambia una hoja CSS con
`media="(prefers-reduced-motion: no-preference)"` (G12, `diagramador-tokens.md` § 15).

## 4. Estados: siempre símbolo + texto (+ días)

| Estado                        | Forma                                                                                     | Ejemplo                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Vigente                       | píldora de contorno 1 px + marca de verificación dibujada                                 | «vigente · verificado hace 6 días»                                |
| Por revisar                   | píldora de contorno 2 px + «!» dibujado                                                   | «por revisar · 2 bloques, el más antiguo con 34 días»             |
| Vencido                       | píldora llena de tinta, texto en el color de la superficie + aspa dibujada                | «vencido · 1 bloque con 63 días»                                  |
| Seleccionado / actual         | subrayado de 2 px + negrita (controles); borde de 2 u en `tinta-1` (nodo)                 | pestaña activa, alternador, nodo con ficha abierta                |
| Pendiente (aún no existe)     | texto `tinta-2`, cursor «no permitido», `aria-disabled`                                   | pestañas y secciones que llegan en otras miradas                  |
| Foco                          | contorno de 2 px en `tinta-1` a 3 px del borde; en el diagrama, borde de 2 u              |                                                                   |
| Madurez (no disponible)       | medidor de llenado 0–4 + texto; retirado = vacío y tachado; anunciado = contorno punteado | «vista previa», «beta», «anunciado»                               |
| Vacío                         | caja punteada dibujada + título + qué hacer                                               | «Sin casos todavía · Crea el primero desde “Caso”»                |
| Carga                         | anillo (gira solo sin «reducir movimiento») + qué corre + cuánto lleva en mono + barra    | «Simulación en curso · 2 400 / 10 000 · semilla»                  |
| Error                         | círculo lleno con aspa + título + causa + **campo e id** en mono; `role="alert"`          | «La base no carga · evidencias/ev-0142.yaml · fecha_verificacion» |
| Campo inválido                | borde de 1,5 px en `tinta-1` + aviso con aspa + `aria-invalid`                            | «Debe ser un entero.»                                             |
| Cita no verificada            | filete izquierdo punteado + «cita no verificada» en mono con aspa                         | tarjeta de propuesta                                              |
| Prioridad alta sin mitigación | fila sobre `sup-1` + «sin mitigación» con aspa                                            | tabla de prioridad de acción                                      |

Vacío, carga y error se diseñan en las miradas 3 y 4, con la misma regla.

## 5. Componentes canon (v0.2: los del atlas, nivel 1, dirección B)

**Principio del cromo:** sin píldoras ni rellenos; lo activo se marca con **subrayado de 2 px y
negrita**, lo secundario con `tinta-2`, las secciones con **filetes de 1 px** en `linea`. El aire
hace la jerarquía.

| Componente                                                       | Anatomía                                                                                                                           | Estados                                         | Dónde se ve             |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------- |
| **Barra de la app**                                              | signo + «Big-D» + sello de sección en mono · navegación en texto · alternadores «ES / EN» y «Oscuro / Claro» en mono               | actual (subrayado 2 px + negrita) · pendiente   | `atlas-nivel-1.html`    |
| **Alternador**                                                   | dos palabras en mono separadas por «/»; 36 px de alto mínimo                                                                       | presionado = negrita + subrayado                | idioma, tema            |
| **Encabezado de página**                                         | ojo en mono · h1 · subtítulo · línea de metadatos en mono                                                                          | vigente · por revisar · vencido (marca + texto) | cabeza del atlas        |
| **Botón de enlace**                                              | texto 600 con línea inferior de 1,5 px                                                                                             | —                                               | «Cambiar de plataforma» |
| **Pestañas de nivel**                                            | fila con filete inferior; número en mono + nombre; se desliza en teléfono                                                          | actual · pendiente                              | bajo el encabezado      |
| **Lienzo del atlas**                                             | marco de 1 px sobre `sup-1` con rejilla punteada; desplazamiento lateral; índice de capas, sombras de borde y pista cuando no cabe | cabe · desborda                                 | el diagrama             |
| **Ficha breve**                                                  | bloque con filete izquierdo de 2 px sobre `sup-1`                                                                                  | oculta · abierta tras tocar un bloque           | bajo el lienzo          |
| **Leyenda**                                                      | dos listas con filetes: glifo + código en mono + nombre; muestras de línea + marcador                                              | —                                               | bajo el lienzo          |
| **Lectura en texto**                                             | `details` plegado con la lista banda → bloque → envíos                                                                             | plegada · abierta                               | al final                |
| **Banda, bloque, flujo, etiqueta, franja, referencia, insignia** | gramática del diagramador, dirección B                                                                                             | ver `diagramador-tokens.md`                     | el diagrama             |

**Componentes de las miradas 2 a 4 (vistos en `kit.html`):**

| Componente                       | Anatomía                                                                                                                                                                 | Estados                                                                | Dónde se ve            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ---------------------- |
| **Nodo (nivel 2)**               | tarjeta 152 × 84 con filete de tipo, glifo, nombre (≤ 3 líneas), madurez si no es disponible, «N fuentes»                                                                | normal · con ficha abierta (borde 2 u) · atenuado (recorrido)          | `atlas-nivel-2.html`   |
| **Ficha de nodo**                | tipo · nombre · frase de líder · qué hace · por qué importa · términos (propios y del glosario, marcados) · madurez · fuentes con fecha y tipo · verificado / consultado | cerrada · abierta (hoja inferior < 900 px, panel lateral desde 900 px) | nivel 2                |
| **Paso de recorrido**            | insignia numerada sobre el nodo (6a/7a/6b en la rama) + marca de bifurcación; lista de pasos con líder y experto                                                         | estático · activo · visitado · pendiente (atenuado) · animando         | `atlas-recorrido.html` |
| **Controles del recorrido**      | Anterior · «Paso n de 8» · Siguiente · Reproducir/Pausar · Ver todos; flechas del teclado                                                                                | reproduciendo (`aria-pressed`) · sin botón con movimiento reducido     | recorrido              |
| **Lado a lado**                  | filas por plataforma, columnas por banda (9), bloque mini 118 × 64; bloque punteado «sin componentes»; selector N; paginación de 3 en 3                                  | tres · página 2 · diferencias · una banda a la vez (< 900 px)          | `lado-a-lado.html`     |
| **Marca de diferencia**          | píldora glifo + palabra sobre el bloque: + nuevo · − retirado (llena) · → renombrado · ▮ madurez                                                                         | —                                                                      | lado a lado            |
| **Tarjeta de evidencia**         | código · semáforo · estado · afirmación · cita entre « » · fuente con fecha y tipo · madurez · conflicto de interés · verificación por código en mono                    | aprobada · propuesta (borde punteado) · cita no verificada             | kit; miradas 3         |
| **Control de peso**              | nombre · valor en mono · barra con rango relativo (banda), punto y línea punteada de inversión · rango, inversión y origen                                               | normal · suma ≠ 100 (aviso con aspa)                                   | kit; mirada 3          |
| **Tabla de prioridad de acción** | riesgo · S O D en mono · prioridad (píldora: alta llena de borde, media, baja punteada) · mitigación                                                                     | alta sin mitigación (fila sobre `sup-1` + aviso)                       | kit; mirada 4          |
| **Campo**                        | etiqueta en mono mayúsculas · entrada sobre `sup-1` con línea inferior en `tinta-2` · aviso                                                                              | normal · inválido · selector con chevrón dibujado                      | kit; miradas 3–4       |
| **Estado vacío / carga / error** | glifo dibujado + título + explicación (+ progreso o campo e id en mono)                                                                                                  | ver § 4                                                                | kit; miradas 3–4       |
| **Botón**                        | principal lleno de tinta · secundario en contorno · deshabilitado al 45 %; 40 px de alto, esquina 4 px                                                                   | normal · presionado · deshabilitado                                    | todas                  |

## 6. Iconografía

- **Cero emojis y cero íconos de terceros.** Todo glifo es un path propio: los 8 tipos, los 4
  marcadores de modo, las marcas de estado y el medidor de madurez (`diagramador-tokens.md` §§ 6–7).
- **Cero logos de fabricantes y cero colores de marca** (regla dura 5). Los nombres comerciales se
  usan solo para identificar, con la nota de marcas en la leyenda.
- Controles: chevrón de 12 px dibujado.

## 7. Accesibilidad

### 7.1 Contrastes medidos (gate `paleta-diagramador`)

| Par                                             | Oscuro | Claro  | Mínimo |
| ----------------------------------------------- | ------ | ------ | ------ |
| `tinta-1` sobre `sup-1`                         | 15,2:1 | 16,6:1 | 4,5:1  |
| `tinta-2` sobre `sup-1`                         | 9,7:1  | 9,6:1  | 4,5:1  |
| `tinta-2` sobre `fondo`                         | 10,3:1 | 9,1:1  | 4,5:1  |
| `tinta-1` sobre el relleno de nodo más exigente | 11,8:1 | 15,0:1 | 4,5:1  |
| `tinta-2` sobre el relleno de nodo más exigente | 7,5:1  | 8,7:1  | 4,5:1  |
| trazo de tipo más débil sobre `sup-1`           | 5,2:1  | 3,3:1  | 3:1    |

### 7.2 Tintas vetadas como texto

**`tinta-3` y `linea` nunca colorean texto** (3,9:1 y 1,7:1 en oscuro). Lo vigilan dos gates que
corren con `pnpm test`: `paleta-diagramador` comprueba que de verdad no llegan a 4,5:1, y
`maqueta-vocabulario` falla si una regla `color:` o un `<text fill>` las usa.

### 7.3 Reglas

- Bilingüe en todo: `<span lang="es">` y `<span lang="en">` pareados; el `lang` del documento cambia
  con el conmutador (regla 20).
- El color nunca va solo (regla dura 13). Se comprueba en capturas con escala de grises,
  deuteranopía, protanopía y tritanopía, en los dos temas.
- 380 px sin desplazamiento horizontal: lo mide el arnés de capturas en cada página.
- Blancos de toque de 32 px como mínimo en controles.
- Colores forzados: el diagrama pasa a `Canvas` y `CanvasText` y conserva glifo, trazo y texto.

## 8. Anti-patrones prohibidos

- Logos o íconos de fabricantes, colores de marca, una plataforma al centro del dibujo.
- Color como única señal. Rojo contra verde para decir bien y mal.
- Emojis; caracteres fuera de la fuente (✓ ✕ ▶ → β) como texto.
- Calcos de traducción automática: «casa del lago» por _lakehouse_, «lago de datos» por _data lake_.
- Sombras, degradados, cristal, brillo, partículas en el recorrido.
- Rejillas de tarjetas idénticas; cifras gigantes sin su evidencia; un «3» cableado en una vista.
- Radios mayores de 8 px en cajas; `tinta-3` o `linea` como color de texto.
- Animación que arranca sola o que decide qué elementos existen.

## 9. Contrato con el código futuro

- `tokens.css` pasa tal cual a `src/app/` y se mapea 1:1 al `@theme` de Tailwind v4
  (`--color-fondo`, `--color-tinta-1`, …). El generador sigue siendo la fuente.
- **Tema:** atributo `data-theme` en `<html>` (`oscuro` | `claro`); sin atributo, manda
  `prefers-color-scheme` y, si no hay preferencia, oscuro.
- **Fuentes:** los woff2 de `docs/diseno/assets/fuentes/` se sirven desde el mismo sitio. El
  `layout.tsx` del estampado usa Geist por `next/font/google`: el S1 lo reemplaza por Space Grotesk,
  porque la fuente del sitio debe ser la de la tabla de métricas (G15).
- **Textos:** las cadenas ES/EN de la maqueta son la base del diccionario de la interfaz.

## 10. Deuda de diseño

- La barra de sala de diseño está solo en español: es cromo de la maqueta, no producto.
- Pantallas 5 a 11 (conocimiento, caso, comparación, decisiones, informe, instrumento): sus
  componentes ya están en el kit; las pantallas llegan en las miradas 3 y 4.
- El selector de plataformas del lado a lado no filtra en la maqueta (las casillas son estáticas).
- El nivel 2 en teléfono muestra el mapa entero deslizable; una vista «una capa a la vez» para el
  nivel 2 no se diseñó (P10 se mide en el piloto).

## 11. Registro de cambios

| Versión | Fecha      | Cambio                                                                                                                                                                                                                                                                   |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0.3.0   | 2026-09-26 | Mirada 2: componentes canon completos (nodo, ficha, paso, lado a lado, diferencia, evidencia, control de peso, prioridad de acción, campo, estados vacío/carga/error, botón), tabla de movimiento con su variante reducida, estados ampliados, deuda al día. `kit.html`. |
| 0.2.0   | 2026-09-26 | Ronda 4 de la mirada 1: Space Grotesk + JetBrains Mono (elección del usuario), cromo sin píldoras (filetes, texto y aire), componentes del atlas en la dirección B, lienzo con desplazamiento lateral.                                                                   |
| 0.1.1   | 2026-09-26 | Ronda 2 de la mirada 1: paleta de un matiz por tipo, claro en papel frío casi blanco; el diagrama es siempre horizontal (P5 del usuario). La dirección visual está por elegir.                                                                                           |
| 0.1.0   | 2026-09-26 | Borrador para la mirada 1: personalidad, tesis, tokens de los dos temas, tipografía, espacio, movimiento, estados y los componentes del atlas nivel 1                                                                                                                    |
