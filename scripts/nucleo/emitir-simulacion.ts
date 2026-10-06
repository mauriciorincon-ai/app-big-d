// El lado que EMITE del contrato Worker ↔ UI (D-S3-08, regla 19): los mensajes que `atender` produce para tres
// peticiones (el caso de la maqueta por pasos, una que agota el tope de intentos y una que no se puede simular). Lo
// usan el script que escribe tests/fixtures/simulacion-worker.json y la prueba que lo compara.
import { atender, entradaSimulacion, evaluar, type Respuesta } from "../../src/engine";
import { futuro } from "../../tests/unit/nucleo/lib/futuro";

export function mensajes(): Respuesta[] {
  const e = futuro();
  const r = evaluar(e);
  if (r.tipo !== "evaluado") throw new Error("el caso de la maqueta no se evaluó");
  const base = entradaSimulacion(e, r)!;
  const corta = { ...base, semillas: base.semillas.slice(0, 2), aceptadas: 600 };
  return [
    ...atender({ tipo: "simular", id: 1, entrada: corta, paso: 250 }),
    ...atender({ tipo: "simular", id: 2, entrada: { ...corta, tope_intentos: 40 }, paso: 25 }),
    ...atender({ tipo: "simular", id: 3, entrada: { ...corta, plataformas: ["norte"], puntajes: [corta.puntajes[0]!] }, paso: 250 }),
  ];
}
