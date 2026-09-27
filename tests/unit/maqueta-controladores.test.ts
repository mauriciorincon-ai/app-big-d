import { basename } from "node:path";
import { describe, expect, it } from "vitest";
import { archivosMaqueta, leer } from "./lib/maqueta";

// Gate de CONTROLADORES de la maqueta: todo control que la página dibuja tiene cargado el script que lo
// hace funcionar. Nace de un defecto real: la ficha del nivel 2 (atlas-nivel-2.html) se dibujaba con su
// panel y sus preajustes, pero la página nunca cargó assets/ficha.js — ni un clic, ni Enter, ni el
// estado «ficha abierta» de la sala la abrían, y ninguna captura lo delató porque el panel cerrado
// también «mide bien».
const CONTROLES: { marca: string; script: string; que: string }[] = [
  { marca: 'id="panel-ficha"', script: "assets/ficha.js", que: "panel de ficha" },
  { marca: 'id="rec"', script: "assets/recorrido.js", que: "controles del recorrido" },
  { marca: 'class="lado-angosto"', script: "assets/lado.js", que: "vistas y bandas del lado a lado" },
  { marca: "data-imprimir", script: "assets/informe.js", que: "vista de impresión" },
  { marca: 'class="lienzo"', script: "assets/lienzo.js", que: "lienzo deslizable" },
  { marca: "data-lang-set", script: "assets/maqueta.js", que: "conmutadores de idioma y tema" },
];

const paginas = archivosMaqueta(/\.html$/);

describe("maqueta: cada control tiene su controlador cargado", () => {
  it.each(paginas.map((p) => [basename(p), p]))("%s", (_, pagina) => {
    const html = leer(pagina);
    const faltan = CONTROLES.filter((c) => html.includes(c.marca) && !html.includes(`<script src="${c.script}"`)).map((c) => `${c.que} sin ${c.script}`);
    expect(faltan, `${pagina}: ${faltan.join("; ")}`).toEqual([]);
  });
});
