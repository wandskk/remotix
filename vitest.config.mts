import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 15000,
    // Testes de integração usam o mesmo banco (Neon dev) e mexem em
    // RateLimitBucket/Command com escopo global — rodar em série evita
    // interferência entre eles.
    fileParallelism: false,
  },
});
