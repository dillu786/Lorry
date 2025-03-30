/*
  Warnings:

  - Added the required column `VehicleNumber` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "LastLoggedIn" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "VehicleNumber" TEXT NOT NULL,
ALTER COLUMN "Year" SET DATA TYPE TEXT,
ALTER COLUMN "VehicleImage" DROP NOT NULL,
ALTER COLUMN "VehicleInsuranceImage" DROP NOT NULL,
ALTER COLUMN "PermitImage" DROP NOT NULL;
