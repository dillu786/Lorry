import express from "express";
import { Drivermiddleware } from "../../../middlewares/middleware";
import { getInvoiceByBookingId, getDriverInvoices, downloadInvoicePDF, downloadInvoicePDFById, autoDownloadInvoicePDF, autoDownloadInvoicePDFById, publicAutoDownloadInvoicePDF, publicAutoDownloadInvoicePDFById } from "../../../controllers/app/Driver/invoice";

const router = express.Router();

// Get invoice by booking ID
router.get("/booking/:bookingId", Drivermiddleware, getInvoiceByBookingId);

// Get driver's invoices with pagination
router.get("/", Drivermiddleware, getDriverInvoices);

// Download invoice PDF by booking ID
router.get("/booking/:bookingId/pdf", Drivermiddleware, downloadInvoicePDF);

// Download invoice PDF by invoice ID
router.get("/:invoiceId/pdf", Drivermiddleware, downloadInvoicePDFById);

// Auto download invoice PDF by booking ID (enhanced version with automatic download)
router.get("/booking/:bookingId/auto-download", Drivermiddleware, autoDownloadInvoicePDF);

// Auto download invoice PDF by invoice ID (enhanced version with automatic download)
router.get("/:invoiceId/auto-download", Drivermiddleware, autoDownloadInvoicePDFById);

// PUBLIC ROUTES - No authentication required
// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Driver Invoice routes are working!" });
});

// Public auto download invoice PDF by booking ID
router.get("/public/booking/:bookingId/auto-download", publicAutoDownloadInvoicePDF);

// Public auto download invoice PDF by invoice ID  
router.get("/public/:invoiceId/auto-download", publicAutoDownloadInvoicePDFById);

export default router;
