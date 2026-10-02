import { afterEach, describe, expect, it, vi } from "vitest";

// Observabilidad del kit (client-only, metadata-only): inerte sin DSN; con DSN manda SOLO el tipo y
// los metadatos que la app decide, jamás un mensaje crudo.
const captureMessage = vi.fn();
vi.mock("@sentry/nextjs", () => ({ captureMessage: (...a: unknown[]) => captureMessage(...a) }));

describe("eventoSinContenido (beforeSend)", () => {
  it("B-10: quita la petición, las migas y el mensaje de cada excepción; deja el tipo", async () => {
    const { eventoSinContenido } = await import("@/lib/observability");
    const e = eventoSinContenido({ request: { url: "x" }, breadcrumbs: [{}], exception: { values: [{ type: "TypeError", value: "columna «diagnóstico» vacía" }, { type: "Error", value: "otro texto" }] } });
    expect(e).toEqual({ breadcrumbs: undefined, exception: { values: [{ type: "TypeError", value: "TypeError" }, { type: "Error", value: "Error" }] } });
  });
  it("un AbortError no se reporta", async () => {
    const { eventoSinContenido } = await import("@/lib/observability");
    expect(eventoSinContenido({ exception: { values: [{ type: "AbortError", value: "x" }] } })).toBeNull();
  });
});

describe("reportError", () => {
  afterEach(() => {
    captureMessage.mockReset();
    vi.unstubAllEnvs();
  });

  it("no hace nada sin DSN", async () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
    const { reportError } = await import("@/lib/observability");
    await reportError("atlas/svg-invalido", { nodos: 3 });
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it("con DSN manda el tipo y los metadatos, nada más", async () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://clave@example.org/1");
    const { reportError } = await import("@/lib/observability");
    await reportError("atlas/svg-invalido", { nodos: 3 });
    expect(captureMessage).toHaveBeenCalledWith("atlas/svg-invalido", { level: "error", extra: { nodos: 3 } });
  });
});
