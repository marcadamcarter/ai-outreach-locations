# AI Outreach — Location Scouting

A web app for GuardRailNow City Leads to scout and track potential booth locations (farmers markets, fairs, community events) across cities.

## Features

- Interactive map with color-coded pins by approval status
- Location scouting form with address geocoding
- Filter locations by status, type, and city
- Scout registration and PIN-based login
- Detailed location view with all scouting data

## Tech Stack

- Static HTML + vanilla JS
- Netlify Functions (Node.js) + Airtable API
- Leaflet.js + OpenStreetMap (free mapping)
- Nominatim geocoding (free, client-side)
- HMAC-signed tokens for auth

## Environment Variables

Set these in the Netlify dashboard:

| Variable | Description |
|----------|-------------|
| `AIRTABLE_PAT` | Airtable Personal Access Token |
| `AIRTABLE_BASE_ID` | Airtable Base ID |
| `SESSION_SECRET` | Random string for HMAC token signing |

## Local Development

```bash
netlify dev
```
