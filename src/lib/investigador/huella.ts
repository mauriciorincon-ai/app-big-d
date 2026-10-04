import { createHash } from "node:crypto";

import { canonico } from "./canonico";

export { canonico };

// Huella de un dato: SHA-256 de su JSON canónico (canonico.ts).
export const sha256 = (texto: string | Uint8Array): string => createHash("sha256").update(texto).digest("hex");

export const huella = (valor: unknown): string => sha256(canonico(valor));
