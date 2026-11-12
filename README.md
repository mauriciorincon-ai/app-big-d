# Big-D

**ES** · **Elige tu plataforma de datos con evidencia fechada, no por costumbre.** Big-D dibuja Databricks,
Microsoft Fabric y Snowflake con el mismo mapa, para que entiendas cada una de punta a punta y las
compares lado a lado. Después toma tu caso y te muestra quién gana, por cuánto, qué tan sólido es el
resultado y con qué peso cambiaría. Y no se queda en un puntaje: lo vuelve decisiones, riesgos, un plan
y un informe en español e inglés. Es abierto y reproducible; planea, gestiona y controla, y jamás opera
una plataforma. La única IA es una skill de Claude Code que propone conocimiento con citas
comprobadas; una persona lo aprueba. **Hoy:** el atlas, el investigador, la base de conocimiento, el perfil del caso con su comparación (con los pesos también por pares y la opción de duplicar un caso), qué cambió entre instantáneas de la base, el plan del caso (decisiones por ondas, riesgos por prioridad de acción y supuestos), el informe del caso (hoja de ruta por fases con su origen, alistamiento y un informe de catorce secciones en dos idiomas, imprimible) y el instrumento que valida la herramienta. La comparación se calcula cuando una persona aprueba el perfil.

**EN** · **Choose your data platform with dated evidence, not out of habit.** Big-D draws Databricks,
Microsoft Fabric and Snowflake on the same map, so you can understand each one end to end and compare
them side by side. Then it takes your case and shows you who wins, by how much, how solid the result is
and at what weight it would change. And it does not stop at a score: it turns it into decisions, risks,
a plan and a report in Spanish and English. It is open and reproducible; it plans, manages and
controls, and never operates a platform. The only AI is a Claude Code skill that proposes knowledge
with checked quotes; a person approves it. **Today:** the atlas, the researcher, the knowledge base, the case profile with its comparison (with weights also by pairs and the option to duplicate a case), what changed between snapshots of the base, the case plan (decisions in waves, risks by action priority and assumptions), the case report (a roadmap by phases with its origin, a readiness checklist and a 14-section report in two languages, printable), and the instrument that validates the tool. The comparison is calculated once a person approves the profile.

## Desarrollo local · Local development

```bash
pnpm install
pnpm dev            # servidor de desarrollo · dev server
pnpm build          # export estático en out/ (copia la maqueta de diseño a /diseno/)
pnpm start          # sirve out/ (PORT, por defecto 3400, en 127.0.0.1)
pnpm test           # Vitest con cobertura · with coverage
pnpm test:e2e       # Playwright contra el build
```

- Constitución del repo · repo constitution: `CLAUDE.md`
- Sistema de diseño · design system: `design-system.md`; maqueta aprobada · approved mockup: `docs/diseno/`
- Diagramador (reusable de la casa · house reusable): `packages/diagramador/`
- Instrumentos de plan (reusable de la casa · house reusable): `packages/instrumentos-de-plan/`
- Bitácoras y resúmenes de sprint · sprint logs and summaries: `sprints/`
