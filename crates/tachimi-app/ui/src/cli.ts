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
  url: string;
  name: string;
  user: string;
  sha: string;
  thumbnail: string;
};

export async function listTachie(): Promise<TachieInfo[]> {
  const output = await callCli(["list"]);
  return JSON.parse(output);
}

export type VersionInfo = {
  version: string;
};

export async function getVersion(): Promise<VersionInfo> {
  const output = await callCli(["version"]);
  return JSON.parse(output);
}
