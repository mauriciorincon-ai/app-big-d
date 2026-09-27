# Auditoría independiente — Etapa de Diseño (F2a) de Big-D · Fase 1 (solo lectura)

- **Fecha:** 2026-09-26
- **Auditor:** subagente independiente. No construyó la etapa. Trabajó con el diff delante; la bitácora solo sirvió de contraste.
- **Alcance:** branch `diseno/fundacion` (PR #3, borrador), **16 commits** sobre `9547230`, de `e3db45c` a `16913d4`. El encargo decía 17; `git rev-list --count origin/main..HEAD` da 16.
  `git diff origin/main...HEAD --stat` → **49 files changed, 5983 insertions(+), 3 deletions(-)**.
- **Qué se leyó:** la orden `DISENO-orden.md`, el plan aprobado (D1–D18), `CLAUDE.md`, `audita-sprint.md`, el CONTRATO v0.2.0 (G10, G11, § 4, D1), los 49 archivos del diff y la bitácora (D19–D76).
- **Cómo se verificó:** mediciones propias con jsdom y Chromium (Playwright). No se escribió ningún archivo en ninguno de los dos repos.

---

## § 1 Cobertura de alcance

### Entregables de la orden

| Ítem | Clasificación | Evidencia |
|---|---|---|
| E1 `design-system.md` completo: tokens de ambos temas, tipografía, espaciado, radios, sombras, personalidad, 11 componentes canon, motion y reduced-motion, anti-patrones | Implementado con desviación | Existen todas las secciones (`design-system.md:16-285`). Pero la escala de espacio y los radios `--e-*` y `--radio-*` no existen en el CSS (A-10). El relleno tintado declarado no tiene consumidor (A-08). «El botón no existe» choca con la regla 5-a (A-15) |
| E2 Maqueta navegable del H1: HTML autocontenido, 380 px y desktop, dos temas, dos idiomas, desplegada y protegida | Implementado con desviación | 13 páginas en `docs/diseno/*.html`. El arnés da 392 medidas y 0 fallas (corrida propia). Sin sesión, el preview responde 302 (bitácora:109-111). **Con sesión nadie lo ha visto** (A-04). No hay disposición angosta: el usuario decidió P5 = siempre horizontal (D29) |
| E3 `diagramador-tokens.md`: P4, P5, P9, P11, paleta con umbral y daltonismo, 8 glifos, 4 trazos y marcadores, tipografía y mínimos, P10, leyenda y glosario, capa de animación | Implementado con desviación | § 0 a § 17 presentes. Umbrales rebajados y grises no exigidos (A-05). Grosor de flujo: el texto dice 2 u y el CSS pinta 1,6 (A-09). La nota de marcas se retiró de las páginas pero el texto la sigue prometiendo (A-16). La lista de cambios al contrato (§ 16) está incompleta (A-07) |
| E4 `docs/diseno/README.md`: pantalla → funcionalidad, estados, registro de miradas | Completo, con frases caducadas | `README.md:57-88` (miradas 1–4 registradas textualmente). `:90-99` es el registro de G-Diseño, pendiente como corresponde. Frases caducadas en § 4 |

### Las 11 pantallas y sus estados mínimos

Los estados se comprobaron como preajustes `data-estado`/`data-fija` con contenido `data-si` propio. Cada preajuste revela contenido y tiene su nota de sala.

| Pantalla | Clasificación | Evidencia |
|---|---|---|
| 1 Atlas nivel 1 | Implementado con desviación | `atlas-nivel-1.html:22-26`: propuesta · por revisar · vencido · P4 líneas · P9 capa. ES/EN y los dos temas por conmutador. 380 px como lienzo deslizable (D29). «Banda sin bloque («N componentes»)» se resolvió mostrando el nombre del componente (D34); el caso con N ≥ 2 no aparece |
| 2 Nivel 2 + ficha | Completo | `atlas-nivel-2.html:21-23` (mapa · ficha · glosario) y panel `:77`. Nodo en vista previa presente. Hoja inferior y panel lateral por CSS |
| 3 Recorrido | Completo | `atlas-recorrido.html:73-76` (estático · paso · bifurcación · animación). Hoja con `media="(prefers-reduced-motion: no-preference)"`; `recorrido.js:10,19` |
| 4 Lado a lado | **Parcial** | `lado-a-lado.html:21-26`: tres · desplegados · componentes · página 2 · diff. El selector no filtra (deuda a). **En teléfono la 4.ª plataforma no existe** (A-03) |
| 5 Investigador | Completo | `investigador.html:21-24`: capas con comando · propuesta (verificada / no verificable / no encontrada) · aprobado · sin novedades |
| 6 Base | Completo | `base.html:21-23`: evidencias (aprobada y propuesta) · error `archivo:línea:col · id · campo · regla` · instantánea con huella |
| 7 Perfil | Completo | `perfil.html:21-24`: borrador · suma ≠ 100 · rango abierto · aprobado. Restricción «elimina: Plataforma Este» `:63` |
| 8 Comparación | Implementado con desviación | `comparacion.html:21-26`, todos los estados. **Las cifras de robustez contradicen la matriz y los rangos de la propia página** (A-02) |
| 9 Decisiones y riesgos | Completo | `decisiones.html:21-25`: ondas · una vía · ciclo · riesgos · supuestos. Hallazgos de accesibilidad A-12 y A-20 |
| 10 Hoja de ruta e informe | Completo | `informe.html:21-24`: fases · alistamiento · informe (14 secciones verificadas) · impresión. Alerta «sin fuente primaria». Arrastra A-02 en `:67` |
| 11 Instrumento | Completo | `instrumento.html:21-23`: verde · rojo · bloqueo |
| Índice (recorrido) | Completo | `index.html`: 12 tarjetas, todas «mirada aprobada» |

### Gate G-Diseño y restricciones de identidad

| Ítem | Clasificación | Evidencia |
|---|---|---|
| Gate G-Diseño (veredicto sobre el despliegue, tokens cerrado, PR mergeado, aviso) | No implementado (esperado: fase 5 en curso) | `README.md:90-99` pendiente. Bloqueo real: A-04 |
| R1 Color nunca solo, paleta distinguible en grises y con daltonismo | Implementado con desviación | Glifo + etiqueta presentes. En grises, tipo-3 y tipo-8 quedan a ΔL 0,002 (`diagramador-tokens.md:200`) (A-05). Colores forzados: A-11 |
| R2 380 px sin desplazamiento de página | Completo, con desviación de «nivel 1 entero en el teléfono» (D29, decisión del usuario) | Arnés: 0 desbordes |
| R3 Neutralidad | Parcial | Cero `<img>` y cero logos. El selector de plataforma del atlas es un botón muerto y la nota de marcas no existe (A-16) |
| R5 Bilingüe | Implementado con desviación | Pares `lang` equilibrados en las 13 páginas. 14 `aria-label` solo en español (A-14) |
| R6 Datos sintéticos | Completo | Solo `https://example.org/ficticia/…`. «Microsoft Fabric» aparece solo en la declaración del autor |
| R7 Realizable por reglas | Implementado con desviación | Hay calculadora, pero vive fuera del repo (A-01) |
| R8 N plataformas | Parcial | A-03 y A-28 |
| R9 Estados con símbolo + texto | Completo, salvo el vacío | El estado vacío solo existe en `kit.html` (A-27) |

### Fases del plan aprobado

| Fase | Clasificación | Evidencia |
|---|---|---|
| Fase 0 | Implementado con desviación | Umbrales de D8 rebajados desde `e3db45c` sin registrarlo (A-05). Preview con sesión no verificado (A-04) |
| Fase 1 | Implementado con desviación | Falta «saltar el diagrama», que el plan pedía y el contrato exige en G10 (A-13). La angosta se retiró (D29). La nota de marcas se retiró en `a05a217` |
| Fase 2 | Implementado con desviación | A-03 y deuda (a) |
| Fase 3 | Implementado con desviación | A-02 |
| Fase 4 | Completo | — |
| Fase 5 | En curso | Esta auditoría |
| Plan de miradas | Miradas 1–4 registradas antes de construir encima; la 5 está pendiente | `README.md:59-68` |
| Cero código de producto | Completo | `git diff origin/main...HEAD --name-only \| grep -E '^(src/\|packages/)'` sale vacío |

---

## § 2 Hallazgos

### Altos

**A-01 · Alto · El generador de toda la maqueta vive fuera del repo**
- **Dónde:** `docs/diseno/README.md:29-45`, `diagramador-tokens.md:517-520`, bitácora `:131-134,306-307,370-371,458-460`.
- **Qué pasa:** las 13 páginas (unos 950 KB de HTML y SVG) salen de una «calculadora» de unos 560 KB de `.mjs` más un `inyectar.py`. Vive en `<scratchpad de la sesión>/{calc,calc2,calc3}`, un directorio efímero, con rutas absolutas escritas dentro (`writeFileSync("<repo>/docs/diseno/…")`).
- **Por qué importa:**
  - (1) La regla 8 dice «si el dibujo está mal se corrige el dato o la regla». Sin el generador, cualquier ajuste de esta auditoría o de G-Diseño obliga a editar SVG a mano.
  - (2) Las afirmaciones «nada se escribe a mano» (D54, D65) y «medido por código» (D71) no se pueden comprobar desde el repo. A-02 demuestra que al menos una cifra no salió del método.
  - (3) Es la misma clase de fallo que la regla 16: un entregable de ciclo fuera del repo no tiene versión, diff ni supervivencia.

**A-02 · Alto · Las cifras de robustez contradicen la propia pantalla**
- **Dónde:** `comparacion.html:85-86`, `informe.html:67` (sección Robustez y resumen de líder «La recomendación es moderada»).
- **Qué pasa:** la página dice «Ejemplo gana en el 69,4 % de las 10 000 combinaciones de pesos dentro de los rangos del perfil» y pregunta «¿Qué tendría que creer el comité para que gane Norte?».
  - Con la matriz mostrada (Norte 78,75 · Ejemplo 75,75), los pesos del perfil y los rangos declarados (±20 % relativo, `perfil.html`), se muestreó de forma uniforme el politopo {Σw = 100, 0,8w ≤ x ≤ 1,2w}: 180 438 muestras aceptadas.
  - Resultado: **Norte queda primera en el 100,0 %**, Ejemplo en el 0 %, y la distancia entre ambas es menor de 5 puntos en el 99,5 %.
  - La diferencia es lineal en los pesos y la región es simétrica respecto de su centro, así que quien gana en el centro gana al menos en el 50 % de las muestras. El 69,4 % para Ejemplo es imposible con el método que la página declara.
- **Por qué importa:**
  - Viola la regla dura 10 (incertidumbre visible, sin falsa precisión).
  - Es la pantalla que el usuario llamó «de lo más valioso de la aplicación».
  - Es referencia de fidelidad y de la demo H2.
  - El resumen de líder del informe se apoya en esa etiqueta.

**A-03 · Alto · El lado a lado en teléfono está cableado a tres plataformas**
- **Dónde:** `lado-a-lado.html:94` (`.lado-angosto`), `:77` (paginación), `assets/bigd.css:168-169`, `lado-a-lado.html:71`.
- **Qué pasa:**
  - Por debajo de 900 px la paginación se oculta (`.paginacion { display:none }`).
  - Las 9 bandas de la vista angosta contienen **solo** Ejemplo, Norte y Sur: «Este» aparece 0 veces en `.lado-angosto`.
  - En ancho, Este sí aparece en la página 2 aunque su casilla del selector está desmarcada.
- **Por qué importa:** la restricción 8 de la orden dice «ninguna pantalla asume tres». La casilla 6 de `/audita-sprint` clasifica como Alto un literal donde el dato dice N. La referencia del teléfono enseña el patrón prohibido y deja a la 4.ª plataforma inalcanzable.

**A-04 · Alto · El preview con sesión jamás se ha visto (reclasifica la deuda e)**
- **Dónde:** bitácora `:112-114,171,210-212`; `README.md:61-68` (todas las miradas «abierto en local»).
- **Qué pasa:** el usuario reportó dos veces que el preview «no le abrió». No hay diagnóstico registrado. Las miradas 1–4 se hicieron por `file://`.
- **Por qué importa:** la orden exige «El usuario aprueba sobre la maqueta desplegada (no sobre capturas tuyas)». Con el despliegue sin comprobar, la mirada 5 no puede ocurrir y G-Diseño no puede cerrar.

### Medios

**A-05 · Medio · Umbrales de paleta rebajados sin decisión registrada; la paleta no se distingue en grises**
- **Dónde:** `scripts/paleta/generar-tokens.mjs:118-126`, `diagramador-tokens.md:186-200`, `tests/unit/paleta-diagramador.test.ts:4-9,88-96`.
- **Qué pasa:**
  - El plan aprobado (D8) fijaba ΔE ≥ 0,10 en visión normal y a severidad 0,6, ≥ 0,08 a 1,0, y ΔL ≥ 0,05 en grises.
  - Desde el primer commit (`e3db45c`) el código usa 0,10 / 0,06 / 0,03 y **no exige grises**. Ninguna decisión D-nn lo registra.
  - Resultado medido: tipo-3 y tipo-8 quedan a ΔL 0,002 en oscuro y 0,001 en claro. La restricción 1 de la orden (no negociable) pide distinguirse en escala de grises.
  - El test importa `UMBRALES` del mismo generador que produce la paleta: bajar el umbral y la paleta a la vez deja el gate en verde.
- **Por qué importa:** el umbral pasa a ser dato del CONTRATO v0.3.0. La planeadora debe ver la desviación como tal, no deducirla de una tabla.

**A-06 · Medio · La bitácora no tiene la sección «## Desviación del plan»**
- **Dónde:** `sprints/ETAPA-DISENO-implementation-log.md` (no hay coincidencias para «Desviaci»).
- **Qué pasa:** `CLAUDE.md` manda anotar ahí los cambios al plan y a la orden. Faltan incluso las dos desviaciones que el propio plan declaró:
  - ronda 1 = cuatro miradas;
  - URL fuera del README.

  Tampoco están:
  - P5 sin angosta (D29), que cambia G11, D1 y G5;
  - P11 Atkinson → Space Grotesk (D40);
  - los umbrales de A-05;
  - «banda sin bloque» con nombre (D34);
  - la tabla de prioridad v0 recalibrada frente a C § 2.4 (D68);
  - el lado a lado con conmutador (D75);
  - la nota de marcas retirada;
  - el generador fuera del repo.
- **Por qué importa:** es el canal que la planeadora lee al cerrar. Si no está ahí, se pierde.

**A-07 · Medio · § 16 de `diagramador-tokens.md` está incompleto y tiene una fila caducada**
- **Dónde:** `diagramador-tokens.md:472-485`.
- **Qué pasa:**
  - Faltan las filas del cambio más grande: retirar la disposición angosta (CONTRATO G11 dice «dos disposiciones… si la letra quedaría por debajo de 12 px se usa la angosta»; también D1, G5, § 4 y P10) e introducir la garantía de desplazamiento lateral (§ 1).
  - Faltan las referencias en el nivel 2 (§ 4.3 dice «§ 4.1 y § 4.2», la tabla solo trae § 4.1).
  - Faltan el nivel 2 y el nivel por banda en `compare` (§ 9.2 ter, D63/D75), el cambio de codificación del nodo (A-08) y el espacio de nombres de ids por SVG (A-19).
  - La fila «CONTRATO D1: confirmar la lectura… en angosto» es falsa: ya no hay angosta.
- **Por qué importa:** es la lista que la planeadora absorbe. Lo que no esté ahí no llega al contrato.

**A-08 · Medio · 18 tokens de color sin consumidor y una codificación de nodo que la referencia no usa**
- **Dónde:** `assets/tokens.css` (`--tipo-1-tinte`…`--tipo-8-tinte` y `--tinta-3`, en los dos temas), `generar-tokens.mjs:128-135,146,156`, `diagramador-tokens.md:155-156`, `design-system.md:64`, `paleta-diagramador.test.ts:57-59,69`.
- **Qué pasa:**
  - `grep var(--tipo-N-tinte)` y `var(--tinta-3)` sobre todo el CSS y el HTML dan **0** usos.
  - La dirección B pinta el nodo con `.db-card { fill: var(--sup-2); stroke: var(--linea) 1 }` más un filete de 4 u (`diagramador-tokens.md:344`).
  - Aun así, § 5.1 sigue describiendo «relleno tintado… borde de 2 u en el matiz» (D7), y `design-system.md:64` dice que el tinte se usa «para tarjetas e insignias».
  - El gate mide contraste del glifo y de la tinta sobre una superficie que no existe.
- **Por qué importa:** es contrato para el renderizador (G13), y el gate afirma algo decorativo.

**A-09 · Medio · El grosor de flujo difiere entre la propuesta y la referencia**
- **Dónde:** `diagramador-tokens.md:279` («grosor 2 u») frente a `assets/diagrama.css:20` (`.db-linea { stroke-width: 1.6 }`).
- **Qué pasa y por qué importa:** los *golden files* (1,6) y el contrato (2 u) dirían cosas distintas. El piloto chocará con uno de los dos.

**A-10 · Medio · La escala de espacio y radios del design system no existe en el CSS**
- **Dónde:** `design-system.md:75,90-97,204`; `assets/bigd.css:24,42,114,140`.
- **Qué pasa:**
  - `--e-1…--e-7`, `--radio-control` y `--radio-caja` no están definidos en ningún CSS.
  - El CSS usa 10, 14, 18, 22 y 28 px como distancias frecuentes (41, 27, 22, 4 y 8 usos), pese a que el documento dice «toda distancia sale de esta escala».
  - La hoja inferior tiene radio de 10 px (el anti-patrón fija «radios > 8 px en cajas», `:114`).
  - El botón tiene esquina de 4 px (`:140` y `design-system.md:204`), pero el token para botones es de 6 px.
  - h1 y la marca usan peso 800 (`:24,42`), pero la cara declarada es `font-weight: 300 700` (`fuentes.css`): se pinta a 700.
- **Por qué importa:** el S1 mapea estos tokens a `@theme`. Seguir el documento rompe la fidelidad a la maqueta, y seguir la maqueta contradice el documento.

**A-11 · Medio · Colores forzados: la insignia «vencido» queda en blanco y «sin copia» pierde su doble línea**
- **Dónde:** `assets/diagrama.css:43-46`.
- **Qué pasa (medido en Chromium con `forcedColors: "active"`):**
  - Oscuro: el relleno de la insignia es `rgb(0,0,0)` y el texto «63 d» y la marca son `rgb(18,22,28)`.
  - Claro: el relleno es `rgb(255,255,255)` y el texto y la marca son `rgb(249,250,252)`. En los dos casos, invisibles.
  - `.db-doble-int` queda con `stroke: CanvasText` por la regla genérica `.db-linea`, así que la doble línea de «sin copia» se vuelve una línea gruesa sólida.
- **Por qué importa:** § 14 de la propuesta promete que en colores forzados «quedan glifo, trazo, marcador y texto». El semáforo es de regla dura 13.

**A-12 · Medio · El foco no se ve en las decisiones de una vía y en ciclo**
- **Dónde:** `assets/diagrama.css:27` frente a `:60,65`.
- **Qué pasa:** `.db-elem:focus-visible [data-caja]` pone `stroke-width: 2`, que gana por especificidad sobre `.dd-una_via .dd-caja { 2.5 }`. Medido: en reposo `2.5px` y con foco `2px`, mismo color. El foco adelgaza el borde. Lo mismo ocurre con `aria-current`, el estado de ficha abierta.
- **Por qué importa:** WCAG 2.4.7. La tarjeta de una vía es la decisión crítica del producto.

**A-13 · Medio · No hay «saltar el diagrama» ni salto al contenido en ninguna página**
- **Dónde:** las 13 páginas; `atlas-nivel-1.html:51` (`<main id="contenido">` existe sin enlace) y `:117` (lectura sin enlace desde el SVG).
- **Qué pasa:** CONTRATO G10 exige la versión en texto «enlazada desde la raíz del SVG y con «saltar el diagrama»». El plan (Fase 1) lo listaba. El nivel 2 tiene 14 nodos enfocables y el lado a lado 52: hay que tabular por todos antes de llegar a la lectura.
- **Por qué importa:** es una garantía del contrato que la referencia no cumple, y el piloto la reproducirá tal cual.

**A-14 · Medio · 14 nombres accesibles solo en español**
- **Dónde:** `atlas-nivel-1.html:39,47,62` y equivalentes en todas las páginas.
- **Qué pasa:** hay `aria-label` estáticos sin par `data-aria-en`: «Secciones», «Tema», «Nivel de lectura», «Mapa», «Ir a una capa», «Sección», «Vistas de la comparación», «Vistas», «Decisiones», «Ir a una onda», «Secciones del informe», «Secciones del kit», «Pestañas», «Lado a lado», «Banda». Los de la barra de sala son deuda declarada; estos no.
- **Por qué importa:** regla 20 (bilingüe en todo). En inglés, el lector de pantalla anuncia hitos en español.

**A-15 · Medio · «El botón no existe» contradice la regla 5-a para el producto**
- **Dónde:** `design-system.md:110`, `diagramador-tokens.md:466`, `assets/recorrido.js:19`.
- **Qué pasa:** la fuente de verdad prescribe que con movimiento reducido el botón «Reproducir» **no existe**. La regla 5-a dice que la forma del árbol jamás depende de `useReducedMotion()` (React #418). La maqueta lo oculta con `hidden` desde JS.
- **Por qué importa:** el S1 implementará la ficha y el recorrido leyendo esa frase. Es la reincidencia que el kit ya documentó.

**A-16 · Medio · El selector de plataforma del atlas está sin diseñar y la nota de marcas prometida no existe**
- **Dónde:** `atlas-nivel-1.html:59`, `atlas-nivel-2.html:52` (botón «Cambiar de plataforma» sin estado ni menú); `design-system.md:210-211`, `diagramador-tokens.md:437-441`.
- **Qué pasa:** el plan (D15) situaba los nombres reales en el selector del atlas. La nota «Databricks, Microsoft Fabric y Snowflake son marcas…» se retiró en `a05a217` y hoy no existe en ninguna página, pero ambos documentos la siguen prometiendo.
- **Por qué importa:** el S1 («Atlas de Fabric») es el primer lugar donde aparecen nombres reales. No hay referencia para el selector con N ni para la nota (reglas 5 y 12).

**A-17 · Medio · La ficha (hoja o panel) no tiene contrato de foco**
- **Dónde:** `design-system.md:162`, `assets/ficha.js:8-20`, `atlas-nivel-2.html:77`.
- **Qué pasa:** al abrir, el foco no se mueve. Al cerrar con Esc, no vuelve al nodo. No hay semántica de diálogo en la hoja inferior (`position: fixed`) ni anuncio.
- **Por qué importa:** es un componente canon del S1. Una hoja inferior sin gestión de foco es un fallo de accesibilidad conocido.

### Bajos

- **A-18 · Bajo · Atributo duplicado en la muestra de «a demanda».** `atlas-nivel-1.html:110` y `kit.html:46` repiten `stroke-width` (`="2" … ="2.8"`). El parser toma el primero, así que la muestra de la leyenda sale a 2 u y el diagrama a 2,8 u.
- **A-19 · Bajo · Ids duplicados.** `atlas-nivel-1.html` tiene 16 (defs repetidos en 3 SVG), `lado-a-lado.html` 13, `decisiones.html` 5 y `comparacion.html:72,75` duplica `id="matriz"`. Los 6 enlaces `#matriz` apuntan al primero, que vive en la vista «clara»: en las otras 5 vistas el ancla lleva a un elemento oculto y no desplaza. Para el contrato: los ids de `<defs>` deberían ir con espacio de nombres por SVG.
- **A-20 · Bajo · Error de plantilla en el texto accesible.** `decisiones.html:66,69` dice «Decisión de costosa. pendiente.»; en inglés «costly decision. pending.», con minúscula tras punto.
- **A-21 · Bajo · Títulos de página confusos.** Todas las páginas se titulan «Big-D · Atlas · …», también Comparación, Decisiones, etc. `index.html` y `atlas-recorrido.html` comparten el título en español «Big-D · Atlas · Recorrido».
- **A-22 · Bajo · Orden del selector.** `lado-a-lado.html:69-73` dice «Orden alfabético / Alphabetical order». En inglés el orden sale Example, East, North, South, que no es alfabético. Las filas van Ejemplo, Norte, Sur | Este sin regla declarada. Este está desmarcada pero se muestra (ligado a la deuda a).
- **A-23 · Bajo · Flechas del recorrido.** `assets/recorrido.js:35-39` captura ←/→ en todo el documento, incluso con el foco en el lienzo deslizable, cuya ayuda dice que las flechas lo mueven. Además `:7-8,16` fija 8 pasos («de 8») y `design-system.md:164` dice «Paso n de 8»; el número de pasos es dato del mapa.
- **A-24 · Bajo · Debilidades de los gates.**
  - `maqueta-autocontenida.test.ts:15`: no atrapa `http://localhost:…`, IPs ni `data:`, y solo lee html/css/js (no `.svg` ni `.json`, que `copiar-maqueta` sí sirve).
  - `maqueta-vocabulario.test.ts:53`: `content:` solo con comillas dobles; los escapes `\2713` pasan; no lee el texto de atributos (`title[data-en]`); `<image>` y `background-image` no se revisan.
  - `maqueta-vocabulario.test.ts:74`: `style="color:var(--linea)"` pasa, porque la regex exige `;{\s` antes de `color`; tampoco revisa `fill:` en CSS.
  - `paleta-diagramador.test.ts:39-45`: el nombre dice «exactamente un token por tipo de la gramática» pero no compara contra la gramática.
  - `fuentes/metricas.json` lleva sha256 que ningún test compara.
- **A-25 · Bajo · La maqueta viaja con cada build de producción.** `package.json:7`: `build` copia `docs/diseno/` a `public/diseno/` en cada build, incluida producción tras el merge (detrás de Vercel Authentication). Hay que decidir tras G-Diseño si se queda y garantizar que `build:demo` (H2, público) no la arrastre.
- **A-26 · Bajo · Rama atrasada.** La rama va 2 commits detrás de `main` (`47e3b52`, `7316528`: react 19.3.0). Hay que actualizarla antes del merge final y comprobar la conclusión propia de cada check.
- **A-27 · Bajo · Vacío solo en el kit.** El estado vacío solo existe en `kit.html` («Sin casos todavía»); ninguna pantalla lo muestra en contexto. `design-system.md:136` afirma que se diseñó en las miradas 3–4.
- **A-28 · Bajo · N > 3 sin demostrar en la comparación.** La comparación nunca muestra más de 3 plataformas puntuadas, porque el caso elimina a Este: la matriz, los totales y la aceptabilidad con N creciente no tienen referencia. `assets/lado.js:11` cablea la paginación a 2 páginas (`{1:…, 2:…}`); es de maqueta, pero conviene declararlo.
- **A-29 · Bajo · Rol de los elementos activables.** Los bloques y nodos activables llevan `role="graphics-symbol img"` con `tabindex="0"` (`atlas-nivel-1.html:83`). Un rol de imagen no anuncia que se puede activar; hoy solo lo compensa el texto «Ábrelo…» en el lado a lado.
- **A-30 · Bajo · Degradados.** `design-system.md:24,249` prohíbe degradados, pero `bigd.css:71,76-77` los usa (rejilla punteada `radial-gradient` y sombras de borde `linear-gradient`). Son funcionales; falta declararlos como excepción.
- **A-31 · Bajo · Tema del sistema nunca aplica.** Todas las páginas fijan `<html data-theme="oscuro">` y `maqueta.js:26` lo respeta. La rama `prefers-color-scheme: light` de `tokens.css` nunca se ejerce, aunque `design-system.md:258-259` la declara como comportamiento.
- **A-32 · Bajo · Frases caducadas.** Detalle y texto propuesto en § 4.

---

## § 3 Ajustes ejecutables

> Las páginas `docs/diseno/*.html` son **generadas**. Todo cambio en ellas se hace en el generador (hoy `…/scratchpad/calc*`; tras A-01, `scripts/maqueta/`) y se regenera. Aquí se describe el cambio que debe aparecer en el HTML de salida. Tras cada ajuste corren `pnpm lint && pnpm typecheck && pnpm test` y `node scripts/capturar-maqueta.mjs --solo-medir`, y todo debe quedar verde y con «0 fallas de medida».

### A-01 · Versionar el generador

1. Copiar al repo, en `scripts/maqueta/` (conservando `calc/`, `calc2/`, `calc3/`), **todo módulo alcanzable** desde los scripts que escriben `docs/diseno/*.html`. Hoy eso incluye:
   - `calc/{comun,datos,glifos}.mjs` y lo que importen;
   - `calc2/metrica.mjs`;
   - `calc3/*.mjs`;
   - `inyectar.py` si sigue en uso.

   Nada va a `packages/`, porque la orden lo prohíbe antes de G-Diseño.
2. Reemplazar cada ruta absoluta `"<repo>/…"` por una ruta relativa al repo, por ejemplo `resolve(dirname(fileURLToPath(import.meta.url)), "../../..")`. Esto también evita publicar la ruta personal en un repo público.
3. Crear `scripts/maqueta/generar.mjs`, que regenera las 13 páginas, y el script `"maqueta": "node scripts/maqueta/generar.mjs"` en `package.json`.
4. Poner una cabecera en cada archivo: «Generador de la REFERENCIA de la Etapa de Diseño. No es el motor ni el paquete del diagramador; se congela tras G-Diseño».
5. Si ESLint falla sobre esos `.mjs`, añadir `"scripts/maqueta/**"` a `globalIgnores` en `eslint.config.mjs` y anotarlo en la bitácora.
6. Gate de deriva, con demo en rojo en el mismo commit (regla 15): crear `tests/unit/maqueta-deriva.test.ts` que ejecute el generador hacia un directorio temporal y compare byte a byte con `docs/diseno/*.html`. Como mínimo aceptable, un paso de CI `pnpm maqueta && git diff --exit-code docs/diseno`. Demo: cambiar un número en los datos y ver el rojo.
7. **Verificado cuando:**
   - en un clon limpio, `pnpm maqueta` deja `git status --porcelain docs/diseno` vacío;
   - `git grep -n "/Users/" -- scripts` no imprime nada;
   - la demo en rojo del gate de deriva queda registrada en la bitácora.

### A-02 · Recalcular la robustez

1. En el generador de la mirada 3 (`calc3/pagina-m3.mjs`) calcular la simulación de verdad:
   - sfc32 con la semilla mostrada (20260926);
   - 10 000 muestras uniformes en el politopo {Σw = 100, 0,8·wᵢ ≤ xᵢ ≤ 1,2·wᵢ}: muestrear 10 coordenadas, despejar la 11.ª y rechazar si sale de su caja;
   - ordenar por total con desempate leximin, empates 1/k;
   - aceptabilidad por puesto, vector central, intervalo del 95 %;
   - etiqueta con los umbrales declarados (70 / 50).
2. **Resultado esperado con los datos actuales:** Norte 1.ª ≈ 100 %, Ejemplo 2.ª ≈ 100 %, |Norte − Ejemplo| < 5 en ≈ 99,5 %. Cambios en el HTML:
   - `comparacion.html:85-86`: la tarjeta pasa a «Norte queda primera en el 100 % de las combinaciones; en el 99,5 % sigue en empate técnico con Ejemplo: el orden es estable, la distancia no alcanza para declarar ganadora», con su par EN redactado;
   - el vector central pasa a preguntar «¿Qué tendría que creer el comité para que gane Ejemplo?»;
   - `informe.html:67`: la sección Robustez y el resumen de líder se ajustan a la etiqueta nueva, con el resumen medido y ≤ 50 palabras en ES y en EN.
3. **Alternativa**, si se quiere conservar la historia de «frontera»: cambiar el caso (rangos más anchos, por ejemplo gobierno ±50 %, o una matriz más cercana) y recalcular **todo**: totales, punto de inversión, salida del empate y robustez. Es una decisión para la mirada 5.
4. **Verificado cuando:**
   - el generador imprime las aceptabilidades y coinciden con cada porcentaje visible en las dos páginas;
   - la ganadora en los pesos centrales tiene aceptabilidad de 1.er puesto ≥ 50 %;
   - `grep -c "69,4" docs/diseno/*.html` da 0, salvo que el nuevo cálculo lo produzca.

### A-03 · Mostrar todas las plataformas en teléfono

1. En el generador del lado a lado (`calc3/lado.mjs` y `pagina-lado.mjs`), la vista angosta debe emitir, **en cada una de las 9 `.lado-banda`, una fila por cada plataforma de la comparación**, en el orden declarado (ver A-22).
2. Salida esperada en `lado-a-lado.html` tras la línea 94: cada `.lado-banda` tiene 4 filas.
   - La 4.ª es «Plataforma Este (ficticia) / East Platform (fictional)» con el bloque de esa banda, tomado de los mismos datos que el lienzo `lado-pag-2`: Sistemas de origen 1 · Entrada de eventos 1 (Beta) · Almacén abierto 2 · Preparación 1 · Tableros 2 · Modelos y agentes 2 (Beta) · Catálogo y linaje 2 · Operación y costo «sin componentes» · Orquestador 1 (Anunciado).
   - Cada fila lleva su desplegable `[data-comp="este-<banda>"]` con tarjetas de nodo.
3. `lado-a-lado.html:71`: la casilla de Este pasa a `checked`, porque la vista compara 4.
4. Declararlo en `diagramador-tokens.md` § 9.2 ter, fila «N»: «en < 900 px, una banda a la vez con **todas** las plataformas de la comparación apiladas; sin paginar».
5. **Verificado cuando:**
   - un script jsdom cuenta «Este» dentro de `.lado-angosto` ≥ 9 veces;
   - el arnés a 380 px da 0 fallas;
   - la captura 380 px oscuro ES y claro EN de «tres» y «desplegados» se lee como imagen y la bitácora lo registra.

### A-04 · Desbloquear la mirada sobre el despliegue

1. Antes de pedir la mirada 5, mandar un mensaje cuya primera línea sea: «¿Te abre la maqueta en el preview? Ábrela con tu sesión de Vercel: preview del PR #3, ruta /diseno/index.html, en el teléfono y en el computador». Pedir la respuesta como tabla: dónde · qué viste · qué esperabas.
2. Diagnóstico según lo que vea:
   - **404:** revisar en el proyecto de Vercel que Build Command sea `pnpm build`, no `next build`, y que Output Directory sea `out`. Revisar que el log del build del deployment contenga la línea `copiar-maqueta: … → …/public/diseno`.
   - **Bucle de inicio de sesión en el teléfono:** la protección exige una cuenta de Vercel con acceso al proyecto; el usuario debe iniciar sesión en el navegador del teléfono.
   - Jamás crear un enlace público ni un bypass (reglas 14 y 17).
3. Registrar el resultado en la bitácora y en `docs/diseno/README.md`: fila del registro de miradas y campo «Dónde se aprobó».
4. **Verificado cuando:** el README tiene una fila con la respuesta textual del usuario que delata haber abierto el **preview desplegado**, no el archivo local, en teléfono y en computador. Solo entonces se pide la mirada 5.

### A-05 · Umbrales y grises

1. Añadir a la bitácora la decisión **D77**: «Umbrales ΔE: 0,10 normal / 0,06 severidad 0,6 / 0,03 dicromacia; grises no exigidos por pares. El plan aprobado (D8) decía 0,10 / 0,10 / 0,08 y ΔL ≥ 0,05; se rebajó en e3db45c. En grises, tipo-3 ~ tipo-8 = ΔL 0,002». Registrarla también en «## Desviación del plan» (A-06).
2. Incluirla como punto explícito en la pregunta de la mirada 5, porque la orden la declara no negociable.
3. En `tests/unit/paleta-diagramador.test.ts`, declarar umbrales literales propios, por ejemplo `const MINIMOS = { normal: 0.1, "protan-0.6": 0.06, … }`, y comprobar que cada `UMBRALES[v] >= MINIMOS[v]` y que el peor par ≥ `MINIMOS[v]`.
4. Demo en rojo: bajar `UMBRALES.normal` a 0,05 en el generador y ver fallar el test.
5. **Verificado cuando:** la demo queda registrada y `diagramador-tokens.md:186-189` cita D77.

### A-06 · Sección «## Desviación del plan»

Añadir la sección a `sprints/ETAPA-DISENO-implementation-log.md` con una fila por desviación: origen · qué cambió · quién lo decidió · dónde queda. Las filas son las diez de A-06, más «tabla de prioridad v0 (D68) frente a C § 2.4».

**Verificado cuando:** `grep -n "## Desviación del plan"` encuentra la sección y tiene al menos 10 filas.

### A-07 · Completar § 16

Añadir a la tabla de `diagramador-tokens.md` § 16:

| Dónde | Cambio |
|---|---|
| CONTRATO G11, D1, G5, § 4, P10 | se retira la disposición angosta. G11 pasa a: «una sola disposición, a escala 1 (piso 12 px); si no cabe, el lienzo se desliza de lado con índice de capas, sombras de borde y pista; la página jamás desborda» |
| CONTRATO § 4.2 | en el nivel 2, los flujos con una franja son referencias (D44) |
| CONTRATO § 4.4 `compare` | acepta el nivel 2 alineado por banda (D63) y el nivel por banda en el mismo SVG (D75) |
| Codificación del nodo | tarjeta `sup-2` + filete de 4 u del tipo (D7 retirado; ver A-08) |
| Serializador | ids de `<defs>` con espacio de nombres por SVG (A-19) |

Además, quitar la fila «CONTRATO D1: confirmar la lectura… en angosto».

**Verificado cuando:** § 16 contiene las filas y `grep -n "en angosto" docs/diseno/diagramador-tokens.md` no devuelve instrucciones vigentes.

### A-08 · Tokens sin consumidor

Opción recomendada: retirarlos.

1. En `generar-tokens.mjs`, eliminar `TINTE`, `tinteDe` y la emisión de `${tp.token}-tinte`.
2. Decidir sobre `tinta-3`:
   - úsalo en `.db-guia` en lugar de `--linea` (`diagrama.css:7`),
   - o retíralo y deja `TINTAS_VETADAS = ["linea"]`.
3. Correr `pnpm tokens` para regenerar.
4. En el test, quitar la aserción del glifo sobre el tinte (`:57-59`) y los tintes de la lista de fondos (`:69`). Añadir el contraste del glifo del tipo sobre `sup-2`, que es el fondo real de la tarjeta.
5. Reescribir `diagramador-tokens.md` § 5.1 («Codificación del nodo: tarjeta en `sup-2` con filete izquierdo de 4 u y glifo en el matiz; texto siempre en tinta») y las columnas «Glifo/relleno» de § 5.2 (medir sobre `sup-2`).
6. En `design-system.md:64`, borrar la frase del tinte.

**Verificado cuando:** cada variable de `tokens.css` tiene al menos un uso en CSS o HTML (`grep -c "var(--X)"` ≥ 1) y `pnpm test` queda verde.

### A-09 · Grosor de flujo

Sin cambio visual: `diagramador-tokens.md:279` pasa a «grosor 1,6 u (a demanda 2,8; haz 4)».

**Verificado cuando:** el texto y `diagrama.css:20,29,30` dicen lo mismo.

### A-10 · Espacio, radios y peso

1. `design-system.md` § 3.4: sustituir la tabla por los valores reales en uso, o declarar que `--e-*`/`--radio-*` son la **escala objetivo del S1** con la lista de desvíos actuales y su pago en S1. Borrar en cualquier caso «toda distancia sale de esta escala» si no se cumple.
2. `bigd.css:114`: `border-radius: 10px 10px 0 0` → `8px 8px 0 0`.
3. Botón: alinear el documento y el CSS. Recomendado: `--radio-control` = 4 px en § 3.4, porque es lo que el usuario vio.
4. `bigd.css:24,42`: `font-weight: 800` → `700`. En `design-system.md:75`, «800» → «700».

**Verificado cuando:** `grep "font-weight: 800" docs/diseno/assets/*.css` no devuelve nada, y el documento y el CSS coinciden en radios.

### A-11 · Colores forzados

En `assets/diagrama.css`, **después** de la línea 46, añadir dentro de `@media (forced-colors: active)`:

```css
.db-insignia-vencido rect { fill: CanvasText; }
.db-insignia-vencido .db-t-insignia { fill: Canvas; }
.db-insignia-vencido .db-insignia-marca { color: Canvas; }
.db-doble-int { stroke: Canvas; }
```

**Verificado cuando:** con Playwright `forcedColors: "active"` en los dos esquemas, el texto de la insignia vencida tiene contraste ≥ 4,5:1 contra su rect y el `stroke` de `.db-doble-int` es igual al color de Canvas.

### A-12 · Foco visible

1. En `assets/diagrama.css`, añadir tras `:65`:

   ```css
   .dd-dec:focus-visible .dd-caja, .dd-dec[aria-current="true"] .dd-caja { stroke: var(--tinta-1); stroke-width: 4; }
   ```

2. Regla general en `design-system.md` § 4, fila «Foco»: «el foco y la selección suman ≥ 1,5 px al borde de reposo; jamás lo reducen».

**Verificado cuando:** con foco por teclado sobre `[data-dueno=dec-identidad]`, el `strokeWidth` computado vale ≥ 4 px (en reposo 2,5).

### A-13 · Saltos

Salida esperada en el HTML generado:

1. En todas las páginas, primer hijo de `<body>`: `<a class="salto" href="#contenido"><span lang="es">Saltar al contenido</span><span lang="en">Skip to content</span></a>`.
2. En cada `.mapa` de las páginas con diagrama (nivel 1, nivel 2, recorrido, lado a lado, decisiones): antes del lienzo, `<a class="salto" href="#lectura">` con «Saltar el diagrama / Skip the diagram».
3. `id="lectura"` en el `<details class="lectura-seccion">` (`atlas-nivel-1.html:117`).
4. `aria-details="lectura"` en la raíz de cada SVG.
5. En `bigd.css`: `.salto` visualmente oculto y visible con `:focus`.

**Verificado cuando:** en Chromium, el primer Tab enfoca «Saltar al contenido»; en `atlas-nivel-1.html`, activar «Saltar el diagrama» lleva el foco a la lectura sin pasar por los bloques.

### A-14 · Nombres accesibles en dos idiomas

En el generador, sustituir cada `aria-label="X"` estático fuera de `.mq-bar` por el par `data-aria-es`/`data-aria-en`. `maqueta.js:62-64` ya los aplica.

| ES | EN |
|---|---|
| Secciones | Sections |
| Tema | Theme |
| Nivel de lectura | Reading level |
| Mapa | Map |
| Ir a una capa | Go to a layer |
| Sección | Section |
| Vistas de la comparación | Comparison views |
| Vistas | Views |
| Decisiones | Decisions |
| Ir a una onda | Go to a wave |
| Secciones del informe | Report sections |
| Secciones del kit | Kit sections |
| Pestañas | Tabs |
| Lado a lado | Side by side |
| Banda | Band |

**Verificado cuando:** un script jsdom lista 0 `aria-label` sin `data-aria-en` fuera de `.mq-bar`. Opcional: convertirlo en aserción de `maqueta-vocabulario`, con su demo en rojo.

### A-15 · Reduced-motion sin cambiar el árbol

1. En `design-system.md:110`, «el botón **no existe**» → «el botón está en el DOM y se oculta con CSS bajo `prefers-reduced-motion: reduce`; el árbol es el mismo (regla 5-a)».
2. En `diagramador-tokens.md:466`, el mismo cambio.
3. En la maqueta: quitar `b.hidden = reducido` de `recorrido.js:19` y añadir a `bigd.css`:

   ```css
   @media (prefers-reduced-motion: reduce) { [data-rec="reproducir"] { display: none; } }
   ```

**Verificado cuando:** `grep -n "no existe" design-system.md docs/diseno/diagramador-tokens.md` no devuelve la frase del botón, y con `reducedMotion: "reduce"` el botón existe en el DOM con `display: none`.

### A-16 · Selector del atlas y nota de marcas

1. **Mínimo** (sin mirada nueva): quitar las promesas de `design-system.md:210-211` y `diagramador-tokens.md:437-441`, y registrar como deuda con pago en S1: «selector de plataforma del atlas (N, orden alfabético declarado, nombres en uso nominativo) + nota de marcas junto a la leyenda».
2. **Recomendado**, si el usuario lo acepta en la mirada 5: diseñar el estado «selector abierto» en `atlas-nivel-1.html`, con Databricks, Microsoft Fabric, Plataforma Ejemplo (ficticia), Snowflake… en orden alfabético, sin logos, y la nota de marcas bajo la leyenda.

**Verificado cuando:** ningún documento promete algo que la maqueta no tiene.

### A-17 · Contrato de foco de la ficha

En `design-system.md:162`, añadir a la fila «Ficha de nodo»:

- **Al abrir:** el foco va al título del panel.
- **Esc o «Cerrar»:** el foco vuelve al nodo de origen.
- **< 900 px:** diálogo modal (`role="dialog" aria-modal="true"`) con el foco contenido.
- **≥ 900 px:** región complementaria no modal.

**Verificado cuando:** la fila del componente trae el contrato de foco.

### Bajos baratos (opcionales en Fase 2; si no, pasan a deuda)

| Hallazgo | Ajuste |
|---|---|
| A-18 | Quitar `stroke-width="2"` duplicado en `atlas-nivel-1.html:110` y `kit.html:46` (generador) |
| A-19 | Ids únicos por vista (`matriz-empate`/`matriz-clara`) y enlaces por vista; `<defs>` con prefijo del `data-lienzo` |
| A-20 | Plantilla: «Decisión de una vía / Decisión costosa de revertir / Decisión de dos vías»; en inglés «One-way decision / Costly-to-reverse decision / Two-way decision»; estado con mayúscula inicial |
| A-21 | Títulos «Big-D · <sección> · <pantalla>» según la navegación; índice «Big-D · Recorrido de la maqueta» |
| A-22 | Declarar la clave de orden (por ejemplo, id de la plataforma) y ordenar el selector y las filas por ella en los dos idiomas; o decir «orden por identificador» |
| A-23 | `recorrido.js`: ignorar las flechas si `ev.target.closest(".lienzo, select, [contenteditable]")` o si hay modificadores; `ORDEN` y `NUM` salen del atributo de datos; «Paso n de N» en `design-system.md:164` |

---

## § 4 Frases caducadas

Barrido por promesa aplazada y lectura dirigida sobre: `design-system.md`, `diagramador-tokens.md`, `docs/diseno/README.md`, las páginas, la bitácora y `docs/MANUAL-DE-USO.md`. `README.md` raíz y el manual no cambiaron en la rama; el manual sigue siendo plantilla, fuera del alcance de la etapa.

| Archivo:línea | Frase | Veredicto | Texto propuesto |
|---|---|---|---|
| `design-system.md:3` | «estado: completo para la mirada 2» | Caducó (es v0.5.0, mirada 4) | «estado: completo para la mirada 4 (H1 entero); se sella en G-Diseño» |
| `design-system.md:64` | «Cada uno tiene su relleno tintado (`tipo-N-tinte`) para tarjetas e insignias» | Falsa (0 usos) | Borrar (A-08) |
| `design-system.md:75` | h1 «800» | Falsa (la cara llega a 700) | «700» (A-10) |
| `design-system.md:126` | «Pendiente (aún no existe) … pestañas y secciones que llegan en otras miradas» | Caducó (0 `aria-disabled` en la maqueta) | Retirar la fila o redefinirla como estado de producto |
| `design-system.md:136` | «Vacío, carga y error se diseñan en las miradas 3 y 4» | Caducó a medias | «Carga (comparación) y error (base) tienen pantalla; el vacío solo vive en el kit (deuda S1)» |
| `design-system.md:138` | «Componentes canon (v0.2: …)» | Caducó | «Componentes canon del atlas (desde v0.2)» |
| `design-system.md:164` | «Paso n de 8» | Cableado | «Paso n de N» |
| `design-system.md:210-211` | «con la nota de marcas en la leyenda» | Falsa desde `a05a217` | Ver A-16 |
| `design-system.md:268-269` | «las pantallas llegan en las miradas 3 y 4» | Caducó | Borrar la viñeta |
| `diagramador-tokens.md:3` | «ampliada … para la mirada 2» | Caducó | «miradas 1–4 aprobadas; pendiente G-Diseño» |
| `diagramador-tokens.md:72` | «(190 u)» | Contradice § 9.1 (200 u) | «(200 u)» |
| `diagramador-tokens.md:89` | «1398 u … ≥ 1198 px» / «1200 u … ≥ 1029 px» | Caducó (ronda 1; § 8.3 retiró umbrales) | «7 columnas: 1380 u · 6 columnas: 1178 u; sin umbral de contenedor: el lienzo se desliza» |
| `diagramador-tokens.md:155-156` | «Relleno tintado … borde de 2 u y glifo en el matiz» | Caducó (dirección B) | Ver A-08 |
| `diagramador-tokens.md:279` | «grosor 2 u» | Falsa (CSS 1,6) | Ver A-09 |
| `diagramador-tokens.md:404` | «Nivel 1: un glifo por componente hasta 4 y luego «+N»» | Caducó (B: un glifo + «N componentes») | «Nivel 1: un glifo de tipo y «N componentes»» |
| `diagramador-tokens.md:437-441` | «La nota de marcas se genera también» | Falsa | Ver A-16 |
| `diagramador-tokens.md:445` | «Raíz … con `<title>` por idioma» | No implementado (se usa `aria-label` por JS) | Implementar `<title>` por idioma o decir «nombre accesible por idioma» |
| `diagramador-tokens.md:466` | «el botón «Reproducir» no existe» | Choca con 5-a | Ver A-15 |
| `diagramador-tokens.md:484` | «CONTRATO D1: confirmar … en angosto» | Caducó | Ver A-07 |
| `docs/diseno/README.md:31-36` | «Sus cuatro lienzos (ancho y 380 px…) … autoría a mano» | Sigue cierta como historia (marcada «Ronda 1») pero confunde | Mover a «Historia de rondas» |
| `docs/diseno/README.md:74` | Fila «`atlas-nivel-1.html` ⭐ (ronda 3) … tipografía a elegir» | Caducó (duplica `:88`) | Borrar la fila |
| `docs/diseno/README.md:86` | «design system v0.3.0» | Caducó | «v0.5.0» |
| `docs/diseno/README.md:88` | «banda sin bloque («1 componente»)» | Falsa (D34 muestra el nombre, por ejemplo «Monitor de consumo») | «banda sin bloque de un componente: su nombre (D34)» |
| `docs/diseno/README.md:94` | «_(pendiente)_» | Sigue cierta | — |
| `kit.html:17` (barra de sala) | «Kit de componentes (design system v0.3)» | Caducó | «(design system v0.5)» (generador) |
| `assets/bigd.css:1` | «design-system.md v0.2» | Caducó | «v0.5» |
| Bitácora `:20-26` | Plan de miradas, todas «pendiente» | Caducó | Miradas 1–4 «aprobada (fecha)» |
| `atlas-nivel-2.html:87,192`, `decisiones.html:69`, `base.html:66`, `informe.html:63` | «no puede», «todavía no», «mientras tanto», «no se puede ordenar» | Sigue cierta (explican el dominio o el estado mostrado) | — |
| `atlas-nivel-1.html:18` | «ronda 4» | Sigue cierta | — |

---

## § 5 Campos sin consumidor

| Contrato / campo | Consumidores fuera de su construcción y sus tests | Veredicto |
|---|---|---|
| `tokens.css`/`.json` · `tipo-1-tinte` … `tipo-8-tinte` (×2 temas = 16) | 0 en CSS y HTML; solo aserciones del gate de paleta | **Huérfanos** (A-08) |
| `tinta-3` (×2) | 0; solo el test de veto | **Huérfano** (A-08) |
| `fondo`, `sup-1`, `sup-2`, `linea`, `tinta-1`, `tinta-2`, `tipo-1..8` | 55 / 33 / 16 / 56 / 128 / 116 / 3 por tipo | Con consumidor |
| `tokens.json` · `tipos[].id/familia/matiz`, `tintas_vetadas_como_texto`, `_generado` | Solo la igualdad de deriva. `maqueta-vocabulario` importa `TINTAS_VETADAS` del generador, no del JSON | Huérfanos declarados «para el futuro renderizador» (Bajo) |
| `fuentes/metricas.json` (avances, sha256) | Solo la calculadora fuera del repo; ningún test compara su sha (hoy coincide con el woff2) | Consumidor fuera del repo (A-01, A-24) |
| `fuentes/cobertura.json` (`rangos`, `sha256`) | `maqueta-vocabulario` | Con consumidor |
| `design-system.md` § 3.4 · `--e-1…--e-7`, `--radio-control`, `--radio-caja` | **No existen** en ningún CSS | Contrato sin implementación (A-10) |
| `bigd.css` · `--letra`, `--letra-mono`, `--ancho-pagina`, `--t-rapida` | Usados | — |
| Componentes del DS sin instancia: «nota de marcas», «Pendiente (aún no existe)» | 0 páginas | A-16, § 4 |

---

## § 6 Cardinalidad cableada

Solo las plataformas se declaran extensibles «solo con datos» (VISION `:6,86,140`; brief `:40,91`).

| Lugar | Hallazgo | Veredicto |
|---|---|---|
| `lado-a-lado.html:94` + `bigd.css:168-169` | La vista de teléfono tiene exactamente 3 plataformas por banda y no pagina | **Alto** (A-03) |
| `diagramador-tokens.md:378`, `lado.js:1-2`, `lado-a-lado.html:69` | «Tres a la vez» como **constante de vista declarada**, con paginación en ancho (1–3 de 4 · 4 de 4) | Aceptable |
| `lado.js:11` | Paginación cableada a 2 páginas | Bajo (A-28, maqueta) |
| `comparacion.html:55` «Tres plataformas puntuadas…; la cuarta quedó fuera»; `informe.html:67` «Once criterios por tres plataformas»; `instrumento.html:56` «empate de las tres» | Narrativa derivada de los datos del caso (4 − 1 eliminada; caso de referencia de 3) | Aceptable en la maqueta. El S1 debe generarlas desde plantilla con N |
| Comparación, totales y aceptabilidad | Nunca muestran N > 3 puntuadas | Bajo (A-28) |
| `bigd.css:477` `repeat(3, 1fr)` | Rejilla de tarjetas del índice, no plataformas | No aplica |
| Arreglos `[a, b, c]` con nombres de plataforma en JS | Ninguno | — |
| No plataformas: pasos del recorrido «de 8» (`recorrido.js:7-8,16`; `design-system.md:164`), «9 bandas», «seis capas y tres franjas» | Datos de mapa o gramática, no declarados N | Bajo (A-23); aceptable como texto de referencia |

---

## § 7 Comprobaciones mecánicas

| Comando o medición | Salida |
|---|---|
| `git diff origin/main...HEAD --name-only \| grep -E '^(src/\|packages/)'` | Vacío (exit 1). Cero código de producto |
| `git grep -nE "vercel[.]app\|workers[.]dev\|pages[.]dev" -- ':!pnpm-lock.yaml'` | Vacío (exit 1) |
| `grep -rnE '<img\|data:image' docs/diseno` | Vacío |
| URLs absolutas en `docs/diseno` | Páginas: solo `https://example.org/ficticia/…`. Fuera de páginas: `OFL-*.txt` (github.com, scripts.sil.org, licencias) y `README.md:12` `http://localhost:3000/…` (no se sirve: `copiar-maqueta` excluye `.md`) |
| Nombres reales | «Databricks» y «Snowflake»: 0. «Microsoft Fabric»: solo en la declaración del autor (una por página, dos en el informe) |
| Institución real | Ninguna: «Hospital Ficticio de la Sabana / Fictional Hospital of La Sabana» |
| Autocontenida | 0 `<script src>` y 0 `<link>` externos (gate verde; `<link>` solo a `assets/`) |
| Colores literales en CSS o `style=` | 0 hex/rgb/hsl; 0 `box-shadow`; `white` solo en `white-space` |
| Pares de idioma (jsdom) | Equilibrados en las 13 páginas (por ejemplo `lado-a-lado`: span 669/669, text 325/325). Texto visible sin par: solo la barra de sala (deuda declarada), marcas y códigos. `aria-label` sin par: 14 (A-14) |
| `html[lang]` | `maqueta.js:61` lo cambia con el conmutador |
| Color nunca solo (muestreo) | Semáforo: marca + texto + días. Modos: trazo + marcador. Diff: glifo + palabra. Reversibilidad: glifo + palabra + borde. Prioridad: píldora + palabra. Excepciones: colores forzados (A-11) y grises de la paleta (A-05) |
| `pnpm lint` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | exit 0 · 4 archivos · **51/51** (39 paleta, 2 autocontenida, 7 vocabulario, 3 dependabot) |
| `node scripts/capturar-maqueta.mjs --solo-medir` (corrida propia) | «árbol …/docs/diseno» · 13 páginas · **392 medidas · 0 fallas** |
| Solapes texto-texto dentro de los SVG (5 páginas con diagrama, todos los estados, ES y EN, 1280 px; medición propia) | **0** (la deuda b no esconde defectos hoy) |
| Colores forzados (Playwright) | Insignia vencida: texto `rgb(18,22,28)` sobre `rgb(0,0,0)` en oscuro y `rgb(249,250,252)` sobre `rgb(255,255,255)` en claro (A-11) |
| Foco en decisión de una vía | Reposo `2.5px`, foco `2px` (A-12) |
| Monte Carlo de robustez (180 438 muestras) | Norte 100,0 % · Ejemplo 0,0 % · Sur 0,0 %; en la banda de empate: 99,5 % (A-02) |
| `gh pr checks 3` (head `16913d4`) | quality ✓ 32 s · e2e ✓ 1 min 3 s · lighthouse ✓ 1 min 28 s · Vercel ✓ · Vercel Preview Comments ✓ |
| Estado del PR | `mergeable: MERGEABLE`, `isDraft: true`, rama 2 commits detrás de `main` (A-26) |
| Atributos duplicados | 2 (A-18) |
| Ids duplicados | 4 páginas (A-19) |

---

## § 8 Deuda declarada por el constructor

| Deuda | Veredicto | Severidad | Pago |
|---|---|---|---|
| (a) El selector del lado a lado no filtra | Confirmada. Relacionada: Este desmarcada pero mostrada y el orden alfabético falso en EN (A-22). El teléfono sin la 4.ª plataforma es un hallazgo aparte (A-03, Alto) | Bajo | Sprint que implemente `compare` y el lado a lado (S2+) |
| (b) El arnés no mide solapes del mismo dueño | Confirmada. Medición propia: 0 solapes hoy | Bajo | S1: el e2e G11 del piloto mide texto-texto sin importar el dueño |
| (c) En el diff, las dos versiones abren la ficha vigente | Confirmada | Bajo | Sprint que implemente `diff` |
| (d) Gate «un PR de dependencias no baja versiones frente a main» | Confirmada como propuesta de método | Bajo | Planeadora (G-Metodo); si se adopta, CI del S1 con demo en rojo |
| (e) Preview con sesión no verificado | **Reclasificada a Alto** (A-04): la orden exige aprobar sobre el despliegue y el usuario reportó dos veces que no abre | Alto | Etapa, antes de la mirada 5 |
| (f) El lado a lado conserva el conmutador; la expansión en el mismo lienzo va al contrato (D75) | Confirmada; el usuario la aceptó. Falta en § 16 (A-07) | Bajo | Sprint de `compare` |

---

## § 9 Veredicto

**«Requiere ajustes».**

La etapa cumple lo esencial:
- cero código de producto;
- 13 páginas con todos los estados mínimos presentes como preajustes;
- bilingüe con pares equilibrados;
- datos 100 % sintéticos;
- cero enlaces y cero imágenes;
- tres gates reales con su demo en rojo registrada;
- CI verde;
- cuatro miradas registradas textualmente antes de construir encima.

Aun así, hay cuatro hallazgos Altos que impiden cerrar G-Diseño:
- **A-01:** el generador de toda la maqueta vive fuera del repo, así que la referencia no se puede corregir sin editar SVG a mano.
- **A-02:** la pantalla de comparación y el informe muestran una robustez imposible con su propio método.
- **A-03:** el lado a lado en teléfono cablea tres plataformas, contra la regla N de la orden.
- **A-04:** nadie ha visto el despliegue con sesión, y la orden exige aprobar sobre él.

Los Medios son en su mayoría ajustes baratos de documento o CSS: A-05, A-06, A-07, A-09, A-10 (doc), A-12, A-14, A-15, A-16 (doc) y A-17. A-08, A-11 y A-13 son poco más. Conviene pagarlos antes de la mirada 5, porque todos alimentan el CONTRATO v0.3.0 o el gate de fidelidad del S1. Los Bajos pueden quedar como deuda con el pago indicado.

Aprueba la Fase 1 y fija el modelo de la Fase 2 con `/model`: un modelo menor basta si sigue este plan. Los ajustes de HTML exigen primero A-01, porque las páginas se regeneran, no se editan.

---

## Respuesta del constructor (2026-09-26)

Verificados por el constructor antes de presentar el reporte al usuario:

- **A-02 confirmado.** Las aceptabilidades no salieron de ningún cálculo: están escritas como constante en el
  generador (`pagina-m3.mjs:178`, `const ACEPT = { ejemplo: [69.4, 27.1, 3.5], … }`). La afirmación de la
  bitácora «nada se escribe a mano» (D54) era falsa para la robustez. Con Norte 78,75 frente a Ejemplo 75,75 y
  rangos de ±20 %, el punto de inversión de gobierno (14,8) queda fuera del rango [20, 30], así que Norte no
  puede perder el primer puesto. El hallazgo del auditor es coherente con la sensibilidad de la propia página.
- **A-03 confirmado.** En `.lado-angosto` de `lado-a-lado.html`: 9 bandas, 9 filas de Ejemplo, Norte y Sur,
  **0 de Este**.
- **A-01 confirmado.** Inventario del generador en el scratchpad: `calc/` (204 KB, incluye `inyectar.py`),
  `calc2/` (84 KB), `calc3/` (276 KB).
- **A-04.** Sin cambio desde aquí: sin sesión, el preview responde 302 al inicio de sesión de Vercel. Solo el
  usuario puede comprobarlo con su sesión.

El plan de la Fase 2 se presenta al usuario para su aprobación; nada se modifica antes.

