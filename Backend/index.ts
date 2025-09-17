// src/app.ts
import express from 'express';
import OwnerRoutes from './routes/app/Owner/index';
import DriverRoutes from "./routes/app/Driver/index"
import CustomerRoutes from "./routes/app/Cutomer/index"
import type { Request,Response } from 'express';
import http from "http"
import cors from "cors"
import { Server, Socket } from "socket.io";
import type { DriverLocation, RideRequest } from "./types/Common/types";
import { haversineDistance } from "./utils/haversine";
import { getVehicleTypes } from './controllers/app/Owner/vehicle';
import { PrismaClient } from '@prisma/client';
import { VehicleType } from '@prisma/client';
import jwt from 'jsonwebtoken';

const app = express();
const port = 3000;
const prisma = new PrismaClient();

const connectedDrivers = new Map<string, DriverLocation>();
const connectedCustomers = new Map<string, string>();
const driverSocketMap = new Map<string, string>(); // Maps driverId to socketId
//const customerSocketMap = new Map<string, string>(); // Maps customerId to socketId

// JWT Authentication middleware for Socket.IO
const authenticateSocket = (socket: Socket, next: Function) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    // Try to verify as customer first
    try {
      const customerPayload = jwt.verify(token, process.env.JWT_SECRET_CUSTOMER as string) as any;
      socket.data.userType = 'customer';
      socket.data.userId = customerPayload.Id || customerPayload.user?.Id;
      socket.data.user = customerPayload.user || customerPayload;
      return next();
    } catch (customerError) {
      // If not customer, try driver
      try {
        const driverPayload = jwt.verify(token, process.env.JWT_SECRET_DRIVER as string) as any;
        socket.data.userType = 'driver';
        socket.data.userId = driverPayload.Id || driverPayload.user?.Id;
        socket.data.user = driverPayload.user || driverPayload;
        return next();
      } catch (driverError) {
        // If not driver, try owner
        try {
          const ownerPayload = jwt.verify(token, process.env.JWT_SECRET_OWNER as string) as any;
          socket.data.userType = 'owner';
          socket.data.userId = ownerPayload.Id || ownerPayload.user?.Id;
          socket.data.user = ownerPayload.user || ownerPayload;
          return next();
        } catch (ownerError) {
          return next(new Error('Authentication error: Invalid token'));
        }
      }
    }
  } catch (error) {
    return next(new Error('Authentication error: Token verification failed'));
  }
};

// 3. Emit to drivers within 20km of a pickup point
export const notifyNearbyDrivers = (ride: RideRequest) => {
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

// CORS configuration
const allowedOrigins = [
  
  "*"
  // Add your production domains here
  // 'https://yourdomain.com',
  // 'https://www.yourdomain.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
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
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true
  },
});

// Apply authentication middleware
io.use(authenticateSocket);

io.on("connection", (socket: Socket) => {
  console.log("Client connected:", socket.id);
  console.log("User type:", socket.data.userType);
  console.log("User ID:", socket.data.userId);

  // Automatically authenticate and map users based on JWT
  if (socket.data.userType === 'customer') {
    connectedCustomers.set(socket.data.userId.toString(), socket.id);
    console.log(`Customer ${socket.data.userId} authenticated with socket ${socket.id}`);
  } else if (socket.data.userType === 'driver') {
    driverSocketMap.set(socket.data.userId.toString(), socket.id);
    console.log(`Driver ${socket.data.userId} authenticated with socket ${socket.id}`);
  }

  // Store location sent by driver
  socket.on("update_location", (location: DriverLocation) => {
    if (socket.data.userType === 'driver') {
      connectedDrivers.set(socket.id, location);
      console.log("Received driver location:", location);
    } else {
      socket.emit("error", { message: "Only drivers can update location" });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    if (socket.data.userType === 'driver') {
      connectedDrivers.delete(socket.id);
      driverSocketMap.delete(socket.data.userId.toString());
      console.log(`Driver ${socket.data.userId} disconnected`);
    } else if (socket.data.userType === 'customer') {
      connectedCustomers.delete(socket.data.userId.toString());
      console.log(`Customer ${socket.data.userId} disconnected`);
    }
    
    console.log("Client disconnected:", socket.id);
  });
});


// Start the server
server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});




// Notify all clients about new negotiated fare
export const notifyNegotiatedFare = () => {
  io.emit("new_negotiated_fare", {
    message: "New negotiated fare",
  });
  console.log("New negotiated fare");
};

// Notify specific driver when customer starts negotiation
export const notifyDriverOfNegotiation = (driverId: string, bookingId: string) => {
  const socketId = driverSocketMap.get(driverId);
  if (socketId) {
    io.to(socketId).emit("customer_negotiation_started", {
      bookingId: bookingId,
      timestamp: new Date().toISOString()
    });
    console.log(`Driver ${driverId} notified of negotiation for booking ${bookingId}`);
  } else {
    console.log(`Driver ${driverId} is not connected to socket`);
  }
};

// Notify specific customer when driver accepts their ride
export const notifyCustomerOfAcceptedRide = (customerId: string, bookingId: string) => {
  const socketId = connectedCustomers.get(customerId);
  if (socketId) {
    io.to(socketId).emit("ride_accepted", {
      bookingId: bookingId,
      timestamp: new Date().toISOString()
    });
    console.log(`Customer ${customerId} notified of accepted ride for booking ${bookingId}`);
  } else {
    console.log(`Customer ${customerId} is not connected to socket`);
  }
};

// Notify specific customer when driver starts fare negotiation
export const notifyCustomerOfNegotiation = (customerId: string, bookingId: string, negotiatedFare: string) => {
  const socketId = connectedCustomers.get(customerId);
  if (socketId) {
    io.to(socketId).emit("driver_negotiation_started", {
      bookingId: bookingId,
      negotiatedFare: negotiatedFare,
      timestamp: new Date().toISOString()
    });
    console.log(`Customer ${customerId} notified of driver negotiation for booking ${bookingId}`);
  } else {
    console.log(`Customer ${customerId} is not connected to socket`);
  }
};

// Notify specific driver when customer accepts negotiated fare
export const notifyDriverOfAcceptedFare = (driverId: string, bookingId: string, acceptedFare: string) => {
  const socketId = driverSocketMap.get(driverId);
  if (socketId) {
    io.to(socketId).emit("customer_accepted_fare", {
      bookingId: bookingId,
      acceptedFare: acceptedFare,
      timestamp: new Date().toISOString()
    });
    console.log(`Driver ${driverId} notified of accepted fare for booking ${bookingId}`);
  } else {
    console.log(`Driver ${driverId} is not connected to socket`);
  }
};

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