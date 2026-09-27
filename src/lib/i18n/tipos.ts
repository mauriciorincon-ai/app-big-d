import type { TextosMotor } from "diagramador";

// Forma del diccionario de la interfaz. Cada idioma la cumple entera (el compilador lo exige y el test
// `i18n` verifica que ningún texto quede vacío ni use un carácter fuera de la fuente). Redactado en
// cada idioma, no traducido (regla bilingüe); la maqueta aprobada es el primer diccionario.
// Plantillas con {marcas}: las llena la app; los pares [uno, varios] son el plural.
export interface Textos {
  sitio: { nombre: string; descripcion: string };
  barra: { sello: string; secciones: string; atlas: string; idioma: string; tema: string; oscuro: string; claro: string };
  saltarContenido: string;
  pie: string;
  inicio: { ojo: string; titulo: string; sub: string };
  /** Cadenas que el diagramador dibuja o lee (D-S1-06): el paquete no trae palabras propias. */
  motor: TextosMotor;
  atlas: {
    /** Título de la pestaña de la vista general. */
    tituloNivel1: string;
    ojoNivel1: string;
    /** «{capas}» y «{franjas}» salen de la gramática. */
    sub: string;
    vigencia: {
      vigente: string;
      bloquesPorRevisar: readonly [string, string];
      componentesPorRevisar: readonly [string, string];
      vencidos: readonly [string, string];
      /** Tras «N vencido»: «{n} por revisar». */
      porRevisar: string;
      verificadoHace: readonly [string, string];
      masViejo: readonly [string, string];
    };
    consultado: string;
    version: string;
    niveles: { etiqueta: string; general: string; componentes: string; recorrido: string; lado: string };
    /** La guía de lectura: una entrada en negrita y el resto. */
    guia: { entrada: string; resto: string };
    mapa: string;
    indice: string;
    /** «{n}» = número de capas. */
    pista: string;
    saltarDiagrama: string;
    lienzo: string;
    /** Descripción de cada bloque activable (A-29): qué hace Enter. */
    pistaActivar: string;
    notaModos: string;
    lectura: string;
    nivel2: { titulo: string; ojo: string; sub: string; guia: { entrada: string; resto: string } };
    /** Pista de los componentes activables (niveles 2 y 3): qué hace Enter. */
    pistaNodo: string;
    ficha: { titulo: string; cerrar: string };
    recorrido: {
      titulo: string;
      ojo: string;
      guia: { entrada: string; resto: string };
      controles: string;
      anterior: string;
      siguiente: string;
      reproducir: string;
      pausar: string;
      verTodos: string;
      todos: string;
      /** «{n}» = número del paso (1, 6a…), «{total}» = cuántos pasos. */
      pasoDe: string;
      pasos: string;
    };
    plataforma: { etiqueta: string; pronto: string; elegir: string };
  };
}
