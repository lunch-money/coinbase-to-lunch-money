import moxios from 'moxios';
import sinon, { SinonStubbedInstance } from 'sinon';
import { APIKeyRequestHandler } from '../src/Coinbase/RequestHandlers/APIKey.js';
import { assert } from 'chai';
import { assertDoesNotThrowAsync } from './helpers/assertDoesNotThrowAsync.js';
import { assertThrowsAsync } from './helpers/assertThrowsAsync.js';
import { CoinbaseClient } from '../src/Coinbase/Client.js';
import { CoinbaseData, CoinbaseRequestHandler, CoinbaseRequestHandlerResponse } from './types.js';
import { ignoreErrors } from './helpers/ignoreErrors.js';
import { Method } from 'axios';

// sample data
const testApiKeyCredentials = { apiKey: 'test-api-key', apiSecret: 'test-api-secret' };
const testInvalidCredentials = {};
const testBaseUrl = 'https://example.com';
const testScopes = ['test:scope'];
const testPath = '/';

class TestRequestHandler implements CoinbaseRequestHandler {
  async request(method: Method, path: string, data?: CoinbaseData): Promise<CoinbaseRequestHandlerResponse> {
    method;
    path;
    data;
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

    describe('request', () => {
      const request = () => coinbase.request('GET', testPath, '');
      const requestIgnoringErrors = ignoreErrors(request);

      it('should throw if no request handler set', async () => {
        await assertThrowsAsync(request);
      });

      let testRequestHandler: SinonStubbedInstance<TestRequestHandler>;
      beforeEach(() => {
        testRequestHandler = sinon.stub(new TestRequestHandler());
        coinbase._requestHandler = testRequestHandler;
      });

      it('should route requests to request handler', async () => {
        await requestIgnoringErrors();

        assert(testRequestHandler.request.calledOnceWithExactly('GET', testPath, ''));
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
  });
});
