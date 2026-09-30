// @vitest-environment node
// Lo que sirve el sitio (vercel.json en los deploys, serve.json en `pnpm start`): las mismas cabeceras de
// seguridad en los dos (B-24 de la auditoría del S1; la CSP queda como deuda declarada: el export estático
// trae scripts en línea) y el bot de Vercel en silencio (M-12: publicaba el enlace del preview en cada PR de
// un repo público, contra la regla de cero enlaces).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const leer = (f: string) => JSON.parse(readFileSync(f, "utf8"));
const vercel = leer("vercel.json");
const serve = leer("serve.json");
const CABECERAS = ["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"];

const deTodo = (bloques: { source: string; headers: { key: string; value: string }[] }[], todo: string) =>
  Object.fromEntries((bloques ?? []).filter((b) => b.source === todo).flatMap((b) => b.headers.map((h) => [h.key, h.value])));

describe("configuración del servidor", () => {
  it("M-12: el bot de Vercel no comenta en los PR", () => {
    expect(vercel.github?.silent).toBe(true);
  });
  it("B-24: vercel.json y serve.json mandan las mismas cabeceras de seguridad en toda ruta", () => {
    const enVercel = deTodo(vercel.headers, "/(.*)");
    const enServe = deTodo(serve.headers, "**");
    expect(Object.keys(enVercel).sort()).toEqual([...CABECERAS].sort());
    expect(enServe).toEqual(enVercel);
    expect(enVercel["X-Content-Type-Options"]).toBe("nosniff");
    expect(enVercel["X-Frame-Options"]).toBe("DENY");
  });
});
