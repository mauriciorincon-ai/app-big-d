// @vitest-environment node
// El núcleo del investigador, todo por código: verificar una cita en la página cruda, la huella canónica,
// validar una propuesta, aplicar la decisión humana y aprobar. Sin red y sin tocar data/ del repo.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import type { Gramatica, Mapa } from "diagramador";
import {
  aplicarDecisiones,
  aprobar,
  comandoAprobar,
  ErrorDeAprobacion,
  huella,
  htmlATexto,
  leerDecisiones,
  sha256,
  validarPropuesta,
  verificarCita,
  type Verificacion,
} from "@/lib/investigador";
import { mapaNorte, propuestaNorte } from "./lib/muestra";

const G = parse(readFileSync("data/gramaticas/plataformas-datos.gramatica.yaml", "utf8")) as Gramatica;
const RANGOS = JSON.parse(readFileSync("packages/diagramador/metricas/cobertura.json", "utf8")).fuentes["space-grotesk"].rangos;
const LARGO = "Texto de relleno de una página de documentación. ".repeat(12);
const SCRIPT = ["scripts", "apro" + "bar.mjs"].join("/");

describe("verificar una cita en la página cruda", () => {
  it("la encuentra aunque cambien mayúsculas, comillas, guiones, espacios y entidades; ignora scripts", () => {
    const html = `<html><script>var c = "OneLake is the lake";</script><p>${LARGO}</p><p>OneLake&nbsp;is   the “one” lake — for&#32;the <b>whole</b> org.</p></html>`;
    expect(verificarCita(200, html, 'onelake is the "one" lake - for the whole org.')).toEqual({ resultado: "verificada" });
    expect(htmlATexto(html)).not.toContain("var c");
  });
  it("no encontrada si las palabras no están; no verificable si no hay 200 o la página casi no trae texto", () => {
    expect(verificarCita(200, `<p>${LARGO}</p>`, "OneLake is the one lake").resultado).toBe("no-encontrada");
    expect(verificarCita(404, `<p>${LARGO}</p>`, "x").resultado).toBe("no-verificable");
    expect(verificarCita(null, null, "x").resultado).toBe("no-verificable");
    expect(verificarCita(200, `<p>${LARGO}</p><p>A&#x41;&#65;&amp;&foo;&#0;</p>`, "aaa&&foo;&#0;").resultado).toBe("verificada");
    expect(verificarCita(200, "<div id=app></div>", "x")).toEqual({ resultado: "no-verificable", motivo: "la página casi no trae texto (se arma con JavaScript)" });
  });
});

describe("huella canónica", () => {
  it("no depende del orden de las claves y cambia con un byte de contenido", () => {
    expect(huella({ b: 1, a: [1, { d: "x", c: true }] })).toBe(huella({ a: [1, { c: true, d: "x" }], b: 1 }));
    expect(huella({ a: "x" })).not.toBe(huella({ a: "y" }));
    expect(sha256("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("validar una propuesta", () => {
  it("la muestra pasa", () => {
    const r = validarPropuesta(propuestaNorte(), G, RANGOS);
    expect(r.fallas).toEqual([]);
    expect(r.ok).toBe(true);
  });
  it("falla con ruta y motivo: forma, mapa, coherencia", () => {
    const sinFlujo = propuestaNorte();
    sinFlujo.afirmaciones = sinFlujo.afirmaciones.filter((a) => a.sobre.id !== "f-cruda-motor");
    expect(validarPropuesta(sinFlujo, G, RANGOS).fallas).toEqual(["afirmaciones · flujo f-cruda-motor no tiene ninguna afirmación que lo respalde"]);

    const otraFuente = propuestaNorte();
    otraFuente.afirmaciones[0]!.cita.url = "https://ejemplo.invalid/otra";
    expect(validarPropuesta(otraFuente, G, RANGOS).fallas[0]).toMatch(/^afirmaciones · A-1 cita https:\/\/ejemplo\.invalid\/otra, que no es fuente de ese componente$/);

    const aprobada = propuestaNorte({ ...mapaNorte(), estado: "aprobada" });
    expect(validarPropuesta(aprobada, G, RANGOS).fallas).toContain("mapa/estado · una propuesta nace «propuesta», no «aprobada»");

    const sinFuentes = mapaNorte();
    sinFuentes.nodos[0]!.fuentes = [];
    expect(validarPropuesta(propuestaNorte(sinFuentes), G, RANGOS).fallas[0]).toMatch(/^mapa\/nodos\/0\/fuentes · V\d+ · /);

    const fantasma = propuestaNorte();
    fantasma.afirmaciones[0]!.sobre = { entidad: "nodo", id: "no-existe" };
    expect(validarPropuesta(fantasma, G, RANGOS).fallas).toContain("afirmaciones · A-1 habla de un nodo que no está en el mapa («no-existe»)");
    const repetida = propuestaNorte();
    repetida.afirmaciones[1]!.id = "A-1";
    expect(validarPropuesta(repetida, G, RANGOS).fallas).toContain("afirmaciones · A-1 repetida");
    const ajena = propuestaNorte({ ...mapaNorte(), sujeto_id: "otra" });
    expect(validarPropuesta(ajena, G, RANGOS).fallas).toContain("mapa/sujeto_id · «otra» no es la plataforma investigada («plataforma-norte»)");

    // Dibujo: un nombre de componente que no cabe en su ficha de franja (nivel 2 y recorrido: se dice una vez).
    const nombreLargo = mapaNorte();
    nombreLargo.nodos = nombreLargo.nodos.map((n) => (n.id === "catalogo-central" ? { ...n, nombre: { es: "Catálogo central de metadatos con linaje y clasificación", en: "Central catalog" } } : n));
    expect(validarPropuesta(propuestaNorte(nombreLargo), G, RANGOS).fallas).toEqual(["dibujo · nivel-2 · ficha catalogo-central (es): 4 líneas; caben 2"]);

    const corta = propuestaNorte();
    corta.afirmaciones[0]!.cita.texto = "corta";
    expect(validarPropuesta(corta, G, RANGOS).fallas).toEqual(["afirmaciones.0.cita.texto · una cita de al menos 12 caracteres"]);
  });
});

describe("aplicar la decisión humana", () => {
  it("rechazar un componente se lleva sus flujos, los recorridos que pasan por él y el bloque que queda vacío", () => {
    const p = propuestaNorte();
    const agente = p.afirmaciones.find((a) => a.sobre.id === "agente-datos")!;
    const m = aplicarDecisiones(p.mapa as unknown as Mapa, p.afirmaciones, new Set([agente.id]));
    expect(m.nodos.some((n) => n.id === "agente-datos")).toBe(false);
    expect(m.flujos.some((f) => f.destino === "agente-datos")).toBe(false);
    expect(m.recorridos).toEqual([]);
    expect(m.bloques.some((b) => b.id === "agentes")).toBe(false);
  });
  it("rechazar un flujo que el recorrido necesita se lleva el recorrido (la condición de V5)", () => {
    const p = propuestaNorte();
    const f = p.afirmaciones.find((a) => a.sobre.id === "f-cruda-motor")!;
    const m = aplicarDecisiones(p.mapa as unknown as Mapa, p.afirmaciones, new Set([f.id]));
    expect(m.flujos.some((x) => x.id === "f-cruda-motor")).toBe(false);
    expect(m.recorridos).toEqual([]);
    const otro = p.afirmaciones.find((a) => a.sobre.id === "f-conector-cruda")!;
    expect(aplicarDecisiones(p.mapa as unknown as Mapa, p.afirmaciones, new Set([otro.id])).recorridos).toHaveLength(1);
  });
});

describe("aprobar", () => {
  const p = propuestaNorte();
  const bytes = JSON.stringify(p);
  const ids = p.afirmaciones.map((a) => a.id);
  const verificacion = (resultado: (id: string) => "verificada" | "no-encontrada" | "no-verificable" = () => "verificada"): Verificacion => ({
    version: 1,
    fecha: "2026-09-27",
    propuesta_sha256: sha256(bytes),
    resultados: p.afirmaciones.map((a) => ({ afirmacion: a.id, url: a.cita.url, resultado: resultado(a.id), http: 200, sha256: "0".repeat(64) })),
  });
  const entrada = (extra = {}) => ({ carpeta: "propuestas/x", propuesta: p, propuestaSha256: sha256(bytes), verificacion: verificacion(), aprobadas: ids, rechazadas: [], gramatica: G, rangos: RANGOS, fecha: "2026-09-28", ...extra });
  const fallas = (f: () => unknown) => {
    try {
      f();
    } catch (e) {
      if (e instanceof ErrorDeAprobacion) return e.fallas;
      throw e;
    }
    return [];
  };

  it("todo aprobado: mapa «aprobada» v0.1.0 con la fecha de verificación, y su revisión", () => {
    const { mapa, revision } = aprobar(entrada());
    expect(mapa.estado).toBe("aprobada");
    expect(mapa.version).toBe("0.1.0");
    expect(new Set(mapa.nodos.map((n) => n.fecha_verificacion))).toEqual(new Set(["2026-09-27"]));
    expect(revision).toMatchObject({ resultado: "aprobada", mapa_version: "0.1.0", rechazadas: [], propuesta: "propuestas/x" });
    expect(revision.huella).toBe(huella(mapa));
  });

  it("rechaza: otra versión de la propuesta, afirmaciones sin decidir o repetidas, y aprobar una cita no encontrada", () => {
    expect(fallas(() => aprobar(entrada({ propuestaSha256: "f".repeat(64) })))).toEqual(["verificacion.json es de otra versión de la propuesta: vuelve a correr scripts/verificar-citas.mjs"]);
    expect(fallas(() => aprobar(entrada({ aprobadas: ids.slice(1) })))).toEqual(["A-1 no tiene decisión: va en --aprobar o en --rechazar"]);
    expect(fallas(() => aprobar(entrada({ rechazadas: ["A-1"] })))).toEqual(["A-1 tiene más de una decisión"]);
    expect(fallas(() => aprobar(entrada({ aprobadas: [...ids, "A-999"] })))).toEqual(["A-999 no es una afirmación de esta propuesta"]);
    const incompleta = { ...verificacion(), resultados: verificacion().resultados.slice(1) };
    expect(fallas(() => aprobar(entrada({ verificacion: incompleta })))).toEqual(["A-1 no fue verificada"]);
    const noEncontrada = verificacion((id) => (id === "A-2" ? "no-encontrada" : "verificada"));
    expect(fallas(() => aprobar(entrada({ verificacion: noEncontrada })))).toEqual(["A-2: su cita no aparece en la fuente; el código la rechazó y no se puede aprobar"]);
  });

  it("si lo que queda rompe una regla del contrato, no aprueba y dice cuál", () => {
    // Sin los componentes de tres bloques quedan 4, y la gramática pide al menos 5 (V7).
    const fuera = new Set(["agente-datos", "modelo-semantico", "tablero", "catalogo-central", "filtros-filas"]);
    const rechazadas = p.afirmaciones.filter((a) => a.sobre.entidad === "nodo" && fuera.has(a.sobre.id)).map((a) => a.id);
    const f = fallas(() => aprobar(entrada({ aprobadas: ids.filter((i) => !rechazadas.includes(i)), rechazadas })));
    expect(f).toEqual(["mapa/bloques · V7 · plataforma-norte · 4 bloques; la gramática admite de 5 a 8"]);
  });

  it("si lo que queda no se dibuja, no aprueba y dice qué no cabe (el build no publicaría ese atlas)", () => {
    const base = p.mapa as unknown as Mapa;
    const larga = { ...base, bloques: base.bloques.map((b) => (b.id === "almacen" ? { ...b, nombre: { es: "Almacenamiento central", en: "Central store" } } : b)) };
    const q = propuestaNorte(larga);
    const b = JSON.stringify(q);
    const v = { ...verificacion(), propuesta_sha256: sha256(b) };
    expect(fallas(() => aprobar(entrada({ propuesta: q, propuestaSha256: sha256(b), verificacion: v })))).toEqual([
      "dibujo · nivel-1 · nombre de almacen (es): la palabra «Almacenamiento» no cabe en 104 u",
    ]);
  });

  it("sin novedades: el mismo contenido que el aprobado solo renueva las fechas, con la versión de antes", () => {
    const base = p.mapa as unknown as Mapa;
    const anterior = { ...base, estado: "aprobada" as const, version: "0.3.0", fecha_actualizacion: "2026-08-01", nodos: base.nodos.map((n) => ({ ...n, fecha_verificacion: "2026-08-01" })) };
    const { mapa, revision } = aprobar(entrada({ anterior }));
    expect(revision.resultado).toBe("sin-novedades");
    expect(mapa.version).toBe("0.3.0");
    expect(mapa.nodos.every((n) => n.fecha_verificacion === "2026-09-27")).toBe(true);
    const cambiado = aprobar(entrada({ anterior: { ...anterior, nodos: anterior.nodos.slice(1) } }));
    expect(cambiado.revision.resultado).toBe("aprobada");
    expect(cambiado.mapa.version).toBe("0.4.0");
  });
});

describe("comando de aprobación", () => {
  it("lo que arma la pantalla es lo que lee el script", () => {
    const c = comandoAprobar("propuestas/2026-09-27-fabric", ["A-1", "A-3"], ["A-2"]);
    expect(c).toBe(`node ${SCRIPT} propuestas/2026-09-27-fabric --aprobar A-1,A-3 --rechazar A-2`);
    expect(leerDecisiones(c.split(" ").slice(2))).toEqual({ carpeta: "propuestas/2026-09-27-fabric", aprobadas: ["A-1", "A-3"], rechazadas: ["A-2"] });
    expect(leerDecisiones(comandoAprobar("propuestas/x", ["A-1"], []).split(" ").slice(2)).rechazadas).toEqual([]);
    expect(() => leerDecisiones(["propuestas/x", "--aprobar", "A-1"])).toThrow(/falta --rechazar/);
  });
});
