// Ensayo de la aprobación en una COPIA (S7, D-S7-02). Copia `data/` a una carpeta temporal FUERA del repo y deja en la copia el
// perfil y el plan del caso como si una persona los hubiera aprobado, para correr contra ella lo que el repo no puede probar
// mientras estén en borrador:
//
//      BIGD_DATOS=<copia>/data pnpm test        la suite entera sobre la base aprobada
//      BIGD_DATOS=<copia>/data pnpm build       el sitio con la comparación puntuada y el informe en «final»
//
// Es un ensayo, NO una aprobación: aprueba con la LIBRERÍA (`aprobarCaso` y `aprobarPlan` de src/lib/investigador/, con las
// decisiones por defecto de la pantalla) y escribe con el mismo código que el script de aprobación (`escribir-aprobado.mjs`),
// pero jamás corre ese script, no toca el repo y se niega a escribir dentro de él. La aprobación de verdad la hace una persona,
// desde la pantalla, en su terminal (regla dura 2).
//
// Uso: node scripts/datos/copia-aprobada.mjs [--destino <carpeta fuera del repo>] [--fecha AAAA-MM-DD] [--solo perfil|plan]
// Salida: la ruta de la copia (última línea de stdout).
import { cpSync, mkdtempSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { cargarTs, RAIZ_REPO } from "../lib/cargar-ts.mjs";
import { escribirCaso, escribirPlan } from "../lib/escribir-aprobado.mjs";

const PROCEDENCIA = "scripts/datos/copia-aprobada.mjs (ENSAYO en una copia, no es una aprobación)";

const arg = (nombre) => {
  const i = process.argv.indexOf(nombre);
  return i > 0 ? process.argv[i + 1] : undefined;
};

/** ¿Está `ruta` dentro del repo (o es el repo)? Compara rutas reales, para que un enlace simbólico no lo disfrace. */
const dentroDelRepo = (ruta) => {
  const rel = relative(realpathSync(RAIZ_REPO), resolve(ruta));
  return rel === "" || (!rel.startsWith("..") && !rel.startsWith(sep));
};

const fecha = arg("--fecha") ?? "2026-10-12";
if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new Error(`--fecha debe ser AAAA-MM-DD: «${fecha}»`);
const solo = arg("--solo");
if (solo && solo !== "perfil" && solo !== "plan") throw new Error("--solo es «perfil» o «plan»");

const destino = arg("--destino") ? resolve(arg("--destino")) : mkdtempSync(join(tmpdir(), "bigd-copia-aprobada-"));
if (dentroDelRepo(destino)) throw new Error(`la copia no puede estar dentro del repo (${destino}): se escribe fuera para no tocar data/`);
const datos = join(destino, "data");
cpSync(join(RAIZ_REPO, "data"), datos, { recursive: true });

const { cargarConocimiento } = await cargarTs("src/lib/datos/cargar-conocimiento.ts");
const { cargarDatos } = await cargarTs("src/lib/datos/index.ts");
const { huellaCaso, huellaPlan } = await cargarTs("src/lib/datos/instantanea.ts");
const { decisionesPorDefecto } = await cargarTs("src/lib/investigador/comando-caso.ts");
const { aprobarCaso, aprobarPlan } = await cargarTs("src/lib/investigador/index.ts");
const { casosSinAprobacion, planesSinAprobacion } = await cargarTs("src/lib/investigador/aprobados.ts");

const k = cargarConocimiento(datos);
const resumen = [];
for (const caso of k.casos) {
  if (caso.estado_aprobacion !== "borrador" || solo === "plan") continue;
  const { caso: aprobado, revision } = aprobarCaso(caso, huellaCaso(caso), decisionesPorDefecto(caso), fecha);
  escribirCaso(destino, aprobado, revision, huellaCaso(caso), { procedencia: PROCEDENCIA });
  resumen.push(`perfil ${caso.id}`);
}
if (solo !== "perfil") {
  // El plan se aprueba sobre la base ya con el perfil aprobado, como la persona los aprueba (primero el perfil).
  for (const plan of cargarConocimiento(datos).planes) {
    if (plan.estado_aprobacion !== "borrador") continue;
    const { plan: aprobado, revision } = aprobarPlan(plan, huellaPlan(plan), fecha);
    escribirPlan(destino, aprobado, revision, huellaPlan(plan), { procedencia: PROCEDENCIA });
    resumen.push(`plan ${plan.caso_id}`);
  }
}

// Lo mismo que comprueba el script de aprobación sobre su ensayo: la base carga y lo aprobado es lo que se aprobó.
cargarConocimiento(datos);
cargarDatos(datos, RAIZ_REPO);
const fallas = [...casosSinAprobacion(datos), ...planesSinAprobacion(datos)];
if (fallas.length) throw new Error(`la copia no pasa:\n${fallas.join("\n")}`);

console.log(`copia-aprobada: ${resumen.length ? resumen.join(" · ") : "nada que aprobar (ya estaba todo aprobado)"} el ${fecha}`);
console.log(`copia-aprobada: BIGD_DATOS=${datos} pnpm test  ·  BIGD_DATOS=${datos} pnpm build`);
console.log(destino);
