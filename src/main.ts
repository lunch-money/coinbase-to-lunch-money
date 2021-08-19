import { CoinbaseClient } from './Coinbase/Client.js';
import { LunchMoneyCoinbaseConnectionConfig, LunchMoneyCoinbaseConnectionContext } from './types.js';
import { LunchMoneyCryptoConnection } from './shared-types.js';

export * from './types.js';

// Different contexts can be provided for testing purposes
const defaultContext = {
  coinbaseClientConstructor: CoinbaseClient,
};

/**
 * Lunch Money Coinbase Connection
 */
export const LunchMoneyCoinbaseConnection: LunchMoneyCryptoConnection<
  LunchMoneyCoinbaseConnectionConfig,
  LunchMoneyCoinbaseConnectionContext
> = {
  /**
   * Initiate a connection to a user's coinbase account.
   *
   * - Check that we have correct permissions
   * - Return all balances
   */
  async initiate(config, context = defaultContext) {
    const { coinbaseClientConstructor: CoinbaseClient } = context;

    const coinbase = new CoinbaseClient(config, ['wallet:accounts:read']);

    if (!(await coinbase.hasRequiredPermissions())) {
      throw new Error('Invalid permissions');
    }

    return LunchMoneyCoinbaseConnection.getBalances(config, context);
  },

  /**
   * Get the current balances of a user's coinbase account.
   *
   * - Return all balances
   */
  async getBalances(config, context = defaultContext) {
    const { coinbaseClientConstructor: CoinbaseClient } = context;

    const coinbase = new CoinbaseClient(config, ['wallet:accounts:read']);
    const balances = await coinbase.getAllBalances();

    return {
      providerName: 'coinbase',
      balances,
    };
  },
};
