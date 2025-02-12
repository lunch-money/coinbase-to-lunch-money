import axios from 'axios';
import fs from 'fs';
import { assertThrowsAsync } from '../test/helpers/assertThrowsAsync';
import { LunchMoneyCoinbaseConnection } from '../src/main';

// Read keys from file
const keysFile = `./test-live/cdp_api_key.json`;

if (!fs.existsSync(keysFile)) {
  throw new Error(
    `To run live tests, copy the cdp_api_key.json generated when new coinbase API key is created to the test-live directory.\n` +
      `You can create a Coinbase API key and generate that file here: https://www.coinbase.com/settings/api\n\n`,
  );
}
const apiKeyData = fs.readFileSync(keysFile, 'utf8');
const config = JSON.parse(apiKeyData);
console.log(config);

//   // Use the data object
// const [apiKey, apiSecret] = fs.readFileSync(keysFile).toString().split('\n');
// console.log(apiKey)
// console.log(apiSecret)

// Log all requests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const log = (key: string, obj: any) => console.dir({ [key]: obj }, { depth: null });

axios.interceptors.response.use((response) => {
  log('response', {
    status: response.status,
    url: response.config.url,
    num_accounts: response.data.accounts.length,
    balance: response.data.accounts[0].available_balance,
    has_next: response.data.has_next,
  });
  return response;
});

// Run live tests
describe('initiate', () => {
  it('should log responses and result without error', async () => {
    const result = LunchMoneyCoinbaseConnection.initiate(config);
    log('result', await result);
  }).timeout(5000);

  it('should fail with error', async () => {
    await assertThrowsAsync(() =>
      LunchMoneyCoinbaseConnection.initiate({
        name: 'xxx',
        privateKey: 'yyy',
      }),
    );
  }).timeout(5000);

  it('should run the first step with forced pagination', async () => {
    config.testPagination = true;
    const result = LunchMoneyCoinbaseConnection.initiate(config);
    log('result', await result);
  }).timeout(5000);
});
