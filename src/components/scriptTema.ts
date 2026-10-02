// Script en <head>, antes de pintar: aplica el tema que el visitante eligió (localStorage). Sin
// elección no pone atributo y manda `prefers-color-scheme`, y sin preferencia, oscuro (tokens.css).
// Nunca decide QUÉ elementos existen: solo un atributo del <html> (regla 5-a del CLAUDE.md).
export const CLAVE_TEMA = "bigd-tema";
export const scriptTema = `(function(){try{var t=localStorage.getItem("${CLAVE_TEMA}");if(t==="oscuro"||t==="claro")document.documentElement.setAttribute("data-theme",t)}catch(e){}})();`;
