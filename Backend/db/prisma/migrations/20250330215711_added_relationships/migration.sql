/*
  Warnings:

  - Added the required column `Fare` to the `Bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bookings" ADD COLUMN     "DriverId" INTEGER,
ADD COLUMN     "Fare" TEXT NOT NULL,
ADD COLUMN     "VehicleId" INTEGER;

-- AddForeignKey
ALTER TABLE "Bookings" ADD CONSTRAINT "Bookings_DriverId_fkey" FOREIGN KEY ("DriverId") REFERENCES "Driver"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookings" ADD CONSTRAINT "Bookings_VehicleId_fkey" FOREIGN KEY ("VehicleId") REFERENCES "Vehicle"("Id") ON DELETE SET NULL ON UPDATE CASCADE;
