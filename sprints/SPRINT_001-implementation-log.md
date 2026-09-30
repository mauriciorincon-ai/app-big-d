---
sprint: 001
app: big-d
feature: atlas-de-fabric
branch: sprint-001/atlas-de-fabric
orden: portafolio/big-d/ordenes/SPRINT_001-orden.md (planeadora, G-Plan 2026-09-27)
plan: aprobado 2026-09-27 · «construye» 2026-09-27
---

# Sprint 001 — bitácora de implementación (Big-D · «Atlas de Fabric»)

## Plan aprobado (resumen)

Cinco fases con parada al final de cada una (espera «continúa»):

| Fase | Qué | Parada humana |
| ---- | --- | ------------- |
| 0 | Setup, constitución, A-04, contrato v0.3.0 copiado con lock, fuentes/tokens/tema/i18n, lints G2/G3/«planea, no opera», 5 ADRs | «continúa» + el usuario abre `/diseno/` en el preview |
| 1 | `packages/diagramador/` (validate, layout, toSVG, toText, diff), 31/31 carnadas, D11 = 0, golden files, job `diagramador` | «continúa» |
| 2 | Atlas nivel 1 de la Plataforma Ejemplo en producto | **Parada A**: gate de FIDELIDAD (indiferible) + mirada de FORMA del selector y la nota de marcas |
| 3 | Nivel 2, recorrido, selector, investigador, Fabric | **Parada B**: revisión de Fabric afirmación por afirmación |
| 4 | e2e en tres navegadores, deuda, guía, manual, design-sync, `/audita-sprint`, `/deploy-check`, summary | aprobación de la fase 2 de la auditoría |

Decisiones D-S1-01 a D-S1-14 y la tabla de contradicciones: en el plan aprobado, copiadas en
«Desviación del plan» al final de esta bitácora.

## Fase 0 — Setup, constitución, A-04 y contrato (2026-09-27)

### Verificación de supuestos del kit

| # | Supuesto | Resultado |
| - | -------- | --------- |
| K1 | `githooks/pre-commit` ejecutable y `core.hooksPath = githooks` | ✓ 100755 · `githooks` |
| K2 | scripts `typecheck · lint · test · test:e2e · prepare · start · build` | ✓ (`test` sin `--coverage`: se agrega en esta fase) |
| K3 | `pnpm build` genera `out/` con la maqueta en `out/diseno/` | ✓ (log `copiar-maqueta: … → …/public/diseno`) |
| K4 | `pnpm peers check` limpio | ✓ «No peer dependency issues found» |
| K5 | `ci.yml` con `quality · e2e · lighthouse` | ✓ |
| K6 | Carnada canónica de gitleaks bloqueada en un commit | ✓ «leaks found: 1 · SECRET DETECTADO: commit bloqueado»; HEAD sin cambio; archivo borrado |
| K7 | Cero PRs de dependencias abiertos | ✓ (la API GraphQL de GitHub dio timeout; confirmado por REST) |
| K8 | `:3000` libre para e2e local | ✗ ocupado por otra app de la máquina (no se toca) → `E2E_PUERTO` en `playwright.config.ts`; CI sigue en 3000 |

### A-04 — la maqueta en el preview (diagnóstico y pago)

**Dos causas, las dos confirmadas.**

1. **Local (`pnpm start`).** `serve` aplica URLs limpias por defecto: `/diseno/index.html` → 301 →
   `/diseno` (sin barra). Los `assets/…` relativos resolvían a `/assets/…` y el enlace a `kit.html` a
   `/kit`. La maqueta cargaba sin estilos ni scripts. La evidencia de la fase 0 de la etapa solo miró que
   los archivos existieran en `out/diseno/`, nunca que se sirvieran.
2. **Vercel.** `vercel build` sin conexión (`pnpm dlx vercel@60.1.3 build --yes`, con un
   `.vercel/project.json` escrito a mano e ignorado; sin deploy ni sesión) corre `pnpm run build` —la copia
   sí ocurre— y deja `static/diseno/index.html`. Pero el constructor de Next escribe **overrides** que
   publican cada `diseno/x.html` en la ruta `diseno/x`, sin extensión:
   `diseno/index.html => {"path":"diseno/index"}`. `/diseno/index.html` no existe como ruta, y `/diseno/`
   cae en la regla que quita la barra final (308 a `/diseno`), que tampoco existe. De ahí el 404.

**Pago.**

- `serve.json` (raíz) + `start: serve out -l ${PORT:-3000} --config ../serve.json`: URLs limpias
  solo fuera de `/diseno/**`, y `/diseno` y `/diseno/` redirigen a `/diseno/index.html`. Las rutas de Next
  conservan sus URLs limpias.
- `vercel.json`: las mismas dos redirecciones y la reescritura `/diseno/:pagina.html` → `/diseno/:pagina`.
  Se comprobó sin conexión el orden de las rutas que genera `vercel build`: las redirecciones quedan antes
  de la regla de la barra final (308), y la reescritura después de `filesystem`, con `check: true`.
  **Falta la prueba real: el usuario abre el preview con sesión.**

| Gate | ¿Puede fallar? | Demo en rojo | A quién nombró | Verde |
| ---- | -------------- | ------------ | -------------- | ----- |
| `tests/e2e/maqueta-servida.spec.ts` (4 pruebas: tres entradas + un enlace relativo, fondo = token) | Sí: ningún check pedía `/diseno` | El estado real del repo antes del arreglo: 4/4 rojas | `/diseno/index.html` terminaba en `…/diseno`; `kit.html` en `…/kit` | ✓ 4/4 con `serve.json`; suite e2e 10/10 (móvil y escritorio) |

### Constitución y deltas del kit

- `CLAUDE.md` = `ordenes/CLAUDE-md-para-app.md` de la planeadora (sección IA: **solo skills de Claude
  Code**, sin adaptador de proveedores) + los deltas de `kit-app/CLAUDE.md` v1.32.0 que ese archivo no
  traía: dos clases de mirada (regla 10), `gh pr checks` tras cada push y métrica `manual` (regla 15),
  «preview del PR #N» (regla 17), comprobación mecánica (regla 18) y reglas 21 y 22. Centinelas:
  «SOLO skills de Claude Code» ×1, «IA de construcción por suscripción» ×2, «adapter multi-proveedor» ×0.
- **Líneas viejas que la copia trae y el contrato corrige** (van al summary para la planeadora): la regla
  del diagramador dice «v0.2.0 hoy», «V1–V12», y los patrones de dominio dicen «franjas arriba» y «vista
  angosta 380 px». Manda el CONTRATO v0.3.0 (G1–G7, V1–V15, franjas abajo, sin angosta).
- Del kit v1.32.0: `.claude/commands/{audita-sprint,deploy-check,plan-sprint}.md` y
  `.claude/skills/ia-embebida.md` (el repo no tenía personalizaciones en ellos; los cambios son solo del
  kit) · `scripts/verificar-dependencias.mjs` + paso en `quality` (solo PR; se conservan las versiones de
  acciones de la app) · `tests/unit/controladores-maqueta.test.ts` **junto** a `maqueta-controladores`:
  el del kit exige que todo `src` exista y que una página con controles cargue algún script; el de la
  etapa exige el script **correcto** para cada marcador. Se complementan.
- Higiene: `.vitest/json/output.json` (caché de Vitest 5 colada en el PR #3) fuera del índice y
  `.vitest/` ignorado; `.gitignore` sin la línea de plantilla ni el `out/` repetido; README sin la
  plantilla de `create-next-app` (bilingüe, sin URLs: regla de cero enlaces).

| Gate | ¿Puede fallar? | Demo en rojo | A quién nombró | Verde al revertir |
| ---- | -------------- | ------------ | -------------- | ----------------- |
| `tests/unit/controladores-maqueta.test.ts` (kit) | Sí: una página nueva con controles y sin script | `docs/diseno/zz-carnada-controles.html` con un `<button>` | «zz-carnada-controles.html: 1 control(es) dibujado(s) y ningún script cargado» | ✓ 13/13 al borrarla (y 13/13 el de la etapa) |
| `scripts/verificar-dependencias.mjs` (regla 18) | Sí: un paquete del PR por debajo de `main` | Ref temporal `refs/demo/regla-18` cuyo lockfile trae `react@99.0.0` | «react: 99.0.0 (refs/demo/regla-18) → 19.3.0 (este árbol)», salida 1 | ✓ contra `origin/main`: «653 paquetes, ninguno por debajo»; ref borrada |

### Contrato v0.3.0 copiado, con su lock

- `packages/diagramador/` es paquete del workspace (`pnpm-workspace.yaml` → `packages/*`, `workspace:*`,
  `transpilePackages`). El lockfile ganó su importer en el mismo commit.
- Copia **con `cp`**, nunca con un editor (el hook de prettier cambiaría bytes). Se copiaron
  `CONTRATO.md`, `CHANGELOG.md`, `REGISTRO-DE-FALLAS.md`, `README.md`, `esquema/`, `gramaticas/`,
  `ejemplos/` y `carnadas/` desde `reusables/diagramador/` (planeadora, commit `3bc3bf0`). `metricas/`
  (tabla, cobertura, 2 woff2 y licencias) vino de `docs/diseno/assets/fuentes/`. `.prettierignore` las
  protege.
- **`CONTRATO.lock`**: `version: 0.3.0` + 54 líneas `shasum -a 256`. `CONTRATO.md` =
  `763bde26…d602`, idéntica a la planeadora. `scripts/contrato/{huellas,fijar,verificar}.mjs`:
  `verificar` compara la copia con su origen (la planeadora en local; en CI no existe y lo dice).

| Gate | ¿Puede fallar? | Demo en rojo | A quién nombró | Verde al revertir |
| ---- | -------------- | ------------ | -------------- | ----------------- |
| `tests/unit/contrato-lock.test.ts` (57: versión, cobertura del lock, una huella por archivo, métricas = maqueta) | Sí: cualquier byte cambiado en la copia | Un espacio agregado al final de `gramaticas/plataformas-datos.json` | «gramaticas/plataformas-datos.json coincide byte a byte con su huella»; `verificar.mjs`: «la copia no coincide con CONTRATO.lock» y «DERIVA contra el origen» | ✓ 57/57 al quitarlo |

### Cascarón del producto: fuentes, tokens, tema e idioma

- **Rutas:** layout raíz por idioma `src/app/[idioma]/layout.tsx` (`<html lang>` desde la ruta,
  `dynamicParams = false`, `/es` y `/en` estáticos) + layout raíz de `/` en `src/app/(raiz)/`, la
  portada que ofrece los dos idiomas, cada entrada con su `lang` (*retirada al cierre de la fase por
  veredicto del usuario; ver «Cierre de la fase 0»*). Con dos layouts raíz no hay uno solo
  para el 404: `src/app/global-not-found.tsx` bilingüe, con `experimental.globalNotFound` de Next 16.3
  (documentado como experimental; se declara aquí). Fuera la plantilla de `create-next-app`: `layout`,
  `page`, `favicon.ico` y los SVG de `public/`, incluido **`vercel.svg`, un logo de fabricante**. Ícono
  = el signo de la marca (`src/app/icon.svg`).
- **Fuentes (G15):** `next/font/local` con los woff2 de la maqueta (`display: block` como la maqueta),
  variables `--letra` y `--letra-mono`. El build sirve los dos woff2 con la huella de `metricas.json`
  (`fa5a9a0d…` Space Grotesk, `1fac9f73…` JetBrains Mono).
- **Tokens:** el generador de paleta emite también `src/styles/tokens.css` (misma hoja);
  `globals.css` la importa y la mapea 1:1 al `@theme inline` de Tailwind v4 (design system § 9).
  `src/styles/base.css` porta la base de `bigd.css` (barra, página, pie, saltos).
- **Tema (A-31 pagada):** script en `<head>` que solo aplica una elección guardada; sin elección no hay
  atributo y manda `prefers-color-scheme` (la rama de `tokens.css` que la maqueta nunca ejerció).
  `ConmutadorTema` con `useSyncExternalStore`: el servidor da `null` y los dos botones nacen sin
  marcar; el árbol no cambia, solo `aria-pressed` (regla 5-a). El primer intento usaba `setState` en un
  efecto y el lint de React lo rechazó.
- **Idioma = ruta:** `ConmutadorIdioma` lleva a la misma página en el otro idioma. Diccionario tipado
  `src/lib/i18n/{tipos,es,en}.ts`, redactado en los dos idiomas desde las cadenas de la maqueta.
- **Cobertura:** `test` = `vitest run --coverage`; el paquete entra al alcance con piso 80 %.
  `observability.ts` recibió su test (inerte sin DSN; con DSN, solo tipo y metadatos).
  `lighthouse-urls.json` = `/`, `/es`, `/en`.

| Gate | ¿Puede fallar? | Demo en rojo | A quién nombró | Verde al revertir |
| ---- | -------------- | ------------ | -------------- | ----------------- |
| `tests/unit/i18n.test.ts` (mismas claves, sin vacíos, todo carácter en la cobertura de Space Grotesk) | Sí: un símbolo fuera de la fuente cae a la del sistema | «Saltar al contenido ✓» | «saltarContenido: ✓» | ✓ 4/4 |
| `paleta-diagramador`: la hoja del producto = el generador | Sí: una edición a mano de `src/styles/tokens.css` | `--fondo: #0b0f15` | «la hoja del producto (src/styles/tokens.css) es la misma que genera el generador» | ✓ 47/47 al regenerar |
| e2e `producto-base` — tema sin elección (A-31) | Sí: la maqueta fijaba `data-theme="oscuro"` | `data-theme="oscuro"` fijo en el layout | las dos pruebas «sin elección, manda el sistema» (`Received string: "oscuro"`) | ✓ |
| e2e `producto-base` — fuentes servidas = tabla de métricas (G15) | Sí: servir otra fuente | Space Grotesk apuntada al woff2 de JetBrains Mono | «el sitio sirve las fuentes de la tabla de métricas» (falta la huella `fa5a9a0d…`) | ✓ 34/34 e2e |

### Lints G2, G3 y «planea, no opera + cero IA en runtime»

- **G2** (ESLint, `packages/diagramador/src/**` y `src/engine/**`): `Math` inexacta y `random`, `**`,
  `Date`, `Intl`, `performance`, `crypto.getRandomValues`, `localeCompare`/`toLocale*` y las APIs de
  medición de texto.
- **Reusable** (ESLint, paquete): no importa la app, ni el framework, ni I/O de Node.
- **Planea, no opera** (ESLint en `src/` + test `planea-no-opera`): cero SDK de plataformas de datos o
  de proveedores de modelos, cero dominios de ambos y cero primitivas de red en `src/` y en el paquete.
  Excepción declarada: el SDK de Sentry del kit (inerte sin DSN).
- **G3** (test `g3-neutralidad`): los ids y nombres de las 6 gramáticas, los 6 mapas del contrato, los
  mapas y plataformas de `data/` (cuando existan) y las cuatro plataformas reales no aparecen en el
  código del paquete.

**Hallazgo de la demo:** la regla del reusable **no disparó** en la primera corrida. Los bloques
«reusable» y «no opera» declaraban cada uno `no-restricted-imports` sobre el paquete. En flat config el
último pisa al primero, así que el paquete solo tenía los patrones de «no opera». Se unieron en una sola
regla por alcance; la segunda demo nombró los dos imports. Sin la demo, el gate habría sido decorado.

| Gate | ¿Puede fallar? | Demo en rojo | A quién nombró | Verde al revertir |
| ---- | -------------- | ------------ | -------------- | ----------------- |
| ESLint G2 | Sí | `packages/diagramador/src/zz-carnada-g2.ts` con `Math.cos(1)` | «'Math.cos' is restricted … G2: función inexacta o azar» | ✓ lint limpio |
| ESLint reusable | Sí (tras el arreglo) | `import { textos } from "@/lib/i18n"` + `import OpenAI from "openai"` en el paquete | «'@/lib/i18n' … no importa nada de la app» y «'openai' … Cero IA en runtime» | ✓ |
| ESLint «no opera» en `src/` | Sí | `import OpenAI from "openai"` en `src/lib/zz-carnada-opera.ts` | «'openai' import is restricted … Cero IA en runtime» | ✓ |
| test `planea-no-opera` | Sí | `fetch("https://api.fabric.microsoft.com/v1/workspaces")` en la misma carnada | «fabric.microsoft.com» y «\bfetch\s*\(» en `src/lib/zz-carnada-opera.ts` | ✓ 3/3 |
| test `g3-neutralidad` | Sí | `// Fabric` agregado a `packages/diagramador/src/index.ts` | «packages/diagramador/src/index.ts: «Fabric»» | ✓ 2/2 |

### ADRs por tema (inglés)

`decisions/diagramador-architecture.md` · `decisions/svg-serializer-and-golden-files.md` ·
`decisions/investigator-code-first.md` (*propuesto*: pasa a aceptado cuando la fase 3 llene su columna de
evidencia; la plantilla no admite «código considerado») · `decisions/investigator-7s-compliance.md`
(fuentes leídas el 2026-09-27: la página *Legal and compliance* de Claude Code y los *Consumer Terms*
vigentes desde el 2025-10-08) · `decisions/design-mockup-destination.md` (A-25: la maqueta se sirve en
los deploys privados durante H1, jamás en un build público, y se retira por ADR al cerrar el ciclo).

### No se tocó

- `docs/diseno/README.md`: la plantilla del kit v1.32.0 trae las secciones «Fase 0» y «Tokens de
  reusables» y la fila «Preview donde se aprobó». Aplican a las próximas etapas de diseño; el registro de
  esta etapa, ya cerrada, se conserva tal como quedó («en local; el preview devolvió 404»).

### Cierre de la fase 0

**CI** (`gh pr checks 4` tras cada push; todos con conclusión propia `success`):

| Commit | quality | e2e | lighthouse | Vercel |
| ------ | ------- | --- | ---------- | ------ |
| `d7032f6` | ✓ 53 s (primera corrida del paso «Regla 18») | ✓ 55 s | ✓ 1 min 26 s | ✓ |
| `c7aec37` | ✓ 1 min 4 s | ✓ 1 min 10 s | ✓ 2 min 36 s | ✓ |

**Mirada A-04 (2026-09-27, preview del PR #4, con sesión).** Pregunta: «¿Ya abre la maqueta en el
preview?». Respuesta del usuario: «Excelente enlace abierto sin problemas y es navegable». Delata el
archivo abierto y recorrido: **A-04 cerrada**.

**Veredicto sobre la portada de idiomas (mismo mensaje).** «la entrada español ingles no le veo la razon
deberia tener una capsula arriba y cone so ya cambiar todo». La portada de dos tarjetas era invención de
la fase 0; la maqueta aprobada no la tiene: su único conmutador de idioma es la cápsula `.alterna` de la
barra.

- **D-S1-15 (reemplaza la raíz de D-S1-08).** `/` no es una pantalla: el servidor la redirige (307) a
  `/es`, el idioma de la maqueta y del usuario. La cápsula ES / EN de la barra es el único conmutador y
  lleva a la misma página en el otro idioma. Se decidió redirección de servidor, sin script: cero
  parpadeo y cero JS. Lo que se pierde: la raíz no recuerda si el visitante eligió inglés.
- Cambios: fuera `src/app/(raiz)/` (layout y página) y la clase `.entradas`; `serve.json` y
  `vercel.json` suman `/` → `/es`; el 404 bilingüe cambia las dos tarjetas por dos enlaces de regreso;
  `lighthouse-urls.json` = `/es`, `/en` (la raíz ya no es una página que medir).
- Vercel, sin conexión (`vercel@60.1.3 build`): la ruta `^/$` → 307 `/es` queda en la posición 2, antes
  de `filesystem`.
- Clase de mirada: la pidió el usuario y el resultado es el de la maqueta. No abre parada; se ve en la
  parada de la fase 2 (memoria «avanzar sin pequeñeces»).

| Gate | ¿Puede fallar? | Demo en rojo | A quién nombró | Verde |
| ---- | -------------- | ------------ | -------------- | ----- |
| e2e `producto-base` — «la raíz lleva directo al atlas en español, sin pantalla de elegir idioma» (307 + `Location: /es`, aterriza con `lang="es"` y la cápsula) | Sí: la portada respondía 200 | El estado del repo antes del arreglo | `Expected: 307 · Received: 200` | ✓ suite e2e 32/32 (salen las 4 de axe sobre `/`, entran 2) |

CI de `750c405` (la raíz): quality ✓ 55 s · e2e ✓ 54 s · lighthouse ✓ 1 min 55 s · Vercel ✓.

**«continúa» del usuario (2026-09-27)**, en el mismo mensaje del veredicto: «Ajusta esto y continúa».
Modelo sin cambio (Opus 5.5, esfuerzo alto, como se recomendó).

## Fase 1 — El diagramador (2026-09-27)

### Dependencias

`ajv@^8.18.0` (compila los esquemas), `esbuild@^0.28.2` (empaqueta el validador y, más adelante, el motor
para los navegadores) y `fast-check@^4.10.2` (propiedades), las tres de desarrollo en la raíz. El install
dijo «+9 −3»: el lockfile solo **suma** entradas (esbuild y sus binarios por plataforma, fast-check,
pure-rand); el «−3» es de enlaces en `node_modules`. `verificar-dependencias.mjs HEAD`: 682 paquetes,
ninguno por debajo.

### Validación (`validate`, `validateGrammar`)

- **Fase 1 = esquema.** `scripts/diagramador/compilar-esquemas.mjs` compila los dos JSON Schema con Ajv 8
  standalone (`allErrors`, `strict`, `inlineRefs: false`) y esbuild lo empaqueta sin imports:
  `packages/diagramador/src/validar/esquemas.generado.js` (154 KB; el código de errores de Ajv es
  verboso) + su `.d.ts` escrito a mano. El paquete no depende de Ajv en ejecución.
- **Traducción de errores de esquema a reglas del contrato** (el contrato no la escribe; decisión
  D-S1-16, va a «Enmiendas»):
  - mapa: `/nodos/i/…` y `/bloques/i/…` → V3 · `/flujos/i/condicion` → V13 · `/flujos/i/…` → V4 ·
    `…/pasos/j/bifurca` → V12 · `/recorridos/…` → V5 · colección que no es lista → V6 · `/glosario` → V14 ·
    el resto → V1. El id es el del elemento que contiene el campo.
  - gramática: bandas, tipos, modos y madurez → G2 · vigencia y límites → G6 · recorrido de referencia →
    G5 · idiomas, idioma base y términos → G7 · el resto → G1.
- **Fase 2 = reglas en código:** G1–G7 (`reglas-gramatica.ts`) y V1–V15 (`reglas-mapa.ts`). Compatibilidad
  de versiones: en 0.x, misma mayor y misma menor; desde 1.0, misma mayor y menor no posterior.
  V5 exige flujo **dirigido** del paso anterior al siguiente (los 6 mapas lo cumplen, también el de «ida y
  vuelta»). V9 busca el término como palabra completa, sin distinguir mayúsculas, con las explicaciones
  del nodo y del glosario; V10 cuenta signos de cierre. V15 sin cobertura no corre y lo dice como aviso.
- **Informe (D-S1-02):** `{ ok, errores, alertas, avisos }`, cada entrada con la forma del contrato,
  ordenado por `(doc, ruta, regla)` por unidades de código. Los mensajes van en español: son para quien
  construye el mapa, no para la interfaz.

**Carnadas: detectó 31 de 31** (`packages/diagramador/test/carnadas.test.ts`). Secundarios legítimos
(D-S1-03), los tres que el plan previó:

| Carnada | Esperado | Además reporta | Por qué es legítimo |
| ------- | -------- | -------------- | ------------------- |
| C03 | V2 · captura-cambios | V3 · captura-cambios | Su bloque «entrada» sigue anclado en ingesta y el nodo ya no vive ahí |
| C06 | V4 · f-semantico-tablero | V5 · admision-paciente/p7 | Sin ese flujo, ningún flujo une los pasos 6 → 7 |
| C07 | V5 · admision-paciente | V12 · admision-paciente/p5 | El paso 5 sigue declarando «paralela» con una sola rama |

Los 6 mapas de ejemplo del contrato se aceptan en modo publicación, con cobertura, sin errores ni alertas.

| Gate | ¿Puede fallar? | Demo en rojo | A quién nombró | Verde |
| ---- | -------------- | ------------ | -------------- | ----- |
| `packages/diagramador/test/carnadas.test.ts` (33) | Sí: una regla apagada deja pasar su carnada | V13 desactivada (`false &&`) | «C20-condicional-sin-condicion.mapa.json: V13 · f2 · fase 2» y «Received: "detectó 30 de 31"» | ✓ 33/33 |
| `tests/unit/diagramador-esquemas.test.ts` (deriva del validador generado) | Sí: esquema cambiado sin regenerar o edición a mano | Un salto de línea agregado al final del generado | «coincide byte a byte… regenera con: node scripts/diagramador/compilar-esquemas.mjs» | ✓ |

### Geometría, SVG, lectura, leyenda y diff

**API** (`packages/diagramador/src/index.ts`, funciones puras): `validate` · `validateGrammar` ·
`layout(map, grammar, view, { textos, fechaConsulta, recorrido? })` · `toSVG(geo, { language, prefix?, textId?,
hintId? })` · `toJourneyCSS(geo, contenedor)` · `toText(map, grammar, { language, textos, id? })` ·
`toLegend(grammar, { language, textos })` · `diff(a, b)` · `crossings(geo)` (D11). `compare` queda para el S2.

- **Todo en enteros** (G1, G2): coordenadas en décimas, `fmt` como única salida numérica, días civiles sin
  `Date`, anchos de texto por suma de avances × 103/100 con comparación exacta. Trazados ortogonales sin
  trigonometría (largo = |dx| + |dy|, dirección = signo).
- **Serializador propio** (D8): orden de atributos fijo por elemento (uno fuera de la tabla es un error),
  ids con espacio de nombres `sujeto-vista-idioma`, una línea por grupo de primer nivel, LF y un salto final.
- **Reproduce la maqueta**: el nivel 1, el nivel 2 y el recorrido de la Plataforma Ejemplo salen con el mismo
  viewBox que la referencia (1178 × 648 y 1178 × 756) y, leídos como imagen lado a lado, con las mismas
  columnas, bloques, etiquetas de modos, carril exprés, franjas, referencias, insignias de paso y rama.
  Capturas en el scratchpad (no se versionan); la comparación formal es la parada de FIDELIDAD de la fase 2.
- **Clases `dg-*`** en vez de las `db-*` de la maqueta, y el estilo por `estilo_linea` (continua, discontinua,
  punteada, doble), no por id de modo: el SVG no lleva palabras de dominio (G3). La hoja del producto
  `src/styles/diagrama.css` es la portada de `docs/diseno/assets/diagrama.css`; suma lo que la maqueta nunca
  ejerció (medidor «anunciado» discontinuo y «retirado» tachado).

**Decisiones** (a «Enmiendas» las que tocan el contrato):

| # | Decisión | Por qué |
| - | -------- | ------- |
| D-S1-17 | Madurez en el bloque (nivel 1): el nombre de la gramática; si no cabe en una línea en algún idioma, ocupa dos y reemplaza a «N componentes». En el nodo (nivel 2): abreviada por palabras con «…» (D6) | La maqueta usaba «vista previa», un nombre corto que la gramática no tiene. Enmienda: `escala_madurez[].etiqueta_corta`. Va declarada al gate de fidelidad |
| D-S1-18 | Insignia de vigencia: montada sobre el borde en bloques y nodos; en las fichas de franja (60 y 44 u) va afuera, a la derecha, y las referencias de la fila empiezan después. Las fichas de franja también marcan la excepción | Montada sobre una ficha de 44 u tapaba el nombre (G11 prohíbe texto bajo otra pieza) |
| D-S1-19 | Marcas «envía/recibe» = flechas ↑/↓ de la maqueta | El contrato las nombra «(referencia ↑)» y «(↓)», pero su path dibuja → y ←. Enmienda |
| D-S1-20 | Ids: caja sin bloque `_banda`; flujo agregado `origen.destino` (caracteres que un id de dato no admite); D12 por grupo de primer nivel | La maqueta ya asignaba el dueño por grupo. Enmienda a D12: «o su grupo» |
| D-S1-21 | Caja sin bloque con varios nodos: sin nombre (§ 4.1, «caja sin nombre»); una referencia a ella nombra su banda | La primera versión escribía «2 componentes» como nombre |
| D-S1-22 | Varios elementos por banda en el nivel 1: ranuras hacia abajo (104 + 40 u); en franjas, fichas lado a lado | Gaps del contrato; ningún mapa del contrato lo ejercita |
| D-S1-23 | Más de 2 saltos: una pista más por salto, con aviso de geometría (la fila de franjas se corre) | `prueba-arquitectura-app` tiene 3. G5 del nivel 1 deja de valer en ese caso, y el aviso lo dice |
| D-S1-24 | El salto entra por abajo en el nivel 1 (maqueta) y sube por el canal anterior al destino en el nivel 2 (§ 5.3) | Fidelidad a lo aprobado en cada vista |
| D-S1-25 | G6 (c) ampliado: quitar un flujo cambia ese flujo y los que comparten con él extremo, canal o fila de referencias | Con puertos en `y + alto·i/(k+1)`, un flujo menos corre los de su borde. Enmienda |
| — | Las etiquetas de los flujos con quiebre se despegan 2 u del borde de la tarjeta; las referencias que se salían del lienzo se corren hacia adentro | La maqueta dejaba cuatro etiquetas rozando la tarjeta; § 5.3 dice «no dibuja encima de nada» |

**Carriles** (D-S1-05, `prueba-procesos`): una fila por carril con cabecera de 200 u; los nodos en ranuras
de 152/50 u por `orden` global. Cada ranura tiene un solo nodo, así que ningún tramo en un canal cruza una caja.

**Resultados:** 6 mapas × 3 vistas + A3: **D11 = 0**, **sin avisos** salvo el declarado de
`prueba-arquitectura-app`; A3 dibuja la etiqueta de cuatro marcadores en dos filas (38 × 32 u) dentro del
canal. **26 golden files** + `SHA256SUMS`. **G1 en navegadores (macOS local):** las 26 huellas de Node salen
idénticas en Chromium, Firefox y WebKit. Semilla de fast-check: **20260927**. Suite: 559 pruebas; cobertura del
paquete ≈ 90 % de ramas (la primera corrida quedó en 77,7 %: se agregaron las pruebas de la tabla de
traducción de esquema y de bordes; no se bajó el piso).

| Gate | ¿Puede fallar? | Demo en rojo | A quién nombró | Verde |
| ---- | -------------- | ------------ | -------------- | ----- |
| `geometria.test.ts` — D11 | Sí | El carril exprés 50 u más arriba, dentro de la última fila de nodos | 19 casos; p. ej. «f-limpias-semantico» cruza «canalizacion-declarativa» | ✓ 49/49 |
| `golden.test.ts` (28) | Sí | «Almacén» → «Almacen» en un golden | «plataforma-ejemplo.nivel-1.es.svg: mismos bytes y misma huella» | ✓ |
| `svg.test.ts` — canon | Solo si un golden se regenera con un motor roto (verifica los archivos; `golden.test` ata motor y archivos) | `fmt` con dos decimales y golden regenerados | 26 × «números cuantizados… a lo sumo un decimal» | ✓ golden restaurados con la misma `SHA256SUMS` |
| `propiedades.test.ts` — invariancia al orden | Sí, pero el primer sabotaje (bloques sin ordenar) era **inalcanzable**: cada banda del ejemplo tiene un bloque | Flujos agregados del nivel 1 sin ordenar | los dos mapas, con su contraejemplo | ✓ 7/7 |
| `propiedades.test.ts` — G6 (b) | Sí | El nombre accesible de cada nodo incluye el total de nodos | contraejemplo `["fuentes","aaa"]`: «cambió sistema-admisiones» | ✓ |
| `tests/determinismo` (3 navegadores) | Sí | Otra fecha de consulta solo en la entrada del navegador | 20 de 26 huellas distintas (WebKit) | ✓ 3/3 |

Falla del arnés, no del motor: `crypto.subtle` no existe en `about:blank` (no es contexto seguro); la
prueba sirve una página vacía por `page.route` en `https://diagramador.invalid/` (TLD reservado, nada sale
a la red).

**Job `diagramador`** en `ci.yml`: matriz `ubuntu-latest` + `macos-latest`, sin `needs`; pruebas del paquete en
Node + G1 en los tres navegadores. Su primera corrida es este push.

### G15 medido en los tres motores (pendiente del contrato)

Segunda prueba de `tests/determinismo`: la página carga Space Grotesk y JetBrains Mono (servidas por la
propia prueba; la prueba exige que carguen, porque con la fuente de respaldo podría caber por casualidad),
dibuja los niveles 1 y 2 de los dos mapas bilingües y mide cada `tspan` con `getComputedTextLength()`
(en la prueba, nunca en el motor). Ninguno puede pasar del ancho que calculó la tabla.

- macOS, local: **456 textos; el más ajustado usa el 97,1 % de lo que midió la tabla**, igual en Chromium,
  Firefox y WebKit. Es decir: la suma de avances sin kerning coincide con el navegador y el margen de
  3 % (103/100) es el único margen. Respuesta a P12 (kerning en la tabla): no hace falta mientras el margen
  se conserve; va a «Enmiendas» como dato medido. Linux: lo mide el job `diagramador`.

| Gate | ¿Puede fallar? | Demo en rojo | A quién nombró | Verde |
| ---- | -------------- | ------------ | -------------- | ----- |
| `tests/determinismo` — G15 | Sí | Margen de la tabla en 97/100 | Firefox: «Entrada» 64,3 u en 63 u; «¿Qué recibe el agente?», «Orquestación»… (103,1 %) | ✓ 3/3 |

### CI de la fase 1: primera corrida del job `diagramador`, su rojo y el hallazgo de Linux

| Commit | quality | e2e | lighthouse | diagramador (ubuntu) | diagramador (macOS) | Vercel |
| ------ | ------- | --- | ---------- | -------------------- | ------------------- | ------ |
| `a6748cb` motor | ✓ 1 min 6 s | ✓ 1 min 5 s | ✓ 2 min 26 s | ✓ 1 min 52 s (**primera corrida**) | ✓ 1 min 50 s (**primera corrida**) | ✓ |
| `ab3e901` demo en rojo (fecha de consulta distinta solo en la entrada del navegador) | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ |
| `0185d05` revert de la demo | ✓ | ✓ | ✓ | ✗ **G15 en Chromium/Linux** | ✓ | ✓ |
| `c084ef5` `geometricPrecision` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

- **G1 en Linux (hueco del contrato, cerrado):** los 26 golden generados en macOS salen con las mismas
  huellas en Node y en Chromium, Firefox y WebKit de `ubuntu-latest`.
- **El job se vio fallar en la CI** (regla 15): con la demo, `diagramador` cayó en los dos sistemas mientras
  quality, e2e y lighthouse quedaban en verde; ningún otro job podía verlo.
- **Hallazgo de la primera corrida en Linux (G15):** Chromium en Linux redondeaba cada texto a píxeles
  enteros: «caso» 31 px contra 30,8 de la tabla, «tareas» 42 contra 41,7 (100,7 %). Firefox y WebKit en Linux,
  y los tres en macOS: 97,1 %. Arreglo en la hoja del consumidor: `text-rendering: geometricPrecision` en
  `.dg-svg text` (`src/styles/diagrama.css`). Con él, **97,1 % en 3 motores × 2 sistemas**. Va a
  «Enmiendas»: el contrato debe exigir esa propiedad al consumidor (el motor no controla el CSS).
- **Ruleset `main-protegida`**: exige ahora `quality`, `e2e`, `lighthouse`, `diagramador (ubuntu-latest)` y
  `diagramador (macos-latest)` (`gh api`, 2026-09-27).

### Enmiendas al contrato del diagramador (lista viva; va entera al summary)

1. **D-S1-01** — La etiqueta de modos con más de 2 marcadores se parte en dos filas (38 × 32 u con 3 o 4): el
   ancho de § 5.3 (70 u con 4) no cabe en el canal de 50 u que exige A3.
2. **D-S1-02** — El informe separa errores, alertas (V9, V10) y avisos (lo que no corrió); se agrega
   `validateGrammar`.
3. **D-S1-03** — `esperado.json` debería listar los secundarios legítimos de C03, C06 y C07.
4. **D-S1-05** — Geometría de carriles: filas con cabecera de 200 u y ranuras de 152/50 u por `orden` global.
5. **D-S1-06** — Las cadenas de interfaz del motor llegan en `options.textos` (también `toText` y `toLegend`).
6. **D-S1-16** — Tabla de traducción de errores de esquema a regla e id (§ 7 no la escribe).
7. **D-S1-17** — `escala_madurez[].etiqueta_corta`: el nombre largo no cabe en bloques ni nodos.
8. **D-S1-19** — Paths de «envía/recibe»: el contrato dice ↑/↓ y dibuja →/←.
9. **D-S1-20** — D12: «un id, un `data-dueno` o el de su grupo».
10. **D-S1-23** — Más de 2 saltos: pistas adicionales **sin aviso** (el carril crece y las franjas bajan; G5 del
    nivel 1 deja de valer en ese caso). Corregido en 3c: el aviso rompía el build con el primer mapa real, y el
    propio `prueba-arquitectura-app` del contrato lo disparaba.
11. **D-S1-25** — G6 (c): quitar un flujo también cambia los que comparten extremo, canal o fila de
    referencias (puertos `y + alto·i/(k+1)`).
12. **G15/P12** — Medido: la tabla sin kerning + 3 % es cota superior en 3 motores × 2 sistemas (el más
    ajustado, 97,1 %); el consumidor debe dibujar con `text-rendering: geometricPrecision`.
13. **G1** — Hueco «Linux pendiente» cerrado por medición.
14. **Constitución** — Líneas viejas del diagramador en `CLAUDE-md-para-app.md` (V1–V12, franjas arriba,
    angosta 380, «v0.2.0 hoy»).
15. **D-S1-26** — La geometría expone la vigencia del mapa y de cada elemento activable (`vigencia`): § 4.8
    pide la píldora del mapa con el texto completo y la app no debe repetir la regla de los umbrales.
16. **D-S1-27** — `toText` recibe la fecha de consulta: § 4.8 exige «por revisar · N días» también en la
    lectura, y la firma de § 8 (`{ language }`) no tiene cómo calcularlo.
18. **D-S1-36** — `toCard(map, grammar, nodeId, { language, textos, fechaConsulta? })` en la API de § 8: § 4.5
    dice «el motor entrega el contenido» sin nombrar la función; y `TextosMotor.ficha` para sus títulos.
19. **Contrato de la propuesta** — El contrato del diagramador no dice cómo se propone un mapa; el esquema de
    Big-D (`src/lib/investigador/esquema.ts`: afirmación = entidad + id + cita literal; rechazar = sacar del mapa
    en cascada) sirve de base si otro consumidor necesita el mismo flujo.
17. **Leyenda (§ 4.9)** — La regla del haz («varios modos en una conexión: línea gruesa y una etiqueta que dice
    cuáles, en orden») es gramática, no copy de la app: debería salir en la leyenda generada.
20. **D-S1-40 — Canal con más de 6 pistas** — § 5.3 da 6 posiciones fijas; el primer mapa real pide 7 en un canal
    del nivel 2. Con más de 6, el canal entero se reparte parejo a 2 u de cada tarjeta, en el mismo orden (centro,
    derecha, izquierda), con un piso de 4 u entre pistas (12 como máximo; la 13.ª avisa). Hasta 6, nada cambia.
21. **D-S1-41 — Etiqueta de modos que choca** — § 5.3 dice «si no cabe, el motor lo reporta y no dibuja encima de
    nada», pero no da un segundo lugar. Se prueba el tramo de llegada, pegado a la pista; si tampoco está libre, se
    reporta.
22. **D-S1-42 — Fila de referencias de franja llena** — Entre referencias van 8 u y bajan hasta 4 si la fila no
    alcanza; las que se salen por la derecha se corren hacia adentro empujando a las anteriores (antes solo se
    corría la última).
23. **D-S1-43 — Etiqueta de un salto en el nivel 1** — La regla de la maqueta (entre la llegada del salto anterior
    y la propia) supone saltos anidados; con saltos que no salen del mismo lado, la etiqueta va en la mitad de su
    propio tramo. Invariante nueva: toda etiqueta de modos a ≤ 30 u de su trazo, en todos los mapas.
24. **V16 (propuesta) — «El mapa se dibuja»** — Ninguna regla V1–V15 mira si los textos caben: un mapa válido para
    publicar puede traer avisos de geometría (una palabra más ancha que el bloque, un nombre de 4 líneas en una
    ficha de 2). Big-D lo resuelve fuera del contrato (el validador del investigador y la aprobación dibujan las
    vistas); el contrato podría declararlo como regla de validación en modo publicación.
25. **Carnada P1 (mapa denso)** — `packages/diagramador/test/carnadas-piloto/P1-mapa-denso.mapa.json`: la forma
    del primer mapa real con nombres neutrales. Propuesta para el juego de carnadas del contrato.
26. **D-S1-44 — Vista «bloque» y `toBlockCards`** (pedido del usuario al mirar Fabric): `layout(map, grammar,
    "bloque", { grupo })` dibuja lo que hay dentro de un elemento activable del nivel 1 (un bloque, o «_<banda>»
    para los nodos sin bloque) con la MISMA tarjeta que el nivel 2 (de capa o ficha compacta de franja) y solo los
    flujos de adentro; `toBlockCards(map, grammar, group, opts)` da una tarjeta de texto por componente con todas
    sus conexiones. `rutear` acepta `centroCanal` (el canal va tras la tarjeta real, 152 o 168 u). § 8 no tiene
    esta vista ni esta función.
27. **D-S1-45 — Etiqueta de un flujo dentro de una columna** — se despega 2 u de la tarjeta como la de los
    vecinos (antes la rozaba 1 u; ningún mapa del contrato tenía el caso, lo cazó la vista «bloque»).

## Fase 2 — Atlas nivel 1 en el producto (2026-09-27)

**«continúa» del usuario (2026-09-27)** tras el resumen de la fase 1. Modelo sin cambio (Opus 5.5, esfuerzo
alto).

### El motor suma dos cosas (sin tocar un byte de los SVG)

| # | Decisión | Por qué |
| - | -------- | ------- |
| D-S1-26 | `Geometria.vigencia`: días y estado del mapa (su nodo más viejo) y de cada elemento activable (bloque, caja sin bloque o ficha en el nivel 1; nodo en el nivel 2), con el mismo cálculo que dibuja las insignias | La píldora del mapa (`vigente` · `2 bloques por revisar` · `1 vencido · 1 por revisar`) la arma la app; sin esto tendría que repetir la regla de los umbrales. Enmienda 15 |
| D-S1-27 | `toText(…, { fechaConsulta })`: cada nodo por revisar o vencido dice «Por revisar: verificado hace N días.»; lo vigente no se marca | § 4.8 pide el texto completo también en la lectura. Enmienda 16 |

Los 26 golden files no cambiaron (399/399 pruebas del paquete; determinismo 6/6 en Chromium, Firefox y
WebKit, G15 sigue en 97,1 %).

### El dato de la app (`data/`)

- **Gramática y mapa de ejemplo generados del contrato.** `scripts/datos/desde-contrato.mjs` escribe
  `data/gramaticas/plataformas-datos.gramatica.yaml` y `data/mapas/plataforma-ejemplo.mapa.yaml` (YAML 1.2)
  desde la copia fijada en `packages/diagramador/`. Prueba `datos-desde-contrato`: el YAML versionado es lo
  que genera el script (bytes) y dice lo mismo que su JSON (igualdad profunda).
- **Plataformas, una por archivo** (`data/plataformas/<id>.yaml`, Zod en `src/lib/datos/esquemas.ts`):
  `plataforma-ejemplo` publicada y ficticia; `databricks`, `fabric` y `snowflake` «próximamente», sin
  contenido (Fabric se publica cuando apruebes su mapa en la fase 3).
- **Cargador del build** (`src/lib/datos/cargar.ts`): plataformas con Zod; gramáticas con `validateGrammar`;
  mapas con `validate(…, { mode: "publicacion", coverage })`. Cruza: archivo = id, publicada ⇒ tiene mapa,
  próximamente ⇒ no lo tiene, mapa ⇒ tiene plataforma, `sujeto_id` y `sujeto_nombre` = los de su
  plataforma, la gramática declara los idiomas de la interfaz. **Más estricto que el contrato:** una alerta
  también rompe el build, y la vista rompe el build si el dibujo trae avisos de geometría (un mapa publicado
  no sale con etiquetas que no caben).
- **D-S1-29 — Fecha de consulta** = el día del build (UTC), o `BIGD_FECHA_CONSULTA` en pruebas y capturas.
  El preview muestra el estado real del día; las capturas de fidelidad usan 2026-09-26, la de la maqueta.

### La pantalla

- `src/app/[idioma]/atlas/[plataforma]/page.tsx`: una página estática por idioma × plataforma publicada. El
  SVG, la leyenda y la lectura en texto salen del diagramador en el build (`src/lib/atlas/nivel1.ts`); la
  página los coloca como `docs/diseno/atlas-nivel-1.html`: encabezado con la píldora de vigencia, pestañas de
  nivel (02–04 pendientes, sin enlace), guía, índice de capas, pista, «Saltar el diagrama», lienzo deslizable,
  leyenda y lectura plegada.
- **D-S1-30 — Capa interactiva** (`ControlLienzo`, cliente): se engancha al SVG del build por sus ids, sin
  repetirlo en la carga de React. Desborde, sombras de borde, índice de capas, ficha breve con clic, Enter o
  Espacio. La ficha breve es la entrada del bloque en la lectura del motor, y vive en una región
  `aria-live`. El árbol es el mismo en servidor y cliente (regla de movimiento reducido).
- **D-S1-31 — Última capa del índice.** En un lienzo angosto la última columna nunca llega al borde izquierdo,
  y la regla de la maqueta («la última que empieza antes del borde + 40 px») jamás la marcaba: tocar «06» la
  mostraba sin marcarla. Al final del desplazamiento se marca la última. Defecto heredado de la maqueta; lo
  cazó el e2e nuevo.
- **D-S1-32 — Entrada al atlas.** «Atlas» en la barra y «Abrir el atlas» en la portada llevan a la primera
  plataforma publicada por id (ninguna tiene trato especial). El selector de plataforma espera su mirada de
  FORMA; mientras, el botón «Cambiar de plataforma» no se muestra (jamás un control que no hace nada).
- Diccionario: `motor` (las cadenas que dibuja el diagramador, las de la maqueta) y `atlas` (la pantalla),
  en los dos idiomas. Nuevos: la nota de marcas (texto de `diagramador-tokens.md` § 13, sin nombrar
  plataformas: N por diseño), «Abrir el atlas» y la pista de los bloques para lector de pantalla. Son de
  TEXTO: maquetados, no vistos; viajan al gate humano.
- Hojas: `src/styles/atlas.css` (portada de la maqueta, más el acomodo de la leyenda y la lectura que genera
  el motor) y `src/styles/diagrama.css`, ya importadas. La base de Tailwind quita los marcadores de lista: se
  devuelven en la lectura y la ficha, y el recorrido conserva solo la numeración del motor.

### Pruebas y gates

| Gate | ¿Puede fallar? | Demo en rojo | A quién nombró | Verde |
| ---- | -------------- | ------------ | -------------- | ----- |
| `vigencia.test.ts` — la vigencia de la geometría marca exactamente los elementos con insignia | Sí | el resumen dice «vigente» siempre | 3 pruebas: «plataforma-ejemplo · nivel-1: expected [] to deeply equal ['_operacion', '_orquestacion', …]» y los demás mapas | 8/8 |
| `vigencia.test.ts` — la lectura dice los días de lo por revisar y vencido | Sí | la condición de la fecha invertida | 2 pruebas | 8/8 |
| `datos-desde-contrato` — deriva YAML ↔ JSON del contrato | Sí | una frase del YAML editada a mano | las 2 pruebas del mapa, con el campo `es` cambiado | 4/4 |
| `datos.test.ts` — un dato roto rompe la carga con archivo, regla e id | Sí: cada caso rompe una copia de `data/` | 8 pruebas, 10 datos rotos: cada uno es un rojo por construcción y exige su mensaje exacto | — | 11/11 |
| El build mismo (G14) | Sí | `fabric.yaml` con `estado: publicada` y sin mapa | `pnpm build` sale con 1: «data/plataformas/fabric.yaml · estado · publicada sin mapa: falta data/mapas/fabric.mapa.yaml» | build ✓ al restaurar |
| `atlas.test.ts` — cadena de fidelidad: dato YAML + diccionario = golden del diagramador, byte a byte | Sí | «sin bloque» → «sin grupo» en `es.ts` | «nivel 1 en es» (el inglés sigue verde) | 7/7 |
| e2e `atlas.spec.ts` (teclado, ficha, lienzo a 380 px, G10 en el producto, axe en los dos temas con la ficha y la lectura abiertas) | Sí | su primera corrida: 6 rojos reales | el selector contaba también los pasos del recorrido; la última capa no quedaba marcada (D-S1-31) | 20/20 |
| Pasada de capturas e interacción (`scripts/capturar-producto.mjs`, manual: la CI no la corre) | Sí | (1) el clic de los bloques saboteado; (2) un botón nuevo sin prueba | (1) 14 fallas, una por bloque: «no abrió su ficha breve» / «no quedó marcado»; (2) «control sin pasada de interacción: `<button …>Cambiar de plataforma</button>`», salida 2 | 0 fallas, salida 0 |

El arnés sirve `out/` con su propio servidor en un puerto libre y comprueba que entrega los bytes de
`out/es.html` antes de fotografiar (regla de derivados y arneses). Mide desborde de la página, fuente
cargada, texto dentro del lienzo y fuera de cajas ajenas, y el **área de desplazamiento** del lienzo (la que
debe haber, y que al final se ve el borde derecho del SVG). Su pasada de interacción activa tema, índice de
capas, cada bloque con clic y el último con Enter, el foco del lienzo, los dos saltos, la lectura plegada y
cada enlace. Un control que no sabe activar es una falla. Sus propias fallas de la primera corrida eran suyas:
midió antes de que terminara el desplazamiento suave, y ocultó la ficha por debajo de React.

**Suites:** unitarias 589/589 (27 archivos; `src/lib/atlas` 95,7 % y `src/lib/datos` 94,9 % de líneas) ·
e2e 52/52 · determinismo 6/6 · typecheck y lint limpios.

### Fidelidad contra `docs/diseno/atlas-nivel-1.html`

Build local con `BIGD_FECHA_CONSULTA=2026-09-26`, pares producto | maqueta compuestos por el arnés
(`--maqueta`), leídos como imagen: 2 temas × 2 idiomas × 380 y 1280 px. Además los estados «por revisar»
(2026-10-20) y «vencido» (2026-11-19) y la ficha breve abierta en cada encuadre: **32 encuadres, 24 con la
ficha abierta, 0 fallas de medida.** El lienzo sale idéntico: mismas columnas, bloques, etiquetas de modos,
carril exprés, franjas, referencias e insignias. Diferencias, todas declaradas:

| # | Dónde | Maqueta | Producto | Por qué |
| - | ----- | ------- | -------- | ------- |
| 1 | Bloque «Agentes» | «1 componente» + «vista previa» | «Vista previa pública» en dos líneas, sin «1 componente» | D-S1-17: la gramática no tiene nombre corto (enmienda 7) |
| 2 | Subtítulo | «seis capas y tres franjas» | «6 capas y 3 franjas» | Los conteos salen de la gramática (N por diseño); con palabras haría falta una tabla de números por idioma |
| 3 | Encabezado | botón «Cambiar de plataforma» (sin comportamiento en la maqueta) | no aparece | Espera la mirada de FORMA de esta parada |
| 4 | Barra | Conocimiento · Caso · Instrumento | solo Atlas | Secciones no construidas: jamás un enlace muerto |
| 5 | Leyenda | tipos y modos | tipos, modos, **madurez, vigencia** y la nota de marcas | El contrato (§ 4.9) genera la leyenda entera; la nota espera su FORMA |
| 6 | Lectura en texto | banda → bloque, con un resumen de conexiones | banda → bloque → componente → conexiones, más el recorrido | Es la del motor (G10 del contrato), la misma que oyen los lectores de pantalla |
| 7 | Ficha breve | una línea del bloque | la entrada completa del bloque en esa lectura | Consecuencia de 6 |
| 8 | Estados de vigencia | 2 bloques con fechas distintas | los 9 elementos a la vez | El mapa de ejemplo tiene una sola fecha de verificación; las insignias son las mismas |
| 9 | Pie | «Todo lo que ves aquí es ficticio» | sin esa frase | El producto no es todo ficticio; el título dice «(ficticia)» |
| 10 | Índice de capas | la última capa nunca se marca | se marca al llegar al final | D-S1-31 |

### Propuesta de FORMA: selector de plataforma y nota de marcas

`docs/propuestas-de-diseno/selector-y-nota.html` (doble clic; usa las hojas de la maqueta, tema e idioma
funcionan, el botón abre y cierra). Cuatro marcos:

1. **Selector abierto en el atlas (ancho).** «Cambiar de plataforma» despliega, bajo el encabezado, una
   tarjeta por plataforma en rejilla que crece con N; empuja el contenido, no flota sobre el mapa. Publicada
   = borde lleno y enlace, con su marca de vigencia; próximamente = borde discontinuo (como una caja sin
   contenido del diagrama) y la palabra; la actual = borde de 2 px en tinta; «ficticia» en una etiqueta. Orden
   por id. Al pie, la nota de marcas en una línea.
2. **El mismo selector a 380 px.** Una tarjeta bajo otra.
3. **La portada lo usa como índice**, siempre abierto.
4. **Nota de marcas, dos formas.** A: párrafo al pie de la leyenda (lo que hoy muestra el atlas). B: nota con
   filete y marca dibujada, más visible.

### Parada A (2026-09-27)

CI de `ea0aa90`, primera con el atlas: quality ✓ 1 min 9 s · e2e ✓ 1 min 30 s · lighthouse ✓ 3 min 20 s (ya
mide las dos rutas del atlas) · diagramador ubuntu ✓ 1 min 45 s · macOS ✓ 1 min 36 s · Vercel ✓.

**Cómo se pidió, y qué falló del pedido.** El primer mensaje llevaba dos tablas con once filas, cuatro
decisiones y el resumen técnico. Respuesta: «No entiendo A y B, sé claro qué necesitas exactamente y dónde
mirar; ni siquiera está claro dónde debe ser». Segundo intento, cuatro preguntas numeradas con las páginas
abiertas en el navegador: «Sigo sin entender, o sea, qué instrucciones tan…». Tercer intento, UNA pregunta
de sí/no con la página ya al frente: respondió al instante. Desde aquí, cada mirada es una pregunta por
mensaje, en palabras llanas, con la página abierta por mí (memoria del proyecto actualizada).

**Mirada 1 — el mapa nuevo (fidelidad).** Página al frente: el atlas de la Plataforma Ejemplo en el preview
del PR #4. Pregunta: «¿Ese mapa se ve bien?». Respuesta: **«Si se ve bien»** → **fidelidad aprobada**. Con la
misma apertura quedan vistas la raíz directa a `/es` y la cápsula de idioma.

**Mirada 2 — selector de plataforma, ronda 1 (FORMA).** Página al frente:
`docs/propuestas-de-diseno/selector-y-nota.html`. Pregunta: «¿Te gustan esas tarjetas para elegir
plataforma?». Respuesta: **«No, no me gusta nada, no es entendible»** → **rechazada**. El archivo se retira
(queda en `ea0aa90`).

**Ronda 2.** `docs/propuestas-de-diseno/selector-plataforma.html`: la página del mapa tal como está en el
producto (el mapa es el golden file del diagramador, no un dibujo), con el campo «Plataforma» del kit
aprobado (etiqueta, lista desplegable y chevrón dibujado) donde la maqueta tenía «Cambiar de plataforma».
La lista trae las N plataformas por id; las que no tienen mapa dicen «— pronto» y no se pueden elegir.

**Mirada 3 — selector de plataforma, ronda 2 (FORMA).** Página al frente: `selector-plataforma.html`.
Pregunta: «¿Así se entiende cómo cambiar de plataforma?». Respuesta: **«Sí se entiende y visualmente
apropiado»** → **aprobada**. Se construye en la fase 3: el campo «Plataforma» del kit en el encabezado del
atlas (N opciones por id; sin mapa = «— pronto», deshabilitada; elegir otra lleva a su atlas en el mismo
idioma y nivel).

**Parada A cerrada**: fidelidad aprobada (mirada 1) y forma del selector aprobada (mirada 3).

**Decididas por mí, sin preguntar (menores; viajan al gate humano del ciclo):**
- **D-S1-33** — Bloque «Agentes»: se queda «Vista previa pública», el nombre de la gramática (D-S1-17). Sin
  enmienda nueva de nombre corto; la 7 queda como sugerencia.
- **D-S1-34** — Nota de marcas: forma A, el párrafo al pie de la leyenda que el motor ya genera (la más
  sobria junto a los colores que explica). No se construye nada nuevo.
- **D-S1-35** — La portada queda como está (título + «Abrir el atlas») hasta que el selector tenga forma
  aprobada; si el campo «Plataforma» pasa, la portada lo repite bajo el título.

## Fase 3 — Resto del atlas, investigador y Fabric (2026-09-27)

**«continúa» del usuario (2026-09-27)** tras cerrar la parada A. Modelo sin cambio (Opus 5.5, esfuerzo alto).

### 3a — Niveles 2 y 3, campo «Plataforma»

| # | Decisión | Por qué |
| - | -------- | ------- |
| D-S1-36 | La ficha de un nodo la genera el motor: `toCard` (HTML), con el glifo y el medidor del dibujo (`svg/simbolos.ts`, compartido con la leyenda) | § 4.5: «el motor entrega el contenido; el panel es de la app». Así los paths viven en un solo lugar. Enmienda 18 |
| D-S1-37 | Panel de la ficha: hoja inferior **modal** en teléfono (`role="dialog"`, `aria-modal`, foco contenido) y región lateral **no modal** desde 900 px; al abrir, el foco va al título; Esc o «Cerrar» lo devuelven al componente | Contrato de foco del design system § 7 |
| D-S1-38 | Recorrido: el primero del mapa. Tocar un componente del recorrido lleva a su paso y abre su ficha. «Anterior» se deshabilita en «todos los pasos» y «Siguiente» en el último (la maqueta no los deshabilitaba). La frase de la rama nombra sus números («… a la vez: 6a y 6b.») | La maqueta dejaba los nodos del recorrido enfocables sin acción, y la frase de la gramática terminaba en dos puntos sin nada después |
| D-S1-39 | La lectura en texto va en los tres niveles, y «Saltar el diagrama» lleva a ella | G10 y design system § 7; la maqueta de los niveles 2 y 3 saltaba a «tras el diagrama» |
| D-S1-40 | Campo «Plataforma» (forma aprobada en la parada A) en el encabezado de los tres niveles: conserva el nivel si la otra plataforma lo tiene. La portada lo muestra sin elección y pierde el enlace «Abrir el atlas» (D-S1-35) | — |
| D-S1-41 | A-27 (estado vacío en contexto): las plataformas «pronto» no se eligen en el campo; su estado vacío vive en la pantalla del investigador de esa plataforma (3b), junto al comando que lo llena | Una página del atlas sin mapa no tiene nada que dibujar |

- Rutas nuevas: `/[idioma]/atlas/[plataforma]/componentes` y `…/recorrido` (solo si el mapa tiene recorrido). El
  encabezado, el mapa y la lectura son componentes comunes (`CabeceraAtlas`, `SeccionMapa`, `Lectura`).
- La animación del recorrido vive en `src/styles/recorrido-animacion.css`, entera dentro de
  `@media (prefers-reduced-motion: no-preference)`. Con movimiento reducido, «Reproducir» sigue en el DOM, el CSS
  lo oculta y el controlador se niega a reproducir.
- Miradas: los niveles 2 y 3 son fidelidad a pantallas ya aprobadas (miradas de TEXTO, «maquetado, no visto»,
  según D-S1-13); el campo «Plataforma» se construyó con la forma aprobada.

| Gate | ¿Puede fallar? | Demo en rojo | A quién nombró | Verde |
| ---- | -------------- | ------------ | -------------- | ----- |
| `ficha.test.ts` — términos del glosario como en la maqueta, nodo por nodo | Sí | sin la condición «aparece en sus textos» | «sistema-admisiones: expected ['catálogo (glosario)'] to deeply equal []» | 4/4 |
| `atlas.test.ts` — cadena de fidelidad extendida a nivel 2 y recorrido (6 golden) | Sí (demo de la fase 2) | — | — | 14/14 |
| e2e `atlas-niveles` — movimiento reducido: «Reproducir» oculto | Sí | sin la regla que lo oculta | `toBeHidden` · Received: visible, en los dos proyectos | 24/24 |
| e2e `atlas-niveles` — la forma del árbol no depende de la preferencia | Sí | «Reproducir» sin dibujar con movimiento reducido | `expect(arbol).toBe(sin)` · −2 +2 líneas | 24/24 |
| e2e `atlas-niveles` — axe con la ficha abierta | Sí: su primera corrida dio 4 rojos | el orden de la prueba: en teléfono la hoja modal tapa la lectura (el comportamiento correcto) | 4 × timeout en `summary.click` | 24/24 |

**Pasada de capturas e interacción** (el arnés aprendió el campo «Plataforma» —la navegación se prueba en otra
pestaña—, la ficha con su foco, los botones y las flechas del recorrido, y jamás pide un enlace externo): 8 rutas
× 2 temas × 380 y 1280 px = **32 encuadres, 1664 comprobaciones, 0 fallas**, más los pares producto | maqueta
del nivel 2 y del recorrido leídos como imagen. Sus rojos de la primera corrida fueron suyos (dejó la hoja modal
abierta a mitad de la pasada; partió del último paso; perdió las marcas al navegar).

**Suites:** unitarias 600/600 · e2e 76/76 · lint y tipos limpios. `lighthouse-urls.json` suma las 4 rutas nuevas.

### 3b — El investigador (skill, candados, verificador, aprobación y pantalla)

CI de `299a93e` (3a): quality ✓ · e2e ✓ · lighthouse ✓ (8 rutas) · diagramador ubuntu ✓ · macOS ✓ · Vercel ✓.

**Semántica de Claude Code verificada en la documentación** (agente de documentación, 2026-09-27):
- La skill admite `disable-model-invocation`, `context: fork` y `agent`.
- El subagente declara `hooks` en su frontmatter; su `Stop` pasa a `SubagentStop`.
- Los hooks de `settings.json` también corren dentro del subagente, y su entrada trae `agent_id` y `agent_type`.
- La salida 2 bloquea, y stderr llega al agente.

Dos datos del informe no se tomaron por buenos: los nombres de campo de Write/Edit (el repo usa
`file_path`) y que un Stop no pueda forzar a seguir. Los hooks leen las dos variantes y se comprueban en vivo.

| # | Decisión | Por qué |
| - | -------- | ------- |
| D-S1-42 | Una afirmación es sobre una **entidad** (`{ entidad: nodo \| flujo, id }`), no una ruta JSON Pointer. Rechazarla saca la entidad del mapa y, en cascada, sus flujos, los recorridos que ya no se sostienen (la condición de V5) y los bloques vacíos | Un puntero a un campo obligatorio (la madurez) no se puede «rechazar»; por id no se rompe al reordenar |
| D-S1-43 | Todo componente y todo flujo necesita al menos una afirmación. La cita de un componente es una de sus `fuentes`, y la de un flujo, una fuente de alguno de sus extremos | Trazabilidad total: nada entra al mapa sin una cita que lo respalde |
| D-S1-44 | Los scripts (`validar`, `verificar-citas`, `aprobar`) empaquetan el TypeScript de la app con esbuild (`scripts/lib/cargar-ts.mjs`) | Mismo código que la app y las pruebas, sin dependencias nuevas (esbuild ya estaba) |
| D-S1-45 | Hooks en `.claude/settings.json` (filtran por `agent_type`) **y** en el frontmatter del agente con la marca `--investigador`; la validación al terminar va solo en el agente | Si un día `agent_type` no llegara, el candado del investigador sigue puesto; y un solo hook de fin cuenta bien los 2 reintentos |
| D-S1-46 | El candado de la aprobación es para **todo** agente, también la sesión principal. Mira qué EJECUTA el comando (intérprete o ruta al inicio de un tramo, también dentro de `$(…)` y comillas invertidas), no qué menciona | La IA jamás aprueba. Falsos positivos aceptados: un heredoc con una línea que empiece por el intérprete y el script se bloquea (se escribe con Edit/Write) |
| D-S1-47 | El registro de fuentes no guarda el id de sesión de Claude Code | El archivo viaja al repo público: nada de la sesión de quien investiga |
| D-S1-48 | Pantalla `/[idioma]/investigador/[plataforma]` para las N plataformas: vigencia por banda con el comando exacto por capa; sin mapa, el estado vacío con `/investigar <id>` (A-27). La propuesta pendiente se agrupa en: por decidir (no verificables), verificadas (aprobadas de entrada) y rechazadas por el código. El comando solo aparece con todo decidido | La pantalla es estática: arma el comando, no aprueba. La persona decide primero lo que el código no pudo verificar |

**Candados en vivo.** Con los hooks activos, esta misma sesión intentó correr el script de aprobación y quedó
bloqueada con el mensaje del hook: el gate corrió en el modo real. También me bloqueó una vez al escribir una
prueba que mencionaba el script dentro de una plantilla de JS: se afinó la regla (tramos y sustituciones
emparejadas) y el caso quedó como prueba.

| Gate | ¿Puede fallar? | Demo en rojo | A quién nombró | Verde |
| ---- | -------------- | ------------ | -------------- | ----- |
| `hooks.test.ts` — nadie corre la aprobación (sesión principal y subagente, 8 formas de lanzarla) | Sí | la regla de la aprobación desactivada | las 8 formas, una por una | 39/39 |
| `hooks.test.ts` — sin identificadores del usuario | Sí | la búsqueda de identificadores desactivada | los casos de correo y nombre | 39/39 |
| `nucleo.test.ts` + `scripts.test.ts` — una cita «no encontrada» no se aprueba | Sí | sin esa regla en `aprobar` | 3 pruebas: la del núcleo y las 2 del script de punta a punta | 62/62 |
| `revision-propuesta.test.tsx` — lo no verificable espera la decisión humana | Sí | aprobado de entrada | «Falta 1 afirmación por decidir» no aparece | 1/1 |
| Validador de la propuesta, en vivo | Sí | mi propia propuesta de muestra usó una madurez que no existe | `mapa/nodos/10/madurez · V2 · agente-datos` | válida al corregirla |

Una propuesta de muestra local (Plataforma Ejemplo con un renombre y un cambio de madurez; páginas servidas
desde disco) mostró la revisión completa. Resultado: 24 verificadas, 1 no verificable, 3 no encontradas, diff
«1 renombrado · 1 cambio de madurez», y el comando armado al decidir. Se borró: no queda nada en `propuestas/`.

**Pasada de capturas:** 16 rutas × 2 temas × 380 y 1280 = **64 encuadres, 2256 comprobaciones, 0 fallas**. El
arnés aprendió «Copiar» (lee el portapapeles) y Aprobar/Rechazar. **Suites:** unitarias 663/663 (cobertura
sobre los pisos, tras sumar las pruebas que faltaban en ramas de `src/lib`) · e2e 88/88. Lighthouse suma
`/es/investigador/plataforma-ejemplo` y `/en/investigador/databricks`.

### Lo que sigue (3c)
La corrida real: la persona escribe `/investigar fabric` en la sesión; el subagente propone; la propuesta
se sube; la persona la revisa en la pantalla del investigador y corre el comando de aprobación en una
terminal. **Parada B.**

**CI de `508176c`:** quality ✓ · e2e ✓ · diagramador ubuntu ✓ · macOS ✓ · Vercel ✓ · **lighthouse ✘**: LCP de
`/es` y `/en/atlas/plataforma-ejemplo` en 3082 y 3065 ms contra el presupuesto de 3000 (mediana de 3 corridas).
No se sube el presupuesto. Causa probable: la hoja global creció con los estilos del investigador (antes pasaba
con 8 rutas). **Arreglo:** estilos por ruta. La hoja del atlas baja de 32,8 a 27,0 KB (6,7 KB comprimida); la
del investigador (1,4 KB comprimida) y la de la animación del recorrido (0,2 KB) cargan solo en su página. Se
verifica en la CI del commit siguiente; si el LCP sigue al borde, el siguiente paso es aligerar el HTML del
nivel 1 (107 KB sin comprimir: SVG, leyenda y lectura van dos veces, en el HTML y en la carga de React).

**Punto de corte (2026-09-27):** el usuario pidió compactar. Estado: fase 3a y 3b construidas y subidas; falta
leer la CI de este arreglo y la corrida real (3c, parada B).

**CI de `11dca01`: lighthouse ✘ otra vez** (`/es/atlas/plataforma-ejemplo` 3071 ms; `/es/…/recorrido` 3078;
`/en/…/recorrido` 3069). **La hipótesis de la hoja de estilos era falsa.** Diagnóstico con Lighthouse local
(3 corridas por ruta, servidor propio en el puerto 3150: el 3000 lo tenía otra app de la máquina y la primera
medición, hecha contra ella, se descartó — regla 17-bis b). El elemento del LCP es el texto `p.guia`; el LCP
observado ocurre a los ~50 ms, y el simulado lo fija todo lo que se descarga antes de esa primera pintura:
~290 KB entre el JavaScript del framework, **el SDK de Sentry** y las dos fuentes (`display: block`, a
propósito). Sentry viajaba a todas las páginas **sin DSN**, por el `import * as Sentry` estático del kit
(el chunk grande pesaba 466 KB, 147 KB comprimido).

| Intento | Efecto (mediana local, nivel 1) | Queda |
|---|---|---|
| CSS dentro del HTML (`experimental.inlineCss`) | FCP −100 ms, LCP igual; el HTML crece a 161 KB | revertido |
| Fuente mono sin precarga | CLS 0,09 (el límite es 0,1) y corridas inestables | revertido |
| **Sentry con `import()` dinámico** en `instrumentation-client.ts` y `observability.ts` | inicio 2785 → 2614 · nivel 1 2940 → 2765 · recorrido 2935 → 2612 · investigador 2464 | **adoptado** |

Sin DSN el SDK ya no se descarga; con DSN llega en un chunk aparte, después de pintar. Lo que queda antes de la
primera pintura es el piso del framework (≈ 140 KB) y las fuentes. La CI mide ~130 ms más que la máquina local:
el nivel 1 debería quedar en ~2900, **con un margen de ~100 ms, que es delgado.** Si otra página lo gasta, la
siguiente palanca es el HTML del nivel 1 (SVG, leyenda y lectura van dos veces: en el HTML y en la carga de
React). Los estilos por ruta de `11dca01` se quedan: no dañan y cada página carga menos CSS.

**CI de `6d92d09`:** quality ✓ · e2e ✓ · lighthouse ✓ · diagramador ubuntu ✓ · macOS ✓ · Vercel ✓ — los seis en
`success` propio. El rojo de `508176c` y `11dca01` quedó pagado sin tocar el presupuesto.

### 3c — Primera corrida de `/investigar fabric` (2026-09-27)

**La corrida.** La persona escribió `/investigar fabric`. El subagente propuso 19 componentes y 19 flujos en 7
bloques, un recorrido con rama paralela y **80 afirmaciones** (una por componente y por flujo, más una de madurez por
componente). El validador pasó al primer intento. **80/80 citas verificadas** contra la página cruda: seis se
corrigieron en la misma corrida (un enlace pegado a la puntuación). El registro de fuentes tiene 35 consultas:
24 a la documentación oficial, 5 a la web del fabricante, 1 al blog (403), 1 al foro y 4 búsquedas. **Ningún
identificador del usuario** en el registro ni en la propuesta: el correo y el nombre de git, el usuario, el host y la
palabra «session» dan 0 coincidencias.

**El ensayo antes de pedir la revisión.** Apliqué la propuesta entera sobre una copia temporal de `data/`, con las
mismas funciones de la aprobación (sin correr el script de aprobación: lo tiene bloqueado toda sesión de agente), y
dibujé las tres vistas. `cargarDatos` pasó, **pero el build habría fallado**: `vistas.ts` rechaza un dibujo con
avisos, y había 8 distintos.

| Aviso | De quién | Arreglo |
|---|---|---|
| «Almacenamiento» no cabe en 104 u (nombre de bloque, es) | dato | lo corrige el investigador |
| «Etiquetas de confidencialidad (Microsoft Purview)»: 4 líneas en una ficha de 2 (es; 3 en en) | dato | lo corrige el investigador |
| carril exprés: 3 saltos (nivel 1) y 4 (nivel 2) en 2 pistas | motor | D-S1-23 corregido: sin aviso |
| canal 2: más de 6 pistas (nivel 2) | motor | D-S1-40 |
| dos etiquetas de modos encimadas (nivel 2) | motor | D-S1-41 |
| una referencia de la franja de orquestación fuera del lienzo | motor | D-S1-42 |
| (visto al mirar la imagen, sin aviso) una etiqueta de salto a 202 u de su línea (nivel 1) | motor | D-S1-43 |

**Hueco de proceso (¿puede fallar?):** el ensayo de la aprobación cargaba los datos pero no dibujaba, y el validador
del investigador tampoco. La propuesta pasaba los dos y habría roto el build al aprobarse. **Gate nuevo:**
`src/lib/investigador/dibujo.ts` dibuja el nivel 1, el nivel 2 y cada recorrido, y lo usan `validarPropuesta`
(validador del investigador y pantalla de revisión) y `aprobar` (sobre lo que queda tras las decisiones).

| Gate | ¿Puede fallar? | Rojo | A quién nombró | Verde |
|---|---|---|---|---|
| Dibujo en validar y aprobar (`nucleo.test.ts`) | Sí | la función devuelve `[]` | «falla con ruta y motivo…» y «si lo que queda no se dibuja…» | 63/63 |
| Dibujo en vivo | Sí | `validar.mjs` sobre la propuesta real | `dibujo · nivel-1 · nombre de almacen (es)…` y las dos de la ficha | — (es el dato) |
| P1 sin avisos en 3 vistas + 7 pistas parejas (`densidad.test.ts`) | Sí | el motor anterior (`git stash` de `src/`) | nivel-1, nivel-2, recorrido y «7 pistas» | 9/9 |
| Alternativa de etiqueta | Sí | sin alternativas | nivel-2 y recorrido: `etiqueta f-flujos-visuales-almacen-sql: queda encima…` | 11/11 |
| Aire de la fila de referencias | Sí | sin achicarlo | nivel-2, recorrido y «tres referencias largas…» | 11/11 |
| Pase de derecha a izquierda | Sí (primero **no**: con nombres cortos la carnada nunca llenaba la fila; se alargaron dos nombres hasta una fila tan justa como la real, y se sumó el caso «apiñadas bajo las últimas columnas») | solo se corre la última | «apiñadas bajo las últimas columnas» | 11/11 |
| Etiqueta sobre su trazo (todos los mapas del contrato y P1) | Sí | la regla vieja del nivel 1 | `P1 · nivel-1`: «etiqueta origen.almacen: a 202 u de su trazo» | 33/33 |

Los golden files **no cambiaron** (todos los cambios solo actúan donde antes había aviso). El único aviso declarado
del paquete (`prueba-arquitectura-app`, 3 saltos) desapareció: ahora ningún mapa del contrato da avisos.

**Imagen.** Fabric con los dos nombres acortados a mano (solo en el ensayo; el dato lo corrige el investigador),
leído como imagen: el nivel 1 queda limpio; el nivel 2 queda denso pero legible (7 pistas en el canal de
almacenamiento a procesamiento, 4 pistas en el carril exprés, la fila de orquestación justa).

**La skill** aprende a retomar una propuesta sin aprobar (corrige solo lo que el validador diga y vuelve a verificar)
y a leer las fallas `dibujo · …` (nombre más corto que diga lo mismo, en los dos idiomas; jamás quitar el
componente).

**La propuesta se sube como está** (`propuestas/2026-09-27-fabric/` + el registro de fuentes): es la primera corrida
del piloto y su pantalla de revisión dice que no se puede aprobar hasta corregirla. La segunda corrida la reemplaza
en la misma carpeta, y el diff de git mostrará qué cambió.

**Suites:** unitarias 697/697 · paquete 436/436 (golden files intactos) · capturas 64 encuadres, 2256 comprobaciones,
0 fallas.

**Lo que sigue:** la persona corre `/investigar fabric` otra vez. Después: revisión afirmación por afirmación y
aprobación en una terminal (parada B).

**CI de `6cfeab0`** (con `1626780`): quality ✓ · e2e ✓ · lighthouse ✓ · diagramador ubuntu ✓ · macOS ✓ · Vercel ✓, los
seis en `success` propio. El paquete corre en Linux y macOS con la carnada P1 y la invariante nueva.

**Segunda corrida (retoma, 2026-09-27):** la skill retomó la propuesta sin volver a investigar. Cambios, según el diff
de git: el bloque de almacenamiento en español pasó a «Guardado en OneLake», y la ficha de etiquetas quedó como
«Etiquetas de confidencialidad» / «Sensitivity labels» (Purview sigue en el texto de experto); `reintentos: 1`. Las
80/80 citas se volvieron a verificar y el registro de fuentes no cambió: no hubo consultas web nuevas. El ensayo de la
aprobación completa, que dibuja las tres vistas en los dos idiomas, dio 0 avisos y D11 = 0. Queda lista para la
revisión humana.

### Parada B — Fabric aprobado por una persona (2026-09-28)

La persona abrió la pantalla de revisión en su navegador (servida en local), confirmó «Si la veo», dejó las 80
afirmaciones aprobadas («Listo aprobadas y pulse copiar») y corrió el comando en su Terminal, en la carpeta del
proyecto. Pegó la salida:

`aprobar: fabric aprobada · mapa v0.1.0 · 19 componentes · 19 flujos · 80 aprobadas · 0 rechazadas → data/mapas/fabric.mapa.yaml`

(El primer intento falló por el pegado, `ode: command not found`; no escribió nada.) El script escribió
`data/mapas/fabric.mapa.yaml` (cabecera «APROBADO por una persona»), `estado: publicada` en
`data/plataformas/fabric.yaml` y una línea en `data/revisiones/fabric.jsonl` con la huella del mapa. **La fecha de
aprobación es 2026-09-29**: el script usa la fecha UTC, y en la hora local de la persona todavía era el 28.

**Después de publicar.**
- `rutaAtlas` (la primera plataforma publicada por id) pasa a ser `fabric`. El e2e «la barra y la portada llevan al
  atlas» esperaba `plataforma-ejemplo` y se ajustó a la regla, con un comentario.
- `datos.test.ts` usaba Fabric como ejemplo de «publicada sin mapa»; ahora usa Databricks.
- `lighthouse-urls.json` suma `/es/atlas/fabric`, `/en/atlas/fabric/componentes` y `/es/atlas/fabric/recorrido`
  (13 URL). Lighthouse local, mediana de 3: nivel 1 2763 ms, nivel 2 2761, recorrido 2612; las cuatro categorías
  ≥ 0,96.

**Pasada de capturas:** 22 rutas, **88 encuadres, 4120 comprobaciones de interacción, 0 fallas**. Leídos como imagen:
Fabric en el nivel 1 (oscuro, 1280), el nivel 2 (claro, 1280), el recorrido (oscuro, 380) y el investigador con
«Aprobada por una persona». **Suites:** unitarias 697/697 · e2e 88/88.

**CI de `e22cbc9`** (Fabric publicado): quality ✓ · e2e ✓ · lighthouse ✓ (13 URL, con las tres de Fabric) ·
diagramador ubuntu ✓ · macOS ✓ · Vercel ✓, los seis en `success` propio. Queda el cierre de la fase 3: la mirada
del atlas de Fabric y el «continúa».

### Mirada del atlas de Fabric y pedido del usuario (2026-09-29)

La persona abrió el atlas de Fabric en su navegador y respondió: «Sí, el mapa se entiende». Sobre «Componentes»:
«la visual de componentes muy muy buena», y sobre «Recorrido de un dato»: «ni qué decir… una pantalla lateral
derecha que cuenta el detalle, muy muy chévere». **Pedido (estado nuevo, mirada de FORMA):** en la visión general,
al tocar un bloque, en lugar de la ficha breve en texto, «una ventana pequeña que sale del bloque y me muestra sus
componentes con el mismo formato visual, y cómo interactúan si interactúan (línea que las conecta o son
independientes); debajo el texto, ojalá en bloques rectangulares con toda la información». Con su «continúa»
se cierra la fase 3 y la ventana entra primero en la fase 4.

### Fase 4 · 1 — La ventana de un bloque (nivel 1)

- **Motor** (D-S1-44, D-S1-45): vista «bloque», `toBlockCards`, `modoSVG` (el trazo y el marcador de un modo,
  compartido con la leyenda: la leyenda quedó idéntica byte a byte) y `util/grupo.ts`.
- **App:** `vistaNivel1` trae `ventanas` (una por elemento activable: nombre y frase, dibujo del motor, tarjetas y
  el paso a «Componentes»). `PanelFicha` se generaliza (`objetivo`, `clave`): lateral desde 900 px, hoja modal en
  teléfono, foco al título, Esc y «Cerrar» devuelven el foco al bloque. La ficha breve en texto del nivel 1 se
  retira (`ControlLienzo` ya no la pinta; su CSS sale). Guía y pista del nivel 1 en los dos idiomas: «Toca un
  bloque para ver sus componentes» / «Tap a block to see its components».
- **Un hallazgo en el camino:** el bloque de gobierno del mapa de ejemplo trae «Filtros por fila y
  enmascaramiento», un nodo de franja; con la tarjeta de capa la palabra no cabía (el build se negó). En «Componentes»
  ese nodo es una ficha compacta, así que la ventana usa la misma tarjeta que el nivel 2 le da.

| Gate | ¿Puede fallar? | Rojo | A quién nombró | Verde |
|---|---|---|---|---|
| Vista «bloque» en todos los mapas del contrato y P1 (`bloque.test.ts`) | Sí | sin ficha compacta en franjas | los grupos de franja de agente-ejemplo, agentes-ejemplo y plataforma-ejemplo | 58/58 |
| Tarjetas con todas sus conexiones | Sí | sin las que entran | «una tarjeta por componente…» y «cada conexión con el trazo…» | 58/58 |
| Canal centrado tras la ficha compacta | Sí | sin `centroCanal` | «en una franja, el canal va centrado…» | 58/58 |
| Etiqueta de un flujo en la misma columna, despegada | Sí | la regla vieja | el mismo caso: `etiqueta f-catalogo-auditoria: queda encima de la caja de catalogo-central` | 58/58 |
| Todo bloque que se toca tiene su ventana (`atlas.test.ts`, regla 22) | Sí | sin las ventanas de los grupos sin bloque | fabric y plataforma-ejemplo, en es y en | 19/19 |
| Ids propios por ventana | Sí | sin prefijo | «ids del SVG propios por ventana…» | 19/19 |

**e2e:** con teclado (Enter abre, el foco va al título, Esc cierra y devuelve el foco), dos componentes con su flujo
en «Tableros», el enlace a «Componentes», y en 380 px una hoja modal que cabe sin deslizar de lado; axe con la
ventana abierta en los dos temas. **Arnés:** la pasada de interacción abre la ventana de cada bloque (título, dibujo
y tarjetas) con clic y con Enter; la ficha breve sale del arnés. **Lighthouse local** del nivel 1 con las ventanas
(28 KB comprimido, como «Componentes»): mediana 2757 ms, igual que antes. **Suites:** unitarias 760/760 · paquete
494/494 (golden files intactos) · e2e 90/90 · capturas 88 encuadres, 4456 comprobaciones, 0 fallas.
