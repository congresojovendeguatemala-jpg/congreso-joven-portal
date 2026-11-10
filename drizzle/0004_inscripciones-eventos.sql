CREATE TYPE "public"."registration_status" AS ENUM('confirmado', 'asistio', 'cancelado');--> statement-breakpoint
CREATE TABLE "event_registrations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "event_registrations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"event_id" integer NOT NULL,
	"first_names" text NOT NULL,
	"last_names" text NOT NULL,
	"dpi" text NOT NULL,
	"institution" text NOT NULL,
	"age" integer NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"status" "registration_status" DEFAULT 'confirmado' NOT NULL,
	"privacy_accepted" boolean NOT NULL,
	"photo_consent" boolean DEFAULT false NOT NULL,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_registrations_event_dpi_uq" ON "event_registrations" USING btree ("event_id","dpi");--> statement-breakpoint
CREATE INDEX "event_registrations_event_idx" ON "event_registrations" USING btree ("event_id");