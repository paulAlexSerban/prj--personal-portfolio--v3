CREATE TABLE `news_items` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`guid` text NOT NULL,
	`title` text NOT NULL,
	`link` text NOT NULL,
	`source` text NOT NULL,
	`source_url` text NOT NULL,
	`category` text NOT NULL,
	`summary` text,
	`published_at` integer,
	`fetched_at` integer,
	`sync_source` text DEFAULT 'rss',
	`locked` integer DEFAULT false
);
--> statement-breakpoint
CREATE UNIQUE INDEX `news_items_slug_unique` ON `news_items` (`slug`);