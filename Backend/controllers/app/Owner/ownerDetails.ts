import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { responseObj } from "../../../utils/response";
import { getObjectSignedUrl } from "../../../utils/s3utils";
import { boolean } from "zod";

const prisma = new PrismaClient();

export const getOwnerDetails = async (req: Request, res: Response): Promise<any> => {
  try {
    const ownerId = req.user.Id;

    // Fetch owner data
    const owner = await prisma.owner.findFirst({
      where: { Id: ownerId }
    });

    if (!owner) {
      return res.status(404).json(responseObj(false, null, "Owner not found"));
    }

    // Get vehicle IDs for the owner
    const vehicles = await prisma.ownerVehicle.findMany({
      where: { OwnerId: ownerId },
      select: { VehicleId: true }
    });
    const vehicleIds = vehicles.map(v => v.VehicleId);

    // Determine flags
    const isRegistrationDone = !!(owner.OwnerImage && owner.AdhaarCardNumber && owner.Email && owner.Name);
    const isDocUploaded = !!(owner.BackSideAdhaarImage && owner.FrontSideAdhaarImage && owner.PanImage && owner.PanNumber);
    const isVehicleAdded = vehicleIds.length > 0;

    // Get signed URL for image
    let ownerImage = null;
    try {
      if (owner.OwnerImage) {
        ownerImage = await getObjectSignedUrl(owner.OwnerImage);
      }
    } catch (e) {
      console.warn("Failed to generate signed URL for owner image:", e);
    }

    // Count active bookings for owner's vehicles
    const activeVehicles = await prisma.bookings.count({
      where: {
        Status: "Ongoing",
        VehicleId: { in: vehicleIds }
      }
    });

    // Get driver's IDs for the owner
    const drivers = await prisma.ownerDriver.findMany({
      where: { OwnerId: ownerId },
      select: { DriverId: true }
    });
    const driverIds = drivers.map(d => d.DriverId);

    // Count completed rides by those drivers
    const completedRides = await prisma.bookings.count({
      where: {
        Status: "Completed",
        DriverId: { in: driverIds }
      }
    });

    // Get 5 most recent bookings for owner's vehicles
    const recentVehicles = await prisma.bookings.findMany({
      where: {
        VehicleId: { in: vehicleIds }
      },
      orderBy: {
        CreatedDateTime: 'desc'
      },
      include: {
        Vehicle: true
      },
      take: 5
    });

    // Send response
    return res.status(200).json(responseObj(true, {
      myVehicles: vehicleIds.length,
      Name: owner.Name,
      Image: ownerImage,
      activeVehicles,
      completedRides,
      recentVehicles,
      isDocUploaded,
      isRegistrationDone,
      isVehicleAdded
    }, "Successfully fetched"));

  } catch (error: any) {
    console.error("Error fetching owner details:", error.message || error);
    return res.status(500).json(responseObj(false, null, "Internal Server Error"));
  }
};

export default getOwnerDetails;
