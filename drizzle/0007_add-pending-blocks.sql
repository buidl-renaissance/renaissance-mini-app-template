-- Pending App Blocks - blocks submitted for creation (awaiting admin review/build)
CREATE TABLE `pending_app_blocks` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`),
  `block_name` text NOT NULL,
  `block_type` text NOT NULL,
  `prd_data` text NOT NULL,
  `summary_data` text,
  `status` text NOT NULL DEFAULT 'pending',
  `notification_sent` integer DEFAULT false NOT NULL,
  `admin_notes` text,
  `created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
  `updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
