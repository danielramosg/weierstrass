// import Complex from "complex.js";
import * as d3 from "d3-selection";
import * as math from "mathjs";
import * as THREE from "three";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import { lineIntegralRe } from "./lineIntegral";
import { renderKaTeX } from "./helpers";
import World from "./world";

window.math = math;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const world = new World(canvas);

const gaussIntegrationOrder = 4; // 2, 4, 8, 16, 64
const numSamplePoints = 16;

let expr_f: string;
let expr_g: string;

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

/** UI SETUP */

const input_f = d3.select("#expr-f").node() as HTMLInputElement;
const input_g = d3.select("#expr-g").node() as HTMLInputElement;

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
    console.log(expr_f);
  }
  runVisualization();
});

function runVisualization() {
  expr_f = input_f.value;
  expr_g = input_g.value;
  processWeierstrassData();
  displayKaTeX();
  world.createWorld([X1, X2, X3]);
}

d3.selectAll("#expr-f, #expr-g").on("input", () => {
  d3.select("#sample-surf").select("option").attr("selected", "selected");
  expr_f = "";
  expr_g = "";
  clearKaTeX();
  world.clearWorld();
  //   console.log("inputed");
});

d3.selectAll("#expr-f, #expr-g").on("change", runVisualization);
d3.select("#runButton").on("click", runVisualization);

function displayKaTeX() {
  const outputText = d3.select("#outputText");
  outputText.text(`
        $$ f = ${math.parse(expr_f).toTex({ implicit: "hide" })} $$
        $$ g = ${math.parse(expr_g).toTex({ implicit: "hide" })} $$
        `);
  renderKaTeX(outputText.node() as HTMLElement);
}
function clearKaTeX() {
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
