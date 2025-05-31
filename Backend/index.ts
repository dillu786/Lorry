// src/app.ts
import express from 'express';
import OwnerRoutes from './routes/app/Owner/index';
import DriverRoutes from "./routes/app/Driver/index"
import CustomerRoutes from "./routes/app/Cutomer/index"
import type { Request,Response } from 'express';
import http from "http"
import { Server, Socket } from "socket.io";
import type { DriverLocation, RideRequest } from "./types/Common/types";
import { haversineDistance } from "./utils/haversine";
import { getVehicleTypes } from './controllers/app/Owner/vehicle';
import { PrismaClient } from '@prisma/client';
import { VehicleType } from '@prisma/client';

const app = express();
const port = 3000;
const prisma = new PrismaClient();

const connectedDrivers = new Map<string, DriverLocation>();

export const socketHandler = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("Driver connected:", socket.id);

    // 1. Store location sent by driver
    socket.on("update_location", (location: DriverLocation) => {
      connectedDrivers.set(socket.id, location);
    });

    // 2. Remove driver on disconnect
    socket.on("disconnect", () => {
      connectedDrivers.delete(socket.id);
      console.log("Driver disconnected:", socket.id);
    });
  });
};

// 3. Emit to drivers within 20km of a pickup point
export const notifyNearbyDrivers = ( ride: RideRequest) => {
  for (const [socketId, location] of connectedDrivers.entries()) {
    const distance = haversineDistance(ride.pickupLat, ride.pickupLng, location.lat, location.lng);

    if (distance <= 20 || true) {
      io.to(socketId).emit("new_ride_request", {
        ...ride,
        distance,
      });
    }
  }
};

// Middleware to parse JSON requests
app.use(express.json());
app.get("/api",(req:Request, res:Response)=>{
    res.json({
       data: "Hello"
    }); 
});
// Mount the authentication routes
app.use('/api/app/Owner', OwnerRoutes);
app.use("/api/app/Driver", DriverRoutes);
app.use("/api/app/Customer",CustomerRoutes);
app.get("/api/app/vehicleTypes",getVehicleTypes);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST", "PATCH", "PUT", "OPTIONS", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  },
});

const drivers = new Map<string, { lat: number; lng: number }>(); // socketId -> { lat, lng }

io.on("connection", (socket:any) => {
  console.log("Driver connected", socket.id);

  socket.on("update_location", (data: { lat: number; lng: number }) => {
    // data = { lat: number, lng: number }
    drivers.set(socket.id, data);
    console.log("receivedd drivers location");
    console.log(drivers);
  });

  socket.on("disconnect", () => {
    drivers.delete(socket.id);
    console.log("Driver disconnected", socket.id);
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});


async function main() {
  const fares = [
    {
      VehicleType: VehicleType.CARGO_CAR,
      BaseFare: 60,
      CostPerKm: 12,
      CostPerMinute: 2,
      MinimumFare: 100,
      SurgeMultiplier: 1.0,
      Currency: 'INR',
      City: 'Kolkata',
      IsActive: true
    },
    {
      VehicleType: VehicleType.MINI_TRUCK,
      BaseFare: 80,
      CostPerKm: 15,
      CostPerMinute: 3,
      MinimumFare: 120,
      SurgeMultiplier: 1.2,
      Currency: 'INR',
      City: 'Kolkata',
      IsActive: true
    },
    {
      VehicleType: VehicleType.PICKUP_TRUCK,
      BaseFare: 100,
      CostPerKm: 18,
      CostPerMinute: 4,
      MinimumFare: 150,
      SurgeMultiplier: 1.0,
      Currency: 'INR',
      City: 'Kolkata',
      IsActive: true
    },
    {
      VehicleType: VehicleType.TANK_CAR,
      BaseFare: 150,
      CostPerKm: 22,
      CostPerMinute: 5,
      MinimumFare: 200,
      SurgeMultiplier: 1.5,
      Currency: 'INR',
      City: 'Kolkata',
      IsActive: true
    },
    {
      VehicleType: VehicleType.LCV,
      BaseFare: 200,
      CostPerKm: 25,
      CostPerMinute: 6,
      MinimumFare: 250,
      SurgeMultiplier: 1.0,
      Currency: 'INR',
      City: 'Kolkata',
      IsActive: true
    },
    {
      VehicleType: VehicleType.HCV,
      BaseFare: 250,
      CostPerKm: 30,
      CostPerMinute: 8,
      MinimumFare: 300,
      SurgeMultiplier: 1.3,
      Currency: 'INR',
      City: 'Kolkata',
      IsActive: true
    }
  ];

  for (const fare of fares) {
    await prisma.fare.create({ data: fare });
  }

  console.log('✅ Seeded fare data for Kolkata.');
}

// main()
//   .catch((e) => {
//     console.error('❌ Error seeding data:', e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });