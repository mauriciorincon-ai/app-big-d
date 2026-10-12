import { defineConfig, devices } from "@playwright/test";

// Config que el ci.yml del kit ya asume (job e2e: "pnpm test:e2e").
// Patrón validado en app-nutri-kids S1. Móvil primero: las apps del pipeline son mobile-first.
// Puerto configurable (E2E_PUERTO) para correr en local cuando :3000 está ocupado por otra app;
// en CI no se define y queda 3000, el mismo de Lighthouse.
const PUERTO = process.env.E2E_PUERTO ?? "3000";
// La base sembrada (D-S3-14): el mismo sitio construido con la base ficticia completa, servido al lado. Ejercita los
// estados que el dato real aún no tiene (la comparación entera, la robustez en el Worker, los filtros de la base).
const SEMBRADA = process.env.E2E_SEMBRADA_PUERTO ?? String(Number(PUERTO) + 1);
const SOLO_SEMBRADA = /sembrada\//;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // En CI, los dos reporters: "github" anota los fallos en el PR (y SÍ imprime `N flaky`,
  // verificado); "list" añade lo que github NO da — el avance prueba por prueba, con su
  // duración. Sin él, el log salta de "Running N tests" al resumen y no se ve cuál se quedó
  // colgada: es lo que vuelve legible un timeout (kit v1.15.1, demo en rojo de Velo S3, que
  // de paso desmintió la razón original del cambio — ver CHANGELOG).
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PUERTO}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
      testIgnore: SOLO_SEMBRADA,
    },
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
      // G11 es de teléfono: la spec fija 380 px y ya corre en mobile-chromium.
      testIgnore: [/g11\.spec\.ts/, SOLO_SEMBRADA],
    },
    // La base sembrada: sus pruebas fijan su propio ancho (1280 o 380) y su tema.
    {
      name: "sembrada",
      use: { ...devices["Desktop Chrome"], baseURL: `http://localhost:${SEMBRADA}` },
      testMatch: SOLO_SEMBRADA,
    },
    // G11 en los otros dos motores (DoD del S1: «e2e G11 a 380 px en tres navegadores»). Solo esa spec: el
    // resto del suite es de comportamiento y no cambia de motor a motor. La CI instala los tres navegadores.
    {
      name: "g11-firefox",
      use: { ...devices["Desktop Firefox"] },
      testMatch: /(g11|csp)\.spec\.ts/,
      testIgnore: SOLO_SEMBRADA,
    },
    {
      name: "g11-webkit",
      use: { ...devices["Desktop Safari"] },
      testMatch: /(g11|csp)\.spec\.ts/,
      testIgnore: SOLO_SEMBRADA,
    },
  ],
  // UN solo webServer (S7, D-S7-03). Playwright arranca los de un arreglo a la vez, y los dos builds (la base sembrada y el dato
  // real) escribían `.next/` y `out/` al mismo tiempo: en local dejaban una caché dañada («ModuleGraph… canceled»). El script
  // construye la sembrada, luego el dato real, y sirve los dos; Playwright espera al del dato real, que se levanta al final.
  // SIEMPRE contra el BUILD, nunca contra el dev server (kit v1.12.0 — lección Velo S1): el dev server mete en la página cosas
  // que NO existen en producción (websocket de HMR, `eval()` de React dev) y produce rojos sobre un árbol limpio.
  webServer: {
    command: "node scripts/e2e/servir.mjs",
    url: `http://localhost:${PUERTO}`,
    // Sin reuso: un `pnpm dev` olvidado en :3000 secuestraría el suite entero en silencio.
    reuseExistingServer: false,
    // Dos builds uno tras otro.
    timeout: 600_000,
  },
});
