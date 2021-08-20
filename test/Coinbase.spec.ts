import moxios from 'moxios';
import sinon, { SinonStubbedInstance } from 'sinon';
import { APIKeyRequestHandler } from '../src/Coinbase/RequestHandlers/APIKey.js';
import { assert } from 'chai';
import { assertDoesNotThrowAsync } from './helpers/assertDoesNotThrowAsync.js';
import { assertThrowsAsync } from './helpers/assertThrowsAsync.js';
import { coinbaseAPIBaseUrl, CoinbaseClient } from '../src/Coinbase/Client.js';
import { CoinbaseData, CoinbaseRequestHandler, CoinbaseRequestHandlerResponse } from './types.js';
import { ignoreErrors } from './helpers/ignoreErrors.js';
import { Method } from 'axios';

// sample data
const testApiKeyCredentials = { apiKey: 'test-api-key', apiSecret: 'test-api-secret' };
const testInvalidCredentials = {};
const testScopes = ['test:scope'];
const testPath = '/';
const testDataString = 'test=data';
const testDataObject = { test: 'data' };

class TestRequestHandler implements CoinbaseRequestHandler {
  async request(method: Method, path: string, data?: CoinbaseData): Promise<CoinbaseRequestHandlerResponse> {
    method;
    path;
    data;
    console.log('request', method, path, data);
    return {} as CoinbaseRequestHandlerResponse;
  }
}

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
      coinbase = new CoinbaseClient(testScopes);
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

    describe('request', () => {
      const request = () => coinbase.request('GET', testPath, testDataString);
      const requestIgnoringErrors = ignoreErrors(request);

      it('should throw if no request handler set', async () => {
        await assertThrowsAsync(request);
      });

      let testRequestHandler: SinonStubbedInstance<TestRequestHandler>;
      beforeEach(() => {
        testRequestHandler = sinon.stub(new TestRequestHandler());
        coinbase._requestHandler = testRequestHandler;
      });

      afterEach(() => {
        testRequestHandler.request.restore();
      });

      it('should route requests to request handler', async () => {
        await requestIgnoringErrors();

        assert(testRequestHandler.request.calledOnce, 'Not routed to handler');

        const {
          args: [method, path, data],
        } = testRequestHandler.request.getCall(0);

        assert(method === 'GET', `Routed with incorrect method ${method}`);
        assert(path === coinbaseAPIBaseUrl + testPath, `Routed with incorrect path ${path}`);
        assert(data === testDataString, `Routed with incorrect data ${data}`);
      });

      it('should throw if response undefined', async () => {
        testRequestHandler.request.resolves(undefined as CoinbaseRequestHandlerResponse);

        await assertThrowsAsync(request);
      });

      it('should throw if response.data undefined', async () => {
        testRequestHandler.request.resolves({} as CoinbaseRequestHandlerResponse);

        await assertThrowsAsync(request);
      });

      it('should throw if response.status is not 200', async () => {
        testRequestHandler.request.resolves({
          status: 500,
          data: {},
        } as CoinbaseRequestHandlerResponse);

        await assertThrowsAsync(request);
      });

      it('should not throw if response.status is 200', async () => {
        testRequestHandler.request.resolves({
          status: 200,
          data: {},
        } as CoinbaseRequestHandlerResponse);

        await assertDoesNotThrowAsync(request);
      });

      it('should recursively request all resources and return concated in order', async () => {
        // First call returns a paginated resource
        testRequestHandler.request.onCall(0).resolves({
          status: 200,
          data: {
            pagination: {
              next_uri: '/2',
            },
            data: ['a'],
          },
        } as CoinbaseRequestHandlerResponse);

        // So does the second
        testRequestHandler.request.onCall(1).resolves({
          status: 200,
          data: {
            pagination: {
              next_uri: '/2',
            },
            data: ['b'],
          },
        } as CoinbaseRequestHandlerResponse);

        // But not the third
        testRequestHandler.request.onCall(2).resolves({
          status: 200,
          data: {
            pagination: {
              next_uri: null,
            },
            data: ['c', 'd'],
          },
        } as CoinbaseRequestHandlerResponse);

        const result = await request();

        assert(testRequestHandler.request.callCount === 3, 'Incorrect number of requests');

        assert.isDefined(result.data);

        if (typeof result.data !== 'undefined') {
          assert.equal(result.data[0], 'a');
          assert.equal(result.data[1], 'b');
          assert.equal(result.data[2], 'c');
          assert.equal(result.data[3], 'd');
        }
      });
    });

    describe('hasRequiredPermissions', () => {
      const hasRequiredPermissions = () => coinbase.hasRequiredPermissions();

      let testRequestHandler: SinonStubbedInstance<TestRequestHandler>;
      beforeEach(() => {
        testRequestHandler = sinon.stub(new TestRequestHandler());
        coinbase._requestHandler = testRequestHandler;
      });

      afterEach(() => {
        testRequestHandler.request.restore();
      });

      it('should throw if result.data is undefined', async () => {
        testRequestHandler.request.resolves({
          status: 200,
          data: {},
        } as CoinbaseRequestHandlerResponse);
        assertThrowsAsync(hasRequiredPermissions);
      });

      it('should return true if scopes match', async () => {
        testRequestHandler.request.resolves({
          status: 200,
          data: { data: { scopes: coinbase.requiredScopes } },
        } as CoinbaseRequestHandlerResponse);

        const returnValue = await hasRequiredPermissions();
        assert.isTrue(returnValue);
      });
    });

    describe('getAllBalances', () => {
      const getAllBalances = () => coinbase.getAllBalances();

      let testRequestHandler: SinonStubbedInstance<TestRequestHandler>;
      beforeEach(() => {
        testRequestHandler = sinon.stub(new TestRequestHandler());
        coinbase._requestHandler = testRequestHandler;
      });

      it('should throw if result.data is undefined', async () => {
        testRequestHandler.request.resolves({
          status: 200,
          data: {},
        } as CoinbaseRequestHandlerResponse);
        assertThrowsAsync(getAllBalances);
      });

      it('should return all crypto balances', async () => {
        testRequestHandler.request.resolves({
          status: 200,
          data: {
            data: [
              {
                balance: {
                  currency: 'BTC',
                  amount: '0.00',
                },
              },
              {
                balance: {
                  currency: 'ETH',
                  amount: '1.00',
                },
              },
              {
                balance: {
                  currency: 'ADA',
                  amount: '2.00',
                },
              },
            ],
          },
        } as CoinbaseRequestHandlerResponse);

        const returnValue = await getAllBalances();
        assert.deepEqual(returnValue, [
          {
            asset: 'BTC',
            amount: '0.00',
          },
          {
            asset: 'ETH',
            amount: '1.00',
          },
          {
            asset: 'ADA',
            amount: '2.00',
          },
        ]);
      });
    });
  });
});
