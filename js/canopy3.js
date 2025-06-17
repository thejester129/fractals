/** @type {HTMLCanvasElement} */
let canvas;
/** @type {HTMLDivElement} */
let totalElm;
/** @type {CanvasRenderingContext2D} */
let ctx;

const BASE_LENGTH = 150;
const BASE_THICKNESS = 15;
const ITERATIONS = 13;
const FILL_COLOR = "white";
const STROKE_COLOR = "white";
const LINE_DRAW_DELAY = 15;
const RATIO = 0.75;
const ANGLE_LEFT = 20;
const ANGLE_RIGHT = 40;

function onLoad() {
  canvas = document.getElementById("canvas");
  totalElm = document.getElementById("total");
  canvas.width = BASE_LENGTH * 6;
  canvas.height = BASE_LENGTH * 4;

  ctx = canvas.getContext("2d");
  ctx.strokeStyle = STROKE_COLOR;
  ctx.lineWidth = BASE_THICKNESS;

  const start = new Point2D(BASE_LENGTH * 3, BASE_LENGTH * 4);
  const end = new Point2D(BASE_LENGTH * 3, BASE_LENGTH * 3);
  const parent = new Line2D(start, end);
  drawChildren(parent).then(() => window.location.reload());
}

async function drawChildren(middle) {
  let total = 1;
  let children = [middle];
  for (i = 0; i < ITERATIONS; i++) {
    await Promise.all(children.map((c) => c.draw()));
    total += children.length;
    totalElm.innerText = `Total: ${total}`;
    children = children.map((c) => getChildren(c)).flat();
  }
}

/**
 * @param parent {Line2D}
 * @returns {Line2D[]}
 */
function getChildren(parent) {
  const length = parent.length() * RATIO;
  ctx.lineWidth = Math.max(ctx.lineWidth * RATIO, 1);
  const start = parent.end;
  const end = new Point2D(parent.end.x, parent.end.y - length);

  const line1 = new Line2D(start, end).rotateClockwise(
    parent.angle() + 90 + ANGLE_RIGHT
  );
  const line2 = new Line2D(start, end).rotateClockwise(
    parent.angle() + 90 - ANGLE_LEFT
  );

  return [line1, line2];
}

async function wait(ms) {
  await new Promise((res) => setTimeout(res, ms));
}

class Point2D {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /** @returns {Point2D} */
  round() {
    return new Point2D(Math.round(this.x), Math.round(this.y));
  }

  rotateClockwise(angle, centre) {
    const rotatedX =
      (this.x - centre.x) * Math.cos(Math.PI / (180 / angle)) -
      (this.y - centre.y) * Math.sin(Math.PI / (180 / angle)) +
      centre.x;
    const rotatedY =
      (this.x - centre.x) * Math.sin(Math.PI / (180 / angle)) +
      (this.y - centre.y) * Math.cos(Math.PI / (180 / angle)) +
      centre.y;

    return new Point2D(rotatedX, rotatedY);
  }
}

class Line2D {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  async draw() {
    await Canvas.drawLineAnimated(this.start, this.end);
  }

  /** @returns {number} */
  length() {
    const a = this.start.x - this.end.x;
    const b = this.start.y - this.end.y;

    return Math.sqrt(a * a + b * b);
  }

  /** @returns {number} */
  angle() {
    const dy = this.start.y - this.end.y;
    const dx = this.start.x - this.end.x;
    const radians = Math.atan2(dy, dx);
    let degrees = (radians * 180) / Math.PI;

    if (degrees < 0) {
      degrees += 360;
    }

    return degrees - 180;
  }

  /** @returns {Point2D} */
  midpoint() {
    return new Point2D(
      this.start.x + (this.end.x - this.start.x) / 2,
      this.start.y + (this.end.y - this.start.y) / 2
    );
  }

  /** @returns {Line2D} */
  rotateClockwise(angle) {
    return new Line2D(
      new Point2D(this.start.x, this.start.y),
      this.end.rotateClockwise(angle, this.start)
    );
  }

  /** @returns {Line2D[]} */
  split() {
    const midpoint = this.midpoint();
    return [new Line2D(this.start, midpoint), new Line2D(midpoint, this.end)];
  }

  /** @returns {Line2D[]} */
  split3() {
    const firstThird = new Point2D(
      this.start.x + (this.end.x - this.start.x) / 3,
      this.start.y + (this.end.y - this.start.y) / 3
    );
    const secondThird = new Point2D(
      this.start.x + ((this.end.x - this.start.x) / 3) * 2,
      this.start.y + ((this.end.y - this.start.y) / 3) * 2
    );

    return [
      new Line2D(this.start, firstThird),
      new Line2D(firstThird, secondThird),
      new Line2D(secondThird, this.end),
    ];
  }
}

class Square {
  constructor(start, length) {
    this.start = start;
    this.length = length;
  }

  async draw() {
    await Canvas.drawSquare(this.start, this.length);
  }
}

class Canvas {
  /** @param points {[Point2D, Point2D, Point2D]} */
  static async drawTriangle(points) {
    ctx.strokeStyle = STROKE_COLOR;
    await Canvas.drawLineAnimated(points[0], points[1]);
    await Canvas.drawLineAnimated(points[1], points[2]);
    await Canvas.drawLineAnimated(points[2], points[0]);
  }

  /**
   * @param start {Point2D}
   * @param length {number}
   */
  static async drawSquare(start, length) {
    const points = [
      start,
      new Point2D(start.x + length, start.y),
      new Point2D(start.x + length, start.y + length),
      new Point2D(start.x, start.y + length),
    ];
    await Canvas.drawLineAnimated(points[0], points[1]);
    await Canvas.drawLineAnimated(points[1], points[2]);
    await Canvas.drawLineAnimated(points[2], points[3]);
    await Canvas.drawLineAnimated(points[3], points[0]);
  }

  /**
   * @param start {Point2D}
   * @param end {Point2D}
   */
  static async drawLineAnimated(start, end) {
    const line = new Line2D(start, end);
    let parts = line.split();
    const times = line.length() > 20 ? 5 : 3;
    for (let i = 0; i < times; i++) {
      parts = parts.map((p) => p.split()).flat();
    }

    for (const part of parts) {
      await this.drawLine(part.start, part.end);
      await wait(LINE_DRAW_DELAY);
    }
  }

  /**
   * @param start {Point2D}
   * @param end {Point2D}
   */
  static async drawLine(start, end) {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
}
