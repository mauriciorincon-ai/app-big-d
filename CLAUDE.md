# Big-D (app-big-d) — constitución de la app (Claude Code)

> Auto-cargado en cada sesión de este repo. Esta app pertenece al pipeline **AI-APPs**; su plan
> vive en la casa planeadora. Estampada desde kit-app **v1.29.0 con `--estatico`** el 2026-09-26.
> **Primera app del portafolio con especificación completa del usuario, primera con perfil
> exportado estático y PILOTO del primer reusable de la casa (el diagramador).** Nace con el
> pipeline completo desde el día 0 (Etapa de Diseño · dos filtros ⭐/⭐⭐ · cierre en dos actos ·
> cero enlaces · bilingüe integral). **Regenerada por la planeadora el 2026-10-04 con el kit v1.39.0 y el CONTRATO
> v0.6.0** (modo regenerar, método v1.39.0): reglas propias de la app (S1–S2: regla 4 reescrita, regla 2 con el comando
> de aprobación desde la pantalla, regla 7 en v0.6.0) + reglas del kit v1.34.0–v1.39.0 (reglas 24–27, build como el
> proveedor, bajadas forzadas, página guardada, PR en borrador con la línea del merge). La fase 0 del S3 la sincroniza;
> frase centinela: «lo que el proveedor publica no es lo que el build escribe». Sincronizaciones anteriores: 2026-10-01
> (CONTRATO v0.4.0), 2026-09-27 (S1, fase 0: Stack/IA + regla 7-S).**

## Las dos casas (regla dura)

| Casa | Path | Escritor único | Qué vive ahí |
|---|---|---|---|
| **Planeadora** | `~/Code/hr01-develop-ai-apps/` | su propia sesión | brief, sprints (plan+retro), órdenes de construcción, método, estándares |
| **Esta app** | este repo | **tú** | código, tests, ADRs de implementación, bitácora y summary del sprint |

- ✅ Puedes **leer** la planeadora (conexión fija vía `.claude/settings.local.json`, o por path absoluto).
- ❌ **Nunca escribes** en la planeadora. Si el plan necesita cambio, lo anotas en tu
  `sprints/SPRINT_NNN-implementation-log.md` bajo `## Desviación del plan` y avisas al usuario.
- El avance de implementación vive **solo aquí** — la planeadora te lee, tú no le reportas a mano.
- **El contrato del diagramador vive en la planeadora** (`reusables/diagramador/CONTRATO.md`); aquí
  vive su implementación (`packages/diagramador/`) y una **copia fijada** con huella. Tú propones
  enmiendas en el summary; la planeadora las aplica (G-Metodo) y sube la versión.

## Qué es esta app

**Big-D** (= *Bigdata*) — *«Elige tu plataforma de datos con evidencia fechada, robustez visible y
un plan para no arrepentirte — y entiende todas con el mismo mapa.»* Un planeador **abierto y
reproducible** para decidir entre plataformas de datos (hoy Databricks, Microsoft Fabric y
Snowflake; **N por diseño**). Primero, un **atlas de arquitectura** que explica cada plataforma de
punta a punta con **una sola gramática visual** en tres niveles (líder · experto · recorrido de un
dato) y lado a lado. Después, un **núcleo determinista** que toma el caso (pesos, rangos,
restricciones), puntúa con evidencia fechada, mide robustez por simulación y puntos de inversión, y
convierte la comparación en **decisiones por reversibilidad, riesgos con prioridad de acción,
supuestos y plan de alistamiento**, en un informe reproducible. La única IA es el **investigador**
(`/investigar`, skill de Claude Code a demanda) que propone conocimiento con citas comprobadas; el
humano aprueba. Una **demo estática** vive dentro de hoja-de-vida (H2). **Bilingüe ES/EN en todo.**
Contrato de alcance: `portafolio/big-d/VISION.md` (planeadora, aprobada 2026-09-26, v1.1.1 — 28
funcionalidades: 20 MVP personal · 2 MVP terceros · 6 roadmap; 5 propiedades ★ «lo que vende»).

**La tesis del producto:** los proyectos de plataformas de datos fracasan en la planeación
(decisiones implícitas, irreversibles tratadas como reversibles, elección por costumbre). Cadena:
**capacidad común → decisión que diverge → riesgo que genera.** Nadie tiene la comparación abierta
y reproducible con conocimiento de las plataformas, ni el atlas neutral (mercado F1, 113 fuentes).

## ⚠️ Reglas duras de esta app (producto, no estilo)

1. **EL NÚCLEO ES DETERMINISTA Y JAMÁS INVOCA UN MODELO DE LENGUAJE.** Puntajes, totales,
   sensibilidad, simulación, decisiones, riesgos, hoja de ruta, informe y diagramas salen de código
   puro: **aritmética entera** (pesos en centésimas), **sfc32 con semilla**, sin reloj (la fecha es
   una entrada), sin `Math.random`, sin funciones inexactas ni `Intl`/`toLocale*`. La misma entrada
   produce **los mismos bytes** en Node y en Chromium, Firefox y WebKit (huellas SHA-256 en CI,
   `ubuntu-latest` + macOS). El lint G2 del diagramador aplica también a `src/engine/`.
2. **LA IA PROPONE, EL HUMANO APRUEBA.** La única funcionalidad con IA es `/investigar <plataforma>
   [capa]`: una skill de Claude Code que escribe **propuestas** validadas por esquema (Zod) en
   `propuestas/`, con **cita textual por afirmación comprobada por código** (`curl` sobre la fuente
   cruda), en **ambos idiomas**; hooks registran cada fuente y bloquean escrituras fuera de
   `propuestas/`. Jamás aprueba, jamás corre sola, jamás en tiempo de ejecución. **El comando de aprobación
   sale SOLO de la pantalla de revisión** (CONTRATO § 12, S2-AUD-08): la pantalla lo arma con los ids de lo que la
   persona marcó; tú no lo redactas ni lo dejas copiado; si lo extraes del HTML compilado, verificas que los ids
   coinciden con la propuesta y avisas que no se pegue si desmarcó algo. Lleva **ADR «código
   primero»** (`decisions/PLANTILLA-ADR-codigo-primero.md`; borrador en la planeadora,
   `investigacion/2026-09-26-tecnica-nucleo.md` § 4) ANTES de existir. Ningún proveedor cableado: la
   independencia vive en el contrato de entrada/salida.
3. **PLANEA, GESTIONA Y CONTROLA; JAMÁS OPERA UNA PLATAFORMA.** Cero cuentas, cero credenciales,
   cero SDK ni llamada de red a Databricks, Fabric, Snowflake ni ninguna otra (lint que prohíbe sus
   paquetes y sus dominios en `src/`). No existe el campo `verificada_en_practica`; la «prueba
   barata» de un supuesto es una **tarea planificada para el equipo del caso**, no algo que la app
   ejecute.
4. **N PLATAFORMAS, JAMÁS TRES CABLEADAS.** Agregar una plataforma es agregar archivos de datos
   (RNF-06), nunca código. Un `3` literal, un arreglo `[a, b, c]` o un tipo con tres campos con
   nombre en el núcleo o en las vistas es hallazgo **Alto** (`/audita-sprint` casilla 6). La vista
   lado a lado muestra **tres a la vez en ancho** (`POR_PAGINA`, **constante declarada de la vista** que pagina
   más allá) y, en el teléfono, **una banda a la vez con TODAS las plataformas elegidas apiladas**; «Desplegar
   todo» abre los componentes dentro del mismo diagrama (M1/M2 del S2). La cuarta plataforma ficticia entra desde
   E1 como carnada.
5. **NEUTRALIDAD VERIFICABLE.** Ninguna plataforma tiene tratamiento especial en el código;
   **reordenar las plataformas no cambia ningún resultado** (test de propiedad, y demostración en la
   demo). **Sin logos ni íconos de fabricantes** (nombres comerciales en uso nominativo; glifos
   propios de la gramática). Cada fuente lleva `conflicto_de_interes`; el autor declara el suyo
   (domina Fabric) en el informe y la demo.
6. **EL CONOCIMIENTO ES DATO.** YAML 1.2, **un archivo por entidad**, Zod como fuente del esquema
   (→ JSON Schema); **una base incompleta falla al cargar** con campo e id (evidencia sin fuente,
   fecha de verificación, madurez o justificación ⇒ rechazo; jamás se completa por inferencia);
   solo participan evidencias `aprobadas`; instantáneas con SHA-256 sobre JSON canónico (RFC 8785);
   vigencia 30/60 días calculada contra la fecha de evaluación (informe) o de consulta (atlas y demo).
7. **EL DIAGRAMADOR ES UN REUSABLE DE LA CASA; ESTA APP ES SU PILOTO, NO SU DUEÑA.**
   `packages/diagramador/` **no importa nada de la app**, no contiene ningún nombre de plataforma ni
   de dominio (lint G3), lleva sus propias pruebas y cumple el `CONTRATO.md` **v0.6.0** (2026-10-04; el lock se renueva en la fase 0 del S3 y registra el commit de origen):
   garantías G1–G15, reglas D1–D15, validación G1–G7 y V1–V16 con `coverage`, **los 34 casos de
   carnada y los que nazcan**, avisos de geometría § 5.6 con **matriz de envejecimiento** (todo mapa a
   cuatro edades), cero flujos que atraviesen nodos (D11), texto dentro del lienzo a 380 px en una sola
   disposición horizontal con lienzo deslizable (G11), mapas de idioma `{es, en}`, serializador SVG
   propio (D8), `text-rendering: geometricPrecision` en la hoja (G15). Lleva
   `packages/diagramador/CONTRATO.lock` con la versión, el **commit de origen** (`origen: <sha>`) y la **huella
   SHA-256** de cada archivo copiado (`shasum -a 256`); `/cierre-sprint` la compara con la planeadora en ese commit. Arquitectura fijada por
   el spike y la investigación (P1): **colocación propia por bandas + ruteo ortogonal por canales**;
   ELK y dagre están **prohibidos** como motor de colocación (elkjs solo como plan B de ruteo, por
   ADR). Toda falla del diagramador se anota en el summary con síntoma y causa: va al registro de
   fallas del reusable con su regla y su carnada.
8. **EL VISUAL SE GENERA, NO SE DIBUJA.** Ningún SVG se edita a mano; si el dibujo está mal se
   corrige el dato o la regla. La maqueta de la Etapa de Diseño es **referencia** (la única vez que
   un diagrama se dibuja a mano) y el renderizador la reproduce con *golden files*, nunca al revés.
9. **TRAZABILIDAD TOTAL.** Cada puntaje se remonta a una o más evidencias; cada evidencia, a una
   fuente con fecha; cada tarea de la hoja de ruta y cada ítem de alistamiento, a la decisión, la
   mitigación o el supuesto que lo originó. **No se permiten ítems sin origen** (falla el esquema).
10. **INCERTIDUMBRE VISIBLE, SIN FALSA PRECISIÓN.** Empate técnico declarado; punto de inversión por
    fórmula; **SMAA** con muestreo uniforme sobre el politopo (jamás normalizar uniformes
    independientes); umbrales 70 % / 50 % / 5 puntos **declarados como convención** en el informe;
    riesgos con **tabla de prioridad de acción** (AIAG-VDA 2019), severidad primero, RPN solo como
    orden secundario; la narrativa del informe sale de **plantillas**, nunca de un modelo.
11. **RIGOR DE EXPERTO Y LENGUAJE DE LÍDER, VERIFICABLE.** Dos registros por componente (líder ·
    experto) sin contradicción; los textos de líder cumplen un **presupuesto por código** (≤ 50
    palabras o ≤ 95 sílabas, ≤ 1 término definido) y un **detector de jerga** (lista + frecuencia
    léxica) en **ambos idiomas**; siglas siempre explicadas. Lo que no pasa el gate no se publica.
12. **CERO DATOS REALES DE NINGUNA INSTITUCIÓN.** Repo público: el caso es un **hospital
    ficticio**, la cuarta plataforma es ficticia (fuentes `example.org`), las evidencias citan solo
    documentación pública de los fabricantes. Doble cinturón gitleaks.
13. **DALTONISMO LEVE DEL USUARIO (restricción de todas las apps):** el color **nunca** va solo —
    todo tipo de nodo = color + glifo + etiqueta; todo modo de flujo = estilo de línea + marcador;
    semáforo = símbolo + texto + días + color, sin reutilizar los tonos de capacidad; prueba en
    escala de grises y con simulación de daltonismo en **ambos temas**; tema oscuro primario, claro
    obligatorio e igual de cuidado (el usuario trabaja en oscuro: su ⭐ no cubre el claro).
14. **CERO ENLACES, con la excepción acotada registrada (F0 #11, gobernanza v1.3.0):** la app
    privada (atlas con investigador, casos, base) **no se publica**. La **demo** es un paquete
    estático con manifiesto de huellas que viaja a hoja-de-vida **por copia (PR de contenido)** y se
    muestra como página del proyecto; jamás como enlace a esta app. Solo contenido público por
    diseño; sin investigador; sin cuentas.

## Stack

- **Frontend:** Next.js 16.3 **exportado estático** (`output: "export"`, perfil `--estatico` del kit) +
  TypeScript strict + Tailwind + shadcn/ui; un HTML por ruta; el SVG del atlas se genera **en el
  build** y el núcleo corre también en el navegador (Web Worker para la simulación). Sin Server
  Actions, sin rutas dinámicas sin `generateStaticParams`, `images.unoptimized`.
- **Núcleo comparativo:** TypeScript puro en `src/engine/` — funciones puras, aritmética entera,
  sfc32, Kahn por ondas + DFS, tabla de prioridad de acción en datos; **corre igual en Node y en el
  navegador** (DA-01 A). Tests de propiedades con fast-check.
- **Diagramador:** `packages/diagramador/` (reusable; contrato en la planeadora). Colocación propia
  por bandas + ruteo por canales; serializador SVG propio; capa CSS de animación aparte; métricas
  de texto como tabla de una fuente libre versionada; mapas de idioma `{ es, en }`.
- **Datos:** `data/` — YAML 1.2, un archivo por entidad (plataformas · capacidades · criterios ·
  evidencias · casos · decisiones · riesgos · mapas · gramáticas), validados con Zod; instantáneas
  con huella. **Sin base de datos, sin Supabase, sin auth** (fuera de alcance § 2.2: sin
  multiusuario).
- **Investigador:** `.claude/skills/investigar/` + hooks; escribe en `propuestas/`; US$0 (suscripción
  del usuario). Adaptador por API = roadmap.
- **Backend/BD/Auth:** **NINGUNO** (adaptación declarada: el conocimiento son archivos versionados; no hay usuarios).
- **IA generativa: SOLO skills de Claude Code, operadas con la suscripción del usuario (decisión del
  usuario, 2026-09-26: «no quiero usar Groq teniéndote a ti»).** No existe adaptador de proveedores,
  no hay claves de API, no hay llamadas a Groq, Gemini, Azure ni a la API de Claude desde el código
  de la app. Toda funcionalidad que necesite un modelo de lenguaje (hoy el investigador `/investigar`;
  mañana el entrevistador, si entra) se implementa como skill en `.claude/skills/` que el usuario
  invoca en su sesión de Claude Code, con contrato de entrada/salida validado por esquema y hooks de
  registro. El patrón `ia-embebida` del kit aplica solo en su parte de contrato (Zod, guardrails,
  persistencia de propuestas), no en su cliente HTTP. Un `fetch` a un proveedor de modelos es
  hallazgo Crítico. **Aplica el apartado 7-S de los estándares (IA de construcción por suscripción,
  regla 21 del kit v1.30.0) en su forma más simple:** la skill corre **interactiva en la sesión del
  usuario**, con el binario oficial sin modificar; ningún lote, ningún `claude -p` automatizado, nada
  en CI; el token jamás sale del binario ni entra a variables de entorno, trazas o repo; **ADR de
  cumplimiento** con la lectura de los términos vigentes y re-lectura antes de cada release; la vía
  para terceros (si alguna vez) sería clave de API (roadmap D5, hoy no deseado).
- **Tests:** Vitest (unit/integration) + Playwright (e2e) + Testing Library + @axe-core/playwright.
- **Perfil ESCRITORIO (kit v1.27.0, si la app se estampó con `--escritorio`):** Tauri (Rust + webview
  React/TypeScript/Tailwind vía Vite); sin Supabase ni Vercel por defecto (backend solo por ADR);
  distribución como binario firmado; CI `quality · e2e · build-escritorio`; checklist `/release-check`.
  **Declaración obligatoria:** `captura_terceros: true|false` en la línea siguiente — si es `true`, la
  app capta audio/pantalla de personas distintas del usuario y le aplica el estándar 4-T (efímero
  verificable con `pnpm verify:ephemeral`, cero huellas de voz, bandera de jurisdicción).
  captura_terceros: false
- **Perfil EXPORTADO ESTÁTICO (kit v1.29.0, si la app se estampó con `--estatico`):** `next.config.ts`
  lleva `output: "export"`; no hay servidor: `pnpm start` sirve `out/` con `serve` (versión exacta)
  y así Lighthouse y Playwright corren igual que en el perfil web. Sin Server Actions, sin rutas
  dinámicas sin `generateStaticParams`, sin `next/image` con el loader por defecto (`unoptimized`).
  **La CI construye COMO EL PROVEEDOR (kit v1.39.0; aquí desde el S2, S2-AUD-32):** el job `quality` hace `vercel
  build` sin conexión con el adapter de Next y exige que cada página de `.next/output/static/` (lo que Vercel publica)
  sea idéntica a la de `out/`; **todo paso posterior al build (la CSP por meta, huellas) escribe en las dos carpetas**.
  El script del kit `scripts/build-como-proveedor.mjs` reemplaza al paso a mano del S2 en la fase 0 del S3.
- **Deploy:** Vercel Hobby sirve el export (preview por PR, prod desde `main`, **protección de
  deployment: la app privada NO es pública** — Vercel Authentication en producción Y previews; la
  única superficie pública es la demo dentro de hoja-de-vida). **Observabilidad:** Sentry client-only
  metadata-only del kit (inerte sin DSN); sin backend no hay Pino en servidor.
- **Idioma de la UI y del dato:** español e inglés desde el S1 (regla 20).
  **Sentry viene cableado client-only y metadata-only desde el kit (v1.2.1, validado ×2):**
  `instrumentation-client.ts` (inerte sin `NEXT_PUBLIC_SENTRY_DSN`) + `src/lib/observability.ts`
  (`reportError`: solo tipos + metadatos, jamás mensajes crudos ni contenido del usuario). La DSN
  va en `.env.local`/Vercel (ver `.env.example`). El server-side entra con backend, por ADR.

## Estructura

```
src/
├─ app/            (App Router)
├─ components/     (UI sin lógica de negocio)
├─ engine/         (motores puros, sin side-effects, cobertura >80%)
├─ lib/            (utils, dominio)
│  └─ ia/          (patrón IA-embebida: schemas.ts · client.ts · guardrails.ts · persist.ts)
└─ types/
tests/{unit,integration,e2e}/
design-system.md          (fuente de verdad visual — se crea en el sprint 1, skill diseno-ui)
design-sync/              (bundle publicable a Claude Design — VERSIONADO; project.json + styles.css
                           + components/<grupo>/<tarjeta>.html. Nace en el primer sprint que publique)
docs/MANUAL-DE-USO.md     (manual de uso general — OBLIGATORIO, vivo desde el sprint 1)
sprints/SPRINT_NNN-implementation-log.md · SPRINT_NNN-summary.md
decisions/NNN-titulo.md   (ADRs de implementación)
```

## Reglas de desarrollo

1. **TypeScript strict.** Sin `any` ni `@ts-ignore` sin justificación en comentario.
2. **Tests con cada feature.** Motores puros >80%, UI >50%, ≥1 e2e por feature core.
   **Al escribir los PRIMEROS tests (S1): añade `--coverage` al script `test`** — sin el flag los
   umbrales del `vitest.config.ts` no se aplican en CI (el estampado lo omite para que la CI del
   commit inicial quede verde sin tests). Directorios **generados** (`coverage/`, assets copiados
   a `public/` tipo `public/pyodide/`) van a los `globalIgnores` de `eslint.config.mjs`.
3. **Motor separado de UI.** Lógica pura en `engine/`/`lib/`; componentes sin lógica de negocio.
4. **Toda salida de LLM que se persista pasa por esquema Zod** (skill `ia-embebida`) — nunca texto
   libre directo a la BD.
5. **A11y desde el inicio:** tabindex, aria-labels, contraste AA, `prefers-reduced-motion`.
   **Y dos reglas que nacen de reincidencias (kit v1.26.0):** (a) **la FORMA del árbol jamás
   depende de `useReducedMotion()`** — el hook vale `null` en el servidor y `true` en el
   navegador con «reducir movimiento»; si decide QUÉ elementos se pintan, el HTML del servidor
   y el primer render del cliente no coinciden (React #418) y la página se regenera entera
   justo para quien el cinturón quiere cuidar. Reduced motion cambia PROPIEDADES (initial,
   variants, transition) o lo hace el CSS; dos gates: test unitario «mismo HTML con `null` /
   `true` / `false`» sobre cada componente de motion + axe bajo emulación de reduced-motion
   (patrón `wiki/patterns/reduced-motion-sin-ramificar-el-arbol.md` de la planeadora).
   (b) **Los tokens de tinta VETADOS como texto se declaran en `design-system.md` y FALLAN en
   lint/test, no en axe al final** (p. ej. `ink-3`, que no alcanza AA sobre superficie): un
   barrido de clases prohibidas sobre `src/` que corre con `pnpm lint`/`pnpm test` — la
   segunda reincidencia en una misma app (hoja-de-vida S6 y post-S7) fue la señal.
6. **Commits convencionales**; branch `sprint-NNN/<tema>`; **jamás push directo a `main`** (hook lo
   bloquea); PR con CI verde + preview probado. La ruleset `main-protegida` exige los checks
   `quality`/`e2e`/`lighthouse` **desde el estampado** (regla 2026-07-10 — protección GitHub no
   negociable, repo público); **si un sprint añade un job de CI (p. ej. `integration`), se añade
   a la ruleset en el mismo sprint** (`gh api` o Settings → Rules).
7. **Secrets solo en `.env.local` (gitignored) y Vercel env vars.** Doble protección gitleaks:
   hook `pre-commit` de git (`githooks/`, cubre commits manuales) + hook PreToolUse de Claude
   Code (cubre escrituras del agente). El hook nace ejecutable (100755) y `core.hooksPath` se
   re-aplica en cada `pnpm install` (script `prepare` — K12); si un commit con secreto de prueba
   NO es bloqueado, el gate está muerto — repáralo antes de seguir. **Carnada canónica verificada
   (kit v1.6.3; desde v1.7.3 viaja PARTIDA aquí para no disparar el hook al comitear este
   archivo): ármala concatenando `AWS_ACCESS_KEY_ID=` + `AKIAQ7RTZ4PX` + `KM2WNB3S` SOLO en el
   archivo de prueba del hook** — no improvises el secreto de prueba:
   las reglas modernas de gitleaks exigen alfabeto real (base32 tras `AKIA`) y entropía, y una
   carnada floja pasa en silencio dando falsa tranquilidad (lección 2026-07-15: dos falsos "todo
   bien" seguidos). Si gitleaks sube de versión mayor, re-verificar la carnada en sandbox antes
   de confiar en ella.
8. **Presupuesto de esfuerzo:** ~12 pasos por pantalla; si lo excedes, detente y simplifica o consulta.
9. **Manual de uso vivo (`docs/MANUAL-DE-USO.md`, obligatorio).** Toda feature que llegue a `main`
   queda documentada ahí **en el mismo sprint**: qué hace, cómo se usa (pasos para el usuario final,
   no para el dev), capturas o rutas de pantalla, y limitaciones conocidas. En español llano. Es el
   documento que permite a cualquier persona conocer las features principales de la app sin leer
   código — al lanzar (F5) se convierte en la base de la guía de usuario pública.
10. **El diseño va ANTES del código — Etapa de Diseño con gate G-Diseño (kit v1.14.0, método
   v1.14.0 F2a).** Si este repo acaba de estamparse: **tu primer trabajo NO es construir — es
   diseñar**. La planeadora emite una **orden de diseño** (`ordenes/DISENO-orden.md`); en branch
   `diseno/fundacion` produces (1) el **`design-system.md` completo** (tokens ambos temas,
   personalidad, componentes canon, motion + reduced-motion, anti-patrones) y (2) la **maqueta
   navegable del H1 COMPLETO** en `docs/diseno/` — HTML autocontenido, una página por pantalla
   core con sus estados, mobile + desktop, ambos temas, **cero React y cero motores** — que se
   despliega en Vercel para que el usuario la recorra en sus dispositivos. Se trabaja en **sala
   de diseño** (rondas de propuesta → mirada del usuario → ajuste, sin presupuesto de pasos ni
   prisa; pasada de capturas desde la ronda 1). **CERO código de producto hasta que el usuario
   apruebe G-Diseño** (veredicto registrado en `docs/diseno/README.md`). Desde entonces, toda
   pantalla de producto **obedece la maqueta**: en el primer sprint con UI, DETENTE tras la
   primera pantalla construida y presenta capturas comparadas contra la maqueta (gate de
   FIDELIDAD, indiferible — no viaja con el ⭐). Claude Design sigue bajo demanda (convergencia
   trabada ≥2 rondas o exploración del usuario); `/design-sync` publica el sistema consolidado
   al cerrar cada ciclo. *(Apps estampadas ANTES de v1.14.0 y sin etapa: el gate del primer
   sprint con UI es de DIRECCIÓN — design-system + primera pantalla en capturas — igual de
   indiferible.)* Origen: Velo llegó a su S2 sin que el usuario viera un solo artefacto visual. Cada sprint con UI cierra con el **checklist de revisión de
   diseño** del skill `diseno-ui` + aprobación visual del usuario sobre la preview.
   **Claude Design — LA regla única (método v1.19.0, resuelve la contradicción que Velo S4
   destapó):** **durante el ciclo es BAJO DEMANDA** con sus dos disparadores escritos (el gate
   visual no converge · el usuario pide explorar pantallas) — jamás se crea proyecto por defecto
   al arrancar. **Al CERRAR el ciclo, la publicación del consolidado es OBLIGATORIA** con su
   razón declarada: costo en minutos (bundle `design-sync/` versionado, publicación incremental,
   destino en `project.json`), activo estable entre ciclos y base de toda exploración futura —
   **y SIEMPRE después del gate ⭐⭐ corto** (que incluye el juicio de diseño): jamás se publica
   un sistema que el usuario no ha juzgado. La invocación es del usuario (§ Cierre de CICLO); si
   decide no invocarla, el summary lo registra como decisión suya. Las órdenes CITAN esta regla,
   no la re-redactan.
   **El gate de MIRADA (kit v1.20.0, método v1.21.0 — para TODO artefacto visual, en la etapa
   de diseño Y en los sprints):** el gate de FASE es de proceso y se pasa con «continúa»; el
   gate de MIRADA es otro gate y **solo se pasa con evidencia de que el usuario VIO**: un
   comentario que delate el archivo abierto, o su **«lo abrí y apruebo»** textual.
   **«Continúa» JAMÁS aprueba diseño.** Mecánica obligatoria del mensaje — claridad ante todo:
   la **PRIMERA línea** es una pregunta simple en español llano + el lugar
   («**¿Apruebas el design system? Ábrelo aquí: docs/diseno/kit.html (doble clic)**») — sin
   jerga del método, sin códigos; el resumen técnico va DESPUÉS. Si el usuario responde solo
   la palabra de fase sin comentar el artefacto: **DETENTE y repregunta «¿qué viste al
   abrirlo?»** antes de construir encima — esa negativa es la demo en rojo de este gate.
   AskUserQuestion/previews ASCII **no sustituyen la mirada**: si preguntas por chat sobre un
   artefacto visual, pide la respuesta con el archivo abierto y dilo. **Y cuando la mirada exige leer el HTML del
   preview (una meta, una cabecera, un script; kit v1.39.0, método v1.41.0), la mecánica es la PÁGINA GUARDADA
   (Cmd+S) y buscar en el archivo**, nunca «ver código fuente»: en Safari Cmd+Opt+U no hace nada sin el menú de
   desarrollo y el primer «no» puede ser falso *(Big-D S2, P4)*. Cada mirada queda
   **registrada** (README de diseño o bitácora) ANTES de la construcción siguiente — la
   planeadora lo audita en G-Diseño y al cierre; sin registro, el cierre queda condicionado.
   **Y el PLAN de miradas —número, agrupación y ORDEN— es parte del gate (kit v1.21.0):**
   cualquier cambio (agrupar, reordenar, posponer) se propone y el usuario lo aprueba ANTES de
   construir el segundo artefacto — jamás sobre la marcha. Cada desvío reduce las oportunidades
   de ver (dash S1: B6 sobrevivió a la mirada agrupada; dash S2: las 3 pantallas se
   construyeron antes de la primera mirada — «ninguna pidió ajustes» fue suerte, no proceso).
   *(Origen: Dash Agent AI, Etapa de Diseño 2026-08-16 — 4/9 pantallas construidas sin una
   mirada real con todos los gates de palabra cumplidos; 3ª ocurrencia de la clase. Es la
   regla 15-hermana del lado humano: una mirada satisfecha sin mirada es un gate que nunca
   ejecutó.)*
   **Dos clases de mirada (kit v1.31.0, método v1.33.0):** la de **FORMA** (qué se construye:
   estado nuevo, pantalla, estructura) abre parada antes de construir encima. La de **TEXTO**
   (si un copy se entiende) **no bloquea**: maquetas igual, registras «maquetado, no visto» y su
   veredicto viaja al gate humano del MVP; mientras, la vigilan los gates automáticos
   (diccionario fiel a la maqueta, fidelidad, maquetas que caben). Toda mirada va en **matriz
   de una fila** (archivo · botón/estado · qué mirar · respuesta esperada), nunca preguntas
   sueltas. **Las segundas vueltas no abren parada**: copy retocado por su propio veredicto y
   filas sin respuesta se aplican, se registran y se ven al cierre de fase. *(Angel Ghost S2:
   el usuario cortó las paradas de copy — «así no vamos a avanzar nada».)*
11. **Guía de prueba viva y ACUMULATIVA (`docs/GUIA-DE-PRUEBA.html`, OBLIGATORIA en todo sprint
   con UI — reglas duras del pipeline, G-Metodo 2026-07-12 ×2).** HTML visual y **AUTOCONTENIDO**
   (cero CDNs; casillas con `localStorage` bajo **prefijo versionado por sprint** — cambia en
   cada versión de la guía para que una regresión sin correr jamás aparezca marcada por el sprint
   anterior): **qué probar, cómo y qué resultado esperar**, por bloques. **Es bola de nieve:** la
   última versión contiene **TODAS las pruebas vigentes** de la app; el sprint N hereda ENTERAS
   las del N−1 — no las resume ni las comprime en un "verificar que sigue funcionando" (comprimir
   borra la regresión). Cada prueba lleva su **origen visible en su línea**: `Nuevo · SN` ·
   `Mejorado en SN` (hay que volver a mirarla) · `SN` a secas (heredada sin cambios ⇒ regresión),
   con **filtros por origen**. Una prueba solo se elimina cuando su feature dejó de existir, y se
   declara en el historial del pie. Y trae **DOS filtros de gate desde el sprint 1 (kit
   v1.18.0)**:
   - **⭐ Gate mínimo** — SOLO lo que ninguna automatización puede verificar (hardware/micrófono/
     voz reales, juicio humano sobre contenido, aprobación visual) MÁS la re-verificación de
     confianza que el usuario quiera hacer con sus manos aunque el CI ya la cubra. **Se OFRECE.**
   - **⭐⭐ Gate corto** — el subconjunto cuyo veredicto **solo puede ser humano**, con techo
     declarado (**~20 min**). Regla de selección: **si el CI lo verifica por otro camino, NO
     entra** — aunque viva en el ⭐ por buenas razones de confianza. Es un **recorrido caminable**
     (paradas «N de M» en el orden del documento, comprobando que la secuencia se camina),
     **declara cuántas ⭐ deja fuera y por qué** (ninguna se borra — un gate que se encoge sin
     decirlo se lee como «esto es todo lo que había»), y no mueve los conteos de los otros
     filtros: añade una lente, no reparte. **Es el que el cierre de ciclo EXIGE.** *(Origen: Velo
     llegó al cierre con 26 ⭐ / 90 min y el gate se aplazó indefinidamente — no falló el gate,
     falló su tamaño; con varias apps en curso, todo-o-nada pierde contra nada.)*
   La guía dice cuántas pruebas son y cuánto toman, en ambos gates. **Kit de prueba:** si un paso —o
   la app misma— requiere documento, código o dataset de prueba, se entrega en el repo
   (`docs/kit-de-prueba/`) enlazado desde su bloque, siempre que se pueda (precedente: los
   datasets de ds). Doble propósito: gate de prueba del usuario + entregable a usuarios finales.
   Plantilla base: la que estampa el kit (v1.6.0). **Implementación de referencia:
   `app-habla/docs/GUIA-DE-PRUEBA.html` (S2)** — 81 chips de origen, gate mínimo ⭐ de 14
   pruebas/~25 min con filtro, namespace versionado, historial de eliminaciones.
12. **PROHIBIDO entregar por artifacts de Claude o cualquier plataforma externa** (regla dura del
   pipeline, G-Metodo 2026-07-12). **Todo entregable** —guías, reportes, documentos visuales,
   resúmenes— es un **ARCHIVO DEL REPO** (HTML autocontenido o Markdown) que el usuario pueda
   **abrir, versionar y llevarse**. Sin excepciones, ni "para verlo rápido". Si algo merece
   mostrarse visualmente, se escribe como archivo y se entrega su ruta.
13. **Brochure vivo (`docs/BROCHURE.html` + ruta pública `/conoce` — molde v2, kit v1.10.0,
   informe del piloto habla 2026-08-08).** El entregable de PRESENTACIÓN de la app para
   usuarios finales y clientes — el anti-manual. **Tiene DOS estados (kit v1.19.0, método
   v1.20.0):** nace como **BROCHURE INICIAL** en el cierre DE CONSTRUCCIÓN del ciclo (declara
   visiblemente que es inicial y que se sella con las pruebas) y pasa a **BROCHURE SELLADO
   (MVP)** en el cierre DE PRUEBAS (tras el gate ⭐⭐ + correcciones). El sello NO lo congela:
   **todo sprint posterior que cambie features lo ajusta EN EL MISMO SPRINT** (DoD). Y junto al
   HTML se produce el **export estructurado `docs/brochure-export.json`** (schema versionado:
   tagline, intro, funcionalidades con el conteo del MANUAL, métricas reales, stack) — es lo que
   la vitrina de hoja-de-vida consume, anclado a versión, para re-expresarlo en SU design system.
   **REGLA CERO: el brochure NO se estampa, se
   PRODUCE** — antes de una línea de HTML, un **storyboard aprobado por el usuario** («guion
   aprobado»): escenas con mensaje/gramática/técnica justificada, **clímax explícito** (la
   promesa mayor de la app tiene escena propia, JAMÁS un acordeón del pie), ritmo, variante
   reduced-motion POR escena, dial `MOTION_INTENSITY` fijado con el usuario, identidad en una
   frase y un riesgo registrado. Las gramáticas se ejecutan con el **banco de técnicas en
   vanilla** (`docs/BROCHURE-banco-de-tecnicas.md` — sin recetas, "G3" degenera en fundido:
   el piloto lo demostró con un rechazo). Estructura de 4 capas + regla de conteo con **tabla
   de mapeo en el summary** (feature → sección del manual → tarjeta; el brochure no se
   documenta a sí mismo). Solo `transform`/`opacity` (excepciones DECLARADAS en storyboard y
   código) + presupuesto de recorrido móvil (~1 pantalla extra). A11y estructural:
   `<h3><button>` canónico · lo cerrado FUERA del árbol de accesibilidad (`visibility` en la
   transición; axe no lo ve — e2e por CDP) · LCP jamás nace de `opacity: 0`. **Gates que la
   CI no ve** (en el piloto la CI estuvo VERDE con un entregable RECHAZADO): pasada de
   capturas por bloque leídas como imagen (cuadro a cuadro en animaciones) antes de presentar
   · sala de proyección como proceso (fidelidad al producto real es criterio) · **e2e
   obligatorio de reduced-motion** (visibilidad real de elementos clave) · lo medible se
   corrige MIDIENDO contra la versión anterior · **última milla: el link de producción se
   prueba SIN sesión** y dominio + protección de deployment van al BLUEPRINT. Doble vida
   (ruta + archivo), vivo por sprint, iconos y señas del design system de la app (jamás
   emojis si el DS los prohíbe), cero datos personales. Fuentes: MANUAL-DE-USO + VISION (RO)
   + guías de prueba. Referencia: `app-habla/docs/BROCHURE.html` + su storyboard.
14. **Código primero, IA generativa después (regla dura del pipeline, G-Metodo 2026-07-12).**
   Esta app es una integración sólida entre IA y código, pero **toda funcionalidad nativa
   interna se resuelve PRIMERO con programación** — código, librerías, algoritmos deterministas —
   **antes de cualquier intención de acudir a IA generativa** (APIs o cualquier tipo de
   conexión). Activar una feature LLM exige un **ADR "código primero"** que justifique por qué
   el código y las librerías no alcanzan. La IA es acento con fallback determinista, jamás
   columna vertebral.
15. **Un gate se demuestra FALLANDO (regla dura del pipeline, G-Metodo 2026-08-10).** Todo gate
   nuevo que este repo agregue —job de CI, hook, aserción, umbral, script de verificación— nace
   con su **demo**: un cambio deliberado que lo pone en **rojo**, con el resultado (rojo → verde
   al revertir, y a quién nombró el fallo) registrado en
   `sprints/SPRINT_NNN-implementation-log.md`. Cuesta cinco minutos y es **la única evidencia
   real de que el gate funciona**: un gate que nunca se vio fallar no es un gate, es decorado —
   y decorado que da falsa tranquilidad (precedente: dos "todo bien" seguidos de una carnada
   floja de gitleaks, 2026-07-15; contraprecedente que sí lo hizo: PR desechable con `openai`
   → anti-IA en rojo en 7 s, Velo S1). La demo puede ir en un **PR desechable** que se cierra
   sin mergear; se registra igual. Aplica también al **verificar un gate heredado** cuando un
   sprint depende de él por primera vez. **La demo se corre con `scripts/demo-rojo.sh` (kit
   v1.35.0):** mutación literal → gate (debe fallar) → restauración desde UNA carpeta de respaldo
   verificada con `grep` y `cmp` → gate restaurado (debe pasar); `--puerto` mata el server viejo
   por puerto y comprueba que no quede `EADDRINUSE`. Y la **tercera pregunta** antes de darla por
   hecha: *¿puede fallar siquiera?* — un test de determinismo sin un miembro con azar no puede
   *(ds S5: K-S5-8/10/11)*. **Endurecido en v1.38.0 (ds S6, AU-S6-12 y K-S6-2/4/5):** `--debe-nombrar`
   exige que el rojo venga de la aserción (un servidor que no arrancó o una mutación que no compila no
   son rojos); un exit 126/127 no cuenta como rojo; `--minimo-tests N` rechaza un verde que corrió menos
   de N pruebas (un filtro `-t` que no coincide sale 0); una interrupción restaura antes de salir; y la
   presencia/ausencia de la mutación se verifica con Python, también cuando `--buscar` tiene varias líneas.
   **Y su hermana (kit v1.16.0): un gate que nunca EJECUTÓ tampoco es un gate.** `skipped` no es
   verde: un job con `needs:` sobre otro que falló queda saltado y GitHub lo lista entre los
   checks requeridos **sin alarma**, así que una columna sin rojo se lee como aprobación. Antes de
   cerrar, **cada check requerido debe tener conclusión propia `success`** (`gh pr checks`), y si
   uno corrió por primera vez en este PR se dice en el summary — sin histórico **no puede
   afirmarse ni regresión ni no-regresión**. Las dos reglas cubren la misma ilusión por lados
   opuestos: *¿lo viste **fallar** cuando debía?* y *¿lo viste **correr**, alguna vez?*.
   **Y el tercer filo (kit v1.21.0): ¿lo viste correr EN EL MODO en que el usuario lo va a
   usar?** Todo modo/perfil de arranque (p. ej. `start:seguro`) corre EN VIVO al menos una vez
   antes de cerrar el sprint que lo introduce o lo toca — pasar sus tests no es haber corrido
   *(dash S2: el modo endurecido existió dos sprints sin arrancar jamás de verdad; y el índice
   world-readable solo apareció inspeccionando el proceso vivo)*. Detalle
   operativo en `/deploy-check` §11. *(Origen: ds S4 — el job `lighthouse` estuvo `skipped` las 12
   corridas de la rama; el gate de performance no corrió ni una vez en un ciclo de 4 sprints
   mientras el DoD lo daba por verde con corridas locales.)*
   **Y el rojo nace en el MISMO commit que introduce el gate (kit v1.25.0), no al final de la
   fase:** una demo diferida deja al gate viviendo «verde» sin haber medido nada, y todo lo
   construido mientras tanto se apoyó en él *(hoja-de-vida S5: el test de deriva cero pasaba en
   verde con el bug puesto — afirmaba «se llega al fondo», que el defecto también cumplía; solo
   la demo en rojo, exigida al cierre de la fase, reveló la prueba decorativa)*. La demo es parte
   de la definición del gate, no un trámite posterior.
   **Y la tercera pregunta (kit v1.26.0): ¿puede este gate FALLAR siquiera?** Antes de
   escribirlo, comprueba que existe un estado del repo que lo pondría en rojo y que ninguna
   regla anterior lo hace inalcanzable (un schema que ya rechaza el caso, un test que ya lo
   cubre, un build que ya rompe antes). Si no puede fallar, no es un gate: se retira y se
   anota cuál regla lo cubría *(hoja-de-vida S7: un gate nuevo resultó inalcanzable por una
   regla previa y solo se descubrió al exigirle el rojo)*. Las tres preguntas, juntas: ¿lo
   viste **fallar**? · ¿lo viste **correr**? · ¿**puede** fallar?
   **Y el MODO incluye el PERFIL DE COMPILACIÓN (kit v1.28.0):** un test que solo corre en
   `debug` no prueba `release`. Todo gate que dependa del comportamiento del binario (pánicos
   atrapados, optimizaciones, `panic = "abort"`, features de compilación) corre al menos una
   vez con el perfil con que la app se DISTRIBUYE, y el summary lo dice *(Angel Ghost S1: el
   `catch_unwind` que protegía el parseo de PDF pasaba todos sus tests en debug y era letra
   muerta en release, donde `panic = "abort"` lo anula)*.
   **Y `gh pr checks` DESPUÉS DE CADA PUSH (kit v1.31.0), no al cierre de la fase:** un rojo
   que nadie mira es un gate que no ejecutó para ti *(Angel Ghost S2: tres corridas en rojo sin
   mirar en una fase; desde entonces cada push termina leyendo sus checks)*. **Y una métrica
   del kit que la CI NO puede medir se declara `manual` con su corrida local registrada**, o
   no se declara: el WER vivió dos sprints «en CI» sin que el runner tuviera modelos de voz.
16. **El bundle publicable del design system es un ARTEFACTO DEL REPO (kit v1.17.0).** `design-sync/`
   se versiona aquí como **espejo 1:1** de lo publicado en Claude Design, y la jerarquía es fija:
   `design-system.md` (fuente de verdad) → `design-sync/` (bundle, deriva) → el proyecto remoto
   (vitrina, **jamás se edita allá**). **Todo sprint que toque UI actualiza el bundle en su MISMO
   PR** — son archivos del repo, entran a la revisión y los escanea gitleaks como a todo lo demás;
   publicar puede esperar al cierre de ciclo, y así el cierre es un delta pequeño y nunca una
   reconstrucción. El destino se **lee** de `design-sync/project.json`, no se busca. Procedimiento
   completo: `/design-sync`. *(Origen: en el cierre H1 de ds el bundle se construyó en el
   scratchpad efímero; al retomar días después quedaban **4 de 13 archivos** y hubo que
   reconstruirlo bajando del proyecto remoto uno por uno. Un entregable de ciclo que vive fuera del
   repo no tiene versión, ni diff, ni revisión, ni supervivencia.)*

17-bis. **LO QUE LA APP ESCRIBE TAMBIÉN ES SUPERFICIE (kit v1.21.0 — derivados y arneses).**
   Las capas de solo-lectura protegen a las fuentes DE LA APP; esta regla protege a los
   DERIVADOS de todo lo demás. **(a) Un derivado JAMÁS nace menos privado que su fuente:**
   índice, cache, config, reporte o log que descienda de datos privados nace con permisos
   restrictivos (700/600 o equivalente), con test que se demostró en rojo y reparación al
   abrir si ya existía mal *(origen: dash S2 Correctivo 001 — el índice nacía 644 con prompts
   reales; 531 tests verdes no lo vieron)*. **(b) Todo arnés que pueda tocar fuentes arranca
   demostrando contra qué árbol corre** (capturas, fixtures, seeds): declara su árbol al
   arrancar y ABORTA si alcanza datos reales sin confirmación explícita — comprobar, no
   recordar *(origen: un server viejo en el puerto hizo que la pasada de capturas fotografiara
   transcripts reales)*. `/deploy-check` §12 verifica ambas.

17. **CERO ENLACES: la producción se MUESTRA, jamás se ENTREGA (regla dura del pipeline, F0 #8
   2026-08-15 — kit v1.19.0).** Ningún archivo de este repo público ni campo de GitHub publica la
   URL de producción o de previews: ni el `README.md` (apunta al brochure/`/conoce` como
   CONTENIDO, jamás como link de acceso publicado), ni el campo About/website del repo, ni el
   `BLUEPRINT.html` (documenta dominio y protección como "qué ve quién sin sesión" **sin escribir
   la URL** — la URL exacta vive en la planeadora, que es privada), ni el manual, ni la guía
   (su campo de URL se llena EN USO, desde la orden), ni `package.json`. El CTA público de la app
   es la **«lista de espera»** — sin promesa de otorgamiento. **El campo homepage del repo APUNTA AL PROPIO
   REPO (kit v1.32.1; antes «limpieza recurrente», v1.22.0):** la GitHub App de Vercel reescribe
   el campo solo cuando está VACÍO — con cualquier valor puesto deja de tocarlo (experiencia del
   usuario en otra app y en planlang). El estampador lo fija al crear el repo (`gh repo edit
   --homepage <url del repo>`); se verifica una vez tras el primer deploy de producción y en
   `/deploy-check`. JAMÁS se automatiza con un PAT de administración como secret en un repo público. Y **los documentos
   que NARRAN el barrido escriben los patrones sin el literal** (clase de carácter, p. ej.
   `vercel[.]app`): un summary que cita el patrón tal cual rompe el grep y el gate deja de ser
   binario. **El comando del barrido corre sobre TODOS los archivos versionados** (kit
   v1.23.0): `git grep -nE "vercel[.]app|workers[.]dev|pages[.]dev" -- ':!pnpm-lock.yaml'` —
   jamás con include-list de extensiones (la URL de producción de Innmobiliaria vivía en
   `wrangler.jsonc` y pasó limpiamente un gate con `--include`); el patrón de dominios sale del
   STACK REAL de la app (súmale su host si difiere). **Y todo comando que sea un gate viaja
   ENTRE BACKTICKS y se prueba copiándolo del RENDER (kit v1.24.0):** sin backticks el
   markdown come las barras invertidas y entrega un grep que no encuentra nada nunca — un
   gate muerto que pasa en verde para siempre. `/deploy-check` lo verifica
   (casilla de enlaces). *Origen: la vitrina de hoja-de-vida muestra QUÉ construyó el usuario
   (brochure + ficha del repo), nunca POR DÓNDE entrar.*
   **El barrido corre sobre el árbol que se va a subir — DESPUÉS del último `git add` (kit
   v1.26.0) — y vale también para código y comentarios de tests:** un barrido temprano deja
   ciega la ventana entre él y el push (los artefactos de `.lighthouseci/` entraron así al PR
   del S5 de hoja-de-vida con seis falsos positivos), y el comentario de un spec que cita el
   dominio de preview es una fuga igual que una URL en el README.
   **El README de diseño registra «preview del PR #N», jamás la URL (kit v1.32.0):** el registro
   de G-Diseño identifica dónde se aprobó por el número del PR cuyo preview recorrió el usuario; la
   URL exacta vive en la planeadora.

18. **PRs de dependencias: máximo DOS abiertos y el lockfile NO se pelea (kit v1.24.0 — regla
   del usuario 2026-08-22).** dependabot con techo real de 2 (limit 1 por ecosistema, todo
   agrupado — el yml del kit lo trae). Se mergean **DE A UNO, dejando a dependabot REGENERAR**
   entre merges (`@dependabot rebase` puede no obedecer, y el hand-merge del lockfile le rompe
   el parser: cerró un PR solo y abrió otro). Si un conflicto de lockfile TOCA resolverse a
   mano: la resolución **parte del lado que trae los bumps** y se verifica dependencia por
   dependencia que quedó la versión MÁS NUEVA de ambos lados — pnpm degrada en silencio y la
   CI pasa VERDE porque **ninguna puerta compara el resultado contra la INTENCIÓN del PR**:
   leer la salida del install ES el gate. `pnpm peers check` corre en quality (es lo único que
   ve un peer insatisfecho). Overrides: en `pnpm-workspace.yaml`, jamás en `package.json`.
   **Comprobación MECÁNICA (kit v1.32.0; falla CERRADO desde v1.35.0 — si no puede leer la rama
   base sale en rojo, no «se omite»; solo un repo cuya base no tiene lockfile pasa en verde con
   aviso):** `scripts/verificar-dependencias.mjs` compara las
   versiones de `pnpm-lock.yaml` del PR contra `origin/main` y falla si alguna quedó por debajo;
   corre en el job `quality` en cada PR. Leer la salida del install sigue siendo obligatorio; el
   script es la red que no depende de que alguien la lea.
   **Excepciones de auditoría (kit v1.34.0):** `pnpm audit --audit-level high` es gate y su nivel no se baja. Si una
   advisory alta o crítica **no tiene versión parcheada publicada** (GitHub la lista con `first_patched_version: null`),
   se ignora **solo esa advisory, por id**, en `pnpm-workspace.yaml` → `auditConfig.ignoreGhsas` (pnpm 11 ya no lee
   `pnpm.*` en `package.json`), con un **ADR en `decisions/`** que diga id, razón (ruta de la dependencia, si es solo de
   desarrollo), fecha y **condición de retiro**. El PR que traiga el parche borra la entrada y cierra el ADR. Una
   advisory CON parche nunca se excepciona: se sube la dependencia. *(HackGuard, estampado 2026-10-03: `braces` sin
   parche vía `eslint-config-next`.)*
   **Bajadas FORZADAS (kit v1.39.0, Big-D PR #6):** a veces el bump trae un paquete que **fija exacta** una versión
   más vieja que la de `main` (`vitest` 5.0.3 fija `why-is-node-running` 3.2.1; la 5.0.2 pedía `^3.2.1`). Esa bajada
   es la intención del PR, no pnpm degradando: `verificar-dependencias.mjs` la acepta **solo si algún paquete del
   lockfile del PR que usa esa versión la declara exacta en el registro** (`npm view`), y nombra cuál («bajada forzada
   aceptada porque vitest@5.0.3 la fija exacta»). Un rango que admite la versión de `main`, sin dependiente o sin
   registro, sigue en rojo; una degradación a propósito sigue declarándose en `degradaciones-permitidas.json`.

19. **Todo puente entre dos lenguajes exige su GATE DE CONTRATO, en el mismo sprint que lo
   cruza (kit v1.28.0).** Donde un dato cambia de lenguaje o de runtime —Rust→TS por eventos
   de Tauri, worker→UI por `postMessage`, servidor→cliente por JSON, Swift→Rust por FFI— la
   suite tiene que atravesar la costura: **el lado que EMITE escribe un fixture con su
   serializador real** (no un literal copiado a mano), **el lado que LEE lo declara con su
   tipo** (generado o validado con Zod contra ese fixture), y **al menos un test cruza la
   suscripción de punta a punta** (emitir → recibir → render). Un contrato tipado en cada
   orilla y ninguna prueba entre ellas no es un contrato: es dos suposiciones que coinciden
   hasta que no. *(Origen: Angel Ghost S1 — Rust serializaba el enum etiquetado por dentro y
   el webview lo leía etiquetado por fuera; la ficha automática nunca llegó a la banda y
   ninguno de los 153 tests verdes lo vio; lo cazó el auditor independiente. Tres defectos de
   la misma clase en un sprint.)* Patrón completo en la planeadora:
   `wiki/patterns/gate-de-contrato-entre-lenguajes.md` (RO).

21. **IA de construcción por suscripción (estándar 7-S, kit v1.30.0).** Si un agente o un lote de
    esta app usa la **suscripción del usuario** como proveedor de modelo (binario oficial de Claude Code en
    modo no interactivo): solo el binario sin modificar y la sesión propia del usuario · el token **jamás**
    entra a variables de entorno, trazas, LangSmith ni al repo · la invocación corre en un **directorio
    temporal limpio con MCP vacío** (esta constitución NO entra al prompt del agente) · los lotes se corren
    **fuera de CI**, pequeños y espaciados · existe un **ADR de cumplimiento** con la lectura de los términos
    vigentes, re-leídos antes de cada release, y un **interruptor a proveedor por clave** · prohibido exponer
    el patrón a terceros (para usuarios externos, siempre clave de API). *(Primera app: planlang; el spike
    de su F1 fijó los flags y el costo por llamada.)*
22. **Todo control dibujado tiene su script cargado, y una pasada de INTERACCIÓN lo demuestra (kit
    v1.32.0).** Un botón, un panel, una ficha o un conmutador que aparece en una maqueta o en una pantalla
    solo cuenta si su controlador está cargado y hace algo: (a) el gate `tests/unit/controladores-maqueta`
    (plantilla del kit; cada app lo endurece) falla si una página dibuja controles sin script o con un
    `src` que no existe; (b) **el arnés de capturas incluye una pasada de interacción**: activa cada
    control (abrir panel, cambiar tema, cambiar idioma, siguiente paso) y comprueba que ALGO cambió en el
    DOM o en la captura antes de darlo por bueno — una captura de un panel cerrado «mide bien» y no dice
    nada. *(Origen: Big-D, Etapa de Diseño — la ficha del nivel 2 no cargó su script desde la mirada 2 y
    cuatro miradas con capturas no lo vieron; lo cazó el auditor independiente.)* Y **el generador de la
    maqueta nace EN EL REPO desde la fase 0** de la Etapa de Diseño, con su gate de deriva byte a byte
    (regenerar = mismos bytes): un generador fuera del repo hace inauditable la regla 8 y deja la
    referencia sin fuente.
23. **Matriz de envejecimiento (kit v1.33.0, método v1.36.0).** Todo dato con **fecha de cambio de
    estado** (vigente → por revisar → vencido; publicado → archivado; suscripción activa → caducada) trae,
    **desde el sprint que lo introduce**, un gate que construye o dibuja la página **en cada fecha en que
    algo cambia de estado** (hoy, cada umbral, +100 días) y exige cero avisos. La fecha de consulta es una
    **perilla de build** (nunca el reloj), y la guía de prueba la usa para mostrar los estados. *(Origen:
    Big-D S1 — el atlas pasó todo en verde y se habría roto solo 27 días después, cuando el primer mapa
    pasaba a «por revisar»; lo vio un auditor, no una prueba. Un gate que solo mira hoy no ve lo que el
    calendario toca.)* **LCP por perfil:** si la app mide texto con una tabla de métricas (G15) y por eso
    sirve sus fuentes con `display: block`, el presupuesto de LCP es **3,0 s declarado por ADR** (estándares
    v2.17.0), con el subconjunto de las fuentes a su cobertura como deuda pagable.
24. **Las protecciones del sistema del usuario se enseñan ANTES de tocarlas (kit v1.36.0, método v1.38.0 —
    regla dura del pipeline).** Antes de crear, modificar o invocar algo que el sistema operativo protege
    —Llavero, permisos TCC, ítems de inicio o launchd, Touch ID, Automatización, cuentas, certificados—
    presentas una **matriz de una fila por acción: qué · para qué · qué aviso vas a ver · cómo se deshace** y
    esperas un «sí» por acción. Vale para scripts, tests, `/release-check` y cualquier comando que corras tú:
    si no sabes si pide permiso, se enseña. *(Origen: Angel Ghost S3 — un ítem de inicio «sh · desarrollador no
    identificado», seis contraseñas de administrador y un `cargo test` que abrió el micrófono.)*
    `/audita-sprint` lo pregunta (casilla 8). En apps que ya tienen esta regla con otro número, cítala por NOMBRE.
25. **El comando de pruebas por defecto no toca hardware ni permisos (kit v1.36.0).** `pnpm test`, `cargo test`,
    `pytest` a secas corren solo lo que no abre micrófono, cámara, audio del sistema, Llavero, red local ni
    diálogos del sistema. Lo que los toca va detrás de una marca explícita (`#[ignore]`, una *feature*, un
    `describe.skip` con `RUN_HARDWARE=1`) y lo corre la CI (`cargo test -- --include-ignored` en
    `build-escritorio`) o un comando nombrado en el README. Un verde que costó un aviso del sistema al usuario
    no es un verde.
26. **Worktrees prohibidos (kit v1.37.0, regla del usuario 2026-09-27).** Todo el trabajo ocurre en el checkout
    principal `~/Code/app-<slug>`: nada de `git worktree` ni de `.claude/worktrees`. Un trabajo en paralelo (una
    etapa de diseño mientras corre un sprint sin pantalla) vive como archivos en este directorio y se comitea a su
    rama sin cambiar de rama (índice temporal); jamás `git stash` a secas sobre trabajo ajeno. *(planlang: la Etapa
    de Diseño y el S1 convivieron así; un worktree duplica el `node_modules`, pierde el `settings.local.json` y
    deja ramas que nadie cierra.)*
27. **La evidencia se escribe DESPUÉS del hecho (kit v1.38.0, método v1.40.0).** Una frase de evidencia en
    la bitácora, el summary o el PR —«leído como imagen», «N de N», «% de líneas», «medido con…», «en verde
    en la CI»— se escribe después de la corrida que la produce, con su cuenta tomada del resultado, nunca
    como plan en pasado. Es la hermana de «ninguna cifra sin procedencia»: una evidencia anticipada es una
    promesa disfrazada. La segunda pasada de la casilla 4 de `/audita-sprint` busca estas frases y exige la
    corrida que las sostiene *(ds S6: «leído como imagen» antes de leer, «36 de 36» que mezclaba anchos con
    altos y «93,24 % de líneas» que era la cifra de sentencias; se corrigieron porque alguien releyó)*.
    **Y la pasada de capturas cubre los extremos de magnitud** de cada dataset o contenido de ejemplo (el
    valor más grande y el más pequeño que la app puede mostrar: seis dígitos, ~1e-11, el texto más largo),
    no solo el ejemplo principal *(ds S6: los dos defectos del cierre vivían en el gráfico de precios)*.
    **Un spike de costos se corre con máquina quieta y carga registrada** (molde
    `docs/SPIKE-DE-COSTOS.plantilla.md`; se repite el lote si hubo carga) *(ds S6, K-S6-3)*.

## Estándares (los 6+1, gates en CI)

Testing · CI/CD · Observabilidad · Seguridad · Performance (contra `perf-budget.json`) · UX+A11y ·
**IA embebida responsable**. Detalle canónico: `estandares/estandares.md` de la planeadora
(read-only). Ítem rojo ⇒ deuda técnica explícita en el summary o el sprint no cierra.

## Workflow de un sprint

**Apertura** — el usuario trae la **orden de construcción** (`portafolio/<slug>/ordenes/SPRINT_NNN-orden.md`
de la planeadora). Léela entera + sus referencias (SPRINT_NNN.md, brief, prototipo READ-ONLY).
**Plan mode primero, siempre.** **La aprobación del plan NO arranca la construcción** (gate de
arranque, kit v1.6.2): tras aprobarse el plan, emite el bloque de arranque — tu recomendación de
**modelo y esfuerzo** para el sprint (el usuario los fija con `/model`) + espacio para sus
ajustes — y espera su **«construye»** explícito antes de tocar cualquier archivo.
Branch `sprint-NNN/<tema>`.

**Durante** — construye por fases (setup → motor → UI → integración → e2e). Mantén viva la bitácora
`sprints/SPRINT_NNN-implementation-log.md` (progreso, decisiones, bugs). ADRs en `decisions/` para
decisiones no anticipadas. `/self-review` tras cada bloque; `/run-tests` frecuente.
**Gate de FASE (kit v1.8.0): al terminar CADA fase DETENTE** — entrega el resumen completo de
la fase (qué se construyó, archivos, tests y resultados, criterio de fase completa,
desviaciones), recuerda al usuario que puede cambiar modelo/esfuerzo con `/model`, y espera su
**«continúa»** explícito antes de arrancar la siguiente fase. **Gate de FASE ≠ gate de
MIRADA (kit v1.20.0):** si la fase produjo un artefacto visual, «continúa» NO lo aprueba —
aplica la mecánica de mirada de la regla 10 (pregunta simple + lugar en la primera línea;
evidencia de archivo abierto o «lo abrí y apruebo»; sin eso, repregunta antes de construir
encima).

**Prototipo READ-ONLY** (si la orden referencia `referencias-ui/<slug>/` de la planeadora): extrae
paleta/tipografía/spacing/microcopy/patrones. ❌ No importes archivos, no copies código tal cual, no
uses su estructura de carpetas, no heredes sus gaps (testing/a11y/perf inexistentes).

**Cierre — auditoría OBLIGATORIA + summary OBLIGATORIO.** Al concluir la construcción (todas
las fases aprobadas): **corre `/audita-sprint`** (auditoría final de dos fases, método
v1.10.0 — Fase 1 solo-lectura con severidades y veredicto "listo para cierre"/"requiere
ajustes"; **el modelo poderoso audita y PLANEA los ajustes para que CUALQUIER modelo de menor
capacidad los ejecute**; Fase 2 solo tras aprobación del usuario) — ANTES de la guía/gate ⭐.
Luego, con la DoD completa: `/deploy-check` → genera `sprints/SPRINT_NNN-summary.md`
(plantilla abajo; **registra la auditoría: hallazgos y pagos**) → PR → gate ⭐ del usuario →
merge con CI verde. **El PR del sprint nace en borrador (`gh pr create --draft`) y su cuerpo EMPIEZA con la línea
del merge (kit v1.38.0, método v1.40.0):** «cuando esté verde: marca el PR listo, mergea con **squash** y
borra la rama; después corre `/cierre-sprint big-d`» — la misma línea cierra el summary (sección fija
«Para mergear»). El merge lo hace el usuario; escrita solo al final de la orden no llegó al momento del
merge *(ds S6: dos PRs entraron como merge commit, uno al arrancar la fase 0)*. **El summary es CONDICIÓN DE MERGE (método v1.24.0): viaja DENTRO del PR
del sprint — un PR de sprint sin `SPRINT_NNN-summary.md` no se mergea.** Sin summary el sprint
es INVISIBLE para la planeadora (el S3 de Innmobiliaria lo estuvo UN MES) — y sin auditoría
registrada, el cierre queda condicionado. **Y si el sprint se mergea SIN completar sus fases,
el CORTE SE DECLARA EN EL MISMO ACTO (método v1.24.0):** en el PR y en el summary — qué fases
quedaron fuera y qué entregables arrastran; el corte silencioso arrastró 5 consecuencias
medibles.

**Cierre de CICLO — ocurre en DOS ACTOS (método v1.20.0; la orden declara cuando este sprint es
el ÚLTIMO del ciclo):** **Acto 1, DE CONSTRUCCIÓN** — el último sprint mergea con CI verde
(conclusión propia por check) + auditoría + contrapesos + BLUEPRINT; el gate del usuario aquí es
SOLO el storyboard + visual del **BROCHURE INICIAL** (regla 13 — llega por su orden de entrega).
**Acto 2, DE PRUEBAS (el sello MVP)** — cuando el usuario decida: gate **⭐⭐** → correcciones por
PR normal → **BROCHURE SELLADO** → `/design-sync`. **El ⭐⭐ condiciona el acto 2, no el 1**: no
retengas el merge ni el brochure inicial esperando el gate; y registra en el summary cuál acto
ocurrió — dos eventos, dos registros. Además de la DoD, el ciclo entrega (1) **`docs/BLUEPRINT.html`** — as-built
de TODA la infraestructura que soporta la app (plantilla `docs/BLUEPRINT.plantilla.html`: **HTML
autocontenido con diagrama SVG embebido** — jamás mermaid ni CDNs — + tabla por pieza + costo
real + punto único de falla), vivo y acumulativo entre ciclos;
y (2) el **design system publicado en Claude Design** con **`/design-sync`** — el comando está
estampado en este repo y su regla de reparto es (kit v1.18.0): **EL USUARIO INVOCA, TÚ EJECUTAS.**
La skill lleva `disable-model-invocation` — el disparador es del usuario, jamás lo lanzas tú —
pero la herramienta `DesignSync` sí es tuya: creas/verificas el proyecto, armas el bundle,
publicas. Lo reservado es el disparador, no el trabajo. Y **SIEMPRE después del gate ⭐⭐ corto**:
jamás se publica como activo estable un sistema que el usuario no ha juzgado. El punto de control
adicional es mecánico: `finalize_plan` le muestra al usuario la lista exacta de rutas y el
directorio de origen, independiente de lo que tú narres. Requisito previo: **el bundle
`design-sync/` del repo al día** (ver regla 16). Si el usuario decide NO invocarlo, el summary lo
registra como decisión suya explícita, no como olvido. Todo ciclo tiene MÍNIMO
3 sprints (regla dura 2026-07-17).

> **La regla llegó a su forma final equivocándose por mitades (v1.16.0 → v1.17.0 → v1.18.0):**
> v1.16.0 dijo *"lo corre EL USUARIO, no tú"* (verdad a medias: el disparador); v1.17.0 dijo *"lo
> corre TU sesión, la de la app"* (verdad a medias: el trabajo). Velo lo demostró ejecutándolo:
> el usuario escribió `/design-sync` y el constructor hizo todo — **el usuario invoca, el
> constructor ejecuta**. Se deja visible el camino a propósito.

**El gate ⭐ del cierre se corre POR BLOQUES, con arreglo en caliente (kit v1.16.0).** No entregues
la guía como una lista de 25+ pruebas para una sentada: el usuario recorre un bloque, tú corriges
lo que encontró **antes de que pase al siguiente**, y **el re-test de esa corrección es parte del
gate**. No es comodidad — es donde aparecen defectos que la primera pasada no puede ver. *(Origen:
ds S4, gate de 27 pruebas en 5 bloques: al re-verificar el arreglo del bloque C contra el proveedor
real apareció un segundo bug —`direction: null` hacía abortar la generación entera y la app caía a
plantilla **en silencio**— que un pase único habría enterrado.)* Registra en la bitácora, bloque a
bloque: resultado, ajustes aplicados en caliente y lo que va a backlog.

### Plantilla del summary

```markdown
---
sprint: NNN
app: <slug>
status: closed
opened: YYYY-MM-DD
closed: YYYY-MM-DD
branch: sprint-NNN/<tema>
pr: <link>
---
# Sprint NNN Summary — Big-D
## Outcome            [¿Se logró el outcome del SPRINT_NNN.md? Sí/No/Parcial + 1 frase]
## Qué se construyó   [features/pantallas/componentes]
## DoD — checklist    [los 6+1 estándares, uno a uno, con evidencia breve]
## Métricas técnicas  [cumplidas vs. no, del SPRINT_NNN.md]
## Gate ⭐ — diferimiento y contrapesos  [kit v1.28.0 — sección FIJA; sin ella el diferimiento no es válido]
| Contrapeso | Evidencia (archivo, cuenta medida, corrida) |
|---|---|
| Pasada de capturas del builder | [N encuadres leídos como imagen · ruta · fecha] |
| e2e de `reduced-motion` | [N pruebas · archivo del spec · corrida en CI] |
[+ «⭐ diferido: N pruebas al acumulado del ciclo (S1: n₁ · S2: n₂…)» o «⭐ OBLIGATORIO corrido: parada a parada»]
## Decisiones no anticipadas  [ADR-NNN: resumen]
## Bugs + resoluciones
## Qué salió bien / qué generó fricción
## Sugerencias de mejora al método  [¿algo de metodo/metodo.md debería cambiar?]
## Deuda técnica aceptada  [qué, por qué, sprint de pago]
## Archivos clave (máx. 10) · ## Cómo probar
## Para mergear  [línea FIJA (kit v1.38.0): «marca el PR listo, mergea con SQUASH y borra la rama; después corre /cierre-sprint big-d» — la hace el usuario]
```

## Patrones de dominio de esta app

- **Núcleo (`src/engine/`):** `puntaje.ts` (0–4 con tope por madurez, mínimo de esenciales,
  evidencia limitante, desempate leximin) · `sensibilidad.ts` (punto de inversión por fórmula
  cerrada, rango [0, 100], caso w = 0, entrada en empate) · `simulacion.ts` (SMAA: sfc32 + muestreo
  uniforme sobre el politopo; aceptabilidad por posición + vector central; empates 1/k; en Worker)
  · `decisiones.ts` (Kahn por ondas + DFS del ciclo; reversibilidad; implícitas) · `riesgos.ts`
  (tabla de prioridad de acción en datos) · `hoja-de-ruta.ts` (supuestos baratos antes de las
  decisiones de una vía; origen por ítem) · `informe/` (14 secciones por plantillas, ES/EN; ficha
  de reproducibilidad) · `legibilidad.ts` (presupuesto ≤ 50 palabras / ≤ 95 sílabas; detector de
  jerga es/en). Todo puro, entero, con semilla; propiedades con fast-check (monotonía **corregida**:
  la posición del líder nunca empeora; invariancia al orden; suma de pesos; reproducibilidad).
- **Diagramador (`packages/diagramador/`, CONTRATO v0.6.0):** `validate`/`validateGrammar` (esquema +
  G1–G7 + V1–V16 con cobertura; informe en tres listas `errores · alertas · avisos`, entradas `{doc, fase,
  regla, ruta, id, idioma?, mensaje}`) · `layout` (bandas → columnas fijas por gramática, nodos de altura
  uniforme, **franjas abajo**, carril exprés y canales con pistas a 6 u; vistas `nivel1 · nivel2 · recorrido
  · carriles · bloque`; geometría + avisos § 5.6; cero cruces D11 a cuatro edades) · `toSVG` (serializador
  propio, orden de atributos fijo, números cuantizados, `-0` normalizado, roles `graphics-*`, un SVG por
  idioma, `<defs>` con espacio de nombres) · `toText`/`toCard`/`toBlockCards`/`toLegend` con
  `options.texts` y `queryDate` · `compare` (lado a lado: N del consumidor, nivel por banda en el mismo dibujo, `part` filas
  independientes, `marks`, `variante`, precondiciones; **S2 ✓**, 44 golden) · `diff` (JSON canónico; compara nodos
  por nombre y madurez y bloques por nombre — F-030 motor en S3; no ve textos ni fuentes) · `diffToText` ·
  `agingDates` · **versionado de mapas** (`data/mapas/versiones/`, archivo byte a byte al aprobar, migración en
  cadena, históricas listadas y no dibujadas) · **una sola disposición horizontal con lienzo deslizable** (sin
  angosta) · `CONTRATO.lock`. Los 34 casos de `reusables/diagramador/carnadas/` como suite obligatoria.
- **Datos (`data/`):** esquemas Zod → JSON Schema; carga que falla con campo e id; instantáneas
  `snapshots/<fecha>.json` con SHA-256 (RFC 8785); gramática `plataformas-datos` copiada de la
  planeadora con huella; mapas por plataforma (`mapas/<plataforma>.mapa.yaml`), incluida la
  **plataforma ficticia** (carnada de RNF-06).
- **Investigador (`.claude/skills/investigar/`):** salida validada por esquema (2 reintentos); citas
  verificadas con `curl` sobre la página cruda; propuestas en `propuestas/<fecha>-<plataforma>[-capa]/`;
  `registro-de-ejecucion.jsonl` con cada fuente consultada; **jamás un identificador del usuario en
  una petición**. El atlas privado muestra el semáforo por capa y copia el comando exacto.
- **Demo (H2, E4):** `pnpm build:demo` → paquete estático (`out-demo/` + `manifiesto.json` con
  huellas) que viaja a hoja-de-vida por PR de contenido; página SSG con iframe del mismo sitio;
  controles de pesos con el mismo núcleo en un Worker; declaración del autor; ES/EN.

## Idioma

Español en conversación y bitácoras. Inglés en código, commits, nombres y ADRs.

**Regla 20 — La app es BILINGÜE español/inglés en TODO desde el primer sprint (kit v1.29.0,
estándares 2.14.0 apartado 6-B, regla de la casa).** Interfaz, contenido, informes, documentos
generados, demo y ficha técnica. El dato nace como mapa de idioma `{ es, en }` (nunca un campo en un
idioma más una traducción aparte); **redactado, no traducido** (la traducción automática de contenido
de producto está prohibida); las pruebas de texto, capturas y e2e con texto corren en AMBOS idiomas;
conmutador visible desde la maqueta de la Etapa de Diseño.

