import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";

function releaseArtifacts() {
  let outputDirectory;

  return {
    name: "release-artifacts",
    apply: "build",
    configResolved(config) {
      outputDirectory = config.build.outDir;
    },
    async closeBundle() {
      await Promise.all([
        rm(resolve(outputDirectory, "audio"), { force: true, recursive: true }),
        rm(resolve(outputDirectory, ".DS_Store"), { force: true }),
      ]);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), releaseArtifacts()],
  envPrefix: ["VITE_", "SUPABASE_"],
  base: process.env.VITE_BASE_PATH || process.env.BASE_PATH || "/", // eslint-disable-line no-undef
});
