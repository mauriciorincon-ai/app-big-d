// Escribe tests/fixtures/simulacion-worker.json con los mensajes REALES del emisor (D-S3-08): el lado que lee los
// valida con Zod en Vitest y la UI los acepta con su guarda. Uso: node scripts/nucleo/fixture-simulacion.mjs
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { cargarTs, RAIZ_REPO } from "../lib/cargar-ts.mjs";

const { mensajes } = await cargarTs("scripts/nucleo/emitir-simulacion.ts");
const m = mensajes();
writeFileSync(join(RAIZ_REPO, "tests/fixtures/simulacion-worker.json"), `${JSON.stringify(m, null, 2)}\n`);
console.log(`fixture-simulacion: ${m.length} mensajes (${m.map((x) => x.tipo).join(", ")})`);
