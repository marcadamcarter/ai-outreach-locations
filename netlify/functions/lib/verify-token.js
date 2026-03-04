const crypto = require('crypto');

const SECRET = process.env.SESSION_SECRET;

/**
 * Create an HMAC-signed token encoding email + expiry.
 * Format: base64(JSON({email, exp})).signature
 */
function createToken(email) {
  const payload = {
    email,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
  return payloadB64 + '.' + sig;
}

/**
 * Verify and decode a token. Returns { email } or null if invalid/expired.
 */
function verifyToken(token) {
  if (!token || !SECRET) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('base64url');

  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}

/**
 * Extract and verify token from Authorization header.
 * Returns { email } or null.
 */
function verifyRequest(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  return verifyToken(token);
}

module.exports = { createToken, verifyToken, verifyRequest };
