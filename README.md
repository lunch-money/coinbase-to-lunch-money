# Coinbase to Lunch Money

This repo exposes an interface for extracting balances using the coinbase v3 API for the purpose of displaying balances in Lunch Money

As of February 5, 2025 the Coinbase App Legacy API keys which the current Lunch Money plugin uses have been expired.  Therefore all Lunch Money users will need to re-link their Coinbase accounts using the new API public and private keys

## Installation
```
yarn install
yarn build
```

## Testing
There are two sets of test for the connector.  The mocha tests in the test directory us simulated response from the Coinbase API and validate that the connector is providing expected responses.  

To run the simulated tests:
```
yarn test
```

You can also run live tests using a Coinbase v3 API Key file which you download when creating and API key here: https://www.coinbase.com/settings/api

Download the cdp_api_key.json file to this projects test-live directory and then run the test:
```
yarn test:live:keys
```

You can inspect the output of the test to ensure that the returned values match your account.  

Note, the tests will check your balance twice, once using the "normal" API, and once testing pagination getting one account at a time.  It is normal for the Coinbase API to return multiple accounts with zero balances in addition to accounts with balances

