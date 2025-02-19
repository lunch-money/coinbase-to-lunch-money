import { CoinbaseClient } from './CoinbaseClient';
import { CoinbaseConfig } from './types';
import { LunchMoneyCryptoConnection } from './shared-types';

export * from './types';

// Create default coinbase client
const defaultCoinbaseClientConstructor = CoinbaseClient;

/**
 * Lunch Money Coinbase Connection
 */
export const LunchMoneyCoinbaseConnection: LunchMoneyCryptoConnection<CoinbaseConfig, typeof CoinbaseClient> = {
  /**
   * Initiate a connection to a user's coinbase account.
   *
   * - Check that we have correct permissions
   * - Return all balances
   */
  async initiate(config, CoinbaseClient = defaultCoinbaseClientConstructor) {
    return LunchMoneyCoinbaseConnection.getBalances(config, CoinbaseClient);
  },

  /**
   * Get the current balances of a user's coinbase account.
   *
   * - Return all balances
   */
  async getBalances(config, CoinbaseClient = defaultCoinbaseClientConstructor) {
    const coinbase = new CoinbaseClient(config);
    const balances = await coinbase.getBalances();

    return {
      providerName: 'coinbase',
      balances,
    };
  },
};
