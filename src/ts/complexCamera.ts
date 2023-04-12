import * as math from "mathjs";
import {
  GPU,
  IKernelFunctionThis,
  IConstantsThis,
  ThreadKernelVariable,
} from "gpu.js";
import { complex } from "mathjs";

window.math = math;
/** Set up video stream */

var videoelement = document.getElementById("videoelement") as HTMLVideoElement;
var streamContraints = {
  audio: false,
  video: { width: 400, height: 400 },
};

if (videoelement) {
  navigator.mediaDevices
    .getUserMedia(streamContraints)
    .then(gotStream)
    .catch(function (e) {
      console.log(e);
    });
}

//if stream found
function gotStream(stream) {
  videoelement.srcObject = stream;
  videoelement.play();
  loop();
}

/** Set up complex function */

function clamp(x: number, lower: number, upper: number) {
  return Math.min(Math.max(lower, x), upper);
}

const expr = "z^2";

const cfun = math.compile(expr); // compile the expression into callable JS function
// const F = (z: math.Complex): math.Complex => cfun.evaluate({ z: z }); //

function F(
  this: IKernelFunctionThis<IConstantsThis>,
  videoFrame: ThreadKernelVariable
): void {
  const w = this.constants.w as number;
  const h = this.constants.h as number;

  const re = this.thread.x / w - 0.5;
  const im = this.thread.y / h - 0.5;

  const fz = cfun.evaluate({ z: complex(re, im) });
  const x = clamp(Math.floor((fz.re + 0.5) * w), 0, w - 1);
  const y = clamp(Math.floor((fz.im + 0.5) * h), 0, h - 1);

  const pixel = videoFrame[y][x];
  this.color(pixel[0], pixel[1], pixel[2], pixel[3]);
}

// console.log(cfun.evaluate({ z: complex(2, 1) }));
/** Set up GPU video transformation */

const gpu = new GPU();

const kernel = gpu
  .createKernel(function (videoFrame) {
    function add(z: number[], w: number[]) {
      return [z[0] + w[0], z[1] + w[1]];
    }

    function mult(z: number[], w: number[]) {
      return [z[0] * w[0] - z[1] * w[1], z[0] * w[1] + z[1] * w[0]];
    }

    function f(z: number[]) {
      // return add(mult(z, z), z);
      return mult(z, z);
    }

    function myClamp(x, l, u) {
      return Math.min(Math.max(l, x), u);
    }

    const w = this.constants.w as number;
    const h = this.constants.h as number;

    const scale = 2;
    const re = (this.thread.x / w - 0.5) * 2 * scale;
    const im = (this.thread.y / h - 0.5) * 2 * scale;

    // // let fz = cfun.evaluate({ z: complex(re, im) }) as math.Complex;
    // // let fz = complex(re, im);

    let z = [re, im];
    let fz = f(z);

    // const x = Math.floor(fz[0] / 2 / scale + 0.5) * w;
    // const y = Math.floor(fz[1] / 2 / scale + 0.5) * h;

    const x = myClamp(Math.floor((fz[0] / 2 / scale + 0.5) * w), 0, w - 1);
    const y = myClamp(Math.floor((fz[1] / 2 / scale + 0.5) * h), 0, h - 1);

    if (x === w - 1 || x === 0 || y === h - 1 || y === 0) {
      this.color(0, 0, 0, 0);
    } else {
      const pixel = videoFrame[x][y];
      this.color(pixel[0], pixel[1], pixel[2], pixel[3]);
    }

    // const pixel = videoFrame[x][y];
    // this.color(pixel[0], pixel[1], pixel[2], pixel[3]);
  })
  .setGraphical(true)
  .setConstants({ w: 400, h: 400 })
  .setOutput([400, 400]);

document.querySelector(".container")?.appendChild(kernel.canvas);
const loop = () => {
  kernel(videoelement);
  requestAnimationFrame(loop);
};
