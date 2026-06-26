CREATE TABLE `question_options` (
	`question_slug` text NOT NULL,
	`option_key` text NOT NULL,
	`sort_order` integer NOT NULL,
	`label` text NOT NULL,
	`is_correct` integer NOT NULL,
	PRIMARY KEY(`question_slug`, `option_key`),
	FOREIGN KEY (`question_slug`) REFERENCES `questions`(`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `questions` ADD `answer_format` text DEFAULT 'free_text' NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` ADD `cognitive_style` text DEFAULT 'factual_recall' NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` ADD `difficulty` text DEFAULT 'intermediate' NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` ADD `grading_mode` text DEFAULT 'self' NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` ADD `stem` text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE `questions` SET `stem` = `front` WHERE `stem` = '';--> statement-breakpoint
ALTER TABLE `questions` ADD `payload` text;