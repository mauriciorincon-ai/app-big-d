// Las piezas de la comparación y de la base, renderizadas con el caso de la maqueta (S3, fase 2). La costura Worker ↔
// pantalla se cruza aquí con un Worker falso que recorre el MISMO `atender` del núcleo, por pasos y cancelable: mover el
// peso escribe la URL, la pantalla pide la simulación y pinta la aceptabilidad (la e2e lo repite con el Worker real).
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FiltroEvidencias } from "@/components/base/FiltroEvidencias";
import { BarraMini, BarraPeso, BarraTotal } from "@/components/caso/Barras";
import { Matriz, NoEvaluable, ProsContrasVista, Totales, type Nombres } from "@/components/caso/Comparacion";
import { Exploracion } from "@/components/caso/Exploracion";
import { MarcoTabla } from "@/components/caso/MarcoTabla";
import { NavSecciones } from "@/components/NavSecciones";
import { Pestanas } from "@/components/Pestanas";
import { atender, entradaSimulacion, evaluar, simular, type Peticion, type Resultado } from "@/engine";
import { plantilla } from "@/lib/atlas/plantilla";
import { textos } from "@/lib/i18n";
import { CRITERIOS } from "../nucleo/lib/futuro";
import { futuro } from "../nucleo/lib/futuro";

vi.mock("next/navigation", () => ({ usePathname: () => "/es/casos/hospital-futuro" }));

type Evaluado = Extract<Resultado, { tipo: "evaluado" }>;
const T = textos("es");
const tc = T.caso.comparacion;
const entrada = futuro();
const r = evaluar(entrada) as Evaluado;
const simulacion = simular(entradaSimulacion(entrada, r)!);
const nombres: Nombres = {
  plataforma: { "plataforma-ejemplo": "Ejemplo", norte: "Norte", sur: "Sur", este: "Este" },
  criterio: Object.fromEntries(CRITERIOS.map((c) => [c, c.slice(5)])),
  evidencia: Object.fromEntries(entrada.base.evidencias.map((e) => [e.id, `afirmación de ${e.id}`])),
  madurez: { "vista-previa-publica": "Vista previa pública", "disponible-general": "Disponible de forma general" },
};

/** Un Worker de mentira con el contrato real: recorre `atender` un mensaje por vuelta del bucle y obedece «cancelar». */
class WorkerFalso {
  static ultimo: WorkerFalso | null = null;
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  cancelados = new Set<number>();
  peticiones: Peticion[] = [];
  constructor() {
    WorkerFalso.ultimo = this;
  }
  postMessage(p: Peticion) {
    this.peticiones.push(p);
    if (p.tipo === "cancelar") return void this.cancelados.add(p.id);
    const gen = atender(p);
    const paso = () => {
      if (this.cancelados.has(p.id)) return;
      const n = gen.next();
      if (n.done) return;
      this.onmessage?.({ data: n.value });
      setTimeout(paso, 5);
    };
    setTimeout(paso, 5);
  }
  terminate() {}
}

beforeEach(() => {
  window.history.replaceState(null, "", "/es/casos/hospital-futuro/comparacion");
  vi.stubGlobal("Worker", WorkerFalso);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const exploracion = () =>
  render(<Exploracion idioma="es" t={{ s: tc.sensibilidad, r: tc.robustez, esencial: tc.totales.esencial, y: T.caso.y }} entrada={entrada} resultado={r} simulacion={simulacion} nombres={{ plataforma: nombres.plataforma, criterio: nombres.criterio }} />);

describe("Exploracion: sensibilidad y robustez", () => {
  it("abre en el criterio de más peso, con su inversión exacta en la rejilla y la robustez del perfil calculada en el build", () => {
    exploracion();
    expect((screen.getByLabelText(tc.sensibilidad.criterio) as HTMLSelectElement).value).toBe("crit-gobierno");
    expect(screen.getByRole("slider").getAttribute("aria-valuetext")).toBe("25");
    expect(screen.getByText(plantilla(tc.sensibilidad.lider[0], { lado: plantilla(tc.sensibilidad.abajo, { t: "14,7" }), plataformas: "Ejemplo" }))).toBeTruthy();
    expect(screen.getByText(plantilla(tc.robustez.pesosDe, { pesos: tc.robustez.pesosPerfil }))).toBeTruthy();
    expect(screen.getByText(plantilla(tc.robustez.tituloClase, { clase: tc.robustez.clase.robusta }))).toBeTruthy();
    expect(WorkerFalso.ultimo).toBeNull();
  });

  it("mover el peso escribe la URL, pide la simulación al Worker y pinta la aceptabilidad de los pesos explorados", async () => {
    WorkerFalso.ultimo = null;
    exploracion();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "2200" } });
    expect(screen.getByRole("slider").getAttribute("aria-valuetext")).toBe("22");
    await waitFor(() => expect(window.location.search).toBe("?criterio=crit-gobierno&t=2200"));
    await waitFor(() => expect(screen.getByText(plantilla(tc.robustez.pesosDe, { pesos: plantilla(tc.robustez.pesosExplorados, { criterio: "gobierno", t: "22" }) }))).toBeTruthy(), { timeout: 10_000 });
    const pedida = WorkerFalso.ultimo!.peticiones.find((p) => p.tipo === "simular");
    expect(pedida && pedida.tipo === "simular" ? pedida.entrada.pesos.reduce((s, w) => s + w, 0) : 0).toBe(10_000);
    const fila = screen.getByText("22", { selector: "td.mono" }).closest("tr")!;
    expect(fila.getAttribute("aria-current")).toBe("true");
  });

  it("«Cancelar» detiene la simulación en curso y deja a la vista la anterior, diciéndolo", async () => {
    exploracion();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "3000" } });
    const cancelar = await screen.findByRole("button", { name: tc.robustez.cancelar }, { timeout: 5000 });
    await act(async () => cancelar.click());
    expect(document.querySelector("#rob .campo-aviso[role=status]")!.textContent).toContain(plantilla(tc.robustez.cancelada, { pesos: plantilla(tc.robustez.pesosExplorados, { criterio: "gobierno", t: "30" }), anteriores: tc.robustez.pesosPerfil }));
    expect(WorkerFalso.ultimo!.peticiones.at(-1)?.tipo).toBe("cancelar");
  });

  it("una URL con un peso explorado abre en ese peso; elegir otro criterio lo mueve a su peso del perfil", async () => {
    window.history.replaceState(null, "", "/es/casos/hospital-futuro/comparacion?criterio=crit-costo&t=600");
    exploracion();
    expect(screen.getByRole("slider").getAttribute("aria-valuetext")).toBe("6");
    fireEvent.change(screen.getByLabelText(tc.sensibilidad.criterio), { target: { value: "crit-ia" } });
    await waitFor(() => expect(screen.getByRole("slider").getAttribute("aria-valuetext")).toBe("5"));
    expect(window.location.search).toBe("?criterio=crit-ia&t=500");
  });
});

describe("las vistas estáticas de la comparación", () => {
  it("veredicto de empate técnico con la brecha truncada, el puesto de cada una y la banda", () => {
    render(<Totales r={r} idioma="es" t={tc.totales} y={T.caso.y} nombres={nombres} max={4} umbral={500} sello="sello" />);
    expect(screen.getByText(tc.totales.veredicto.empate)).toBeTruthy();
    expect(screen.getByText(plantilla(tc.totales.empate, { a: "Norte", b: "Ejemplo", brecha: "3,0", umbral: "5" }))).toBeTruthy();
    expect([...document.querySelectorAll(".totales li")].map((li) => li.getAttribute("data-posicion"))).toEqual(["1", "2", "3"]);
    expect(screen.getByText(plantilla(tc.totales.banda, { umbral: "5" }))).toBeTruthy();
  });

  it("la matriz subraya la mejor única y recuadra la evidencia limitante de cada plataforma", () => {
    render(<Matriz r={r} pesos={entrada.caso.pesos} idioma="es" t={tc.matriz} tEsencial="esencial" nombres={nombres} max={4} niveles={[{ valor: 2, nombre: "con límites" }]} topeNoDisponible={2} vigencia={T.caso.vigencia} />);
    expect(document.querySelectorAll("td[data-limitante]")).toHaveLength(r.limitantes.length);
    const ingesta = screen.getByText("ingesta").closest("tr")!;
    expect(within(ingesta).getAllByText("4")[0]!.closest("td")!.hasAttribute("data-mejor")).toBe(true);
    expect(screen.getByRole("region", { name: tc.matriz.titulo }).getAttribute("tabindex")).toBe("0");
    expect(screen.getByText(tc.matriz.alertas)).toBeTruthy();
  });

  it("pros y contras por reglas, y el bloqueo honesto cuando no se puede comparar", () => {
    render(<ProsContrasVista r={r} t={tc.pros} nombres={nombres} max={4} anclas={{ destaca: 4, corta: 2 }} />);
    expect(document.querySelectorAll(".pros-de")).toHaveLength(3);
    cleanup();
    render(<NoEvaluable motivos={[{ motivo: "perfil-en-borrador" }, { motivo: "falta-evidencia", faltantes: [{ plataforma_id: "norte", criterio_id: "crit-ia" }] }, { motivo: "todas-descartadas" }]} idioma="es" t={tc.noEvaluable} nombres={nombres} criteriosPorPlataforma={11} rutaPerfil="/p" rutaBase="/b" />);
    expect(screen.getByText(tc.noEvaluable.borrador)).toBeTruthy();
    expect(screen.getByText(plantilla(tc.noEvaluable.faltaPorPlataforma[0], { plataforma: "Norte", n: 1, total: 11 }))).toBeTruthy();
    expect(screen.getByText(tc.noEvaluable.todasDescartadas)).toBeTruthy();
  });

  it("las barras son SVG con posiciones en por ciento como atributos (sin style)", () => {
    const { container } = render(
      <>
        <BarraPeso escala={10_000} rango={[2000, 3000]} punto={2500} marcas={[{ t: 1477, tipo: "inversion" }]} etiqueta="peso" />
        <BarraTotal decimas={788} banda={738} etiqueta="total" />
        <BarraMini porMil={994} />
        <MarcoTabla etiqueta="tabla">x</MarcoTabla>
      </>,
    );
    expect(container.querySelector("[style]")).toBeNull();
    expect(container.querySelector(".barra-punto")!.getAttribute("cx")).toBe("25%");
    expect(container.querySelector(".barra-relleno")!.getAttribute("width")).toBe("78.8%");
  });
});

describe("la base y la navegación", () => {
  it("los filtros ocultan las evidencias que no pasan y dicen cuántas quedan", () => {
    const t = T.base.evidencias;
    render(
      <FiltroEvidencias t={t} plataformas={[["norte", "Norte"], ["sur", "Sur"]]} criterios={[["crit-ia", "IA"]]} items={[{ plataforma: "norte", criterio: "crit-ia", estado: "aprobada" }, { plataforma: "sur", criterio: "crit-ia", estado: "propuesta" }]}>
        <p>uno</p>
        <p>dos</p>
      </FiltroEvidencias>,
    );
    fireEvent.change(screen.getByLabelText(t.filtros.plataforma), { target: { value: "sur" } });
    expect(screen.getByText("uno").closest("li")!.hidden).toBe(true);
    expect(screen.getByText(plantilla(t.mostrando, { n: 1 }))).toBeTruthy();
    fireEvent.change(screen.getByLabelText(t.filtros.estado), { target: { value: "aprobada" } });
    expect(screen.getByText(plantilla(t.mostrando, { n: 0 }))).toBeTruthy();
  });

  it("una sección o una pestaña sin ruta se muestra pendiente, sin enlace", () => {
    render(<NavSecciones etiqueta="Secciones" secciones={[{ ruta: "/es/casos/hospital-futuro", texto: "Caso", prefijos: ["/es/casos/"] }, { texto: "Instrumento", prefijos: [] }]} />);
    expect(screen.getByRole("link", { name: "Caso" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("Instrumento").tagName).toBe("SPAN");
    cleanup();
    render(<Pestanas etiqueta="Sección" pestanas={[{ n: "07", texto: "Perfil", ruta: "/p", actual: true }, { n: "09", texto: "Decisiones" }]} />);
    expect(screen.getByRole("link", { name: /Perfil/ }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("Decisiones").closest("span.pend")).toBeTruthy();
  });
});
