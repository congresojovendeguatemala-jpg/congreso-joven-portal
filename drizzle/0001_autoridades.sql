ALTER TABLE "people" ADD COLUMN "known_as" text;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "photo_credit" text;--> statement-breakpoint
ALTER TABLE "positions" ADD COLUMN "elect" boolean DEFAULT false NOT NULL;