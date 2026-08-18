ALTER TABLE `projects` ADD `maturity` text DEFAULT 'implemented' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `scope` text DEFAULT 'service' NOT NULL;