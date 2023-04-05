// import Complex from "complex.js";
import * as d3 from "d3-selection";
import * as math from "mathjs";
import * as THREE from "three";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import { lineIntegralRe } from "./lineIntegral";
import { renderKaTeX } from "./helpers";

window.math = math;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

const gaussIntegrationOrder = 4; // 2, 4, 8, 16, 64
const numSamplePoints = 16;

/** INPUT */
const sample_surfaces = [
  { id: "default", name: "--Choose a surface--", expr_f: "", expr_g: "" },
  { id: "enneper", name: "Enneper", expr_f: "1", expr_g: "z" },
  { id: "scherk", name: "Scherk", expr_f: "4/(1-z^4)", expr_g: "i z" },
  { id: "catenoid", name: "Catenoid", expr_f: "exp(z)", expr_g: "exp(-z)" },
  {
    id: "helicoid",
    name: "Helicoid",
    expr_f: "exp(-i pi/2 +z)",
    expr_g: "exp(-z)",
  },
];

d3.select("#sample-surf")
  .selectAll("option")
  .data(sample_surfaces)
  .enter()
  .append("option")
  .attr("value", (d) => d.id)
  .html((d) => d.name);

d3.select("#sample-surf").on("change", (ev) => {
  const choice = d3.select("#sample-surf").property("value");
  const choiceObj = sample_surfaces.find((d) => d.id === choice);
  if (choiceObj) {
    expr_f = choiceObj.expr_f;
    expr_g = choiceObj.expr_g;
  }
  processWeierstrassData();
  displayKaTeX();
  createWorld();
});

//
//
//
/** COMPUTATIONS */

let expr_f: string;
let expr_g: string;
let X1: (zeta: math.Complex) => number;
let X2: (zeta: math.Complex) => number;
let X3: (zeta: math.Complex) => number;

function displayKaTeX() {
  const outputText = d3.select("#outputText");
  outputText.text(`
      $$ f = ${math.parse(expr_f).toTex({ implicit: "hide" })} $$
      $$ g = ${math.parse(expr_g).toTex({ implicit: "hide" })} $$
      `);
  renderKaTeX(outputText.node() as HTMLElement);
}

function processWeierstrassData() {
  const expr_phi1 = "f * (1 - g^2)"
    .replace("f", `(${expr_f})`)
    .replace("g", `(${expr_g})`);

  const expr_phi2 = "i * f * (1 + g^2)"
    .replace("f", `(${expr_f})`)
    .replace("g", `(${expr_g})`);

  const expr_phi3 = "2 * f * g"
    .replace("f", `(${expr_f})`)
    .replace("g", `(${expr_g})`);

  console.log(expr_phi1);
  console.log(expr_phi2);
  console.log(expr_phi3);

  const cfun_phi1 = math.compile(expr_phi1);

  const phi1 = (z: math.Complex): math.Complex => cfun_phi1.evaluate({ z: z });

  const cfun_phi2 = math.compile(expr_phi2);

  const phi2 = (z: math.Complex): math.Complex => cfun_phi2.evaluate({ z: z });

  const cfun_phi3 = math.compile(expr_phi3);

  const phi3 = (z: math.Complex): math.Complex => cfun_phi3.evaluate({ z: z });

  X1 = (zeta: math.Complex): number =>
    lineIntegralRe(phi1, math.complex(0, 0), zeta, gaussIntegrationOrder);

  X2 = (zeta: math.Complex): number =>
    lineIntegralRe(phi2, math.complex(0, 0), zeta, gaussIntegrationOrder);

  X3 = (zeta: math.Complex): number =>
    lineIntegralRe(phi3, math.complex(0, 0), zeta, gaussIntegrationOrder);
}

expr_f = sample_surfaces[0].expr_f;
expr_g = sample_surfaces[0].expr_g;
processWeierstrassData();
//
//
//
//
// THREE

// // function surfaceFunction(u: number, v: number, vector: THREE.Vector3) {
// //   let x: number, y: number, z: number;
// //   // Coordinates for a point on the surface,
// //   // calculated from u,v, where u and v
// //   // range from 0.0 to 1.0.

// //   x = 20 * (u - 0.5); // x and z range from -10 to 10
// //   z = 20 * (v - 0.5);
// //   y = 2 * (Math.sin(x / 2) * Math.cos(z));
// //   vector.set(x, y, z);
// // }

function surfaceFunctionCartesianDomain(
  U: number,
  V: number,
  vector: THREE.Vector3
) {
  let x: number, y: number, z: number;
  const s = 2;
  const u = s * (U - 0.5);
  const v = s * (V - 0.5);
  const w = math.complex(u, v);

  x = X1(w);
  y = X2(w);
  z = X3(w);
  vector.set(x, y, z);
}

function surfaceFunctionPolarDomain(
  R: number,
  THETA: number,
  vector: THREE.Vector3
) {
  let x: number, y: number, z: number;
  const radius = 3;

  const r = radius * R;
  const theta = 2 * Math.PI * THETA;

  const w = math.complex(r * Math.cos(theta), r * Math.sin(theta));

  x = X1(w);
  y = X2(w);
  z = X3(w);
  vector.set(x, y, z);
}

// // function enneper(U: number, V: number, vector: THREE.Vector3) {
// //   const s = 3;
// //   const u = s * (U - 0.5);
// //   const v = s * (V - 0.5);

// //   let x = (1 / 3) * u * (1 - (1 / 3) * u * u + v * v);
// //   let y = (1 / 3) * v * (1 - (1 / 3) * v * v + u * u);
// //   let z = (1 / 3) * (u * u - v * v);
// //   vector.set(x, y, z);
// // }

// /*  Creates a scene to show a parametric surface.  The surface is defined by the
//  *  previous function, surfaceEquation().
//  */

function createWorld() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    canvas.width / canvas.height,
    0.1,
    100
  );

  camera.position.set(0, 5, 10);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const light1 = new THREE.DirectionalLight(0xffffff, 0.5);
  light1.position.set(0, 0, 1);
  camera.add(light1); // Viewpoint light moves with camera.
  scene.add(camera);

  const light2 = new THREE.PointLight(0xffffff, 0.5); // A light shining from above the surface.
  light2.position.set(0, 20, 0);
  scene.add(light2);

  /* Create the geometry. The 2nd and 3rd parameters are the number of subdivisions in
   * the u and v directions, respectively.
   */
  console.log("Start calculating the surface mesh");
  let surfaceGeometry = new ParametricGeometry(
    surfaceFunctionCartesianDomain,
    numSamplePoints,
    numSamplePoints
  );
  console.log("Finished calculating the surface mesh");

  const material = new THREE.MeshPhongMaterial({
    color: "white",
    specular: 0x080808,
    side: THREE.DoubleSide,
    //   wireframe: true,
  });
  // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

  const surface = new THREE.Mesh(surfaceGeometry, material);
  scene.add(surface);

  const controls = new TrackballControls(camera, canvas);
  controls.noPan = true;
  // controls.noZoom = true;

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setClearColor("lightblue");
  renderer.render(scene, camera);

  function animate() {
    requestAnimationFrame(animate);
    controls.update();

    //   surface.rotation.x += 0.01;
    //   surface.rotation.y += 0.01;

    renderer.render(scene, camera);
  }

  animate();
}

//

// // /** Attempt to clip to shpere */
// // const material = new THREE.ShaderMaterial({
// //   uniforms: {
// //     colorA: { type: "vec3", value: new THREE.Color(0xff0000) },
// //     colorB: { type: "vec3", value: new THREE.Color(0x0000ff) },
// //     // time: { value: 1.0 },
// //     // resolution: { value: new THREE.Vector2() },
// //   },
// //   side: THREE.DoubleSide,
// //   blending: THREE.NormalBlending,
// //   transparent: true,
// //   vertexShader: `
// //   varying vec3 vUv;
// //   varying float clip;

// //     void main() {
// //       vUv = position;

// //       vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
// //       gl_Position = projectionMatrix * modelViewPosition;

// //       if (position.x * position.x + position.y * position.y + position.z * position.z > 4.0) {
// //             clip = 1.0;
// //         } else {
// //             clip = 0.0;
// //       };
// //     }
// //   `,
// //   fragmentShader: `
// //     uniform vec3 colorA;
// //       uniform vec3 colorB;
// //       varying vec3 vUv;
// //       varying float clip;

// //       void main() {
// //         if (clip < 0.5) {
// //         gl_FragColor = vec4(colorA, 1.0);
// //         } else {
// //             gl_FragColor = vec4(colorB, 0.0);

// //         }
// //       }
// //   `,
// // });

//
// ////////////////////////////////////

// // const geometry = new THREE.BoxGeometry(1, 1, 1);
// // const material2 = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// // const cube = new THREE.Mesh(geometry, material2);
// // scene.add(cube);
