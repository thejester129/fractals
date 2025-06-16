/** @type {HTMLCanvasElement} */
let canvas;
/** @type {CanvasRenderingContext2D} */
let ctx;

const BASE_HEIGHT = 300;

function onLoad() {
  canvas = document.getElementById("canvas");
  canvas.width = 500;
  canvas.height = 500;

  ctx = canvas.getContext("2d");

  const base = createBase();
  base.draw();

  const firstInner = createFirstInner(base);
  firstInner.draw();

  let total = 0;
  let children = [firstInner];
  for (i = 0; i < 10; i++) {
    children.forEach((c) => c.draw());
    total += children.length;
    children = children.map((c) => getChildren(c)).flat();
    console.log(total);
  }
}

/** @param triangle {Triangle} */
function drawChildren(triangle) {
  const children = getChildren(triangle);

  for (const child of children) {
    child.draw();
  }
}

/**
 * @returns {Triangle}
 */
function createBase() {
  const side = Trig.hypotenuse(BASE_HEIGHT);
  return new Triangle([
    new Point2D(0, BASE_HEIGHT),
    new Point2D(side / 2, 0),
    new Point2D(side, BASE_HEIGHT),
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
  const height = Trig.opposite(sideLength);

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
    new Point2D(top.x + sideLength / 2, top.y - height),
    new Point2D(top.x - sideLength / 2, top.y - height),
  ]);

  return [leftTriangle, rightTriangle, upperTriangle];
}

class Point2D {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Line2D {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }
  length() {
    const a = this.start.x - this.end.x;
    const b = this.start.y - this.end.y;

    return Math.sqrt(a * a + b * b);
  }

  midpoint() {
    return new Point2D(
      this.start.x + (this.end.x - this.start.x) / 2,
      this.start.y + (this.end.y - this.start.y) / 2
    );
  }
}

class Triangle {
  constructor(points) {
    this.points = points;
  }

  draw() {
    Canvas.drawTriangle(this.points);
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
  static drawTriangle(points) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.closePath();
    ctx.stroke();
  }
}

class Trig {
  static hypotenuse(height) {
    return Math.sqrt(height * height + height * height);
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
