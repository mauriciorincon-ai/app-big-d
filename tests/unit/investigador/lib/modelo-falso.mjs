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
  hallazgos.push({ componente: componentes[0], enunciado_es: "Inventado.", enunciado_en: "Made up.", cita: "Esta frase no aparece en ninguna página de la muestra, por larga que sea." });
  hallazgos.push({ componente: "no-esta-en-la-lista", enunciado_es: "Otro.", enunciado_en: "Other.", cita: `El componente ${componentes[0]} existe y cumple su función en la plataforma.` });
  return hallazgos;
}
