# Auditoría final del Sprint 1 — Big-D · Fase 1 (solo lectura)

**Fecha:** 2026-09-29 · **Rama:** `sprint-001/atlas-de-fabric` · **Diff auditado:** `origin/main...HEAD` (328 archivos) ·
**HEAD:** `2bd203c`.

**Quién auditó:**

- Cinco auditores independientes, que no construyeron el sprint, cada uno con el diff delante y en solo lectura.
- Se repartieron por área: alcance y textos, motor del diagramador, app, investigador y seguridad, infraestructura y
  documentos.
- Cada hallazgo se verificó leyendo el código, y la mayoría se reprodujo con el motor o con las funciones reales.
- El constructor volvió a reproducir tres: C-1, A-2 y A-5.
- `git status` quedó limpio. Nadie corrió `scripts/aprobar.mjs` ni `/investigar`.

**Veredicto: requiere ajustes.**

| Severidad | Cuántos |
| --------- | ------- |
| Crítico   | 1       |
| Alto      | 6       |
| Medio     | 26      |
| Bajo      | 47      |

**Directiva de pago:** «los hallazgos se resuelven al finalizar el sprint, todos, hasta los bajos». La deuda solo recoge lo
que sea imposible pagar aquí, con su razón.

---

## 1. Cobertura de alcance

| Ítem del plan o de la orden                                                  | Estado                             | Evidencia                                                                                        |
| ---------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| F0: bitácora, K1–K8, constitución y deltas del kit, comandos                 | Completo                           | `sprints/SPRINT_001-implementation-log.md:29-94`, `CLAUDE.md:7-10`                               |
| F0: regla 18 mecánica, `controladores-maqueta`, higiene                      | Completo                           | `.github/workflows/ci.yml:26-29`, `.gitignore:32`                                                |
| F0: A-04 (la maqueta en el preview)                                          | Completo                           | `serve.json:2-6`, `vercel.json:3-8`, `tests/e2e/maqueta-servida.spec.ts`                         |
| F0: workspace, copia del contrato, `CONTRATO.lock` y su gate                 | Completo                           | 48/48 huellas iguales a la planeadora; `tests/unit/contrato-lock.test.ts`                        |
| F0: fuentes G15, tokens, tema (A-31), i18n, `--coverage`                     | Completo                           | `src/app/fuentes.ts`, `src/styles/tokens.css`, `vitest.config.ts:18,47-52`                       |
| F0: lints G2, G3 y «planea, no opera», con su rojo                           | Completo                           | `eslint.config.mjs:5-25`, bitácora:165-171                                                       |
| F0: los 5 ADRs                                                               | **Parcial**                        | «Código primero» sigue _proposed_ (M-3)                                                          |
| F1: validación, layout 1/2/3, carriles, D11, `toSVG`, `toText`, `diff`       | Completo                           | `packages/diagramador/src/**` (`compare` pasa a S2, como dice el plan)                           |
| F1: carnadas 31/31, golden, fast-check, job `diagramador` y ruleset          | Completo                           | La ruleset exige los 5 checks con sus nombres exactos                                            |
| F2: `data/`, cargador G14, rutas                                             | Completo, con desviación declarada | D-S1-15: `/` redirige a `/es`                                                                    |
| F2: capturas con interacción, fidelidad y FORMA del selector                 | Completo                           | bitácora:518-584                                                                                 |
| F2: FORMA de la nota de marcas                                               | **Con desviación**                 | D-S1-34, decidida sin mirada (M-5)                                                               |
| F3a: nivel 2, ficha, recorrido, selector                                     | Completo                           | `src/app/[idioma]/atlas/[plataforma]/**`, `PanelFicha.tsx`                                       |
| F3a: estado vacío en contexto (A-27)                                         | **Con desviación**                 | Sin mirada de FORMA (M-5)                                                                        |
| F3b: skill, agente, 4 hooks, esquema, `verificar-citas`, `aprobar`, pantalla | Completo, con hallazgos            | A-1…A-4, M-15…M-22                                                                               |
| F3c: corrida real y parada B                                                 | Completo                           | `propuestas/2026-09-27-fabric/`, `data/revisiones/fabric.jsonl:1`                                |
| F4: e2e de Fabric en 3 niveles × 2 idiomas                                   | **Con desviación**                 | `tests/e2e/atlas.spec.ts:8` solo cubre el ejemplo; Fabric va por `g11` y `reduced-motion` (B-16) |
| F4: G11 × 3 motores, reduced motion, axe × 2 temas, teclado                  | Completo                           | `tests/e2e/{g11,reduced-motion,atlas,atlas-niveles}.spec.ts`                                     |
| F4: A-24, A-25, A-29, A-30, `lighthouse-urls`                                | Completo                           | bitácora:916-939                                                                                 |
| F4: guía v1, kit, manual, `design-sync/`, ADR de extensiones                 | Completo, con hallazgos            | M-2, M-5, B-11, B-14, B-15, B-26                                                                            |
| AC «D11 = 0 en Fabric, 3 vistas»                                             | **Parcial**                        | Hoy mide 0, pero ningún gate lo exige (M-1)                                                      |
| AC «LCP de cada ruta nueva»                                                  | **Parcial**                        | Solo consta el nivel 1 (B-27)                                                                    |
| AC y contrapeso «cada pantalla leída como imagen»                            | **Parcial**                        | Constan 4 encuadres de Fabric (M-7)                                                              |
| `## Desviación del plan` en la bitácora                                      | **No implementado**                | La bitácora la promete en :24-25 (M-6)                                                           |
| `/deploy-check`, summary, PR listo, campo homepage, aviso `/cierre-sprint`   | Pendiente por secuencia            | No es hallazgo                                                                                   |

---

## 2. Crítico

### C-1 · El build se rompe solo el 2026-10-27, sin cambiar una línea de código

- **Dónde:**
  - `packages/diagramador/src/layout/piezas.ts:98-110` (insignia de vigencia al lado de la ficha) y `:194-224` (fila de
    referencias);
  - `packages/diagramador/src/layout/nivel2.ts:240-245` (las referencias empiezan después de la insignia);
  - `packages/diagramador/src/layout/bloque.ts:32,44,55` (el lienzo de la ventana no cuenta la insignia);
  - `piezas.ts:102` (la insignia montada crece hasta la mitad de la tarjeta);
  - `src/lib/atlas/vistas.ts:60,101` (el build aborta ante cualquier aviso);
  - `src/lib/datos/fecha.ts:8` y `.github/workflows/ci.yml:34,47,67` (la fecha es la del día del build);
  - `src/lib/investigador/dibujo.ts:11-19`, `validar.ts:47`, `aprobar.ts:79` (el investigador dibuja en una sola fecha).
- **Qué pasa:** el motor solo se probó con mapas vigentes. Cuando un nodo pasa a «por revisar», a los 30 días de
  verificado, aparecen tres defectos:
  - **(a)** En el nivel 2 y en el recorrido, la insignia lateral de una ficha de franja (~73 u) empuja la fila de
    referencias. La de orquestación de Fabric ya estaba al 100 %: `referencia r-f-canalizacion-copia: se sale del lienzo`.
  - **(b)** En la vista «bloque», la insignia queda fuera del lienzo sin ningún aviso, y G11 se rompe en la ventana nueva.
  - **(c)** Desde los 100 días, «NNN d» ensancha la insignia montada hasta cruzar la mitad de la tarjeta, y la línea entre
    dos tarjetas vecinas la pisa.
- **Escenario (reproducido por tres auditores y por el constructor):**
  - Fabric se verificó el 2026-09-27.
  - `avisosDeDibujo(fabric, G, f)` da 0 avisos hasta el 2026-10-26.
  - Desde el 2026-10-27 da el aviso de arriba; también en 2026-11-26, 2027-06-01 y 2028-01-01.
  - Ese día `pnpm build` falla. Con él caen `quality`, `e2e` y `lighthouse` en todo PR, incluidos los de dependabot, y
    Vercel deja de desplegar `main`.
  - La Plataforma Ejemplo pasa en todas las fechas.
- **Por qué nadie lo vio:**
  - `packages/diagramador/test/lib/casos.ts:6` fija la fecha vigente.
  - `test/vigencia.test.ts:33-40` cuenta insignias, pero no mira avisos ni si caben.
  - `test/bloque.test.ts:26,35` mide el ancho declarado y no el contenido: es un test decorativo.
  - `tests/unit/atlas.test.ts` prueba fechas futuras solo con el ejemplo.
- **Ajuste.** El auditor del motor probó los pasos 1–4 en una copia: los 30 golden quedan intactos y todas las
  carnadas validan igual.
  1. **Motor, `piezas.ts`.**
     - Extraer `export function anchoInsignia(ctx, dias)`, que devuelve 360 más el ancho máximo entre idiomas de «N d»
       en mono 12/700, y usarla en `insigniaVigencia`.
     - Cambiar el `bx` de la insignia montada por
       `Math.max(caja.x + caja.w - 100 - bw, caja.x + mitad(caja.w) + 40)`.
  2. **Motor, `referencias()`.**
     - Calcular `exceso = Σanchos + 40·(n−1) − (ancho − M − 40 − desde)`.
     - Mientras `exceso > 0`, abreviar con `ctx.sans.abreviar(nombre, 13, 700, max(400, anchoTexto − exceso))` desde la
       referencia más ancha hacia la más angosta (en empate, por índice).
     - Dibujar el nombre abreviado y dejar el nombre entero en `aria-label` y en la lectura (D6).
     - **Es un estado visual nuevo: pide mirada de FORMA** sobre el nivel 2 de Fabric con fecha 2026-10-27.
  3. **Motor, `bloque.ts`.**
     - En las franjas, reservar `max(0, …ns.map((n) ⇒ vigente ? 0 : 80 + anchoInsignia(ctx, días)))`.
     - La caja de ruteo pasa a `w + reserva`, `centroCanal` a `M + w + reserva + mitad(CANAL)` y el ancho a
       `2M + w + reserva + CANAL`.
     - Las tarjetas se dibujan con la caja real.
  4. **App, gate nuevo `tests/unit/atlas-vigencias.test.ts`** (nace en rojo hoy; ese rojo es su demo).
     - Para cada atlas publicado, toma cada `fecha_verificacion` distinta + {0, 29, 30, 59, 60, 400} días.
     - En cada fecha, `vistaNivel1`, `vistaNivel2` y `vistaRecorrido` no deben lanzar en ningún idioma.
  5. **Investigador, `dibujo.ts`.**
     - `avisosDeDibujo` dibuja en tres fechas: la dada, la verificación más antigua + `umbral_revisar_dias` y la
       verificación más antigua + `umbral_vencido_dias`. `sumarDias` va en `src/lib/datos/fecha.ts`.
     - También dibuja la vista «bloque» de cada grupo.
     - Así el validador y la aprobación rechazan un mapa que se rompe al envejecer.
  6. **Paquete, prueba nueva.**
     - Recorre los 6 ejemplos, P1 y A3; las vistas nivel-1, nivel-2, recorrido y «bloque» de cada grupo; y las fechas
       vigente, por revisar, vencido y 2027-01-15.
     - Exige `avisos = []`, `crossings = []`, todo rótulo dentro del lienzo y ningún trazado que corte un rótulo de
       vigencia.
- **Verificado cuando:**
  - La prueba del paquete y `atlas-vigencias` están en rojo antes del arreglo y en verde después.
  - `BIGD_FECHA_CONSULTA=2026-10-27 pnpm build` y `=2027-06-01 pnpm build` terminan en 0.
  - `SHA256SUMS` no cambia.
  - Hay una pasada de capturas con la fecha 2026-10-27, leída como imagen.
  - El defecto queda anotado como falla del reusable, con su carnada.

---

## 3. Altos

### A-1 · El investigador puede reescribir los archivos que produce el código

- **Dónde:** `scripts/investigar/hooks/candado.mjs:41-47`, que solo exige el prefijo `propuestas/`.
- **Escenario:**
  1. El investigador corre `verificar-citas`, que tiene permitido.
  2. Con Edit cambia `"no-encontrada"` por `"verificada"` en `verificacion.json`.
  3. `propuesta_sha256` solo cubre `propuesta.json`, así que la verificación sigue «siendo de esta versión».
  4. La pantalla la preselecciona como aprobada y `aprobar.ts:62` la acepta.

  Por el mismo camino también puede borrar líneas de `registro-de-ejecucion.jsonl` o reiniciar `.reintentos`.

- **Ajuste:**
  - En `candado.mjs`, para Write, Edit, MultiEdit y NotebookEdit del investigador, resolver la ruta contra la raíz y
    exigir `^propuestas\/[A-Za-z0-9][A-Za-z0-9._-]*\/propuesta\.json$`.
  - Importar `relative`.
- **Verificado cuando:** en `tests/unit/investigador/hooks.test.ts`, un `it.each` da estado 2 para cada una de estas
  rutas:
  - `propuestas/x/verificacion.json`
  - `propuestas/registro-de-ejecucion.jsonl`
  - `propuestas/x/.reintentos`
  - `propuestas/x/error-validacion.json`
  - `propuestas/x/y/propuesta.json`
  - `propuestas/a$(id)/propuesta.json`

  Los dos casos legítimos siguen en 0. Con la regla anterior, los seis dan 0: esa es la demo en rojo.

### A-2 · Inyección de comandos en la terminal de la persona

- **Dónde:**
  - `src/lib/investigador/comando.ts:5` pega la carpeta sin filtrarla;
  - `src/lib/investigador/revision.ts:90-103` acepta cualquier nombre de carpeta;
  - `scripts/investigar/comun.mjs:13`.
- **Escenario (reproducido):**
  - `comandoAprobar("propuestas/2026-09-27-fabric$(touch pwned)", …)` devuelve
    `node scripts/aprobar.mjs propuestas/2026-09-27-fabric$(touch pwned) --aprobar …`.
  - Una carpeta con ese nombre, con bytes y verificación idénticos a los de una válida, aparece en la pantalla.
  - La persona copia el comando y `$(…)` se ejecuta con sus permisos, fuera de todo hook.
- **Ajuste:**
  1. Aplicar A-1.
  2. En `pendiente()`, filtrar `/^[A-Za-z0-9][A-Za-z0-9._-]*$/`.
  3. `comandoAprobar` lanza un error si la carpeta no cumple `^propuestas\/[A-Za-z0-9][A-Za-z0-9._-]*$`.
  4. `carpetaPropuesta()` exige ese juego de caracteres y además `dirname(dir) === join(RAIZ, "propuestas")`.
- **Verificado cuando:**
  - `expect(() => comandoAprobar("propuestas/x$(id)", [], [])).toThrow()`.
  - En `revision.test`, esa carpeta no aparece.

### A-3 · Con `sin_novedades: true` desaparece la exigencia de cita

- **Dónde:** `src/lib/investigador/validar.ts:46` y `aprobar.ts:66-67`.
- **Escenario:**
  - Sin mapa previo y con `afirmaciones: []`, `validar.ok` da verdadero y `aprobar` publica «v0.1.0 con 14 componentes y
    0 citas».
  - Con mapa previo, un texto nuevo sin cita entra como v0.2.0.
  - En pantalla, con 0 afirmaciones, `faltan = 0` y el comando aparece de inmediato.
- **Ajuste:**
  - En `validar.ts:46`, exigir siempre la cobertura (quitar `if (!p.sin_novedades)`).
  - En `aprobar.ts`, después de :62, agregar una falla por cada `sinAfirmacion(mapa, afirmaciones)`.
- **Verificado cuando:** en `nucleo.test`, con `propuestaNorte()`, `sin_novedades: true` y `afirmaciones: []`:
  - `validar` falla con «no tiene ninguna afirmación»;
  - `aprobar` lanza `ErrorDeAprobacion`.

### A-4 · En «sin novedades» se ignora el rechazo de la persona y se renueva la fecha de todo

- **Dónde:** `src/lib/investigador/aprobar.ts:66-73`.
- **Escenario:**
  - La persona rechaza A-1 porque su cita no se encontró.
  - El resultado es «sin-novedades v0.3.0» y el nodo sigue, con `fecha_verificacion` renovada.
  - En el semáforo, un componente cuya fuente ya no dice lo que decía se ve «vigente».
- **Ajuste:** en `aprobar.ts:66`, usar
  `sinNovedades = e.anterior !== undefined && e.rechazadas.length === 0 && huella(contenido(propuesto)) === huella(contenido(e.anterior))`.
- **Verificado cuando:** en `nucleo.test`, con `anterior` de igual contenido y una rechazada sobre un nodo hoja:
  - `resultado === "aprobada"`;
  - el nodo ya no está en `mapa.nodos`.

### A-5 · Un paso del recorrido que se sigue a sí mismo, o que sigue a uno posterior, valida y después revienta el motor

- **Dónde:** `packages/diagramador/src/validar/reglas-mapa.ts:37-43` (V5) y `src/layout/nivel2.ts:44-58`.
- **Escenario (reproducido):**
  - Un paso `{id:"px", sigue_de:"px"}` da `validate ok`. Después, `layout(…,"recorrido")` y `toText` terminan en
    _JavaScript heap out of memory_, sin regla ni id (G14).
  - Un paso que sigue a uno posterior valida y numera mal: dos pasos «1», y `6b` sin `6a`.
- **Ajuste:**
  - En `reglasRecorrido`, emitir V5 si `r.pasos.findIndex((x) => x.id === p.sigue_de) >= k`, con el mensaje «sigue a «…»,
    que no está antes en la lista».
  - En `numerarPasos`, llevar un `Set` de visitados y lanzar un error si un paso se repite.
- **Verificado cuando:**
  - Dos carnadas del piloto, P2 (auto-referencia) y P3 (referencia hacia adelante), dan exactamente un V5 cada una.
  - Una prueba de `numerarPasos` con ciclo lanza el error en vez de agotar la memoria.

### A-6 · Dos tarjetas vecinas de una columna no dejan lugar a su línea (vista «bloque» de franja y flujos de ida y vuelta)

- **Dónde:** `packages/diagramador/src/layout/rutas.ts:108-112,157-158,233-237`, `src/layout/bloque.ts:32` (8 u entre
  fichas) y `src/lib/investigador/dibujo.ts:13-17` (no dibuja la vista «bloque»).
- **Escenario:**
  - **(a)** Un flujo `catalogo-central → filtros-filas` pasa los niveles 1, 2 y el recorrido. En la vista «bloque», su
    etiqueta queda encima de las dos cajas. El investigador y la aprobación lo aceptan, y el build lo rechaza en
    `ventanas()`.
  - **(b)** Con `modelo-semantico → tablero` más su vuelta, los dos trazados son el mismo segmento y sus etiquetas
    chocan.
- **Ajuste.** El auditor lo probó: los 30 golden quedan intactos y todos los mapas y grupos dan 0 avisos y 0 cruces.
  - En `rutear`, `directo(c)` exige estas tres condiciones:
    - filas contiguas;
    - que no haya vuelta (`${c.d}>${c.o}`);
    - un hueco de 300 u o más.
  - Reemplazar `Math.abs(b.fila - a.fila) > 1` por `!directo(c)` en los puertos y en `pedir`, y `=== 1` por `directo(c)`
    en el dibujo.
  - `avisosDeDibujo` suma la vista «bloque» (ver C-1, paso 5).
- **Verificado cuando:**
  - Los escenarios (a) y (b) dan `avisos = []` y `crossings = []` en `bloque.test.ts` y en `geometria.test.ts`.
  - Los dos trazados de (b) no comparten puntos.

---

## 4. Medios

| #    | Dónde                                                                                                                                                                             | Qué pasa                                                                                                                                                                                                | Ajuste                                                                                                                                                                                                                                                                                                                                        | Verificado cuando                                                                                                                                 |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| M-1  | `src/lib/atlas/vistas.ts:60,101`; `src/lib/investigador/dibujo.ts:11-29`; `packages/diagramador/src/layout/index.ts:11-23`; `src/layout/carriles.ts:95-101`                       | D11 (ningún flujo atraviesa una caja) solo se exige en las pruebas del paquete. El build y la aprobación no llaman a `crossings`. En carriles, las pistas 5.ª y 6.ª salen del canal (±30 en uno de ±25) | Al final de `layout`, agregar un aviso `D11: <flujo> atraviesa la caja de <caja>` por cada cruce. Con eso el build, el validador y la aprobación lo ven sin tocar la app. `carriles.pista` avisa si `abs(orden·paso) > 230`. En `atlas.test.ts`, agregar un `it.each` de `crossings = []` sobre cada atlas publicado, sus vistas y sus grupos | Demo en rojo: `caso-ejemplo` con seis flujos `llega → valora` da el aviso. Hoy todo sigue en 0                                                    |
| M-2  | `docs/GUIA-DE-PRUEBA.html:181` (b3); `docs/MANUAL-DE-USO.md:41-42,51-53` (EN :172-173,:181-182)                                                                                   | Prometen una vigencia «con símbolo, texto y días» en cada bloque. Un bloque vigente no lleva insignia, y la compacta es símbolo + «N d»                                                                 | Reescribir b3 y el manual: el encabezado dice «vigente · verificado hace N días»; un bloque o componente solo lleva insignia si está por revisar o vencido (símbolo + días). Explicar cómo verlo en local con `BIGD_FECHA_CONSULTA`                                                                                                           | b3 es realizable hoy; `guia-de-prueba.test` sigue verde                                                                                           |
| M-3  | `decisions/investigator-code-first.md:3-4,19,22,51-52`                                                                                                                            | Sigue _proposed_. Afirma un «tiempo por capa en la bitácora» y un «consumo de suscripción en el registro» que no existen                                                                                | Pasarlo a _accepted (2026-09-29)_. Evidencia real: la bitácora 3b/3c, 80/80 citas verificadas y las pruebas de los scripts. Corregir las dos afirmaciones                                                                                                                                                                                     | `grep accepted` da la línea 3 y ya no aparecen esas frases                                                                                        |
| M-4  | `decisions/investigator-7s-compliance.md:3-4,34`; `.claude/commands/deploy-check.md`                                                                                              | El ADR remite a una casilla de `/deploy-check` que no existe: nada exige releer los términos antes de un release                                                                                        | Agregar la casilla «IA de construcción por suscripción (7-S)» a `deploy-check.md` y citarla en el ADR                                                                                                                                                                                                                                         | `grep investigator-7s-compliance .claude/commands/deploy-check.md` la encuentra                                                                   |
| M-5  | `decisions/design-system-s1-extensions.md:10-11`; bitácora:588-592, 609, 1018-1019                                                                                                | La nota de marcas (D-S1-34) y el estado vacío en contexto (D-S1-41) se decidieron sin mirada de FORMA, pero el ADR dice que la persona los vio                                                          | Corregir el ADR y la bitácora: 1–2 vistos; 3–4 decididos por el constructor. Llevar las dos miradas a la persona (una pregunta por mensaje) o al gate del ciclo, y registrar la respuesta                                                                                                                                                     | ADR y bitácora dicen lo mismo; las miradas quedan registradas                                                                                     |
| M-6  | `sprints/SPRINT_001-implementation-log.md:24-25`                                                                                                                                  | Promete `## Desviación del plan` y la sección no existe                                                                                                                                                 | Agregarla al final, con cada desviación en una línea (31 carnadas, V1–V15, kit v1.32, `propuestas/` en la raíz, pruebas en el paquete, determinismo, ADRs por tema, D-S1-01/13/14/15/34/41/42, la ventana, scripts renombrados, `atlas.spec`, `compare` a S2). Avisar a la persona                                                            | `grep "^## Desviación del plan"` da una línea                                                                                                     |
| M-7  | bitácora:812, 1025                                                                                                                                                                | El contrapeso del ⭐ diferido pide cada pantalla leída como imagen. Los 88 encuadres se midieron, pero solo consta una muestra leída                                                                    | Sobre el build final, `pnpm capturas:producto`, leer los 88 encuadres y registrarlo con la carpeta, la fecha y los defectos                                                                                                                                                                                                                   | «88/88 leídos como imagen» en la bitácora y en el summary                                                                                         |
| M-8  | `data/mapas/fabric.mapa.yaml:129,267,290,297,1001`; `tests/unit/maqueta-vocabulario.test.ts` (`VETADAS`)                                                                          | El mapa aprobado dice «lago de datos» 5 veces, un calco que `design-system.md` § 8 prohíbe. El gate de vocabulario solo barre la maqueta                                                                | Mover `VETADAS` a `tests/unit/lib/vocabulario.ts`. Nuevo `tests/unit/datos-vocabulario.test.ts` sobre `data/mapas` y `data/gramaticas` (nace en rojo con los 5). El mapa no se toca a mano: la persona decide entre reinvestigar esas afirmaciones o declarar deuda con una lista `CONOCIDAS`                                                 | Con la corrección o con la deuda declarada queda verde, y en rojo si se planta el calco en una copia                                              |
| M-9  | `tests/e2e/atlas.spec.ts:31-34,76-78,106-107`; `tests/e2e/atlas-niveles.spec.ts:14-17,31-33,44-50,76-78,114-115`                                                                  | Los clics y teclas sobre una página recién cargada no reintentan, como lo que vio WebKit. El test «desde 900 px es región lateral» afirma el rol del panel oculto: pasa sin abrir nada                  | `abrirConTecla` en `tests/e2e/lib/abrir.ts` y usarla, junto con `abrir`, en esos pasos. El test de 900 px abre el panel antes de afirmar                                                                                                                                                                                                      | `git grep 'dispatchEvent("click")'` en esos specs solo aparece en los helpers; `--repeat-each=5` en verde                                         |
| M-10 | `src/lib/datos/cargar.ts:35` (usos en :51, :68, :97)                                                                                                                              | Un YAML roto rompe el build con «Map keys must be unique at line 2», sin nombrar el archivo (regla 6)                                                                                                   | `leerYaml` atrapa el error y lo agrega a `fallas` como `archivo · yaml · mensaje`, con un centinela `ROTO`                                                                                                                                                                                                                                    | Casos nuevos en `datos.test.ts` (plataforma y mapa con clave repetida), en rojo antes y en verde después                                          |
| M-11 | `src/components/atlas/CampoPlataforma.tsx:31-34`                                                                                                                                  | En Windows y Linux, una flecha sobre el `select` cerrado navega en el acto. WCAG 3.2.2 (nivel A) pide avisar antes                                                                                      | Nota visible y enlazada con `aria-describedby`: «Al elegir otra plataforma se abre su atlas.» / «Choosing another platform opens its atlas.» Es texto, no cambio de forma                                                                                                                                                                     | Un e2e con `toHaveAccessibleDescription` en `/es` y en `/es/atlas/fabric`                                                                         |
| M-12 | `vercel.json` (sin `github.silent`)                                                                                                                                               | `vercel[bot]` publicó el enlace del preview en los PR #1–#4, en un repo público (regla 17). Detrás hay SSO, pero la regla prohíbe publicar la URL                                                       | Agregar `"github": { "silent": true }`. Ocultar o borrar los 4 comentarios del bot (acción visible: la hace la persona o la autoriza). Anotar en el summary que el panel de Deployments también expone la URL                                                                                                                                 | `gh pr view 4 --json comments` sin el dominio tras el siguiente push                                                                              |
| M-13 | bitácora:408-432, 608-609, 650-653, 740-743, 832; `packages/diagramador/src/layout/bloque.ts:1`, `src/texto/toBlockCards.ts:1`, `test/bloque.test.ts:2`, `test/golden.test.ts:21` | D-S1-40…45 nombran dos cosas distintas: enmiendas del motor y decisiones de la fase 3                                                                                                                   | Renumerar las del motor: 40→49 … 45→54, en la bitácora y en los 4 comentarios                                                                                                                                                                                                                                                                 | `uniq -d` sobre los ids de la bitácora sale vacío                                                                                                 |
| M-14 | `vitest.config.ts:23`; `.github/workflows/ci.yml:33`                                                                                                                              | El piso «UI > 50 %» de la regla de desarrollo 2 no se mide: `src/components/**` no entra en la cobertura. Además, el comentario del CI dice 70 %                                                        | Sumar `src/components/**/*.tsx` con umbral 50 y las pruebas de componente que falten (PanelFicha, ControlRecorrido, ControlLienzo, CampoPlataforma, ConmutadorTema). Corregir el comentario                                                                                                                                                   | Filas de `src/components` en la tabla de cobertura del CI; demo en rojo con el umbral en 99                                                       |
| M-15 | `scripts/aprobar.mjs`; `scripts/investigar/hooks/candado.mjs`                                                                                                                     | El candado de `aprobar` se burla desde la sesión principal. Cinco formas dan exit 0: `f=…; node $f`, `apro""bar`, `aprob?r`, copiar el script, `node -e import(…)`                                      | Guarda dentro del script: `puedeAprobar({raiz, repo, env, tty})` niega si está en el repo con `CLAUDECODE` o sin TTY. En D-S1-46, el hook pasa a ser defensa contra el accidente, no la frontera                                                                                                                                              | Prueba unitaria de `puedeAprobar` (repo + `CLAUDECODE` → no; TTY sin la variable → sí; raíz temporal → sí); `scripts.test` sigue verde            |
| M-16 | `data/revisiones/*.jsonl` (`huella` sin lector)                                                                                                                                   | Nada comprueba que el mapa publicado sea el que aprobó una persona: una edición a mano de `fabric.mapa.yaml` pasa                                                                                       | `tests/unit/datos/mapas-aprobados.test.ts`: para cada plataforma no ficticia con mapa aprobado, la huella del YAML y su versión coinciden con la última revisión                                                                                                                                                                              | Verde hoy; rojo con una palabra editada en una copia                                                                                              |
| M-17 | `.claude/agents/investigador.md`; `.claude/settings.json`                                                                                                                         | El modelo puede lanzar el subagente `investigador` sin que una persona escriba `/investigar`: `disable-model-invocation` solo cubre la skill (regla 2, ADR 7-S)                                         | Hook PreToolUse `Agent                                                                                                                                                                                                                                                                                                                        | Task`que bloquea`subagent_type: "investigador"` (`scripts/investigar/hooks/sin-lanzar.mjs`). Confirmar en vivo que `/investigar` sigue arrancando | `hooks.test`: 2 para investigador y 0 para otros; prueba en vivo registrada |
| M-18 | `candado.mjs`; `scripts/verificar-citas.mjs:45-51`                                                                                                                                | Read, Glob y Grep del investigador no tienen límite, y llegan hasta la planeadora privada. `verificar-citas` baja cualquier URL https de la propuesta sin validarla ni buscar identificadores           | Candado para Read, Glob y Grep: solo `data/`, `propuestas/`, `src/lib/investigador`, `.claude/skills/investigar`. `identificadores()` pasa a `comun.mjs`. `verificar-citas` valida la propuesta y aborta si una URL lleva un identificador                                                                                                    | Una cita con `?u=<identificador>` hace salir con 1 sin escribir; el hook da 2 para `Read ../x` y `.env.local`                                     |
| M-19 | `src/lib/investigador/revision.ts` (`pendiente`); `aprobar.ts`                                                                                                                    | Una propuesta más vieja que la cerrada reaparece como pendiente, y `aprobar` la acepta: el mapa retrocede. Repetir el comando duplica la línea de revisión                                              | `pendiente()` solo mira carpetas posteriores a la última cerrada. `aprobar` recibe `ultimaPropuesta` y falla si la carpeta es igual o de fecha menor                                                                                                                                                                                          | `nucleo.test` y `revision.test` con la carpeta vieja                                                                                              |
| M-20 | `src/components/investigador/RevisionPropuesta.tsx:54-62`; `revision.ts:160-170`                                                                                                  | La tarjeta de una afirmación no dice sobre qué componente o flujo es. Rechazarla retira ese `sobre`, y la persona solo ve el texto del modelo                                                           | Agregar `nombre` (nodo, u «origen → destino») y mostrar `sobre · nombre` en la cabecera. **Estado nuevo: mirada de FORMA**                                                                                                                                                                                                                    | `revision-propuesta.test`: la tarjeta A-1 muestra su componente                                                                                   |
| M-21 | `src/lib/investigador/aprobar.ts:67`                                                                                                                                              | Los retiros no son afirmaciones: si el modelo omite un nodo o un flujo, desaparece al aprobar, y la persona solo ve «N retirados»                                                                       | Bandera `--retirar id,…` en el comando y en `leerDecisiones`. `aprobar` exige que coincida con los retirados del `diff`. La pantalla los lista. **Mirada de FORMA**                                                                                                                                                                           | `nucleo.test`: con un nodo de más en `anterior`, falla sin `--retirar` y pasa con él                                                              |
| M-22 | `src/lib/investigador/aprobar.ts:41` (`contenido`)                                                                                                                                | «Sin novedades» es inalcanzable: la skill pide la fecha de hoy en cada fuente, y `contenido` compara esa fecha                                                                                          | `contenido` quita `fuentes[].fecha`. Va junto con A-4                                                                                                                                                                                                                                                                                         | `nucleo.test`: el mismo mapa con fuentes fechadas hoy da `sin-novedades`                                                                          |
| M-23 | `packages/diagramador/src/layout/rutas.ts:45`; `test/densidad.test.ts:105-107`                                                                                                    | Las pistas 4 y 6 (±250) caen justo sobre el borde de las tarjetas. D11 no lo cuenta y la prueba lo fija como correcto                                                                                   | `OFFSETS_PISTA = [-50, 50, 150, 230, -150, -230]`; actualizar la prueba                                                                                                                                                                                                                                                                       | Prueba nueva: ningún tramo vertical sobre el x de un borde (`nube-ejemplo` con `balanceador` y cuatro nodos)                                      |
| M-24 | `packages/diagramador/src/layout/nivel1.ts:226-237`                                                                                                                               | En el nivel 1, las fichas de franja pueden salirse del lienzo sin aviso                                                                                                                                 | `if (f.fin > W - M) ctx.avisos.push("ficha … se sale del lienzo")`                                                                                                                                                                                                                                                                            | Prueba con `nube-ejemplo` y un bloque en `identidad`                                                                                              |
| M-25 | `packages/diagramador/src/layout/nivel1.ts:41-48,65-68`; `src/layout/bloque.ts:30`                                                                                                | Un bloque sin componentes valida bien, pero dibuja un activable sin glifo (G7) y hace caer el build en la vista «bloque»                                                                                | Aviso en `nivel1`: «bloque … no tiene componentes». Enmienda: extender V3                                                                                                                                                                                                                                                                     | Prueba con el bloque vacío                                                                                                                        |
| M-26 | `packages/diagramador/src/diff.ts:18,59-60`; `src/lib/investigador/revision.ts:114`                                                                                               | `JSON.stringify` depende del orden de las claves: con las mismas claves reordenadas, los 14 flujos y 8 pasos salen «cambiados»                                                                          | Comparación canónica con claves ordenadas (`compararCodigo`); en `revision.ts`, usar `huella`                                                                                                                                                                                                                                                 | Prueba con las claves reordenadas: `cambiados = []`                                                                                               |

---

## 5. Bajos

**App**

- **B-1 · `src/components/atlas/ControlRecorrido.tsx:101,107`.** «Anterior» y «Siguiente» usan `disabled`: al llegar al
  extremo, el foco cae al `body`. Pasar a `aria-disabled` con una guarda en el `onClick`, y en CSS
  `.boton[aria-disabled="true"]`.
- **B-2 · `ControlRecorrido.tsx:80-87`.** Enter sobre un componente del recorrido abre su ficha pero no cambia el paso
  (el clic sí). En `alTecla`, Enter o Espacio sobre `#rec .dg-nodo[data-paso]` hace `setPaso`.
- **B-3 · `src/components/atlas/PanelFicha.tsx:57-64`.** Reactivar el mismo componente no lleva el foco al título.
  El estado pasa a `{ id, n }`.
- **B-4 · `src/components/NavSecciones.tsx:9,14`.** En la portada, «Atlas» lleva `aria-current="page"`. Usar `"page"`
  solo en la ruta exacta y `"true"` en la sección.
- **B-5 · Componentes con lógica de datos.**
  - `src/components/Barra.tsx:22` usa `datos().plataformas[0]!`: pasar a `rutaInvestigador()` en `cargar.ts`, con
    respaldo y prueba.
  - `CabeceraAtlas.tsx:60` tiene un ternario redundante.
  - `Niveles.tsx:4` redefine `Nivel`.
- **B-6 · `src/lib/datos/fecha.ts:4-10`.** Acepta días imposibles como `2026-02-31`. Exigir que la fecha cumpla el
  viaje de ida y vuelta por `Date`, y agregar la prueba.
- **B-7 · `src/app/global-not-found.tsx`.** Sin prueba ni axe. Agregar un e2e con status 404, `h1`, enlaces a `/es` y
  `/en`, y axe en los dos temas.
- **B-8 · `tests/e2e/reduced-motion.spec.ts`.** Ningún e2e escucha errores de hidratación. Juntar `pageerror` y los
  `console.error` que coincidan con `#418|#423|#425|hydrat` y exigir que no haya ninguno. Demo en rojo con un
  componente que dependa de `window` al pintar.
- **B-9 · Comentarios caducados.**
  - `next.config.ts:13-14` («otro para `/`»).
  - `src/styles/atlas.css:38`: encabezado «Ficha breve» sin reglas debajo.
  - `data/plataformas/fabric.yaml:1-2`: «se lista como próximamente».
- **B-10 · `instrumentation-client.ts:24-29`.** `beforeSend` no vacía `exception.values[].value`: un error capturado
  solo viaja con su mensaje crudo. Usar `v.value = v.type`, y proponerlo al kit.

**Alcance, textos y guía**

- **B-11 · `docs/kit-de-prueba/README.md`.**
  - En :66-70 dice «29 con un defecto»: son 26 (C01–C21, GC1–GC5) más 3 de aceptación (A1–A3).
  - En :5-6, `ejemplo.invalid` vale solo para la muestra; la base incompleta usa `example.org`.
- **B-12 · `packages/diagramador/README.md:30` («aún no existe»).** Es copia fijada: va a «Enmiendas» del summary.
- **B-13 · `README.md:4-6` (EN :11-13).** Presenta el núcleo comparativo como si ya existiera. Agregar «Hoy: el atlas y el
  investigador; la comparación llega en los próximos sprints del ciclo».
- **B-14 · `docs/GUIA-DE-PRUEBA.html`.**
  - :265: el bloque F se titula «…y la base de conocimiento», pero esa pestaña está pendiente.
  - :242 (d4): falta decir «a la derecha en ancho, desde abajo en teléfono».
  - :280 (f7): los dos `rm` del README se pisan. Dejar un solo `rm -rf` con las tres rutas.
- **B-15 · `docs/MANUAL-DE-USO.md`.**
  - :110 (EN :238): «quién lo aprobó» debe ser «que lo aprobó una persona y cuándo».
  - :21-22: aclarar que la Plataforma Ejemplo sale del contrato del diagramador.
- **B-16 · `tests/e2e/atlas.spec.ts:8`.** `RUTA` debe salir de `PUBLICADAS`, para que G10 en el producto cubra Fabric
  en los dos idiomas.
- **B-17 · Cardinalidades de hoy.**
  - **(a)** `src/app/global-not-found.tsx:11-14,27-29`: dos idiomas fijos y textos fuera del diccionario. Iterar
    `IDIOMAS` con `textos(i)`.
  - **(b)** `packages/diagramador/src/layout/tipos.ts:86-88`, `contexto.ts:107`: el plural `[string, string]` con
    `n === 1` va a «Enmiendas» (plurales como dato por idioma).
  - **(c)** `src/lib/atlas/vistas.ts` y `recorrido/page.tsx:14`: solo se dibuja el primer recorrido. El cargador debe
    rechazar más de uno, o declararlo.
  - **(d)** `tests/e2e/lib/rutas.ts:16-21`: supone `/recorrido` en toda plataforma publicada. Filtrar por recorridos.
- **B-18 · Reglas citadas por número en documentos para personas.** La orden pide citarlas por nombre: `MANUAL:3`,
  `design-sync/README.md:3,29`, `decisions/investigator-7s-compliance.md:9`.

**Infraestructura**

- **B-19 · `scripts/contrato/verificar.mjs:13-20`.** No ve archivos nuevos en la planeadora. Listar el origen y fallar
  por cada archivo que falte en la copia.
- **B-20 · `.github/workflows/ci.yml:79-81`.** Lighthouse arranca «a ciegas»: aparece el aviso de timeout del servidor
  y `@lhci/cli` no tiene versión fijada. Agregar `--startServerReadyPattern="Accepting connections"` y fijar la
  versión.
- **B-21 · `lighthouse-urls.json`.** Faltan `/es/investigador/fabric` (el único estado «mapa aprobado») y
  `/en/atlas/fabric`.
- **B-22 · `scripts/capturar-producto.mjs:96,472-473`.** Si algo falla, `serve` y el navegador quedan vivos. Usar
  `try/finally` y `process.on("exit")`.
- **B-23 · `scripts/lib/cargar-ts.mjs:26`.** Deja un `bigd-ts-*` temporal por corrida. Borrarlo después de importar.
- **B-24 · `vercel.json`, `serve.json`.** Sin cabeceras de seguridad. Agregar `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy`. La CSP queda declarada como deuda: el export estático
  trae scripts en línea.
- **B-25 · `.claude/settings.json:12`.** El PreToolUse de gitleaks corre `protect --staged` y no mira lo que se va a
  escribir. Pasar a `gitleaks stdin`, con demo en rojo, y proponerlo al kit.
- **B-26 · `docs/kit-de-prueba/`.** No hay receta para regenerar la propuesta de muestra. Agregar
  `scripts/kit-de-prueba/generar.mjs`, o los comandos exactos en el README.
- **B-27 · Presupuesto de LCP.** `perf-budget.json` dice 3000 ms y el estándar 5 pide ≤ 2500. Bajarlo y medir; si no
  alcanza, declarar la renegociación. Registrar el elemento LCP móvil de cada ruta.
- **B-28 · `package.json`.** `pino` no tiene ningún import (sin backend no hay Pino) y `scripts/verify-ephemeral.mjs`
  quedó huérfano del kit. Quitarlos o declararlos.

**Investigador**

- **B-29 · `candado.mjs:6` → `scripts/lib/cargar-ts.mjs:9` (esbuild).** Los hooks fallan abiertos: una excepción sale
  con 1 y Claude Code sigue. Calcular la raíz sin esbuild y, con `--investigador`, hacer que `uncaughtException`
  salga con 2.
- **B-30 · `scripts/verificar-citas.mjs:31`.** `curl` expande `{a,b}` y `[1-5000]`, y lee `~/.curlrc`. Poner `-q`
  primero y agregar `-g`.
- **B-31 · `src/lib/investigador/esquema.ts:14`.** Una cita de 12 caracteres se acepta y sale «verificada». Subir el
  mínimo a 40; la corrida real tuvo un mínimo de 35.
- **B-32 · `scripts/investigar/comun.mjs:32`.** La fecha de aprobación es UTC, y la persona aprobó el 28 en hora local.
  La cabecera y el veredicto deben decir «(UTC)».
- **B-33 · `scripts/aprobar.mjs:44,62`.** La línea de revisión no pasa por `esquemaRevision` antes de escribirse, y
  `BIGD_FECHA_APROBACION` no se valida.
- **B-34 · `scripts/aprobar.mjs:20-28`.** Tres escrituras no atómicas. Escribir a `.tmp`, hacer `rename` y dejar la
  revisión para el final.
- **B-35 · `scripts/investigar/hooks/validar-al-terminar.mjs:53-59`.** `.reintentos` no se reinicia al pasar la
  validación.
- **B-36 · `scripts/investigar/hooks/registro.mjs:21`.** Publica el `tool_use_id` crudo en un repo público. Guardar
  `sha256(id).slice(0,16)`.
- **B-37 · `src/lib/investigador/aprobar.ts:81-85`.** La «sanidad» calcula un `diff` y lo descarta (`void d`): es una
  comprobación que no puede fallar (regla 15). Borrarla.

**Motor**

- **B-38 · `packages/diagramador/src/validar/reglas-mapa.ts:118-125`.** Un flujo de un nodo hacia sí mismo se acepta y
  cada vista lo trata distinto. Error V4.
- **B-39 · `toText.ts:27-29`, `toCard.ts:27-29`, `toBlockCards.ts:24-26`, `leyenda.ts:17-19`.** Un idioma que la
  gramática no declara provoca un `TypeError`. Dar un error claro, como ya hace `toSVG`.
- **B-40 · Lógica duplicada.**
  - Los umbrales de vigencia aparecen 4 veces: `contexto.ts:74-77`, `toText.ts:39-45`, `toCard.ts:55-57`,
    `toBlockCards.ts:43-47`.
  - `toCard.ts:22-24` duplica `contieneTermino`.
  - La app repite las ramas de `sigue_de`.
  - Exportar `vigenciaDe` y `contieneTermino`.
- **B-41 · `toBlockCards.ts:16-21,59`.** La ventana no enlaza su versión en texto (G10). Agregar `id?` y que
  `ventanas()` lo pase a `toSVG`.
- **B-42 · `test/propiedades.test.ts:36-48`.** La invariancia al orden no cubre la vista «bloque», `toBlockCards`,
  `toText`, `toCard`, P1 ni los carriles. Se verificó a mano que se cumple; falta el test.
- **B-43 · `layout/tipos.ts:139`.** `grupo` está en español en una API que el contrato § 8 pide en inglés. Decidir y
  registrar la decisión como enmienda.

**Campos sin consumidor**

- **B-44 · Motor.** Estos campos solo tienen lectores en las pruebas del paquete, o ninguno:
  - `Geometria.gramatica`;
  - `filas[].banda/y/alto`;
  - `cajas`, `trazados` y `rotulos`;
  - `Geometria.vigencia` de la vista «bloque» (además es del mapa entero, no del grupo);
  - `Cruce.*`;
  - `Informe.avisos`;
  - `Entrada.doc/fase/idioma`;
  - `Diferencias.renombrados[].*`, `madurez[].*`, `flujos.retirados`, `pasos.*`;
  - `OpcionesLayout.metricas/fuente/fuenteMono`;
  - `CONTRATO_VERSION` y `crossings` en la app.

  Ajuste: con M-1, `cajas`, `trazados` y `crossings` pasan a tener lector. Cada campo restante se consume, se retira o
  se declara como API del reusable (enmienda).

- **B-45 · Investigador.**
  - Sin lector: `Propuesta.ejecucion.herramienta`.
  - La pantalla muestra `ejecucion.reintentos` tal como lo declara el modelo, sin verificarlo, y nadie muestra el
    contador real.
  - `Propuesta.capa` solo llega al título.
  - `cita.titulo/tipo/conflicto_de_interes` no llegan al mapa aprobado (tensión con la regla 5).
  - `Verificacion.resultados[].url/sha256` no se comparan.
  - Sin lector: `PropuestaVista.sinNovedades`.
  - `AfirmacionVista.sobre` no se lee (M-20).
  - `Revision.huella` no se lee (M-16).
  - De las listas de aprobadas y rechazadas solo se usa el largo.
  - `error-validacion.json` no se lee.

  Ajuste: consumir los que protegen (verificación contra la cita, contador real, `sobre`, `huella`) y declarar o
  retirar el resto.

- **B-46 · App.** `Plataforma.ficticia` no tiene lector en `src/`. Darle uno: el cargador rechaza una plataforma ficticia
  con fuentes fuera de `https://example.org/` (regla 12), con su prueba.
- **B-47 · Configuración.** `design-sync/project.json · nota`, `HUELLAS.json · origen/_nota` y los `_comentario` son
  documentación para personas y se aceptan. `pino` y `verify-ephemeral.mjs` quedan en B-28.

---

## 6. ¿Qué frases caducaron?

Barrido por promesa aplazada («todavía no», «pronto», «más adelante», «por ahora»…, en español y en inglés) sobre el
manual, el README, la guía, los diccionarios, el README de `design-sync`, el del kit, los ADRs y el README del paquete.

- **Siguen siendo verdad:** «pronto», «Todavía no hay mapa», `sinVerificar`, `comandoNota`, «Lado a lado» pendiente,
  «Base de conocimiento» pendiente, «Todavía no» en las preguntas frecuentes y «todavía no tiene proyecto».
- **Caducadas:**
  - `data/plataformas/fabric.yaml:1-2` (B-9);
  - `next.config.ts:13-14` (B-9);
  - `packages/diagramador/README.md:30` (B-12);
  - `README.md:4-6` (B-13);
  - la guía b3 y el manual sobre la vigencia (M-2);
  - `decisions/investigator-code-first.md` (M-3);
  - `decisions/design-system-s1-extensions.md:10-11` (M-5).
- **Guía heredada:** no aplica; la v1 es entera «Nuevo · S1». Todas sus pruebas son realizables hoy, salvo b3 (M-2).

## 7. Lo que se revisó y quedó bien

- **Neutralidad y red:**
  - no hay un `3` cableado ni trato especial a una plataforma en `src/` ni en el paquete;
  - no hay red a plataformas ni a proveedores de modelos;
  - Sentry no se descarga sin DSN.
- **Determinismo:**
  - sin `Math.random`, `Date`, `Intl`, `localeCompare`, `toLocale*` ni funciones inexactas en el motor;
  - `sort` con comparador total;
  - invariancia al orden verificada a mano en todas las salidas.
- **Escapado:** con texto hostil, las 6 salidas del motor lo escapan, y todo `dangerouslySetInnerHTML` de la app recibe
  salida escapada o constante.
- **Seguridad del flujo:**
  - `curl` corre con `execFileSync` y sin shell;
  - la lista blanca de Bash del investigador es exacta;
  - `sin-identificadores` bloquea el correo y el nombre;
  - no hay identificadores del usuario en `propuestas/` ni en `data/`.
- **CI:**
  - los 5 checks coinciden con la ruleset;
  - la cobertura se aplica;
  - los gates de deriva (maqueta, tokens, validador, datos, `design-sync`, golden, lock) pueden fallar y tienen su
    demo;
  - gitleaks sin fugas en los 29 commits;
  - barrido de enlaces con 0 coincidencias en archivos;
  - el campo homepage está vacío;
  - el preview y producción piden SSO sin sesión.
- **Accesibilidad:**
  - el contrato de foco de la ficha y la ventana está completo;
  - la forma del árbol no depende de la preferencia de movimiento;
  - la vigencia usa símbolo y texto.
- **Datos:**
  - el cargador valida en modo `publicacion`;
  - una alerta rompe el build;
  - `generateStaticParams` con `dynamicParams = false`;
  - el lock tiene 48/48 archivos iguales a la planeadora.

## 8. Lo que el pago necesita de la persona

1. **Aprobar esta auditoría y el pago de todo.** Es condición de la Fase 2.
2. **Cinco miradas, una por mensaje, con la página abierta:**
   - las referencias abreviadas del nivel 2 con fecha por revisar (C-1);
   - la cabecera de cada afirmación en la revisión (M-20);
   - la lista de retiros (M-21);
   - la nota de marcas (M-5);
   - el estado vacío en contexto (M-5).
3. **«Lago de datos» en el mapa de Fabric (M-8):** reinvestigar esas afirmaciones, que la persona corre y aprueba, o
   declararlo como deuda con su sprint.
4. **Los 4 comentarios del bot con el enlace del preview (M-12):** ocultarlos, o autorizar al constructor a hacerlo.
