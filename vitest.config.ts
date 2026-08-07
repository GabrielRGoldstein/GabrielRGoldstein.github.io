import { getViteConfig } from "astro/config";
import { defineConfig } from "vitest/config";

const config = defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});

export default getViteConfig(config);
