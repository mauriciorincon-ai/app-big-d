// 11 Estado del instrumento: casos de referencia, propiedades, errores sembrados y huellas entre motores.
// Sin validación en verde no se publica nada (RF-09.4). Tres estados: verde · un sembrado no detectado · no se publica.
import { ES, OK, barra, encabezado, head, mqBar, pie } from "./comun3.mjs";
import { ALERTA, SHA, X, sec } from "./m4-comun.mjs";

const REF = [
  ["Todo el peso en gobierno: gana la única plataforma con 4/4", "All weight on governance: the only platform with 4/4 wins", "Norte", "Norte"],
  ["Pesos iguales y puntajes idénticos: empate de las tres", "Equal weights and identical scores: three-way tie", "empate", "empate"],
  ["Una esencial en 0: esa plataforma no puede ganar", "One essential at 0: that platform cannot win", "no gana", "no gana"],
  ["Vista previa con evidencia 4: queda en 2 (tope por madurez)", "Preview with evidence 4: capped at 2 (maturity cap)", "2", "2"],
  ["Diferencia de 4,9 puntos: se declara empate técnico", "4.9-point gap: technical tie declared", "empate", "empate"],
  ["Diferencia de 5,1 puntos: ganadora clara", "5.1-point gap: clear winner", "ganadora", "ganadora"],
];
const PROP = [
  ["Los pesos suman 100", "Weights add up to 100", "1 000"],
  ["Reordenar las plataformas no cambia ningún resultado", "Reordering the platforms changes no result", "1 000"],
  ["Subir un puntaje nunca empeora la posición de esa plataforma", "Raising a score never worsens that platform's position", "1 000"],
  ["El signo de la derivada es el de (s − m)", "The sign of the derivative is that of (s − m)", "1 000"],
  ["La mejor en un criterio gana con peso 100", "The best on a criterion wins at weight 100", "1 000"],
  ["Agregar una plataforma no cambia los totales de las demás", "Adding a platform does not change the others' totals", "1 000"],
  ["Misma semilla, mismos bytes", "Same seed, same bytes", "1 000"],
];
const SEM = [
  ["Decisión de una vía marcada como reversible", "One-way decision marked as reversible", "RF-09.3"],
  ["Modo de falla de severidad alta sin mitigación", "High-severity failure mode without mitigation", "RF-09.3"],
  ["Dependencia circular entre decisiones", "Circular dependency between decisions", "RF-09.3"],
  ["S8 · O3 · D4 (RPN 96) debe salir prioridad alta", "S8 · O3 · D4 (RPN 96) must come out high priority", "E-15", true],
  ["Empate que se rompe por el orden de la lista", "Tie broken by list order", "E-15"],
  ["Muestra de pesos fuera del rango declarado", "Weight sample outside the declared range", "E-15"],
  ["Mapa: componente sin fuente", "Map: component without a source", "RF-09.6"],
  ["Mapa: flujo hacia un componente inexistente", "Map: flow to a non-existent component", "RF-09.6"],
  ["Mapa: capa inventada fuera de la gramática", "Map: made-up layer outside the grammar", "RF-09.6"],
];
const MOTORES = ["Node 22", "Chromium", "Firefox", "WebKit"];
const fila = (ok, a, b, extra = "") => `<li class="val${ok ? "" : " val-falla"}">${ok ? OK : X()}<span>${a}${b ? `<small>${b}</small>` : ""}</span>${extra}</li>`;
const cuerpo = (rojo) => {
  const semOk = SEM.map((s) => !(rojo && s[3]));
  const det = semOk.filter(Boolean).length;
  return `
  <div class="kit-grid">
  ${sec("Casos de referencia", "Reference cases", ES("La respuesta correcta es evidente por construcción.", "The right answer is evident by construction."), `<p class="conteo"><span>6 / 6</span></p><ul class="pros val-lista">${REF.map(([es, en, esp]) => fila(true, ES(es, en), ES(`esperado: ${esp} · obtenido: ${esp}`, `expected = obtained`))).join("")}</ul>`)}
  ${sec("Propiedades", "Properties", ES("Pruebas de propiedades con semilla; la monotonía es la corregida (la posición del líder nunca empeora).", "Seeded property tests; monotonicity is the corrected one (the leader's position never worsens)."), `<p class="conteo"><span>7 / 7</span></p><ul class="pros val-lista">${PROP.map(([es, en, n]) => fila(true, ES(es, en), ES(`${n} casos generados · semilla 20260926`, `${n} generated cases · seed 20260926`))).join("")}</ul>`)}
  </div>
  ${sec("Errores sembrados", "Seeded errors", ES("Casos con un error deliberado: la herramienta debe detectarlos todos. Se reporta cuántos sobre cuántos.", "Cases with a deliberate error: the tool must catch them all. Reported as how many out of how many."), `<p class="conteo"><span${rojo ? ' class="conteo-falla"' : ""}>${ES(`${det} de ${SEM.length} detectados`, `${det} of ${SEM.length} detected`)}</span></p><ul class="pros val-lista">${SEM.map(([es, en, ref], i) => fila(semOk[i], ES(es, en), semOk[i] ? ES(`detectado · ${ref}`, `detected · ${ref}`) : ES("NO detectado: salió prioridad media. Alguien editó la tabla v0 a «S 7–8 con O ≥ 4». Se corrige la tabla (dato), no el caso.", "NOT detected: it came out medium priority. Someone edited table v0 to “S 7–8 with O ≥ 4”. The table (data) gets fixed, not the case."))).join("")}</ul>`)}
  ${sec("Mismos bytes en todos los motores", "Same bytes on every engine", ES("La misma entrada produce la misma huella del informe; se compara en la integración continua (Linux y macOS).", "The same input produces the same report fingerprint; compared in continuous integration (Linux and macOS)."), `<ul class="pros val-lista">${MOTORES.map((m) => fila(true, m, "")).join("")}</ul><p class="mono">${SHA("e41f07", "8b2d")} · ${ES("prueba de neutralidad: 24 órdenes de las 4 plataformas, una sola huella", "neutrality test: 24 orderings of the 4 platforms, one single fingerprint")}</p>`)}`;
};
const verde = `<div class="veredicto"><b>${OK}${ES("Validación en verde: se puede publicar", "Validation green: publishing allowed")}</b><span class="mono">${ES("6/6 referencias · 7/7 propiedades · 9/9 sembrados · 4/4 motores", "6/6 references · 7/7 properties · 9/9 seeded · 4/4 engines")}</span><span class="mono">${ES("corrida 2026-09-26 14:40 · instantánea 2026-09-26", "run 2026-09-26 14:40 · snapshot 2026-09-26")}</span></div>`;
const rojo = `<div class="veredicto veredicto-alerta" role="alert"><b>${X(16)}${ES("Validación en rojo: un error sembrado no se detectó", "Validation red: one seeded error was not detected")}</b><span class="mono">${ES("8 de 9 sembrados · nada se publica hasta volver a verde", "8 of 9 seeded · nothing is published until green again")}</span></div>`;
const bloqueo = `<div class="bloqueo" role="alert"><p class="ojo">${ES("Intento de publicación", "Publication attempt")}</p><pre class="terminal"><span class="mono">$ pnpm publicar --instantanea 2026-09-27</span>
<span class="mono">× ${"validación"} 8/9 · S8·O3·D4 → media (esperado: alta)</span>
<span class="mono">× ${"no se publica: instantánea, mapas ni demo"}</span></pre><h2>${X(18)} ${ES("No se publica", "Not published")}</h2><ul class="pros"><li>${X()}<span>${ES("Instantánea 2026-09-27: no se crea. La vigente sigue siendo 2026-09-26.", "Snapshot 2026-09-27: not created. The current one is still 2026-09-26.")}</span></li><li>${X()}<span>${ES("Mapas nuevos o cambiados: no se aprueban.", "New or changed maps: not approved.")}</span></li><li>${X()}<span>${ES("Demo de la vitrina: no se reconstruye; la publicada sigue intacta.", "Showcase demo: not rebuilt; the published one stays intact.")}</span></li><li>${ALERTA()}<span>${ES("Para destrabar: corregir la tabla de prioridad (dato) y volver a correr la validación.", "To unblock: fix the priority table (data) and run the validation again.")}</span></li></ul><p class="kit-nota">${ES("El texto de la terminal se muestra en el idioma del registro de la herramienta; la pantalla, en el tuyo.", "Terminal text shows in the tool's log language; the screen, in yours.")}</p></div>`;

export const instrumento = `${head({ es: "Estado del instrumento", en: "Instrument status" })}
<body>
${mqBar("11 Estado del instrumento", "Estado de la maqueta", [["verde", "vista:verde", "todo verde"], ["rojo", "vista:rojo", "sembrado no detectado"], ["bloqueo", "vista:bloqueo", "no se publica"]], [["verde", "<b>Todo verde.</b> Casos de referencia, propiedades (con la monotonía corregida), los nueve errores sembrados detectados y la misma huella en los cuatro motores. Solo así se publica."], ["rojo", "<b>Sembrado no detectado.</b> Alguien editó la tabla de prioridad y el caso S8/O3/D4 salió media: 8 de 9. La fila dice qué falló, por qué y qué se corrige (el dato, no el caso)."], ["bloqueo", "<b>No se publica.</b> El intento de publicar una instantánea nueva se detiene: qué no se publica, qué sigue vigente y cómo destrabar."]])}
${barra("instrumento")}
<main class="pagina" id="contenido">
  ${encabezado({ es: "Instrumento", en: "Instrument" }, { es: "Estado del instrumento", en: "Instrument status" }, { es: "¿Se puede confiar en la herramienta? Casos con respuesta conocida, propiedades matemáticas y errores sembrados. Sin validación en verde no se publica nada.", en: "Can the tool be trusted? Cases with known answers, mathematical properties and seeded errors. Without a green validation nothing is published." }, `<p class="meta"><span>Big-D 0.1.0</span><span class="punto">·</span><span>${ES("tabla de prioridad v0", "priority table v0")}</span><span class="punto">·</span><span>${ES("gramática plataformas-datos 0.2.0", "grammar plataformas-datos 0.2.0")}</span></p>`, false)}
  <div data-si="vista:verde">${verde}${cuerpo(false)}</div>
  <div data-si="vista:rojo">${rojo}${cuerpo(true)}</div>
  <div data-si="vista:bloqueo">${rojo}${bloqueo}</div>
</main>
${pie}`;
