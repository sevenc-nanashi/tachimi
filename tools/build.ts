import { $ } from "bun";
import { glob } from "node:fs/promises";
import { copyFile, rename } from "node:fs/promises";
import { mkdir } from "node:fs/promises";
import { version } from "../package.json" with { type: "json" };

process.chdir(import.meta.dir + "/..");

async function buildGui() {
  await $`bun run --cwd ./packages/tachimi-gui build`;
  await $`cargo build -r -p tachimi-cli`;

  await mkdir("dist/tachimi", { recursive: true });
  await copyFile("./target/release/tachimi.exe", "./dist/tachimi/tachimi.exe");
  await copyFile(
    "./packages/tachimi-gui/dist/tachimi-gui.exe",
    "./dist/tachimi/tachimi-gui.exe",
  );

  await $`powershell.exe -NoProfile -NonInteractive -Command "Compress-Archive -LiteralPath dist/tachimi -DestinationPath dist/tachimi-gui-${
    version
  }.zip -Force -ErrorAction Stop"`;
}

async function buildAviUtl2() {
  const { project } = Bun.TOML.parse(
    await Bun.file("packages/tachimi-aviutl2/aviutl2.toml").text(),
  ) as { project: { id: string; version: string } };
  const pluginArchive = `${project.id}-v${project.version}.au2pkg.zip`;
  await $`au2 release`.cwd("./packages/tachimi-aviutl2");
  await copyFile(
    `./packages/tachimi-aviutl2/release/${pluginArchive}`,
    `./dist/${pluginArchive}`,
  );
}

async function buildYMM4() {
  await $`dotnet build packages/tachimi-ymm4 -c Release -p:Version=${version}`;
  await mkdir("dist/tachimi-ymm4", { recursive: true });
  const releaseDir = await Array.fromAsync(
    glob("packages/tachimi-ymm4/bin/Release/*"),
  );
  await copyFile(
    `${releaseDir.at(-1)}/Tachimi.dll`,
    "dist/tachimi-ymm4/Tachimi.dll",
  );
  await $`powershell.exe -NoProfile -NonInteractive -Command "Compress-Archive -LiteralPath dist/tachimi-ymm4/Tachimi.dll -DestinationPath dist/tachimi-ymm4.zip -Force -ErrorAction Stop"`;
  await rename("dist/tachimi-ymm4.zip", `dist/tachimi-ymm4-v${version}.ymme`);
}

await mkdir("dist", { recursive: true });
await buildGui();
await buildAviUtl2();
await buildYMM4();
