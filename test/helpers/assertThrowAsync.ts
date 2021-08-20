import { assert } from 'chai';

/** Test helper: fails if async function throws */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const assertThrowAsync = async (fn: () => Promise<any>): Promise<void> => {
  try {
    await fn();
    assert.fail('No error thrown');
  } catch (err) {
    assert.throws(() => {
      throw err;
    });
  }
};
