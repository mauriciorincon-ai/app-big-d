// @vitest-environment node
// La vista general del atlas en la app. (1) Cadena de fidelidad: con el dato YAML de data/ y el diccionario
// de la interfaz, la app dibuja EXACTAMENTE los bytes de los golden files del diagramador (que se compararon
// contra la maqueta): si el diccionario se aparta de las cadenas de la maqueta, o el YAML de su JSON, rojo.
// (2) La píldora de vigencia dice lo que el motor calculó, en sus tres estados y en los dos idiomas.
import { readFileSync } from "node:fs";
import { layout, toSVG } from "diagramador";
import { describe, expect, it } from "vitest";
import { opcionesPlataforma, pildora, rutasAtlas, textosMotor, vistaNivel1, vistaNivel2, vistaRecorrido } from "@/lib/atlas";
import { cargarDatos } from "@/lib/datos";
import { IDIOMAS, textos } from "@/lib/i18n";

const atlas = cargarDatos().atlas.get("plataforma-ejemplo")!;
const golden = (idioma: string, vista = "nivel-1") => readFileSync(`packages/diagramador/test/golden/plataforma-ejemplo.${vista}.${idioma}.svg`, "utf8");

describe("cadena de fidelidad: dato de la app + diccionario = golden del diagramador", () => {
  it.each(IDIOMAS.flatMap((idioma) => (["nivel-1", "nivel-2", "recorrido"] as const).map((vista) => [vista, idioma] as const)))("%s en %s", (vista, idioma) => {
    const geo = layout(atlas.mapa, atlas.gramatica, vista, { textos: textosMotor(), fechaConsulta: "2026-09-26" });
    expect(toSVG(geo, { language: idioma }) === golden(idioma, vista)).toBe(true);
  });
});

describe("vista general", () => {
  it.each(IDIOMAS)("en %s: SVG enlazado a su lectura y a la pista, índice de capas y leyenda", (idioma) => {
    const v = vistaNivel1(atlas, idioma, "2026-09-26");
    expect(v.svg).toContain(`lang="${idioma}"`);
    expect(v.svg).toContain('aria-details="lectura-texto"');
    expect(v.svg).toContain('aria-describedby="pista-activar"');
    expect(v.lectura).toContain('id="lectura-texto"');
    expect(v.columnas.map((c) => c.x)).toEqual([8, 210, 412, 614, 816, 1018]);
    expect([v.capas, v.franjas]).toEqual([6, 3]);
    expect(v.leyenda).toContain(textos(idioma).motor.leyenda.notaMarcas);
  });

  it("la lectura dice «por revisar» con la fecha de consulta", () => {
    expect(vistaNivel1(atlas, "es", "2026-09-26").lectura).not.toContain("verificado hace");
    expect(vistaNivel1(atlas, "es", "2026-10-20").lectura).toContain("Por revisar: verificado hace 30 días.");
  });
});

describe("píldora de vigencia", () => {
  it("vigente, por revisar y vencido, desde el cálculo del motor", () => {
    const es = (fecha: string) => vistaNivel1(atlas, "es", fecha).pildora;
    expect(es("2026-09-26")).toEqual({ estado: "vigente", resumen: "vigente", detalle: "verificado hace 6 días" });
    expect(es("2026-10-20")).toEqual({ estado: "revisar", resumen: "9 bloques por revisar", detalle: "lo más viejo, hace 30 días" });
    expect(es("2026-11-19")).toEqual({ estado: "vencido", resumen: "9 vencidos", detalle: "lo más viejo, hace 60 días" });
    expect(vistaNivel1(atlas, "en", "2026-10-20").pildora.resumen).toBe("9 blocks to review");
  });

  it("mezcla de vencidos y por revisar, y singulares", () => {
    const t = textos("es").atlas.vigencia;
    const e = (id: string, estado: "vigente" | "revisar" | "vencido") => ({ id, dias: 0, estado });
    expect(pildora({ dias: 61, estado: "vencido", elementos: [e("a", "vencido"), e("b", "revisar"), e("c", "vigente")] }, t)).toEqual({
      estado: "vencido",
      resumen: "1 vencido · 1 por revisar",
      detalle: "lo más viejo, hace 61 días",
    });
    expect(pildora({ dias: 31, estado: "revisar", elementos: [e("a", "revisar"), e("b", "vigente")] }, t).resumen).toBe("1 bloque por revisar");
    expect(pildora({ dias: 1, estado: "vigente", elementos: [e("a", "vigente")] }, t).detalle).toBe("verificado hace 1 día");
  });
});

describe("componentes y recorrido", () => {
  it("el nivel 2 trae una ficha por componente y cuenta componentes por revisar", () => {
    const v = vistaNivel2(atlas, "es", "2026-09-26");
    expect(Object.keys(v.fichas).sort()).toEqual(atlas.mapa.nodos.map((n) => n.id).sort());
    expect(v.fichas["catalogo-central"]).toContain("<h2>Catálogo central</h2>");
    expect(vistaNivel2(atlas, "es", "2026-10-20").pildora.resumen).toBe(`${atlas.mapa.nodos.length} componentes por revisar`);
  });

  it("el recorrido numera sus pasos como el motor, nombra sus ramas y trae el CSS de cada paso", () => {
    const v = vistaRecorrido(atlas, "es", "2026-09-26");
    expect(v.pasos.map((p) => p.numero)).toEqual(["1", "2", "3", "4", "5", "6a", "7a", "6b"]);
    expect(v.pasos.find((p) => p.numero === "5")!.rama).toBe("Se divide en ramas que ocurren a la vez: 6a y 6b.");
    expect(v.pasos.filter((p) => p.rama)).toHaveLength(1);
    expect(v.css).toContain('#rec[data-paso="p1"] .dg-nodo[data-paso~="p1"]');
    expect(vistaRecorrido(atlas, "en", "2026-09-26").pasos[5]!.rama).toBeUndefined();
    expect(vistaRecorrido(atlas, "en", "2026-09-26").pasos[4]!.rama).toBe("Splits into branches that happen at the same time: 6a and 6b.");
  });

  it("el campo «Plataforma» lista las N por id; sin mapa no hay ruta; el nivel se conserva si existe", () => {
    const d = cargarDatos();
    const ops = opcionesPlataforma(d, "es", "recorrido");
    expect(ops.map((o) => o.id)).toEqual(d.plataformas.map((p) => p.id));
    for (const o of ops) expect(Boolean(o.ruta)).toBe(d.atlas.has(o.id));
    expect(ops.find((o) => o.id === "plataforma-ejemplo")!.ruta).toBe("/es/atlas/plataforma-ejemplo/recorrido");
    const sinRecorrido = { ...atlas, mapa: { ...atlas.mapa, recorridos: [] } };
    expect(rutasAtlas(sinRecorrido, "en")).toEqual({ general: "/en/atlas/plataforma-ejemplo", componentes: "/en/atlas/plataforma-ejemplo/componentes" });
  });
});
