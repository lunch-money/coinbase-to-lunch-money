import { APIKeyRequestHandler } from './RequestHandlers/APIKey.js';
import { CoinbaseCredentials, CoinbaseData, CoinbaseRequestHandler, CoinbaseResult } from '../types.js';
import { CryptoBalance } from '../shared-types.js';
import { Method } from 'axios';
import { OAuth2RequestHandler } from './RequestHandlers/OAuth2.js';

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
  constructor(public baseUrl: string, public requiredScopes: string[]) {}

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

    if (options.failIfNotExact && requiredScopes.length > grantedScopes.length) {
      throw new Error(`Superfluous permissions: remove ${extraScopes}`);
    }

    return true;
  }

  /**
   * Set client credentials
   */
  setCredentials(credentials: CoinbaseCredentials): void {
    // Use api key handler if given api keys
    if (credentials.apiKey && credentials.apiSecret) {
      const { apiKey, apiSecret } = credentials;
      this._requestHandler = new APIKeyRequestHandler(this.baseUrl, apiKey, apiSecret);
      return;
    }

    // Use oath2 handler if given oauth2 tokens
    if (credentials.accessToken && credentials.refreshToken) {
      const { accessToken, refreshToken } = credentials;
      this._requestHandler = new OAuth2RequestHandler(this.baseUrl, accessToken, refreshToken);
      return;
    }

    throw new TypeError(`Invalid credentials`);
  }

  /**
   * Execute a request and handle the response
   */
  async request(method: Method, path: string, data: CoinbaseData = ''): Promise<CoinbaseResult> {
    // Route to request handler
    if (typeof this._requestHandler === 'undefined') {
      throw new Error('Cannot call request() without request handler');
    }

    const response = await this._requestHandler.request(method, path, data);

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

      throw new Error(`${method} ${this.baseUrl}${path} responded with status ${response.status}`);
    }

    // Help devs notice warnings
    // @see https://developers.coinbase.com/api/v2#warnings
    if (result.warnings) {
      console.warn(result.warnings);
    }

    // Loop through paginaton to fetch all results
    // @see https://developers.coinbase.com/api/v2#pagination
    if (typeof result.pagination === 'object') {
      if (typeof result.pagination.next_uri === 'string') {
        // If there is another page of resources after this one, request it and
        // append to our results. This will act recursively until all pages have
        // been returned.
        const nextResult = await this.request(method, result.pagination.next_uri, data);
        result.data = result.data.concat(nextResult.data || []);
      }
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

    if (!userAuthResult.data) {
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
