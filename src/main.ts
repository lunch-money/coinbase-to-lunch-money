import { LunchMoneyCoinbaseConnectionConfig, LunchMoneyCoinbaseConnectionContext } from './types.js';
import { LunchMoneyCryptoConnection, LunchMoneyCryptoConnectionBalances } from './shared-types.js';

export * from './types.js';

export const LunchMoneyCoinbaseConnection: LunchMoneyCryptoConnection<
  LunchMoneyCoinbaseConnectionConfig,
  LunchMoneyCoinbaseConnectionContext
> = {
  async initiate(config, context) {
    const { coinbaseClientConstructor: CoinbaseClient } = context;

    const coinbase = new CoinbaseClient(config);

    if (!(await coinbase.hasRequiredPermissions())) {
      throw new Error('Invalid permissions');
    }

    LunchMoneyCoinbaseConnection.getBalances(config, context);

    throw new Error('Method not implemented.');
  },

  async getBalances(config, context) {
    const { coinbaseClientConstructor: CoinbaseClient } = context;

    const coinbase = new CoinbaseClient(config);
    const balances = await coinbase.getAllBalances();

    const response: LunchMoneyCryptoConnectionBalances = {
      providerName: 'coinbase',
      balances,
    };

    // @todo - do something with the responses
    response;

    throw new Error('Method not implemented.');
  },
};
