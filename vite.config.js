import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envPrefix: ["SUPABASE_"],
  base: process.env.BASE_PATH || "/", // eslint-disable-line no-undef
});
