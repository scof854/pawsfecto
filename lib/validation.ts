type LeadPayload = {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  source?: string;
};

const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLeadPayload(raw: unknown):
  | { ok: true; data: LeadPayload }
  | { ok: false; message: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, message: 'Invalid JSON body' };

  const body = raw as Record<string, unknown>;
  if (typeof body.website === 'string' && body.website.length > 0) {
    return { ok: false, message: 'spam detected' };
  }

  const name = sanitize(body.name);
  const phone = trim(body.phone);
  const email = trim(body.email);
  const message = sanitize(body.message);
  const source = sanitize(body.source);

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

function trim(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitize(value: unknown) {
  return trim(value).replace(/<[^>]*>/g, '').trim();
}
