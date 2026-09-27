---
etapa: Etapa de Diseño (F2a)
app: big-d
branch: diseno/fundacion
opened: 2026-09-26
status: open
orden: ~/Code/hr01-develop-ai-apps/portafolio/big-d/ordenes/DISENO-orden.md
plan aprobado: 2026-09-26 (plan mode → «construye»)
---

# Etapa de Diseño — bitácora de implementación (Big-D)

> Cero código de producto hasta G-Diseño. Entregables: `design-system.md` ·
> `docs/diseno/diagramador-tokens.md` (propuesta para el CONTRATO v0.3.0) · maqueta navegable del
> H1 en `docs/diseno/` (11 pantallas + recorrido) desplegada en Vercel protegido ·
> `docs/diseno/README.md` con el registro de miradas.

## Plan de miradas (declarado en el plan, aprobado 2026-09-26)

| Mirada       | Artefacto(s)                                                                                                  | Estado    |
| ------------ | ------------------------------------------------------------------------------------------------------------- | --------- |
| 1            | `diagramador-tokens.md` + `atlas-nivel-1.html` ⭐ (+ `design-system.md` v0.1)                                 | aprobada 2026-09-26 (ronda 4) |
| 2            | `design-system.md` completo + `kit.html` + `atlas-nivel-2.html` + `atlas-recorrido.html` + `lado-a-lado.html` | aprobada 2026-09-26, con un ajuste |
| 3            | `investigador.html` · `base.html` · `perfil.html` · `comparacion.html`                                        | aprobada 2026-09-26, con un ajuste |
| 4            | `decisiones.html` · `informe.html` · `instrumento.html` · `index.html`                                        | aprobada 2026-09-26 |
| 5 = G-Diseño | todo, desplegado, teléfono + desktop, ambos temas, ambos idiomas                                              | pendiente |

Regla: «continúa» no aprueba diseño; cada mirada se registra en `docs/diseno/README.md` ANTES del
siguiente artefacto; cambios a este plan se aprueban antes de construir.

## Decisiones de diseño que la orden no escribió (D1–D18 del plan aprobado + D19)

Ver el plan aprobado; resumen: D1 eje izquierda→derecha / arriba→abajo · D2 transversales abajo ·
D3 Orquestación transversal (con conmutador) · D4 una línea + chip de modos (con conmutador) ·
D5 Atkinson Hyperlegible Next + Mono · D6 UI monocroma, el color es de la gramática · D7 relleno
tintado + borde y glifo del matiz + texto en tinta · D8 paleta por búsqueda con umbral declarado ·
D9 semáforo en tinta · D10 modos = trazo + marcador en tinta · D11 geometría por reglas ·
D12 `nodos_por_banda_max: 6` · D13 recorrido sin matiz · D14 personalidad · D15 datos sintéticos
(N = 4 ficticias) · D16 despliegue por copia a `public/diseno/` · D17 `<span lang>` pareados ·
D18 sin URL en el README.

**D19 (nueva, Fase 0 — hallazgo medido):** Atkinson Hyperlegible Next y Mono **no traen** ✓ ✕ ▶ ⇉
→ β α (sí traen · • — « » ≤ ≥ ± ≈ −). Un carácter fuera de la fuente cae en la fuente de respaldo
del sistema: su ancho cambia entre navegadores (rompe G15 y el byte a byte de G1) y así entran los
emojis. **Decisión:** los símbolos de estado, madurez, recorrido y flecha se **dibujan como glifos
SVG propios** de la gramática, nunca como caracteres; los códigos de madurez que hoy usan «β» o
«✓» pasan a glifo + código latino. Gate: `maqueta-vocabulario` (todo carácter visible ∈ cobertura
de la fuente). Va a `diagramador-tokens.md` como propuesta al contrato.

## Fase 0 — Setup (2026-09-26)

- Branch `diseno/fundacion` desde `main` (9547230).
- **Despliegue (D16):** `scripts/copiar-maqueta.mjs` copia `docs/diseno/` → `public/diseno/`
  (solo html/css/js/woff2/svg/txt/json; declara el árbol y aborta si el destino sale de
  `public/`); `build` = `node scripts/copiar-maqueta.mjs && next build`; `public/diseno/` en
  `.gitignore`; `docs/diseno/**` y `public/diseno/**` en `globalIgnores` de ESLint.
- **Fuentes (D5):** Atkinson Hyperlegible Next y Mono, variables `wght` 200–800, bajadas del
  repositorio de Google Fonts (`ofl/atkinsonhyperlegible{next,mono}`), **licencia verificada en el
  paquete: SIL OFL 1.1** (`METADATA.pb: license: "OFL"`, `OFL.txt` copiado junto a cada archivo);
  convertidas a woff2 con fonttools en un entorno aislado del scratchpad (48 KB + 26 KB).
  `docs/diseno/assets/fuentes/cobertura.json` guarda la huella SHA-256 y los rangos de cmap.
- **Paleta (D8):** `scripts/paleta/color.mjs` (sRGB ↔ lineal, Machado 2009 en RGB lineal para
  protan/deutan/tritan 0,6 y 1,0, OKLab de Ottosson, ΔE_OK, contraste WCAG; sin dependencias) ·
  `scripts/paleta/buscar.mjs` (búsqueda determinista: 9 arranques en rejilla, descenso por
  coordenadas sobre matices cada 5°) · `scripts/paleta/generar-tokens.mjs` (OKLCH declarado →
  `docs/diseno/assets/tokens.{json,css}`). Exploración de croma y claridad:

  | Croma    | Claridad oscuro | Claridad claro  | Puntaje   | Peor normal | Peor 0,6  | Peor deutan 1,0 |
  | -------- | --------------- | --------------- | --------- | ----------- | --------- | --------------- |
  | 0,16     | 0,70 / 0,86     | 0,44 / 0,62     | 1,224     | 0,122       | 0,074     | 0,037           |
  | **0,13** | **0,70 / 0,86** | **0,44 / 0,62** | **1,196** | **0,123**   | **0,072** | **0,052**       |
  | 0,12     | 0,68 / 0,84     | 0,44 / 0,62     | 1,185     | 0,119       | 0,071     | 0,049           |
  | 0,14     | 0,68 / 0,84     | 0,42 / 0,62     | 1,148     | 0,118       | 0,069     | 0,036           |

  Elegida **0,13**: pierde 2 % de puntaje frente a 0,16 y quita el cian neón (#00f2d5) que chocaba
  con «sobrio». El puntaje es invariante a permutar colores entre tipos, así que la asignación es
  semántica: azul = datos que entran y reposan (almacenamiento hondo, ingesta claro) · verde-azulado
  = cómputo (transformación hondo, IA claro) · ocre = bordes de la plataforma (externo hondo,
  consumo claro) · rosa = lo transversal (gobierno hondo, operación claro).

- **Arnés de capturas** `scripts/capturar-maqueta.mjs` (versionado, sin capturas en el repo):
  página × estado × tema × idioma × ancho por `file://`; mide desplazamiento horizontal, texto SVG
  fuera del `viewBox`, texto que pisa una caja ajena (`data-dueno` / `data-caja`) y carga real de
  la fuente; `--simular` añade deuteranopía, protanopía, tritanopía y acromatopsia por CDP.
  Declara su árbol y aborta si una página sale de `docs/diseno/` o si `--salida` cae dentro del repo.

### Gates nuevos — demo en rojo en el MISMO commit (regla 15)

| Gate                                                    | ¿Puede fallar?                                                | Demo en rojo                                                    | A quién nombró                                                                           | Verde al revertir       |
| ------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------- |
| `tests/unit/paleta-diagramador.test.ts` (39 aserciones) | Sí: nada más mide color; el spike usó Okabe-Ito sin medir     | `tipo-1` claro = `#e69f00` (naranja del spike) en `tokens.json` | `trazo de tipo-1 … expected 2.089 ≥ 3` + deriva `tokens.json ≠ generador`                | ✓ 39/39                 |
| `tests/unit/maqueta-autocontenida.test.ts`              | Sí: ninguna regla previa lee HTML de `docs/`                  | `<script src="https://cdn.jsdelivr.net/…">` en `index.html`     | `docs/diseno/index.html:6 URL absoluta fuera de example.org` + `script fuera de assets/` | ✓                       |
| `tests/unit/maqueta-vocabulario.test.ts`                | Sí: ESLint ignora `docs/diseno/`; nada lee texto visible      | «casa del lago» y un «✓» como carácter en `index.html`          | `index.html «✓» U+2713` + `calco de «lakehouse»`                                         | ✓ 9/9 (con el anterior) |
| Medida de fuente del arnés                              | Sí: `fonts.check()` da verdadero con una cara fallida (visto) | `src` de la fuente a un archivo inexistente                     | `index__unico__claro__es__1280: la fuente no cargó`                                      | ✓ 0 fallas              |

### Barrido de cero enlaces (regla 17), tras el último `git add` de la Fase 0

`git grep -nE "vercel[.]app|workers[.]dev|pages[.]dev" -- ':!pnpm-lock.yaml'` → **1 línea, heredada
del estampado**: `CHANGELOG.md:179` (el changelog del kit cita el patrón en prosa sin clase de
carácter). No es una URL de despliegue y ya estaba en `main`; se deja como hallazgo para la
planeadora (el kit debería escribir `pages[.]dev` en su CHANGELOG). Cero líneas en lo que esta
etapa agrega.

### CI y última milla (PR #3, commit e3db45c)

- `gh pr checks 3`: `quality` ✓ 42 s · `e2e` ✓ 54 s · `lighthouse` ✓ 1 min 31 s · `Vercel` ✓ ·
  `Vercel Preview Comments` ✓ — conclusión propia `success` en cada uno; primera corrida de los
  tres gates nuevos en CI (dentro de `quality`, sin histórico previo).
- **Preview SIN sesión** (`curl`, dos direcciones: la del despliegue y la de la rama):
  `/diseno/index.html`, `/diseno/assets/tokens.css` y `/` → **302 al inicio de sesión de
  Vercel** en las seis combinaciones. La protección cubre la maqueta.
- **No verificado desde aquí:** el contenido de `/diseno/` CON sesión (la sesión no tiene
  credenciales de Vercel). La evidencia indirecta es el build local idéntico: `out/diseno/`
  contiene `index.html`, `assets/` y las fuentes. Lo confirma el usuario al abrir el preview.

## Fase 1 — Mirada 1: tokens del diagramador + atlas nivel 1 (2026-09-26)

**Construido.**

- `docs/diseno/atlas-nivel-1.html` ⭐: cuatro lienzos SVG (ancho y angosto × orquestación franja y
  capa), cinco estados de sala (propuesta, por revisar, vencido, P4 una línea por modo, P9
  orquestación como capa), leyenda generada, nota de marcas, lectura en texto (G10), ficha breve al
  tocar un bloque, conmutadores de idioma y tema.
- `docs/diseno/diagramador-tokens.md`: la propuesta para el CONTRATO v0.3.0 (P4, P5, P9, P10, P11,
  paleta medida, glifos, marcas, modos, tipografía, geometría, idioma, animación, cambios al esquema,
  textos EN).
- `design-system.md` v0.1.
- `docs/diseno/assets/`: `diagrama.css` (la capa CSS del diagrama, G13), `bigd.css` (producto),
  `maqueta.css` y `maqueta.js` (sala), `fuentes/metricas.json` (prototipo de la tabla G15).

**Cómo se trazó.** Calculadora de geometría en el scratchpad de la sesión (no versionada: no es el
motor). Aplica las reglas de `diagramador-tokens.md` § 9 sobre `metricas.json` y reporta cruces
D11, choques de etiquetas, textos que no caben e insignias que pisan. La página es autoría a mano;
un inyector rellena solo las regiones `<!-- inicio:X -->`.

**Decisiones nuevas de esta fase (se juzgan en la mirada 1).**

| #   | Decisión                                                                                                                             | Por qué (medido)                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| D20 | Columna ancha de 144 u y canal de 54 u (el plan decía 136 y 64)                                                                      | «Almacenamiento» en negrita a 16 mide 126 u; no cabía en 136 con relleno                                               |
| D21 | En el nivel 1, los flujos con una franja se escriben como referencias (flecha + marcador + nombre), no como líneas                   | Con líneas, el carril pedía 6 pistas y el canal de Gobierno 5: una maraña para un líder. Sin ellas, el carril baja a 2 |
| D22 | Regreso entre columnas vecinas por su canal compartido (sale por la izquierda, entra por la derecha)                                 | El bucle Almacén ↔ Preparación deja de bajar al carril                                                                 |
| D23 | En ancho, la cabecera de franja va a la IZQUIERDA; en angosto, cada banda es una fila «pregunta a la izquierda, bloque a la derecha» | Es la transpuesta exacta; en 380 px se lee como pregunta y respuesta                                                   |
| D24 | Se marca la excepción: vigente y disponible no llevan marca en el diagrama                                                           | Las insignias en todos los bloques eran ruido                                                                          |
| D25 | La insignia de vigencia va donde no hay puertos: borde superior en ancho, fila inferior en angosto                                   | En angosto chocaba con la madurez en la fila inferior de «Agentes» a 176 u; se ganaron 8 u con la cabecera a 14        |
| D26 | Glifos: hexágono → escudo, pentágono → barras; marcador de _a demanda_: reloj → ida y vuelta; madurez: medidor                       | A 12 px círculo, hexágono y pentágono se confunden; «reloj» dice «a una hora», que es _por lotes_                      |
| D27 | La geometría no depende del idioma (alturas con el texto más largo de ES y EN)                                                       | Un solo juego de cajas; G5 vale también entre idiomas                                                                  |
| D28 | Letra mínima 14 u en ancho y 13 u en angosto; umbrales de disposición por ancho de contenedor                                        | Con 14 u, la variante de 7 columnas cabe en ancho desde 1198 px (con 13 u pedía 1291)                                  |

**Hallazgo honesto sobre P4.** En este mapa, una línea por modo se lee tan bien como la etiqueta,
también a 380 px. La propuesta sigue siendo la etiqueta por densidad (medido en la primera versión:
4 entradas en 88 u pisaban dos marcadores), pero la decisión es del usuario.

**Pasada de capturas (regla 10, desde la ronda 1).**

| Pasada                   | Encuadres                                                                                                            | Medidas                                                                                   | Resultado |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------- |
| Completa + simulación    | 120 (5 estados × 2 temas × 2 idiomas × 2 anchos + deuteranopía, protanopía, tritanopía y acromatopsia del idioma ES) | desplazamiento horizontal, texto fuera del lienzo, texto sobre caja ajena, fuente cargada | 0 fallas  |
| Tras correcciones de CSS | 40                                                                                                                   | ídem                                                                                      | 0 fallas  |

Leídas como imagen: propuesta oscuro ES 1280 y 380, claro EN 1280, vencido claro EN 1280, por
revisar claro EN 380, P4 líneas oscuro ES 380, P9 capa oscuro ES 1440, deuteranopía oscuro y
acromatopsia claro. **Corregido tras mirar:** las pestañas de nivel apilaban número y etiqueta (el
selector `span` alcanzaba a los hijos) y la pestaña activa se lavaba; las muestras de línea de la
leyenda heredaban el ancho del diagrama; «Varios modos» caía en la columna del marcador; los
nombres de modo usaban la mono de los códigos; los enlaces de la barra medían 30 px de alto.

## Fase 1 — Mirada 1, ronda 2 (2026-09-26)

**Mirada de la ronda 1 (registrada en `docs/diseno/README.md` antes de construir):** el usuario abrió
`atlas-nivel-1.html` en local —el preview no le abrió— y respondió: «revisé la que está en local y la
verdad no me gustó nada, visualmente horrible, y el diagrama no lo quiero vertical sino horizontal y
con desplazamiento lateral por si se hace muy grande». **No aprobada.**

**Lectura crítica propia de la ronda 1 (capturas releídas antes de rediseñar):** parecía un
boceto de flujo, no un producto. Las cajas eran rectángulos oscuros casi vacíos; el color vivía en
glifos de 12 px y la paleta repetía cuatro familias (dos azules, dos turquesas, mostaza, oliva). Las
columnas eran altas y huecas, las líneas se enredaban junto a «Almacén central», las franjas eran
formularios con «1 componente» punteado y el claro en crema se leía viejo. Por debajo de 1029 px de
contenedor el mapa pasaba a la disposición vertical, que es la que el usuario vio en su pantalla.

**Decisiones de la ronda 2:**

| #   | Decisión                                                                                                                                                                                                              | Razón                                                                                               |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| D29 | **P5 lo decide el usuario: siempre horizontal.** Jamás se transpone ni se encoge; si no cabe, el lienzo se desliza de lado (índice de capas, sombras de borde, pista escrita). La geometría angosta (§ 9.2) se retira | Mirada textual del usuario                                                                          |
| D30 | **Paleta de un matiz propio por tipo** (azul, violeta, naranja, rojo, verde, magenta, cian y pizarra para lo externo); la claridad sale de `pnpm paleta:buscar` reescrito (tres arranques fijos, rangos por tipo)     | La ronda 1 era apagada y repetida. Mismos umbrales y mismo gate: 39/39 verdes, peor par 0,6 = 0,074 |
| D31 | **Claro en papel frío casi blanco** (fondo L 0,965; tarjetas blancas)                                                                                                                                                 | El crema cálido se leía viejo junto a los colores nuevos                                            |
| D32 | **Tres direcciones visuales del mismo mapa** en `atlas-direcciones.html`: A carriles · B plano · C bloques; misma data, mismos glifos, misma calculadora                                                              | «Horrible» no dice qué gusta; elegir entre tres es más corto que adivinar una                       |
| D33 | **Las conexiones de una franja se alinean bajo la columna de la capa que tocan** (flecha ↑/↓ + marcador + nombre), en vez de listarse junto al elemento                                                               | La referencia se lee como cruce de fila y columna, sin líneas                                       |
| D34 | **Un «sin bloque» de un solo componente muestra el nombre del componente** («Monitor de consumo»), no «1 componente»                                                                                                  | El recuadro punteado vacío se leía como marcador de posición                                        |

**Plan de miradas:** sin cambios. Es la ronda 2 de la mirada 1; no se construyó el segundo artefacto.

**Construido:** `docs/diseno/atlas-direcciones.html` (80 KB; tres lienzos de 1206–1212 × 615–665 u) ·
`assets/direcciones.css` · `assets/lienzo.js` · `scripts/paleta/generar-tokens.mjs` y
`scripts/paleta/buscar.mjs` (modelo de un matiz por tipo) · `tokens.{json,css}` regenerados ·
tablas de paleta al día en `diagramador-tokens.md` § 5 y `design-system.md` §§ 3.1, 3.2 y 7.1 ·
§ 0 y § 1 de la propuesta con P5 decidido · portada de sala con la ronda 2 primero.

**Verificado:** arnés sobre `atlas-direcciones` — 24 encuadres (3 direcciones × 2 temas × 2 idiomas
× 380/1280), 0 fallas de medida (sin desborde de página, sin texto fuera del lienzo ni sobre caja
ajena, fuente cargada). Prueba de interacción en Chromium a 380 px: el lienzo desborda en las tres
direcciones, el índice lleva a «Procesamiento» (scrollLeft 618–624) y marca la capa actual, la
página mide 380 px; a 1440 px el lienzo cabe y el índice no aparece. Leídas como imagen: A oscuro
ES 1280 y 380, B claro ES 1280, C oscuro EN 1280. **Corregido tras mirar:** la pregunta de las
franjas se pintaba a 14 px y se medía a 13 (quedaba pegada a su ficha); las fichas compactas de tres
líneas no respiraban (52 → 60 u); las pestañas de nivel se partían en dos filas a 380 px.

**Preview:** el usuario reporta que no le abrió. Sin sesión, la URL responde 302 al inicio de sesión
de Vercel (esperado); el despliegue del commit f21519c terminó en `success`. Desde aquí no se puede
ver qué pasa con sesión: pendiente de lo que el usuario vio al abrirlo.

**Pendiente para la ronda 3 (tras la elección):** la dirección elegida pasa a `bigd.css` /
`diagrama.css`; `atlas-nivel-1.html` se rehace con ella y recupera los estados (vigencia, P4, P9),
la ficha breve y la lectura en texto; `diagramador-tokens.md` §§ 4, 6–9 y 13 se reescriben.

## Fase 1 — Mirada 1, ronda 3 (2026-09-26)

**Mirada de la ronda 2 (registrada en el README antes de construir):** «Me gusta plano B pero no sé
por qué insistes con la misma tipografía y casi misma visual si ya te dije que estaba horrible
visualmente». Dirección B elegida; Atkinson Hyperlegible y el cromo de página rechazados.

| #   | Decisión                                                                                                                                                                                                                                                                                  | Razón                                                                                           |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| D35 | **P11 se reabre: tres candidatas SIL OFL para elegir** — Manrope (geométrica), Space Grotesk (técnica), Onest (humanista) — y JetBrains Mono para códigos. Subconjunto latino en woff2 (30–50 KB), licencias, huella SHA-256, cobertura y tabla de métricas (G15) generadas con fonttools | El usuario rechazó Atkinson; la letra se elige mirando, no leyendo argumentos                   |
| D36 | **Un SVG por tipografía**: el mapa se recalcula con las métricas de cada fuente (cortes de línea y anchos de referencia); el conmutador de sala cambia página y mapa a la vez                                                                                                             | G15: la geometría depende de la fuente; una sola geometría con tres fuentes desbordaría         |
| D37 | **Cromo de página nuevo** (`assets/atlas.css`): sin píldoras ni rellenos; filetes, texto y aire; ojo en mono; conmutadores como texto; niveles y leyenda con filetes                                                                                                                      | «Casi misma visual»: el cromo de la ronda 2 heredaba el de la ronda 1                           |
| D38 | `atlas-nivel-1.html` se **reemplaza** por la ronda 3 (la ronda 1 queda en el historial, f21519c); `atlas-direcciones.html` se conserva una ronda como registro                                                                                                                            | Dos atlas en la sala confunden; el elegido ocupa el nombre del entregable                       |
| D39 | El arnés exige cargada la **primera familia que declara el cuerpo** (no un nombre fijo) y espera `document.fonts.ready` en cada estado                                                                                                                                                    | Con tres fuentes conmutables, el nombre fijo dejaba de ser un gate; se vio fallar (3 encuadres) |

**Construido:** `atlas-nivel-1.html` (86 KB, tres lienzos de 1178 × 629) · `assets/atlas.css` ·
`assets/fuentes/{manrope,space-grotesk,onest,jetbrains-mono}.woff2` + `OFL-*.txt` · `cobertura.json`
y `metricas.json` ampliados · `fuentes.css` · `maqueta.js` (bloques `.db-elem`) · `maqueta.css`
(mono por variable) · `scripts/capturar-maqueta.mjs` (D39).

**Verificado:** 24 encuadres (3 tipografías × 2 temas × 2 idiomas × 380/1280), 0 fallas. Prueba en
Chromium a 380 px: el conmutador deja `Space Grotesk` como familia del cuerpo y visible solo su SVG;
el índice lleva a «Almacenamiento»; tocar «Almacén central» abre la ficha con su frase; la página
mide 380 px. Leídas como imagen: Space Grotesk oscuro ES 1280, Manrope claro EN 1280, Onest oscuro
ES 380. **Corregido tras mirar:** a 1280 px el mapa se pasaba 30 px y recortaba la capa 6
(columnas 156 → 152, canal 52 → 50, relleno lateral 16 → 8).

**Pendiente (ronda 4, tras elegir la letra):** quitar las fuentes no elegidas y Atkinson; endurecer
el gate de vocabulario a la familia elegida; volver a poner los estados de vigencia y las
alternativas P4/P9; reescribir §§ 6–9 y 13 de la propuesta; borrar `atlas-direcciones.html`.

**Gate que atrapó algo (ronda 3):** `maqueta-vocabulario` puso en rojo `assets/atlas.css` porque los
separadores «/» y «·» del cromo usaban `linea` como color de texto (tinta vetada, regla 5-b). Pasaron
a `tinta-2`. El commit a05a217 salió con ese rojo por correr el push en la misma cadena que el test:
corregido en el commit siguiente; la cadena ya no encadena push tras test.

## Fase 1 — Mirada 1, ronda 4 (2026-09-26): consolidación

**Mirada de la ronda 3 (registrada en el README antes de construir):** «Space Grotesk. Continua».
Tipografía elegida; cromo nuevo sin objeción.

| #   | Decisión                                                                                                                                                                                                                                                        | Razón                                                          |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| D40 | **P11 = Space Grotesk + JetBrains Mono.** Se borran Manrope, Onest y Atkinson (woff2, licencias, entradas de cobertura y métricas); `fuentes.css` queda con dos caras                                                                                           | Elección del usuario; una fuente que no se usa es peso y ruido |
| D41 | `assets/atlas.css` se parte en **`bigd.css` (base del producto)** y **`diagrama.css` (capa del diagrama, clases `db-*`)**; los viejos `bigd.css`, `diagrama.css`, `direcciones.css` y `atlas-direcciones.html` se borran                                        | Un solo cromo vigente; el diagrama sigue en hoja aparte (G13)  |
| D42 | Los **estados vuelven en la dirección B**: por revisar y vencido (insignia sobre el borde superior + línea de estado en el encabezado), P4 una línea por modo (líneas del par a 22 u), P9 orquestación como capa (7 columnas, 1380 u: en 1280 px ya se desliza) | Lo que la ronda 1 mostraba y las rondas 2–3 dejaron fuera      |
| D43 | Con **P9 como capa el índice gana la columna «Orquestación»** (`data-si="p9:capa"`) y cada botón lleva la x de ambos lienzos (`data-x-t`, `data-x-c`)                                                                                                           | El índice debe llevar a cada columna del lienzo visible        |

**Construido:** `atlas-nivel-1.html` (101 KB; lienzos 1178 × 648, 1178 × 648 y 1380 × 558; 5
estados) · `assets/bigd.css` · `assets/diagrama.css` (insignias, colores forzados) · `assets/fuentes.css`
· `fuentes/` (2 woff2 + 2 OFL) · `cobertura.json` y `metricas.json` recortados · `index.html` de sala
· `diagramador-tokens.md` §§ 0, 1, 2, 4, 6.3, 8, 9, 10, 11, 14 · `design-system.md` v0.2.0 §§ 3.3, 5, 11.

**Verificado:** 144 encuadres (5 estados × 2 temas × 2 idiomas × 2 anchos + 4 simulaciones en ES,
más la portada), 0 fallas de medida. En Chromium a 380 px: cada estado muestra solo su lienzo; «por
revisar» pinta 2 insignias y «2 bloques por revisar»; «vencido» pinta 2 insignias y «1 vencido · 1
por revisar»; «P9 capa» añade la columna 7 al índice y el botón «Orquestación» desplaza el lienzo a
808 px; tocar el bloque punteado abre su ficha. Leídas como imagen: vencido oscuro ES 1280, P4
líneas claro EN 1280. Sin correcciones tras mirar.

**Plan de miradas:** sin cambios. La mirada 1 se presenta completa para aprobación (atlas nivel 1

- tokens del diagramador); la mirada 2 no arranca sin ella.

**Mirada 1 aprobada (2026-09-26):** «lo abrí y apruebo», con la ronda 4 abierta en local. Registrada en `docs/diseno/README.md`. Fase 1 cerrada; la fase 2 (mirada 2) espera el «continúa».

## Fase 2 — Mirada 2: design system completo, kit, nivel 2, recorrido, lado a lado (2026-09-26)

Arrancó con el «continúa» del usuario tras la aprobación de la mirada 1.

| #   | Decisión                                                                                                                                                                                 | Razón                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| D44 | **Las franjas siguen por referencia en el nivel 2**; solo los flujos entre nodos de capas se dibujan como líneas (propuesta § 4.3 ampliada; cambio a CONTRATO § 4.2)                     | Las 4 conexiones de franja del ejemplo cruzarían el carril o un canal ocupado; con referencias: 0 cruces |
| D45 | **Nivel 2 = nodos apilados en su columna** (152 × 84 a 40 u), puertos repartidos por borde, pistas verticales por canal a 10 u, saltos por el carril y el canal anterior al destino      | Geometría por reglas (D2); el mismo cromo del nivel 1                                                    |
| D46 | **Ficha de nodo como hoja inferior (< 900 px) y panel lateral (≥ 900 px)** superpuestos; el lienzo no se reacomoda                                                                       | Orden de diseño; el mapa no cabe al lado de un panel en 1280 px                                          |
| D47 | **Recorrido por atributo del contenedor + CSS generado** (`data-paso`), hoja de animación aparte con `media`, sin botón «Reproducir» con movimiento reducido; numeración 1–5, 6a, 7a, 6b | CONTRATO § 4.3 y G12; regla de desarrollo 5-a (el árbol no depende de la preferencia)                    |
| D48 | **Lado a lado con las 9 bandas como columnas y una plataforma por fila** (bloques mini 118 × 64), tres por página, una banda a la vez en teléfono; diff como píldoras glifo + palabra    | G5 por construcción; «tres en ancho y una en teléfono» como constante de vista; color no interviene      |
| D49 | **Cuatro plataformas ficticias** (Ejemplo, Norte, Sur, Este) y un diff ficticio v0.1.0 → v0.2.0 con los cuatro tipos de cambio                                                           | Regla dura 12 (cero cifras sobre fabricantes reales) y N ≠ 3                                             |
| D50 | Textos EN de los 14 nodos, el recorrido, los términos y las fuentes **redactados** en la maqueta (el mapa v0.2.0 es solo ES)                                                             | Regla 20; se entregan a la planeadora en § 16                                                            |
| D51 | Los preajustes de sala se re-aplican en cada clic: los controladores (ficha, recorrido) **solo obedecen cuando el preajuste cambia**                                                     | Visto fallar: «Siguiente» no avanzaba porque el preajuste lo devolvía a «todos»                          |

**Construido:** `atlas-nivel-2.html` (76 KB) · `atlas-recorrido.html` (52 KB, CSS de estados generado

- `assets/recorrido-animacion.css` + `assets/recorrido.js`) · `lado-a-lado.html` (95 KB, 3 lienzos +
  vista angosta HTML + `assets/lado.js`) · `kit.html` (31 KB) · `assets/ficha.js` · `bigd.css` (panel,
  recorrido, lado a lado, evidencia, peso, tabla, campos, estados) · `diagrama.css` (nodo, insignias de
  paso, diff) · `design-system.md` v0.3.0 (§§ 3.5, 4, 5, 10, 11) · `diagramador-tokens.md` (§§ 4.3,
  9.2 bis/ter, 15) · README (cobertura) · portada de sala.

**Calculadora (fuera del repo, `scratchpad/calc3/`):** `nivel2.mjs` (nivel 2 y recorrido),
`lado.mjs`, `datos2.mjs` (EN + plataformas ficticias), páginas. Fórmulas en la propuesta § 9.

**Verificado en Chromium:** nivel 2 — ficha abre al tocar y por preajuste, Esc cierra; recorrido —
Anterior/Siguiente, flechas, Reproducir avanza cada 2 s y Pausar detiene, preajustes; con
`reducedMotion: reduce` el botón está oculto, no hay `data-animando` y la línea no tiene animación;
lado a lado — paginación por preajuste, pestañas de banda en angosto. Correcciones tras mirar: la
pregunta del glosario no encontraba «catálogo» (buscaba en dos campos, no en tres); la marca de rama
pisaba el nombre del nodo; el rótulo de fila del lado a lado se pintaba a 17 px y pisaba su meta (la
regla de 13 px vivía en la hoja equivocada); «previa privada» no cabía en el bloque mini (si no caben
cuenta y madurez, manda la madurez); el `<select>` del kit mezclaba idiomas (`<option>` no admite
`<span lang>`: dos `<select lang>`).

**Pasada de capturas de la mirada 2:** 408 encuadres sobre las seis páginas (estados × 2 temas × 2
idiomas × 380/1280 + deuteranopía, protanopía, tritanopía y acromatopsia en ES), **0 fallas de
medida**. Leídas como imagen: nivel 2 ficha oscuro ES 1280 y glosario oscuro ES 380; recorrido
bifurcación claro EN 1280; lado a lado tres oscuro ES 1280, diff claro ES 1280 y tres oscuro ES 380;
kit oscuro ES 1280 y claro ES 380.

**Hallazgo de la simulación (deuteranopía, nivel 2):** en «Agente de preguntas sobre datos» la
madurez «vista previa» pisaba «1 fuente» en la fila inferior del nodo; el arnés no lo ve porque los
dos textos son del mismo dueño. Regla nueva en la calculadora: con madurez a la vista, las fuentes
van como glifo + número. Deuda del arnés: medir solapes entre textos del mismo dueño.

### Mirada 2 — veredicto (2026-09-26)

Con los archivos abiertos: nivel 2 «muy bien logrado, mucho mejor que al inicio»; recorrido
«impresionante esa identificación visual»; lado a lado «muy alineado con lo que pensaba», con un
ajuste: **ver cuáles son los componentes detrás de «1, 2 o 3 comp.»**; kit «me gusta mucho».
**Mirada 2 aprobada con un ajuste** (registro en `docs/diseno/README.md`).

| #   | Decisión                                                                                                                                                                                                                       | Razón                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| D52 | **Ficha de bloque en el lado a lado**: cada bloque con componentes es activable (`db-nodo` + `data-nodo`, lo abre `ficha.js` en el mismo panel del nivel 2); lista glifo + nombre + madurez + fuentes; en < 900 px la fila lleva un desplegable y el panel no se muestra | Pedido del usuario; un solo mecanismo de ficha en toda la maqueta; en teléfono dos superficies eran redundantes |
| D53 | Las listas de componentes de Norte, Sur y Este son ficticias y **su conteo se verifica contra «N comp.»** en la calculadora; las de Ejemplo salen de los 14 nodos del mapa agrupados por banda                                   | Regla dura 12; el conteo y la lista no pueden divergir                                                          |

Preajuste nuevo «componentes» (`ficha:norte-ingesta`); los otros tres cierran la ficha. Verificado en
Chromium: clic abre «Preparación SQL» con 3 componentes, Esc cierra; en 380 px el desplegable de
«Permisos y máscaras» abre con 2 y el panel queda `display: none`. Capturas: 32 encuadres del lado a
lado, 0 fallas; leídos como imagen: componentes oscuro ES 1280, claro ES 380 y oscuro EN 380 (la
primera pasada mostró la hoja inferior y el desplegable a la vez en teléfono: se ocultó la hoja).
En la vista de diferencias, las dos versiones abren la ficha del mapa vigente (deuda menor: la
v0.2.0 no tiene lista propia).

## Fase 3 — Mirada 3: investigador, base de conocimiento, perfil del caso, comparación (2026-09-26)

Arrancó con el «continúa» del usuario tras la mirada 2 (aprobada con el ajuste D52).

| #   | Decisión                                                                                                                                                                                                                                        | Razón                                                                                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| D54 | **Los números de la comparación se calculan en la calculadora** (totales = Σ w·s/4, mínimo de esenciales, punto de inversión con la fórmula cerrada de C § 1.3, salida de la banda de empate por barrido a 0,1) sobre puntajes ficticios; nada se escribe a mano | Que las pantallas no se contradigan; la fórmula es la del núcleo futuro, pero vive fuera del repo (regla 8)      |
| D55 | **Once criterios ficticios** (6 de capacidad + 5 transversales: costo, cumplimiento y residencia, equipo, apertura, operación); esenciales: almacenamiento, gobierno, cumplimiento; escala 0–4 con nombres propios de la maqueta                    | C § 1.5 habla de 11 criterios; los nombres reales llegan con la base de conocimiento del S1                       |
| D56 | **La estrella «esencial» y todo símbolo se dibujan como SVG**: el gate `maqueta-vocabulario` atrapó «★» y «Σ» (no existen en Space Grotesk)                                                                                                       | Regla del gate: cero respaldo del sistema                                                                        |
| D57 | **Investigador: cuatro estados** (capa vencida con comando · propuesta con diff calculado y veredicto por afirmación: verificada / no verificable / no encontrada · aprobado · sin novedades con huella igual, fuentes y preguntas guía)            | TN § 4.5 (tres capas de verificación) y § 4.6 (diff por código; «sin novedades» = huella)                        |
| D58 | **Error de carga con el formato de TN § 3.2** (`archivo:línea:col · id · campo · regla`) y «qué pasa mientras tanto» (nada se calcula; la instantánea anterior sigue vigente)                                                                     | RF-01.2                                                                                                          |
| D59 | **Perfil: el borrador no se aprueba con una decisión implícita sin responder**; suma ≠ 100 y rango abierto deshabilitan «Aprobar» con aspa/aviso + texto                                                                                         | Orden (estados mínimos) y regla 13 (símbolo + texto)                                                             |
| D60 | **Comparación: cuatro vistas (totales · sensibilidad · robustez · pros y contras) como pestañas dentro de la página**, con el veredicto siempre arriba; la vista «ganadora clara» usa una segunda matriz (Norte 1/4 en gobierno)                    | Una pantalla por funcionalidad de la orden; el empate y la ganadora clara son la misma pantalla con otra base    |
| D61 | **Robustez «moderada (frontera)»**: 69,4 % con intervalo ±0,9 cruza el umbral 70; recuadro punteado = zona gris; vector central de pesos «¿qué tendría que creer el comité para que gane Norte?»                                                 | C § 1.4 y § 1.6                                                                                                  |

**Construido:** `investigador.html` (43 KB) · `base.html` (24 KB) · `perfil.html` (62 KB) · `comparacion.html`
(51 KB) · `bigd.css` (sección «miradas 3–4») · `comun3.mjs` (`pestanas`, barra con Conocimiento y Caso
activos; todas las páginas regeneradas) · `design-system.md` v0.4.0 (§ 5 + 16 componentes) · README
(cobertura) · portada.

**Calculadora:** `scratchpad/calc3/pagina-m3.mjs` (datos ficticios + fórmulas; imprime totales, t* y salida
del empate al generar: Ejemplo 75,75 · Norte 78,75 · Sur 63,75 · t* 14,8 · sale del empate en 31,9).

**Pasada de capturas de la mirada 3:** 136 encuadres (4 páginas × estados × 2 temas × 2 idiomas × 380/1280),
**0 fallas de medida** tras dos correcciones: (1) la insignia «elimina: Plataforma Este» no partía y desbordaba
21–30 px en 380 (ahora parte; la fila de restricciones se apila en angosto); (2) el semáforo «por revisar · 34
días» se partía dentro de la píldora (ahora `nowrap` y fila propia en angosto). Vistas como imagen: investigador
propuesta oscuro ES 1280, capas claro ES 380 y oscuro EN 380, sin novedades claro ES 1280; base evidencias
oscuro ES 1280, error oscuro EN 380; perfil suma claro ES 380, aprobado oscuro ES 380; comparación empate oscuro
ES 1280 y claro EN 1280, sensibilidad oscuro EN 380, robustez claro ES 1280. Correcciones tras mirar: el «1 ·»
del líder se colaba en el texto pequeño (selector `> b`); el rango del peso caía en la columna de 48 px en 380
(ahora ocupa la fila); columna de nombres de los totales de 220 a 340 u en ancho.

**Gates:** 51/51 · lint limpio · barrido de enlaces limpio salvo un hallazgo previo al sprint en `CHANGELOG.md`
(narraba el patrón con el literal `pages[.]dev`; venía del kit y se corrigió en este commit).

### Mirada 3 — veredicto (2026-09-26)

Con los archivos abiertos y el pedido en matrices (regla nueva del usuario: todo pedido de mirada va como
tabla dónde · qué mirar · qué espero que veas). Investigador «me gusta mucho esa cantidad de posibles
elementos de información para el control de los documentos de verificación»; base «excelente, muy
biblioteca y referencias»; perfil «interesante para entender la mayor incertidumbre»; comparación «esto es
impactante… de lo más valioso de la aplicación». Preguntas: la historia del empate se entiende; las tres
salidas del verificador son adecuadas; el bloqueo de «Aprobar» queda a mi criterio. Ajuste: **lado a lado,
«que se desplegaran los componentes visualmente»**. **Mirada 3 aprobada con un ajuste.**

| #   | Decisión | Razón |
| --- | -------- | ----- |
| D62 | **Se mantiene el bloqueo de «Aprobar» mientras haya una decisión implícita sin responder** (además de suma ≠ 100 y rango abierto) | Criterio delegado por el usuario. La tesis del producto es que los proyectos fracasan por decisiones implícitas: un perfil aprobado con una sin discutir es justo el fallo que la app promete evitar |
| D63 | **Vista «componentes» del lado a lado**: conmutador «Ver: bloques / componentes»; cada bloque se abre en su pila de nodos del nivel 2 (152 × 88), columnas alineadas por banda, paginación en las dos vistas; la ficha del bloque y el teléfono muestran **tarjetas de nodo** en lugar de lista | Pedido del usuario; se reutiliza el nodo del nivel 2 para que «componente» se vea igual en toda la app |
| D64 | En la vista desplegada el glifo va a 17 u y el nombre desde 29 u (en el nivel 2: 20 y 34) | «Filtros por fila y enmascaramiento»: la palabra más larga mide 116 u a 13/700 y no cabía en 110 |

Verificado en Chromium: el conmutador cambia de vista y conserva la página; «Siguiente» en la vista
componentes lleva a «desplegados, página 2»; en 380 px la vista componentes abre todas las filas de la banda.
Capturas: 48 encuadres + simulaciones de daltonismo del lado a lado, 0 fallas; leídas: desplegados oscuro ES
1280, ficha claro ES 1280, desplegados oscuro EN 380, desplegados claro ES 1280 con deuteranopía (transformación,
consumo y gobierno se acercan en tono; el glifo los separa).

### PRs de dependencias (pedido del usuario: «tengo problemas con los PR que están en cola»)

Los dos PR de dependabot nacieron a las 17:38–17:40 UTC, antes de 9547230 (fijar `@types/node@22`, 17:39 UTC).
El #1 (acciones: checkout, setup-node y upload-artifact a v7, pnpm/action-setup a v6) corrió su CI un minuto
antes del arreglo: `pnpm peers check` falló por `@types/node` 20 frente a vitest 5, y e2e y lighthouse quedaron
`skipping`. El #2 (react y react-dom 19.2.8 → 19.3.0) quedó en conflicto de lockfile con ese mismo commit, y su
lockfile además bajaba rolldown de 1.2.11 a 1.2.10 (la degradación silenciosa de la regla 18).
Regla 18: de a uno y dejando regenerar a dependabot. `@dependabot rebase` en el #1 → quality, e2e, lighthouse y
Vercel en `success` con conclusión propia → squash-merge (47e3b52). `@dependabot recreate` en el #2 sobre el main
nuevo: la regeneración **volvió a bajar** rolldown (1.2.11 → 1.2.10, las 15 variantes nativas), browserslist
(4.29.1 → 4.29.0) y electron-to-chromium (1.5.439 → 1.5.438), publicados el 24-09 (no es espera mínima de
publicación: el resolvedor de dependabot parte de un índice más viejo). Resolución a mano según la regla 18:
en un worktree aparte, `package.json` de dependabot + lockfile de main + `pnpm install --lockfile-only` →
solo cambian react y react-dom (19.2.8 → 19.3.0) y scheduler (0.27.0 → 0.28.0); comprobación paquete por
paquete: **ninguno queda por debajo de la versión más nueva de los dos lados**. Instalación real + peers check +
typecheck + lint + tests en verde; commit 6b4bd71 sobre la rama de dependabot; quality, e2e, lighthouse y Vercel
en `success` → squash-merge (7316528). La lección para el método: ninguna puerta compara el resultado de
dependabot contra la intención del PR; la comparación versión por versión la hice con un script de un solo uso
(queda como deuda proponer un gate: «un PR de dependencias no baja ninguna versión respecto de main»).
**Campo homepage del repo:** tenía la URL de producción (la GitHub App de Vercel lo reescribe); se limpia tras
cada merge a main (regla 17).

## Fase 4 — Mirada 4: decisiones y riesgos, hoja de ruta e informe, instrumento, recorrido (2026-09-26)

Arrancó con el «continúa» del usuario. Ese «continúa» llegó sin comentario sobre el ajuste del lado a lado
(componentes desplegados): **no lo aprueba** (regla de mirada), queda registrado como pendiente y se vuelve a
pedir en la matriz de esta mirada. La fase 4 no se construye encima del lado a lado.

Fuentes leídas: especificación original del usuario (`corpus/raw`, § 6.8–6.11 entidades, § 10.5 decisiones
candidatas, § 11 escalas, § 12 estructura del informe, M9 validación), investigación científica § 2 (prioridad
de acción) y § 3 (pre-mortem), especificación de features C15–C20 y los cambios E-3, E-9, E-10, E-13, E-15, E-23.

| #   | Decisión | Razón |
| --- | -------- | ----- |
| D65 | **Las siete decisiones candidatas del § 10.5, con dependencias propias del caso**, se ordenan por **Kahn por ondas** en la calculadora (4 ondas) y el ciclo sembrado catálogo ⇄ protección se encuentra por **DFS**; nada se ordena a mano | Es la lógica de `src/engine/decisiones.ts`; la maqueta no puede contradecirla |
| D66 | **Diagrama de ondas** con la gramática de líneas del diagramador: columnas = ondas, ruteo ortogonal por huecos, carril inferior para saltos y **carril superior cuando las dos puntas están en la primera fila** | La primera versión del ciclo tenía 3 cruces entre líneas (el salto por abajo cortaba dos dependencias); con el carril superior, 0 cruces y 0 tramos sobre tarjetas en los dos diagramas |
| D67 | **Reversibilidad sin color**: glifo + palabra + borde (una vía 2,5 px de tinta, costosa discontinuo, dos vías filete) | Regla 13; las decisiones no tienen matiz de la gramática |
| D68 | **Tabla de prioridad de acción v0 calibrada**: alta = S ≥ 9 (salvo O = 1) o S 7–8 con **O ≥ 3** o D ≥ 7 | La propuesta de C § 2.4 (O ≥ 4) dejaba el caso sembrado S8/O3/D4 en media; E-3 exige alta. Se declara como convención y la pantalla del instrumento muestra qué pasa si alguien la vuelve a O ≥ 4 |
| D69 | **La prueba barata es una tarea con responsable, fecha y costo**; la pantalla lo dice («planifica y controla; no ejecuta») | E-23 y regla dura 3 |
| D70 | **Hoja de ruta en cuatro fases** con la regla E-10 (pruebas baratas antes de las decisiones de una vía); 17 ítems, **todos con origen** (decisión, mitigación o supuesto) y criterio de cumplido; T-07 bloqueado por R-1 sin mitigación | C19 y regla dura 9 |
| D71 | **Informe de 14 secciones** con el resumen de líder **medido por código** al generar (43 palabras ES, 42 EN; el generador falla si pasa de 50); relato de fracaso escrito por el comité (autoría humana declarada); alerta 13 = «sin fuente primaria oficial» | E-9, E-13, E-23 |
| D72 | **Vista de impresión = papel claro en cualquier tema**: el generador de tokens emite el tema claro también para `.tema-claro` y dentro de `@media print`; el papel se separa con filete de 2 px, no con sombra | design-system § 3.4 prohíbe sombras (la primera versión usó una y un `#fff`; corregido antes de subir) |
| D73 | **Instrumento en tres estados**: verde (6/6 · 7/7 · 9/9 · 4/4 motores), rojo (el sembrado S8/O3/D4 sale media tras editar la tabla: 8/9, la fila dice qué se corrige) y «no se publica» (salida de terminal + qué queda vigente + cómo destrabar) | RF-09.3, RF-09.4, E-15 |
| D74 | **Portada = recorrido completo**: 11 pantallas + kit por sección, con códigos de la VISION, estados y el estado de su mirada; «Instrumento» y las pestañas 09–10 activas en todas las páginas | Orden de diseño (índice como recorrido) |

**Construido:** `decisiones.html` (97 KB) · `informe.html` (80 KB) · `instrumento.html` (40 KB) · `index.html`
(13 KB) · `assets/informe.js` · `bigd.css` y `diagrama.css` (sección mirada 4) · `scripts/paleta/generar-tokens.mjs`
(`.tema-claro` + `@media print`; tokens regenerados, gate de paleta 39/39) · `design-system.md` v0.5.0 (13
componentes) · README (cobertura, registro) · todas las páginas regeneradas con la navegación completa.

**Calculadora:** `scratchpad/calc3/datos4.mjs` (decisiones, riesgos, supuestos, ítems; Kahn + DFS + prioridad
de acción), `m4-comun.mjs` (diagrama de ondas con conteo de cruces), `m4-decisiones.mjs`, `m4-informe.mjs`,
`m4-instrumento.mjs`, `m4-indice.mjs`, `pagina-m4.mjs`.

**Pasada de capturas de la mirada 4:** 312 encuadres (4 páginas × estados × 2 temas × 2 idiomas × 380/1280 +
cuatro simulaciones de daltonismo), **0 fallas de medida** tras una corrección: el índice del informe
desbordaba 9–16 px a 380 (elemento de rejilla sin `min-width: 0`). Leídas como imagen: decisiones ondas oscuro
ES 1280, ciclo claro ES 1280, una vía oscuro EN 1280 (ficha), riesgos oscuro ES 1280, supuestos claro ES 380;
informe fases claro ES 1280, impresión oscuro ES 1280 (papel claro), informe oscuro EN 380; instrumento rojo
oscuro ES 1280; portada claro ES 1280. Ajuste tras mirar: las filas etiqueta/valor se apilan bajo 480 px.

### Veredicto de la mirada 4 (2026-09-26)

Textual, con los archivos abiertos: «0. Lado a lado: bueno, pues no está mal, pero yo lo pensaba en el mismo
diagrama sin necesidad de esa pantalla adicional; si es mucho esfuerzo, dejémoslo ahí, está bien.
decisiones.html: excelente detalle de la decisión. informe.html: esto sí que valió la revisión, excelente detalle
de actividades para desarrollar con su estado; esto es lo que vale la pena ver y detenernos, lo anterior… deja de
preguntar bobadas y avancemos, para eso hay un gate para revisión de pequeñeces. instrumento.html: esto también es
súper novedoso, muy interesante detalle de Casos de referencia, Propiedades, etc., súper valioso».

**Mirada 4 aprobada** y el ajuste del lado a lado aprobado como está. «Avancemos» abre la fase 5.

| #   | Decisión | Razón |
| --- | -------- | ----- |
| D75 | **El lado a lado conserva el conmutador bloques / componentes en la maqueta**; la intención del usuario (desplegar en el mismo diagrama) pasa al contrato como **nivel por banda en `compare`** (`diagramador-tokens.md` § 9.2 ter, fila «Mismo lienzo») | El usuario lo dejó a criterio del esfuerzo. Mezclar niveles por banda en una sola disposición es trabajo del motor de colocación, no de la referencia; dibujarlo a mano ahora fijaría un golden file que el motor todavía no sabe producir |
| D76 | **Los ajustes menores ya comentados no se vuelven a pedir como mirada**: se deciden, se registran y se juntan para la mirada 5 (G-Diseño) | Pedido del usuario («deja de preguntar bobadas y avancemos»). Las miradas siguen para artefactos nuevos; guardado en la memoria del proyecto |

## Fase 5 — Cierre: G-Diseño (2026-09-26)

Auditoría independiente, fase 1 (subagente que no construyó la etapa, con el diff delante):
`sprints/ETAPA-DISENO-auditoria.md`, veredicto **«requiere ajustes»**: 4 altos, 13 medios y 15 bajos. El
constructor confirmó A-01, A-02 y A-03 antes de presentarlo. El usuario aprobó la fase 2: «Apruebo que corrija».

### Fase 2 de la auditoría — pagos

**A-01 · generador versionado.** La calculadora pasa del scratchpad a `scripts/maqueta/`: `nucleo/` (datos,
glifos, métricas comunes, lectura en texto), `atlas/` (nivel 1), `pantallas/` (el resto), `rutas.mjs` (todo
relativo al repo; `MAQUETA_SALIDA` desvía la salida) y `generar.mjs` (`pnpm maqueta`: corre las 7 entradas, cada
una en su proceso, declara el árbol de salida y aborta fuera de `docs/diseno/` o de un temporal). Hallazgo que la
auditoría no vio: `nucleo/datos.mjs` leía el mapa de ejemplo y la gramática **de la planeadora por ruta
absoluta**; ahora son una copia fijada en `scripts/maqueta/entrada/` con `HUELLAS.json` (SHA-256) y el generador
aborta si no coinciden. Módulos que no alcanza ninguna página (disposición angosta retirada, direcciones de la
ronda 2, `inyectar.py`) no se copian. Se limpiaron 17 avisos de lint (variables sin usar) en lugar de ignorar la
carpeta; el lint cubre el generador. Primera corrida: las **13 páginas byte a byte iguales** a las versionadas.

| Gate | ¿Puede fallar? | Demo en rojo | A quién nombró | Verde al revertir |
| ---- | -------------- | ------------ | -------------- | ----------------- |
| `tests/unit/maqueta-deriva.test.ts` (14 aserciones: mismas páginas + una por página) | Sí: nada comparaba el HTML con su generador (el generador no estaba en el repo) | (1) «75,8» → «76,8» a mano en `comparacion.html`; (2) un nombre de decisión cambiado en `pantallas/datos4.mjs` sin regenerar | (1) `comparacion.html: difiere de lo que genera scripts/maqueta`; (2) `decisiones.html` e `informe.html` | ✓ 14/14 |

Nota de la demo: el primer intento reemplazó «75,75», que no existe en la página (muestra «75,8»), y salió verde
sin haber cambiado nada; se comprobó con `cmp` antes de repetirla. Una demo que no cambia el archivo no es roja.

**A-02 · robustez calculada.** El caso sale de `pagina-m3.mjs` a `scripts/maqueta/pantallas/caso.mjs` (criterios,
pesos, rangos, plataformas, evidencia limitante, totales, punto de inversión, salida del empate y **simulación**),
y la comparación y el informe leen de ahí. Simulación: sfc32 con semilla 20260926; pesos uniformes sobre el
politopo {Σw = 100, lo ≤ w ≤ hi} con los rangos enteros que muestra el perfil (±20 %, gobierno 20–30): mínimos por
transformación (espaciados de uniformes ordenadas, sin logaritmos) y máximos por rechazo (474 455 intentos para
10 000 muestras). Resultado: **Norte primera en el 100,0 %, a menos de 5 puntos de Ejemplo en el 99,0 %**; tres
semillas más dan la misma clase (Ejemplo gana en 1 de 30 000). Coincide con la medición del auditor (99,5 % con
rangos continuos ±20 %).

| #   | Decisión | Razón |
| --- | -------- | ----- |
| D77 | **La robustez del caso es «sólida» y el empate técnico también es estable**; la pregunta «¿qué tendría que creer el comité para que gane Ejemplo?» se responde con el punto de inversión (gobierno < 14,8, fuera del rango 20–30 declarado por el comité clínico). **Reemplaza a D61** («moderada (frontera)», cifras escritas a mano) | Las cifras salen del método que la página declara. La historia honesta refuerza la tesis: dentro de lo declarado, los pesos no deciden; deciden la evidencia limitante y los supuestos |
| D78 | **Ninguna cifra ni cardinalidad del caso se escribe a mano en el informe**: resumen de líder (49 palabras), recomendación, pesos con origen, «once criterios por tres plataformas» (en palabras desde N), filas de la matriz y sección de robustez se generan desde `caso.mjs` | A-02 y A-28/§ 6 de la auditoría: el S1 genera desde plantilla con N |

La zona gris y las clases «moderada» y «frágil» quedan sin pantalla porque el caso no las produce; el design
system lo declara (§ componentes, «Aceptabilidad por posición»).

**A-03 · todas las plataformas en el teléfono (+ A-22 orden declarado).** La vista angosta del lado a lado
filtraba `p.id !== "este"` y el selector dejaba a Este desmarcada aunque el lienzo ancho la mostraba. Ahora:
cada banda del teléfono apila **todas** las plataformas (medido: 9 bandas × 4 plataformas; 8 desplegables de Este,
la novena banda es «sin componentes»); el selector marca las 4 («Plataformas: 4 de 4»); la paginación en ancho
sale de una constante declarada (`POR_PAGINA = 3` en `lado.mjs`) y los textos de página, los `aria` y el título
(«Cuatro plataformas, el mismo mapa») se generan desde N. El orden es **por identificador**, el mismo en ES y EN
(el «orden alfabético» anterior no lo era en ninguno de los dos idiomas); por eso la página 1 pasa a Ejemplo,
Este y Norte, y la 2 a Sur. `diagramador-tokens.md` § 9.2 ter, fila N, al día.

Pasada de capturas tras A-02 y A-03: 128 encuadres (lado a lado, comparación e informe × estados × 2 temas × 2
idiomas × 380/1280), **0 fallas de medida**. Leídas como imagen: lado a lado «tres» oscuro ES 380 (las 4
plataformas apiladas en Fuentes) y comparación «robustez» claro ES 1280 (cifras de la simulación, sin zona gris).

**Medios y bajos pagados en la fase 2** (todos antes de la mirada 5; cada uno con su hallazgo en
`sprints/ETAPA-DISENO-auditoria.md`):

| Hallazgo | Pago |
| -------- | ---- |
| A-05 umbrales | D79 (abajo); `paleta-diagramador.test.ts` declara los mínimos como literales y exige umbral ≥ mínimo y peor par ≥ mínimo. **Demo en rojo:** `UMBRALES.normal = 0.05` en el generador → «el umbral normal del generador no baja del mínimo 0.1»; verde al revertir (46/46) |
| A-06 desviaciones | sección «Desviación del plan» al final de esta bitácora |
| A-07 § 16 | siete filas nuevas (angosta retirada, referencias en nivel 2, `compare` por banda, G10, codificación del nodo, ids de `<defs>`, umbral) y fuera la fila de D1 en angosto |
| A-08 tokens huérfanos | fuera `tipo-N-tinte` (16) y `tinta-3` (2); la búsqueda de paleta pierde su tercera condición (glifo sobre el relleno retirado) y, re-ejecutada, mueve dos claridades del claro: naranja `#ca7400` → `#d27908`, rojo `#c4474b` → `#c74a4d` (D80). Tablas de § 5.2 y § 5.3 regeneradas por script, no copiadas |
| A-09 grosor | § 7 dice 1,6 u (a demanda 2,8, haz 4), como `diagrama.css` |
| A-10 espacio, radios, peso | `--e-*` y `--radio-*` declarados como escala objetivo del S1 con los desvíos medidos; radio de control 4 px; hoja inferior 10 → 8 px; h1 y marca 800 → 700 (la cara llega a 700: sin cambio visible) |
| A-11 colores forzados | insignia «vencido» invertida (`CanvasText` / `Canvas`) y hueco de «sin copia» en `Canvas` |
| A-12 foco | `.dd-dec:focus-visible` y ficha abierta: borde 4 (reposo 2,5); regla escrita: el foco suma, jamás resta |
| A-13 saltos | `scripts/maqueta/pulir.mjs` (se aplica al escribir cada página): «Saltar al contenido» primer foco en las 13; «Saltar el diagrama» delante de cada lienzo (6), hacia la lectura en texto en el nivel 1 y detrás del lienzo en el resto |
| A-14 nombres accesibles | 15 `aria-label` pasan a par `data-aria-es` / `data-aria-en`; quedan solo los de la barra de sala (deuda declarada) y los nombres de idioma |
| A-15 reduced-motion | «Reproducir» queda en el DOM y el CSS lo oculta; `recorrido.js` ya no escribe `hidden`; textos de `design-system.md` § 3.5 y de la propuesta § 15 corregidos |
| A-16 nota de marcas | los documentos dejan de prometerla; nota y selector del atlas pasan al S1 (deuda) |
| A-17 foco de la ficha | `ficha.js`: al abrir por el usuario, foco al título; Esc o «Cerrar» lo devuelven al nodo; el modal de teléfono queda como contrato del S1 |
| A-18 atributo duplicado | la muestra de «a demanda» lleva un solo `stroke-width` (2,8, como el diagrama) |
| A-19 ids | `matriz-empate` y `matriz-clara`; «Ver puntajes» solo en la vista que tiene su matriz. Los `<defs>` repetidos entre lienzos quedan como cambio al serializador (§ 16) |
| A-20 plantilla | «Decisión de una vía / costosa de revertir / de dos vías», estado con mayúscula |
| A-21 títulos | «Big-D · sección · pantalla» según la navegación; portada «Big-D · Sala de diseño · Recorrido» |
| A-23 recorrido | pasos y numeración salen del HTML (`data-num`); «Paso n de N»; las flechas no cambian de paso con el foco en el lienzo, en campos o con modificadores |
| A-28 / A-32 | cardinalidades del informe y títulos desde N (D78); frases caducadas de § 4 corregidas en `design-system.md`, `diagramador-tokens.md`, `README.md`, `kit.html`, `bigd.css` y esta bitácora |

| #   | Decisión | Razón |
| --- | -------- | ----- |
| D79 | **Umbrales de paleta = los medidos** (ΔE ≥ 0,10 normal · ≥ 0,06 a severidad 0,6 · ≥ 0,03 en dicromacia) y **grises por glifo + etiqueta**, no por claridad. Reemplaza los umbrales de D8 | Separar 8 tipos a ΔL 0,05 pide 0,35 de rango de L; en el claro, los trazos a 3:1 sobre `sup-2` viven bajo L ≈ 0,67 y los más oscuros se confunden con la tinta. La regla 13 se cumple con la doble codificación. Se muestra al usuario en la mirada 5 |
| D80 | **La paleta es la salida de la búsqueda declarada**: al retirar el relleno tintado se re-ejecuta `pnpm paleta:buscar` y se adoptan sus dos claridades nuevas del claro | Dejar la paleta anterior habría sido fijarla a mano contra una condición que ya no existe |

Quedan como deuda con pago (no se pagan en la etapa): A-24 (endurecer los gates de la maqueta: `http://`,
escapes `\2713`, `title[data-en]`, `fill:` en CSS, sha de `metricas.json`) → S1 · A-25 (la maqueta viaja en
cada build: decidir tras G-Diseño y excluirla de `build:demo`) → S1 · A-27 (vacío en contexto) → S1 · A-29
(rol de los elementos activables) → sprint del diagramador · A-30 (degradados funcionales, ya declarados) · A-31
(rama `prefers-color-scheme` sin ejercer) → S1. A-26 (rama atrasada) se paga al abrir el PR a `main`.

## Desviación del plan

| Origen | Qué cambió | Quién lo decidió | Dónde queda |
| ------ | ---------- | ---------------- | ----------- |
| Orden «Ronda 1: propuesta completa» | La ronda 1 se partió en cuatro miradas por artefacto (método v1.21.0) | Constructor, declarado en el plan aprobado | plan · README § Plan de miradas |
| Plantilla del README del kit | La URL de aprobación no se escribe (regla 17): «preview del PR de `diseno/fundacion`» | Constructor, declarado en el plan (D18) | README § Registro de G-Diseño |
| Plan D1 / D11 (P5) | Se retira la disposición angosta: el diagrama es siempre horizontal y se desliza | Usuario, mirada 1 ronda 1 (D29) | propuesta § 1 y § 16 (G11, D1, G5, § 4, P10) |
| Plan D5 (P11) | Atkinson Hyperlegible → Space Grotesk + JetBrains Mono | Usuario, mirada 1 ronda 3 (D35, D40) | propuesta § 8 · design system § 3.3 |
| Plan D8 | Umbrales de paleta rebajados a lo medido; grises por glifo + etiqueta | Constructor, registrado tarde (A-05) | D79 · propuesta § 5.3 |
| Plan D7 | Nodo con relleno tintado → tarjeta `sup-2` + filete del tipo; tokens de tinte retirados | Dirección B elegida por el usuario (D32); limpieza tras la auditoría (A-08) | propuesta § 5.1 · D80 |
| Orden, pantalla 1 «banda sin bloque (N componentes)» | Una banda de un solo componente muestra su nombre | Constructor, ronda 2 (D34) | README § Cobertura |
| Especificación C § 2.4 | Tabla de prioridad v0: S 7–8 con O ≥ 3 (no ≥ 4) para que S8/O3/D4 salga alta | Constructor (D68), mostrado al usuario en la mirada 4 | decisiones.html · instrumento.html |
| Pedido del usuario, mirada 4 | El lado a lado conserva el conmutador; la expansión en el mismo lienzo va al contrato | Usuario («si es mucho esfuerzo, dejémoslo») (D75) | propuesta § 9.2 ter y § 16 |
| Plan Fase 1 | La nota de marcas se retiró con el cromo de la ronda 3 y no volvió | Constructor; declarado tras la auditoría (A-16) | design system § 6 y § 10 (deuda S1) |
| Regla 8 | El generador vivió fuera del repo hasta la auditoría | Constructor; corregido (A-01) | `scripts/maqueta/` · gate de deriva |
| Plan D61 | La robustez «moderada (frontera)» tenía cifras escritas a mano; ahora se calcula y sale «sólida» | Constructor; corregido (A-02, D77) | comparacion.html · informe.html |

### Hallazgo durante los pagos: la ficha del nivel 2 nunca abrió (N-1)

Al verificar A-17 en Chromium, la ficha de `atlas-nivel-2.html` no abrió ni con clic, ni con Enter, ni con el
estado «ficha abierta» de la sala. **La página no cargaba `assets/ficha.js` en ninguna versión versionada**
(desde 6a8ad53, mirada 2). La afirmación de esta bitácora en la fase 2 («Verificado en Chromium: nivel 2 — ficha
abre al tocar y por preajuste, Esc cierra») **era falsa**; ni la pasada de capturas ni el auditor lo vieron,
porque un panel cerrado también «mide bien». El usuario aprobó la mirada 2 sin haber podido abrir esa ficha:
se le muestra en la mirada 5.

Pago: `pagina-nivel2.mjs` carga `ficha.js` (como el lado a lado y las decisiones). Verificado en Chromium tras el
arreglo: Enter abre y lleva el foco al título; Esc y «Cerrar» cierran y devuelven el foco al nodo; el estado
«ficha abierta» muestra «Captura de cambios»; un clic en otro nodo cambia la ficha. Capturas leídas: ficha oscuro
ES 1280 (panel lateral) y claro ES 380 (hoja inferior).

| Gate | ¿Puede fallar? | Demo en rojo | A quién nombró | Verde al revertir |
| ---- | -------------- | ------------ | -------------- | ----------------- |
| `tests/unit/maqueta-controladores.test.ts` (13: una por página) — todo control dibujado tiene su script cargado (panel de ficha → `ficha.js`, recorrido → `recorrido.js`, lado angosto → `lado.js`, impresión → `informe.js`, lienzo → `lienzo.js`, conmutadores → `maqueta.js`) | Sí: ningún gate ni captura miraba si el control funciona; este defecto vivió cuatro miradas | El estado real del repo antes del arreglo (no hizo falta sembrarlo) | `atlas-nivel-2.html: panel de ficha sin assets/ficha.js` | ✓ 13/13 tras cargar el script |

Verificado también en Chromium: «Saltar al contenido» es el primer Tab; «Saltar el diagrama» + Tab cae dentro de la
lectura en texto del nivel 1; foco en «Relación con el directorio» 2,5 → 4 px; colores forzados: insignia vencida
`rect` blanco / texto negro (oscuro) y al revés (claro), hueco de «sin copia» en `Canvas`; movimiento reducido:
«Reproducir» en el DOM con `display: none` (sin preferencia: visible); el último paso dice «Paso 6b de 8».
Pasada de capturas tras los pagos: **392 medidas de las 13 páginas, 0 fallas**, más 208 encuadres de nivel 2,
recorrido y decisiones, 0 fallas.
