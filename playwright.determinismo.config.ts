import { defineConfig, devices } from "@playwright/test";

// G1 del diagramador en los tres motores (D-S1-12): sin servidor ni rutas publicadas, solo una página en
// blanco con el motor empaquetado. La corre el job `diagramador` de la CI en ubuntu-latest y macos-latest.
export default defineConfig({
  testDir: "tests/determinismo",
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
