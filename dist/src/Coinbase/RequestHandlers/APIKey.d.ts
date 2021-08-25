import { Method } from 'axios';
import { CoinbaseData, CoinbaseRequestHandler, CoinbaseRequestHandlerResponse } from '../../types.js';
/**
 * API key request handler for Coinbase Client
 */
export declare class APIKeyRequestHandler implements CoinbaseRequestHandler {
    private apiKey;
    private apiSecret;
    constructor(apiKey: string, apiSecret: string);
    /**
     * Convert key/value objects to query string
     */
    static serializeData(data: CoinbaseData): string;
    /**
     * Return current timestamp in seconds
     */
    static getTimestamp(): number;
    /**
     * Concat request options as a "message"
     * @see https://developers.coinbase.com/docs/wallet/api-key-authentication
     */
    static getMessage(timestamp: number, method: string, url: string, data?: CoinbaseData): string;
    /**
     * Sign message with api secret
     */
    static getSignature(message: string, apiSecret: string): string;
    /**
     * Handle a request
     */
    request(method: Method, url: string, data?: CoinbaseData): Promise<CoinbaseRequestHandlerResponse>;
}
