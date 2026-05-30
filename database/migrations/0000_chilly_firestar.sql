CREATE TABLE `coursework` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`subheading` text,
	`excerpt` text,
	`repo_url` text,
	`tags` text,
	`status` text NOT NULL,
	`pinned` integer DEFAULT false,
	`priority` integer DEFAULT 0,
	`section` text,
	`sync_source` text DEFAULT 'mdx',
	`locked` integer DEFAULT false,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coursework_slug_unique` ON `coursework` (`slug`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`subheading` text,
	`excerpt` text,
	`author` text,
	`date` text,
	`pinned` integer DEFAULT false,
	`tags` text,
	`status` text NOT NULL,
	`sync_source` text DEFAULT 'mdx',
	`locked` integer DEFAULT false,
	`published_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `posts_slug_unique` ON `posts` (`slug`);--> statement-breakpoint
CREATE TABLE `profile` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`headline` text NOT NULL,
	`bio` text NOT NULL,
	`photo_url` text,
	`github_url` text,
	`linkedin_url` text,
	`sync_source` text DEFAULT 'mdx',
	`locked` integer DEFAULT false,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`subheading` text,
	`excerpt` text,
	`repo_url` text,
	`demo_url` text,
	`tags` text,
	`status` text NOT NULL,
	`pinned` integer DEFAULT false,
	`priority` integer DEFAULT 0,
	`sync_source` text DEFAULT 'mdx',
	`locked` integer DEFAULT false,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`post_slug` text NOT NULL,
	`front` text NOT NULL,
	`back` text NOT NULL,
	`tags` text,
	`status` text NOT NULL,
	`sync_source` text DEFAULT 'mdx',
	`locked` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`post_slug`) REFERENCES `posts`(`slug`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `questions_slug_unique` ON `questions` (`slug`);--> statement-breakpoint
CREATE TABLE `skills` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`sort_order` integer DEFAULT 0,
	`sync_source` text DEFAULT 'mdx',
	`locked` integer DEFAULT false
);
