import sinon from 'sinon';
import { assert } from 'chai';
import { CoinbaseClient } from '../src/Coinbase/Client.js';
import { LunchMoneyCoinbaseConnection } from '../src/main.js';
import { LunchMoneyCryptoConnectionBalances } from './shared-types.js';

// test helper -- fails if an async function throws
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const assertThrowAsync = async (fn: () => Promise<any>) => {
  try {
    await fn();
    assert.fail('No error thrown');
  } catch (err) {
    assert.throws(() => {
      throw err;
    });
  }
};

// test helper -- fails if an async function does not throw
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const assertDoesNotThrowAsync = async (fn: () => Promise<any>) => {
  try {
    await fn();
  } catch (err) {
    assert.fail(`Unexpected error: ${err}`);
  }
};

// test helper -- ignores any errors thrown
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ignoreErrors = (fn: () => Promise<any> | void) => async () => {
  try {
    await fn();
  } catch (err) {
    // do nothing
  }
};

// sample data
const testCredentials = { apiKey: 'test-api-key', apiSecret: 'test-api-secret' };
const testBaseUrl = 'https://example.com';
const testScopes = ['test:scope'];

const testClient = new CoinbaseClient(testBaseUrl, testScopes);

// handle stubs
let testClientStub: sinon.SinonStubbedInstance<typeof testClient>;

const testConnectionBalances: LunchMoneyCryptoConnectionBalances = {
  providerName: 'coinbase',
  balances: [],
};

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

    it('should call client.setCredentials() with test credentials', async () => {
      await initiateIgnoringErrors();

      assert(testClientStub.setCredentials.calledOnceWithExactly(testCredentials));
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

    it('should call client.setCredentials() with test credentials', async () => {
      await getBalances();

      assert(testClientStub.setCredentials.calledOnceWithExactly(testCredentials));
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
