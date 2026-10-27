// vite.config.ts
import { defineConfig } from "vite";
import { defaultTheme, defineTheme, oxContent } from "@ox-content/vite-plugin";

export default defineConfig({
  plugins: [
    oxContent({
      srcDir: "content",
      outDir: "dist",
      ogImage: true,
      docs: false,
      ssg: {
        siteName: "Tachimi",
        theme: defineTheme({
          extends: defaultTheme,
          colors: {
            primary: "#287a3d",
            primaryHover: "#1c5e2d",
          },
        }),
      },
    }),
  ],
  server: {
    port: 5174,
  },
});
