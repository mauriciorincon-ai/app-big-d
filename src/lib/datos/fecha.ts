// Fecha de consulta del atlas (AAAA-MM-DD): el semáforo de vigencia se cuenta hasta ella (§ 4.8 del contrato
// del diagramador; el motor no lee el reloj, la fecha es una ENTRADA). En el sitio es el día del build; las
// pruebas y la pasada de capturas la fijan con BIGD_FECHA_CONSULTA para que el dibujo no dependa del día.
const CIVIL = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function fechaDeConsulta(entorno: Record<string, string | undefined> = process.env, hoy: Date = new Date()): string {
  const fijada = entorno.BIGD_FECHA_CONSULTA;
  if (fijada === undefined || fijada === "") return hoy.toISOString().slice(0, 10);
  if (!CIVIL.test(fijada)) throw new Error(`BIGD_FECHA_CONSULTA no es una fecha AAAA-MM-DD: «${fijada}»`);
  return fijada;
}
