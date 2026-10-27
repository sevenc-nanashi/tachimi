CREATE TABLE `tachie_revisions` (
	`tachie_id` text NOT NULL,
	`sha` text NOT NULL,
	`idx` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	PRIMARY KEY(`tachie_id`, `sha`, `idx`)
);
