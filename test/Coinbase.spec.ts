import moxios from 'moxios';
import { assert } from 'chai';
import { assertDoesNotThrowAsync } from './helpers/assertDoesNotThrowAsync';
import { assertThrowsAsync } from './helpers/assertThrowsAsync';
import { coinbaseAPIBaseUrl, CoinbaseClient } from '../src/CoinbaseClient';

// sample data
const testApiKeyCredentials = { apiKey: 'test-api-key', apiSecret: 'test-api-secret' };
const testConfig = Object.assign({}, testApiKeyCredentials);
const testScopes = ['test:scope'];
const testMethod = 'get';
const testPath = '/';
const testUrl = coinbaseAPIBaseUrl + testPath;
const testDataString = 'test=data';
const testDataObject = { test: 'data' };
const testTimestamp = 1000;
// const testMessage = `${testTimestamp}${testMethod}${testPath}${testDataString}`;
// const testSignature = 'dede090b3dbd6217a276781438adb8af536ed6a418bc4cd5959991c48d062686';

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
  describe('Coinbase static methods', () => {
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

    describe('serializeData', () => {
      it('should return string when given string', () => {
        const returnValue = CoinbaseClient.serializeData(testDataString);
        const expectedString = testDataString;

        assert.equal(returnValue, expectedString);
      });

      it('should return string when given object', () => {
        const returnValue = CoinbaseClient.serializeData(testDataObject);
        const expectedString = 'test=data';

        assert.equal(returnValue, expectedString);
      });
    });

    describe('getTimestamp', () => {
      it('should return current timestamp in seconds', () => {
        const returnValue = CoinbaseClient.getTimestamp();
        const expectedTimestamp = Math.floor(Date.now() / 1000);

        assert.equal(returnValue, expectedTimestamp);
      });
    });

    describe('getMessage', () => {
      it('should return concated message', () => {
        const returnValue = CoinbaseClient.getMessage(testTimestamp, testMethod, testUrl, testDataString);
        const expectedMessage = `${testTimestamp}${testMethod}${testPath}${testDataString}`;

        assert.equal(returnValue, expectedMessage);
      });
    });

    // describe('getSignature', () => {
    //   it('should return signed message', () => {
    //     const returnValue = CoinbaseClient.getSignature(testMessage, testApiSecret);
    //     const expectedSignature = testSignature;

    //     assert.equal(returnValue, expectedSignature);
    //   });
    // });
  });

  describe('CoinbaseClient instance', () => {
    let coinbase: CoinbaseClient;

    beforeEach(() => {
      coinbase = new CoinbaseClient(testConfig);
    });

    describe('constructor', () => {
      it('should set config property on instance', () => {
        assert.equal(coinbase.config.apiKey, testConfig.apiKey);
        assert.equal(coinbase.config.apiSecret, testConfig.apiSecret);
      });
    });

    describe('request', () => {
      const request = () => coinbase.request(testMethod, testPath, testDataString);

      it('should throw if response undefined', async () => {
        moxios.withMock(function () {
          moxios.wait(function () {
            const request = moxios.requests.mostRecent();
            request.respondWith({
              status: 200,
              response: undefined,
            });
          });
        });

        await assertThrowsAsync(request);
      });

      it('should throw if response.data undefined', async () => {
        moxios.withMock(function () {
          moxios.wait(function () {
            const request = moxios.requests.mostRecent();
            request.respondWith({
              status: 200,
              response: { data: undefined },
            });
          });
        });

        await assertThrowsAsync(request);
      });

      it('should throw if response.status is not 200', async () => {
        moxios.withMock(function () {
          moxios.wait(function () {
            const request = moxios.requests.mostRecent();
            request.respondWith({
              status: 500,
              response: { data: {} },
            });
          });
        });

        await assertThrowsAsync(request);
      });

      it('should not throw if response.status is 200', async () => {
        moxios.withMock(function () {
          moxios.wait(function () {
            const request = moxios.requests.mostRecent();
            request.respondWith({
              status: 200,
              response: { data: {} },
            });
          });
        });

        await assertDoesNotThrowAsync(request);
      });

      //   it('should recursively request all resources and return concated in order', async () => {
      //     // First call returns a paginated resource
      //     testRequestHandler.request.onCall(0).resolves({
      //       status: 200,
      //       data: {
      //         pagination: {
      //           next_uri: '/2',
      //         },
      //         data: ['a'],
      //       },
      //     } as CoinbaseRequestHandlerResponse);

      //     // So does the second
      //     testRequestHandler.request.onCall(1).resolves({
      //       status: 200,
      //       data: {
      //         pagination: {
      //           next_uri: '/2',
      //         },
      //         data: ['b'],
      //       },
      //     } as CoinbaseRequestHandlerResponse);

      //     // But not the third
      //     testRequestHandler.request.onCall(2).resolves({
      //       status: 200,
      //       data: {
      //         pagination: {
      //           next_uri: null,
      //         },
      //         data: ['c', 'd'],
      //       },
      //     } as CoinbaseRequestHandlerResponse);

      //     const result = await request();

      //     assert(testRequestHandler.request.callCount === 3, 'Incorrect number of requests');

      //     assert.isDefined(result.data);

      //     if (typeof result.data !== 'undefined') {
      //       assert.equal(result.data[0], 'a');
      //       assert.equal(result.data[1], 'b');
      //       assert.equal(result.data[2], 'c');
      //       assert.equal(result.data[3], 'd');
      //     }
      //   });
      // });

      it('should make authenticated request to api', async () => {
        moxios.withMock(function () {
          moxios.wait(function () {
            const request = moxios.requests.mostRecent();
            request.respondWith({
              status: 200,
              response: { data: {} },
            });
          });
        });

        await coinbase.request(testMethod, testUrl, testDataString);

        const request = moxios.requests.mostRecent();

        if (typeof request !== 'undefined') {
          assert.equal(request.config.url, testUrl);
          assert.equal(request.config.method, testMethod);
          assert.equal(request.config.data, testDataString);

          assert.isDefined(request.config.headers);

          if (typeof request.config.headers !== 'undefined') {
            assert.isDefined(request.config.headers['CB-ACCESS-SIGN']);
            assert.isDefined(request.config.headers['CB-ACCESS-TIMESTAMP']);
            assert.equal(request.config.headers['CB-ACCESS-KEY'], testApiKeyCredentials.apiKey);
            assert.isDefined(request.config.headers['CB-VERSION']);
          }
        }
      });
    });

    describe('throwErrorOnBadPermissions', () => {
      const throwErrorOnBadPermissions = () => coinbase.throwErrorOnBadPermissions();

      it('should not throw error if scopes match', async () => {
        moxios.withMock(function () {
          moxios.wait(function () {
            const request = moxios.requests.mostRecent();
            request.respondWith({
              status: 200,
              response: { data: { scopes: ['wallet:accounts:read'] } },
            });
          });
        });

        await assertDoesNotThrowAsync(throwErrorOnBadPermissions);
      });

      it("should throw error if scopes don't match", async () => {
        moxios.withMock(function () {
          moxios.wait(function () {
            const request = moxios.requests.mostRecent();
            request.respondWith({
              status: 200,
              response: { data: { scopes: [] } },
            });
          });
        });

        await assertThrowsAsync(throwErrorOnBadPermissions);
      });

      it('should throw error if too many scopes', async () => {
        moxios.withMock(function () {
          moxios.wait(function () {
            const request = moxios.requests.mostRecent();
            request.respondWith({
              status: 200,
              response: { data: { scopes: ['wallet:accounts:read', 'wallet:accounts:write'] } },
            });
          });
        });

        await assertThrowsAsync(throwErrorOnBadPermissions);
      });
    });

    describe('getBalances', () => {
      const getBalances = () => coinbase.getBalances();

      it('should return all crypto balances', async () => {
        moxios.withMock(function () {
          moxios.wait(function () {
            const request = moxios.requests.mostRecent();
            request.respondWith({
              status: 200,
              response: {
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
            });
          });
        });

        const returnValue = await getBalances();
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
