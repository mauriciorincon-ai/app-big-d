// Sentry client-only, metadata-only (kit-app v1.2.1 — patrón validado en nutri-kids S1 y ds S1).
// INERTE SIN DSN: si NEXT_PUBLIC_SENTRY_DSN no está definida (CI, local sin configurar),
// no se inicializa nada y no hay ruido. Configura la DSN en .env.local y en Vercel.
// Server-side Sentry (instrumentation.ts) se añade cuando la app tenga backend, por ADR.
//
// El SDK se importa DINÁMICAMENTE (Big-D S1): con `import * as Sentry` estático viajaba a todas las
// páginas aunque no hubiera DSN — ~70 KB comprimidos antes de la primera pintura, y el LCP simulado
// de Lighthouse pasó del presupuesto de 3000 ms. Sin DSN el SDK no se descarga nunca; con DSN llega
// en un chunk aparte, después de pintar.
import { eventoSinContenido } from "@/lib/observability";

type Sdk = typeof import("@sentry/nextjs");

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
let sdk: Sdk | undefined;

if (dsn) {
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "local",
      // Sin tracing ni replay: error tracking puro (presupuesto y privacidad).
      tracesSampleRate: 0,
      // Privacidad (metadata-only): nunca enviar requests ni breadcrumbs que puedan
      // arrastrar contenido del usuario. Reportar errores vía src/lib/observability.ts.
      beforeSend: eventoSinContenido,
    });
    sdk = Sentry;
  });
}

// Hook opcional de Next para transiciones de router (no-op si Sentry no inicializó).
export function onRouterTransitionStart(href: string, navigationType: string) {
  sdk?.captureRouterTransitionStart(href, navigationType);
}
