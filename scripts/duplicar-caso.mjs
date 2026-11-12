// DUPLICAR un caso (D3, S8) — SOLO UNA PERSONA, con el comando que arma la pantalla del caso. Como aprobar: sobre el repo
// real se niega dentro de una sesión de Claude Code o sin una terminal interactiva (`puedeAprobar`). La copia nace en
// borrador, con `origen: { duplicado_de, huella }`, su plan en borrador y sin las revisiones del original, que no se toca;
// antes de escribir se carga en un ensayo. Uso: node scripts/duplicar-caso.mjs <caso> <nuevo-id>
import { join } from "node:path";
import { cargarTs, RAIZ_REPO } from "./lib/cargar-ts.mjs";
import { puedeAprobar, RAIZ } from "./investigar/comun.mjs";

try {
  const guarda = puedeAprobar({ raiz: RAIZ, repo: RAIZ_REPO, env: process.env, tty: Boolean(process.stdin.isTTY && process.stdout.isTTY) });
  if (!guarda.ok) throw new Error(`solo una persona duplica un caso: ${guarda.motivo}`);
  const [original, nuevo, ...resto] = process.argv.slice(2);
  if (!original || !nuevo || resto.length) throw new Error("uso: node scripts/duplicar-caso.mjs <caso> <nuevo-id>");
  const { duplicarCaso } = await cargarTs("src/lib/caso/duplicar.ts");
  const escritos = duplicarCaso(join(RAIZ, "data"), original, nuevo);
  console.log(`duplicar: «${original}» → «${nuevo}», en borrador (${escritos.length} archivos):\n${escritos.map((f) => `  data/${f}`).join("\n")}`);
} catch (e) {
  console.error(`duplicar: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
}
