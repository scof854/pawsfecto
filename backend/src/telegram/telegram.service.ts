import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Lead } from '@prisma/client';

const TELEGRAM_API_TIMEOUT_MS = 8_000;

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly chatId: string;
  private readonly apiBase: string;

  constructor(private readonly config: ConfigService) {
    this.botToken = this.config.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    this.chatId = this.config.getOrThrow<string>('TELEGRAM_CHAT_ID');
    this.apiBase = `https://api.telegram.org/bot${this.botToken}`;
  }

  async sendLead(lead: Lead): Promise<void> {
    await this.callApi('sendMessage', {
      chat_id: this.chatId,
      text: this.formatLead(lead),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
  }

  async setWebhook(url: string, secretToken?: string): Promise<void> {
    await this.callApi('setWebhook', {
      url,
      secret_token: secretToken,
      allowed_updates: ['message', 'callback_query'],
    });
  }

  async deleteWebhook(): Promise<void> {
    await this.callApi('deleteWebhook', { drop_pending_updates: false });
  }

  private async callApi(method: string, payload: Record<string, unknown>): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TELEGRAM_API_TIMEOUT_MS);
    try {
      const res = await fetch(`${this.apiBase}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = (await res.json()) as {
        ok: boolean;
        description?: string;
        result?: unknown;
        error_code?: number;
        parameters?: { retry_after?: number };
      };
      if (!res.ok || !data.ok) {
        const retryAfter = data.parameters?.retry_after;
        const detail = retryAfter ? ` (retry_after=${retryAfter}s)` : '';
        throw new Error(
          `Telegram ${method} failed: ${res.status} ${data.error_code ?? ''} ${data.description ?? 'unknown error'}${detail}`.trim(),
        );
      }
      return data.result;
    } finally {
      clearTimeout(timer);
    }
  }

  private formatLead(lead: Lead): string {
    const lines: string[] = [
      '🐾 <b>Новая заявка с сайта Pawfecto</b>',
      '',
      `<b>Имя:</b> ${escapeHtml(lead.name)}`,
      `<b>Телефон:</b> ${escapeHtml(lead.phone)}`,
    ];
    if (lead.email) lines.push(`<b>Email:</b> ${escapeHtml(lead.email)}`);
    if (lead.source) lines.push(`<b>Источник:</b> ${escapeHtml(lead.source)}`);
    if (lead.message) {
      lines.push('', '<b>Сообщение:</b>', `<i>${escapeHtml(lead.message)}</i>`);
    }
    lines.push(
      '',
      `🕒 ${new Date(lead.createdAt).toLocaleString('ru-RU', { timeZone: 'Europe/Minsk' })}`,
      `<code>id: ${lead.id}</code>`,
    );
    return lines.join('\n');
  }
}

function escapeHtml(input: string): string {
  return input.replace(/[&<>]/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;',
  );
}
