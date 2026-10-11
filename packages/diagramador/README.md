---
id: reusable-diagramador
titulo: Diagramador — ficha del reusable
arquetipo: harness
elemento_tipo: contexto
rigor: completo
capa: producto
version: 0.6.0
fecha: 2026-10-04
estado: piloto
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
| Estado | **`piloto`** (2026-10-01): la implementación existe, pasa todos los casos y dibuja un mapa real aprobado |
| Contrato | [CONTRATO.md](CONTRATO.md) **v0.6.0** (2026-10-04: 25 enmiendas y 12 fallas del S2 del piloto — `compare` con `part`/`marks`, `diff` declarado + `diffToText`, lado a lado sin insignias, P13 cerrada, V16 falla cerrado, lock con commit de origen, § 12 aclarado; v0.5.0 el mismo día: 6 enmiendas de planlang S2; v0.4.0 2026-10-01: 44 enmiendas del S1) |
| Piloto | `big-d`, módulo M11 «Atlas de arquitectura», entrega E1 — S1 «Atlas de Fabric» cerrado (2026-10-01): primera implementación y primer mapa real · **S2 «Databricks y Snowflake, lado a lado» cerrado (2026-10-04)**: `compare`, primer `diff` real, cuatro plataformas lado a lado, tres reales aprobadas; S3 renueva el lock a 0.6.0 |
| Implementación | `~/Code/app-big-d/packages/diagramador/` (TypeScript; validación V1–V16, layout 1/2/recorrido/carriles/bloque, **`compare`**, serializador propio, `toText`/`toCard`/`toBlockCards`/`diff`/`diffToText`/`agingDates`, 44 golden files) con `CONTRATO.lock` v0.4.0 (51/51 contra `143facf^`) → se renueva a 0.6.0 en el S3 |
| Gramáticas | `plataformas-datos` v0.2.0 (piloto, ES/EN) · `agentes-ia` v1.1.0 (planlang, ES/EN) · 4 de prueba de generalidad (nubes · arquitectura de app · agentes · procesos, solo ES) |
| Ejemplos | Plataforma Ejemplo y Agente Ejemplo (ficticios, bilingües) + 4 de prueba |
| Consumidores | **big-d** (piloto) · **planlang** (2.º consumidor, visor de agente M8; su conversor emite la forma 0.3.0) · previstos: los cinco usos del CONTRATO § 9 |
| Fallas registradas | 37 (F-001…F-005 del spike; F-006…F-012 de la Etapa de Diseño y planlang; F-013…F-025 del S1 del piloto; **F-026…F-037 del S2**, todas cerradas salvo el motor de F-030 → S3) — [REGISTRO-DE-FALLAS.md](REGISTRO-DE-FALLAS.md) |
| Medido | spike: 55/55 idénticos (macOS) · G-Diseño: 0 cruces, 0 desbordes, paleta bajo 7 vistas · S1: 31/31 casos, 30 golden files idénticos en Node + Chromium + Firefox + WebKit × macOS + Linux, G15 97,1 %, 7 mapas con D11 = 0 a 4 edades · **S2: 34/34 casos con `secundarios`, 44 golden files idénticos (incluido `compare` con 3 y 4 mapas), G5 por fast-check entre N mapas, matriz de envejecimiento sobre `compare` y `diff`, P13 0 puntas tapadas** · 34 casos consistentes con los esquemas 0.6.0 (`validar-artefactos.mjs`) |
| Editar el contrato | gate G-Metodo |

## Hitos

| Versión | Cuándo | Qué entra |
|---|---|---|
| **v0.1.0** | F0 #11 (2026-09-26) | Modelo, garantías, vistas, reglas de dibujo y de validación, ciclo de vida. Salen de los requerimientos v1.1 (secciones 4, 6.12–6.16, 10.6, RF-09.5/9.6, RF-11, RNF-12) y se generalizan a cinco usos |
| **v0.2.0** | F1 (2026-09-26) ✓ | Esquemas · 5 gramáticas · 5 ejemplos · 24 carnadas · P1, P2, P3 y P6 respondidas · G15, D11 y D12 nuevas |
| **v0.3.0** | G-Diseño del piloto (2026-09-27) ✓ | **Gramática visual** (siempre horizontal con lienzo deslizable, tarjeta + filete + glifo, un matiz por tipo con umbral, paths de glifos y marcas, geometría de la dirección «plano», Space Grotesk) · **mapas de idioma** · madurez por `nivel` · `nodos_por_banda_max` · `condicion` (planlang) · 31 casos de carnada · P4, P5, P9, P10 y P11 respondidas |
| **v0.4.0** | cierre del S1 del piloto (2026-10-01) ✓ | 44 enmiendas del primer mapa real: geometría del carril y los canales · envejecimiento + § 5.6 avisos · V4/V5/V16 e informe en tres listas · API `toCard`/`toBlockCards`/vista «bloque»/`texts`/`queryDate` · triángulo de «por revisar» · § 12 contrato de la propuesta · P1–P3 · **estado `piloto`** |
| **v0.5.0** | cierre de planlang S2 (2026-10-04) ✓ | `nodo.papel` · `condicion` en tres formas (V17) · `fuente.tipo: codigo` · `hexagono` · G15 por fuente; gramática `agentes-ia` 1.2.0 |
| **v0.6.0** | cierre del S2 del piloto (2026-10-04) ✓ | **`compare` implementado** (`n`/`page`/`part`/`marks`, filas independientes, sin `toCompareCSS`) · `diff` declarado + `diffToText` · lado a lado sin insignias · P13 cerrada (9 u) · V16 falla cerrado · `agingDates` · lock con commit de origen · § 12 aclarado · F-026…F-037 |
| v1.0.0 | cierre del S3 del piloto | el piloto adopta la 0.6.0 (lock) y planlang usa el motor desde su repo; contrato estable para el segundo consumidor |

## Cómo leer esta carpeta

- [CONTRATO.md](CONTRATO.md): qué garantiza el motor, con qué datos trabaja y cómo dibuja. Es la fuente de verdad.
- [CHANGELOG.md](CHANGELOG.md): versiones del contrato.
- [REGISTRO-DE-FALLAS.md](REGISTRO-DE-FALLAS.md): cada falla encontrada y la regla que la previene.
- [esquema/](esquema/): JSON Schema normativos · [gramaticas/](gramaticas/) · [ejemplos/](ejemplos/) ·
  [carnadas/](carnadas/) (con `esperado.json`).
- Los artefactos se editan directamente (desde la 0.5.0) y se validan con
  `portafolio/big-d/investigacion/spike-diagramador/scripts/validar-artefactos.mjs` (Ajv 2020 estricto; fase 1 de las
  carnadas; `contrato_version` uniforme). El generador `convertir-0.3.0.mjs` quedó retirado en la 0.6.0.
