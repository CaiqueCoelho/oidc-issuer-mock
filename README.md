# Mock OIDC Issuer (Vite + React, Firebase Hosting static build)

This project provides a **mock OpenID Connect issuer** using Vite + React,
deployed on Firebase Hosting as a static site.

To keep everything static-friendly, we pre-generate 2,000 UUID namespaces at build time and
ship them with the site. Each namespace has its own discovery (`.well-known/openid-configuration`)
and JWKS (`jwks.json`) files, and the complete list lives in `mock-issuers.json`.

- Issuer: `https://oidc-issuer.web.app/{UUID}`
- Discovery: `https://oidc-issuer.web.app/{UUID}/.well-known/openid-configuration`
- JWKS: `https://oidc-issuer.web.app/{UUID}/jwks.json`

The JSON is **mock-only**, intended for backend integration tests. The discovery documents
already contain the matching issuer for each UUID.

## Local development

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` (or the port shown in the console).

## Build

```bash
npm run build
```

This generates a static build in the `dist/` directory.

## Pre-generated mock issuers

- Run `npm run generate` to (re)build the mock issuer files into `public/`
- The script writes 2,000 UUIDs and their URLs to `public/mock-issuers.json`
- Each UUID gets its own files:
  - `public/{UUID}/.well-known/openid-configuration`
  - `public/{UUID}/jwks.json`
- Want a different amount? Delete `public/mock-issuers.json` before running `npm run generate`
  so the script can mint a fresh set (e.g. 2,000 issuers after updating `ISSUER_COUNT`).

`firebase.json` configures custom headers so Firebase Hosting serves the discovery and
JWKS files with `Content-Type: application/json`.

## Setup

Install dependencies:

```bash
npm install
```

## Deploy to Firebase

Make sure you have the Firebase CLI installed and are logged in:

```bash
npm install -g firebase-tools
firebase login
```

Then from this project folder:

```bash
npm run generate   # ensure the 2,000 UUIDs exist
npm run build
firebase deploy --only hosting:oidc-issuer --project dosediarianews
```

After deployment, your endpoints will look like:

- Issuer: `https://oidc-issuer.web.app/{UUID}`
- Discovery: `https://oidc-issuer.web.app/{UUID}/.well-known/openid-configuration`
- JWKS: `https://oidc-issuer.web.app/{UUID}/jwks.json`
