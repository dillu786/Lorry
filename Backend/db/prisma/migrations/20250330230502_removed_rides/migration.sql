/*
  Warnings:

  - You are about to drop the column `CreatedDate` on the `Bookings` table. All the data in the column will be lost.
  - You are about to drop the column `UpdatedDate` on the `Bookings` table. All the data in the column will be lost.
  - You are about to drop the `Rides` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Rides" DROP CONSTRAINT "Rides_BookingId_fkey";

-- DropForeignKey
ALTER TABLE "Rides" DROP CONSTRAINT "Rides_DriverId_fkey";

-- DropForeignKey
ALTER TABLE "Rides" DROP CONSTRAINT "Rides_UserId_fkey";

-- DropForeignKey
ALTER TABLE "Rides" DROP CONSTRAINT "Rides_VehicleId_fkey";

-- AlterTable
ALTER TABLE "Bookings" DROP COLUMN "CreatedDate",
DROP COLUMN "UpdatedDate",
ADD COLUMN     "CreatedDateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "UpdatedDateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "Rides";

-- DropEnum
DROP TYPE "RideStatus";
