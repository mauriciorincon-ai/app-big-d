// Portada de la sala: el RECORRIDO COMPLETO del H1 (11 pantallas + kit), en orden de flujo, con sus
// funcionalidades de la VISION, sus estados y el estado de su mirada.
import { ES, OK, head, pie } from "./comun3.mjs";
import { PEND } from "./m4-comun.mjs";

const P = [
  ["Atlas", "Atlas", [
    ["01", "atlas-nivel-1.html", "Visión general", "Overview", "C1 · C5 · C6", "vigente · por revisar · vencido · P4 · P9", "propuesta · por revisar · vencido · P4 lines · P9 layer", "ok"],
    ["02", "atlas-nivel-2.html", "Componentes y ficha", "Components and card", "C2", "mapa · ficha · glosario", "map · card · glossary", "ok"],
    ["03", "atlas-recorrido.html", "Recorrido de un dato", "A datum's journey", "C3", "todos · paso · bifurcación · animación", "all · step · fork · animation", "ok"],
    ["04", "lado-a-lado.html", "Lado a lado", "Side by side", "C4 · C6", "tres · componentes desplegados · ficha · página 2 · diferencias", "three · expanded components · card · page 2 · differences", "ok"],
  ]],
  ["Conocimiento", "Knowledge", [
    ["05", "investigador.html", "Investigador", "Researcher", "C7 · C8", "capa vencida · propuesta · aprobado · sin novedades", "expired layer · proposal · approved · no news", "ok"],
    ["06", "base.html", "Base de conocimiento", "Knowledge base", "C9", "evidencias · error de carga · instantánea", "evidence · load error · snapshot", "ok"],
  ]],
  ["Caso", "Case", [
    ["07", "perfil.html", "Perfil del caso", "Case profile", "C10", "borrador · suma ≠ 100 · rango abierto · aprobado", "draft · sum ≠ 100 · open range · approved", "ok"],
    ["08", "comparacion.html", "Comparación", "Comparison", "C11 · C12 · C13 · C14", "empate · ganadora · sensibilidad · simulación · robustez · pros y contras", "tie · winner · sensitivity · simulation · robustness · pros and cons", "ok"],
    ["09", "decisiones.html", "Decisiones y riesgos", "Decisions and risks", "C16 · C17 · C18", "ondas · una vía · ciclo · riesgo alto sin mitigación · supuesto sin probar", "waves · one-way · cycle · high risk without mitigation · untested assumption", "ok"],
    ["10", "informe.html", "Hoja de ruta e informe", "Roadmap and report", "C19 · C20", "fases · ítem con origen · informe · vista de impresión", "phases · item with origin · report · print view", "ok"],
  ]],
  ["Instrumento", "Instrument", [
    ["11", "instrumento.html", "Estado del instrumento", "Instrument status", "C15", "todo verde · sembrado no detectado · no se publica", "all green · seeded not detected · not published", "ok"],
  ]],
  ["Design system", "Design system", [
    ["—", "kit.html", "Kit de componentes", "Component kit", "design-system.md", "todos los componentes canon con sus estados", "every canon component with its states", "ok"],
  ]],
];
const EST = { ok: ["mirada aprobada", "look approved"], pend: ["ajuste por mirar", "adjustment to look at"], nueva: ["mirada 4: por mirar", "look 4: to look at"] };
export const indice = `${head({ es: "Recorrido", en: "Walkthrough" })}
<body>
<header class="barra"><a class="marca" href="index.html"><svg class="marca-signo" viewBox="0 0 22 22" aria-hidden="true"><rect x="1" y="1" width="20" height="20" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 7 H16 M6 11 H13 M6 15 H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Big-D <span class="marca-sello">${ES("SALA DE DISEÑO", "DESIGN ROOM")}</span></a>
  <div class="ajustes">
    <div class="alterna" role="group" aria-label="Idioma / Language"><button type="button" data-lang-set="es" lang="es-ES" aria-label="Español">ES</button><span class="sep">/</span><button type="button" data-lang-set="en" lang="en-US" aria-label="English">EN</button></div>
    <div class="alterna" role="group" aria-label="Tema"><button type="button" data-theme-set="oscuro">${ES("Oscuro", "Dark")}</button><span class="sep">/</span><button type="button" data-theme-set="claro">${ES("Claro", "Light")}</button></div>
  </div>
</header>
<main class="pagina" id="contenido">
  <div class="encabezado"><div><span class="ojo">${ES("Etapa de Diseño · maqueta del H1", "Design stage · H1 mockup")}</span><h1>${ES("El recorrido completo", "The full walkthrough")}</h1><p class="sub">${ES("Once pantallas en el orden en que se usan: del mapa de cada plataforma al informe que cualquiera puede reproducir. Cada pantalla trae arriba su barra de sala con sus estados; tema e idioma se eligen aquí o en cada página.", "Eleven screens in the order they are used: from each platform's map to the report anyone can reproduce. Each screen carries its design-room bar with its states at the top; theme and language are chosen here or on each page.")}</p><p class="meta"><span>${ES("datos 100 % ficticios", "100 % fictional data")}</span><span class="punto">·</span><span>${ES("380 px y escritorio", "380 px and desktop")}</span><span class="punto">·</span><span>${ES("oscuro y claro", "dark and light")}</span><span class="punto">·</span><span>ES · EN</span></p></div></div>
  ${P.map(([es, en, ps]) => `<section class="seccion"><h2>${ES(es, en)}</h2><ol class="recorrido">${ps.map(([n, h, tes, ten, c, ses, sen, est]) => `<li><a class="rec-tarjeta" href="${h}"><span class="rec-n mono">${n}</span><b>${ES(tes, ten)}</b><span class="rec-c mono">${c}</span><span class="rec-estados">${ES(ses, sen)}</span><span class="rec-mirada">${est === "ok" ? OK : PEND(12)}${ES(EST[est][0], EST[est][1])}</span></a></li>`).join("")}</ol></section>`).join("")}
  <p class="kit-nota">${ES("Las propuestas escritas viven en el repositorio: docs/diseno/diagramador-tokens.md (gramática del diagrama para el contrato v0.3.0) y design-system.md. Rondas anteriores del atlas: en el historial (f21519c · 5439920 · a05a217).", "The written proposals live in the repository: docs/diseno/diagramador-tokens.md (diagram grammar for contract v0.3.0) and design-system.md. Earlier atlas rounds: in the history (f21519c · 5439920 · a05a217).")}</p>
</main>
${pie}`;
