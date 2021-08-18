// Note that we import the client interface type, not the client constructor.
import {
  LunchMoneyCryptoConnection,
  LunchMoneyCryptoConnectionContext,
  LunchMoneyCryptoConnectionConfig,
  CryptoBalance,
} from './types.js';

export { LunchMoneyCryptoConnection } from './types.js';

export interface LunchMoneyCoinbaseConnectionConfig extends LunchMoneyCryptoConnectionConfig {
  apiKey: string;
  apiSecret: string;
}

export interface LunchMoneyCoinbaseConnectionContext extends LunchMoneyCryptoConnectionContext {
  coinbaseClientConstructor: unknown;
}

export const LunchMoneyCoinbaseConnection: LunchMoneyCryptoConnection<
  LunchMoneyCoinbaseConnectionConfig,
  LunchMoneyCoinbaseConnectionContext
> = {
  async initiate(config, context) {
    config;
    context;
    throw new Error('Method not implemented.');
  },
  async getBalances(config, context) {
    config;
    context;

    const exampleBalance: CryptoBalance = {
      asset: 'ETH',
      amount: '3.1415925',
    };

    exampleBalance;

    throw new Error('Method not implemented.');
  },
};
