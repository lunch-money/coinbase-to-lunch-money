import sinon from 'sinon';
import { assert } from 'chai';
import {
  LunchMoneyCoinbaseConnection,
  LunchMoneyCoinbaseConnectionConfig,
  LunchMoneyCoinbaseConnectionContext,
} from '../src/main.js';

/**
 * Create a mock coinbase client
 */
const mockCoinbaseClient = class CoinbaseClient {};

/**
 * Create sample config data
 */
const createTestCoinbaseConfig = (): LunchMoneyCoinbaseConnectionConfig => ({
  apiKey: 'test-api-key',
  apiSecret: 'test-api-secret',
});

/**
 * Create sample context data
 */
const createTestCoinbaseContext = (): LunchMoneyCoinbaseConnectionContext => ({
  coinbaseClientConstructor: new mockCoinbaseClient(),
});

/**
 * Create sample data before each test
 */
let testConfig: LunchMoneyCoinbaseConnectionConfig;
let testContext: LunchMoneyCoinbaseConnectionContext;

beforeEach(() => {
  testConfig = createTestCoinbaseConfig();
  testContext = createTestCoinbaseContext();
});

/**
 * Reset after each test
 */
afterEach(() => {
  sinon.restore();
});

/**
 * Main Spec
 */
describe('main', () => {
  /**
   * Initate Spec
   */
  describe('initiate', () => {
    it('should throw not implementated error', async () => {
      try {
        await LunchMoneyCoinbaseConnection.initiate(testConfig, testContext);
        assert.fail('Expected error did not throw');
      } catch (err) {
        assert.throws(() => {
          throw err;
        }, 'Method not implemented.');
      }
    });
  });

  /**
   * Get Balances Spec
   */
  describe('getBalances', () => {
    it('should throw not implementated error', async () => {
      try {
        await LunchMoneyCoinbaseConnection.getBalances(testConfig, testContext);
        assert.fail('Expected error did not throw');
      } catch (err) {
        assert.throws(() => {
          throw err;
        }, 'Method not implemented.');
      }
    });
  });
});
