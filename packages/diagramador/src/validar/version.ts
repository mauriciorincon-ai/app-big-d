// Compatibilidad de versiones (G1, V1). En 0.x cada versión menor puede romper (semver § 4): exige la misma
// mayor y la misma menor. Desde 1.0.0, la misma mayor y una menor no posterior a la de referencia.
export function compatible(pedida: string, referencia: string): boolean {
  const [pM, pm] = pedida.split(".").map(Number);
  const [rM, rm] = referencia.split(".").map(Number);
  if (pM !== rM) return false;
  return rM === 0 ? pm === rm : (pm ?? 0) <= (rm ?? 0);
}
