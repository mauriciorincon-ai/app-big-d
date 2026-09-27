---
name: investigar
description: Propone (jamás aprueba) el mapa de una plataforma de datos del atlas de Big-D, o de una de sus capas, con una cita textual comprobable por afirmación. Solo la invoca una persona.
disable-model-invocation: true
argument-hint: <plataforma> [capa]
context: fork
agent: investigador
---

# /investigar $ARGUMENTS

Investiga la plataforma (y la capa, si viene) de: **$ARGUMENTS**. El primer argumento es el id de
`data/plataformas/<id>.yaml`; el segundo, opcional, el id de una banda de la gramática.

## 1. Lee antes de buscar
- `data/plataformas/<id>.yaml` — nombre y estado de la plataforma.
- `data/gramaticas/plataformas-datos.gramatica.yaml` — bandas (capas y transversales) con su pregunta,
  tipos de componente, modos de flujo, escala de madurez, vigencia y **límites** (bloques mínimos y
  máximos, frases de líder, componentes por banda).
- `data/mapas/<id>.mapa.yaml` si existe — el mapa aprobado vigente: tu propuesta parte de él y solo
  cambia lo que la documentación de hoy respalda.
- `data/mapas/plataforma-ejemplo.mapa.yaml` — un mapa completo y válido: copia su forma.
- `src/lib/investigador/esquema.ts` — el esquema exacto de la propuesta.

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
  "mapa": { "…": "un mapa COMPLETO del contrato 0.3.0: estado \"propuesta\", sujeto_id = <id>, sujeto_nombre = el nombre de data/plataformas en es y en, version \"0.0.0\", fecha_actualizacion de hoy; cada nodo con fuentes (url, titulo {es,en}, fecha de hoy, tipo) y fecha_verificacion de hoy" },
  "afirmaciones": [
    {
      "id": "A-1",
      "sobre": { "entidad": "nodo", "id": "<id del nodo>" },
      "enunciado": { "es": "…", "en": "…" },
      "cita": { "url": "https://…", "texto": "<pasaje LITERAL de la página>", "titulo": "<título de la página>", "tipo": "oficial", "conflicto_de_interes": { "es": "…", "en": "…" } }
    }
  ],
  "preguntas_guia": [ { "pregunta": { "es": "…", "en": "…" }, "respondida": true } ],
  "sin_novedades": false
}
```

- **Una afirmación por cada nodo y por cada flujo** del mapa (al menos). La URL de la cita de un nodo es
  una de sus `fuentes`; la de un flujo, una fuente de su origen o de su destino.
- Rechazar una afirmación saca del mapa lo que afirma: una afirmación por idea, no una por párrafo.
- Respeta los límites de la gramática; agrupa en bloques (el nivel 1 del atlas) los componentes de una capa.
- Un recorrido de referencia (de una fuente a un tablero y a un agente) si la documentación lo permite.
- `sin_novedades: true` solo si nada cambió respecto del mapa aprobado.

## 4. Valida y verifica (código, no opinión)
1. `node scripts/investigar/validar.mjs propuestas/<carpeta>` — corrige lo que diga; hasta 2 reintentos
   (anótalos en `ejecucion.reintentos`).
2. `node scripts/verificar-citas.mjs propuestas/<carpeta>` — baja cada página con curl y busca la cita.
   Una cita «no-encontrada» casi siempre es un pasaje no literal: vuelve a abrir la página, cópialo
   exacto, o retira la afirmación. Vuelve a validar y a verificar.

## 5. Informa
Termina con un resumen corto: cuántos componentes, flujos y afirmaciones; cuántas citas verificadas, no
verificables (revisión humana) y no encontradas; qué preguntas guía quedaron sin fuente; y que la
aprobación la hace una persona en la pantalla del investigador (`/es/investigador/<plataforma>`).
