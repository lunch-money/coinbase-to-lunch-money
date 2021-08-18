import { APIKeyRequestHandler } from './RequestHandlers/APIKey.js';
import { CoinbaseCredentials, CoinbaseData, CoinbaseRequestHandler, CoinbaseResponse } from '../types.js';
import { CryptoBalance } from '../shared-types.js';
import { Method } from 'axios';
import { OAuth2RequestHandler } from './RequestHandlers/OAuth2.js';

export class CoinbaseClient {
  _requestHandler: CoinbaseRequestHandler;

  constructor(credentials: CoinbaseCredentials) {
    // Use api key handler if given api keys
    if (credentials.apiKey && credentials.apiSecret) {
      const { apiKey, apiSecret } = credentials;
      this._requestHandler = new APIKeyRequestHandler(apiKey, apiSecret);
      return;
    }

    // Use oath2 handler if given oauth2 tokens
    if (credentials.accessToken && credentials.refreshToken) {
      const { accessToken, refreshToken } = credentials;
      this._requestHandler = new OAuth2RequestHandler(accessToken, refreshToken);
      return;
    }

    // Fail if no valid credentials detected
    throw new TypeError(`Invalid credentials passed to coinbase client`);
  }

  /**
   * Route request to request handler
   */
  async send(method: Method, url: string, data: CoinbaseData): Promise<CoinbaseResponse> {
    return this._requestHandler.send(method, url, data);
  }

  /**
   * Returns true if we can connect to the API and have permission to view
   * balances.
   */
  async hasRequiredPermissions(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  /**
   * Returns current coinbase holdings
   */
  async getAllBalances(): Promise<CryptoBalance[]> {
    throw new Error('Method not implemented.');
  }
}
