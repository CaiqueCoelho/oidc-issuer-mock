# Mock OIDC Issuer (Vite + React, Firebase Hosting static build)

This project provides **mock OpenID Connect** and **OAuth Authorization Server** endpoints
using Vite + React, deployed on Firebase Hosting as a static site.

To keep everything static-friendly, we pre-generate UUID namespaces at build time and
ship them with the site. Each namespace has its own discovery, JWKS, and OAuth metadata files.

## Endpoint types

### 1. OpenID Connect (OIDC)

UUIDs sourced from `public/mock-issuers.json` (2,000 by default).

| Endpoint | URL |
|---|---|
| Issuer | `https://oidc-issuer.web.app/{UUID}` |
| Discovery | `https://oidc-issuer.web.app/{UUID}/.well-known/openid-configuration` |
| JWKS | `https://oidc-issuer.web.app/{UUID}/jwks.json` |

### 2. OAuth Authorization Server — with path (`/oauth2/default`)

Uses the same UUIDs as OIDC (`public/mock-issuers.json`).
Two discovery URL patterns are supported:

| Style | Discovery URL |
|---|---|
| Append (provider-style) | `https://oidc-issuer.web.app/{UUID}/oauth2/default/.well-known/oauth-authorization-server` |
| RFC 8414 (insertion-style) | `https://oidc-issuer.web.app/.well-known/oauth-authorization-server/{UUID}/oauth2/default` |

The issuer value in the returned JSON is:
```
https://oidc-issuer.web.app/{UUID}/oauth2/default
```

Set `OAUTH_AUTHORIZATION_SERVER` to the issuer value above. Your system will automatically
construct the appropriate discovery URL depending on which style it uses.

### 3. OAuth Authorization Server — without extra path

Uses a **separate pool** of UUIDs stored in `public/mock-oauth-issuers.json` (2,000 by default).
This pool is independent from the OIDC/with-path pool to avoid filesystem conflicts.

| Style | Discovery URL |
|---|---|
| Append (provider-style) | `https://oidc-issuer.web.app/{UUID}/.well-known/oauth-authorization-server` |
| RFC 8414 (insertion-style) | `https://oidc-issuer.web.app/.well-known/oauth-authorization-server/{UUID}` |

The issuer value in the returned JSON is:
```
https://oidc-issuer.web.app/{UUID}
```

## Generate commands

Generation scripts are **not** run automatically during build or deploy.
Run them manually when you want to create or regenerate mock issuers.

| Command | What it does | JSON list file |
|---|---|---|
| `npm run generate` | Generates OIDC + OAuth with-path (append style) endpoints for all UUIDs | `public/mock-issuers.json` |
| `npm run generate:rfc8414` | Generates RFC 8414 insertion-style endpoints for with-path OAuth (uses existing UUIDs from `mock-issuers.json`) | — |
| `npm run generate:oauth` | Generates OAuth without-path endpoints (append + RFC 8414) with a separate UUID pool | `public/mock-oauth-issuers.json` |

### Regenerate with existing UUIDs (keep the same issuers)

```bash
npm run generate          # OIDC + OAuth with-path (append style)
npm run generate:rfc8414  # OAuth with-path (RFC 8414 style)
npm run generate:oauth    # OAuth without-path (both styles)
```

### Regenerate with brand new UUIDs

Delete the JSON list file first, then run the generate command:

```bash
# New OIDC + OAuth with-path UUIDs
rm public/mock-issuers.json
npm run generate
npm run generate:rfc8414

# New OAuth without-path UUIDs
rm public/mock-oauth-issuers.json
npm run generate:oauth
```

To change the number of UUIDs, edit `ISSUER_COUNT` in the corresponding script before regenerating.

### Files generated per UUID

**`npm run generate`** (per UUID from `mock-issuers.json`):
- `public/{UUID}/.well-known/openid-configuration`
- `public/{UUID}/.well-known/oauth-authorization-server`
- `public/{UUID}/oauth2/default/.well-known/oauth-authorization-server`
- `public/{UUID}/jwks.json`

**`npm run generate:rfc8414`** (per UUID from `mock-issuers.json`):
- `public/.well-known/oauth-authorization-server/{UUID}/oauth2/default`

**`npm run generate:oauth`** (per UUID from `mock-oauth-issuers.json`):
- `public/{UUID}/.well-known/oauth-authorization-server`
- `public/.well-known/oauth-authorization-server/{UUID}`

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

This generates a static build in the `dist/` directory. It does **not** run any generate scripts.

## Deploy to Firebase

### Automatic (CI/CD)

A GitHub Actions workflow automatically builds and deploys to Firebase Hosting
when a PR is merged to `main`. See `.github/workflows/deploy.yml`.

**Setup:**

1. Generate a Firebase service account JSON key from the
   [Firebase console](https://console.firebase.google.com/) under
   Project Settings > Service Accounts, or run `firebase init hosting:github`.
2. Add the full JSON key as a repository secret named `FIREBASE_SERVICE_ACCOUNT`
   in GitHub (Settings > Secrets and variables > Actions).

### Manual

Make sure you have the Firebase CLI installed and are logged in:

```bash
npm install -g firebase-tools
firebase login
```

Then from this project folder:

```bash
# First time or after regenerating:
npm run generate
npm run generate:rfc8414
npm run generate:oauth

# Deploy
npm run deploy
```

`firebase.json` configures custom headers so Firebase Hosting serves all
`.well-known` and JWKS files with `Content-Type: application/json`.

## Why two separate UUID pools?

A UUID under `public/.well-known/oauth-authorization-server/` must be either:
- A **file** (for the no-path RFC 8414 style: `/.well-known/oauth-authorization-server/{UUID}`)
- A **directory** (for the with-path RFC 8414 style: `/.well-known/oauth-authorization-server/{UUID}/oauth2/default`)

It cannot be both. Using separate UUID pools for with-path and without-path issuers
avoids this filesystem conflict entirely.
