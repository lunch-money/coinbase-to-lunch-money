import { CoinbaseClient } from './Coinbase/Client.js';
import { CoinbaseConfig } from './types.js';
import { LunchMoneyCryptoConnection } from './shared-types.js';

export * from './types.js';

// Create default coinbase client
const defaultCoinbaseClient = new CoinbaseClient(['wallet:accounts:read']);

/**
 * Lunch Money Coinbase Connection
 */
export const LunchMoneyCoinbaseConnection: LunchMoneyCryptoConnection<CoinbaseConfig, CoinbaseClient> = {
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

    /**
     * We can get the following datapoints per cryptocurrency account:
     *
     * {
     *  "id": "58542935-67b5-56e1-a3f9-42686e07fa40",
     *  "name": "My Vault",
     *  "primary": false,
     *  "type": "vault",
     *  "currency": "BTC",
     *  "balance": {
     *    "amount": "4.00000000",
     *   "currency": "BTC"
     *  },
     *  "created_at": "2015-01-31T20:49:02Z",
     *  "updated_at": "2015-01-31T20:49:02Z",
     *  "resource": "account",
     *  "resource_path": "/v2/accounts/58542935-67b5-56e1-a3f9-42686e07fa40",
     *  "ready": true
     * },
     *
     * The `crypto_balances` table can consume the following:
     *
     * Identifying fields: user_id, account_id, etc.
     * Timestamp fields: timestamp (of when this balance was captured)
     * Data fields: amount, currency, provider_currency, fiat_amount, fiat_currency
     * Reference fields: crypto_account_id (to map to specific provider/API key)
     * We will store historical balances in this table. Each row in this table represents a new daily balance. The latest balance on the account will be whatever is associated with the max timestamp. This logic is handled in Lunch Money core server.
     * The most important thing here is being able to identify which set of balances represent the same account under the provider.
     *
     * @TODO update getAllBalances to return datapoints required by `crypto_balances`
     */
    const balances = await coinbase.getAllBalances();

    return {
      providerName: 'coinbase',
      balances,
    };
  },
};
