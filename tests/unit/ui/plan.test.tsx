// Las piezas de la pantalla de decisiones (S5), renderizadas con el plan real y con el de la base sembrada: lo que el build
// real no publica (un ciclo, una acción alta sin mitigación) se ve aquí. El comando de aprobación lo arma la pantalla y
// solo cuando el plan se puede aprobar; con un bloqueo, lo nombra y no hay comando.
import { cleanup, render, screen, within } from "@testing-library/react";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { AlertaCiclo, Alertas, AprobarPlan, Leyenda, LecturaOndas, TablaAccion, TablaRiesgos, TarjetasSupuestos } from "@/components/plan/Plan";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";
import { huellaPlan } from "@/lib/datos/instantanea";
import { textos } from "@/lib/i18n";
import { comandoAprobarPlan } from "@/lib/investigador/comando-plan";
import { plantilla } from "@/lib/atlas/plantilla";
import type { Motivo } from "@/engine/tipos";
import { vistaDecisiones } from "@/lib/plan/vista";
import { armarBaseFuturo } from "../lib/base-futuro";

afterEach(cleanup);
const T = textos("es");
const t = T.caso.decisiones;

const real = cargarConocimiento();
const planReal = real.planes[0]!;
const vReal = vistaDecisiones(real, real.casos.find((c) => c.id === planReal.caso_id)!, planReal, "es");
// S5-B-7: los conteos salen del dato del plan, no de un número escrito a mano.
const CRITICOS_SIN_PROBAR = planReal.supuestos.filter((s) => s.estado === "sin_probar" && s.criticidad === "alta").length;
const IMPLICITAS = planReal.decisiones.filter((d) => d.implicita && d.estado !== "decidida").length;

const dirSembrada = mkdtempSync(join(tmpdir(), "bigd-plan-ui-"));
armarBaseFuturo(dirSembrada);
afterAll(() => rmSync(dirSembrada, { recursive: true, force: true }));
const k2 = cargarConocimiento(dirSembrada);
const planS = k2.planes[0]!;
const vS = vistaDecisiones(k2, k2.casos[0]!, planS, "es");
const bloqueosDe = (v: typeof vS) => v.resultado.informe.bloqueantes.map((b) => t.aprobar.bloqueantes[b.tipo].replace("{ids}", b.ids.join(", ")));

describe("la tabla de riesgos", () => {
  it("va en el orden prioridad → severidad → RPN, con mitigación, residual y la razón de cada número", () => {
    render(<TablaRiesgos riesgos={vReal.resultado.riesgos} plan={planReal} nombre={vReal.nombre} idioma="es" t={t} />);
    const filas = screen.getAllByRole("row").slice(1);
    expect(filas).toHaveLength(planReal.modos_de_falla.length);
    expect(within(filas[0]!).getByText("rie-fuga-datos-clinicos")).toBeTruthy();
    expect(within(filas[0]!).getAllByText("alta").length).toBeGreaterThan(0);
    expect(screen.getAllByText(t.riesgos.razon)).toHaveLength(planReal.modos_de_falla.length);
    // Control legal: la efectiva sigue alta aunque la tabla del residual dé baja, y lo dice.
    expect(screen.getAllByText(/control legal: sigue alta aunque la tabla dé baja/).length).toBe(1);
  });

  it("una acción alta sin mitigación se destaca con símbolo y texto, no solo con el fondo", () => {
    const { container } = render(<TablaRiesgos riesgos={vS.resultado.riesgos} plan={planS} nombre={vS.nombre} idioma="es" t={t} />);
    expect(container.querySelectorAll("tr.prioridad-alta-sin")).toHaveLength(1);
    expect(screen.getByText(t.riesgos.sinMitigacion)).toBeTruthy();
  });
});

describe("la tabla de prioridad de acción se dibuja desde el dato del paquete", () => {
  it("cinco severidades × cinco ocurrencias = 25 filas, y cada celda lleva su prioridad escrita", () => {
    const { container } = render(<TablaAccion t={t} />);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(25);
    expect(container.querySelectorAll("tbody td")).toHaveLength(100);
    expect(container.querySelectorAll(".prio-alta").length).toBeGreaterThan(0);
    for (const td of container.querySelectorAll("tbody td")) expect(td.textContent).toMatch(/alta|media|baja/);
  });
});

describe("S5-B-5: la causa y el origen de cada riesgo y supuesto se ven en pantalla (trazabilidad, regla 9)", () => {
  it("cada riesgo trae su causa y de dónde salen sus números", () => {
    const { container } = render(<TablaRiesgos riesgos={vReal.resultado.riesgos} plan={planReal} nombre={vReal.nombre} idioma="es" t={t} />);
    for (const m of planReal.modos_de_falla) {
      expect(container.textContent, m.id).toContain(plantilla(t.riesgos.causa, { texto: m.causa.es }));
      expect(container.textContent, m.id).toContain(plantilla(t.riesgos.origenDe, { origen: T.caso.decisiones.origenes[m.origen] }));
    }
  });
  it("cada supuesto dice quién lo propuso", () => {
    const { container } = render(<TarjetasSupuestos supuestos={planReal.supuestos} nombre={vReal.nombre} alertas={vReal.resultado.alertas} idioma="es" t={t} />);
    expect(screen.getAllByText(t.supuestos.origenDe)).toHaveLength(planReal.supuestos.length);
    for (const q of planReal.supuestos) expect(container.querySelector(`#s-${q.id}`)!.textContent).toContain(t.origenes[q.origen]);
  });
});

describe("S5 observado: las tablas anchas se deslizan y lo dicen", () => {
  it("la tabla de riesgos y la de prioridad van en una región con nombre que se alcanza con el teclado, con el aviso de deslizar", () => {
    const { container } = render(
      <>
        <TablaRiesgos riesgos={vReal.resultado.riesgos} plan={planReal} nombre={vReal.nombre} idioma="es" t={t} />
        <TablaAccion t={t} />
      </>,
    );
    expect(container.querySelectorAll(".pista-tabla")).toHaveLength(2);
    for (const el of container.querySelectorAll(".pista-tabla")) expect(el.textContent).toBe(t.riesgos.desliza);
    const regiones = screen.getAllByRole("region");
    expect(regiones.map((r) => r.getAttribute("aria-label"))).toEqual([t.riesgos.titulo, t.riesgos.tabla.titulo]);
    for (const r of regiones) expect(r.getAttribute("tabindex")).toBe("0");
  });
});

describe("supuestos y alertas", () => {
  it("cada supuesto trae su prueba barata como tarea del equipo, con responsable, costo y la decisión que sostiene", () => {
    render(<TarjetasSupuestos supuestos={planReal.supuestos} nombre={vReal.nombre} alertas={vReal.resultado.alertas} idioma="es" t={t} />);
    expect(screen.getAllByText(t.supuestos.pruebaBarata)).toHaveLength(planReal.supuestos.length);
    expect(screen.getAllByText(t.supuestos.alertaCritico)).toHaveLength(CRITICOS_SIN_PROBAR);
    expect(screen.getAllByText(t.supuestos.estados.sin_probar).length).toBe(planReal.supuestos.length);
  });
  it("un supuesto que venció contra la fecha de evaluación lo dice", () => {
    render(<TarjetasSupuestos supuestos={planS.supuestos} nombre={vS.nombre} alertas={vS.resultado.alertas} idioma="es" t={t} />);
    expect(screen.getAllByText(t.supuestos.vencido)).toHaveLength(1);
  });
  it("las alertas nombran lo que señalan, no solo su id", () => {
    render(<Alertas alertas={vReal.resultado.alertas} nombre={vReal.nombre} nombrePlataforma={vReal.nombrePlataforma} supuestos={planReal.supuestos} idioma="es" t={t} />);
    expect(screen.getAllByText(t.alertas.tipos["supuesto-critico-sin-probar"]).length).toBe(CRITICOS_SIN_PROBAR);
    expect(screen.getByText(/El directorio de identidad del grupo se puede conectar/)).toBeTruthy();
    expect(screen.getAllByText(t.alertas.tipos["decision-implicita"]).length).toBe(IMPLICITAS);
  });
  it("sin alertas no pinta nada", () => {
    const { container } = render(<Alertas alertas={[]} nombre={{}} nombrePlataforma={{}} supuestos={[]} idioma="es" t={t} />);
    expect(container.innerHTML).toBe("");
  });
});

describe("la lectura en texto y la leyenda", () => {
  it("la lectura lista onda por onda, y con ciclo la última fila trae su camino", () => {
    const { container } = render(<LecturaOndas filas={vS.lectura} t={t} />);
    const filas = container.querySelectorAll("ol > li");
    expect(filas.length).toBe(vS.lectura.length);
    expect(container.textContent).toContain("ciclo: ");
  });
  it("S5 observado: un ciclo muestra su camino y dice con palabras que no hay ondas, no «ondas calculadas: 0»", () => {
    const camino = vS.cicloNombres!;
    expect(camino.length).toBeGreaterThan(1);
    const { container } = render(<AlertaCiclo camino={camino} ondas={vS.resultado.informe.ondas.length} sinOnda={vS.sinOnda.length} t={t} />);
    const alerta = screen.getByRole("alert");
    expect(alerta.textContent).toContain(camino.join(" → "));
    expect(container.textContent).toContain(plantilla(t.ciclo.sinOndas, { sin: vS.sinOnda.length }));
    expect(container.textContent).not.toMatch(/calculadas: 0/);
  });
  it("la leyenda dice las tres reversibilidades y la implícita con palabras (no solo con el borde)", () => {
    render(<Leyenda t={t} />);
    for (const x of ["Una vía", "Costosa", "Dos vías"]) expect(screen.getByText(x)).toBeTruthy();
    expect(screen.getByText(/implícita: suele tomarse sin discutirla/)).toBeTruthy();
  });
});

describe("la aprobación del plan", () => {
  it("con un plan aprobable arma el comando con el caso y la huella del borrador, y no lo aprueba", () => {
    const comando = comandoAprobarPlan(planReal.caso_id, huellaPlan(planReal));
    const { container } = render(<AprobarPlan plan={planReal} comando={comando} bloqueos={[]} idioma="es" />);
    expect(container.querySelector("code")!.textContent).toBe(comando);
    expect(container.querySelector("code")!.textContent).toContain(`--plan ${planReal.caso_id} --desde ${huellaPlan(planReal)}`);
    expect(screen.getByText(t.aprobar.comandoNota)).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });
  it("con un ciclo y una alta sin mitigación NO hay comando: se nombra lo que bloquea (G5)", () => {
    const bloqueos = bloqueosDe(vS);
    expect(bloqueos.length).toBe(2);
    const { container } = render(<AprobarPlan plan={planS} comando={null} bloqueos={bloqueos} idioma="es" />);
    expect(container.querySelector("code")).toBeNull();
    const alerta = screen.getByRole("alert");
    expect(alerta.textContent).toContain(t.aprobar.bloqueado);
    expect(alerta.textContent).toMatch(/acción alta sin mitigación \(rie-fuga\)/);
    expect(alerta.textContent).toMatch(/ciclo de dependencias/);
  });
  it("un plan aprobado es de solo lectura: muestra su sello y su huella, y ningún comando", () => {
    const aprobado = { ...planReal, estado_aprobacion: "aprobado" as const, aprobacion: { fecha: "2026-10-12", huella: "a".repeat(64) } };
    const { container } = render(<AprobarPlan plan={aprobado} comando={null} bloqueos={[]} idioma="es" />);
    expect(screen.getByText(t.aprobar.sello.titulo)).toBeTruthy();
    expect(container.textContent).toContain("2026-10-12");
    expect(container.textContent).toContain("sha256");
    expect(container.querySelector("code")).toBeNull();
  });
});

describe("el orden de la tabla AIAG-VDA sale del mínimo de cada banda (la 1 va primero, no al final)", () => {
  it("la primera fila es severidad 1 y ocurrencia 1", () => {
    const { container } = render(<TablaAccion t={t} />);
    const primera = container.querySelector("tbody tr th")!;
    expect(primera.textContent).toBe(plantilla(t.riesgos.tabla.fila, { s: "1", o: "1" }));
  });
});

describe("cada motivo que el motor puede emitir tiene su texto en la ficha", () => {
  it("el diccionario cubre todos los motivos del tipo Motivo (exhaustivo por tipo)", () => {
    const motor: Record<Motivo["motivo"], true> = { "perfil-en-borrador": true, "todas-descartadas": true, "falta-evidencia": true };
    for (const m of Object.keys(motor)) expect(t.ficha.motivos, m).toHaveProperty(m);
  });
});
