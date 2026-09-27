import { afterEach, describe, expect, it, vi } from "vitest";

// Observabilidad del kit (client-only, metadata-only): inerte sin DSN; con DSN manda SOLO el tipo y
// los metadatos que la app decide, jamás un mensaje crudo.
const captureMessage = vi.fn();
vi.mock("@sentry/nextjs", () => ({ captureMessage: (...a: unknown[]) => captureMessage(...a) }));

describe("reportError", () => {
  afterEach(() => {
    captureMessage.mockReset();
    vi.unstubAllEnvs();
  });

  it("no hace nada sin DSN", async () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
    const { reportError } = await import("@/lib/observability");
    reportError("atlas/svg-invalido", { nodos: 3 });
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it("con DSN manda el tipo y los metadatos, nada más", async () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://clave@example.org/1");
    const { reportError } = await import("@/lib/observability");
    reportError("atlas/svg-invalido", { nodos: 3 });
    expect(captureMessage).toHaveBeenCalledWith("atlas/svg-invalido", { level: "error", extra: { nodos: 3 } });
  });
});
