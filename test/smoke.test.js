import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Helper de arredondamento financeiro oficial do Fantastic BNB
function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

// Sanitização XSS padrão do sistema
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

describe('1. Integridade de Cálculos Financeiros (Servidor como Autoridade)', () => {
  it('deve eliminar imprecisões de ponto flutuante (ex: 0.1 + 0.2 = 0.3)', () => {
    const raw = 0.1 + 0.2;
    assert.notEqual(raw, 0.3); // Prova da imprecisão padrão do JS
    const sanitized = roundCurrency(raw);
    assert.equal(sanitized, 0.3);
  });

  it('deve calcular corretamente diárias baseadas em horas trabalhadas e tarifa', () => {
    const hours = 2.75; // 2h45min
    const rate = 16.50; // £16.50/hr
    const total = roundCurrency(hours * rate);
    assert.equal(total, 45.38); // 45.375 arredondado para cima com EPSILON
  });

  it('deve calcular o faturamento e margem de lucro com precisão exata', () => {
    const revenue = 9461.14;
    const expenses = 7674.27;
    const netProfit = roundCurrency(revenue - expenses);
    const marginPct = roundCurrency((netProfit / revenue) * 100);

    assert.equal(netProfit, 1786.87);
    assert.equal(marginPct, 18.89);
  });

  it('deve somar faturas e itens extras sem perda de centavos', () => {
    const items = [120.00, 45.50, 12.35, 18.99, 3.16];
    const sum = roundCurrency(items.reduce((acc, curr) => acc + curr, 0));
    assert.equal(sum, 200.00);
  });
});

describe('2. Invariantes de Negócio & Auditoria (Zero Deleção Destrutiva)', () => {
  it('deve exigir motivo obrigatório para cancelamento de serviço', () => {
    function validateCancellation(payload) {
      const reason = (payload.cancellation_reason || payload.notes || '').trim();
      if (!reason) {
        throw new Error('Motivo de cancelamento obrigatório.');
      }
      return { status: 'cancelled', cancellation_reason: reason };
    }

    // Caso inválido: sem motivo
    assert.throws(() => {
      validateCancellation({ cancellation_reason: '' });
    }, /Motivo de cancelamento obrigatório/);

    // Caso inválido: só espaços
    assert.throws(() => {
      validateCancellation({ cancellation_reason: '   ' });
    }, /Motivo de cancelamento obrigatório/);

    // Caso válido
    const valid = validateCancellation({ cancellation_reason: 'Hóspede estendeu a reserva por mais 2 dias' });
    assert.equal(valid.status, 'cancelled');
    assert.equal(valid.cancellation_reason, 'Hóspede estendeu a reserva por mais 2 dias');
  });

  it('deve gerar payload de auditoria para inserção em system_logs', () => {
    function createAuditLogEntry(userId, userName, action, entity, details) {
      assert.ok(userId, 'Log deve identificar o usuário');
      assert.ok(action, 'Log deve identificar a ação');
      assert.ok(entity, 'Log deve identificar a entidade afetada');
      return {
        user_id: userId,
        user_name: userName,
        action: action.toUpperCase(),
        entity: entity.toUpperCase(),
        details: String(details),
        created_at: new Date().toISOString()
      };
    }

    const log = createAuditLogEntry(1, 'Admin CleanOps', 'CANCEL_JOB', 'JOB', 'Serviço #142 cancelado. Motivo: Chuva forte');
    assert.equal(log.action, 'CANCEL_JOB');
    assert.equal(log.entity, 'JOB');
    assert.match(log.details, /Chuva forte/);
    assert.ok(log.created_at);
  });
});

describe('3. Segurança & Higienização XSS (OWASP)', () => {
  it('deve neutralizar caracteres perigosos de injeção XSS', () => {
    const dangerousInput = '<script>alert("XSS")</script>&<img src=x onerror=hack()>';
    const safeOutput = escapeHtml(dangerousInput);

    assert.ok(!safeOutput.includes('<script>'));
    assert.ok(!safeOutput.includes('</script>'));
    assert.ok(safeOutput.includes('&lt;script&gt;'));
    assert.ok(safeOutput.includes('&amp;'));
    assert.ok(safeOutput.includes('&quot;'));
  });

  it('deve tratar entradas nulas ou vazias sem quebrar', () => {
    assert.equal(escapeHtml(null), '');
    assert.equal(escapeHtml(undefined), '');
    assert.equal(escapeHtml(''), '');
  });
});

describe('4. Resiliência de APIs Externas & Rate Limiting (Resend)', () => {
  it('deve identificar erro HTTP 429 e acionar lógica de retry com backoff', () => {
    function shouldRetryOnRateLimit(errorStatus, errorCode) {
      return errorStatus === 429 || errorCode === 'rate_limit_exceeded';
    }

    assert.equal(shouldRetryOnRateLimit(429, 'rate_limit_exceeded'), true);
    assert.equal(shouldRetryOnRateLimit(429, null), true);
    assert.equal(shouldRetryOnRateLimit(null, 'rate_limit_exceeded'), true);
    assert.equal(shouldRetryOnRateLimit(400, 'bad_request'), false);
    assert.equal(shouldRetryOnRateLimit(500, 'internal_error'), false);
  });

  it('deve calcular intervalos de backoff exponencial progressivo para filas de envio', () => {
    function calculateBackoff(attempt, baseDelayMs = 1200) {
      return baseDelayMs * Math.pow(1.5, attempt);
    }

    const attempt0 = calculateBackoff(0, 1200); // 1200ms
    const attempt1 = calculateBackoff(1, 1200); // 1800ms
    const attempt2 = calculateBackoff(2, 1200); // 2700ms

    assert.equal(attempt0, 1200);
    assert.equal(attempt1, 1800);
    assert.equal(attempt2, 2700);
  });
});

describe('5. Temporizador e Agendamento Recorrente Mid Stay', () => {
  function generateRecurrenceDates(startDateStr, frequency, endType, count, endDateStr) {
    const stepDays = frequency === 'biweekly' ? 14 : 7;
    const dates = [];
    const parts = (startDateStr || '').split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return [startDateStr];

    let cur = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));

    if (endType === 'count') {
      const total = Math.min(Math.max(Number(count) || 2, 2), 52);
      for (let i = 0; i < total; i++) {
        const y = cur.getUTCFullYear();
        const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
        const d = String(cur.getUTCDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        cur.setUTCDate(cur.getUTCDate() + stepDays);
      }
    } else if (endType === 'date' && endDateStr) {
      const endParts = endDateStr.split('-').map(Number);
      if (endParts.length === 3 && !endParts.some(isNaN)) {
        const end = new Date(Date.UTC(endParts[0], endParts[1] - 1, endParts[2], 12, 0, 0));
        let iterations = 0;
        while (cur <= end && iterations < 52) {
          const y = cur.getUTCFullYear();
          const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
          const d = String(cur.getUTCDate()).padStart(2, '0');
          dates.push(`${y}-${m}-${d}`);
          cur.setUTCDate(cur.getUTCDate() + stepDays);
          iterations++;
        }
      }
    }

    if (dates.length === 0) dates.push(startDateStr);
    return dates;
  }

  it('deve gerar datas semanais (+7 dias) com base na quantidade solicitada', () => {
    const dates = generateRecurrenceDates('2026-11-16', 'weekly', 'count', 4);
    assert.deepEqual(dates, [
      '2026-11-16',
      '2026-11-23',
      '2026-11-30',
      '2026-12-07'
    ]);
    assert.equal(dates.length, 4);
  });

  it('deve gerar datas quinzenais (+14 dias) com base na quantidade solicitada', () => {
    const dates = generateRecurrenceDates('2026-11-16', 'biweekly', 'count', 3);
    assert.deepEqual(dates, [
      '2026-11-16',
      '2026-11-30',
      '2026-12-14'
    ]);
    assert.equal(dates.length, 3);
  });

  it('deve gerar datas semanais até a data final de checkout do hóspede', () => {
    const dates = generateRecurrenceDates('2026-11-16', 'weekly', 'date', null, '2026-12-05');
    assert.deepEqual(dates, [
      '2026-11-16',
      '2026-11-23',
      '2026-11-30'
    ]);
    assert.equal(dates.length, 3);
  });

  it('deve isolar a série em grupo recorrente com índices sequenciais', () => {
    const seriesDates = generateRecurrenceDates('2026-11-16', 'weekly', 'count', 3);
    const groupId = 'REC-TEST-123';
    const series = seriesDates.map((date, idx) => ({
      requested_date: date,
      recurrence_type: 'weekly',
      recurrence_group_id: groupId,
      recurrence_index: idx + 1,
      recurrence_total: seriesDates.length
    }));

    assert.equal(series[0].recurrence_index, 1);
    assert.equal(series[1].recurrence_index, 2);
    assert.equal(series[2].recurrence_index, 3);
    assert.equal(series[0].recurrence_total, 3);
    assert.equal(series[0].recurrence_group_id, groupId);
  });

  it('deve permitir cancelar apenas o serviço atual ou a série futura', () => {
    const mockJobs = [
      { id: 101, requested_date: '2026-11-16', status: 'pending', recurrence_group_id: 'REC-G1' },
      { id: 102, requested_date: '2026-11-23', status: 'pending', recurrence_group_id: 'REC-G1' },
      { id: 103, requested_date: '2026-11-30', status: 'pending', recurrence_group_id: 'REC-G1' },
    ];

    function cancelJobs(targetId, scope) {
      const target = mockJobs.find(j => j.id === targetId);
      if (scope === 'future') {
        return mockJobs.filter(j => j.recurrence_group_id === target.recurrence_group_id && j.requested_date >= target.requested_date);
      }
      return [target];
    }

    // Cancelar apenas o segundo
    const cancelSingle = cancelJobs(102, 'this');
    assert.equal(cancelSingle.length, 1);
    assert.equal(cancelSingle[0].id, 102);

    // Cancelar do segundo em diante
    const cancelFuture = cancelJobs(102, 'future');
    assert.equal(cancelFuture.length, 2);
    assert.deepEqual(cancelFuture.map(j => j.id), [102, 103]);
  });
});

describe('6. Paginação de Documentos Financeiros (finChangePage)', () => {
  it('deve avançar e retroceder páginas respeitando os limites', () => {
    const total = 34; // 34 documentos como na foto do usuário
    const perPage = 10;
    const totalPages = Math.ceil(total / perPage); // 4 páginas

    let currentPage = 1;
    function finChangePage(delta) {
      currentPage = Math.max(1, Math.min(totalPages, currentPage + delta));
      return currentPage;
    }

    assert.equal(totalPages, 4);
    assert.equal(finChangePage(1), 2); // Página 2
    assert.equal(finChangePage(1), 3); // Página 3
    assert.equal(finChangePage(1), 4); // Página 4
    assert.equal(finChangePage(1), 4); // Trava no limite máximo (página 4)
    assert.equal(finChangePage(-1), 3); // Retorna para página 3
    assert.equal(finChangePage(-10), 1); // Trava no limite mínimo (página 1)
  });
});
