import { valid } from "semver";

const version = process.argv[2];
if (!valid(version) || version.startsWith("v") || version !== version.trim()) {
  throw new Error("Specify a SemVer version without a v prefix (e.g. 0.2.0)");
}
process.chdir(import.meta.dir + "/..");

for (const path of ["Cargo.toml", "packages/tachimi-aviutl2/aviutl2.toml"]) {
  const contents = await Bun.file(path).text();
  await Bun.write(
    path,
    contents.replace(/^version = "[^"]*"$/m, `version = "${version}"`),
  );
}

const path = "packages/tachimi-gui/package.json";
const manifest = await Bun.file(path).json();
manifest.version = version;
await Bun.write(path, JSON.stringify(manifest, null, 2) + "\n");

const ymmProject = "packages/tachimi-ymm4/Tachimi.csproj";
await Bun.write(ymmProject, (await Bun.file(ymmProject).text()).replace(/<Version>[^<]+<\/Version>/, `<Version>${version}</Version>`));
