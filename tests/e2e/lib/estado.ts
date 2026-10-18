// El estado de aprobación del dato REAL, leído del YAML que sirve el sitio (S7, D-S7-02): las specs del dato real siguen a las
// aprobaciones en lugar de suponer un borrador, así que al aprobar el perfil y el plan la CI no se pone en rojo. Si el sitio se
// construyó con BIGD_DATOS (el ensayo en una copia aprobada), se lee de ahí, como el build.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const DATOS = process.env.BIGD_DATOS ?? "data";
const aprobado = (ruta: string) =>
  /^estado_aprobacion: aprobado$/m.test(readFileSync(join(DATOS, ruta), "utf8"));

export const PERFIL_APROBADO = aprobado("casos/hospital-futuro.yaml");
export const PLAN_APROBADO = aprobado("casos/hospital-futuro/plan/plan.yaml");
