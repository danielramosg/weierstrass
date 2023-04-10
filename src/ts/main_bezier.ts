// import Complex from "complex.js";
import * as d3 from "d3-selection";
import * as math from "mathjs";
import { lineIntegralRe } from "./lineIntegral";
import { renderKaTeX } from "./helpers";
import World from "./world";
import { binomial } from "./math_helpers";
import * as THREE from "three";

window.math = math;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const world = new World(canvas);

const gaussIntegrationOrder = 4; // 2, 4, 8, 16, 64
// const numSamplePoints = 16;

let uRange: number[];
let vRange: number[];

/** UI SETUP */

const input_uMin = d3.select("#uMin").node() as HTMLInputElement;
const input_uMax = d3.select("#uMax").node() as HTMLInputElement;
const input_vMin = d3.select("#vMin").node() as HTMLInputElement;
const input_vMax = d3.select("#vMax").node() as HTMLInputElement;

uRange = [Number(input_uMin.value), Number(input_uMax.value)];
vRange = [Number(input_vMin.value), Number(input_vMax.value)];

// From https://github.com/CindyJS/website/blob/master/src/gallery/main/Raytracer/Raytracer.html
// //casteljau algorithm to evaluate and subdivide polynomials in Bernstein form.
// //poly is a vector containing the coefficients, i.e. p(x) = sum(0..N, i, poly_(i+1) * b_(i,N)(x)) where b_(i,N)(x) = choose(N, i)*x^i*(1-x)^(N-1)
// function casteljau(poly: number[], x:number) {
//   let alpha: number, beta: number
//   alpha = 1-x;
//   beta = x;
//   for(let k= 0; k<N; k++){
//     poly[N-k] = alpha * poly[N-k] + beta * poly[N-k+1]
//   }
//   forall(0..N, k,
//     repeat(N-k,
//       poly_# = alpha*poly_# + beta*poly_(#+1);
//     );
//   );
//   poly //the bernstein-coefficients of the polynomial in the interval [x,1]
//     }

// //evaluates a polynomial, represented as vector of coefficients in bernstein-form
// eval(poly, x) := casteljau(poly, x)_1;

const points = [
  [
    [-0.748761164940777, -0.8402381743235232, 0.04274015516621033],
    [-0.7475656357126989, -0.1928718772029352, 0.5877630432929579],
    [-0.6626355872286919, 0.30943251997248417, 0.6331506603790417],
    [-0.7411355781707372, 0.9551223478313272, -0.007481980838387352],
  ],
  [
    [-0.24416820286398033, -0.9076925101714132, 0.18494348687624498],
    [-0.20824205864537018, -0.3123537599499005, 0.3459096923096413],
    [-0.16666666666666669, 0.16666666666666663, 0],
    [-0.18269596582519296, 0.589082814175693, -0.002329326416544558],
  ],
  [
    [0.07613058012289238, -0.9425949013945255, 0.133045261074619],
    [-0.0001372148156425645, -0.3582199476866469, -0.3796737235283502],
    [0.16666666666666663, 0.16666666666666663, 0],
    [0.3156236789214345, 0.5747990465976968, -0.0064624054702717435],
  ],
  [
    [0.6342803293873607, -1.0083999119546152, -0.07115695843497323],
    [0.5438825466797169, -0.5482203218034467, 0.38547521423602565],
    [0.8985042837479602, 0.16070086128165906, -0.010871541242017392],
    [0.8569404440380297, 0.8009859366247764, -0.019276928430119158],
  ],
];

function bicubicPatch(u: number, v: number, vector: THREE.Vector3) {
  const N = points.length;
  const M = points[0].length;
  let S = 0;

  for (let k = 0; k < 3; k++) {
    S = 0;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < M; j++) {
        S +=
          points[i][j][k] *
          binomial(N, i) *
          Math.pow(u, i) *
          Math.pow(1 - u, N - i) *
          binomial(M, j) *
          Math.pow(v, j) *
          Math.pow(1 - v, M - j);
      }
    }
    if (k === 0) vector.x = S;
    if (k === 1) vector.y = S;
    if (k === 2) vector.z = S;
  }
}

function runVisualization() {
  uRange = [Number(input_uMin.value), Number(input_uMax.value)];
  vRange = [Number(input_vMin.value), Number(input_vMax.value)];

  // if (expr_f === "" || expr_g === "") {
  //   console.log("empty data");
  //   world.clearWorld();
  //   return;
  // }

  world.createWorldFromFunction(bicubicPatch);
}

runVisualization();
