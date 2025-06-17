/** @type {HTMLCanvasElement} */
let canvas;
/** @type {HTMLDivElement} */
let totalElm;
/** @type {CanvasRenderingContext2D} */
let ctx;

const BASE_SIDE_LENGTH = 800;
const ITERATIONS = 7;
const STROKE_COLOR = "white";
const LINE_DRAW_DELAY = 24;

function onLoad() {
  canvas = document.getElementById("canvas");
  totalElm = document.getElementById("total");
  canvas.width = BASE_SIDE_LENGTH;
  canvas.height = BASE_SIDE_LENGTH;

  ctx = canvas.getContext("2d");

  let firstInner;
  const base = createBase();
  base.draw().then(() => {
    totalElm.innerText = `Total: 1`;
    firstInner = createFirstInner(base);
    drawChildren(firstInner);
  });
}
