# Auditoría de una pasada · S5 «Las decisiones»

Auditor independiente en solo lectura (subagente Sonnet 5.5), rama `sprint-005/decisiones` contra `origin/main`.
Resultado: 0 críticos · 1 alto · 8 medios · 14 bajos. Recomendación del auditor: requiere ajustes (todos pagados en
el sprint salvo los medios y bajos del lote).

## Pagados en el sprint

| Id  | Severidad | Hallazgo                                                                                                                                                  | Ubicación                                                                  | Estado                                                                          |
| --- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| A-1 | Alto      | Textos que prometían un informe inexistente, una reapertura de decisión que el código no hace, y un análisis de riesgos obligatorio que ningún gate exige | `src/lib/i18n/es.ts:344,427,428,437`, `src/lib/i18n/en.ts:344,427,428,437` | pagado · cee8c56 (solo texto; el enforcement queda como alternativa en el lote) |
| M-1 | Medio     | La tabla AIAG-VDA de referencia mostraba la banda «1» al final (orden de `Object.keys`)                                                                   | `src/components/plan/Plan.tsx:240-246`                                     | pagado · cee8c56, con prueba de primera fila en `tests/unit/ui/plan.test.tsx`   |
| M-2 | Medio     | El motivo `falta-evidencia` caía en el mensaje genérico (la clave era `sin-evidencia`)                                                                    | `src/lib/i18n/{es,en}.ts:379`, `src/lib/i18n/tipos.ts:231`                 | pagado · cee8c56, con prueba exhaustiva sobre el tipo `Motivo`                  |

## Al lote del hito (medios y bajos)

### Medios

- **M-3** Campos de salida sin lector: `ResultadoPlan.comparacion` (`src/engine/plan.ts:123`), `DecisionCalculada.una_via|sin_fuente|riesgos` (`src/engine/plan.ts:95,100,102`), `RiesgoResidual.rpn` (`src/engine/plan.ts:69`), `AlertaDelPlan.decisiones` (`src/engine/plan.ts:114`). La UI recalcula en `src/lib/plan/vista.ts:64,184,205` y `src/app/[idioma]/casos/[caso]/decisiones/page.tsx:71-73`. Consumir o borrar.
- **M-4** Falta prueba de integración del camino feliz de la aprobación: `src/app/[idioma]/casos/[caso]/decisiones/page.tsx:82-85` (el comando se arma en la página; las pruebas lo dan ya armado en `tests/unit/ui/plan.test.tsx:100-107`). Falta también la prueba de la deduplicación de ids del ciclo (`page.tsx:75-80`).
- **M-5** La matriz de envejecimiento (regla 23) no tiene gate para `supuesto.vence`: `tests/unit/plan/plan.test.ts:106-111` solo fija dos fechas. Falta barrer `vence` y el día siguiente sobre el plan real.
- **M-6** Brochure con textos y métricas del S4: `docs/brochure-export.json:155` («sprints 1 a 4») junto a `valor: 13`; `:203` (hash cruzado describe solo el resultado comparativo); `:182-195` (`pruebas_automaticas` 2614 y `cobertura_lineas` no incluyen las pruebas nuevas). Se ajusta al cierre del hito (regla 13).
- **M-7** Guía: `docs/GUIA-DE-PRUEBA.html:112-116` no menciona el plan del caso ni el chip «Nuevo · S5»; `:432` (o4) no dice el esperado concreto con el plan real. (El «ev-» de `:428` ya está corregido en el sprint.)
- **M-8** Las pruebas del núcleo del plan fijan 3 plataformas: `tests/unit/nucleo/lib/plan.ts:13`. Falta una variante con 4 (carnada permanente, regla 4) y otra con 2, en `VARIANTES_PLAN` y en la propiedad de neutralidad (`tests/unit/plan/plan.test.ts:133-165`).

### Bajos

- **B-1** Tres copias del escape HTML: `src/lib/plan/vista.ts:17`, `src/lib/plan/ondas-svg.ts:119`, `src/lib/atlas/vistas.ts:86`. Ids sin escapar en `ondas-svg.ts:310,395` (seguro por el esquema `^dec-[a-z0-9-]+$`, sin defensa en profundidad).
- **B-2** `src/lib/caso/rutas.ts:27`: `conDecisiones = true` por omisión enlaza a un 404 en un caso sin plan.
- **B-3** Un plan sin decisiones carga; `src/lib/plan/ondas-svg.ts:198` emite `width="-56"`. Falta `min(1)` en `src/lib/datos/plan.ts`.
- **B-4** `scripts/contrato/verificar.mjs:63`: «18 archivos idénticos a su origen» sobrestima: solo `contrato/CONTRATO.md` se compara con la planeadora; los otros 17 solo con el lock.
- **B-5** `causa` y `origen` de modos y supuestos no se muestran en pantalla (`src/components/plan/Plan.tsx`, `src/lib/plan/vista.ts`); la trazabilidad de la regla 9 está en el dato y el sello, no a la vista.
- **B-6** `src/lib/plan/vista.ts:63` llama `evaluacionDe` (corre SMAA) solo para leer el veredicto; pesará con el perfil aprobado (`src/lib/caso/casos.ts:50-51`).
- **B-7** Pruebas pegadas al dato real: `tests/unit/plan/datos.test.ts:54-62`, `tests/unit/ui/plan.test.tsx:37,66,75,77` fijan 7, 5, 4 y 2.
- **B-8** `docs/MANUAL-DE-USO.md:251`: «Opción recomendada» dice que aparece con el perfil aprobado; lo condicionado es la lista, no el encabezado (`src/lib/plan/vista.ts:237`).
- **B-9** `src/lib/plan/ondas-svg.ts:196-197`: el `3` (líneas por tarjeta) necesita constante con su razón.
- **B-10** Gates propios nuevos sin demostración en rojo (`contrato-lock` del paquete, fila `planes-aprobados`, lint G2/G3 del paquete). El cierre lo declara; la demo va al lote.
- **B-11** `src/lib/plan/ondas-svg.ts:69-79`: los cruces y dimensiones solo los lee la prueba; un plan con cruces se publicaría sin fallar el build. Falta golden file del SVG.
- **B-12** Ruido de diff: `src/lib/investigador/aprobados.ts` (+193/−), `src/lib/investigador/index.ts`, `src/lib/instrumento/validar.ts:36-42` reformateados sin relación con el sprint.
- **B-13** `riesgos` ordena por prioridad → severidad → RPN (`src/engine/plan.ts:220-226`); `informe.modos` del paquete ordena por prioridad → RPN → id. Diferencia deliberada: va a «Enmiendas al contrato» en el cierre. Además `planDe` recalcula `prioridades()` por modo en vez de usar `informe.modos`.
- **B-14** `scripts/aprobar.mjs`: `escribirPlan` conserva los comentarios de `plan.yaml` salvo el aviso anterior. Correcto y probado (`tests/unit/plan/aprobar-plan.test.ts:189-192`). Sin acción.

Hallazgos observados por el constructor, no por el auditor (van al lote):

- La tabla de riesgos en teléfono se corta en la columna DECISIÓN dentro de su marco con scroll propio (`src/components/plan/Plan.tsx`, `.tabla-marco`). La página no desborda (380 px), pero la pantalla no lo avisa.
- Con un ciclo de dependencias, el motor no calcula ondas para ninguna decisión: la pantalla muestra «ondas calculadas: 0». Causa por confirmar en `ordenarDecisiones` del paquete (no se edita); puede ser lo que el contrato pide, pero debe declararse en las enmiendas.
- Los chips «Nuevo · S3» y «Nuevo · S4» de `docs/GUIA-DE-PRUEBA.html` no se reclasifican en este sprint.

## Las cuatro casillas

1. **Cobertura de alcance:** completo en la pantalla, el motor, el paquete, los datos, la aprobación, las pruebas y los textos. Sin desviaciones no declaradas.
2. **Calidad:** sin críticos. Seguridad revisada: `dangerouslySetInnerHTML` solo con el SVG del build; fichas escapadas; el comando solo se arma con regex validadas; sin red ni secretos en el código nuevo.
3. **Frases caducadas:** tres falsas en `es.ts`/`en.ts` (pagadas), dos en el manual y la guía (lote), una en el brochure (lote).
4. **Campos sin consumidor y números cableados:** siete campos huérfanos de `planDe` (M-3). Ningún `3` ni tres-campos que representen plataformas en el núcleo ni en las vistas.
