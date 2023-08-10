export default {
  add: function add(n1: number, n2: number): number {
    // Runtime check numbers
    preCheck(n1, n2);

    // Calculate twice and check results
    const result1 = parseFloat((n1 + n2).toPrecision(15));
    const result2 = parseFloat((n1 + n2).toPrecision(15));

    if (result1 !== result2)
      throw new Error(`Add Paranoid computation failed! This should not happen. n1: ${n1} , n2: ${n2}`);

    // check if result is okay
    afterCheck(result1);

    return result1;
  },
  subtract: function subtract(n1: number, n2: number): number {
    // Runtime check numbers
    preCheck(n1, n2);

    // Calculate twice and check results
    const result1 = parseFloat((n1 - n2).toPrecision(15));
    const result2 = parseFloat((n1 - n2).toPrecision(15));

    if (result1 !== result2)
      throw new Error(`Subtract Paranoid computation failed! This should not happen. n1: ${n1} , n2: ${n2}`);

    // check if result is okay
    afterCheck(result1);

    return result1;
  },
  multiply: function multiply(n1: number, n2: number): number {
    // Runtime check numbers
    preCheck(n1, n2);

    // Calculate twice and check results
    const result1 = parseFloat((n1 * n2).toPrecision(15));
    const result2 = parseFloat((n1 * n2).toPrecision(15));

    if (result1 !== result2)
      throw new Error(`Multiply Paranoid computation failed! This should not happen. n1: ${n1} , n2: ${n2}`);

    // check if result is okay
    afterCheck(result1);

    return result1;
  },
  divide: function divide(n1: number, n2: number): number {
    // Runtime check numbers
    preCheck(n1, n2);

    // Calculate twice and check results
    const result1 = parseFloat((n1 / n2).toPrecision(15));
    const result2 = parseFloat((n1 / n2).toPrecision(15));

    if (result1 !== result2)
      throw new Error(`Divide Paranoid computation failed! This should not happen. n1: ${n1} , n2: ${n2}`);

    // check if result is okay
    afterCheck(result1);

    return result1;
  },
};

const INTERNAL_MAX_SAFE_NUMBER = 900719925474;
function preCheck(n1: number, n2: number): void {
  // Runtime typecheck
  if (!Number.isFinite(n1) || !Number.isFinite(n2))
    throw new Error(
      'Numbers passed to paranoid calculator are not Finite Number type! Computation halted for safety reasons.',
    );

  // Limit for internal max safe number
  if (n1 > INTERNAL_MAX_SAFE_NUMBER || n2 > INTERNAL_MAX_SAFE_NUMBER)
    throw new Error(
      `Number passed paranoid calculator is over safety level for safe computation (${INTERNAL_MAX_SAFE_NUMBER})! Computation halted for safety reasons.`,
    );

  //
}

function afterCheck(result: number): void {
  if (!Number.isFinite(result))
    throw new Error('Result of safe computation is not Finite Number type! Computation halted for safety reasons.');

  // Limit for internal max safe number
  if (result > INTERNAL_MAX_SAFE_NUMBER) {
    throw new Error(
      `Number passed to paranoid calculator is over safety level for safe computation (${INTERNAL_MAX_SAFE_NUMBER})! Computation halted for safety reasons.`,
    );
  }
}
