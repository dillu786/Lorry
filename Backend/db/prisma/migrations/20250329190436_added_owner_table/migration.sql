/*
  Warnings:

  - You are about to drop the column `AdhaarCardNumber` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `BackSideAdhaarImage` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `DOB` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `Email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `FrontSideAdhaarImage` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `Name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `PanImage` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `PanNumber` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `Password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `userType` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Wallet` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- DropForeignKey
ALTER TABLE "DriverVehicle" DROP CONSTRAINT "DriverVehicle_DriverId_fkey";

-- DropForeignKey
ALTER TABLE "OwnerDriver" DROP CONSTRAINT "OwnerDriver_DriverId_fkey";

-- DropForeignKey
ALTER TABLE "OwnerDriver" DROP CONSTRAINT "OwnerDriver_OwnerId_fkey";

-- DropForeignKey
ALTER TABLE "OwnerVehicle" DROP CONSTRAINT "OwnerVehicle_OwnerId_fkey";

-- DropForeignKey
ALTER TABLE "Wallet" DROP CONSTRAINT "Wallet_UserID_fkey";

-- DropIndex
DROP INDEX "User_AdhaarCardNumber_key";

-- DropIndex
DROP INDEX "User_Email_key";

-- DropIndex
DROP INDEX "User_MobileNumber_key";

-- DropIndex
DROP INDEX "User_PanNumber_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "AdhaarCardNumber",
DROP COLUMN "BackSideAdhaarImage",
DROP COLUMN "DOB",
DROP COLUMN "Email",
DROP COLUMN "FrontSideAdhaarImage",
DROP COLUMN "Name",
DROP COLUMN "PanImage",
DROP COLUMN "PanNumber",
DROP COLUMN "Password",
DROP COLUMN "userType";

-- DropTable
DROP TABLE "Wallet";

-- CreateTable
CREATE TABLE "Owner" (
    "Id" SERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "Password" TEXT NOT NULL,
    "MobileNumber" TEXT NOT NULL,
    "DOB" TIMESTAMP(3),
    "Email" TEXT,
    "Gender" "Gender" NOT NULL,
    "AdhaarCardNumber" TEXT,
    "FrontSideAdhaarImage" TEXT,
    "BackSideAdhaarImage" TEXT,
    "PanNumber" TEXT,
    "PanImage" TEXT,
    "LastLoggedIn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "Id" SERIAL NOT NULL,
    "Name" TEXT,
    "Gender" "Gender" NOT NULL,
    "Password" TEXT,
    "MobileNumber" TEXT NOT NULL,
    "DOB" TIMESTAMP(3),
    "DrivingLicenceNumber" TEXT NOT NULL,
    "DrivingLicenceFrontImage" TEXT NOT NULL,
    "DrivingLicenceBackImage" TEXT NOT NULL,
    "DriverImage" TEXT NOT NULL,
    "Email" TEXT,
    "AdhaarCardNumber" TEXT NOT NULL,
    "FrontSideAdhaarImage" TEXT NOT NULL,
    "BackSideAdhaarImage" TEXT NOT NULL,
    "PanNumber" TEXT NOT NULL,
    "PanImage" TEXT NOT NULL,
    "LastLoggedIn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "OwnerWallet" (
    "Id" SERIAL NOT NULL,
    "OwnerId" INTEGER NOT NULL,
    "Amount" INTEGER NOT NULL,
    "LastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnerWallet_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "DriverWallet" (
    "Id" SERIAL NOT NULL,
    "DriverId" INTEGER NOT NULL,
    "Amount" INTEGER NOT NULL,
    "LastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverWallet_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "UserWallet" (
    "Id" SERIAL NOT NULL,
    "UserId" INTEGER NOT NULL,
    "Amount" INTEGER NOT NULL,

    CONSTRAINT "UserWallet_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Owner_MobileNumber_key" ON "Owner"("MobileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Owner_Email_key" ON "Owner"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "Owner_AdhaarCardNumber_key" ON "Owner"("AdhaarCardNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Owner_PanNumber_key" ON "Owner"("PanNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_MobileNumber_key" ON "Driver"("MobileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_Email_key" ON "Driver"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_AdhaarCardNumber_key" ON "Driver"("AdhaarCardNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_PanNumber_key" ON "Driver"("PanNumber");

-- CreateIndex
CREATE UNIQUE INDEX "OwnerWallet_OwnerId_key" ON "OwnerWallet"("OwnerId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverWallet_DriverId_key" ON "DriverWallet"("DriverId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWallet_UserId_key" ON "UserWallet"("UserId");

-- AddForeignKey
ALTER TABLE "OwnerDriver" ADD CONSTRAINT "OwnerDriver_OwnerId_fkey" FOREIGN KEY ("OwnerId") REFERENCES "Owner"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerDriver" ADD CONSTRAINT "OwnerDriver_DriverId_fkey" FOREIGN KEY ("DriverId") REFERENCES "Driver"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverVehicle" ADD CONSTRAINT "DriverVehicle_DriverId_fkey" FOREIGN KEY ("DriverId") REFERENCES "Driver"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerVehicle" ADD CONSTRAINT "OwnerVehicle_OwnerId_fkey" FOREIGN KEY ("OwnerId") REFERENCES "Owner"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerWallet" ADD CONSTRAINT "OwnerWallet_OwnerId_fkey" FOREIGN KEY ("OwnerId") REFERENCES "Owner"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverWallet" ADD CONSTRAINT "DriverWallet_DriverId_fkey" FOREIGN KEY ("DriverId") REFERENCES "Driver"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWallet" ADD CONSTRAINT "UserWallet_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
