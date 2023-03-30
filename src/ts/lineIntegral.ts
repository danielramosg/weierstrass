import * as math from "mathjs";
import { simpson } from "./numIntegration";

function lineIntegralRe(
  f: (z: math.Complex) => math.Complex,
  a: math.Complex,
  b: math.Complex,
  N: number
): number {
  // integrate a complex function along the segment that joins a and b.

  const gamma = (t: number): math.Complex =>
    math.add(math.multiply(a, 1 - t), math.multiply(b, t)) as math.Complex;

  const fRe = (t: number): number => {
    const g = math.multiply(f(gamma(t)), math.subtract(b, a)) as math.Complex;
    return g.re;
  };

  return simpson(fRe, 0, 1, N);
}

export { lineIntegralRe };
