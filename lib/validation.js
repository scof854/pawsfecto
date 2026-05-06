const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLeadPayload(raw) {
  if (!raw || typeof raw !== 'object') return { ok: false, message: 'Invalid JSON body' };

  if (typeof raw.website === 'string' && raw.website.length > 0) {
    return { ok: false, message: 'spam detected' };
  }

  const name = sanitize(raw.name);
  const phone = trim(raw.phone);
  const email = trim(raw.email);
  const message = sanitize(raw.message);
  const source = sanitize(raw.source);

  if (!name || name.length < 2 || name.length > 80) {
    return { ok: false, message: 'name must be 2-80 characters' };
  }
  if (!phone || !PHONE_RE.test(phone)) {
    return { ok: false, message: 'phone must be a valid phone number' };
  }
  if (email && (email.length > 120 || !EMAIL_RE.test(email))) {
    return { ok: false, message: 'email must be a valid email' };
  }
  if (message && message.length > 2000) {
    return { ok: false, message: 'message must be shorter than 2000 characters' };
  }
  if (source && source.length > 80) {
    return { ok: false, message: 'source must be shorter than 80 characters' };
  }

  return {
    ok: true,
    data: {
      name,
      phone,
      email: email || undefined,
      message: message || undefined,
      source: source || undefined,
    },
  };
}

function trim(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitize(value) {
  return trim(value).replace(/<[^>]*>/g, '').trim();
}

module.exports = { validateLeadPayload };
