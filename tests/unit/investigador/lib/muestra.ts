// Una propuesta de MUESTRA para las pruebas del investigador: el mapa de la Plataforma Ejemplo re-etiquetado
// como otra plataforma ficticia («Plataforma Norte»), con una fuente por nodo en un dominio que no existe
// (ejemplo.invalid) y una afirmación por nodo y por flujo. Las páginas de las fuentes se escriben en disco y
// verificar-citas las lee por un espejo file:// (jamás sale a la red).
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse } from "yaml";
import type { Mapa } from "diagramador";
import type { Propuesta } from "@/lib/investigador";

export const PLATAFORMA = "plataforma-norte";
export const BASE = "https://ejemplo.invalid/";
const RELLENO = "Esta página describe un componente ficticio con suficiente texto para parecer documentación real. ".repeat(8);

export const citaDe = (nodo: string) => `El componente ${nodo} existe y cumple su función en la plataforma.`;

export function mapaNorte(): Mapa {
  const m = parse(readFileSync("data/mapas/plataforma-ejemplo.mapa.yaml", "utf8")) as Mapa;
  return {
    ...m,
    sujeto_id: PLATAFORMA,
    sujeto_nombre: { es: "Plataforma Norte (ficticia)", en: "North Platform (fictional)" },
    estado: "propuesta",
    version: "0.0.0",
    nodos: m.nodos.map((n) => ({ ...n, fuentes: [{ url: `${BASE}${n.id}`, titulo: { es: `Ficha de ${n.id}`, en: `${n.id} sheet` }, fecha: "2026-09-27", tipo: "oficial" as const }] })),
  };
}

export function propuestaNorte(mapa: Mapa = mapaNorte()): Propuesta {
  const coi = { es: "Fuente del fabricante (ficticio): interés en presentar bien su producto.", en: "Vendor source (fictional): interest in presenting its product well." };
  let k = 0;
  const cita = (nodo: string) => ({ url: `${BASE}${nodo}`, texto: citaDe(nodo), titulo: `Ficha de ${nodo}`, tipo: "oficial" as const, conflicto_de_interes: coi });
  return {
    version: 1,
    plataforma: PLATAFORMA,
    fecha: "2026-09-27",
    ejecucion: { herramienta: "claude-code", modelo: "modelo-de-prueba", reintentos: 0 },
    mapa: mapa as unknown as Record<string, unknown>,
    afirmaciones: [
      ...mapa.nodos.map((n) => ({ id: `A-${++k}`, sobre: { entidad: "nodo" as const, id: n.id }, enunciado: { es: `Existe ${n.id}.`, en: `${n.id} exists.` }, cita: cita(n.id) })),
      ...mapa.flujos.map((f) => ({ id: `A-${++k}`, sobre: { entidad: "flujo" as const, id: f.id }, enunciado: { es: `Fluye ${f.id}.`, en: `${f.id} flows.` }, cita: cita(f.origen) })),
    ],
    retiros: [],
    preguntas_guia: [{ pregunta: { es: "¿Hay auditoría de accesos?", en: "Is there access auditing?" }, respondida: false }],
    sin_novedades: false,
  };
}

/**
 * Una raíz temporal con data/ del repo, la plataforma ficticia «próximamente», la propuesta y sus páginas.
 * `sinCita`: nodos cuya página NO trae la cita; `corta`: nodos cuya página casi no trae texto.
 */
export function raizDePrueba(p: Propuesta = propuestaNorte(), opciones: { sinCita?: string[]; corta?: string[] } = {}) {
  const raiz = mkdtempSync(join(tmpdir(), "bigd-inv-"));
  cpSync("data", join(raiz, "data"), { recursive: true });
  writeFileSync(join(raiz, "data/plataformas", `${PLATAFORMA}.yaml`), `id: ${PLATAFORMA}\nnombre:\n  es: Plataforma Norte (ficticia)\n  en: North Platform (fictional)\nestado: proximamente\nficticia: true\n`);
  const carpeta = `propuestas/2026-09-27-${PLATAFORMA}`;
  mkdirSync(join(raiz, carpeta), { recursive: true });
  writeFileSync(join(raiz, carpeta, "propuesta.json"), `${JSON.stringify(p, null, 2)}\n`);
  const paginas = join(raiz, "paginas");
  mkdirSync(paginas);
  for (const n of (p.mapa as unknown as Mapa).nodos) {
    const cita = opciones.sinCita?.includes(n.id) ? "Otro texto." : citaDe(n.id).replace("existe", "&#101;xiste");
    const cuerpo = opciones.corta?.includes(n.id) ? "<p>Cargando…</p>" : `<main><h1>${n.id}</h1><p>${RELLENO}</p><p>${cita}</p></main>`;
    writeFileSync(join(paginas, n.id), `<!doctype html><html><head><script>var x = "${citaDe("oculto")}";</script></head><body>${cuerpo}</body></html>`);
  }
  return { raiz, carpeta, espejo: `${BASE}=file://${paginas}/` };
}
