DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "jobs"
    WHERE "application_deadline" >= "starts_at" - interval '24 hours'
  ) THEN
    RAISE EXCEPTION 'Migration refused: existing jobs violate the 24-hour selection preparation rule';
  END IF;
END;
$$;--> statement-breakpoint
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_deadline_before_start_check";--> statement-breakpoint
CREATE INDEX "jobs_unfilled_expiry_idx" ON "jobs" USING btree ("status","starts_at");--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_deadline_before_start_check" CHECK ("jobs"."application_deadline" < "jobs"."starts_at" - interval '24 hours');
