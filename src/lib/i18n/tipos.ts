import type { TextosMotor } from "diagramador";

// Forma del diccionario de la interfaz. Cada idioma la cumple entera (el compilador lo exige y el test
// `i18n` verifica que ningún texto quede vacío ni use un carácter fuera de la fuente). Redactado en
// cada idioma, no traducido (regla bilingüe); la maqueta aprobada es el primer diccionario.
// Plantillas con {marcas}: las llena la app; los pares [uno, varios] son el plural.
export interface Textos {
  sitio: { nombre: string; descripcion: string };
  barra: { sello: string; secciones: string; atlas: string; conocimiento: string; idioma: string; tema: string; oscuro: string; claro: string };
  saltarContenido: string;
  pie: string;
  inicio: { ojo: string; titulo: string; sub: string };
  /** La página que no existe (404 global, fuera de los layouts por idioma). */
  noEncontrada: { titulo: string; volver: string };
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
    /** Ventana de un bloque del nivel 1: sus componentes dibujados y sus tarjetas. */
    ventana: { titulo: string; verComponentes: string };
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
    plataforma: { etiqueta: string; pronto: string; elegir: string; notaInicio: string; nota: string; notaInvestigador: string };
  };
  investigador: {
    titulo: string;
    ojo: string;
    sub: string;
    mapaAprobado: string;
    sinMapa: string;
    historial: readonly [string, string];
    secciones: { etiqueta: string; investigador: string; base: string };
    vigencia: {
      titulo: string;
      /** «{revisar}» y «{vencido}»: umbrales de la gramática. */
      nota: string;
      componentes: readonly [string, string];
      verificado: readonly [string, string];
      dias: readonly [string, string];
      estados: { vigente: string; revisar: string; vencido: string };
    };
    comando: { copiar: string; copiado: string; nota: string };
    vacio: { titulo: string; texto: string };
    propuesta: {
      titulo: string;
      tituloCapa: string;
      nota: string;
      corrida: string;
      modelo: string;
      reintentos: readonly [string, string];
      fuentes: readonly [string, string];
      verificadaEl: string;
      invalida: string;
      sinVerificar: string;
      diff: string;
      primera: string;
      conteo: string;
      grupos: { decidir: string; verificadas: string; rechazadas: string };
      cambio: { nuevo: string; renombrado: string; madurez: string; cambiado: string; igual: string };
      entidad: { nodo: string; flujo: string };
      estado: { porDecidir: string; aprobada: string; rechazada: string };
      verif: { verificada: string; noVerificable: string; noEncontrada: string; rechazadaPorCodigo: string };
      tipoFuente: { oficial: string; tercero: string };
      aprobar: string;
      rechazar: string;
      faltan: readonly [string, string];
      comandoTitulo: string;
      comandoNota: string;
      /** Lo que sale del mapa aprobado, cada uno con su argumento (pedido de la persona, 2026-09-30). */
      retiros: { titulo: string; nota: string; arrastreUno: string; arrastreDos: string; sinArgumento: string; bloquea: string };
      preguntas: string;
      respondida: string;
      sinFuente: string;
    };
    veredicto: { aprobada: string; sinNovedades: string; detalle: string };
  };
}
