# Sprint 006 · El informe — auditoría de una pasada

Auditor: subagente independiente (Sonnet 5.5, esfuerzo alto), solo lectura. No construyó el sprint y no leyó la bitácora:
leyó el diff contra `origin/main`, los cambios sin commit, el plan aprobado y el código nuevo. No corrió la suite, las e2e
ni el build: esas pruebas las corre la fase de verificación aparte. Fecha: 2026-10-11.

Veredicto del auditor: **listo para cierre**. Sin Críticos ni Altos: nada se paga dentro del sprint. Los Medios y Bajos
van al lote del hito con su `archivo:línea`, según el flujo del sprint.

Corrección posterior del autor del sprint: el auditor contó 72 casillas en la guía; la guía tiene 70 pruebas
(`<li data-origen>`), 66 del S5 más 4 del bloque P.

## 1. Cobertura del plan (D-S6-01 a D-S6-12)

| Ítem                                                                               | Clasificación               | Dónde                                                                                                                                                   |
| ---------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-S6-01 `informe.yaml` fuera de la instantánea, cargador y cruce de categorías     | Completo                    | `data/convenciones/informe.yaml`, `src/lib/datos/informe.ts`, `src/lib/datos/cargar-conocimiento.ts`                                                    |
| D-S6-02 `legibilidad.ts` puro, con propiedades                                     | Completo                    | `src/engine/legibilidad.ts`, `tests/unit/informe/legibilidad.test.ts`                                                                                   |
| D-S6-03 `hoja-de-ruta.ts`: fases, origen obligatorio, bloqueos, ciclo, sin semanas | Completo                    | `src/engine/hoja-de-ruta.ts`, `tests/unit/informe/hoja-de-ruta.test.ts`                                                                                 |
| D-S6-04 modelo de las 14 secciones en `src/engine/informe/`                        | Implementado con desviación | Es un archivo, `src/engine/informe.ts`, no un directorio (ver M3)                                                                                       |
| D-S6-05 resumen con variantes, recomendación y listas                              | Completo                    | `src/lib/informe/narrativa.ts`, `src/components/informe/Informe.tsx` (borde en M1)                                                                      |
| D-S6-06 fila `informe-legible` y demo en rojo                                      | Completo                    | `src/lib/instrumento/validar.ts`, `src/lib/informe/legible.ts`, `tests/unit/instrumento/validar.test.ts`                                                |
| D-S6-07 página, componentes, CSS, pestaña 10, impresión, lighthouse                | Completo                    | `src/app/[idioma]/casos/[caso]/informe/page.tsx`, `src/components/informe/*`, `src/styles/informe.css`, `src/lib/caso/rutas.ts`, `lighthouse-urls.json` |
| D-S6-08 relato de fracaso generado y humano opcional                               | Completo                    | `src/lib/informe/narrativa.ts`, `src/lib/datos/informe.ts`                                                                                              |
| D-S6-09 alertas de evidencia y del plan                                            | Completo                    | `src/engine/alertas-evidencias.ts`, `Alertas` en `Informe.tsx`                                                                                          |
| D-S6-10 ficha de reproducibilidad                                                  | Completo, con reparos       | `src/components/informe/Informe.tsx` (`Ficha`), `src/lib/informe/construir.ts:94-99` (M4, B1)                                                           |
| D-S6-11 huellas del informe en `NUCLEO.SHA256SUMS`                                 | Completo                    | `tests/determinismo/nucleo-casos.ts`, `tests/determinismo/NUCLEO.SHA256SUMS`                                                                            |
| D-S6-12 manual §14 ES/EN, brochure +1, guía bloque P, README                       | Parcial                     | M5 (README EN)                                                                                                                                          |
| F3 e2e del informe y de la sembrada                                                | Completo                    | `tests/e2e/informe.spec.ts`, `tests/e2e/sembrada/informe-sembrada.spec.ts`                                                                              |
| Cierre y auditoría                                                                 | Completo al escribirse      | `sprints/SPRINT_006-cierre.md`, este archivo                                                                                                            |

## 2. Hallazgos

### Medios (lote del hito)

- **M1 · `src/components/informe/Informe.tsx:124` · correctitud.** La recomendación de § 1 trata una plataforma única como
  ganadora con ventaja. Con el veredicto `unica`, `veredictoDe` (`src/engine/informe.ts:139-154`) lo convierte en `ganadora`
  con `segunda: null` y `brecha_unidades: 0`, y la lista imprime «X, con 0,0 puntos de ventaja.». Ninguna prueba cubre
  `unica` en la lista. Ajuste propuesto: ramificar `ganadora && !segunda` hacia una clave `rec.unica` sin cifra.
- **M2 · `src/components/informe/Hoja.tsx:28` y `:105` · consistencia (HTML).** `id="i-V-nn"` se repite: cada verificación
  de alistamiento aparece en `Fases` (#hoja) y en `Alistamiento` (#alistamiento). Con los 5 supuestos del plan real salen 5
  ids duplicados. Ajuste propuesto: prefijo distinto por vista (`i-` y `a-`).
- **M3 · `src/engine/informe.ts:126-135, 207` · campos sin consumidor y desviación de D-S6-04.** `ModeloInforme.secciones`
  no lo lee nadie: la página usa la constante `SECCIONES`. La huella `informe-*` no cubre matriz, pros y contras, robustez,
  decisiones, riesgos ni relato. Ajuste propuesto: quitar el campo o iterarlo en la página, y documentar en el cierre que
  las secciones 2 a 9 viven en `evaluacion` y `resultadoPlan`.
- **M4 · `src/lib/informe/construir.ts:94-99` · correctitud (reproducibilidad, RF-06.5).** La huella de entradas no incluye
  el relato humano que § 10 muestra. Dos informes con la misma huella pueden mostrar relatos distintos. Ajuste propuesto:
  añadir `relato: huellaDe(relato ?? null)` y una prueba.
- **M5 · `README.md:15` · consistencia.** El párrafo en inglés «Today:» no menciona el informe; el español sí.
- **M6 · `src/engine/informe.ts:196-205` · correctitud (plausible).** El estado `final` no depende de que la comparación
  puntúe. Con perfil y plan aprobados, sin ciclo, y `resultado.tipo === "no-evaluable"` por otra causa (todas las
  plataformas eliminadas), la banda dice «informe final». Con el dato actual no ocurre. Ajuste propuesto: un motivo
  `sin-comparacion` que deje el estado en borrador, o una prueba que lo impida.
- **M7 · `src/lib/informe/construir.ts` (no lo llaman la página ni los componentes) · pruebas.** La garantía «sin origen no
  hay ítem» (regla dura 9) la comprueban solo las pruebas, no el build. Ajuste propuesto: llamar a `origenesHuerfanos` en
  `construirInforme` y lanzar error si no está vacío, o una fila en `validar.ts`.

### Bajos (lote del hito)

- **B1 · `src/lib/informe/construir.ts:97` · correctitud (matiz).** La huella usa `k.convenciones` (la base viva) y el
  informe se calcula con las de la instantánea (`construir.ts:46`). Si `metodo.yaml` cambia después de congelar, la huella
  cambia sin que cambie el resultado.
- **B2 · `src/components/informe/Informe.tsx:578` · consistencia.** `empate: u.empate_centesimas / 100` imprime «5.5» con
  punto en español; `src/lib/informe/narrativa.ts:82` usa coma. Hoy sale «5» porque el umbral es 500.
- **B3 · `src/lib/informe/vista.ts:55-63` · diseño.** `CATEGORIAS_EN_ORDEN` duplica `CATEGORIAS` de `src/lib/datos/informe.ts`.
- **B4 · campos y textos sin lector fuera de pruebas.** `Informe.entrada` y `Informe.entradaRuta` (`construir.ts:25,27`);
  `ItemDeRuta.decision_id` (`src/engine/hoja-de-ruta.ts:72`); `ResumenInforme.n_pruebas_fase_0` (`src/engine/informe.ts:110`);
  `RobustezResumen.{cerca, semiamplitud_centesimas, estable, zona_gris}` (`src/engine/informe.ts:86-97`);
  `Lectura.{por_palabras, por_silabas, terminos_ok}` (`src/engine/legibilidad.ts`); `origenesHuerfanos` (solo tests); textos
  `item.cadena` (`src/lib/i18n/es.ts:498`), `resumen.presupuesto` y `presupuestoTerminos` (`es.ts:556-557`), `matriz.pros`.
- **B5 · rastro de la demo en rojo (D-S6-06).** La salida de `scripts/demo-rojo.sh` no queda en el diff; el cierre la pega.
- **B6 · `docs/MANUAL-DE-USO.md` (§14).** Dice que el relato humano aparece «si alguien lo escribe en el archivo del caso»,
  sin la ruta `data/casos/<caso>/relato-de-fracaso.yaml` ni el formato.
- **B7 · `src/app/[idioma]/casos/[caso]/informe/page.tsx`.** Línea en blanco de más entre `opcionDe` y `t` en `TablaDecisiones`.
- **B8 · `src/components/informe/Informe.tsx` (`Resumen`, `riesgo(id)!`) y `src/lib/informe/narrativa.ts`.** Aserciones no
  nulas sobre ids del propio plan; seguro hoy porque el cargador valida las referencias.

## 3. Críticos y Altos

Ninguno.

## 4. Frases caducadas

Sin promesas aplazadas caducadas en `README.md`, `docs/MANUAL-DE-USO.md`, `docs/GUIA-DE-PRUEBA.html`, los textos nuevos de
`src/lib/i18n/es.ts` y `en.ts`, y `docs/brochure-export.json`. Las frases con «todavía» describen un estado que la app tiene hoy:

| Frase                                                                    | Dónde                                         | Qué afirma hoy la app                                                                              |
| ------------------------------------------------------------------------ | --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| «La comparación no puntúa todavía» / «does not score yet»                | `resumen.parrafo.sinComparacion`              | Cierto con el perfil en borrador; lo resuelve una persona al aprobarlo                             |
| «aún no hay resultado que sacudir»                                       | `robustez.sin`                                | Vigente (mismo caso)                                                                               |
| «Cuando exista, aparece aquí junto al generado»                          | `relato.sinHumanoNota`                        | Vigente; el archivo se crea a mano (B6)                                                            |
| «mientras exista, ninguna decisión tiene fase»                           | `hoja.sinFaseNota`                            | Vigente (ciclo)                                                                                    |
| «Mientras el perfil del caso de ejemplo esté en borrador…»               | `docs/MANUAL-DE-USO.md`, preguntas frecuentes | Vigente                                                                                            |
| «Todavía no tiene mapa aprobado» / «Su mapa llega con una investigación» | `es.ts` (atlas e investigador), heredadas     | Vigente: la cuarta plataforma es ficticia                                                          |
| `sprints_cerrados: 3`                                                    | `docs/brochure-export.json:22`                | Desfasada desde antes del S6; el test lo cuenta por la línea `status: closed`. Va al lote del hito |

## 5. Campos del contrato sin consumidor

Ver M3 y B4. Con lector: el resto de `ResumenInforme`, `FichaDeReproducibilidad`, `ItemDeRuta` (salvo `decision_id`),
`HojaDeRuta`, `VistaHoja` e `ItemVista`.

## 6. Guía heredada

Sin hallazgos. La pestaña 10 pasa de pendiente a activa y ninguna prueba heredada decía lo contrario. El bloque P coincide
con el plan real (5 fases, 19 ítems).

## 7. Números de entidades cableados

Sin hallazgos. Los únicos `3` son `DESTACADOS_RESUMEN` (tres decisiones y tres riesgos del resumen, no plataformas), y
«primera» y «segunda» son puestos del resultado. Sí hay una constante duplicada (B3), que no es un número de entidades.

## Sin hallazgos en

Seguridad (las anclas salen de ids con esquema), CSP (sin `style` en línea), neutralidad (orden total en `hojaDeRuta`,
`alertasDeEvidencias` y `plataformas.sort`), núcleo (sin reloj, sin `Math.random`, sin `Intl` ni `toLocale*`), dependencias
(ninguna nueva).
