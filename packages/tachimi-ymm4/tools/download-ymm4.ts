import { $ } from "bun";
import { access, mkdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";

process.chdir(resolve(import.meta.dir, ".."));
await mkdir(".ymm4", { recursive: true });
const archive = ".ymm4/YukkuriMovieMaker_v4_Lite.zip";
const response = await fetch(
  "https://files.manjubox.net/YukkuriMovieMaker_v4_Lite.zip",
);
if (!response.ok) {
  throw new Error(`YMM4 Lite download failed: ${response.status}`);
}
await Bun.write(archive, response);
await $`powershell.exe -NoProfile -NonInteractive -Command "Expand-Archive -LiteralPath '.ymm4/YukkuriMovieMaker_v4_Lite.zip' -DestinationPath '.ymm4' -Force -ErrorAction Stop"`;
await access(".ymm4/YukkuriMovieMaker.dll");
await unlink(archive);
console.log("Downloaded YMM4 Lite to .ymm4");
