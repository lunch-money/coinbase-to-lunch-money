import sinon from 'sinon';
import { assert } from 'chai';
import { assertDoesNotThrowAsync } from './helpers/assertDoesNotThrowAsync.js';
import { assertThrowAsync } from './helpers/assertThrowAsync.js';
import { CoinbaseClient } from '../src/Coinbase/Client.js';
import { ignoreErrors } from './helpers/ignoreErrors.js';
import { LunchMoneyCoinbaseConnection } from '../src/main.js';
import { LunchMoneyCryptoConnectionBalances } from './shared-types.js';

// sample data
const testCredentials = { apiKey: 'test-api-key', apiSecret: 'test-api-secret' };
const testBaseUrl = 'https://example.com';
const testScopes = ['test:scope'];

const testConnectionBalances: LunchMoneyCryptoConnectionBalances = {
  providerName: 'coinbase',
  balances: [],
};

const testClient = new CoinbaseClient(testBaseUrl, testScopes);

// handle stubs
let testClientStub: sinon.SinonStubbedInstance<typeof testClient>;

beforeEach(() => {
  testClientStub = sinon.stub(testClient);
});

afterEach(() => {
  sinon.restore();
});

/**
 * Tests
 */
describe('main', () => {
  describe('initiate', () => {
    const initiate = () => LunchMoneyCoinbaseConnection.initiate(testCredentials, testClientStub);

    const initiateIgnoringErrors = ignoreErrors(initiate);

    it('should call client.setConfig() with test credentials', async () => {
      await initiateIgnoringErrors();

      assert(testClientStub.setConfig.calledOnceWithExactly(testCredentials));
    });

    it('should not throw if client.hasRequiredPermissions() resolves true', async () => {
      testClientStub.hasRequiredPermissions.resolves(true);

      await assertDoesNotThrowAsync(initiate);
    });

    it('should call connection.getBalances() if client.hasRequiredPermissions() resolves true', async () => {
      testClientStub.hasRequiredPermissions.resolves(true);

      const connectionGetBalancesStub = sinon.stub(LunchMoneyCoinbaseConnection, 'getBalances');

      await initiateIgnoringErrors();

      assert.isTrue(connectionGetBalancesStub.called);
      connectionGetBalancesStub.restore();
    });

    it('should throw if client.hasRequiredPermissions() resolves false', async () => {
      testClientStub.hasRequiredPermissions.resolves(false);

      await assertThrowAsync(initiate);
    });

    it('should not call connection.getBalances() if client.hasRequiredPermissions() resolves false', async () => {
      testClientStub.hasRequiredPermissions.resolves(false);

      const connectionGetBalancesStub = sinon.stub(LunchMoneyCoinbaseConnection, 'getBalances');

      await initiateIgnoringErrors();

      assert.isFalse(connectionGetBalancesStub.called);
      connectionGetBalancesStub.restore();
    });
  });

  describe('getBalances', () => {
    const getBalances = () => LunchMoneyCoinbaseConnection.getBalances(testCredentials, testClientStub);

    it('should call client.setConfig() with test credentials', async () => {
      await getBalances();

      assert(testClientStub.setConfig.calledOnceWithExactly(testCredentials));
    });

    it('should call connection.getAllBalances()', async () => {
      const connectionGetBalancesStub = sinon.stub(LunchMoneyCoinbaseConnection, 'getBalances');

      await getBalances();

      assert.isTrue(connectionGetBalancesStub.called);
      connectionGetBalancesStub.restore();
    });

    it('should return result of connection.getAllBalances()', async () => {
      const connectionGetBalancesStub = sinon.stub(LunchMoneyCoinbaseConnection, 'getBalances');
      connectionGetBalancesStub.resolves(testConnectionBalances);

      const result = await getBalances();

      assert.deepEqual(testConnectionBalances, result);
      connectionGetBalancesStub.restore();
    });
  });
});
