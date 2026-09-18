CREATE TABLE `label_workspace_records` (
	`id` text PRIMARY KEY NOT NULL,
	`module` text NOT NULL,
	`title` text NOT NULL,
	`status` text NOT NULL,
	`owner` text DEFAULT '' NOT NULL,
	`due_date` text DEFAULT '' NOT NULL,
	`details` text NOT NULL,
	`checklist` text NOT NULL,
	`archived` integer DEFAULT 0 NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `label_workspace_module` ON `label_workspace_records` (`module`,`archived`,`updated_at`);