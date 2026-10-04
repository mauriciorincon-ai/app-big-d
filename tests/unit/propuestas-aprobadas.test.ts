// @vitest-environment node
// S2-AUD-34: las afirmaciones, sus citas y su `conflicto_de_interes` solo viven en propuestas/<carpeta>/. Cada
// revisión de data/revisiones/ nombra la propuesta que una persona aprobó; aquí se comprueba que esa propuesta
// sigue siendo la aprobada: existe, su verificación es de ESTOS bytes, cada id decidido es una afirmación suya y,
// sin rechazos, el mapa de esa versión es el de la propuesta (salvo lo que la aprobación reescribe). La prueba no
// llama al núcleo de la aprobación: lee los archivos.
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { canonico } from "@/lib/investigador/canonico";
import { esquemaRevision } from "@/lib/investigador/esquema";

interface MapaCrudo {
  version: string;
  nodos: Record<string, unknown>[];
  [k: string]: unknown;
}

/** Lo que la aprobación reescribe (src/lib/investigador/aprobar.ts): estado, versión y fechas. */
const sinReescrito = (m: MapaCrudo) => ({
  ...m,
  estado: undefined,
  version: undefined,
  fecha_actualizacion: undefined,
  nodos: m.nodos.map((n) => ({ ...n, fecha_verificacion: undefined })),
});

/** Las fallas de respaldo de cada revisión de una plataforma real, sobre la raíz `raiz` (el repo o una copia). */
function sinRespaldo(raiz: string): string[] {
  const fallas: string[] = [];
  const dir = join(raiz, "data/revisiones");
  for (const f of readdirSync(dir)
    .filter((x) => x.endsWith(".jsonl"))
    .sort()) {
    const id = f.replace(/\.jsonl$/, "");
    if (
      (
        parse(
          readFileSync(join(raiz, "data/plataformas", `${id}.yaml`), "utf8"),
        ) as { ficticia: boolean }
      ).ficticia
    )
      continue;
    for (const linea of readFileSync(join(dir, f), "utf8")
      .split("\n")
      .filter(Boolean)) {
      const r = esquemaRevision.parse(JSON.parse(linea));
      const donde = `${f} · ${r.propuesta}`;
      const carpeta = join(raiz, r.propuesta);
      if (!existsSync(join(carpeta, "propuesta.json"))) {
        fallas.push(`${donde} · la propuesta no existe`);
        continue;
      }
      const bytes = readFileSync(join(carpeta, "propuesta.json"));
      const verif = JSON.parse(
        readFileSync(join(carpeta, "verificacion.json"), "utf8"),
      ) as { propuesta_sha256: string };
      if (
        verif.propuesta_sha256 !==
        createHash("sha256").update(bytes).digest("hex")
      )
        fallas.push(
          `${donde} · la verificación es de otros bytes: la propuesta cambió después de aprobarse`,
        );
      const p = JSON.parse(bytes.toString("utf8")) as {
        afirmaciones: { id: string }[];
        mapa: MapaCrudo;
      };
      const ids = new Set(p.afirmaciones.map((a) => a.id));
      for (const x of [...r.aprobadas, ...r.rechazadas])
        if (!ids.has(x))
          fallas.push(`${donde} · ${x} no es una afirmación de la propuesta`);
      if (r.rechazadas.length || r.resultado !== "aprobada") continue;
      const vigente = join(raiz, "data/mapas", `${id}.mapa.yaml`);
      const archivada = join(
        raiz,
        "data/mapas/versiones",
        `${id}-${r.mapa_version}.mapa.yaml`,
      );
      const actual = parse(readFileSync(vigente, "utf8")) as MapaCrudo;
      const mapa =
        actual.version === r.mapa_version
          ? actual
          : existsSync(archivada)
            ? (parse(readFileSync(archivada, "utf8")) as MapaCrudo)
            : undefined;
      if (!mapa)
        fallas.push(`${donde} · no hay mapa de la versión ${r.mapa_version}`);
      else if (canonico(sinReescrito(mapa)) !== canonico(sinReescrito(p.mapa)))
        fallas.push(
          `${donde} · el mapa de la versión ${r.mapa_version} no es el de la propuesta`,
        );
    }
  }
  return fallas;
}

describe("cada revisión apunta a la propuesta que se aprobó", () => {
  it("hay revisiones de plataformas reales, y todas tienen respaldo", () => {
    expect(
      readdirSync("data/revisiones").filter((f) => f.endsWith(".jsonl")).length,
    ).toBeGreaterThan(0);
    expect(sinRespaldo(".")).toEqual([]);
  });
  it("un carácter cambiado en una cita de una propuesta aprobada lo rompe", () => {
    const copia = mkdtempSync(join(tmpdir(), "bigd-propuestas-"));
    try {
      cpSync("data", join(copia, "data"), { recursive: true });
      cpSync("propuestas", join(copia, "propuestas"), { recursive: true });
      const r = esquemaRevision.parse(
        JSON.parse(
          readFileSync("data/revisiones/fabric.jsonl", "utf8")
            .trim()
            .split("\n")
            .at(-1)!,
        ),
      );
      const ruta = join(copia, r.propuesta, "propuesta.json");
      const texto = readFileSync(ruta, "utf8");
      const i = texto.indexOf('"texto": "') + '"texto": "'.length;
      writeFileSync(ruta, `${texto.slice(0, i)}X${texto.slice(i + 1)}`);
      expect(sinRespaldo(copia)).toEqual([
        `fabric.jsonl · ${r.propuesta} · la verificación es de otros bytes: la propuesta cambió después de aprobarse`,
      ]);
    } finally {
      rmSync(copia, { recursive: true, force: true });
    }
  });
});
