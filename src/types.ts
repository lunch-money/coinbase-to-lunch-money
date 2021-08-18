import { CoinbaseClient } from './Coinbase/Client.js';
import { LunchMoneyCryptoConnectionConfig, LunchMoneyCryptoConnectionContext } from './shared-types.js';
import { Method } from 'axios';

export interface LunchMoneyCoinbaseConnectionConfig extends LunchMoneyCryptoConnectionConfig {
  apiKey: string;
  apiSecret: string;
}

export interface LunchMoneyCoinbaseConnectionContext extends LunchMoneyCryptoConnectionContext {
  coinbaseClientConstructor: typeof CoinbaseClient;
}

export type CoinbaseCredentials = Record<string, string>;
export type CoinbaseData = Record<string, string> | string;

export interface CoinbaseRequestHandler {
  send: (method: Method, url: string, data: CoinbaseData) => Promise<CoinbaseResponse>;
}

export type CoinbaseResponse = Record<string, string>;
