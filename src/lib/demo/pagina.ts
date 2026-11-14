import { createHash } from "node:crypto";
import { ID_LECTURA, ID_PISTA, plantilla, vistaNivel1 } from "@/lib/atlas";
import { congeladaDe, conocimiento } from "@/lib/caso/casos";
import { datos, fechaDeConsulta } from "@/lib/datos";
import { entradaDe } from "@/lib/datos/instantanea";
import { esc } from "@/lib/html";
import { IDIOMAS, textos, type Idioma } from "@/lib/i18n";
import type { Entrada } from "@/engine";
import { entradaDeExploracion } from "./entrada";
import { atenderDemo, type RespuestaDemo } from "./protocolo";
import { TEXTOS_DEMO, type TextosDemo } from "@/lib/i18n/demo";
import { pesoEscrito, vistaDe, type Contexto } from "./vista";

// S10 (F2): el contenido de la demo pública (anexo E4), armado en el build con el núcleo y los datos de la app. Solo contenido
// público por diseño: el caso ficticio, las plataformas reales publicadas con su atlas, la que viene «próximamente» sin
// puntaje y la declaración del autor. Nada del investigador, de la aprobación, de las propuestas ni de la maqueta; ningún
// enlace sale del paquete (tests/unit/demo-paquete.test.ts lo comprueba sobre los archivos). La página se ve completa sin
// JavaScript (con la respuesta que da Node); con él, el Worker vuelve a calcular y debe dar la MISMA huella.

export const CASO_DEMO = "hospital-futuro";
const caso_ = () => {
  const k = conocimiento();
  const c = k.casos.find((x) => x.id === CASO_DEMO);
  if (!c) throw new Error(`demo: no está el caso ${CASO_DEMO}`);
  return { k, c };
};

const sha256Node = async (t: string) =>
  createHash("sha256").update(t, "utf8").digest("hex");

/** La entrada del núcleo de la demo: el caso del hospital, sin las plataformas ficticias (src/lib/demo/entrada.ts). */
export function entradaDemo(): Entrada {
  const { k, c } = caso_();
  const fuera = new Set(
    k.plataformas.filter((p) => p.ficticia).map((p) => p.id),
  );
  return entradaDeExploracion(entradaDe(c, congeladaDe(k, c)), fuera);
}

export interface DatosCliente {
  entrada: Entrada;
  nombres: Record<string, string>;
  umbralCentesimas: number;
  inicial: RespuestaDemo;
  t: TextosDemo;
}

export interface PaqueteDemo {
  fecha: string;
  paginas: Record<Idioma, string>;
  datos: Record<Idioma, DatosCliente>;
  huellaInicial: string;
}

const etiqueta = (
  nombre: string,
  attrs: Record<string, string | number | undefined>,
  cuerpo = "",
) =>
  `<${nombre}${Object.entries(attrs)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => ` ${k}="${esc(String(v))}"`)
    .join("")}>${cuerpo}</${nombre}>`;

/** Los datos del cliente viajan dentro de la página como bloque de datos (no se ejecuta; la CSP no lo toca): sin `fetch`
 * (lint «planea, no opera») y sin un archivo más. `<` se escribe escapado para que el bloque no pueda cerrarse antes. */
const jsonEnHtml = (x: unknown) => JSON.stringify(x).replace(/</g, "\\u003c");

export async function paqueteDemo(): Promise<PaqueteDemo> {
  const { k, c } = caso_();
  const d = datos();
  const fecha = fechaDeConsulta();
  const entrada = entradaDemo();
  const inicial = await atenderDemo(
    { tipo: "evaluar", id: 0, entrada },
    sha256Node,
  );
  if (inicial.tipo !== "evaluado")
    throw new Error(`demo: el caso no se evalúa (${JSON.stringify(inicial)})`);
  const reales = entrada.base.plataformas.map((p) => p.id);
  const proximas = d.plataformas.filter(
    (p) => p.estado === "proximamente" && !p.ficticia,
  );
  const umbralCentesimas = entrada.base.convenciones.umbral_empate_centesimas;

  const paginas = {} as Record<Idioma, string>;
  const datosCli = {} as Record<Idioma, DatosCliente>;
  for (const idioma of IDIOMAS) {
    const t = TEXTOS_DEMO[idioma];
    const otro = IDIOMAS.find((i) => i !== idioma)!;
    const nombres = Object.fromEntries(
      reales.map((id) => [
        id,
        d.atlas.get(id)?.plataforma.nombre[idioma] ?? id,
      ]),
    );
    const ctx: Contexto = { idioma, t, nombres, umbralCentesimas };
    const v = vistaDe(inicial, ctx);
    datosCli[idioma] = { entrada, nombres, umbralCentesimas, inicial, t };

    const criterios = entrada.caso.pesos.map((p, i) => {
      const cr = k.criterios.find((x) => x.id === p.criterio_id)!;
      const idInput = `peso-${p.criterio_id}`;
      return `<li class="demo-peso"><label for="${idInput}">${esc(cr.nombre[idioma]!)}</label>${etiqueta("input", { type: "range", id: idInput, min: 0, max: 9900, step: 100, value: p.peso, "data-indice": i, "data-criterio": p.criterio_id })}<output for="${idInput}" class="mono" id="${idInput}-valor">${esc(pesoEscrito(p.peso, idioma))}</output></li>`;
    });

    const filas = v.filas.map(
      (f) =>
        `<li class="demo-fila" data-plataforma="${esc(f.plataforma_id)}" data-nombre="${esc(f.nombre)}"><span class="demo-puesto mono">${esc(f.puesto)}</span><span class="demo-nombre">${esc(f.nombre)}</span>${etiqueta("meter", { min: 0, max: 1000, value: f.decimas, "aria-hidden": "true" })}<span class="demo-total mono">${esc(f.total)}</span></li>`,
    );

    const atlas = reales.map((id) => {
      const a = d.atlas.get(id)!;
      const n1 = vistaNivel1(a, idioma, fecha);
      // Tres mapas en una página: los ids que el atlas escribe una sola vez por página (la pista y la lectura) se hacen únicos
      // por plataforma, y la pista que el SVG referencia existe (sin id repetido ni aria-describedby colgante).
      const pista = `${ID_PISTA}-${id}`;
      const lectura = `${ID_LECTURA}-${id}`;
      const svg = n1.svg
        .replaceAll(`aria-describedby="${ID_PISTA}"`, `aria-describedby="${pista}"`)
        .replaceAll(`aria-details="${ID_LECTURA}"`, `aria-details="${lectura}"`);
      const texto = n1.lectura.replaceAll(`id="${ID_LECTURA}"`, `id="${lectura}"`);
      return `<section class="demo-mapa" aria-labelledby="mapa-${id}"><h3 id="mapa-${id}">${esc(a.plataforma.nombre[idioma]!)}</h3><div class="lienzo">${svg}</div><p class="solo-lector" id="${pista}">${esc(textos(idioma).atlas.pistaActivar)}</p><div class="leyenda-motor">${n1.leyenda}</div><details class="lectura-seccion"><summary>${esc(t.lecturaTexto)}</summary>${texto}</details></section>`;
    });

    const html = `<!DOCTYPE html><html lang="${idioma}"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${esc(t.titulo)}</title><meta name="description" content="${esc(t.descripcion)}"/><link rel="stylesheet" href="demo.css"/><script src="demo.js" defer></script></head><body>
<header class="demo-barra"><span class="ojo">${esc(t.ojo)}</span>${etiqueta("a", { href: `${otro}.html`, hreflang: otro, lang: otro, class: "demo-idioma" }, esc(t.otroIdioma.etiqueta))}</header>
<main id="demo" class="demo" data-idioma="${idioma}" data-huella-node="${inicial.huella}">
<h1>${esc(t.h1)}</h1>
<p class="demo-intro">${esc(t.intro)}</p>
<p class="demo-caso"><strong>${esc(c.nombre[idioma]!)}.</strong> ${esc(c.descripcion[idioma]!)}</p>
<p class="demo-rotulo" role="note"><span class="demo-rotulo-signo" aria-hidden="true">✎</span> <strong>${esc(t.rotulo)}.</strong> ${esc(t.rotuloDetalle)}</p>
<noscript><p class="demo-aviso">${esc(t.sinScript)}</p></noscript>
<div class="demo-rejilla">
<section class="demo-panel" aria-labelledby="pesos-titulo"><h2 id="pesos-titulo">${esc(t.pesosTitulo)}</h2><p class="demo-ayuda">${esc(t.pesosAyuda)}</p><ul class="demo-pesos">${criterios.join("")}</ul><button type="button" id="restablecer" class="demo-boton">${esc(t.restablecer)}</button></section>
<section class="demo-panel" aria-labelledby="resultado-titulo"><h2 id="resultado-titulo">${esc(t.resultadoTitulo)}</h2><ol class="demo-filas" id="filas">${filas.join("")}</ol><p id="veredicto" class="demo-veredicto" aria-live="polite">${esc(v.veredicto)}</p>
<h3>${esc(t.huellaTitulo)}</h3><p class="demo-ayuda">${esc(t.huellaAyuda)}</p><p class="demo-huella mono" id="huella">${inicial.huella}</p>
<h3>${esc(t.neutralidadTitulo)}</h3><p class="demo-ayuda">${esc(t.neutralidadAyuda)}</p><button type="button" id="neutralidad" class="demo-boton" disabled>${esc(t.neutralidadBoton)}</button><div id="neutralidad-resultado" class="demo-neutralidad" aria-live="polite" hidden><p id="neutralidad-orden"></p><p class="demo-huella mono" id="neutralidad-huella"></p><p id="neutralidad-veredicto" class="demo-igualdad"></p></div>
<h3>${esc(t.proximamenteTitulo)}</h3><ul class="demo-proximas">${proximas.map((p) => `<li data-proxima="${esc(p.id)}"><span aria-hidden="true">◌</span> ${esc(plantilla(t.proximamente, { nombre: p.nombre[idioma]! }))}</li>`).join("")}</ul>
</section>
</div>
<section class="demo-atlas" aria-labelledby="atlas-titulo"><h2 id="atlas-titulo">${esc(t.atlasTitulo)}</h2><p class="demo-ayuda">${esc(t.atlasAyuda)}</p><p class="demo-ayuda" id="demo-vigencia" data-fecha="${esc(fecha)}">${esc(plantilla(t.vigencia, { fecha }))}</p>${atlas.join("")}</section>
<section class="demo-declaracion" aria-labelledby="declaracion-titulo"><h2 id="declaracion-titulo">${esc(t.declaracionTitulo)}</h2><p>${esc(t.declaracion)}</p></section>
</main>
<script type="application/json" id="datos-demo">${jsonEnHtml(datosCli[idioma])}</script>
<footer class="demo-pie"><p>${esc(textos(idioma).pie)}</p></footer>
</body></html>
`;
    paginas[idioma] = html;
  }
  return { fecha, paginas, datos: datosCli, huellaInicial: inicial.huella };
}
