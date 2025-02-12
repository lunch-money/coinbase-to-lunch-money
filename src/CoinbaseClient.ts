import axios, { AxiosRequestConfig, Method } from 'axios';
import { sign, SignOptions } from 'jsonwebtoken';
import { CoinbaseAccount, CoinbaseConfig, CoinbaseData, CoinbaseResult } from './types';
import { CryptoBalance } from './shared-types';
import { URL } from 'url';

const BASE_URL = 'https://api.coinbase.com';
const ENDPOINTS = {
  accounts: 'api/v3/brokerage/accounts',
};
const QUERY_PARAMS = {
  accounts: { limit: 100 },
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
   * Execute a request and handle the response
   */
  async request(
    method: Method,
    path: string,
    query: Record<string, unknown> = {},
    data: CoinbaseData = '',
  ): Promise<CoinbaseResult['accounts']> {
    const url = new URL(path, BASE_URL).href;
    const sJWT = this.generateSignedJwt(method, url);

    const requestConfig: AxiosRequestConfig = {
      url,
      params: query,
      method,
      data,
      headers: {
        Authorization: `Bearer ${sJWT}`,
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

    if (typeof result === 'undefined') {
      throw new Error(`Coinbase API responded with no data`);
    }

    // Process results based on the type of request
    if (path == ENDPOINTS.accounts) {
      // Loop through pagination to fetch all results
      // @see https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getaccounts
      if (typeof result.has_next && result.cursor) {
        // If there is another page of resources after this one, request it and
        // append to our results. This will act recursively until all pages have
        // been returned.
        const nextResult = await this.request(method, ENDPOINTS.accounts, { ...query, cursor: result.cursor });
        result.accounts = result.accounts.concat(nextResult || []);
      }
      return result.accounts;
    } else {
      throw new Error(`Invalid path: ${path}. Path must match one of the defined endpoints.`);
    }
  }

  /**
   * Generate a JWT for the current request
   */
  private generateSignedJwt(method: Method, url: string): string {
    if (this.config.mockApiResponseTest) {
      return '';
    }
    const key_name = this.config.name;
    const key_secret = this.config.privateKey;
    const strippedUrl = url.replace(/^https?:\/\//, '');
    const uri = `${method} ${strippedUrl}`;
    const algorithm = 'ES256';

    const payload = {
      iss: 'cdp',
      nbf: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 120,
      sub: key_name,
      uri,
    };

    const options: SignOptions = {
      algorithm,
      header: {
        kid: key_name,
        alg: algorithm,
      },
    };
    try {
      const token = sign(payload, key_secret, options);
      return token;
    } catch (e) {
      console.log(`Failed to get signed token with API credentials: ${(e as Error).message}`);
      throw new Error('Unable to access Coinbase API with supplied credentials!');
    }
  }

  /**
   * Returns current coinbase accounts
   *
   * @see https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getaccounts
   */
  async getAccounts(): Promise<CoinbaseAccount[]> {
    const query = this.config.testPagination ? { ...QUERY_PARAMS.accounts, limit: 1 } : QUERY_PARAMS.accounts;
    const accounts = await this.request('GET', ENDPOINTS.accounts, query);

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
    const balances = accounts
      .filter((account: { available_balance: { value: string; currency: string } }) => {
        return parseFloat(account.available_balance.value) > 0;
      })
      .map((account: { available_balance: { value: string; currency: string } }) => {
        return {
          asset: account.available_balance.currency,
          amount: account.available_balance.value,
        } as CryptoBalance;
      });
    return balances;
  }
}

export { BASE_URL as coinbaseAPIBaseUrl, ENDPOINTS as coinbaseEndpoints };
