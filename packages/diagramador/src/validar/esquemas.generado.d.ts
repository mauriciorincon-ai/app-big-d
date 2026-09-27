// Tipos del validador generado (esquemas.generado.js). Ajv deja los errores de la última llamada en `errors`.
export interface ErrorEsquema {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  params: Record<string, unknown>;
  message?: string;
}
export interface ValidadorEsquema {
  (datos: unknown): boolean;
  errors?: ErrorEsquema[] | null;
}
export const validarGramaticaEsquema: ValidadorEsquema;
export const validarMapaEsquema: ValidadorEsquema;
