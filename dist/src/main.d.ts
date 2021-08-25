import { CoinbaseClient } from './Coinbase/Client.js';
import { CoinbaseConfig } from './types.js';
import { LunchMoneyCryptoConnection } from './shared-types.js';
export * from './types.js';
/**
 * Lunch Money Coinbase Connection
 */
export declare const LunchMoneyCoinbaseConnection: LunchMoneyCryptoConnection<CoinbaseConfig, CoinbaseClient>;
