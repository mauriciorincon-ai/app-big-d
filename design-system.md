---
version: 0.5.1
estado: completo para la mirada 4 (el H1 entero, Etapa de Diseño, F2a); se sella en G-Diseño
fecha: 2026-09-26
fuente_en_codigo: docs/diseno/assets/ (tokens.css GENERADO · bigd.css · diagrama.css · fuentes.css)
gramatica_del_diagrama: docs/diseno/diagramador-tokens.md
---

# Big-D — design system

> **Fuente de verdad visual de Big-D.** Versión 0.5.2: completa para la mirada 4 (el H1 entero), con la portada rehecha tras G-Diseño, con todos los
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
| `linea`   | `#383e45` | `#d1d5d9` | filetes que separan secciones, guías y rejillas (**vetada como texto**) |
| `tinta-1` | `#e8ebf1` | `#161b21` | texto principal, títulos, marcas, foco, fondo de lo seleccionado |
| `tinta-2` | `#b9bec6` | `#3d434a` | texto secundario, flujos, bordes de control                      |

Oscuro: superficie azul negra fría, tinta clara. Claro: papel frío casi blanco, tinta azul negra (ronda 2; la ronda 1 usaba un crema cálido).

### 3.2 Color — tipos de componente

Un matiz propio por tipo, con claridad por tema (ronda 2). Tabla completa, método, umbral y medidas en
`diagramador-tokens.md` § 5. Resumen: azul (ingesta), violeta (almacenamiento), naranja
(transformación), rojo (gobierno), verde (consumo), magenta (IA), pizarra casi neutro (externo) y
cian (operación). El matiz pinta el filete, el glifo y el trazo; las tarjetas van en `sup-2` y el texto
siempre en tinta (no hay rellenos tintados: se retiraron con la dirección B).

### 3.3 Tipografía

**Space Grotesk** (interfaz y diagrama) y **JetBrains Mono** (huellas, fechas, versiones, códigos,
comandos, números de capa, ojos de sección). Elegida por el usuario en la mirada 1 (ronda 3) entre
Manrope, Space Grotesk y Onest; Atkinson Hyperlegible (rondas 1–2) fue rechazada. Ambas SIL OFL 1.1,
variables `wght`, subconjunto latino servido desde el sitio.

| Rol                                   | Familia        | Tamaño / línea                                        | Peso             |
| ------------------------------------- | -------------- | ----------------------------------------------------- | ---------------- |
| Título de página (h1)                 | Space Grotesk  | 32 / 35 en teléfono · 46 / 51 desde 720 px, −0,025 em | 700 (la cara servida llega a 700) |
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
| `--e-1` … `--e-7` | 4 · 8 · 12 · 16 · 24 · 32 · 48 px                          | **escala objetivo del S1** (`@theme`). La maqueta usa además 10 · 14 · 18 · 22 · 28 px (medido en `bigd.css`); el S1 los lleva al paso más cercano o declara el paso nuevo |
| `--radio-control` | 4 px                                                       | botones, conmutadores, selector (lo que se aprobó en la maqueta)        |
| `--radio-caja`    | 8 px como máximo                                           | bandas, fichas, paneles, hoja inferior                                  |
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
| Reproducción automática           | un paso cada 2 s                    | botón «Reproducir»                        | el botón sigue en el DOM y el CSS lo oculta (`display: none` bajo `prefers-reduced-motion: reduce`): el árbol no cambia (regla 5-a) |
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
| Deshabilitado                 | botón al 45 %, cursor «no permitido», `disabled`, con el motivo escrito al lado            | «Aprobar perfil» mientras la suma ≠ 100                          |
| Foco                          | contorno de 2 px en `tinta-1` a 3 px del borde; en el diagrama, el borde **suma** al menos 1 u al de reposo (jamás lo reduce: una vía 2,5 → 4) |                                                                   |
| Madurez (no disponible)       | medidor de llenado 0–4 + texto; retirado = vacío y tachado; anunciado = contorno punteado | «vista previa», «beta», «anunciado»                               |
| Vacío                         | caja punteada dibujada + título + qué hacer                                               | «Sin casos todavía · Crea el primero desde “Caso”»                |
| Carga                         | anillo (gira solo sin «reducir movimiento») + qué corre + cuánto lleva en mono + barra    | «Simulación en curso · 2 400 / 10 000 · semilla»                  |
| Error                         | círculo lleno con aspa + título + causa + **campo e id** en mono; `role="alert"`          | «La base no carga · evidencias/ev-0142.yaml · fecha_verificacion» |
| Campo inválido                | borde de 1,5 px en `tinta-1` + aviso con aspa + `aria-invalid`                            | «Debe ser un entero.»                                             |
| Cita no verificada            | filete izquierdo punteado + «cita no verificada» en mono con aspa                         | tarjeta de propuesta                                              |
| Prioridad alta sin mitigación | fila sobre `sup-1` + «sin mitigación» con aspa                                            | tabla de prioridad de acción                                      |

Carga («simulación en curso», comparación) y error («error de carga», base) tienen pantalla; el vacío
solo vive en el kit (deuda del S1: la primera pantalla sin datos lo usa).

## 5. Componentes canon del atlas (desde v0.2, dirección B)

**Principio del cromo:** sin píldoras ni rellenos; lo activo se marca con **subrayado de 2 px y
negrita**, lo secundario con `tinta-2`, las secciones con **filetes de 1 px** en `linea`. El aire
hace la jerarquía.

| Componente                                                       | Anatomía                                                                                                                           | Estados                                         | Dónde se ve             |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------- |
| **Barra de la app**                                              | signo + «Big-D» + sello de sección en mono · navegación en texto · alternadores «ES / EN» y «Oscuro / Claro» en mono               | actual (subrayado 2 px + negrita)               | `atlas-nivel-1.html`    |
| **Alternador**                                                   | dos palabras en mono separadas por «/»; 36 px de alto mínimo                                                                       | presionado = negrita + subrayado                | idioma, tema            |
| **Encabezado de página**                                         | ojo en mono · h1 · subtítulo · línea de metadatos en mono                                                                          | vigente · por revisar · vencido (marca + texto) | cabeza del atlas        |
| **Botón de enlace**                                              | texto 600 con línea inferior de 1,5 px                                                                                             | —                                               | «Cambiar de plataforma» |
| **Pestañas de nivel**                                            | fila con filete inferior; número en mono + nombre; se desliza en teléfono                                                          | actual                                          | bajo el encabezado      |
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
| **Controles del recorrido**      | Anterior · «Paso n de N» (N sale del mapa) · Siguiente · Reproducir/Pausar · Ver todos; flechas del teclado (no cuando el foco está en el lienzo, que las usa para deslizar) | reproduciendo (`aria-pressed`) · con movimiento reducido, «Reproducir» oculto por CSS (mismo árbol) | recorrido              |
| **Lado a lado**                  | filas por plataforma, columnas por banda (9), bloque mini 118 × 64; bloque punteado «sin componentes»; selector N; paginación de 3 en 3                                  | tres · componentes de un bloque · página 2 · diferencias · una banda a la vez (< 900 px) | `lado-a-lado.html`     |
| **Ficha de bloque**              | al tocar un bloque del lado a lado: banda · plataforma · nombre · «N componentes» · tipo · componentes como **tarjetas de nodo** · versión y vigencia; panel lateral en ancho, desplegable bajo la fila en teléfono | abierta · cerrada (Esc)                                                | lado a lado            |
| **Tarjeta de nodo (HTML)**       | el nodo del nivel 2 fuera del lienzo: filete izquierdo de 4 px del color del tipo + glifo + nombre en negrita + pie con medidor y madurez (si no es disponible) y fuentes con glifo de documento | —                                                                      | lado a lado (ficha y teléfono) |
| **Componentes desplegados**      | conmutador «Ver: bloques / componentes»; cada celda = nombre del bloque (12/700, tinta-2, hasta 2 líneas) + pila de nodos 152 × 88 a 8 u; columnas alineadas por banda; la fila mide su celda más alta; paginación igual | bloques · componentes · página 2 · en teléfono todas las filas desplegadas | lado a lado            |
| **Marca de diferencia**          | píldora glifo + palabra sobre el bloque: + nuevo · − retirado (llena) · → renombrado · ▮ madurez                                                                         | —                                                                      | lado a lado            |
| **Tarjeta de evidencia**         | código · semáforo · estado · afirmación · cita entre « » · fuente con fecha y tipo · madurez · conflicto de interés · verificación por código en mono                    | aprobada · propuesta (borde punteado) · cita no verificada             | kit; miradas 3         |
| **Control de peso**              | nombre · valor en mono · barra con rango relativo (banda), punto y línea punteada de inversión · rango, inversión y origen                                               | normal · suma ≠ 100 (aviso con aspa)                                   | kit; mirada 3          |
| **Tabla de prioridad de acción** | riesgo · S O D en mono · prioridad (píldora: alta llena de borde, media, baja punteada) · mitigación                                                                     | alta sin mitigación (fila sobre `sup-1` + aviso)                       | kit; mirada 4          |
| **Campo**                        | etiqueta en mono mayúsculas · entrada sobre `sup-1` con línea inferior en `tinta-2` · aviso                                                                              | normal · inválido · selector con chevrón dibujado                      | kit; miradas 3–4       |
| **Estado vacío / carga / error** | glifo dibujado + título + explicación (+ progreso o campo e id en mono)                                                                                                  | ver § 4                                                                | kit; miradas 3–4       |
| **Semáforo por capa**            | fila por banda: número · nombre · «N evidencias · verificada hace N días» · píldora de vigencia; la capa vencida abre el bloque de comando                              | vigente · por revisar · vencido (con comando)                          | `investigador.html`    |
| **Bloque de comando**            | código en mono sobre sup-2 + botón «Copiar» + nota de dónde se ejecuta (Claude Code, por el curador; jamás la app)                                                       | —                                                                      | investigador           |
| **Afirmación de propuesta**      | código · marca de diff (nuevo / renombrado) · estado (por revisar, aprobada, rechazada) · afirmación · cita en « » · veredicto del verificador en mono · fuente y conflicto de interés · Aprobar / Rechazar | por revisar · aprobada · rechazada por código (tachada, borde punteado) | investigador           |
| **Ficha de corrida**             | run-id en mono · fecha · modelo declarado · validador · fuentes consultadas                                                                                              | —                                                                      | investigador           |
| **Veredicto**                    | caja con filete de tinta: símbolo + título + explicación + datos en mono (empate técnico, ganadora clara, sin novedades, huella verificada, perfil aprobado)              | —                                                                      | investigador · base · perfil · comparación |
| **Error de carga**               | estado de error con lista mono `archivo:línea:col · id · campo · regla`, filete izquierdo de tinta; «qué pasa mientras tanto»                                            | —                                                                      | `base.html`            |
| **Tabla de instantáneas**        | fecha · huella (prefijo en tinta, resto en tinta-2) · conteos · «Verificar huella» / «Ver diferencias»; insignia «vigente»                                               | verificada                                                             | base                   |
| **Lista de pesos**               | fila por criterio: nombre + origen · valor en mono grande · barra con rango (±20 %) y punto · rango en mono; estrella dibujada = esencial; caja de suma arriba            | suma 100 · suma ≠ 100 (aspa + texto) · rango abierto (aviso)           | `perfil.html`          |
| **Restricción eliminatoria**     | enunciado + origen · insignia llena «elimina: plataforma» o suave «todas la cumplen»                                                                                     | elimina · cumplida                                                     | perfil                 |
| **Decisión implícita**           | tarjeta con pregunta, opciones de radio con consecuencia en pequeño; «sin responder» bloquea la aprobación                                                                | sin responder · respondida                                             | perfil                 |
| **Sello de aprobación**          | recuadro de 2 px, mono mayúsculas, símbolo ✓; fecha, quién y versión al lado                                                                                             | —                                                                      | perfil                 |
| **Totales**                      | fila por plataforma: puesto · nombre · mínimo de esenciales y evidencia limitante · barra 0–100 con línea discontinua de la banda de empate · total en mono grande        | líder · resto                                                          | `comparacion.html`     |
| **Matriz de puntajes**           | criterio (estrella = esencial) · peso · n/4 por plataforma; subrayado = mejor; recuadro punteado = evidencia limitante; fila de totales; escala 0–4 plegada             | —                                                                      | comparación            |
| **Control de sensibilidad**      | el control de peso con dos marcas: inversión (discontinua) y salida del empate (punteada) · lista de consecuencias · tabla de totales por valor                          | —                                                                      | comparación            |
| **Aceptabilidad por posición**   | tabla plataforma × puesto con barra mini + porcentaje; recuadro punteado = zona gris; umbrales declarados en mono; vector central en tarjeta                             | sólida · moderada · moderada (frontera) · frágil — la maqueta muestra **sólida**, que es lo que el caso produce; la zona gris y las otras clases aparecen solo cuando la simulación las da (no se escriben a mano) | comparación            |
| **Pros y contras**               | tarjeta por plataforma: «Se destaca» (✓) y «Se queda corta» (✕), contra la escala y la mejor; nunca contra el promedio                                                   | —                                                                      | comparación            |
| **Diagrama de ondas**            | columnas = ondas de Kahn (224 u a 72 u) con título mono y subtítulo; tarjeta de decisión 224 × 112; «depende de» = línea con punta, ruteo ortogonal por los huecos, carril superior (saltos en la primera fila) e inferior; cero cruces medidos | ondas · ciclo (columna «sin onda», aristas del ciclo en tinta discontinua) | `decisiones.html`      |
| **Tarjeta de decisión**          | reversibilidad = glifo + palabra + borde (una vía: 2,5 px de tinta; costosa: discontinuo; dos vías: filete) · estado a la derecha · pregunta 14/700 · pie con «implícita» (!) y «supuesto sin probar» | pendiente · espera una prueba · decidida · en ciclo · sin onda | decisiones            |
| **Ficha de decisión**            | reversibilidad y su tratamiento · estado · dependencias · opciones por plataforma (la eliminada, tachada) · opción recomendada · supuestos · riesgos | —                                                                      | decisiones (panel)     |
| **Tabla de riesgos**             | riesgo (modo + efecto) · decisión · S O D · prioridad de acción · RPN en tinta-2 · mitigación con responsable y momento · residual con cambio de categoría; orden prioridad → severidad → RPN; tabla v0 plegada | alta sin mitigación (fila resaltada + alerta con «Agregar mitigación») | decisiones            |
| **Tarjeta de supuesto**          | id · estado · criticidad · enunciado · prueba barata · tarea para (responsable, vence, costo) · decisión que sostiene | sin probar (borde discontinuo + alerta) · confirmado · refutado (tachado + «la decisión se reabre») | decisiones            |
| **Fases e ítems**                | columna por fase (filete superior de tinta) · ítem: id, tipo con glifo (tarea / verificación), estado, descripción, «viene de» con píldoras de origen, «cumplido cuando» | pendiente · hecho (tachado) · bloqueado (borde discontinuo + motivo) | `informe.html`         |
| **Píldora de origen**            | «decisión X · una vía» · «mitigación de R-n» · «supuesto X»; ningún ítem sin origen | —                                                                      | informe                |
| **Cadena de trazabilidad**       | ítem ← decisión ← supuesto ← prueba barata, una fila por eslabón con su estado | —                                                                      | informe                |
| **Informe**                      | índice de 14 secciones (fijo en ancho) · cabecera con huella · secciones numeradas en mono · resumen de líder con su presupuesto medido · relato de fracaso en cursiva con autoría humana · alertas · ficha de reproducibilidad | en pantalla · vista de impresión | informe                |
| **Vista de impresión**           | papel claro en cualquier tema (clase `tema-claro`, generada en tokens.css), ancho A4, filete de 2 px en lugar de sombra, cabecera de página, saltos marcados; `@media print` usa la misma hoja | —                                                                      | informe                |
| **Fila de validación**           | símbolo + enunciado + detalle (esperado/obtenido, casos y semilla, referencia) | detectado · no detectado (recuadro discontinuo + causa + qué se corrige) | `instrumento.html`     |
| **Bloqueo de publicación**       | salida de terminal en mono + «No se publica» + qué no se publica, qué sigue vigente y cómo destrabar | —                                                                      | instrumento            |
| **Mapa del recorrido**           | etapas como bandas (ojo «Etapa n», nombre, pregunta) con flecha entre ellas · pantallas como nodos (miniatura decorativa, número, nombre, una frase, códigos de la VISION) · transversales abajo, a todo lo ancho. En ancho las bandas comparten filas (subgrid) y quedan alineadas; debajo de 1200 px se apilan con la flecha hacia abajo | ancho · apilado · teléfono | `index.html`           |
| **Botón**                        | principal lleno de tinta · secundario en contorno · deshabilitado al 45 %; 40 px de alto, esquina 4 px                                                                   | normal · presionado · deshabilitado                                    | todas                  |

## 6. Iconografía

- **Cero emojis y cero íconos de terceros.** Todo glifo es un path propio: los 8 tipos, los 4
  marcadores de modo, las marcas de estado y el medidor de madurez (`diagramador-tokens.md` §§ 6–7).
- **Cero logos de fabricantes y cero colores de marca** (regla dura 5). Los nombres comerciales se
  usan solo para identificar. La **nota de marcas** junto a la leyenda y el **selector de plataforma
  del atlas** (N, orden por identificador, nombres en uso nominativo) no se dibujaron en la maqueta: se
  diseñan en el S1, el primer sprint con nombres reales (§ 10).
- Controles: chevrón de 12 px dibujado.

## 7. Accesibilidad

### 7.1 Contrastes medidos (gate `paleta-diagramador`)

| Par                                             | Oscuro | Claro  | Mínimo |
| ----------------------------------------------- | ------ | ------ | ------ |
| `tinta-1` sobre `sup-1`                         | 15,2:1 | 16,6:1 | 4,5:1  |
| `tinta-2` sobre `sup-1`                         | 9,7:1  | 9,6:1  | 4,5:1  |
| `tinta-2` sobre `fondo`                         | 10,3:1 | 9,1:1  | 4,5:1  |
| `tinta-1` sobre la tarjeta del nodo (`sup-2`)   | 13,6:1 | 17,3:1 | 4,5:1  |
| `tinta-2` sobre la tarjeta del nodo (`sup-2`)   | 8,7:1  | 10,0:1 | 4,5:1  |
| trazo de tipo más débil sobre `sup-1`           | 5,2:1  | 3,1:1  | 3:1    |

### 7.2 Tintas vetadas como texto

**`linea` nunca colorea texto** (1,7:1 en oscuro, 1,4:1 en claro). Lo vigilan dos gates que
corren con `pnpm test`: `paleta-diagramador` comprueba que de verdad no llega a 4,5:1, y
`maqueta-vocabulario` falla si una regla `color:` o un `<text fill>` las usa.

### 7.3 Reglas

- Bilingüe en todo: `<span lang="es">` y `<span lang="en">` pareados; el `lang` del documento cambia
  con el conmutador (regla 20).
- El color nunca va solo (regla dura 13). Se comprueba en capturas con escala de grises,
  deuteranopía, protanopía y tritanopía, en los dos temas.
- 380 px sin desplazamiento horizontal: lo mide el arnés de capturas en cada página.
- Blancos de toque de 32 px como mínimo en controles.
- Colores forzados: el diagrama pasa a `Canvas` y `CanvasText` y conserva glifo, trazo y texto; la
  insignia «vencido» se invierte (fondo `CanvasText`, texto `Canvas`) y la doble línea de «sin copia»
  conserva su hueco.
- Saltos: «Saltar al contenido» es el primer foco de cada página y cada diagrama lleva «Saltar el
  diagrama» hacia su lectura en texto (G10).
- Ficha (hoja o panel): al abrir, el foco va a su título; Esc o «Cerrar» lo devuelven al nodo de
  origen (así en la maqueta). Contrato del S1: en teléfono es un diálogo modal (`role="dialog"`,
  `aria-modal`, foco contenido); en ancho, una región complementaria no modal.

## 8. Anti-patrones prohibidos

- Logos o íconos de fabricantes, colores de marca, una plataforma al centro del dibujo.
- Color como única señal. Rojo contra verde para decir bien y mal.
- Emojis; caracteres fuera de la fuente (✓ ✕ ▶ → β) como texto.
- Calcos de traducción automática: «casa del lago» por _lakehouse_, «lago de datos» por _data lake_.
- Sombras, degradados, cristal, brillo, partículas en el recorrido. Dos degradados son funcionales y
  están declarados: la rejilla punteada del lienzo y las sombras de borde que avisan que el lienzo se
  desliza (`bigd.css`).
- Rejillas de tarjetas idénticas; cifras gigantes sin su evidencia; un «3» cableado en una vista.
- Radios mayores de 8 px en cajas; `linea` como color de texto.
- Animación que arranca sola o que decide qué elementos existen.

## 9. Contrato con el código futuro

- `tokens.css` pasa tal cual a `src/app/` y se mapea 1:1 al `@theme` de Tailwind v4
  (`--color-fondo`, `--color-tinta-1`, …). El generador sigue siendo la fuente.
- **Tema:** atributo `data-theme` en `<html>` (`oscuro` | `claro`); sin atributo, manda
  `prefers-color-scheme` y, si no hay preferencia, oscuro. En la maqueta cada página fija
  `data-theme="oscuro"` (tema primario) y el conmutador lo cambia: la rama `prefers-color-scheme` de
  `tokens.css` no se ejerce aquí; la prueba el S1.
- **Fuentes:** los woff2 de `docs/diseno/assets/fuentes/` se sirven desde el mismo sitio. El
  `layout.tsx` del estampado usa Geist por `next/font/google`: el S1 lo reemplaza por Space Grotesk,
  porque la fuente del sitio debe ser la de la tabla de métricas (G15).
- **Textos:** las cadenas ES/EN de la maqueta son la base del diccionario de la interfaz.

## 10. Deuda de diseño

- La barra de sala de diseño está solo en español: es cromo de la maqueta, no producto.
- El selector de plataformas del lado a lado no filtra en la maqueta (las casillas son estáticas).
- Nota de marcas y selector de plataforma del atlas: se diseñan en el S1 (§ 6).
- Estado vacío en contexto: solo existe en el kit (S1).
- Zona gris y clases «moderada» y «frágil» de la robustez: sin pantalla, porque el caso no las produce
  (se ven cuando la simulación las da).
- El nivel 2 en teléfono muestra el mapa entero deslizable; una vista «una capa a la vez» para el
  nivel 2 no se diseñó (P10 se mide en el piloto).

## 11. Registro de cambios

| Versión | Fecha      | Cambio                                                                                                                                                                                                                                                                   |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0.5.2   | 2026-09-27 | G-Diseño: la portada deja la rejilla de tarjetas iguales (antipatrón del § 8, y el usuario no la vio ordenada) y se dibuja con la gramática del atlas: cuatro etapas como bandas, nodos con miniatura de la pantalla y transversales abajo (D81). Fuera la «tarjeta de recorrido» y el estado de mirada por tarjeta: la aprobación va una sola vez, en la cabecera. |
| 0.5.1   | 2026-09-27 | Auditoría de la etapa: fuera los tokens sin uso (`tipo-N-tinte`, `tinta-3`); dos claridades del claro salen de la búsqueda sin el relleno retirado (naranja `#d27908`, rojo `#c74a4d`); espacio y radios declarados como escala objetivo del S1; h1 a 700; foco que suma al borde; saltos al contenido y al diagrama; contrato de foco de la ficha; «Reproducir» oculto por CSS con movimiento reducido; nota de marcas y selector del atlas pasan al S1; degradados funcionales declarados. La ficha del nivel 2 por fin abre (la página no cargaba su script). |
| 0.5.0   | 2026-09-26 | Mirada 4: decisiones y riesgos, hoja de ruta e informe, instrumento y recorrido (13 componentes nuevos). El tema claro se emite también para `.tema-claro` y `@media print` (papel siempre claro). Sombras siguen prohibidas: el papel se separa con filete. |
| 0.4.1   | 2026-09-26 | Ajuste de la mirada 3 (pedido del usuario): componentes desplegados visualmente en el lado a lado (vista «componentes» en el lienzo y tarjetas de nodo en la ficha y en teléfono). |
| 0.4.0   | 2026-09-26 | Mirada 3: componentes de conocimiento y caso (semáforo por capa, bloque de comando, afirmación de propuesta, ficha de corrida, veredicto, error de carga, instantáneas, lista de pesos, restricción, decisión implícita, sello, totales, matriz, control de sensibilidad, aceptabilidad, pros y contras). Navegación Conocimiento y Caso activa. |
| 0.3.1   | 2026-09-26 | Ajuste de la mirada 2 (pedido del usuario): ficha de bloque en el lado a lado, para ver cuáles son los componentes detrás de «N comp.».                                                                                                                                  |
| 0.3.0   | 2026-09-26 | Mirada 2: componentes canon completos (nodo, ficha, paso, lado a lado, diferencia, evidencia, control de peso, prioridad de acción, campo, estados vacío/carga/error, botón), tabla de movimiento con su variante reducida, estados ampliados, deuda al día. `kit.html`. |
| 0.2.0   | 2026-09-26 | Ronda 4 de la mirada 1: Space Grotesk + JetBrains Mono (elección del usuario), cromo sin píldoras (filetes, texto y aire), componentes del atlas en la dirección B, lienzo con desplazamiento lateral.                                                                   |
| 0.1.1   | 2026-09-26 | Ronda 2 de la mirada 1: paleta de un matiz por tipo, claro en papel frío casi blanco; el diagrama es siempre horizontal (P5 del usuario). La dirección visual está por elegir.                                                                                           |
| 0.1.0   | 2026-09-26 | Borrador para la mirada 1: personalidad, tesis, tokens de los dos temas, tipografía, espacio, movimiento, estados y los componentes del atlas nivel 1                                                                                                                    |
