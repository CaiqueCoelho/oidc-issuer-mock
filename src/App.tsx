import React, { useEffect, useState } from 'react';

type MockIssuer = {
  uuid: string;
  issuer: string;
  discoveryUrl: string;
  jwksUrl: string;
};

const App: React.FC = () => {
  const [uuid, setUuid] = useState('');
  const [mockIssuers, setMockIssuers] = useState<MockIssuer[]>([]);
  const [copyPlainState, setCopyPlainState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [copyArrayState, setCopyArrayState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [copyOAuthIssuerState, setCopyOAuthIssuerState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [copyOAuthDiscoveryState, setCopyOAuthDiscoveryState] = useState<'idle' | 'copied' | 'error'>('idle');

  useEffect(() => {
    fetch('/mock-issuers.json')
      .then((res) => res.json())
      .then((data: MockIssuer[]) => {
        setMockIssuers(data);
        if (!uuid && data.length > 0) {
          setUuid(data[0].uuid);
        }
      })
      .catch(() => {
        setMockIssuers([]);
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const baseUrl = 'https://oidc-issuer.web.app';

  const issuerUrl = `${baseUrl}/${uuid}`;
  const discoveryUrl = `${issuerUrl}/.well-known/openid-configuration`;
  const jwksUrl = `${issuerUrl}/jwks.json`;
  const issuerCount = mockIssuers.length || 2000;
  const formattedCount = issuerCount.toLocaleString();
  const plainUuidList =
    mockIssuers.length > 0 ? mockIssuers.map((entry) => entry.uuid).join('\n') : '';
  const arrayUuidList =
    mockIssuers.length > 0
      ? `[\n${mockIssuers.map((entry) => `  "${entry.uuid}"`).join(',\n')}\n]`
      : '[]';
  const copyDisabled = mockIssuers.length === 0;

  const oauthIssuerUrl = `${baseUrl}/oauth2/default`;
  const oauthDiscoveryUrl = `${baseUrl}/.well-known/oauth-authorization-server/oauth2/default`;

  const handleCopy = async (
    text: string,
    setState: React.Dispatch<React.SetStateAction<'idle' | 'copied' | 'error'>>
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
      setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    }
  };

  return (
    <main className="container">
      <h1>Mock OIDC Issuer (Vite + React)</h1>
      <p>
        This app exposes <strong>mock</strong> OpenID Connect discovery and JWKS endpoints
        for any <code>/UUID</code> path. It is intended only for testing.
      </p>

      <section className="card">
        <h2>Mock OIDC Issuer UUID</h2>
        <label className="label">
          UUID (path):
          <input
            className="input"
            type="text"
            value={uuid}
            onChange={(e) => setUuid(e.target.value)}
          />
        </label>
        <p className="hint">
          This value is not validated here. Your backend can generate any UUID and use the
          corresponding URLs below.
        </p>
      </section>

      <section className="card">
        <h2>Mock Endpoints</h2>
        <ul>
          <li>
            <strong>Issuer:</strong>{' '}
            <code>{issuerUrl}</code>
          </li>
          <li>
            <strong>Discovery (mock):</strong>{' '}
            <code>{discoveryUrl}</code>
          </li>
          <li>
            <strong>JWKS (mock):</strong>{' '}
            <code>{jwksUrl}</code>
          </li>
        </ul>
        <p className="hint">
          All discovery and JWKS endpoints return the same static mock JSON, regardless of
          the UUID path.
        </p>
      </section>

      <section className="card">
        <h2>Pre-generated Mock Issuers</h2>
        <p>
          Need ready-to-use values? We ship{' '}
          <strong>{formattedCount} static issuers</strong> in <code>mock-issuers.json</code>.
          Use the textarea below or download the JSON file to copy the UUIDs into your own
          project.
        </p>
        <div className="pre-gen-actions">
          <a className="button" href="/mock-issuers.json" target="_blank" rel="noreferrer">
            Open JSON file
          </a>
          <button
            className="button secondary"
            type="button"
            onClick={() => handleCopy(plainUuidList, setCopyPlainState)}
            disabled={copyDisabled}
          >
            {copyPlainState === 'copied'
              ? 'Plain list copied!'
              : copyPlainState === 'error'
              ? 'Copy failed'
              : 'Copy plain list'}
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={() => handleCopy(arrayUuidList, setCopyArrayState)}
            disabled={copyDisabled}
          >
            {copyArrayState === 'copied'
              ? 'Array copied!'
              : copyArrayState === 'error'
              ? 'Copy failed'
              : 'Copy JSON array'}
          </button>
        </div>
        <div className="uuid-textareas">
          <label className="uuid-label">
            Plain list
            <textarea
              className="uuid-list"
              readOnly
              value={plainUuidList}
              rows={Math.min(mockIssuers.length || 4, 12)}
              placeholder="Generating mock UUIDs..."
            />
          </label>
          <label className="uuid-label">
            JSON array
            <textarea
              className="uuid-list"
              readOnly
              value={arrayUuidList}
              rows={Math.min(mockIssuers.length || 4, 12)}
              placeholder='Generating array e.g. ["uuid-1", "uuid-2"]...'
            />
          </label>
        </div>
      </section>

      <section className="card">
        <h2>Mock OAuth Authorization Server</h2>
        <p>
          A single Okta-style OAuth Authorization Server endpoint is available for testing
          <code>OAUTH_AUTHORIZATION_SERVER</code> configurations.
        </p>
        <ul>
          <li>
            <strong>Issuer:</strong>{' '}
            <code>{oauthIssuerUrl}</code>{' '}
            <button
              className="button secondary small"
              type="button"
              onClick={() => handleCopy(oauthIssuerUrl, setCopyOAuthIssuerState)}
            >
              {copyOAuthIssuerState === 'copied'
                ? 'Copied!'
                : copyOAuthIssuerState === 'error'
                ? 'Failed'
                : 'Copy'}
            </button>
          </li>
          <li>
            <strong>Discovery:</strong>{' '}
            <code>{oauthDiscoveryUrl}</code>{' '}
            <button
              className="button secondary small"
              type="button"
              onClick={() => handleCopy(oauthDiscoveryUrl, setCopyOAuthDiscoveryState)}
            >
              {copyOAuthDiscoveryState === 'copied'
                ? 'Copied!'
                : copyOAuthDiscoveryState === 'error'
                ? 'Failed'
                : 'Copy'}
            </button>
          </li>
          <li>
            <strong>JWKS:</strong>{' '}
            <code>{`${oauthIssuerUrl}/jwks.json`}</code>
          </li>
        </ul>
        <p className="hint">
          Similar to <code>https://dev-74305991.okta.com/oauth2/default</code> — use this
          issuer URL wherever your app expects an OAuth Authorization Server.
        </p>
      </section>

      <section className="card">
        <h2>Important</h2>
        <p>
          These endpoints are <strong>mock-only</strong> and should not be used in
          production. There is no real authorization server behind them.
        </p>
      </section>
    </main>
  );
};

export default App;
