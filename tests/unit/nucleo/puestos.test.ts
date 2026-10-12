// @vitest-environment node
// AU-S3-08: los puestos que la sensibilidad vigila salen de UNA lista (`TIPOS_DE_PUESTO`). Subir la cantidad a mano ya no es
// posible: la constante, los tipos de evento y lo que emite el motor se derivan de esa lista, y esta prueba falla si la lista
// deja de ser «puesto-2, puesto-3, …» sin huecos o si la constante se separa de ella.
import { describe, expect, it } from "vitest";
import { PUESTOS_VIGILADOS, puestoDe, TIPOS_DE_PUESTO } from "@/engine";
import { futuro } from "./lib/futuro";
import { evaluar } from "@/engine/evaluar";

describe("AU-S3-08: puestos vigilados", () => {
  it("la constante es la lista más el líder, y la lista no tiene huecos", () => {
    expect(PUESTOS_VIGILADOS).toBe(TIPOS_DE_PUESTO.length + 1);
    expect([...TIPOS_DE_PUESTO]).toEqual(
      TIPOS_DE_PUESTO.map((_, i) => `puesto-${i + 2}`),
    );
    expect(TIPOS_DE_PUESTO.map(puestoDe)).toEqual(
      TIPOS_DE_PUESTO.map((_, i) => i + 2),
    );
    expect(puestoDe("lider")).toBe(1);
    expect(puestoDe("empate-entra")).toBe(0);
  });

  it("el motor no emite un tipo de puesto fuera de la lista ni uno que no tenga a quién mirar", () => {
    const r = evaluar(futuro());
    if (r.tipo !== "evaluado")
      throw new Error("el caso de la maqueta debe evaluarse");
    const tipos = new Set(
      r.sensibilidad.flatMap((s) =>
        s.estado === "calculada" ? s.eventos.map((e) => e.tipo) : [],
      ),
    );
    const permitidos = new Set<string>([
      "lider",
      "empate-entra",
      "empate-sale",
      ...TIPOS_DE_PUESTO,
    ]);
    for (const t of tipos) expect(permitidos.has(t)).toBe(true);
  });
});
