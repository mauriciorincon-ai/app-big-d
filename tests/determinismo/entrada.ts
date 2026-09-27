// Entrada del paquete que corre en el NAVEGADOR (D-S1-12): los mismos casos que los golden files de
// packages/diagramador/test/golden.test.ts, con los datos importados como JSON (esbuild los empaqueta; el
// navegador no lee archivos). Expone `window.diagramadorGolden()` → [{ archivo, svg }].
import { layout, toSVG, type Gramatica, type Mapa, type Vista } from "../../packages/diagramador/src/index";
import { TEXTOS } from "../../packages/diagramador/test/lib/textos";
import gAgentes from "../../packages/diagramador/gramaticas/agentes-ia.json";
import gPlataformas from "../../packages/diagramador/gramaticas/plataformas-datos.json";
import gPAgentes from "../../packages/diagramador/gramaticas/prueba-agentes-ia.json";
import gPApp from "../../packages/diagramador/gramaticas/prueba-arquitectura-app.json";
import gPNubes from "../../packages/diagramador/gramaticas/prueba-nubes.json";
import gPProcesos from "../../packages/diagramador/gramaticas/prueba-procesos.json";
import mAgente from "../../packages/diagramador/ejemplos/agente-ejemplo.mapa.json";
import mPlataforma from "../../packages/diagramador/ejemplos/plataforma-ejemplo.mapa.json";
import mPAgentes from "../../packages/diagramador/ejemplos/prueba-agentes-ia.mapa.json";
import mPApp from "../../packages/diagramador/ejemplos/prueba-arquitectura-app.mapa.json";
import mPNubes from "../../packages/diagramador/ejemplos/prueba-nubes.mapa.json";
import mPProcesos from "../../packages/diagramador/ejemplos/prueba-procesos.mapa.json";
import mA3 from "../../packages/diagramador/carnadas/A3-cuatro-modos-en-un-par.mapa.json";

const FECHA = "2026-09-26";
const VISTAS: Vista[] = ["nivel-1", "nivel-2", "recorrido"];
const GRAMATICAS = Object.fromEntries([gAgentes, gPlataformas, gPAgentes, gPApp, gPNubes, gPProcesos].map((g) => [g.id, g as unknown as Gramatica]));
const EJEMPLOS = [mAgente, mPlataforma, mPAgentes, mPApp, mPNubes, mPProcesos] as unknown as Mapa[];

function casos(): { clave: string; mapa: Mapa; vista: Vista }[] {
  return [
    ...EJEMPLOS.flatMap((m) => VISTAS.map((vista) => ({ clave: m.sujeto_id, mapa: m, vista }))),
    { clave: "carnada-a3", mapa: mA3 as unknown as Mapa, vista: "nivel-1" as Vista },
  ];
}

(globalThis as unknown as { diagramadorGolden: () => { archivo: string; svg: string }[] }).diagramadorGolden = () =>
  casos().flatMap((c) => {
    const g = GRAMATICAS[c.mapa.gramatica_id]!;
    const geo = layout(c.mapa, g, c.vista, { textos: TEXTOS, fechaConsulta: FECHA });
    return g.idiomas.map((idioma) => ({ archivo: `${c.clave}.${c.vista}.${idioma}.svg`, svg: toSVG(geo, { language: idioma }) }));
  });
