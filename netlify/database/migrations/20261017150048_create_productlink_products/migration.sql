CREATE TABLE "productlink_products" (
	"id" serial PRIMARY KEY,
	"url" text NOT NULL UNIQUE,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
