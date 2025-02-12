import { expect } from 'chai';
import { config } from 'dotenv';
import { CoinbaseConfig } from './types';
import { LunchMoneyCoinbaseConnection } from '../src/main';

config();
/**
 * Tests
 */
describe('Coinbase', () => {
  let BALANCE_LENGTH: number, BALANCE_AMOUNT: string, BALANCE_ASSET: string, testConfig: CoinbaseConfig;

  before(() => {
    // Required environment variables for tests
    expect(process.env.API_KEY, 'Env var API_KEY should be set to Coinbase v3 API key name').to.exist;
    expect(process.env.API_SECRET, 'Env var API_SECRET should be set to Coinbase v2 API key secret').to.exist;
    expect(process.env.NUM_ACCOUNTS, 'Env var NUM_ACCOUNTS should be the number of accounts with non zero balance').to
      .exist;
    expect(process.env.BALANCE_ASSET, 'Env var BALANCE_ASSET should be the currency in one account, ie: "ETH"').to
      .exist;
    expect(process.env.BALANCE_AMOUNT, 'Env var BALANCE_AMOUNT should be balance for the currency').to.exist;
    BALANCE_LENGTH = Number(process.env.NUM_ACCOUNTS);
    BALANCE_AMOUNT = String(process.env.BALANCE_AMOUNT);
    BALANCE_ASSET = String(process.env.BALANCE_ASSET);
    testConfig = {
      apiKey: String(process.env.API_KEY),
      apiSecret: String(process.env.API_SECRET),
    };
  });

  it('should initiate and get balances', async () => {
    const connectionBalances = await LunchMoneyCoinbaseConnection.initiate(testConfig);
    expect(connectionBalances.providerName).to.equal('coinbase');
    expect(connectionBalances.balances.length).to.equal(BALANCE_LENGTH);
    const balances = connectionBalances.balances;
    const matchingBalance = balances.find((balance) => balance.asset === BALANCE_ASSET);
    expect(matchingBalance).to.not.be.undefined;
    if (matchingBalance) {
      expect(matchingBalance.amount).to.equal(BALANCE_AMOUNT);
    }
  });

  it('should initiate and get balances via paginated requests', async () => {
    const paginationConfig = { ...testConfig, testPagination: true };
    const connectionBalances = await LunchMoneyCoinbaseConnection.initiate(paginationConfig);
    expect(connectionBalances.providerName).to.equal('coinbase');
    expect(connectionBalances.balances.length).to.equal(BALANCE_LENGTH);
    const balances = connectionBalances.balances;
    const matchingBalance = balances.find((balance) => balance.asset === BALANCE_ASSET);
    expect(matchingBalance).to.not.be.undefined;
    if (matchingBalance) {
      expect(matchingBalance.amount).to.equal(BALANCE_AMOUNT);
    }
  });
});
