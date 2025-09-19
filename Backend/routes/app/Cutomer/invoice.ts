import express from "express";
import { CustomerMiddleware } from "../../../middlewares/middleware";
import { getInvoiceByBookingId, getCustomerInvoices, downloadInvoicePDF, downloadInvoicePDFById, autoDownloadInvoicePDF, autoDownloadInvoicePDFById, publicAutoDownloadInvoicePDF, publicAutoDownloadInvoicePDFById } from "../../../controllers/app/Driver/invoice";

const router = express.Router();

// Get invoice by booking ID
router.get("/booking/:bookingId", CustomerMiddleware, getInvoiceByBookingId);

// PUBLIC ROUTES - No authentication required (MUST BE FIRST to avoid conflicts)
// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Invoice routes are working!" });
});

// Debug route to check Prisma models
router.get("/debug", (req, res) => {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  
  const availableModels = Object.keys(prisma).filter(key => 
    typeof prisma[key] === 'object' && 
    prisma[key] !== null && 
    typeof prisma[key].findMany === 'function'
  );
  
  res.json({ 
    message: "Available Prisma models", 
    models: availableModels 
  });
});

// Public auto download invoice PDF by booking ID
router.get("/public/booking/:bookingId/auto-download", publicAutoDownloadInvoicePDF);

// Public auto download invoice PDF by invoice ID  
router.get("/public/:invoiceId/auto-download", publicAutoDownloadInvoicePDFById);

// PROTECTED ROUTES - Require authentication
// Get customer's invoices with pagination
router.get("/", CustomerMiddleware, getCustomerInvoices);

// Download invoice PDF by booking ID
router.get("/booking/:bookingId/pdf", CustomerMiddleware, downloadInvoicePDF);

// Download invoice PDF by invoice ID
router.get("/:invoiceId/pdf", CustomerMiddleware, downloadInvoicePDFById);

// Auto download invoice PDF by booking ID (enhanced version with automatic download)
router.get("/booking/:bookingId/auto-download", CustomerMiddleware, autoDownloadInvoicePDF);

// Auto download invoice PDF by invoice ID (enhanced version with automatic download)
router.get("/:invoiceId/auto-download", CustomerMiddleware, autoDownloadInvoicePDFById);

export default router;
