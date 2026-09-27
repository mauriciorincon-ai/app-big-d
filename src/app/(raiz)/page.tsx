import { SignoMarca } from "@/components/Marca";
import { IDIOMAS, NOMBRE_PROPIO, textos } from "@/lib/i18n";

// Portada: una entrada por idioma, cada una redactada en su idioma. Sin elegir por el navegador:
// el export es estático y la elección es del visitante.
const ENTRAR = { es: "Entrar al atlas", en: "Enter the atlas" } as const;

export default function Portada() {
  return (
    <main className="pagina" id="contenido">
      <div className="encabezado">
        <div>
          <span className="ojo" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <SignoMarca />
            Big-D
          </span>
          {IDIOMAS.map((idioma, i) =>
            i === 0 ? (
              <h1 key={idioma} lang={idioma}>
                {textos(idioma).inicio.titulo}
              </h1>
            ) : (
              <p key={idioma} className="sub" lang={idioma}>
                {textos(idioma).inicio.titulo}
              </p>
            ),
          )}
        </div>
      </div>
      <ul className="entradas">
        {IDIOMAS.map((idioma) => (
          <li key={idioma}>
            <a href={`/${idioma}`} hrefLang={idioma} lang={idioma}>
              <b>{NOMBRE_PROPIO[idioma]}</b>
              <span>{ENTRAR[idioma]}</span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
