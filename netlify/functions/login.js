/**
 * Netlify Function: login
 * Verifies email + PIN against Scouts table, returns HMAC-signed token.
 */

const { createToken } = require('./lib/verify-token');

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

  if (!data.email || !data.pin) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email and PIN are required' }) };
  }

  try {
    const filter = encodeURIComponent(`AND({Email}="${data.email}",{PIN}="${data.pin}",{Status}="Active")`);
    const res = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}?filterByFormula=${filter}`,
      {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_PAT}` },
      }
    );

    const result = await res.json();

    if (!result.records || result.records.length === 0) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid email or PIN' }) };
    }

    const scout = result.records[0];
    const token = createToken(data.email);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        token,
        scout: {
          id: scout.id,
          name: scout.fields['Full Name'],
          email: scout.fields['Email'],
          city: scout.fields['City'],
          state: scout.fields['State'],
        },
      }),
    };
  } catch (err) {
    console.error('Login error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
