import moxios from 'moxios';
import { assert } from 'chai';
import { CoinbaseClient } from '../src/Coinbase/Client.js';

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
    describe('hasCorrectScopes', () => {
      it('should return true when both scopes are empty', () => {
        assert.isTrue(CoinbaseClient.hasCorrectScopes([], []));
      });

      it('should throw when item in requiredScopes is not in grantedScopes', () => {
        assert.throws(() => CoinbaseClient.hasCorrectScopes(['test:scope'], []));
      });

      it('should throw when item in grantedScopes is not in requiredScopes', () => {
        assert.throws(() => CoinbaseClient.hasCorrectScopes([], ['test:scope']));
      });

      it('should not throw when item in grantedScopes is not in requiredScopes and failIfNotExact is false', () => {
        assert.doesNotThrow(() => CoinbaseClient.hasCorrectScopes([], ['test:scope'], { failIfNotExact: false }));
      });
    });
  });
});
