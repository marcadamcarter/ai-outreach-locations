/**
 * Generic form handler — extended from ai-outreach-leads with auth support.
 * Collects all named inputs, POSTs JSON to the given endpoint,
 * and shows a success or error alert.
 *
 * Options:
 *   formId, endpoint, submitBtnId, successId, errorId
 *   authRequired  — if true, sends Authorization: Bearer <token> header
 *   method        — HTTP method (default: POST)
 *   onSuccess(data, form) — callback after successful submission
 */
function initForm({ formId, endpoint, submitBtnId, successId, errorId, authRequired, method, onSuccess }) {
  const form    = document.getElementById(formId);
  const btn     = document.getElementById(submitBtnId);
  const success = document.getElementById(successId);
  const error   = document.getElementById(errorId);

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    success.classList.remove('show');
    error.classList.remove('show');

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Check auth if required
    if (authRequired) {
      const token = localStorage.getItem('scout_token');
      if (!token) {
        window.location.href = 'login.html';
        return;
      }
    }

    // Collect all named form fields
    const data = {};
    const formData = new FormData(form);
    formData.forEach((value, key) => {
      if (key.endsWith('[]')) {
        if (!Array.isArray(data[key])) data[key] = [];
        data[key].push(value);
      } else {
        data[key] = value;
      }
    });

    // Single checkboxes not checked won't appear in FormData
    form.querySelectorAll('input[type="checkbox"]:not([name$="[]"])').forEach((cb) => {
      if (!(cb.name in data)) data[cb.name] = cb.checked;
    });

    btn.disabled = true;
    btn.textContent = 'Submitting\u2026';

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authRequired) {
        headers['Authorization'] = 'Bearer ' + localStorage.getItem('scout_token');
      }

      const res = await fetch(endpoint, {
        method: method || 'POST',
        headers,
        body: JSON.stringify(data),
      });

      const body = await res.json().catch(() => ({}));

      if (res.ok) {
        if (onSuccess) {
          onSuccess(body, form);
        } else {
          form.reset();
          success.classList.add('show');
          success.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        console.error('Submission error:', body);
        if (error) {
          error.textContent = body.error || 'Something went wrong. Please try again.';
          error.classList.add('show');
          error.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    } catch (err) {
      console.error('Network error:', err);
      if (error) {
        error.textContent = 'Network error. Please check your connection and try again.';
        error.classList.add('show');
        error.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } finally {
      btn.disabled = false;
      btn.textContent = btn.dataset.label || 'Submit';
    }
  });

  if (btn) btn.dataset.label = btn.textContent;
}
