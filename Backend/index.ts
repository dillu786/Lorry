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

const app = express();
const port = 3000;

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

    if (distance <= 20) {
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
app.use("/api/app/Customer",CustomerRoutes)

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST", "PATCH", "PUT", "OPTIONS", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

const drivers = new Map<string, { lat: number; lng: number }>(); // socketId -> { lat, lng }

io.on("connection", (socket:any) => {
  console.log("Driver connected", socket.id);

  socket.on("update_location", (data: { lat: number; lng: number }) => {
    // data = { lat: number, lng: number }
    drivers.set(socket.id, data);
  });

  socket.on("disconnect", () => {
    drivers.delete(socket.id);
    console.log("Driver disconnected", socket.id);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
