/**
 * Netlify Function: register
 * Creates a new Scout in Airtable with an auto-generated 6-digit PIN.
 */

const AIRTABLE_TABLE = 'Scouts';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  if (!data.email || !data.full_name) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Name and email are required' }) };
  }

  // Check if email already exists
  try {
    const checkRes = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}?filterByFormula=${encodeURIComponent(`{Email}="${data.email}"`)}`,
      {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_PAT}` },
      }
    );
    const checkData = await checkRes.json();
    if (checkData.records && checkData.records.length > 0) {
      return { statusCode: 409, headers, body: JSON.stringify({ error: 'A scout with this email already exists. Please log in instead.' }) };
    }
  } catch (err) {
    console.error('Email check error:', err);
  }

  // Generate 6-digit PIN
  const pin = String(Math.floor(100000 + Math.random() * 900000));

  const fields = {
    'Full Name': data.full_name,
    'Email':     data.email,
    'PIN':       pin,
    'City':      data.city || '',
    'State':     (data.state || '').toUpperCase(),
    'Status':    'Active',
    'Created':   new Date().toISOString().split('T')[0],
  };

  Object.keys(fields).forEach((k) => {
    if (fields[k] === '') delete fields[k];
  });

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_PAT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Airtable error:', err);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Failed to create scout record' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, pin }),
    };
  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
