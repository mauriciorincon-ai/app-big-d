// La aprobación es humana y mecánica (D-S1-10): la pantalla de revisión, que es estática, solo ARMA el
// comando; la persona lo corre en su terminal. Un hook impide que un agente lo ejecute y el script se niega a
// correr dentro de una sesión de Claude Code (M-15).

/** Carpeta de una propuesta en el comando: nada que una terminal pueda expandir o ejecutar (A-2). */
const CARPETA = /^propuestas\/[A-Za-z0-9][A-Za-z0-9._-]*$/;
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * `retiradas`: los componentes y flujos del mapa aprobado que la propuesta ya no trae. No son afirmaciones:
 * la persona los ve listados y el comando los nombra, y `aprobar` exige que coincidan con el diff (M-21).
 */
export function comandoAprobar(
  carpeta: string,
  aprobadas: readonly string[],
  rechazadas: readonly string[],
  retiradas: readonly string[] = [],
): string {
  if (!CARPETA.test(carpeta))
    throw new Error(
      `carpeta de propuesta con caracteres no permitidos: «${carpeta}»`,
    );
  for (const x of [...aprobadas, ...rechazadas])
    if (!/^A-[1-9]\d*$/.test(x))
      throw new Error(`id de afirmación no permitido: «${x}»`);
  for (const x of retiradas)
    if (!ID.test(x)) throw new Error(`id retirado no permitido: «${x}»`);
  const lista = (xs: readonly string[]) => (xs.length ? xs.join(",") : "-");
  return `node scripts/aprobar.mjs ${carpeta} --aprobar ${lista(aprobadas)} --rechazar ${lista(rechazadas)} --retirar ${lista(retiradas)}`;
}

/** Lee lo que armó `comandoAprobar`: «-» es la lista vacía. */
export function leerDecisiones(args: readonly string[]): {
  carpeta: string;
  aprobadas: string[];
  rechazadas: string[];
  retiradas: string[];
} {
  const banderas = ["--aprobar", "--rechazar", "--retirar"];
  const valor = (bandera: string) => {
    const i = args.indexOf(bandera);
    if (i < 0 || !args[i + 1] || args[i + 1]!.startsWith("--"))
      throw new Error(`falta ${bandera} <…|->`);
    return args[i + 1] === "-" ? [] : args[i + 1]!.split(",").filter(Boolean);
  };
  const valores = new Set(
    banderas.map((b) => args.indexOf(b) + 1).filter((i) => i > 0),
  );
  const carpeta = args.find((a, i) => !a.startsWith("--") && !valores.has(i));
  if (!carpeta)
    throw new Error(
      "falta la carpeta de la propuesta (propuestas/<fecha>-<plataforma>…)",
    );
  return {
    carpeta,
    aprobadas: valor("--aprobar"),
    rechazadas: valor("--rechazar"),
    retiradas: valor("--retirar"),
  };
}
