// El componente del lado a lado (S2): el mismo HTML en el servidor y al hidratar (la URL no cambia el árbol), la URL
// como única fuente de la selección y la página, el botón «Desplegar todo» de las dos vistas, las pestañas de banda
// del teléfono y la limpieza del <html> al salir. El e2e (`lado.spec.ts`) lo mira en el navegador de verdad.
import { act, fireEvent, render, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { Lado, type PropsLado } from "@/components/atlas/Lado";
import { textos } from "@/lib/i18n";

const IDS = ["a", "b", "c", "d"];
const props = (): PropsLado => ({
  ids: IDS,
  porPagina: 3,
  nombres: { a: "Alfa", b: "Beta", c: "Gama", d: "Delta" },
  versiones: { b: "v0.1.0", c: "v0.2.0" },
  t: textos("es").atlas.lado,
  saltarDiagrama: "Saltar el diagrama",
  indice: "Ir a una banda",
  idLectura: "lectura",
  idPista: "pista-activar",
  cabecera: '<svg class="dg-svg"></svg>',
  filas: [
    { id: "a", nombre: "Alfa", investigador: "/es/investigador/a" },
    { id: "b", nombre: "Beta", version: "0.1.0", n1: "<svg data-n='1'></svg>", n2: "<svg data-n='2'></svg>", investigador: "/es/investigador/b" },
    { id: "c", nombre: "Gama", version: "0.2.0", n1: "<svg></svg>", n2: "<svg></svg>", investigador: "/es/investigador/c" },
    { id: "d", nombre: "Delta", investigador: "/es/investigador/d" },
  ],
  columnas: [
    { banda: "x", x: 8, numero: "01", nombre: "Equis" },
    { banda: "y", x: 174, numero: "02", nombre: "Ye" },
  ],
  angosto: ["x", "y"].map((b, i) => ({
    id: b,
    numero: `0${i + 1}`,
    nombre: b,
    pregunta: `¿${b}?`,
    celdas: IDS.map((p) => ({
      plataforma: p,
      nombre: p,
      pronto: p === "a" || p === "d",
      elementos: p === "b" ? [{ id: `b/${b}`, nombre: `Bloque ${b}`, resumen: "2 comp.", glifo: "<svg></svg>", tarjetas: "<div class='dg-tarjetas'></div>" }] : [],
    })),
  })),
  children: <p className="guia">Guía</p>,
});

afterEach(() => {
  window.history.replaceState(null, "", "/");
  document.documentElement.removeAttribute("data-lado");
  document.documentElement.removeAttribute("data-lado-elegidas");
});

describe("Lado", () => {
  it("el HTML del servidor no depende de la URL: todas y la página 1, filas de inicio marcadas", () => {
    const html = renderToString(<Lado {...props()} />);
    expect(html).toContain("Plataformas: 4 de 4");
    expect(html).toContain("1–3 de 4");
    expect([...html.matchAll(/data-fila="(\w)"[^>]*data-inicio/g)].map((m) => m[1])).toEqual(["a", "b", "c"]);
    expect(html).toContain('aria-expanded="false"');
  });

  it("al hidratar con consulta, el <html> nunca pasa por el estado por defecto (lo dejó el script previo)", async () => {
    const raiz = document.createElement("div");
    raiz.innerHTML = renderToString(<Lado {...props()} />);
    document.body.appendChild(raiz);
    window.history.replaceState(null, "", "/es/comparar?plataformas=d");
    const h = document.documentElement;
    h.setAttribute("data-lado", "d"); // lo que dejó el script previo al pintado
    const vistos: string[] = [];
    const poner = h.setAttribute.bind(h);
    h.setAttribute = (k: string, v: string) => {
      if (k === "data-lado") vistos.push(v);
      poner(k, v);
    };
    let r: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        r = hydrateRoot(raiz, <Lado {...props()} />);
      });
    } finally {
      delete (h as unknown as Record<string, unknown>).setAttribute; // vuelve el del prototipo
    }
    try {
      expect(vistos.length).toBeGreaterThan(0);
      expect(vistos.every((v) => v === "d"), JSON.stringify(vistos)).toBe(true);
    } finally {
      act(() => r!.unmount());
      raiz.remove();
    }
  });

  it("lee la URL al montar, pone los atributos del <html> y los quita al salir", () => {
    window.history.replaceState(null, "", "/es/comparar?pagina=2");
    const { unmount } = render(<Lado {...props()} />);
    expect(document.documentElement.getAttribute("data-lado")).toBe("d");
    expect(document.documentElement.getAttribute("data-lado-elegidas")).toBe("a b c d");
    expect(screen.getByText("4 de 4")).toBeTruthy();
    unmount();
    expect(document.documentElement.hasAttribute("data-lado")).toBe(false);
    expect(document.documentElement.hasAttribute("data-lado-elegidas")).toBe(false);
  });

  it("el selector y la paginación escriben la URL; la última elegida no se quita", () => {
    window.history.replaceState(null, "", "/es/comparar");
    render(<Lado {...props()} />);
    const [siguiente] = screen.getAllByRole("button", { name: "Siguiente" });
    act(() => fireEvent.click(siguiente!));
    expect(window.location.search).toBe("?pagina=2");
    expect(screen.getByRole("button", { name: "Anterior" })).toHaveFocus();
    act(() => fireEvent.click(screen.getByRole("button", { name: "Anterior" })));
    expect(window.location.search).toBe("");
    const casillas = screen.getAllByRole("checkbox");
    act(() => fireEvent.click(casillas[0]!));
    expect(window.location.search).toBe("?plataformas=b,c,d");
    expect(screen.getByText("Plataformas: 3 de 4")).toBeTruthy();
    for (const i of [1, 2]) act(() => fireEvent.click(casillas[i]!));
    expect(window.location.search).toBe("?plataformas=d");
    expect(casillas[3]).toBeDisabled();
    act(() => fireEvent.click(casillas[3]!));
    expect(window.location.search).toBe("?plataformas=d");
    expect(screen.getAllByText("próximamente").length).toBeGreaterThan(0);
  });

  it("«Desplegar todo» despliega en las dos vistas y el mismo botón contrae", () => {
    const { container } = render(<Lado {...props()} />);
    const [ancho, telefono] = screen.getAllByRole("button", { name: /Desplegar todo/ });
    act(() => fireEvent.click(ancho!));
    expect(container.querySelector("#lienzo-lado")!.hasAttribute("data-todo")).toBe(true);
    expect(telefono!.getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelectorAll("#lado-angosto details[open]")).toHaveLength(2);
    expect(ancho!.textContent).toContain("Contraer todo");
    act(() => fireEvent.click(telefono!));
    expect(container.querySelector("#lienzo-lado")!.hasAttribute("data-todo")).toBe(false);
    expect(container.querySelectorAll("#lado-angosto details[open]")).toHaveLength(0);
  });

  it("en el teléfono, una banda a la vez: la pestaña muestra la suya", () => {
    const { container } = render(<Lado {...props()} />);
    const visible = () => [...container.querySelectorAll<HTMLElement>(".lado-banda")].filter((s) => !s.hidden).map((s) => s.dataset.banda);
    expect(visible()).toEqual(["x"]);
    act(() => fireEvent.click(screen.getAllByRole("button", { name: /02/ }).find((b) => b.closest(".lado-angosto"))!));
    expect(visible()).toEqual(["y"]);
  });
});
