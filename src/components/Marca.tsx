/** Signo de la marca (dibujado, sin fuente): el mismo de la maqueta. */
export function SignoMarca() {
  return (
    <svg className="marca-signo" viewBox="0 0 22 22" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="20" height="20" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M6 7 H16 M6 11 H13 M6 15 H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
