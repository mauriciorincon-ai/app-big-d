// El caso ficticio de la comparación (Hospital Ficticio del Futuro) y TODO lo que se calcula sobre él:
// totales, punto de inversión, salida del empate y robustez por simulación. La comparación (pagina-m3) y el
// informe (m4-informe) leen de aquí: ninguna cifra del caso se escribe a mano en una página.

export const CRIT = [
  { id: "crit-ingesta", corto: ["ingesta", "ingestion"], es: "Ingesta", en: "Ingestion", w: 8, origen: ["equipo de datos", "data team"] },
  { id: "crit-almacenamiento", corto: ["almacenamiento", "storage"], es: "Almacenamiento", en: "Storage", w: 10, esencial: true, origen: ["dirección de TI", "IT management"] },
  { id: "crit-transformacion", corto: ["transformación", "transformation"], es: "Transformación y orquestación", en: "Transformation and orchestration", w: 12, origen: ["equipo de datos", "data team"] },
  { id: "crit-gobierno", corto: ["gobierno", "governance"], es: "Gobierno y seguridad", en: "Governance and security", w: 25, esencial: true, origen: ["comité clínico", "clinical committee"] },
  { id: "crit-consumo", corto: ["consumo", "consumption"], es: "Consumo", en: "Consumption", w: 10, origen: ["gerencia", "management"] },
  { id: "crit-ia", corto: ["IA", "AI"], es: "Inteligencia artificial", en: "Artificial intelligence", w: 5, origen: ["dirección de TI", "IT management"] },
  { id: "crit-costo", corto: ["costo", "cost"], es: "Costo previsible", en: "Predictable cost", w: 12, origen: ["dirección financiera", "finance"] },
  { id: "crit-cumplimiento", corto: ["cumplimiento", "compliance"], es: "Cumplimiento y residencia de datos", en: "Compliance and data residency", w: 8, esencial: true, origen: ["jurídica", "legal"] },
  { id: "crit-equipo", corto: ["equipo", "team"], es: "Equipo y habilidades", en: "Team and skills", w: 5, origen: ["equipo de datos", "data team"] },
  { id: "crit-apertura", corto: ["apertura", "openness"], es: "Apertura y portabilidad", en: "Openness and portability", w: 3, origen: ["dirección de TI", "IT management"] },
  { id: "crit-operacion", corto: ["operación", "operations"], es: "Operación y soporte", en: "Operation and support", w: 2, origen: ["equipo de datos", "data team"] },
];
export const W = CRIT.map((c) => c.w);
/** Rango de incertidumbre declarado en el perfil: ±20 % del peso, en enteros (lo que muestra la pantalla 07). */
export const RANGO = W.map((w) => [Math.round(w * 0.8), Math.round(w * 1.2)]);
// Plataformas que llegan a la comparación: Este quedó fuera por una restricción del perfil. N sale del dato.
export const PL = [
  { id: "ejemplo", es: "Plataforma Ejemplo (ficticia)", en: "Example Platform (fictional)", s: [3, 4, 3, 3, 3, 2, 3, 3, 2, 4, 3] },
  { id: "norte", es: "Plataforma Norte (ficticia)", en: "North Platform (fictional)", s: [4, 3, 3, 4, 3, 0, 3, 3, 3, 2, 3] },
  { id: "sur", es: "Plataforma Sur (ficticia)", en: "South Platform (fictional)", s: [3, 3, 4, 2, 2, 1, 2, 3, 3, 3, 3] },
];
/** Evidencia limitante por plataforma: [criterio, texto ES, texto EN, nota corta opcional]. */
export const LIMITANTE = { ejemplo: [5, "Agente de datos en vista previa: tope por madurez ≤ 2", "Data agent in preview: maturity cap ≤ 2", ["tope por madurez", "maturity cap"]], norte: [5, "Sin capacidad de IA en el mapa: 0", "No AI capability on the map: 0"], sur: [3, "Gobierno: máscaras sin auditoría", "Governance: masks without audit"] };
const NUMS = { es: ["cero", "una", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce"], en: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"] };
/** Cantidad en palabras (hasta doce), para que ningún texto diga «tres» cuando el dato dice N. */
export const enPalabras = (k, l) => NUMS[l][k] ?? String(k);
export const ESENCIALES = CRIT.map((c, i) => (c.esencial ? i : -1)).filter((i) => i >= 0);
export const K = 3; // criterio que se mueve en la sensibilidad: gobierno y seguridad
export const MARGEN_EMPATE = 5;
export const UMBRAL = { solida: 70, moderada: 50 };
export const total = (s, w = W) => s.reduce((a, x, i) => a + w[i] * x, 0) / 4;
export const minEs = (s) => Math.min(...ESENCIALES.map((i) => s[i]));
const m = (s) => { let a = 0, b = 0; W.forEach((w, i) => { if (i !== K) { a += w * s[i]; b += w; } }); return a / b; };
export const Tk = (s, t) => (t * s[K] + (100 - t) * m(s)) / 4;
const e = PL.find((p) => p.id === "ejemplo"), n = PL.find((p) => p.id === "norte");
/** Punto de inversión por fórmula cerrada (C § 1.3): peso de gobierno en que Ejemplo y Norte empatan. */
export const tInv = (100 * (m(n.s) - m(e.s))) / ((e.s[K] - n.s[K]) - (m(e.s) - m(n.s)));
export let tEmpateSale = null;
for (let t = 0; t <= 50; t += 0.1) { if (Math.abs(Tk(e.s, t) - Tk(n.s, t)) >= MARGEN_EMPATE) { tEmpateSale = t; break; } }
export const T = Object.fromEntries(PL.map((p) => [p.id, total(p.s)]));
export const ORDEN = [...PL].sort((a, b) => T[b.id] - T[a.id]);
export const EMPATE = T[ORDEN[0].id] - T[ORDEN[1].id] < MARGEN_EMPATE;

// ── Robustez por simulación (SMAA) ─────────────────────────────────────────────────────────────────
// sfc32 con semilla; pesos UNIFORMES sobre el politopo {Σw = 100, lo ≤ w ≤ hi}: los mínimos se fijan por
// transformación (w = lo + x, con x uniforme en el símplex de lado 100 − Σlo, por espaciados de uniformes
// ordenadas: sin logaritmos ni normalizar uniformes independientes) y los máximos por rechazo.
function sfc32(semilla) {
  let a = semilla >>> 0, b = 0x9e3779b9, c = 0x243f6a88, d = 0xb7e15162;
  const sig = () => { const t = (((a + b) | 0) + d) | 0; d = (d + 1) | 0; a = b ^ (b >>> 9); b = (c + (c << 3)) | 0; c = (c << 21) | (c >>> 11); c = (c + t) | 0; return (t >>> 0) / 4294967296; };
  for (let i = 0; i < 15; i++) sig();
  return sig;
}
export const ITERACIONES = 10000;
export const SEMILLA = 20260926;
export function simular(semilla = SEMILLA, iter = ITERACIONES) {
  const azar = sfc32(semilla);
  const libres = RANGO.map((r, i) => (r[1] > r[0] ? i : -1)).filter((i) => i >= 0);
  const holgura = 100 - RANGO.reduce((a, r) => a + r[0], 0);
  const N = PL.length;
  const acept = Object.fromEntries(PL.map((p) => [p.id, new Array(N).fill(0)]));
  const suma1 = Object.fromEntries(PL.map((p) => [p.id, new Array(W.length).fill(0)]));
  const cuenta1 = Object.fromEntries(PL.map((p) => [p.id, 0]));
  let empates = 0, intentos = 0, ok = 0;
  while (ok < iter) {
    intentos++;
    const u = libres.slice(1).map(() => azar()).sort((x, y) => x - y);
    const cortes = [0, ...u, 1];
    const w = RANGO.map((r) => r[0]);
    let dentro = true;
    libres.forEach((i, j) => { w[i] += (cortes[j + 1] - cortes[j]) * holgura; if (w[i] > RANGO[i][1]) dentro = false; });
    if (!dentro) continue;
    ok++;
    const tot = PL.map((p) => ({ id: p.id, t: total(p.s, w) })).sort((x, y) => y.t - x.t);
    // empates exactos: el puesto se reparte 1/k entre los k empatados
    for (let r = 0; r < N;) {
      let k = 1; while (r + k < N && tot[r + k].t === tot[r].t) k++;
      for (let q = r; q < r + k; q++) for (let z = r; z < r + k; z++) acept[tot[q].id][z] += 1 / k;
      r += k;
    }
    cuenta1[tot[0].id]++;
    w.forEach((x, i) => { suma1[tot[0].id][i] += x; });
    if (tot[0].t - tot[1].t < MARGEN_EMPATE) empates++;
  }
  const pct = (x) => (100 * x) / iter;
  const res = {
    semilla, iter, intentos,
    acept: Object.fromEntries(PL.map((p) => [p.id, acept[p.id].map(pct)])),
    empate: pct(empates),
    central: Object.fromEntries(PL.map((p) => [p.id, cuenta1[p.id] ? suma1[p.id].map((x) => x / cuenta1[p.id]) : null])),
    ganadas: cuenta1,
  };
  const lider = [...PL].sort((a, b) => res.acept[b.id][0] - res.acept[a.id][0])[0].id;
  const p1 = res.acept[lider][0] / 100;
  res.lider = lider;
  res.ic = 1.96 * Math.sqrt((p1 * (1 - p1)) / iter) * 100; // semiamplitud del intervalo de 95 %, en puntos
  res.clase = res.acept[lider][0] >= UMBRAL.solida ? "solida" : res.acept[lider][0] >= UMBRAL.moderada ? "moderada" : "fragil";
  res.frontera = [UMBRAL.solida, UMBRAL.moderada].some((u) => Math.abs(res.acept[lider][0] - u) < res.ic);
  return res;
}
export const ROB = simular();
export const ROB_OTRAS = [1, 2, 3].map((k) => simular(SEMILLA + k));
export const MISMA_CLASE = ROB_OTRAS.every((r) => r.clase === ROB.clase && r.lider === ROB.lider);
/** Redondea un vector de pesos a enteros que suman 100 (mayor resto). */
export function enteros100(v) {
  const piso = v.map(Math.floor); let falta = 100 - piso.reduce((a, b) => a + b, 0);
  const orden = v.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, i] of orden) { if (falta <= 0) break; piso[i]++; falta--; }
  return piso;
}
