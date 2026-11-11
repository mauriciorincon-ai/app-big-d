// @vitest-environment node
// S7-M5: el estado aprobado nunca corría en la CI (el perfil y el plan reales siguen en borrador). El job `quality` corre ahora
// la suite sobre una copia aprobada fuera del repo; esta prueba (1) exige que ese paso exista y (2), en esa corrida
// (BIGD_ESPERA_APROBADO=1), que la base cargada esté de verdad aprobada: si la copia saliera en borrador, el paso sería decorado.
// Demo en rojo: `BIGD_ESPERA_APROBADO=1 pnpm exec vitest run tests/unit/estado-aprobado-en-ci.test.ts` con el dato real falla.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";

const RAIZ = join(__dirname, "..", "..");

describe("el estado aprobado corre en la CI (S7-M5)", () => {
  it("el job quality corre la suite sobre la copia aprobada, con la espera encendida", () => {
    const ci = readFileSync(join(RAIZ, ".github/workflows/ci.yml"), "utf8");
    expect(ci).toMatch(/copia-aprobada\.mjs/);
    expect(ci).toMatch(/BIGD_DATOS="\$COPIA\/data" pnpm exec vitest run/);
    expect(ci).toMatch(/BIGD_ESPERA_APROBADO: "1"/);
  });

  it.runIf(process.env.BIGD_ESPERA_APROBADO === "1")("en esa corrida, el perfil y el plan cargados están aprobados", () => {
    const k = cargarConocimiento();
    expect(k.casos.length).toBeGreaterThan(0);
    for (const c of k.casos) expect(c.estado_aprobacion, `perfil ${c.id}`).toBe("aprobado");
    for (const p of k.planes) expect(p.estado_aprobacion, `plan ${p.caso_id}`).toBe("aprobado");
  });
});
