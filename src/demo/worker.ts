// S10 (F2): el Web Worker de la demo pública. Evalúa con el MISMO núcleo de la app (src/lib/demo/protocolo.ts) y calcula la
// huella con `crypto.subtle`; no decide nada. La regla 1 se comprueba en tres motores: la huella de aquí es la que dio Node
// en el build (tests/determinismo/demo.spec.ts).
import { atenderDemo, type PeticionDemo } from "@/lib/demo/protocolo";

const ambito = self as unknown as { postMessage(m: unknown): void; onmessage: ((ev: MessageEvent<PeticionDemo>) => void) | null };
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const sha256 = async (t: string) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)));

ambito.onmessage = async (ev) => {
  ambito.postMessage(await atenderDemo(ev.data, sha256));
};
