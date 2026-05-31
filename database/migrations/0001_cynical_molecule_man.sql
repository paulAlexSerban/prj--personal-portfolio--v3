CREATE TABLE `content_tags` (
	`content_slug` text NOT NULL,
	`tag_slug` text NOT NULL,
	`content_type` text NOT NULL,
	PRIMARY KEY(`content_slug`, `tag_slug`),
	FOREIGN KEY (`tag_slug`) REFERENCES `tags`(`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `tags_slug_unique` ON `tags` (`slug`);--> statement-breakpoint
ALTER TABLE `coursework` DROP COLUMN `tags`;--> statement-breakpoint
ALTER TABLE `posts` DROP COLUMN `tags`;--> statement-breakpoint
ALTER TABLE `projects` DROP COLUMN `tags`;--> statement-breakpoint
ALTER TABLE `questions` DROP COLUMN `tags`;