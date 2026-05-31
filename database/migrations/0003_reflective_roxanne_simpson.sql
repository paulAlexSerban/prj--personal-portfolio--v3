CREATE TABLE `question_tags` (
	`question_slug` text NOT NULL,
	`tag_slug` text NOT NULL,
	PRIMARY KEY(`question_slug`, `tag_slug`),
	FOREIGN KEY (`question_slug`) REFERENCES `questions`(`slug`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_slug`) REFERENCES `tags`(`slug`) ON UPDATE no action ON DELETE cascade
);
