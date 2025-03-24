// src/controllers/app/auth/signupController.ts
import { Request, Response } from 'express';
import { z } from 'zod';

// Zod validation schemas for name and phone number
const nameSchema = z.string().min(1, "Name is required").regex(/^[A-Za-z\s]+$/, "Name can only contain letters and spaces");

const phoneSchema = z.string()
  .min(10, "Phone number must be at least 10 digits")
  .regex(/^\+?[1-9]\d{1,14}$/, "Phone number must be valid (e.g., +1234567890)");

const signupSchema = z.object({
  name: nameSchema,
  phoneNumber: phoneSchema,
});

// Declaring the handleSignup function as a const
export const signup = async (req: Request, res: Response): Promise<any> => {
  const { name, phoneNumber } = req.body;

  try {
    // Validate the incoming data with Zod
    signupSchema.parse({ name, phoneNumber });

    // If validation passes, respond with a success message
    res.status(200).json({ message: "Signup successful!" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If validation fails, return the error details
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }
    // Handle other types of errors
    res.status(500).json({ message: "Internal server error" });
  }
};
