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
      keyboardKeys: true,
      images: true,
      ssg: {
        siteName: "Tachimi",
        pagination: true,
        theme: defineTheme({
          extends: defaultTheme,
          colors: {
            primary: "#287a3d",
            primaryHover: "#1c5e2d",
          },
          socialLinks: {
            github: "https://github.com/sevenc-nanashi/tachimi",
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
            {
              text: "使い方",
              link: "/usage",
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
