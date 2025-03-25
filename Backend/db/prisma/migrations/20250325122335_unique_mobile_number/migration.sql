/*
  Warnings:

  - A unique constraint covering the columns `[MobileNumber]` on the table `otps` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "otps_MobileNumber_key" ON "otps"("MobileNumber");
