// Una propuesta de EVIDENCIAS de muestra (D-S3-10) para las pruebas del modo evidencias: una evidencia por criterio de
// data/criterios para la plataforma ficticia «Plataforma Norte», con una fuente por evidencia en un dominio que no existe
// (ejemplo.invalid). Las páginas se escriben en disco y verificar-citas las lee por un espejo file:// (jamás sale a la
// red). La primera evidencia está en vista previa pública, para que el tope por madurez tenga algo que mostrar. La
// plataforma tiene su mapa aprobado (el de la Plataforma Ejemplo re-etiquetado): una evidencia nombra sus componentes.
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse, stringify } from "yaml";
import type { PropuestaEvidencias, Verificacion } from "@/lib/investigador";
import { citasDe } from "@/lib/investigador";
import { BASE, mapaNorte, PLATAFORMA } from "./muestra";

const RELLENO = "Esta página describe una función ficticia con suficiente texto para parecer documentación real. ".repeat(8);
export const citaDeCriterio = (c: string) => `La función que evalúa ${c} está disponible de forma general en la plataforma ficticia.`;

interface CriterioCrudo {
  id: string;
  tipo: "capacidad" | "transversal";
  capacidad_id?: string;
}
export const CRITERIOS = readdirSync("data/criterios")
  .filter((f) => f.endsWith(".yaml"))
  .sort()
  .map((f) => parse(readFileSync(join("data/criterios", f), "utf8")) as CriterioCrudo);
export const CARPETA_EV = `propuestas/2026-10-05-${PLATAFORMA}-evidencias`;

export function propuestaEvidenciasNorte(): PropuestaEvidencias {
  return {
    version: 1,
    tipo: "evidencias",
    plataforma: PLATAFORMA,
    fecha: "2026-10-05",
    origen: "agente-investigador",
    ejecucion: { herramienta: "claude-code", modelo: "modelo-de-prueba", reintentos: 0 },
    evidencias: CRITERIOS.map((c, i) => {
      const sufijo = c.id.replace(/^crit-/, "");
      return {
        id: `A-${i + 1}`,
        evidencia: {
          id: `evi-${PLATAFORMA}-${sufijo}`,
          plataforma_id: PLATAFORMA,
          ...(c.tipo === "capacidad" ? { capacidad_id: c.capacidad_id! } : { criterio_id: c.id }),
          afirmacion: { es: `La plataforma resuelve ${sufijo}.`, en: `The platform handles ${sufijo}.` },
          componentes: ["catalogo-central"],
          madurez: i === 0 ? "vista-previa-publica" : "disponible-general",
          puntaje: 3,
          justificacion_puntaje: { es: "3 y no 4: tiene límites documentados. 3 y no 2: está disponible de forma general.", en: "3, not 4: it has documented limits. 3, not 2: it is generally available." },
          esencial: true,
          fuentes: [{ url: `${BASE}${sufijo}`, titulo: `Ficha de ${sufijo}`, tipo: "oficial" as const, conflicto_de_interes: "propio-fabricante" as const, cita: citaDeCriterio(sufijo) }],
        },
      };
    }),
    preguntas_guia: [{ pregunta: { es: "¿Hay precios públicos por región?", en: "Are there public prices per region?" }, respondida: false }],
  };
}

/** Una verificación hecha a mano (para las pruebas puras): todas verificadas salvo las que se digan. */
export function verificacionDe(p: PropuestaEvidencias, sha: string, otros: Record<string, "no-encontrada" | "no-verificable"> = {}): Verificacion {
  return {
    version: 1,
    fecha: "2026-10-05",
    propuesta_sha256: sha,
    resultados: citasDe(p).map((c) => ({ afirmacion: c.id, fuente: c.fuente, url: c.url, resultado: otros[c.id] ?? "verificada", http: 200, sha256: "a".repeat(64) })),
  };
}

/**
 * Una raíz temporal con data/ del repo, la plataforma ficticia y la propuesta de evidencias con sus páginas.
 * `sinCita`: criterios (sin «crit-») cuya página NO trae la cita; `corta`: los que casi no traen texto.
 */
export function raizDeEvidencias(p: PropuestaEvidencias = propuestaEvidenciasNorte(), opciones: { sinCita?: string[]; corta?: string[] } = {}) {
  const raiz = mkdtempSync(join(tmpdir(), "bigd-ev-"));
  cpSync("data", join(raiz, "data"), { recursive: true });
  writeFileSync(join(raiz, "data/plataformas", `${PLATAFORMA}.yaml`), `id: ${PLATAFORMA}\nnombre:\n  es: Plataforma Norte (ficticia)\n  en: North Platform (fictional)\nestado: publicada\nficticia: true\n`);
  writeFileSync(join(raiz, "data/mapas", `${PLATAFORMA}.mapa.yaml`), stringify({ ...mapaNorte(), estado: "aprobada", version: "0.1.0" }, { lineWidth: 0, version: "1.2" }));
  mkdirSync(join(raiz, CARPETA_EV), { recursive: true });
  writeFileSync(join(raiz, CARPETA_EV, "propuesta.json"), `${JSON.stringify(p, null, 2)}\n`);
  const paginas = join(raiz, "paginas");
  mkdirSync(paginas);
  for (const { evidencia } of p.evidencias)
    for (const f of evidencia.fuentes) {
      const slug = f.url.slice(BASE.length);
      const cita = opciones.sinCita?.includes(slug) ? "Otro texto." : f.cita;
      const cuerpo = opciones.corta?.includes(slug) ? "<p>Cargando…</p>" : `<main><h1>${slug}</h1><p>${RELLENO}</p><p>${cita}</p></main>`;
      writeFileSync(join(paginas, slug), `<!doctype html><html><body>${cuerpo}</body></html>`);
    }
  return { raiz, carpeta: CARPETA_EV, espejo: `${BASE}=file://${paginas}/` };
}
