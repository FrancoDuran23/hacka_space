CREATE TYPE "public"."contract_kind" AS ENUM('escrow', 'oracle', 'token', 'treasury', 'other');--> statement-breakpoint
CREATE TABLE "wallet_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"address" text NOT NULL,
	"nonce" text NOT NULL,
	"message" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_challenges_nonce_unique" UNIQUE("nonce")
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"address" text NOT NULL,
	"chain_id" integer DEFAULT 43113 NOT NULL,
	"label" text,
	"verified_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallets_address_chain_id_unique" UNIQUE("address","chain_id")
);
--> statement-breakpoint
CREATE TABLE "contract_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"kind" "contract_kind" NOT NULL,
	"address" text NOT NULL,
	"chain_id" integer DEFAULT 43113 NOT NULL,
	"deploy_tx_hash" text,
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contract_addresses_chain_id_address_unique" UNIQUE("chain_id","address")
);
--> statement-breakpoint
ALTER TABLE "wallet_challenges" ADD CONSTRAINT "wallet_challenges_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_addresses" ADD CONSTRAINT "contract_addresses_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "neon_auth"."user"("id") ON DELETE restrict ON UPDATE no action;