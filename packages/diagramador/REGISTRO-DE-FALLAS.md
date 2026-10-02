# Registro de fallas — diagramador

> Toda falla del diagramador encontrada en cualquier app (gate ⭐, auditoría, revisión experta,
> producción) entra aquí en el `/cierre-sprint` del sprint que la encontró. Cada entrada lleva la
> **regla nueva** que la previene y la **carnada o prueba** que la detectaría si volviera. Una falla
> sin carnada puede volver sin que nada la vea.

## Cómo se registra

| Campo | Qué va |
|---|---|
| `F-NNN` | Número correlativo |
| Fecha · app · sprint | Dónde apareció |
| Síntoma | Qué vio quien la encontró, en sus palabras |
| Causa | Por qué ocurrió: en el dato, en la regla o en la implementación |
| Regla nueva | La garantía, regla de dibujo o validación que se agrega o corrige en el CONTRATO |
| Carnada / prueba | Qué la detecta de ahora en adelante |
| Versión que la cierra | Versión del contrato que incorpora la regla |
| Estado | `abierta` · `cerrada` · `aceptada` (se convive con ella, con razón) |

## Fallas

Las primeras cinco aparecieron en el **spike de la F1** (2026-09-26), antes de cualquier
implementación: es el momento barato de encontrarlas. Evidencia:
`portafolio/big-d/investigacion/spike-diagramador/README.md`. Las siguientes siete aparecieron en la
**Etapa de Diseño del piloto** (2026-09-26 → 27, `app-big-d/docs/diseno/diagramador-tokens.md` y la
auditoría de la etapa) y en el registro de la gramática de **planlang** (2026-09-26): también antes de
la implementación.

| # | Fecha · app · sprint | Síntoma | Causa | Regla nueva | Carnada / prueba | Versión | Estado |
|---|---|---|---|---|---|---|---|
| F-001 | 2026-09-26 · big-d · spike F1 | El mapa real no pasaba su propia validación: «catálogo» en el texto de líder de un flujo quedaba sin explicar | En v0.1.0 solo los nodos tenían `terminos`; flujos, bloques y pasos no tenían dónde explicar un término | **Glosario del mapa** (`glosario`): V9 consulta los términos del nodo más el glosario; el renderizador muestra la explicación donde el término aparece | C12 (debe alertar) + el mapa real (debe aceptarse sin alertas) | 0.2.0 | cerrada |
| F-002 | 2026-09-26 · big-d · spike F1 | La prueba de 380 px pasaba (sin desplazamiento horizontal) con el título **recortado** dentro del SVG | «Sin desplazamiento horizontal» mide la página, no el dibujo: el SVG recorta su propio texto sin ensanchar la página | **G11 ampliada:** ningún texto sale del lienzo; se mide con `getBBox` en el navegador | prueba «texto fuera del lienzo» (nació en rojo: 1 en los tres navegadores) | 0.2.0 | regla cerrada · la referencia del G-Diseño midió 0 · implementación del piloto |
| F-003 | 2026-09-26 · big-d · spike F1 | Un flujo que salta columnas pasa **por debajo** de los nodos intermedios y parece salir de otro nodo | La ruta ortogonal ingenua baja a la altura del destino sin evitar cajas | **D11:** ningún tramo de un flujo atraviesa la caja de un nodo que no es su origen ni su destino | prueba geométrica de cruces = 0 (nació en rojo: 9 / 5 / 2 cruces en la rejilla; 0 en ELK; **0 en la referencia del G-Diseño con carril exprés y canales**) | 0.2.0 | regla cerrada · el piloto la implementa |
| F-004 | 2026-09-26 · big-d · spike F1 | En las franjas transversales la pregunta de la banda queda **encima** de los nodos | El encabezado de la franja no reserva altura para la pregunta | **D2 precisada:** toda banda reserva un encabezado de altura fija para nombre y pregunta, también las franjas | prueba «texto encima de un nodo» = 0 (nació en rojo: 2) | 0.2.0 | regla cerrada · la referencia midió 0 · implementación del piloto |
| F-005 | 2026-09-26 · big-d · spike F1 | El contrato v0.1.0 exigía `bloque_id` en todo nodo: con 9 bandas y 5 a 8 bloques (RF-11.1) es imposible | Contradicción heredada de la especificación: bandas > bloques permitidos | **Bloque opcional anclado a una banda;** una banda sin bloque muestra «N componentes» en la visión general | C15 (nodo con un bloque de otra banda) + el mapa real con 2 bandas sin bloque | 0.2.0 | cerrada |
| F-006 | 2026-09-26 · big-d · Etapa de Diseño (mirada 1) | Los símbolos de estado y madurez (✓ ✕ ▶ β) se veían distintos entre navegadores; el byte a byte no podía cumplirse | Ninguna fuente candidata trae esos caracteres y el subconjunto latino los excluye: caen a la fuente del sistema, cuyo ancho cambia por navegador (rompe G15 y G1) | **D13: toda marca es un path**; `nivel_madurez.glifo` (texto) se reemplaza por `nivel` (medidor); **V15:** todo carácter de todo texto está en la cobertura de la tabla de métricas | C19 (un «✓» dentro de un nombre debe fallar por V15) + gate de vocabulario del piloto (todo carácter visible existe en la fuente) | 0.3.0 | cerrada |
| F-007 | 2026-09-26 · big-d · Etapa de Diseño (mirada 1, ronda 1) | «Visualmente horrible; el diagrama no lo quiero vertical sino horizontal y con desplazamiento lateral»: en el teléfono el mapa transpuesto dejaba de parecerse al de escritorio | D1/G11 preveían una disposición angosta transpuesta; el usuario rechazó que el mismo mapa cambiara de forma según el ancho | **G11 y D1 reescritas:** una sola disposición horizontal a escala 1, piso de 12 px sin escalar, lienzo deslizable con índice, sombras y pista; la página jamás desborda | e2e a 380 px del piloto (página sin desborde + desplazamiento propio del contenedor + textos dentro) en 3 navegadores y 2 idiomas | 0.3.0 | cerrada |
| F-008 | 2026-09-26 · big-d · Etapa de Diseño (ronda 1 → 2) | Con los flujos hacia las franjas dibujados como líneas, el carril exprés necesitaba 6 pistas y el canal junto a Gobierno 5: «una maraña» para un líder | Las franjas abarcan todas las columnas: cada línea hacia ellas cruza canales ya ocupados | **D15: los flujos con una franja son referencias**, no líneas, en los niveles 1 y 2 (§ 4.1, § 4.2) | prueba: toda referencia del SVG aparece en la lectura en texto (G10) y el carril exprés del mapa de ejemplo usa 2 pistas | 0.3.0 | cerrada |
| F-009 | 2026-09-26 · big-d · Etapa de Diseño (§ 6.2 de la propuesta) | A 12 px el círculo, el hexágono y el pentágono se confundían: difieren en pocos píxeles de borde | Tres glifos redondeados en el mismo tamaño | **Enum de glifos:** salen `hexagono` y `pentagono`; entran `escudo` (gobierno) y `barras` (operación), distintos por forma | capturas de la leyenda a 12 px en escala de grises (gate ⭐ del piloto) | 0.3.0 | cerrada |
| F-010 | 2026-09-26 · big-d · Etapa de Diseño (lado a lado) | Una página con varios lienzos (lado a lado, comparación) repetía los ids de `<defs>` de glifos y marcadores; el navegador usa el primero que encuentra | D8 derivaba los ids solo del modelo, no del documento | **D8 precisada:** los ids de `<defs>` llevan un espacio de nombres por SVG | prueba: una página con dos SVG del motor no tiene ids duplicados (axe `duplicate-id`) | 0.3.0 | cerrada |
| F-011 | 2026-09-26 · big-d · Etapa de Diseño (ronda 1 → dirección B) | Con el relleno tintado por tipo, el contraste del texto dependía del matiz y el tema claro no llegaba a 4,5:1 en varios tipos | El texto se pintaba sobre el color del tipo | **D14: tarjeta + filete + glifo, texto siempre en tinta**; los 16 tokens `tipo-N-tinte` se eliminan | prueba de contraste de tokens del piloto (texto ≥ 4,5:1 sobre la tarjeta en ambos temas) | 0.3.0 | cerrada |
| F-012 | 2026-09-26 · planlang · registro de `agentes-ia` v1.0.0 | Un flujo `condicional` sin señal, operador ni valor pasaba la validación: la condición vivía como prosa en `que_viaja` | El esquema 0.2.0 no distinguía el contenido de `que_viaja` | **`condicion { senal, operador, valor }`** en el flujo y **V13:** el modo que declara `exige_condicion` la exige. De paso, la gramática registrada tenía el id `pausa_humana`, que el patrón de ids no admite: **una gramática se valida al registrarse** | C20 (flujo condicional sin condición sobre `agente-ejemplo`) + validación Ajv de toda gramática al entrar al contrato | 0.3.0 | cerrada |
