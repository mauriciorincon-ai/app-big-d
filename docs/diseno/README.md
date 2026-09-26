# Etapa de Diseño — maqueta de fundación de Big-D (F2a)

> Este directorio se llena ANTES de cualquier código de producto. La orden de diseño de la
> planeadora (`portafolio/big-d/ordenes/DISENO-orden.md`) manda; este archivo registra el
> resultado. Regla dura: cero React, cero motores, cero `src/` de producto hasta que el usuario
> apruebe **G-Diseño** sobre la maqueta desplegada en Vercel.

## Cómo abrir la maqueta

- **En el preview de Vercel del PR** (protegido: pide tu sesión): ruta `/diseno/index.html`.
- **En local**: doble clic en `docs/diseno/index.html` (sin red, sin build), o `pnpm build && pnpm start`
  y `http://localhost:3000/diseno/index.html`.
- Cada pantalla trae su barra de sala: **estado · tema · idioma**. La nota bajo la barra dice qué mirar.

## Qué vive aquí

- `index.html` — el recorrido de sala: todas las pantallas en orden de flujo.
- `<pantalla>.html` — una página por pantalla core del H1, HTML autocontenido (cero CDNs, cero
  frameworks), con sus estados, 380 px y desktop, oscuro y claro, español e inglés. Datos 100 %
  sintéticos: la Plataforma Ejemplo y el hospital ficticio.
- `diagramador-tokens.md` — la propuesta de gramática visual del diagramador para el CONTRATO v0.3.0.
- `assets/` — `tokens.{json,css}` (GENERADOS por `pnpm tokens`), fuentes con su licencia, hojas y
  el script de la barra de sala.
- La maqueta es **referencia, no producto**: los sprints la reproducen y el gate de FIDELIDAD del
  primer sprint con UI compara contra ella. El atlas es el único diagrama dibujado a mano de la app
  (regla dura 8); el renderizador lo reproducirá con _golden files_.

## Plan de miradas

| Mirada       | Artefacto(s)                                                                                                  | Orden                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 1            | `diagramador-tokens.md` + `atlas-nivel-1.html` ⭐ (+ `design-system.md` v0.1)                                 | primero, siempre: fija el contrato v0.3.0 |
| 2            | `design-system.md` completo + `kit.html` + `atlas-nivel-2.html` + `atlas-recorrido.html` + `lado-a-lado.html` | 2                                         |
| 3            | `investigador.html` · `base.html` · `perfil.html` · `comparacion.html`                                        | 3                                         |
| 4            | `decisiones.html` · `informe.html` · `instrumento.html` · `index.html`                                        | 4                                         |
| 5 = G-Diseño | todo, desplegado                                                                                              | 5                                         |

## Registro de miradas

| Fecha | Artefacto | Veredicto del usuario (textual) | Qué se construyó encima |
| ----- | --------- | ------------------------------- | ----------------------- |
|       |           |                                 |                         |

## Cobertura (se llena durante la etapa)

| Página de la maqueta | Funcionalidad de la VISION | Estados que muestra |
| -------------------- | -------------------------- | ------------------- |
|                      |                            |                     |

## Registro de G-Diseño (se llena al cerrar la etapa)

| Campo                        | Valor                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| **Veredicto del usuario**    | _(pendiente)_ — aprobado / aprobado con notas                                                       |
| **Fecha**                    |                                                                                                     |
| **Rondas de sala de diseño** |                                                                                                     |
| **Dónde se aprobó**          | preview de Vercel del PR de `diseno/fundacion` (la URL vive en la planeadora, jamás aquí: regla 17) |
| **Decisiones selladas**      |                                                                                                     |
| **Notas del usuario**        |                                                                                                     |

**Sin este registro lleno, G-Diseño no está aprobado y ninguna orden de construcción se ejecuta.**
