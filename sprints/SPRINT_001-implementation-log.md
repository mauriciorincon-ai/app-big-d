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
