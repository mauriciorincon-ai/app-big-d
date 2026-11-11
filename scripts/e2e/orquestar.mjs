// La orquestación del servidor del e2e, sin tocar procesos: recibe cómo correr un comando, cómo lanzar un servidor, cómo esperar
// una URL y cómo salir, y por eso se prueba con hijos simulados (S7-B5). `servir.mjs` la cablea con los procesos reales.
//
//   1. construye la base sembrada, luego el dato real (en secuencia: dos builds a la vez dañaban `.next/`, D-S7-03);
//   2. lanza el servidor de la sembrada y espera a que responda;
//   3. lanza el del dato real, que es el que Playwright espera.
//
// S7-B6: el oyente `exit` de cada hijo se registra EN EL MOMENTO de crearlo. Antes se registraban tras `await esperar()` y un
// servidor que moría en esa ventana pasaba inadvertido hasta el timeout. Si un hijo muere, se cierran los demás y se sale con
// su código (Playwright no debe seguir contra medio sitio); `cerrar` es idempotente.
/**
 * @param {object} o
 * @param {(comando: string, args: string[]) => void} o.correr
 * @param {(nombre: "sembrada" | "real") => import("node:events").EventEmitter & { killed?: boolean, kill: (s: string) => void }} o.lanzar
 * @param {(url: string) => Promise<void>} o.esperar
 * @param {(codigo: number) => void} o.salir
 * @param {import("node:events").EventEmitter} o.proceso   donde llegan SIGINT y SIGTERM
 * @param {{ sembrada: string, real: string }} o.urls
 */
export async function orquestar({ correr, lanzar, esperar, salir, proceso, urls }) {
  const hijos = [];
  let cerrando = false;
  const cerrar = (codigo) => {
    if (cerrando) return;
    cerrando = true;
    for (const h of hijos) if (!h.killed) h.kill("SIGTERM");
    salir(codigo);
  };
  const lanzarVigilado = (nombre) => {
    const h = lanzar(nombre);
    hijos.push(h);
    h.on("exit", (codigo) => cerrar(codigo ?? 1));
    return h;
  };
  for (const s of ["SIGINT", "SIGTERM"]) proceso.on(s, () => cerrar(0));

  correr("node", ["scripts/datos/construir-sembrada.mjs"]);
  correr("pnpm", ["build"]);

  lanzarVigilado("sembrada");
  await esperar(urls.sembrada);
  if (cerrando) return; // la sembrada murió mientras se esperaba: no se levanta el otro
  lanzarVigilado("real");
}
