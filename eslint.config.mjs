import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
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
  ]),
]);

export default eslintConfig;
