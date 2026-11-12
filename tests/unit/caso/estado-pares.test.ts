// D7 (S8): el avance de la comparación de pares en la URL. Un carácter por par en el orden canónico (por id), «-» sin
// juzgar; una URL que no cabe (largo distinto, letra fuera de la escala) cae entera a «nada juzgado», jamás a medias.
import { describe, expect, it } from "vitest";
import { paresCanonicos } from "@/engine";
import { codificarPares, consultaPares, gruposDe, juiciosDe, leerGrupo, leerPares } from "@/lib/caso/estado-pares";

const PARES = paresCanonicos(["crit-c", "crit-a", "crit-b"]);

describe("estado de la comparación de pares", () => {
  it("los pares van por id y se agrupan por su primer criterio", () => {
    expect(PARES).toEqual([
      ["crit-a", "crit-b"],
      ["crit-a", "crit-c"],
      ["crit-b", "crit-c"],
    ]);
    expect(gruposDe(PARES)).toEqual([[0, 1], [2]]);
  });

  it("lee y escribe la URL de ida y vuelta, sin tocar los demás parámetros", () => {
    const valores = [8, null, -3];
    const q = consultaPares(valores, 1, "?criterio=crit-a&t=10");
    expect(q).toBe("?criterio=crit-a&t=10&pares=q-f&grupo=2");
    expect(leerPares(q, 3, 9)).toEqual(valores);
    expect(leerGrupo(q, 2)).toBe(1);
    expect(codificarPares([0, 0, 0])).toBe("iii");
  });

  it("una URL que no cabe cae a «nada juzgado» y al primer grupo", () => {
    for (const q of ["?pares=ii", "?pares=iiii", "?pares=iiz", "?pares=ii1", ""]) expect(leerPares(q, 3, 9)).toEqual([null, null, null]);
    // Con una escala de 1 a 5, «q» (9) queda fuera.
    expect(leerPares("?pares=qii", 3, 5)).toEqual([null, null, null]);
    for (const g of ["0", "3", "x", "-1"]) expect(leerGrupo(`?grupo=${g}`, 2)).toBe(0);
  });

  it("los juicios del núcleo: v ≥ 0 favorece al primero (v + 1), v < 0 al segundo (1 − v); sin juzgar no entra", () => {
    expect(juiciosDe(PARES, [8, null, -3])).toEqual([
      { mayor: "crit-a", menor: "crit-b", intensidad: 9 },
      { mayor: "crit-c", menor: "crit-b", intensidad: 4 },
    ]);
  });
});
