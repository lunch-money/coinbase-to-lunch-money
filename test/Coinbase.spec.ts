import moxios from 'moxios';
import { assert } from 'chai';
import { assertDoesNotThrowAsync } from './helpers/assertDoesNotThrowAsync';
import { assertThrowsAsync } from './helpers/assertThrowsAsync';
import { coinbaseAPIBaseUrl, CoinbaseClient, coinbaseEndpoints } from '../src/CoinbaseClient';

// sample data
const testApiKeyCredentials = { name: 'test-api-key', privateKey: 'test-api-secret', mockApiResponseTest: true };
const testConfig = Object.assign({}, testApiKeyCredentials);
const testMethod = 'get';
const testPath = coinbaseEndpoints.accounts;
const testUrl = coinbaseAPIBaseUrl + '/' + testPath;
const testDataString = 'test=data';
// const testDataObject = { test: 'data' };

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
  describe('CoinbaseClient instance', () => {
    let coinbase: CoinbaseClient;

    beforeEach(() => {
      coinbase = new CoinbaseClient(testConfig);
    });

    describe('constructor', () => {
      it('should set config property on instance', () => {
        assert.equal(coinbase.config.name, testConfig.name);
        assert.equal(coinbase.config.privateKey, testConfig.privateKey);
      });
    });

    describe('request', () => {
      const request = () => coinbase.request(testMethod, testPath, {}, testDataString);

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

      it('should throw if unauthorized', async () => {
        moxios.withMock(function () {
          moxios.wait(function () {
            const request = moxios.requests.mostRecent();
            request.respondWith({
              status: 401,
              response: 'Unauthorized',
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

        await coinbase.request(testMethod, testPath, {}, testDataString);

        const request = moxios.requests.mostRecent();

        if (typeof request !== 'undefined') {
          assert.equal(request.config.url, testUrl);
          assert.equal(request.config.method, testMethod);
          assert.equal(request.config.data, testDataString);

          assert.isDefined(request.config.headers);

          if (typeof request.config.headers !== 'undefined') {
            assert.isDefined(request.config.headers['Accept']);
            assert.isDefined(request.config.headers['Authorization']);
          }
        }
      });
    });

    describe('getBalances', () => {
      const getBalances = () => coinbase.getBalances();

      it('should return all crypto balances - even zeros', async () => {
        moxios.withMock(function () {
          moxios.wait(function () {
            const request = moxios.requests.mostRecent();
            request.respondWith({
              status: 200,
              response: {
                accounts: [
                  {
                    name: 'Empty BTC Wallet',
                    currency: 'BTC',
                    available_balance: {
                      value: '0',
                      currency: 'BTC',
                    },
                  },
                  {
                    name: 'Empty XLM Wallet',
                    currency: 'XLM',
                    available_balance: {
                      value: '0',
                      currency: 'XLM',
                    },
                  },
                  {
                    name: 'MATIC Wallet',
                    currency: 'MATIC',
                    available_balance: {
                      value: '25',
                      currency: 'MATIC',
                    },
                  },
                  {
                    name: 'Empty ETC Wallet',
                    currency: 'ETC',
                    available_balance: {
                      value: '0',
                      currency: 'ETC',
                    },
                  },
                  {
                    name: 'ETH Wallet',
                    currency: 'ETH',
                    available_balance: {
                      value: '200.0001',
                      currency: 'ETH',
                    },
                  },
                  {
                    name: 'Cash (USD)',
                    currency: 'USD',
                    available_balance: {
                      value: '25.00',
                      currency: 'USD',
                    },
                  },
                ],
                has_next: false,
                cursor: '',
                size: 6,
              },
            });
          });
        });

        const returnValue = await getBalances();
        assert.deepEqual(returnValue, [
          {
            asset: 'BTC',
            amount: '0',
          },
          {
            asset: 'XLM',
            amount: '0',
          },
          {
            asset: 'MATIC',
            amount: '25',
          },
          {
            asset: 'ETC',
            amount: '0',
          },
          {
            asset: 'ETH',
            amount: '200.0001',
          },
          {
            asset: 'USD',
            amount: '25.00',
          },
        ]);
      });
    });
  });
});
