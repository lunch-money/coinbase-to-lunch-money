# Coinbase to Lunch Money

This repo exposes an interface for extracting balances using the coinbase v3 API for the purpose of displaying balances in Lunch Money

As of February 5, 2025 the Coinbase App Legacy API keys which the current Lunch Money plugin uses have been expired.  Therefore all Lunch Money users will need to re-link their Coinbase accounts using the new API public and private keys

## Installation
```
yarn install
yarn build
```

## Testing
Tests require the following environment variables to be set:

| Variable                 | Description                                                          |
| ------------------------ | -------------------------------------------------------------------- |
| API_KEY                  | The Coinbase API Key name (or public key)                            |
| API_SECRET               | The Coinbase API Private Key                                         |
| NUM_ACCOUNTS             | The number of currencies with a non zero balance associated with the keys |
| BALANCE_ASSET            | The currency code for one of the currencies, ie "ETH"                |
| BALANCE_AMOUNT           | The balance associated with the specified currency                   |

```
yarn test
```

