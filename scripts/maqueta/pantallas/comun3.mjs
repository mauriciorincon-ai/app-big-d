// Cromo común de las páginas del atlas (mirada 2): barra, encabezado, niveles, pie.
export const ES = (es, en) => `<span lang="es">${es}</span><span lang="en">${en}</span>`;
export const CHEVRON = `<svg viewBox="-6 -6 12 12" width="12" height="12" aria-hidden="true"><path d="M-4,-1.5 L0,2.5 L4,-1.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export const OK = `<svg viewBox="-8 -8 16 16" width="14" height="14" aria-hidden="true"><circle r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M-3.2,0.3 L-1,2.6 L3.4,-2.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export const head = (titulo, extra = "") => `<!doctype html>
<html lang="es" data-theme="oscuro" data-lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title data-es="Big-D · Atlas · ${titulo.es}" data-en="Big-D · Atlas · ${titulo.en}">Big-D · Atlas · ${titulo.es}</title>
<link rel="stylesheet" href="assets/fuentes.css">
<link rel="stylesheet" href="assets/tokens.css">
<link rel="stylesheet" href="assets/bigd.css">
<link rel="stylesheet" href="assets/diagrama.css">
${extra}<link rel="stylesheet" href="assets/maqueta.css">
<script src="assets/maqueta.js" defer></script>
<script src="assets/lienzo.js" defer></script>
</head>`;
export const barra = (pagina) => `<header class="barra">
  <a class="marca" href="index.html"><svg class="marca-signo" viewBox="0 0 22 22" aria-hidden="true"><rect x="1" y="1" width="20" height="20" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 7 H16 M6 11 H13 M6 15 H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Big-D <span class="marca-sello">ATLAS</span></a>
  <ul class="nav" aria-label="Secciones">
    <li><a href="atlas-nivel-1.html"${pagina.startsWith("atlas") || pagina === "lado" ? ' aria-current="page"' : ""}>Atlas</a></li>
    <li><a href="investigador.html"${pagina === "conocimiento" ? ' aria-current="page"' : ""}>${ES("Conocimiento", "Knowledge")}</a></li>
    <li><a href="perfil.html"${pagina === "caso" ? ' aria-current="page"' : ""}>${ES("Caso", "Case")}</a></li>
    <li><a href="instrumento.html"${pagina === "instrumento" ? ' aria-current="page"' : ""}>${ES("Instrumento", "Instrument")}</a></li>
  </ul>
  <div class="ajustes">
    <div class="alterna" role="group" aria-label="Idioma / Language"><button type="button" data-lang-set="es" lang="es-ES" aria-label="Español">ES</button><span class="sep">/</span><button type="button" data-lang-set="en" lang="en-US" aria-label="English">EN</button></div>
    <div class="alterna" role="group" aria-label="Tema"><button type="button" data-theme-set="oscuro">${ES("Oscuro", "Dark")}</button><span class="sep">/</span><button type="button" data-theme-set="claro">${ES("Claro", "Light")}</button></div>
  </div>
</header>`;
export const niveles = (actual) => {
  const it = [["01", "atlas-nivel-1.html", "Visión general", "Overview"], ["02", "atlas-nivel-2.html", "Componentes", "Components"], ["03", "atlas-recorrido.html", "Recorrido de un dato", "A datum's journey"], ["04", "lado-a-lado.html", "Lado a lado", "Side by side"]];
  return `<ul class="niveles" aria-label="Nivel de lectura">\n${it.map(([n, h, es, en]) => `    <li><a href="${h}"${h === actual ? ' aria-current="page"' : ""}><span class="n">${n}</span>${ES(es, en)}</a></li>`).join("\n")}\n  </ul>`;
};
/** Pestañas de sección (conocimiento · caso), mismo componente que los niveles del atlas. */
export const pestanas = (seccion, actual) => {
  const it = seccion === "conocimiento"
    ? [["05", "investigador.html", "Investigador", "Researcher"], ["06", "base.html", "Base de conocimiento", "Knowledge base"]]
    : [["07", "perfil.html", "Perfil del caso", "Case profile"], ["08", "comparacion.html", "Comparación", "Comparison"], ["09", "decisiones.html", "Decisiones y riesgos", "Decisions and risks"], ["10", "informe.html", "Hoja de ruta e informe", "Roadmap and report"]];
  return `<ul class="niveles" aria-label="Sección">\n${it.map(([n, h, es, en]) => h ? `    <li><a href="${h}"${h === actual ? ' aria-current="page"' : ""}><span class="n">${n}</span>${ES(es, en)}</a></li>` : `    <li><span class="pend"><span class="n">${n}</span>${ES(es, en)}</span></li>`).join("\n")}\n  </ul>`;
};
export const encabezado = (ojo, h1, sub, meta, boton = true) => `<div class="encabezado">
    <div>
      <span class="ojo">${ES(ojo.es, ojo.en)}</span>
      <h1>${ES(h1.es, h1.en)}</h1>
      <p class="sub">${ES(sub.es, sub.en)}</p>
      ${meta}
    </div>
    ${boton ? `<button type="button" class="enlace-boton">${ES("Cambiar de plataforma", "Switch platform")}${CHEVRON}</button>` : ""}
  </div>`;
export const metaVigente = `<p class="meta"><b>${OK}${ES("vigente", "current")}</b><span class="punto">·</span><span>${ES("verificado hace 6 días", "verified 6 days ago")}</span><span class="punto">·</span><span>${ES("consultado 2026-09-26", "checked 2026-09-26")}</span><span class="punto">·</span><span>${ES("mapa v0.1.0", "map v0.1.0")}</span></p>`;
export const pie = `<footer class="pie">
  <p>${ES("Big-D planea, gestiona y controla; jamás opera una plataforma. Todo lo que ves aquí es ficticio. Declaración del autor: conoce Microsoft Fabric más a fondo que las demás plataformas.", "Big-D plans, manages and controls; it never operates a platform. Everything you see here is fictional. Author's statement: the author knows Microsoft Fabric more deeply than the other platforms.")}</p>
</footer>
</body>
</html>
`;
export const mqBar = (titulo, grupo, botones, notas) => `<div class="mq-bar" role="region" aria-label="Sala de diseño">
  <span class="mq-t">Sala de diseño · ${titulo}</span>
  <a href="index.html">recorrido</a>
  <div class="mq-g" role="group" aria-label="${grupo}">
    <span>estado:</span>
    ${botones.map(([id, fija, txt]) => `<button type="button" data-estado="${id}" data-fija="${fija}">${txt}</button>`).join("\n    ")}
  </div>
</div>
<div class="mq-nota" aria-live="polite">
  ${notas.map(([id, txt], i) => `<p data-para="${id}"${i ? " hidden" : ""}>${txt}</p>`).join("\n  ")}
</div>`;
export const indiceCapas = (cols, BANDA) => cols.map((c, i) => `<li><button type="button" data-col="${c.id}" data-x-t="${c.x}"><span class="n">${String(i + 1).padStart(2, "0")}</span>${ES(BANDA[c.id].es[0], BANDA[c.id].en[0])}</button></li>`).join("\n        ");
export const lienzo = (cols, BANDA, svgs) => `<section class="mapa" aria-label="Mapa">
    <ul class="indice" aria-label="Ir a una capa">
        ${indiceCapas(cols, BANDA)}
    </ul>
    <p class="pista"><svg viewBox="-8 -8 16 16" width="14" height="14" aria-hidden="true"><path d="M-6,0 H5 M1.5,-3.8 L5.5,0 L1.5,3.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>${ES("Desliza de lado para ver las seis capas.", "Swipe sideways to see all six layers.")}</p>
    <div class="lienzo-marco">
      <div class="lienzo" tabindex="0" role="region" data-aria-es="Diagrama; se desplaza de lado" data-aria-en="Diagram; scrolls sideways">
      ${svgs}
      </div>
    </div>`;
