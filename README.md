# Big-D

**ES** · Elige tu plataforma de datos con evidencia fechada, robustez visible y un plan para no
arrepentirte, y entiende todas con el mismo mapa. Big-D es un planeador abierto y reproducible: un
atlas que dibuja cada plataforma con una sola gramática visual y un núcleo determinista que compara,
mide la robustez y convierte la comparación en decisiones, riesgos y un plan. Planea, gestiona y
controla; jamás opera una plataforma. La única IA es una skill de Claude Code que propone
conocimiento con citas comprobadas; una persona lo aprueba. **Hoy:** el atlas, el investigador, la base de conocimiento, el perfil del caso con su comparación, el plan del caso (decisiones por ondas, riesgos por prioridad de acción y supuestos), el informe del caso (hoja de ruta por fases con su origen, alistamiento y un informe de catorce secciones en dos idiomas, imprimible) y el instrumento que valida la herramienta. La comparación se calcula cuando una persona aprueba el perfil.

**EN** · Choose your data platform with dated evidence, visible robustness and a plan you won't
regret, and understand every platform with the same map. Big-D is an open, reproducible planner: an
atlas that draws each platform with one visual grammar, and a deterministic core that compares,
measures robustness and turns the comparison into decisions, risks and a plan. It plans, manages and
controls; it never operates a platform. The only AI is a Claude Code skill that proposes knowledge
with checked quotes; a person approves it. **Today:** the atlas, the researcher, the knowledge base, the case profile with its comparison, the case plan (decisions in waves, risks by action priority and assumptions), and the instrument that validates the tool. The comparison is calculated once a person approves the profile.

## Desarrollo local · Local development

```bash
pnpm install
pnpm dev            # servidor de desarrollo · dev server
pnpm build          # export estático en out/ (copia la maqueta de diseño a /diseno/)
pnpm start          # sirve out/ (PORT, por defecto 3000)
pnpm test           # Vitest con cobertura · with coverage
pnpm test:e2e       # Playwright contra el build
```

- Constitución del repo · repo constitution: `CLAUDE.md`
- Sistema de diseño · design system: `design-system.md`; maqueta aprobada · approved mockup: `docs/diseno/`
- Diagramador (reusable de la casa · house reusable): `packages/diagramador/`
- Instrumentos de plan (reusable de la casa · house reusable): `packages/instrumentos-de-plan/`
- Bitácoras y resúmenes de sprint · sprint logs and summaries: `sprints/`
