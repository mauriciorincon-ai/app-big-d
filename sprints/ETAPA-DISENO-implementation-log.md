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
| 1            | `diagramador-tokens.md` + `atlas-nivel-1.html` ⭐ (+ `design-system.md` v0.1)                                 | pendiente |
| 2            | `design-system.md` completo + `kit.html` + `atlas-nivel-2.html` + `atlas-recorrido.html` + `lado-a-lado.html` | pendiente |
| 3            | `investigador.html` · `base.html` · `perfil.html` · `comparacion.html`                                        | pendiente |
| 4            | `decisiones.html` · `informe.html` · `instrumento.html` · `index.html`                                        | pendiente |
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
