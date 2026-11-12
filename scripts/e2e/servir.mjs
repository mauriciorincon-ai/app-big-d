// El servidor de las pruebas e2e (S7, D-S7-03): UN solo webServer de Playwright que construye los dos sitios EN SECUENCIA y
// después sirve los dos. Con dos webServers, Playwright los arranca a la vez y los dos builds escribían `.next/` y `out/` al
// mismo tiempo: una caché dañada («ModuleGraph… canceled») dejó el e2e en rojo en local (S6). Aquí no hay dos builds en vuelo.
//   1. la base sembrada → out-sembrada/   (scripts/datos/construir-sembrada.mjs)
//   2. el dato real     → out/            (pnpm build, con BIGD_DATOS si se pasó, p. ej. la copia aprobada del ensayo)
//   3. se sirve out-sembrada/ en E2E_SEMBRADA_PUERTO y, cuando ya responde, out/ en E2E_PUERTO: Playwright espera ESTE último.
// Uso: node scripts/e2e/servir.mjs   (lo lanza playwright.config.ts; no hay que correrlo a mano)
import { spawn, spawnSync } from "node:child_process";
import { RAIZ_REPO } from "../lib/cargar-ts.mjs";
import { orquestar } from "./orquestar.mjs";

const PUERTO = process.env.E2E_PUERTO ?? "3400";
const SEMBRADA = process.env.E2E_SEMBRADA_PUERTO ?? String(Number(PUERTO) + 1);

/** Corre un comando hasta el final; si falla, esto también (Playwright lo muestra como el webServer que no arrancó). */
function correr(comando, args) {
  const r = spawnSync(comando, args, { cwd: RAIZ_REPO, stdio: "inherit", env: process.env });
  if (r.status !== 0) {
    console.error(`servir: «${comando} ${args.join(" ")}» salió con ${r.status ?? r.signal}`);
    process.exit(r.status ?? 1);
  }
}

async function esperar(url, ms = 60_000) {
  const limite = Date.now() + ms;
  while (Date.now() < limite) {
    try {
      const r = await fetch(url, { redirect: "manual" });
      if (r.status < 500) return;
    } catch {
      /* todavía no responde */
    }
    await new Promise((ok) => setTimeout(ok, 250));
  }
  throw new Error(`servir: ${url} no respondió en ${ms / 1000} s`);
}

console.log(`servir: construyendo la sembrada y el dato real, y sirviendo out-sembrada/ en :${SEMBRADA} y out/ en :${PUERTO}`);
const lanzar = (nombre) =>
  nombre === "sembrada"
    ? spawn("pnpm", ["exec", "serve", "out-sembrada", "-l", `tcp://127.0.0.1:${SEMBRADA}`, "--config", "../serve.json"], { cwd: RAIZ_REPO, stdio: "inherit" })
    : spawn("pnpm", ["start"], { cwd: RAIZ_REPO, stdio: "inherit", env: { ...process.env, PORT: PUERTO } });

await orquestar({
  correr,
  lanzar,
  esperar,
  salir: (codigo) => process.exit(codigo),
  proceso: process,
  urls: { sembrada: `http://127.0.0.1:${SEMBRADA}`, real: `http://127.0.0.1:${PUERTO}` },
});
