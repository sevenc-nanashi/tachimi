import { sql } from "void/db";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "void/schema-d1";

export const tachieRevisions = sqliteTable(
  "tachie_revisions",
  {
    tachieId: text("tachie_id").notNull(),
    sha: text("sha").notNull().notNull(),
    idx: integer("idx").notNull(),
    latest: integer("latest", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at")
      .default(sql`(datetime('now'))`)
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.tachieId, table.sha, table.idx] }),
    uniqueIndex("tachie_revisions_tachie_id_sha_unique").on(
      table.tachieId,
      table.sha,
    ),
    uniqueIndex("tachie_revisions_latest_unique")
      .on(table.tachieId)
      .where(sql`${table.latest} = 1`),
  ],
);
