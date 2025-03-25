/*
  Warnings:

  - The primary key for the `otps` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `otps` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `otps` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `otps` table. All the data in the column will be lost.
  - You are about to drop the column `mobileNumber` on the `otps` table. All the data in the column will be lost.
  - You are about to drop the column `otp` on the `otps` table. All the data in the column will be lost.
  - You are about to drop the `Driver` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[MobileNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[Email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[AdhaarCardNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[PanNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `LastLoggedIn` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `MobileNumber` to the `otps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Otp` to the `otps` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Driver" DROP CONSTRAINT "Driver_UserId_fkey";

-- DropForeignKey
ALTER TABLE "DriverVehicle" DROP CONSTRAINT "DriverVehicle_DriverId_fkey";

-- DropForeignKey
ALTER TABLE "OwnerDriver" DROP CONSTRAINT "OwnerDriver_DriverId_fkey";

-- DropIndex
DROP INDEX "otps_mobileNumber_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "CreatedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "LastLoggedIn" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "Password" TEXT,
ALTER COLUMN "Email" DROP NOT NULL,
ALTER COLUMN "AdhaarCardNumber" DROP NOT NULL,
ALTER COLUMN "FrontSideAdhaarImage" DROP NOT NULL,
ALTER COLUMN "BackSideAdhaarImage" DROP NOT NULL,
ALTER COLUMN "PanNumber" DROP NOT NULL,
ALTER COLUMN "PanImage" DROP NOT NULL;

-- AlterTable
ALTER TABLE "otps" DROP CONSTRAINT "otps_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "id",
DROP COLUMN "mobileNumber",
DROP COLUMN "otp",
ADD COLUMN     "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ExpiresAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "Id" SERIAL NOT NULL,
ADD COLUMN     "MobileNumber" TEXT NOT NULL,
ADD COLUMN     "Otp" TEXT NOT NULL,
ADD CONSTRAINT "otps_pkey" PRIMARY KEY ("Id");

-- DropTable
DROP TABLE "Driver";

-- CreateTable
CREATE TABLE "Wallet" (
    "Id" SERIAL NOT NULL,
    "UserID" INTEGER NOT NULL,
    "Amount" INTEGER NOT NULL,
    "LastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_UserID_key" ON "Wallet"("UserID");

-- CreateIndex
CREATE UNIQUE INDEX "User_MobileNumber_key" ON "User"("MobileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_Email_key" ON "User"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "User_AdhaarCardNumber_key" ON "User"("AdhaarCardNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_PanNumber_key" ON "User"("PanNumber");

-- CreateIndex
CREATE INDEX "otps_MobileNumber_idx" ON "otps"("MobileNumber");

-- AddForeignKey
ALTER TABLE "OwnerDriver" ADD CONSTRAINT "OwnerDriver_DriverId_fkey" FOREIGN KEY ("DriverId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverVehicle" ADD CONSTRAINT "DriverVehicle_DriverId_fkey" FOREIGN KEY ("DriverId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
