/**
 * Netlify Function: location-get
 * Returns a single location by record ID (public, no auth required).
 * Query param: ?id=recXXX
 */

const AIRTABLE_TABLE = 'Locations';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const id = event.queryStringParameters && event.queryStringParameters.id;
  if (!id) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id parameter' }) };
  }

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}/${id}`,
      {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_PAT}` },
      }
    );

    if (!res.ok) {
      if (res.status === 404) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Location not found' }) };
      }
      const err = await res.json().catch(() => ({}));
      console.error('Airtable error:', err);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Failed to fetch location' }) };
    }

    const record = await res.json();
    const f = record.fields;

    const location = {
      id: record.id,
      name: f['Location Name'] || '',
      address: f['Address'] || '',
      city: f['City'] || '',
      state: f['State'] || '',
      lat: f['Latitude'],
      lng: f['Longitude'],
      status: f['Status'] || 'Not Yet Contacted',
      type: f['Location Type'] || '',
      contactPerson: f['Contact Person'] || '',
      contactEmail: f['Contact Email'] || '',
      contactPhone: f['Contact Phone'] || '',
      permitRequired: f['Permit Required'] || false,
      permitDetails: f['Permit Details'] || '',
      fee: f['Fee'],
      footTraffic: f['Foot Traffic'] || '',
      bestDays: f['Best Days'] || [],
      bestTimes: f['Best Times'] || '',
      season: f['Season'] || [],
      notes: f['Notes'] || '',
      photoLink: f['Photo Link'] || '',
      scoutedBy: f['Scouted By'] || [],
      scoutedDate: f['Scouted Date'] || '',
      lastUpdated: f['Last Updated'] || '',
      rejectionReason: f['Rejection Reason'] || '',
    };

    return { statusCode: 200, headers, body: JSON.stringify({ location }) };
  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
