CREATE TYPE "public"."account_status" AS ENUM('active', 'suspended', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."agreement_status" AS ENUM('pending_confirmation', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('submitted', 'accepted', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."area_level" AS ENUM('province', 'city_regency', 'district');--> statement-breakpoint
CREATE TYPE "public"."boost_status" AS ENUM('active', 'ended', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."credit_status" AS ENUM('earned', 'redeemed', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."employer_type" AS ENUM('individual', 'business', 'community');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('draft', 'published', 'filled', 'in_progress', 'completed', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."job_visibility" AS ENUM('visible', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."proof_status" AS ENUM('verified', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."report_reason" AS ENUM('suspicious_job', 'terms_mismatch', 'absence', 'unsafe_behavior', 'spam', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('open', 'reviewing', 'resolved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('low', 'restricted');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('worker', 'employer', 'admin');--> statement-breakpoint
CREATE TYPE "public"."wage_status" AS ENUM('compliant', 'below', 'unavailable');--> statement-breakpoint
CREATE TYPE "public"."wage_unit" AS ENUM('hour', 'day', 'job');--> statement-breakpoint
CREATE TYPE "public"."work_session_status" AS ENUM('scheduled', 'checked_in', 'checked_out', 'verified');--> statement-breakpoint
CREATE TABLE "areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"level" "area_level" NOT NULL,
	"code" varchar(64) NOT NULL,
	"name" varchar(160) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "areas_not_own_parent_check" CHECK ("areas"."parent_id" IS DISTINCT FROM "areas"."id")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(120) NOT NULL,
	"risk_level" "risk_level" NOT NULL,
	"first_opportunity_allowed" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "categories_first_opportunity_requires_low_risk_check" CHECK (NOT "categories"."first_opportunity_allowed" OR "categories"."risk_level" = 'low')
);
--> statement-breakpoint
CREATE TABLE "employer_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"employer_type" "employer_type" NOT NULL,
	"area_id" uuid NOT NULL,
	"description" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_subject" varchar(128) NOT NULL,
	"role" "user_role" NOT NULL,
	"status" "account_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_deleted_at_matches_status_check" CHECK (("users"."status" = 'deleted' AND "users"."deleted_at" IS NOT NULL) OR ("users"."status" <> 'deleted' AND "users"."deleted_at" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "wage_guidelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"area_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"unit" "wage_unit" NOT NULL,
	"minimum_amount" bigint NOT NULL,
	"recommended_amount" bigint NOT NULL,
	"source_label" varchar(255) NOT NULL,
	"source_url" varchar(2048),
	"is_simulated" boolean DEFAULT false NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wage_guidelines_minimum_positive_check" CHECK ("wage_guidelines"."minimum_amount" > 0),
	CONSTRAINT "wage_guidelines_recommended_range_check" CHECK ("wage_guidelines"."recommended_amount" >= "wage_guidelines"."minimum_amount"),
	CONSTRAINT "wage_guidelines_effective_range_check" CHECK ("wage_guidelines"."effective_to" IS NULL OR "wage_guidelines"."effective_to" > "wage_guidelines"."effective_from")
);
--> statement-breakpoint
CREATE TABLE "worker_interests" (
	"worker_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "worker_interests_pk" PRIMARY KEY("worker_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "worker_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"area_id" uuid NOT NULL,
	"bio" varchar(1000),
	"availability_note" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"note" varchar(1000) NOT NULL,
	"first_opportunity_eligible_at_submission" boolean NOT NULL,
	"status" "application_status" DEFAULT 'submitted' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	"withdrawn_at" timestamp with time zone,
	CONSTRAINT "applications_status_timestamps_check" CHECK (
        ("applications"."status" = 'submitted' AND "applications"."decided_at" IS NULL AND "applications"."withdrawn_at" IS NULL)
        OR ("applications"."status" IN ('accepted', 'rejected') AND "applications"."decided_at" IS NOT NULL AND "applications"."withdrawn_at" IS NULL)
        OR ("applications"."status" = 'withdrawn' AND "applications"."decided_at" IS NULL AND "applications"."withdrawn_at" IS NOT NULL)
      )
);
--> statement-breakpoint
CREATE TABLE "job_private_details" (
	"job_id" uuid PRIMARY KEY NOT NULL,
	"full_address" varchar(1000) NOT NULL,
	"arrival_instructions" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employer_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"area_id" uuid NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" varchar(4000) NOT NULL,
	"task_scope" varchar(4000) NOT NULL,
	"public_location_label" varchar(200) NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"estimated_minutes" integer NOT NULL,
	"wage_amount" bigint NOT NULL,
	"wage_unit" "wage_unit" NOT NULL,
	"wage_status" "wage_status" DEFAULT 'unavailable' NOT NULL,
	"payment_method" varchar(160) NOT NULL,
	"payment_timing" varchar(160) NOT NULL,
	"tools_provided" varchar(2000),
	"tools_required" varchar(2000),
	"risk_level" "risk_level" NOT NULL,
	"is_first_opportunity" boolean DEFAULT false NOT NULL,
	"application_deadline" timestamp with time zone NOT NULL,
	"status" "job_status" DEFAULT 'draft' NOT NULL,
	"visibility" "job_visibility" DEFAULT 'visible' NOT NULL,
	"published_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"hidden_at" timestamp with time zone,
	"hidden_by" uuid,
	"hidden_reason" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_estimated_minutes_positive_check" CHECK ("jobs"."estimated_minutes" > 0),
	CONSTRAINT "jobs_wage_amount_positive_check" CHECK ("jobs"."wage_amount" > 0),
	CONSTRAINT "jobs_deadline_before_start_check" CHECK ("jobs"."application_deadline" < "jobs"."starts_at"),
	CONSTRAINT "jobs_first_opportunity_eligibility_check" CHECK (NOT "jobs"."is_first_opportunity" OR ("jobs"."risk_level" = 'low' AND "jobs"."wage_status" = 'compliant')),
	CONSTRAINT "jobs_published_at_state_check" CHECK ("jobs"."status" IN ('draft', 'cancelled') OR "jobs"."published_at" IS NOT NULL),
	CONSTRAINT "jobs_completed_at_state_check" CHECK (("jobs"."status" = 'completed' AND "jobs"."completed_at" IS NOT NULL) OR ("jobs"."status" <> 'completed' AND "jobs"."completed_at" IS NULL)),
	CONSTRAINT "jobs_cancelled_at_state_check" CHECK (("jobs"."status" = 'cancelled' AND "jobs"."cancelled_at" IS NOT NULL) OR ("jobs"."status" <> 'cancelled' AND "jobs"."cancelled_at" IS NULL)),
	CONSTRAINT "jobs_hidden_metadata_check" CHECK (("jobs"."visibility" = 'visible' AND "jobs"."hidden_at" IS NULL AND "jobs"."hidden_by" IS NULL AND "jobs"."hidden_reason" IS NULL) OR ("jobs"."visibility" = 'hidden' AND "jobs"."hidden_at" IS NOT NULL AND "jobs"."hidden_by" IS NOT NULL AND "jobs"."hidden_reason" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(80) NOT NULL,
	"entity_id" uuid NOT NULL,
	"request_id" varchar(128) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"operation" varchar(100) NOT NULL,
	"key" varchar(255) NOT NULL,
	"request_hash" varchar(128) NOT NULL,
	"response_payload" jsonb,
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "idempotency_keys_completion_payload_check" CHECK (("idempotency_keys"."completed_at" IS NULL AND "idempotency_keys"."response_payload" IS NULL) OR ("idempotency_keys"."completed_at" IS NOT NULL AND "idempotency_keys"."response_payload" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" uuid NOT NULL,
	"type" varchar(80) NOT NULL,
	"title" varchar(160) NOT NULL,
	"body" varchar(500) NOT NULL,
	"entity_type" varchar(80),
	"entity_id" uuid,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_entity_pair_check" CHECK (("notifications"."entity_type" IS NULL AND "notifications"."entity_id" IS NULL) OR ("notifications"."entity_type" IS NOT NULL AND "notifications"."entity_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"reason" "report_reason" NOT NULL,
	"description" varchar(2000),
	"job_id" uuid,
	"agreement_id" uuid,
	"reported_user_id" uuid,
	"status" "report_status" DEFAULT 'open' NOT NULL,
	"moderator_id" uuid,
	"moderator_note" varchar(2000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "reports_has_target_check" CHECK ("reports"."job_id" IS NOT NULL OR "reports"."agreement_id" IS NOT NULL OR "reports"."reported_user_id" IS NOT NULL),
	CONSTRAINT "reports_resolution_metadata_check" CHECK (
        ("reports"."status" = 'open' AND "reports"."moderator_id" IS NULL AND "reports"."moderator_note" IS NULL AND "reports"."resolved_at" IS NULL)
        OR ("reports"."status" = 'reviewing' AND "reports"."moderator_id" IS NOT NULL AND "reports"."resolved_at" IS NULL)
        OR ("reports"."status" IN ('resolved', 'rejected') AND "reports"."resolved_at" IS NOT NULL AND "reports"."moderator_id" IS NOT NULL AND "reports"."moderator_note" IS NOT NULL)
      )
);
--> statement-breakpoint
CREATE TABLE "job_boosts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credit_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" "boost_status" DEFAULT 'active' NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_boosts_exact_duration_check" CHECK ("job_boosts"."ends_at" = "job_boosts"."starts_at" + INTERVAL '24 hours'),
	CONSTRAINT "job_boosts_revocation_metadata_check" CHECK (("job_boosts"."status" = 'revoked' AND "job_boosts"."revoked_at" IS NOT NULL) OR ("job_boosts"."status" <> 'revoked' AND "job_boosts"."revoked_at" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "opportunity_credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employer_id" uuid NOT NULL,
	"source_job_id" uuid NOT NULL,
	"status" "credit_status" DEFAULT 'earned' NOT NULL,
	"earned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"redeemed_at" timestamp with time zone,
	"target_job_id" uuid,
	"revoked_at" timestamp with time zone,
	"revoked_by" uuid,
	"revocation_reason" varchar(1000),
	CONSTRAINT "opportunity_credits_expiry_after_earned_check" CHECK ("opportunity_credits"."expires_at" IS NULL OR "opportunity_credits"."expires_at" > "opportunity_credits"."earned_at"),
	CONSTRAINT "opportunity_credits_redemption_metadata_check" CHECK (
        ("opportunity_credits"."status" IN ('earned', 'expired') AND "opportunity_credits"."redeemed_at" IS NULL AND "opportunity_credits"."target_job_id" IS NULL)
        OR ("opportunity_credits"."status" = 'redeemed' AND "opportunity_credits"."redeemed_at" IS NOT NULL AND "opportunity_credits"."target_job_id" IS NOT NULL)
        OR ("opportunity_credits"."status" = 'revoked' AND (("opportunity_credits"."redeemed_at" IS NULL AND "opportunity_credits"."target_job_id" IS NULL) OR ("opportunity_credits"."redeemed_at" IS NOT NULL AND "opportunity_credits"."target_job_id" IS NOT NULL)))
      ),
	CONSTRAINT "opportunity_credits_revocation_metadata_check" CHECK (("opportunity_credits"."status" = 'revoked' AND "opportunity_credits"."revoked_at" IS NOT NULL AND "opportunity_credits"."revoked_by" IS NOT NULL AND "opportunity_credits"."revocation_reason" IS NOT NULL) OR ("opportunity_credits"."status" <> 'revoked' AND "opportunity_credits"."revoked_at" IS NULL AND "opportunity_credits"."revoked_by" IS NULL AND "opportunity_credits"."revocation_reason" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "agreements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"employer_id" uuid NOT NULL,
	"terms_snapshot" jsonb NOT NULL,
	"snapshot_version" smallint DEFAULT 1 NOT NULL,
	"is_first_opportunity" boolean NOT NULL,
	"wage_status" "wage_status" NOT NULL,
	"worker_confirmed_at" timestamp with time zone,
	"employer_confirmed_at" timestamp with time zone,
	"status" "agreement_status" DEFAULT 'pending_confirmation' NOT NULL,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agreements_snapshot_version_positive_check" CHECK ("agreements"."snapshot_version" > 0),
	CONSTRAINT "agreements_distinct_parties_check" CHECK ("agreements"."worker_id" <> "agreements"."employer_id"),
	CONSTRAINT "agreements_confirmation_state_check" CHECK (
        ("agreements"."status" = 'pending_confirmation' AND ("agreements"."worker_confirmed_at" IS NULL OR "agreements"."employer_confirmed_at" IS NULL))
        OR ("agreements"."status" IN ('active', 'completed') AND "agreements"."worker_confirmed_at" IS NOT NULL AND "agreements"."employer_confirmed_at" IS NOT NULL)
        OR ("agreements"."status" = 'cancelled')
      ),
	CONSTRAINT "agreements_cancellation_metadata_check" CHECK (("agreements"."status" = 'cancelled' AND "agreements"."cancelled_at" IS NOT NULL AND "agreements"."cancellation_reason" IS NOT NULL) OR ("agreements"."status" <> 'cancelled' AND "agreements"."cancelled_at" IS NULL AND "agreements"."cancellation_reason" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "work_proofs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agreement_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"employer_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"job_title_snapshot" varchar(160) NOT NULL,
	"area_label_snapshot" varchar(200) NOT NULL,
	"wage_amount_snapshot" bigint NOT NULL,
	"wage_unit_snapshot" "wage_unit" NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone NOT NULL,
	"verification_status" "proof_status" DEFAULT 'verified' NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_by" uuid,
	"revocation_reason" varchar(1000),
	CONSTRAINT "work_proofs_wage_positive_check" CHECK ("work_proofs"."wage_amount_snapshot" > 0),
	CONSTRAINT "work_proofs_time_range_check" CHECK ("work_proofs"."completed_at" >= "work_proofs"."started_at"),
	CONSTRAINT "work_proofs_revocation_metadata_check" CHECK (("work_proofs"."verification_status" = 'verified' AND "work_proofs"."revoked_at" IS NULL AND "work_proofs"."revoked_by" IS NULL AND "work_proofs"."revocation_reason" IS NULL) OR ("work_proofs"."verification_status" = 'revoked' AND "work_proofs"."revoked_at" IS NOT NULL AND "work_proofs"."revoked_by" IS NOT NULL AND "work_proofs"."revocation_reason" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "work_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agreement_id" uuid NOT NULL,
	"status" "work_session_status" DEFAULT 'scheduled' NOT NULL,
	"check_in_code_hash" varchar(255),
	"check_in_code_expires_at" timestamp with time zone,
	"check_in_failed_attempts" smallint DEFAULT 0 NOT NULL,
	"check_in_code_used_at" timestamp with time zone,
	"checked_in_at" timestamp with time zone,
	"checked_out_at" timestamp with time zone,
	"completion_note" varchar(1000),
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "work_sessions_failed_attempts_range_check" CHECK ("work_sessions"."check_in_failed_attempts" BETWEEN 0 AND 5),
	CONSTRAINT "work_sessions_code_metadata_check" CHECK (("work_sessions"."check_in_code_hash" IS NULL AND "work_sessions"."check_in_code_expires_at" IS NULL) OR ("work_sessions"."check_in_code_hash" IS NOT NULL AND "work_sessions"."check_in_code_expires_at" IS NOT NULL)),
	CONSTRAINT "work_sessions_lifecycle_timestamps_check" CHECK (
        ("work_sessions"."status" = 'scheduled' AND "work_sessions"."checked_in_at" IS NULL AND "work_sessions"."checked_out_at" IS NULL AND "work_sessions"."verified_at" IS NULL)
        OR ("work_sessions"."status" = 'checked_in' AND "work_sessions"."checked_in_at" IS NOT NULL AND "work_sessions"."checked_out_at" IS NULL AND "work_sessions"."verified_at" IS NULL)
        OR ("work_sessions"."status" = 'checked_out' AND "work_sessions"."checked_in_at" IS NOT NULL AND "work_sessions"."checked_out_at" IS NOT NULL AND "work_sessions"."verified_at" IS NULL)
        OR ("work_sessions"."status" = 'verified' AND "work_sessions"."checked_in_at" IS NOT NULL AND "work_sessions"."checked_out_at" IS NOT NULL AND "work_sessions"."verified_at" IS NOT NULL AND "work_sessions"."verified_by" IS NOT NULL)
      )
);
--> statement-breakpoint
ALTER TABLE "areas" ADD CONSTRAINT "areas_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."areas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employer_profiles" ADD CONSTRAINT "employer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employer_profiles" ADD CONSTRAINT "employer_profiles_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wage_guidelines" ADD CONSTRAINT "wage_guidelines_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wage_guidelines" ADD CONSTRAINT "wage_guidelines_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wage_guidelines" ADD CONSTRAINT "wage_guidelines_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_interests" ADD CONSTRAINT "worker_interests_worker_id_worker_profiles_user_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."worker_profiles"("user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_interests" ADD CONSTRAINT "worker_interests_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD CONSTRAINT "worker_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD CONSTRAINT "worker_profiles_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_worker_id_worker_profiles_user_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."worker_profiles"("user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_private_details" ADD CONSTRAINT "job_private_details_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_employer_id_employer_profiles_user_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."employer_profiles"("user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_hidden_by_users_id_fk" FOREIGN KEY ("hidden_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_agreement_id_agreements_id_fk" FOREIGN KEY ("agreement_id") REFERENCES "public"."agreements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_user_id_users_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_moderator_id_users_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_boosts" ADD CONSTRAINT "job_boosts_credit_id_opportunity_credits_id_fk" FOREIGN KEY ("credit_id") REFERENCES "public"."opportunity_credits"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_boosts" ADD CONSTRAINT "job_boosts_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_credits" ADD CONSTRAINT "opportunity_credits_employer_id_users_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_credits" ADD CONSTRAINT "opportunity_credits_source_job_id_jobs_id_fk" FOREIGN KEY ("source_job_id") REFERENCES "public"."jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_credits" ADD CONSTRAINT "opportunity_credits_target_job_id_jobs_id_fk" FOREIGN KEY ("target_job_id") REFERENCES "public"."jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_credits" ADD CONSTRAINT "opportunity_credits_revoked_by_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_worker_id_users_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_employer_id_users_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_proofs" ADD CONSTRAINT "work_proofs_agreement_id_agreements_id_fk" FOREIGN KEY ("agreement_id") REFERENCES "public"."agreements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_proofs" ADD CONSTRAINT "work_proofs_worker_id_users_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_proofs" ADD CONSTRAINT "work_proofs_employer_id_users_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_proofs" ADD CONSTRAINT "work_proofs_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_proofs" ADD CONSTRAINT "work_proofs_revoked_by_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_sessions" ADD CONSTRAINT "work_sessions_agreement_id_agreements_id_fk" FOREIGN KEY ("agreement_id") REFERENCES "public"."agreements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_sessions" ADD CONSTRAINT "work_sessions_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "areas_code_unique" ON "areas" USING btree ("code");--> statement-breakpoint
CREATE INDEX "areas_parent_level_idx" ON "areas" USING btree ("parent_id","level");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_unique" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "employer_profiles_area_idx" ON "employer_profiles" USING btree ("area_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_auth_subject_unique" ON "users" USING btree ("auth_subject");--> statement-breakpoint
CREATE INDEX "wage_guidelines_lookup_idx" ON "wage_guidelines" USING btree ("area_id","category_id","unit","is_active","effective_from","effective_to");--> statement-breakpoint
CREATE INDEX "worker_interests_category_idx" ON "worker_interests" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "worker_profiles_area_idx" ON "worker_profiles" USING btree ("area_id");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_job_worker_unique" ON "applications" USING btree ("job_id","worker_id");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_one_accepted_per_job" ON "applications" USING btree ("job_id") WHERE "applications"."status" = 'accepted';--> statement-breakpoint
CREATE INDEX "applications_job_status_submitted_idx" ON "applications" USING btree ("job_id","status","submitted_at");--> statement-breakpoint
CREATE INDEX "applications_worker_status_submitted_idx" ON "applications" USING btree ("worker_id","status","submitted_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "jobs_public_discovery_idx" ON "jobs" USING btree ("status","visibility","application_deadline","is_first_opportunity","area_id","category_id","published_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "jobs_employer_status_idx" ON "jobs" USING btree ("employer_id","status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_logs_entity_created_idx" ON "audit_logs" USING btree ("entity_type","entity_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_logs_actor_created_idx" ON "audit_logs" USING btree ("actor_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_keys_actor_operation_key_unique" ON "idempotency_keys" USING btree ("actor_id","operation","key");--> statement-breakpoint
CREATE INDEX "idempotency_keys_expiry_idx" ON "idempotency_keys" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "notifications_recipient_unread_created_idx" ON "notifications" USING btree ("recipient_id","read_at","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "reports_status_created_idx" ON "reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "reports_job_status_idx" ON "reports" USING btree ("job_id","status");--> statement-breakpoint
CREATE INDEX "reports_agreement_status_idx" ON "reports" USING btree ("agreement_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "job_boosts_credit_unique" ON "job_boosts" USING btree ("credit_id");--> statement-breakpoint
CREATE INDEX "job_boosts_job_status_window_idx" ON "job_boosts" USING btree ("job_id","status","starts_at","ends_at");--> statement-breakpoint
CREATE UNIQUE INDEX "opportunity_credits_source_job_unique" ON "opportunity_credits" USING btree ("source_job_id");--> statement-breakpoint
CREATE INDEX "opportunity_credits_employer_status_expiry_idx" ON "opportunity_credits" USING btree ("employer_id","status","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "agreements_application_unique" ON "agreements" USING btree ("application_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agreements_job_unique" ON "agreements" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "agreements_worker_status_idx" ON "agreements" USING btree ("worker_id","status");--> statement-breakpoint
CREATE INDEX "agreements_employer_status_idx" ON "agreements" USING btree ("employer_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "work_proofs_agreement_unique" ON "work_proofs" USING btree ("agreement_id");--> statement-breakpoint
CREATE INDEX "work_proofs_worker_category_status_idx" ON "work_proofs" USING btree ("worker_id","category_id","verification_status");--> statement-breakpoint
CREATE UNIQUE INDEX "work_sessions_agreement_unique" ON "work_sessions" USING btree ("agreement_id");