CREATE TABLE "work_completion_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_session_id" uuid NOT NULL,
	"storage_path" varchar(500) NOT NULL,
	"mime_type" varchar(80) NOT NULL,
	"byte_size" integer NOT NULL,
	"sha256" varchar(64) NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "work_completion_evidence_mime_type_check" CHECK ("work_completion_evidence"."mime_type" = 'image/webp'),
	CONSTRAINT "work_completion_evidence_byte_size_check" CHECK ("work_completion_evidence"."byte_size" > 0 AND "work_completion_evidence"."byte_size" <= 5242880),
	CONSTRAINT "work_completion_evidence_sha256_check" CHECK (char_length("work_completion_evidence"."sha256") = 64)
);
--> statement-breakpoint
ALTER TABLE "work_completion_evidence" ADD CONSTRAINT "work_completion_evidence_work_session_id_work_sessions_id_fk" FOREIGN KEY ("work_session_id") REFERENCES "public"."work_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_completion_evidence" ADD CONSTRAINT "work_completion_evidence_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "work_completion_evidence_session_unique" ON "work_completion_evidence" USING btree ("work_session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "work_completion_evidence_storage_path_unique" ON "work_completion_evidence" USING btree ("storage_path");