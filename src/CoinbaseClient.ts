import axios, { AxiosRequestConfig, Method } from 'axios';
import { sign, SignOptions } from 'jsonwebtoken';
import { createPrivateKey, sign as cryptoSign } from 'crypto';
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

// PKCS#8 DER prefix for Ed25519 (16 fixed bytes preceding the 32-byte seed)
const PKCS8_ED25519_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');

function base64urlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

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

    if (response.status >= 400) {
      const body = response.data;
      const detail = body?.message || body?.error || `HTTP ${response.status}`;
      console.log(`Coinbase API rejected request (${response.status}): ${detail}`);
      throw new Error(`Coinbase API error (${response.status}): ${detail}`);
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
   * Generate a JWT for the current request.
   *
   * Detects the key type from the PEM header when present. For raw base64 keys
   * (no header), attempts Ed25519 first (the newer Coinbase default) then falls
   * back to ECDSA.
   */
  private generateSignedJwt(method: Method, url: string): string {
    if (this.config.mockApiResponseTest) {
      return '';
    }
    const key_name = this.config.name;
    const key_secret = this.config.privateKey;
    const strippedUrl = url.replace(/^https?:\/\//, '');
    const uri = `${method} ${strippedUrl}`;

    const payload = {
      iss: 'cdp',
      nbf: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 120,
      sub: key_name,
      uri,
    };

    try {
      const { pem, algorithm } = this.prepareKey(key_secret);
      if (algorithm === 'EdDSA') {
        return this.signJwtEdDSA(payload, pem, key_name);
      }
      const options: SignOptions = {
        algorithm: 'ES256',
        header: { kid: key_name, alg: 'ES256' },
      };
      return sign(payload, pem, options);
    } catch (e) {
      const message = (e as Error).message;
      console.log(`Failed to get signed token with API credentials: ${message}`);
      throw new Error(`Unable to access Coinbase API with supplied credentials: ${message}`);
    }
  }

  /**
   * Determine key type and return a PEM-formatted key ready for signing.
   *
   * Priority:
   *   1. PEM header present → use it directly (ECDSA or Ed25519)
   *   2. No header + ≤64 bytes → must be raw Ed25519 material; construct PKCS#8 PEM
   *   3. No header + >64 bytes → ECDSA P-256 DER content; re-wrap with EC PEM headers
   */
  private prepareKey(rawKey: string): { pem: string; algorithm: 'ES256' | 'EdDSA' } {
    if (rawKey.includes('-----BEGIN EC PRIVATE KEY-----')) {
      return { pem: rawKey, algorithm: 'ES256' };
    }
    if (rawKey.includes('-----BEGIN PRIVATE KEY-----')) {
      return { pem: rawKey, algorithm: 'EdDSA' };
    }

    // No PEM header — use byte length to distinguish key types:
    // Ed25519 raw keys are exactly 32 bytes (seed) or 64 bytes (extended seed + public key).
    // ECDSA P-256 DER content is ~120 bytes, so anything larger must be ECDSA.
    const rawBytes = Buffer.from(rawKey, 'base64');

    if (rawBytes.length <= 64) {
      // Keys this small must be raw Ed25519 material (32-byte seed or 64-byte extended key).
      // ECDSA P-256 DER content is ~120 bytes so it can never appear here.
      const seed = rawBytes.slice(0, 32);
      const pkcs8Der = Buffer.concat([PKCS8_ED25519_PREFIX, seed]);
      const pem = `-----BEGIN PRIVATE KEY-----\n${pkcs8Der.toString('base64')}\n-----END PRIVATE KEY-----\n`;
      createPrivateKey(pem); // throws a meaningful error if the bytes are not valid Ed25519
      return { pem, algorithm: 'EdDSA' };
    }

    // Bytes longer than 64 are ECDSA P-256 DER content — re-wrap with EC PEM headers
    const pem = `-----BEGIN EC PRIVATE KEY-----\n${rawKey}\n-----END EC PRIVATE KEY-----\n`;
    return { pem, algorithm: 'ES256' };
  }

  /**
   * Sign a JWT using Ed25519 via Node's built-in crypto module.
   * jsonwebtoken's jws sub-dependency does not support EdDSA, so we sign
   * the token directly here.
   */
  private signJwtEdDSA(payload: object, privateKeyPem: string, keyName: string): string {
    const header = { alg: 'EdDSA', typ: 'JWT', kid: keyName };
    const headerB64 = base64urlEncode(Buffer.from(JSON.stringify(header)));
    const payloadB64 = base64urlEncode(Buffer.from(JSON.stringify(payload)));
    const signingInput = `${headerB64}.${payloadB64}`;
    const key = createPrivateKey(privateKeyPem);
    const signature = cryptoSign(null, Buffer.from(signingInput), key);
    return `${signingInput}.${base64urlEncode(signature)}`;
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
      // The original implementation of this connector filtered out zero balances
      // but we WANT these otherwise Lunch Money will inaccurately reflect the last
      // non-zero balance for currencies that were completely sold off
      // .filter((account: { available_balance: { value: string; currency: string } }) => {
      //   return parseFloat(account.available_balance.value) > 0;
      // })
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
