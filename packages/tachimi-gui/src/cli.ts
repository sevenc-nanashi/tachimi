function getCliPath(): string {
  const cliPath = Bun.env.TACHIMI_CLI_PATH;
  if (!cliPath) {
    throw new Error("TACHIMI_CLI_PATH is not set");
  }
  return cliPath;
}

async function callCli(args: string[]): Promise<string> {
  const cliPath = getCliPath();
  const result = Bun.spawn([cliPath, ...args], {
    env: { ...Bun.env, TACHIMI_LOG: "off" },
    stdout: "pipe",
    stderr: "pipe",
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    result.exited,
    new Response(result.stdout).text(),
    new Response(result.stderr).text(),
  ]);
  if (exitCode !== 0) {
    throw new Error(`CLI command failed with exit code ${exitCode}: ${stderr}`);
  }
  return stdout;
}

export type TachieInfo = {
  dir: string;
  key: string;
  url: string;
  name: string;
  user: string;
  sha: string;
  idx: number;
  thumbnail: string;
};

export async function listTachie(): Promise<TachieInfo[]> {
  const output = await callCli(["list"]);
  return JSON.parse(output);
}

export function tachieKey(url: string): string {
  const pattern = new URLPattern({
    protocol: "https",
    hostname: "tachie.net",
    port: "",
    username: "",
    password: "",
    pathname: "/w/:key([A-Za-z0-9_\\-]+){/}?",
  });
  const key = pattern.exec(url.trim())?.pathname.groups.key;
  if (!key) {
    throw new Error("https://tachie.net/w/... の作品URLを入力してください");
  }
  return key;
}

export type TachiePreview = {
  title: string;
  user: string;
  thumbnail: string;
  approxSize: number;
};

export async function getTachieInfo(url: string): Promise<TachiePreview> {
  type CliTachiePreview = {
    title: string;
    user: string;
    thumbnail: string;
    approx_size: number;
  };
  const preview: CliTachiePreview = JSON.parse(
    await callCli(["info", "--key", tachieKey(url)]),
  );
  return {
    title: preview.title,
    user: preview.user,
    thumbnail: preview.thumbnail,
    approxSize: preview.approx_size,
  };
}

export async function downloadTachie(url: string): Promise<void> {
  await downloadKey(tachieKey(url));
}

export async function downloadKey(key: string): Promise<void> {
  await callCli(["download", "--key", key]);
}

type Updates = { revisions: Record<string, number | null> };

export async function shallowFetch(): Promise<Updates> {
  return JSON.parse(await callCli(["shallow-fetch"]));
}

export async function fetchTachie(key: string): Promise<Updates> {
  return JSON.parse(await callCli(["fetch", "--key", key]));
}

export type VersionInfo = {
  version: string;
};

export async function getVersion(): Promise<VersionInfo> {
  const output = await callCli(["version"]);
  return JSON.parse(output);
}
