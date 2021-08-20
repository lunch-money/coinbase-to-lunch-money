import { APIKeyRequestHandler } from './RequestHandlers/APIKey.js';
import { CoinbaseConfig, CoinbaseData, CoinbaseRequestHandler, CoinbaseResult } from '../types.js';
import { CryptoBalance } from '../shared-types.js';
import { Method } from 'axios';
import { URL } from 'url';

const BASE_URL = 'https://api.coinbase.com';

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
  // the request handler for the client to use
  _requestHandler?: CoinbaseRequestHandler;

  /**
   * Create the client instance with baseUrl and scopes
   */
  constructor(public requiredScopes: string[]) {}

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
   * Set client config
   */
  setConfig(config: CoinbaseConfig): void {
    // Use api key handler if given api keys
    if (config.apiKey && config.apiSecret) {
      const { apiKey, apiSecret } = config;
      this._requestHandler = new APIKeyRequestHandler(apiKey, apiSecret);
      return;
    }

    throw new TypeError(`Invalid credentials`);
  }

  /**
   * Execute a request and handle the response
   */
  async request(method: Method, path: string, data: CoinbaseData = ''): Promise<CoinbaseResult> {
    const url = new URL(path, BASE_URL).href;

    // Route to request handler
    if (typeof this._requestHandler === 'undefined') {
      throw new Error('Cannot call request() without request handler');
    }

    const response = await this._requestHandler.request(method, url, data);

    // Process response
    if (!response) {
      throw new Error('Invalid response');
    }

    if (typeof response.data === 'undefined') {
      throw new Error(`Coinbase API responded with no data`);
    }

    const result = response.data;

    // Handle error response from API
    // @see https://developers.coinbase.com/api/v2#error-response
    if (response.status !== 200) {
      if (result.errors) {
        console.error(result.errors);
      }

      throw new Error(`${method} ${BASE_URL}${path} responded with status ${response.status}`);
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
      result.data = result.data.concat(nextResult.data || []);
    }

    return result;
  }

  /**
   * Returns true if we can connect to the API and have permission to view
   * balances.
   *
   * Will throw an error otherwise.
   *
   * @see https://developers.coinbase.com/api/v2#show-authorization-information
   */
  async hasRequiredPermissions(): Promise<boolean> {
    const userAuthResult = await this.request('GET', '/v2/user/auth');

    if (typeof userAuthResult.data === 'undefined') {
      throw new Error('Could not fetch scopes data');
    }

    const hasCorrectScopes = CoinbaseClient.hasCorrectScopes(this.requiredScopes, userAuthResult.data.scopes);

    return hasCorrectScopes;
  }

  /**
   * Returns current coinbase holdings
   * Required scopes: `wallet:accounts:read`
   *
   * @see https://developers.coinbase.com/api/v2#list-accounts
   */
  async getAllBalances(): Promise<CryptoBalance[]> {
    const accountsResult = await this.request('GET', '/v2/accounts?&limit=100');

    if (!accountsResult.data) {
      throw new Error('Could not fetch accounts data');
    }

    const balances = accountsResult.data.map((account: { balance: Record<string, string> }) => {
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
