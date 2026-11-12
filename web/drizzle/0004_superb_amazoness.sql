CREATE TABLE "regulator_operators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"regulator_id" uuid NOT NULL,
	"operator" text NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regulator_operators_regulator_operator_unique" UNIQUE("regulator_id","operator")
);
--> statement-breakpoint
CREATE TABLE "regulators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"agency" text NOT NULL,
	"agency_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regulators_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "regulators_agency_code_unique" UNIQUE("agency_code")
);
--> statement-breakpoint
ALTER TABLE "regulator_operators" ADD CONSTRAINT "regulator_operators_regulator_id_regulators_id_fk" FOREIGN KEY ("regulator_id") REFERENCES "public"."regulators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulators" ADD CONSTRAINT "regulators_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;