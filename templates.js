export function renderInvoiceHtml(invoice, jobs, client, config) {
  // calculate subtotals
  let weekdaysHours = 0, weekdaysAmount = 0;
  let weekendsHours = 0, weekendsAmount = 0;
  let holidaysHours = 0, holidaysAmount = 0;
  let totalHours = 0;
  let totalExtras = 0;
  let extraLabel = 'BED LINEN'; // fallback
  
  const rows = jobs.map(j => {
    const d = new Date(j.finished_at);
    const dateStr = d.toLocaleDateString('en-GB'); // DD/MM/YYYY
    const hoursStr = j.duration_hours ? j.duration_hours.toFixed(2).replace('.', ':') : '0:00'; // simplified
    
    // Grouping
    const isWknd = (d.getDay() === 0 || d.getDay() === 6);
    if (j.is_holiday) {
      holidaysHours += (j.duration_hours || 0);
      holidaysAmount += (j.client_amount || 0);
    } else if (isWknd) {
      weekendsHours += (j.duration_hours || 0);
      weekendsAmount += (j.client_amount || 0);
    } else {
      weekdaysHours += (j.duration_hours || 0);
      weekdaysAmount += (j.client_amount || 0);
    }
    totalHours += (j.duration_hours || 0);
    
    if (j.extra_amount) {
      totalExtras += j.extra_amount;
      if (j.extra_label) extraLabel = j.extra_label;
    }
    
    return `<tr>
      <td style="text-align:center;">${dateStr}</td>
      <td style="text-align:center;">${j.flat_address || ''}</td>
      <td style="text-align:center;">${hoursStr}</td>
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
      totalExtras += Number(e.total);
    });
  } catch(e) {}

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice #${invoice.id}</title>
  <style>
    body { font-family: 'Times New Roman', serif; margin: 0; padding: 20px; color: #000; }
    .invoice-box { max-width: 800px; margin: auto; border: 2px solid #000; padding: 0; }
    .header-table { width: 100%; border-collapse: collapse; }
    .header-table td { border: 1px solid #000; padding: 8px; font-size: 16px; font-weight: bold; }
    .logo-cell { width: 40%; text-align: center; vertical-align: middle; padding: 10px; }
    .details-cell { padding: 0 !important; }
    .details-table { width: 100%; border-collapse: collapse; }
    .details-table td { border-bottom: 1px solid #000; padding: 6px 12px; }
    .details-table tr:last-child td { border-bottom: none; }
    .details-table td:first-child { width: 120px; }
    
    .main-table { width: 100%; border-collapse: collapse; margin-top: -1px; }
    .main-table th { padding: 10px; font-size: 18px; border-top: 1px solid #000; }
    .main-table td { padding: 4px 10px; font-size: 16px; }
    
    .totals-table { width: 100%; border-collapse: collapse; border-top: 2px solid #000; }
    .totals-table td { border: 1px solid #000; padding: 6px 12px; font-size: 16px; }
    .totals-table td:first-child { width: 250px; text-align: center; font-weight: bold; }
    .totals-table td:nth-child(2) { text-align: center; }
    .totals-table td:nth-child(3) { text-align: right; font-weight: bold; width: 150px; }
    
    .grand-total { background: #dce5d8; font-size: 48px !important; font-weight: normal !important; text-align: center; padding: 10px !important; }
    .grand-total-val { font-size: 48px !important; text-align: right; }
    
    .payment-info { background: #999; text-align: center; color: #fff; font-weight: bold; font-size: 18px; padding: 4px; border: 1px solid #000; }
    .bank-details { text-align: center; padding: 10px; font-size: 18px; font-weight: bold; border: 1px solid #000; border-top: none; }
  </style>
</head>
<body>
  <div class="invoice-box">
    <table class="header-table">
      <tr>
        <td class="logo-cell">
          <img src="/icon-512.png" alt="Fantastic BNB" style="max-width: 80%; max-height: 120px; object-fit: contain;" />
        </td>
        <td class="details-cell">
          <table class="details-table">
            <tr><td>Email:</td><td>fantasticbnbservicss@gmail.com</td></tr>
            <tr><td>Invoice nº</td><td>#${invoice.id}</td></tr>
            <tr><td>Period:</td><td>${new Date(invoice.period_from).toLocaleDateString('en-GB')} - ${new Date(invoice.period_to).toLocaleDateString('en-GB')}</td></tr>
            <tr><td>Bill To:</td><td style="color:#0044cc;">${client.name}</td></tr>
            <tr><td>Email:</td><td>${client.email}</td></tr>
          </table>
        </td>
      </tr>
    </table>
    
    <table class="main-table">
      <thead>
        <tr><th>Date</th><th>Flat</th><th>Total Hours</th></tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    
    <table class="totals-table">
      <tr>
        <td>Total Hours</td>
        <td colspan="2">${totalHours.toFixed(2).replace('.', ':')}</td>
      </tr>
      <tr>
        <td>Weekdays Hours</td>
        <td>${weekdaysHours.toFixed(2).replace('.', ':')}</td>
        <td>£${weekdaysAmount.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Bank Holiday</td>
        <td>${holidaysHours.toFixed(2).replace('.', ':')}</td>
        <td>£${holidaysAmount.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Weekends Hours</td>
        <td>${weekendsHours.toFixed(2).replace('.', ':')}</td>
        <td>£${weekendsAmount.toFixed(2)}</td>
      </tr>
      ${totalExtras > 0 || extrasHtml !== '' ? `
      <tr>
        <td>${extraLabel} (Jobs)</td>
        <td colspan="2" style="text-align:center;">£${(totalExtras - (extrasHtml !== '' ? totalExtras : 0)).toFixed(2)}</td>
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
  let totalHours = 0;
  
  const rows = jobs.map(j => {
    const d = new Date(j.finished_at);
    const dateStr = d.toLocaleDateString('en-GB');
    const hoursStr = j.duration_hours ? j.duration_hours.toFixed(2).replace('.', ':') : '0:00';
    totalHours += (j.duration_hours || 0);
    
    return `<tr>
      <td style="text-align:center;">${dateStr}</td>
      <td style="text-align:center;">${j.client_name || ''}</td>
      <td style="text-align:center;">${j.flatAddress || j.flat_address || ''}</td>
      <td style="text-align:center;">${hoursStr}</td>
      <td style="text-align:right;">£${(j.employeeAmount || j.employee_amount || 0).toFixed(2)}</td>
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
  </style>
</head>
<body>
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
      <p>Total Hours: ${totalHours.toFixed(2).replace('.', ':')}</p>
      <p style="font-size: 24px; color: #0044cc;">Total Amount: £${payroll.total_amount.toFixed(2)}</p>
    </div>
  </div>
  <script>window.print();</script>
</body>
</html>`;
}
