import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const publicDir = join(rootDir, 'public');
const oauthIssuersListPath = join(publicDir, 'mock-oauth-issuers.json');

const ISSUER_COUNT = 2000;
const BASE_URL = 'https://oidc-issuer.web.app';

function getOAuthIssuers() {
  if (existsSync(oauthIssuersListPath)) {
    return JSON.parse(readFileSync(oauthIssuersListPath, 'utf8'));
  }

  const issuers = [];
  while (issuers.length < ISSUER_COUNT) {
    issuers.push({ uuid: randomUUID() });
  }
  return issuers;
}

// Append style: /{uuid}/.well-known/oauth-authorization-server
function writeAppendStyleConfig(uuid) {
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

  writeFileSync(join(configDir, 'oauth-authorization-server'), JSON.stringify(config, null, 2));
}

// RFC 8414 insertion style: /.well-known/oauth-authorization-server/{uuid}
// Written as a flat file (not a directory) so it doesn't conflict with
// the with-path RFC 8414 directories used by the main OIDC issuer pool.
function writeRfc8414Config(uuid) {
  const issuer = `${BASE_URL}/${uuid}`;
  const rfc8414Dir = join(publicDir, '.well-known', 'oauth-authorization-server');
  mkdirSync(rfc8414Dir, { recursive: true });

  const config = {
    issuer,
    authorization_endpoint: `${issuer}/authorize`,
    token_endpoint: `${issuer}/token`,
    jwks_uri: `${issuer}/jwks.json`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    token_endpoint_auth_methods_supported: ['client_secret_basic']
  };

  writeFileSync(join(rfc8414Dir, uuid), JSON.stringify(config, null, 2));
}

function main() {
  const issuers = getOAuthIssuers();

  for (const { uuid } of issuers) {
    writeAppendStyleConfig(uuid);
    writeRfc8414Config(uuid);
  }

  writeFileSync(oauthIssuersListPath, JSON.stringify(issuers, null, 2));
  console.log(`Generated OAuth Authorization Server endpoints for ${issuers.length} issuers.`);
  console.log(`UUID list written to ${oauthIssuersListPath}`);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
