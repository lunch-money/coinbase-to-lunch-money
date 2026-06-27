# Coinbase to Lunch Money

This repo exposes an interface for extracting balances using the Coinbase v3 API for the purpose of displaying balances in Lunch Money.

As of February 5, 2025 the Coinbase App Legacy API keys which the current Lunch Money plugin uses have been expired. Therefore all Lunch Money users will need to re-link their Coinbase accounts using the new API public and private keys.

As of Jun 29, 2026, the connector will support keys encrypted in both ECDSA and Ed25519.  Coinbase now defaults to creating key in Ed25519 format, but supports legacy ECDSA formatted keys.

## Installation
```
yarn install
yarn build
```

## Testing

There are three levels of tests, each with a different purpose and setup requirement.

### 1. Unit tests (no setup required)

Runs against simulated Coinbase API responses using moxios. Validates connector logic without any real credentials or network access.

```
yarn test
```

### 2. Key format validation (no setup required)

Validates that all supported key formats — ECDSA and Ed25519, with and without PEM headers — are correctly signed and successfully reach the Coinbase API. Uses revoked keys committed to the repo, so no credentials are needed.

Each test reports one of three outcomes:
- **authorized** — key format is valid and credentials are still active
- **Coinbase rejected** — key format is valid, credentials were revoked (expected for committed fixtures)
- **signing failed** — key format is broken; the JWT could not be signed and Coinbase was never reached (test fails)

The final test deliberately uses a malformed key to confirm that signing failures are detected and reported separately from Coinbase auth errors.

```
yarn test:live:validate-formats
```

#### Generating test fixtures

The four key fixture files used by the format validation tests were generated from two source keys using `test-live/create-fixtures.ts`. It takes one ECDSA key (with PEM headers) and one Ed25519 key (raw base64, no headers) and produces all four variants — stripping headers from the ECDSA key and constructing a proper PKCS#8 PEM from the raw Ed25519 bytes. The input files match what Coinbase currently exports when creating an API key with one of the two supported encryption types.

If the fixture files ever need to be regenerated (e.g. after rotating keys or if Coinbase changes their key format), place new source files in `test-live/` as `input-ecdsa.json` and `input-ed25519.json` and run:

```
npx ts-node test-live/create-fixtures.ts
```

If committing updated files to the repo, please make sure that the credentials are revoked!


### 3. Live end-to-end test (requires a valid Coinbase API key)

Validates a real Coinbase connection end-to-end using your own credentials. Requires a `cdp_api_key.json` file in the `test-live/` directory — this file is not committed to the repo and must be supplied by the tester.

To obtain the key file:
1. Go to https://www.coinbase.com/settings/api
2. Create a new API key and download the generated `cdp_api_key.json`
3. Copy it to `test-live/cdp_api_key.json`

Then run:
```
yarn test:live:keys
```

You can inspect the output to confirm the returned balances match your account. The test checks your balances twice — once normally, and once with forced single-account pagination to exercise the pagination logic. It is normal for the Coinbase API to return multiple accounts with zero balances alongside accounts with balances.
