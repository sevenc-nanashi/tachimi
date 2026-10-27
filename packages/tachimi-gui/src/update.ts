import { semver } from "bun";
import { version } from "../package.json";

export { version };
export const installUrl = "https://tachimi.sevenc7c.com/install";

export async function checkForUpdate(): Promise<string | null> {
  const response = await fetch("https://tachimi.sevenc7c.com/api/updates", {
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`更新情報を取得できませんでした (HTTP ${response.status})`);
  }
  const update: { version: string } = await response.json();
  return semver.order(update.version, version) > 0 ? update.version : null;
}
