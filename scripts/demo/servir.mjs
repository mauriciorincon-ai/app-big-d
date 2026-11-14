// S10 (F2): sirve el paquete de la demo BAJO SU basePath (`/piezas/big-d/`), como lo servirá CV Viva, para el e2e de
// tests/determinismo/demo.spec.ts (Chromium, Firefox y WebKit). Primero lo construye (scripts/demo/construir.mjs). Escucha en
// 127.0.0.1 y en el 3401 de Big-D (el job `diagramador` no levanta la base sembrada); E2E_DEMO_PUERTO por si está ocupado.
// Fuera de `/piezas/big-d/` todo es 404: una ruta absoluta que se escape del basePath falla en el e2e.
// Uso: node scripts/demo/servir.mjs   (lo lanza playwright.determinismo.config.ts; Playwright lo cierra)
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { RAIZ_REPO } from "../lib/cargar-ts.mjs";

const BASE = "/piezas/big-d/";
const PUERTO = Number(process.env.E2E_DEMO_PUERTO ?? 3401);
const DIR = join(RAIZ_REPO, "out-demo");
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8" };

const r = spawnSync(process.execPath, [join(RAIZ_REPO, "scripts/demo/construir.mjs")], { cwd: RAIZ_REPO, stdio: "inherit" });
if (r.status !== 0) process.exit(r.status ?? 1);

createServer((req, res) => {
  const ruta = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
  const rel = ruta.startsWith(BASE) ? normalize(ruta.slice(BASE.length)) : null;
  const archivo = rel && !rel.startsWith("..") ? join(DIR, rel) : null;
  if (!archivo || !existsSync(archivo) || !statSync(archivo).isFile()) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("404");
    return;
  }
  res.writeHead(200, { "content-type": TIPOS[extname(archivo)] ?? "application/octet-stream" }).end(readFileSync(archivo));
}).listen(PUERTO, "127.0.0.1", () => console.log(`demo: out-demo/ en http://127.0.0.1:${PUERTO}${BASE}`));
