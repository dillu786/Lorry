import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { responseObj } from "../../../utils/response";
import { getObjectSignedUrl } from "../../../utils/s3utils";
import { boolean } from "zod";

const prisma = new PrismaClient();

export const getOwnerDetails = async (req: Request, res: Response): Promise<any> => {
  try {
    const ownerId = req.user.Id;

    // Get vehicle IDs for the owner
    const Vehicles = await prisma.ownerVehicle.findMany({
      where: { OwnerId: ownerId },
      select: { VehicleId: true }
    });
    const vehicleIds = Vehicles.map(v => v.VehicleId);

    const owner = await prisma.owner.findFirst({
      where:{
        Id: ownerId
      }
    });
    let isRegisterationDone = false;
    let isDocUploaded = false;
    let isVehicleAdded =false;

    if(owner?.OwnerImage && owner.AdhaarCardNumber && owner.Email && owner.Name){
      isRegisterationDone = true
    }

    if(owner?.BackSideAdhaarImage && owner.FrontSideAdhaarImage && owner.PanImage && owner.PanNumber){
      isDocUploaded = true
    }
    
    if(vehicleIds.length>0){
      isVehicleAdded = true
    }



    const ownnerImage = await getObjectSignedUrl(owner?.OwnerImage as string);
   

    // Count of active ("Ongoing") vehicle bookings
    const activeVehicles = await prisma.bookings.count({
      where: {
        AND: [
          { Status: "Ongoing" },
          { VehicleId: { in: vehicleIds } }
        ]
      }
    });

    // Get driver IDs for the owner
    const drivers = await prisma.ownerDriver.findMany({
      where: { OwnerId: ownerId },
      select: { DriverId: true }
    });

  
    const driverIds = drivers.map(d => d.DriverId);

    // Count of completed rides by those drivers
    const completedRides = await prisma.bookings.count({
      where: {
        AND: [
          { Status: "Completed" },
          { DriverId: { in: driverIds } }
        ]
      }
    });

    // 5 most recent bookings by the owner's drivers
    const recentVehicles = await prisma.bookings.findMany({
      where: {
        VehicleId: { in: vehicleIds }
      },
      orderBy: {
        CreatedDateTime: 'desc' // change to 'updatedAt' or relevant timestamp if needed
      },
      include:{
        Vehicle:true
      },
      take: 5
    });

    // Send the collected data back
    res.status(200).json(responseObj(true,{
      myVehicles:vehicleIds.length,
      Name:owner?.Name,
      Image:ownnerImage,
      activeVehicles,
      completedRides,
      recentVehicles,
      isDocUploaded,
      isRegisterationDone,
      isVehicleAdded
    },"Successfully fetched"));

  } catch (error) {
    console.error("Error fetching owner details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export default getOwnerDetails;
