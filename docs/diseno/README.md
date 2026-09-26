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

| Fecha      | Artefacto                                                                | Veredicto del usuario (textual)                                                                                                                                                                                | Qué se construyó encima                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-26 | `atlas-nivel-1.html` (ronda 1, abierto en local; el preview no le abrió) | «revisé la que está en local y la verdad no me gustó nada, visualmente horrible, y el diagrama no lo quiero vertical sino horizontal y con desplazamiento lateral por si se hace muy grande» — **no aprobado** | Nada todavía. Ronda 2 de la mirada 1: diagrama siempre horizontal con desplazamiento lateral (el usuario decide P5: jamás se transpone) y una dirección visual nueva. |
| 2026-09-26 | `atlas-direcciones.html` (ronda 2, abierto en local)                     | «Me gusta plano B pero no sé por qué insistes con la misma tipografía y casi misma visual si ya te dije que estaba horrible visualmente» — **dirección B elegida; tipografía y cromo rechazados**              | Ronda 3 de la mirada 1: B con tipografías nuevas para elegir y cromo de página distinto.                                                                              |
| 2026-09-26 | `atlas-nivel-1.html` (ronda 3, abierto en local)                         | «Space Grotesk. Continua» — **tipografía elegida: Space Grotesk** (JetBrains Mono para códigos); cromo nuevo sin objeción                                                                                      | Ronda 4 de la mirada 1: consolidación con Space Grotesk, estados de vigencia y alternativas P4/P9 en la dirección B.                                                  |

## Cobertura (se llena durante la etapa)

| Página de la maqueta                         | Funcionalidad de la VISION                                                                        | Estados que muestra                                                                                                                                                                                                                                                                                      |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `atlas-nivel-1.html` ⭐ (ronda 3)            | C1 visión general · C6 diagramador (nivel 1, leyenda, lectura en texto)                           | dirección B con cromo nuevo · tipografía a elegir: Manrope · Space Grotesk · Onest (un SVG por fuente, métricas propias) · JetBrains Mono para códigos · siempre horizontal con desplazamiento lateral · 380 px y ancho · oscuro y claro · ES y EN · ficha al tocar un bloque · lectura en texto plegada |
| `atlas-direcciones.html` (ronda 2, registro) | C1 visión general · C6 diagramador (nivel 1, leyenda)                                             | A carriles · B plano · C bloques · siempre horizontal con desplazamiento lateral (índice de capas, sombras de borde, pista «desliza») · 380 px y ancho · oscuro y claro · ES y EN · paleta de un matiz por tipo · franjas con referencias alineadas bajo la capa que tocan                               |
| `atlas-nivel-1.html` ⭐                      | C1 visión general · C5 semáforo de vigencia · C6 diagramador (nivel 1, leyenda, lectura en texto) | propuesta · por revisar · vencido · P4 una línea por modo · P9 orquestación como capa · ancho y 380 px · oscuro y claro · ES y EN · banda sin bloque («1 componente») · flujos agregados con varios modos · bloque con vista previa · ficha breve al tocar un bloque                                     |

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
