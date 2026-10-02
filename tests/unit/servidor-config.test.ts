// @vitest-environment node
// Lo que sirve el sitio (vercel.json en los deploys, serve.json en `pnpm start`): las mismas cabeceras de
// seguridad en los dos (B-24 de la auditoría del S1). La CSP del producto va en un <meta> por página, con las
// huellas de ese build (scripts/csp/inyectar.mjs, D-S2-05); la maqueta, sin scripts en línea, la lleva por
// cabecera, la misma en los dos. El bot de Vercel ya no se silencia aquí: `github.silent` dejó de existir en
// 2023 y la opción vive en la configuración Git del proyecto (lo apagó la persona; se verifica en cada PR).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const leer = (f: string) => JSON.parse(readFileSync(f, "utf8"));
const vercel = leer("vercel.json");
const serve = leer("serve.json");
const CABECERAS = ["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"];

const deTodo = (bloques: { source: string; headers: { key: string; value: string }[] }[], todo: string) =>
  Object.fromEntries((bloques ?? []).filter((b) => b.source === todo).flatMap((b) => b.headers.map((h) => [h.key, h.value])));

describe("configuración del servidor", () => {
  it("sin la opción muerta `github.silent` (D-S2-11): no aparenta silenciar lo que no silencia", () => {
    expect(vercel.github).toBeUndefined();
  });
  it("la maqueta lleva la misma CSP de cabecera en los dos, sin scripts en línea ni `unsafe-eval`", () => {
    const enVercel = deTodo(vercel.headers, "/diseno/(.*)");
    expect(enVercel).toEqual(deTodo(serve.headers, "diseno/**"));
    expect(Object.keys(enVercel)).toEqual(["Content-Security-Policy"]);
    expect(enVercel["Content-Security-Policy"]).toMatch(/script-src 'self';/);
    expect(enVercel["Content-Security-Policy"]).not.toMatch(/unsafe-eval|script-src[^;]*unsafe-inline/);
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
