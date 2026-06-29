CREATE TABLE `experience` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`role` text NOT NULL,
	`company` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`summary` text,
	`tech` text,
	`location` text,
	`sort_order` integer DEFAULT 0,
	`status` text NOT NULL,
	`sync_source` text DEFAULT 'json',
	`locked` integer DEFAULT false,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `experience_slug_unique` ON `experience` (`slug`);--> statement-breakpoint
ALTER TABLE `projects` ADD `cover_image` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `role` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `problem` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `approach` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `outcome` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `metrics` text;--> statement-breakpoint
ALTER TABLE `skills` ADD `proficiency` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `skills` ADD `depth_note` text;