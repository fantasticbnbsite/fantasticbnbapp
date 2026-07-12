export function renderInvoiceHtml(invoice, jobs, client, config) {
  function formatHours(h) {
    if (h == null) return '00:00';
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }
  // calculate subtotals
  let weekdaysHours = 0, weekdaysAmount = 0;
  let weekendsHours = 0, weekendsAmount = 0;
  let holidaysHours = 0, holidaysAmount = 0;
  let totalHours = 0;
  let projectsAmount = 0;
  let totalExtras = 0;
  let extraLabel = 'BED LINEN'; // fallback
  
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
        billingType: j.flat_billing_type
      };
    }
    groupedJobs[key].durationHours += (j.duration_hours || 0);
    groupedJobs[key].clientAmount += (j.client_amount || 0);
    if (j.extra_amount) {
      groupedJobs[key].extraAmount += j.extra_amount;
      if (j.extra_label) groupedJobs[key].extraLabel = j.extra_label;
    }
  });

  const rows = Object.values(groupedJobs)
  .sort((a, b) => a.d - b.d)
  .map(g => {
    const isProject = g.billingType === 'project';
    const hoursStr = isProject ? '-' : formatHours(g.durationHours);
    
    // Grouping for totals
    const isWknd = (g.d.getDay() === 0 || g.d.getDay() === 6);
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
    
    const rowBg = (!isProject && isWknd) ? 'background-color: #fff2cc;' : '';
    
    return `<tr style="${rowBg}">
      <td style="text-align:center;">${g.dateStr}</td>
      <td style="text-align:center;">${g.flatAddress}</td>
      <td style="text-align:center;">${hoursStr}</td>
      <td style="text-align:center;">£${Number(g.clientAmount).toFixed(2)}</td>
    </tr>`;
  }).join('');
  
  let extrasHtml = '';
  try {
    const extrasArr = JSON.parse(invoice.extras_json || '[]');
    extrasArr.forEach(e => {
      extrasHtml += `
      <tr>
        <td>${e.description} (x${e.quantity})</td>
        <td colspan="2" style="text-align:center;">£${Number(e.total).toFixed(2)}</td>
      </tr>`;
    });
  } catch(e) {}

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice #${invoice.invoice_number || invoice.id}</title>
  <style>
    body { font-family: 'Times New Roman', serif; margin: 0; padding: 20px; color: #000; }
    .invoice-box { max-width: 800px; margin: auto; border: 2px solid #000; padding: 0; }
    .header-table { width: 100%; border-collapse: collapse; }
    .header-table td { border: 1px solid #000; padding: 8px; font-size: 14px; font-weight: bold; }
    .logo-cell { width: 40%; text-align: center; vertical-align: middle; padding: 10px; }
    .details-cell { padding: 0 !important; }
    .details-table { width: 100%; border-collapse: collapse; }
    .details-table td { border-bottom: 1px solid #000; padding: 6px 12px; font-size: 14px; font-weight: normal; }
    .details-table tr:last-child td { border-bottom: none; }
    .details-table td:first-child { width: 120px; font-weight: bold; }
    
    .main-table { width: 100%; border-collapse: collapse; margin-top: -1px; }
    .main-table th { padding: 10px; font-size: 16px; border-top: 1px solid #000; }
    .main-table td { padding: 4px 10px; font-size: 14px; }
    
    .totals-table { width: 100%; border-collapse: collapse; border-top: 2px solid #000; }
    .totals-table td { border: 1px solid #000; padding: 6px 12px; font-size: 14px; }
    .totals-table td:first-child { width: 250px; text-align: center; font-weight: bold; }
    .totals-table td:nth-child(2) { text-align: center; }
    .totals-table td:nth-child(3) { text-align: right; font-weight: bold; width: 150px; }
    
    .grand-total { background: #dce5d8; font-size: 38px !important; font-weight: normal !important; text-align: center; padding: 10px !important; }
    .grand-total-val { font-size: 38px !important; text-align: right; }
    
    .payment-info { background: #999; text-align: center; color: #fff; font-weight: bold; font-size: 16px; padding: 4px; border: 1px solid #000; }
    .bank-details { text-align: center; padding: 10px; font-size: 16px; font-weight: bold; border: 1px solid #000; border-top: none; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="no-print" style="padding: 16px; text-align: center; background: #151b25;">
    <button onclick="window.close(); if(!window.closed) window.location.href='/';" style="padding: 12px 24px; font-size: 16px; cursor: pointer; border-radius: 8px; border: none; background: #3b82f6; color: white; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">← Voltar para o App</button>
  </div>
  <div class="invoice-box">
    <table class="header-table">
      <tr>
        <td class="logo-cell">
          <img src="/icon-512.png" alt="Fantastic BNB" style="max-width: 80%; max-height: 120px; object-fit: contain;" />
        </td>
        <td class="details-cell">
          <table class="details-table">
            <tr><td>Email:</td><td>fantasticbnbservicss@gmail.com</td></tr>
            <tr><td>Invoice nº</td><td>#${invoice.invoice_number || invoice.id}</td></tr>
            <tr><td>Period:</td><td>${new Date(invoice.period_from).toLocaleDateString('en-GB')} - ${new Date(invoice.period_to).toLocaleDateString('en-GB')}</td></tr>
            <tr><td>Bill To:</td><td style="color:#0044cc;">${invoice.invoice_group && invoice.invoice_group !== 'Automático' && invoice.invoice_group !== 'default' ? invoice.invoice_group : client.name}</td></tr>
            <tr><td>Email:</td><td>${client.email}</td></tr>
          </table>
        </td>
      </tr>
    </table>
    
    <table class="main-table">
      <thead>
        <tr><th>Date</th><th>Flat</th><th>Total Hours</th><th>Amount</th></tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    
    <table class="totals-table">
      ${totalHours > 0 ? `
      <tr>
        <td>Total Hours</td>
        <td colspan="2">${formatHours(totalHours)}</td>
      </tr>
      ` : ''}
      ${(weekdaysHours > 0 || weekdaysAmount > 0) ? `
      <tr>
        <td>Weekdays Hours</td>
        <td>${formatHours(weekdaysHours)}</td>
        <td>£${weekdaysAmount.toFixed(2)}</td>
      </tr>
      ` : ''}
      ${(holidaysHours > 0 || holidaysAmount > 0) ? `
      <tr>
        <td>Bank Holiday</td>
        <td>${formatHours(holidaysHours)}</td>
        <td>£${holidaysAmount.toFixed(2)}</td>
      </tr>
      ` : ''}
      ${(weekendsHours > 0 || weekendsAmount > 0) ? `
      <tr style="background-color: #fff2cc;">
        <td>Weekends Hours</td>
        <td>${formatHours(weekendsHours)}</td>
        <td>£${weekendsAmount.toFixed(2)}</td>
      </tr>
      ` : ''}
      ${projectsAmount > 0 ? `
      <tr>
        <td>Projects (Fixed Rate)</td>
        <td>-</td>
        <td>£${projectsAmount.toFixed(2)}</td>
      </tr>
      ` : ''}
      ${totalExtras > 0 ? `
      <tr>
        <td>${extraLabel} (Jobs)</td>
        <td colspan="2" style="text-align:center;">£${totalExtras.toFixed(2)}</td>
      </tr>
      ` : ''}
      ${extrasHtml}
      <tr>
        <td class="grand-total" colspan="2">TOTAL</td>
        <td class="grand-total-val" style="background:#dce5d8; border-left:none;">£${invoice.total_amount.toFixed(2)}</td>
      </tr>
    </table>
    
    <div class="payment-info">Payment info :</div>
    <div class="bank-details">
      Bank details: ${config.bank_name || 'Elita Aparecida de Oliveira'}<br>
      Sort code : ${config.sort_code || '23-14-70'}<br>
      Account number : ${config.account_number || '46630320'}
    </div>
  </div>
  <script>window.print();</script>
</body>
</html>`;
}

export function renderPayslipHtml(payroll, jobs, employee) {
  function formatHours(h) {
    if (h == null) return '00:00';
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  let totalHours = 0;
  
  const groupedJobs = {};
  jobs.forEach(j => {
    const rawDate = j.requested_date || j.finished_at || '';
    const dateKey = rawDate ? rawDate.slice(0, 10) : '-';
    const flatKey = j.flat_address || j.flatAddress || j.flat_id || '-';
    const key = `${dateKey}_${flatKey}`;
    
    if (!groupedJobs[key]) {
      groupedJobs[key] = {
        dateStr: rawDate ? new Date(rawDate).toLocaleDateString('en-GB') : '-',
        clientName: j.client_name || '',
        flatAddress: flatKey,
        durationHours: 0,
        employeeAmount: 0,
        d: rawDate ? new Date(rawDate) : new Date()
      };
    }
    groupedJobs[key].durationHours += (j.duration_hours || 0);
    groupedJobs[key].employeeAmount += (j.employeeAmount || j.employee_amount || 0);
  });

  const rows = Object.values(groupedJobs)
  .sort((a, b) => a.d - b.d)
  .map(g => {
    const hoursStr = formatHours(g.durationHours);
    totalHours += g.durationHours;
    
    return `<tr>
      <td style="text-align:center;">${g.dateStr}</td>
      <td style="text-align:center;">${g.clientName}</td>
      <td style="text-align:center;">${g.flatAddress}</td>
      <td style="text-align:center;">${hoursStr}</td>
      <td style="text-align:right;">£${g.employeeAmount.toFixed(2)}</td>
    </tr>`;
  }).join('');

  let extrasHtml = '';
  try {
    const extrasArr = JSON.parse(payroll.extras_json || '[]');
    extrasArr.forEach(e => {
      extrasHtml += `
      <tr>
        <td colspan="4" style="text-align:right;">${e.description} (x${e.quantity})</td>
        <td style="text-align:right; font-weight:bold; color: ${e.total < 0 ? '#d45555' : '#34c38f'};">£${Number(e.total).toFixed(2)}</td>
      </tr>`;
    });
  } catch(e) {}

  let clientHeader = '';
  if (payroll.client_name) {
    clientHeader = `<p style="font-weight: bold; margin-top: -10px; color: #555;">Client: ${payroll.client_name}</p>`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payslip - ${employee.name}</title>
  <style>
    body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; color: #333; }
    .invoice-box { max-width: 800px; margin: auto; border: 1px solid #ccc; padding: 20px; border-radius: 8px; }
    .header { text-align: center; margin-bottom: 20px; }
    .header h2 { margin: 0; color: #0044cc; }
    .details { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .main-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .main-table th, .main-table td { border: 1px solid #ddd; padding: 8px; }
    .main-table th { background: #f4f4f4; }
    .totals { text-align: right; font-size: 18px; font-weight: bold; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="no-print" style="padding: 16px; text-align: center; background: #151b25;">
    <button onclick="window.close(); if(!window.closed) window.location.href='/';" style="padding: 12px 24px; font-size: 16px; cursor: pointer; border-radius: 8px; border: none; background: #3b82f6; color: white; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">← Voltar para o App</button>
  </div>
  <div class="invoice-box">
    <div class="header">
      <img src="/icon-512.png" alt="Fantastic BNB" style="max-width: 200px; max-height: 100px; object-fit: contain; margin-bottom: 10px;" />
      <p style="margin: 0;">Contractor Payment Summary</p>
      ${clientHeader}
    </div>
    <div class="details">
      <div>
        <strong>Contractor:</strong> ${employee.name}<br>
        <strong>Email:</strong> ${employee.email}
      </div>
      <div>
        <strong>Period:</strong> ${new Date(payroll.period_from).toLocaleDateString('en-GB')} - ${new Date(payroll.period_to).toLocaleDateString('en-GB')}<br>
        <strong>Summary nº:</strong> #${payroll.id}
      </div>
    </div>
    <table class="main-table">
      <thead>
        <tr><th>Date</th><th>Client</th><th>Flat</th><th>Hours</th><th>Amount</th></tr>
      </thead>
      <tbody>
        ${rows}
        ${extrasHtml}
      </tbody>
    </table>
    <div class="totals">
      <p>Total Hours: ${formatHours(totalHours)}</p>
      <p style="font-size: 24px; color: #0044cc;">Total Amount: £${payroll.total_amount.toFixed(2)}</p>
    </div>
  </div>
  <script>window.print();</script>
</body>
</html>`;
}
