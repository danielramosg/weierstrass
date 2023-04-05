import * as THREE from "three";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import { complex } from "mathjs";

function createSurfaceFunctionCartesian(F: ((zeta: math.Complex) => number)[]) {
  return function (U: number, V: number, vector: THREE.Vector3) {
    let x: number, y: number, z: number;
    const s = 2;
    const u = s * (U - 0.5);
    const v = s * (V - 0.5);
    const w = complex(u, v);

    x = F[0](w);
    y = F[1](w);
    z = F[2](w);
    vector.set(x, y, z);
  };
}

//   function surfaceFunctionPolarDomain(
//     R: number,
//     THETA: number,
//     vector: THREE.Vector3
//   ) {
//     let x: number, y: number, z: number;
//     const radius = 3;

//     const r = radius * R;
//     const theta = 2 * Math.PI * THETA;

//     const w = math.complex(r * Math.cos(theta), r * Math.sin(theta));

//     x = X1(w);
//     y = X2(w);
//     z = X3(w);
//     vector.set(x, y, z);
//   }

interface WorldIF {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.Renderer;
  createWorld(F: ((zeta: math.Complex) => number)[]): void;
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

  numSamplePoints = 16;

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

  createWorld = (F: ((zeta: math.Complex) => number)[]) => {
    if (this.surfaceGeometry && this.surfaceMesh) {
      this.scene.remove(this.surfaceMesh);
      this.surfaceGeometry.dispose();
    }

    /* Create the geometry. The 2nd and 3rd parameters are the number of subdivisions in
     * the u and v directions, respectively.
     */

    const surfaceFunction = createSurfaceFunctionCartesian(F);

    console.log("Start calculating the surface mesh");

    this.surfaceGeometry = new ParametricGeometry(
      surfaceFunction,
      this.numSamplePoints,
      this.numSamplePoints
    );

    console.log("Finished calculating the surface mesh");

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
}
