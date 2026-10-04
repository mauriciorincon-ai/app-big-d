// @vitest-environment node
// Las versiones de un mapa (D-S2-08): un par por cada versión y la siguiente, de la más nueva a la más vieja; las
// marcas y la lista de diferencias salen del diagramador; lo que cambia sin cambiar el dibujo (el texto, las fuentes)
// se cuenta aparte; cada bloque de las dos filas abre la ventana de SU versión, y solo la vigente lleva el paso al
// nivel 2. Sobre los datos reales (Fabric tiene archivadas su v0.1.0 y su v0.2.0) y sobre una cadena sintética de la plataforma
// ficticia, con cada clase de cambio.
import type { Mapa } from "diagramador";
import { describe, expect, it } from "vitest";
import { rutaVersiones, vistaVersiones } from "@/lib/atlas";
import { cargarDatos, type Datos } from "@/lib/datos";
import { IDIOMAS } from "@/lib/i18n";

const FECHA = "2026-10-04";
const d = cargarDatos();
const EJEMPLO = "plataforma-ejemplo";

/** Los datos con una cadena de versiones para una plataforma: las anteriores, archivadas; la última, la vigente. */
function conCadena(base: Datos, id: string, cadena: Mapa[]): Datos {
  const atlas = base.atlas.get(id)!;
  return {
    ...base,
    atlas: new Map([...base.atlas, [id, { ...atlas, mapa: cadena.at(-1)! }]]),
    versiones: new Map([
      ...base.versiones,
      [
        id,
        cadena
          .slice(0, -1)
          .map((m) => ({
            version: m.version,
            mapa: m,
            archivo: `data/mapas/versiones/${id}-${m.version}.mapa.yaml`,
          })),
      ],
    ]),
  };
}

/** Tres versiones del mapa ficticio: de la 0.1 a la 0.2 cambia el dibujo (cada clase); de la 0.2 a la 0.3, solo lo que dice. */
function cadena(): Mapa[] {
  const base = d.atlas.get(EJEMPLO)!.mapa;
  const [a, b] = base.nodos.filter(
    (n) => base.nodos.filter((m) => m.bloque_id === n.bloque_id).length > 1,
  );
  const v1 = structuredClone(base);
  v1.version = "0.1.0";
  v1.nodos = v1.nodos.map((n) =>
    n.id === a!.id
      ? { ...n, nombre: { es: "Nombre de antes", en: "Former name" } }
      : n,
  );
  const v2 = structuredClone(base);
  v2.version = "0.2.0";
  // Un retiro como lo hace una aprobación: el componente sale con sus flujos y los recorridos que pasaban por él.
  v2.nodos = v2.nodos.filter((n) => n.id !== b!.id);
  v2.flujos = v2.flujos.filter((f) => f.origen !== b!.id && f.destino !== b!.id);
  v2.recorridos = v2.recorridos.filter((r) => r.pasos.every((p) => p.nodo_id !== b!.id));
  const v3 = structuredClone(v2);
  v3.version = "0.3.0";
  v3.nodos = v3.nodos.map((n, k) =>
    k === 0
      ? {
          ...n,
          lider: {
            es: `${n.lider.es} Otra frase.`,
            en: `${n.lider.en} Another sentence.`,
          },
        }
      : n,
  );
  v3.nodos = v3.nodos.map((n, k) =>
    k === 1
      ? {
          ...n,
          fuentes: [...n.fuentes]
            .reverse()
            .map((f) => ({
              ...f,
              titulo: { en: f.titulo.en, es: `${f.titulo.es} (nueva)` },
            })),
        }
      : n,
  );
  return [v1, v2, v3];
}

describe("versiones de un mapa", () => {
  it("Fabric: dos pares; de v0.2.0 a v0.3.0, dos componentes nuevos en Gobierno; de v0.1.0 a v0.2.0, nada en el dibujo", () => {
    const v = vistaVersiones(d, "fabric", "es", FECHA, {
      "0.2.0": "2026-10-04",
      "0.3.0": "2026-10-04",
    });
    expect(v.vigente).toBe("0.3.0");
    expect(v.pares.map((p) => [p.antes, p.despues, p.aprobada])).toEqual([
      ["0.2.0", "0.3.0", "2026-10-04"],
      ["0.1.0", "0.2.0", "2026-10-04"],
    ]);
    const [gobierno, lago] = v.pares;
    // Los dos nuevos viven en el mismo bloque: una sola pastilla «nuevo» en el bloque (una por clase presente).
    expect(gobierno!.svg.match(/class="dg-dif [^"]*"/g)).toEqual(['class="dg-dif dg-dif-nuevo"']);
    expect(gobierno!.diferencias.match(/data-nodo="[^"]+"/g)).toEqual(['data-nodo="auditoria"', 'data-nodo="catalogo-onelake"']);
    expect(gobierno!.diferencias).toContain("Además, 4 cambios en flujos o pasos.");
    expect(gobierno!.textos).toEqual(["Seguridad de OneLake", "Etiquetas de confidencialidad"]);
    expect(gobierno!.fuentes).toBe(2);
    expect(lago!.diferencias).toContain("Sin cambios en el dibujo");
    expect(lago!.svg).not.toContain('class="dg-dif ');
    expect(lago!.textos).toHaveLength(6);
    // Nueve con otra fuente; en los otros diez solo cambió la fecha de consulta, que no cuenta (S2-AUD-36).
    expect(lago!.fuentes).toBe(9);
  });

  it("un par con una versión histórica no se dibuja: solo dice cuál es (ADR map-versioning, decisión 6)", () => {
    const [v1, v2, v3] = cadena();
    const datos = conCadena(d, EJEMPLO, [v2!, v3!]);
    const conHistorica = {
      ...datos,
      historicas: new Map([[EJEMPLO, [{ version: v1!.version, archivo: "sintetica", motivos: ["V1"] }]]]),
    };
    const v = vistaVersiones(conHistorica, EJEMPLO, "es", FECHA);
    expect(v.pares.map((p) => [`${p.antes}→${p.despues}`, p.historica ?? null, p.svg === ""])).toEqual([
      ["0.2.0→0.3.0", null, false],
      ["0.1.0→0.2.0", "0.1.0", true],
    ]);
  });

  it("una fuente que solo cambió su fecha de consulta no es una fuente renovada", () => {
    const v1 = structuredClone(d.atlas.get(EJEMPLO)!.mapa);
    v1.version = "0.1.0";
    const v2 = structuredClone(v1);
    v2.version = "0.2.0";
    v2.nodos = v2.nodos.map((n) => ({ ...n, fuentes: n.fuentes.map((f) => ({ ...f, fecha: "2026-12-31" })) }));
    const [p] = vistaVersiones(conCadena(d, EJEMPLO, [v1, v2]), EJEMPLO, "es", FECHA).pares;
    expect(p!.fuentes).toBe(0);
    expect(p!.textos).toEqual([]);
  });

  it("una plataforma con una sola versión no tiene pares (estado vacío)", () => {
    for (const id of [...d.atlas.keys()].filter((x) => !d.versiones.has(x)))
      expect(vistaVersiones(d, id, "es", FECHA).pares).toEqual([]);
  });

  it("una cadena de tres versiones da dos pares, de la más nueva a la más vieja, cada uno con lo suyo", () => {
    const datos = conCadena(d, EJEMPLO, cadena());
    for (const idioma of IDIOMAS) {
      const v = vistaVersiones(datos, EJEMPLO, idioma, FECHA);
      expect(v.pares.map((p) => `${p.antes}→${p.despues}`)).toEqual([
        "0.2.0→0.3.0",
        "0.1.0→0.2.0",
      ]);
      const [reciente, vieja] = v.pares;
      // 0.1 → 0.2: un renombre y un retiro, marcados en el dibujo y explicados en la lista.
      expect(vieja!.svg).toContain('data-marca="renombrado"');
      expect(vieja!.svg).toContain('data-marca="retirado"');
      expect(vieja!.diferencias).toContain("dg-dif-renombrado");
      expect(vieja!.diferencias).toContain("dg-dif-retirado");
      // 0.2 → 0.3: nada en el dibujo; un texto y unas fuentes, contados aparte.
      expect(reciente!.svg).not.toContain("data-marca=");
      expect(reciente!.textos).toHaveLength(1);
      expect(reciente!.fuentes).toBe(1);
      // Cada par enlaza su lista como su versión en texto (G10) y no repite ids con el otro.
      for (const p of v.pares)
        expect(p.svg).toContain(
          `aria-details="dif-${EJEMPLO}-${p.antes.replace(/\./g, "-")}-${p.despues.replace(/\./g, "-")}"`,
        );
      const ids = (svg: string) =>
        [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
      expect(
        ids(reciente!.svg).filter((x) => ids(vieja!.svg).includes(x)),
      ).toEqual([]);
    }
  });

  it("cada bloque dibujado abre la ventana de su versión; solo la vigente lleva el paso al nivel 2", () => {
    const v = vistaVersiones(
      conCadena(d, EJEMPLO, cadena()),
      EJEMPLO,
      "es",
      FECHA,
    );
    for (const p of v.pares)
      for (const [, dueno] of p.svg.matchAll(
        /class="dg-elem[^"]*"[^>]*data-dueno="([^"]+)"/g,
      ))
        expect(v.fichas[dueno!], dueno).toBeDefined();
    const de = (version: string) =>
      Object.entries(v.fichas).filter(([k]) =>
        k.startsWith(`${EJEMPLO}-v${version.replace(/\./g, "-")}/`),
      );
    expect(de("0.3.0").length).toBeGreaterThan(0);
    for (const [, html] of de("0.3.0")) expect(html).toContain("ventana-mas");
    for (const version of ["0.1.0", "0.2.0"]) {
      expect(de(version).length).toBeGreaterThan(0);
      for (const [k, html] of de(version)) {
        expect(html, k).not.toContain("ventana-mas");
        expect(html, k).toContain(`versión ${version}`);
      }
    }
  });

  it("reescribir el YAML con las claves en otro orden no cuenta como cambio de texto ni de fuentes", () => {
    const base = d.atlas.get(EJEMPLO)!.mapa;
    const antes = { ...structuredClone(base), version: "0.0.9" };
    const reordenar = <T extends object>(o: T): T =>
      Object.fromEntries(Object.entries(o).reverse()) as T;
    const despues = {
      ...structuredClone(base),
      nodos: base.nodos.map((n) =>
        reordenar({
          ...n,
          fuentes: n.fuentes.map(reordenar),
          lider: reordenar(n.lider),
        }),
      ),
    };
    const [p] = vistaVersiones(
      conCadena(d, EJEMPLO, [antes, despues]),
      EJEMPLO,
      "es",
      FECHA,
    ).pares;
    expect([p!.textos, p!.fuentes]).toEqual([[], 0]);
  });

  it("la ruta", () => {
    expect(rutaVersiones("en", "fabric")).toBe("/en/atlas/fabric/versiones");
  });
});
