import * as math from "mathjs";
import {
  GPU,
  IKernelFunctionThis,
  IConstantsThis,
  ThreadKernelVariable,
} from "gpu.js";
import { complex } from "mathjs";

/** Set up video stream */

var videoelement = document.getElementById("videoelement") as HTMLVideoElement;
var streamContraints = {
  audio: false,
  video: { width: 320, height: 180 },
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

/** Set up GPU video transformation */

const gpu = new GPU();

const kernel = gpu
  .createKernel(function (videoFrame) {
    function add(c0, c1) {
      return [c0[0] + c1[0], c0[1] + c1[1]];
    }

    function mult(c0, c1) {
      return [c0[0] * c1[0] - c0[1] * c1[1], c0[0] * c1[0] + c0[1] * c1[1]];
    }

    function f(c) {
      return add(mult(c, c), c);
    }

    function myClamp(x, l, u) {
      return Math.min(Math.max(l, x), u);
    }

    const w = this.constants.w as number;
    const h = this.constants.h as number;

    const re = this.thread.x / w - 0.5;
    const im = this.thread.y / h - 0.5;

    let z = [re, im];
    let fz = f(z);

    const x = myClamp(Math.floor((fz[0] + 0.5) * w), 0, w - 1);
    const y = myClamp(Math.floor((fz[1] + 0.5) * h), 0, h - 1);

    const pixel = videoFrame[y][x];
    this.color(pixel[0], pixel[1], pixel[2], pixel[3]);
  })
  .setGraphical(true)
  .setConstants({ w: 320, h: 180 })
  .setOutput([320, 180]);

document.querySelector(".container")?.appendChild(kernel.canvas);
const loop = () => {
  kernel(videoelement);
  requestAnimationFrame(loop);
};
