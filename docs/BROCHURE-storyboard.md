# Big-D · storyboard del brochure (S10, F2)

> Contrato G-Guion del brochure (molde v2, `docs/BROCHURE.plantilla.html`; banco `docs/BROCHURE-banco-de-tecnicas.md`).
> El copy y los campos de cada escena viven en `docs/brochure-escenas.json`; `scripts/brochure/generar.mjs` los pone en
> `docs/BROCHURE.html` con las cifras y la huella **reales** de la demo pública (`src/lib/demo`), no con números dibujados.
> Estado: **no visto** (FORMA y TEXTO van al gate humano del hito, el ensayo del H-2; el sprint no abre miradas).

## Cabecera de la pieza

- **Dial `MOTION_INTENSITY`:** «sereno y exacto». Coreografía corta, curvas que deceleran sin rebote, nada que dure más de
  un segundo salvo el clímax. Big-D es un instrumento de medida: la pieza se mueve como un instrumento, no como un anuncio.
- **Identidad en una frase:** _«Todo lo que se mueve, se mueve para mostrar lo que no cambia.»_
- **Riesgo registrado (lo juzga el usuario en el gate):** el clímax no tiene un número grande ni un gráfico; es una línea de
  código hexadecimal que se queda **quieta** mientras los nombres de las plataformas se mueven. Apostamos a que la quietud
  se lee como promesa.
- **Excepciones a solo `transform`/`opacity`:** `stroke-dashoffset` en la escena 1 (trazo decorativo, un disparo; precedente
  del molde). Ninguna otra.
- **Motion-system:** `--ease-asentar: cubic-bezier(0.22, 1, 0.36, 1)` (el del design system para entradas); duraciones
  `--t-breve 0.35s` · `--t-escena 0.8s` · `--t-vuelta 1.4s`. Vocabulario propio: _dibujar · asentar · cambiar de lugar_.

## Escenas

| Campo                                | E1 · Una sola gramática                                           | E2 · El empate se declara                                          | E3 · Clímax: la neutralidad                                                 |
| ------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| **Mensaje**                          | una gramática visual para N plataformas                           | la incertidumbre se muestra, no se esconde                         | reordenar las plataformas no cambia ni un byte del resultado                |
| **Gramática**                        | G3 (entrada, sin secuestrar el scroll)                            | G3                                                                 | G2 (estados) + el único loop ambiental                                      |
| **Técnica**                          | dibujar el trazo (§ 2)                                            | alzar y asentar con stagger jerárquico (§ 2)                       | máquina de estados + transición (§ 3), tres vueltas al entrar               |
| **Cómo el motion cuenta el mensaje** | el MISMO trazo se dibuja tres veces: es una forma repetida        | las barras se asientan dentro de la misma franja del empate        | lo que se mueve son las plataformas; la huella se queda quieta              |
| **Assets + origen**                  | SVG abstracto de bandas, generado por el script (no imita la app) | totales reales de la demo (`atenderDemo`, pesos del autor)         | nombres y huella reales de la demo (la misma de `out-demo/manifiesto.json`) |
| **Peso estimado**                    | ≈ 2 KB                                                            | ≈ 1 KB                                                             | ≈ 1,5 KB (+ ≈ 2 KB de script para las tres escenas)                         |
| **Propiedades**                      | `stroke-dashoffset` (excepción) · `transform`                     | `transform` (`scaleX`, `translateY`) · `opacity` solo en la franja | `transform` (`translateX`); la huella jamás se anima                        |
| **Reduced-motion**                   | los tres mapas ya dibujados, quietos                              | barras en su total, franja y rótulo visibles                       | dos órdenes apilados, cada uno con su huella, idénticas, y «✓ Misma huella» |

## Cierre

- **Clímax explícito:** E3, la neutralidad verificable (regla dura 5). Escena propia, texto visible, jamás en un acordeón.
- **Ritmo:** E1 y E2 respiran (cortas, un disparo cada una); E3 es la única que se repite; después las tarjetas de «Qué
  hace» y los detalles finos bajan la voz (sin coreografía propia, solo la entrada del molde).
- **Cuadre de mensajes 3/3:** gramática → atlas (tarjeta 1) · empate → comparar y robustez (tarjeta 2) · neutralidad →
  principio del núcleo, demostrado en la demo pública. Agrupar sí, omitir jamás.
- **Verificación:** `tests/e2e/brochure.spec.ts` carga la pieza con y sin movimiento: con movimiento, el clímax cambia el
  orden y la huella no cambia; con `reducedMotion: "reduce"`, cada escena se ve completa (opacidad y tamaño reales) y nada
  se mueve. `tests/unit/brochure-html.test.ts` exige que cada escena traiga los ocho campos y que el clímax sea uno solo.
