// import Complex from "complex.js";
import * as math from "mathjs";
import * as THREE from "three";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import * as numIntegration from "./numintegration";

window.math = math;

const expr = "z^2";
const scope = { z: math.complex(2, 3) };

console.log(math.SQRT2);
const res = math.evaluate(expr, scope).toString();
console.log(res);

const phi1 = (z: math.Complex) => math.pow(z, 2);

console.log(phi1(math.complex("i")));

const code = math.compile("z^2");

console.log(code.evaluate({ z: math.complex(0, 1) }));

const parsed = math.parse("z^2");

console.log(parsed);

// Numerical integration

// const f = (x: number) => Math.pow(x, 7) - 12 * Math.pow(x, 3) + 4;

const f = (x: number) => math.compile("x^7-12*x^3+4").evaluate({ x: x });

const int = numIntegration.simpson(f, 0, 2, 1000);
console.log("Integral: ", int); // -8

//
//
//
//

// THREE tests

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

function surfaceFunction(u: number, v: number, vector: THREE.Vector3) {
  let x: number, y: number, z: number;
  // Coordinates for a point on the surface,
  // calculated from u,v, where u and v
  // range from 0.0 to 1.0.

  x = 20 * (u - 0.5); // x and z range from -10 to 10
  z = 20 * (v - 0.5);
  y = 2 * (Math.sin(x / 2) * Math.cos(z));
  vector.set(x, y, z);
}

function enneper(U: number, V: number, vector: THREE.Vector3) {
  const s = 3;
  const u = s * (U - 0.5);
  const v = s * (V - 0.5);

  let x = (1 / 3) * u * (1 - (1 / 3) * u * u + v * v);
  let y = (1 / 3) * v * (1 - (1 / 3) * v * v + u * u);
  let z = (1 / 3) * (u * u - v * v);
  vector.set(x, y, z);
}

/*  Creates a scene to show a parametric surface.  The surface is defined by the
 *  previous function, surfaceEquation().
 */
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
let surfaceGeometry = new ParametricGeometry(enneper, 64, 64);

const material = new THREE.MeshPhongMaterial({
  color: "white",
  specular: 0x080808,
  side: THREE.DoubleSide,
});

// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

// /** Attempt to clip to shpere */
// const material = new THREE.ShaderMaterial({
//   uniforms: {
//     colorA: { type: "vec3", value: new THREE.Color(0xff0000) },
//     colorB: { type: "vec3", value: new THREE.Color(0x0000ff) },
//     // time: { value: 1.0 },
//     // resolution: { value: new THREE.Vector2() },
//   },
//   side: THREE.DoubleSide,
//   blending: THREE.NormalBlending,
//   transparent: true,
//   vertexShader: `
//   varying vec3 vUv;
//   varying float clip;

//     void main() {
//       vUv = position;

//       vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
//       gl_Position = projectionMatrix * modelViewPosition;

//       if (position.x * position.x + position.y * position.y + position.z * position.z > 4.0) {
//             clip = 1.0;
//         } else {
//             clip = 0.0;
//       };
//     }
//   `,
//   fragmentShader: `
//     uniform vec3 colorA;
//       uniform vec3 colorB;
//       varying vec3 vUv;
//       varying float clip;

//       void main() {
//         if (clip < 0.5) {
//         gl_FragColor = vec4(colorA, 1.0);
//         } else {
//             gl_FragColor = vec4(colorB, 0.0);

//         }
//       }
//   `,
// });

const surface = new THREE.Mesh(surfaceGeometry, material);
scene.add(surface);

////////////////////////////////////

// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material2 = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(geometry, material2);
// scene.add(cube);

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
