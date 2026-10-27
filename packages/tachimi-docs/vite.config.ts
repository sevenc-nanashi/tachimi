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
          sidebar: [
            {
              text: "トップ",
              link: "/",
            },
            {
              text: "インストール",
              link: "/install",
            },
          ],
        }),
      },
    }),
  ],
  server: {
    port: 5174,
  },
});
