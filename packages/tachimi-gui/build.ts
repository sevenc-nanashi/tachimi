import { createSolidPlugin } from "@gpuix/solid/bun-plugin";
import { fileURLToPath } from "node:url";

await Bun.build({
  entrypoints: ["./src/app.tsx"],
  compile: {
    outfile: "dist/tachimi-gui",
    windows: {
      hideConsole: true,
      icon: fileURLToPath(new URL("../tachimi-common/icon.ico", import.meta.url)),
    },
  },
  plugins: [
    createSolidPlugin(),
    {
      name: "gpuix-native",
      setup(build) {
        // The CommonJS loader lets Bun bundle the native addon into the executable.
        build.onResolve({ filter: /^@gpuix\/native$/ }, () => ({
          path: fileURLToPath(import.meta.resolve("@gpuix/native")).replace(
            /index\.js$/,
            "index.cjs",
          ),
        }));
      },
    },
  ],
});
