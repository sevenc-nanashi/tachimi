import { defineHandler } from "void";
import { HTTPException } from "hono/http-exception";

export const GET = defineHandler(async (c) => {
  const response = await fetch(
    "https://api.github.com/repos/sevenc-nanashi/tachimi/releases/latest",
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent":
          "tachimi-server, https://github.com/sevenc-nanashi/tachimi",
      },
      cf: { cacheTtl: 300, cacheEverything: true },
      signal: AbortSignal.timeout(8_000),
    },
  );
  if (response.status === 404) {
    throw new HTTPException(404, {
      message: "リリースはまだ公開されていません",
    });
  }
  if (!response.ok) {
    throw new HTTPException(502, { message: "更新情報を取得できませんでした" });
  }
  const release: {
    tag_name: string;
    assets: { name: string; browser_download_url: string }[];
  } = await response.json();

  c.header("Cache-Control", "public, max-age=300");
  return {
    version: release.tag_name.replace(/^v/, ""),
    downloads: release.assets.map((asset) => ({
      name: asset.name,
      url: asset.browser_download_url,
    })),
  };
});
