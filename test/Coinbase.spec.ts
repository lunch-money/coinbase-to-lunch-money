import moxios from 'moxios';
import { APIKeyRequestHandler } from '../src/Coinbase/RequestHandlers/APIKey.js';
import { assert } from 'chai';
import { CoinbaseClient } from '../src/Coinbase/Client.js';

// sample data
const testApiKeyCredentials = { apiKey: 'test-api-key', apiSecret: 'test-api-secret' };
const testInvalidCredentials = {};
const testBaseUrl = 'https://example.com';
const testScopes = ['test:scope'];

// ensure requests are spoofed during tests
beforeEach(() => {
  moxios.install();
});

afterEach(() => {
  moxios.uninstall();
});

/**
 * Tests
 */
describe('Coinbase', () => {
  describe('Client', () => {
    let coinbase: CoinbaseClient;

    beforeEach(() => {
      coinbase = new CoinbaseClient(testBaseUrl, testScopes);
    });

    describe('hasCorrectScopes', () => {
      it('should return true when both scopes are empty', () => {
        assert.isTrue(CoinbaseClient.hasCorrectScopes([], []));
      });

      it('should throw when item in requiredScopes is not in grantedScopes', () => {
        assert.throws(() => CoinbaseClient.hasCorrectScopes(testScopes, []));
      });

      it('should throw when item in grantedScopes is not in requiredScopes', () => {
        assert.throws(() => CoinbaseClient.hasCorrectScopes([], testScopes));
      });

      it('should not throw when item in grantedScopes is not in requiredScopes and failIfNotExact is false', () => {
        assert.doesNotThrow(() => CoinbaseClient.hasCorrectScopes([], testScopes, { failIfNotExact: false }));
      });
    });

    describe('setConfig', () => {
      it('should throw if given invalid credentials', () => {
        assert.throws(() => coinbase.setConfig(testInvalidCredentials));
      });

      describe('with API Key credentials', () => {
        it('should not throw if given api credentials', () => {
          assert.doesNotThrow(() => coinbase.setConfig(testApiKeyCredentials));
        });

        it('should set _requestHandler to be instance of APIKeyRequestHandler', () => {
          coinbase.setConfig(testApiKeyCredentials);

          if (!(coinbase._requestHandler instanceof APIKeyRequestHandler)) {
            assert.fail('Invalid _requestHandler instance');
          }
        });
      });
    });
  });
});
