import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// SMOKE del kit (v1.28.0): la única razón de este archivo es que el job `e2e` PUEDA FALLAR
// desde el commit inicial. `test:e2e` ya no lleva `--pass-with-no-tests`: un job que pasa con
// cero pruebas descubiertas no es un gate (Angel Ghost S1: cuatro fases con e2e «verde» y
// ninguna prueba). Si este smoke se pone rojo en el estampado, el gate está funcionando.
// El S1 lo conserva (es la regresión de «la app arranca y es accesible») y añade los suyos.
test("la app arranca y su raíz no tiene violaciones serias de accesibilidad", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
  const scan = await new AxeBuilder({ page }).analyze();
  const serias = scan.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  expect(serias, JSON.stringify(serias.map((v) => v.id))).toEqual([]);
});

// B-24 de la auditoría del S1: el servidor de `pnpm start` manda las cabeceras de seguridad de serve.json (las
// mismas de vercel.json; tests/unit/servidor-config.test.ts lo compara), en una página y en un recurso.
test("el servidor manda las cabeceras de seguridad", async ({ request }) => {
  for (const ruta of ["/es", "/diseno/assets/tokens.css"]) {
    const r = await request.get(ruta);
    expect(r.status(), ruta).toBe(200);
    expect(r.headers()["x-content-type-options"], ruta).toBe("nosniff");
    expect(r.headers()["x-frame-options"], ruta).toBe("DENY");
    expect(r.headers()["referrer-policy"], ruta).toBe("strict-origin-when-cross-origin");
    expect(r.headers()["permissions-policy"], ruta).toContain("camera=()");
  }
});
