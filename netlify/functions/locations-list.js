/**
 * Netlify Function: locations-list
 * Returns all location records from Airtable (public, no auth required).
 * Supports pagination via offset parameter.
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

  try {
    let allRecords = [];
    let offset = null;

    // Paginate through all records
    do {
      let url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}?sort%5B0%5D%5Bfield%5D=Location+Name&sort%5B0%5D%5Bdirection%5D=asc`;
      if (offset) url += `&offset=${offset}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_PAT}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Airtable error:', err);
        return { statusCode: 502, headers, body: JSON.stringify({ error: 'Failed to fetch locations' }) };
      }

      const data = await res.json();
      allRecords = allRecords.concat(data.records);
      offset = data.offset;
    } while (offset);

    // Map to simplified response
    const locations = allRecords.map((r) => ({
      id: r.id,
      name: r.fields['Location Name'] || '',
      address: r.fields['Address'] || '',
      city: r.fields['City'] || '',
      state: r.fields['State'] || '',
      lat: r.fields['Latitude'],
      lng: r.fields['Longitude'],
      status: r.fields['Status'] || 'Not Yet Contacted',
      type: r.fields['Location Type'] || '',
      footTraffic: r.fields['Foot Traffic'] || '',
      scoutedDate: r.fields['Scouted Date'] || '',
    }));

    return { statusCode: 200, headers, body: JSON.stringify({ locations }) };
  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
