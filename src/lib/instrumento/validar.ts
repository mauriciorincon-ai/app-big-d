// La validación del instrumento (C15, S4): corre los casos de referencia, las propiedades con semilla, los errores sembrados y la
// integridad de lo aprobado sobre la base que se va a publicar, y devuelve el resultado SIN hora (la misma base, el mismo
// archivo). La llama scripts/instrumento/validar.mjs al inicio de `pnpm build` y sale ≠ 0 si algo no pasa: sin validación en
// verde no hay `out/` (RF-09.4). Solo Node.
import { resumenesIlegibles } from "@/lib/informe/legible";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CASOS_DE_REFERENCIA,
  correrReferencia,
  type Bilingue,
  type FilaValidacion,
  type Resumen,
  type Validacion,
} from "@/engine";
import {
  cargarConocimiento,
  type Conocimiento,
} from "@/lib/datos/cargar-conocimiento";
import { cargarDatos, type Datos } from "@/lib/datos";
import { sha256 } from "@/lib/datos/instantanea";
import {
  casosSinAprobacion,
  planesSinAprobacion,
  evidenciasSinAprobacion,
  instantaneasSinAprobacion,
  mapasSinAprobacion,
} from "@/lib/investigador/aprobados";
import { PROPIEDADES, SEMILLA } from "./propiedades";
import { sembrados } from "./sembrados";

const primeraLinea = (e: unknown) =>
  (e instanceof Error ? e.message : String(e)).split("\n")[0]!;
const dos = (es: string, en = es): Bilingue => ({ es, en });

/** El resumen de un resultado de referencia, en una línea: «ganadora-clara ref-b», «no-evaluable falta-evidencia»… */
function texto(r: Resumen): string {
  const base = r.veredicto
    ? `${r.veredicto.tipo}: ${r.veredicto.plataformas.join(", ")}`
    : `${r.tipo}: ${(r.motivos ?? []).join(", ")}`;
  return r.celda
    ? `${base} · ${r.celda.plataforma_id}/${r.celda.criterio_id} = ${r.celda.puntaje}`
    : base;
}

/** Una fila por comprobación de integridad: «las fallas que devuelve la función» → pasa si no hay ninguna. */
function integridad(
  id: string,
  es: string,
  en: string,
  fallas: () => string[],
): FilaValidacion {
  try {
    const f = fallas();
    return {
      id,
      descripcion: dos(es, en),
      ok: f.length === 0,
      detalle: f.length ? dos(f[0]!) : dos("ninguna falla", "no failures"),
    };
  } catch (e) {
    return {
      id,
      descripcion: dos(es, en),
      ok: false,
      detalle: dos(primeraLinea(e)),
    };
  }
}

/** Valida la base de `dir` (data/ del repo o la perilla BIGD_DATOS); `raiz` es la raíz del repo (gramática y métricas). */
export function validar({
  dir,
  raiz,
}: {
  dir: string;
  raiz: string;
}): Validacion {
  const aprobaciones: FilaValidacion[] = [];
  let k: Conocimiento | undefined;
  let d: Datos | undefined;
  try {
    k = cargarConocimiento(dir);
    aprobaciones.push({
      id: "base-carga",
      descripcion: dos(
        "La base de conocimiento carga completa",
        "The knowledge base loads in full",
      ),
      ok: true,
      detalle: dos("sin fallas", "no failures"),
    });
  } catch (e) {
    aprobaciones.push({
      id: "base-carga",
      descripcion: dos(
        "La base de conocimiento carga completa",
        "The knowledge base loads in full",
      ),
      ok: false,
      detalle: dos(primeraLinea(e)),
    });
  }
  try {
    d = cargarDatos(dir, raiz);
    aprobaciones.push({
      id: "mapas-cargan",
      descripcion: dos(
        "Los mapas de las plataformas cargan y validan",
        "The platform maps load and validate",
      ),
      ok: true,
      detalle: dos("sin fallas", "no failures"),
    });
  } catch (e) {
    aprobaciones.push({
      id: "mapas-cargan",
      descripcion: dos(
        "Los mapas de las plataformas cargan y validan",
        "The platform maps load and validate",
      ),
      ok: false,
      detalle: dos(primeraLinea(e)),
    });
  }
  aprobaciones.push(
    integridad(
      "evidencias-aprobadas",
      "Cada evidencia es la que aprobó una persona",
      "Each piece of evidence is the one a person approved",
      () => evidenciasSinAprobacion(dir),
    ),
    integridad(
      "instantaneas-aprobadas",
      "Cada instantánea congela solo lo aprobado",
      "Each snapshot freezes only what was approved",
      () => instantaneasSinAprobacion(dir),
    ),
    integridad(
      "casos-aprobados",
      "Cada perfil aprobado es el que aprobó una persona",
      "Each approved profile is the one a person approved",
      () => casosSinAprobacion(dir),
    ),
    integridad(
      "planes-aprobados",
      "Cada plan aprobado es el que aprobó una persona",
      "Each approved plan is the one a person approved",
      () => planesSinAprobacion(dir),
    ),
    integridad(
      "mapas-aprobados",
      "Cada mapa es el que aprobó una persona",
      "Each map is the one a person approved",
      () => (d ? mapasSinAprobacion(d, dir) : ["los mapas no cargaron"]),
    ),
    // S6 (E-13, regla dura 11): el resumen de cada informe se lee dentro del presupuesto, en los dos idiomas.
    integridad(
      "informe-legible",
      "El resumen de cada informe se lee dentro del presupuesto, en los dos idiomas",
      "Each report summary reads within the budget, in both languages",
      () => (k ? resumenesIlegibles(k) : ["la base no cargó"]),
    ),
  );

  const referencias: FilaValidacion[] = CASOS_DE_REFERENCIA.map((c) => {
    const { obtenido, ok } = correrReferencia(c);
    return {
      id: c.id,
      descripcion: c.descripcion,
      ok,
      detalle: dos(
        `esperado: ${texto(c.esperado)} · obtenido: ${texto(obtenido)}`,
        `expected: ${texto(c.esperado)} · obtained: ${texto(obtenido)}`,
      ),
    };
  });

  const propiedades = PROPIEDADES.map((p) => {
    try {
      p.correr();
      return {
        id: p.id,
        descripcion: p.descripcion,
        ok: true,
        detalle: dos(
          `${p.corridas} casos generados · semilla ${SEMILLA}`,
          `${p.corridas} generated cases · seed ${SEMILLA}`,
        ),
        corridas: p.corridas,
        semilla: SEMILLA,
      };
    } catch (e) {
      return {
        id: p.id,
        descripcion: p.descripcion,
        ok: false,
        detalle: dos(primeraLinea(e)),
        corridas: p.corridas,
        semilla: SEMILLA,
      };
    }
  });

  const sembradas: FilaValidacion[] = sembrados({ dir, caso: k?.casos[0] }).map(
    (s) => {
      try {
        const limpio = s.limpio();
        if (limpio !== null)
          return {
            id: s.id,
            descripcion: s.descripcion,
            ok: false,
            detalle: dos(
              `no detectado: con el dato limpio ya da alarma (${limpio}) · ${s.referencia}`,
              `not detected: the clean data already raises an alarm (${limpio}) · ${s.referencia}`,
            ),
          };
        const alarma = s.sembrado();
        return alarma === null
          ? {
              id: s.id,
              descripcion: s.descripcion,
              ok: false,
              detalle: dos(
                `no detectado · ${s.referencia}`,
                `not detected · ${s.referencia}`,
              ),
            }
          : {
              id: s.id,
              descripcion: s.descripcion,
              ok: true,
              detalle: dos(
                `detectado · ${s.referencia}`,
                `detected · ${s.referencia}`,
              ),
            };
      } catch (e) {
        return {
          id: s.id,
          descripcion: s.descripcion,
          ok: false,
          detalle: dos(
            `no se pudo sembrar: ${primeraLinea(e)}`,
            `could not seed: ${primeraLinea(e)}`,
          ),
        };
      }
    },
  );

  const sumas = join(raiz, "tests/determinismo/NUCLEO.SHA256SUMS");
  return {
    version: 1,
    base: {
      casos: k?.casos.map((c) => c.id) ?? [],
      instantaneas: k?.instantaneas.map((i) => i.version) ?? [],
      evidencias: k?.evidencias.length ?? 0,
    },
    referencias,
    propiedades,
    sembrados: sembradas,
    aprobaciones,
    huellaNucleo: existsSync(sumas)
      ? sha256(readFileSync(sumas, "utf8"))
      : null,
  };
}
