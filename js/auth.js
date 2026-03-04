/**
 * Auth module — manages scout login state via localStorage.
 * Token format: base64url(payload).signature (HMAC-signed, 24hr expiry)
 */
const Auth = {
  TOKEN_KEY: 'scout_token',
  SCOUT_KEY: 'scout_data',

  /** Save token + scout data after login */
  login(token, scout) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.SCOUT_KEY, JSON.stringify(scout));
    this.updateUI();
  },

  /** Clear auth state */
  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.SCOUT_KEY);
    this.updateUI();
    window.location.href = 'index.html';
  },

  /** Get stored token (or null) */
  getToken() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return null;

    // Check client-side expiry
    try {
      const payloadB64 = token.split('.')[0];
      const base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
      const payload = JSON.parse(atob(padded));
      if (payload.exp < Date.now()) {
        this.logout();
        return null;
      }
    } catch {
      return null;
    }
    return token;
  },

  /** Get stored scout data */
  getScout() {
    try {
      return JSON.parse(localStorage.getItem(this.SCOUT_KEY));
    } catch {
      return null;
    }
  },

  /** Check if logged in */
  isLoggedIn() {
    return !!this.getToken();
  },

  /** Redirect to login if not authenticated */
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },

  /** Update header nav based on login state */
  updateUI() {
    const nav = document.querySelector('.header-nav');
    if (!nav) return;

    if (this.isLoggedIn()) {
      const scout = this.getScout();
      nav.innerHTML = `
        <a href="add-location.html">Add Location</a>
        <span style="color:var(--text-muted);font-size:0.85rem">${scout ? scout.name : 'Scout'}</span>
        <a href="#" onclick="Auth.logout();return false;" class="btn btn-secondary btn-sm">Log Out</a>
      `;
    } else {
      nav.innerHTML = `
        <a href="login.html">Log In</a>
        <a href="register.html" class="btn btn-primary btn-sm">Register</a>
      `;
    }
  },

  /** Initialize auth UI on page load */
  init() {
    this.updateUI();
  }
};

document.addEventListener('DOMContentLoaded', () => Auth.init());
