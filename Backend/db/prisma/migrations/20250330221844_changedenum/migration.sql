/*
  Warnings:

  - Added the required column `EndTime` to the `Bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `StartTime` to the `Bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'Ongoing';
ALTER TYPE "BookingStatus" ADD VALUE 'Completed';

-- AlterTable
ALTER TABLE "Bookings" ADD COLUMN     "EndTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "StartTime" TIMESTAMP(3) NOT NULL;
