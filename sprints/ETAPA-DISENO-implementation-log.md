---
etapa: Etapa de Diseño (F2a)
app: big-d
branch: diseno/fundacion
opened: 2026-09-26
status: open
orden: ~/Code/hr01-develop-ai-apps/portafolio/big-d/ordenes/DISENO-orden.md
plan aprobado: 2026-09-26 (plan mode → «construye»)
---

# Etapa de Diseño — bitácora de implementación (Big-D)

> Cero código de producto hasta G-Diseño. Entregables: `design-system.md` ·
> `docs/diseno/diagramador-tokens.md` (propuesta para el CONTRATO v0.3.0) · maqueta navegable del
> H1 en `docs/diseno/` (11 pantallas + recorrido) desplegada en Vercel protegido ·
> `docs/diseno/README.md` con el registro de miradas.

## Plan de miradas (declarado en el plan, aprobado 2026-09-26)

| Mirada       | Artefacto(s)                                                                                                  | Estado    |
| ------------ | ------------------------------------------------------------------------------------------------------------- | --------- |
| 1            | `diagramador-tokens.md` + `atlas-nivel-1.html` ⭐ (+ `design-system.md` v0.1)                                 | pendiente |
| 2            | `design-system.md` completo + `kit.html` + `atlas-nivel-2.html` + `atlas-recorrido.html` + `lado-a-lado.html` | pendiente |
| 3            | `investigador.html` · `base.html` · `perfil.html` · `comparacion.html`                                        | pendiente |
| 4            | `decisiones.html` · `informe.html` · `instrumento.html` · `index.html`                                        | pendiente |
| 5 = G-Diseño | todo, desplegado, teléfono + desktop, ambos temas, ambos idiomas                                              | pendiente |

Regla: «continúa» no aprueba diseño; cada mirada se registra en `docs/diseno/README.md` ANTES del
siguiente artefacto; cambios a este plan se aprueban antes de construir.

## Decisiones de diseño que la orden no escribió (D1–D18 del plan aprobado + D19)

Ver el plan aprobado; resumen: D1 eje izquierda→derecha / arriba→abajo · D2 transversales abajo ·
D3 Orquestación transversal (con conmutador) · D4 una línea + chip de modos (con conmutador) ·
D5 Atkinson Hyperlegible Next + Mono · D6 UI monocroma, el color es de la gramática · D7 relleno
tintado + borde y glifo del matiz + texto en tinta · D8 paleta por búsqueda con umbral declarado ·
D9 semáforo en tinta · D10 modos = trazo + marcador en tinta · D11 geometría por reglas ·
D12 `nodos_por_banda_max: 6` · D13 recorrido sin matiz · D14 personalidad · D15 datos sintéticos
(N = 4 ficticias) · D16 despliegue por copia a `public/diseno/` · D17 `<span lang>` pareados ·
D18 sin URL en el README.

**D19 (nueva, Fase 0 — hallazgo medido):** Atkinson Hyperlegible Next y Mono **no traen** ✓ ✕ ▶ ⇉
→ β α (sí traen · • — « » ≤ ≥ ± ≈ −). Un carácter fuera de la fuente cae en la fuente de respaldo
del sistema: su ancho cambia entre navegadores (rompe G15 y el byte a byte de G1) y así entran los
emojis. **Decisión:** los símbolos de estado, madurez, recorrido y flecha se **dibujan como glifos
SVG propios** de la gramática, nunca como caracteres; los códigos de madurez que hoy usan «β» o
«✓» pasan a glifo + código latino. Gate: `maqueta-vocabulario` (todo carácter visible ∈ cobertura
de la fuente). Va a `diagramador-tokens.md` como propuesta al contrato.

## Fase 0 — Setup (2026-09-26)

- Branch `diseno/fundacion` desde `main` (9547230).
- **Despliegue (D16):** `scripts/copiar-maqueta.mjs` copia `docs/diseno/` → `public/diseno/`
  (solo html/css/js/woff2/svg/txt/json; declara el árbol y aborta si el destino sale de
  `public/`); `build` = `node scripts/copiar-maqueta.mjs && next build`; `public/diseno/` en
  `.gitignore`; `docs/diseno/**` y `public/diseno/**` en `globalIgnores` de ESLint.
- **Fuentes (D5):** Atkinson Hyperlegible Next y Mono, variables `wght` 200–800, bajadas del
  repositorio de Google Fonts (`ofl/atkinsonhyperlegible{next,mono}`), **licencia verificada en el
  paquete: SIL OFL 1.1** (`METADATA.pb: license: "OFL"`, `OFL.txt` copiado junto a cada archivo);
  convertidas a woff2 con fonttools en un entorno aislado del scratchpad (48 KB + 26 KB).
  `docs/diseno/assets/fuentes/cobertura.json` guarda la huella SHA-256 y los rangos de cmap.
- **Paleta (D8):** `scripts/paleta/color.mjs` (sRGB ↔ lineal, Machado 2009 en RGB lineal para
  protan/deutan/tritan 0,6 y 1,0, OKLab de Ottosson, ΔE_OK, contraste WCAG; sin dependencias) ·
  `scripts/paleta/buscar.mjs` (búsqueda determinista: 9 arranques en rejilla, descenso por
  coordenadas sobre matices cada 5°) · `scripts/paleta/generar-tokens.mjs` (OKLCH declarado →
  `docs/diseno/assets/tokens.{json,css}`). Exploración de croma y claridad:

  | Croma    | Claridad oscuro | Claridad claro  | Puntaje   | Peor normal | Peor 0,6  | Peor deutan 1,0 |
  | -------- | --------------- | --------------- | --------- | ----------- | --------- | --------------- |
  | 0,16     | 0,70 / 0,86     | 0,44 / 0,62     | 1,224     | 0,122       | 0,074     | 0,037           |
  | **0,13** | **0,70 / 0,86** | **0,44 / 0,62** | **1,196** | **0,123**   | **0,072** | **0,052**       |
  | 0,12     | 0,68 / 0,84     | 0,44 / 0,62     | 1,185     | 0,119       | 0,071     | 0,049           |
  | 0,14     | 0,68 / 0,84     | 0,42 / 0,62     | 1,148     | 0,118       | 0,069     | 0,036           |

  Elegida **0,13**: pierde 2 % de puntaje frente a 0,16 y quita el cian neón (#00f2d5) que chocaba
  con «sobrio». El puntaje es invariante a permutar colores entre tipos, así que la asignación es
  semántica: azul = datos que entran y reposan (almacenamiento hondo, ingesta claro) · verde-azulado
  = cómputo (transformación hondo, IA claro) · ocre = bordes de la plataforma (externo hondo,
  consumo claro) · rosa = lo transversal (gobierno hondo, operación claro).

- **Arnés de capturas** `scripts/capturar-maqueta.mjs` (versionado, sin capturas en el repo):
  página × estado × tema × idioma × ancho por `file://`; mide desplazamiento horizontal, texto SVG
  fuera del `viewBox`, texto que pisa una caja ajena (`data-dueno` / `data-caja`) y carga real de
  la fuente; `--simular` añade deuteranopía, protanopía, tritanopía y acromatopsia por CDP.
  Declara su árbol y aborta si una página sale de `docs/diseno/` o si `--salida` cae dentro del repo.

### Gates nuevos — demo en rojo en el MISMO commit (regla 15)

| Gate                                                    | ¿Puede fallar?                                                | Demo en rojo                                                    | A quién nombró                                                                           | Verde al revertir       |
| ------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------- |
| `tests/unit/paleta-diagramador.test.ts` (39 aserciones) | Sí: nada más mide color; el spike usó Okabe-Ito sin medir     | `tipo-1` claro = `#e69f00` (naranja del spike) en `tokens.json` | `trazo de tipo-1 … expected 2.089 ≥ 3` + deriva `tokens.json ≠ generador`                | ✓ 39/39                 |
| `tests/unit/maqueta-autocontenida.test.ts`              | Sí: ninguna regla previa lee HTML de `docs/`                  | `<script src="https://cdn.jsdelivr.net/…">` en `index.html`     | `docs/diseno/index.html:6 URL absoluta fuera de example.org` + `script fuera de assets/` | ✓                       |
| `tests/unit/maqueta-vocabulario.test.ts`                | Sí: ESLint ignora `docs/diseno/`; nada lee texto visible      | «casa del lago» y un «✓» como carácter en `index.html`          | `index.html «✓» U+2713` + `calco de «lakehouse»`                                         | ✓ 9/9 (con el anterior) |
| Medida de fuente del arnés                              | Sí: `fonts.check()` da verdadero con una cara fallida (visto) | `src` de la fuente a un archivo inexistente                     | `index__unico__claro__es__1280: la fuente no cargó`                                      | ✓ 0 fallas              |

### Barrido de cero enlaces (regla 17), tras el último `git add` de la Fase 0

`git grep -nE "vercel[.]app|workers[.]dev|pages[.]dev" -- ':!pnpm-lock.yaml'` → **1 línea, heredada
del estampado**: `CHANGELOG.md:179` (el changelog del kit cita el patrón en prosa sin clase de
carácter). No es una URL de despliegue y ya estaba en `main`; se deja como hallazgo para la
planeadora (el kit debería escribir `pages[.]dev` en su CHANGELOG). Cero líneas en lo que esta
etapa agrega.

### CI y última milla (PR #3, commit e3db45c)

- `gh pr checks 3`: `quality` ✓ 42 s · `e2e` ✓ 54 s · `lighthouse` ✓ 1 min 31 s · `Vercel` ✓ ·
  `Vercel Preview Comments` ✓ — conclusión propia `success` en cada uno; primera corrida de los
  tres gates nuevos en CI (dentro de `quality`, sin histórico previo).
- **Preview SIN sesión** (`curl`, dos direcciones: la del despliegue y la de la rama):
  `/diseno/index.html`, `/diseno/assets/tokens.css` y `/` → **302 al inicio de sesión de
  Vercel** en las seis combinaciones. La protección cubre la maqueta.
- **No verificado desde aquí:** el contenido de `/diseno/` CON sesión (la sesión no tiene
  credenciales de Vercel). La evidencia indirecta es el build local idéntico: `out/diseno/`
  contiene `index.html`, `assets/` y las fuentes. Lo confirma el usuario al abrir el preview.
