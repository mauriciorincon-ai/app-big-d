// La revisión afirmación por afirmación arma el comando de aprobación (la pantalla es estática: nada se
// aprueba aquí). De entrada: lo verificado va aprobado, lo no verificable espera a la persona, lo que el
// código no encontró queda rechazado sin opción; el comando solo aparece cuando todo está decidido.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RevisionPropuesta } from "@/components/investigador/RevisionPropuesta";
import { textos } from "@/lib/i18n";
import type { AfirmacionVista } from "@/lib/investigador/revision";

const af = (id: string, resultado: "verificada" | "no-verificable" | "no-encontrada"): AfirmacionVista => ({
  id,
  entidad: "nodo",
  sobre: `n-${id}`,
  nombre: `Componente ${id}`,
  enunciado: `Afirmación ${id}`,
  cita: { texto: "Texto literal de la fuente.", url: "https://ejemplo.invalid/x", titulo: "Fuente", tipo: "oficial", conflicto: "fabricante" },
  verificacion: { resultado, http: 200, sha256: "a".repeat(64) },
  cambio: "nuevo",
});

describe("revisión de una propuesta", () => {
  it("arma el comando con la decisión de la persona, y solo cuando todo está decidido", () => {
    const t = textos("es").investigador;
    const { container } = render(<RevisionPropuesta carpeta="propuestas/2026-09-27-x" afirmaciones={[af("A-1", "verificada"), af("A-2", "no-verificable"), af("A-3", "no-encontrada")]} t={t} />);
    expect(screen.getByText("Falta 1 afirmación por decidir.")).toBeTruthy();
    expect(container.querySelector('[data-afirmacion="A-3"] .decidir')).toBeNull();
    fireEvent.click(within(container.querySelector('[data-afirmacion="A-2"]') as HTMLElement).getByRole("button", { name: "Aprobar" }));
    expect(container.querySelector(".comando code")!.textContent).toMatch(/ propuestas\/2026-09-27-x --aprobar A-1,A-2 --rechazar A-3 --retirar -$/);
    fireEvent.click(within(container.querySelector('[data-afirmacion="A-1"]') as HTMLElement).getByRole("button", { name: "Rechazar" }));
    expect(container.querySelector(".comando code")!.textContent).toMatch(/ --aprobar A-2 --rechazar A-1,A-3 --retirar -$/);
    expect(container.querySelector('[data-afirmacion="A-1"]')!.hasAttribute("data-rechazada")).toBe(true);
  });
});

describe("M-20 y M-21: de qué habla cada afirmación, y lo que se retira", () => {
  it("la tarjeta dice sobre qué componente o flujo es", () => {
    const t = textos("es").investigador;
    const { container } = render(<RevisionPropuesta carpeta="propuestas/x" afirmaciones={[af("A-1", "verificada")]} t={t} />);
    expect(container.querySelector('[data-afirmacion="A-1"] .afirmacion-sobre')!.textContent).toBe("Componente A-1");
  });
  it("los retiros se listan con su nombre y el comando los nombra", () => {
    const t = textos("es").investigador;
    const retiros = [
      { id: "monitor", entidad: "nodo" as const, nombre: "Monitor de capacidad" },
      { id: "f-motor-monitor", entidad: "flujo" as const, nombre: "Motor → Monitor de capacidad" },
    ];
    const { container } = render(<RevisionPropuesta carpeta="propuestas/x" afirmaciones={[af("A-1", "verificada")]} retiros={retiros} t={t} />);
    expect(screen.getByRole("heading", { name: `${t.propuesta.retiros.titulo} · 2` })).toBeInTheDocument();
    expect(container.querySelector('[data-retiro="f-motor-monitor"]')!.textContent).toContain("Motor → Monitor de capacidad");
    expect(container.querySelector(".comando code")!.textContent).toMatch(/ --retirar monitor,f-motor-monitor$/);
  });
});
