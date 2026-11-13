import { defineConfig, devices } from "@playwright/test";

// G1 del diagramador en los tres motores (D-S1-12): sin servidor ni rutas publicadas, solo una página en
// blanco con el motor empaquetado. La corre el job `diagramador` de la CI en ubuntu-latest y macos-latest.
// S10 (F2): y la demo pública, servida bajo su basePath (/piezas/big-d/) por scripts/demo/servir.mjs, que primero la
// construye: el Worker de la demo da en los tres motores la huella que dio Node en el build (regla dura 1).
const DEMO = process.env.E2E_DEMO_PUERTO ?? "3401";
export default defineConfig({
  testDir: "tests/determinismo",
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  webServer: {
    command: "node scripts/demo/servir.mjs",
    url: `http://127.0.0.1:${DEMO}/piezas/big-d/es.html`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
