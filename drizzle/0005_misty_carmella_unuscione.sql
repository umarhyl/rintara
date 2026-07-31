CREATE TYPE "public"."cash_payment_confirmation_status" AS ENUM('awaiting_worker', 'confirmed_received', 'reported_not_received', 'auto_confirmed');--> statement-breakpoint
CREATE TABLE "cash_payment_confirmations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agreement_id" uuid NOT NULL,
	"status" "cash_payment_confirmation_status" DEFAULT 'awaiting_worker' NOT NULL,
	"employer_marked_paid_at" timestamp with time zone NOT NULL,
	"worker_responded_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"auto_confirm_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cash_payment_confirmations_deadline_check" CHECK ("cash_payment_confirmations"."auto_confirm_at" = "cash_payment_confirmations"."employer_marked_paid_at" + interval '48 hours'),
	CONSTRAINT "cash_payment_confirmations_state_metadata_check" CHECK (
        ("cash_payment_confirmations"."status" = 'awaiting_worker' AND "cash_payment_confirmations"."worker_responded_at" IS NULL AND "cash_payment_confirmations"."confirmed_at" IS NULL)
        OR ("cash_payment_confirmations"."status" = 'confirmed_received' AND "cash_payment_confirmations"."worker_responded_at" IS NOT NULL AND "cash_payment_confirmations"."confirmed_at" IS NOT NULL)
        OR ("cash_payment_confirmations"."status" = 'reported_not_received' AND "cash_payment_confirmations"."worker_responded_at" IS NOT NULL AND "cash_payment_confirmations"."confirmed_at" IS NULL)
        OR ("cash_payment_confirmations"."status" = 'auto_confirmed' AND "cash_payment_confirmations"."worker_responded_at" IS NULL AND "cash_payment_confirmations"."confirmed_at" IS NOT NULL)
      )
);
--> statement-breakpoint
ALTER TABLE "cash_payment_confirmations" ADD CONSTRAINT "cash_payment_confirmations_agreement_id_agreements_id_fk" FOREIGN KEY ("agreement_id") REFERENCES "public"."agreements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cash_payment_confirmations_agreement_unique" ON "cash_payment_confirmations" USING btree ("agreement_id");--> statement-breakpoint
CREATE INDEX "cash_payment_confirmations_auto_confirm_idx" ON "cash_payment_confirmations" USING btree ("status","auto_confirm_at");