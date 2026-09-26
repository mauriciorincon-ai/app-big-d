---
version: 0.1.0
estado: borrador para la mirada 1 (Etapa de Diseño, F2a)
fecha: 2026-09-26
fuente_en_codigo: docs/diseno/assets/ (tokens.css GENERADO · bigd.css · diagrama.css)
gramatica_del_diagrama: docs/diseno/diagramador-tokens.md
---

# Big-D — design system

> **Fuente de verdad visual de Big-D.** Esta es la versión 0.1: lo que la mirada 1 necesita para
> juzgar el atlas. La versión completa, con todos los componentes canon y sus estados, llega en la
> mirada 2 (`kit.html`). Lo que toca al diagrama vive en `docs/diseno/diagramador-tokens.md`,
> porque es contrato del reusable y no estilo de esta app.

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
| `fondo`   | `#0b0f14` | `#f1eee7` | fondo de página y de las bandas del diagrama                     |
| `sup-1`   | `#12161c` | `#f9f6f1` | barra de la app, lienzo del diagrama, tarjetas                   |
| `sup-2`   | `#1b2128` | `#fffdfa` | bloques, controles, etiquetas, paneles elevados                  |
| `linea`   | `#383e45` | `#cecac2` | filetes que separan secciones (**vetada como texto**)            |
| `tinta-1` | `#e8ebf1` | `#161b21` | texto principal, títulos, marcas, foco, fondo de lo seleccionado |
| `tinta-2` | `#b9bec6` | `#3d434a` | texto secundario, flujos, bordes de bloque y de control          |
| `tinta-3` | `#70757c` | `#878d94` | guías y rejillas (**vetada como texto**)                         |

Oscuro: superficie azul negra fría, tinta clara. Claro: papel cálido, tinta azul negra.

### 3.2 Color — tipos de componente

Ocho matices en cuatro familias, con claridad por tema. Tabla completa, método, umbral y medidas en
`diagramador-tokens.md` § 5. Resumen: azul (ingesta, almacenamiento), verde azulado
(transformación, IA), ocre (externo, consumo), rosa (gobierno, operación). Cada uno tiene su
relleno tintado (`tipo-N-tinte`) para los nodos del nivel 2.

### 3.3 Tipografía

| Rol                                           | Familia                    | Tamaño / línea                             | Peso      |
| --------------------------------------------- | -------------------------- | ------------------------------------------ | --------- |
| Título de página (h1)                         | Atkinson Hyperlegible Next | 26 / 31 en teléfono · 32 / 38 desde 720 px | 800       |
| Sección (h2)                                  | Next                       | 20 / 26                                    | 700       |
| Subsección (h3)                               | Next                       | 15 / 20                                    | 700       |
| Cuerpo                                        | Next                       | 16 / 24                                    | 400       |
| Secundario, migas, metadatos                  | Next                       | 14 / 20                                    | 400       |
| Controles                                     | Next                       | 13 a 15                                    | 600       |
| Huellas, fechas, versiones, comandos, códigos | Atkinson Hyperlegible Mono | 0,94 em                                    | 400 a 700 |

- **Por qué Atkinson:** distingue I/l/1 y O/0 sin rasgos OpenType, trae ñ ¿ ¡ y tildes, y es de
  licencia libre (SIL OFL 1.1). Detalle en `diagramador-tokens.md` § 8.
- **Sin cursiva:** solo se sirve la redonda. La cursiva sintética está prohibida.
- **Caracteres fuera de la fuente, prohibidos en texto.** La fuente no trae ✓ ✕ ▶ → β: se dibujan
  como SVG. Lo vigila el gate `maqueta-vocabulario`.
- Diagrama: tamaños propios, con piso de 12 px renderizado (`diagramador-tokens.md` § 8.2).

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

- **Casi nulo.** Solo `opacity` y `transform`, 120 ms (`--t-rapida`), por ejemplo el giro del
  chevrón del selector.
- **Reducir movimiento:** todas las duraciones a 0 ms. **La forma del árbol jamás depende del
  movimiento** (regla de desarrollo 5-a): el movimiento cambia propiedades, nunca qué se pinta.
- La animación del recorrido del dato es de la gramática: hoja aparte, solo con
  `prefers-reduced-motion: no-preference` (`diagramador-tokens.md` § 15).

## 4. Estados: siempre símbolo + texto (+ días)

| Estado                    | Forma                                                                          | Ejemplo                                               |
| ------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Vigente                   | píldora de contorno 1 px + marca de verificación dibujada                      | «vigente · verificado hace 6 días»                    |
| Por revisar               | píldora de contorno 2 px + «!» dibujado                                        | «por revisar · 2 bloques, el más antiguo con 34 días» |
| Vencido                   | píldora llena de tinta, texto en el color de la superficie + aspa dibujada     | «vencido · 1 bloque con 63 días»                      |
| Seleccionado              | fondo `tinta-1`, texto `sup-1`                                                 | pestaña de nivel activa, opción del conmutador        |
| Pendiente (aún no existe) | texto `tinta-2`, cursor «no permitido», `aria-disabled`                        | pestañas y secciones que llegan en otras miradas      |
| Foco                      | contorno de 2 px en `tinta-1` a 2 px del borde; en el diagrama, borde de 3,5 u |                                                       |

Vacío, carga y error se diseñan en las miradas 3 y 4, con la misma regla.

## 5. Componentes canon (v0.1: los del atlas, nivel 1)

| Componente                                   | Anatomía                                                                              | Estados                                                  | Dónde se ve                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------- |
| **Barra de la app**                          | marca «Big-D» + sello de sección en mono · navegación · conmutadores de idioma y tema | sección actual (subrayado de 2 px y negrita) · pendiente | `atlas-nivel-1.html`               |
| **Conmutador**                               | grupo de botones con borde de 1 px, 32 px de alto mínimo                              | presionado (`aria-pressed`) = lleno de tinta             | idioma ES/EN, tema Oscuro/Claro    |
| **Selector de plataforma**                   | `details` + lista; orden **alfabético** declarado dentro de la lista                  | abierto · actual · «mapa pendiente»                      | cabeza del atlas                   |
| **Pestañas de nivel**                        | 4 pestañas, número en mono; 2 × 2 en teléfono, en fila desde 720 px                   | actual · pendiente                                       | bajo el título                     |
| **Píldora de vigencia**                      | marca dibujada + texto con días                                                       | vigente · por revisar · vencido                          | estado del mapa                    |
| **Lienzo del atlas**                         | contenedor que elige disposición por su ancho (`container-type`)                      | ancho · angosto                                          | el diagrama                        |
| **Ficha breve**                              | panel con borde; cabecera + botón «Cerrar»                                            | oculta · abierta tras tocar un bloque                    | bajo el diagrama                   |
| **Leyenda**                                  | 4 grupos generados de la gramática + nota de marcas                                   | —                                                        | «Cómo leer el mapa»                |
| **Lectura en texto**                         | lista ordenada banda → bloque → envíos                                                | —                                                        | al final, con «Saltar el diagrama» |
| **Banda, bloque, flujo, etiqueta, insignia** | gramática del diagramador                                                             | ver `diagramador-tokens.md`                              | el diagrama                        |

**Llegan en la mirada 2 (`kit.html`):** nodo del nivel 2 con relleno tintado, ficha de nodo (hoja
inferior y panel lateral), paso de recorrido, tarjeta de evidencia, control de peso con rango
relativo, tabla de prioridad de acción, estados vacío, carga y error.

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
| `tinta-1` sobre `sup-1`                         | 15,2:1 | 16,1:1 | 4,5:1  |
| `tinta-2` sobre `sup-1`                         | 9,7:1  | 9,3:1  | 4,5:1  |
| `tinta-2` sobre `fondo`                         | 10,3:1 | 8,6:1  | 4,5:1  |
| `tinta-1` sobre el relleno de nodo más exigente | 12,4:1 | 15,0:1 | 4,5:1  |
| trazo de tipo más débil sobre `sup-1`           | 6,4:1  | 3,2:1  | 3:1    |

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
  `layout.tsx` del estampado usa Geist por `next/font/google`: el S1 lo reemplaza por Atkinson,
  porque la fuente del sitio debe ser la de la tabla de métricas (G15).
- **Textos:** las cadenas ES/EN de la maqueta son la base del diccionario de la interfaz.

## 10. Deuda de diseño

- La barra de sala de diseño está solo en español: es cromo de la maqueta, no producto.
- Componentes y estados de las pantallas 2 a 11: llegan en las miradas 2 a 4.

## 11. Registro de cambios

| Versión | Fecha      | Cambio                                                                                                                                                |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1.0   | 2026-09-26 | Borrador para la mirada 1: personalidad, tesis, tokens de los dos temas, tipografía, espacio, movimiento, estados y los componentes del atlas nivel 1 |
