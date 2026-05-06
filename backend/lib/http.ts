export function handleCors(req: any, res: any) {
  const requestOrigin = req.headers.origin;
  const allowedOrigin = getAllowedOrigin(requestOrigin);

  if (allowedOrigin) res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Telegram-Bot-Api-Secret-Token');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}

export async function getRequestBody(req: any) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString('utf8') || '{}');

  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

export function getRequestIp(req: any) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim();
  return req.socket?.remoteAddress;
}

export function json(res: any, status: number, body: unknown) {
  res.status(status).json(body);
}

export function methodNotAllowed(res: any, allow: string[]) {
  res.setHeader('Allow', allow.join(', '));
  return json(res, 405, { message: 'Method not allowed' });
}

function getAllowedOrigin(requestOrigin?: string) {
  const raw = process.env.CORS_ORIGIN;
  if (!raw || raw.trim() === '*') return '*';

  const allowed = raw.split(',').map((origin: string) => origin.trim()).filter(Boolean);
  if (requestOrigin && allowed.includes(requestOrigin)) return requestOrigin;
  return allowed[0];
}
