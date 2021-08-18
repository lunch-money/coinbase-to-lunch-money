import axios, { Method } from 'axios';
import { CoinbaseData, CoinbaseRequestHandler, CoinbaseResponse } from '../../types.js';

export class OAuth2RequestHandler implements CoinbaseRequestHandler {
  constructor(private accessToken: string, private refreshToken: string) {}

  async send(method: Method, url: string, data: CoinbaseData): Promise<CoinbaseResponse> {
    this.accessToken;
    this.refreshToken;
    method;
    url;
    data;
    axios;
    throw new Error('Method not implemented.');
  }
}
