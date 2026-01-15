ALTER TABLE `app_blocks` ADD `status` text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `app_blocks` ADD `block_type` text;--> statement-breakpoint
ALTER TABLE `app_blocks` ADD `onboarding_stage` text DEFAULT 'questions';--> statement-breakpoint
ALTER TABLE `app_blocks` ADD `onboarding_data` text;