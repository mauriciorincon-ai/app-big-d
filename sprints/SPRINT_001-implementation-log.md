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
