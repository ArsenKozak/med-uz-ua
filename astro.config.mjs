import cloudflare from "@astrojs/cloudflare";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://med.uz.ua",
  output: "static",
  adapter: cloudflare({
    imageService: "compile",
  }),
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
  ],
});
