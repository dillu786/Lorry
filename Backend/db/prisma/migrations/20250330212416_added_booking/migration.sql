/*
  Warnings:

  - Added the required column `Gender` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'ONLINE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('Pending', 'Confirmed', 'Cancelled');

-- CreateEnum
CREATE TYPE "RideStatus" AS ENUM ('Ongoing', 'Completed', 'Cancelled');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "Gender" "Gender" NOT NULL,
ADD COLUMN     "Name" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Bookings" (
    "Id" SERIAL NOT NULL,
    "UserId" INTEGER NOT NULL,
    "PickUpLocation" TEXT NOT NULL,
    "DropLocation" TEXT NOT NULL,
    "Product" TEXT NOT NULL,
    "Distance" TEXT NOT NULL,
    "Status" "BookingStatus" NOT NULL,
    "PaymentMode" "PaymentMode" NOT NULL,
    "BookingTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookings_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Rides" (
    "Id" SERIAL NOT NULL,
    "BookingId" INTEGER NOT NULL,
    "UserId" INTEGER NOT NULL,
    "DriverId" INTEGER NOT NULL,
    "VehicleId" INTEGER NOT NULL,
    "Status" "RideStatus" NOT NULL,
    "Fare" TEXT NOT NULL,
    "StartTime" TIMESTAMP(3) NOT NULL,
    "EndTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rides_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rides_BookingId_key" ON "Rides"("BookingId");

-- AddForeignKey
ALTER TABLE "Bookings" ADD CONSTRAINT "Bookings_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rides" ADD CONSTRAINT "Rides_DriverId_fkey" FOREIGN KEY ("DriverId") REFERENCES "Driver"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rides" ADD CONSTRAINT "Rides_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rides" ADD CONSTRAINT "Rides_VehicleId_fkey" FOREIGN KEY ("VehicleId") REFERENCES "Vehicle"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rides" ADD CONSTRAINT "Rides_BookingId_fkey" FOREIGN KEY ("BookingId") REFERENCES "Bookings"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
