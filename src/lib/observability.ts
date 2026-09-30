// Reporte de errores metadata-only (kit-app v1.2.1 — patrón validado en nutri-kids S1 y ds S1).
// Regla: a Sentry van SOLO tipos de error + metadatos numéricos/categóricos que la app decida.
// JAMÁS mensajes crudos de excepciones de terceros (un traceback puede filtrar contenido del
// usuario, p. ej. nombres de columnas o valores), ni PII, ni payloads.
//
// El SDK se importa DINÁMICAMENTE (Big-D S1, como en instrumentation-client.ts): sin DSN jamás se
// descarga.

/** Lo mínimo de un evento de Sentry que tocamos (evita importar sus tipos: el SDK es dinámico). */
export interface EventoSentry {
  request?: unknown;
  breadcrumbs?: unknown;
  exception?: { values?: { type?: string; value?: string }[] };
}

/**
 * `beforeSend` de Sentry: el evento sale sin petición, sin migas y sin el MENSAJE de cada excepción (solo su
 * tipo; B-10 de la auditoría del S1: un error capturado viajaba con su mensaje crudo). Un `AbortError` no se
 * reporta.
 */
export function eventoSinContenido<E extends EventoSentry>(event: E): E | null {
  if (event.exception?.values?.[0]?.type === "AbortError") return null;
  delete event.request;
  event.breadcrumbs = undefined;
  for (const v of event.exception?.values ?? []) v.value = v.type;
  return event;
}

/**
 * Reporta un error como evento tipado con contexto controlado.
 * @param kind  identificador estable del tipo de error (ej. "experiment/worker-crash")
 * @param meta  SOLO metadatos seguros (números, booleanos, enums propios) — nunca contenido
 */
export async function reportError(kind: string, meta: Record<string, number | string | boolean> = {}): Promise<void> {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return; // inerte sin DSN
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureMessage(kind, { level: "error", extra: meta });
}
