import { defineHandler } from "void";
import { env } from "cloudflare:workers";
import * as v from "valibot";

export const GET = defineHandler.withValidator({
  query: v.object({ keys: v.pipe(v.string(), v.nonEmpty()) }),
})(async (_c, { query }) => {
  const keys = query.keys.split(",");

  const { results } = await env.DB.prepare(
    `SELECT requested.value AS tachie_id, MAX(revision.idx) AS idx
     FROM json_each(?1) AS requested
     LEFT JOIN tachie_revisions AS revision ON revision.tachie_id = requested.value
     GROUP BY requested.value`,
  )
    .bind(JSON.stringify(keys))
    .all<{ tachie_id: string; idx: number | null }>();
  const revisions: Record<string, number | null> = Object.fromEntries(
    results.map(({ tachie_id, idx }) => [tachie_id, idx]),
  );

  return { revisions };
});
