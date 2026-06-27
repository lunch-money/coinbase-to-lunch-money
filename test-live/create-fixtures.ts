/**
 * One-time fixture generator for the 4 key-type test scenarios.
 *
 * Inputs (place in test-live/ before running):
 *   input-ecdsa.json    — ECDSA key downloaded from Coinbase (has PEM headers)
 *   input-ed25519.json  — Ed25519 key from Coinbase (raw base64, no headers)
 *
 * Outputs written to test-live/:
 *   cdp_api_key-ecdsa-pem.json      — ECDSA key with PEM headers (copied from input)
 *   cdp_api_key-ecdsa-raw.json      — ECDSA key with headers stripped
 *   cdp_api_key-ed25519-pem.json    — Ed25519 key with manufactured PKCS#8 PEM headers
 *   cdp_api_key-ed25519-raw.json    — Ed25519 key as raw base64 (copied from input)
 *
 * Run with:
 *   npx ts-node test-live/create-fixtures.ts
 */

import fs from 'fs';
import path from 'path';

const DIR = path.join(__dirname);

// PKCS#8 DER prefix for Ed25519 — same constant used in CoinbaseClient
const PKCS8_ED25519_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');

function readKey(filename: string): { name: string; privateKey: string } {
  const filepath = path.join(DIR, filename);
  if (!fs.existsSync(filepath)) {
    throw new Error(`Input file not found: ${filepath}`);
  }
  const parsed = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  if (!parsed.name || !parsed.privateKey) {
    throw new Error(`${filename} must contain "name" and "privateKey" fields`);
  }
  return parsed;
}

function writeKey(filename: string, name: string, privateKey: string) {
  const filepath = path.join(DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify({ name, privateKey }, null, 2) + '\n');
  console.log(`  wrote ${filename}`);
}

function stripEcdsaHeaders(pem: string): string {
  return pem
    .replace(/-----BEGIN EC PRIVATE KEY-----/g, '')
    .replace(/-----END EC PRIVATE KEY-----/g, '')
    .replace(/\n/g, '')
    .trim();
}

function buildEd25519Pem(rawBase64: string): string {
  const seed = Buffer.from(rawBase64, 'base64').slice(0, 32);
  const pkcs8Der = Buffer.concat([PKCS8_ED25519_PREFIX, seed]);
  return `-----BEGIN PRIVATE KEY-----\n${pkcs8Der.toString('base64')}\n-----END PRIVATE KEY-----\n`;
}

try {
  console.log('Reading input files...');
  const ecdsa = readKey('input-ecdsa.json');
  const ed25519 = readKey('input-ed25519.json');

  if (!ecdsa.privateKey.includes('-----BEGIN EC PRIVATE KEY-----')) {
    throw new Error('input-ecdsa.json does not appear to contain an ECDSA PEM key');
  }
  if (ed25519.privateKey.includes('-----BEGIN')) {
    throw new Error('input-ed25519.json appears to already have PEM headers — expected raw base64');
  }

  console.log('\nWriting fixture files...');
  writeKey('cdp_api_key-ecdsa-pem.json', ecdsa.name, ecdsa.privateKey);
  writeKey('cdp_api_key-ecdsa-raw.json', ecdsa.name, stripEcdsaHeaders(ecdsa.privateKey));
  writeKey('cdp_api_key-ed25519-pem.json', ed25519.name, buildEd25519Pem(ed25519.privateKey));
  writeKey('cdp_api_key-ed25519-raw.json', ed25519.name, ed25519.privateKey);

  console.log('\nDone. Run all scenarios with:');
  console.log('  npm run test:live:all-keys');
} catch (e) {
  console.error(`\nError: ${(e as Error).message}`);
  process.exit(1);
}
