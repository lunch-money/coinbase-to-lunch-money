import axios from 'axios';
import fs from 'fs';
import { LunchMoneyCoinbaseConnection } from '../src/main.js';

// Read keys from file
const keysFile = `./test-live/.keys`;

if (!fs.existsSync(keysFile)) {
  throw new Error(
    `To run live tests, create a ${keysFile} file with your apiKey on the first line, and your apiSecret on the second`,
  );
}

const [apiKey, apiSecret] = fs.readFileSync(keysFile).toString().split('\n');

// Log all requests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const log = (key: string, obj: any) => console.dir({ [key]: obj }, { depth: null });

axios.interceptors.response.use((response) => {
  log('response', {
    status: response.status,
    headers: response.headers,
    config: response.config,
    data: response.data,
  });
  return response;
});

// Run live tests
describe('initiate', () => {
  const result = LunchMoneyCoinbaseConnection.initiate({
    apiKey,
    apiSecret,
  });

  it('should log responses and result without error', async () => {
    log('result', await result);
  }).timeout(5000);
});
