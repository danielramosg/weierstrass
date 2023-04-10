import * as THREE from "three";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import { complex } from "mathjs";

const clamp = (x: number) => Math.min(Math.max(x, -1), 1);

function createSurfaceFunctionCartesian(
  F: ((zeta: math.Complex) => number)[],
  URange: number[],
  VRange: number[]
) {
  return function (U: number, V: number, vector: THREE.Vector3) {
    let x: number, y: number, z: number;
    const u = URange[0] + U * (URange[1] - URange[0]);
    const v = VRange[0] + V * (VRange[1] - VRange[0]);
    const w = complex(u, v);

    // x = clamp(F[0](w));
    // y = clamp(F[1](w));
    // z = clamp(F[2](w));
    x = F[0](w);
    y = F[1](w);
    z = F[2](w);
    vector.set(x, y, z);
  };
}

function createSurfaceFunctionPolar(
  F: ((zeta: math.Complex) => number)[],
  RRange: number[],
  THETARange: number[]
) {
  return function (R: number, THETA: number, vector: THREE.Vector3) {
    let x: number, y: number, z: number;
    const r = RRange[0] + R * (RRange[1] - RRange[0]);
    const theta = THETARange[0] + THETA * (THETARange[1] - THETARange[0]);
    const w = complex(r * Math.cos(theta), r * Math.sin(theta));

    // x = clamp(F[0](w));
    // y = clamp(F[1](w));
    // z = clamp(F[2](w));
    x = F[0](w);
    y = F[1](w);
    z = F[2](w);
    vector.set(x, y, z);
  };
}

interface WorldIF {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.Renderer;
  createWorld(
    F: ((zeta: math.Complex) => number)[],
    uRange: number[],
    vRange: number[]
  ): void;
  clearWorld(): void;
}

export default class World implements WorldIF {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  material: THREE.Material;
  pointLight: THREE.Light;
  controls: TrackballControls;

  surfaceGeometry: THREE.BufferGeometry;
  surfaceMesh: THREE.Mesh;

  numSamplePoints = 32;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75,
      canvas.width / canvas.height,
      0.1,
      100
    );

    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    const cameraLight = new THREE.DirectionalLight(0xffffff, 0.5);
    cameraLight.position.set(0, 0, 1);
    this.camera.add(cameraLight); // Viewpoint light moves with camera.

    this.pointLight = new THREE.PointLight(0xffffff, 0.5); // A light shining from above the surface.
    this.pointLight.position.set(0, 20, 0);

    this.scene.add(this.camera);
    this.scene.add(this.pointLight);

    this.material = new THREE.MeshPhongMaterial({
      color: "white",
      specular: 0x080808,
      side: THREE.DoubleSide,
      //   wireframe: true,
    });
    // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    this.controls = new TrackballControls(this.camera, canvas);
    this.controls.noPan = true;
    // controls.noZoom = true;

    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
    });

    this.renderer.setClearColor("lightblue");
  }

  createWorld = (
    F: ((zeta: math.Complex) => number)[],
    uRange: number[],
    vRange: number[]
  ) => {
    if (this.surfaceGeometry && this.surfaceMesh) {
      console.log(this.scene);
      this.scene.remove(this.surfaceMesh);
      this.surfaceGeometry.dispose();
      console.log("disposed");
    }

    /* Create the geometry. The 2nd and 3rd parameters are the number of subdivisions in
     * the u and v directions, respectively.
     */

    const surfaceFunction = createSurfaceFunctionCartesian(F, uRange, vRange);

    console.log("Started calculating the surface mesh");
    console.time("mesh");

    this.surfaceGeometry = new ParametricGeometry(
      surfaceFunction,
      this.numSamplePoints,
      this.numSamplePoints
    );

    console.log("Finished calculating the surface mesh");
    console.timeEnd("mesh");

    this.surfaceMesh = new THREE.Mesh(this.surfaceGeometry, this.material);

    this.scene.add(this.surfaceMesh);

    this.renderer.render(this.scene, this.camera);

    const animate = () => {
      requestAnimationFrame(animate);
      this.controls.update();

      //   surface.rotation.x += 0.01;
      //   surface.rotation.y += 0.01;

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  };

  clearWorld = () => {
    if (this.surfaceGeometry && this.surfaceMesh) {
      this.scene.remove(this.surfaceMesh);
      this.surfaceGeometry.dispose();
    }
    this.renderer.render(this.scene, this.camera);
  };

  createWorldFromFunction = (
    F: (u: number, v: number, vector: THREE.Vector3) => void
  ) => {
    if (this.surfaceGeometry && this.surfaceMesh) {
      console.log(this.scene);
      this.scene.remove(this.surfaceMesh);
      this.surfaceGeometry.dispose();
      console.log("disposed");
    }
    console.log("Started calculating the surface mesh");
    console.time("mesh");
    this.surfaceGeometry = new ParametricGeometry(
      F,
      this.numSamplePoints,
      this.numSamplePoints
    );
    console.log("Finished calculating the surface mesh");
    console.timeEnd("mesh");
    this.surfaceMesh = new THREE.Mesh(this.surfaceGeometry, this.material);

    this.scene.add(this.surfaceMesh);

    this.renderer.render(this.scene, this.camera);

    const animate = () => {
      requestAnimationFrame(animate);
      this.controls.update();

      //   surface.rotation.x += 0.01;
      //   surface.rotation.y += 0.01;

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  };
}
