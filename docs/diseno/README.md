# Etapa de Diseño — maqueta de fundación de Big-D (F2a)

> Este directorio se llena ANTES de cualquier código de producto. La orden de diseño de la
> planeadora (`portafolio/big-d/ordenes/DISENO-orden.md`) manda; este archivo registra el
> resultado. Regla dura: cero React, cero motores, cero `src/` de producto hasta que el usuario
> apruebe **G-Diseño** sobre la maqueta desplegada en Vercel.

## Cómo abrir la maqueta

- **En el preview de Vercel del PR** (protegido: pide tu sesión): ruta `/diseno/index.html`.
- **En local**: doble clic en `docs/diseno/index.html` (sin red, sin build), o `pnpm build && pnpm start`
  y `http://localhost:3000/diseno/index.html`.
- Cada pantalla trae su barra de sala: **estado · tema · idioma**. La nota bajo la barra dice qué mirar.

## Qué vive aquí

- `index.html` — el recorrido de sala: todas las pantallas en orden de flujo.
- `<pantalla>.html` — una página por pantalla core del H1, HTML autocontenido (cero CDNs, cero
  frameworks), con sus estados, 380 px y desktop, oscuro y claro, español e inglés. Datos 100 %
  sintéticos: la Plataforma Ejemplo y el hospital ficticio.
- `diagramador-tokens.md` — la propuesta de gramática visual del diagramador para el CONTRATO v0.3.0.
- `kit.html` — el design system en vivo: todos los componentes canon con sus estados.
- `assets/` — `tokens.{json,css}` (GENERADOS por `pnpm tokens`), fuentes con su licencia, hojas y
  el script de la barra de sala.
- La maqueta es **referencia, no producto**: los sprints la reproducen y el gate de FIDELIDAD del
  primer sprint con UI compara contra ella. El atlas es el único diagrama dibujado a mano de la app
  (regla dura 8); el renderizador lo reproducirá con _golden files_.

## Cómo se trazó la referencia del atlas

El atlas es el único diagrama dibujado a mano de la app (regla dura 8). Sus cuatro lienzos (ancho y
380 px, orquestación como franja y como capa) se trazaron con una **calculadora de geometría** que
aplica las reglas de `diagramador-tokens.md` § 9 sobre la tabla de métricas de la fuente. La
calculadora vive fuera del repo a propósito: no es el motor y no adelanta el paquete del
diagramador antes de G-Diseño. El HTML de la página es autoría a mano; solo las regiones marcadas
`<!-- inicio:… -->` llevan el SVG, la leyenda y la lectura en texto trazados. _(Ronda 1.)_

**Rondas 2–4.** Tras la mirada del 2026-09-26 el diagrama es **siempre horizontal** (jamás se
encoge ni se transpone; si no cabe, `assets/lienzo.js` lo desliza con índice de capas, sombras de
borde y pista escrita). La ronda 2 dio a elegir tres direcciones (A carriles · B plano · C bloques);
el usuario eligió **B**. La ronda 3 dio a elegir tres tipografías con un SVG por fuente (Manrope ·
Space Grotesk · Onest); el usuario eligió **Space Grotesk**. La ronda 4 consolida: la página entera
se genera con la calculadora (`atlas-nivel-1.html`, tres lienzos: transversal con etiqueta, transversal
con línea por modo, orquestación como capa) y la hoja base del producto es `assets/bigd.css` +
`assets/diagrama.css`. Las rondas anteriores viven en el historial: f21519c · 5439920 · a05a217.

## Plan de miradas

| Mirada       | Artefacto(s)                                                                                                  | Orden                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 1            | `diagramador-tokens.md` + `atlas-nivel-1.html` ⭐ (+ `design-system.md` v0.1)                                 | primero, siempre: fija el contrato v0.3.0 |
| 2            | `design-system.md` completo + `kit.html` + `atlas-nivel-2.html` + `atlas-recorrido.html` + `lado-a-lado.html` | 2                                         |
| 3            | `investigador.html` · `base.html` · `perfil.html` · `comparacion.html`                                        | 3                                         |
| 4            | `decisiones.html` · `informe.html` · `instrumento.html` · `index.html`                                        | 4                                         |
| 5 = G-Diseño | todo, desplegado                                                                                              | 5                                         |

## Registro de miradas

| Fecha      | Artefacto                                                                  | Veredicto del usuario (textual)                                                                                                                                                                                | Qué se construyó encima                                                                                                                                               |
| ---------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-26 | `atlas-nivel-1.html` (ronda 1, abierto en local; el preview no le abrió)   | «revisé la que está en local y la verdad no me gustó nada, visualmente horrible, y el diagrama no lo quiero vertical sino horizontal y con desplazamiento lateral por si se hace muy grande» — **no aprobado** | Nada todavía. Ronda 2 de la mirada 1: diagrama siempre horizontal con desplazamiento lateral (el usuario decide P5: jamás se transpone) y una dirección visual nueva. |
| 2026-09-26 | `atlas-direcciones.html` (ronda 2, abierto en local)                       | «Me gusta plano B pero no sé por qué insistes con la misma tipografía y casi misma visual si ya te dije que estaba horrible visualmente» — **dirección B elegida; tipografía y cromo rechazados**              | Ronda 3 de la mirada 1: B con tipografías nuevas para elegir y cromo de página distinto.                                                                              |
| 2026-09-26 | `atlas-nivel-1.html` (ronda 3, abierto en local)                           | «Space Grotesk. Continua» — **tipografía elegida: Space Grotesk** (JetBrains Mono para códigos); cromo nuevo sin objeción                                                                                      | Ronda 4 de la mirada 1: consolidación con Space Grotesk, estados de vigencia y alternativas P4/P9 en la dirección B.                                                  |
| 2026-09-26 | `atlas-nivel-1.html` + `diagramador-tokens.md` (ronda 4, abierto en local) | «lo abrí y apruebo» — **mirada 1 aprobada** (atlas nivel 1 en dirección B, Space Grotesk, paleta de un matiz por tipo, P5 horizontal, P9 transversal, P4 etiqueta de modos)                                    | Mirada 2: `design-system.md` completo + `kit.html` + `atlas-nivel-2.html` + `atlas-recorrido.html` + `lado-a-lado.html`.                                              |
| 2026-09-26 | `atlas-nivel-2.html` + `atlas-recorrido.html` + `lado-a-lado.html` + `kit.html` + `design-system.md` (mirada 2, abiertos en local) | «1. atlas-nivel-2: está muy bien logrado, mucho mejor que al inicio, muy interesante el diagrama con sus componentes y no qué decir del selector de plataforma. 2. atlas-recorrido: impresionante esa identificación visual del recorrido, muy apropiado. 3. lado-a-lado: está muy alineado con lo que pensaba para comparar, pero ahí dices que internamente hay 1, 2 o 3 comp., y quiero tener la opción de visualizar cuáles son esos componentes; vi que puedo comparar más de 3, muy bien. 4. kit: me gusta mucho, se evidencian los componentes de una manera visual. continúa» — **mirada 2 aprobada con un ajuste**: ver los componentes detrás del conteo del lado a lado | Ajuste del lado a lado (ficha de componentes por bloque, en ancho y en teléfono) y mirada 3: `investigador.html` · `base.html` · `perfil.html` · `comparacion.html`. |
| 2026-09-26 | `investigador.html` + `base.html` + `perfil.html` + `comparacion.html` + ajuste de `lado-a-lado.html` (mirada 3, abiertos en local, pedidos en matrices) | «0. lado-a-lado: me gusta, está bien, pero me gustaría que se desplegaran los componentes visualmente. 1. investigador: me gusta mucho esa cantidad de posibles elementos de información para el control de los documentos de verificación. 2. Excelente, buenas referencias, muy biblioteca y referencias. 3. Muy bien, interesante el perfil del caso para entender la mayor incertidumbre. 4. Esto es impactante, la comparación con los puntajes es de lo más valioso de la aplicación, muy muy buen trabajo.» Preguntas: «1. sí se entiende 2. sí es adecuado 3. lo dejo a tu criterio» — **mirada 3 aprobada con un ajuste**: componentes desplegados visualmente en el lado a lado | Ajuste del lado a lado (componentes como nodos dibujados, en el lienzo y en la ficha) y decisión D62 (se mantiene el bloqueo de «Aprobar» por decisión implícita sin responder). |

## Cobertura (se llena durante la etapa)

| Página de la maqueta                                                                            | Funcionalidad de la VISION                                                                                                | Estados que muestra                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `atlas-nivel-1.html` ⭐ (ronda 3)                                                               | C1 visión general · C6 diagramador (nivel 1, leyenda, lectura en texto)                                                   | dirección B con cromo nuevo · tipografía a elegir: Manrope · Space Grotesk · Onest (un SVG por fuente, métricas propias) · JetBrains Mono para códigos · siempre horizontal con desplazamiento lateral · 380 px y ancho · oscuro y claro · ES y EN · ficha al tocar un bloque · lectura en texto plegada                                            |
| `atlas-nivel-2.html`                                                                            | C2 nodos con tipo, madurez, fuentes · ficha (qué es · qué hace · por qué importa · términos · fuentes · fecha) · glosario | mapa · ficha abierta (hoja inferior en teléfono, panel lateral en desktop) · término del glosario · nodo en vista previa · 380 px y ancho · oscuro y claro · ES y EN                                                                                                                                                                                |
| `atlas-recorrido.html`                                                                          | C3 pasos numerados, rama paralela, anterior/siguiente                                                                     | todos los pasos (defecto) · paso activo · bifurcación · animación pausable · reduced-motion sin botón ni hoja · 380 px y ancho · oscuro y claro · ES y EN                                                                                                                                                                                           |
| `lado-a-lado.html`                                                                              | C4 dos o más plataformas alineadas por banda · diff (C6)                                                                  | tres plataformas · página 2 (N = 4) · diferencias entre versiones · una banda a la vez en teléfono · selector para N · oscuro y claro · ES y EN                                                                                                                                                                                                     |
| `investigador.html`                                                                             | C7 semáforo por capa + copiar comando `/investigar` · C8 diferencias calculadas, aprobar por afirmación, «sin novedades» | capa vencida con comando · propuesta con cambios (diff calculado; afirmación con cita verificada / no verificable / no encontrada) · aprobado · sin novedades (fuentes consultadas, preguntas guía) · 380 px y ancho · oscuro y claro · ES y EN |
| `base.html`                                                                                     | C9 evidencias con fuente, fecha, madurez, conflicto de interés; instantáneas con huella                                 | evidencia aprobada · propuesta (sin puntaje) · **error de carga con archivo:línea:col · id · campo · regla** · instantánea con huella SHA-256 (RFC 8785) verificada · 380 px y ancho · oscuro y claro · ES y EN |
| `perfil.html`                                                                                   | C10 pesos que suman 100 con rango relativo y origen, restricciones eliminatorias, decisiones implícitas                 | borrador · suma ≠ 100 · rango abierto · restricción que elimina a la Plataforma Este · «¿una o combinación?» sin responder · perfil aprobado (sello, huella, solo lectura) · 380 px y ancho · oscuro y claro · ES y EN |
| `comparacion.html`                                                                              | C11 totales y empate técnico con evidencia limitante · C12 sensibilidad y punto de inversión · C13 simulación (Worker) · C14 pros y contras | empate técnico · ganadora clara · matriz 0–4 con tope por madurez y mejor por criterio · sensibilidad con inversión y salida del empate en el control · simulación en curso · robustez con umbrales 70/50 declarados, zona gris y vector central · pros y contras por reglas · 380 px y ancho · oscuro y claro · ES y EN |
| `kit.html`                                                                                      | design system v0.3.0: componentes canon                                                                                   | gramática (tipos, modos, madurez) · semáforo · controles y campos (inválido) · tarjeta de evidencia (aprobada, propuesta, cita no verificada) · control de peso (rango relativo, inversión, suma ≠ 100) · tabla de prioridad de acción (alta sin mitigación) · vacío, carga, error · registros de texto · 380 px y ancho · oscuro y claro · ES y EN |
| `atlas-direcciones.html` (ronda 2, borrada en el commit 7bb6533; queda en el historial 5439920) | C1 · C6                                                                                                                   | A carriles · B plano · C bloques; el usuario eligió B                                                                                                                                                                                                                                                                                               |
| `atlas-nivel-1.html` ⭐                                                                         | C1 visión general · C5 semáforo de vigencia · C6 diagramador (nivel 1, leyenda, lectura en texto)                         | propuesta · por revisar · vencido · P4 una línea por modo · P9 orquestación como capa · ancho y 380 px · oscuro y claro · ES y EN · banda sin bloque («1 componente») · flujos agregados con varios modos · bloque con vista previa · ficha breve al tocar un bloque                                                                                |

## Registro de G-Diseño (se llena al cerrar la etapa)

| Campo                        | Valor                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| **Veredicto del usuario**    | _(pendiente)_ — aprobado / aprobado con notas                                                       |
| **Fecha**                    |                                                                                                     |
| **Rondas de sala de diseño** |                                                                                                     |
| **Dónde se aprobó**          | preview de Vercel del PR de `diseno/fundacion` (la URL vive en la planeadora, jamás aquí: regla 17) |
| **Decisiones selladas**      |                                                                                                     |
| **Notas del usuario**        |                                                                                                     |

**Sin este registro lleno, G-Diseño no está aprobado y ninguna orden de construcción se ejecuta.**
