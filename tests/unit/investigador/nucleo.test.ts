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
  type Retiro,
  type Verificacion,
} from "@/lib/investigador";
import { BASE, mapaNorte, propuestaNorte } from "./lib/muestra";

const G = parse(readFileSync("data/gramaticas/plataformas-datos.gramatica.yaml", "utf8")) as Gramatica;
const RANGOS = JSON.parse(readFileSync("packages/diagramador/metricas/cobertura.json", "utf8")).fuentes["space-grotesk"].rangos;
const LARGO = "Texto de relleno de una página de documentación. ".repeat(12);
const SCRIPT = ["scripts", "apro" + "bar.mjs"].join("/");
const COI = { es: "Fuente del fabricante (ficticio): interés en presentar bien su producto.", en: "Vendor source (fictional): interest in presenting its product well." };
/** Un retiro con su motivo y una cita oficial (la página del catálogo central dice adónde fue a parar). */
const retiroDe = (id: string, nodo: string, extra: Partial<Retiro> = {}): Retiro => ({
  id,
  sobre: { entidad: "nodo", id: nodo },
  motivo: { es: `El fabricante retiró ${nodo}; sus funciones pasaron al catálogo central.`, en: `The vendor retired ${nodo}; its functions moved to the central catalogue.` },
  cita: { url: `${BASE}catalogo-central`, texto: `El componente ${nodo} se retiró y sus funciones viven ahora en el catálogo central.`, titulo: "Ficha de catalogo-central", tipo: "oficial", conflicto_de_interes: COI },
  ...extra,
});
const SIN_ARGUMENTO = (que: string, id: string) => `retiros · ${que} «${id}» sale del mapa sin argumento: agrega un retiro con su motivo y una cita que lo pruebe, o devuélvelo al mapa`;

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
    expect(validarPropuesta(propuestaNorte(nombreLargo), G, RANGOS).fallas).toEqual([
      "dibujo · lado a lado desplegado · texto: nombre de catalogo-central (es): 4 líneas; caben 3",
      "dibujo · nivel2 · texto: ficha catalogo-central (es): 4 líneas; caben 2",
    ]);

    const corta = propuestaNorte();
    corta.afirmaciones[0]!.cita.texto = "corta";
    expect(validarPropuesta(corta, G, RANGOS).fallas).toEqual(["afirmaciones.0.cita.texto · una cita de al menos 40 caracteres"]);
  });
  it("A-3: «sin novedades» no apaga la exigencia de cita", () => {
    const vacia = { ...propuestaNorte(), sin_novedades: true, afirmaciones: [] };
    const f = validarPropuesta(vacia, G, RANGOS).fallas;
    expect(f.length).toBeGreaterThan(0);
    expect(f.every((x) => x.endsWith("no tiene ninguna afirmación que lo respalde"))).toBe(true);
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

// Decisión de la persona (2026-09-30, M-8): «data lake» es el nombre real y no se traduce. La validación rechaza el
// calco antes de que la propuesta llegue a la revisión (antes solo lo veía la prueba de los datos ya aprobados).
describe("vocabulario vetado en lo que la propuesta publicaría", () => {
  it("un calco en un texto del mapa falla con su ruta; la cita literal de la fuente no cuenta", () => {
    const m = mapaNorte();
    m.nodos[0] = { ...m.nodos[0]!, experto: { es: "Guarda todo en un lago de datos de la plataforma.", en: m.nodos[0]!.experto.en } };
    const p = propuestaNorte(m);
    expect(validarPropuesta(p, G, RANGOS).fallas).toEqual(["vocabulario · mapa/nodos/0/experto/es · calco de «data lake»: se dice «data lake» y se explica en el glosario"]);
    const q = propuestaNorte();
    q.afirmaciones[0] = { ...q.afirmaciones[0]!, cita: { ...q.afirmaciones[0]!.cita, texto: "Esta página literal habla de un lago de datos y no la escribió Big-D." } };
    expect(validarPropuesta(q, G, RANGOS).fallas).toEqual([]);
  });
});

describe("retiros: todo lo que sale del mapa aprobado trae su argumento (pedido de la persona, 2026-09-30)", () => {
  const p = propuestaNorte();
  const base = p.mapa as unknown as Mapa;
  /** El aprobado tenía un componente más («monitor», con un flujo hacia él) y un flujo más entre dos que siguen. */
  const anterior = (): Mapa => ({
    ...base,
    estado: "aprobada",
    version: "0.3.0",
    nodos: [...base.nodos, { ...base.nodos[0]!, id: "monitor", orden: 99, nombre: { es: "Monitor", en: "Monitor" } }],
    flujos: [...base.flujos, { ...base.flujos[0]!, id: "f-a-monitor", destino: "monitor" }],
  });

  it("un componente que sale sin retiro falla; el flujo que pierde su extremo sale por arrastre, sin pedir nada", () => {
    expect(validarPropuesta(p, G, RANGOS, anterior()).fallas).toEqual([SIN_ARGUMENTO("el componente", "monitor")]);
    expect(validarPropuesta({ ...p, retiros: [retiroDe("R-1", "monitor")] }, G, RANGOS, anterior()).fallas).toEqual([]);
  });
  it("un flujo que sale con sus dos extremos en el mapa necesita su propio retiro", () => {
    const a = anterior();
    a.flujos = [...a.flujos, { ...base.flujos[0]!, id: "f-extra", origen: base.nodos[0]!.id, destino: base.nodos[1]!.id }];
    expect(validarPropuesta({ ...p, retiros: [retiroDe("R-1", "monitor")] }, G, RANGOS, a).fallas).toEqual([SIN_ARGUMENTO("el flujo", "f-extra")]);
    const flujo = retiroDe("R-2", "x", { sobre: { entidad: "flujo", id: "f-extra" } });
    expect(validarPropuesta({ ...p, retiros: [retiroDe("R-1", "monitor"), flujo] }, G, RANGOS, a).fallas).toEqual([]);
  });
  it("un retiro de algo que no sale, repetido o con una fuente de tercero falla; sin mapa aprobado no hay qué retirar", () => {
    const sigue = retiroDe("R-2", base.nodos[0]!.id);
    expect(validarPropuesta({ ...p, retiros: [retiroDe("R-1", "monitor"), sigue] }, G, RANGOS, anterior()).fallas).toEqual([`retiros · R-2 habla de un nodo que no sale del mapa aprobado («${base.nodos[0]!.id}»)`]);
    expect(validarPropuesta({ ...p, retiros: [retiroDe("R-1", "monitor"), retiroDe("R-1", "monitor")] }, G, RANGOS, anterior()).fallas).toEqual(["retiros · R-1 repetido"]);
    const tercero = retiroDe("R-1", "monitor", { cita: { ...retiroDe("R-1", "monitor").cita, tipo: "tercero" } });
    expect(validarPropuesta({ ...p, retiros: [tercero] }, G, RANGOS, anterior()).fallas).toEqual(["retiros · R-1 cita una fuente de tercero: un retiro se prueba con la documentación del fabricante"]);
    expect(validarPropuesta({ ...p, retiros: [retiroDe("R-1", "monitor")] }, G, RANGOS).fallas).toEqual(["retiros · R-1 habla de un nodo que no sale del mapa aprobado («monitor»)"]);
  });
  it("la cita de un retiro cumple el esquema de toda cita (40 caracteres como mínimo)", () => {
    const corta = retiroDe("R-1", "monitor", { cita: { ...retiroDe("R-1", "monitor").cita, texto: "Se retiró." } });
    expect(validarPropuesta({ ...p, retiros: [corta] }, G, RANGOS, anterior()).fallas).toEqual(["retiros.0.cita.texto · una cita de al menos 40 caracteres"]);
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
  const entrada = (extra = {}) => ({ carpeta: "propuestas/x", propuesta: p, propuestaSha256: sha256(bytes), verificacion: verificacion(), aprobadas: ids, rechazadas: [], retiradas: [], gramatica: G, rangos: RANGOS, fecha: "2026-09-28", ...extra });
  const base = p.mapa as unknown as Mapa;
  const aprobadoIgual = () => ({ ...base, estado: "aprobada" as const, version: "0.3.0", fecha_actualizacion: "2026-08-01", nodos: base.nodos.map((n) => ({ ...n, fecha_verificacion: "2026-08-01" })) });
  const fallas = (f: () => unknown) => {
    try {
      f();
    } catch (e) {
      if (e instanceof ErrorDeAprobacion) return e.fallas;
      throw e;
    }
    return [];
  };
  /** La misma propuesta con sus retiros, su huella y una verificación que incluye la cita de cada retiro. */
  const conRetiros = (retiros: Retiro[], resultadoRetiro: "verificada" | "no-encontrada" = "verificada") => {
    const q = { ...p, retiros };
    const b = JSON.stringify(q);
    const v = verificacion();
    return {
      propuesta: q,
      propuestaSha256: sha256(b),
      verificacion: { ...v, propuesta_sha256: sha256(b), resultados: [...v.resultados, ...retiros.map((r) => ({ afirmacion: r.id, url: r.cita.url, resultado: resultadoRetiro, http: 200, sha256: "0".repeat(64) }))] },
    };
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
      "dibujo · nivel1 · texto: nombre de almacen (es): la palabra «Almacenamiento» no cabe en 104 u",
    ]);
  });

  it("sin novedades: el mismo contenido que el aprobado solo renueva las fechas, con la versión de antes", () => {
    const anterior = aprobadoIgual();
    const { mapa, revision } = aprobar(entrada({ anterior }));
    expect(revision.resultado).toBe("sin-novedades");
    expect(mapa.version).toBe("0.3.0");
    expect(mapa.nodos.every((n) => n.fecha_verificacion === "2026-09-27")).toBe(true);
    const cambiado = aprobar(entrada({ anterior: { ...anterior, nodos: anterior.nodos.slice(1) } }));
    expect(cambiado.revision.resultado).toBe("aprobada");
    expect(cambiado.mapa.version).toBe("0.4.0");
  });

  it("M-22: las fechas de consulta de las fuentes no son contenido («sin novedades» se alcanza)", () => {
    const anterior = aprobadoIgual();
    anterior.nodos = anterior.nodos.map((n) => ({ ...n, fuentes: n.fuentes.map((f) => ({ ...f, fecha: "2026-08-01" })) }));
    expect(aprobar(entrada({ anterior })).revision.resultado).toBe("sin-novedades");
  });

  it("A-4: con el mismo contenido, un rechazo se aplica igual (no hay «sin novedades» si la persona rechazó algo)", () => {
    const hoja = p.afirmaciones.find((a) => a.sobre.entidad === "nodo" && a.sobre.id === "agente-datos")!.id;
    const { mapa, revision } = aprobar(entrada({ anterior: aprobadoIgual(), aprobadas: ids.filter((i) => i !== hoja), rechazadas: [hoja] }));
    expect(revision.resultado).toBe("aprobada");
    expect(mapa.nodos.some((n) => n.id === "agente-datos")).toBe(false);
  });

  it("A-3: sin afirmaciones no hay aprobación, aunque el modelo diga «sin novedades»", () => {
    const q = { ...propuestaNorte(), sin_novedades: true, afirmaciones: [] };
    const b = JSON.stringify(q);
    const f = fallas(() => aprobar(entrada({ propuesta: q, propuestaSha256: sha256(b), verificacion: { ...verificacion(), propuesta_sha256: sha256(b), resultados: [] }, aprobadas: [] })));
    expect(f.length).toBeGreaterThan(0);
    expect(f.every((x) => x.endsWith("no tiene ninguna afirmación que lo respalde"))).toBe(true);
  });

  it("M-19: solo una propuesta posterior a la última cerrada (ni la misma otra vez, ni una más vieja)", () => {
    const regla = /no es posterior a la última propuesta cerrada/;
    expect(fallas(() => aprobar(entrada({ ultimaPropuesta: "propuestas/x" })))).toEqual([expect.stringMatching(regla)]);
    expect(fallas(() => aprobar(entrada({ ultimaPropuesta: "propuestas/y" })))).toEqual([expect.stringMatching(regla)]);
    expect(aprobar(entrada({ ultimaPropuesta: "propuestas/w" })).revision.resultado).toBe("aprobada");
  });

  it("M-21: lo que la propuesta ya no trae se retira solo si el comando lo nombra, y exactamente eso", () => {
    const anterior = aprobadoIgual();
    anterior.nodos = [...anterior.nodos, { ...anterior.nodos[0]!, id: "extra", orden: 99, nombre: { es: "Extra", en: "Extra" } }];
    const c = conRetiros([retiroDe("R-1", "extra")]);
    expect(fallas(() => aprobar(entrada({ ...c, anterior })))).toEqual(["los retiros no coinciden con el diff: la propuesta retira [extra] y el comando dice --retirar -"]);
    expect(fallas(() => aprobar(entrada({ ...c, anterior, retiradas: ["otro"] })))[0]).toMatch(/^los retiros no coinciden/);
    const { mapa, revision } = aprobar(entrada({ ...c, anterior, retiradas: ["extra"] }));
    expect(revision.resultado).toBe("aprobada");
    expect(mapa.nodos.some((n) => n.id === "extra")).toBe(false);
  });

  // Pedido de la persona al mirar la lista de retiros (2026-09-30): «que no queden dudas de por qué sale».
  it("un retiro sin argumento no se aprueba; su cita se verifica como la de una afirmación", () => {
    const anterior = aprobadoIgual();
    anterior.nodos = [...anterior.nodos, { ...anterior.nodos[0]!, id: "monitor", orden: 99, nombre: { es: "Monitor", en: "Monitor" } }];
    anterior.flujos = [...anterior.flujos, { ...anterior.flujos[0]!, id: "f-a-monitor", destino: "monitor" }];
    const retiradas = ["f-a-monitor", "monitor"];
    expect(fallas(() => aprobar(entrada({ anterior, retiradas })))).toEqual([SIN_ARGUMENTO("el componente", "monitor")]);
    const c = conRetiros([retiroDe("R-1", "monitor")]);
    const { mapa } = aprobar(entrada({ ...c, anterior, retiradas }));
    expect(mapa.nodos.some((n) => n.id === "monitor")).toBe(false);
    expect(mapa.flujos.some((f) => f.id === "f-a-monitor")).toBe(false);
    const noEncontrada = conRetiros([retiroDe("R-1", "monitor")], "no-encontrada");
    expect(fallas(() => aprobar(entrada({ ...noEncontrada, anterior, retiradas })))).toEqual(["R-1: su cita no aparece en la fuente; el retiro de «monitor» queda sin argumento: vuelve a investigar"]);
    const sinVerificar = { ...c, verificacion: { ...c.verificacion, resultados: c.verificacion.resultados.filter((r) => r.afirmacion !== "R-1") } };
    expect(fallas(() => aprobar(entrada({ ...sinVerificar, anterior, retiradas })))).toEqual(["R-1 no fue verificado"]);
  });

  it("B-45: la verificación de una afirmación es de SU cita (la misma URL)", () => {
    const v = verificacion();
    v.resultados[0] = { ...v.resultados[0]!, url: "https://ejemplo.invalid/otra" };
    expect(fallas(() => aprobar(entrada({ verificacion: v })))).toEqual(["A-1: la verificación es de otra URL (https://ejemplo.invalid/otra), no de su cita"]);
  });
});

describe("comando de aprobación", () => {
  it("lo que arma la pantalla es lo que lee el script", () => {
    const c = comandoAprobar("propuestas/2026-09-27-fabric", ["A-1", "A-3"], ["A-2"], ["n-viejo", "f-viejo"]);
    expect(c).toBe(`node ${SCRIPT} propuestas/2026-09-27-fabric --aprobar A-1,A-3 --rechazar A-2 --retirar n-viejo,f-viejo`);
    expect(leerDecisiones(c.split(" ").slice(2))).toEqual({ carpeta: "propuestas/2026-09-27-fabric", aprobadas: ["A-1", "A-3"], rechazadas: ["A-2"], retiradas: ["n-viejo", "f-viejo"] });
    const sinNada = leerDecisiones(comandoAprobar("propuestas/x", ["A-1"], []).split(" ").slice(2));
    expect([sinNada.rechazadas, sinNada.retiradas]).toEqual([[], []]);
    expect(() => leerDecisiones(["propuestas/x", "--aprobar", "A-1", "--retirar", "-"])).toThrow(/falta --rechazar/);
    expect(() => leerDecisiones(["propuestas/x", "--aprobar", "A-1", "--rechazar", "-"])).toThrow(/falta --retirar/);
  });
  it("A-2: una carpeta o un id que la terminal podría ejecutar no entra al comando", () => {
    expect(() => comandoAprobar("propuestas/x$(id)", [], [])).toThrow(/caracteres no permitidos/);
    expect(() => comandoAprobar("propuestas/x;rm", [], [])).toThrow(/caracteres no permitidos/);
    expect(() => comandoAprobar("propuestas/a/b", [], [])).toThrow(/caracteres no permitidos/);
    expect(() => comandoAprobar("propuestas/x", ["A-1`id`"], [])).toThrow(/id de afirmación no permitido/);
    expect(() => comandoAprobar("propuestas/x", [], [], ["a b"])).toThrow(/id retirado no permitido/);
  });
});
