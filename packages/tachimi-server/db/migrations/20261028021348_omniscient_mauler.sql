ALTER TABLE `tachie_revisions` ADD `latest` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `tachie_revisions_latest_unique` ON `tachie_revisions` (`tachie_id`) WHERE "tachie_revisions"."latest" = 1;--> statement-breakpoint
UPDATE `tachie_revisions`
SET `latest` = 1
WHERE (`tachie_id`, `idx`) IN (
  SELECT `tachie_id`, MAX(`idx`) FROM `tachie_revisions` GROUP BY `tachie_id`
);
