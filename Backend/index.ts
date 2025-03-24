// src/app.ts
import express from 'express';
import authRoutes from './routes/app/auth';
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

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
