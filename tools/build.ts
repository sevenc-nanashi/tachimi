import { $ } from "bun";
import { copyFile } from "node:fs/promises";
import { mkdir } from "node:fs/promises";

process.chdir(import.meta.dir + "/..");
const { project } = Bun.TOML.parse(
  await Bun.file("packages/tachimi-aviutl2/aviutl2.toml").text(),
) as { project: { id: string; version: string } };
const pluginArchive = `${project.id}-v${project.version}.au2pkg.zip`;
await mkdir("dist/tachimi-gui", { recursive: true });
await $`bun run --cwd ./packages/tachimi-gui build`;
await $`cargo build -r`;
await $`au2 release`.cwd("./packages/tachimi-aviutl2");

await copyFile(
  "./target/release/tachimi.exe",
  "./dist/tachimi-gui/tachimi.exe",
);
await copyFile(
  "./packages/tachimi-gui/dist/tachimi-gui.exe",
  "./dist/tachimi-gui/tachimi-gui.exe",
);
await $`powershell.exe -NoProfile -NonInteractive -Command "Compress-Archive -LiteralPath dist/tachimi-gui -DestinationPath dist/tachimi-gui.zip -Force -ErrorAction Stop"`;
await copyFile(
  `./packages/tachimi-aviutl2/release/${pluginArchive}`,
  `./dist/${pluginArchive}`,
);
