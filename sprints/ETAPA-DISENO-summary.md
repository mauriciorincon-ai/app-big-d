---
sprint: ETAPA-DISENO (F2a)
app: big-d
status: open — cierra con el veredicto de G-Diseño (mirada 5) y el merge del PR #3
opened: 2026-09-26
closed: pendiente de G-Diseño
branch: diseno/fundacion
pr: "#3 (mauriciorincon-ai/app-big-d)"
orden: portafolio/big-d/ordenes/DISENO-orden.md (planeadora)
---

# Etapa de Diseño Summary — Big-D

## Outcome

**Parcial, a un paso de cerrar.** Los entregables de la orden están construidos. Las miradas 1 a 4 están
aprobadas por el usuario con los archivos abiertos y registradas antes de construir encima. La
auditoría independiente pidió ajustes y quedaron pagados. Falta la mirada 5, que es G-Diseño sobre el
preview desplegado, y el merge a `main`. Esta sección se actualiza con el veredicto antes del merge.

## Qué se construyó

- **`design-system.md` v0.5.1**. Contiene personalidad, tokens de los dos temas (generados y medidos),
  tipografía (Space Grotesk y JetBrains Mono, elegidas por el usuario), movimiento y su variante
  reducida, estados, más de 45 componentes canon, anti-patrones, el contrato con el código del S1 y la
  deuda.
- **`docs/diseno/diagramador-tokens.md`**, la propuesta para el CONTRATO v0.3.0. Resuelve:
  - P5: siempre horizontal y con desplazamiento lateral, por decisión del usuario.
  - P4: una línea con etiqueta de modos.
  - P9: Orquestación como franja transversal.
  - P11: Space Grotesk.
  - P10: densidad estimada.

  Trae la paleta medida con su umbral y la simulación de daltonismo, los 8 glifos, los 4 trazos con sus
  marcadores, la tipografía, la geometría, la capa CSS de animación, la accesibilidad, los textos EN
  redactados y la **tabla § 16 de cambios al contrato**.

- **Maqueta navegable del H1** en `docs/diseno/`. Son 13 páginas: las 11 pantallas, el kit y la portada
  con el recorrido completo. Funciona a 380 px y en escritorio, en oscuro y claro, en ES y EN, y se
  despliega en el preview protegido (`/diseno/…`).
- **Generador de la referencia** versionado en `scripts/maqueta/`, invocable con `pnpm maqueta`.
  Incluye el caso ficticio con su simulación de robustez calculada, una copia fijada con huella del mapa
  de ejemplo y de la gramática, y un paso de pulido de accesibilidad común.
- **Herramientas**: `scripts/paleta/` (color, búsqueda determinista y generador de tokens),
  `scripts/copiar-maqueta.mjs` para el despliegue y `scripts/capturar-maqueta.mjs`. Este último es el
  arnés de capturas y medidas: declara su árbol y aborta fuera de él.

## DoD — checklist (6+1)

| Estándar       | Estado                             | Evidencia                                                                                                                                                                                                                                                                                        |
| -------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Testing        | ✓                                  | `pnpm test` da 85/85 en 6 archivos. Por archivo: paleta 46, deriva 14, controladores 13, vocabulario 7, autocontenida 2, dependabot 3. Cinco gates nuevos, cada uno con su demo en rojo registrada en la bitácora. `pnpm test:e2e` da 2/2 sin reintentos                                         |
| CI/CD          | ✓ | `quality`, `e2e` y `lighthouse` con conclusión propia `success` en cada push del PR #3 (último medido: `48add97`, quality 48 s · e2e 54 s · lighthouse 1 min 31 s · Vercel ✓). Primera corrida en CI de `maqueta-deriva` y `maqueta-controladores` en este PR: sin histórico, no se afirma regresión ni no-regresión                                                                    |
| Observabilidad | N/A                                | Sin código de producto. Sentry del estampado sin cambios (inerte sin DSN)                                                                                                                                                                                                                        |
| Seguridad      | ✓                                  | gitleaks en cada commit (0 fugas). `pnpm audit --audit-level high` sin vulnerabilidades. No hay overrides en `package.json`. Barrido de enlaces vacío tras el último `git add`. El campo homepage del repo está vacío                                                                            |
| Performance    | ✓ con límite declarado             | `lighthouse` mide `/`, no la maqueta: la maqueta es referencia y no pasa por Lighthouse (declarado en el plan)                                                                                                                                                                                   |
| UX + A11y      | ✓                                  | Medidas del arnés: 13 páginas × estados × 2 temas × 2 idiomas × 380/1280 → 392 medidas y 0 fallas. Verificado en Chromium: saltos, foco, colores forzados, movimiento reducido y ficha. Pares `lang` equilibrados. Color nunca solo (glifo + etiqueta, trazo + marcador, símbolo + texto + días) |
| IA embebida    | N/A                                | La etapa no toca IA                                                                                                                                                                                                                                                                              |

## Métricas técnicas

La orden no fija métricas numéricas. Lo que se midió:

- Paleta: peor par ΔE_OK de 0,124 en visión normal (umbral 0,10), 0,074 a severidad 0,6 (0,06) y 0,038 en
  dicromacia (0,03).
- Trazo de tipo más débil sobre el lienzo: 5,2:1 en oscuro y 3,1:1 en claro (mínimo 3:1).
- Texto: tinta-1 da 13,6:1 o más sobre toda superficie.
- Diagrama de ondas: 0 cruces D11 y 0 cruces entre líneas.
- Resumen de líder del informe: 49 palabras, medido por código (el máximo es 50).
- Robustez del caso por simulación sfc32, con 10 000 muestras uniformes sobre el politopo de pesos: Norte
  primera en el 100,0 %; empate técnico estable en el 99,0 %.

## Gate ⭐ — diferimiento y contrapesos

La etapa no tiene guía de prueba. Su gate humano es **G-Diseño**: la mirada 5 del usuario sobre el
despliegue, en teléfono y escritorio.

| Contrapeso                     | Evidencia (archivo, cuenta medida, corrida)                                                                                                                                                                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pasada de capturas del builder | Mirada 1: 352 encuadres. Mirada 2: 440. Mirada 3: 184. Mirada 4: 312 más 392 medidas. Pagos de la auditoría: 128, 392 y 208. Todo con 0 fallas de medida, más los encuadres leídos como imagen que lista la bitácora en cada fase. Arnés `scripts/capturar-maqueta.mjs`; capturas fuera del repo |
| e2e de `reduced-motion`        | 0 pruebas versionadas, porque la etapa no tiene pantallas de producto. La variante reducida del recorrido se verificó en Chromium (`reducedMotion: reduce`: «Reproducir» queda en el DOM con `display: none`, sin la hoja de animación). El e2e nace en el S1 con la primera pantalla animada    |

⭐ no aplica en la etapa. G-Diseño (mirada 5) queda pendiente del usuario.

## Auditoría (`/audita-sprint`)

- **Fase 1** la hizo un subagente independiente con el diff delante: `sprints/ETAPA-DISENO-auditoria.md`.
  Veredicto **«requiere ajustes»**, con 4 altos, 13 medios y 15 bajos.
- **Fase 2** la aprobó el usuario («Apruebo que corrija»). Pagos principales:

| Hallazgo                                    | Severidad | Pago                                                                                                                                                            |
| ------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-01 generador fuera del repo               | Alto      | `scripts/maqueta/` con rutas relativas, entrada fijada con huella y el gate `maqueta-deriva` (demo en rojo: edición a mano y dato sin regenerar)                |
| A-02 robustez imposible con su método       | Alto      | Simulación real en `caso.mjs`. La historia pasa a «orden sólido, empate estable» (D77). El informe genera cifras y cardinalidades desde N (D78)                 |
| A-03 teléfono cableado a tres plataformas   | Alto      | Todas las plataformas en cada banda, paginación desde una constante declarada y orden por identificador (A-22)                                                  |
| A-04 preview con sesión nunca visto         | Alto      | Depende del usuario: se pide en la mirada 5                                                                                                                     |
| A-05 a A-17                                 | Medio     | Los 13 pagados. El detalle, uno por uno, está en la bitácora                                                                                                    |
| A-18 a A-23, A-28, A-32                     | Bajo      | Pagados                                                                                                                                                         |
| A-24, A-25, A-27, A-29, A-30, A-31          | Bajo      | Deuda con sprint de pago (abajo)                                                                                                                                |
| **N-1** (hallazgo propio durante los pagos) | Alto      | La ficha del nivel 2 **nunca abrió**: la página no cargaba `ficha.js` desde la mirada 2. Nuevo gate `maqueta-controladores`, rojo sobre el estado real del repo |

El barrido de frases caducadas se repitió sobre el diff de la fase 2, y no apareció ninguna nueva.

## Decisiones no anticipadas

D1 a D80 están en `sprints/ETAPA-DISENO-implementation-log.md`: D1 a D18 salieron del plan aprobado y el
resto nació durante la etapa. No hubo ADR, porque no se tocó código de producto. Las decisiones que
cambian el contrato van a la tabla § 16 de la propuesta. Las más pesadas:

- D29: P5 siempre horizontal, del usuario.
- D34: banda de un solo componente con su nombre.
- D40: Space Grotesk.
- D44: las franjas son referencias también en el nivel 2.
- D63 y D75: `compare` a nivel 2 y un nivel por banda.
- D68: tabla de prioridad v0 con O ≥ 3.
- D77: robustez calculada.
- D79 y D80: umbrales de paleta medidos y paleta como salida de la búsqueda.

## Bugs + resoluciones

- El gate de vocabulario atrapó «★» y «Σ», que están fuera de la fuente. Pasaron a glifo SVG y a la
  palabra «suma».
- Desbordes a 380 px: la insignia de restricción, el semáforo y el índice del informe (elemento de
  rejilla sin `min-width: 0`). Corregidos midiendo.
- El barrido de enlaces encontró el patrón literal en la bitácora y en el CHANGELOG del kit. Ahora se
  escribe con clase de carácter.
- El diagrama de ondas del ciclo tenía 3 cruces. El carril superior los dejó en 0.
- La vista de impresión usaba una sombra y un `#fff`, prohibidos. Ahora usa un filete de 2 px y papel
  por token.
- El lockfile regenerado por dependabot bajaba `rolldown`, `browserslist` y `electron-to-chromium`.
  Se resolvió a mano según la regla 18.
- **La robustez tenía cifras escritas a mano** (A-02) y **la ficha del nivel 2 no cargaba su script**
  (N-1). En los dos casos, la bitácora afirmaba algo que no era cierto. Ahora cada afirmación de este
  tipo tiene un gate que la sostiene: deriva y controladores.

## Qué salió bien / qué generó fricción

**Bien.**

- Las decisiones visuales se tomaron mirando: tres direcciones y tres tipografías para elegir.
- Todo lo medible se midió: paleta, contraste, cruces, desbordes y palabras.
- La auditoría independiente encontró tres altos reales que la construcción daba por buenos.
- Las pantallas de contenido (comparación, informe, instrumento) fueron las que más valor le dieron al
  usuario.

**Fricción.**

- La ronda 1 fue rechazada entera («visualmente horrible»).
- El generador vivió fuera del repo cuatro miradas.
- Repetir la pregunta por un ajuste menor molestó al usuario: «deja de preguntar bobadas y avancemos».
  Quedó como regla guardada.
- El puerto 3000 estaba ocupado por el servidor de otra app del usuario. El e2e local corrió en 3100
  con una configuración temporal, sin tocar ese proceso.

## Sugerencias de mejora al método

1. **Gate de controladores en el kit:** todo control que una página dibuja tiene cargado su script. Es
   barato, genérico y habría atrapado N-1 en la mirada 2. Una captura de un panel cerrado «mide bien».
2. **El generador de la maqueta nace en el repo desde la fase 0**, con su gate de deriva. La regla 8
   («el visual se genera») no se puede auditar si el generador vive en un scratchpad.
3. **El arnés de capturas debe incluir una pasada de interacción**: abrir cada ficha o panel y comprobar
   que algo cambió, además de medir.
4. **Gate para PRs de dependencias:** ninguna versión puede quedar por debajo de la de `main` (regla 18).
   Hoy la comparación depende de leer la salida a mano.
5. **Ajustes menores ya comentados no se vuelven a pedir como mirada.** Se deciden, se registran y van
   al gate final. Es la preferencia explícita del usuario y afina la regla de mirada, sin relajarla para
   artefactos nuevos.
6. La plantilla del README de diseño del kit pide la URL de aprobación, lo que choca con la regla 17.
   Debería decir «preview del PR #N».

## Enmiendas propuestas al contrato del diagramador (para G-Metodo)

Están en `docs/diseno/diagramador-tokens.md` § 16. Las principales:

- G11 pasa a una sola disposición deslizable, y se retira la angosta (D1, G5, § 4, P10).
- Las franjas son referencias en los niveles 1 y 2.
- `compare` a nivel 2 y un nivel por banda en el mismo SVG.
- G10 con «Saltar el diagrama».
- Codificación del nodo sin relleno tintado.
- Ids de `<defs>` con espacio de nombres por SVG.
- Umbral de paleta declarado.
- `nodos_por_banda_max: 6`.
- Glifos escudo y barras, marcador ida-y-vuelta, madurez por nivel.
- Textos EN redactados.
- Tres carnadas nuevas.

## Deuda técnica aceptada

| Deuda                                                                                                                   | Por qué                                                               | Sprint de pago                                               |
| ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| Endurecer los gates de la maqueta (A-24): `http://`, escapes, `title[data-en]`, `fill:` en CSS y sha de `metricas.json` | Bajo, y la maqueta se congela tras G-Diseño                           | S1                                                           |
| La maqueta viaja en cada build (A-25)                                                                                   | Hay que decidir si se queda tras G-Diseño y excluirla de `build:demo` | S1                                                           |
| Estado vacío en contexto (A-27)                                                                                         | Solo existe en el kit                                                 | S1                                                           |
| Rol de los elementos activables (A-29)                                                                                  | Es del serializador                                                   | Sprint del diagramador                                       |
| Rama `prefers-color-scheme` sin ejercer (A-31)                                                                          | La maqueta fija el tema                                               | S1                                                           |
| Nota de marcas y selector de plataforma del atlas                                                                       | No se dibujaron                                                       | S1 (primer sprint con nombres reales)                        |
| El selector del lado a lado no filtra; en la vista de diferencias, las dos versiones abren la ficha vigente             | Es mecánica de maqueta                                                | Sprint de `compare` y `diff`                                 |
| El arnés no mide solapes de textos del mismo dueño                                                                      | Hoy hay 0 solapes (medición del auditor)                              | S1: e2e G11 del piloto                                       |
| Barra de sala solo en español                                                                                           | Es cromo de la maqueta, no producto                                   | No se paga: se retira con la maqueta                         |
| `--coverage` en `pnpm test`                                                                                             | La etapa no tiene código de producto que cubrir                       | S1, con los primeros tests del motor (regla de desarrollo 2) |

## Archivos clave

1. `design-system.md`
2. `docs/diseno/diagramador-tokens.md`
3. `docs/diseno/README.md` (registro de miradas y de G-Diseño)
4. `docs/diseno/index.html` (recorrido de la maqueta)
5. `scripts/maqueta/generar.mjs` y `scripts/maqueta/pantallas/caso.mjs`
6. `scripts/paleta/generar-tokens.mjs`
7. `scripts/capturar-maqueta.mjs`
8. `tests/unit/maqueta-deriva.test.ts` y `tests/unit/maqueta-controladores.test.ts`
9. `sprints/ETAPA-DISENO-implementation-log.md`
10. `sprints/ETAPA-DISENO-auditoria.md`

## Cómo probar

- Local: abrir `docs/diseno/index.html` con doble clic y recorrer las 13 páginas con la barra de sala
  (estados), idioma y tema.
- Desplegado: preview del PR #3 en `/diseno/index.html`, con sesión de Vercel. La URL vive en la
  planeadora, no aquí (regla 17).
- Regenerar la maqueta: `pnpm maqueta`. Después, `pnpm test` debe seguir en verde (deriva 0).
- Medir: `node scripts/capturar-maqueta.mjs --salida <dir temporal> --solo-medir`.
