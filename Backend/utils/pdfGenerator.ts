import type { Response } from "express";
import puppeteer, { Browser } from "puppeteer";
import PDFDocument from "pdfkit";

/**
 * Represents the data structure for an invoice.
 * All monetary values should be in the smallest currency unit (e.g., cents, paise)
 * or handled carefully as floating-point numbers. For this example, we assume numbers.
 */
export interface InvoiceData {
  InvoiceNumber: string;
  BookingId?: string;
  CustomerName: string;
  CustomerMobile: string;
  CustomerEmail?: string;
  DriverName: string;
  DriverMobile: string;
  OwnerName?: string;
  PickUpLocation: string;
  DropLocation: string;
  Product?: string;
  Distance: number;
  VehicleType: string;
  TripDuration?: number; // In minutes or hours
  DriverFee: number;
  ConvenienceFee: number;
  GstAmount: number;
  GrandTotal: number;
}

/**
 * Helper function to format currency as "Rs X,XXX.XX" using Indian numbering system (lakhs/crores).
 * This ensures consistency across both PDFKit and HTML outputs, and meets the user request for "Rs".
 * @param amount - The monetary value.
 * @returns A formatted currency string.
 */
const formatRupees = (amount: number): string => {
  // Use Intl.NumberFormat for proper Indian numbering system (commas) and ensuring 2 decimal places.
  const formattedNumber = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  // Prepend "Rs " to meet the specific user request.
  return `Rs ${formattedNumber}`;
};

/**
 * Generates a URL-safe filename for the invoice PDF.
 * @param invoice - The invoice data object.
 * @param filename - An optional preferred filename.
 * @returns A sanitized PDF filename.
 */
const getSafeFilename = (invoice: InvoiceData, filename?: string): string => {
  const rawName =
    filename ||
    `invoice-${invoice.InvoiceNumber || invoice.BookingId || "download"}`;
  // Replace invalid characters with an underscore and ensure it ends with .pdf
  return rawName.replace(/[^a-zA-Z0-9-_.]/g, "_") + ".pdf";
};

/**
 * Sets the necessary HTTP headers for a PDF file response.
 * @param res - The Express response object.
 * @param filename - The name for the downloaded file.
 * @param length - The optional content length of the PDF buffer.
 */
const setPDFHeaders = (res: Response, filename: string, length?: number) => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  if (length) {
    res.setHeader("Content-Length", length.toString());
  }
};

/**
 * Generates and sends a mobile-optimized HTML preview of the invoice.
 * @param invoiceData - The data for the invoice.
 * @param res - The Express response object.
 */
export const generateInvoicePDF = (invoiceData: InvoiceData, res: Response) => {
  try {
    const html = generateMobileOptimizedHTML(invoiceData);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    console.error("Error generating HTML invoice preview:", error);
    res.status(500).json({ error: "Failed to generate invoice HTML" });
  }
};

/**
 * The primary endpoint to generate and stream an invoice PDF.
 * It attempts to use Puppeteer for high-fidelity rendering and falls back to PDFKit on failure.
 * @param invoiceData - The data for the invoice.
 * @param res - The Express response object.
 */
export const generateInvoicePDFDirect = async (
  invoiceData: InvoiceData,
  res: Response
) => {
  try {
    await generateInvoicePuppeteerAttachment(invoiceData, res);
  } catch (error) {
    // Note: In a real environment, you might inspect the error to decide if fallback is appropriate
    console.warn("Puppeteer PDF generation failed. Falling back to PDFKit.", error);
    generateInvoicePDFAttachment(invoiceData, res);
  }
};

/**
 * Generates an invoice PDF using PDFKit as a fallback.
 * This method is less visually rich but highly reliable and dependency-light.
 * @param invoiceData - The data for the invoice.
 * @param res - The Express response object.
 * @param filename - Optional custom filename.
 */
export const generateInvoicePDFAttachment = (
  invoiceData: InvoiceData,
  res: Response,
  filename?: string
) => {
  try {
    const safeFilename = getSafeFilename(invoiceData, filename);
    setPDFHeaders(res, safeFilename);

    // Note: The A4 content area is from x=50 to x=550 (612 total width - 2*50 margin)
    const rightEdge = 550; 
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    // --- Helper Functions for PDFKit ---
    const drawHeader = () => {
        // Placeholder for a logo, or use text
        doc.fontSize(24).fillColor('#4f46e5').font('Helvetica-Bold').text('ReturnLorry', 50, 50);
        doc.fontSize(10).fillColor('#6b7280').font('Helvetica').text('Your Trusted Logistics Partner', 50, 75);
        
        doc.fontSize(16).fillColor('#111827').font('Helvetica-Bold').text('INVOICE', rightEdge, 65, { align: 'right' });
        doc.moveDown();
    };

    const drawInvoiceInfo = () => {
        const infoTop = 120;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Invoice Number:', 50, infoTop);
        doc.text('Invoice Date:', 50, infoTop + 15);
        doc.text('Booking ID:', 50, infoTop + 30);

        doc.font('Helvetica');
        // Ensure values are aligned properly below the labels
        doc.text(invoiceData.InvoiceNumber, 150, infoTop);
        doc.text(new Date().toLocaleDateString('en-IN'), 150, infoTop + 15);
        doc.text(invoiceData.BookingId || 'N/A', 150, infoTop + 30);
    };

    const drawPartyDetails = () => {
        const partyTop = 200;
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#6b7280');
        doc.text('BILLED TO', 50, partyTop);
        doc.text('DRIVER DETAILS', 300, partyTop);

        doc.strokeColor('#e5e7eb').moveTo(50, partyTop + 15).lineTo(rightEdge, partyTop + 15).stroke();
        
        doc.font('Helvetica-Bold').fillColor('#111827').text(invoiceData.CustomerName, 50, partyTop + 25);
        doc.font('Helvetica').fillColor('#374151').text(invoiceData.CustomerMobile, 50, partyTop + 40);

        doc.font('Helvetica-Bold').fillColor('#111827').text(invoiceData.DriverName, 300, partyTop + 25);
        doc.font('Helvetica').fillColor('#374151').text(invoiceData.DriverMobile, 300, partyTop + 40);
    };
    
    /**
     * Refactored drawTripInfo to use 4 separate lines to prevent horizontal text overlap
     * for long address strings in PDFKit.
     */
    const drawTripInfo = () => {
        const tripTop = 280;
        let y = tripTop;
        
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#6b7280').text('TRIP INFORMATION', 50, y);
        y += 15;
        doc.strokeColor('#e5e7eb').moveTo(50, y).lineTo(rightEdge, y).stroke();
        y += 10;

        doc.font('Helvetica').fillColor('#374151');
        
        // Line 1: From Location (full width)
        doc.text(`From: ${invoiceData.PickUpLocation}`, 50, y, { width: rightEdge - 50 });
        y += 20;
        
        // Line 2: To Location (full width)
        doc.text(`To: ${invoiceData.DropLocation}`, 50, y, { width: rightEdge - 50 }); 
        y += 20;
        
        // Line 3: Distance
        doc.text(`Distance: ${invoiceData.Distance} km`, 50, y);
        y += 20;
        
        // Line 4: Vehicle Type
        doc.text(`Vehicle: ${invoiceData.VehicleType}`, 50, y); 
        // No y update needed here as it's the last item
    };

    /**
     * Corrected function: Uses the new formatRupees helper and correct alignment.
     */
    const drawFareTable = () => {
        const tableTop = 380; // Adjusted table position due to extra lines in Trip Info
        
        // Table Header
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#6b7280');
        doc.text('DESCRIPTION', 50, tableTop);
        doc.text('AMOUNT', rightEdge, tableTop, { align: 'right' }); 
        doc.strokeColor('#e5e7eb').moveTo(50, tableTop + 15).lineTo(rightEdge, tableTop + 15).stroke();

        // Table Rows
        const items = [
            { label: 'Driver Fee', value: invoiceData.DriverFee },
            { label: 'Convenience Fee', value: invoiceData.ConvenienceFee },
            { label: 'GST', value: invoiceData.GstAmount },
        ];
        let y = tableTop + 25;
        items.forEach(item => {
            doc.fontSize(10).font('Helvetica').fillColor('#111827');
            doc.text(item.label, 50, y);
            // Use formatRupees for currency formatting
            doc.text(formatRupees(item.value), rightEdge, y, { align: 'right' }); 
            y += 20;
        });

        // Total
        // Line spanning the total section
        doc.strokeColor('#e5e7eb').moveTo(350, y + 10).lineTo(rightEdge, y + 10).stroke(); 
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Grand Total', 350, y + 20);
        // Use formatRupees for currency formatting
        doc.text(formatRupees(invoiceData.GrandTotal), rightEdge, y + 20, { align: 'right' }); 
    };

    const drawFooter = () => {
        doc.fontSize(9).fillColor('#6b7280').text(
            'Thank you for choosing ReturnLorry! For any queries, please contact support@returnlorry.com.',
            50, 750, { align: 'center', width: 500 } // Width 500 centers it between 50 and 550
        );
    };
    
    // --- Document Assembly ---
    drawHeader();
    drawInvoiceInfo();
    drawPartyDetails();
    drawTripInfo();
    drawFareTable();
    drawFooter();

    doc.end();
  } catch (error) {
    console.error("Error generating PDF with PDFKit:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  }
};

/**
 * Generates an invoice PDF using Puppeteer for high-fidelity HTML-to-PDF conversion.
 * @param invoiceData - The data for the invoice.
 * @param res - The Express response object.
 * @param filename - Optional custom filename.
 * @throws An error if Puppeteer fails to launch or generate the PDF.
 */
export const generateInvoicePuppeteerAttachment = async (
  invoiceData: InvoiceData,
  res: Response,
  filename?: string
) => {
  const safeFilename = getSafeFilename(invoiceData, filename);
  let browser: Browser | null = null;

  try {
    const html = generateMobileOptimizedHTML(invoiceData);
    
    // Note: Puppeteer setup often needs customization for deployment environments.
    // Assuming a standard setup for local testing or controlled environment.
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
    });

    const page = await browser.newPage();
    // A standard A4 paper is roughly 8.27 x 11.69 inches.
    await page.setViewport({ width: 794, height: 1122 });
    await page.setContent(html, { waitUntil: "networkidle0" });
    
    // Ensure fonts are fully loaded
    await page.evaluateHandle("document.fonts.ready");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0.4in",
        right: "0.4in",
        bottom: "0.4in",
        left: "0.4in",
      },
    });

    setPDFHeaders(res, safeFilename, pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF with Puppeteer:", error);
    throw error; // Propagate error to be caught by the calling function for fallback
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

/**
 * Generates a modern, professional, and mobile-responsive HTML string for an invoice.
 * @param invoice - The invoice data.
 * @returns An HTML string.
 */
const generateMobileOptimizedHTML = (invoice: InvoiceData): string => {
  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Invoice ${invoice.InvoiceNumber}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        :root {
          --brand-color: #4f46e5;
          --text-primary: #111827;
          --text-secondary: #374151;
          --text-light: #6b7280;
          --border-color: #e5e7eb;
          --background-light: #f9fafb;
          --background-white: #ffffff;
        }
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 0;
          background-color: var(--background-light);
          color: var(--text-primary);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .invoice-container {
          max-width: 800px;
          margin: 24px auto;
          padding: 24px;
          background-color: var(--background-white);
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }
        /* Header */
        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--border-color);
        }
        .company-logo svg { height: 40px; }
        .invoice-title { text-align: right; }
        .invoice-title h1 {
          font-size: 2.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .invoice-title p {
          font-size: 0.875rem;
          color: var(--text-light);
          margin: 4px 0 0;
        }
        /* Details Section */
        .invoice-details {
          display: flex;
          justify-content: space-between;
          padding: 24px 0;
        }
        .detail-group { line-height: 1.6; }
        .detail-group h3 {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-light);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 8px;
        }
        .detail-group p { margin: 0; font-size: 0.875rem; }
        .detail-group .name { font-weight: 600; color: var(--text-primary); }

        /* Fare Table */
        .fare-table { width: 100%; border-collapse: collapse; }
        .fare-table thead th {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-light);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }
        .fare-table tbody td {
          padding: 12px;
          font-size: 0.875rem;
          border-bottom: 1px solid var(--border-color);
        }
        .fare-table th:last-child, .fare-table td:last-child { text-align: right; }
        
        /* Totals section */
        .invoice-summary {
          display: flex;
          justify-content: flex-end;
          margin-top: 24px;
        }
        /* INCREASED WIDTH from 40% to 50% for better alignment */
        .summary-box { width: 50%; max-width: 300px; } 
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 0.875rem;
        }
        .summary-row.grand-total {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--brand-color);
          border-top: 2px solid var(--border-color);
          margin-top: 8px;
          padding-top: 12px;
        }
        .summary-label { color: var(--text-secondary); }
        .summary-value { font-weight: 500; }

        /* Footer */
        .invoice-footer {
          text-align: center;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid var(--border-color);
          font-size: 0.875rem;
          color: var(--text-light);
        }
        @media (max-width: 640px) {
          .invoice-container { padding: 16px; margin: 16px; }
          .invoice-header, .invoice-details { flex-direction: column; gap: 20px; }
          .invoice-title { text-align: left; }
          .invoice-summary { justify-content: center; }
          .summary-box { width: 100%; max-width: none; }
        }

        /* Specific styles for PDF rendering to ensure A4 compliance */
        @media print {
            body {
                background-color: #fff !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            .invoice-container {
                box-shadow: none !important;
                border-radius: 0 !important;
                max-width: none !important;
                margin: 0 !important;
            }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <header class="invoice-header">
          <div class="company-logo">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 48px; height: 48px; color: var(--brand-color);">
               <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A1.125 1.125 0 0 1 3.375 9h1.5a3.375 3.375 0 0 0 3.375-3.375V3.75" />
             </svg>
             <p style="margin-top: 8px; font-weight: 600; font-size: 1.125rem; color: var(--text-primary);">ReturnLorry</p>
          </div>
          <div class="invoice-title">
            <h1>INVOICE</h1>
            <p>#${invoice.InvoiceNumber}</p>
          </div>
        </header>

        <section class="invoice-details">
          <div class="detail-group">
            <h3>BILLED TO</h3>
            <p class="name">${invoice.CustomerName}</p>
            <p>${invoice.CustomerMobile}</p>
            ${invoice.CustomerEmail ? `<p>${invoice.CustomerEmail}</p>` : ''}
          </div>
          <div class="detail-group">
            <h3>DRIVER DETAILS</h3>
            <p class="name">${invoice.DriverName}</p>
            <p>${invoice.DriverMobile}</p>
          </div>
          <div class="detail-group">
            <h3>DETAILS</h3>
            <p><span class="label">Invoice Date:</span> ${currentDate}</p>
            <p><span class="label">Booking ID:</span> ${invoice.BookingId || 'N/A'}</p>
          </div>
        </section>

        <!-- TRIP INFORMATION - Refactored to prevent horizontal overlap -->
        <section class="trip-details" style="padding: 24px 0;">
              <h3 style="font-size: 0.75rem; font-weight: 600; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px;">TRIP INFORMATION</h3>
              <p style="margin: 4px 0; font-size: 0.875rem;"><span style="font-weight: 500;">From:</span> ${invoice.PickUpLocation}</p>
              <p style="margin: 4px 0; font-size: 0.875rem;"><span style="font-weight: 500;">To:</span> ${invoice.DropLocation}</p>
              <!-- Distance and Vehicle moved to separate lines below the addresses -->
              <p style="margin: 12px 0 4px; font-size: 0.875rem;"><span style="font-weight: 500;">Distance:</span> ${invoice.Distance} km</p>
              <p style="margin: 4px 0; font-size: 0.875rem;"><span style="font-weight: 500;">Vehicle:</span> ${invoice.VehicleType}</p>
        </section>
        
        <table class="fare-table">
          <thead>
            <tr>
              <th>DESCRIPTION</th>
              <th>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Driver Fee</td>
              <td>${formatRupees(invoice.DriverFee)}</td>
            </tr>
            <tr>
              <td>Convenience Fee</td>
              <td>${formatRupees(invoice.ConvenienceFee)}</td>
            </tr>
              <tr>
              <td>GST</td>
              <td>${formatRupees(invoice.GstAmount)}</td>
            </tr>
          </tbody>
        </table>

        <section class="invoice-summary">
            <div class="summary-box">
                <div class="summary-row">
                    <span class="summary-label">Subtotal</span>
                    <span class="summary-value">${formatRupees(invoice.DriverFee + invoice.ConvenienceFee)}</span>
                </div>
              <div class="summary-row">
                    <span class="summary-label">Taxes (GST)</span>
                    <span class="summary-value">${formatRupees(invoice.GstAmount)}</span>
                </div>
                <div class="summary-row grand-total">
                    <span class="summary-label">Grand Total</span>
                    <span class="summary-value">${formatRupees(invoice.GrandTotal)}</span>
                </div>
            </div>
        </section>

        <footer class="invoice-footer">
          <p>Thank you for choosing ReturnLorry!</p>
          <p>For questions, contact support@returnlorry.com</p>
        </footer>
      </div>
    </body>
    </html>
  `;
};
