-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "dropyId" INTEGER;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_dropyId_fkey" FOREIGN KEY ("dropyId") REFERENCES "Dropy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
