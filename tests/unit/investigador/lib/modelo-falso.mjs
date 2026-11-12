// Un modelo FALSO para el ejecutor del modelo del sistema (scripts/investigar/sistema.mjs) en la CI: sin red, sin macOS.
// Anota, por cada componente de la lista, la frase de la muestra que lo nombra (una cita literal, que el código acepta), y
// además dos cosas que el código debe tumbar: una cita inventada y un componente que no está en la lista.
// BIGD_FALSO_MODO: «no-disponible» (Apple Intelligence apagado) · «sin-es» (el modelo no trae español).
export function disponible() {
  const modo = process.env.BIGD_FALSO_MODO;
  if (modo === "no-disponible") return { disponible: false, razon: "Apple Intelligence está apagado en Configuración del Sistema" };
  return { disponible: true, idiomas: modo === "sin-es" ? ["en", "fr"] : ["en", "es", "fr"] };
}

export function generar({ prompt, componentes }) {
  const texto = prompt.slice(prompt.indexOf("Texto de"));
  const hallazgos = [];
  for (const id of componentes) {
    const cita = `El componente ${id} existe y cumple su función en la plataforma.`;
    if (texto.includes(cita)) hallazgos.push({ componente: id, enunciado_es: `${id} cumple su función.`, enunciado_en: `${id} does its job.`, cita });
  }
  const [primero] = componentes;
  const literal = `El componente ${primero} existe y cumple su función en la plataforma.`;
  const nombreEn = prompt.match(new RegExp(`^- ${primero}: .* / (.*)$`, "m"))?.[1] ?? primero;
  // Lo que el código tumba antes de escribir, uno por motivo (los de la corrida real del 2026-11-12 sobre Snowflake, entre ellos):
  hallazgos.push(
    { componente: primero, enunciado_es: "El componente no hace nada de lo que dice.", enunciado_en: "The component does none of it.", cita: "Esta frase no aparece en ninguna página de la muestra, por larga que sea." },
    { componente: "no-esta-en-la-lista", enunciado_es: "Otro de la plataforma.", enunciado_en: "Another one of the platform.", cita: literal },
    { componente: primero, enunciado_es: "Una línea de código como cita.", enunciado_en: "A line of code as a quote.", cita: "CREATE TABLE t1 ( c1 number ); INSERT INTO t1 VALUES ( 1111 ), ( 2222 );" },
    { componente: primero, enunciado_es: "It keeps the data in the platform.", enunciado_en: "It keeps the data in the platform.", cita: literal },
    { componente: primero, enunciado_es: "Guarda los datos de la plataforma.", enunciado_en: nombreEn, cita: literal },
  );
  return hallazgos;
}
