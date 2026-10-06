import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// G2 (CONTRATO del diagramador § 2, regla dura del núcleo determinista): sin reloj, sin azar, sin
// funciones inexactas ni dependientes de la plataforma en el paquete del diagramador ni en el núcleo.
// Lo que sí se permite: + − × ÷ y Math.sqrt/floor/ceil/round/trunc/abs/min/max/sign/imul/fround/clz32.
const INEXACTAS = ["sin", "cos", "tan", "asin", "acos", "atan", "atan2", "sinh", "cosh", "tanh", "asinh", "acosh", "atanh", "exp", "expm1", "log", "log1p", "log2", "log10", "pow", "cbrt", "hypot", "random"];
const G2 = {
  files: ["packages/diagramador/src/**/*.ts", "src/engine/**/*.ts"],
  rules: {
    "no-restricted-properties": [
      "error",
      ...INEXACTAS.map((property) => ({ object: "Math", property, message: "G2: función inexacta o azar; usa aritmética entera o Math.sqrt/floor/round…" })),
      { object: "performance", property: "now", message: "G2: sin reloj" },
      { object: "crypto", property: "getRandomValues", message: "G2: sin azar" },
      ...["localeCompare", "toLocaleString", "toLocaleDateString", "toLocaleTimeString"].map((property) => ({ property, message: "G2: depende del idioma del sistema; compara por unidades de código y formatea con la función canónica" })),
      ...["getBBox", "getComputedTextLength", "measureText"].map((property) => ({ property, message: "G2/G15: jamás se mide el texto en el navegador; se usa la tabla de métricas" })),
    ],
    "no-restricted-syntax": [
      "error",
      { selector: "BinaryExpression[operator='**']", message: "G2: `**` es inexacto; multiplica enteros" },
      { selector: "AssignmentExpression[operator='**=']", message: "G2: `**=` es inexacto" },
    ],
    "no-restricted-globals": [
      "error",
      { name: "Date", message: "G2: sin reloj; la fecha llega como texto AAAA-MM-DD en las opciones" },
      { name: "Intl", message: "G2: depende del idioma del sistema" },
      { name: "performance", message: "G2: sin reloj" },
    ],
  },
};

// «Planea, gestiona y controla; jamás opera una plataforma» + «cero IA en runtime»: ningún SDK de
// fabricantes de plataformas de datos ni de proveedores de modelos en la app ni en el paquete. El
// test `planea-no-opera` busca además dominios y primitivas de red en el código.
const PATRONES_NO_OPERA = [
  { group: ["@databricks/*", "databricks*", "*snowflake*", "@azure/*", "@microsoft/*", "powerbi*"], message: "Planea, no opera: cero SDK de plataformas de datos." },
  { group: ["@anthropic-ai/*", "openai", "@google/generative-ai", "@google/genai", "groq-sdk", "ai", "@ai-sdk/*", "cohere-ai", "@mistralai/*", "ollama", "langchain", "@langchain/*"], message: "Cero IA en runtime: la única IA es la skill /investigar, fuera del producto." },
];
const NO_OPERA = {
  files: ["src/**/*.{ts,tsx}", "instrumentation-client.ts"],
  rules: { "no-restricted-imports": ["error", { patterns: PATRONES_NO_OPERA }] },
};

// El diagramador es un reusable de la casa: no importa nada de la app, ni del framework, ni abre I/O.
// Lleva en la MISMA regla los patrones de «no opera»: en flat config dos bloques con
// `no-restricted-imports` sobre los mismos archivos se pisan y gana el último (la demo en rojo lo cazó).
const REUSABLE = {
  files: ["packages/diagramador/src/**/*.ts"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          { group: ["@/*", "**/src/**", "next", "next/*", "react", "react-dom", "react/*"], message: "El diagramador no importa nada de la app ni del framework (regla del reusable)." },
          { group: ["node:*", "fs", "path", "http", "https", "net", "child_process", "os", "url"], message: "El diagramador no hace I/O: funciones puras (CONTRATO § 8)." },
          ...PATRONES_NO_OPERA,
        ],
      },
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  G2,
  REUSABLE,
  NO_OPERA,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Maqueta de la Etapa de Diseño: HTML/CSS/JS de sala de diseño, no código de producto
    // (scripts clásicos que abren por file://). public/diseno/ es su copia generada.
    "docs/diseno/**",
    "public/diseno/**",
    // Salida de `vercel build` sin conexión (diagnóstico de A-04; .vercel/ está ignorado en git).
    ".vercel/**",
    "coverage/**",
    // Sitio y base de la base sembrada (D-S3-14): derivados de scripts/datos/construir-sembrada.mjs, ignorados en git.
    "out-sembrada/**",
    ".sembrada/**",
  ]),
]);

export default eslintConfig;
