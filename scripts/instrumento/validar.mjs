// El gate de publicación (RF-09.4, S4): valida el instrumento ANTES de construir. `pnpm build` empieza aquí; si la validación no
// pasa, sale ≠ 0 y la cadena se detiene: no hay `next build`, no hay CSP y no queda `out/`. Valida la base que se va a publicar
// (data/ del repo, o la carpeta de la perilla BIGD_DATOS) con los casos de referencia, las propiedades con semilla, los errores
// sembrados («detectados k de n») y la integridad de lo aprobado, y escribe `<datos>/instrumento/validacion.json` (sin horas: la
// misma base, el mismo archivo), que la página /instrumento lee. Uso: node scripts/instrumento/validar.mjs
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { cargarTs, RAIZ_REPO } from "../lib/cargar-ts.mjs";

const t0 = Date.now();
// Una validación que no pasa no deja nada publicable: se borra out/ primero (lo que `serve`, Playwright y Lighthouse sirven).
// .vercel/output no se toca: `vercel build` lo gestiona él mismo y, sin `next build`, jamás se llena. BIGD_SALIDA solo la usan
// las pruebas de este script, para no borrar el out/ del repo.
rmSync(process.env.BIGD_SALIDA ? resolve(process.env.BIGD_SALIDA) : join(RAIZ_REPO, "out"), { recursive: true, force: true });

try {
  const { dirDatos } = await cargarTs("src/lib/datos/dir.ts");
  const { validar } = await cargarTs("src/lib/instrumento/validar.ts");
  const { contar, falladas, publicable, sembradosDetectados } = await cargarTs("src/engine/instrumento.ts");
  const dir = dirDatos(process.env, RAIZ_REPO);
  const v = validar({ dir, raiz: RAIZ_REPO });
  mkdirSync(join(dir, "instrumento"), { recursive: true });
  writeFileSync(join(dir, "instrumento", "validacion.json"), `${JSON.stringify(v, null, 2)}\n`);
  const cuenta = (filas) => {
    const c = contar(filas);
    return `${c.ok}/${c.total}`;
  };
  const s = sembradosDetectados(v);
  console.log(`instrumento: ${cuenta(v.referencias)} referencias · ${cuenta(v.propiedades)} propiedades · detectados ${s.ok} de ${s.total} sembrados · ${cuenta(v.aprobaciones)} aprobaciones · ${Date.now() - t0} ms`);
  if (!publicable(v)) {
    for (const { bloque, fila } of falladas(v)) console.error(`  × ${bloque} · ${fila.id} · ${fila.descripcion.es} — ${fila.detalle.es}`);
    console.error(`instrumento: validación en rojo · detectados ${s.ok} de ${s.total} · no se publica: sin validación en verde no hay out/ (RF-09.4)`);
    process.exit(1);
  }
  console.log("instrumento: validación en verde: se puede publicar");
} catch (e) {
  console.error(`instrumento: no se pudo validar · no se publica: ${e instanceof Error ? e.message : e}`);
  process.exit(1);
}
