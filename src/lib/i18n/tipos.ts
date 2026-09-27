// Forma del diccionario de la interfaz. Cada idioma la cumple entera (el compilador lo exige y el test
// `i18n` verifica que ningún texto quede vacío ni use un carácter fuera de la fuente). Redactado en
// cada idioma, no traducido (regla bilingüe); la maqueta aprobada es el primer diccionario.
export interface Textos {
  sitio: { nombre: string; descripcion: string };
  barra: { sello: string; secciones: string; atlas: string; idioma: string; tema: string; oscuro: string; claro: string };
  saltarContenido: string;
  pie: string;
  inicio: { ojo: string; titulo: string; sub: string };
}
