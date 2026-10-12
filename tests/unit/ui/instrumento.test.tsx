// La pantalla del instrumento (S4): el verde que se publica, y el rojo y el bloqueo que el build nunca publica (se prueban con una
// validación de ejemplo). El color nunca va solo: cada fila lleva símbolo, texto y detalle; la fallida, borde discontinuo y aspa.
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PanelDeValidacion } from "@/components/instrumento/Validacion";
import type { Validacion } from "@/engine";
import { textos } from "@/lib/i18n";

const fila = (id: string, ok: boolean, es = id, detalle = "") => ({ id, descripcion: { es, en: `${es} (en)` }, ok, detalle: { es: detalle || (ok ? "bien" : "mal"), en: ok ? "fine" : "bad" } });
const verde: Validacion = {
  version: 1,
  base: { casos: ["hospital-futuro"], instantaneas: ["2026-10-06.1"], evidencias: 44 },
  referencias: [fila("r1", true, "Todo el peso en gobierno"), fila("r2", true, "Empate exacto")],
  propiedades: [{ ...fila("p1", true, "Reordenar no cambia nada"), corridas: 200, semilla: 20_261_004 }],
  sembrados: [fila("s1", true, "Pesos que no suman 100"), fila("s2", true, "Rango abierto")],
  aprobaciones: [fila("a1", true, "Cada evidencia es la aprobada")],
  huellaNucleo: "e41f07".padEnd(64, "0").slice(0, 60) + "8b2d",
};
const rojo: Validacion = { ...verde, sembrados: [fila("s1", true, "Pesos que no suman 100"), fila("s2", false, "Rango abierto", "no detectado · RF-03.2")] };

afterEach(cleanup);
const es = textos("es").instrumento;
const en = textos("en").instrumento;

describe("PanelDeValidacion", () => {
  it("en verde: veredicto «se puede publicar», los conteos de cada bloque y sin bloqueo", () => {
    render(<PanelDeValidacion v={verde} t={es} idioma="es" />);
    expect(screen.getByText(es.verde)).toBeTruthy();
    expect(document.querySelector("[data-estado='verde']")?.textContent).toContain("2/2 referencias · 1/1 propiedades · 2/2 sembrados · 1/1 aprobaciones");
    expect(screen.getByText("2 de 2 detectados")).toBeTruthy();
    expect(document.querySelector("[data-bloqueo]")).toBeNull();
    expect(document.querySelectorAll(".val-falla")).toHaveLength(0);
    expect(screen.getByText(/huella del núcleo sha256/)).toBeTruthy();
  });

  it("en rojo: «detectados 1 de 2», la fila fallida marcada con aspa y texto, y el bloqueo de publicación que la nombra", () => {
    render(<PanelDeValidacion v={rojo} t={es} idioma="es" />);
    expect(screen.getByText(es.rojo)).toBeTruthy();
    expect(screen.getByText("1 de 2 detectados")).toBeTruthy();
    const falla = document.querySelector("[data-validacion='s2']") as HTMLElement;
    expect(falla.className).toContain("val-falla");
    expect(falla.textContent).toContain("no detectado · RF-03.2");
    expect(falla.querySelector("svg")).toBeTruthy();
    const bloqueo = document.querySelector("[data-bloqueo]") as HTMLElement;
    expect(bloqueo.getAttribute("role")).toBe("alert");
    expect(within(bloqueo).getByText(es.bloqueo.titulo)).toBeTruthy();
    expect(bloqueo.textContent).toContain("Errores sembrados · Rango abierto — no detectado · RF-03.2");
    expect(bloqueo.textContent).toContain(es.bloqueo.destrabar);
  });

  it("en inglés usa los textos y los detalles de ese idioma", () => {
    render(<PanelDeValidacion v={rojo} t={en} idioma="en" />);
    expect(screen.getByText(en.rojo)).toBeTruthy();
    expect(screen.getByText("1 of 2 detected")).toBeTruthy();
    expect((document.querySelector("[data-bloqueo]") as HTMLElement).textContent).toContain("Seeded errors · Rango abierto (en) — bad");
  });

  it("S4-M4: dice qué es la huella que muestra (la del archivo de sumas) y que el sitio no la recalcula; quien la recalcula es la integración continua", () => {
    render(<PanelDeValidacion v={verde} t={es} idioma="es" />);
    expect(screen.getByText(/el sitio no la recalcula/)).toBeTruthy();
    expect(screen.getByText(/La integración continua recalcula cada caso en Node, Chromium, Firefox y WebKit/)).toBeTruthy();
    cleanup();
    render(<PanelDeValidacion v={verde} t={en} idioma="en" />);
    expect(screen.getByText(/the site does not recompute it/)).toBeTruthy();
  });
  it("sin huella del núcleo lo dice en vez de inventarla", () => {
    render(<PanelDeValidacion v={{ ...verde, huellaNucleo: null }} t={es} idioma="es" />);
    expect(screen.getByText(es.motores.sinHuella)).toBeTruthy();
  });
});
