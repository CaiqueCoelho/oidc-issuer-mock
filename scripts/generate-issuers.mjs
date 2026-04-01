import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const publicDir = join(rootDir, 'public');
const issuersListPath = join(publicDir, 'mock-issuers.json');

const ISSUER_COUNT = 2000;
const BASE_URL = 'https://oidc-issuer.web.app';

function buildIssuer(uuid) {
  const issuer = `${BASE_URL}/${uuid}`;
  return {
    uuid,
    issuer,
    discoveryUrl: `${issuer}/.well-known/openid-configuration`,
    jwksUrl: `${issuer}/jwks.json`
  };
}

function getIssuers() {
  if (existsSync(issuersListPath)) {
    const contents = readFileSync(issuersListPath, 'utf8');
    return JSON.parse(contents);
  }

  const issuers = [];
  while (issuers.length < ISSUER_COUNT) {
    issuers.push(buildIssuer(randomUUID()));
  }

  return issuers;
}

function writeOpenIdConfig(uuid) {
  const issuer = `${BASE_URL}/${uuid}`;
  const configDir = join(publicDir, uuid, '.well-known');
  mkdirSync(configDir, { recursive: true });

  const config = {
    issuer,
    authorization_endpoint: `${issuer}/authorize`,
    token_endpoint: `${issuer}/token`,
    jwks_uri: `${issuer}/jwks.json`,
    response_types_supported: ['code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    token_endpoint_auth_methods_supported: ['client_secret_basic'],
    scopes_supported: ['openid'],
    claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat'],
    grant_types_supported: ['authorization_code']
  };

  const filePath = join(configDir, 'openid-configuration');
  writeFileSync(filePath, JSON.stringify(config, null, 2));
}

function writeJwks(uuid) {
  const jwksDir = join(publicDir, uuid);
  mkdirSync(jwksDir, { recursive: true });

  const jwks = {
    keys: [
      {
        kty: 'RSA',
        use: 'sig',
        kid: 'mock-key-1',
        alg: 'RS256',
        n: 'sXch6q9-rZy9kI3Uo6IYyT6PqB6cav7Sb1ZKo7Pacpdrz93y5ZL3qYqAH-0iBJx4XPzI1NYiK4l5Y1_JlP9dVN0ZI7f1weTlQ5N0c1u8M9j7s1G5gcnYpS4KqvByVkRnb1-RH-mDpS4F88nF8FgjXr5v7r_Qd_2sO9Y7D3L5yH3',
        e: 'AQAB'
      }
    ]
  };

  const filePath = join(jwksDir, 'jwks.json');
  writeFileSync(filePath, JSON.stringify(jwks, null, 2));
}

function writeOAuthAuthServerConfig(uuid) {
  const issuer = `${BASE_URL}/${uuid}`;
  const configDir = join(publicDir, uuid, '.well-known');
  mkdirSync(configDir, { recursive: true });

  const config = {
    issuer,
    authorization_endpoint: `${issuer}/authorize`,
    token_endpoint: `${issuer}/token`,
    jwks_uri: `${issuer}/jwks.json`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    token_endpoint_auth_methods_supported: ['client_secret_basic']
  };

  const filePath = join(configDir, 'oauth-authorization-server');
  writeFileSync(filePath, JSON.stringify(config, null, 2));
}

function writeOAuthAuthServerWithPathConfig(uuid) {
  const issuer = `${BASE_URL}/${uuid}/oauth2/default`;
  const configDir = join(publicDir, uuid, 'oauth2', 'default', '.well-known');
  mkdirSync(configDir, { recursive: true });

  const config = {
    issuer,
    authorization_endpoint: `${issuer}/authorize`,
    token_endpoint: `${issuer}/token`,
    jwks_uri: `${BASE_URL}/${uuid}/jwks.json`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    token_endpoint_auth_methods_supported: ['client_secret_basic']
  };

  const filePath = join(configDir, 'oauth-authorization-server');
  writeFileSync(filePath, JSON.stringify(config, null, 2));
}

function cleanPreviousFiles(knownUuids) {
  // Remove directories for UUIDs that no longer exist in the list
  const entries = knownUuids.map((entry) => entry.uuid);
  // Gather all directories in public that match UUID pattern (simple heuristic)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  for (const entry of entries) {
    // we will regenerate in place, so remove existing directories to avoid stale files
    rmSync(join(publicDir, entry), { recursive: true, force: true });
  }

  // Optional: clean any other UUID-looking directories not in list
  for (const dir of readdirSync(publicDir, { withFileTypes: true })) {
    if (dir.isDirectory() && uuidRegex.test(dir.name) && !entries.includes(dir.name)) {
      rmSync(join(publicDir, dir.name), { recursive: true, force: true });
    }
  }
}

function main() {
  const issuers = getIssuers();

  // Remove previous artifacts for these UUIDs to ensure fresh files
  cleanPreviousFiles(issuers);

  for (const { uuid } of issuers) {
    writeOpenIdConfig(uuid);
    writeJwks(uuid);
    writeOAuthAuthServerConfig(uuid);
    writeOAuthAuthServerWithPathConfig(uuid);
  }

  writeFileSync(issuersListPath, JSON.stringify(issuers, null, 2));

  console.log(`Generated static endpoints for ${issuers.length} mock issuers.`);
  console.log(`UUID list written to ${issuersListPath}`);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}

