const METHODS_DEFAULT = 'GET,POST,OPTIONS';
const HEADERS_DEFAULT = 'Content-Type';

function parseAllowedOrigins() {
  return process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) || [];
}

export function applyCors(req, res, { methods = METHODS_DEFAULT, headers = HEADERS_DEFAULT } = {}) {
  const allowedOrigins = parseAllowedOrigins();
  const origin = req.headers.origin;

  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', headers);
  res.setHeader('Vary', 'Origin');

  if (!allowedOrigins.length) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return { allowed: true, origin: '*' };
  }

  if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
    return { allowed: true, origin: allowedOrigins[0] };
  }

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    return { allowed: true, origin };
  }

  return { allowed: false, origin };
}
