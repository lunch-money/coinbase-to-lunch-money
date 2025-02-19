import { AxiosError, AxiosResponse, Method } from 'axios';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Config for CoinbaseClient
 */
export interface CoinbaseConfig {
  name: string;
  privateKey: string;
  testPagination?: boolean;
  mockApiResponseTest?: boolean;
}

export type CoinbaseData = Record<string, string> | string;

export interface CoinbaseRequestHandler {
  request: (method: Method, path: string, data?: CoinbaseData) => Promise<CoinbaseRequestHandlerResponse>;
}

export type CoinbaseRequestHandlerResponse = AxiosResponse | AxiosError['response'];

interface CurrencyAmount {
  value: string; // Amount of currency that this object represents
  currency: string; // Denomination of the currency
}

export interface CoinbaseAccount {
  uuid: string; // Unique identifier for account
  name: string; // Name for the account
  currency: string; // Currency symbol for the account
  available_balance: CurrencyAmount; // Available balance in the account
  default: boolean; // Whether or not this account is the user's primary account
  active: boolean; // Whether or not this account is active and okay to use
  created_at: string; // Time at which this account was created (RFC3339 Timestamp)
  updated_at: string; // Time at which this account was updated (RFC3339 Timestamp)
  deleted_at: string; // Time at which this account was deleted (RFC3339 Timestamp)
  type:
    | 'ACCOUNT_TYPE_UNSPECIFIED'
    | 'ACCOUNT_TYPE_CRYPTO'
    | 'ACCOUNT_TYPE_FIAT'
    | 'ACCOUNT_TYPE_VAULT'
    | 'ACCOUNT_TYPE_PERP_FUTURES'; // Type of the account
  ready: boolean; // Whether or not this account is ready to trade
  hold: CurrencyAmount; // Amount that is being held for pending transfers against the available balance
  retail_portfolio_id: string; // The ID of the portfolio this account is associated with
  platform:
    | 'ACCOUNT_PLATFORM_UNSPECIFIED'
    | 'ACCOUNT_PLATFORM_CONSUMER'
    | 'ACCOUNT_PLATFORM_CFM_CONSUMER'
    | 'ACCOUNT_PLATFORM_INTX'; // Platform type
}

export interface CoinbaseResult {
  accounts: CoinbaseAccount[];
  has_next: boolean;
  cursor: string;
  size: number;
}
