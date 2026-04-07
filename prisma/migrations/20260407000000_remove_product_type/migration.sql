-- DropIndex
DROP INDEX IF EXISTS "products_type_idx";

-- AlterTable
ALTER TABLE "products" DROP COLUMN IF EXISTS "type";

-- DropEnum
DROP TYPE IF EXISTS "ProductType";
