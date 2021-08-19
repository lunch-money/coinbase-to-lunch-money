import { AxiosError, AxiosResponse, Method } from 'axios';
import { CoinbaseClient } from './Coinbase/Client.js';
import { LunchMoneyCryptoConnectionConfig, LunchMoneyCryptoConnectionContext } from './shared-types.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

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
  request: (method: Method, path: string, data?: CoinbaseData) => Promise<CoinbaseRequestHandlerResponse>;
}

export type CoinbaseRequestHandlerResponse = AxiosResponse | AxiosError['response'];

export type CoinbaseResult = {
  pagination?: {
    ending_before: string | null;
    starting_after: string | null;
    limit: number;
    order: 'asc' | 'desc';
    previous_uri: string | null;
    next_uri: string | null;
  };
  data?: Record<string, any>;
  errors?: { id: string; message: string }[];
  warnings?: { id: string; message: string; url?: string }[];
};
