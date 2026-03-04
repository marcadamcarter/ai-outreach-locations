/**
 * Netlify Function: location-update
 * Updates an existing location record. Auth required.
 * Query param: ?id=recXXX
 */

const { verifyRequest } = require('./lib/verify-token');

const AIRTABLE_TABLE = 'Locations';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'PATCH') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const auth = verifyRequest(event);
  if (!auth) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const id = event.queryStringParameters && event.queryStringParameters.id;
  if (!id) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id parameter' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const bestDays = Array.isArray(data['best_days[]']) ? data['best_days[]'] : data['best_days[]'] ? [data['best_days[]']] : undefined;
  const season = Array.isArray(data['season[]']) ? data['season[]'] : data['season[]'] ? [data['season[]']] : undefined;

  const fields = {};

  // Only include fields that were provided
  if (data.location_name !== undefined) fields['Location Name'] = data.location_name;
  if (data.address !== undefined) fields['Address'] = data.address;
  if (data.city !== undefined) fields['City'] = data.city;
  if (data.state !== undefined) fields['State'] = data.state;
  if (data.latitude !== undefined) fields['Latitude'] = parseFloat(data.latitude) || undefined;
  if (data.longitude !== undefined) fields['Longitude'] = parseFloat(data.longitude) || undefined;
  if (data.status !== undefined) fields['Status'] = data.status;
  if (data.location_type !== undefined) fields['Location Type'] = data.location_type;
  if (data.contact_person !== undefined) fields['Contact Person'] = data.contact_person;
  if (data.contact_email !== undefined) fields['Contact Email'] = data.contact_email;
  if (data.contact_phone !== undefined) fields['Contact Phone'] = data.contact_phone;
  if (data.permit_required !== undefined) fields['Permit Required'] = data.permit_required === true || data.permit_required === 'true';
  if (data.permit_details !== undefined) fields['Permit Details'] = data.permit_details;
  if (data.fee !== undefined) fields['Fee'] = data.fee ? parseFloat(data.fee) : undefined;
  if (data.foot_traffic !== undefined) fields['Foot Traffic'] = data.foot_traffic;
  if (bestDays) fields['Best Days'] = bestDays;
  if (data.best_times !== undefined) fields['Best Times'] = data.best_times;
  if (season) fields['Season'] = season;
  if (data.notes !== undefined) fields['Notes'] = data.notes;
  if (data.photo_link !== undefined) fields['Photo Link'] = data.photo_link;
  if (data.rejection_reason !== undefined) fields['Rejection Reason'] = data.rejection_reason;

  fields['Last Updated'] = new Date().toISOString().split('T')[0];

  // Remove undefined values
  Object.keys(fields).forEach((k) => {
    if (fields[k] === undefined) delete fields[k];
  });

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}/${id}`,
      {
        method: 'PATCH',
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
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Failed to update location' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
