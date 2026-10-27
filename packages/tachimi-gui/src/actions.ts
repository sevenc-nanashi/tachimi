export async function openFolder(dir: string): Promise<void> {
  const command = {
    win32: [
      "powershell.exe",
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      "$ErrorActionPreference = 'Stop'; Invoke-Item -LiteralPath $env:TACHIMI_OPEN_DIR",
    ],
    darwin: ["open", "--", dir],
    linux: ["xdg-open", dir],
  }[process.platform as string];
  if (!command) {
    throw new Error(`Unsupported platform: ${process.platform}`);
  }
  const result = Bun.spawn(command, {
    env: { ...process.env, TACHIMI_OPEN_DIR: dir },
    stdout: "ignore",
    stderr: "pipe",
  });
  const [exitCode, stderr] = await Promise.all([
    result.exited,
    new Response(result.stderr).text(),
  ]);
  if (exitCode !== 0) {
    throw new Error(`フォルダを開けませんでした: ${stderr}`);
  }
}

export async function openUrl(url: string): Promise<void> {
  const command = {
    win32: [
      "powershell.exe",
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      "$ErrorActionPreference = 'Stop'; Start-Process -FilePath $env:TACHIMI_OPEN_URL",
    ],
    darwin: ["open", "--", url],
    linux: ["xdg-open", url],
  }[process.platform as string];
  if (!command) {
    throw new Error(`Unsupported platform: ${process.platform}`);
  }
  const result = Bun.spawn(command, {
    env: { ...process.env, TACHIMI_OPEN_URL: url },
    stdout: "ignore",
    stderr: "pipe",
  });
  const [exitCode, stderr] = await Promise.all([
    result.exited,
    new Response(result.stderr).text(),
  ]);
  if (exitCode !== 0) {
    throw new Error(`URLを開けませんでした: ${stderr}`);
  }
}
