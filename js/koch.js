/** @type {HTMLCanvasElement} */
let canvas;
/** @type {HTMLDivElement} */
let totalElm;
/** @type {CanvasRenderingContext2D} */
let ctx;

const BASE_SIDE_LENGTH = 500;
const ITERATIONS = 5;
const STROKE_COLOR = "white";
const LINE_DRAW_DELAY = 20;
let CENTER, BASE_HEIGHT;

function onLoad() {
  canvas = document.getElementById("canvas");
  totalElm = document.getElementById("total");
  canvas.width = BASE_SIDE_LENGTH;
  canvas.height = BASE_SIDE_LENGTH * 2;

  ctx = canvas.getContext("2d");

  BASE_HEIGHT = Trig.adjecent(BASE_SIDE_LENGTH);

  const base = createBase();
  const avgX = base.points.reduce((acc, s) => acc + s.x, 0) / 3;
  const avgY = base.points.reduce((acc, s) => acc + s.y, 0) / 3;
  CENTER = new Point2D(avgX, avgY);
  drawChildren(base).then(() => window.location.reload());
}

function drawCircle(x, y) {
  ctx.strokeStyle = STROKE_COLOR;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, 2 * Math.PI);
  ctx.stroke();
}

/** @param base {Triangle} */
async function drawChildren(base) {
  let total = 1;
  let children = [base];
  for (i = 0; i < ITERATIONS; i++) {
    await Promise.all(children.map((c) => c.draw()));
    total += children.length;
    totalElm.innerText = `Total: ${total}`;
    const bottomChild = total < 4;
    const mirrorChildren = total > 4;
    children = children
      .map((c) => getChildren(c, bottomChild, mirrorChildren))
      .flat();
  }
}

/** @returns {Triangle} */
function createBase() {
  const base = new Triangle([
    new Point2D(0, BASE_HEIGHT),
    new Point2D(BASE_SIDE_LENGTH / 2, 0),
    new Point2D(BASE_SIDE_LENGTH, BASE_HEIGHT),
  ]);

  return base;
}

let clockwise = false;
let bottomChild = true;
let iterations = 0;

/**
 * @param triangle {Triangle}
 * @returns {Triangle[]}
 */
function getChildren(triangle, bottomChild, mirrorChildren) {
  const children = [];
  let sides = triangle.sides();
  let parentBase;
  if (!bottomChild) {
    parentBase = sides.pop();
    // const parentTopPoint = sides[0].end;
    // const parentBasePoint = parentBase.midpoint();
    // const parentRotatePoint = parentTopPoint.rotateClockwise(
    //   180,
    //   parentBasePoint
    // );
    // drawCircle(parentRotatePoint.x, parentRotatePoint.y);
  }

  for (const side of sides) {
    const parts = side.split3();
    const base = parts[1];
    const height = Trig.adjecent(base.length());
    const guide = base.split()[1].rotateClockwise(-90).withLength(height);
    const topPoint = guide.end;
    const child = new Triangle([base.start, topPoint, base.end]);
    const rotateAngle = 360 / sides.length;
    const mirrorChild = new Triangle([
      base.start.rotateClockwise(rotateAngle, CENTER),
      topPoint.rotateClockwise(rotateAngle, CENTER),
      base.end.rotateClockwise(rotateAngle, CENTER),
    ]);
    children.push(child);
    if (mirrorChildren) {
      children.push(mirrorChild);
    }
  }
  clockwise = !clockwise;

  return children;
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
    angle = Trig.radians(angle);
    const translatedToOriginX = this.x - centre.x;
    const translatedToOriginY = this.y - centre.y;

    const rotatedX =
      translatedToOriginX * Math.cos(angle) -
      translatedToOriginY * Math.sin(angle);
    const rotatedY =
      translatedToOriginX * Math.sin(angle) +
      translatedToOriginY * Math.cos(angle);

    const reverseTranslatedX = rotatedX + centre.x;
    const reverseTranslatedY = rotatedY + centre.y;

    return new Point2D(reverseTranslatedX, reverseTranslatedY);
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

  /** @returns {Line2D} */
  rotateClockwise(angle) {
    return new Line2D(
      new Point2D(this.start.x, this.start.y),
      this.end.rotateClockwise(angle, this.start)
    );
  }
  /** @returns {Line2D} */
  rotateClockwiseAroundCenter(angle) {
    return new Line2D(
      this.start.rotateClockwise(angle, this.midpoint()),
      this.end.rotateClockwise(angle, this.midpoint())
    );
  }

  withLength(length) {
    const current = this.length();
    const lengthFactor = length - current;
    const end = new Point2D(
      this.end.x + ((this.end.x - this.start.x) / current) * lengthFactor,
      this.end.y + ((this.end.y - this.start.y) / current) * lengthFactor
    );

    return new Line2D(this.start, end);
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
    // const times = line.length() > 20 ? 5 : 3;
    const times = 5;
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
    return Math.sin(Trig.radians(30)) * hypotenuse;
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
