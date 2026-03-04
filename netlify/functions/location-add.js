/**
 * Netlify Function: location-add
 * Creates a new location record in Airtable. Auth required.
 */

const { verifyRequest } = require('./lib/verify-token');

const AIRTABLE_TABLE = 'Locations';
const SCOUTS_TABLE = 'Scouts';

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

  const auth = verifyRequest(event);
  if (!auth) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  if (!data.location_name || !data.address) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Location name and address are required' }) };
  }

  // Look up scout record ID by email
  let scoutRecordId;
  try {
    const filter = encodeURIComponent(`{Email}="${auth.email}"`);
    const res = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(SCOUTS_TABLE)}?filterByFormula=${filter}`,
      { headers: { Authorization: `Bearer ${process.env.AIRTABLE_PAT}` } }
    );
    const result = await res.json();
    if (result.records && result.records.length > 0) {
      scoutRecordId = result.records[0].id;
    }
  } catch (err) {
    console.error('Scout lookup error:', err);
  }

  const bestDays = Array.isArray(data['best_days[]']) ? data['best_days[]'] : data['best_days[]'] ? [data['best_days[]']] : [];
  const season = Array.isArray(data['season[]']) ? data['season[]'] : data['season[]'] ? [data['season[]']] : [];

  const fields = {
    'Location Name':   data.location_name,
    'Address':         data.address,
    'City':            data.city || '',
    'State':           data.state || '',
    'Latitude':        data.latitude ? parseFloat(data.latitude) : undefined,
    'Longitude':       data.longitude ? parseFloat(data.longitude) : undefined,
    'Status':          data.status || 'Not Yet Contacted',
    'Location Type':   data.location_type || '',
    'Contact Person':  data.contact_person || '',
    'Contact Email':   data.contact_email || '',
    'Contact Phone':   data.contact_phone || '',
    'Permit Required': data.permit_required === true || data.permit_required === 'true',
    'Permit Details':  data.permit_details || '',
    'Fee':             data.fee ? parseFloat(data.fee) : undefined,
    'Foot Traffic':    data.foot_traffic || '',
    'Best Days':       bestDays.length ? bestDays : undefined,
    'Best Times':      data.best_times || '',
    'Season':          season.length ? season : undefined,
    'Notes':           data.notes || '',
    'Photo Link':      data.photo_link || '',
    'Scouted By':      scoutRecordId ? [scoutRecordId] : undefined,
    'Scouted Date':    new Date().toISOString().split('T')[0],
    'Last Updated':    new Date().toISOString().split('T')[0],
    'Rejection Reason': data.rejection_reason || '',
  };

  // Remove undefined/empty fields
  Object.keys(fields).forEach((k) => {
    if (fields[k] === '' || fields[k] === undefined) delete fields[k];
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
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Failed to save location' }) };
    }

    const record = await res.json();
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, id: record.id }) };
  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
