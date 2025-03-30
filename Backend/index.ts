// src/app.ts
import express from 'express';
import authRoutes from './routes/app/Owner/auth';
import vehiRoutes from "./routes/app/Owner/vehicleRoutes"
import driverRoutes from "./routes/app/Owner/driver"
import type { Request,Response } from 'express';
const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(express.json());
app.get("/api",(req:Request, res:Response)=>{
    res.json({
       data: "Hello"
    }); 
});
// Mount the authentication routes
app.use('/api/app', authRoutes);
app.use("/api/app", vehiRoutes);
app.use("/api/app",driverRoutes)

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
