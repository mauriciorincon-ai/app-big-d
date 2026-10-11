// Glifos, marcadores y marcas (CONTRATO § 5.4, D13): paths, nunca caracteres. Pintan con `currentColor`;
// el color lo pone la clase del uso. Glifos en caja de 16 u; marcadores y marcas en caja de 12 u.
import type { Glifo, Marcador } from "../tipos";

/**
 * Los glifos del contrato. Los de `OPCIONALES` (los que entraron después de los golden del piloto: `hexagono`, 0.5.0)
 * van al `<defs>` solo del SVG que los usa, al final: así el `<defs>` de los demás SVG no cambia de bytes (S3, fase 0).
 */
export const GLIFOS: Record<Glifo, { d: string; trazo?: string }> = {
  triangulo: { d: "M0,-7.5 L7.5,6 L-7.5,6 Z" },
  cuadrado: { d: "M-6.5,-6.5 H6.5 V6.5 H-6.5 Z" },
  rombo: { d: "M0,-8 L8,0 L0,8 L-8,0 Z" },
  escudo: { d: "M0,-7.5 L6.5,-5 V0 C6.5,4 3.5,6.3 0,7.8 C-3.5,6.3 -6.5,4 -6.5,0 V-5 Z" },
  circulo: { d: "M0,-7 A7,7 0 1 1 0,7 A7,7 0 1 1 0,-7 Z" },
  estrella: { d: "M0.0,-8.2 L2.1,-2.8 L7.8,-2.5 L3.3,1.1 L4.8,6.6 L0.0,3.5 L-4.8,6.6 L-3.3,1.1 L-7.8,-2.5 L-2.1,-2.8 Z" },
  anillo: { d: "M0,-6 A6,6 0 1 1 0,6 A6,6 0 1 1 0,-6 Z", trazo: "2.6" },
  barras: { d: "M-7.5,2 H-4 V7.5 H-7.5 Z M-1.75,-2.5 H1.75 V7.5 H-1.75 Z M4,-7.5 H7.5 V7.5 H4 Z" },
  // § 5.4 (0.5.0): vuelve para una gramática del contrato; lleno, a 16 u y siempre con su etiqueta corta.
  hexagono: { d: "M0,-8 L6.9,-4 L6.9,4 L0,8 L-6.9,4 L-6.9,-4 Z" },
};

/** Ids de `<defs>` que solo se emiten si la escena los usa (ver `GLIFOS` y `PAPELES`). */
export const OPCIONALES: ReadonlySet<string> = new Set(["g-hexagono", "p-inicio", "p-fin"]);

/**
 * Marcadores de `papel` (0.5.0, § 3.3: «el motor dibuja el marcador de entrada o salida junto a la tarjeta»). § 5.4 no
 * trae sus paths: el piloto propone los de un diagrama de estados —inicio, un disco lleno; fin, un disco dentro de un
 * anillo—, en caja de 12 u (va a «Enmiendas»).
 */
export const PAPELES: Record<"inicio" | "fin", { d: string }> = {
  inicio: { d: "M0,-5 A5,5 0 1 1 0,5 A5,5 0 1 1 0,-5 Z" },
  // Anillo (el círculo de adentro gira al revés: regla nonzero, sin `fill-rule`) y un disco en el centro.
  fin: {
    d: "M0,-5.5 A5.5,5.5 0 1 1 0,5.5 A5.5,5.5 0 1 1 0,-5.5 Z M0,-3.9 A3.9,3.9 0 1 0 0,3.9 A3.9,3.9 0 1 0 0,-3.9 Z M0,-2.3 A2.3,2.3 0 1 1 0,2.3 A2.3,2.3 0 1 1 0,-2.3 Z",
  },
};

/** `cuadros` es mixto (dos cuadros llenos y una base): relleno + trazo fino; los demás, solo trazo. */
export const MARCADORES: Record<Exclude<Marcador, "ninguno">, { d: string; mixto?: boolean }> = {
  cuadros: { d: "M-5.5,-2.5 H-1.5 V1.5 H-5.5 Z M1.5,-2.5 H5.5 V1.5 H1.5 Z M-5.5,3.5 H5.5", mixto: true },
  onda: { d: "M-6,0 C-4.5,-4.5 -1.5,-4.5 0,0 S4.5,4.5 6,0" },
  "ida-y-vuelta": { d: "M-5.5,-2.5 H4 M1.5,-5 L4.5,-2.5 L1.5,0 M5.5,2.5 H-4 M-1.5,0 L-4.5,2.5 L-1.5,5" },
  enlace: { d: "M-1.2,-3 H-3.5 A3,3 0 0 0 -3.5,3 H-1.2 M1.2,-3 H3.5 A3,3 0 0 1 3.5,3 H1.2 M-2.5,0 H2.5" },
};

/**
 * Marcas de estado. `envia`/`recibe` son las flechas → y ← de § 5.4 (0.4.0 resolvió D-S1-19 a favor del path
 * horizontal; la maqueta dibujaba ↑/↓ y el S1 la siguió).
 * `revisar` es un triángulo de precaución con «!» adentro (pedido de la persona al mirar el atlas envejecido,
 * 2026-09-30); el contrato dibuja el «!» solo. Sale de la caja de 12 u (14 × 13 u con el trazo) y cabe en la
 * insignia de 20 u de alto sin mover nada. Enmienda propuesta en el summary del S1 (D-S1-55).
 */
export const MARCAS: Record<string, { d: string; trazo: string }> = {
  vigente: { d: "M-4.5,0.5 L-1.5,3.5 L4.5,-3.5", trazo: "1.8" },
  revisar: { d: "M0,-6.6 L6.8,5 H-6.8 Z M0,-2.3 V0.8 M0,3.05 V3.15", trazo: "1.6" },
  vencido: { d: "M-3.8,-3.8 L3.8,3.8 M3.8,-3.8 L-3.8,3.8", trazo: "1.8" },
  envia: { d: "M-5,0 H4 M1,-3.5 L4.5,0 L1,3.5", trazo: "1.8" },
  recibe: { d: "M5,0 H-4 M-1,-3.5 L-4.5,0 L-1,3.5", trazo: "1.8" },
  doc: { d: "M-4,-5.5 H2 L4.5,-3 V5.5 H-4 Z M-1.5,-1 H2 M-1.5,2 H2", trazo: "1.3" },
  rama: { d: "M-5,-3 H5 M-5,3 H5 M1.5,-6 L5,-3 L1.5,0 M1.5,0 L5,3 L1.5,6", trazo: "1.6" },
};

/**
 * Marcas de diferencia (§ 4.7): + nuevo, − retirado, → renombrado, ▮ madurez, con los paths de § 5.4 (desde la 0.6.0;
 * antes, los de la maqueta aprobada). Solo las lleva el lado a lado, así el `<defs>` de las demás vistas no cambia.
 */
export const DIFERENCIAS: Record<string, { d: string; trazo: string }> = {
  nuevo: { d: "M0,-4.5 V4.5 M-4.5,0 H4.5", trazo: "2" },
  retirado: { d: "M-4.5,0 H4.5", trazo: "2" },
  renombrado: { d: "M-5,0 H4 M1,-3.5 L4.5,0 L1,3.5", trazo: "1.8" },
  madurez: { d: "M-3.5,4.5 V-1 M0,4.5 V-4.5 M3.5,4.5 V1.5", trazo: "2" },
};
