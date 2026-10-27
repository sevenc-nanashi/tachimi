import { $ } from "bun";
import { copyFile } from "node:fs/promises";
import { mkdir } from "node:fs/promises";

process.chdir(import.meta.dir + "/..");
await mkdir("dist/tachimi-gui", { recursive: true });
await $`bun run --cwd ./packages/tachimi-gui build`;
await $`cargo build -r`;
await $.cwd("./packages/tachimi-aviutl2")`au2 release`;

await copyFile(
  "./target/release/tachimi.exe",
  "./dist/tachimi-gui/tachimi.exe",
);
await copyFile(
  "./packages/tachimi-gui/dist/tachimi-gui.exe",
  "./dist/tachimi-gui/tachimi-gui.exe",
);
await copyFile(
  "./packages/tachimi-aviutl2/release/sevenc-nanashi.tachimi-v0.1.0.au2pkg.zip",
  "./dist/sevenc-nanashi.tachimi-v0.1.0.au2pkg.zip",
);
