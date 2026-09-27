---
id: reusable-diagramador
titulo: Diagramador — ficha del reusable
arquetipo: harness
elemento_tipo: contexto
rigor: completo
capa: producto
version: 0.3.0
fecha: 2026-09-27
estado: semilla
objetivo: Ficha del diagramador de arquitecturas y recorridos, con su estado, versión, piloto, consumidores e hitos
depende_de: [reusables/README.md]
relacionado_con: [reusables/diagramador/CONTRATO.md, portafolio/big-d/brief.md, portafolio/planlang/brief.md]
tags: [reusables, diagramador, atlas, arquitectura, bilingue]
---

# Diagramador

**Motor que dibuja arquitecturas y recorridos a partir de datos aprobados, con una misma gramática
visual, en todos los idiomas que la gramática declara.** Se le entrega un **mapa** (nodos, flujos y
recorridos) y una **gramática** (bandas, tipos, modos y reglas) y devuelve el diagrama en SVG en tres
niveles de lectura, lado a lado y como lista en texto. Todo el vocabulario de dominio vive en la
gramática; el motor no conoce ninguno.

| Campo | Valor |
|---|---|
| Estado | `semilla` |
| Contrato | [CONTRATO.md](CONTRATO.md) **v0.3.0** (2026-09-27: gramática visual sellada en el G-Diseño del piloto + bilingüe integral + condición de planlang) |
| Piloto | `big-d`, módulo M11 «Atlas de arquitectura», entrega E1 — **S1 «Atlas de Fabric»** construye la primera implementación |
| Implementación | aún no existe; nace en `~/Code/app-big-d/packages/diagramador/` con `CONTRATO.lock` |
| Gramáticas | `plataformas-datos` v0.2.0 (piloto, ES/EN) · `agentes-ia` v1.1.0 (planlang, ES/EN) · 4 de prueba de generalidad (nubes · arquitectura de app · agentes · procesos, solo ES) |
| Ejemplos | Plataforma Ejemplo y Agente Ejemplo (ficticios, bilingües) + 4 de prueba |
| Consumidores | **big-d** (piloto) · **planlang** (2.º consumidor, visor de agente M8; su conversor emite la forma 0.3.0) · previstos: los cinco usos del CONTRATO § 9 |
| Fallas registradas | 12 (F-001 a F-005 del spike; F-006 a F-012 de la Etapa de Diseño y del registro de planlang) — [REGISTRO-DE-FALLAS.md](REGISTRO-DE-FALLAS.md) |
| Medido | 55/55 salidas idénticas en Node, Chromium, Firefox y WebKit (spike) · 24/24 carnadas (0.2.0) · **31 casos consistentes con los esquemas 0.3.0** · referencia del G-Diseño con 0 cruces, 0 desbordes, paleta bajo 7 vistas |
| Editar el contrato | gate G-Metodo |

## Hitos

| Versión | Cuándo | Qué entra |
|---|---|---|
| **v0.1.0** | F0 #11 (2026-09-26) | Modelo, garantías, vistas, reglas de dibujo y de validación, ciclo de vida. Salen de los requerimientos v1.1 (secciones 4, 6.12–6.16, 10.6, RF-09.5/9.6, RF-11, RNF-12) y se generalizan a cinco usos |
| **v0.2.0** | F1 (2026-09-26) ✓ | Esquemas · 5 gramáticas · 5 ejemplos · 24 carnadas · P1, P2, P3 y P6 respondidas · G15, D11 y D12 nuevas |
| **v0.3.0** | G-Diseño del piloto (2026-09-27) ✓ | **Gramática visual** (siempre horizontal con lienzo deslizable, tarjeta + filete + glifo, un matiz por tipo con umbral, paths de glifos y marcas, geometría de la dirección «plano», Space Grotesk) · **mapas de idioma** · madurez por `nivel` · `nodos_por_banda_max` · `condicion` (planlang) · 31 casos de carnada · P4, P5, P9, P10 y P11 respondidas |
| v1.0.0 | cierre del S1 del piloto | La primera implementación cumple el contrato y pasa todos los casos (estado `piloto`) |

## Cómo leer esta carpeta

- [CONTRATO.md](CONTRATO.md): qué garantiza el motor, con qué datos trabaja y cómo dibuja. Es la fuente de verdad.
- [CHANGELOG.md](CHANGELOG.md): versiones del contrato.
- [REGISTRO-DE-FALLAS.md](REGISTRO-DE-FALLAS.md): cada falla encontrada y la regla que la previene.
- [esquema/](esquema/): JSON Schema normativos · [gramaticas/](gramaticas/) · [ejemplos/](ejemplos/) ·
  [carnadas/](carnadas/) (con `esperado.json`).
- Los artefactos 0.3.0 se generan con `portafolio/big-d/investigacion/spike-diagramador/scripts/convertir-0.3.0.mjs`
  (`npm run carnadas` en el spike), que también los valida con Ajv contra los esquemas.
