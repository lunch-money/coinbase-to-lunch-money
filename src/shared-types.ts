/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Serializable configuration for the connection
 */
// TODO: Remove this if there isn't any shared config type between our
// integrations that makes sense here.

export type LunchMoneyCryptoConnectionConfig = {
  [key: string]: any;
};

/**
 * Non-serializable injected dependencies for the connection
 */
// TODO: Remove this if there isn't any shared context type between our
// integrations that makes sense here.
export type LunchMoneyCryptoConnectionContext = {
  [key: string]: any;
};

export interface CryptoBalance {
  asset: string;
  amount: string;
}

export const providerNames = ['coinbase', 'coinbase_pro', 'kraken', 'coinbase', 'wallet_ethereum'] as const;
export type ProviderName = typeof providerNames[number];
export interface LunchMoneyCryptoConnectionBalances {
  providerName: ProviderName;
  balances: CryptoBalance[];
}

export type LunchMoneyCryptoConnectionInitialization = LunchMoneyCryptoConnectionBalances;

export interface LunchMoneyCryptoConnection<
  TConfig extends LunchMoneyCryptoConnectionConfig,
  TContext extends LunchMoneyCryptoConnectionContext,
> {
  initiate(config: TConfig, context?: TContext): Promise<LunchMoneyCryptoConnectionInitialization>;
  getBalances(config: TConfig, context?: TContext): Promise<LunchMoneyCryptoConnectionBalances>;
}
