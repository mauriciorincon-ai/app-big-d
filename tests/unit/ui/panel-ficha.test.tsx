// Panel de la ficha y de la ventana (contrato de foco del design system § 7): abrir con clic o con Enter
// sobre un activable del lienzo, el foco al título, Esc o «Cerrar» devuelven el foco al componente de
// origen. B-3 de la auditoría del S1: reactivar el MISMO componente vuelve a llevar el foco al título.
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PanelFicha } from "@/components/atlas/PanelFicha";

function lienzo() {
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<div class="lienzo" id="lienzo-prueba"><g class="dg-nodo" data-nodo="a" tabindex="0">A</g><g class="dg-nodo" data-nodo="b" tabindex="0">B</g><g class="dg-nodo" data-nodo="sin-ficha" tabindex="0">C</g></div>`,
  );
  return (id: string) => document.querySelector<HTMLElement>(`[data-nodo="${id}"]`)!;
}

const FICHAS = { a: "<h2>Ficha A</h2><p>texto</p>", b: "<h2>Ficha B</h2><a href='#x'>enlace</a>" };

describe("PanelFicha", () => {
  let angosto = false;
  beforeEach(() => {
    angosto = false;
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("max-width") ? angosto : false, media: q, addEventListener() {}, removeEventListener() {} }));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    document.getElementById("lienzo-prueba")?.remove();
  });

  it("nace oculto; un clic en un activable lo abre con su ficha, lo marca y lleva el foco al título", () => {
    const nodo = lienzo();
    render(<PanelFicha fichas={FICHAS} titulo="Ficha" cerrar="Cerrar" />);
    const panel = document.getElementById("panel-ficha")!;
    expect(panel.hidden).toBe(true);
    expect(panel.getAttribute("role")).toBe("complementary");
    act(() => nodo("a").click());
    expect(panel.hidden).toBe(false);
    expect(screen.getByRole("heading", { name: "Ficha A" })).toHaveFocus();
    expect(nodo("a").getAttribute("aria-current")).toBe("true");
  });

  it("B-3: reactivar el mismo componente vuelve a llevar el foco al título", () => {
    const nodo = lienzo();
    render(<PanelFicha fichas={FICHAS} titulo="Ficha" cerrar="Cerrar" />);
    act(() => nodo("a").click());
    nodo("a").focus();
    expect(nodo("a")).toHaveFocus();
    act(() => {
      fireEvent.keyDown(nodo("a"), { key: "Enter" });
    });
    expect(screen.getByRole("heading", { name: "Ficha A" })).toHaveFocus();
  });

  it("Esc y «Cerrar» cierran y devuelven el foco al componente; lo que no tiene ficha no abre nada", () => {
    const nodo = lienzo();
    render(<PanelFicha fichas={FICHAS} titulo="Ficha" cerrar="Cerrar" />);
    const panel = document.getElementById("panel-ficha")!;
    act(() => nodo("sin-ficha").click());
    expect(panel.hidden).toBe(true);
    act(() => {
      fireEvent.keyDown(nodo("b"), { key: " " });
    });
    expect(screen.getByRole("heading", { name: "Ficha B" })).toHaveFocus();
    act(() => {
      fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    });
    expect(panel.hidden).toBe(true);
    expect(nodo("b")).toHaveFocus();
    act(() => nodo("a").click());
    act(() => screen.getByRole("button", { name: "Cerrar" }).click());
    expect(panel.hidden).toBe(true);
    expect(nodo("a")).toHaveFocus();
    expect(nodo("a").hasAttribute("aria-current")).toBe(false);
  });

  it("en teléfono es una hoja modal y el Tab no sale del panel", () => {
    angosto = true;
    const nodo = lienzo();
    render(<PanelFicha fichas={FICHAS} titulo="Ficha" cerrar="Cerrar" />);
    const panel = document.getElementById("panel-ficha")!;
    expect(panel.getAttribute("role")).toBe("dialog");
    expect(panel.getAttribute("aria-modal")).toBe("true");
    act(() => nodo("b").click());
    // jsdom no dibuja: todo elemento cuenta como visible para el ciclo de foco.
    for (const el of panel.querySelectorAll<HTMLElement>("button, a[href], [tabindex='-1']")) el.getClientRects = () => [{}] as unknown as DOMRectList;
    const cerrar = screen.getByRole("button", { name: "Cerrar" });
    const enlace = screen.getByRole("link", { name: "enlace" });
    enlace.focus();
    act(() => {
      fireEvent.keyDown(enlace, { key: "Tab" });
    });
    expect(cerrar).toHaveFocus();
    act(() => {
      fireEvent.keyDown(cerrar, { key: "Tab", shiftKey: true });
    });
    expect(enlace).toHaveFocus();
    nodo("a").focus();
    act(() => {
      fireEvent.keyDown(nodo("a"), { key: "Tab" });
    });
    expect(cerrar).toHaveFocus();
  });
});
