import type { TextosMotor } from "diagramador";

// Forma del diccionario de la interfaz. Cada idioma la cumple entera (el compilador lo exige y el test
// `i18n` verifica que ningún texto quede vacío ni use un carácter fuera de la fuente). Redactado en
// cada idioma, no traducido (regla bilingüe); la maqueta aprobada es el primer diccionario.
// Plantillas con {marcas}: las llena la app; los pares [uno, varios] son el plural.
export interface Textos {
  sitio: { nombre: string; descripcion: string };
  barra: { sello: string; secciones: string; atlas: string; conocimiento: string; caso: string; instrumento: string; idioma: string; tema: string; oscuro: string; claro: string };
  /** Pestañas de las secciones Conocimiento (05–06) y Caso (07–10), el mismo componente que los niveles del atlas (D-S3-16). */
  secciones: { etiqueta: string; investigador: string; base: string; perfil: string; comparacion: string; decisiones: string; informe: string };
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
    /** Lado a lado (`/[idioma]/comparar`). Plurales [uno, varios]; `numeros` escribe en palabras los que caben. */
    lado: {
      titulo: string;
      ojo: string;
      h1: readonly [string, string];
      sub: string;
      vigenciaPorFila: string;
      guia: { entrada: string; resto: string };
      selector: string;
      orden: string;
      paginacion: string;
      anterior: string;
      siguiente: string;
      rango: string;
      rangoUno: string;
      desplegar: string;
      contraer: string;
      mapa: string;
      lienzo: string;
      pista: string;
      pistaActivar: string;
      pronto: string;
      prontoFila: string;
      prontoEnlace: string;
      bandas: string;
      sinComponentes: string;
      ventanaDe: string;
      numeros: readonly string[];
      /** Nota de marcas con los nombres reales, del dato: [una marca, varias]; «{marcas}» es la lista. */
      notaMarcas: readonly [string, string];
      /** Conjunción para listar las marcas: « y ». */
      y: string;
    };
    /** Versiones de un mapa (`/[idioma]/atlas/[plataforma]/versiones`, D-S2-08). Plurales [uno, varios]. */
    versiones: {
      titulo: string;
      ojo: string;
      h1: string;
      sub: string;
      /** Enlace desde la cabecera del atlas. */
      enlace: string;
      vigente: string;
      anteriores: readonly [string, string];
      volver: string;
      par: string;
      aprobada: string;
      guia: { entrada: string; resto: string };
      lienzo: string;
      pista: string;
      pistaActivar: string;
      ventanaDe: string;
      dice: { titulo: string; cambiaron: readonly [string, string]; ninguno: string; fuentes: readonly [string, string]; sinFuentes: string; nota: string };
      vacio: { titulo: string; texto: string };
      /** Un par con una versión histórica (las reglas de hoy ya no la validan): «{version}». */
      historica: string;
    };
  };
  /** Base de conocimiento (`/[idioma]/base`, D-S3-05). Plurales [uno, varios]. */
  base: {
    titulo: string;
    ojo: string;
    sub: string;
    cargada: string;
    instantanea: string;
    sinInstantanea: string;
    noCarga: readonly [string, string];
    evidencias: {
      titulo: string;
      nota: string;
      aprobadas: readonly [string, string];
      propuestas: readonly [string, string];
      plataformas: readonly [string, string];
      criterios: readonly [string, string];
      mostrando: string;
      vacio: { titulo: string; texto: string };
      filtros: { plataforma: string; criterio: string; estado: string; todas: string; todos: string; ambas: string; aprobadas: string; propuestas: string };
      estado: { propuesta: string; aprobada: string; rechazada: string };
      puntaje: string;
      fuente: string;
      madurez: string;
      conflicto: string;
      verificacion: string;
      verificada: string;
      noVerificable: string;
      tipoFuente: { oficial: string; tercero: string };
      conflictos: { "propio-fabricante": string; "fabricante-competidor": string; "socio-comercial": string; "resena-incentivada": string; independiente: string };
      dias: string;
      porQue: string;
      ficticias: string;
    };
    criterios: { titulo: string; nota: string; capacidad: string; transversal: string };
    escala: { titulo: string; nota: string; madurez: string; tope: string; topeVistaPrevia: string; sinTope: string };
    convenciones: { titulo: string; nota: string; empate: string; robustez: string; vigencia: string; prosContras: string; sensibilidad: string; simulacion: string };
    instantaneas: {
      titulo: string;
      nota: string;
      version: string;
      huella: string;
      evidencias: string;
      plataformas: string;
      cambios: string;
      vigente: string;
      vacio: string;
      cambio: { nueva: string; modificada: string; retirada: string };
      ninguno: string;
    };
    error: { titulo: string; formato: string; consecuencias: string; ninguna: string; ci: string };
  };
  /** El caso: perfil (`/[idioma]/casos/[caso]`) y comparación (`…/comparacion`). Plurales [uno, varios]. */
  caso: {
    numeros: readonly string[];
    y: string;
    vigencia: { vigente: string; revisar: string; vencido: string };
    perfil: {
      ojo: string;
      sub: string;
      borrador: string;
      aprobado: string;
      archivo: string;
      evaluacion: string;
      instantanea: string;
      sinInstantanea: string;
      soloLectura: string;
      pesos: { titulo: string; nota: string; suma: string; sumaBien: string; origen: string; origenAgente: string; origenPersona: string; rango: string; sinRango: string; esencial: string; etiquetaBarra: string };
      restricciones: { titulo: string; nota: string; elimina: string; todas: string; origen: string; vacio: string };
      decisiones: { titulo: string; nota: string; sinResponder: string; respondida: string; elegida: string };
      contexto: string;
      requisitos: { titulo: string; obligatorio: string; preferente: string; criterio: string };
      aprobar: { boton: string; faltanDecisiones: readonly [string, string]; faltaInstantanea: string; comando: string };
      sello: { titulo: string; detalle: string; comparar: string };
    };
    comparacion: {
      ojo: string;
      sub: readonly [string, string];
      /** El subtítulo cuando la comparación no se calcula: nada se puntuó. */
      subPendiente: readonly [string, string];
      fuera: readonly [string, string];
      reproducible: string;
      perfilAprobado: string;
      perfilBorrador: string;
      instantanea: string;
      baseViva: string;
      evaluacion: string;
      eliminada: string;
      vistas: { etiqueta: string; totales: string; sensibilidad: string; robustez: string; pros: string };
      noEvaluable: {
        titulo: string;
        borrador: string;
        todasDescartadas: string;
        faltaEvidencia: readonly [string, string];
        faltaPorPlataforma: readonly [string, string];
        verPerfil: string;
        verBase: string;
      };
      totales: {
        titulo: string;
        veredicto: { empate: string; clara: string; unica: string };
        empate: string;
        empateVarias: string;
        clara: string;
        unica: string;
        leximinOrdena: string;
        exacto: string;
        sello: string;
        minimo: string;
        limitante: string;
        verPuntajes: string;
        banda: string;
        esencial: string;
        barra: string;
      };
      matriz: { titulo: string; nota: string; criterio: string; peso: string; total: string; mejor: string; limitante: string; formula: string; tope: string; escala: string; topeNota: string; alertas: string; alerta: string; alertaMadurez: string };
      sensibilidad: {
        titulo: string;
        nota: string;
        criterio: string;
        control: string;
        rango: string;
        rangoTope: string;
        inversion: string;
        sinInversion: string;
        entraEmpate: string;
        saleEmpate: string;
        reparto: string;
        cambia: string;
        abajo: string;
        arriba: string;
        nada: string;
        lider: readonly [string, string];
        puesto: readonly [string, string];
        hayEmpate: string;
        noHayEmpate: string;
        exacto: string;
        bandaNota: string;
        puestoNota: string;
        sinCambiosPuestos: string;
        sigue: string;
        tabla: string;
        peso: string;
        actual: string;
        explorado: string;
        indefinida: string;
        rangoVacio: string;
        minimoQueInvierte: string;
      };
      robustez: {
        titulo: string;
        nota: string;
        plataforma: string;
        puesto: string;
        primero: string;
        umbrales: string;
        clase: { robusta: string; moderada: string; fragil: string };
        tituloClase: string;
        primera: string;
        intervalo: string;
        cerca: string;
        estable: string;
        inestable: string;
        zonaGris: string;
        metodo: string;
        creer: string;
        nunca: string;
        gana: string;
        tendria: string;
        porDebajo: string;
        porEncima: string;
        dentroRango: string;
        fueraRango: string;
        pesosDe: string;
        pesosPerfil: string;
        pesosExplorados: string;
        sinGanadora: string;
        curso: string;
        progreso: string;
        cursoNota: string;
        cancelar: string;
        cancelada: string;
        tope: string;
        error: string;
        noAplica: string;
      };
      pros: { titulo: string; destaca: string; corta: string; item: string; mejor: string; esencial: string; tope: string; nadaDestaca: string; nadaCorta: string; nota: string };
    };
  };
  investigador: {
    titulo: string;
    ojo: string;
    sub: string;
    mapaAprobado: string;
    sinMapa: string;
    historial: readonly [string, string];
    vigencia: {
      titulo: string;
      /** «{revisar}» y «{vencido}»: umbrales de la gramática. */
      nota: string;
      componentes: readonly [string, string];
      verificado: readonly [string, string];
      dias: readonly [string, string];
      estados: { vigente: string; revisar: string; vencido: string };
    };
    comando: { copiar: string; copiado: string };
    /**
     * El botón que pide una investigación: abre una tarea de GitHub ya escrita (decisión de la persona,
     * 2026-09-30). `cuerpo` va en la tarea, no en la página: ahí sí se dice cómo atenderla.
     */
    solicitud: { boton: string; nota: string; titulo: string; tituloCapa: string; alcance: string; alcanceCapa: string; cuerpo: string };
    vacio: { titulo: string; texto: string };
    propuesta: {
      titulo: string;
      tituloCapa: string;
      nota: string;
      corrida: string;
      modelo: string;
      /** Bloqueos que contó el hook de fin (`.reintentos`). */
      reintentos: readonly [string, string];
      /** Reintentos que declara la propia corrida (`ejecucion.reintentos`). */
      reintentosDeclarados: readonly [string, string];
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
    /** La propuesta de evidencias (D-S3-10, boceto M1): la regla de 0 a 4 por evidencia y nada aprobado de entrada. */
    evidencias: {
      titulo: string;
      nota: string;
      conteo: { n: readonly [string, string]; v: readonly [string, string]; nv: readonly [string, string]; ne: readonly [string, string] };
      escala: { resumen: string; tope: string };
      grupos: { decidir: string; verificadas: string; rechazadas: string };
      regla: { etiqueta: string; propuesto: string; cuenta: string; rayado: string; rayadoVistaPrevia: string; porQue: string; ni: string };
      meta: { fuente: string; madurez: string; conflicto: string; componentes: string; limitaciones: string; esencial: string; esencialSi: string };
      tipoCriterio: { capacidad: string; transversal: string };
      cambio: { nueva: string; cambiada: string; igual: string };
      fuenteN: string;
      faltan: readonly [string, string];
      comandoNota: string;
      veredicto: { titulo: string; detalle: string };
    };
    veredicto: { aprobada: string; sinNovedades: string; detalle: string };
  };
}
