import { access, lstat, mkdir, readlink, symlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const source = resolve(
  root,
  "bin/Debug/net10.0-windows10.0.19041.0/Tachimi.dll",
);
const destination = resolve(root, ".ymm4/user/plugin/tachimi-ymm4/Tachimi.dll");
await access(resolve(root, ".ymm4/YukkuriMovieMaker.dll"));
await access(source);
await mkdir(dirname(destination), { recursive: true });

const existing = await lstat(destination).catch((error: NodeJS.ErrnoException) => {
  if (error.code !== "ENOENT") throw error;
  return undefined;
});
if (existing) {
  if (
    !existing.isSymbolicLink() ||
    resolve(dirname(destination), await readlink(destination)) !== source
  ) {
    throw new Error(`Refusing to overwrite existing path: ${destination}`);
  }
  console.log(`Symlink already exists: ${destination}`);
} else {
  await symlink(source, destination, "file");
  console.log(`Created symlink: ${destination} -> ${source}`);
}
