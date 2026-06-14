--- server.js
+++ server.js
@@ -683,6 +683,37 @@
     return sendJson(res, 201, { job: hydrateJob(db.prepare('SELECT j.*, f.address AS flat_address, f.billing_type AS flat_billing_type, f.hourly_rate AS flat_hourly_rate, f.project_rate AS flat_project_rate FROM jobs j LEFT JOIN flats f ON f.id = j.flat_id WHERE j.id = ?').get(result.lastInsertRowid)) });
   }
 
+  if (requestUrl.pathname === '/api/jobs/manual' && req.method === 'POST') {
+    if (!isAdminRole(session.user.role)) return sendJson(res, 403, { error: 'Permissao insuficiente.' });
+    const body = await parseBody(req);
+    
+    const flatId = Number(body.flatId);
+    const employeeUserId = Number(body.employeeUserId);
+    const flat = db.prepare('SELECT * FROM flats WHERE id = ?').get(flatId);
+    if (!flat) return sendJson(res, 404, { error: 'Flat nao encontrado.' });
+    
+    const emp = db.prepare('SELECT * FROM users WHERE id = ?').get(employeeUserId);
+    if (!emp) return sendJson(res, 404, { error: 'Funcionario nao encontrado.' });
+
+    const durationHours = Number(body.durationHours) || 0;
+    const isHoliday = body.isHoliday ? 1 : 0;
+    const reqDate = new Date(body.requestedDate);
+    const isWeekend = reqDate.getDay() === 0 || reqDate.getDay() === 6;
+    
+    let employeeRate = isHoliday ? Number(emp.holiday_rate || emp.hourly_rate || 0) : (isWeekend ? Number(emp.weekend_rate || emp.hourly_rate || 0) : Number(emp.hourly_rate || 0));
+    const employeeAmount = roundCurrency(durationHours * employeeRate);
+    
+    const clientAmount = flat.billing_type === 'project' 
+      ? roundCurrency(Number(flat.project_rate || 0)) 
+      : roundCurrency(durationHours * Number(flat.hourly_rate || 0));
+
+    const now = new Date().toISOString();
+    
+    const result = db.prepare('INSERT INTO jobs (flat_id, client_user_id, employee_user_id, status, requested_date, duration_hours, client_amount, employee_amount, is_holiday, notes, invoice_id, payroll_id, created_at, updated_at, finished_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
+      .run(flatId, flat.client_user_id, employeeUserId, 'completed', body.requestedDate, durationHours, clientAmount, employeeAmount, isHoliday, 'Serviço lançado manualmente', body.invoiceId || null, body.payrollId || null, now, now, now);
+      
+    return sendJson(res, 201, { success: true, jobId: result.lastInsertRowid });
+  }
+
   // Job status transitions and edits
   const jobCrudMatch = requestUrl.pathname.match(/^\/api\/jobs\/(\d+)$/);
   if (jobCrudMatch && req.method === 'PUT') {
