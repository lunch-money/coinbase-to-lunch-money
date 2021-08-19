import axios, { Method } from 'axios';
import crypto from 'crypto';
import { CoinbaseData, CoinbaseRequestHandler, CoinbaseRequestHandlerResponse } from '../../types.js';
import { URLSearchParams } from 'url';

const BASE_URL = 'https://api.coinbase.com';

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
  static getMessage(timestamp: number, method: string, path: string, data: CoinbaseData = ''): string {
    if (typeof data !== 'string') {
      throw new TypeError('data must be a string');
    }

    return `${timestamp}${method}${path}${data}`;
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
  async request(method: Method, path: string, data: CoinbaseData = ''): Promise<CoinbaseRequestHandlerResponse> {
    const apiKey = this.apiKey;
    const apiSecret = this.apiSecret;

    const timestamp = APIKeyRequestHandler.getTimestamp();
    const message = APIKeyRequestHandler.getMessage(timestamp, method, path, data);
    const signature = APIKeyRequestHandler.getSignature(message, apiSecret);

    const url = BASE_URL + path;

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
      // ignore non-axios errors
      if (!axios.isAxiosError(err)) {
        throw err;
      }

      // passthru axios errors
      response = err.response;
    }

    return response;
  }
}
