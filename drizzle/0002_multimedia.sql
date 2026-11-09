CREATE TABLE "galleries" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "galleries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"date" date,
	"category" text,
	"cover_url" text,
	"public" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "galleries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "date" date;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "doc_type" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "event_name" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "people" jsonb;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "tags" jsonb;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "gallery_id" integer;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "mime" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "bytes" integer;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "uploaded_by" uuid;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_gallery_id_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."galleries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_kind_public_idx" ON "media" USING btree ("kind","public");--> statement-breakpoint
CREATE INDEX "media_gallery_idx" ON "media" USING btree ("gallery_id");