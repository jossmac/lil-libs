import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/array.ts",
    "src/assert.ts",
    "src/console.ts",
    "src/error.ts",
    "src/function.ts",
    "src/json.ts",
    "src/number.ts",
    "src/object.ts",
    "src/random.ts",
    "src/string.ts",
    "src/types.ts",
  ],
  format: ["esm"],
  dts: true,
  clean: true,
  outDir: "dist",
  target: "es2022",
});
