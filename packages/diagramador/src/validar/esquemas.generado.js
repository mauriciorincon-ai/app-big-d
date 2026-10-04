// GENERADO por scripts/diagramador/compilar-esquemas.mjs desde esquema/*.schema.json (Ajv 8 standalone +
// esbuild). No se edita a mano: se regenera. La prueba de deriva compara este archivo con su generador.
/* eslint-disable */
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// node_modules/.pnpm/fast-deep-equal@3.1.3/node_modules/fast-deep-equal/index.js
var require_fast_deep_equal = __commonJS({
  "node_modules/.pnpm/fast-deep-equal@3.1.3/node_modules/fast-deep-equal/index.js"(exports, module) {
    "use strict";
    module.exports = function equal(a, b) {
      if (a === b) return true;
      if (a && b && typeof a == "object" && typeof b == "object") {
        if (a.constructor !== b.constructor) return false;
        var length, i, keys;
        if (Array.isArray(a)) {
          length = a.length;
          if (length != b.length) return false;
          for (i = length; i-- !== 0; )
            if (!equal(a[i], b[i])) return false;
          return true;
        }
        if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
        if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
        if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
        keys = Object.keys(a);
        length = keys.length;
        if (length !== Object.keys(b).length) return false;
        for (i = length; i-- !== 0; )
          if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
        for (i = length; i-- !== 0; ) {
          var key = keys[i];
          if (!equal(a[key], b[key])) return false;
        }
        return true;
      }
      return a !== a && b !== b;
    };
  }
});

// node_modules/.pnpm/ajv@8.20.0/node_modules/ajv/dist/runtime/equal.js
var require_equal = __commonJS({
  "node_modules/.pnpm/ajv@8.20.0/node_modules/ajv/dist/runtime/equal.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var equal = require_fast_deep_equal();
    equal.code = 'require("ajv/dist/runtime/equal").default';
    exports.default = equal;
  }
});

// node_modules/.pnpm/ajv@8.20.0/node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = __commonJS({
  "node_modules/.pnpm/ajv@8.20.0/node_modules/ajv/dist/runtime/ucs2length.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function ucs2length(str) {
      const len = str.length;
      let length = 0;
      let pos = 0;
      let value;
      while (pos < len) {
        length++;
        value = str.charCodeAt(pos++);
        if (value >= 55296 && value <= 56319 && pos < len) {
          value = str.charCodeAt(pos);
          if ((value & 64512) === 56320)
            pos++;
        }
      }
      return length;
    }
    exports.default = ucs2length;
    ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
  }
});

// esquemas.js
var validarGramaticaEsquema = validate52;
var schema19 = { "$schema": "https://json-schema.org/draft/2020-12/schema", "$id": "diagramador/gramatica.schema.json", "title": "Gram\xE1tica del diagramador (contrato 0.4.0)", "description": "Reglas de un dominio: idiomas, bandas, tipos de nodo, modos de flujo, escala de madurez, vigencia y l\xEDmites. Todo texto que se dibuja es un MAPA DE IDIOMA {es, en, \u2026}; la gram\xE1tica declara qu\xE9 idiomas y cu\xE1l es el base. Las referencias cruzadas (ids \xFAnicos, \xF3rdenes \xFAnicos, niveles \xFAnicos, bandas de recorrido existentes, umbrales crecientes, idiomas completos) se validan en c\xF3digo: ver CONTRATO \xA7 6.", "type": "object", "additionalProperties": false, "required": ["contrato_version", "id", "version", "nombre", "idiomas", "idioma_base", "bandas", "tipos_de_nodo", "modos_de_flujo", "escala_madurez", "vigencia", "limites"], "properties": { "contrato_version": { "$ref": "#/$defs/semver" }, "id": { "$ref": "#/$defs/id" }, "version": { "$ref": "#/$defs/semver" }, "nombre": { "$ref": "#/$defs/texto_idioma" }, "descripcion": { "type": "string", "description": "Nota para quien mantiene la gram\xE1tica; no se dibuja, por eso no es mapa de idioma" }, "idiomas": { "type": "array", "minItems": 1, "uniqueItems": true, "items": { "$ref": "#/$defs/idioma" }, "description": "Idiomas que todo texto de la gram\xE1tica y de sus mapas debe traer (G7, V14)" }, "idioma_base": { "$ref": "#/$defs/idioma", "description": "Idioma en que se redacta primero; debe estar en `idiomas` (G7)" }, "bandas": { "type": "array", "minItems": 1, "items": { "$ref": "#/$defs/banda" } }, "tipos_de_nodo": { "type": "array", "minItems": 1, "items": { "$ref": "#/$defs/tipo_de_nodo" } }, "modos_de_flujo": { "type": "array", "minItems": 1, "items": { "$ref": "#/$defs/modo_de_flujo" } }, "escala_madurez": { "type": "array", "minItems": 1, "items": { "$ref": "#/$defs/nivel_madurez" } }, "vigencia": { "type": "object", "additionalProperties": false, "required": ["umbral_revisar_dias", "umbral_vencido_dias"], "properties": { "umbral_revisar_dias": { "type": "integer", "minimum": 1 }, "umbral_vencido_dias": { "type": "integer", "minimum": 2 } } }, "recorrido_referencia": { "type": "object", "additionalProperties": false, "required": ["desde_bandas", "hasta_bandas", "llegadas"], "properties": { "desde_bandas": { "type": "array", "minItems": 1, "items": { "$ref": "#/$defs/id" } }, "hasta_bandas": { "type": "array", "minItems": 1, "items": { "$ref": "#/$defs/id" } }, "llegadas": { "enum": ["todas", "alguna"], "description": "todas: el recorrido debe terminar en CADA banda de hasta_bandas (p. ej., tablero Y agente); alguna: basta una" } } }, "limites": { "type": "object", "additionalProperties": false, "required": ["bloques_min", "bloques_max", "frases_lider_max", "nodos_por_banda_max"], "properties": { "bloques_min": { "type": "integer", "minimum": 0 }, "bloques_max": { "type": "integer", "minimum": 1 }, "frases_lider_max": { "type": "integer", "minimum": 1 }, "nodos_por_banda_max": { "type": "integer", "minimum": 1, "description": "Densidad m\xE1xima por banda en el nivel 2 (P10; V11). 6 en el piloto" } } }, "terminos_a_explicar": { "type": "object", "description": "Por idioma, los t\xE9rminos que un texto de l\xEDder no puede usar sin explicar (V9)", "propertyNames": { "$ref": "#/$defs/idioma" }, "additionalProperties": { "type": "array", "items": { "type": "string", "minLength": 1 } } } }, "$defs": { "id": { "type": "string", "pattern": "^[a-z0-9]+(-[a-z0-9]+)*$" }, "semver": { "type": "string", "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$" }, "idioma": { "type": "string", "pattern": "^[a-z]{2}$" }, "texto_idioma": { "type": "object", "description": "Mapa de idioma: una cadena no vac\xEDa por idioma declarado. El esquema exige al menos uno; que est\xE9n TODOS los de `idiomas` lo verifica el c\xF3digo (G7 en la gram\xE1tica, V14 en el mapa)", "minProperties": 1, "propertyNames": { "$ref": "#/$defs/idioma" }, "additionalProperties": { "type": "string", "minLength": 1 } }, "etiqueta_idioma": { "type": "object", "minProperties": 1, "propertyNames": { "$ref": "#/$defs/idioma" }, "additionalProperties": { "type": "string", "minLength": 1, "maxLength": 4 } }, "banda": { "type": "object", "additionalProperties": false, "required": ["id", "nombre", "clase", "orden", "pregunta_lider"], "properties": { "id": { "$ref": "#/$defs/id" }, "nombre": { "$ref": "#/$defs/texto_idioma" }, "clase": { "enum": ["capa", "carril", "transversal"] }, "orden": { "type": "integer", "minimum": 1, "description": "\xDAnico dentro de cada clase" }, "pregunta_lider": { "$ref": "#/$defs/texto_idioma" } } }, "tipo_de_nodo": { "type": "object", "additionalProperties": false, "required": ["id", "nombre", "token_color", "glifo", "etiqueta_corta"], "properties": { "id": { "$ref": "#/$defs/id" }, "nombre": { "$ref": "#/$defs/texto_idioma" }, "token_color": { "$ref": "#/$defs/id", "description": "Nombre del token; el valor por tema lo fija el design system del consumidor bajo el umbral de paleta del CONTRATO \xA7 5.2" }, "glifo": { "enum": ["circulo", "cuadrado", "rombo", "triangulo", "escudo", "estrella", "anillo", "barras"], "description": "Paths de caja 16 u en el CONTRATO \xA7 5.4 (0.3.0: salen hexagono y pentagono, entran escudo y barras)" }, "etiqueta_corta": { "$ref": "#/$defs/etiqueta_idioma" } } }, "modo_de_flujo": { "type": "object", "additionalProperties": false, "required": ["id", "nombre", "estilo_linea", "marcador", "descripcion"], "properties": { "id": { "$ref": "#/$defs/id" }, "nombre": { "$ref": "#/$defs/texto_idioma" }, "estilo_linea": { "enum": ["continua", "discontinua", "punteada", "doble"] }, "marcador": { "enum": ["cuadros", "onda", "ida-y-vuelta", "enlace", "ninguno"], "description": "Paths de caja 12 u en el CONTRATO \xA7 5.4 (0.3.0: sale reloj, entra ida-y-vuelta)" }, "descripcion": { "$ref": "#/$defs/texto_idioma" }, "exige_condicion": { "type": "boolean", "description": "Si es true, todo flujo de este modo debe traer `condicion` (V13). Ausente = false" } } }, "nivel_madurez": { "type": "object", "additionalProperties": false, "required": ["id", "nombre", "nivel", "disponible"], "properties": { "id": { "$ref": "#/$defs/id" }, "nombre": { "$ref": "#/$defs/texto_idioma" }, "nivel": { "type": "integer", "minimum": -1, "maximum": 4, "description": "Se dibuja como medidor (D13): \u22121 vac\xEDo y tachado (retirado) \xB7 0 vac\xEDo discontinuo \xB7 1 un cuarto \xB7 2 la mitad \xB7 3 tres cuartos \xB7 4 lleno. \xDAnico dentro de la escala (G2)" }, "etiqueta_corta": { "$ref": "#/$defs/etiqueta_idioma", "description": "Opcional (0.4.0, D-S1-17): el nombre largo no cabe en bloques ni nodos; si falta, el motor usa el nombre" }, "disponible": { "type": "boolean" } } } } };
var func1 = Object.prototype.hasOwnProperty;
var func0 = require_equal().default;
var func2 = require_ucs2length().default;
var pattern3 = new RegExp("^[0-9]+\\.[0-9]+\\.[0-9]+$", "u");
function validate53(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate53.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (typeof data === "string") {
    if (!pattern3.test(data)) {
      const err0 = { instancePath, schemaPath: "#/pattern", keyword: "pattern", params: { pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$" }, message: 'must match pattern "^[0-9]+\\.[0-9]+\\.[0-9]+$"' };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
  } else {
    const err1 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "string" }, message: "must be string" };
    if (vErrors === null) {
      vErrors = [err1];
    } else {
      vErrors.push(err1);
    }
    errors++;
  }
  validate53.errors = vErrors;
  return errors === 0;
}
validate53.evaluated = { "dynamicProps": false, "dynamicItems": false };
var pattern4 = new RegExp("^[a-z0-9]+(-[a-z0-9]+)*$", "u");
function validate55(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate55.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (typeof data === "string") {
    if (!pattern4.test(data)) {
      const err0 = { instancePath, schemaPath: "#/pattern", keyword: "pattern", params: { pattern: "^[a-z0-9]+(-[a-z0-9]+)*$" }, message: 'must match pattern "^[a-z0-9]+(-[a-z0-9]+)*$"' };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
  } else {
    const err1 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "string" }, message: "must be string" };
    if (vErrors === null) {
      vErrors = [err1];
    } else {
      vErrors.push(err1);
    }
    errors++;
  }
  validate55.errors = vErrors;
  return errors === 0;
}
validate55.evaluated = { "dynamicProps": false, "dynamicItems": false };
var pattern5 = new RegExp("^[a-z]{2}$", "u");
function validate59(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate59.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (typeof data === "string") {
    if (!pattern5.test(data)) {
      const err0 = { instancePath, schemaPath: "#/pattern", keyword: "pattern", params: { pattern: "^[a-z]{2}$" }, message: 'must match pattern "^[a-z]{2}$"' };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
  } else {
    const err1 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "string" }, message: "must be string" };
    if (vErrors === null) {
      vErrors = [err1];
    } else {
      vErrors.push(err1);
    }
    errors++;
  }
  validate59.errors = vErrors;
  return errors === 0;
}
validate59.evaluated = { "dynamicProps": false, "dynamicItems": false };
function validate58(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate58.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (Object.keys(data).length < 1) {
      const err0 = { instancePath, schemaPath: "#/minProperties", keyword: "minProperties", params: { limit: 1 }, message: "must NOT have fewer than 1 properties" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    for (const key0 in data) {
      const _errs1 = errors;
      if (!validate59(key0, { instancePath, parentData: data, parentDataProperty, rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate59.errors : vErrors.concat(validate59.errors);
        errors = vErrors.length;
      }
      var valid0 = _errs1 === errors;
      if (!valid0) {
        const err1 = { instancePath, schemaPath: "#/propertyNames", keyword: "propertyNames", params: { propertyName: key0 }, message: "property name must be valid" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
    }
    for (const key1 in data) {
      let data0 = data[key1];
      if (typeof data0 === "string") {
        if (func2(data0) < 1) {
          const err2 = { instancePath: instancePath + "/" + key1.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/additionalProperties/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err2];
          } else {
            vErrors.push(err2);
          }
          errors++;
        }
      } else {
        const err3 = { instancePath: instancePath + "/" + key1.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/additionalProperties/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
  } else {
    const err4 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err4];
    } else {
      vErrors.push(err4);
    }
    errors++;
  }
  validate58.errors = vErrors;
  return errors === 0;
}
validate58.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var schema24 = { "type": "object", "additionalProperties": false, "required": ["id", "nombre", "clase", "orden", "pregunta_lider"], "properties": { "id": { "$ref": "#/$defs/id" }, "nombre": { "$ref": "#/$defs/texto_idioma" }, "clase": { "enum": ["capa", "carril", "transversal"] }, "orden": { "type": "integer", "minimum": 1, "description": "\xDAnico dentro de cada clase" }, "pregunta_lider": { "$ref": "#/$defs/texto_idioma" } } };
function validate64(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate64.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.nombre === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "nombre" }, message: "must have required property 'nombre'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.clase === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "clase" }, message: "must have required property 'clase'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.orden === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "orden" }, message: "must have required property 'orden'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.pregunta_lider === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "pregunta_lider" }, message: "must have required property 'pregunta_lider'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "id" || key0 === "nombre" || key0 === "clase" || key0 === "orden" || key0 === "pregunta_lider")) {
        const err5 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.id !== void 0) {
      if (!validate55(data.id, { instancePath: instancePath + "/id", parentData: data, parentDataProperty: "id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
        errors = vErrors.length;
      }
    }
    if (data.nombre !== void 0) {
      if (!validate58(data.nombre, { instancePath: instancePath + "/nombre", parentData: data, parentDataProperty: "nombre", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate58.errors : vErrors.concat(validate58.errors);
        errors = vErrors.length;
      }
    }
    if (data.clase !== void 0) {
      let data2 = data.clase;
      if (!(data2 === "capa" || data2 === "carril" || data2 === "transversal")) {
        const err6 = { instancePath: instancePath + "/clase", schemaPath: "#/properties/clase/enum", keyword: "enum", params: { allowedValues: schema24.properties.clase.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.orden !== void 0) {
      let data3 = data.orden;
      if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)) && isFinite(data3))) {
        const err7 = { instancePath: instancePath + "/orden", schemaPath: "#/properties/orden/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
      if (typeof data3 == "number" && isFinite(data3)) {
        if (data3 < 1 || isNaN(data3)) {
          const err8 = { instancePath: instancePath + "/orden", schemaPath: "#/properties/orden/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      }
    }
    if (data.pregunta_lider !== void 0) {
      if (!validate58(data.pregunta_lider, { instancePath: instancePath + "/pregunta_lider", parentData: data, parentDataProperty: "pregunta_lider", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate58.errors : vErrors.concat(validate58.errors);
        errors = vErrors.length;
      }
    }
  } else {
    const err9 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err9];
    } else {
      vErrors.push(err9);
    }
    errors++;
  }
  validate64.errors = vErrors;
  return errors === 0;
}
validate64.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var schema25 = { "type": "object", "additionalProperties": false, "required": ["id", "nombre", "token_color", "glifo", "etiqueta_corta"], "properties": { "id": { "$ref": "#/$defs/id" }, "nombre": { "$ref": "#/$defs/texto_idioma" }, "token_color": { "$ref": "#/$defs/id", "description": "Nombre del token; el valor por tema lo fija el design system del consumidor bajo el umbral de paleta del CONTRATO \xA7 5.2" }, "glifo": { "enum": ["circulo", "cuadrado", "rombo", "triangulo", "escudo", "estrella", "anillo", "barras"], "description": "Paths de caja 16 u en el CONTRATO \xA7 5.4 (0.3.0: salen hexagono y pentagono, entran escudo y barras)" }, "etiqueta_corta": { "$ref": "#/$defs/etiqueta_idioma" } } };
function validate73(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate73.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (Object.keys(data).length < 1) {
      const err0 = { instancePath, schemaPath: "#/minProperties", keyword: "minProperties", params: { limit: 1 }, message: "must NOT have fewer than 1 properties" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    for (const key0 in data) {
      const _errs1 = errors;
      if (!validate59(key0, { instancePath, parentData: data, parentDataProperty, rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate59.errors : vErrors.concat(validate59.errors);
        errors = vErrors.length;
      }
      var valid0 = _errs1 === errors;
      if (!valid0) {
        const err1 = { instancePath, schemaPath: "#/propertyNames", keyword: "propertyNames", params: { propertyName: key0 }, message: "property name must be valid" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
    }
    for (const key1 in data) {
      let data0 = data[key1];
      if (typeof data0 === "string") {
        if (func2(data0) > 4) {
          const err2 = { instancePath: instancePath + "/" + key1.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/additionalProperties/maxLength", keyword: "maxLength", params: { limit: 4 }, message: "must NOT have more than 4 characters" };
          if (vErrors === null) {
            vErrors = [err2];
          } else {
            vErrors.push(err2);
          }
          errors++;
        }
        if (func2(data0) < 1) {
          const err3 = { instancePath: instancePath + "/" + key1.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/additionalProperties/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      } else {
        const err4 = { instancePath: instancePath + "/" + key1.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/additionalProperties/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
  } else {
    const err5 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err5];
    } else {
      vErrors.push(err5);
    }
    errors++;
  }
  validate73.errors = vErrors;
  return errors === 0;
}
validate73.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
function validate69(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate69.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.nombre === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "nombre" }, message: "must have required property 'nombre'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.token_color === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "token_color" }, message: "must have required property 'token_color'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.glifo === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "glifo" }, message: "must have required property 'glifo'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.etiqueta_corta === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "etiqueta_corta" }, message: "must have required property 'etiqueta_corta'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "id" || key0 === "nombre" || key0 === "token_color" || key0 === "glifo" || key0 === "etiqueta_corta")) {
        const err5 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.id !== void 0) {
      if (!validate55(data.id, { instancePath: instancePath + "/id", parentData: data, parentDataProperty: "id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
        errors = vErrors.length;
      }
    }
    if (data.nombre !== void 0) {
      if (!validate58(data.nombre, { instancePath: instancePath + "/nombre", parentData: data, parentDataProperty: "nombre", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate58.errors : vErrors.concat(validate58.errors);
        errors = vErrors.length;
      }
    }
    if (data.token_color !== void 0) {
      if (!validate55(data.token_color, { instancePath: instancePath + "/token_color", parentData: data, parentDataProperty: "token_color", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
        errors = vErrors.length;
      }
    }
    if (data.glifo !== void 0) {
      let data3 = data.glifo;
      if (!(data3 === "circulo" || data3 === "cuadrado" || data3 === "rombo" || data3 === "triangulo" || data3 === "escudo" || data3 === "estrella" || data3 === "anillo" || data3 === "barras")) {
        const err6 = { instancePath: instancePath + "/glifo", schemaPath: "#/properties/glifo/enum", keyword: "enum", params: { allowedValues: schema25.properties.glifo.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.etiqueta_corta !== void 0) {
      if (!validate73(data.etiqueta_corta, { instancePath: instancePath + "/etiqueta_corta", parentData: data, parentDataProperty: "etiqueta_corta", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate73.errors : vErrors.concat(validate73.errors);
        errors = vErrors.length;
      }
    }
  } else {
    const err7 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err7];
    } else {
      vErrors.push(err7);
    }
    errors++;
  }
  validate69.errors = vErrors;
  return errors === 0;
}
validate69.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var schema27 = { "type": "object", "additionalProperties": false, "required": ["id", "nombre", "estilo_linea", "marcador", "descripcion"], "properties": { "id": { "$ref": "#/$defs/id" }, "nombre": { "$ref": "#/$defs/texto_idioma" }, "estilo_linea": { "enum": ["continua", "discontinua", "punteada", "doble"] }, "marcador": { "enum": ["cuadros", "onda", "ida-y-vuelta", "enlace", "ninguno"], "description": "Paths de caja 12 u en el CONTRATO \xA7 5.4 (0.3.0: sale reloj, entra ida-y-vuelta)" }, "descripcion": { "$ref": "#/$defs/texto_idioma" }, "exige_condicion": { "type": "boolean", "description": "Si es true, todo flujo de este modo debe traer `condicion` (V13). Ausente = false" } } };
function validate77(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate77.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.nombre === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "nombre" }, message: "must have required property 'nombre'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.estilo_linea === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "estilo_linea" }, message: "must have required property 'estilo_linea'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.marcador === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "marcador" }, message: "must have required property 'marcador'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.descripcion === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "descripcion" }, message: "must have required property 'descripcion'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "id" || key0 === "nombre" || key0 === "estilo_linea" || key0 === "marcador" || key0 === "descripcion" || key0 === "exige_condicion")) {
        const err5 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.id !== void 0) {
      if (!validate55(data.id, { instancePath: instancePath + "/id", parentData: data, parentDataProperty: "id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
        errors = vErrors.length;
      }
    }
    if (data.nombre !== void 0) {
      if (!validate58(data.nombre, { instancePath: instancePath + "/nombre", parentData: data, parentDataProperty: "nombre", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate58.errors : vErrors.concat(validate58.errors);
        errors = vErrors.length;
      }
    }
    if (data.estilo_linea !== void 0) {
      let data2 = data.estilo_linea;
      if (!(data2 === "continua" || data2 === "discontinua" || data2 === "punteada" || data2 === "doble")) {
        const err6 = { instancePath: instancePath + "/estilo_linea", schemaPath: "#/properties/estilo_linea/enum", keyword: "enum", params: { allowedValues: schema27.properties.estilo_linea.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.marcador !== void 0) {
      let data3 = data.marcador;
      if (!(data3 === "cuadros" || data3 === "onda" || data3 === "ida-y-vuelta" || data3 === "enlace" || data3 === "ninguno")) {
        const err7 = { instancePath: instancePath + "/marcador", schemaPath: "#/properties/marcador/enum", keyword: "enum", params: { allowedValues: schema27.properties.marcador.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.descripcion !== void 0) {
      if (!validate58(data.descripcion, { instancePath: instancePath + "/descripcion", parentData: data, parentDataProperty: "descripcion", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate58.errors : vErrors.concat(validate58.errors);
        errors = vErrors.length;
      }
    }
    if (data.exige_condicion !== void 0) {
      if (typeof data.exige_condicion !== "boolean") {
        const err8 = { instancePath: instancePath + "/exige_condicion", schemaPath: "#/properties/exige_condicion/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
  } else {
    const err9 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err9];
    } else {
      vErrors.push(err9);
    }
    errors++;
  }
  validate77.errors = vErrors;
  return errors === 0;
}
validate77.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
function validate82(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate82.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.nombre === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "nombre" }, message: "must have required property 'nombre'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.nivel === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "nivel" }, message: "must have required property 'nivel'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.disponible === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "disponible" }, message: "must have required property 'disponible'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "id" || key0 === "nombre" || key0 === "nivel" || key0 === "etiqueta_corta" || key0 === "disponible")) {
        const err4 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.id !== void 0) {
      if (!validate55(data.id, { instancePath: instancePath + "/id", parentData: data, parentDataProperty: "id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
        errors = vErrors.length;
      }
    }
    if (data.nombre !== void 0) {
      if (!validate58(data.nombre, { instancePath: instancePath + "/nombre", parentData: data, parentDataProperty: "nombre", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate58.errors : vErrors.concat(validate58.errors);
        errors = vErrors.length;
      }
    }
    if (data.nivel !== void 0) {
      let data2 = data.nivel;
      if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)) && isFinite(data2))) {
        const err5 = { instancePath: instancePath + "/nivel", schemaPath: "#/properties/nivel/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
      if (typeof data2 == "number" && isFinite(data2)) {
        if (data2 > 4 || isNaN(data2)) {
          const err6 = { instancePath: instancePath + "/nivel", schemaPath: "#/properties/nivel/maximum", keyword: "maximum", params: { comparison: "<=", limit: 4 }, message: "must be <= 4" };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
        if (data2 < -1 || isNaN(data2)) {
          const err7 = { instancePath: instancePath + "/nivel", schemaPath: "#/properties/nivel/minimum", keyword: "minimum", params: { comparison: ">=", limit: -1 }, message: "must be >= -1" };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
      }
    }
    if (data.etiqueta_corta !== void 0) {
      if (!validate73(data.etiqueta_corta, { instancePath: instancePath + "/etiqueta_corta", parentData: data, parentDataProperty: "etiqueta_corta", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate73.errors : vErrors.concat(validate73.errors);
        errors = vErrors.length;
      }
    }
    if (data.disponible !== void 0) {
      if (typeof data.disponible !== "boolean") {
        const err8 = { instancePath: instancePath + "/disponible", schemaPath: "#/properties/disponible/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
  } else {
    const err9 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err9];
    } else {
      vErrors.push(err9);
    }
    errors++;
  }
  validate82.errors = vErrors;
  return errors === 0;
}
validate82.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
function validate52(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate52.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.contrato_version === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "contrato_version" }, message: "must have required property 'contrato_version'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.id === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.version === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "version" }, message: "must have required property 'version'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.nombre === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "nombre" }, message: "must have required property 'nombre'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.idiomas === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "idiomas" }, message: "must have required property 'idiomas'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.idioma_base === void 0) {
      const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "idioma_base" }, message: "must have required property 'idioma_base'" };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    if (data.bandas === void 0) {
      const err6 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "bandas" }, message: "must have required property 'bandas'" };
      if (vErrors === null) {
        vErrors = [err6];
      } else {
        vErrors.push(err6);
      }
      errors++;
    }
    if (data.tipos_de_nodo === void 0) {
      const err7 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "tipos_de_nodo" }, message: "must have required property 'tipos_de_nodo'" };
      if (vErrors === null) {
        vErrors = [err7];
      } else {
        vErrors.push(err7);
      }
      errors++;
    }
    if (data.modos_de_flujo === void 0) {
      const err8 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "modos_de_flujo" }, message: "must have required property 'modos_de_flujo'" };
      if (vErrors === null) {
        vErrors = [err8];
      } else {
        vErrors.push(err8);
      }
      errors++;
    }
    if (data.escala_madurez === void 0) {
      const err9 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "escala_madurez" }, message: "must have required property 'escala_madurez'" };
      if (vErrors === null) {
        vErrors = [err9];
      } else {
        vErrors.push(err9);
      }
      errors++;
    }
    if (data.vigencia === void 0) {
      const err10 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "vigencia" }, message: "must have required property 'vigencia'" };
      if (vErrors === null) {
        vErrors = [err10];
      } else {
        vErrors.push(err10);
      }
      errors++;
    }
    if (data.limites === void 0) {
      const err11 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "limites" }, message: "must have required property 'limites'" };
      if (vErrors === null) {
        vErrors = [err11];
      } else {
        vErrors.push(err11);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!func1.call(schema19.properties, key0)) {
        const err12 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
    }
    if (data.contrato_version !== void 0) {
      if (!validate53(data.contrato_version, { instancePath: instancePath + "/contrato_version", parentData: data, parentDataProperty: "contrato_version", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
        errors = vErrors.length;
      }
    }
    if (data.id !== void 0) {
      if (!validate55(data.id, { instancePath: instancePath + "/id", parentData: data, parentDataProperty: "id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
        errors = vErrors.length;
      }
    }
    if (data.version !== void 0) {
      if (!validate53(data.version, { instancePath: instancePath + "/version", parentData: data, parentDataProperty: "version", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
        errors = vErrors.length;
      }
    }
    if (data.nombre !== void 0) {
      if (!validate58(data.nombre, { instancePath: instancePath + "/nombre", parentData: data, parentDataProperty: "nombre", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate58.errors : vErrors.concat(validate58.errors);
        errors = vErrors.length;
      }
    }
    if (data.descripcion !== void 0) {
      if (typeof data.descripcion !== "string") {
        const err13 = { instancePath: instancePath + "/descripcion", schemaPath: "#/properties/descripcion/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
    if (data.idiomas !== void 0) {
      let data5 = data.idiomas;
      if (Array.isArray(data5)) {
        if (data5.length < 1) {
          const err14 = { instancePath: instancePath + "/idiomas", schemaPath: "#/properties/idiomas/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
        const len0 = data5.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (!validate59(data5[i0], { instancePath: instancePath + "/idiomas/" + i0, parentData: data5, parentDataProperty: i0, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate59.errors : vErrors.concat(validate59.errors);
            errors = vErrors.length;
          }
        }
        let i1 = data5.length;
        let j0;
        if (i1 > 1) {
          outer0: for (; i1--; ) {
            for (j0 = i1; j0--; ) {
              if (func0(data5[i1], data5[j0])) {
                const err15 = { instancePath: instancePath + "/idiomas", schemaPath: "#/properties/idiomas/uniqueItems", keyword: "uniqueItems", params: { i: i1, j: j0 }, message: "must NOT have duplicate items (items ## " + j0 + " and " + i1 + " are identical)" };
                if (vErrors === null) {
                  vErrors = [err15];
                } else {
                  vErrors.push(err15);
                }
                errors++;
                break outer0;
              }
            }
          }
        }
      } else {
        const err16 = { instancePath: instancePath + "/idiomas", schemaPath: "#/properties/idiomas/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err16];
        } else {
          vErrors.push(err16);
        }
        errors++;
      }
    }
    if (data.idioma_base !== void 0) {
      if (!validate59(data.idioma_base, { instancePath: instancePath + "/idioma_base", parentData: data, parentDataProperty: "idioma_base", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate59.errors : vErrors.concat(validate59.errors);
        errors = vErrors.length;
      }
    }
    if (data.bandas !== void 0) {
      let data8 = data.bandas;
      if (Array.isArray(data8)) {
        if (data8.length < 1) {
          const err17 = { instancePath: instancePath + "/bandas", schemaPath: "#/properties/bandas/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
          if (vErrors === null) {
            vErrors = [err17];
          } else {
            vErrors.push(err17);
          }
          errors++;
        }
        const len1 = data8.length;
        for (let i2 = 0; i2 < len1; i2++) {
          if (!validate64(data8[i2], { instancePath: instancePath + "/bandas/" + i2, parentData: data8, parentDataProperty: i2, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate64.errors : vErrors.concat(validate64.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err18 = { instancePath: instancePath + "/bandas", schemaPath: "#/properties/bandas/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err18];
        } else {
          vErrors.push(err18);
        }
        errors++;
      }
    }
    if (data.tipos_de_nodo !== void 0) {
      let data10 = data.tipos_de_nodo;
      if (Array.isArray(data10)) {
        if (data10.length < 1) {
          const err19 = { instancePath: instancePath + "/tipos_de_nodo", schemaPath: "#/properties/tipos_de_nodo/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
          if (vErrors === null) {
            vErrors = [err19];
          } else {
            vErrors.push(err19);
          }
          errors++;
        }
        const len2 = data10.length;
        for (let i3 = 0; i3 < len2; i3++) {
          if (!validate69(data10[i3], { instancePath: instancePath + "/tipos_de_nodo/" + i3, parentData: data10, parentDataProperty: i3, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate69.errors : vErrors.concat(validate69.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err20 = { instancePath: instancePath + "/tipos_de_nodo", schemaPath: "#/properties/tipos_de_nodo/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err20];
        } else {
          vErrors.push(err20);
        }
        errors++;
      }
    }
    if (data.modos_de_flujo !== void 0) {
      let data12 = data.modos_de_flujo;
      if (Array.isArray(data12)) {
        if (data12.length < 1) {
          const err21 = { instancePath: instancePath + "/modos_de_flujo", schemaPath: "#/properties/modos_de_flujo/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
          if (vErrors === null) {
            vErrors = [err21];
          } else {
            vErrors.push(err21);
          }
          errors++;
        }
        const len3 = data12.length;
        for (let i4 = 0; i4 < len3; i4++) {
          if (!validate77(data12[i4], { instancePath: instancePath + "/modos_de_flujo/" + i4, parentData: data12, parentDataProperty: i4, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate77.errors : vErrors.concat(validate77.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err22 = { instancePath: instancePath + "/modos_de_flujo", schemaPath: "#/properties/modos_de_flujo/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err22];
        } else {
          vErrors.push(err22);
        }
        errors++;
      }
    }
    if (data.escala_madurez !== void 0) {
      let data14 = data.escala_madurez;
      if (Array.isArray(data14)) {
        if (data14.length < 1) {
          const err23 = { instancePath: instancePath + "/escala_madurez", schemaPath: "#/properties/escala_madurez/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
          if (vErrors === null) {
            vErrors = [err23];
          } else {
            vErrors.push(err23);
          }
          errors++;
        }
        const len4 = data14.length;
        for (let i5 = 0; i5 < len4; i5++) {
          if (!validate82(data14[i5], { instancePath: instancePath + "/escala_madurez/" + i5, parentData: data14, parentDataProperty: i5, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate82.errors : vErrors.concat(validate82.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err24 = { instancePath: instancePath + "/escala_madurez", schemaPath: "#/properties/escala_madurez/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err24];
        } else {
          vErrors.push(err24);
        }
        errors++;
      }
    }
    if (data.vigencia !== void 0) {
      let data16 = data.vigencia;
      if (data16 && typeof data16 == "object" && !Array.isArray(data16)) {
        if (data16.umbral_revisar_dias === void 0) {
          const err25 = { instancePath: instancePath + "/vigencia", schemaPath: "#/properties/vigencia/required", keyword: "required", params: { missingProperty: "umbral_revisar_dias" }, message: "must have required property 'umbral_revisar_dias'" };
          if (vErrors === null) {
            vErrors = [err25];
          } else {
            vErrors.push(err25);
          }
          errors++;
        }
        if (data16.umbral_vencido_dias === void 0) {
          const err26 = { instancePath: instancePath + "/vigencia", schemaPath: "#/properties/vigencia/required", keyword: "required", params: { missingProperty: "umbral_vencido_dias" }, message: "must have required property 'umbral_vencido_dias'" };
          if (vErrors === null) {
            vErrors = [err26];
          } else {
            vErrors.push(err26);
          }
          errors++;
        }
        for (const key1 in data16) {
          if (!(key1 === "umbral_revisar_dias" || key1 === "umbral_vencido_dias")) {
            const err27 = { instancePath: instancePath + "/vigencia", schemaPath: "#/properties/vigencia/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err27];
            } else {
              vErrors.push(err27);
            }
            errors++;
          }
        }
        if (data16.umbral_revisar_dias !== void 0) {
          let data17 = data16.umbral_revisar_dias;
          if (!(typeof data17 == "number" && (!(data17 % 1) && !isNaN(data17)) && isFinite(data17))) {
            const err28 = { instancePath: instancePath + "/vigencia/umbral_revisar_dias", schemaPath: "#/properties/vigencia/properties/umbral_revisar_dias/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
            if (vErrors === null) {
              vErrors = [err28];
            } else {
              vErrors.push(err28);
            }
            errors++;
          }
          if (typeof data17 == "number" && isFinite(data17)) {
            if (data17 < 1 || isNaN(data17)) {
              const err29 = { instancePath: instancePath + "/vigencia/umbral_revisar_dias", schemaPath: "#/properties/vigencia/properties/umbral_revisar_dias/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
              if (vErrors === null) {
                vErrors = [err29];
              } else {
                vErrors.push(err29);
              }
              errors++;
            }
          }
        }
        if (data16.umbral_vencido_dias !== void 0) {
          let data18 = data16.umbral_vencido_dias;
          if (!(typeof data18 == "number" && (!(data18 % 1) && !isNaN(data18)) && isFinite(data18))) {
            const err30 = { instancePath: instancePath + "/vigencia/umbral_vencido_dias", schemaPath: "#/properties/vigencia/properties/umbral_vencido_dias/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
            if (vErrors === null) {
              vErrors = [err30];
            } else {
              vErrors.push(err30);
            }
            errors++;
          }
          if (typeof data18 == "number" && isFinite(data18)) {
            if (data18 < 2 || isNaN(data18)) {
              const err31 = { instancePath: instancePath + "/vigencia/umbral_vencido_dias", schemaPath: "#/properties/vigencia/properties/umbral_vencido_dias/minimum", keyword: "minimum", params: { comparison: ">=", limit: 2 }, message: "must be >= 2" };
              if (vErrors === null) {
                vErrors = [err31];
              } else {
                vErrors.push(err31);
              }
              errors++;
            }
          }
        }
      } else {
        const err32 = { instancePath: instancePath + "/vigencia", schemaPath: "#/properties/vigencia/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err32];
        } else {
          vErrors.push(err32);
        }
        errors++;
      }
    }
    if (data.recorrido_referencia !== void 0) {
      let data19 = data.recorrido_referencia;
      if (data19 && typeof data19 == "object" && !Array.isArray(data19)) {
        if (data19.desde_bandas === void 0) {
          const err33 = { instancePath: instancePath + "/recorrido_referencia", schemaPath: "#/properties/recorrido_referencia/required", keyword: "required", params: { missingProperty: "desde_bandas" }, message: "must have required property 'desde_bandas'" };
          if (vErrors === null) {
            vErrors = [err33];
          } else {
            vErrors.push(err33);
          }
          errors++;
        }
        if (data19.hasta_bandas === void 0) {
          const err34 = { instancePath: instancePath + "/recorrido_referencia", schemaPath: "#/properties/recorrido_referencia/required", keyword: "required", params: { missingProperty: "hasta_bandas" }, message: "must have required property 'hasta_bandas'" };
          if (vErrors === null) {
            vErrors = [err34];
          } else {
            vErrors.push(err34);
          }
          errors++;
        }
        if (data19.llegadas === void 0) {
          const err35 = { instancePath: instancePath + "/recorrido_referencia", schemaPath: "#/properties/recorrido_referencia/required", keyword: "required", params: { missingProperty: "llegadas" }, message: "must have required property 'llegadas'" };
          if (vErrors === null) {
            vErrors = [err35];
          } else {
            vErrors.push(err35);
          }
          errors++;
        }
        for (const key2 in data19) {
          if (!(key2 === "desde_bandas" || key2 === "hasta_bandas" || key2 === "llegadas")) {
            const err36 = { instancePath: instancePath + "/recorrido_referencia", schemaPath: "#/properties/recorrido_referencia/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err36];
            } else {
              vErrors.push(err36);
            }
            errors++;
          }
        }
        if (data19.desde_bandas !== void 0) {
          let data20 = data19.desde_bandas;
          if (Array.isArray(data20)) {
            if (data20.length < 1) {
              const err37 = { instancePath: instancePath + "/recorrido_referencia/desde_bandas", schemaPath: "#/properties/recorrido_referencia/properties/desde_bandas/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
              if (vErrors === null) {
                vErrors = [err37];
              } else {
                vErrors.push(err37);
              }
              errors++;
            }
            const len5 = data20.length;
            for (let i6 = 0; i6 < len5; i6++) {
              if (!validate55(data20[i6], { instancePath: instancePath + "/recorrido_referencia/desde_bandas/" + i6, parentData: data20, parentDataProperty: i6, rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
                errors = vErrors.length;
              }
            }
          } else {
            const err38 = { instancePath: instancePath + "/recorrido_referencia/desde_bandas", schemaPath: "#/properties/recorrido_referencia/properties/desde_bandas/type", keyword: "type", params: { type: "array" }, message: "must be array" };
            if (vErrors === null) {
              vErrors = [err38];
            } else {
              vErrors.push(err38);
            }
            errors++;
          }
        }
        if (data19.hasta_bandas !== void 0) {
          let data22 = data19.hasta_bandas;
          if (Array.isArray(data22)) {
            if (data22.length < 1) {
              const err39 = { instancePath: instancePath + "/recorrido_referencia/hasta_bandas", schemaPath: "#/properties/recorrido_referencia/properties/hasta_bandas/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
              if (vErrors === null) {
                vErrors = [err39];
              } else {
                vErrors.push(err39);
              }
              errors++;
            }
            const len6 = data22.length;
            for (let i7 = 0; i7 < len6; i7++) {
              if (!validate55(data22[i7], { instancePath: instancePath + "/recorrido_referencia/hasta_bandas/" + i7, parentData: data22, parentDataProperty: i7, rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
                errors = vErrors.length;
              }
            }
          } else {
            const err40 = { instancePath: instancePath + "/recorrido_referencia/hasta_bandas", schemaPath: "#/properties/recorrido_referencia/properties/hasta_bandas/type", keyword: "type", params: { type: "array" }, message: "must be array" };
            if (vErrors === null) {
              vErrors = [err40];
            } else {
              vErrors.push(err40);
            }
            errors++;
          }
        }
        if (data19.llegadas !== void 0) {
          let data24 = data19.llegadas;
          if (!(data24 === "todas" || data24 === "alguna")) {
            const err41 = { instancePath: instancePath + "/recorrido_referencia/llegadas", schemaPath: "#/properties/recorrido_referencia/properties/llegadas/enum", keyword: "enum", params: { allowedValues: schema19.properties.recorrido_referencia.properties.llegadas.enum }, message: "must be equal to one of the allowed values" };
            if (vErrors === null) {
              vErrors = [err41];
            } else {
              vErrors.push(err41);
            }
            errors++;
          }
        }
      } else {
        const err42 = { instancePath: instancePath + "/recorrido_referencia", schemaPath: "#/properties/recorrido_referencia/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err42];
        } else {
          vErrors.push(err42);
        }
        errors++;
      }
    }
    if (data.limites !== void 0) {
      let data25 = data.limites;
      if (data25 && typeof data25 == "object" && !Array.isArray(data25)) {
        if (data25.bloques_min === void 0) {
          const err43 = { instancePath: instancePath + "/limites", schemaPath: "#/properties/limites/required", keyword: "required", params: { missingProperty: "bloques_min" }, message: "must have required property 'bloques_min'" };
          if (vErrors === null) {
            vErrors = [err43];
          } else {
            vErrors.push(err43);
          }
          errors++;
        }
        if (data25.bloques_max === void 0) {
          const err44 = { instancePath: instancePath + "/limites", schemaPath: "#/properties/limites/required", keyword: "required", params: { missingProperty: "bloques_max" }, message: "must have required property 'bloques_max'" };
          if (vErrors === null) {
            vErrors = [err44];
          } else {
            vErrors.push(err44);
          }
          errors++;
        }
        if (data25.frases_lider_max === void 0) {
          const err45 = { instancePath: instancePath + "/limites", schemaPath: "#/properties/limites/required", keyword: "required", params: { missingProperty: "frases_lider_max" }, message: "must have required property 'frases_lider_max'" };
          if (vErrors === null) {
            vErrors = [err45];
          } else {
            vErrors.push(err45);
          }
          errors++;
        }
        if (data25.nodos_por_banda_max === void 0) {
          const err46 = { instancePath: instancePath + "/limites", schemaPath: "#/properties/limites/required", keyword: "required", params: { missingProperty: "nodos_por_banda_max" }, message: "must have required property 'nodos_por_banda_max'" };
          if (vErrors === null) {
            vErrors = [err46];
          } else {
            vErrors.push(err46);
          }
          errors++;
        }
        for (const key3 in data25) {
          if (!(key3 === "bloques_min" || key3 === "bloques_max" || key3 === "frases_lider_max" || key3 === "nodos_por_banda_max")) {
            const err47 = { instancePath: instancePath + "/limites", schemaPath: "#/properties/limites/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key3 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err47];
            } else {
              vErrors.push(err47);
            }
            errors++;
          }
        }
        if (data25.bloques_min !== void 0) {
          let data26 = data25.bloques_min;
          if (!(typeof data26 == "number" && (!(data26 % 1) && !isNaN(data26)) && isFinite(data26))) {
            const err48 = { instancePath: instancePath + "/limites/bloques_min", schemaPath: "#/properties/limites/properties/bloques_min/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
            if (vErrors === null) {
              vErrors = [err48];
            } else {
              vErrors.push(err48);
            }
            errors++;
          }
          if (typeof data26 == "number" && isFinite(data26)) {
            if (data26 < 0 || isNaN(data26)) {
              const err49 = { instancePath: instancePath + "/limites/bloques_min", schemaPath: "#/properties/limites/properties/bloques_min/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
              if (vErrors === null) {
                vErrors = [err49];
              } else {
                vErrors.push(err49);
              }
              errors++;
            }
          }
        }
        if (data25.bloques_max !== void 0) {
          let data27 = data25.bloques_max;
          if (!(typeof data27 == "number" && (!(data27 % 1) && !isNaN(data27)) && isFinite(data27))) {
            const err50 = { instancePath: instancePath + "/limites/bloques_max", schemaPath: "#/properties/limites/properties/bloques_max/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
            if (vErrors === null) {
              vErrors = [err50];
            } else {
              vErrors.push(err50);
            }
            errors++;
          }
          if (typeof data27 == "number" && isFinite(data27)) {
            if (data27 < 1 || isNaN(data27)) {
              const err51 = { instancePath: instancePath + "/limites/bloques_max", schemaPath: "#/properties/limites/properties/bloques_max/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
              if (vErrors === null) {
                vErrors = [err51];
              } else {
                vErrors.push(err51);
              }
              errors++;
            }
          }
        }
        if (data25.frases_lider_max !== void 0) {
          let data28 = data25.frases_lider_max;
          if (!(typeof data28 == "number" && (!(data28 % 1) && !isNaN(data28)) && isFinite(data28))) {
            const err52 = { instancePath: instancePath + "/limites/frases_lider_max", schemaPath: "#/properties/limites/properties/frases_lider_max/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
            if (vErrors === null) {
              vErrors = [err52];
            } else {
              vErrors.push(err52);
            }
            errors++;
          }
          if (typeof data28 == "number" && isFinite(data28)) {
            if (data28 < 1 || isNaN(data28)) {
              const err53 = { instancePath: instancePath + "/limites/frases_lider_max", schemaPath: "#/properties/limites/properties/frases_lider_max/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
              if (vErrors === null) {
                vErrors = [err53];
              } else {
                vErrors.push(err53);
              }
              errors++;
            }
          }
        }
        if (data25.nodos_por_banda_max !== void 0) {
          let data29 = data25.nodos_por_banda_max;
          if (!(typeof data29 == "number" && (!(data29 % 1) && !isNaN(data29)) && isFinite(data29))) {
            const err54 = { instancePath: instancePath + "/limites/nodos_por_banda_max", schemaPath: "#/properties/limites/properties/nodos_por_banda_max/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
            if (vErrors === null) {
              vErrors = [err54];
            } else {
              vErrors.push(err54);
            }
            errors++;
          }
          if (typeof data29 == "number" && isFinite(data29)) {
            if (data29 < 1 || isNaN(data29)) {
              const err55 = { instancePath: instancePath + "/limites/nodos_por_banda_max", schemaPath: "#/properties/limites/properties/nodos_por_banda_max/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
              if (vErrors === null) {
                vErrors = [err55];
              } else {
                vErrors.push(err55);
              }
              errors++;
            }
          }
        }
      } else {
        const err56 = { instancePath: instancePath + "/limites", schemaPath: "#/properties/limites/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err56];
        } else {
          vErrors.push(err56);
        }
        errors++;
      }
    }
    if (data.terminos_a_explicar !== void 0) {
      let data30 = data.terminos_a_explicar;
      if (data30 && typeof data30 == "object" && !Array.isArray(data30)) {
        for (const key4 in data30) {
          const _errs54 = errors;
          if (!validate59(key4, { instancePath: instancePath + "/terminos_a_explicar", parentData: data30, parentDataProperty: "terminos_a_explicar", rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate59.errors : vErrors.concat(validate59.errors);
            errors = vErrors.length;
          }
          var valid19 = _errs54 === errors;
          if (!valid19) {
            const err57 = { instancePath: instancePath + "/terminos_a_explicar", schemaPath: "#/properties/terminos_a_explicar/propertyNames", keyword: "propertyNames", params: { propertyName: key4 }, message: "property name must be valid" };
            if (vErrors === null) {
              vErrors = [err57];
            } else {
              vErrors.push(err57);
            }
            errors++;
          }
        }
        for (const key5 in data30) {
          let data31 = data30[key5];
          if (Array.isArray(data31)) {
            const len7 = data31.length;
            for (let i8 = 0; i8 < len7; i8++) {
              let data32 = data31[i8];
              if (typeof data32 === "string") {
                if (func2(data32) < 1) {
                  const err58 = { instancePath: instancePath + "/terminos_a_explicar/" + key5.replace(/~/g, "~0").replace(/\//g, "~1") + "/" + i8, schemaPath: "#/properties/terminos_a_explicar/additionalProperties/items/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err58];
                  } else {
                    vErrors.push(err58);
                  }
                  errors++;
                }
              } else {
                const err59 = { instancePath: instancePath + "/terminos_a_explicar/" + key5.replace(/~/g, "~0").replace(/\//g, "~1") + "/" + i8, schemaPath: "#/properties/terminos_a_explicar/additionalProperties/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err59];
                } else {
                  vErrors.push(err59);
                }
                errors++;
              }
            }
          } else {
            const err60 = { instancePath: instancePath + "/terminos_a_explicar/" + key5.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/properties/terminos_a_explicar/additionalProperties/type", keyword: "type", params: { type: "array" }, message: "must be array" };
            if (vErrors === null) {
              vErrors = [err60];
            } else {
              vErrors.push(err60);
            }
            errors++;
          }
        }
      } else {
        const err61 = { instancePath: instancePath + "/terminos_a_explicar", schemaPath: "#/properties/terminos_a_explicar/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err61];
        } else {
          vErrors.push(err61);
        }
        errors++;
      }
    }
  } else {
    const err62 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err62];
    } else {
      vErrors.push(err62);
    }
    errors++;
  }
  validate52.errors = vErrors;
  return errors === 0;
}
validate52.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var validarMapaEsquema = validate90;
var schema29 = { "$schema": "https://json-schema.org/draft/2020-12/schema", "$id": "diagramador/mapa.schema.json", "title": "Mapa del diagramador (contrato 0.4.0)", "description": "Contenido de un sujeto bajo una gram\xE1tica. Todo texto que se dibuja o se lee es un MAPA DE IDIOMA {es, en, \u2026} con los idiomas que declara la gram\xE1tica (V14). El esquema valida forma; las referencias contra la gram\xE1tica y dentro del mapa (bandas, tipos, modos, madurez, flujos, condiciones, recorridos, bloques, densidad, ids \xFAnicos, idiomas, cobertura de la fuente) se validan en c\xF3digo: ver CONTRATO \xA7 6.", "type": "object", "additionalProperties": false, "required": ["contrato_version", "gramatica_id", "gramatica_version", "sujeto_id", "sujeto_nombre", "version", "fecha_actualizacion", "estado", "bloques", "nodos", "flujos", "recorridos"], "properties": { "contrato_version": { "$ref": "#/$defs/semver" }, "gramatica_id": { "$ref": "#/$defs/id" }, "gramatica_version": { "$ref": "#/$defs/semver" }, "sujeto_id": { "$ref": "#/$defs/id" }, "sujeto_nombre": { "$ref": "#/$defs/texto_idioma" }, "version": { "$ref": "#/$defs/semver" }, "fecha_actualizacion": { "$ref": "#/$defs/fecha" }, "estado": { "enum": ["propuesta", "aprobada", "rechazada"] }, "bloques": { "type": "array", "items": { "$ref": "#/$defs/bloque" } }, "nodos": { "type": "array", "minItems": 1, "items": { "$ref": "#/$defs/nodo" } }, "flujos": { "type": "array", "items": { "$ref": "#/$defs/flujo" } }, "recorridos": { "type": "array", "items": { "$ref": "#/$defs/recorrido" } }, "glosario": { "$ref": "#/$defs/diccionario_idioma", "description": "Por idioma, t\xE9rminos explicados para TODO el mapa (nodos, bloques, flujos y pasos). Un nodo puede adem\xE1s explicar los suyos en `terminos`. El renderizador muestra la explicaci\xF3n donde el t\xE9rmino aparece (F-001)." }, "refs_externas": { "$ref": "#/$defs/refs" } }, "$defs": { "id": { "type": "string", "pattern": "^[a-z0-9]+(-[a-z0-9]+)*$" }, "semver": { "type": "string", "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$" }, "fecha": { "type": "string", "pattern": "^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$" }, "idioma": { "type": "string", "pattern": "^[a-z]{2}$" }, "texto_idioma": { "type": "object", "description": "Mapa de idioma: una cadena no vac\xEDa por idioma. Que est\xE9n TODOS los idiomas de la gram\xE1tica lo verifica V14", "minProperties": 1, "propertyNames": { "$ref": "#/$defs/idioma" }, "additionalProperties": { "type": "string", "minLength": 1 } }, "diccionario_idioma": { "type": "object", "description": "Por idioma, un diccionario t\xE9rmino \u2192 explicaci\xF3n", "propertyNames": { "$ref": "#/$defs/idioma" }, "additionalProperties": { "type": "object", "additionalProperties": { "type": "string", "minLength": 1 } } }, "refs": { "type": "array", "items": { "type": "string", "minLength": 1 }, "description": "Opacas para el motor" }, "fuente": { "type": "object", "additionalProperties": false, "required": ["url", "titulo", "fecha", "tipo"], "properties": { "url": { "type": "string", "pattern": "^https://" }, "titulo": { "$ref": "#/$defs/texto_idioma" }, "fecha": { "$ref": "#/$defs/fecha" }, "tipo": { "enum": ["oficial", "tercero"] } } }, "bloque": { "type": "object", "additionalProperties": false, "required": ["id", "nombre", "banda_id", "lider"], "properties": { "id": { "$ref": "#/$defs/id" }, "nombre": { "$ref": "#/$defs/texto_idioma" }, "banda_id": { "$ref": "#/$defs/id", "description": "Banda donde se ancla el bloque en la visi\xF3n general" }, "lider": { "$ref": "#/$defs/texto_idioma" } } }, "nodo": { "type": "object", "additionalProperties": false, "required": ["id", "banda_id", "tipo_id", "nombre", "lider", "experto", "por_que_importa", "madurez", "fuentes", "fecha_verificacion"], "properties": { "id": { "$ref": "#/$defs/id" }, "banda_id": { "$ref": "#/$defs/id" }, "tipo_id": { "$ref": "#/$defs/id" }, "bloque_id": { "$ref": "#/$defs/id", "description": "Opcional: un nodo sin bloque no aparece en la visi\xF3n general; su banda muestra cu\xE1ntos nodos tiene" }, "nombre": { "$ref": "#/$defs/texto_idioma" }, "nombres_anteriores": { "type": "array", "items": { "$ref": "#/$defs/texto_idioma" } }, "orden": { "type": "integer", "minimum": 1, "description": "Posici\xF3n dentro de la banda (capa) o sobre el eje del flujo (carril y transversal); si falta, se ordena por id" }, "lider": { "$ref": "#/$defs/texto_idioma" }, "experto": { "$ref": "#/$defs/texto_idioma" }, "por_que_importa": { "$ref": "#/$defs/texto_idioma" }, "terminos": { "$ref": "#/$defs/diccionario_idioma" }, "madurez": { "$ref": "#/$defs/id" }, "fuentes": { "type": "array", "minItems": 1, "items": { "$ref": "#/$defs/fuente" } }, "fecha_verificacion": { "$ref": "#/$defs/fecha" }, "refs_externas": { "$ref": "#/$defs/refs" } } }, "condicion": { "type": "object", "additionalProperties": false, "required": ["senal", "operador", "valor"], "description": "Condici\xF3n de un flujo condicional (0.3.0, pedido de planlang): la se\xF1al registrada, el operador y el valor del plan. Obligatoria si el modo declara `exige_condicion` (V13)", "properties": { "senal": { "$ref": "#/$defs/id" }, "operador": { "enum": ["<", "<=", "=", "!=", ">=", ">"] }, "valor": { "anyOf": [{ "type": "number" }, { "type": "string", "minLength": 1 }, { "type": "boolean" }] } } }, "flujo": { "type": "object", "additionalProperties": false, "required": ["id", "origen", "destino", "modo_id", "que_viaja", "lider"], "properties": { "id": { "$ref": "#/$defs/id" }, "origen": { "$ref": "#/$defs/id" }, "destino": { "$ref": "#/$defs/id" }, "modo_id": { "$ref": "#/$defs/id" }, "que_viaja": { "$ref": "#/$defs/texto_idioma" }, "lider": { "$ref": "#/$defs/texto_idioma" }, "condicion": { "$ref": "#/$defs/condicion" } } }, "paso": { "type": "object", "additionalProperties": false, "required": ["id", "nodo_id", "que_pasa", "lider", "experto"], "properties": { "id": { "$ref": "#/$defs/id" }, "nodo_id": { "$ref": "#/$defs/id" }, "sigue_de": { "$ref": "#/$defs/id", "description": "Paso anterior; si falta, es el paso previo de la lista. Dos pasos con el mismo sigue_de forman una rama" }, "bifurca": { "enum": ["paralela", "alternativa"], "description": "Obligatorio si de este paso salen dos o m\xE1s pasos: paralela = el recorrido sigue por TODAS las ramas (tablero Y agente); alternativa = por UNA (V12)" }, "que_pasa": { "$ref": "#/$defs/texto_idioma" }, "lider": { "$ref": "#/$defs/texto_idioma" }, "experto": { "$ref": "#/$defs/texto_idioma" } } }, "recorrido": { "type": "object", "additionalProperties": false, "required": ["id", "titulo", "pasos"], "properties": { "id": { "$ref": "#/$defs/id" }, "titulo": { "$ref": "#/$defs/texto_idioma" }, "pasos": { "type": "array", "minItems": 2, "items": { "$ref": "#/$defs/paso" } } } } } };
function validate91(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate91.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (typeof data === "string") {
    if (!pattern3.test(data)) {
      const err0 = { instancePath, schemaPath: "#/pattern", keyword: "pattern", params: { pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$" }, message: 'must match pattern "^[0-9]+\\.[0-9]+\\.[0-9]+$"' };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
  } else {
    const err1 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "string" }, message: "must be string" };
    if (vErrors === null) {
      vErrors = [err1];
    } else {
      vErrors.push(err1);
    }
    errors++;
  }
  validate91.errors = vErrors;
  return errors === 0;
}
validate91.evaluated = { "dynamicProps": false, "dynamicItems": false };
function validate93(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate93.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (typeof data === "string") {
    if (!pattern4.test(data)) {
      const err0 = { instancePath, schemaPath: "#/pattern", keyword: "pattern", params: { pattern: "^[a-z0-9]+(-[a-z0-9]+)*$" }, message: 'must match pattern "^[a-z0-9]+(-[a-z0-9]+)*$"' };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
  } else {
    const err1 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "string" }, message: "must be string" };
    if (vErrors === null) {
      vErrors = [err1];
    } else {
      vErrors.push(err1);
    }
    errors++;
  }
  validate93.errors = vErrors;
  return errors === 0;
}
validate93.evaluated = { "dynamicProps": false, "dynamicItems": false };
function validate98(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate98.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (typeof data === "string") {
    if (!pattern5.test(data)) {
      const err0 = { instancePath, schemaPath: "#/pattern", keyword: "pattern", params: { pattern: "^[a-z]{2}$" }, message: 'must match pattern "^[a-z]{2}$"' };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
  } else {
    const err1 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "string" }, message: "must be string" };
    if (vErrors === null) {
      vErrors = [err1];
    } else {
      vErrors.push(err1);
    }
    errors++;
  }
  validate98.errors = vErrors;
  return errors === 0;
}
validate98.evaluated = { "dynamicProps": false, "dynamicItems": false };
function validate97(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate97.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (Object.keys(data).length < 1) {
      const err0 = { instancePath, schemaPath: "#/minProperties", keyword: "minProperties", params: { limit: 1 }, message: "must NOT have fewer than 1 properties" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    for (const key0 in data) {
      const _errs1 = errors;
      if (!validate98(key0, { instancePath, parentData: data, parentDataProperty, rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate98.errors : vErrors.concat(validate98.errors);
        errors = vErrors.length;
      }
      var valid0 = _errs1 === errors;
      if (!valid0) {
        const err1 = { instancePath, schemaPath: "#/propertyNames", keyword: "propertyNames", params: { propertyName: key0 }, message: "property name must be valid" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
    }
    for (const key1 in data) {
      let data0 = data[key1];
      if (typeof data0 === "string") {
        if (func2(data0) < 1) {
          const err2 = { instancePath: instancePath + "/" + key1.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/additionalProperties/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err2];
          } else {
            vErrors.push(err2);
          }
          errors++;
        }
      } else {
        const err3 = { instancePath: instancePath + "/" + key1.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/additionalProperties/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
  } else {
    const err4 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err4];
    } else {
      vErrors.push(err4);
    }
    errors++;
  }
  validate97.errors = vErrors;
  return errors === 0;
}
validate97.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var pattern9 = new RegExp("^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$", "u");
function validate102(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate102.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (typeof data === "string") {
    if (!pattern9.test(data)) {
      const err0 = { instancePath, schemaPath: "#/pattern", keyword: "pattern", params: { pattern: "^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$" }, message: 'must match pattern "^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$"' };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
  } else {
    const err1 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "string" }, message: "must be string" };
    if (vErrors === null) {
      vErrors = [err1];
    } else {
      vErrors.push(err1);
    }
    errors++;
  }
  validate102.errors = vErrors;
  return errors === 0;
}
validate102.evaluated = { "dynamicProps": false, "dynamicItems": false };
function validate104(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate104.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.nombre === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "nombre" }, message: "must have required property 'nombre'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.banda_id === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "banda_id" }, message: "must have required property 'banda_id'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.lider === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "lider" }, message: "must have required property 'lider'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "id" || key0 === "nombre" || key0 === "banda_id" || key0 === "lider")) {
        const err4 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.id !== void 0) {
      if (!validate93(data.id, { instancePath: instancePath + "/id", parentData: data, parentDataProperty: "id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
        errors = vErrors.length;
      }
    }
    if (data.nombre !== void 0) {
      if (!validate97(data.nombre, { instancePath: instancePath + "/nombre", parentData: data, parentDataProperty: "nombre", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate97.errors : vErrors.concat(validate97.errors);
        errors = vErrors.length;
      }
    }
    if (data.banda_id !== void 0) {
      if (!validate93(data.banda_id, { instancePath: instancePath + "/banda_id", parentData: data, parentDataProperty: "banda_id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
        errors = vErrors.length;
      }
    }
    if (data.lider !== void 0) {
      if (!validate97(data.lider, { instancePath: instancePath + "/lider", parentData: data, parentDataProperty: "lider", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate97.errors : vErrors.concat(validate97.errors);
        errors = vErrors.length;
      }
    }
  } else {
    const err5 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err5];
    } else {
      vErrors.push(err5);
    }
    errors++;
  }
  validate104.errors = vErrors;
  return errors === 0;
}
validate104.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var schema36 = { "type": "object", "additionalProperties": false, "required": ["id", "banda_id", "tipo_id", "nombre", "lider", "experto", "por_que_importa", "madurez", "fuentes", "fecha_verificacion"], "properties": { "id": { "$ref": "#/$defs/id" }, "banda_id": { "$ref": "#/$defs/id" }, "tipo_id": { "$ref": "#/$defs/id" }, "bloque_id": { "$ref": "#/$defs/id", "description": "Opcional: un nodo sin bloque no aparece en la visi\xF3n general; su banda muestra cu\xE1ntos nodos tiene" }, "nombre": { "$ref": "#/$defs/texto_idioma" }, "nombres_anteriores": { "type": "array", "items": { "$ref": "#/$defs/texto_idioma" } }, "orden": { "type": "integer", "minimum": 1, "description": "Posici\xF3n dentro de la banda (capa) o sobre el eje del flujo (carril y transversal); si falta, se ordena por id" }, "lider": { "$ref": "#/$defs/texto_idioma" }, "experto": { "$ref": "#/$defs/texto_idioma" }, "por_que_importa": { "$ref": "#/$defs/texto_idioma" }, "terminos": { "$ref": "#/$defs/diccionario_idioma" }, "madurez": { "$ref": "#/$defs/id" }, "fuentes": { "type": "array", "minItems": 1, "items": { "$ref": "#/$defs/fuente" } }, "fecha_verificacion": { "$ref": "#/$defs/fecha" }, "refs_externas": { "$ref": "#/$defs/refs" } } };
function validate120(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate120.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    for (const key0 in data) {
      const _errs1 = errors;
      if (!validate98(key0, { instancePath, parentData: data, parentDataProperty, rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate98.errors : vErrors.concat(validate98.errors);
        errors = vErrors.length;
      }
      var valid0 = _errs1 === errors;
      if (!valid0) {
        const err0 = { instancePath, schemaPath: "#/propertyNames", keyword: "propertyNames", params: { propertyName: key0 }, message: "property name must be valid" };
        if (vErrors === null) {
          vErrors = [err0];
        } else {
          vErrors.push(err0);
        }
        errors++;
      }
    }
    for (const key1 in data) {
      let data0 = data[key1];
      if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
        for (const key2 in data0) {
          let data1 = data0[key2];
          if (typeof data1 === "string") {
            if (func2(data1) < 1) {
              const err1 = { instancePath: instancePath + "/" + key1.replace(/~/g, "~0").replace(/\//g, "~1") + "/" + key2.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/additionalProperties/additionalProperties/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
              if (vErrors === null) {
                vErrors = [err1];
              } else {
                vErrors.push(err1);
              }
              errors++;
            }
          } else {
            const err2 = { instancePath: instancePath + "/" + key1.replace(/~/g, "~0").replace(/\//g, "~1") + "/" + key2.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/additionalProperties/additionalProperties/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err2];
            } else {
              vErrors.push(err2);
            }
            errors++;
          }
        }
      } else {
        const err3 = { instancePath: instancePath + "/" + key1.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/additionalProperties/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
  } else {
    const err4 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err4];
    } else {
      vErrors.push(err4);
    }
    errors++;
  }
  validate120.errors = vErrors;
  return errors === 0;
}
validate120.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var schema38 = { "type": "object", "additionalProperties": false, "required": ["url", "titulo", "fecha", "tipo"], "properties": { "url": { "type": "string", "pattern": "^https://" }, "titulo": { "$ref": "#/$defs/texto_idioma" }, "fecha": { "$ref": "#/$defs/fecha" }, "tipo": { "enum": ["oficial", "tercero"] } } };
var pattern10 = new RegExp("^https://", "u");
function validate124(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate124.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.url === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "url" }, message: "must have required property 'url'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.titulo === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "titulo" }, message: "must have required property 'titulo'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.fecha === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "fecha" }, message: "must have required property 'fecha'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.tipo === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "tipo" }, message: "must have required property 'tipo'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "url" || key0 === "titulo" || key0 === "fecha" || key0 === "tipo")) {
        const err4 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.url !== void 0) {
      let data0 = data.url;
      if (typeof data0 === "string") {
        if (!pattern10.test(data0)) {
          const err5 = { instancePath: instancePath + "/url", schemaPath: "#/properties/url/pattern", keyword: "pattern", params: { pattern: "^https://" }, message: 'must match pattern "^https://"' };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/url", schemaPath: "#/properties/url/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.titulo !== void 0) {
      if (!validate97(data.titulo, { instancePath: instancePath + "/titulo", parentData: data, parentDataProperty: "titulo", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate97.errors : vErrors.concat(validate97.errors);
        errors = vErrors.length;
      }
    }
    if (data.fecha !== void 0) {
      if (!validate102(data.fecha, { instancePath: instancePath + "/fecha", parentData: data, parentDataProperty: "fecha", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate102.errors : vErrors.concat(validate102.errors);
        errors = vErrors.length;
      }
    }
    if (data.tipo !== void 0) {
      let data3 = data.tipo;
      if (!(data3 === "oficial" || data3 === "tercero")) {
        const err7 = { instancePath: instancePath + "/tipo", schemaPath: "#/properties/tipo/enum", keyword: "enum", params: { allowedValues: schema38.properties.tipo.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate124.errors = vErrors;
  return errors === 0;
}
validate124.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
function validate129(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate129.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (Array.isArray(data)) {
    const len0 = data.length;
    for (let i0 = 0; i0 < len0; i0++) {
      let data0 = data[i0];
      if (typeof data0 === "string") {
        if (func2(data0) < 1) {
          const err0 = { instancePath: instancePath + "/" + i0, schemaPath: "#/items/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err0];
          } else {
            vErrors.push(err0);
          }
          errors++;
        }
      } else {
        const err1 = { instancePath: instancePath + "/" + i0, schemaPath: "#/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
    }
  } else {
    const err2 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "array" }, message: "must be array" };
    if (vErrors === null) {
      vErrors = [err2];
    } else {
      vErrors.push(err2);
    }
    errors++;
  }
  validate129.errors = vErrors;
  return errors === 0;
}
validate129.evaluated = { "items": true, "dynamicProps": false, "dynamicItems": false };
function validate110(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate110.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.banda_id === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "banda_id" }, message: "must have required property 'banda_id'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.tipo_id === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "tipo_id" }, message: "must have required property 'tipo_id'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.nombre === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "nombre" }, message: "must have required property 'nombre'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.lider === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "lider" }, message: "must have required property 'lider'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.experto === void 0) {
      const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "experto" }, message: "must have required property 'experto'" };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    if (data.por_que_importa === void 0) {
      const err6 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "por_que_importa" }, message: "must have required property 'por_que_importa'" };
      if (vErrors === null) {
        vErrors = [err6];
      } else {
        vErrors.push(err6);
      }
      errors++;
    }
    if (data.madurez === void 0) {
      const err7 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "madurez" }, message: "must have required property 'madurez'" };
      if (vErrors === null) {
        vErrors = [err7];
      } else {
        vErrors.push(err7);
      }
      errors++;
    }
    if (data.fuentes === void 0) {
      const err8 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "fuentes" }, message: "must have required property 'fuentes'" };
      if (vErrors === null) {
        vErrors = [err8];
      } else {
        vErrors.push(err8);
      }
      errors++;
    }
    if (data.fecha_verificacion === void 0) {
      const err9 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "fecha_verificacion" }, message: "must have required property 'fecha_verificacion'" };
      if (vErrors === null) {
        vErrors = [err9];
      } else {
        vErrors.push(err9);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!func1.call(schema36.properties, key0)) {
        const err10 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.id !== void 0) {
      if (!validate93(data.id, { instancePath: instancePath + "/id", parentData: data, parentDataProperty: "id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
        errors = vErrors.length;
      }
    }
    if (data.banda_id !== void 0) {
      if (!validate93(data.banda_id, { instancePath: instancePath + "/banda_id", parentData: data, parentDataProperty: "banda_id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
        errors = vErrors.length;
      }
    }
    if (data.tipo_id !== void 0) {
      if (!validate93(data.tipo_id, { instancePath: instancePath + "/tipo_id", parentData: data, parentDataProperty: "tipo_id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
        errors = vErrors.length;
      }
    }
    if (data.bloque_id !== void 0) {
      if (!validate93(data.bloque_id, { instancePath: instancePath + "/bloque_id", parentData: data, parentDataProperty: "bloque_id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
        errors = vErrors.length;
      }
    }
    if (data.nombre !== void 0) {
      if (!validate97(data.nombre, { instancePath: instancePath + "/nombre", parentData: data, parentDataProperty: "nombre", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate97.errors : vErrors.concat(validate97.errors);
        errors = vErrors.length;
      }
    }
    if (data.nombres_anteriores !== void 0) {
      let data5 = data.nombres_anteriores;
      if (Array.isArray(data5)) {
        const len0 = data5.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (!validate97(data5[i0], { instancePath: instancePath + "/nombres_anteriores/" + i0, parentData: data5, parentDataProperty: i0, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate97.errors : vErrors.concat(validate97.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err11 = { instancePath: instancePath + "/nombres_anteriores", schemaPath: "#/properties/nombres_anteriores/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.orden !== void 0) {
      let data7 = data.orden;
      if (!(typeof data7 == "number" && (!(data7 % 1) && !isNaN(data7)) && isFinite(data7))) {
        const err12 = { instancePath: instancePath + "/orden", schemaPath: "#/properties/orden/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
      if (typeof data7 == "number" && isFinite(data7)) {
        if (data7 < 1 || isNaN(data7)) {
          const err13 = { instancePath: instancePath + "/orden", schemaPath: "#/properties/orden/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
      }
    }
    if (data.lider !== void 0) {
      if (!validate97(data.lider, { instancePath: instancePath + "/lider", parentData: data, parentDataProperty: "lider", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate97.errors : vErrors.concat(validate97.errors);
        errors = vErrors.length;
      }
    }
    if (data.experto !== void 0) {
      if (!validate97(data.experto, { instancePath: instancePath + "/experto", parentData: data, parentDataProperty: "experto", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate97.errors : vErrors.concat(validate97.errors);
        errors = vErrors.length;
      }
    }
    if (data.por_que_importa !== void 0) {
      if (!validate97(data.por_que_importa, { instancePath: instancePath + "/por_que_importa", parentData: data, parentDataProperty: "por_que_importa", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate97.errors : vErrors.concat(validate97.errors);
        errors = vErrors.length;
      }
    }
    if (data.terminos !== void 0) {
      if (!validate120(data.terminos, { instancePath: instancePath + "/terminos", parentData: data, parentDataProperty: "terminos", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate120.errors : vErrors.concat(validate120.errors);
        errors = vErrors.length;
      }
    }
    if (data.madurez !== void 0) {
      if (!validate93(data.madurez, { instancePath: instancePath + "/madurez", parentData: data, parentDataProperty: "madurez", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
        errors = vErrors.length;
      }
    }
    if (data.fuentes !== void 0) {
      let data13 = data.fuentes;
      if (Array.isArray(data13)) {
        if (data13.length < 1) {
          const err14 = { instancePath: instancePath + "/fuentes", schemaPath: "#/properties/fuentes/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
        const len1 = data13.length;
        for (let i1 = 0; i1 < len1; i1++) {
          if (!validate124(data13[i1], { instancePath: instancePath + "/fuentes/" + i1, parentData: data13, parentDataProperty: i1, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate124.errors : vErrors.concat(validate124.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err15 = { instancePath: instancePath + "/fuentes", schemaPath: "#/properties/fuentes/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      }
    }
    if (data.fecha_verificacion !== void 0) {
      if (!validate102(data.fecha_verificacion, { instancePath: instancePath + "/fecha_verificacion", parentData: data, parentDataProperty: "fecha_verificacion", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate102.errors : vErrors.concat(validate102.errors);
        errors = vErrors.length;
      }
    }
    if (data.refs_externas !== void 0) {
      if (!validate129(data.refs_externas, { instancePath: instancePath + "/refs_externas", parentData: data, parentDataProperty: "refs_externas", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate129.errors : vErrors.concat(validate129.errors);
        errors = vErrors.length;
      }
    }
  } else {
    const err16 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err16];
    } else {
      vErrors.push(err16);
    }
    errors++;
  }
  validate110.errors = vErrors;
  return errors === 0;
}
validate110.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var schema41 = { "type": "object", "additionalProperties": false, "required": ["senal", "operador", "valor"], "description": "Condici\xF3n de un flujo condicional (0.3.0, pedido de planlang): la se\xF1al registrada, el operador y el valor del plan. Obligatoria si el modo declara `exige_condicion` (V13)", "properties": { "senal": { "$ref": "#/$defs/id" }, "operador": { "enum": ["<", "<=", "=", "!=", ">=", ">"] }, "valor": { "anyOf": [{ "type": "number" }, { "type": "string", "minLength": 1 }, { "type": "boolean" }] } } };
function validate139(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate139.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.senal === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "senal" }, message: "must have required property 'senal'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.operador === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "operador" }, message: "must have required property 'operador'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.valor === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "valor" }, message: "must have required property 'valor'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "senal" || key0 === "operador" || key0 === "valor")) {
        const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.senal !== void 0) {
      if (!validate93(data.senal, { instancePath: instancePath + "/senal", parentData: data, parentDataProperty: "senal", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
        errors = vErrors.length;
      }
    }
    if (data.operador !== void 0) {
      let data1 = data.operador;
      if (!(data1 === "<" || data1 === "<=" || data1 === "=" || data1 === "!=" || data1 === ">=" || data1 === ">")) {
        const err4 = { instancePath: instancePath + "/operador", schemaPath: "#/properties/operador/enum", keyword: "enum", params: { allowedValues: schema41.properties.operador.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.valor !== void 0) {
      let data2 = data.valor;
      const _errs5 = errors;
      let valid1 = false;
      const _errs6 = errors;
      if (!(typeof data2 == "number" && isFinite(data2))) {
        const err5 = { instancePath: instancePath + "/valor", schemaPath: "#/properties/valor/anyOf/0/type", keyword: "type", params: { type: "number" }, message: "must be number" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
      var _valid0 = _errs6 === errors;
      valid1 = valid1 || _valid0;
      const _errs8 = errors;
      if (typeof data2 === "string") {
        if (func2(data2) < 1) {
          const err6 = { instancePath: instancePath + "/valor", schemaPath: "#/properties/valor/anyOf/1/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      } else {
        const err7 = { instancePath: instancePath + "/valor", schemaPath: "#/properties/valor/anyOf/1/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
      var _valid0 = _errs8 === errors;
      valid1 = valid1 || _valid0;
      const _errs10 = errors;
      if (typeof data2 !== "boolean") {
        const err8 = { instancePath: instancePath + "/valor", schemaPath: "#/properties/valor/anyOf/2/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
      var _valid0 = _errs10 === errors;
      valid1 = valid1 || _valid0;
      if (!valid1) {
        const err9 = { instancePath: instancePath + "/valor", schemaPath: "#/properties/valor/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      } else {
        errors = _errs5;
        if (vErrors !== null) {
          if (_errs5) {
            vErrors.length = _errs5;
          } else {
            vErrors = null;
          }
        }
      }
    }
  } else {
    const err10 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err10];
    } else {
      vErrors.push(err10);
    }
    errors++;
  }
  validate139.errors = vErrors;
  return errors === 0;
}
validate139.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
function validate132(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate132.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.origen === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "origen" }, message: "must have required property 'origen'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.destino === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "destino" }, message: "must have required property 'destino'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.modo_id === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "modo_id" }, message: "must have required property 'modo_id'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.que_viaja === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "que_viaja" }, message: "must have required property 'que_viaja'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.lider === void 0) {
      const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "lider" }, message: "must have required property 'lider'" };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "id" || key0 === "origen" || key0 === "destino" || key0 === "modo_id" || key0 === "que_viaja" || key0 === "lider" || key0 === "condicion")) {
        const err6 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.id !== void 0) {
      if (!validate93(data.id, { instancePath: instancePath + "/id", parentData: data, parentDataProperty: "id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
        errors = vErrors.length;
      }
    }
    if (data.origen !== void 0) {
      if (!validate93(data.origen, { instancePath: instancePath + "/origen", parentData: data, parentDataProperty: "origen", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
        errors = vErrors.length;
      }
    }
    if (data.destino !== void 0) {
      if (!validate93(data.destino, { instancePath: instancePath + "/destino", parentData: data, parentDataProperty: "destino", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
        errors = vErrors.length;
      }
    }
    if (data.modo_id !== void 0) {
      if (!validate93(data.modo_id, { instancePath: instancePath + "/modo_id", parentData: data, parentDataProperty: "modo_id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
        errors = vErrors.length;
      }
    }
    if (data.que_viaja !== void 0) {
      if (!validate97(data.que_viaja, { instancePath: instancePath + "/que_viaja", parentData: data, parentDataProperty: "que_viaja", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate97.errors : vErrors.concat(validate97.errors);
        errors = vErrors.length;
      }
    }
    if (data.lider !== void 0) {
      if (!validate97(data.lider, { instancePath: instancePath + "/lider", parentData: data, parentDataProperty: "lider", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate97.errors : vErrors.concat(validate97.errors);
        errors = vErrors.length;
      }
    }
    if (data.condicion !== void 0) {
      if (!validate139(data.condicion, { instancePath: instancePath + "/condicion", parentData: data, parentDataProperty: "condicion", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate139.errors : vErrors.concat(validate139.errors);
        errors = vErrors.length;
      }
    }
  } else {
    const err7 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err7];
    } else {
      vErrors.push(err7);
    }
    errors++;
  }
  validate132.errors = vErrors;
  return errors === 0;
}
validate132.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var schema43 = { "type": "object", "additionalProperties": false, "required": ["id", "nodo_id", "que_pasa", "lider", "experto"], "properties": { "id": { "$ref": "#/$defs/id" }, "nodo_id": { "$ref": "#/$defs/id" }, "sigue_de": { "$ref": "#/$defs/id", "description": "Paso anterior; si falta, es el paso previo de la lista. Dos pasos con el mismo sigue_de forman una rama" }, "bifurca": { "enum": ["paralela", "alternativa"], "description": "Obligatorio si de este paso salen dos o m\xE1s pasos: paralela = el recorrido sigue por TODAS las ramas (tablero Y agente); alternativa = por UNA (V12)" }, "que_pasa": { "$ref": "#/$defs/texto_idioma" }, "lider": { "$ref": "#/$defs/texto_idioma" }, "experto": { "$ref": "#/$defs/texto_idioma" } } };
function validate146(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate146.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.nodo_id === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "nodo_id" }, message: "must have required property 'nodo_id'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.que_pasa === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "que_pasa" }, message: "must have required property 'que_pasa'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.lider === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "lider" }, message: "must have required property 'lider'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.experto === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "experto" }, message: "must have required property 'experto'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "id" || key0 === "nodo_id" || key0 === "sigue_de" || key0 === "bifurca" || key0 === "que_pasa" || key0 === "lider" || key0 === "experto")) {
        const err5 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.id !== void 0) {
      if (!validate93(data.id, { instancePath: instancePath + "/id", parentData: data, parentDataProperty: "id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
        errors = vErrors.length;
      }
    }
    if (data.nodo_id !== void 0) {
      if (!validate93(data.nodo_id, { instancePath: instancePath + "/nodo_id", parentData: data, parentDataProperty: "nodo_id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
        errors = vErrors.length;
      }
    }
    if (data.sigue_de !== void 0) {
      if (!validate93(data.sigue_de, { instancePath: instancePath + "/sigue_de", parentData: data, parentDataProperty: "sigue_de", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
        errors = vErrors.length;
      }
    }
    if (data.bifurca !== void 0) {
      let data3 = data.bifurca;
      if (!(data3 === "paralela" || data3 === "alternativa")) {
        const err6 = { instancePath: instancePath + "/bifurca", schemaPath: "#/properties/bifurca/enum", keyword: "enum", params: { allowedValues: schema43.properties.bifurca.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.que_pasa !== void 0) {
      if (!validate97(data.que_pasa, { instancePath: instancePath + "/que_pasa", parentData: data, parentDataProperty: "que_pasa", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate97.errors : vErrors.concat(validate97.errors);
        errors = vErrors.length;
      }
    }
    if (data.lider !== void 0) {
      if (!validate97(data.lider, { instancePath: instancePath + "/lider", parentData: data, parentDataProperty: "lider", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate97.errors : vErrors.concat(validate97.errors);
        errors = vErrors.length;
      }
    }
    if (data.experto !== void 0) {
      if (!validate97(data.experto, { instancePath: instancePath + "/experto", parentData: data, parentDataProperty: "experto", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate97.errors : vErrors.concat(validate97.errors);
        errors = vErrors.length;
      }
    }
  } else {
    const err7 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err7];
    } else {
      vErrors.push(err7);
    }
    errors++;
  }
  validate146.errors = vErrors;
  return errors === 0;
}
validate146.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
function validate143(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate143.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.titulo === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "titulo" }, message: "must have required property 'titulo'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.pasos === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "pasos" }, message: "must have required property 'pasos'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "id" || key0 === "titulo" || key0 === "pasos")) {
        const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.id !== void 0) {
      if (!validate93(data.id, { instancePath: instancePath + "/id", parentData: data, parentDataProperty: "id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
        errors = vErrors.length;
      }
    }
    if (data.titulo !== void 0) {
      if (!validate97(data.titulo, { instancePath: instancePath + "/titulo", parentData: data, parentDataProperty: "titulo", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate97.errors : vErrors.concat(validate97.errors);
        errors = vErrors.length;
      }
    }
    if (data.pasos !== void 0) {
      let data2 = data.pasos;
      if (Array.isArray(data2)) {
        if (data2.length < 2) {
          const err4 = { instancePath: instancePath + "/pasos", schemaPath: "#/properties/pasos/minItems", keyword: "minItems", params: { limit: 2 }, message: "must NOT have fewer than 2 items" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        const len0 = data2.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (!validate146(data2[i0], { instancePath: instancePath + "/pasos/" + i0, parentData: data2, parentDataProperty: i0, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate146.errors : vErrors.concat(validate146.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/pasos", schemaPath: "#/properties/pasos/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
  } else {
    const err6 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err6];
    } else {
      vErrors.push(err6);
    }
    errors++;
  }
  validate143.errors = vErrors;
  return errors === 0;
}
validate143.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
function validate90(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate90.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.contrato_version === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "contrato_version" }, message: "must have required property 'contrato_version'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.gramatica_id === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "gramatica_id" }, message: "must have required property 'gramatica_id'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.gramatica_version === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "gramatica_version" }, message: "must have required property 'gramatica_version'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.sujeto_id === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "sujeto_id" }, message: "must have required property 'sujeto_id'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.sujeto_nombre === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "sujeto_nombre" }, message: "must have required property 'sujeto_nombre'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.version === void 0) {
      const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "version" }, message: "must have required property 'version'" };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    if (data.fecha_actualizacion === void 0) {
      const err6 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "fecha_actualizacion" }, message: "must have required property 'fecha_actualizacion'" };
      if (vErrors === null) {
        vErrors = [err6];
      } else {
        vErrors.push(err6);
      }
      errors++;
    }
    if (data.estado === void 0) {
      const err7 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "estado" }, message: "must have required property 'estado'" };
      if (vErrors === null) {
        vErrors = [err7];
      } else {
        vErrors.push(err7);
      }
      errors++;
    }
    if (data.bloques === void 0) {
      const err8 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "bloques" }, message: "must have required property 'bloques'" };
      if (vErrors === null) {
        vErrors = [err8];
      } else {
        vErrors.push(err8);
      }
      errors++;
    }
    if (data.nodos === void 0) {
      const err9 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "nodos" }, message: "must have required property 'nodos'" };
      if (vErrors === null) {
        vErrors = [err9];
      } else {
        vErrors.push(err9);
      }
      errors++;
    }
    if (data.flujos === void 0) {
      const err10 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "flujos" }, message: "must have required property 'flujos'" };
      if (vErrors === null) {
        vErrors = [err10];
      } else {
        vErrors.push(err10);
      }
      errors++;
    }
    if (data.recorridos === void 0) {
      const err11 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "recorridos" }, message: "must have required property 'recorridos'" };
      if (vErrors === null) {
        vErrors = [err11];
      } else {
        vErrors.push(err11);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!func1.call(schema29.properties, key0)) {
        const err12 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
    }
    if (data.contrato_version !== void 0) {
      if (!validate91(data.contrato_version, { instancePath: instancePath + "/contrato_version", parentData: data, parentDataProperty: "contrato_version", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate91.errors : vErrors.concat(validate91.errors);
        errors = vErrors.length;
      }
    }
    if (data.gramatica_id !== void 0) {
      if (!validate93(data.gramatica_id, { instancePath: instancePath + "/gramatica_id", parentData: data, parentDataProperty: "gramatica_id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
        errors = vErrors.length;
      }
    }
    if (data.gramatica_version !== void 0) {
      if (!validate91(data.gramatica_version, { instancePath: instancePath + "/gramatica_version", parentData: data, parentDataProperty: "gramatica_version", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate91.errors : vErrors.concat(validate91.errors);
        errors = vErrors.length;
      }
    }
    if (data.sujeto_id !== void 0) {
      if (!validate93(data.sujeto_id, { instancePath: instancePath + "/sujeto_id", parentData: data, parentDataProperty: "sujeto_id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
        errors = vErrors.length;
      }
    }
    if (data.sujeto_nombre !== void 0) {
      if (!validate97(data.sujeto_nombre, { instancePath: instancePath + "/sujeto_nombre", parentData: data, parentDataProperty: "sujeto_nombre", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate97.errors : vErrors.concat(validate97.errors);
        errors = vErrors.length;
      }
    }
    if (data.version !== void 0) {
      if (!validate91(data.version, { instancePath: instancePath + "/version", parentData: data, parentDataProperty: "version", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate91.errors : vErrors.concat(validate91.errors);
        errors = vErrors.length;
      }
    }
    if (data.fecha_actualizacion !== void 0) {
      if (!validate102(data.fecha_actualizacion, { instancePath: instancePath + "/fecha_actualizacion", parentData: data, parentDataProperty: "fecha_actualizacion", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate102.errors : vErrors.concat(validate102.errors);
        errors = vErrors.length;
      }
    }
    if (data.estado !== void 0) {
      let data7 = data.estado;
      if (!(data7 === "propuesta" || data7 === "aprobada" || data7 === "rechazada")) {
        const err13 = { instancePath: instancePath + "/estado", schemaPath: "#/properties/estado/enum", keyword: "enum", params: { allowedValues: schema29.properties.estado.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
    if (data.bloques !== void 0) {
      let data8 = data.bloques;
      if (Array.isArray(data8)) {
        const len0 = data8.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (!validate104(data8[i0], { instancePath: instancePath + "/bloques/" + i0, parentData: data8, parentDataProperty: i0, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate104.errors : vErrors.concat(validate104.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err14 = { instancePath: instancePath + "/bloques", schemaPath: "#/properties/bloques/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
    if (data.nodos !== void 0) {
      let data10 = data.nodos;
      if (Array.isArray(data10)) {
        if (data10.length < 1) {
          const err15 = { instancePath: instancePath + "/nodos", schemaPath: "#/properties/nodos/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
          if (vErrors === null) {
            vErrors = [err15];
          } else {
            vErrors.push(err15);
          }
          errors++;
        }
        const len1 = data10.length;
        for (let i1 = 0; i1 < len1; i1++) {
          if (!validate110(data10[i1], { instancePath: instancePath + "/nodos/" + i1, parentData: data10, parentDataProperty: i1, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate110.errors : vErrors.concat(validate110.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err16 = { instancePath: instancePath + "/nodos", schemaPath: "#/properties/nodos/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err16];
        } else {
          vErrors.push(err16);
        }
        errors++;
      }
    }
    if (data.flujos !== void 0) {
      let data12 = data.flujos;
      if (Array.isArray(data12)) {
        const len2 = data12.length;
        for (let i2 = 0; i2 < len2; i2++) {
          if (!validate132(data12[i2], { instancePath: instancePath + "/flujos/" + i2, parentData: data12, parentDataProperty: i2, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate132.errors : vErrors.concat(validate132.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err17 = { instancePath: instancePath + "/flujos", schemaPath: "#/properties/flujos/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err17];
        } else {
          vErrors.push(err17);
        }
        errors++;
      }
    }
    if (data.recorridos !== void 0) {
      let data14 = data.recorridos;
      if (Array.isArray(data14)) {
        const len3 = data14.length;
        for (let i3 = 0; i3 < len3; i3++) {
          if (!validate143(data14[i3], { instancePath: instancePath + "/recorridos/" + i3, parentData: data14, parentDataProperty: i3, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate143.errors : vErrors.concat(validate143.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err18 = { instancePath: instancePath + "/recorridos", schemaPath: "#/properties/recorridos/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err18];
        } else {
          vErrors.push(err18);
        }
        errors++;
      }
    }
    if (data.glosario !== void 0) {
      if (!validate120(data.glosario, { instancePath: instancePath + "/glosario", parentData: data, parentDataProperty: "glosario", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate120.errors : vErrors.concat(validate120.errors);
        errors = vErrors.length;
      }
    }
    if (data.refs_externas !== void 0) {
      if (!validate129(data.refs_externas, { instancePath: instancePath + "/refs_externas", parentData: data, parentDataProperty: "refs_externas", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate129.errors : vErrors.concat(validate129.errors);
        errors = vErrors.length;
      }
    }
  } else {
    const err19 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err19];
    } else {
      vErrors.push(err19);
    }
    errors++;
  }
  validate90.errors = vErrors;
  return errors === 0;
}
validate90.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
export {
  validarGramaticaEsquema,
  validarMapaEsquema
};
