// D3 (S8): «Duplicar» en el caso arma el comando con el id que la persona escribe y lo calla mientras el id no sirva; el
// aviso lleva ícono y texto. Nada se escribe desde la pantalla.
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DuplicarCaso } from "@/components/caso/DuplicarCaso";
import { textos } from "@/lib/i18n";

const T = textos("es");
const t = T.caso.perfil.duplicar;
afterEach(cleanup);

const pintar = () => render(<DuplicarCaso caso="hospital-futuro" existentes={["hospital-futuro", "hospital-otro"]} t={t} copiar="Copiar" copiado="Copiado" />);
const comando = () => document.querySelector("[data-duplicar] .comando code")?.textContent ?? null;
const id = () => screen.getByLabelText(t.etiqueta) as HTMLInputElement;

describe("DuplicarCaso", () => {
  it("propone un id y arma el comando que corre una persona", () => {
    pintar();
    expect(id().value).toBe("hospital-futuro-b");
    expect(comando()).toBe("node scripts/duplicar-caso.mjs hospital-futuro hospital-futuro-b");
  });

  for (const [valor, problema] of [
    ["", "vacio"],
    ["Hospital B", "invalido"],
    ["hospital-futuro", "mismo"],
    ["hospital-otro", "existe"],
  ] as const)
    it(`con «${valor}» no hay comando: dice por qué (${problema})`, () => {
      pintar();
      fireEvent.change(id(), { target: { value: valor } });
      expect(comando()).toBeNull();
      const aviso = document.querySelector(`[data-duplicar-problema="${problema}"]`)!;
      expect(aviso.textContent).toBe(t.problemas[problema]);
      expect(aviso.querySelector("svg")).not.toBeNull();
      expect(id().getAttribute("aria-invalid")).toBe("true");
    });
});
