// El Web Worker de la simulación (C13, D-S3-07): corre `atender` paso a paso y, entre paso y paso, cede el turno para
// que una cancelación (o una petición nueva, que reemplaza a la vigente) llegue a tiempo. No decide nada: el núcleo
// emite y el Worker reenvía.
import { atender, type Peticion } from "@/engine/protocolo";

const ambito = self as unknown as { postMessage(m: unknown): void; onmessage: ((ev: MessageEvent<Peticion>) => void) | null };
let vigente = -1;

ambito.onmessage = async (ev) => {
  const p = ev.data;
  if (p.tipo === "cancelar") {
    if (p.id === vigente) vigente = -1;
    return;
  }
  vigente = p.id;
  for (const r of atender(p)) {
    if (vigente !== p.id) return;
    ambito.postMessage(r);
    await new Promise((listo) => setTimeout(listo, 0));
  }
};
