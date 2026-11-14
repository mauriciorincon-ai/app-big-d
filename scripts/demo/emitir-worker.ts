// S10 (F2): los mensajes REALES del Worker de la demo para el fixture del contrato (regla 19): `atenderDemo` sobre la entrada de
// la demo con los pesos del autor, en otro orden, con un peso movido, con un perfil sin estado de exploración y con pesos rotos.
import { createHash } from "node:crypto";
import { pesosExplorados } from "@/lib/caso/explorar";
import { conPesos, reordenada } from "@/lib/demo/entrada";
import { entradaDemo } from "@/lib/demo/pagina";
import { atenderDemo, type RespuestaDemo } from "@/lib/demo/protocolo";

const sha = async (t: string) => createHash("sha256").update(t, "utf8").digest("hex");

export async function mensajes(): Promise<RespuestaDemo[]> {
  const e = entradaDemo();
  const movidos = pesosExplorados(e.caso.pesos, e.caso.pesos[0]!.criterio_id, 0).map((p) => p.peso);
  return Promise.all([
    atenderDemo({ tipo: "evaluar", id: 1, entrada: e }, sha),
    atenderDemo({ tipo: "evaluar", id: 2, entrada: reordenada(e, 1) }, sha),
    atenderDemo({ tipo: "evaluar", id: 3, entrada: conPesos(e, movidos) }, sha),
    atenderDemo({ tipo: "evaluar", id: 4, entrada: { ...e, caso: { ...e.caso, estado: "borrador" } } }, sha),
    atenderDemo({ tipo: "evaluar", id: 5, entrada: conPesos(e, e.caso.pesos.map(() => 1)) }, sha),
  ]);
}
