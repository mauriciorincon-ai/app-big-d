// Entrada del núcleo que corre en el NAVEGADOR (D-S3-15): expone `window.nucleoCasos()` → [{ caso, texto }].
import { casosNucleo } from "./nucleo-casos";

(globalThis as unknown as { nucleoCasos: typeof casosNucleo }).nucleoCasos = casosNucleo;
