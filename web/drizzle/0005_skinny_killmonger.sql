CREATE TABLE "satellite_registrations" (
	"norad" integer PRIMARY KEY NOT NULL,
	"escrow" text NOT NULL,
	"tx_hash" text NOT NULL,
	"operator" text NOT NULL,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "satellite_registrations" ADD CONSTRAINT "satellite_registrations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE set null ON UPDATE no action;