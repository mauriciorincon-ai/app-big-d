/**
 * El botón que pide una investigación: un enlace que abre, en otra pestaña, una tarea nueva de GitHub ya escrita
 * (src/lib/investigador/solicitud.ts). No corre nada; la solicitud queda guardada cuando la persona la confirma.
 */
export function Solicitar({ href, texto, nombre, nota, secundario = false }: { href: string; texto: string; nombre?: string; nota?: string; secundario?: boolean }) {
  // En una lista de capas va con contorno: lleno solo cuando es la única acción de la pantalla (el estado vacío).
  return (
    <div className="solicitar">
      <a className={secundario ? "boton boton-sec" : "boton"} href={href} target="_blank" rel="noreferrer noopener" aria-label={nombre}>
        {texto}
      </a>
      {nota && <p className="kit-nota">{nota}</p>}
    </div>
  );
}
