ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "cancellation_reason" varchar(1000);--> statement-breakpoint
UPDATE "jobs"
SET "cancellation_reason" = 'Migrated cancellation reason unavailable.'
WHERE "status" = 'cancelled' AND "cancelled_at" IS NOT NULL AND "cancellation_reason" IS NULL;--> statement-breakpoint
ALTER TABLE "jobs" DROP CONSTRAINT IF EXISTS "jobs_cancelled_at_state_check";--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_cancelled_at_state_check" CHECK (("jobs"."status" = 'cancelled' AND "jobs"."cancelled_at" IS NOT NULL AND "jobs"."cancellation_reason" IS NOT NULL) OR ("jobs"."status" <> 'cancelled' AND "jobs"."cancelled_at" IS NULL AND "jobs"."cancellation_reason" IS NULL));
