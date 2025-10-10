import { DisplayPosition } from './displayPosition';
import { Coordinate, Edge, Tile, tileColors } from './mapTypes';

const sqrt3 = Math.sqrt(3);
const sqrt3Half = sqrt3 / 2;
const sqrt3Quarter = sqrt3Half / 2;

const vertices: Coordinate[] = [
  new Coordinate(0, -1),
  new Coordinate(sqrt3Half, -0.5),
  new Coordinate(sqrt3Half, 0.5),
  new Coordinate(0, 1),
  new Coordinate(-sqrt3Half, 0.5),
  new Coordinate(-sqrt3Half, -0.5),
];

function getVertices(center: Coordinate, radius: number) {
  return vertices.map((v) => v.mul(radius).add(center));
}

function drawOutline(ctx: CanvasRenderingContext2D, vertices: Coordinate[]) {
  const last = vertices[vertices.length - 1];
  ctx.moveTo(last.x, last.y);
  for (const v of vertices) {
    ctx.lineTo(v.x, v.y);
  }
}
export function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  center: Coordinate,
  radius: number,
): void {
  const vertices = getVertices(center, radius);
  for (let i = 0; i < 6; ++i) {
    ctx.fillStyle = tileColors[tile.getItem(i)];
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(vertices[i].x, vertices[i].y);
    const next = (i + 1) % vertices.length;
    ctx.lineTo(vertices[next].x, vertices[next].y);
    ctx.fill();
  }

  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;
  ctx.beginPath();
  drawOutline(ctx, vertices);
  ctx.stroke();
}

const goodValueColors = ['', '#000', '#300', '#600', '#900', '#c00', '#f00'];

export function drawEdge(
  ctx: CanvasRenderingContext2D,
  edge: Edge,
  center: Coordinate,
  radius: number,
): void {
  const vertices = getVertices(center, radius);
  const isGood = edge.isGood();

  const color = isGood ? goodValueColors[edge.good] : '#999';
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, radius / 10);
  ctx.beginPath();
  drawOutline(ctx, vertices);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = `${radius * 0.65}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    isGood ? `${edge.all}` : `${edge.good}/${edge.all}`,
    center.x,
    center.y,
    radius * sqrt3,
  );
}

export function shouldDraw(
  size: Coordinate,
  center: Coordinate,
  radius: number,
): boolean {
  const w = radius * sqrt3Half;
  return (
    center.x > -w &&
    center.x < size.x + w &&
    center.y > -radius &&
    center.y < size.y + radius
  );
}

export function hexagonEdgeMidpoints(): Coordinate[] {
  return [
    new Coordinate(sqrt3Quarter, -0.75),
    new Coordinate(sqrt3Half, 0),
    new Coordinate(sqrt3Quarter, 0.75),
    new Coordinate(-sqrt3Quarter, 0.75),
    new Coordinate(-sqrt3Half, 0),
    new Coordinate(-sqrt3Quarter, -0.75),
  ];
}

export function screen2Logical(screen: Coordinate): Coordinate {
  const yAdjusted = screen.y + sqrt3Quarter;
  const y = Math.floor(yAdjusted / 1.5);
  const withinYSection = yAdjusted - y * 1.5;

  const xAdjusted = y % 2 == 0 ? screen.x + sqrt3Half : screen.x + sqrt3;
  const x = Math.floor(xAdjusted / sqrt3);
  if (withinYSection <= 1) {
    return new Coordinate(x, y);
  }

  const withinXSection = xAdjusted - x * sqrt3;
  const withinYSectionBelow = withinYSection - 1;
  if (withinXSection <= sqrt3Half) {
    if (withinXSection > withinYSectionBelow * sqrt3) {
      return new Coordinate(x, y);
    } else {
      return new Coordinate(y % 2 == 0 ? x : x - 1, y + 1);
    }
  } else {
    if (withinXSection - sqrt3Half + withinYSectionBelow * sqrt3 < sqrt3Half) {
      return new Coordinate(x, y);
    } else {
      return new Coordinate(y % 2 == 0 ? x + 1 : x, y + 1);
    }
  }
}

export function logical2Screen(coord: Coordinate): Coordinate {
  return new Coordinate(
    (coord.x * 2 - (Math.abs(coord.y) % 2)) * sqrt3Half,
    coord.y * 1.5,
  );
}
