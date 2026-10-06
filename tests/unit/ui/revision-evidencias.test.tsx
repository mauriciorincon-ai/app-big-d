// La revisión de una propuesta de EVIDENCIAS (D-S3-10, boceto M1 aprobado el 2026-10-05) arma el comando de aprobación;
// la pantalla es estática. A diferencia de los mapas, NINGUNA viene aprobada de entrada: el código comprueba la cita, no
// el puntaje. La que tiene una cita que el código no encontró queda rechazada sin opción. Cada tarjeta trae la regla de
// 0 a 4: el puntaje propuesto, lo que su madurez no deja contar en rayado y el nivel que cuenta si el tope lo baja.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RevisionEvidencias } from "@/components/investigador/RevisionEvidencias";
import { textos } from "@/lib/i18n";
import type { EvidenciaVista, PropuestaEvidenciasVista } from "@/lib/investigador/revision";

const NIVELES = ["no soportado", "parcial o con terceros", "soportado con límites", "maduro", "maduro y nativo"].map((nombre, valor) => ({ valor, nombre, descripcion: `Descripción del nivel ${valor}.` }));
const ev = (id: string, resultado: EvidenciaVista["resultado"], extra: Partial<EvidenciaVista> = {}): EvidenciaVista => ({
  id,
  evidencia: `evi-norte-${id.toLowerCase()}`,
  criterio: `Criterio ${id}`,
  tipo: "capacidad",
  afirmacion: `Afirmación ${id}`,
  puntaje: 3,
  madurez: "Disponible de forma general",
  tope: 4,
  topeConVistaPrevia: 4,
  justificacion: "3 y no 4: tiene límites documentados. 3 y no 2: está disponible de forma general.",
  componentes: ["Catálogo"],
  limitaciones: [],
  esencial: true,
  fuentes: [{ cita: { texto: "Texto literal de la fuente.", url: "https://ejemplo.invalid/x", titulo: "Fuente", tipo: "oficial", conflicto: "fuente del propio fabricante" }, verificacion: resultado ? { resultado, http: 200, sha256: "a".repeat(64) } : null }],
  resultado,
  cambio: "nueva",
  ...extra,
});
const propuesta = (evidencias: EvidenciaVista[]): PropuestaEvidenciasVista => ({ carpeta: "propuestas/2026-10-05-norte-evidencias", fecha: "2026-10-05", modelo: "m", reintentos: 0, reintentosDeclarados: 0, fallas: [], verificada: true, fuentes: 1, niveles: NIVELES, topeNoDisponible: 2, evidencias, preguntas: [] });
const t = textos("es").investigador;

describe("revisión de una propuesta de evidencias", () => {
  it("nada viene aprobado de entrada; el comando aparece solo cuando todo está decidido", () => {
    const { container } = render(<RevisionEvidencias propuesta={propuesta([ev("A-1", "verificada"), ev("A-2", "no-verificable"), ev("A-3", "no-encontrada")])} plataforma="norte" t={t} />);
    expect(screen.getByText("Faltan 2 evidencias por decidir.")).toBeTruthy();
    expect(container.querySelector(".comando")).toBeNull();
    const tarjeta = (id: string) => container.querySelector(`[data-evidencia="${id}"]`) as HTMLElement;
    expect(within(tarjeta("A-1")).getByText("por decidir")).toBeTruthy();
    expect(within(tarjeta("A-1")).getByRole("button", { name: "Aprobar" }).getAttribute("aria-pressed")).toBe("false");
    // La rechazada por el código: rechazada y sin botones.
    expect(tarjeta("A-3").querySelector(".decidir")).toBeNull();
    expect(within(tarjeta("A-3")).getByText("rechazada")).toBeTruthy();
    fireEvent.click(within(tarjeta("A-1")).getByRole("button", { name: "Aprobar" }));
    expect(screen.getByText("Falta 1 evidencia por decidir.")).toBeTruthy();
    fireEvent.click(within(tarjeta("A-2")).getByRole("button", { name: "Rechazar" }));
    expect(container.querySelector(".comando code")!.textContent).toMatch(/ propuestas\/2026-10-05-norte-evidencias --aprobar A-1 --rechazar A-2,A-3 --retirar -$/);
    expect(container.querySelector(".comando small")!.textContent).toContain("data/evidencias/norte/");
  });
  it("la regla de 0 a 4: un nivel propuesto con su marca; con un tope, lo rayado y el nivel que cuenta", () => {
    const { container } = render(<RevisionEvidencias propuesta={propuesta([ev("A-1", "verificada"), ev("A-2", "verificada", { madurez: "Vista previa pública", tope: 2, topeConVistaPrevia: 4 })])} plataforma="norte" t={t} />);
    const regla = (id: string) => container.querySelector(`[data-evidencia="${id}"] .escala-tira`) as HTMLElement;
    expect(regla("A-1").querySelectorAll("li")).toHaveLength(5);
    expect(regla("A-1").querySelector("li.propuesto")!.textContent).toBe("3maduropropuesto");
    expect(regla("A-1").getAttribute("aria-label")).toBe("Puntaje 3 de 4");
    expect(regla("A-1").querySelectorAll("li.sobre-tope")).toHaveLength(0);
    expect(container.querySelector('[data-evidencia="A-1"] .tope-nota')).toBeNull();
    expect([...regla("A-2").querySelectorAll("li.sobre-tope")].map((li) => li.querySelector("b")!.textContent)).toEqual(["3", "4"]);
    expect(regla("A-2").querySelector("li.cuenta b")!.textContent).toBe("2");
    expect(container.querySelector('[data-evidencia="A-2"] .tope-nota')!.textContent).toBe("Rayado, lo que la madurez «vista previa pública» no deja contar: aquí cuenta como 2, y como 3 si el caso acepta vista previa.");
  });
  it("el texto del nivel propuesto y por qué ese y no los de al lado", () => {
    const { container } = render(<RevisionEvidencias propuesta={propuesta([ev("A-1", "verificada"), ev("A-2", "verificada", { puntaje: 4 }), ev("A-3", "verificada", { puntaje: 0 })])} plataforma="norte" t={t} />);
    const de = (id: string, s: string) => container.querySelector(`[data-evidencia="${id}"] ${s}`)!.textContent;
    expect(de("A-1", ".ancla")).toBe("3 · maduro. Descripción del nivel 3.");
    expect(de("A-1", ".porque b")).toBe("¿Por qué 3 y no 2 ni 4?");
    expect(de("A-2", ".porque b")).toBe("¿Por qué 4 y no 3?");
    expect(de("A-3", ".porque b")).toBe("¿Por qué 0 y no 1?");
  });
  it("en inglés, la misma pantalla redactada", () => {
    const { container } = render(<RevisionEvidencias propuesta={propuesta([ev("A-1", "no-verificable")])} plataforma="norte" t={textos("en").investigador} />);
    expect(screen.getByText("1 piece of evidence left to decide.")).toBeTruthy();
    expect(container.querySelector(".porque b")!.textContent).toBe("Why 3 and not 2 or 4?");
    expect(container.querySelector(".escala-tira")!.getAttribute("aria-label")).toBe("Score 3 out of 4");
  });
});
