/** @type {HTMLCanvasElement} */
let canvas;
/** @type {HTMLDivElement} */
let totalElm;
/** @type {CanvasRenderingContext2D} */
let ctx;

const BASE_SIDE_LENGTH = 600;
const ITERATIONS = 7;
const STROKE_COLOR = "white";
const LINE_DRAW_DELAY = 20;

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
    drawChildren(firstInner).then(() => window.location.reload());
  });
}

/** @param firstInner {Triangle} */
async function drawChildren(firstInner) {
  let total = 1;
  let children = [firstInner];
  for (i = 0; i < ITERATIONS; i++) {
    await Promise.all(children.map((c) => c.draw()));
    total += children.length;
    totalElm.innerText = `Total: ${total}`;
    children = children.map((c) => getChildren(c)).flat();
  }
}

/** @returns {Triangle} */
function createBase() {
  const baseHeight = Trig.adjecent(BASE_SIDE_LENGTH);
  return new Triangle([
    new Point2D(0, baseHeight),
    new Point2D(BASE_SIDE_LENGTH / 2, 0),
    new Point2D(BASE_SIDE_LENGTH, baseHeight),
  ]);
}

/**
 * @param base {Triangle}
 * @returns {Triangle}
 */
function createFirstInner(base) {
  const midpoints = base.midpoints();
  return new Triangle(midpoints);
}

/**
 * @param triangle {Triangle}
 * @returns {Triangle[]}
 */
function getChildren(triangle) {
  const midpoints = triangle.midpoints();
  midpoints.sort((a, b) => a.x - b.x);
  const left = midpoints[0];
  const top = midpoints[1];
  const right = midpoints[2];
  const sideLength = triangle.sides()[0].length() / 2;
  const height = Math.cos(Trig.radians(30)) * sideLength;

  const leftTriangle = new Triangle([
    left,
    new Point2D(left.x - sideLength, left.y),
    new Point2D(left.x - sideLength / 2, left.y + height),
  ]);

  const rightTriangle = new Triangle([
    right,
    new Point2D(right.x + sideLength, right.y),
    new Point2D(right.x + sideLength / 2, right.y + height),
  ]);

  const upperTriangle = new Triangle([
    top,
    new Point2D(top.x - sideLength / 2, top.y - height),
    new Point2D(top.x + sideLength / 2, top.y - height),
  ]);

  return [leftTriangle, rightTriangle, upperTriangle];
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
}

class Line2D {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  /** @returns {number} */
  length() {
    const a = this.start.x - this.end.x;
    const b = this.start.y - this.end.y;

    return Math.sqrt(a * a + b * b);
  }

  /** @returns {Point2D} */
  midpoint() {
    return new Point2D(
      this.start.x + (this.end.x - this.start.x) / 2,
      this.start.y + (this.end.y - this.start.y) / 2
    );
  }

  /** @returns {Line2D[]} */
  split() {
    const midpoint = this.midpoint();
    return [new Line2D(this.start, midpoint), new Line2D(midpoint, this.end)];
  }
}

class Triangle {
  constructor(points) {
    this.points = points;
  }

  async draw() {
    await Canvas.drawTriangle(this.points);
  }

  /** @returns {Line2D[]} */
  sides() {
    return [
      new Line2D(this.points[0], this.points[1]),
      new Line2D(this.points[1], this.points[2]),
      new Line2D(this.points[2], this.points[0]),
    ];
  }

  /** @returns {[Point2D]} */
  midpoints() {
    return this.sides().map((s) => s.midpoint());
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

class Trig {
  static hypotenuse(height) {
    return Math.sqrt(height * height + height * height);
  }

  static adjecent(hypotenuse) {
    return Math.cos(Trig.radians(30)) * hypotenuse;
  }

  static radians(degrees) {
    return (degrees * Math.PI) / 180;
  }

  static opposite(hypotenuse) {
    return Math.sin(Trig.radians(45)) * hypotenuse;
  }

  static midpoint(point1, point2) {
    const x = point1.x + (point2.x - point1.x) / 2;
    const y = point1.y + (point2.y - point1.y) / 2;
    return new Point2D(x, y);
  }

  static length(point1, point2) {
    const a = point1.x - point2.x;
    const b = point1.y - point2.y;

    return Math.sqrt(a * a + b * b);
  }
}
