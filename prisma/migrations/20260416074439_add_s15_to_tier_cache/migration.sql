-- AlterTable
ALTER TABLE "TierCache" ADD COLUMN     "peakLPS15" INTEGER,
ADD COLUMN     "peakRankS15" TEXT,
ADD COLUMN     "peakTierS15" TEXT,
ADD COLUMN     "s15FetchedAt" TIMESTAMP(3);
