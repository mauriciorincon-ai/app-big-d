// Controlador del recorrido (§ 4.3, G12): cambia UN atributo del contenedor (`data-paso`). B-1 de la auditoría
// del S1: en los extremos, «Anterior» y «Siguiente» quedan `aria-disabled` y conservan el foco (con `disabled`
// caía al body). B-2: Enter sobre un componente del recorrido lleva a su paso, como el clic.
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ControlRecorrido } from "@/components/atlas/ControlRecorrido";
import type { PasoPanel } from "@/lib/atlas";

const T = { controles: "Controles", anterior: "Anterior", siguiente: "Siguiente", reproducir: "Reproducir", pausar: "Pausar", verTodos: "Ver todos", todos: "Todos los pasos", pasoDe: "Paso {n} de {total}", pasos: "Pasos" };
const PASOS: PasoPanel[] = [
  { id: "p1", numero: "1", que: "Entra", nodo: "Origen", lider: "l1", experto: "e1" },
  { id: "p2", numero: "2", que: "Se guarda", nodo: "Almacén", lider: "l2", experto: "e2", rama: "Se divide en 3a y 3b." },
];

function montar() {
  const r = render(
    <ControlRecorrido pasos={PASOS} t={T}>
      <div className="lienzo">
        <g className="dg-nodo" data-paso="p2" tabIndex={0}>
          Almacén
        </g>
      </div>
    </ControlRecorrido>,
  );
  return { ...r, rec: r.container.querySelector<HTMLElement>("#rec")! };
}

describe("ControlRecorrido", () => {
  let reducir = false;
  beforeEach(() => {
    reducir = false;
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduced-motion") ? reducir : false, media: q, addEventListener() {}, removeEventListener() {} }));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("empieza en «todos»; Siguiente avanza y el texto vivo dice el paso", () => {
    const { rec } = montar();
    expect(rec.dataset.paso).toBe("todos");
    expect(screen.getByText("Todos los pasos")).toBeInTheDocument();
    act(() => screen.getByRole("button", { name: "Siguiente" }).click());
    expect(rec.dataset.paso).toBe("p1");
    expect(screen.getByText("Paso 1 de 2")).toBeInTheDocument();
    expect(rec.querySelector('[data-paso-panel="p1"]')!.getAttribute("aria-current")).toBe("step");
    expect(screen.getByText("Se divide en 3a y 3b.")).toBeInTheDocument();
  });

  it("B-1: en los extremos los botones quedan aria-disabled, no hacen nada y conservan el foco", () => {
    const { rec } = montar();
    const anterior = screen.getByRole("button", { name: "Anterior" });
    const siguiente = screen.getByRole("button", { name: "Siguiente" });
    expect(anterior.getAttribute("aria-disabled")).toBe("true");
    expect(anterior.hasAttribute("disabled")).toBe(false);
    siguiente.focus();
    act(() => siguiente.click());
    act(() => siguiente.click());
    expect(rec.dataset.paso).toBe("p2");
    expect(siguiente.getAttribute("aria-disabled")).toBe("true");
    expect(siguiente).toHaveFocus();
    act(() => siguiente.click());
    expect(rec.dataset.paso).toBe("p2");
    act(() => screen.getByRole("button", { name: "Ver todos" }).click());
    expect(rec.dataset.paso).toBe("todos");
    anterior.focus();
    act(() => anterior.click());
    expect(rec.dataset.paso).toBe("todos");
    expect(anterior).toHaveFocus();
  });

  it("B-2: Enter o Espacio sobre un componente del recorrido llevan a su paso; el clic también", () => {
    const { rec } = montar();
    const nodo = rec.querySelector<HTMLElement>(".dg-nodo")!;
    act(() => {
      fireEvent.keyDown(nodo, { key: "Enter" });
    });
    expect(rec.dataset.paso).toBe("p2");
    act(() => screen.getByRole("button", { name: "Ver todos" }).click());
    act(() => {
      fireEvent.keyDown(nodo, { key: " " });
    });
    expect(rec.dataset.paso).toBe("p2");
    act(() => screen.getByRole("button", { name: "Ver todos" }).click());
    act(() => nodo.click());
    expect(rec.dataset.paso).toBe("p2");
  });

  it("las flechas fuera del lienzo mueven el paso; dentro del lienzo no (el lienzo las usa para deslizar)", () => {
    const { rec } = montar();
    act(() => {
      fireEvent.keyDown(document.body, { key: "ArrowRight" });
    });
    expect(rec.dataset.paso).toBe("p1");
    act(() => {
      fireEvent.keyDown(document.body, { key: "ArrowLeft" });
    });
    expect(rec.dataset.paso).toBe("todos");
    act(() => {
      fireEvent.keyDown(rec.querySelector(".lienzo")!, { key: "ArrowRight" });
    });
    expect(rec.dataset.paso).toBe("todos");
    act(() => {
      fireEvent.keyDown(document.body, { key: "ArrowRight", shiftKey: true });
    });
    expect(rec.dataset.paso).toBe("todos");
  });

  it("Reproducir avanza cada 2 s hasta el final y se detiene; con movimiento reducido no hace nada", async () => {
    const { rec } = montar();
    const boton = screen.getByRole("button", { name: "Reproducir" });
    act(() => boton.click());
    expect(rec.dataset.paso).toBe("p1");
    expect(rec.hasAttribute("data-animando")).toBe(true);
    expect(screen.getByRole("button", { name: "Pausar" }).getAttribute("aria-pressed")).toBe("true");
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(rec.dataset.paso).toBe("p2");
    // En el último paso, el reloj se detiene en una microtarea: `act` asíncrono la deja correr.
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(rec.dataset.paso).toBe("p2");
    expect(rec.hasAttribute("data-animando")).toBe(false);
    reducir = true;
    act(() => screen.getByRole("button", { name: "Ver todos" }).click());
    act(() => screen.getByRole("button", { name: "Reproducir" }).click());
    expect(rec.dataset.paso).toBe("todos");
  });
});
