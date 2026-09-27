// Mirada 4: decisiones y riesgos · hoja de ruta e informe · estado del instrumento · portada del recorrido.
import { decisiones, D_NORMAL, D_CICLO } from "./m4-decisiones.mjs";
import { informe } from "./m4-informe.mjs";
import { instrumento } from "./m4-instrumento.mjs";
import { indice } from "./m4-indice.mjs";
import { avisos } from "./m4-comun.mjs";
import { escribir } from "../pulir.mjs";
console.log("ondas", D_NORMAL.W, "×", D_NORMAL.H, "D11", D_NORMAL.cruces, "cruces entre líneas", D_NORMAL.entre, "· ciclo", D_CICLO.W, "×", D_CICLO.H, "D11", D_CICLO.cruces, "cruces", D_CICLO.entre);
for (const [f, h] of [["decisiones.html", decisiones], ["informe.html", informe], ["instrumento.html", instrumento], ["index.html", indice]]) { escribir(f, h); console.log(f, (h.length / 1024).toFixed(1), "KB"); }
console.log(avisos.length ? avisos.join("\n") : "sin avisos");
