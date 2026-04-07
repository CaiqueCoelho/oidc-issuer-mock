import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const publicDir = join(rootDir, 'public');
const issuersListPath = join(publicDir, 'mock-issuers.json');

const BASE_URL = 'https://oidc-issuer.web.app';

function writeRfc8414OAuthAuthServerWithPathConfig(uuid) {
  const issuer = `${BASE_URL}/${uuid}/oauth2/default`;
  const parentDir = join(publicDir, '.well-known', 'oauth-authorization-server', uuid, 'oauth2');
  mkdirSync(parentDir, { recursive: true });

  const config = {
    issuer,
    authorization_endpoint: `${issuer}/v1/authorize`,
    token_endpoint: `${issuer}/v1/token`,
    jwks_uri: `${BASE_URL}/${uuid}/jwks.json`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    token_endpoint_auth_methods_supported: ['client_secret_basic']
  };

  writeFileSync(join(parentDir, 'default'), JSON.stringify(config, null, 2));
}

function main() {
  if (!existsSync(issuersListPath)) {
    console.error('mock-issuers.json not found. Run npm run generate first.');
    process.exit(1);
  }

  const issuers = JSON.parse(readFileSync(issuersListPath, 'utf8'));

  for (const { uuid } of issuers) {
    writeRfc8414OAuthAuthServerWithPathConfig(uuid);
  }

  console.log(`Generated RFC 8414 OAuth Authorization Server endpoints for ${issuers.length} issuers.`);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
