import { LogicalCoordinate, PhysicalCoordinate } from './mapTypes';
import { twoOptIteration, twoOptJumpList } from './jumpList';
import { describe, expect, it } from 'vitest';
import { logical2Screen } from './drawHelper';

export function tourDistance(tour: LogicalCoordinate[]): number {
  if (tour.length === 0) {
    return 0;
  }

  let dist = 0;
  for (let i = 0; i < tour.length; i++) {
    const a = logical2Screen(tour[i]);
    const b = logical2Screen(tour[(i + 1) % tour.length]);
    dist += a.distance(b);
  }
  return dist;
}

describe('jumpList', () => {
  describe('twoOptIteration', () => {
    it('should decrease total distance after each iteration', () => {
      const tour = [
        new LogicalCoordinate(0, 0),
        new LogicalCoordinate(5, 5),
        new LogicalCoordinate(10, 0),
        new LogicalCoordinate(0, 10),
        new LogicalCoordinate(10, 10),
      ];

      const dist0 = tourDistance(tour);
      const improved1 = twoOptIteration(tour);
      const dist1 = tourDistance(tour);

      expect(improved1).toBe(true);
      expect(dist1).toBeLessThan(dist0);

      const improved2 = twoOptIteration(tour);
      const dist2 = tourDistance(tour);

      expect(improved2).toBe(false);
      expect(dist2).toBe(dist1);
    });

    it('should decrease total distance after each iteration in a more complex case', () => {
      const tour = [
        new LogicalCoordinate(41, -10),
        new LogicalCoordinate(43, -4),
        new LogicalCoordinate(47, 7),
        new LogicalCoordinate(33, -38),
        new LogicalCoordinate(13, -61),
        new LogicalCoordinate(12, -63),
        new LogicalCoordinate(9, -64),
        new LogicalCoordinate(-37, -37),
        new LogicalCoordinate(19, 94),
      ];

      const dist0 = tourDistance(tour);
      const improved1 = twoOptIteration(tour);
      const dist1 = tourDistance(tour);

      expect(improved1).toBe(true);
      expect(dist1).toBeLessThan(dist0);

      const improved2 = twoOptIteration(tour);
      const dist2 = tourDistance(tour);

      expect(improved2).toBe(false);
      expect(dist2).toBe(dist1);
    });

    it('should handle points in a line', () => {
      const tour = [
        new LogicalCoordinate(0, 0),
        new LogicalCoordinate(10, 0),
        new LogicalCoordinate(20, 0),
        new LogicalCoordinate(30, 0),
      ];

      const initialDist = tourDistance(tour);
      const improved = twoOptIteration(tour);
      const finalDist = tourDistance(tour);

      expect(improved).toBe(false);
      expect(finalDist).toBe(initialDist);
    });

    it('should handle points in a line with suboptimal starting point', () => {
      const tour = [
        new LogicalCoordinate(0, 0),
        new LogicalCoordinate(20, 0),
        new LogicalCoordinate(10, 0),
        new LogicalCoordinate(30, 0),
      ];

      const dist0 = tourDistance(tour);
      const improved1 = twoOptIteration(tour);
      const dist1 = tourDistance(tour);

      expect(improved1).toBe(true);
      expect(dist1).toBeLessThan(dist0);

      const improved2 = twoOptIteration(tour);
      const dist2 = tourDistance(tour);

      expect(improved2).toBe(false);
      expect(dist2).toBe(dist1);
    });
  });

  describe('twoOptJumpList', () => {
    it('should return empty for empty input', () => {
      const result = twoOptJumpList([], new PhysicalCoordinate(0, 0));
      expect(result).toEqual([]);
    });

    it('should return single element as is', () => {
      const edges = [new LogicalCoordinate(0, 0)];
      const result = twoOptJumpList(edges, new PhysicalCoordinate(0, 0));
      expect(result).toEqual(edges);
    });

    it('should return two elements as is', () => {
      const edges = [new LogicalCoordinate(0, 0), new LogicalCoordinate(1, 1)];
      const result = twoOptJumpList(edges, new PhysicalCoordinate(0, 0));
      expect(result).toHaveLength(2);
    });
  });
});
