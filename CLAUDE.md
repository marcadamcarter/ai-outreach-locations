# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web app for GuardRailNow City Leads to scout and track potential booth locations (farmers markets, fairs, community events). Interactive map with color-coded pins by approval status, location scouting form with geocoding, and scout registration with PIN-based login.

- **Live site**: https://ai-outreach-leads.netlify.app (locations feature)
- **Related repos**: ai-outreach-leads (forms/quiz), ai-outreach-playbook (docs)

## Tech Stack

- Static HTML + vanilla JavaScript (no framework, no bundler)
- Netlify Functions (Node.js) as backend API → Airtable
- Leaflet.js + OpenStreetMap for mapping
- Nominatim for client-side geocoding (free, no API key)
- HMAC-signed tokens for auth (SESSION_SECRET)

## Development

```bash
netlify dev    # Local dev server with functions
```

Deploys automatically on push via Netlify.

## Environment Variables (Netlify Dashboard)

| Variable | Description |
|----------|-------------|
| `AIRTABLE_PAT` | Airtable Personal Access Token |
| `AIRTABLE_BASE_ID` | Airtable Base ID |
| `SESSION_SECRET` | Random string for HMAC token signing |

## Architecture

- **`/js/`** — Client-side modules: `auth.js`, `form.js`, `locations.js`, `map.js`
- **`/netlify/functions/`** — Serverless API: `location-add.js`, `location-get.js`, `location-update.js`, `locations-list.js`, `login.js`, `register.js`
- **`/css/`** — Stylesheets matching guardrailnow.org branding
- HTML pages: `index.html`, `login.html`, `add-location.html`, `location.html`, `register.html`

## Key Conventions

- CSS must match guardrailnow.org styling — do not replace the external CSS structure
- Security headers configured in `netlify.toml` (X-Frame-Options, CSP, etc.)
- Functions use esbuild bundler (configured in `netlify.toml`)
