---
sprint: 001
app: big-d
status: closed
opened: 2026-09-27
closed: 2026-09-30
branch: sprint-001/atlas-de-fabric
pr: https://github.com/mauriciorincon-ai/app-big-d/pull/4
---
# Sprint 001 Summary — Big-D

> **Cierre de construcción**, con la auditoría pagada; **el merge lo hace la persona**. Este archivo viaja dentro
> del PR #4. Ciclo H1, sprint 1 de 4: no es cierre de ciclo, así que no hay brochure, BLUEPRINT ni `/design-sync`
> (van en S4). El ⭐ se difiere al acumulado del ciclo con sus contrapesos (abajo).
> Bitácora completa: `sprints/SPRINT_001-implementation-log.md`. Auditoría: `sprints/SPRINT_001-auditoria.md`.

## Outcome

**Sí, los tres outcomes.** Con un cambio pedido por la persona en el tercero.

- **Principal: sí.** La persona abrió el atlas de Microsoft Fabric en su navegador. Respondió «Sí, el mapa se
  entiende», «la visual de componentes muy muy buena» y, del recorrido, «muy muy chévere».
  - Tiene tres niveles: visión general con la ventana de cada bloque, componentes con ficha y recorrido de un dato
    con rama paralela.
  - Trae semáforo de vigencia, leyenda y nota de marcas.
  - Está en ES/EN, en oscuro y en claro, a 1280 y a 380 px.
  - El mapa lo propuso el investigador con 80 citas verificadas por código. La persona lo aprobó afirmación por
    afirmación el 2026-09-28 (2026-09-29 UTC): 19 componentes, 19 flujos y mapa v0.1.0.
  - Tiene D11 = 0 y todo texto dentro del lienzo.
  - Da el mismo SVG byte a byte en Node y en Chromium, Firefox y WebKit, en macOS y en Linux (job `diagramador`).
- **Secundario: sí.**
  - `packages/diagramador/` detecta las **31/31 carnadas** del contrato (C01–C21, GC1–GC5, A1–A3 y los dos mapas
    reales), más 3 carnadas piloto que propone (P1–P3).
  - Lleva `CONTRATO.lock` v0.3.0, con 54 archivos idénticos a la planeadora.
  - Pasa los lints G2 y G3 con su demo en rojo.
  - Reproduce la Plataforma Ejemplo con **fidelidad aprobada** sobre el preview: «Si se ve bien», 2026-09-27.
- **Terciario: sí, con un cambio.**
  - Ya existían:
    - `/investigar` con sus hooks y un esquema Zod;
    - las citas verificadas con `curl` sobre la página cruda, en los dos idiomas;
    - los dos ADRs (código primero y 7-S);
    - la revisión, con semáforo por capa, diff por código y registro de «aprobada» o «sin novedades».
  - **«Copia el comando» ya no existe.** En la mirada del estado vacío la persona pidió que la página no hable de
    Claude Code y que el botón deje una solicitud guardada. Eligió una **tarea de GitHub** (D-S1-57).

## Qué se construyó

- **El diagramador** (`packages/diagramador/`, reusable de la casa; esta app es su piloto).
  - Validación V1–V15 y G1–G7, con un validador standalone generado.
  - Colocación por bandas y ruteo ortogonal por canales.
  - Serializador SVG propio.
  - `toText`, `toCard`, `toBlockCards`, `diff` y la leyenda.
  - Vistas: nivel 1, nivel 2, recorrido, carriles y «bloque».
  - 30 golden files con `SHA256SUMS`.
  - Determinismo en tres motores y dos sistemas.
- **El atlas en producto**, export estático con un HTML por vista:
  - `/[idioma]/atlas/[plataforma]` en sus tres niveles;
  - la ventana de un bloque, la ficha (hoja modal en teléfono, panel lateral en ancho), el recorrido paso a paso
    con «Reproducir» y el campo «Plataforma» con N opciones;
  - leyenda con la nota de marcas, lectura en texto (G10), lienzo deslizable con índice y conmutadores de
    idioma y tema.
- **El investigador**, que solo propone:
  - la skill `/investigar` con su agente y sus hooks (candado de escritura y lectura, registro de fuentes, cero
    identificadores, validación al terminar y `sin-lanzar`);
  - el verificador de citas y la aprobación, que solo corre una persona;
  - la pantalla de revisión, con diff, decisión por afirmación, retiros con argumento, el comando que arma y el
    historial.
- **Los datos:** plataformas, gramática, el mapa del ejemplo generado del contrato, el mapa aprobado de Fabric y
  las revisiones.
- **Lo que acompaña:**
  - el manual bilingüe;
  - la guía de prueba v1 (38 pruebas en 7 bloques) con su kit de prueba;
  - el bundle `design-sync/`;
  - 6 ADRs;
  - la constitución sincronizada con el kit v1.32.0.

## DoD — checklist

| Estándar | Estado | Evidencia |
|---|---|---|
| **Testing** | ✅ | `pnpm test`: 1019/1019 en 52 archivos, cobertura total 98,7 % de líneas (97,2 % de sentencias) (umbrales: 70 global, 80 motor y paquete, 50 componentes; los componentes dan 83–97 % por carpeta). Paquete del diagramador (comando del job): 669/669. e2e: 320/320 en 10 archivos, 4 proyectos (Chromium móvil y ancho, Firefox y WebKit para G11), en 47,8 s con la máquina tranquila sobre `93d2edc` (2026-09-30), **sin reintentos**. Una corrida anterior, con la máquina cargada, dio 319/320: venció una espera de 10 s en `reduced-motion`; repetida 3 veces sola, 402/402. Propiedades con fast-check (G5, G6, D3, invariancia al orden sobre todas las salidas). |
| **CI/CD** | ✅ | `quality` · `e2e` · `lighthouse` · `diagramador (ubuntu-latest)` · `diagramador (macos-latest)` · Vercel, con conclusión propia `success` en cada commit desde `fd5dc0e`. El job `diagramador` nació en este sprint y **se añadió a la ruleset `main-protegida`** el 2026-09-27. `gh pr checks` tras cada push. |
| **Observabilidad** | ✅ | Sentry client-only, inerte sin DSN; `eventoSinContenido` borra request, breadcrumbs y el mensaje crudo (B-10). Registro de ejecución del investigador: `propuestas/registro-de-ejecucion.jsonl`, con `tool_use_id` reducido a huella. |
| **Seguridad** | ✅ | `pnpm audit --audit-level high`: limpio. gitleaks: 36 commits de la rama sin fugas, hook pre-commit y hook de escritura con la carnada canónica bloqueada. Lints G2, G3 y «planea, no opera» con demo en rojo. Candados del investigador (escritura, lectura, `sin-lanzar`), guarda de la aprobación dentro del script, cabeceras de seguridad (CSP como deuda declarada). Barrido de cero enlaces limpio tras el último `git add`; campo homepage vacío. |
| **Performance** | ⚠️ renegociado | Lighthouse en CI sobre 15 URL: categorías 96–98 / 100 / 100 / 100. **LCP**: el estándar pide 2500 ms; se mide entre 2455 y 2772 ms (mediana de 3, móvil simulado) porque las fuentes van con `display: block` (G15: el texto medido jamás se pinta con otra fuente). Presupuesto renegociado a **2900 ms** y deuda para S2 (ver «Deuda»). SVG generado en el build; sin motor en el cliente. |
| **UX/A11y** | ✅ | axe sin violaciones serias en todas las rutas y los dos temas. Teclado de punta a punta. G11 a 380 px en Chromium, Firefox y WebKit. `reduced-motion`: el árbol no depende de la preferencia (mismo HTML y escucha de errores de hidratación #418/#423/#425). Color nunca solo (vigencia = forma + texto + días). Gate de paleta. **FIDELIDAD aprobada** sobre el preview. |
| **IA embebida** | ✅ | **Cero IA en runtime.** Investigador = skill interactiva en la sesión de la persona; ADR «código primero» (_accepted_) y ADR 7-S con **relectura de los términos el 2026-09-30**, antes de este release. Probado en vivo que el candado `sin-lanzar` no frena el `/investigar` de una persona (M-17). |
| Manual | ✅ | `docs/MANUAL-DE-USO.md` ES/EN: atlas, niveles, idioma y tema, cómo pedir, revisar y aprobar una investigación, retiros, vigencia. |
| Guía de prueba | ✅ | `docs/GUIA-DE-PRUEBA.html` v1: prefijo `bigd-s1-`, 38 pruebas «Nuevo · S1», filtros ⭐ (4) y ⭐⭐ (3), kit en `docs/kit-de-prueba/` con receta de regeneración y gate de deriva. |
| Diseño | ✅ | Fiel a `design-system.md` y a la maqueta; extensiones por ADR (`decisions/design-system-s1-extensions.md`, 5 decisiones con su mirada). `design-sync/` regenerado en el mismo PR (publicar es de S4). |
| ADRs | ✅ | Arquitectura del diagramador · serializador y golden files · código primero del investigador · cumplimiento 7-S · destino de la maqueta (A-25) · extensiones del design system en S1. |
| Constitución | ✅ | `CLAUDE.md` sincronizado (fase 0) con la sección IA de la planeadora y los deltas del kit v1.30–v1.32. |

## Métricas técnicas

| Métrica (SPRINT_001.md) | Meta | Medido |
|---|---|---|
| Carnadas del contrato | 31/31 detectadas por regla, id y fase | **31/31**, más P1–P3 piloto |
| Mapas con D11 = 0 | los del contrato + Fabric, en todas sus vistas | **7 mapas** × nivel 1, nivel 2, recorrido y cada ventana; además a 4 edades (C-1) |
| Determinismo | misma huella en Node y 3 navegadores, Linux y macOS | **igual**: 30 SVG, `SHA256SUMS` |
| G15 (texto ≤ tabla) | ≤ 100 % | **97,1 %** en 3 motores × 2 sistemas (con `geometricPrecision`) |
| G11 a 380 px | todo texto dentro del lienzo y fuera de cajas ajenas | ✅ en Chromium, Firefox y WebKit, ES/EN |
| Cobertura motor y paquete | ≥ 80 % | ✅ (umbral aplicado por `pnpm test`); total 97,4 % |
| Lighthouse | ≥ 90 en las 4 categorías | ✅ 96–100 |
| LCP | ≤ 2500 ms (estándar) | ⚠️ 2455–2772 ms; presupuesto 2900 ms, renegociado |

## Gate ⭐ — diferimiento y contrapesos

| Contrapeso | Evidencia (archivo, cuenta medida, corrida) |
|---|---|
| Pasada de capturas del builder | Pasada final sobre el build de `9d9c752` (2026-09-30): 22 rutas, **88 encuadres, 4440 comprobaciones de interacción, 0 fallas**; **136 PNG leídos como imagen** por cuatro lectores en paralelo, 34 cada uno («Leídas: 34 de 34»), y cada defecto verificado por el constructor. 7 defectos pagados en `32d8eb5` (D-S1-58, M1–M4, T1, T3). Segunda pasada sobre el build con los arreglos: 88 encuadres, 4440 comprobaciones, 0 fallas, y las zonas que cambiaron, leídas por el constructor en recortes a tamaño real. Carpetas efímeras `<scratchpad>/capturas-final` y `capturas-final2`; el registro vive en la bitácora, § M-7 |
| e2e de `reduced-motion` | `tests/e2e/reduced-motion.spec.ts`: 134 pruebas (4 proyectos), con escucha de errores de hidratación; verde en la CI de cada commit desde `a7ecf4e`, la última antes de este summary en `93d2edc` |

**⭐ diferido: 4 pruebas al acumulado del ciclo (S1: 4).** Una persona sin formación técnica explica las capas de
Fabric; lectura en un teléfono real a 380 px con desplazamiento lateral táctil; paleta juzgada por la persona en su
pantalla, en los dos temas; lectura en texto con VoiceOver. El gate de FIDELIDAD no viaja: se corrió y se aprobó.

**Lo que viaja al gate humano del ciclo** (decidido por el constructor o «maquetado, no visto»):
- la forma final del botón «Solicitar investigación» (lleno en el estado vacío; con contorno en la lista de capas);
- la lista de retiros con su argumento (D-S1-56);
- la nota de marcas sin título, que no se encontró a la primera (la persona aprobó el texto);
- D-S1-33 (nombre del bloque «Agentes»), D-S1-35 (portada) y el resto de menores de la bitácora;
- la grafía británica «Colour» y «colours» en dos notas en inglés, que viene tal cual de la maqueta aprobada.

## Registros de las paradas humanas

- **FIDELIDAD (indiferible):** el atlas nivel 1 de la Plataforma Ejemplo, generado por el motor, en el preview del
  PR #4. Pregunta: «¿Ese mapa se ve bien?». Respuesta: **«Si se ve bien»** (2026-09-27). Capturas del mismo commit
  en 2 temas × 2 idiomas × 1280/380, comparadas contra `docs/diseno/atlas-nivel-1.html`; tabla de diferencias en la
  bitácora.
- **FORMA del selector:** ronda 1 rechazada («no es entendible»); ronda 2, el campo «Plataforma», aprobada («Sí se
  entiende y visualmente apropiado»).
- **Fabric, afirmación por afirmación:** 80 aprobadas, 0 rechazadas. La persona corrió el comando en su terminal el
  2026-09-28 (2026-09-29 UTC): `aprobar: fabric aprobada · mapa v0.1.0 · 19 componentes · 19 flujos · 80 aprobadas
  · 0 rechazadas`.
- **Mirada del atlas de Fabric:** «Sí, el mapa se entiende». La persona pidió la ventana de un bloque, se construyó
  y la aprobó: «No era exactamente lo que esperaba pero me gustó».
- **Miradas de la auditoría (2026-09-30), una por mensaje:**
  - el atlas envejecido, aprobado tras pedir el triángulo de precaución (D-S1-55): «Sí, están perfectos 30 y 90
    días»;
  - de qué habla cada afirmación: «sí»;
  - los retiros: «sí, pero que no queden dudas de por qué sale» (D-S1-56);
  - la nota de marcas: «sí, de acuerdo con el texto»;
  - el estado vacío: cambiado a tarea de GitHub (D-S1-57).

## Auditoría final (método v1.10.0): hallazgos y pagos

- **Fase 1** (`fd5dc0e`, `sprints/SPRINT_001-auditoria.md`): **1 crítico, 6 altos, 26 medios, 47 bajos** →
  «requiere ajustes». La persona: **«Aprobado»**, la Fase 1 y el pago de todo.
- **Fase 2: todo pagado** (`a7ecf4e` y siguientes). La tabla por hallazgo, el rojo de cada gate nuevo y las
  desviaciones del plan de pagos están en la bitácora, «Auditoría final — Fase 2».
  - **El crítico (C-1):** el build se rompía solo el 2026-10-27, cuando el mapa de Fabric pasaba a «por revisar».
    Se corrigió el motor y nacieron dos gates: todos los mapas a cuatro edades en el paquete, y cada atlas en cada
    fecha de cambio de estado en la app.
  - **Lo que pedía a la persona:** cinco miradas, la decisión sobre «lago de datos» (M-8: deuda a S2, ver abajo),
    el permiso para borrar los 4 comentarios del bot con el enlace del preview (M-12: borrados) y la prueba en vivo
    de `/investigar` (M-17: pasó).
  - **Fuera del plan de pagos, por pedido de la persona en sus miradas:** D-S1-55 (triángulo), D-S1-56 (ningún
    retiro sin argumento) y D-S1-57 (la solicitud de investigación como tarea de GitHub).

## Enmiendas al contrato del diagramador

Propuestas para G-Metodo; la copia fijada del paquete no se tocó. Detalle de cada una en la bitácora, «Enmiendas al
contrato del diagramador».

1. **D-S1-01** — La etiqueta de modos con más de 2 marcadores va en dos filas (38 × 32 u): los 70 u de § 5.3 no
   caben en el canal de 50 u que exige A3.
2. **D-S1-02** — El informe separa errores, alertas (V9, V10) y avisos; se agrega `validateGrammar`.
3. **D-S1-03** — `esperado.json` debería listar los secundarios legítimos de C03, C06 y C07.
4. **D-S1-05** — Geometría de carriles: filas con cabecera de 200 u, ranuras de 152/50 u por `orden`.
5. **D-S1-06** — Las cadenas de interfaz del motor llegan en `options.textos` (también `toText` y `toLegend`).
6. **D-S1-16** — Tabla de traducción de errores de esquema a regla e id.
7. **D-S1-17** — `escala_madurez[].etiqueta_corta`.
8. **D-S1-19** — Paths de «envía/recibe»: el contrato dice ↑/↓ y dibuja →/←.
9. **D-S1-20** — D12: «un id, un `data-dueno` o el de su grupo».
10. **D-S1-23** — Más de 2 saltos: pistas adicionales sin aviso; el aviso rompía el build con el primer mapa real.
11. **D-S1-25** — G6 (c): quitar un flujo cambia también los que comparten extremo, canal o fila.
12. **G15/P12** — La tabla sin kerning + 3 % es cota superior en 3 motores × 2 sistemas; el contrato debe exigir al
    consumidor `text-rendering: geometricPrecision`.
13. **G1** — Hueco «Linux pendiente» cerrado por medición.
14. **Constitución** — Las líneas viejas del diagramador en `CLAUDE-md-para-app.md` (V1–V12, franjas arriba,
    angosta 380, «v0.2.0 hoy»).
15. **D-S1-26** — La geometría expone la vigencia del mapa y de cada activable.
16. **D-S1-27** — `toText` recibe la fecha de consulta.
17. **Leyenda (§ 4.9)** — La regla del haz (varios modos en una conexión) debería salir en la leyenda generada.
18. **D-S1-36** — `toCard(map, grammar, nodeId, opts)` en la API de § 8, con `TextosMotor.ficha`.
19. **Contrato de la propuesta** — El esquema de Big-D (afirmación = entidad + id + cita literal; rechazo en
    cascada; retiro con motivo y cita oficial verificada, salvo el flujo que sale por arrastre) sirve de base si
    otro consumidor necesita proponer mapas.
20. **D-S1-49** — Canal con más de 6 pistas: reparto parejo con piso de 4 u (el primer mapa real pidió 7). D-S1-58
    lo deja a 6 u de aire de las tarjetas.
21. **D-S1-50** — Etiqueta de modos que choca: segundo lugar en el tramo de llegada; si no, se reporta.
22. **D-S1-51** — Fila de referencias de franja llena: de 8 u a 4 u entre referencias y corrimiento hacia adentro.
23. **D-S1-52** — Etiqueta de un salto en el nivel 1 con saltos no anidados: a la mitad de su propio tramo.
24. **V16 (propuesta)** — «El mapa se dibuja»: un mapa válido para publicar puede traer avisos de geometría.
25. **Carnadas piloto** — P1 (mapa denso), P2 (paso que se sigue) y P3 (paso que sigue a uno posterior).
26. **D-S1-53** — Vista «bloque» y `toBlockCards(map, grammar, group, opts)`, con `id` para enlazar su texto (B-41).
27. **D-S1-54** — Etiqueta de un flujo dentro de una columna, a 2 u de la tarjeta.
28. **D-S1-55** — Marca de «por revisar»: triángulo de precaución con «!» (pedido de la persona), 14 × 13 u con
    trazo 1,6; la leyenda en caja de 16 u.
29. **C-1 (auditoría)** — Al envejecer, la insignia montada no pasa de la mitad de la tarjeta + 4 u; una fila de
    referencias llena abrevia nombres con «…» (el nombre entero queda en `aria-label`); la vista «bloque» reserva el
    lugar de la insignia. **Carnada propuesta:** la matriz de envejecimiento (todo mapa a 4 edades, sin avisos ni
    cruces).
30. **A-5** — V5 rechaza un paso que sigue a sí mismo o a uno posterior; `numerarPasos` lanza ante un ciclo.
31. **A-6** — Un flujo entre tarjetas vecinas va directo solo con filas contiguas, sin par de vuelta y un hueco
    ≥ 300 décimas; si no, por el canal.
32. **M-1** — `layout` reporta `D11: <flujo> atraviesa la caja de <caja>`; carriles avisa la pista que sale del canal.
33. **M-23** — Pistas `[-50, 50, 150, 230, -150, -230]`: ninguna sobre el borde de una tarjeta.
34. **M-24 / M-25** — Avisos de ficha fuera del lienzo y de bloque sin componentes (extender V3).
35. **M-26** — `diff` compara JSON canónico (claves ordenadas).
36. **B-38** — V4: un flujo de un nodo hacia sí mismo es error.
37. **B-39** — Un idioma que la gramática no declara da un error claro en todas las salidas.
38. **B-12** — `packages/diagramador/README.md` dice «aún no existe» la implementación (copia fijada).
39. **B-17b** — Plurales como dato por idioma, no `[singular, plural]` con `n === 1`.
40. **B-43** — `grupo` queda en español en la API (§ 8 la pide en inglés), como `textos` y `fechaConsulta`.
41. **B-44** — Campos sin consumidor en la app, a declarar como API del reusable: `Geometria.gramatica`,
    `filas[].banda/y/alto`, `rotulos`, `Cruce.*`, `Informe.avisos`, `Entrada.doc/fase/idioma`, el detalle de
    `Diferencias`, `OpcionesLayout.metricas/fuente/fuenteMono`, `CONTRATO_VERSION`.
42. **D-S1-58** — Pistas a 6 u de las tarjetas: fijas `[-50, 50, 120, 190, -120, -190]` y reparto parejo dentro de
    ±19 u. Más el aviso `pistas: <flujo> corre a N u del borde de <caja>` por debajo de 5 u, como D11. Lo encontró la
    pasada final de capturas: a 2 u, una línea parecía salir de la tarjeta vecina.
43. **Propuesta** — No partir una línea dentro de un paréntesis corto («Fabric capacity (F SKU)» se partía entre
    «(F» y «SKU)»).
44. **Propuesta para S2** — Ordenar las pistas por destino: la punta de una flecha de llegada (8 u) todavía cruza la
    pista que pasa entre la suya y la tarjeta.

## Registro de fallas del diagramador (síntoma · causa · regla · carnada)

| Falla | Síntoma | Causa | Regla | Carnada o gate |
|---|---|---|---|---|
| G15 en Linux | Chromium/Linux mide «tareas» 42 px contra 41,7 de la tabla (100,7 %) | redondeo a píxel entero del texto sin `geometricPrecision` | G15 / P12 | `determinismo.spec` G15 en 3 motores × 2 sistemas |
| Saltos con aviso | el build se rompía con el primer mapa real | el aviso de «más de 2 saltos» era error de facto | § 5.3 carril exprés | P1 |
| 7 pistas en un canal | el nivel 2 de Fabric no cabía en 6 posiciones fijas | § 5.3 da 6 | § 5.3 | P1 · `densidad.test` |
| Etiquetas y referencias | etiqueta de modos encima de otra; referencias fuera de su fila; etiqueta de salto lejos de su trazo; etiqueta rozando la tarjeta | sin segundo lugar; espaciado fijo; regla que suponía saltos anidados | § 5.3 · D15 | P1 · invariante «etiqueta a ≤ 30 u de su trazo» |
| El mapa envejecido (C-1) | el build se caía solo el 2026-10-27 | insignia de 3 cifras fuera del lienzo o pisada por un flujo; referencia fuera | G11 · § 4.8 | `envejecer.test` (matriz de 4 edades) · `atlas-vigencias.test` |
| Paso en ciclo (A-5) | validaba y después `numerarPasos` agotaba la memoria | V5 no miraba el orden de `sigue_de` | V5 | P2 · P3 |
| Vecinas sin lugar (A-6) | una línea atravesaba la tarjeta vecina en la vista «bloque» | ruteo directo sin hueco ni par de vuelta | D11 | `bloque.test` (a)(b) |
| D11 sin aviso (M-1) | un cruce solo lo veían las pruebas del paquete | `layout` no reportaba cruces | D11 | `geometria.test` M-1 |
| Pistas en el borde (M-23) | tramos verticales sobre el borde de una tarjeta | offsets ±250 | D11 | `densidad.test` |
| Fuera del lienzo y bloque vacío (M-24, M-25) | ficha fuera del lienzo y activable sin glifo, sin aviso | sin comprobación | G11 · G7 · V3 | `geometria.test` |
| Diff por orden de claves (M-26) | 14 flujos «cambiados» sin cambio | `JSON.stringify` sin orden | § 4.7 | `texto.test` |
| Flujo hacia sí mismo (B-38) | aceptado y dibujado distinto en cada vista | sin regla | V4 | `validar-piloto.test` |
| Idioma no declarado (B-39) | `TypeError` sin mensaje | sin guarda | § 8 | `texto.test` |
| Pistas pegadas (D-S1-58) | en el nivel 2 y el recorrido de Fabric, una línea punteada bajaba a 2 u de dos tarjetas: parecía salir de la vecina, y una flecha de llegada quedaba encima de dos líneas | 2 u de aire en las pistas exteriores y en el reparto parejo (M-23) | § 5.3 · D11 | aviso `pistas:` · P1 y A3 a cuatro edades |

## Decisiones no anticipadas

- **ADRs nuevos:**
  - `decisions/diagramador-architecture.md`;
  - `svg-serializer-and-golden-files.md`;
  - `investigator-code-first.md` (_accepted_);
  - `investigator-7s-compliance.md` (relectura del 2026-09-30);
  - `design-mockup-destination.md` (A-25: la maqueta se sirve en los deploys privados durante H1 y se retira al
    cerrar el ciclo);
  - `design-system-s1-extensions.md`, con 5 decisiones: ventana de un bloque, selector, nota de marcas, estado
    vacío con solicitud y triángulo de «por revisar».
- **D-S1-01…57:** registradas una por una en la bitácora. Las de contrato van en «Enmiendas»; las de proceso, en
  «Desviación del plan».
- **Contra la VISION (para la planeadora):** «desde el repo lanzas `/investigar`» pasa a ser «la pantalla deja una
  solicitud como tarea de GitHub; quien la atiende corre `/investigar`» (D-S1-57, decisión de la persona). La skill
  y la regla «jamás corre sola» no cambian.

## Bugs + resoluciones

- **A-04, la maqueta no abría en el preview.** `serve` y Vercel quitaban la extensión `.html`. Se arregló con
  `serve.json`, `vercel.json` y un e2e que exige estilos aplicados.
- **G15 en Linux:** `geometricPrecision` (arriba).
- **El build que se rompía con la fecha (C-1):** arriba.
- **Inyección en el comando de aprobación (A-2)**, el investigador que podía reescribir lo que produce el código
  (A-1) y «sin novedades» que esquivaba la cita y el rechazo (A-3, A-4): pagados con sus gates.
- **Hidratación:** el e2e de movimiento reducido no veía React #418, porque la comparación de `outerHTML` no lo
  detecta. Ahora escucha los errores (B-8).
- **WebKit:** clics y teclas sobre una página recién cargada se perdían. Se agregaron los helpers `abrir`,
  `abrirConTecla` y `listo`, más la señal de hidratación en `aria-pressed` (M-9).
- **La pasada de capturas marcaba «Copiar» sin efecto en una propuesta pendiente:** decide antes de copiar.

- **Frase caducada en `.env.example`** (la cazó `/deploy-check`, § 9): heredada del kit, decía que «el proveedor
  LLM y sus keys se añaden en el sprint que active IA». En Big-D eso es falso: no hay proveedor ni claves. Ahora el
  archivo lo dice así, y nombra las dos perillas de build y pruebas (`BIGD_FECHA_CONSULTA`, `E2E_PUERTO`) con el
  aviso de que jamás van en `.env.local` ni en Vercel.

## Qué salió bien / qué generó fricción

- **Bien:**
  - El contrato y el piloto se ajustaron mutuamente: el primer mapa real destapó 6 enmiendas de geometría, y cada
    una dejó su carnada.
  - Los gates nacieron en rojo en el mismo commit, y varios cazaron defectos reales: G15 en Linux, React #418 y
    el envejecimiento.
  - La revisión humana de Fabric fue fluida: 80 afirmaciones aprobadas desde la pantalla, con el comando en la
    terminal de la persona.
- **Fricción:**
  - **Las miradas.** El primer pedido de la parada A (dos tablas, once filas) no se entendió. Una pregunta de
    sí/no con la página abierta funcionó al instante, y nombrar las cosas con palabras que no están en pantalla
    volvió a fallar en la auditoría («No encuentro marcas comerciales»).
  - **El build que caducaba con el calendario (C-1)** solo lo vio la auditoría independiente. Ningún gate miraba
    el atlas en el futuro.
  - **LCP:** las fuentes con `display: block`, impuestas por G15, chocan con el presupuesto de 2,5 s del estándar.

## Sugerencias de mejora al método

- **Matriz de envejecimiento como gate estándar** de toda app con datos que caducan: construir o dibujar en cada
  fecha en que algo cambia de estado. Sin ella, el build se rompió solo un mes después de pasar todo en verde.
- **Miradas:** una pregunta de sí/no por mensaje, con la página abierta por el constructor y la ubicación dicha
  con lo que se ve (qué hay arriba y abajo, primeras palabras, término para Cmd+F). Jamás un nombre que no está en
  pantalla.
- **Para el kit:**
  - la casilla 7-S en `/deploy-check` (M-4, ya agregada aquí);
  - el hook de gitleaks sobre el texto que se va a escribir (`gitleaks stdin`, B-25);
  - `beforeSend` de Sentry que vacía `exception.values[].value` (B-10);
  - no estampar `verify-ephemeral` en apps sin captura de terceros (B-28).
- **El presupuesto de LCP** debería contemplar el caso de fuentes con métricas obligatorias (G15): o un
  presupuesto por perfil, o el subconjunto de fuentes como paso del kit.

## Deuda técnica aceptada

| Qué | Por qué | Sprint de pago |
|---|---|---|
| LCP 2455–2772 ms (estándar 2500; presupuesto renegociado a 2900) | `display: block` de las fuentes (G15); `/es` pesa 12,9 KB, no es el HTML | **S2**: subconjunto de las dos woff2 (83 KB) a los rangos de `cobertura.json`, con métricas y huellas regeneradas, y medir de nuevo |
| «lago de datos» ×5 en el mapa de Fabric | Un mapa aprobado no se corrige a mano; decisión de la persona («data lake» no se traduce) | **S2**, con la próxima investigación de Fabric; la validación ya rechaza el calco en toda propuesta nueva |
| CSP | El export estático trae scripts en línea | S2 o S3, con hashes en el build |
| El panel de Deployments de GitHub muestra el enlace del preview | Lo escribe la integración de Vercel; no se automatiza con un token de administración (regla 17) | Revisión en cada cierre |
| `vercel[bot]` comenta el enlace del preview en cada PR y lo edita en cada push | `"github": { "silent": true }` en `vercel.json` no lo frena; el comentario del PR #4 se borra tras el último push del sprint, con el «sí» de la persona (M-12) | **S2**: la persona apaga los comentarios del bot en la configuración Git del proyecto en Vercel |
| La maqueta se sirve en los deploys privados | Referencia de fidelidad durante H1 (A-25) | Cierre del ciclo (S4), por ADR |
| `packages/diagramador/README.md` dice «aún no existe» | Es copia fijada del contrato | Enmienda 38 (planeadora) |

## Jobs y checks

- **Corrió por primera vez en este PR:** `diagramador (ubuntu-latest)` y `diagramador (macos-latest)` (`a6748cb`).
  Se vio en rojo con su demo (`ab3e901`) y cazó G15 en Linux (`0185d05`).
  - G11 en Firefox y WebKit dentro de `e2e`: primera corrida verde en `cd4d86b`.
  - Para estos no hay histórico con el que comparar: no puede afirmarse ni regresión ni no-regresión.
- **Conclusión propia por check, último commit:** `93d2edc`, el último commit antes de este summary: `quality`, `e2e`, `lighthouse`, `diagramador (ubuntu-latest)` y `diagramador (macos-latest)` en `success`, más Vercel y Vercel Preview Comments. Ninguno quedó `skipped`. El commit de este summary se verifica con `gh pr checks 4` tras su push y su resultado va en el PR.

## CONTRATO.lock

`version: 0.3.0`; 54 archivos idénticos a `reusables/diagramador/` de la planeadora (`node
scripts/contrato/verificar.mjs`, 2026-09-30). Huella del archivo `CONTRATO.lock`:
`c7760f969ac81d95e9b978ccbbe5752f6be9a4f5816b7fb51893e142637c2874`.

## Archivos clave

1. `packages/diagramador/src/layout/` — colocación por bandas y ruteo por canales.
2. `packages/diagramador/src/svg/` — serializador propio, glifos y leyenda.
3. `packages/diagramador/test/` — carnadas, golden files, envejecimiento y propiedades.
4. `src/lib/datos/cargar.ts` — el dato que falla al cargar con archivo, regla e id.
5. `src/lib/investigador/` — esquema, validación, retiros, aprobación, revisión y solicitud.
6. `scripts/investigar/hooks/` — los candados del investigador.
7. `src/app/[idioma]/atlas/[plataforma]/` — el atlas en sus tres niveles.
8. `src/app/[idioma]/investigador/[plataforma]/page.tsx` — la pantalla del investigador.
9. `data/mapas/fabric.mapa.yaml` · `data/revisiones/fabric.jsonl` — el mapa aprobado y su registro.
10. `sprints/SPRINT_001-implementation-log.md` — la bitácora completa.

## Cómo probar

- **Local:**
  - `pnpm install && pnpm build && pnpm start`, y abre `/es` (redirige al atlas).
  - Fecha fija: `BIGD_FECHA_CONSULTA=2026-10-27 pnpm build` muestra el atlas «por revisar»; `2026-12-26`,
    «vencido».
- **Pruebas:**
  - `pnpm test`;
  - `pnpm test:e2e` (con `E2E_PUERTO` si el 3000 está ocupado);
  - `pnpm exec playwright test -c playwright.determinismo.config.ts`.
- **La guía:** `docs/GUIA-DE-PRUEBA.html` (doble clic), con el kit en `docs/kit-de-prueba/`.
