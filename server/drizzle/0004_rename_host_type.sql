ALTER TYPE "host_type" RENAME TO "role_type";
ALTER TABLE "users" RENAME COLUMN "host_type" TO "role_type";
