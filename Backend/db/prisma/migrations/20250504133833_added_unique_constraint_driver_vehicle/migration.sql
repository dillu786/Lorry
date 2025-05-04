/*
  Warnings:

  - A unique constraint covering the columns `[DriverId,VehicleId]` on the table `DriverVehicle` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DriverVehicle_DriverId_VehicleId_key" ON "DriverVehicle"("DriverId", "VehicleId");
