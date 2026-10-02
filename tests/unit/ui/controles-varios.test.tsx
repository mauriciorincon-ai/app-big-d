// El resto de los controles del cliente (M-14 de la auditoría del S1: el piso «UI > 50 %» no se medía):
// el lienzo (desborde, sombras, índice de capas), el campo «Plataforma» (M-11: la nota que avisa antes del
// cambio de página, enlazada como descripción) y el conmutador de tema.
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CampoPlataforma } from "@/components/atlas/CampoPlataforma";
import { ControlLienzo } from "@/components/atlas/ControlLienzo";
import { ConmutadorTema } from "@/components/ConmutadorTema";
import { CLAVE_TEMA } from "@/components/scriptTema";

const empujar = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: empujar }) }));

describe("ControlLienzo", () => {
  let observado: (() => void) | undefined;
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(f: () => void) {
          observado = f;
        }
        observe() {}
        disconnect() {}
      },
    );
    document.body.innerHTML = `<section id="mapa"><nav class="indice"><button data-col="a" data-x="8">01</button><button data-col="b" data-x="400">02</button><button data-col="c" data-x="800">03</button></nav><div class="lienzo-marco"><div class="lienzo"></div></div></section>`;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });
  const medidas = (lienzo: HTMLElement, scroll: number, cliente: number) => {
    Object.defineProperty(lienzo, "scrollWidth", { configurable: true, value: scroll });
    Object.defineProperty(lienzo, "clientWidth", { configurable: true, value: cliente });
  };

  it("marca el desborde, las sombras y la capa vigente; el índice desliza el lienzo", () => {
    const raiz = document.getElementById("mapa")!;
    const lienzo = raiz.querySelector<HTMLElement>(".lienzo")!;
    const marco = raiz.querySelector<HTMLElement>(".lienzo-marco")!;
    medidas(lienzo, 1200, 380);
    render(<ControlLienzo mapa="mapa" />);
    expect(raiz.hasAttribute("data-desborda")).toBe(true);
    expect(marco.hasAttribute("data-mas-izq")).toBe(false);
    expect(marco.hasAttribute("data-mas-der")).toBe(true);
    expect(raiz.querySelector('[data-col="a"]')!.getAttribute("aria-current")).toBe("true");
    act(() => (raiz.querySelector<HTMLElement>('[data-col="b"]')!).click());
    expect(lienzo.scrollLeft).toBe(392);
    expect(marco.hasAttribute("data-mas-izq")).toBe(true);
    expect(raiz.querySelector('[data-col="b"]')!.getAttribute("aria-current")).toBe("true");
    // Al final del desplazamiento, la última capa es la vigente aunque no llegue al borde izquierdo.
    lienzo.scrollLeft = 820;
    act(() => {
      fireEvent.scroll(lienzo);
    });
    expect(raiz.querySelector('[data-col="c"]')!.getAttribute("aria-current")).toBe("true");
    expect(marco.hasAttribute("data-mas-der")).toBe(false);
  });

  it("sin desborde no marca nada; al cambiar el tamaño vuelve a medir", () => {
    const raiz = document.getElementById("mapa")!;
    const lienzo = raiz.querySelector<HTMLElement>(".lienzo")!;
    medidas(lienzo, 380, 380);
    render(<ControlLienzo mapa="mapa" />);
    expect(raiz.hasAttribute("data-desborda")).toBe(false);
    medidas(lienzo, 900, 380);
    act(() => observado!());
    expect(raiz.hasAttribute("data-desborda")).toBe(true);
  });

  it("si el mapa no está en la página, no hace nada", () => {
    expect(() => render(<ControlLienzo mapa="otro" />)).not.toThrow();
  });
});

describe("CampoPlataforma", () => {
  const opciones = [
    { id: "fabric", nombre: "Microsoft Fabric", ruta: "/es/atlas/fabric" },
    { id: "otra", nombre: "Otra" },
  ];
  afterEach(() => empujar.mockReset());

  it("M-11: la nota visible describe la lista (avisa antes del cambio de página)", () => {
    render(<CampoPlataforma opciones={opciones} actual="fabric" etiqueta="Plataforma" pronto="pronto" nota="Al elegir otra plataforma se abre su atlas." />);
    const lista = screen.getByRole("combobox", { name: "Plataforma" });
    expect(lista).toHaveAccessibleDescription("Al elegir otra plataforma se abre su atlas.");
    expect(screen.getByText("Al elegir otra plataforma se abre su atlas.")).toBeVisible();
  });

  it("las que no tienen mapa dicen «pronto» y no se eligen; elegir una con mapa abre su ruta", () => {
    render(<CampoPlataforma opciones={opciones} etiqueta="Plataforma" pronto="pronto" elegir="Elige una plataforma" nota="n" />);
    const otra = screen.getByRole("option", { name: "Otra — pronto" }) as HTMLOptionElement;
    expect(otra.disabled).toBe(true);
    expect((screen.getByRole("option", { name: "Elige una plataforma" }) as HTMLOptionElement).disabled).toBe(true);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "otra" } });
    expect(empujar).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "fabric" } });
    expect(empujar).toHaveBeenCalledWith("/es/atlas/fabric");
  });
});

describe("ConmutadorTema", () => {
  let claro = false;
  beforeEach(() => {
    claro = false;
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("light") ? claro : false, media: q, addEventListener() {}, removeEventListener() {} }));
    document.documentElement.removeAttribute("data-theme");
    localStorage.clear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("marca el tema del sistema si no hay elección; elegir cambia el atributo y lo guarda", async () => {
    claro = true;
    render(<ConmutadorTema etiqueta="Tema" oscuro="Oscuro" claro="Claro" />);
    expect(screen.getByRole("button", { name: "Claro" }).getAttribute("aria-pressed")).toBe("true");
    await act(async () => screen.getByRole("button", { name: "Oscuro" }).click());
    expect(document.documentElement.getAttribute("data-theme")).toBe("oscuro");
    expect(localStorage.getItem(CLAVE_TEMA)).toBe("oscuro");
    expect(screen.getByRole("button", { name: "Oscuro" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("sin almacenamiento (ventana privada) el tema igual cambia", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("sin almacenamiento");
    });
    render(<ConmutadorTema etiqueta="Tema" oscuro="Oscuro" claro="Claro" />);
    act(() => screen.getByRole("button", { name: "Claro" }).click());
    expect(document.documentElement.getAttribute("data-theme")).toBe("claro");
    vi.restoreAllMocks();
  });
});
