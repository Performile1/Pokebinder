import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';

// Importing the serverless entry must not start the development server.
process.env.VERCEL = '1';
const { default: app } = await import('../api/index');

test('scraper endpoint returns JSON through the serverless entry', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = ((input, init) => {
    if (String(input).startsWith('https://api.frankfurter.app/')) {
      return Promise.resolve(Response.json({ rates: { SEK: 11, USD: 1.1, JPY: 160 } }));
    }
    return originalFetch(input, init);
  }) as typeof fetch;
  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const response = await originalFetch(`http://127.0.0.1:${address.port}/api/scraper/cardmarket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardSlug: 'Base-Set/Charizard' }),
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') || '', /application\/json/);
    const result = await response.json();
    assert.equal(result.priceTrendEUR, 285);
    assert.equal(result.priceTrendSEK, 3135);
  } finally {
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
