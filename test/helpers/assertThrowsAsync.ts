import { assert } from 'chai';

/** Test helper: fails if async function throws */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const assertThrowsAsync = async (fn: () => Promise<any>): Promise<void> => {
  try {
    await fn();
  } catch (err) {
    console.log(`Got expected error result: ${(err as Error).message}`);
    assert.throws(() => {
      throw err;
    });
    return;
  }

  assert.fail('No error thrown');
};
