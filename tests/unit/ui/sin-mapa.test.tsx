// El estado vacío del investigador (A-27), con una plataforma de la prueba: desde la fase 3 del S2 todas las
// plataformas reales tienen mapa y ninguna página del export lo muestra, pero vuelve con cada plataforma nueva
// (N por diseño). El e2e lo mira en el navegador mientras haya una «próximamente».
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SinMapa } from "@/components/investigador/SinMapa";

describe("SinMapa", () => {
  for (const [idioma, titulo, boton] of [
    ["es", "Todavía no hay mapa de Nueva.", "Solicitar investigación"],
    ["en", "There is no map of Nueva yet.", "Request research"],
  ] as const)
    it(`pide la investigación con una tarea de GitHub ya escrita (${idioma})`, () => {
      const { container } = render(<SinMapa idioma={idioma} plataforma={{ id: "nueva", nombre: "Nueva" }} />);
      expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(titulo);
      const pedir = screen.getByRole("link", { name: boton });
      expect(pedir.getAttribute("target")).toBe("_blank");
      const url = new URL(pedir.getAttribute("href")!);
      expect(url.origin + url.pathname).toBe("https://github.com/mauriciorincon-ai/app-big-d/issues/new");
      expect(url.searchParams.get("title")).toContain("Nueva");
      expect(url.searchParams.get("labels")).toBe("investigacion");
      expect(url.searchParams.get("body")).toContain("/investigar nueva");
      expect(container.textContent).not.toContain("Claude Code");
    });
});
