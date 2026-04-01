import type { Plugin } from 'vite';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const baseUrl = 'https://oidc-issuer.web.app';

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

export function oidcPlugin(): Plugin {
  return {
    name: 'oidc-endpoints',
    writeBundle(options, bundle) {
      const outDir = options.dir || 'dist';
      
      // Create a JavaScript file that serves JSON dynamically
      // This will be served for OIDC endpoints and uses client-side JS to generate JSON
      const openIdConfigJs = `(function() {
  const baseUrl = '${baseUrl}';
  const path = window.location.pathname;
  const match = path.match(/\\/([^\\/]+)\\/\\.well-known\\/openid-configuration/);
  const uuid = match ? match[1] : null;
  
  if (!uuid) {
    document.body.textContent = JSON.stringify({ error: 'UUID is required in path' }, null, 2);
    document.body.style.fontFamily = 'monospace';
    document.body.style.whiteSpace = 'pre';
    return;
  }
  
  const issuer = baseUrl + '/' + uuid;
  const config = {
    issuer: issuer,
    authorization_endpoint: issuer + '/authorize',
    token_endpoint: issuer + '/token',
    jwks_uri: issuer + '/jwks.json',
    response_types_supported: ['code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    token_endpoint_auth_methods_supported: ['client_secret_basic'],
    scopes_supported: ['openid'],
    claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat'],
    grant_types_supported: ['authorization_code']
  };
  
  document.body.textContent = JSON.stringify(config, null, 2);
  document.body.style.fontFamily = 'monospace';
  document.body.style.whiteSpace = 'pre';
})();`;

      const jwksJs = `(function() {
  const jwks = ${JSON.stringify(jwks, null, 2)};
  document.body.textContent = JSON.stringify(jwks, null, 2);
  document.body.style.fontFamily = 'monospace';
  document.body.style.whiteSpace = 'pre';
})();`;

      // Write the JavaScript files
      writeFileSync(join(outDir, 'openid-config.js'), openIdConfigJs);
      writeFileSync(join(outDir, 'jwks-endpoint.js'), jwksJs);
    }
  };
}




