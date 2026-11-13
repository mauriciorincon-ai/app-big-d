// S10 (F2): la página de la demo pública en el navegador. Mueve los pesos (centésimas que suman 10 000, repartidas como en la
// exploración de la app: `pesosExplorados`), le pide al Worker que evalúe y escribe la respuesta con la misma `vistaDe` que
// armó la página en el build. «Probar la neutralidad» entrega las plataformas en otro orden y compara las huellas.
import type { Entrada } from "@/engine/tipos";
import { pesosExplorados } from "@/lib/caso/explorar";
import { conPesos, reordenada } from "@/lib/demo/entrada";
import { plantilla } from "@/lib/atlas/plantilla";
import type { DatosCliente } from "@/lib/demo/pagina";
import { esRespuesta, type PeticionDemo, type RespuestaDemo } from "@/lib/demo/protocolo";
import { pesoEscrito, vistaDe, type Contexto } from "@/lib/demo/vista";
import type { Idioma } from "@/lib/i18n";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

async function arrancar() {
  const raiz = $("demo");
  const idioma = raiz.dataset.idioma as Idioma;
  const d = JSON.parse($("datos-demo").textContent ?? "") as DatosCliente;
  const ctx: Contexto = { idioma, t: d.t, nombres: d.nombres, umbralCentesimas: d.umbralCentesimas };
  const autor = d.entrada.caso.pesos.map((p) => p.peso);
  let pesos = d.entrada.caso.pesos.map((p) => ({ ...p }));
  let id = 0;
  let vigente = 0;
  let huellaVigente = d.inicial.tipo === "evaluado" ? d.inicial.huella : "";
  let vuelta = 0;
  const pendientes = new Map<number, "pesos" | "neutralidad">();
  const deslizadores = [...document.querySelectorAll<HTMLInputElement>("input[data-criterio]")];
  const neutralidad = $<HTMLButtonElement>("neutralidad");

  const trabajador = new Worker("demo-worker.js");
  const pedir = (entrada: Entrada, motivo: "pesos" | "neutralidad") => {
    id += 1;
    pendientes.set(id, motivo);
    if (motivo === "pesos") vigente = id;
    const p: PeticionDemo = { tipo: "evaluar", id, entrada };
    trabajador.postMessage(p);
  };

  const pintarPesos = () =>
    pesos.forEach((p, i) => {
      const input = deslizadores[i]!;
      input.value = String(p.peso);
      $(`${input.id}-valor`).textContent = pesoEscrito(p.peso, idioma);
    });

  const pintarResultado = (r: RespuestaDemo) => {
    const v = vistaDe(r, ctx);
    const lista = $("filas");
    for (const f of v.filas) {
      const li = lista.querySelector<HTMLElement>(`[data-plataforma="${f.plataforma_id}"]`);
      if (!li) continue;
      li.querySelector(".demo-puesto")!.textContent = f.puesto;
      li.querySelector(".demo-total")!.textContent = f.total;
      li.querySelector("meter")!.value = f.decimas;
      lista.appendChild(li);
    }
    $("veredicto").textContent = v.veredicto;
    if (r.tipo === "evaluado") {
      huellaVigente = r.huella;
      $("huella").textContent = r.huella;
    }
    raiz.dataset.huella = r.tipo === "evaluado" ? r.huella : "";
  };

  const pintarNeutralidad = (r: RespuestaDemo) => {
    if (r.tipo !== "evaluado") return;
    const igual = r.huella === huellaVigente;
    $("neutralidad-orden").textContent = plantilla(d.t.neutralidadOrden, { orden: r.recibido.map((x) => d.nombres[x] ?? x).join(" · ") });
    $("neutralidad-huella").textContent = r.huella;
    const veredicto = $("neutralidad-veredicto");
    veredicto.textContent = `${igual ? "✓" : "✗"} ${igual ? d.t.neutralidadIgual : d.t.neutralidadDistinta}`;
    veredicto.dataset.igual = String(igual);
    veredicto.dataset.vuelta = String(vuelta);
    $("neutralidad-resultado").hidden = false;
  };

  trabajador.onmessage = (ev: MessageEvent<unknown>) => {
    const r = ev.data;
    if (!esRespuesta(r)) return;
    const motivo = pendientes.get(r.id);
    pendientes.delete(r.id);
    if (motivo === "pesos" && r.id === vigente) {
      pintarResultado(r);
      neutralidad.disabled = false;
      raiz.dataset.listo = "true";
    } else if (motivo === "neutralidad") pintarNeutralidad(r);
  };

  const recalcular = () => {
    $("veredicto").textContent = d.t.veredicto.calculando;
    $("neutralidad-resultado").hidden = true;
    neutralidad.disabled = true;
    pedir(conPesos(d.entrada, pesos.map((p) => p.peso)), "pesos");
  };

  for (const input of deslizadores)
    input.addEventListener("input", () => {
      pesos = pesosExplorados(pesos, input.dataset.criterio!, Number(input.value));
      pintarPesos();
      recalcular();
    });
  $("restablecer").addEventListener("click", () => {
    pesos = pesos.map((p, i) => ({ ...p, peso: autor[i]! }));
    pintarPesos();
    recalcular();
  });
  neutralidad.addEventListener("click", () => {
    $("neutralidad-resultado").hidden = true;
    delete $("neutralidad-veredicto").dataset.igual;
    vuelta += 1;
    pedir(reordenada(conPesos(d.entrada, pesos.map((p) => p.peso)), vuelta), "neutralidad");
  });
  // La primera evaluación en el navegador: debe dar la huella que dio Node en el build (data-huella-node).
  recalcular();
}

void arrancar();
