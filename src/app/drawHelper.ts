import { DisplayPosition } from './displayPosition';
import { Coordinate, Edge, Item, Tile, tileColors } from './mapTypes';

const sqr3Half = Math.sqrt(3) / 2;

const vertices: Coordinate[] = [
  new Coordinate(0, -1),
  new Coordinate(sqr3Half, -0.5),
  new Coordinate(sqr3Half, 0.5),
  new Coordinate(0, 1),
  new Coordinate(-sqr3Half, 0.5),
  new Coordinate(-sqr3Half, -0.5),
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
  ctx.beginPath();
  drawOutline(ctx, vertices);
  ctx.stroke();
}

export function drawEdge(
  ctx: CanvasRenderingContext2D,
  edge: Edge,
  center: Coordinate,
  radius: number,
): void {
  const vertices = getVertices(center, radius);
  const isGood = edge.good == edge.all;

  ctx.fillStyle = isGood ? '#0a0' : '#f00';
  ctx.beginPath();
  drawOutline(ctx, vertices);
  ctx.fill();

  ctx.strokeStyle = 'white';
  ctx.beginPath();
  drawOutline(ctx, vertices);
  ctx.stroke();

  ctx.fillStyle = 'white';
  ctx.font = `${radius / 2}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    isGood ? `${edge.all}` : `${edge.good}/${edge.all}`,
    center.x,
    center.y,
    2 * radius,
  );
}

export function calculateCenter(
  size: Coordinate,
  displayPosition: DisplayPosition,
  coord: Coordinate,
): Coordinate {
  return new Coordinate(
    (coord.x * 2 - (Math.abs(coord.y) % 2)) * sqr3Half,
    coord.y * 1.5,
  )
    .mul(displayPosition.zoom)
    .add(displayPosition.offset)
    .add(size.div(2));
}

export function shouldDraw(
  size: Coordinate,
  center: Coordinate,
  radius: number,
): boolean {
  const w = radius * sqr3Half;
  return (
    center.x > -w &&
    center.x < size.x + w &&
    center.y > -radius &&
    center.y < size.y + radius
  );
}
