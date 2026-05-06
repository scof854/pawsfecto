import { handleCors, json, methodNotAllowed } from '../../lib/http';

export default function handler(req: any, res: any) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST', 'OPTIONS']);

  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  const actual = req.headers['x-telegram-bot-api-secret-token'];
  if (expected && actual !== expected) return json(res, 401, { message: 'Unauthorized' });

  return json(res, 200, { ok: true });
}
