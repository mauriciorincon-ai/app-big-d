// El bundle publicable del design system (`design-sync/`, regla 16 del CLAUDE.md), GENERADO: las tarjetas con
// diagramas salen del mismo motor y de las mismas vistas que el producto (regla 8: el visual se genera, no se
// dibuja), sobre la Plataforma Ejemplo (ficticia: ningún fabricante en la vitrina) y con una fecha de consulta
// fija. Las hojas son las del producto, tal cual. `tests/unit/design-sync.test.ts` regenera y compara byte a
// byte con lo versionado; `node scripts/design-sync/generar.mjs` lo escribe. Publicar es otro paso: lo dispara
// la persona con `/design-sync` al cierre del ciclo (S4), y `project.json` no lo toca este generador.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { opcionesPlataforma, plantilla, plural, vistaLado, vistaNivel1, vistaNivel2, vistaVersiones } from "@/lib/atlas";
import { cargarDatos } from "@/lib/datos";
import { textos } from "@/lib/i18n";

/** Fecha de consulta fija: el mapa de ejemplo se verificó el 2026-09-20, así que sale vigente. */
export const FECHA = "2026-09-26";
const PLATAFORMA = "plataforma-ejemplo";
const HOJAS = [
  "src/styles/tokens.css",
  "src/styles/base.css",
  "src/styles/diagrama.css",
  "src/styles/atlas.css",
  "src/styles/lado.css",
  "src/styles/versiones.css",
];
const FAMILIAS = `:root { --letra: "Space Grotesk", system-ui, sans-serif; --letra-mono: "JetBrains Mono", ui-monospace, monospace; }`;
const PROPIAS = `.ds { padding: 24px 16px; display: grid; gap: 16px; max-width: 1280px; margin: 0 auto; }
.ds-nota { font: 500 13px/1.5 var(--letra-mono); color: var(--tinta-2); margin: 0; max-width: 90ch; }
.ds-temas { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
.ds-tema { background: var(--fondo); color: var(--tinta-1); border: 1px solid var(--linea); border-radius: 8px; padding: 16px; }
.ds-muestras { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.ds-muestras li { display: grid; grid-template-columns: 28px 1fr; gap: 10px; align-items: center; }
.ds-color { width: 28px; height: 28px; border-radius: 4px; border: 1px solid var(--linea); }
.ds-muestras code { font: 500 13px/1.4 var(--letra-mono); }
.ds-muestras span.ds-uso { display: block; font-size: 14px; color: var(--tinta-2); }
.ds-panel { position: static; width: min(420px, 100%); max-height: none; border: 1px solid var(--linea); border-radius: 8px; }
.ds-fila { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }`;

const leer = (ruta: string) => readFileSync(join(process.cwd(), ruta), "utf8");
const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Las hojas del producto, una tras otra, con las familias como pila (la tarjeta no carga fuentes). */
export function estilos(): string {
  const partes = HOJAS.map((h) => `/* ── ${h} ── */\n${leer(h).trimEnd()}`);
  return `/* GENERADO por scripts/design-sync/bundle.ts — no editar a mano (tests/unit/design-sync.test.ts detecta la deriva). */\n${FAMILIAS}\n${partes.join("\n")}\n`;
}

function tarjeta(
  grupo: string,
  nombre: string,
  cuerpo: string,
  fuente: string,
): string {
  return `<!-- @dsCard group="${grupo}" name="${nombre}" -->
<!doctype html>
<html lang="es" data-theme="oscuro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Big-D · ${esc(nombre)}</title>
<style>
${estilos()}${PROPIAS}
</style>
</head>
<body>
<main class="ds">
<p class="ojo">Big-D · ${esc(grupo)}</p>
<h1 style="margin:0;font-size:32px;line-height:1.1">${esc(nombre)}</h1>
${cuerpo}
<p class="ds-nota">${fuente}</p>
</main>
</body>
</html>
`;
}

function panel(titulo: string, cerrar: string, contenido: string): string {
  return `<div class="panel ds-panel" role="complementary" aria-label="${esc(titulo)}"><div class="panel-cabeza"><span class="ojo">${esc(titulo)}</span><button type="button" class="cerrar">${esc(cerrar)}</button></div><div class="panel-cuerpo">${contenido}</div></div>`;
}

/** El bundle entero: ruta dentro de `design-sync/` → contenido. */
export function bundle(): Record<string, string> {
  const d = cargarDatos();
  const atlas = d.atlas.get(PLATAFORMA);
  if (!atlas) throw new Error(`design-sync: ${PLATAFORMA} no está publicada`);
  const t = textos("es");
  const v1 = vistaNivel1(atlas, "es", FECHA);
  const v2 = vistaNivel2(atlas, "es", FECHA);
  // El lado a lado de la vitrina: solo la plataforma ficticia (ningún fabricante en la vitrina), con sus bloques y
  // con sus componentes desplegados por el mismo botón (forma aprobada en la mirada M1 del S2).
  const vl = vistaLado({ ...d, plataformas: d.plataformas.filter((p) => p.id === PLATAFORMA), atlas: new Map([[PLATAFORMA, atlas]]) }, "es", FECHA);
  const fila = vl.filas[0]!;
  const lado = (desplegado: boolean) =>
    `<div class="lienzo-marco"><div class="lienzo-cabeza"><button type="button" class="boton boton-sec lado-todo" aria-expanded="${desplegado}">${esc(desplegado ? t.atlas.lado.contraer : t.atlas.lado.desplegar)}</button></div><div class="lienzo"${desplegado ? " data-todo" : ""}><div class="lado-cabecera">${vl.cabecera}</div><div class="lado-filas"><div class="lado-fila" data-fila="${fila.id}" data-inicio><div data-variante="n1">${fila.n1}</div><div data-variante="n2">${fila.n2}</div></div></div></div></div>`;
  // Las versiones de un mapa (D-S2-08) en la vitrina: dos versiones SINTÉTICAS del mapa ficticio, con una
  // diferencia de cada clase (las del ejemplo de la maqueta y de las pruebas del paquete). Nunca un mapa real.
  const nodo = (id: string) => structuredClone(atlas.mapa.nodos.find((n) => n.id === id)!);
  const antes = { ...structuredClone(atlas.mapa), version: "0.1.0" };
  antes.nodos = antes.nodos.map((n) => (n.id === "conector-relacional" ? { ...n, nombre: { es: "Conector JDBC", en: "JDBC connector" } } : n));
  antes.nodos.push({ ...nodo("motor-transformacion"), id: "cuadernos", orden: 3, nombre: { es: "Cuadernos interactivos", en: "Interactive notebooks" } });
  const despues = { ...structuredClone(atlas.mapa), version: "0.2.0" };
  despues.nodos = despues.nodos.map((n) => (n.id === "agente-datos" ? { ...n, madurez: "disponible-general" } : n));
  despues.nodos.push({ ...nodo("agente-datos"), id: "busqueda-vectorial", orden: 2, nombre: { es: "Búsqueda vectorial", en: "Vector search" } });
  const vv = vistaVersiones(
    { ...d, atlas: new Map([[PLATAFORMA, { ...atlas, mapa: despues }]]), versiones: new Map([[PLATAFORMA, [{ version: "0.1.0", mapa: antes, archivo: "sintetica" }]]]) },
    PLATAFORMA,
    "es",
    FECHA,
  );
  const tv = t.atlas.versiones;
  const par = vv.pares[0]!;
  const versiones = `<section class="version-par"><h2>${esc(plantilla(tv.par, { antes: par.antes, despues: par.despues }))}</h2><p class="guia"><b>${esc(tv.guia.entrada)}</b> ${esc(tv.guia.resto)}</p><div class="lienzo-marco"><div class="lienzo version-lienzo">${par.svg}</div></div><div class="version-dif">${par.diferencias}</div><div class="version-dice"><h3>${esc(tv.dice.titulo)}</h3><p>${esc(par.textos.length ? plantilla(tv.dice.cambiaron[par.textos.length === 1 ? 0 : 1], { n: par.textos.length, lista: par.textos.join(", ") }) : tv.dice.ninguno)}</p><p>${esc(par.fuentes ? plural(tv.dice.fuentes, par.fuentes) : tv.dice.sinFuentes)}</p><p class="kit-nota">${esc(tv.dice.nota)}</p></div></section>`;
  const tokens = JSON.parse(leer("docs/diseno/assets/tokens.json")) as {
    temas: Record<string, Record<string, string>>;
    tipos: { token: string; id: string }[];
  };
  const tipos = atlas.gramatica.tipos_de_nodo;
  const neutros: [string, string][] = [
    ["fondo", "fondo de página"],
    ["sup-1", "barra, carriles y lienzo del diagrama"],
    ["sup-2", "tarjetas, controles y paneles"],
    ["linea", "filetes y guías (vetada como texto)"],
    ["tinta-1", "texto principal, marcas, foco"],
    ["tinta-2", "texto secundario, flujos, bordes de control"],
  ];
  const muestras = (tema: string) =>
    `<ul class="ds-muestras">${[
      ...neutros.map(([tk, uso]) => [tk, uso] as const),
      ...tokens.tipos.map(
        (x) =>
          [
            x.token,
            tipos.find((tp) => tp.id === x.id)?.nombre.es ?? x.id,
          ] as const,
      ),
    ]
      .map(
        ([tk, uso]) =>
          `<li><span class="ds-color" style="background:var(--${tk})"></span><span><code>--${tk} · ${tokens.temas[tema]![tk]}</code><span class="ds-uso">${esc(uso)}</span></span></li>`,
      )
      .join("")}</ul>`;
  const color = `<div class="ds-temas"><section class="ds-tema"><h2 class="ojo">Oscuro (primario)</h2>${muestras("oscuro")}</section><section class="ds-tema tema-claro"><h2 class="ojo">Claro</h2>${muestras("claro")}</section></div>`;

  const letra = `<div class="ds-temas"><section class="ds-tema">
<p class="ojo">Ojo de sección · JetBrains Mono 12, mayúsculas</p>
<p style="margin:0;font:700 46px/51px var(--letra);letter-spacing:-0.025em">Título de página</p>
<p style="margin:0;font:400 17px/26px var(--letra);color:var(--tinta-2)">Subtítulo · Space Grotesk 17 / 26</p>
<p style="margin:0;font:400 16px/25px var(--letra)">Cuerpo · Space Grotesk 16 / 25. Sin cursiva: solo se sirve la redonda.</p>
<p style="margin:0;font:500 13px/18px var(--letra-mono);color:var(--tinta-2)">Metadatos · JetBrains Mono 13 / 18 · verificado 2026-09-20 · mapa v0.1.0</p>
</section></div>`;

  const opciones = opcionesPlataforma(d, "es", "general");
  const selector = `<div class="campo campo-plataforma"><label class="campo-etiqueta" for="ds-plataforma">${esc(t.atlas.plataforma.etiqueta)}</label><span class="select"><select id="ds-plataforma" aria-describedby="ds-plataforma-nota">${opciones
    .map(
      (o) =>
        `<option value="${o.id}"${o.ruta ? "" : " disabled"}${o.id === PLATAFORMA ? " selected" : ""}>${esc(o.ruta ? o.nombre : `${o.nombre} — ${t.atlas.plataforma.pronto}`)}</option>`,
    )
    .join(
      "",
    )}</select><svg viewBox="-6 -6 12 12" width="12" height="12" aria-hidden="true" focusable="false"><path d="M-4,-1.5 L0,2.5 L4,-1.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg></span><p class="campo-nota" id="ds-plataforma-nota">${esc(t.atlas.plataforma.nota)}</p></div>`;

  const fuente = (que: string) =>
    `Generado por el motor del diagramador y las vistas del producto sobre la Plataforma Ejemplo (ficticia), consulta ${FECHA}. ${que}`;
  const tarjetas: [string, string, string, string, string][] = [
    [
      "fundamentos/color.html",
      "Fundamentos",
      "Color",
      color,
      "Tokens generados por scripts/paleta/generar-tokens.mjs y medidos (design-system.md § 3.1–3.2, § 7.1). El color nunca va solo: cada tipo lleva además glifo y etiqueta.",
    ],
    [
      "fundamentos/letra.html",
      "Fundamentos",
      "Letra",
      letra,
      "Space Grotesk y JetBrains Mono, SIL OFL 1.1 (design-system.md § 3.3). La tarjeta no carga fuentes: se ven donde están instaladas.",
    ],
    [
      "diagrama/leyenda.html",
      "Diagrama",
      "Leyenda y nota de marcas",
      `<section class="leyenda">${v1.leyenda}</section>`,
      fuente(
        "toLegend: tipos (color + glifo + etiqueta), modos (trazo + marcador), madurez, vigencia y la nota de marcas (ADR design-system-s1-extensions).",
      ),
    ],
    [
      "diagrama/vision-general.html",
      "Diagrama",
      "Visión general (nivel 1)",
      `<div class="lienzo-marco"><div class="lienzo">${v1.svg}</div></div>`,
      fuente("layout + toSVG, vista nivel1."),
    ],
    [
      "componentes-s1/ventana-de-un-bloque.html",
      "Componentes · S1",
      "Ventana de un bloque",
      `<div class="ds-fila">${panel(t.atlas.ventana.titulo, t.atlas.ficha.cerrar, v1.ventanas["consumo-bi"]!)}${panel(t.atlas.ventana.titulo, t.atlas.ficha.cerrar, v1.ventanas["gobierno"]!)}</div>`,
      fuente(
        "Vista «bloque» + toBlockCards: reemplaza a la ficha breve del nivel 1 (ADR design-system-s1-extensions; mirada del usuario 2026-09-29). Lateral desde 900 px, hoja inferior en teléfono.",
      ),
    ],
    [
      "componentes-s1/ficha-de-un-componente.html",
      "Componentes · S1",
      "Ficha de un componente",
      panel(
        t.atlas.ficha.titulo,
        t.atlas.ficha.cerrar,
        v2.fichas["modelo-semantico"]!,
      ),
      fuente("toCard, nivel 2 (design-system.md § 5, «Ficha de nodo»)."),
    ],
    // Dos tarjetas, no una: las dos vistas de la misma fila llevan los mismos ids (en el producto, una sola a la vez).
    [
      "componentes-s2/lado-a-lado.html",
      "Componentes · S2",
      "Lado a lado",
      lado(false),
      fuente(
        "compare, parte «header» y «rows» con levelByBand: la fila con sus bloques. Un solo botón arriba a la derecha del recuadro alterna con todos sus componentes, sin mover las columnas (mirada M1 del S2, 2026-10-02).",
      ),
    ],
    [
      "componentes-s2/lado-a-lado-desplegado.html",
      "Componentes · S2",
      "Lado a lado · desplegado",
      lado(true),
      fuente(
        "compare con todas las bandas en 2: la misma fila con todos sus componentes; el botón dice «Contraer» y las columnas no se movieron (mirada M1 del S2, 2026-10-02).",
      ),
    ],
    [
      "componentes-s2/diferencias-entre-versiones.html",
      "Componentes · S2",
      "Diferencias entre versiones",
      versiones,
      fuente(
        "compare con marks (diff) y diffToText (§ 4.7): arriba la versión anterior, abajo la nueva con una píldora glifo + palabra por clase de cambio, y la lista que las explica; aparte, lo que cambia sin cambiar el dibujo (D-S2-08). Versiones sintéticas del mapa ficticio.",
      ),
    ],
    [
      "componentes-s1/selector-de-plataforma.html",
      "Componentes · S1",
      "Selector de plataforma",
      `<div style="max-width:320px">${selector}</div>`,
      "Las N plataformas por id; las que no tienen mapa dicen «pronto» y no se eligen (ADR design-system-s1-extensions; parada A, 2026-09-27). La nota avisa antes del cambio de página (WCAG 3.2.2).",
    ],
  ];

  const archivos: Record<string, string> = { "styles.css": estilos() };
  for (const [ruta, grupo, nombre, cuerpo, nota] of tarjetas)
    archivos[`components/${ruta}`] = tarjeta(grupo, nombre, cuerpo, nota);
  return archivos;
}
