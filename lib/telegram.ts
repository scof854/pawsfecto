import type { Lead } from '@prisma/client';

const TELEGRAM_API_TIMEOUT_MS = 8_000;

export async function sendLeadToTelegram(lead: Lead) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN is not set');
  if (!chatId) throw new Error('TELEGRAM_CHAT_ID is not set');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TELEGRAM_API_TIMEOUT_MS);

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: formatLead(lead),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });
    const data = (await response.json()) as {
      ok: boolean;
      description?: string;
      error_code?: number;
      parameters?: { retry_after?: number };
    };

    if (!response.ok || !data.ok) {
      const retryAfter = data.parameters?.retry_after;
      const detail = retryAfter ? ` (retry_after=${retryAfter}s)` : '';
      throw new Error(
        `Telegram sendMessage failed: ${response.status} ${data.error_code ?? ''} ${data.description ?? 'unknown error'}${detail}`.trim(),
      );
    }
  } finally {
    clearTimeout(timer);
  }
}

function formatLead(lead: Lead) {
  const lines = [
    '🐾 <b>Новая заявка с сайта Pawfecto</b>',
    '',
    `<b>Имя:</b> ${escapeHtml(lead.name)}`,
    `<b>Телефон:</b> ${escapeHtml(lead.phone)}`,
  ];

  if (lead.email) lines.push(`<b>Email:</b> ${escapeHtml(lead.email)}`);
  if (lead.source) lines.push(`<b>Источник:</b> ${escapeHtml(lead.source)}`);
  if (lead.message) lines.push('', '<b>Сообщение:</b>', `<i>${escapeHtml(lead.message)}</i>`);

  lines.push(
    '',
    `🕒 ${new Date(lead.createdAt).toLocaleString('ru-RU', { timeZone: 'Europe/Minsk' })}`,
    `<code>id: ${lead.id}</code>`,
  );

  return lines.join('\n');
}

function escapeHtml(input: string) {
  return input.replace(/[&<>]/g, (char) =>
    char === '&' ? '&amp;' : char === '<' ? '&lt;' : '&gt;',
  );
}
