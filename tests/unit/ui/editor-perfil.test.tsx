// El editor del perfil en borrador (S4, D-S4-04): arma el comando de aprobación con lo que la persona fija y responde, y no lo
// arma mientras algo no se pueda aprobar. Nada se guarda aquí; el comando lo corre una persona.
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EditorPerfil, type DatosEditor } from "@/components/caso/EditorPerfil";
import { textos } from "@/lib/i18n";
import {
  comandoAprobarCaso,
  type PerfilEditable,
} from "@/lib/investigador/comando-caso";

const T = textos("es");
const DESDE = "ab".repeat(32);
const perfil: PerfilEditable = {
  id: "caso-de-prueba",
  criterios: [
    {
      criterio_id: "crit-gobierno",
      peso_centesimas: 6000,
      rango_relativo_pct: 20,
    },
    {
      criterio_id: "crit-costo",
      peso_centesimas: 4000,
      rango_relativo_pct: 10,
    },
  ],
  restricciones: [{ id: "res-residencia" }],
  decisiones_implicitas: [
    {
      id: "una-o-combinacion",
      opciones: [{ id: "una" }, { id: "combinacion" }],
      respuesta: null,
    },
    {
      id: "quien-opera",
      opciones: [{ id: "gestionado" }, { id: "propio" }],
      respuesta: "gestionado",
    },
  ],
};
const datos: DatosEditor = {
  idioma: "es",
  desde: DESDE,
  perfil,
  criterios: [
    { id: "crit-gobierno", nombre: "Gobierno", esencial: true },
    { id: "crit-costo", nombre: "Costo", esencial: false },
  ],
  restricciones: [
    { id: "res-residencia", texto: "Los datos residen en el país" },
  ],
  decisiones: [
    {
      id: "una-o-combinacion",
      pregunta: "¿Una plataforma o una combinación?",
      opciones: [
        { id: "una", texto: "Una sola" },
        { id: "combinacion", texto: "Combinación" },
      ],
    },
    {
      id: "quien-opera",
      pregunta: "¿Quién opera?",
      opciones: [
        { id: "gestionado", texto: "Gestionado" },
        { id: "propio", texto: "Equipo propio" },
      ],
    },
  ],
};
const t = {
  ...T.caso.perfil.editor,
  suma: T.caso.perfil.pesos.suma,
  sumaBien: T.caso.perfil.pesos.sumaBien,
  copiar: T.investigador.comando.copiar,
  copiado: T.investigador.comando.copiado,
  sinResponder: T.caso.perfil.decisiones.sinResponder,
};
const pintar = (d: DatosEditor = datos) =>
  render(<EditorPerfil datos={d} t={t} />);
const comandoVisible = () =>
  document.querySelector(".comando code")?.textContent ?? null;
const peso = (criterio: string) =>
  screen.getByLabelText(`Peso de ${criterio}, en puntos`) as HTMLInputElement;

afterEach(cleanup);

describe("EditorPerfil", () => {
  it("con una decisión sin responder no hay comando: lo dice y cuenta lo que falta", () => {
    pintar();
    expect(comandoVisible()).toBeNull();
    expect(document.querySelector("[data-sin-comando]")?.textContent).toContain(
      t.sinComando,
    );
    expect(screen.getByText("Falta responder 1 decisión")).toBeTruthy();
  });

  it("al responder todo, el comando es exactamente el que arma la biblioteca con los valores del borrador", () => {
    pintar();
    fireEvent.click(screen.getByLabelText("Una sola"));
    const esperado = comandoAprobarCaso(perfil, DESDE, {
      pesos: { "crit-gobierno": 6000, "crit-costo": 4000 },
      rangos: { "crit-gobierno": 20, "crit-costo": 10 },
      restricciones: ["res-residencia"],
      respuestas: { "una-o-combinacion": "una", "quien-opera": "gestionado" },
    });
    expect(comandoVisible()).toBe(esperado);
    expect(esperado).toContain(`--desde ${DESDE}`);
    expect(screen.getByText(t.sumaBien)).toBeTruthy();
  });

  it("los pesos se escriben en puntos con decimales y llegan al comando en centésimas; con coma o con punto", () => {
    pintar();
    fireEvent.click(screen.getByLabelText("Una sola"));
    fireEvent.change(peso("Gobierno"), { target: { value: "62,5" } });
    expect(comandoVisible()).toBeNull();
    expect(
      screen.getByText(/los pesos suman 102,50 y deben sumar 100/),
    ).toBeTruthy();
    fireEvent.change(peso("Costo"), { target: { value: "37.50" } });
    expect(comandoVisible()).toContain(
      "--pesos crit-gobierno=6250,crit-costo=3750",
    );
  });

  it("un peso o un rango que no es número lo marca y no arma el comando", () => {
    pintar();
    fireEvent.click(screen.getByLabelText("Una sola"));
    fireEvent.change(peso("Costo"), { target: { value: "cuarenta" } });
    expect(peso("Costo").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText(t.pesoInvalido)).toBeTruthy();
    expect(comandoVisible()).toBeNull();
    fireEvent.change(peso("Costo"), { target: { value: "40" } });
    const rango = screen.getByLabelText(
      "Rango relativo de Gobierno, en porcentaje",
    );
    fireEvent.change(rango, { target: { value: "101" } });
    expect(screen.getByText(t.rangoInvalido)).toBeTruthy();
    expect(comandoVisible()).toBeNull();
    fireEvent.change(rango, { target: { value: "30" } });
    expect(comandoVisible()).toContain(
      "--rangos crit-gobierno=30,crit-costo=10",
    );
  });

  it("quitar la marca de una restricción la deja fuera del comando; sin ninguna dice «-»", () => {
    pintar();
    fireEvent.click(screen.getByLabelText("Una sola"));
    expect(comandoVisible()).toContain("--restricciones res-residencia ");
    fireEvent.click(
      within(
        document.querySelector("[data-restriccion-editor]") as HTMLElement,
      ).getByRole("checkbox"),
    );
    expect(comandoVisible()).toContain("--restricciones - ");
  });

  it("la sola vista del borrador no escribe ni aprueba nada: no hay botón de aprobar ni petición de red", () => {
    pintar();
    expect(screen.queryByRole("button", { name: /aprobar/i })).toBeNull();
  });
});
