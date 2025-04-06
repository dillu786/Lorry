// src/app.ts
import express from 'express';
import OwnerRoutes from './routes/app/Owner/index';
import DriverRoutes from "./routes/app/Driver/index"
import CustomerRoutes from "./routes/app/Cutomer/index"
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
app.use('/api/app/Owner', OwnerRoutes);
app.use("/api/app/Driver", DriverRoutes);
app.use("/api/app/Customer",CustomerRoutes)


// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
