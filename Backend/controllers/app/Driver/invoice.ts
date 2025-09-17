import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { responseObj } from "../../../utils/response";
import { generateInvoicePDF } from "../../../utils/pdfGenerator";

const prisma = new PrismaClient();

// Generate unique invoice number
const generateInvoiceNumber = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${timestamp}-${random}`;
};

// Calculate fare breakdown with convenience fee and GST
const calculateFareBreakdown = (totalFare: string) => {
  // Step 1: Get the original fare amount
  const fareAmount = parseFloat(totalFare || '0');

  // Step 2: Calculate convenience fee (5% of fare)
  const convenienceFee = parseFloat((fareAmount * 0.05).toFixed(2));

  // Step 3: Calculate GST on convenience fee (18%)
  const gstAmount = parseFloat((convenienceFee * 0.18).toFixed(2));

  // Step 4: Calculate driver fee as remaining amount
  const driverFee = parseFloat((fareAmount - convenienceFee - gstAmount).toFixed(2));

  // Step 5: Calculate grand total to ensure it's equal to fareAmount
  const grandTotal = (driverFee + convenienceFee + gstAmount).toFixed(2);

  // Step 6 (Optional): For display, compute subTotal and rounding if needed
  const subTotal = (driverFee + convenienceFee + gstAmount).toFixed(2);
  const rounding = (fareAmount - parseFloat(subTotal)).toFixed(2); // Should be '0.00' if logic is correct
  
  return {
    fareAmount,
    driverFee,
    convenienceFee,
    gstAmount,
    grandTotal: parseFloat(grandTotal),
    subTotal: parseFloat(subTotal),
    rounding: parseFloat(rounding)
  };
};

// Calculate trip duration in minutes
const calculateTripDuration = (startTime: Date, endTime: Date): number => {
  const durationMs = endTime.getTime() - startTime.getTime();
  return Math.round(durationMs / (1000 * 60)); // Convert to minutes
};

// Generate invoice for completed booking
export const generateInvoice = async (bookingId: number): Promise<any> => {
  try {
    // Check if invoice already exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { BookingId: bookingId }
    });

    if (existingInvoice) {
      return { success: false, message: "Invoice already exists for this booking" };
    }

    // Get booking with all related data
    const booking = await prisma.bookings.findUnique({
      where: { Id: bookingId },
      include: {
        User: {
          select: {
            Id: true,
            Name: true,
            MobileNumber: true,
            Email: true
          }
        },
        Driver: {
          select: {
            Id: true,
            Name: true,
            MobileNumber: true
          }
        },
        Vehicle: {
          select: {
            Id: true,
            Model: true,
            VehicleNumber: true
          }
        }
      }
    });

    if (!booking) {
      return { success: false, message: "Booking not found" };
    }

    if (booking.Status !== "Completed") {
      return { success: false, message: "Invoice can only be generated for completed bookings" };
    }

    // Get owner details if driver has an owner
    let ownerDetails = null;
    if (booking.DriverId) {
      const ownerDriver = await prisma.ownerDriver.findFirst({
        where: { DriverId: booking.DriverId },
        include: {
          Owner: {
            select: {
              Id: true,
              Name: true
            }
          }
        }
      });
      ownerDetails = ownerDriver?.Owner;
    }

        // Calculate fare breakdown
        const fareBreakdown = calculateFareBreakdown(booking.Fare);

    // Calculate trip duration
    const tripDuration = calculateTripDuration(booking.StartTime, booking.EndTime || new Date());

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        InvoiceNumber: invoiceNumber,
        BookingId: bookingId,
        
        // Customer Details
        CustomerId: booking.User.Id,
        CustomerName: booking.User.Name,
        CustomerMobile: booking.User.MobileNumber,
        CustomerEmail: booking.User.Email,
        
        // Driver Details
        DriverId: booking.DriverId!,
        DriverName: booking.Driver?.Name || "Unknown",
        DriverMobile: booking.Driver?.MobileNumber || "",
        
        // Owner Details
        OwnerId: ownerDetails?.Id,
        OwnerName: ownerDetails?.Name,
        
        // Vehicle Details
        VehicleId: booking.VehicleId,
        VehicleModel: booking.Vehicle?.Model,
        VehicleNumber: booking.Vehicle?.VehicleNumber,
        
        // Trip Details
        PickUpLocation: booking.PickUpLocation,
        DropLocation: booking.DropLocation,
        Product: booking.Product,
        Distance: booking.Distance,
        Weight: booking.Weight,
        VehicleType: booking.VehicleType,
        
        // Fare Details
        FareAmount: fareBreakdown.fareAmount,
        DriverFee: fareBreakdown.driverFee,
        ConvenienceFee: fareBreakdown.convenienceFee,
        GstAmount: fareBreakdown.gstAmount,
        GrandTotal: fareBreakdown.grandTotal,
        SubTotal: fareBreakdown.subTotal,
        Rounding: fareBreakdown.rounding,
        PaymentMode: booking.PaymentMode,
        
        // Timestamps
        BookingTime: booking.BookingTime,
        StartTime: booking.StartTime,
        EndTime: booking.EndTime || new Date(),
        InvoiceDate: new Date(),
        
        // Additional Info
        TripDuration: tripDuration,
        Notes: `Trip completed successfully. Distance: ${booking.Distance} km`
      }
    });

    return { success: true, data: invoice, message: "Invoice generated successfully" };
  } catch (error: any) {
    console.error("Error generating invoice:", error);
    return { success: false, message: "Failed to generate invoice: " + error.message };
  }
};

// Get invoice by booking ID
export const getInvoiceByBookingId = async (req: Request, res: Response): Promise<any> => {
  try {
    const { bookingId } = req.params;
    
    if (!bookingId) {
      return res.status(400).json(responseObj(false, null, "Booking ID is required"));
    }

    const invoice = await prisma.invoice.findUnique({
      where: { BookingId: parseInt(bookingId) },
      include: {
        Booking: {
          select: {
            Id: true,
            Status: true,
            ProductImage: true
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json(responseObj(false, null, "Invoice not found"));
    }

    return res.status(200).json(responseObj(true, invoice, "Invoice retrieved successfully"));
  } catch (error: any) {
    console.error("Error fetching invoice:", error);
    return res.status(500).json(responseObj(false, null, "Something went wrong: " + error.message));
  }
};

// Get driver's invoices
export const getDriverInvoices = async (req: Request, res: Response): Promise<any> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const driverId = req.user.Id;

    const invoices = await prisma.invoice.findMany({
      where: { DriverId: driverId },
      orderBy: { InvoiceDate: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        Booking: {
          select: {
            Id: true,
            Status: true,
            ProductImage: true
          }
        }
      }
    });

    const totalCount = await prisma.invoice.count({
      where: { DriverId: driverId }
    });

    return res.status(200).json(responseObj(true, {
      invoices,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    }, "Driver invoices retrieved successfully"));
  } catch (error: any) {
    console.error("Error fetching driver invoices:", error);
    return res.status(500).json(responseObj(false, null, "Something went wrong: " + error.message));
  }
};

// Get customer's invoices
export const getCustomerInvoices = async (req: Request, res: Response): Promise<any> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const customerId = req.user.Id;

    const invoices = await prisma.invoice.findMany({
      where: { CustomerId: customerId },
      orderBy: { InvoiceDate: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        Booking: {
          select: {
            Id: true,
            Status: true,
            ProductImage: true
          }
        }
      }
    });

    const totalCount = await prisma.invoice.count({
      where: { CustomerId: customerId }
    });

    return res.status(200).json(responseObj(true, {
      invoices,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    }, "Customer invoices retrieved successfully"));
  } catch (error: any) {
    console.error("Error fetching customer invoices:", error);
    return res.status(500).json(responseObj(false, null, "Something went wrong: " + error.message));
  }
};

// Download invoice as PDF by booking ID
export const downloadInvoicePDF = async (req: Request, res: Response): Promise<any> => {
  try {
    const { bookingId } = req.params;
    
    if (!bookingId) {
      return res.status(400).json(responseObj(false, null, "Booking ID is required"));
    }

    const invoice = await prisma.invoice.findUnique({
      where: { BookingId: parseInt(bookingId) },
      include: {
        Booking: {
          select: {
            Id: true,
            Status: true,
            ProductImage: true
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json(responseObj(false, null, "Invoice not found"));
    }

    // Generate and send PDF
    generateInvoicePDF(invoice, res);
  } catch (error: any) {
    console.error("Error downloading invoice PDF:", error);
    return res.status(500).json(responseObj(false, null, "Something went wrong: " + error.message));
  }
};

// Download invoice as PDF by invoice ID
export const downloadInvoicePDFById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { invoiceId } = req.params;
    
    if (!invoiceId) {
      return res.status(400).json(responseObj(false, null, "Invoice ID is required"));
    }

    const invoice = await prisma.invoice.findUnique({
      where: { Id: parseInt(invoiceId) },
      include: {
        Booking: {
          select: {
            Id: true,
            Status: true,
            ProductImage: true
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json(responseObj(false, null, "Invoice not found"));
    }

    // Generate and send PDF
    generateInvoicePDF(invoice, res);
  } catch (error: any) {
    console.error("Error downloading invoice PDF:", error);
    return res.status(500).json(responseObj(false, null, "Something went wrong: " + error.message));
  }
};
