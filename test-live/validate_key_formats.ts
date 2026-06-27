/**
 * Validates that all supported key formats are correctly signed and reach
 * the Coinbase API. Uses revoked keys committed to the repo — no setup required.
 *
 * A test passes when Coinbase returns an auth error (HTTP 4xx), which proves
 * the key was correctly formatted and signed. A signing failure before the
 * request is made means the key format is broken and the test fails.
 *
 * Run with: npm run test:live:validate-formats
 */

import fs from 'fs';
import path from 'path';
import { assert } from 'chai';
import { LunchMoneyCoinbaseConnection } from '../src/main';

const FIXTURES = [
  { file: 'cdp_api_key-ecdsa-pem.json', label: 'ECDSA with PEM header' },
  { file: 'cdp_api_key-ecdsa-raw.json', label: 'ECDSA without header (raw base64)' },
  { file: 'cdp_api_key-ed25519-pem.json', label: 'Ed25519 with PEM header' },
  { file: 'cdp_api_key-ed25519-raw.json', label: 'Ed25519 without header (raw base64)' },
];

for (const { file, label } of FIXTURES) {
  const filepath = path.join(__dirname, file);

  describe(`Key format: ${label}`, function () {
    before(function () {
      if (!fs.existsSync(filepath)) {
        console.warn(`\n  Skipping — ${file} not found in test-live/`);
        this.skip();
      }
    });

    it('should reach the Coinbase API (key format is valid)', async function () {
      const config = JSON.parse(fs.readFileSync(filepath, 'utf8'));

      try {
        await LunchMoneyCoinbaseConnection.initiate(config);
        console.log('        → key is valid and authorized');
      } catch (e) {
        const message = (e as Error).message;
        assert.match(
          message,
          /Coinbase API error/,
          `Key format was rejected before reaching Coinbase. Got: "${message}"`,
        );
        console.log(`        → key format valid; Coinbase rejected (${message})`);
      }
    }).timeout(5000);
  });
}

describe('Key format: invalid / unparseable key', function () {
  it('should fail before reaching Coinbase with a signing error', async function () {
    try {
      await LunchMoneyCoinbaseConnection.initiate({ name: 'bad-key', privateKey: 'not-a-valid-key' });
      throw new Error('Expected a signing error but initiate() succeeded');
    } catch (e) {
      const message = (e as Error).message;
      assert.notMatch(
        message,
        /Coinbase API error/,
        `Expected a signing error but got a Coinbase API error — key format was valid: "${message}"`,
      );
      console.log(`        → signing failed before reaching Coinbase (expected): ${message}`);
    }
  }).timeout(5000);
});
