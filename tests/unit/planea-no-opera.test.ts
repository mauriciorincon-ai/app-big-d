import { describe, expect, it } from "vitest";
import { archivosDeCodigo, leer } from "./lib/codigo";

// Regla dura «planea, gestiona y controla; jamás opera una plataforma» + «cero IA en runtime»: el
// código de la app y del diagramador no nombra dominios de plataformas de datos ni de proveedores de
// modelos, y no abre red. ESLint prohíbe además sus SDK (`no-restricted-imports`). La única IA es la
// skill /investigar, que vive en .claude/ y scripts/, fuera del producto.
//
// Excepción declarada: la observabilidad del kit (Sentry client-only, inerte sin DSN) usa su SDK; no
// hay un `fetch` escrito en el código.
const ALCANCE = ["src", "packages/diagramador/src", "instrumentation-client.ts"];

const DOMINIOS = [
  "azuredatabricks.net", "cloud.databricks.com", "gcp.databricks.com", "snowflakecomputing.com",
  "fabric.microsoft.com", "analysis.windows.net", "powerbi.com", "login.microsoftonline.com",
  "api.anthropic.com", "api.openai.com", "openai.azure.com", "generativelanguage.googleapis.com",
  "aiplatform.googleapis.com", "api.groq.com", "api.mistral.ai", "api.cohere.com", "api.cohere.ai",
];
const RED = [/\bfetch\s*\(/, /\bXMLHttpRequest\b/, /\bnew\s+WebSocket\b/, /\bEventSource\b/, /\bsendBeacon\b/];

describe("planea, no opera — y cero IA en runtime", () => {
  const archivos = ALCANCE.flatMap((r) => archivosDeCodigo(r));

  it("revisa código real (el gate puede fallar)", () => {
    expect(archivos.length).toBeGreaterThan(5);
  });

  it("ningún dominio de plataformas de datos ni de proveedores de modelos", () => {
    const hallazgos = archivos.flatMap((a) => DOMINIOS.filter((d) => leer(a).includes(d)).map((d) => `${a}: ${d}`));
    expect(hallazgos).toEqual([]);
  });

  it("ninguna llamada de red escrita en el código", () => {
    const hallazgos = archivos.flatMap((a) => RED.filter((re) => re.test(leer(a))).map((re) => `${a}: ${re.source}`));
    expect(hallazgos).toEqual([]);
  });
});
