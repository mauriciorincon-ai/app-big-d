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
  { ruta: "/es/atlas/fabric", texto: "Atlas", prefijos: ["/es/atlas", "/es/comparar"] },
  { ruta: "/es/investigador/databricks", texto: "Conocimiento", prefijos: ["/es/investigador"] },
];

describe("NavSecciones", () => {
  it.each([
    ["/es", undefined, undefined],
    ["/es/atlas/fabric", "page", undefined],
    ["/es/atlas/fabric/componentes", "true", undefined],
    ["/es/atlas/plataforma-ejemplo", "true", undefined],
    ["/es/comparar", "true", undefined],
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
  it("al tocarlo lleva también la consulta (en el lado a lado: qué plataformas y qué página)", () => {
    ruta = "/es/comparar";
    window.history.replaceState(null, "", "/es/comparar?plataformas=fabric&pagina=1");
    render(<ConmutadorIdioma actual="es" etiqueta="Idioma" />);
    const en = screen.getByRole("link", { name: "English" });
    expect(en.getAttribute("href")).toBe("/en/comparar");
    en.addEventListener("click", (e) => e.preventDefault());
    en.click();
    expect(en.getAttribute("href")).toBe("/en/comparar?plataformas=fabric&pagina=1");
    window.history.replaceState(null, "", "/");
  });
});

describe("Niveles", () => {
  it("los niveles con ruta son enlaces (el actual, «page»); uno sin ruta queda pendiente, sin enlace", () => {
    const t = textos("es").atlas.niveles;
    const { container } = render(<Niveles t={t} actual="componentes" rutas={{ general: "/es/atlas/fabric", componentes: "/es/atlas/fabric/componentes" }} />);
    expect(screen.getByRole("link", { name: `02${t.componentes}` }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: `01${t.general}` }).hasAttribute("aria-current")).toBe(false);
    expect(container.querySelectorAll(".pend")).toHaveLength(2);
    expect(screen.queryByRole("link", { name: new RegExp(t.lado) })).toBeNull();
  });
  it("«lado a lado» es un enlace a /comparar, y en esa página la pestaña actual", () => {
    const t = textos("es").atlas.niveles;
    render(<Niveles t={t} actual="lado" rutas={{ general: "/es/atlas/fabric", componentes: "/es/atlas/fabric/componentes", recorrido: "/es/atlas/fabric/recorrido", lado: "/es/comparar" }} />);
    const lado = screen.getByRole("link", { name: `04${t.lado}` });
    expect(lado.getAttribute("href")).toBe("/es/comparar");
    expect(lado.getAttribute("aria-current")).toBe("page");
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
