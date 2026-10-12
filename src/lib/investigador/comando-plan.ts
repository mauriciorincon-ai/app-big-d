// La aprobación del PLAN del caso (S5, D-S5-09) es humana y mecánica, igual que la del perfil: la pantalla de decisiones
// solo ARMA el comando; una persona lo corre en su terminal. Puro y sin dependencias (lo importa un componente del
// servidor y el script): nada de Zod aquí. Lo que escribe el comando vive en aprobar-plan.ts.

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HEX64 = /^[0-9a-f]{64}$/;

/**
 * El comando exacto que la persona corre. `desde` es la huella del plan en borrador sobre el que se armó: si el plan cambia
 * antes de que lo corra, el comando se niega (no aprueba lo que la persona no vio). El comando no lleva decisiones: la
 * persona aprueba el plan entero, tal como lo vio en la pantalla.
 */
export function comandoAprobarPlan(caso: string, desde: string): string {
  if (!ID.test(caso))
    throw new Error(`id de caso con caracteres no permitidos: «${caso}»`);
  if (!HEX64.test(desde))
    throw new Error("la huella del plan no es un SHA-256 en hexadecimal");
  return `node scripts/aprobar.mjs --plan ${caso} --desde ${desde}`;
}

/** Lo que leyó el script del comando: el caso y el plan de origen. */
export interface AprobacionDePlan {
  caso: string;
  desde: string;
}

/** Lee lo que armó `comandoAprobarPlan`. No valida contra el plan (eso lo hace `aprobarPlan`), solo la forma. */
export function leerAprobacionPlan(args: readonly string[]): AprobacionDePlan {
  const valor = (bandera: string): string => {
    const i = args.indexOf(bandera);
    const v = args[i + 1];
    if (i < 0 || !v || v.startsWith("--"))
      throw new Error(`falta ${bandera} <…>`);
    return v;
  };
  const caso = valor("--plan");
  const desde = valor("--desde");
  if (!ID.test(caso))
    throw new Error(`id de caso con caracteres no permitidos: «${caso}»`);
  if (!HEX64.test(desde))
    throw new Error("--desde no es un SHA-256 en hexadecimal");
  return { caso, desde };
}
