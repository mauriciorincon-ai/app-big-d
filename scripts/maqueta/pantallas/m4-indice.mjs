// Portada de la sala: el RECORRIDO COMPLETO del H1 dibujado con la gramática del atlas (D81, mirada 5).
// Cuatro etapas de izquierda a derecha como bandas con su pregunta, cada pantalla como nodo con una miniatura
// de lo que muestra, y lo transversal abajo. Reemplaza la rejilla de tarjetas iguales (design system § 8).
import { ES, OK, head, pie } from "./comun3.mjs";
import { MINI } from "./m4-mini.mjs";

const ETAPAS = [
  ["Atlas", "Atlas", "¿Cómo está hecha cada plataforma?", "How is each platform built?", [
    ["01", "atlas-nivel-1.html", "vision", "Visión general", "Overview", "C1 · C5 · C6",
      "Todas las capas de una plataforma en un solo mapa, con la vigencia de cada una.", "Every layer of a platform on a single map, with how current each one is."],
    ["02", "atlas-nivel-2.html", "nivel2", "Componentes y ficha", "Components and card", "C2",
      "Cada componente con su tipo, su madurez y sus fuentes.", "Each component with its type, its maturity and its sources."],
    ["03", "atlas-recorrido.html", "recorrido", "Recorrido de un dato", "A datum's journey", "C3",
      "Un dato paso a paso, desde que entra hasta que alguien lo usa.", "One piece of data, step by step, from the moment it arrives until someone uses it."],
    ["04", "lado-a-lado.html", "lado", "Lado a lado", "Side by side", "C4 · C6",
      "Varias plataformas alineadas capa por capa, con sus diferencias.", "Several platforms lined up layer by layer, with their differences."],
  ]],
  ["Conocimiento", "Knowledge", "¿De dónde sale lo que sabemos?", "Where does what we know come from?", [
    ["05", "investigador.html", "investigador", "Investigador", "Researcher", "C7 · C8",
      "La IA propone conocimiento con citas comprobadas; una persona lo aprueba.", "The AI proposes knowledge with checked quotes; a person approves it."],
    ["06", "base.html", "base", "Base de conocimiento", "Knowledge base", "C9",
      "Cada evidencia con su fuente y su fecha, y lo que no pasa al cargar.", "Every piece of evidence with its source and date, and whatever fails to load."],
  ]],
  ["Caso", "Case", "¿Cuál le conviene a este caso?", "Which one fits this case?", [
    ["07", "perfil.html", "perfil", "Perfil del caso", "Case profile", "C10",
      "Lo que pesa para el hospital ficticio, con su margen de duda.", "What matters to the fictional hospital, with its margin of doubt."],
    ["08", "comparacion.html", "comparacion", "Comparación", "Comparison", "C11 · C12 · C13 · C14",
      "Puntajes con evidencia, empates declarados y cuánto aguanta el resultado.", "Scores backed by evidence, declared ties and how well the result holds up."],
  ]],
  ["Plan", "Plan", "¿Qué decidimos y en qué orden?", "What do we decide, and in what order?", [
    ["09", "decisiones.html", "decisiones", "Decisiones y riesgos", "Decisions and risks", "C16 · C17 · C18",
      "Qué decidir primero, qué no tiene vuelta atrás y qué riesgo atender.", "What to decide first, what cannot be undone and which risk to act on."],
    ["10", "informe.html", "informe", "Hoja de ruta e informe", "Roadmap and report", "C19 · C20",
      "Las tareas con su origen y un informe que cualquiera puede reproducir.", "Tasks traced to their origin, and a report anyone can reproduce."],
  ]],
];
const TRANSVERSALES = [
  ["Instrumento", "Instrument", "¿Podemos confiar en la medición?", "Can we trust the measurement?", [
    ["11", "instrumento.html", "instrumento", "Estado del instrumento", "Instrument status", "C15",
      "Las pruebas que la medición pasa antes de publicar un resultado.", "The checks the measurement passes before any result is published."],
  ]],
  ["Design system", "Design system", "¿Con qué piezas se construye?", "What is it built from?", [
    ["—", "kit.html", "kit", "Kit de componentes", "Component kit", "design-system.md",
      "Todas las piezas de la interfaz con sus estados, en los dos temas.", "Every piece of the interface with its states, in both themes."],
  ]],
];
const FLECHA = `<svg class="ruta-flecha" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M4,12 H19 M13,6 L19,12 L13,18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const nodo = ([n, h, mini, tes, ten, c, des, den]) => `<li><a class="ruta-nodo" href="${h}">${MINI[mini]()}<span class="ruta-cuerpo"><span class="ruta-n mono">${n}</span><span class="ruta-titulo">${ES(tes, ten)}</span><span class="ruta-texto">${ES(des, den)}</span><span class="ruta-c mono">${c}</span></span></a></li>`;
const banda = (clase, id, etiqueta, [es, en, pes, pen, nodos], flecha) => `<section class="${clase}" aria-labelledby="${id}"><header class="ruta-cab">${flecha ? FLECHA : ""}<span class="ruta-etapa">${etiqueta}</span><h2 id="${id}">${ES(es, en)}</h2><p class="ruta-pregunta">${ES(pes, pen)}</p></header><ol class="ruta-nodos">${nodos.map(nodo).join("")}</ol></section>`;

export const indice = `${head({ es: "Recorrido", en: "Walkthrough" })}
<body>
<header class="barra"><a class="marca" href="index.html"><svg class="marca-signo" viewBox="0 0 22 22" aria-hidden="true"><rect x="1" y="1" width="20" height="20" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 7 H16 M6 11 H13 M6 15 H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Big-D <span class="marca-sello">${ES("SALA DE DISEÑO", "DESIGN ROOM")}</span></a>
  <div class="ajustes">
    <div class="alterna" role="group" aria-label="Idioma / Language"><button type="button" data-lang-set="es" lang="es-ES" aria-label="Español">ES</button><span class="sep">/</span><button type="button" data-lang-set="en" lang="en-US" aria-label="English">EN</button></div>
    <div class="alterna" role="group" aria-label="Tema"><button type="button" data-theme-set="oscuro">${ES("Oscuro", "Dark")}</button><span class="sep">/</span><button type="button" data-theme-set="claro">${ES("Claro", "Light")}</button></div>
  </div>
</header>
<main class="pagina" id="contenido">
  <div class="encabezado"><div><span class="ojo">${ES("Etapa de Diseño · maqueta del H1", "Design stage · H1 mockup")}</span><h1>${ES("El recorrido completo", "The full walkthrough")}</h1><p class="sub">${ES("Once pantallas en el orden en que se usan, dibujadas con la gramática del atlas: cuatro etapas de izquierda a derecha y, abajo, lo que las atraviesa a todas. Tema e idioma se eligen aquí o en cada pantalla.", "Eleven screens in the order they are used, drawn with the atlas's own grammar: four stages from left to right and, underneath, what runs across all of them. Theme and language can be chosen here or on any screen.")}</p><p class="meta"><b>${OK}${ES("Diseño aprobado · 2026-09-27", "Design approved · 2026-09-27")}</b><span class="punto">·</span><span>${ES("datos 100 % ficticios", "100 % fictional data")}</span><span class="punto">·</span><span>${ES("380 px y escritorio", "380 px and desktop")}</span><span class="punto">·</span><span>${ES("oscuro y claro", "dark and light")}</span><span class="punto">·</span><span>ES · EN</span></p></div></div>
  <div class="ruta">
    ${ETAPAS.map((e, i) => banda("ruta-banda", `etapa-${i + 1}`, ES(`Etapa ${i + 1}`, `Stage ${i + 1}`), e, i > 0)).join("\n    ")}
    ${TRANSVERSALES.map((e, i) => banda("ruta-trans", `transversal-${i + 1}`, ES("Transversal", "Cross-cutting"), e, false)).join("\n    ")}
  </div>
  <p class="kit-nota">${ES("Las propuestas escritas viven en el repositorio: docs/diseno/diagramador-tokens.md (gramática del diagrama para el contrato v0.3.0) y design-system.md. Rondas anteriores del atlas: en el historial (f21519c · 5439920 · a05a217).", "The written proposals live in the repository: docs/diseno/diagramador-tokens.md (diagram grammar for contract v0.3.0) and design-system.md. Earlier atlas rounds: in the history (f21519c · 5439920 · a05a217).")}</p>
</main>
${pie}`;
