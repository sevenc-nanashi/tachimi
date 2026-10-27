import { dlopen, JSCallback, ptr } from "bun:ffi";
import iconPath from "../../tachimi-common/icon.png" with { type: "file" };

export async function setWindowIcon() {
  if (process.platform !== "win32") return;

  // shortcut: GPUiX has no window icon API; replace this when it exposes one.
  const user32 = dlopen("user32.dll", {
    EnumWindows: { args: ["ptr", "u64"], returns: "i32" },
    GetWindowThreadProcessId: { args: ["u64", "ptr"], returns: "u32" },
    GetWindowTextW: { args: ["u64", "ptr", "i32"], returns: "i32" },
    CreateIconFromResourceEx: {
      args: ["ptr", "u32", "i32", "u32", "i32", "i32", "u32"],
      returns: "u64",
    },
    SendMessageW: { args: ["u64", "u32", "u64", "u64"], returns: "u64" },
    DestroyIcon: { args: ["u64"], returns: "i32" },
    GetSystemMetrics: { args: ["i32"], returns: "i32" },
  });
  const api = user32.symbols;
  let window = 0n;
  const processId = new Uint32Array(1);
  const title = Buffer.alloc(512);
  const callback = new JSCallback(
    (handle: bigint) => {
      api.GetWindowThreadProcessId(handle, ptr(processId));
      if (processId[0] !== process.pid) return 1;
      const length = api.GetWindowTextW(handle, ptr(title), title.length / 2);
      if (title.toString("utf16le", 0, length * 2) !== "Tachimi") return 1;
      window = handle;
      return 0;
    },
    { args: ["u64", "u64"], returns: "i32" },
  );
  try {
    api.EnumWindows(callback.ptr, 0);
  } finally {
    callback.close();
  }
  if (!window) {
    user32.close();
    throw new Error("Tachimi window was not found");
  }

  const image = await Bun.file(iconPath).bytes();
  const icons: bigint[] = [];
  process.once("exit", () => {
    for (const icon of icons) api.DestroyIcon(icon);
    user32.close();
  });
  for (const [kind, widthMetric, heightMetric] of [
    [0, 49, 50],
    [1, 11, 12],
  ]) {
    const icon = api.CreateIconFromResourceEx(
      ptr(image),
      image.length,
      1,
      0x00030000,
      api.GetSystemMetrics(widthMetric),
      api.GetSystemMetrics(heightMetric),
      0,
    );
    if (!icon) throw new Error("Failed to create the Tachimi window icon");
    icons.push(icon);
    api.SendMessageW(window, 0x0080, kind, icon); // WM_SETICON
    if (api.SendMessageW(window, 0x007f, kind, 0) !== icon) {
      throw new Error("Failed to set the Tachimi window icon");
    }
  }
}
