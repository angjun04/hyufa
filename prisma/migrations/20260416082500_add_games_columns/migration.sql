-- AlterTable
ALTER TABLE "TierCache" ADD COLUMN     "gamesS15" INTEGER,
ADD COLUMN     "gamesS16" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "gamesS15" INTEGER,
ADD COLUMN     "gamesS16Locked" INTEGER;
