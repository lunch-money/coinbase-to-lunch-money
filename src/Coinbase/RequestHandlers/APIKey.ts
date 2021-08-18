import axios, { Method } from 'axios';
import crypto from 'crypto';
import { CoinbaseData, CoinbaseRequestHandler, CoinbaseResponse } from '../../types.js';
import { URLSearchParams } from 'url';

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

  async send(method: Method, url: string, data: CoinbaseData): Promise<CoinbaseResponse> {
    const apiKey = this.apiKey;
    const apiSecret = this.apiSecret;

    const timestamp = APIKeyRequestHandler.getTimestamp();
    const message = APIKeyRequestHandler.getMessage(timestamp, method, url, data);
    const signature = APIKeyRequestHandler.getSignature(message, apiSecret);

    const response = await axios.request({
      url,
      method,
      data,
      headers: {
        'CB-ACCESS-SIGN': signature,
        'CB-ACCESS-TIMESTAMP': timestamp,
        'CB-ACCESS-KEY': apiKey,
        'CB-VERSION': '2015-07-22',
      },
    });

    if (response.status !== 200) {
      throw new Error(`Coinbase API responded with status ${response.status}`);
    }

    if (typeof response.data === 'undefined') {
      throw new Error(`Coinbase API responded with no data`);
    }

    return response.data;
  }
}
