CREATE TABLE "catalog_object" (
	"group_name" text NOT NULL,
	"catnr" integer NOT NULL,
	"name" text NOT NULL,
	"line1" text NOT NULL,
	"line2" text NOT NULL,
	"epoch" text,
	"kind" text,
	"object_type" text,
	"ops_status" text,
	"owner" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_object_group_name_catnr_pk" PRIMARY KEY("group_name","catnr")
);
--> statement-breakpoint
CREATE TABLE "orbital_satcat" (
	"catnr" integer PRIMARY KEY NOT NULL,
	"object_type" text,
	"ops_status" text,
	"owner" text,
	"decay_date" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orbital_tle" (
	"catnr" integer PRIMARY KEY NOT NULL,
	"name" text,
	"line1" text NOT NULL,
	"line2" text NOT NULL,
	"epoch" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
