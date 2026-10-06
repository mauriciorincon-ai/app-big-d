---
name: investigar
description: Propone (jamás aprueba) el mapa de una plataforma de datos del atlas de Big-D, o de una de sus capas, o sus evidencias por criterio, con una cita textual comprobable por afirmación. Solo la invoca una persona.
disable-model-invocation: true
argument-hint: <plataforma> [capa | evidencias]
context: fork
agent: investigador
---

# /investigar $ARGUMENTS

Investiga la plataforma (y la capa, si viene) de: **$ARGUMENTS**. El primer argumento es el id de
`data/plataformas/<id>.yaml`; el segundo, opcional, el id de una banda de la gramática. **Si el segundo es
`evidencias`, no propones un mapa: sigue el «Modo evidencias» del final** (los pasos 1-bis, 2 y 4 valen igual).

## 1. Lee antes de buscar
- `data/plataformas/<id>.yaml` — nombre y estado de la plataforma.
- `data/gramaticas/plataformas-datos.gramatica.yaml` — bandas (capas y transversales) con su pregunta,
  tipos de componente, modos de flujo, escala de madurez, vigencia y **límites** (bloques mínimos y
  máximos, frases de líder, componentes por banda).
- `data/mapas/<id>.mapa.yaml` si existe — el mapa aprobado vigente: tu propuesta parte de él y solo
  cambia lo que la documentación de hoy respalda.
- `data/mapas/plataforma-ejemplo.mapa.yaml` — un mapa completo y válido: copia su forma.
- `src/lib/investigador/esquema.ts` — el esquema exacto de la propuesta.

Solo lees `data/`, `propuestas/`, `src/lib/investigador/` y esta skill; con Glob y Grep, di siempre la
carpeta (`path`). Solo escribes `propuestas/<carpeta>/propuesta.json`: la verificación, el registro de
fuentes y el contador de reintentos los escribe el código, y los hooks bloquean lo demás.

## 1-bis. Si ya hay una propuesta sin aprobar, retómala
Si en `propuestas/` hay una carpeta de esta plataforma (y capa) cuya propuesta **no pasó** la validación
—o que todavía nadie aprobó (no aparece en `data/revisiones/<id>.jsonl`)— **parte de ella**: vuelve a
validar, corrige solo lo que el validador diga y vuelve a verificar. No rehagas la investigación si la
fuente de cada afirmación sigue en pie. Escribe en la carpeta de hoy (si es la misma, se reemplaza).

## 2. Investiga
Con WebSearch y WebFetch, solo documentación pública (ver tus reglas). Para cada componente o flujo que
vayas a proponer, abre con WebFetch la página que lo respalda y copia el pasaje literal.

## 3. Escribe la propuesta
En `propuestas/<AAAA-MM-DD>-<plataforma>[-<capa>]/propuesta.json` (fecha de hoy):

```json
{
  "version": 1,
  "plataforma": "<id>",
  "fecha": "AAAA-MM-DD",
  "ejecucion": { "herramienta": "claude-code", "modelo": "<el modelo de esta sesión>", "reintentos": 0 },
  "mapa": { "…": "un mapa COMPLETO del contrato 0.6.0 (la versión de packages/diagramador/CONTRATO.lock): estado \"propuesta\", sujeto_id = <id>, sujeto_nombre = el nombre de data/plataformas en es y en, version \"0.0.0\", fecha_actualizacion de hoy; cada nodo con fuentes (url, titulo {es,en}, fecha de hoy, tipo) y fecha_verificacion de hoy" },
  "afirmaciones": [
    {
      "id": "A-1",
      "sobre": { "entidad": "nodo", "id": "<id del nodo>" },
      "enunciado": { "es": "…", "en": "…" },
      "cita": { "url": "https://…", "texto": "<pasaje LITERAL de la página>", "titulo": "<título de la página>", "tipo": "oficial", "conflicto_de_interes": { "es": "…", "en": "…" } }
    }
  ],
  "retiros": [
    {
      "id": "R-1",
      "sobre": { "entidad": "nodo", "id": "<id que el mapa aprobado tiene y tu propuesta ya no>" },
      "motivo": { "es": "<qué pasó: lo retiró el fabricante, se fusionó en otro, lo reemplazó…>", "en": "…" },
      "cita": { "url": "https://…", "texto": "<pasaje LITERAL que lo prueba>", "titulo": "…", "tipo": "oficial", "conflicto_de_interes": { "es": "…", "en": "…" } }
    }
  ],
  "preguntas_guia": [ { "pregunta": { "es": "…", "en": "…" }, "respondida": true } ],
  "sin_novedades": false
}
```

- **Una afirmación por cada nodo y por cada flujo** del mapa (al menos), también con `sin_novedades: true`.
  La URL de la cita de un nodo es una de sus `fuentes`; la de un flujo, una fuente de su origen o de su
  destino. La cita tiene **al menos 40 caracteres**: un pasaje corto aparece en cualquier página.
- Rechazar una afirmación saca del mapa lo que afirma: una afirmación por idea, no una por párrafo.
- Los nombres técnicos que el sector usa en inglés («data lake», «lakehouse») van en inglés también en el texto en
  español, y se explican en el glosario. «Lago de datos» o «casa del lago» hacen fallar la validación.
- Respeta los límites de la gramática; agrupa en bloques (el nivel 1 del atlas) los componentes de una capa.
- Un recorrido de referencia (de una fuente a un tablero y a un agente) si la documentación lo permite.
- `sin_novedades: true` solo si nada cambió respecto del mapa aprobado.
- Lo que el mapa aprobado tiene y tu propuesta ya no trae se **retira**, y **nada sale sin su argumento**:
  por cada componente que sale, y por cada flujo que sale con sus dos extremos todavía en el mapa, un
  `retiros[]` con su `motivo` (es y en: qué pasó) y una cita **oficial** del fabricante que lo pruebe (una
  nota de versión, un anuncio de retiro, la página que dice dónde quedó). El código verifica esa cita como
  cualquier otra. Un flujo que sale porque sale uno de sus extremos no lo necesita: ese argumento lo da el
  código. **Si no encuentras la prueba, no lo retires**: déjalo en el mapa y, si dudas de que siga, ponlo
  como pregunta guía. Sin mapa aprobado (la primera propuesta), `retiros` va vacío.
- La madurez de un componente sale de una cita que la diga. Si no la encuentras, no la heredes del mapa aprobado:
  propón la madurez que la cita prueba y deja la duda como pregunta guía.

## 4. Valida y verifica (código, no opinión)
1. `node scripts/investigar/validar.mjs propuestas/<carpeta>` — corrige lo que diga; hasta 2 reintentos
   (anótalos en `ejecucion.reintentos`; la pantalla los muestra y, aparte, los bloqueos que contó el hook de
   fin). Además del
   esquema y de las reglas del contrato, el validador **dibuja** (V16) el nivel 1, el nivel 2, cada recorrido,
   la ventana de cada bloque y la fila del lado a lado (contraída y desplegada), en cuatro edades: hoy, el día en
   que pasa a «por revisar», el día en que vence y +100 días. Una falla
   `dibujo · …` es un texto que no cabe (una palabra más ancha que el bloque, un nombre de más líneas de
   las que tiene la ficha). Se corrige con un nombre más corto que diga lo mismo, en los dos idiomas; jamás
   quitando el componente.
2. `node scripts/verificar-citas.mjs propuestas/<carpeta>` — baja cada página con curl y busca la cita
   (la de cada afirmación y la de cada retiro). Un retiro cuya cita no aparece queda sin argumento y la
   propuesta no se puede aprobar.
   Una cita «no-encontrada» casi siempre es un pasaje no literal: vuelve a abrir la página, cópialo
   exacto, o retira la afirmación. Vuelve a validar y a verificar.

## Modo evidencias: `/investigar <plataforma> evidencias`
Propones **una evidencia por criterio** de la base para la plataforma: los 6 criterios de capacidad y los 5
transversales de `data/criterios/`. Cada una con su puntaje de 0 a 4 contra el ancla de la escala, y una cita literal
por fuente. Una persona la aprueba evidencia por evidencia; el código comprueba la cita, no tu puntaje: el puntaje lo
juzga ella, así que la justificación tiene que convencer con hechos de la cita.

Lee, además de lo del paso 1:
- `data/criterios/` y `data/capacidades/` — qué evalúa cada criterio y las preguntas guía de cada capacidad.
- `data/escalas/esc-evidencia.yaml` — el ancla de cada nivel (0 a 4) y la tabla de topes por madurez.
- `data/evidencias/<id>/` si existe — las evidencias aprobadas: tu propuesta parte de ellas.
- `data/mapas/<id>.mapa.yaml` — los componentes que respaldan cada evidencia: `componentes` lleva sus **ids**
  (la pantalla lee el nombre del mapa en cada idioma); el validador rechaza un id que el mapa no tiene.
- `src/lib/investigador/evidencias.ts` y `src/lib/datos/conocimiento.ts` — el esquema exacto.

Escribe en `propuestas/<AAAA-MM-DD>-<plataforma>-evidencias/propuesta.json`:

```json
{
  "version": 1,
  "tipo": "evidencias",
  "plataforma": "<id>",
  "fecha": "AAAA-MM-DD",
  "origen": "agente-investigador",
  "ejecucion": { "herramienta": "claude-code", "modelo": "<el modelo de esta sesión>", "reintentos": 0 },
  "evidencias": [
    {
      "id": "A-1",
      "evidencia": {
        "id": "evi-<plataforma>-<criterio sin el prefijo crit->",
        "plataforma_id": "<id>",
        "capacidad_id": "cap-…",
        "afirmacion": { "es": "…", "en": "…" },
        "componentes": ["<id de un componente del mapa aprobado>"],
        "madurez": "<id de la escala de madurez de la gramática>",
        "puntaje": 3,
        "justificacion_puntaje": { "es": "3 y no 4: … 3 y no 2: …", "en": "3, not 4: … 3, not 2: …" },
        "esencial": true,
        "fuentes": [
          { "url": "https://…", "titulo": "<título de la página>", "tipo": "oficial", "fecha_publicacion": "AAAA-MM-DD", "conflicto_de_interes": "propio-fabricante", "cita": "<pasaje LITERAL de la página>" }
        ],
        "limitaciones": [{ "es": "…", "en": "…" }]
      }
    }
  ],
  "preguntas_guia": [ { "pregunta": { "es": "…", "en": "…" }, "respondida": true } ]
}
```

- **Capacidad o criterio, exactamente uno:** un criterio de tipo capacidad se evalúa con `capacidad_id` (su
  capacidad); uno transversal (costo, dependencia, habilidades, ecosistema, cumplimiento), con `criterio_id`.
- **El puntaje es de la función**, contra el ancla de la escala; la justificación dice por qué ese nivel y no el de al
  lado, por los dos lados si los hay. El tope por madurez lo aplica el motor: una función en vista previa se puntúa
  por lo que hace y su madurez lo dice; no bajes el puntaje por eso.
- **La madurez sale de una cita que la diga.** Si no la encuentras, no la adivines: pregunta guía.
- `conflicto_de_interes`, por fuente: `propio-fabricante` (la documentación del fabricante) · `fabricante-competidor` ·
  `socio-comercial` · `resena-incentivada` · `independiente`. Prefiere la documentación oficial.
- `fecha_publicacion` solo si la página la dice; `limitaciones`, solo las documentadas.
- `esencial: true` en la evidencia que manda en su criterio (con una por criterio, todas).
- **Si la documentación no permite puntuar un criterio, no lo inventes:** déjalo fuera y ponlo como pregunta guía sin
  respuesta.
- Valida y verifica con los mismos dos comandos del paso 4: el validador revisa los ids, los criterios, la madurez, el
  vocabulario y las celdas; el verificador baja la página de cada fuente.

## 5. Informa
Termina con un resumen corto: cuántos componentes, flujos y afirmaciones (o, en modo evidencias, cuántas evidencias
y sus puntajes); qué sale del mapa y por qué; cuántas citas verificadas, no
verificables (revisión humana) y no encontradas; qué preguntas guía quedaron sin fuente; y que la
aprobación la hace una persona en la pantalla del investigador (`/es/investigador/<plataforma>`).
