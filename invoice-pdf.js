import PDFDocument from 'pdfkit';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INVOICES_DIR = path.join(__dirname, 'data', 'invoices');

// Ensure invoices directory exists
try {
  if (!fs.existsSync(INVOICES_DIR)) {
    fs.mkdirSync(INVOICES_DIR, { recursive: true });
  }
} catch (e) {
  console.error('[InvoicePDF] Error creating invoices dir:', e);
}

function formatHours(h) {
  if (h == null) return '00:00';
  const totalMinutes = Math.round(Number(h || 0) * 60);
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function parseHoursStr(str) {
  if (!str) return 0;
  if (String(str).includes(':')) {
    const parts = String(str).split(':');
    const h = Number(parts[0]) || 0;
    const m = Number(parts[1]) || 0;
    return h + (m / 60);
  }
  return Number(str) || 0;
}

function formatCurrency(num) {
  return `£${Number(num || 0).toFixed(2)}`;
}

/**
 * Builds or retrieves the PDF Buffer for an invoice.
 * @param {object} db - SQLite database instance
 * @param {number|string} invoiceId - Invoice ID
 * @param {boolean} [forceRegenerate=false] - Force rebuilding PDF
 * @returns {Promise<{ buffer: Buffer, filename: string, invoice: object, client: object, recipientEmail: string, filePath: string }>}
 */
export async function getOrGenerateInvoicePdf(db, invoiceId, forceRegenerate = false) {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(Number(invoiceId));
  if (!invoice) {
    throw new Error(`Invoice #${invoiceId} not found.`);
  }

  const client = db.prepare('SELECT * FROM users WHERE id = ?').get(invoice.client_user_id) || {};
  const jobs = db.prepare(`
    SELECT j.*, f.address as flat_address, f.billing_type as flat_billing_type, f.show_project_hours as flat_show_project_hours 
    FROM jobs j 
    LEFT JOIN flats f ON f.id = j.flat_id 
    WHERE j.invoice_id = ? 
    ORDER BY j.finished_at ASC
  `).all(invoice.id);
  const config = db.prepare('SELECT * FROM config LIMIT 1').get() || {};

  const invNum = invoice.invoice_number || String(invoice.id);
  const filename = `Invoice_${invNum}.pdf`;
  const filePath = path.join(INVOICES_DIR, `Invoice_${invoice.id}_${invNum}.pdf`);

  // Target recipient email following exact existing system rules:
  // 1. override_email if present
  // 2. client.email from users table
  const recipientEmail = (invoice.override_email || client.email || '').trim();

  // If already generated on disk and not forced, return cached PDF
  if (!forceRegenerate && fs.existsSync(filePath)) {
    try {
      const buffer = fs.readFileSync(filePath);
      if (buffer && buffer.length > 0) {
        return { buffer, filename, invoice, client, recipientEmail, filePath };
      }
    } catch (e) {
      console.warn('[InvoicePDF] Cache read failed, regenerating:', e.message);
    }
  }

  const buffer = await createInvoicePdfBuffer(invoice, jobs, client, config);
  try {
    fs.writeFileSync(filePath, buffer);
  } catch (e) {
    console.warn('[InvoicePDF] Could not write cache file:', e.message);
  }

  return { buffer, filename, invoice, client, recipientEmail, filePath };
}

/**
 * Generates the PDF document buffer using PDFKit matching the layout of templates.js.
 */
function createInvoicePdfBuffer(invoice, jobs, client, config) {
  return new Promise((resolve, reject) => {
    try {
      // 1. Calculations matching templates.js
      let weekdaysHours = 0, weekdaysAmount = 0;
      let weekendsHours = 0, weekendsAmount = 0;
      let holidaysHours = 0, holidaysAmount = 0;
      let totalHours = 0;
      let projectsAmount = 0;
      let totalExtras = 0;
      let extraLabel = 'BED LINEN';

      const groupedJobs = {};
      jobs.forEach(j => {
        const rawDate = j.requested_date || j.finished_at || '';
        const dateKey = rawDate ? rawDate.slice(0, 10) : '-';
        const flatKey = j.flat_address || j.flat_id || '-';
        const key = `${dateKey}_${flatKey}`;

        if (!groupedJobs[key]) {
          groupedJobs[key] = {
            dateStr: rawDate ? new Date(rawDate).toLocaleDateString('en-GB') : '-',
            flatAddress: j.flat_address || '',
            durationHours: 0,
            isHoliday: j.is_holiday,
            clientAmount: 0,
            extraAmount: 0,
            extraLabel: j.extra_label,
            d: rawDate ? new Date(rawDate) : new Date(),
            billingType: j.flat_billing_type,
            showProjectHours: j.flat_show_project_hours
          };
        }
        groupedJobs[key].durationHours += (j.duration_hours || 0);
        groupedJobs[key].clientAmount += (j.client_amount || 0);
        if (j.extra_amount) {
          groupedJobs[key].extraAmount += j.extra_amount;
          if (j.extra_label) groupedJobs[key].extraLabel = j.extra_label;
        }
      });

      const rows = Object.values(groupedJobs).sort((a, b) => a.d - b.d);
      rows.forEach(g => {
        const isProject = g.billingType === 'project';
        const isWknd = (g.d.getUTCDay() === 0 || g.d.getUTCDay() === 6);
        if (isProject) {
          projectsAmount += g.clientAmount;
        } else {
          if (g.isHoliday) {
            holidaysHours += g.durationHours;
            holidaysAmount += g.clientAmount;
          } else if (isWknd) {
            weekendsHours += g.durationHours;
            weekendsAmount += g.clientAmount;
          } else {
            weekdaysHours += g.durationHours;
            weekdaysAmount += g.clientAmount;
          }
          totalHours += g.durationHours;
        }
        if (g.extraAmount) {
          totalExtras += g.extraAmount;
          if (g.extraLabel) extraLabel = g.extraLabel;
        }
      });

      let extrasList = [];
      let sumExtras = 0;
      try {
        const extrasArr = JSON.parse(invoice.extras_json || '[]');
        const overridesItem = extrasArr.find(e => e.type === '__manualOverrides');
        if (overridesItem && overridesItem.data) {
          const o = overridesItem.data;
          if (o.manualWeekdaysHours) weekdaysHours = parseHoursStr(o.manualWeekdaysHours);
          if (o.manualWeekdaysAmount) weekdaysAmount = Number(o.manualWeekdaysAmount);
          if (o.manualWeekendsHours) weekendsHours = parseHoursStr(o.manualWeekendsHours);
          if (o.manualWeekendsAmount) weekendsAmount = Number(o.manualWeekendsAmount);
          totalHours = weekdaysHours + weekendsHours + holidaysHours;
        }
        extrasArr.filter(e => e.type !== '__manualOverrides').forEach(e => {
          sumExtras += Number(e.total || 0);
          extrasList.push({
            description: e.description,
            quantity: e.quantity,
            total: Number(e.total || 0)
          });
        });
      } catch (e) {}

      const finalInvoiceTotal = Math.round((weekdaysAmount + weekendsAmount + holidaysAmount + projectsAmount + totalExtras + sumExtras + Number.EPSILON) * 100) / 100;

      // 2. Setup PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        autoFirstPage: true,
        info: {
          Title: `Invoice #${invoice.invoice_number || invoice.id}`,
          Author: 'Fantastic BNB',
          Subject: `Invoice for ${client.name || 'Client'}`
        }
      });

      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      const pageWidth = doc.page.width; // 595.28
      const margin = 36;
      const contentWidth = pageWidth - (margin * 2); // ~523.28

      let y = margin;

      // ── Header Outer Box ──
      const headerBoxHeight = 125;
      doc.rect(margin, y, contentWidth, headerBoxHeight).lineWidth(1.5).strokeColor('#000000').stroke();

      // Divider between Logo and Info
      const logoWidth = 190;
      doc.moveTo(margin + logoWidth, y).lineTo(margin + logoWidth, y + headerBoxHeight).lineWidth(1).strokeColor('#000000').stroke();

      // Logo side
      const logoPath = path.join(__dirname, 'icon-512.png');
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, margin + (logoWidth - 80) / 2, y + 10, { width: 80, height: 80 });
          doc.font('Times-Bold').fontSize(11).fillColor('#000000').text('FANTASTIC BNB', margin, y + 96, { width: logoWidth, align: 'center' });
          doc.font('Times-Roman').fontSize(8).fillColor('#555555').text('PROPERTY MANAGEMENT', margin, y + 109, { width: logoWidth, align: 'center' });
        } catch (e) {
          doc.font('Times-Bold').fontSize(18).fillColor('#000000').text('FANTASTIC BNB', margin, y + 45, { width: logoWidth, align: 'center' });
          doc.font('Times-Roman').fontSize(10).fillColor('#555555').text('Property Management', margin, y + 68, { width: logoWidth, align: 'center' });
        }
      } else {
        doc.font('Times-Bold').fontSize(18).fillColor('#000000').text('FANTASTIC BNB', margin, y + 45, { width: logoWidth, align: 'center' });
        doc.font('Times-Roman').fontSize(10).fillColor('#555555').text('Property Management', margin, y + 68, { width: logoWidth, align: 'center' });
      }

      // Details side
      const detailsX = margin + logoWidth;
      const detailsWidth = contentWidth - logoWidth;
      const detailsRows = [
        ['Email:', 'fantasticbnbservicss@gmail.com'],
        ['Invoice nº:', `#${invoice.invoice_number || invoice.id}`],
        ['Date of Issue:', invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('en-GB') : '-'],
        ['Due Date:', invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-GB') : '-'],
        ['Period:', `${new Date(invoice.period_from).toLocaleDateString('en-GB')} - ${new Date(invoice.period_to).toLocaleDateString('en-GB')}`],
        ['Bill To:', invoice.invoice_group && invoice.invoice_group !== 'Automático' && invoice.invoice_group !== 'default' ? invoice.invoice_group : (client.name || 'Client')],
        ['Email:', invoice.override_email || client.email || '-']
      ];

      const rowHeight = headerBoxHeight / detailsRows.length;
      detailsRows.forEach((r, idx) => {
        const rowY = y + (idx * rowHeight);
        if (idx > 0) {
          doc.moveTo(detailsX, rowY).lineTo(detailsX + detailsWidth, rowY).lineWidth(0.5).strokeColor('#888888').stroke();
        }
        doc.font('Times-Bold').fontSize(9).fillColor('#000000').text(r[0], detailsX + 8, rowY + 4, { width: 90 });
        const valColor = r[0] === 'Bill To:' ? '#0033aa' : '#000000';
        doc.font(r[0] === 'Bill To:' ? 'Times-Bold' : 'Times-Roman').fontSize(9).fillColor(valColor).text(r[1], detailsX + 95, rowY + 4, { width: detailsWidth - 102, ellipsis: true });
      });

      y += headerBoxHeight;

      // ── Main Jobs Table ──
      const colW = {
        date: 90,
        flat: contentWidth - 90 - 75 - 85, // ~273
        hours: 75,
        amount: 85
      };

      // Table Header
      const thHeight = 22;
      doc.rect(margin, y, contentWidth, thHeight).fillAndStroke('#f3f4f6', '#000000');
      doc.font('Times-Bold').fontSize(10).fillColor('#000000');
      doc.text('Date', margin, y + 6, { width: colW.date, align: 'center' });
      doc.text('Flat', margin + colW.date, y + 6, { width: colW.flat, align: 'center' });
      doc.text('Total Hours', margin + colW.date + colW.flat, y + 6, { width: colW.hours, align: 'center' });
      doc.text('Amount', margin + colW.date + colW.flat + colW.hours, y + 6, { width: colW.amount, align: 'center' });

      y += thHeight;

      // Job Rows
      rows.forEach(g => {
        const isProject = g.billingType === 'project';
        const hoursStr = (isProject && !g.showProjectHours) ? '-' : formatHours(g.durationHours);
        const isWknd = (g.d.getUTCDay() === 0 || g.d.getUTCDay() === 6);
        const rowBg = (!isProject && isWknd) ? '#fff8dc' : '#ffffff';

        // Check page overflow
        if (y + 20 > doc.page.height - 180) {
          doc.addPage();
          y = margin;
          // Re-draw table header on new page
          doc.rect(margin, y, contentWidth, thHeight).fillAndStroke('#f3f4f6', '#000000');
          doc.font('Times-Bold').fontSize(10).fillColor('#000000');
          doc.text('Date', margin, y + 6, { width: colW.date, align: 'center' });
          doc.text('Flat', margin + colW.date, y + 6, { width: colW.flat, align: 'center' });
          doc.text('Total Hours', margin + colW.date + colW.flat, y + 6, { width: colW.hours, align: 'center' });
          doc.text('Amount', margin + colW.date + colW.flat + colW.hours, y + 6, { width: colW.amount, align: 'center' });
          y += thHeight;
        }

        const trHeight = 18;
        doc.rect(margin, y, contentWidth, trHeight).fillAndStroke(rowBg, '#cccccc');

        doc.font('Times-Roman').fontSize(9).fillColor('#000000');
        doc.text(g.dateStr, margin, y + 4, { width: colW.date, align: 'center' });
        doc.text(g.flatAddress, margin + colW.date + 6, y + 4, { width: colW.flat - 12, align: 'center', ellipsis: true });
        doc.text(hoursStr, margin + colW.date + colW.flat, y + 4, { width: colW.hours, align: 'center' });
        doc.text(formatCurrency(g.clientAmount), margin + colW.date + colW.flat + colW.hours, y + 4, { width: colW.amount - 6, align: 'center' });

        y += trHeight;
      });

      // ── Totals Table ──
      const totCol1 = contentWidth - 160;
      const totCol2 = 80;
      const totCol3 = 80;

      const drawTotalRow = (label, col2Val, col3Val, isBold = false, bg = '#ffffff') => {
        if (y + 20 > doc.page.height - 120) {
          doc.addPage();
          y = margin;
        }
        const h = 18;
        doc.rect(margin, y, contentWidth, h).fillAndStroke(bg, '#000000');
        doc.font(isBold ? 'Times-Bold' : 'Times-Roman').fontSize(9).fillColor('#000000');

        if (col3Val !== null) {
          doc.text(label, margin + 8, y + 4, { width: totCol1 - 16, align: 'left' });
          doc.text(col2Val || '', margin + totCol1, y + 4, { width: totCol2, align: 'center' });
          doc.text(col3Val || '', margin + totCol1 + totCol2, y + 4, { width: totCol3 - 6, align: 'right' });
        } else {
          doc.text(label, margin + 8, y + 4, { width: totCol1 - 16, align: 'left' });
          doc.text(col2Val || '', margin + totCol1, y + 4, { width: totCol2 + totCol3 - 6, align: 'center' });
        }
        y += h;
      };

      if (totalHours > 0) {
        drawTotalRow('Total Hours', formatHours(totalHours), null, true);
      }
      if (weekdaysHours > 0 || weekdaysAmount > 0) {
        drawTotalRow('Weekdays Hours', formatHours(weekdaysHours), formatCurrency(weekdaysAmount));
      }
      if (holidaysHours > 0 || holidaysAmount > 0) {
        drawTotalRow('Bank Holiday', formatHours(holidaysHours), formatCurrency(holidaysAmount));
      }
      if (weekendsHours > 0 || weekendsAmount > 0) {
        drawTotalRow('Weekends Hours', formatHours(weekendsHours), formatCurrency(weekendsAmount), false, '#fff2cc');
      }
      if (projectsAmount > 0) {
        drawTotalRow('Projects (Fixed Rate)', '-', formatCurrency(projectsAmount));
      }
      if (totalExtras > 0) {
        drawTotalRow(`${extraLabel} (Jobs)`, formatCurrency(totalExtras), null);
      }
      extrasList.forEach(e => {
        drawTotalRow(`${e.description} (x${e.quantity})`, formatCurrency(e.total), null);
      });

      // Grand Total Box
      const gtHeight = 36;
      doc.rect(margin, y, contentWidth - 130, gtHeight).fillAndStroke('#dce5d8', '#000000');
      doc.rect(margin + contentWidth - 130, y, 130, gtHeight).fillAndStroke('#dce5d8', '#000000');
      doc.font('Times-Bold').fontSize(20).fillColor('#000000').text('TOTAL', margin + 14, y + 8);
      doc.font('Times-Bold').fontSize(20).fillColor('#000000').text(formatCurrency(finalInvoiceTotal), margin + contentWidth - 130, y + 8, { width: 122, align: 'right' });
      y += gtHeight;

      // ── Payment Info & Bank Details ──
      y += 8;
      const piHeaderHeight = 16;
      doc.rect(margin, y, contentWidth, piHeaderHeight).fillAndStroke('#999999', '#000000');
      doc.font('Times-Bold').fontSize(10).fillColor('#ffffff').text('Payment info :', margin, y + 3, { width: contentWidth, align: 'center' });
      y += piHeaderHeight;

      const bankBoxHeight = 44;
      doc.rect(margin, y, contentWidth, bankBoxHeight).lineWidth(1).strokeColor('#000000').stroke();
      doc.font('Times-Bold').fontSize(10).fillColor('#000000');
      doc.text(`Bank details: ${config.bank_name || 'Elita Aparecida de Oliveira'}`, margin, y + 6, { width: contentWidth, align: 'center' });
      doc.text(`Sort code : ${config.sort_code || '23-14-70'}`, margin, y + 18, { width: contentWidth, align: 'center' });
      doc.text(`Account number : ${config.account_number || '46630320'}`, margin, y + 30, { width: contentWidth, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Builds the professional email subject, plaintext and HTML content for an invoice.
 */
export function buildInvoiceEmail({ clientName, invoiceNumber, startDate, endDate, totalAmount, dueDate }) {
  const subject = `Your Fantastic BNB Invoice #${invoiceNumber}`;

  const text = `Hello ${clientName},

We hope you're doing well!

Your invoice from Fantastic BNB is now ready.

Please find attached invoice #${invoiceNumber}, covering the period from ${startDate} to ${endDate}.

Please review the attached document and arrange payment according to the details provided in the invoice.

If you have any questions or need assistance, please don't hesitate to contact us. We're always happy to help!

Thank you for choosing Fantastic BNB. We truly appreciate your trust in our services.

Kind regards,

The Fantastic BNB Team`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <div style="background-color: #f1f5f9; padding: 32px 16px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
      
      <!-- Brand Header -->
      <div style="background: linear-gradient(135deg, #0b132b 0%, #1c2541 100%); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Fantastic BNB</h1>
        <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1.2px;">Property Management & Cleaning Services</p>
      </div>

      <!-- Main Body -->
      <div style="padding: 32px 28px; line-height: 1.6; font-size: 15px; color: #334155;">
        <p style="margin: 0 0 16px 0; font-size: 16px; color: #0f172a;">Hello <strong>${clientName}</strong>,</p>
        
        <p style="margin: 0 0 16px 0;">We hope you're doing well!</p>
        <p style="margin: 0 0 20px 0;">Your invoice from Fantastic BNB is now ready.</p>

        <!-- Invoice Highlight Box -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; border-radius: 10px; padding: 18px 20px; margin: 24px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b;">Invoice Details</span>
            <span style="background-color: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px;">PDF Attached 📎</span>
          </div>
          <div style="font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
            Invoice #${invoiceNumber}
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px;">
            <tr>
              <td style="padding: 4px 0; color: #64748b; width: 80px;">Period:</td>
              <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${startDate} to ${endDate}</td>
            </tr>
            ${totalAmount ? `<tr><td style="padding: 4px 0; color: #64748b;">Total:</td><td style="padding: 4px 0; font-weight: 700; color: #059669; font-size: 14px;">${totalAmount}</td></tr>` : ''}
            ${dueDate ? `<tr><td style="padding: 4px 0; color: #64748b;">Due Date:</td><td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${dueDate}</td></tr>` : ''}
          </table>
        </div>

        <p style="margin: 0 0 16px 0;">Please find attached invoice <strong>#${invoiceNumber}</strong>, covering the period from <strong>${startDate}</strong> to <strong>${endDate}</strong>.</p>
        
        <p style="margin: 0 0 16px 0;">Please review the attached document and arrange payment according to the details provided in the invoice.</p>
        
        <p style="margin: 0 0 16px 0;">If you have any questions or need assistance, please don't hesitate to contact us. We're always happy to help!</p>
        
        <p style="margin: 0 0 28px 0;">Thank you for choosing Fantastic BNB. We truly appreciate your trust in our services.</p>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 24px;">
          <p style="margin: 0 0 4px 0; color: #64748b; font-size: 14px;">Kind regards,</p>
          <p style="margin: 0; font-weight: 700; font-size: 15px; color: #0f172a;">The Fantastic BNB Team</p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5;">
        <p style="margin: 0 0 4px 0; font-weight: 600; color: #64748b;">Fantastic BNB • Property Management & Operations</p>
        <p style="margin: 0;">fantasticbnbservicss@gmail.com</p>
      </div>

    </div>
  </div>
</body>
</html>
  `;

  return { subject, text, html };
}
