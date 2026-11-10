ALTER TABLE "events" ADD COLUMN "body" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "images" jsonb;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "speakers" jsonb;