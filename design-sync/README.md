# design-sync — el design system de Big-D, listo para publicar

Bundle publicable del design system (la regla del CLAUDE.md «el bundle publicable del design system es un artefacto
del repo»). La jerarquía es fija:

1. **`design-system.md`** es la fuente de verdad, más las extensiones del S1 por ADR
   (`decisions/design-system-s1-extensions.md`) y del S2 (`decisions/design-system-s2-extensions.md`).
2. **`design-sync/`** es este bundle. Deriva de lo anterior y del producto; jamás lo contradice.
3. **El proyecto en Claude Design** es la vitrina. Se escribe desde aquí y **nunca se edita allá**.

## Qué trae

| Archivo | Grupo | Qué muestra |
|---|---|---|
| `styles.css` | — | Las hojas del producto tal cual: tokens (generados y medidos), base, diagrama, atlas, lado a lado y versiones |
| `components/fundamentos/color.html` | Fundamentos | Neutros y tipos de componente en los dos temas, con su uso |
| `components/fundamentos/letra.html` | Fundamentos | Space Grotesk y JetBrains Mono en sus roles |
| `components/diagrama/leyenda.html` | Diagrama | La leyenda del motor y la nota de marcas |
| `components/diagrama/vision-general.html` | Diagrama | El nivel 1 de la Plataforma Ejemplo, dibujado por el motor |
| `components/componentes-s1/ventana-de-un-bloque.html` | Componentes · S1 | La ventana de un bloque: con un flujo adentro y de franja |
| `components/componentes-s1/ficha-de-un-componente.html` | Componentes · S1 | La ficha del nivel 2 |
| `components/componentes-s1/selector-de-plataforma.html` | Componentes · S1 | El campo «Plataforma» con sus N opciones |
| `components/componentes-s2/lado-a-lado.html` | Componentes · S2 | El lado a lado: la cabecera de bandas y una fila con sus bloques, con el botón «Desplegar todo» |
| `components/componentes-s2/lado-a-lado-desplegado.html` | Componentes · S2 | La misma fila con todos sus componentes desplegados y el botón «Contraer todo» |
| `components/componentes-s2/diferencias-entre-versiones.html` | Componentes · S2 | Dos versiones sintéticas del mapa ficticio con una marca de cada clase, la lista que las explica y lo que cambió sin cambiar el dibujo |

Cada tarjeta es HTML autocontenido. Su primera línea es la marca `@dsCard` con la que Claude Design la indexa, lleva
el CSS en línea y no hace ninguna petición a la red. La tarjeta no carga fuentes: la letra se ve donde Space
Grotesk y JetBrains Mono están instaladas.

## Cómo se mantiene

- **Se genera, no se dibuja** (la regla dura «el visual se genera, no se dibuja»): `node scripts/design-sync/generar.mjs` reescribe `styles.css` y
  `components/` desde `scripts/design-sync/bundle.ts`. Los diagramas salen del mismo motor y de las mismas vistas
  que el producto, sobre la Plataforma Ejemplo (ficticia), con una fecha de consulta fija.
- **`tests/unit/design-sync.test.ts`** regenera en memoria y compara byte a byte. Si una hoja, el motor o los
  datos cambian y nadie regenera, `pnpm test` se pone en rojo. Todo sprint que toque la interfaz actualiza el
  bundle en su mismo PR.
- `README.md` y `project.json` se escriben a mano. `project.json` lo actualiza `/design-sync` al publicar.

## Publicación

**Pendiente del cierre del ciclo H1 (S4), después del gate ⭐⭐ corto.** Nunca se publica un sistema que la persona
no ha juzgado. El disparador es de la persona (`/design-sync`); el trabajo lo hace la sesión de esta app.
`project.json` todavía no tiene proyecto: se crea o se elige en ese momento, con la persona.
