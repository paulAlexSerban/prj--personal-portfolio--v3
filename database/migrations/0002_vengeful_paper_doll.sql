CREATE TABLE `pages` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`status` text NOT NULL,
	`sync_source` text DEFAULT 'json',
	`locked` integer DEFAULT false,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_slug_unique` ON `pages` (`slug`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text DEFAULT 'profile' NOT NULL,
	`name` text NOT NULL,
	`headline` text NOT NULL,
	`bio` text NOT NULL,
	`photo_url` text,
	`github_url` text,
	`linkedin_url` text,
	`sync_source` text DEFAULT 'json',
	`locked` integer DEFAULT false,
	`updated_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_profile`("id", "slug", "name", "headline", "bio", "photo_url", "github_url", "linkedin_url", "sync_source", "locked", "updated_at") SELECT "id", 'profile', "name", "headline", "bio", "photo_url", "github_url", "linkedin_url", "sync_source", "locked", "updated_at" FROM `profile`;--> statement-breakpoint
DROP TABLE `profile`;--> statement-breakpoint
ALTER TABLE `__new_profile` RENAME TO `profile`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `profile_slug_unique` ON `profile` (`slug`);--> statement-breakpoint
CREATE TABLE `__new_skills` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`sort_order` integer DEFAULT 0,
	`sync_source` text DEFAULT 'json',
	`locked` integer DEFAULT false
);
--> statement-breakpoint
INSERT INTO `__new_skills`("id", "slug", "name", "category", "sort_order", "sync_source", "locked") SELECT "id", lower(replace(trim("name"), ' ', '-')), "name", "category", "sort_order", "sync_source", "locked" FROM `skills`;--> statement-breakpoint
DROP TABLE `skills`;--> statement-breakpoint
ALTER TABLE `__new_skills` RENAME TO `skills`;--> statement-breakpoint
CREATE UNIQUE INDEX `skills_slug_unique` ON `skills` (`slug`);