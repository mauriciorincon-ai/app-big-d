// La aprobación es humana y mecánica (D-S1-10): la pantalla de revisión, que es estática, solo ARMA el
// comando; la persona lo corre. Un hook impide que cualquier agente lo ejecute.
export function comandoAprobar(carpeta: string, aprobadas: readonly string[], rechazadas: readonly string[]): string {
  const lista = (xs: readonly string[]) => (xs.length ? xs.join(",") : "-");
  return `node scripts/aprobar.mjs ${carpeta} --aprobar ${lista(aprobadas)} --rechazar ${lista(rechazadas)}`;
}

/** Lee lo que armó `comandoAprobar`: «-» es la lista vacía. */
export function leerDecisiones(args: readonly string[]): { carpeta: string; aprobadas: string[]; rechazadas: string[] } {
  const valor = (bandera: string) => {
    const i = args.indexOf(bandera);
    if (i < 0 || !args[i + 1]) throw new Error(`falta ${bandera} <A-1,A-2…|->`);
    return args[i + 1] === "-" ? [] : args[i + 1]!.split(",").filter(Boolean);
  };
  const carpeta = args.find((a) => !a.startsWith("--") && !/^(A-\d+(,A-\d+)*|-)$/.test(a));
  if (!carpeta) throw new Error("falta la carpeta de la propuesta (propuestas/<fecha>-<plataforma>…)");
  return { carpeta, aprobadas: valor("--aprobar"), rechazadas: valor("--rechazar") };
}
