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

function adapt(f, a, b, acc, eps, oldfs) {
  // adaptive integrator
  const x = [1 / 6, 2 / 6, 4 / 6, 5 / 6]; // abscissas
  const w = [2 / 6, 1 / 6, 1 / 6, 2 / 6]; // weights of higher order quadrature
  const v = [1 / 4, 1 / 4, 1 / 4, 1 / 4]; // weights of lower order quadrature
  const p = [1, 0, 0, 1]; // shows the new points at each recursion
  const n = x.length;
  const h = b - a;

  const fs = new Float32Array(n);
  let i: number;
  let k: number;

  if (typeof oldfs === undefined) {
    // first call?
    for (i = 0; i < n; i++) fs[i] = f(a + x[i] * h);
  } //first call: populate oldfs
  else {
    // recursive call : oldfs are given
    for (k = 0, i = 0; i < n; i++) {
      if (p[i]) fs[i] = f(a + x[i] * h); // new points
      else fs[i] = oldfs[k++]; // reuse of old
    }
  }

  let q4: number;
  let q2: number;
  for (q4 = 0, q2 = 0, i = 0; i < n; i++) {
    q4 += w[i] * fs[i] * h; // higher order estimate
    q2 += v[i] * fs[i] * h; // lower order estimate
  }

  var tol = acc + eps * Math.abs(q4); // required tolerance
  var err = Math.abs(q4 - q2) / 3; // error estimate

  if (err < tol)
    // are we done?
    return [q4, err]; // yes, return integral and error
  else {
    // too big error , preparing the recursion
    acc /= Math.sqrt(2); // rescale the absolute accuracy goal
    var mid = (a + b) / 2;

    const left = new Float32Array(n / 2);
    const rght = new Float32Array(n / 2);

    for (i = 0; i < n; i++) {
      if (i < n / 2) left[i] = fs[i];
      else rght[i] = fs[i];
    }
  } //remove this }
  //     var left=[fs[i]for(i in fs)if(i< n/2)] // store the left points
  //     var rght=[fs[i]for(i in fs)if(i>=n/2)] // store the right points
  // var [ql,el]=adapt(f,a,mid,eps,acc,left) // dispatch two recursive calls
  // var [qr,er]=adapt(f,mid,b,eps,acc,rght)
  //   return [ql+qr, Math.sqrt(el∗el+er∗er)] // return the grand estimates
  //   }
}

export { simpson };
