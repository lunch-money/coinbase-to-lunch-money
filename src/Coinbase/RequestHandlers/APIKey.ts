import axios, { Method } from 'axios';
import crypto from 'crypto';
import { CoinbaseData, CoinbaseRequestHandler, CoinbaseRequestHandlerResponse } from '../../types.js';
import { URL, URLSearchParams } from 'url';

/**
 * API key request handler for Coinbase Client
 */
export class APIKeyRequestHandler implements CoinbaseRequestHandler {
  constructor(private apiKey: string, private apiSecret: string) {}

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
   * Handle a request
   */
  async request(method: Method, url: string, data: CoinbaseData = ''): Promise<CoinbaseRequestHandlerResponse> {
    const { apiKey, apiSecret } = this;

    const timestamp = APIKeyRequestHandler.getTimestamp();
    const message = APIKeyRequestHandler.getMessage(timestamp, method, url, data);
    const signature = APIKeyRequestHandler.getSignature(message, apiSecret);

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

    return response;
  }
}
