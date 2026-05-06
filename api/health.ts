import { handleCors, json, methodNotAllowed } from '../lib/http';

export default function handler(req: any, res: any) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET', 'OPTIONS']);

  return json(res, 200, {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}
