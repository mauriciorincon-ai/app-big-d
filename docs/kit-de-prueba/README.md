# Kit de prueba · Test kit — Big-D

Archivos para probar lo que la app no muestra sola. Los usa la guía de prueba (`docs/GUIA-DE-PRUEBA.html`,
bloque F) y los vigila `tests/unit/kit-de-prueba.test.ts`: si el esquema, el contrato o el dibujo cambian, la prueba
avisa antes de que el kit te falle. Todo es ficticio: la «Plataforma Norte» no existe y sus fuentes están en un
dominio reservado que nunca resuelve (`ejemplo.invalid` en la propuesta de muestra, `example.org` en la base
incompleta).

*Files to test what the app does not show on its own. The test guide (block F) uses them and
`tests/unit/kit-de-prueba.test.ts` keeps them valid. Everything is fictional: “North Platform” does not exist and
its sources live on reserved domains that never resolve (`ejemplo.invalid` in the sample proposal, `example.org`
in the incomplete base).*

## 1. Propuesta de muestra · Sample proposal (`propuesta-de-muestra/`)

Una propuesta del investigador ya verificada, como la dejaría `/investigar`, pero sin correr la IA: 28 afirmaciones,
**26 con la cita verificada**, **1 que el código no pudo verificar** (la página casi no trae texto) y **1 rechazada
por el código** (la cita no aparece en la página). Sirve para recorrer la pantalla de revisión.

En una terminal abierta en la carpeta del proyecto:

```sh
cp -R docs/kit-de-prueba/propuesta-de-muestra/. .
pnpm build && pnpm start
```

Abre `http://localhost:3000/es/investigador/plataforma-norte`. Al terminar, **deja el proyecto como estaba** con
el comando de la sección 4.

No corras el comando de aprobación con esta muestra: escribiría un mapa aprobado de una plataforma que no existe.
Si lo corres por error, borra también `data/mapas/plataforma-norte.mapa.yaml` y
`data/revisiones/plataforma-norte.jsonl`.

*An already-checked researcher proposal, as `/investigar` would leave it, without running the AI: 28 claims,
26 verified, 1 the code could not check and 1 rejected by the code. Copy it with the first command, build, open
`/en/investigador/plataforma-norte`, and clean up with the command in section 4 when you are done. Do not run the
approval command with this sample.*

## 2. Base incompleta · Incomplete base (`base-incompleta/`)

Un mapa aprobado de la misma plataforma ficticia al que le falta la fecha de verificación de un componente
(«tablero»). La regla: **una base incompleta no se completa por inferencia; falla al cargar** y dice qué falta y
dónde.

```sh
cp -R docs/kit-de-prueba/base-incompleta/. .
pnpm build
```

Resultado esperado: el build se detiene con
`data/mapas/plataforma-norte.mapa.yaml · V3 · /nodos/9/fecha_verificacion · tablero · falta el campo «fecha_verificacion»`.
Después, el comando de la sección 4.

*An approved map of the same fictional platform with one component missing its verification date. The build must
stop and name the file, the rule, the field and the id. Clean up with the command in section 4.*

## 3. El mapa de ejemplo y las carnadas · The example map and the bait maps

- `data/mapas/plataforma-ejemplo.mapa.yaml`: la Plataforma Ejemplo publicada en el atlas (generada del ejemplo del
  contrato; no se edita a mano). *The Example Platform shown in the atlas.*
- `packages/diagramador/carnadas/`: 26 mapas y gramáticas con un defecto a propósito que el diagramador debe atrapar
  (C01–C21 y GC1–GC5), cada uno con la regla que lo nombra, y 3 de aceptación (A1–A3) que deben pasar
  (`esperado.json`: 31 casos, con los dos mapas reales); y `packages/diagramador/test/carnadas-piloto/`, las que
  nacieron en este piloto (P1–P3). Corren solas en `pnpm test`. *26 deliberately broken maps and grammars the
  diagramador must catch, with the rule that names each, plus 3 that must be accepted; they run in `pnpm test`.*

## 4. Al terminar · When you are done

Un solo comando deja el proyecto como estaba, uses la muestra, la base incompleta o las dos (sin error si alguna
no estaba):

```sh
rm -rf data/plataformas/plataforma-norte.yaml data/mapas/plataforma-norte.mapa.yaml data/revisiones/plataforma-norte.jsonl propuestas/2026-09-27-plataforma-norte
```

*One command puts the project back as it was, whichever part you used.*

## 5. Cómo se regenera la muestra · How the sample is rebuilt

La propuesta de muestra no se edita a mano: sale de la misma muestra que usan las pruebas del investigador, con la
verificación de citas hecha por el código real (páginas en disco, sin red, fecha fija). Si cambia el esquema o el
mapa de ejemplo:

```sh
node scripts/kit-de-prueba/generar.mjs
```

`tests/unit/kit-de-prueba.test.ts` regenera en una carpeta temporal y compara byte a byte con lo que está aquí.

*The sample is generated, never hand-edited: `node scripts/kit-de-prueba/generar.mjs` rebuilds it, and the kit
test checks that regenerating gives the same bytes.*
