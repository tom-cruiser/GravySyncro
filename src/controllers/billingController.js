const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const Invoice = require('../models/Invoice');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { createInvoiceForTenant } = require('../utils/invoices');
const { log } = require('../middleware/activityLogger');

const DEFAULT_PAGE_SIZE = 25;
const LOGO_PATH = path.join(__dirname, '../assets/logo.png');

/**
 * GET /billing/invoices
 * Paginated list of the current tenant's invoices, newest first.
 */
exports.listInvoices = catchAsync(async (req, res) => {
  const tenantId = req.user.tenantId;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE, 1), 100);

  const [invoices, total] = await Promise.all([
    Invoice.find({ tenantId })
      .sort({ issuedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('invoiceNumber status planName storageGb periodStart periodEnd issuedAt subtotalCents taxCents totalCents currency'),
    Invoice.countDocuments({ tenantId }),
  ]);

  res.status(200).json({
    status: 'success',
    results: invoices.length,
    data: {
      invoices,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

/**
 * GET /billing/invoices/:id
 * Full detail for a single invoice (itemized lines + bill-to snapshot).
 */
exports.getInvoice = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!invoice) return next(new AppError('Invoice not found', 404));

  res.status(200).json({ status: 'success', data: { invoice } });
});

/**
 * POST /billing/invoices/generate
 * Admin-only convenience: generate an invoice for the tenant's current
 * plan right now, instead of waiting for the monthly cron
 * (jobs/invoiceBiller.js). Useful for a brand-new tenant's first invoice,
 * support requests, or testing.
 */
exports.generateInvoiceNow = catchAsync(async (req, res) => {
  const tenantId = req.user.tenantId;
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const invoice = await createInvoiceForTenant(tenantId, {
    periodStart,
    periodEnd,
    generatedBy: 'manual',
  });

  await log(req, 'settings_change', 'invoice', invoice._id, {
    action: 'billing_invoice_generated_manually',
    invoiceNumber: invoice.invoiceNumber,
    totalCents: invoice.totalCents,
    triggeredBy: req.user.email,
  });

  res.status(201).json({ status: 'success', data: { invoice } });
});

const formatMoney = (cents, currency = 'usd') => {
  const amount = (Number(cents || 0) / 100).toFixed(2);
  const symbol = currency.toLowerCase() === 'usd' ? '$' : `${currency.toUpperCase()} `;
  return `${symbol}${amount}`;
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Writes one cell of text at an explicit x/y with no line-break/cursor
// side effects, so the caller's own y bookkeeping stays authoritative.
// This is what makes the multi-column layout below (bill-to next to
// invoice meta, totals right-aligned) safe to reason about.
const writeCell = (doc, text, x, y, { width, align = 'left', font = 'Helvetica', size = 10, color = '#374151' } = {}) => {
  doc.font(font).fontSize(size).fillColor(color)
    .text(String(text ?? ''), x, y, { width, align, lineBreak: false });
};

// Bordered, paginating table for the itemized line items — same visual
// language (header bar, alternating row shading) as the asset-report PDF
// in assetController.js, so exported documents look like one product.
const drawItemsTable = (doc, { startX, columnWidths, rows, y }) => {
  const headerHeight = 22;
  const minRowHeight = 22;
  const cellPaddingY = 12; // matches the 6px top offset writeCell renders at, x2
  const tableWidth = columnWidths.reduce((a, b) => a + b, 0);
  const pageBottom = doc.page.height - doc.page.margins.bottom;
  let cursorY = y;

  const drawHeaderRow = (rowY) => {
    doc.rect(startX, rowY, tableWidth, headerHeight).fill('#111827');
    let x = startX;
    ['Description', 'Qty', 'Unit Price', 'Amount'].forEach((header, i) => {
      writeCell(doc, header, x + 8, rowY + 6, {
        width: columnWidths[i] - 12,
        align: i === 0 ? 'left' : 'right',
        font: 'Helvetica-Bold',
        size: 9,
        color: '#ffffff',
      });
      x += columnWidths[i];
    });
    return rowY + headerHeight;
  };

  cursorY = drawHeaderRow(cursorY);

  rows.forEach((row, rowIndex) => {
    // Descriptions can be long enough to wrap onto a second line — measure
    // it first so a wrapped row never bleeds into the row drawn after it.
    doc.font('Helvetica').fontSize(10);
    const rowHeight = Math.max(
      minRowHeight,
      doc.heightOfString(String(row[0] ?? ''), { width: columnWidths[0] - 12 }) + cellPaddingY
    );

    if (cursorY + rowHeight > pageBottom) {
      doc.addPage();
      cursorY = drawHeaderRow(doc.page.margins.top);
    }

    if (rowIndex % 2 === 1) {
      doc.rect(startX, cursorY, tableWidth, rowHeight).fill('#f9fafb');
    }

    let x = startX;
    row.forEach((cell, i) => {
      writeCell(doc, cell, x + 8, cursorY + 6, {
        width: columnWidths[i] - 12,
        align: i === 0 ? 'left' : 'right',
      });
      x += columnWidths[i];
    });
    cursorY += rowHeight;
  });

  return cursorY;
};

const buildInvoicePdfBuffer = (invoice) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  const startX = doc.page.margins.left;
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // ---- Header: logo + wordmark on the left, "INVOICE" + number on the right ----
  const headerTop = doc.y;
  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, startX, headerTop, { width: 40 });
  }
  writeCell(doc, 'GravySyncro', startX + 50, headerTop + 2, { width: 260, font: 'Helvetica-Bold', size: 18, color: '#111827' });
  writeCell(doc, 'Global Cloud Sync & Archive', startX + 50, headerTop + 24, { width: 260, size: 9, color: '#6b7280' });

  writeCell(doc, 'INVOICE', startX, headerTop, { width: pageWidth, align: 'right', font: 'Helvetica-Bold', size: 20, color: '#111827' });
  writeCell(doc, invoice.invoiceNumber, startX, headerTop + 26, { width: pageWidth, align: 'right', size: 10, color: '#6b7280' });

  let cursorY = headerTop + 60;
  doc.moveTo(startX, cursorY).lineTo(startX + pageWidth, cursorY).strokeColor('#e5e7eb').stroke();
  cursorY += 24;

  // ---- Bill To / Invoice details, two columns ----
  const colTop = cursorY;
  writeCell(doc, 'Bill To', startX, colTop, { width: pageWidth / 2 - 12, font: 'Helvetica-Bold', size: 10, color: '#111827' });

  const billToLines = [
    invoice.billTo?.companyName,
    invoice.billTo?.contactName,
    invoice.billTo?.email,
    invoice.billTo?.address?.line1,
    invoice.billTo?.address?.line2,
    [invoice.billTo?.address?.city, invoice.billTo?.address?.state, invoice.billTo?.address?.postalCode]
      .filter(Boolean).join(', '),
    invoice.billTo?.address?.country,
  ].filter(Boolean);

  billToLines.forEach((line, i) => {
    writeCell(doc, line, startX, colTop + 18 + i * 14, { width: pageWidth / 2 - 12 });
  });

  const metaX = startX + pageWidth / 2 + 12;
  const metaWidth = pageWidth / 2 - 12;
  writeCell(doc, 'Invoice Details', metaX, colTop, { width: metaWidth, font: 'Helvetica-Bold', size: 10, color: '#111827' });

  const metaRows = [
    ['Invoice #', invoice.invoiceNumber],
    ['Status', invoice.status.toUpperCase()],
    ['Issued', formatDate(invoice.issuedAt)],
    ['Billing period', `${formatDate(invoice.periodStart)} – ${formatDate(invoice.periodEnd)}`],
  ];
  metaRows.forEach(([label, value], i) => {
    const rowY = colTop + 18 + i * 14;
    writeCell(doc, label, metaX, rowY, { width: 100, font: 'Helvetica-Bold', size: 9, color: '#374151' });
    writeCell(doc, value, metaX + 100, rowY, { width: metaWidth - 100, size: 9 });
  });

  cursorY = colTop + 18 + Math.max(billToLines.length, metaRows.length) * 14 + 24;

  // ---- Itemized breakdown ----
  writeCell(doc, 'Itemized Breakdown', startX, cursorY, { width: pageWidth, font: 'Helvetica-Bold', size: 12, color: '#111827' });
  cursorY += 22;

  const columnWidths = [pageWidth - 60 - 90 - 90, 60, 90, 90];
  cursorY = drawItemsTable(doc, {
    startX,
    columnWidths,
    y: cursorY,
    rows: invoice.lineItems.map((item) => [
      item.description,
      item.quantity,
      formatMoney(item.unitAmountCents, invoice.currency),
      formatMoney(item.amountCents, invoice.currency),
    ]),
  });
  cursorY += 20;

  // ---- Totals, right-aligned ----
  const totalsWidth = 220;
  const totalsX = startX + pageWidth - totalsWidth;
  const totalsLabelWidth = totalsWidth - 90;

  const writeTotalsRow = (label, value, { bold = false } = {}) => {
    writeCell(doc, label, totalsX, cursorY, {
      width: totalsLabelWidth,
      font: bold ? 'Helvetica-Bold' : 'Helvetica',
      size: bold ? 12 : 10,
      color: bold ? '#111827' : '#374151',
    });
    writeCell(doc, value, totalsX + totalsLabelWidth, cursorY, {
      width: 90,
      align: 'right',
      font: bold ? 'Helvetica-Bold' : 'Helvetica',
      size: bold ? 12 : 10,
      color: bold ? '#111827' : '#374151',
    });
    cursorY += bold ? 20 : 16;
  };

  writeTotalsRow('Subtotal', formatMoney(invoice.subtotalCents, invoice.currency));
  writeTotalsRow('Tax', formatMoney(invoice.taxCents, invoice.currency));
  cursorY += 4;
  doc.moveTo(totalsX, cursorY).lineTo(totalsX + totalsWidth, cursorY).strokeColor('#e5e7eb').stroke();
  cursorY += 10;
  writeTotalsRow('Total Paid', formatMoney(invoice.totalCents, invoice.currency), { bold: true });

  cursorY += 40;
  writeCell(
    doc,
    'Thank you for using GravySyncro. Questions about this invoice? Contact support from within the app.',
    startX,
    cursorY,
    { width: pageWidth, align: 'center', size: 9, color: '#9ca3af' }
  );

  doc.end();
});

/**
 * GET /billing/invoices/:id/pdf
 * Streams a professionally formatted PDF for one invoice.
 */
exports.downloadInvoicePdf = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!invoice) return next(new AppError('Invoice not found', 404));

  const buffer = await buildInvoicePdfBuffer(invoice);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
  res.status(200).send(buffer);
});
