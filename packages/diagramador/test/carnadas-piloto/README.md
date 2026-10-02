# Carnadas del piloto (propuestas para el contrato)

Carnadas que nacieron en el piloto (Big-D, S1) y **todavía no son del contrato**: viajan a la planeadora
en «Enmiendas al contrato del diagramador» del summary, con su regla y su falla. Mientras tanto, las
pruebas del paquete las corren igual que a las del contrato (`test/densidad.test.ts`).

| Carnada | Qué reproduce | Con el motor de la v0.3.0 | Ahora |
|---|---|---|---|
| `P1-mapa-denso.mapa.json` | La **forma** del primer mapa real del piloto (19 componentes, 19 flujos, 7 bloques, 3 saltos en el nivel 1 y 4 en el nivel 2, 7 pistas en un canal, 3 referencias largas en una fila de franja, un recorrido con rama paralela), con nombres neutrales de largo parecido y los textos del mapa de ejemplo del contrato | 4 avisos: carril exprés con más de 2 saltos · «canal 2: más de 6 pistas» · dos etiquetas encimadas · una referencia fuera del lienzo; y en el nivel 1 una etiqueta de salto a 202 u de su línea | 0 avisos, D11 = 0, cada etiqueta sobre su trazo |

| `P2-paso-que-se-sigue.mapa.json` | El mapa de ejemplo con un paso del recorrido que se sigue a sí mismo (`sigue_de` = su propio id) | validaba sin errores, y `layout(…, "recorrido")` y `toText` se quedaban sin memoria, sin regla ni id (G14) | exactamente un **V5** en `admision-paciente/px` («… que no está antes en la lista»); la numeración lanza un error con el recorrido y el paso (auditoría del S1, A-5) |
| `P3-paso-que-sigue-a-uno-posterior.mapa.json` | El mapa de ejemplo con dos pasos en orden invertido: p7 (sigue a p6) va antes que p6 | validaba sin errores y numeraba mal (dos «1», un 6b sin 6a) | exactamente un **V5** en `admision-paciente/p7` (A-5) |

P1 es un mapa **válido para publicar** (la prueba lo exige): no mide la validación, mide el dibujo. P2 y P3
miden la validación: cada una debe fallar por su regla, con su id (`test/recorrido-orden.test.ts`). Ninguna lleva
nombres de plataformas ni de fabricantes (G3).
