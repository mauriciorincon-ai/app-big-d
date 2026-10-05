// @vitest-environment node
// La mitad Node del gate de reproducibilidad entre motores (D-S3-15): la huella SHA-256 del resultado canónico de cada
// entrada de tests/determinismo/nucleo-casos.ts es la de NUCLEO.SHA256SUMS; los tres navegadores comparan contra el
// mismo archivo (tests/determinismo/nucleo.spec.ts). Un cambio deliberado del núcleo regenera las sumas con
// ACTUALIZAR_HUELLAS=1 y el diff del archivo entra a la revisión.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { casosNucleo } from "../../determinismo/nucleo-casos";

const ARCHIVO = resolve(__dirname, "../../determinismo/NUCLEO.SHA256SUMS");

it("cada resultado del núcleo tiene la huella fijada (la misma que en los tres navegadores)", () => {
  const sumas = casosNucleo().map((c) => `${createHash("sha256").update(c.texto, "utf8").digest("hex")}  ${c.caso}`);
  if (process.env.ACTUALIZAR_HUELLAS === "1") writeFileSync(ARCHIVO, `${sumas.join("\n")}\n`);
  expect(sumas.join("\n")).toBe(readFileSync(ARCHIVO, "utf8").trim());
  expect(new Set(casosNucleo().map((c) => c.caso)).size).toBe(sumas.length);
});
