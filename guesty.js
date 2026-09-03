// guesty.js — Módulo de Integração com Guesty (PMS)

export function isSameGuest(g1, g2) {
  if (!g1 || !g2) return false;
  if (g1.email && g2.email && g1.email.toLowerCase() === g2.email.toLowerCase()) return true;
  if (g1.phone && g2.phone && g1.phone.length >= 8 && g2.phone.length >= 8 && g1.phone === g2.phone) return true;
  if (g1.name && g2.name) {
    const n1 = g1.name.toLowerCase().trim();
    const n2 = g2.name.toLowerCase().trim();
    if (n1.length >= 4 && n1 === n2) return true;
  }
  return false;
}

export function extractDateStr(val) {
  if (!val) return '';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10);
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

export async function processGuestyReservation({ db, logSystemActivity, notifyAdmins, payload }) {
  const resData = payload.data || payload.reservation || payload;
  const resId = String(resData._id || resData.id || resData.reservationId || '').trim();
  const listingId = String(resData.listingId || resData.listing?._id || resData.listing?.id || '').trim();
  const checkIn = extractDateStr(resData.checkIn || resData.checkInDate || resData.check_in);
  const checkOut = extractDateStr(resData.checkOut || resData.checkOutDate || resData.check_out);
  const status = (resData.status || 'confirmed').toLowerCase();
  const confirmationCode = String(resData.confirmationCode || resData.code || resId);
  const guestObj = resData.guest || {};
  const guestName = (guestObj.fullName || `${guestObj.firstName || ''} ${guestObj.lastName || ''}`.trim() || resData.guestName || 'Hóspede').trim();
  const guestEmail = (guestObj.email || resData.guestEmail || '').toLowerCase().trim();
  const guestPhone = (guestObj.phone || resData.guestPhone || '').replace(/\D/g, '');

  if (!resId || !listingId || !checkIn || !checkOut) {
    return { ok: false, error: 'Campos obrigatórios ausentes no payload (id, listingId, checkIn, checkOut).' };
  }

  // 1. Localizar o Flat cadastrado
  const flat = db.prepare('SELECT * FROM flats WHERE guesty_listing_id = ? AND active = 1').get(listingId);
  if (!flat) {
    return { ok: false, error: `Nenhum flat ativo vinculado ao listingId "${listingId}".` };
  }

  // 2. Salvar/atualizar histórico em guesty_reservations
  db.prepare(`
    INSERT INTO guesty_reservations (id, listing_id, flat_id, confirmation_code, guest_name, guest_email, guest_phone, check_in, check_out, status, raw_payload, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      listing_id = excluded.listing_id,
      flat_id = excluded.flat_id,
      confirmation_code = excluded.confirmation_code,
      guest_name = excluded.guest_name,
      guest_email = excluded.guest_email,
      guest_phone = excluded.guest_phone,
      check_in = excluded.check_in,
      check_out = excluded.check_out,
      status = excluded.status,
      raw_payload = excluded.raw_payload,
      updated_at = CURRENT_TIMESTAMP
  `).run(resId, listingId, flat.id, confirmationCode, guestName, guestEmail, guestPhone, checkIn, checkOut, status, JSON.stringify(payload));

  // 3. Tratamento de Cancelamento
  if (status === 'canceled' || status === 'cancelled' || status === 'declined') {
    const pendingJob = db.prepare("SELECT * FROM jobs WHERE guesty_reservation_id = ? AND status = 'pending'").get(resId);
    if (pendingJob) {
      db.prepare("UPDATE jobs SET status = 'cancelled', notes = COALESCE(notes, '') || ' [Cancelado: Reserva Guesty cancelada]', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(pendingJob.id);
      if (typeof logSystemActivity === 'function') {
        logSystemActivity(null, 'CANCEL', 'job', pendingJob.id, `Serviço cancelado automaticamente: Reserva Guesty #${confirmationCode} cancelada`);
      }
      if (typeof notifyAdmins === 'function') {
        notifyAdmins({
          title: 'Reserva Guesty Cancelada 🚫',
          body: `A reserva no flat ${flat.address} foi cancelada no Guesty. O serviço pendente foi cancelado.`
        }).catch(() => {});
      }
      return { ok: true, action: 'job_cancelled', jobId: pendingJob.id };
    }
    return { ok: true, action: 'reservation_cancelled_no_pending_job' };
  }

  // 4. Detecção de Estadia Contínua / Split Stay (Hóspede que sai no dia checkIn é o mesmo que entra)
  const prevRes = db.prepare(`
    SELECT * FROM guesty_reservations 
    WHERE flat_id = ? AND check_out = ? AND status != 'canceled' AND status != 'cancelled' AND id != ?
    ORDER BY updated_at DESC LIMIT 1
  `).get(flat.id, checkIn, resId);

  const sameGuestAsPrev = prevRes ? isSameGuest(
    { email: guestEmail, phone: guestPhone, name: guestName },
    { email: prevRes.guest_email, phone: prevRes.guest_phone, name: prevRes.guest_name }
  ) : false;

  if (sameGuestAsPrev) {
    // É o MESMO hóspede estendendo a estadia! A limpeza intermediária na data checkIn é desnecessária.
    const intermediateJob = db.prepare(`
      SELECT * FROM jobs 
      WHERE flat_id = ? AND requested_date = ? AND status = 'pending'
      LIMIT 1
    `).get(flat.id, checkIn);

    if (intermediateJob) {
      db.prepare(`
        UPDATE jobs 
        SET status = 'cancelled', 
            notes = COALESCE(notes, '') || ' [Dispensado: Hóspede estendeu estadia]', 
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(intermediateJob.id);

      if (typeof logSystemActivity === 'function') {
        logSystemActivity(null, 'MERGE_STAY', 'job', intermediateJob.id, `Limpeza de ${checkIn} dispensada: Hóspede ${guestName} estendeu a estadia até ${checkOut}`);
      }
      if (typeof notifyAdmins === 'function') {
        notifyAdmins({
          title: 'Estadia Estendida 🔄',
          body: `Flat ${flat.address}: ${guestName} estendeu a estadia até ${checkOut}. Limpeza intermediária de ${checkIn} dispensada automaticamente!`
        }).catch(() => {});
      }
    }
  }

  // 5. Verificar se já existe uma reserva subsequente iniciando no dia checkOut para o MESMO hóspede
  const nextRes = db.prepare(`
    SELECT * FROM guesty_reservations 
    WHERE flat_id = ? AND check_in = ? AND status != 'canceled' AND status != 'cancelled' AND id != ?
    ORDER BY updated_at DESC LIMIT 1
  `).get(flat.id, checkOut, resId);

  const sameGuestAsNext = nextRes ? isSameGuest(
    { email: guestEmail, phone: guestPhone, name: guestName },
    { email: nextRes.guest_email, phone: nextRes.guest_phone, name: nextRes.guest_name }
  ) : false;

  if (sameGuestAsNext) {
    // A estadia deste hóspede continua na próxima reserva, não gera limpeza neste checkOut!
    return {
      ok: true,
      action: 'continuous_stay_no_cleaning',
      message: `Estadia contínua detectada: hóspede ${guestName} continua no flat na próxima reserva (sem limpeza em ${checkOut}).`
    };
  }

  // 6. Verificar se há Back-to-Back (turnover entre hóspedes DIFERENTES)
  let isBackToBack = 0;
  let isUrgent = 0;
  let notes = `Criado via Guesty (Reserva #${confirmationCode}) - Hóspede: ${guestName}`;

  if (nextRes && !sameGuestAsNext) {
    // Próximo hóspede entra no mesmo dia deste checkOut!
    isBackToBack = 1;
    isUrgent = 1;
    notes += ' | ⚠️ BACK-TO-BACK: Novo check-in hoje às 15h!';
  }

  if (prevRes && !sameGuestAsPrev) {
    // Este hóspede está entrando no mesmo dia do check-out de outro hóspede:
    // Garante que o serviço de turnover do dia checkIn seja marcado como urgente/back-to-back
    db.prepare(`
      UPDATE jobs 
      SET is_back_to_back = 1, is_urgent = 1, notes = COALESCE(notes, '') || ' [⚠️ BACK-TO-BACK: Novo check-in hoje]' 
      WHERE flat_id = ? AND requested_date = ? AND status IN ('pending', 'assigned')
    `).run(flat.id, checkIn);
  }

  // 7. Criar ou Atualizar o Serviço de Limpeza de Check-out
  const existingJob = db.prepare('SELECT * FROM jobs WHERE guesty_reservation_id = ?').get(resId);
  let jobId;

  if (existingJob) {
    if (existingJob.status === 'pending') {
      db.prepare(`
        UPDATE jobs 
        SET requested_date = ?, notes = ?, is_back_to_back = ?, is_urgent = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(checkOut, notes, isBackToBack, isUrgent, existingJob.id);
    }
    jobId = existingJob.id;
  } else {
    const targetClientId = flat.client_user_id || 1;
    const result = db.prepare(`
      INSERT INTO jobs (
        flat_id, client_user_id, status, requested_date, notes,
        guesty_reservation_id, guest_name, guest_email, is_back_to_back, is_urgent,
        created_at, updated_at
      ) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      flat.id, targetClientId, checkOut, notes,
      resId, guestName, guestEmail, isBackToBack, isUrgent
    );
    jobId = result.lastInsertRowid;

    if (typeof logSystemActivity === 'function') {
      logSystemActivity(null, 'CREATE_GUESTY', 'job', jobId, `Serviço criado via Guesty para ${checkOut} no flat ${flat.address} (Hóspede: ${guestName})`);
    }
    if (typeof notifyAdmins === 'function') {
      notifyAdmins({
        title: isBackToBack ? 'Novo Serviço ⚠️ Back-to-Back' : 'Novo Serviço Automático 🧹',
        body: `${flat.address} tem check-out agendado para ${checkOut}${isBackToBack ? ' (Back-to-Back: novo check-in hoje!)' : ''}.`
      }).catch(() => {});
    }
  }

  return {
    ok: true,
    action: existingJob ? 'job_updated' : 'job_created',
    jobId,
    checkOut,
    isBackToBack,
    isUrgent
  };
}
