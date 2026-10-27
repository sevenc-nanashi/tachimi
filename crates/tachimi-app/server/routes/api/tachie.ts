import { defineHandler } from "void";
import { env } from "cloudflare:workers";
import * as v from "valibot";
import { HTTPException } from "hono/http-exception";
import { parseHTML } from "linkedom";

type TachieInfo = {
  title: string;
  user: string;
  sha: string;
  parentWorkId: string | undefined;
  thumbnail: string;
};

const cacheDuration = 60 * 5; // 5 minutes
async function getInfo(key: string): Promise<TachieInfo> {
  const response = await fetch(`https://tachie.net/w/${key}`, {
    cf: {
      cacheTtl: cacheDuration,
    },
  });
  if (response.status === 404) {
    throw new HTTPException(404, { message: `Key ${key} not found` });
  }
  if (!response.ok) {
    throw new HTTPException(500, {
      message: `Failed to fetch SHA for key ${key}: ${response.statusText}`,
    });
  }

  const parsed = parseHTML(await response.text());
  const title = parsed.document.querySelector(".file-header h1")?.textContent;
  const user = parsed.document.querySelector(
    ".file-author-name a",
  )?.textContent;
  const sha = parsed.document.querySelector(".file-facts .hash")?.textContent;
  const configuredThumbnail = parsed.document
    .querySelector(".work-main img")
    ?.getAttribute("src");
  const mainStaticImage = parsed.document
    .querySelector(".file-image img")
    ?.getAttribute("src");
  const viewerFallbackImage = parsed.document
    .querySelector("img.viewer-fallback")
    ?.getAttribute("src");
  const thumbnail =
    configuredThumbnail || mainStaticImage || viewerFallbackImage;

  if (!title || !user || !sha || !thumbnail) {
    throw new HTTPException(500, {
      message: `Failed to parse tachie info for key ${key}`,
    });
  }

  const dt = parsed.document.querySelectorAll(".file-facts dt");
  let parentWorkId: string | undefined;
  for (let i = 0; i < dt.length; i++) {
    if (dt[i]?.textContent === "親作品") {
      const dd = dt[i]?.nextElementSibling;
      const link = dd?.querySelector("a");
      if (link?.getAttribute("href")?.includes("nicovideo.jp")) {
        const url = new URL(link.getAttribute("href")!);
        parentWorkId = url.searchParams.get("id") || undefined;
      }
    }
  }

  return { title, user, sha, thumbnail, parentWorkId };
}

async function upsertRevisionIndex(
  db: D1Database,
  tachieId: string,
  sha: string,
) {
  return db
    .prepare(
      `
        INSERT INTO tachie_revisions (tachie_id, sha, idx)
        VALUES (
          ?1, ?2,
          (SELECT COUNT(*) FROM tachie_revisions WHERE tachie_id = ?1)
        )
        ON CONFLICT (tachie_id, sha) DO UPDATE
        SET idx = tachie_revisions.idx
        RETURNING idx, unixepoch(created_at) as createdAt
      `,
    )
    .bind(tachieId, sha)
    .first<{
      idx: number;
      createdAt: number;
    }>();
}

export const GET = defineHandler.withValidator({
  query: v.object({ key: v.pipe(v.string(), v.nonEmpty()) }),
})(async (_c, { query }) => {
  const tachieInfo = await getInfo(query.key);
  const revision = await upsertRevisionIndex(env.DB, query.key, tachieInfo.sha);
  if (revision === null) {
    throw new HTTPException(500, {
      message: "Revision upsert returned no row",
    });
  }
  return {
    ...tachieInfo,
    date: new Date(revision.createdAt * 1000).toISOString(),
    idx: revision.idx,
    download: `https://tachie.net/w/${query.key}/download`,
  };
});
