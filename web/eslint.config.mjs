import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Componentes vendored del registry @better-auth-ui (shadcn): usan patrones
    // de hidratación (sessionStorage, location.search en efectos) que las reglas
    // nuevas de react-hooks marcan como error.
    files: ["components/auth/**"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
  {
    // Consola 3D (react-three-fiber): muta objetos de three dentro de useFrame,
    // patrón normal de r3f que las reglas del React Compiler marcan como error.
    files: ["components/scene/**", "components/hud/**", "components/Console.tsx"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
