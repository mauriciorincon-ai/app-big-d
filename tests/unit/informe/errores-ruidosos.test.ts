// @vitest-environment node
// S7-M3: los dos `throw` del informe (un ítem de la hoja sin origen en el plan; un riesgo del resumen que el plan calculado no
// trae) existían sin una prueba que los pusiera en rojo. Aquí cada uno falla a propósito, con su mensaje: el rojo se demuestra,
// no se supone.
import { describe, expect, it, vi } from "vitest";

vi.mock("@/engine", async (original) => ({
  ...(await original<typeof import("@/engine")>()),
  // El estado que el plan real nunca produce: un ítem de la hoja cuyo origen no existe en el plan.
  origenesHuerfanos: () => ["T-99", "V-98"],
}));

import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";
import { construirInforme } from "@/lib/informe/construir";

describe("construirInforme · sin origen no hay ítem (regla dura 9)", () => {
  it("falla nombrando cada ítem huérfano, en cada construcción", () => {
    const k = cargarConocimiento();
    expect(() => construirInforme(k, k.casos[0]!, k.planes[0]!)).toThrow(
      /informe · hoja de ruta · ítems sin un origen que exista en el plan: T-99, V-98/,
    );
  });
});
