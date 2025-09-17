import express from "express";
import { Drivermiddleware } from "../../../middlewares/middleware";
import { getInvoiceByBookingId, getDriverInvoices, downloadInvoicePDF, downloadInvoicePDFById } from "../../../controllers/app/Driver/invoice";

const router = express.Router();

// Get invoice by booking ID
router.get("/booking/:bookingId", Drivermiddleware, getInvoiceByBookingId);

// Get driver's invoices with pagination
router.get("/", Drivermiddleware, getDriverInvoices);

// Download invoice PDF by booking ID
router.get("/booking/:bookingId/pdf", Drivermiddleware, downloadInvoicePDF);

// Download invoice PDF by invoice ID
router.get("/:invoiceId/pdf", Drivermiddleware, downloadInvoicePDFById);

export default router;
