import { LogicalCoordinate, PhysicalCoordinate } from './mapTypes';
import { logical2Screen } from './drawHelper';

export type JumpListAlgorithm = (
  edges: LogicalCoordinate[],
  currentPosition: PhysicalCoordinate,
) => LogicalCoordinate[];

function swapSegment<T>(arr: T[], start: number, end: number): void {
  while (start < end) {
    const temp = arr[start];
    arr[start] = arr[end];
    arr[end] = temp;
    start++;
    end--;
  }
}

function greedyStep(
  remaining: LogicalCoordinate[],
  output: LogicalCoordinate[],
  current: PhysicalCoordinate,
): void {
  if (remaining.length === 0) {
    return;
  }

  let minIndex = 0;
  let minDist = current.distanceSquared(logical2Screen(remaining[0]));

  for (let i = 1; i < remaining.length; i++) {
    const dist = current.distanceSquared(logical2Screen(remaining[i]));
    if (dist < minDist) {
      minDist = dist;
      minIndex = i;
    }
  }

  const best = remaining.splice(minIndex, 1)[0];
  output.push(best);
}

function greedyFill(
  edges: LogicalCoordinate[],
  output: LogicalCoordinate[],
  current: PhysicalCoordinate,
): void {
  const remaining = [...edges];

  while (remaining.length > 0) {
    greedyStep(remaining, output, current);
    current = logical2Screen(output[output.length - 1]);
  }
}

export function greedyJumpList(
  edges: LogicalCoordinate[],
  currentPosition: PhysicalCoordinate,
): LogicalCoordinate[] {
  if (edges.length === 0) {
    return [];
  }

  const result: LogicalCoordinate[] = [];
  greedyFill(edges, result, currentPosition);
  return result;
}

export function twoOptJumpList(
  edges: LogicalCoordinate[],
  currentPosition: PhysicalCoordinate,
): LogicalCoordinate[] {
  if (edges.length <= 2) {
    return [...edges];
  }

  const initialTour: LogicalCoordinate[] = [edges[0]];
  greedyFill(edges.slice(1), initialTour, logical2Screen(edges[0]));

  const optimized = twoOptOptimize(initialTour);
  return rotateToStart(optimized, currentPosition);
}

function twoOptOptimize(tour: LogicalCoordinate[]): LogicalCoordinate[] {
  let improved = true;

  while (improved) {
    improved = twoOptIteration(tour);
  }

  return tour;
}

export function twoOptIteration(tour: LogicalCoordinate[]): boolean {
  const n = tour.length;
  let improved = false;

  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 2; j < n; j++) {
      const delta = calculateDelta(tour, i, j);
      if (delta < 0) {
        swapSegment(tour, i + 1, j);
        improved = true;
      }
    }
  }

  return improved;
}

function calculateDelta(
  tour: LogicalCoordinate[],
  i: number,
  j: number,
): number {
  const n = tour.length;

  const a = tour[i];
  const b = tour[(i + 1) % n];
  const c = tour[j];
  const d = tour[(j + 1) % n];

  // We need to use distance here instead of distanceSquared, because the sum of
  // squares is not the same as the square of the sums.
  const currentDist =
    logical2Screen(a).distance(logical2Screen(b)) +
    logical2Screen(c).distance(logical2Screen(d));

  const newDist =
    logical2Screen(a).distance(logical2Screen(c)) +
    logical2Screen(b).distance(logical2Screen(d));

  return newDist - currentDist;
}

function rotateToStart(
  tour: LogicalCoordinate[],
  currentPosition: PhysicalCoordinate,
): LogicalCoordinate[] {
  if (tour.length === 0) {
    return tour;
  }

  let closestIndex = 0;
  let closestDist = currentPosition.distanceSquared(logical2Screen(tour[0]));

  for (let i = 1; i < tour.length; i++) {
    const dist = currentPosition.distanceSquared(logical2Screen(tour[i]));
    if (dist < closestDist) {
      closestDist = dist;
      closestIndex = i;
    }
  }

  const result = tour.slice(closestIndex).concat(tour.slice(0, closestIndex));
  return result;
}
