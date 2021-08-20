import { CoinbaseClient } from './Coinbase/Client.js';
import { CoinbaseCredentials } from './types.js';
import { LunchMoneyCryptoConnection } from './shared-types.js';

export * from './types.js';

// Create default coinbase client
const defaultCoinbaseClient = new CoinbaseClient(['wallet:accounts:read']);

/**
 * Lunch Money Coinbase Connection
 */
export const LunchMoneyCoinbaseConnection: LunchMoneyCryptoConnection<CoinbaseCredentials, CoinbaseClient> = {
  /**
   * Initiate a connection to a user's coinbase account.
   *
   * - Check that we have correct permissions
   * - Return all balances
   */
  async initiate(config, coinbase = defaultCoinbaseClient) {
    coinbase.setConfig(config);

    if (!(await coinbase.hasRequiredPermissions())) {
      throw new Error('Invalid permissions');
    }

    return LunchMoneyCoinbaseConnection.getBalances(config, coinbase);
  },

  /**
   * Get the current balances of a user's coinbase account.
   *
   * - Return all balances
   */
  async getBalances(config, coinbase = defaultCoinbaseClient) {
    coinbase.setConfig(config);

    const balances = await coinbase.getAllBalances();

    return {
      providerName: 'coinbase',
      balances,
    };
  },
};
