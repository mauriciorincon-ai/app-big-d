// @vitest-environment node
// S9 (F1): el entrevistador. Neutral (ninguna pregunta nombra una plataforma), determinista (enteros, suma 10 000, el orden de los
// criterios y de las plataformas no cambia el perfil), con origen `entrevista` y sin modelo. Reglas del dato, no del código.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { perfilDeEntrevista, type ConvencionEntrevista } from "@/engine";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";

const k = cargarConocimiento();
const conv: ConvencionEntrevista = k.entrevista;
const ids = k.criterios.map((c) => c.id);
const nivel = fc.constantFrom(...conv.niveles.map((n) => n.id));
const respuestasDe = fc.tuple(...ids.map(() => nivel)).map((ns) => Object.fromEntries(ids.map((c, i) => [c, ns[i]!])));

describe("las preguntas del dato", () => {
  it("cubren cada criterio de la base exactamente una vez, en los dos idiomas", () => {
    expect(conv.preguntas.map((p) => p.criterio_id).sort()).toEqual([...ids].sort());
    for (const p of k.entrevista.preguntas) {
      expect(p.texto.es.length).toBeGreaterThan(10);
      expect(p.texto.en.length).toBeGreaterThan(10);
    }
  });

  it("ninguna pregunta ni nivel nombra una plataforma, ni una palabra de su nombre (0 coincidencias)", () => {
    // El dato no trae alias: estos son los de uso común de los fabricantes de hoy, para que un alias tampoco se cuele.
    const alias = ["msft", "azure", "onelake", "synapse", "unity", "dbx", "snowpark"];
    const genericas = new Set(["plataforma", "platform", "ejemplo", "example", "ficticia", "fictional"]);
    const nombres = k.plataformas.flatMap((p) => [p.id, ...Object.values(p.nombre)]);
    const palabras = new Set([...nombres.flatMap((n) => n.toLowerCase().split(/[^\p{L}\p{N}]+/u)), ...alias].filter((w) => w.length >= 4 && !genericas.has(w)));
    const textos = [
      ...k.entrevista.preguntas.flatMap((p) => [p.texto.es, p.texto.en]),
      ...k.entrevista.niveles.flatMap((n) => [n.texto.es, n.texto.en]),
      k.entrevista.introduccion.es,
      k.entrevista.introduccion.en,
    ].map((t) => t.toLowerCase());
    const halladas = [...palabras].filter((w) => textos.some((t) => new RegExp(`(^|[^\\p{L}\\p{N}])${w}($|[^\\p{L}\\p{N}])`, "u").test(t)));
    expect(halladas).toEqual([]);
  });
});

describe("perfilDeEntrevista", () => {
  it("con respuestas faltantes dice cuántas; con todo en 0 no hay con qué repartir", () => {
    expect(perfilDeEntrevista(conv, ids, {})).toEqual({ tipo: "incompleta", faltan: ids.length, total: ids.length });
    expect(perfilDeEntrevista(conv, ids, { [ids[0]!]: "decisivo" })).toMatchObject({ tipo: "incompleta", faltan: ids.length - 1 });
    expect(perfilDeEntrevista(conv, ids, { [ids[0]!]: "no-es-un-nivel" })).toMatchObject({ tipo: "incompleta", faltan: ids.length });
    expect(perfilDeEntrevista(conv, ids, Object.fromEntries(ids.map((c) => [c, "poco"])))).toEqual({ tipo: "sin-prioridad" });
  });

  it("propiedad: los pesos son enteros no negativos que suman 10 000, proporcionales al valor, y nacen con origen entrevista", () => {
    const valor = new Map(conv.niveles.map((n) => [n.id, n.valor]));
    fc.assert(
      fc.property(respuestasDe, (r) => {
        const p = perfilDeEntrevista(conv, ids, r);
        const suma = ids.reduce((s, c) => s + valor.get(r[c]!)!, 0);
        if (suma === 0) return expect(p).toEqual({ tipo: "sin-prioridad" });
        if (p.tipo !== "completa") throw new Error("debía ser completa");
        expect(p.origen).toBe("entrevista");
        expect(p.pesos.reduce((s, x) => s + x.peso_centesimas, 0)).toBe(10_000);
        for (const x of p.pesos) {
          expect(Number.isInteger(x.peso_centesimas)).toBe(true);
          const exacto = (10_000 * valor.get(r[x.criterio_id]!)!) / suma;
          expect(Math.abs(x.peso_centesimas - exacto)).toBeLessThan(1);
          // un criterio que vale 0 pesa 0; uno que vale más no pesa menos que uno que vale menos
          if (valor.get(r[x.criterio_id]!) === 0) expect(x.peso_centesimas).toBe(0);
        }
        expect(p.conserva_restricciones).toEqual(ids.filter((c) => valor.get(r[c]!)! >= conv.conserva_restricciones_desde).sort());
      }),
      { seed: 20261202, numRuns: 200 },
    );
  });

  it("propiedad: reordenar los criterios no cambia ningún byte del perfil (ni el de las plataformas, que no entran)", () => {
    fc.assert(
      fc.property(respuestasDe, fc.integer({ min: 0, max: 10_000 }), (r, giro) => {
        const k2 = giro % ids.length;
        const girados = [...ids.slice(k2), ...ids.slice(0, k2)];
        const invertidos = [...ids].reverse();
        const a = JSON.stringify(perfilDeEntrevista(conv, ids, r));
        expect(JSON.stringify(perfilDeEntrevista(conv, girados, r))).toBe(a);
        expect(JSON.stringify(perfilDeEntrevista(conv, invertidos, r))).toBe(a);
        // reordenar las preguntas del dato tampoco
        const conv2 = { ...conv, preguntas: [...conv.preguntas].reverse(), niveles: conv.niveles };
        expect(JSON.stringify(perfilDeEntrevista(conv2, ids, r))).toBe(a);
      }),
      { seed: 20261203, numRuns: 100 },
    );
  });

  it("un empate en los restos se desempata por id del criterio, no por posición", () => {
    const c: ConvencionEntrevista = { niveles: [{ id: "a", valor: 1 }], conserva_restricciones_desde: 1, preguntas: [] };
    const r = perfilDeEntrevista(c, ["crit-c", "crit-a", "crit-b"], { "crit-a": "a", "crit-b": "a", "crit-c": "a" });
    expect(r).toMatchObject({ tipo: "completa", pesos: [{ criterio_id: "crit-a", peso_centesimas: 3334 }, { criterio_id: "crit-b", peso_centesimas: 3333 }, { criterio_id: "crit-c", peso_centesimas: 3333 }] });
  });
});
