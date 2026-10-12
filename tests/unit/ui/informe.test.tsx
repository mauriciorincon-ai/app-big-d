// Las piezas de la pantalla de hoja de ruta e informe (S6), renderizadas con el plan real y con el de la base sembrada: lo que
// el build real no publica (un ciclo, un empate técnico con su robustez, un relato humano) se ve aquí. Cada ítem trae su
// origen y su criterio de cumplido; el estado se dice con glifo y palabra; sin relato humano, la pantalla lo dice.
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import {
  Alistamiento,
  AlistamientoCompacto,
  Fases,
  HojaCompacta,
} from "@/components/informe/Hoja";
import { Imprimir } from "@/components/informe/Imprimir";
import {
  AlertasEvidencia,
  Ficha,
  Implicitas,
  Relato,
  Resumen,
  Sec,
  TablaDecisiones,
} from "@/components/informe/Informe";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";
import { textos } from "@/lib/i18n";
import { construirInforme } from "@/lib/informe/construir";
import { nombresDe, relatoGenerado } from "@/lib/informe/narrativa";
import { motivosDeBorrador, vistaHoja } from "@/lib/informe/vista";
import { armarBaseFuturo } from "../lib/base-futuro";

afterEach(cleanup);
const T = textos("es");
const t = T.caso.informe;

const real = cargarConocimiento();
const planR = real.planes[0]!;
const infR = construirInforme(real, real.casos[0]!, planR);
const vR = vistaHoja(infR, planR, "es");

const dir = mkdtempSync(join(tmpdir(), "bigd-informe-ui-"));
armarBaseFuturo(dir);
afterAll(() => rmSync(dir, { recursive: true, force: true }));
const k2 = cargarConocimiento(dir);
const planS = k2.planes[0]!;
const infS = construirInforme(k2, k2.casos[0]!, planS);
const vS = vistaHoja(infS, planS, "es");

describe("las fases y sus ítems", () => {
  it("cada ítem dice su tipo, su estado en palabras, de dónde viene (con enlace al lugar donde se explica) y cuándo está cumplido", () => {
    const { container } = render(<Fases vista={vR} t={t} />);
    const items = container.querySelectorAll("li.item");
    expect(items).toHaveLength(19);
    for (const li of items) {
      expect(li.querySelector(".item-cab .cod")!.textContent).toMatch(
        /^[TV]-\d\d$/,
      );
      expect(li.querySelector(".item-estado")!.textContent).toMatch(
        /pendiente|hecho|bloqueado/,
      );
      const origen = li.querySelector("a.origen") as HTMLAnchorElement;
      expect(origen.textContent).toMatch(/^viene de/);
      expect(origen.getAttribute("href")).toMatch(/^#(d|r|s)-/);
      expect(li.textContent).toContain("cumplido cuando:");
    }
  });

  it("las cinco fases, la 0 con las pruebas baratas, y la decisión de una vía dice qué se hace antes", () => {
    render(<Fases vista={vR} t={t} />);
    expect(
      screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent),
    ).toEqual([
      "Fase 0 · probar los supuestos baratos",
      "Fase 1 · tomar las decisiones de la onda 1",
      "Fase 2 · tomar las decisiones de la onda 2",
      "Fase 3 · tomar las decisiones de la onda 3",
      "Fase 4 · después de decidir",
    ]);
    const identidad = vR.fases
      .flatMap((f) => f.items)
      .find(
        (i) =>
          i.origen.texto.endsWith("dec-identidad") &&
          i.tipo === "tarea" &&
          i.origen.tipo === "decision",
      )!;
    expect(identidad).toMatchObject({ unaVia: true, antes: ["V-01"] });
    expect(screen.getAllByText("una vía").length).toBeGreaterThan(0);
    expect(screen.getByText("antes: V-01")).toBeTruthy();
  });

  it("un ciclo se muestra con su camino y deja a todos sin fase y bloqueados, con la razón en cada ítem", () => {
    const { container } = render(<Fases vista={vS} t={t} />);
    expect(screen.getByRole("alert").textContent).toContain("→");
    expect(screen.getByRole("heading", { name: t.hoja.sinFase })).toBeTruthy();
    const bloqueados = container.querySelectorAll("li.item-bloqueado");
    expect(bloqueados.length).toBe(planS.decisiones.length);
    for (const li of bloqueados)
      expect(li.querySelector(".campo-aviso")!.textContent).toMatch(
        /ciclo de dependencias/,
      );
  });
});

describe("alistamiento: por categoría, solo verificaciones, con su avance", () => {
  it("las categorías con ítems, en el orden de § 6.11, cada una con k/n", () => {
    const { container } = render(<Alistamiento vista={vR} t={t} />);
    const cabezas = [...container.querySelectorAll(".tarjeta h3")].map(
      (h) => h.textContent,
    );
    expect(cabezas).toEqual(vR.alistamiento.map((c) => `${c.nombre}${c.hechos}/${c.total}`));
    expect(
      vR.alistamiento.every((c) =>
        c.items.every((i) => i.tipo === "verificacion_alistamiento"),
      ),
    ).toBe(true);
    expect(vR.alistamiento.reduce((n, c) => n + c.total, 0)).toBe(5);
  });
});

describe("el informe en el papel: las secciones 11 y 12 compactas", () => {
  it("la hoja compacta lista cada ítem con su id y su origen; el alistamiento, con lo que falta para cumplirlo", () => {
    const { container } = render(<HojaCompacta vista={vR} t={t} />);
    expect(container.querySelectorAll("li")).toHaveLength(19);
    cleanup();
    const { container: c2 } = render(<AlistamientoCompacto vista={vR} t={t} />);
    expect(c2.querySelectorAll("li")).toHaveLength(5);
    expect(c2.textContent).toContain("cumplido cuando:");
  });
});

describe("el relato de fracaso", () => {
  it("sin relato humano, la pantalla lo dice; el generado va marcado como generado", () => {
    render(
      <Relato
        generado={relatoGenerado(infR, nombresDe(infR, planR, "es"), "es")}
        humano={undefined}
        idioma="es"
        t={t}
      />,
    );
    expect(screen.getByText(t.relato.sinHumano)).toBeTruthy();
    expect(screen.getByText(t.relato.generado)).toBeTruthy();
    expect(screen.getByText(/^Pasaron doce meses/)).toBeTruthy();
  });

  it("con relato humano lo muestra con quién lo escribió y cuándo, y no dice «sin relato humano»", () => {
    render(
      <Relato
        generado="x"
        humano={{
          caso_id: "c",
          texto: { es: "Es marzo de 2027.", en: "It is March 2027." },
          escrito_por: "Comité",
          fecha: "2026-10-01",
          origen: "declarado-por-usuario",
        }}
        idioma="es"
        t={t}
      />,
    );
    expect(screen.getByText("Es marzo de 2027.")).toBeTruthy();
    expect(screen.getByText(/Escrito por Comité el 2026-10-01/)).toBeTruthy();
    expect(screen.queryByText(t.relato.sinHumano)).toBeNull();
  });
});

describe("alertas, implícitas y la estructura de decisiones", () => {
  it("sin alertas de evidencia lo dice; con alertas, una línea por cada una con su motivo", () => {
    render(
      <AlertasEvidencia
        alertas={[]}
        nombres={nombresDe(infR, planR, "es")}
        madurez={{}}
        idioma="es"
        t={t}
      />,
    );
    expect(screen.getByText(t.alertas.vacia)).toBeTruthy();
    cleanup();
    render(
      <AlertasEvidencia
        alertas={[
          {
            evidencia_id: "evi-x",
            plataforma_id: "norte",
            motivo: "sin-fuente-oficial",
            dias: 3,
            madurez: "disponible-general",
          },
          {
            evidencia_id: "evi-y",
            plataforma_id: "norte",
            motivo: "vencida",
            dias: 70,
            madurez: "disponible-general",
          },
        ]}
        nombres={nombresDe(infS, planS, "es")}
        madurez={{ "disponible-general": "Disponible" }}
        idioma="es"
        t={t}
      />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(
      screen.getByText(/Sin fuente primaria oficial · evi-x/),
    ).toBeTruthy();
    expect(screen.getByText(/Vencida · evi-y .*hace 70 días/)).toBeTruthy();
  });

  it("las decisiones implícitas del perfil, con su respuesta o sin ella", () => {
    const caso = real.casos[0]!;
    const { container } = render(
      <Implicitas caso={caso} plan={planR} idioma="es" t={t} />,
    );
    expect(container.querySelectorAll("li").length).toBeGreaterThanOrEqual(
      caso.decisiones_implicitas.length,
    );
    expect(container.textContent).toMatch(/respondida:|sin responder/);
  });

  it("la tabla de estructura de decisiones: una fila con ancla por decisión; sin comparación no inventa una opción", () => {
    const { container } = render(
      <TablaDecisiones
        informe={infR}
        plan={planR}
        nombres={nombresDe(infR, planR, "es")}
        opcionDe={{}}
        t={t}
        td={T.caso.decisiones}
      />,
    );
    expect(container.querySelectorAll("tbody tr")).toHaveLength(
      planR.decisiones.length,
    );
    for (const d of planR.decisiones)
      expect(container.querySelector(`tr#d-${d.id}`)).not.toBeNull();
    // Sin comparación (perfil en borrador) ninguna fila inventa una opción; con ella, las filas que la tienen la muestran.
    const sinPlanificar = infR.entrada.plan.decisiones.filter((d) => d.planificadas.length === 0).length;
    expect(screen.queryAllByText(t.decisiones.sinOpcion)).toHaveLength(sinPlanificar);
    if (infR.modelo.resumen.veredicto.tipo === "sin-comparacion") expect(sinPlanificar).toBe(planR.decisiones.length);
  });

  it("S6-M1: con una sola plataforma en pie, la recomendación dice «la única» y no una ventaja de 0,0", () => {
    const unica = {
      ...infS,
      modelo: {
        ...infS.modelo,
        resumen: {
          ...infS.modelo.resumen,
          veredicto: { tipo: "ganadora" as const, plataforma_id: "norte", segunda: null, brecha_unidades: 0 },
        },
      },
    };
    const n = nombresDe(unica, planS, "es");
    render(
      <Resumen
        parrafo="x"
        lectura={{ palabras: 1, silabas: 1, terminos: [], cumple: true } as never}
        informe={unica}
        nombres={n}
        glosario={[]}
        nombreRiesgo={n.riesgo}
        prioridad={T.caso.decisiones.riesgos.prioridad}
        motivoTexto=""
        y={T.caso.y}
        tc={T.caso.comparacion}
        idioma="es"
        t={t}
      />,
    );
    expect(screen.getByText(/la única plataforma que queda/)).toBeTruthy();
    expect(screen.queryByText(/puntos de ventaja/)).toBeNull();
  });

  it("S6-B2: el umbral del empate en la ficha usa el formato del idioma (coma en español, punto en inglés)", () => {
    const con = (idioma: "es" | "en") => {
      const inf = {
        ...infR,
        modelo: {
          ...infR.modelo,
          ficha: { ...infR.modelo.ficha, umbrales: { ...infR.modelo.ficha.umbrales, empate_centesimas: 550 } },
        },
      };
      cleanup();
      render(<Ficha informe={inf} versionTexto="v" huella="h" idioma={idioma} t={textos(idioma).caso.informe} />);
      return document.body.textContent ?? "";
    };
    expect(con("es")).toMatch(/5,5/);
    expect(con("en")).toMatch(/5\.5/);
  });

  it("la cabecera de sección numera con dos cifras y enlaza por su id", () => {
    const { container } = render(
      <Sec id="resumen" n={1} titulo="Resumen">
        x
      </Sec>,
    );
    expect(container.querySelector("section#sec-resumen")).not.toBeNull();
    expect(container.querySelector("h2 .mono")!.textContent).toBe("01");
  });
});

describe("la banda de borrador y el botón de imprimir", () => {
  it("los motivos del borrador salen en palabras: perfil, plan y, con el sembrado, el ciclo y la acción alta sin mitigación", () => {
    // D-S7-02: lo que dice el dato real sigue a sus aprobaciones, estén como estén.
    expect(motivosDeBorrador(infR, "es")).toEqual([
      ...(real.casos[0]!.estado_aprobacion === "borrador" ? ["aprobar el perfil del caso"] : []),
      ...(planR.estado_aprobacion === "borrador" ? ["aprobar el plan del caso"] : []),
    ]);
    expect(motivosDeBorrador(infS, "es")).toEqual([
      "aprobar el plan del caso",
      "resolver el ciclo de dependencias entre decisiones",
      "una mitigación para rie-fuga, que es una acción alta sin mitigación",
    ]);
    expect(motivosDeBorrador(infS, "en")).toContain(
      "a mitigation for rie-fuga, a high action with none",
    );
  });

  it("«Imprimir» abre el diálogo de impresión del navegador y no hace nada más", () => {
    const imprimir = vi.fn();
    vi.stubGlobal("print", imprimir);
    render(
      <Imprimir etiqueta={t.informe.imprimir} nota={t.informe.imprimirNota} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Imprimir" }));
    expect(imprimir).toHaveBeenCalledTimes(1);
    expect(
      within(document.body).getByText(t.informe.imprimirNota),
    ).toBeTruthy();
    vi.unstubAllGlobals();
  });
});
