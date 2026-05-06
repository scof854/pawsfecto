export const LEADS_QUEUE = 'leads';
export const NOTIFY_TELEGRAM_JOB = 'notify-telegram';

export interface LeadJobPayload {
  leadId: string;
}
