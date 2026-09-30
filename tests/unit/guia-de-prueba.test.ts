import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// La guía de prueba viva y acumulativa (regla 11 del CLAUDE.md) tiene reglas que un sprint apurado rompe sin
// verlo: cada prueba con su origen visible, ids únicos (la casilla se guarda por id), el ⭐⭐ como subconjunto del ⭐
// y caminable (paradas 1..K en el orden del documento), la cabecera que dice los mismos conteos que los filtros,
// «Empieza en:» en cada bloque, el prefijo de localStorage versionado y cero URL de despliegue (regla 17).
const GUIA = readFileSync("docs/GUIA-DE-PRUEBA.html", "utf8");
const pruebas = [...GUIA.matchAll(/<li (data-origen="[^"]*"[^>]*)>([\s\S]*?)<\/li>/g)].map(([, attrs, cuerpo]) => ({
  attrs: attrs!,
  cuerpo: cuerpo!,
  id: /id="([^"]+)"/.exec(cuerpo!)?.[1],
  origen: /data-origen="([^"]*)"/.exec(attrs!)![1],
  minimo: /\sdata-minimo\b/.test(attrs!),
  corto: /\sdata-corto\b/.test(attrs!),
}));
const CHIP: Record<string, RegExp> = { nuevo: /origen-nuevo">Nuevo · S\d+</, mejorado: /origen-mejorado">Mejorado en S\d+</, heredada: /origen-heredada">S\d+</ };

describe("guía de prueba (docs/GUIA-DE-PRUEBA.html)", () => {
  it("cada prueba tiene origen válido, su chip visible y un id único", () => {
    expect(pruebas.length).toBeGreaterThan(0);
    for (const p of pruebas) expect(p.cuerpo, p.id).toMatch(CHIP[p.origen] ?? /origen desconocido/);
    const ids = pruebas.map((p) => p.id);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("el ⭐⭐ es subconjunto del ⭐ y se camina: «Parada n de K» en orden, K = las del filtro", () => {
    const cortas = pruebas.filter((p) => p.corto);
    expect(cortas.every((p) => p.minimo)).toBe(true);
    const paradas = cortas.map((p) => /⭐⭐ Parada (\d+) de (\d+)/.exec(p.cuerpo));
    expect(paradas.map((m) => Number(m?.[1]))).toEqual(cortas.map((_, i) => i + 1));
    expect(new Set(paradas.map((m) => Number(m?.[2])))).toEqual(new Set([cortas.length]));
    for (const p of pruebas) expect(p.cuerpo.includes("⭐ mínimo"), p.id).toBe(p.minimo);
  });

  it("la cabecera dice los mismos conteos que los filtros, y cuántas ⭐ deja fuera el ⭐⭐", () => {
    const minimas = pruebas.filter((p) => p.minimo).length;
    const cortas = pruebas.filter((p) => p.corto).length;
    expect(GUIA).toContain(`Gate corto ⭐⭐: ${cortas} paradas`);
    expect(GUIA).toContain(`Gate mínimo ⭐: ${minimas} pruebas`);
    expect(GUIA).toMatch(new RegExp(`Deja fuera ${minimas - cortas} prueba`));
  });

  it("cada bloque abre con «Empieza en:»", () => {
    const bloques = GUIA.split('<section class="bloque">').slice(1);
    expect(bloques.length).toBeGreaterThan(0);
    for (const b of bloques) expect(b).toMatch(/<p class="meta-bloque[^"]*"><strong>Empieza en:<\/strong>/);
  });

  it("autocontenida, con prefijo versionado por sprint y sin URL de despliegue", () => {
    expect(GUIA).toMatch(/var NS = "bigd-s\d+-";/);
    expect(GUIA).not.toMatch(/<(?:script|link)[^>]+(?:src|href)=/i);
    expect(GUIA).not.toMatch(/vercel[.]app|workers[.]dev|pages[.]dev/);
    const urls = [...GUIA.matchAll(/https?:\/\/[^\s"'<)]+/g)].map((m) => m[0]);
    expect(urls.filter((u) => !/^http:\/\/localhost:\d+$/.test(u))).toEqual([]);
  });
});
