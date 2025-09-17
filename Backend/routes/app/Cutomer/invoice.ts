import express from "express";
import { CustomerMiddleware } from "../../../middlewares/middleware";
import { getInvoiceByBookingId, getCustomerInvoices, downloadInvoicePDF, downloadInvoicePDFById } from "../../../controllers/app/Driver/invoice";

const router = express.Router();

// Get invoice by booking ID
router.get("/booking/:bookingId", CustomerMiddleware, getInvoiceByBookingId);

// Get customer's invoices with pagination
router.get("/", CustomerMiddleware, getCustomerInvoices);

// Download invoice PDF by booking ID
router.get("/booking/:bookingId/pdf", CustomerMiddleware, downloadInvoicePDF);

// Download invoice PDF by invoice ID
router.get("/:invoiceId/pdf", CustomerMiddleware, downloadInvoicePDFById);

export default router;
