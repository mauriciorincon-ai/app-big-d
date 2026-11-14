import type { Idioma } from "@/lib/i18n";

// S10 (F2): los textos de la demo pública, redactados en cada idioma (regla 20), no traducidos. Ninguno dice «recomendada»,
// «aprobada» ni «ganadora»: la demo muestra lo que dan los pesos de quien la visita (pregunta 1 a del G-Plan).

export interface TextosDemo {
  titulo: string;
  descripcion: string;
  ojo: string;
  h1: string;
  intro: string;
  rotulo: string;
  rotuloDetalle: string;
  otroIdioma: { etiqueta: string; nombre: string };
  pesosTitulo: string;
  pesosAyuda: string;
  restablecer: string;
  resultadoTitulo: string;
  deCien: string;
  veredicto: {
    unica: string;
    clara: string;
    empate: string;
    noEvaluable: string;
    error: string;
    calculando: string;
  };
  y: string;
  huellaTitulo: string;
  huellaAyuda: string;
  neutralidadTitulo: string;
  neutralidadAyuda: string;
  neutralidadBoton: string;
  neutralidadOrden: string;
  neutralidadIgual: string;
  neutralidadDistinta: string;
  proximamenteTitulo: string;
  proximamente: string;
  atlasTitulo: string;
  atlasAyuda: string;
  vigencia: string;
  lecturaTexto: string;
  declaracionTitulo: string;
  declaracion: string;
  sinScript: string;
}

export const TEXTOS_DEMO: Record<Idioma, TextosDemo> = {
  es: {
    titulo: "Big-D · demo",
    descripcion:
      "Mueve los pesos de un caso inventado y mira cómo cambia el orden de las plataformas de datos, con el mismo cálculo de Big-D.",
    ojo: "Big-D · demo pública",
    h1: "Compara plataformas de datos con tus propios pesos",
    intro:
      "Plataformas reales, el caso de un hospital inventado y el mismo cálculo que usa Big-D. Mueve los pesos y mira cómo cambia el orden.",
    rotulo: "Perfil en borrador del autor: mueve los pesos",
    rotuloDetalle:
      "Los pesos de partida son un borrador del autor; nadie los aprobó. Lo que ves es lo que dan tus pesos, no una recomendación.",
    otroIdioma: { etiqueta: "Read in English", nombre: "English" },
    pesosTitulo: "Tus pesos",
    pesosAyuda:
      "Cada criterio pesa una parte de 100 puntos. Al mover uno, los demás se dividen el resto en proporción.",
    restablecer: "Volver a los pesos del autor",
    resultadoTitulo: "Lo que dan tus pesos",
    deCien: "{puntos} de 100",
    veredicto: {
      unica: "Solo {nombre} pasa las restricciones del caso.",
      clara: "Con estos pesos, {nombre} queda arriba por {brecha} puntos.",
      empate:
        "Empate técnico: {nombres} quedan a menos de {umbral} puntos; con estos pesos ninguna se separa.",
      noEvaluable: "Con estos pesos no hay resultado.",
      error: "El cálculo no salió: {mensaje}",
      calculando: "Haciendo la cuenta…",
    },
    y: " y ",
    huellaTitulo: "Huella del resultado",
    huellaAyuda:
      "Un código que resume el resultado completo. La misma entrada da la misma huella en cualquier equipo.",
    neutralidadTitulo: "Probar la neutralidad",
    neutralidadAyuda:
      "Ninguna plataforma tiene un trato especial en el código. El botón entrega las plataformas en otro orden al mismo cálculo: si la huella no cambia, el orden no contó.",
    neutralidadBoton: "Cambiar el orden de las plataformas y volver a calcular",
    neutralidadOrden: "Orden en que llegaron: {orden}",
    neutralidadIgual: "Misma huella: el orden no cambió el resultado.",
    neutralidadDistinta: "Huella distinta: el orden cambió el resultado.",
    proximamenteTitulo: "Próximamente",
    proximamente:
      "{nombre}: su mapa y su evidencia están en revisión; aún no tiene puntos.",
    atlasTitulo: "El atlas: cómo está hecha cada plataforma",
    atlasAyuda:
      "Los mapas usan la misma gramática visual: capas de izquierda a derecha y la misma marca para el mismo tipo de pieza.",
    vigencia: "Qué tan al día está cada evidencia, contando los días hasta el {fecha} y no hasta hoy.",
    lecturaTexto: "Leer el mapa en texto",
    declaracionTitulo: "Declaración del autor",
    declaracion:
      "El autor conoce Microsoft Fabric más a fondo que las otras dos. Por eso el cálculo no sabe qué plataforma es cuál, y la prueba de la neutralidad deja verlo.",
    sinScript:
      "Esta página hace la cuenta en tu equipo. Si no corre su código, ves el resultado de los pesos del autor.",
  },
  en: {
    titulo: "Big-D · demo",
    descripcion:
      "Move the weights of a made-up case and see how the order of the data platforms changes, with the same calculation Big-D uses.",
    ojo: "Big-D · public demo",
    h1: "Compare data platforms with your own weights",
    intro:
      "Real platforms, the case of a made-up hospital and the same calculation Big-D uses. Move the weights and watch the order change.",
    rotulo: "Draft profile by the author: move the weights",
    rotuloDetalle:
      "The starting weights are a draft by the author; nobody has approved them. What you see is what your weights give, not a recommendation.",
    otroIdioma: { etiqueta: "Leer en español", nombre: "Español" },
    pesosTitulo: "Your weights",
    pesosAyuda:
      "Each criterion carries a share of 100 points. When you move one, the others split the rest in proportion.",
    restablecer: "Back to the weights of the author",
    resultadoTitulo: "What your weights give",
    deCien: "{puntos} out of 100",
    veredicto: {
      unica: "Only {nombre} passes the restrictions of the case.",
      clara:
        "With these weights, {nombre} comes out on top by {brecha} points.",
      empate:
        "Technical tie: {nombres} are less than {umbral} points apart; with these weights none of them pulls ahead.",
      noEvaluable: "These weights give no result.",
      error: "The calculation failed: {mensaje}",
      calculando: "Calculating…",
    },
    y: " and ",
    huellaTitulo: "Result signature",
    huellaAyuda:
      "A code that sums up the whole result. The same input gives the same signature on any computer.",
    neutralidadTitulo: "Test the neutrality",
    neutralidadAyuda:
      "No platform gets special treatment in the code. The button hands the platforms to the same calculation in another order: if the signature stays the same, the order made no difference.",
    neutralidadBoton: "Change the order of the platforms and calculate again",
    neutralidadOrden: "Order they arrived in: {orden}",
    neutralidadIgual: "Same signature: the order did not change the result.",
    neutralidadDistinta: "Different signature: the order changed the result.",
    proximamenteTitulo: "Coming soon",
    proximamente:
      "{nombre}: its map and its evidence are under review; it has no score yet.",
    atlasTitulo: "The atlas: how each platform is built",
    atlasAyuda:
      "The maps share one visual grammar: layers from left to right and the same mark for the same kind of piece.",
    vigencia: "How up to date each piece of evidence is, measured up to {fecha} and not up to today.",
    lecturaTexto: "Read the map as text",
    declaracionTitulo: "Statement by the author",
    declaracion:
      "The author knows Microsoft Fabric more deeply than the other two. That is why the calculation does not know which platform is which, and the neutrality test lets you see it.",
    sinScript:
      "This page works out the result on your computer. If its code does not run, you see the result of the weights of the author.",
  },
};
