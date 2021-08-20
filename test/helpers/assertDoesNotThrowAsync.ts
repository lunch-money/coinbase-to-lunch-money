import { assert } from 'chai';

/** Test helper: fails if async function does not throw */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const assertDoesNotThrowAsync = async (fn: () => Promise<any>): Promise<void> => {
  try {
    await fn();
  } catch (err) {
    assert.fail(`Unexpected error: ${err}`);
  }
};
