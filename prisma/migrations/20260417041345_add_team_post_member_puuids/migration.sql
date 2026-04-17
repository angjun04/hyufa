-- AlterTable
ALTER TABLE "TeamPost" ADD COLUMN     "memberPuuids" TEXT[] DEFAULT ARRAY[]::TEXT[];
