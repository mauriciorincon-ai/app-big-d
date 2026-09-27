// @vitest-environment node
// La vista general del atlas en la app. (1) Cadena de fidelidad: con el dato YAML de data/ y el diccionario
// de la interfaz, la app dibuja EXACTAMENTE los bytes de los golden files del diagramador (que se compararon
// contra la maqueta): si el diccionario se aparta de las cadenas de la maqueta, o el YAML de su JSON, rojo.
// (2) La píldora de vigencia dice lo que el motor calculó, en sus tres estados y en los dos idiomas.
import { readFileSync } from "node:fs";
import { layout, toSVG } from "diagramador";
import { describe, expect, it } from "vitest";
import { pildora, textosMotor, vistaNivel1 } from "@/lib/atlas";
import { cargarDatos } from "@/lib/datos";
import { IDIOMAS, textos } from "@/lib/i18n";

const atlas = cargarDatos().atlas.get("plataforma-ejemplo")!;
const golden = (idioma: string) => readFileSync(`packages/diagramador/test/golden/plataforma-ejemplo.nivel-1.${idioma}.svg`, "utf8");

describe("cadena de fidelidad: dato de la app + diccionario = golden del diagramador", () => {
  it.each(IDIOMAS)("nivel 1 en %s", (idioma) => {
    const geo = layout(atlas.mapa, atlas.gramatica, "nivel-1", { textos: textosMotor(), fechaConsulta: "2026-09-26" });
    expect(toSVG(geo, { language: idioma }) === golden(idioma)).toBe(true);
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
