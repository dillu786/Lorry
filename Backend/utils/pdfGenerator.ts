import type { Request, Response } from "express";
import fs from 'fs';
import path from 'path';

// Simple PDF generation using HTML template and response headers
// This creates a downloadable PDF-like response that browsers can handle

export const generateInvoicePDF = (invoiceData: any, res: Response) => {
  try {
    const html = generateInvoiceHTML(invoiceData);
    
    // Set headers for automatic PDF download
    // Using HTML with proper headers that browsers will handle as downloadable content
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceData.InvoiceNumber}.pdf"`);
    res.setHeader('Content-Length', Buffer.byteLength(html, 'utf8'));
    
    // Add JavaScript to automatically trigger print/download when page loads
    const htmlWithAutoDownload = html.replace(
      '</body>',
      `
      <script>
        // Auto-trigger print dialog when page loads
        window.onload = function() {
          // Small delay to ensure page is fully rendered
          setTimeout(function() {
            window.print();
          }, 500);
        };
        
        // Also provide a manual download button as fallback
        window.addEventListener('load', function() {
          const printButton = document.createElement('button');
          printButton.innerHTML = 'Download/Print PDF';
          printButton.style.cssText = \`
            position: fixed;
            top: 20px;
            right: 20px;
            background: #667eea;
            color: white;
            border: none;
            padding: 15px 25px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          \`;
          printButton.onclick = function() {
            window.print();
          };
          document.body.appendChild(printButton);
        });
      </script>
      </body>`
    );
    
    res.send(htmlWithAutoDownload);
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

// Alternative PDF generation with better download experience
export const generateInvoicePDFDirect = (invoiceData: any, res: Response) => {
  try {
    const html = generateInvoiceHTML(invoiceData);
    
    // Set headers for HTML content that will be converted to PDF by browser
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceData.InvoiceNumber}.html"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');
    
    // Generate HTML with print-optimized styles and auto-print functionality
    const pdfHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice ${invoiceData.InvoiceNumber}</title>
    <style>
        @page {
            margin: 0.5in;
            size: A4;
        }
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        .no-print {
            display: none !important;
        }
        @media print {
            body {
                padding: 0;
                margin: 0;
                background: white;
            }
            .invoice-container {
                box-shadow: none;
                border: none;
                margin: 0;
                max-width: none;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            button {
                display: none !important;
            }
            .print-button {
                display: none !important;
            }
        }
    </style>
    <script>
        // Auto-print when page loads
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 1000);
        };
    </script>
</head>
<body>
    ${html}
    <div class="no-print" style="position: fixed; top: 10px; right: 10px; background: #667eea; color: white; padding: 10px; border-radius: 5px; z-index: 1000;">
        <button onclick="window.print()" style="background: white; color: #667eea; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">
            📄 Download PDF
        </button>
    </div>
</body>
</html>`;
    
    res.send(pdfHTML);
  } catch (error: any) {
    console.error('Error generating direct PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

const generateInvoiceHTML = (invoice: any): string => {
  const currentDate = new Date().toLocaleDateString('en-IN');
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.InvoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
            padding: 20px;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 300;
        }
        
        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .invoice-details {
            padding: 30px;
        }
        
        .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        
        .invoice-number {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .invoice-number h3 {
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .invoice-number p {
            font-size: 1.2em;
            font-weight: bold;
            color: #333;
        }
        
        .date-info {
            text-align: right;
            padding: 20px;
        }
        
        .date-info p {
            margin-bottom: 5px;
        }
        
        .parties {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .party {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
        }
        
        .party h4 {
            color: #667eea;
            margin-bottom: 15px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 5px;
        }
        
        .party p {
            margin-bottom: 5px;
        }
        
        .trip-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        
        .trip-details h4 {
            color: #667eea;
            margin-bottom: 15px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 5px;
        }
        
        .trip-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .trip-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            background: white;
            border-radius: 5px;
            border-left: 3px solid #667eea;
        }
        
        .trip-item strong {
            color: #333;
        }
        
        .fare-breakdown {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        
        .fare-breakdown h4 {
            color: #667eea;
            margin-bottom: 15px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 5px;
        }
        
        .fare-item {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .fare-item:last-child {
            border-bottom: none;
            font-weight: bold;
            font-size: 1.1em;
            background: #667eea;
            color: white;
            padding: 15px;
            margin: 10px -20px -20px -20px;
            border-radius: 0 0 8px 8px;
        }
        
        .fare-item.total {
            background: #667eea;
            color: white;
            padding: 15px;
            margin: 10px -20px -20px -20px;
            border-radius: 0 0 8px 8px;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        
        .footer p {
            color: #666;
            font-size: 0.9em;
        }
        
        @media print {
            body {
                padding: 0;
                margin: 0;
                background: white;
            }
            .invoice-container {
                box-shadow: none;
                border: none;
                margin: 0;
                max-width: none;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            button {
                display: none !important;
            }
            .print-button {
                display: none !important;
            }
            @page {
                margin: 0.5in;
                size: A4;
            }
        }
        
        @media (max-width: 768px) {
            .parties {
                grid-template-columns: 1fr;
            }
            .invoice-info {
                flex-direction: column;
            }
            .date-info {
                text-align: left;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <h1>INVOICE</h1>
            <p>ReturnLorry - Your Trusted Logistics Partner</p>
        </div>
        
        <div class="invoice-details">
            <div class="invoice-info">
                <div class="invoice-number">
                    <h3>Invoice Number</h3>
                    <p>${invoice.InvoiceNumber}</p>
                </div>
                <div class="date-info">
                    <p><strong>Invoice Date:</strong> ${currentDate}</p>
                    <p><strong>Booking ID:</strong> ${invoice.BookingId}</p>
                    <p><strong>Payment Mode:</strong> ${invoice.PaymentMode}</p>
                </div>
            </div>
            
            <div class="parties">
                <div class="party">
                    <h4>Customer Details</h4>
                    <p><strong>Name:</strong> ${invoice.CustomerName}</p>
                    <p><strong>Mobile:</strong> ${invoice.CustomerMobile}</p>
                    ${invoice.CustomerEmail ? `<p><strong>Email:</strong> ${invoice.CustomerEmail}</p>` : ''}
                    <p><strong>Customer ID:</strong> ${invoice.CustomerId}</p>
                </div>
                
                <div class="party">
                    <h4>Driver Details</h4>
                    <p><strong>Name:</strong> ${invoice.DriverName}</p>
                    <p><strong>Mobile:</strong> ${invoice.DriverMobile}</p>
                    <p><strong>Driver ID:</strong> ${invoice.DriverId}</p>
                    ${invoice.OwnerName ? `<p><strong>Owner:</strong> ${invoice.OwnerName}</p>` : ''}
                </div>
            </div>
            
            <div class="trip-details">
                <h4>Trip Information</h4>
                <div class="trip-grid">
                    <div class="trip-item">
                        <span><strong>Pickup Location:</strong></span>
                        <span>${invoice.PickUpLocation}</span>
                    </div>
                    <div class="trip-item">
                        <span><strong>Drop Location:</strong></span>
                        <span>${invoice.DropLocation}</span>
                    </div>
                    <div class="trip-item">
                        <span><strong>Product:</strong></span>
                        <span>${invoice.Product}</span>
                    </div>
                    <div class="trip-item">
                        <span><strong>Distance:</strong></span>
                        <span>${invoice.Distance} km</span>
                    </div>
                    ${invoice.Weight ? `
                    <div class="trip-item">
                        <span><strong>Weight:</strong></span>
                        <span>${invoice.Weight}</span>
                    </div>
                    ` : ''}
                    <div class="trip-item">
                        <span><strong>Vehicle Type:</strong></span>
                        <span>${invoice.VehicleType}</span>
                    </div>
                    ${invoice.VehicleModel ? `
                    <div class="trip-item">
                        <span><strong>Vehicle:</strong></span>
                        <span>${invoice.VehicleModel}</span>
                    </div>
                    ` : ''}
                    ${invoice.VehicleNumber ? `
                    <div class="trip-item">
                        <span><strong>Vehicle Number:</strong></span>
                        <span>${invoice.VehicleNumber}</span>
                    </div>
                    ` : ''}
                    <div class="trip-item">
                        <span><strong>Trip Duration:</strong></span>
                        <span>${invoice.TripDuration} minutes</span>
                    </div>
                </div>
            </div>
            
            <div class="fare-breakdown">
                <h4>Fare Breakdown</h4>
                <div class="fare-item">
                    <span>Driver Fee</span>
                    <span>₹${invoice.DriverFee.toFixed(2)}</span>
                </div>
                <div class="fare-item">
                    <span>Convenience Fee (5%)</span>
                    <span>₹${invoice.ConvenienceFee.toFixed(2)}</span>
                </div>
                <div class="fare-item">
                    <span>GST (18%)</span>
                    <span>₹${invoice.GstAmount.toFixed(2)}</span>
                </div>
                <div class="fare-item total">
                    <span><strong>Total Amount</strong></span>
                    <span><strong>₹${invoice.GrandTotal.toFixed(2)}</strong></span>
                </div>
            </div>
            
            <div class="footer">
                <p>Thank you for choosing ReturnLorry!</p>
                <p>For any queries, contact us at support@returnlorry.com</p>
                <p>This is a computer-generated invoice.</p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
};
