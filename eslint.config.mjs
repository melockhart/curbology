/*
 * This package's own ESLint config.
 *
 * It previously had none and was linted by whatever config sat above it in the
 * tree — which worked precisely until the package moved. Same story as the five
 * devDependencies it was resolving from a parent node_modules: a package that
 * only builds where it happens to live is not a package.
 */
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Build output, and Wrangler/Miniflare state. Both are generated, and both
    // are full of minified code that reports hundreds of findings if linted.
    "dist/**",
    ".wrangler/**",
  ]),
]);
