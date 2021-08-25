import { CoinbaseConfig, CoinbaseData, CoinbaseRequestHandler, CoinbaseResult } from '../types.js';
import { CryptoBalance } from '../shared-types.js';
import { Method } from 'axios';
declare const BASE_URL = "https://api.coinbase.com";
/**
 * Coinbase Client
 *
 * Coinbase doesn't have an official node client, so a basic one is provided.
 *
 * There are two authentication methods: API key and OAuth2. Coinbase
 * discourages the use of API Keys except when writing your own software, so
 * OAuth2 is preferred.
 */
export declare class CoinbaseClient {
    requiredScopes: string[];
    _requestHandler?: CoinbaseRequestHandler;
    /**
     * Create the client instance with baseUrl and scopes
     */
    constructor(requiredScopes: string[]);
    /**
     * Returns true if scopes match. Otherwise throws errors.
     */
    static hasCorrectScopes(requiredScopes: string[], grantedScopes: string[], options?: {
        failIfNotExact: boolean;
    }): boolean;
    /**
     * Set client config
     */
    setConfig(config: CoinbaseConfig): void;
    /**
     * Execute a request and handle the response
     */
    request(method: Method, path: string, data?: CoinbaseData): Promise<CoinbaseResult>;
    /**
     * Returns true if we can connect to the API and have permission to view
     * balances.
     *
     * Will throw an error otherwise.
     *
     * @see https://developers.coinbase.com/api/v2#show-authorization-information
     */
    hasRequiredPermissions(): Promise<boolean>;
    /**
     * Returns current coinbase holdings
     * Required scopes: `wallet:accounts:read`
     *
     * @see https://developers.coinbase.com/api/v2#list-accounts
     */
    getAllBalances(): Promise<CryptoBalance[]>;
}
export { BASE_URL as coinbaseAPIBaseUrl };
