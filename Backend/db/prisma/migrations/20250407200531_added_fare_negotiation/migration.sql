-- CreateTable
CREATE TABLE "FareNegotiation" (
    "Id" SERIAL NOT NULL,
    "BookingId" INTEGER NOT NULL,
    "DriverId" INTEGER NOT NULL,
    "OwnerId" INTEGER NOT NULL,
    "NegotiatedFare" TEXT NOT NULL,
    "NegotiatedTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FareNegotiation_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FareNegotiation_BookingId_DriverId_key" ON "FareNegotiation"("BookingId", "DriverId");

-- AddForeignKey
ALTER TABLE "FareNegotiation" ADD CONSTRAINT "FareNegotiation_BookingId_fkey" FOREIGN KEY ("BookingId") REFERENCES "Bookings"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FareNegotiation" ADD CONSTRAINT "FareNegotiation_DriverId_fkey" FOREIGN KEY ("DriverId") REFERENCES "Driver"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FareNegotiation" ADD CONSTRAINT "FareNegotiation_OwnerId_fkey" FOREIGN KEY ("OwnerId") REFERENCES "Owner"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
