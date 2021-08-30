import axios, { Method } from 'axios';
import crypto from 'crypto';
import { CoinbaseAccount, CoinbaseConfig, CoinbaseData, CoinbaseResult } from './types';
import { CryptoBalance } from './shared-types';
import { URL, URLSearchParams } from 'url';

const REQUIRED_SCOPES = ['wallet:accounts:read'];
const BASE_URL = 'https://api.coinbase.com';
const ENDPOINTS = {
  userAuth: '/v2/user/auth',
  accounts: '/v2/accounts?limit=100',
};

/**
 * Coinbase Client
 *
 * Coinbase doesn't have an official node client, so a basic one is provided.
 *
 * There are two authentication methods: API key and OAuth2. Coinbase
 * discourages the use of API Keys except when writing your own software, so
 * OAuth2 is preferred.
 */
export class CoinbaseClient {
  /**
   * Create the client instance with baseUrl and scopes
   */
  constructor(public config: CoinbaseConfig) {}

  /**
   * Returns true if scopes match. Otherwise throws errors.
   */
  static hasCorrectScopes(
    requiredScopes: string[],
    grantedScopes: string[],
    options = { failIfNotExact: true },
  ): boolean {
    const missingScopes = requiredScopes.filter((requiredScope) => !grantedScopes.includes(requiredScope));
    const extraScopes = grantedScopes.filter((grantedScope) => !requiredScopes.includes(grantedScope));

    if (missingScopes.length) {
      throw new Error(`Insufficient permissions: add ${missingScopes}`);
    }

    if (options.failIfNotExact && extraScopes.length) {
      throw new Error(`Superfluous permissions: remove ${extraScopes}`);
    }

    return true;
  }

  /**
   * Convert key/value objects to query string
   */
  static serializeData(data: CoinbaseData): string {
    // handle objects
    if (typeof data === 'object') {
      return new URLSearchParams(data).toString();
    }

    // handle other types
    return data.toString();
  }

  /**
   * Return current timestamp in seconds
   */
  static getTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * Concat request options as a "message"
   * @see https://developers.coinbase.com/docs/wallet/api-key-authentication
   */
  static getMessage(timestamp: number, method: string, url: string, data: CoinbaseData = ''): string {
    const { pathname, search } = new URL(url);

    if (typeof data !== 'string') {
      throw new TypeError('data must be a string');
    }

    return `${timestamp}${method}${pathname}${search}${data}`;
  }

  /**
   * Sign message with api secret
   */
  static getSignature(message: string, apiSecret: string): string {
    return crypto.createHmac('sha256', apiSecret).update(message).digest('hex');
  }

  /**
   * Execute a request and handle the response
   */
  async request(method: Method, path: string, data: CoinbaseData = ''): Promise<CoinbaseResult['data']> {
    const url = new URL(path, BASE_URL).href;

    const { apiKey, apiSecret } = this.config;

    const timestamp = CoinbaseClient.getTimestamp();
    const message = CoinbaseClient.getMessage(timestamp, method, url, data);
    const signature = CoinbaseClient.getSignature(message, apiSecret);

    const requestConfig = {
      url,
      method,
      data,
      headers: {
        'CB-ACCESS-SIGN': signature,
        'CB-ACCESS-TIMESTAMP': timestamp,
        'CB-ACCESS-KEY': apiKey,
        'CB-VERSION': '2015-07-22',
      },
    };

    // Make the request
    let response;
    try {
      response = await axios(requestConfig);
    } catch (err) {
      // re-throw normal errors
      if (!axios.isAxiosError(err)) {
        throw err;
      }

      // return axios errors
      // as endpoints do return content even when triggering status errors
      response = err.response;
    }

    // Process response
    if (!response) {
      throw new Error('Invalid response');
    }

    if (typeof response.data === 'undefined') {
      throw new Error(`Coinbase API responded with no data`);
    }

    const result = response.data as CoinbaseResult;

    if (typeof result.data === 'undefined') {
      throw new Error(`Coinbase API responded with no data`);
    }

    // Handle error response from API
    // @see https://developers.coinbase.com/api/v2#error-response
    if (response.status !== 200) {
      if (result.errors) {
        console.error(result.errors);
      }

      throw new Error(`${method} ${url} responded with status ${response.status}`);
    }

    // Help devs notice warnings
    // @see https://developers.coinbase.com/api/v2#warnings
    if (result.warnings) {
      console.warn(result.warnings);
    }

    // Loop through paginaton to fetch all results
    // @see https://developers.coinbase.com/api/v2#pagination
    if (typeof result.pagination === 'object' && typeof result.pagination.next_uri === 'string') {
      // If there is another page of resources after this one, request it and
      // append to our results. This will act recursively until all pages have
      // been returned.
      const nextResult = await this.request(method, result.pagination.next_uri, data);
      result.data = result.data.concat(nextResult || []);
    }

    return result.data;
  }

  /**
   * Returns true if we can connect to the API and have permission to view
   * balances.
   *
   * Will throw an error otherwise.
   *
   * @see https://developers.coinbase.com/api/v2#show-authorization-information
   */
  async throwErrorOnBadPermissions(): Promise<boolean> {
    const userAuth = await this.request('GET', ENDPOINTS.userAuth);

    if (typeof userAuth === 'undefined') {
      throw new Error('Could not fetch scopes data');
    }

    const hasCorrectScopes = CoinbaseClient.hasCorrectScopes(REQUIRED_SCOPES, userAuth.scopes);

    return hasCorrectScopes;
  }

  /**
   * Returns current coinbase accounts
   * Required scopes: `wallet:accounts:read`
   *
   * @see https://developers.coinbase.com/api/v2#list-accounts
   */
  async getAccounts(): Promise<CoinbaseAccount[]> {
    const accounts = await this.request('GET', ENDPOINTS.accounts);

    if (!accounts) {
      throw new Error('Could not fetch accounts data');
    }

    return accounts as CoinbaseAccount[];
  }

  /**
   * Returns current coinbase holdings
   */
  async getBalances(): Promise<CryptoBalance[]> {
    const accounts = await this.getAccounts();
    const balances = accounts.map((account: { balance: Record<string, string> }) => {
      const balance: CryptoBalance = {
        asset: account.balance.currency,
        amount: account.balance.amount,
      };

      return balance;
    });

    return balances;
  }
}

export { BASE_URL as coinbaseAPIBaseUrl };
