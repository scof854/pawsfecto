const { handleCors, json, methodNotAllowed } = require('../lib/http');

module.exports = function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET', 'OPTIONS']);

  return json(res, 200, {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};
