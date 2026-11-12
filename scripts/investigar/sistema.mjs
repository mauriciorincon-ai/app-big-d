// Ejecutor del investigador con el MODELO DEL SISTEMA de macOS (decisions/investigator-system-model.md): otro ejecutor del
// mismo contrato de propuestas/, sin API de pago, sin clave, sin descargar ningún modelo. Rehace UNA capa de una propuesta
// de mapa completa (la base, que dejó /investigar): baja las fuentes de los componentes de esa capa con el mismo `curl` del
// verificador, se las da al modelo por trozos (su ventana es corta) y le pide, por componente, un enunciado en los dos
// idiomas con una cita copiada del texto. El CÓDIGO tumba la cita que no aparece en la página antes de escribir; luego la
// propuesta pasa por el mismo esquema, el mismo validador del diagramador y la misma verificación de citas que la de la
// skill. Jamás aprueba: la aprobación sigue siendo de una persona, con el comando que arma la pantalla de revisión.
//
// Uso: node scripts/investigar/sistema.mjs <plataforma> <capa> [--base propuestas/<carpeta>]
// Sale con 3 (sin escribir nada) si el modelo del sistema no está disponible, y lo dice con su razón.
// Pruebas: BIGD_MODELO_FALSO=<módulo .mjs con disponible() y generar(pedido)> sustituye al puente, SOLO sobre una raíz
// temporal (BIGD_RAIZ): jamás escribe una propuesta falsa en el repo real.
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { cargarTs, RAIZ_REPO } from "../lib/cargar-ts.mjs";
import { bajar } from "./bajar.mjs";
import { carpetaPropuesta, gramaticaDe, hoy, identificadores, RAIZ } from "./comun.mjs";

const ID = /^[a-z0-9][a-z0-9-]*$/;
/** Caracteres por trozo: la ventana del modelo del sistema es de 8192 tokens, con las instrucciones y la lista dentro. */
const TROZO = 3500;
/** Trozos por página, como máximo: cada uno es una llamada de unos segundos. */
const TROZOS_POR_PAGINA = 12;
const MODELO = "SystemLanguageModel.default (modelo del sistema de macOS, en el equipo)";
const INSTRUCCIONES =
  "Lees documentación pública de una plataforma de datos y anotas lo que el texto dice de cada componente de la lista. " +
  "Solo lo que el texto dice: si no habla de un componente, no lo anotes. La cita es una frase copiada letra por letra del texto, " +
  "sin cambiar, resumir ni traducir nada. El enunciado en español se redacta en español; el inglés, en inglés.";
const COI = {
  es: "Documentación del fabricante: tiene interés comercial en presentar bien su plataforma.",
  en: "Vendor documentation: it has a commercial interest in presenting its platform favourably.",
};

class SinModelo extends Error {}

const real = (r) => {
  try {
    return realpathSync(r);
  } catch {
    return r;
  }
};

/** El modelo: el falso de las pruebas (solo en una raíz temporal) o el puente Swift, compilado al correr. */
async function modelo() {
  const falso = process.env.BIGD_MODELO_FALSO;
  if (falso) {
    if (real(RAIZ) === real(RAIZ_REPO)) throw new Error("BIGD_MODELO_FALSO solo corre sobre una raíz temporal (BIGD_RAIZ), nunca sobre el repo");
    return import(pathToFileURL(falso).href);
  }
  const fuente = fileURLToPath(new URL("./sistema/puente.swift", import.meta.url));
  const huella = createHash("sha256").update(readFileSync(fuente)).digest("hex").slice(0, 12);
  const dir = join(tmpdir(), `bigd-sistema-${huella}`);
  const bin = join(dir, "puente");
  if (!existsSync(bin)) {
    if (process.platform !== "darwin") throw new SinModelo("el modelo del sistema es de macOS y este equipo no lo es");
    mkdirSync(dir, { recursive: true });
    try {
      execFileSync("swiftc", ["-O", fuente, "-o", bin], { stdio: ["ignore", "ignore", "pipe"] });
    } catch (e) {
      throw new SinModelo(e.code === "ENOENT" ? "falta swiftc (las Command Line Tools de Xcode)" : `el puente no compiló: ${String(e.stderr).trim().split("\n")[0]}`);
    }
  }
  const llamar = (pedido) => {
    const r = JSON.parse(execFileSync(bin, { input: JSON.stringify(pedido), encoding: "utf8", maxBuffer: 1 << 24 }));
    if (r.error) throw new Error(`el modelo del sistema: ${r.error}`);
    return r;
  };
  return { disponible: () => llamar({ modo: "disponible" }), generar: (p) => llamar({ modo: "generar", ...p }).hallazgos ?? [] };
}

/** Parte un texto en trozos de hasta `n` caracteres, por frases. */
function trozos(texto, n = TROZO) {
  const frases = texto.split(/(?<=[.!?])\s+/);
  const out = [];
  let actual = "";
  for (const f of frases) {
    if (actual && actual.length + f.length + 1 > n) {
      out.push(actual);
      actual = "";
    }
    actual = actual ? `${actual} ${f}` : f.slice(0, n);
  }
  if (actual) out.push(actual);
  return out;
}

function argumentos(argv) {
  const pos = [];
  let base;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--base") base = argv[++i];
    else pos.push(argv[i]);
  }
  const [plataforma, capa] = pos;
  if (pos.length !== 2 || !ID.test(plataforma ?? "") || !ID.test(capa ?? "")) throw new Error("uso: node scripts/investigar/sistema.mjs <plataforma> <capa> [--base propuestas/<carpeta>]");
  return { plataforma, capa, base };
}

/** La base: la indicada, o la propuesta de mapa completo más reciente de la plataforma (`<fecha>-<plataforma>`). */
function carpetaBase(plataforma, base) {
  if (base) return carpetaPropuesta(base);
  const dir = join(RAIZ, "propuestas");
  const patron = new RegExp(`^\\d{4}-\\d{2}-\\d{2}-${plataforma}$`);
  const hay = existsSync(dir) ? readdirSync(dir).filter((c) => patron.test(c)).sort() : [];
  if (!hay.length) throw new Error(`no hay una propuesta de mapa completo de «${plataforma}» en propuestas/: corre antes /investigar ${plataforma}`);
  return carpetaPropuesta(`propuestas/${hay.at(-1)}`);
}

// Lo que el código puede comprobar del borrador sin otro modelo (la corrida real del 2026-11-12 sobre Snowflake trajo una
// línea de SQL y un título repetido como «citas», un enunciado en español escrito en inglés y otro copiado de la lista).
const PALABRAS = {
  es: new Set("de la el los las que en y con para una un se por del al es su sus sin como".split(" ")),
  en: new Set("the and of to a in is with for its it that by on as are an without".split(" ")),
};
const palabras = (t) => t.toLowerCase().match(/\p{L}+/gu) ?? [];
/** Un enunciado está en su idioma si trae más palabras de función de ese idioma que del otro. */
function enIdioma(t, idioma) {
  const otro = idioma === "es" ? "en" : "es";
  const ps = palabras(t);
  return ps.filter((w) => PALABRAS[idioma].has(w)).length > ps.filter((w) => PALABRAS[otro].has(w)).length;
}
const mismo = (a, b) => palabras(a).join(" ") === palabras(b).join(" ");
/** Una frase: al menos seis palabras, casi todo letras y espacios, y dos palabras de función (un título o una línea de código no las trae). */
function esProsa(t) {
  const ps = palabras(t);
  const funcion = ps.filter((w) => PALABRAS.es.has(w) || PALABRAS.en.has(w)).length;
  return ps.length >= 6 && funcion >= 2 && (t.match(/[\p{L}\s]/gu) ?? []).length / t.length >= 0.85;
}

const legible = (url) => {
  try {
    return decodeURIComponent(url).toLowerCase();
  } catch {
    return url.toLowerCase();
  }
};
const tituloDe = (html) => html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim();
const correr = (script, carpeta) => spawnSync("node", [join(RAIZ_REPO, script), carpeta], { encoding: "utf8", env: process.env, cwd: RAIZ_REPO });

try {
  const { plataforma, capa, base } = argumentos(process.argv.slice(2));
  const inv = await cargarTs("src/lib/investigador/index.ts");
  const dirBase = carpetaBase(plataforma, base);
  const forma = inv.esquemaPropuesta.safeParse(JSON.parse(readFileSync(join(dirBase, "propuesta.json"), "utf8")));
  if (!forma.success) throw new Error(`la base ${relative(RAIZ, dirBase)} no pasa el esquema; corre antes scripts/investigar/validar.mjs`);
  const b = forma.data;
  if (b.plataforma !== plataforma || b.capa || b.ejecucion.herramienta !== "claude-code")
    throw new Error(`la base ${relative(RAIZ, dirBase)} no es una propuesta de mapa completo de «${plataforma}» escrita por /investigar`);
  const g = gramaticaDe(b.mapa);
  const banda = g.bandas.find((x) => x.id === capa);
  if (!banda) throw new Error(`«${capa}» no es una banda de la gramática ${g.id}`);
  const nodos = b.mapa.nodos.filter((n) => n.banda_id === capa);
  if (!nodos.length) throw new Error(`la base no tiene componentes en la capa «${capa}»`);
  const fecha = hoy("BIGD_FECHA_CONSULTA");
  const carpeta = `propuestas/${fecha}-${plataforma}-${capa}`;
  if (existsSync(join(RAIZ, carpeta))) throw new Error(`${carpeta} ya existe: no se sobrescribe una propuesta`);

  // 1. El modelo, antes de bajar nada: si no está, se dice y no se escribe nada.
  const m = await modelo();
  const d = await m.disponible();
  if (!d.disponible) throw new SinModelo(d.razon);
  const faltan = ["es", "en"].filter((i) => !(d.idiomas ?? []).includes(i));
  if (faltan.length) throw new SinModelo(`el modelo del sistema no trae ${faltan.join(" ni ")}`);

  // 2. Las fuentes de los componentes de la capa, con el mismo curl del verificador; cada lectura queda en el registro.
  const ids = identificadores();
  const urls = [...new Set(nodos.flatMap((n) => n.fuentes.flatMap((f) => (typeof f.url === "string" ? [f.url] : []))))].sort();
  const conId = urls.filter((u) => !u.startsWith("https://") || ids.some((x) => legible(u).includes(x)));
  if (conId.length) throw new Error(`${conId.join(", ")}: no es https o lleva un identificador de quien investiga; no se consulta`);
  const tmp = mkdtempSync(join(tmpdir(), "bigd-sistema-"));
  const registro = join(RAIZ, "propuestas", "registro-de-ejecucion.jsonl");
  const paginas = new Map();
  const saltadas = [];
  for (const url of urls) {
    const r = bajar(url, tmp);
    const fecha_hora = new Date().toISOString();
    appendFileSync(registro, `${JSON.stringify({ fecha_hora, herramienta: "modelo-del-sistema", url, llamada: createHash("sha256").update(`${url} ${fecha_hora}`).digest("hex").slice(0, 16) })}\n`);
    const html = r.cuerpo ? r.cuerpo.toString("utf8") : "";
    const texto = inv.htmlATexto(html).replace(/\s+/g, " ").trim();
    if (r.http !== 200 || texto.length < inv.TEXTO_MINIMO) saltadas.push(`${url} (${r.http === null ? r.motivo : r.http !== 200 ? `HTTP ${r.http}` : "casi sin texto"})`);
    else paginas.set(url, { html, texto, titulo: tituloDe(html) });
  }
  rmSync(tmp, { recursive: true, force: true });

  // 3. Por página y por trozo, el modelo anota; el código acepta solo la cita que está en la página y del componente correcto.
  const propias = new Map();
  const rechazos = [];
  let llamadas = 0;
  for (const [url, pagina] of paginas) {
    const candidatos = nodos.filter((n) => n.fuentes.some((f) => f.url === url));
    // Solo los nombres: con la descripción del mapa a la vista, el modelo la copiaba como enunciado (corrida del 2026-11-12).
    const lista = candidatos.map((n) => `- ${n.id}: ${n.nombre.es} / ${n.nombre.en}`).join("\n");
    for (const trozo of trozos(pagina.texto).slice(0, TROZOS_POR_PAGINA)) {
      llamadas++;
      const hallazgos = await m.generar({
        instrucciones: INSTRUCCIONES,
        prompt: `Plataforma: ${b.mapa.sujeto_nombre.en}. Capa: ${banda.nombre.en}.\nComponentes:\n${lista}\n\nTexto de ${url}:\n${trozo}`,
        componentes: candidatos.map((n) => n.id),
        maximo: 3,
      });
      for (const h of hallazgos) {
        const cita = String(h.cita ?? "").trim();
        const es = String(h.enunciado_es ?? "").trim();
        const en = String(h.enunciado_en ?? "").trim();
        const nodo = candidatos.find((n) => n.id === h.componente);
        const motivo = !nodo
          ? "componente fuera de la lista"
          : cita.length < 40 || cita.length > 600
            ? "cita de menos de 40 o más de 600 caracteres"
            : !esProsa(cita)
              ? "la cita no es una frase (código, título o lista)"
              : !es || !en || es.length > 400 || en.length > 400
                ? "enunciado vacío o largo"
                : [nodo.lider.es, nodo.lider.en, nodo.nombre.es, nodo.nombre.en].some((x) => mismo(x, es) || mismo(x, en))
                  ? "enunciado copiado de la lista, no del texto"
                  : !enIdioma(es, "es") || !enIdioma(en, "en") || mismo(es, en)
                    ? "enunciado que no está en su idioma"
                    : inv.verificarCita(200, pagina.html, cita).resultado !== "verificada"
                      ? "la cita no está en la página"
                      : null;
        if (motivo) rechazos.push({ componente: String(h.componente), url, motivo });
        else if (!propias.has(h.componente)) propias.set(h.componente, { url, cita, es, en, titulo: pagina.titulo });
      }
    }
  }
  if (!propias.size)
    throw new Error(`el modelo no sostuvo ninguna afirmación de la capa con una cita que esté en la página (${rechazos.length} rechazadas, ${paginas.size} páginas, ${llamadas} trozos); no se escribe nada`);

  // 4. La propuesta: las afirmaciones propias primero; de la base, todo lo demás (lo de la capa que el modelo no sostuvo, también).
  const hostDe = (u) => new URL(u).host;
  const coiDe = (url) => b.afirmaciones.find((a) => hostDe(a.cita.url) === hostDe(url))?.cita.conflicto_de_interes ?? COI;
  let k = 0;
  const nuevas = nodos
    .filter((n) => propias.has(n.id))
    .map((n) => {
      const p = propias.get(n.id);
      const fuente = n.fuentes.find((f) => f.url === p.url);
      return { id: `A-${++k}`, sobre: { entidad: "nodo", id: n.id }, enunciado: { es: p.es, en: p.en }, cita: { url: p.url, texto: p.cita, titulo: p.titulo || fuente.titulo.en, tipo: fuente.tipo, conflicto_de_interes: coiDe(p.url) } };
    });
  const traidas = b.afirmaciones.filter((a) => !(a.sobre.entidad === "nodo" && propias.has(a.sobre.id))).map((a) => ({ ...a, id: `A-${++k}` }));
  const propuesta = {
    version: 1,
    plataforma,
    capa,
    fecha,
    ejecucion: { herramienta: "modelo-del-sistema", modelo: MODELO, reintentos: 0, base: relative(RAIZ, dirBase), propias: nuevas.map((a) => a.id) },
    mapa: b.mapa,
    afirmaciones: [...nuevas, ...traidas],
    retiros: [],
    preguntas_guia: b.preguntas_guia,
    sin_novedades: false,
  };
  inv.esquemaPropuesta.parse(propuesta);
  mkdirSync(join(RAIZ, carpeta), { recursive: true });
  const bytes = `${JSON.stringify(propuesta, null, 2)}\n`;
  writeFileSync(join(RAIZ, carpeta, "propuesta.json"), bytes);

  // 5. El mismo validador y el mismo verificador que la skill; la verificación tiene que ser de ESTA propuesta.
  const v = correr("scripts/investigar/validar.mjs", carpeta);
  if (v.status !== 0) {
    writeFileSync(join(RAIZ, carpeta, "error-validacion.json"), `${JSON.stringify({ fallas: v.stderr.trim().split("\n") }, null, 2)}\n`);
    throw new Error(`la propuesta no pasó la validación (queda en ${carpeta}/error-validacion.json):\n${v.stderr.trim()}`);
  }
  const c = correr("scripts/verificar-citas.mjs", carpeta);
  if (c.status !== 0) throw new Error(`verificar-citas falló: ${c.stderr.trim()}`);
  const verif = JSON.parse(readFileSync(join(RAIZ, carpeta, "verificacion.json"), "utf8"));
  if (verif.propuesta_sha256 !== inv.sha256(Buffer.from(bytes))) throw new Error("la verificación no es de esta propuesta");
  const deLasPropias = verif.resultados.filter((r) => propuesta.ejecucion.propias.includes(r.afirmacion));
  const ok = deLasPropias.filter((r) => r.resultado === "verificada").length;
  const porMotivo = Object.entries(Object.groupBy(rechazos, (r) => r.motivo)).map(([mo, xs]) => `${xs.length} ${mo}`);
  console.log(
    `sistema: ${carpeta} · capa ${capa} sobre ${relative(RAIZ, dirBase)} · ${propias.size} de ${nodos.length} componentes con afirmación propia · ` +
      `${ok} de ${deLasPropias.length} citas propias verificadas · ${rechazos.length} rechazadas por el código antes de escribir${porMotivo.length ? ` (${porMotivo.join(", ")})` : ""} · ` +
      `${paginas.size} páginas, ${llamadas} trozos${saltadas.length ? ` · sin leer: ${saltadas.join(", ")}` : ""}`,
  );
  console.log("Nada se aprobó: la revisa una persona en /investigador y aprueba con el comando que arma esa pantalla.");
} catch (e) {
  if (e instanceof SinModelo) {
    console.error(`sistema: el modelo del sistema no está disponible: ${e.message}. No se escribió nada; queda el curador a mano o /investigar.`);
    process.exit(3);
  }
  console.error(`sistema: ${e.message}`);
  process.exit(1);
}
