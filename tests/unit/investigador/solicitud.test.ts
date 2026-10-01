// @vitest-environment node
// La solicitud de investigación (decisión de la persona, 2026-09-30): el botón de la pantalla del investigador
// abre una tarea nueva en el repositorio de Big-D en GitHub, ya escrita, que queda guardada al confirmarla. Sin
// servidor: es un enlace. Aquí, lo que lleva el enlace y que el repositorio sea el de este clon.
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { textos } from "@/lib/i18n";
import { ETIQUETA_SOLICITUD, REPOSITORIO, urlSolicitud } from "@/lib/investigador/solicitud";

const leer = (u: string) => {
  const url = new URL(u);
  return { base: url.origin + url.pathname, titulo: url.searchParams.get("title"), cuerpo: url.searchParams.get("body") ?? "", etiqueta: url.searchParams.get("labels") };
};

describe("solicitud de investigación", () => {
  it("de una plataforma entera: tarea nueva del repositorio, con título, etiqueta y cómo atenderla", () => {
    const s = leer(urlSolicitud(textos("es").investigador.solicitud, { id: "databricks", nombre: "Databricks" }));
    expect(s.base).toBe(`https://github.com/${REPOSITORIO}/issues/new`);
    expect(s.titulo).toBe("Investigar Databricks");
    expect(s.etiqueta).toBe(ETIQUETA_SOLICITUD);
    expect(s.cuerpo).toContain("`/investigar databricks`");
  });
  it("de una capa, en inglés: el título y el comando la nombran", () => {
    const s = leer(urlSolicitud(textos("en").investigador.solicitud, { id: "fabric", nombre: "Microsoft Fabric" }, { id: "ingesta", nombre: "Ingestion" }));
    expect(s.titulo).toBe("Research Microsoft Fabric · Ingestion layer");
    expect(s.cuerpo).toContain("`/investigar fabric ingesta`");
  });
  it("el repositorio del enlace es el de este clon (si el repositorio se muda, esta prueba lo avisa)", () => {
    const origen = execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" }).trim();
    expect(origen.replace(/^git@github\.com:|^https:\/\/github\.com\//, "").replace(/\.git$/, "")).toBe(REPOSITORIO);
  });
});
