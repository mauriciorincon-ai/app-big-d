// La revisión afirmación por afirmación arma el comando de aprobación (la pantalla es estática: nada se
// aprueba aquí). De entrada: lo verificado va aprobado, lo no verificable espera a la persona, lo que el
// código no encontró queda rechazado sin opción; el comando solo aparece cuando todo está decidido.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RevisionPropuesta } from "@/components/investigador/RevisionPropuesta";
import { textos } from "@/lib/i18n";
import type { AfirmacionVista, RetiroVista } from "@/lib/investigador/revision";

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

/** Un componente que sale con su cita (R-1) y el flujo que se lleva por arrastre. */
const RETIROS = (resultado: "verificada" | "no-encontrada" = "verificada"): RetiroVista[] => [
  {
    id: "monitor",
    entidad: "nodo",
    nombre: "Monitor de capacidad",
    argumento: {
      tipo: "cita",
      id: "R-1",
      motivo: "El fabricante lo retiró; sus métricas pasaron al panel de capacidad.",
      cita: { texto: "The capacity monitor is retired; its metrics now live in the capacity panel.", url: "https://ejemplo.invalid/novedades", titulo: "Novedades", tipo: "oficial", conflicto: "fabricante" },
      verificacion: { resultado, http: 200, sha256: "b".repeat(64) },
    },
  },
  { id: "f-motor-monitor", entidad: "flujo", nombre: "Motor → Monitor de capacidad", argumento: { tipo: "arrastre", por: ["Monitor de capacidad"] } },
];

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
    const { container } = render(<RevisionPropuesta carpeta="propuestas/x" afirmaciones={[af("A-1", "verificada")]} retiros={RETIROS()} t={t} />);
    expect(screen.getByRole("heading", { name: `${t.propuesta.retiros.titulo} · 2` })).toBeInTheDocument();
    expect(container.querySelector('[data-retiro="f-motor-monitor"]')!.textContent).toContain("Motor → Monitor de capacidad");
    expect(container.querySelector(".comando code")!.textContent).toMatch(/ --retirar monitor,f-motor-monitor$/);
  });
});

// Pedido de la persona al mirar la lista (2026-09-30): «que no queden dudas de por qué sale».
describe("cada retiro dice por qué sale", () => {
  it("el que prueba una cita muestra su motivo, la cita, su verificación y la fuente; el de arrastre, el extremo que se lo lleva", () => {
    const t = textos("es").investigador;
    const { container } = render(<RevisionPropuesta carpeta="propuestas/x" afirmaciones={[af("A-1", "verificada")]} retiros={RETIROS()} t={t} />);
    const cita = container.querySelector('[data-retiro="monitor"]')!;
    expect(cita.getAttribute("data-argumento")).toBe("cita");
    expect(cita.querySelector(".retiro-porque")!.textContent).toBe("R-1 El fabricante lo retiró; sus métricas pasaron al panel de capacidad.");
    expect(cita.querySelector("blockquote")!.textContent).toBe("«The capacity monitor is retired; its metrics now live in the capacity panel.»");
    expect(cita.querySelector(".verif b")!.textContent).toBe(t.propuesta.verif.verificada);
    expect(within(cita as HTMLElement).getByRole("link", { name: "Novedades" })).toHaveAttribute("href", "https://ejemplo.invalid/novedades");
    const arrastre = container.querySelector('[data-retiro="f-motor-monitor"]')!;
    expect(arrastre.getAttribute("data-argumento")).toBe("arrastre");
    expect(arrastre.querySelector(".retiro-porque")!.textContent).toBe("Sale porque también sale «Monitor de capacidad»: un flujo no se queda sin uno de sus extremos.");
  });
  it("si la cita de un retiro no aparece en la fuente, lo dice y no arma el comando (aprobar lo rechazaría)", () => {
    const t = textos("es").investigador;
    const retiros = RETIROS("no-encontrada");
    const { container } = render(<RevisionPropuesta carpeta="propuestas/x" afirmaciones={[af("A-1", "verificada")]} retiros={retiros} t={t} />);
    expect(container.querySelector('[data-retiro="monitor"] .verif')!.textContent).toContain(t.propuesta.retiros.sinArgumento);
    expect(container.querySelector(".comando")).toBeNull();
    expect(screen.getByText(t.propuesta.retiros.bloquea)).toBeInTheDocument();
  });
  it("en inglés, el arrastre de un flujo que pierde sus dos extremos los nombra a los dos", () => {
    const t = textos("en").investigador;
    const dos: RetiroVista[] = [{ id: "f-a-b", entidad: "flujo", nombre: "A → B", argumento: { tipo: "arrastre", por: ["A", "B"] } }];
    const { container } = render(<RevisionPropuesta carpeta="propuestas/x" afirmaciones={[af("A-1", "verificada")]} retiros={dos} t={t} />);
    expect(container.querySelector(".retiro-porque")!.textContent).toBe("It leaves because both its ends leave too, “A” and “B”.");
  });
});
