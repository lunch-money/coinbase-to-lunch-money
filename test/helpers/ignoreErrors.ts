/** Test helper: ignores any errors thrown */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ignoreErrors = (fn: () => Promise<any> | void) => async (): Promise<void> => {
  try {
    await fn();
  } catch (err) {
    // do nothing
  }
};
