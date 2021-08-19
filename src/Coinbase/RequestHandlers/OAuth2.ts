import axios, { Method } from 'axios';
import { CoinbaseData, CoinbaseRequestHandler, CoinbaseRequestHandlerResponse } from '../../types.js';

/**
 * OAuth2 request handler for Coinbase Client
 */
export class OAuth2RequestHandler implements CoinbaseRequestHandler {
  constructor(public baseUrl: string, private accessToken: string, private refreshToken: string) {}

  async request(method: Method, path: string, data: CoinbaseData = ''): Promise<CoinbaseRequestHandlerResponse> {
    this.accessToken;
    this.refreshToken;
    method;
    path;
    data;
    axios;
    throw new Error('Method not implemented.');
  }
}
