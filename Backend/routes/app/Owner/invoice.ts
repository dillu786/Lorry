import express from "express";
import { OwnerMiddleware } from "../../../middlewares/middleware";
import { getInvoiceByBookingId, getDriverInvoices, downloadInvoicePDF, downloadInvoicePDFById, autoDownloadInvoicePDF, autoDownloadInvoicePDFById, publicAutoDownloadInvoicePDF, publicAutoDownloadInvoicePDFById } from "../../../controllers/app/Driver/invoice";

const router = express.Router();

// PUBLIC ROUTES - No authentication required (MUST BE FIRST to avoid conflicts)
// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Owner Invoice routes are working!" });
});

// Public auto download invoice PDF by booking ID
router.get("/public/booking/:bookingId/auto-download", publicAutoDownloadInvoicePDF);

// Public auto download invoice PDF by invoice ID  
router.get("/public/:invoiceId/auto-download", publicAutoDownloadInvoicePDFById);

// PROTECTED ROUTES - Require authentication
// Get invoice by booking ID
router.get("/booking/:bookingId", OwnerMiddleware, getInvoiceByBookingId);

// Get invoices with pagination (for owner's drivers)
router.get("/", OwnerMiddleware, getDriverInvoices);

// Download invoice PDF by booking ID
router.get("/booking/:bookingId/pdf", OwnerMiddleware, downloadInvoicePDF);

// Download invoice PDF by invoice ID
router.get("/:invoiceId/pdf", OwnerMiddleware, downloadInvoicePDFById);

// Auto download invoice PDF by booking ID (enhanced version with automatic download)
router.get("/booking/:bookingId/auto-download", OwnerMiddleware, autoDownloadInvoicePDF);

// Auto download invoice PDF by invoice ID (enhanced version with automatic download)
router.get("/:invoiceId/auto-download", OwnerMiddleware, autoDownloadInvoicePDFById);

export default router;
