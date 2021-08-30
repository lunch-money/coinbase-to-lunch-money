import { AxiosError, AxiosResponse, Method } from 'axios';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Config for CoinbaseClient
 */
export interface CoinbaseConfig {
  apiKey: string;
  apiSecret: string;
  scopes?: string[];
}

export type CoinbaseData = Record<string, string> | string;

export interface CoinbaseRequestHandler {
  request: (method: Method, path: string, data?: CoinbaseData) => Promise<CoinbaseRequestHandlerResponse>;
}

export type CoinbaseRequestHandlerResponse = AxiosResponse | AxiosError['response'];

export interface CoinbaseAccount {
  balance: Record<string, string>;
}

export interface CoinbaseResult {
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
}
