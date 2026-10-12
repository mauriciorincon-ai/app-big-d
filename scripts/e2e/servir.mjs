// El servidor de las pruebas e2e (S7, D-S7-03): UN solo webServer de Playwright que construye los dos sitios EN SECUENCIA y
// después sirve los dos. Con dos webServers, Playwright los arranca a la vez y los dos builds escribían `.next/` y `out/` al
// mismo tiempo: una caché dañada («ModuleGraph… canceled») dejó el e2e en rojo en local (S6). Aquí no hay dos builds en vuelo.
//   1. la base sembrada → out-sembrada/   (scripts/datos/construir-sembrada.mjs)
//   2. el dato real     → out/            (pnpm build, con BIGD_DATOS si se pasó, p. ej. la copia aprobada del ensayo)
//   3. se sirve out-sembrada/ en E2E_SEMBRADA_PUERTO y, cuando ya responde, out/ en E2E_PUERTO: Playwright espera ESTE último.
// Uso: node scripts/e2e/servir.mjs   (lo lanza playwright.config.ts; no hay que correrlo a mano)
import { spawn, spawnSync } from "node:child_process";
import { RAIZ_REPO } from "../lib/cargar-ts.mjs";

const PUERTO = process.env.E2E_PUERTO ?? "3000";
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

console.log("servir: 1/3 construyendo la base sembrada");
correr("node", ["scripts/datos/construir-sembrada.mjs"]);
console.log("servir: 2/3 construyendo el dato real");
correr("pnpm", ["build"]);

console.log(`servir: 3/3 sirviendo out-sembrada/ en :${SEMBRADA} y out/ en :${PUERTO}`);
const hijos = [
  spawn("pnpm", ["exec", "serve", "out-sembrada", "-l", SEMBRADA, "--config", "../serve.json"], { cwd: RAIZ_REPO, stdio: "inherit" }),
];
await esperar(`http://localhost:${SEMBRADA}`);
hijos.push(spawn("pnpm", ["start"], { cwd: RAIZ_REPO, stdio: "inherit", env: { ...process.env, PORT: PUERTO } }));

// Si uno de los dos servidores muere, esto también: Playwright no debe seguir contra medio sitio. Y al cerrar, nadie se queda.
const cerrar = (codigo) => {
  for (const h of hijos) if (!h.killed) h.kill("SIGTERM");
  process.exit(codigo);
};
for (const h of hijos) h.on("exit", (codigo) => cerrar(codigo ?? 1));
for (const s of ["SIGINT", "SIGTERM"]) process.on(s, () => cerrar(0));
