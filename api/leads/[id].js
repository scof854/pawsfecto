const { handleCors, json, methodNotAllowed } = require('../../lib/http');
const { prisma } = require('../../lib/prisma');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET', 'OPTIONS']);

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!id || !UUID_RE.test(id)) return json(res, 400, { message: 'Invalid lead id' });

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return json(res, 404, { message: `Lead ${id} not found` });

  return json(res, 200, lead);
};
