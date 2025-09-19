import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { responseObj } from "../../../utils/response";
import { generateInvoicePDF, generateInvoicePDFDirect } from "../../../utils/pdfGenerator";

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
    // Check if invoice already exists using raw SQL
    const existingInvoices = await prisma.$queryRaw`
      SELECT * FROM "Invoice" WHERE "BookingId" = ${bookingId}
    `;
    
    const existingInvoice = Array.isArray(existingInvoices) ? existingInvoices[0] : existingInvoices;

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
    const tripDuration = calculateTripDuration(booking.StartTime, (booking as any).EndTime || new Date());

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();

    // Create invoice using raw SQL
    const invoice = await prisma.$queryRaw`
      INSERT INTO "Invoice" (
        "InvoiceNumber", "BookingId", "CustomerId", "CustomerName", "CustomerMobile", "CustomerEmail",
        "DriverId", "DriverName", "DriverMobile", "OwnerId", "OwnerName",
        "VehicleId", "VehicleModel", "VehicleNumber", "PickUpLocation", "DropLocation",
        "Product", "Distance", "Weight", "VehicleType", "FareAmount", "DriverFee",
        "ConvenienceFee", "GstAmount", "GrandTotal", "SubTotal", "Rounding", "PaymentMode",
        "BookingTime", "StartTime", "EndTime", "InvoiceDate", "TripDuration", "Notes"
      ) VALUES (
        ${invoiceNumber}, ${bookingId}, ${booking.User.Id}, ${booking.User.Name}, 
        ${booking.User.MobileNumber}, ${booking.User.Email}, ${booking.DriverId!}, 
        ${booking.Driver?.Name || "Unknown"}, ${booking.Driver?.MobileNumber || ""}, 
        ${ownerDetails?.Id || null}, ${ownerDetails?.Name || null}, ${booking.VehicleId || null}, 
        ${booking.Vehicle?.Model || null}, ${booking.Vehicle?.VehicleNumber || null}, 
        ${booking.PickUpLocation}, ${booking.DropLocation}, ${booking.Product}, 
        ${booking.Distance}, ${booking.Weight || null}, ${booking.VehicleType}, 
        ${fareBreakdown.fareAmount}, ${fareBreakdown.driverFee}, ${fareBreakdown.convenienceFee}, 
        ${fareBreakdown.gstAmount}, ${fareBreakdown.grandTotal}, ${fareBreakdown.subTotal}, 
        ${fareBreakdown.rounding}, ${booking.PaymentMode}, ${booking.BookingTime}, 
        ${booking.StartTime}, ${(booking as any).EndTime || new Date()}, ${new Date()}, 
        ${tripDuration}, ${`Trip completed successfully. Distance: ${booking.Distance} km`}
      ) RETURNING *
    `;

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

    // Use raw SQL query to get invoice data
    const invoices = await prisma.$queryRaw`
      SELECT * FROM "Invoice" 
      WHERE "BookingId" = ${parseInt(bookingId)}
    `;

    const invoice = Array.isArray(invoices) ? invoices[0] : invoices;

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

    // Use raw SQL for pagination
    const offset = (page - 1) * limit;
    
    const invoices = await prisma.$queryRaw`
      SELECT * FROM "Invoice" 
      WHERE "DriverId" = ${driverId}
      ORDER BY "InvoiceDate" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const totalCountResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Invoice" WHERE "DriverId" = ${driverId}
    `;
    
    const totalCount = Array.isArray(totalCountResult) ? totalCountResult[0].count : totalCountResult.count;

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

    // Use raw SQL for pagination
    const offset = (page - 1) * limit;
    
    const invoices = await prisma.$queryRaw`
      SELECT * FROM "Invoice" 
      WHERE "CustomerId" = ${customerId}
      ORDER BY "InvoiceDate" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const totalCountResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Invoice" WHERE "CustomerId" = ${customerId}
    `;
    
    const totalCount = Array.isArray(totalCountResult) ? totalCountResult[0].count : totalCountResult.count;

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

    // Use raw SQL query to get invoice data
    const invoices = await prisma.$queryRaw`
      SELECT * FROM "Invoice" 
      WHERE "BookingId" = ${parseInt(bookingId)}
    `;

    const invoice = Array.isArray(invoices) ? invoices[0] : invoices;

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

    // Use raw SQL query to get invoice data
    const invoices = await prisma.$queryRaw`
      SELECT * FROM "Invoice" 
      WHERE "Id" = ${parseInt(invoiceId)}
    `;

    const invoice = Array.isArray(invoices) ? invoices[0] : invoices;

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

// Auto download invoice as PDF by booking ID (enhanced version)
export const autoDownloadInvoicePDF = async (req: Request, res: Response): Promise<any> => {
  try {
    const { bookingId } = req.params;
    
    if (!bookingId) {
      return res.status(400).json(responseObj(false, null, "Booking ID is required"));
    }

    // Use raw SQL query to get invoice data
    const invoices = await prisma.$queryRaw`
      SELECT * FROM "Invoice" 
      WHERE "BookingId" = ${parseInt(bookingId)}
    `;

    const invoice = Array.isArray(invoices) ? invoices[0] : invoices;

    if (!invoice) {
      return res.status(404).json(responseObj(false, null, "Invoice not found"));
    }

    // Use the direct PDF generation for automatic download
    generateInvoicePDFDirect(invoice, res);
  } catch (error: any) {
    console.error("Error auto downloading invoice PDF:", error);
    return res.status(500).json(responseObj(false, null, "Something went wrong: " + error.message));
  }
};

// Auto download invoice as PDF by invoice ID (enhanced version)
export const autoDownloadInvoicePDFById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { invoiceId } = req.params;
    
    if (!invoiceId) {
      return res.status(400).json(responseObj(false, null, "Invoice ID is required"));
    }

    // Use raw SQL query to get invoice data
    const invoices = await prisma.$queryRaw`
      SELECT * FROM "Invoice" 
      WHERE "Id" = ${parseInt(invoiceId)}
    `;

    const invoice = Array.isArray(invoices) ? invoices[0] : invoices;

    if (!invoice) {
      return res.status(404).json(responseObj(false, null, "Invoice not found"));
    }

    // Use the direct PDF generation for automatic download
    generateInvoicePDFDirect(invoice, res);
  } catch (error: any) {
    console.error("Error auto downloading invoice PDF:", error);
    return res.status(500).json(responseObj(false, null, "Something went wrong: " + error.message));
  }
};

// PUBLIC Auto download invoice as PDF by booking ID (NO AUTHENTICATION REQUIRED)
export const publicAutoDownloadInvoicePDF = async (req: Request, res: Response): Promise<any> => {
  try {
    const { bookingId } = req.params;
    
    if (!bookingId) {
      return res.status(400).json(responseObj(false, null, "Booking ID is required"));
    }

    // Use raw SQL query to get invoice data
    const invoices = await prisma.$queryRaw`
      SELECT * FROM "Invoice" 
      WHERE "BookingId" = ${parseInt(bookingId)}
    `;

    const invoice = Array.isArray(invoices) ? invoices[0] : invoices;

    if (!invoice) {
      return res.status(404).json(responseObj(false, null, "Invoice not found"));
    }

    // Use the direct PDF generation for automatic download
    generateInvoicePDFDirect(invoice, res);
  } catch (error: any) {
    console.error("Error auto downloading invoice PDF:", error);
    return res.status(500).json(responseObj(false, null, "Something went wrong: " + error.message));
  }
};

// PUBLIC Auto download invoice as PDF by invoice ID (NO AUTHENTICATION REQUIRED)
export const publicAutoDownloadInvoicePDFById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { invoiceId } = req.params;
    
    if (!invoiceId) {
      return res.status(400).json(responseObj(false, null, "Invoice ID is required"));
    }

    // Use raw SQL query to get invoice data
    const invoices = await prisma.$queryRaw`
      SELECT * FROM "Invoice" 
      WHERE "Id" = ${parseInt(invoiceId)}
    `;

    const invoice = Array.isArray(invoices) ? invoices[0] : invoices;

    if (!invoice) {
      return res.status(404).json(responseObj(false, null, "Invoice not found"));
    }

    // Use the direct PDF generation for automatic download
    generateInvoicePDFDirect(invoice, res);
  } catch (error: any) {
    console.error("Error auto downloading invoice PDF:", error);
    return res.status(500).json(responseObj(false, null, "Something went wrong: " + error.message));
  }
};