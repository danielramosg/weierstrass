/** Quick implementation of Simpson's integration.
 * TO DO: use a better integration scheme.
 */

function simpson(
  f: (x: number) => number,
  a: number,
  b: number,
  N: number
): number {
  /** Implement Simpson's rule for numerical integration */
  //   const abscissas = new Float32Array(2 * N + 1);
  const ordinates = new Float32Array(2 * N + 1);
  let sum = 0;

  // N is the number of intervals to integrate separately
  const h = (b - a) / N; // length of intervals to integrate
  const s = h / 2; // length of the subdivisions (with Simpson 1/3)
  for (let i = 0; i < 2 * N + 1; i++) {
    // abscissas[i] = a + s * i;
    ordinates[i] = f(a + s * i);
  }

  for (let j = 0; j < N; j++) {
    sum +=
      (h / 6) *
      (ordinates[2 * j] + 4 * ordinates[2 * j + 1] + ordinates[2 * j + 2]);
  }

  return sum;
}

export { simpson };
