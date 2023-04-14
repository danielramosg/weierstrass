// import Complex from "complex.js";
import * as d3 from "d3-selection";
import * as math from "mathjs";
import { lineIntegralRe } from "./lineIntegral";
import { renderKaTeX } from "./helpers";
import World from "./world";

window.math = math;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const world = new World(canvas);

const gaussIntegrationOrder = 4; // 2, 4, 8, 16, 64
// const numSamplePoints = 16;

let expr_f: string;
let expr_g: string;
let uRange: number[];
let vRange: number[];

/** INPUT */
const sample_surfaces = [
  { id: "default", name: "--Choose a surface--", expr_f: "", expr_g: "" },
  {
    id: "enneper",
    name: "Enneper",
    expr_f: "1",
    expr_g: "z",
    uRange: [-1, 1],
    vRange: [-1, 1],
  },
  {
    id: "scherk",
    name: "Scherk",
    expr_f: "4/(1-z^4)",
    expr_g: "i z",
    uRange: [-1, 1],
    vRange: [-1, 1],
  },
  {
    id: "catenoid",
    name: "Catenoid",
    expr_f: "exp(z)",
    expr_g: "exp(-z)",
    uRange: [-1, 1],
    vRange: [-3.1416, 3.1416],
  },
  {
    id: "helicoid",
    name: "Helicoid",
    expr_f: "exp(-i pi/2 +z)",
    expr_g: "exp(-z)",
    uRange: [-1, 1],
    vRange: [-3.1416, 3.1416],
  },
  {
    id: "bour",
    name: "Bour",
    expr_f: "1",
    expr_g: "sqrt(z)",
    uRange: [-2, 2],
    vRange: [-1, 1],
  },
  //   {
  //     id: "henneberg",
  //     name: "Henneberg",
  //     expr_f: "2(1-z^-4)",
  //     expr_g: "z",
  //     uRange: [-1, 1],
  //     vRange: [-1, 1],
  //   },
  {
    id: "trinoid",
    name: "Trinoid",
    expr_f: "1/(z^3-1)^2",
    expr_g: "z^2",
    uRange: [-0.8, 0.8],
    vRange: [-0.7, 0.7],
  },
];

/** UI SETUP */
renderKaTeX(document.getElementById("info"));

const input_f = d3.select("#expr-f").node() as HTMLInputElement;
const input_g = d3.select("#expr-g").node() as HTMLInputElement;

const input_uMin = d3.select("#uMin").node() as HTMLInputElement;
const input_uMax = d3.select("#uMax").node() as HTMLInputElement;
const input_vMin = d3.select("#vMin").node() as HTMLInputElement;
const input_vMax = d3.select("#vMax").node() as HTMLInputElement;

uRange = [Number(input_uMin.value), Number(input_uMax.value)];
vRange = [Number(input_vMin.value), Number(input_vMax.value)];

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
    input_f.value = choiceObj.expr_f;
    input_g.value = choiceObj.expr_g;
    if (choiceObj.uRange) {
      input_uMin.value = choiceObj.uRange[0].toString();
      input_uMax.value = choiceObj.uRange[1].toString();
    }
    if (choiceObj.vRange) {
      input_vMin.value = choiceObj.vRange[0].toString();
      input_vMax.value = choiceObj.vRange[1].toString();
    }
  }
  runVisualization();
});

function runVisualization() {
  expr_f = input_f.value;
  expr_g = input_g.value;
  uRange = [Number(input_uMin.value), Number(input_uMax.value)];
  vRange = [Number(input_vMin.value), Number(input_vMax.value)];

  if (expr_f === "" || expr_g === "") {
    console.log("empty data");
    world.clearWorld();
    return;
  }
  processWeierstrassData();
  displayKaTeXExpr();
  world.createWorld([X1, X2, X3], uRange, vRange);
}

d3.selectAll("#expr-f, #expr-g").on("input", () => {
  d3.select("#sample-surf").select("option").attr("selected", "selected");
  expr_f = "";
  expr_g = "";
  clearKaTeXExpr();
  world.clearWorld();
  //   console.log("inputed");
});

d3.selectAll("#expr-f, #expr-g").on("change", runVisualization);
d3.select("#runButton").on("click", runVisualization);

function displayKaTeXExpr() {
  const outputText = d3.select("#outputText");
  outputText.text(`
        $$ f = ${math.parse(expr_f).toTex({ implicit: "hide" })} $$
        $$ g = ${math.parse(expr_g).toTex({ implicit: "hide" })} $$
        `);
  renderKaTeX(outputText.node() as HTMLElement);
}
function clearKaTeXExpr() {
  const outputText = d3.select("#outputText");
  outputText.text("");
}

/** COMPUTATIONS */

let X1: (zeta: math.Complex) => number;
let X2: (zeta: math.Complex) => number;
let X3: (zeta: math.Complex) => number;

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

  //   console.log(expr_phi1);
  //   console.log(expr_phi2);
  //   console.log(expr_phi3);

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

runVisualization();
