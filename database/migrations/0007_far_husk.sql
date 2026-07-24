CREATE TABLE `cheat_sheets` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`post_slug` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`status` text NOT NULL,
	`sort_order` integer DEFAULT 0,
	`sync_source` text DEFAULT 'mdx',
	`locked` integer DEFAULT false,
	`updated_at` integer,
	FOREIGN KEY (`post_slug`) REFERENCES `posts`(`slug`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cheat_sheets_slug_unique` ON `cheat_sheets` (`slug`);--> statement-breakpoint
CREATE TABLE `learning_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`post_slug` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`status` text NOT NULL,
	`sort_order` integer DEFAULT 0,
	`sync_source` text DEFAULT 'mdx',
	`locked` integer DEFAULT false,
	`updated_at` integer,
	FOREIGN KEY (`post_slug`) REFERENCES `posts`(`slug`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learning_plans_slug_unique` ON `learning_plans` (`slug`);