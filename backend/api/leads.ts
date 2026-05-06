import { prisma } from '../lib/prisma';
import { sendLeadToTelegram } from '../lib/telegram';
import {
  handleCors,
  getRequestBody,
  getRequestIp,
  json,
  methodNotAllowed,
} from '../lib/http';
import { validateLeadPayload } from '../lib/validation';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST', 'OPTIONS']);

  const parsed = validateLeadPayload(await getRequestBody(req));
  if (!parsed.ok) return json(res, 400, { message: parsed.message });

  const lead = await prisma.lead.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      message: parsed.data.message,
      source: parsed.data.source,
      ip: getRequestIp(req),
      userAgent: String(req.headers['user-agent'] ?? '').slice(0, 500) || undefined,
    },
  });

  try {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { attempts: { increment: 1 } },
    });
    await sendLeadToTelegram(lead);
    const sentLead = await prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'SENT', sentAt: new Date(), lastError: null },
    });
    return json(res, 202, {
      id: sentLead.id,
      status: sentLead.status,
      createdAt: sentLead.createdAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failedLead = await prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'FAILED', attempts: 1, lastError: message.slice(0, 500) },
    });
    return json(res, 202, {
      id: failedLead.id,
      status: failedLead.status,
      createdAt: failedLead.createdAt,
      warning: 'Lead saved, but Telegram delivery failed',
    });
  }
}
