// S10 (F2): escribe tests/fixtures/demo-worker.json con los mensajes REALES del emisor de la demo (regla 19): el lado que lee
// los valida con Zod en Vitest y la página los acepta con su guarda. Uso: node scripts/demo/fixture-worker.mjs
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { cargarTs, RAIZ_REPO } from "../lib/cargar-ts.mjs";

const { mensajes } = await cargarTs("scripts/demo/emitir-worker.ts");
const m = await mensajes();
writeFileSync(join(RAIZ_REPO, "tests/fixtures/demo-worker.json"), `${JSON.stringify(m, null, 2)}\n`);
console.log(`fixture-demo: ${m.length} mensajes (${m.map((x) => x.tipo).join(", ")})`);
