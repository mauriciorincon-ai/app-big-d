// La barra y las pestañas de nivel: dónde estoy. B-4 de la auditoría del S1: `aria-current="page"` solo en el
// enlace a ESTA página; «true» en la sección que la contiene; nada en la portada. Y las pestañas: un nivel sin
// ruta se muestra pendiente, sin enlace (jamás un control que no hace nada).
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NavSecciones } from "@/components/NavSecciones";
import { ConmutadorIdioma } from "@/components/ConmutadorIdioma";
import { Niveles } from "@/components/atlas/Niveles";
import { MarcaVigencia } from "@/components/atlas/MarcaVigencia";
import { textos } from "@/lib/i18n";

let ruta = "/es";
vi.mock("next/navigation", () => ({ usePathname: () => ruta }));

const SECCIONES = [
  { ruta: "/es/atlas/fabric", texto: "Atlas", prefijo: "/es/atlas" },
  { ruta: "/es/investigador/databricks", texto: "Conocimiento", prefijo: "/es/investigador" },
];

describe("NavSecciones", () => {
  it.each([
    ["/es", undefined, undefined],
    ["/es/atlas/fabric", "page", undefined],
    ["/es/atlas/fabric/componentes", "true", undefined],
    ["/es/atlas/plataforma-ejemplo", "true", undefined],
    ["/es/investigador/fabric", undefined, "true"],
    ["/es/investigador/databricks", undefined, "page"],
  ])("en %s: Atlas=%s, Conocimiento=%s", (r, atlas, conocimiento) => {
    ruta = r;
    render(<NavSecciones etiqueta="Secciones" secciones={SECCIONES} />);
    expect(screen.getByRole("link", { name: "Atlas" }).getAttribute("aria-current") ?? undefined).toBe(atlas);
    expect(screen.getByRole("link", { name: "Conocimiento" }).getAttribute("aria-current") ?? undefined).toBe(conocimiento);
  });
});

describe("ConmutadorIdioma", () => {
  it("lleva a la misma página en el otro idioma y marca el vigente", () => {
    ruta = "/es/atlas/fabric/componentes";
    render(<ConmutadorIdioma actual="es" etiqueta="Idioma" />);
    const en = screen.getByRole("link", { name: "English" });
    expect(en.getAttribute("href")).toBe("/en/atlas/fabric/componentes");
    expect(en.getAttribute("hreflang")).toBe("en");
    expect(screen.getByRole("link", { name: "Español" }).getAttribute("aria-current")).toBe("true");
  });
});

describe("Niveles", () => {
  it("los niveles con ruta son enlaces (el actual, «page»); «lado a lado» queda pendiente, sin enlace", () => {
    const t = textos("es").atlas.niveles;
    const { container } = render(<Niveles t={t} actual="componentes" rutas={{ general: "/es/atlas/fabric", componentes: "/es/atlas/fabric/componentes" }} />);
    expect(screen.getByRole("link", { name: `02${t.componentes}` }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: `01${t.general}` }).hasAttribute("aria-current")).toBe(false);
    expect(container.querySelectorAll(".pend")).toHaveLength(2);
    expect(screen.queryByRole("link", { name: new RegExp(t.lado) })).toBeNull();
  });
});

describe("MarcaVigencia", () => {
  it.each(["vigente", "revisar", "vencido"] as const)("%s: una marca propia, sin depender del color", (estado) => {
    const { container } = render(<MarcaVigencia estado={estado} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.querySelectorAll("path").length).toBeGreaterThan(0);
  });
});
