ALTER TABLE "products"
ADD COLUMN "featuredPriority" INTEGER NOT NULL DEFAULT 999;

CREATE INDEX "products_featured_featuredPriority_idx"
ON "products"("featured", "featuredPriority");
