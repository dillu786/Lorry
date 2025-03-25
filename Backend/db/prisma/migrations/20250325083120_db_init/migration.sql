-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('DRIVER', 'OWNER');

-- CreateTable
CREATE TABLE "User" (
    "Id" SERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "MobileNumber" TEXT NOT NULL,
    "DOB" TIMESTAMP(3) NOT NULL,
    "Email" TEXT NOT NULL,
    "AdhaarCardNumber" TEXT NOT NULL,
    "FrontSideAdhaarImage" TEXT NOT NULL,
    "BackSideAdhaarImage" TEXT NOT NULL,
    "PanNumber" TEXT NOT NULL,
    "PanImage" TEXT NOT NULL,
    "userType" "UserType" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "Id" SERIAL NOT NULL,
    "UserId" INTEGER NOT NULL,
    "LicenseNumber" TEXT NOT NULL,
    "LicenseImage" TEXT NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "Id" SERIAL NOT NULL,
    "Model" TEXT NOT NULL,
    "Year" TIMESTAMP(3) NOT NULL,
    "Category" TEXT NOT NULL,
    "VehicleImage" TEXT NOT NULL,
    "VehicleInsuranceImage" TEXT NOT NULL,
    "PermitImage" TEXT NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "OwnerDriver" (
    "Id" SERIAL NOT NULL,
    "OwnerId" INTEGER NOT NULL,
    "DriverId" INTEGER NOT NULL,

    CONSTRAINT "OwnerDriver_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "DriverVehicle" (
    "Id" SERIAL NOT NULL,
    "DriverId" INTEGER NOT NULL,
    "VehicleId" INTEGER NOT NULL,

    CONSTRAINT "DriverVehicle_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "OwnerVehicle" (
    "Id" SERIAL NOT NULL,
    "OwnerId" INTEGER NOT NULL,
    "VehicleId" INTEGER NOT NULL,

    CONSTRAINT "OwnerVehicle_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" SERIAL NOT NULL,
    "mobileNumber" INTEGER NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otps_mobileNumber_idx" ON "otps"("mobileNumber");

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerDriver" ADD CONSTRAINT "OwnerDriver_OwnerId_fkey" FOREIGN KEY ("OwnerId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerDriver" ADD CONSTRAINT "OwnerDriver_DriverId_fkey" FOREIGN KEY ("DriverId") REFERENCES "Driver"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverVehicle" ADD CONSTRAINT "DriverVehicle_DriverId_fkey" FOREIGN KEY ("DriverId") REFERENCES "Driver"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverVehicle" ADD CONSTRAINT "DriverVehicle_VehicleId_fkey" FOREIGN KEY ("VehicleId") REFERENCES "Vehicle"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerVehicle" ADD CONSTRAINT "OwnerVehicle_OwnerId_fkey" FOREIGN KEY ("OwnerId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerVehicle" ADD CONSTRAINT "OwnerVehicle_VehicleId_fkey" FOREIGN KEY ("VehicleId") REFERENCES "Vehicle"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
