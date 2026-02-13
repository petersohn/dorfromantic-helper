import { PhysicalCoordinate, LogicalCoordinate } from './mapTypes';
import {
  shouldDraw,
  hexagonEdgeMidpoints,
  screen2Logical,
  logical2Screen,
} from './drawHelper';
import { describe, expect, it } from 'vitest';

describe('drawHelper', () => {
  describe('shouldDraw', () => {
    it('should return true when center is within bounds', () => {
      const size = new PhysicalCoordinate(100, 100);
      const center = new PhysicalCoordinate(50, 50);
      const radius = 10;
      expect(shouldDraw(size, center, radius)).toBe(true);
    });

    it('should return true when center is on edge', () => {
      const size = new PhysicalCoordinate(100, 100);
      const center = new PhysicalCoordinate(0, 0);
      const radius = 10;
      expect(shouldDraw(size, center, radius)).toBe(true);
    });

    it('should return false when center is outside left', () => {
      const size = new PhysicalCoordinate(100, 100);
      const center = new PhysicalCoordinate(-20, 50);
      const radius = 10;
      expect(shouldDraw(size, center, radius)).toBe(false);
    });

    it('should return false when center is outside right', () => {
      const size = new PhysicalCoordinate(100, 100);
      const center = new PhysicalCoordinate(120, 50);
      const radius = 10;
      expect(shouldDraw(size, center, radius)).toBe(false);
    });

    it('should return false when center is outside top', () => {
      const size = new PhysicalCoordinate(100, 100);
      const center = new PhysicalCoordinate(50, -20);
      const radius = 10;
      expect(shouldDraw(size, center, radius)).toBe(false);
    });

    it('should return false when center is outside bottom', () => {
      const size = new PhysicalCoordinate(100, 100);
      const center = new PhysicalCoordinate(50, 120);
      const radius = 10;
      expect(shouldDraw(size, center, radius)).toBe(false);
    });

    it('should account for radius in boundary check', () => {
      const size = new PhysicalCoordinate(100, 100);
      const center = new PhysicalCoordinate(109, 50);
      const radius = 10;
      expect(shouldDraw(size, center, radius)).toBe(false);
    });

    it('should return true when center is just outside left edge', () => {
      const size = new PhysicalCoordinate(100, 100);
      const center = new PhysicalCoordinate(-5, 50);
      const radius = 10;
      expect(shouldDraw(size, center, radius)).toBe(true);
    });

    it('should return true when center is just outside right edge', () => {
      const size = new PhysicalCoordinate(100, 100);
      const center = new PhysicalCoordinate(105, 50);
      const radius = 10;
      expect(shouldDraw(size, center, radius)).toBe(true);
    });

    it('should return true when center is just outside top edge', () => {
      const size = new PhysicalCoordinate(100, 100);
      const center = new PhysicalCoordinate(50, -5);
      const radius = 10;
      expect(shouldDraw(size, center, radius)).toBe(true);
    });

    it('should return true when center is just outside bottom edge', () => {
      const size = new PhysicalCoordinate(100, 100);
      const center = new PhysicalCoordinate(50, 105);
      const radius = 10;
      expect(shouldDraw(size, center, radius)).toBe(true);
    });
  });

  describe('hexagonEdgeMidpoints', () => {
    it('should return 6 points', () => {
      const midpoints = hexagonEdgeMidpoints();
      expect(midpoints).toHaveLength(6);
    });

    it('should return PhysicalCoordinate instances', () => {
      const midpoints = hexagonEdgeMidpoints();
      midpoints.forEach((p) => {
        expect(p).toBeInstanceOf(PhysicalCoordinate);
      });
    });

    it('should have correct midpoint positions', () => {
      const midpoints = hexagonEdgeMidpoints();
      expect(midpoints[0].x).toBeCloseTo(0.4330127018922193);
      expect(midpoints[0].y).toBeCloseTo(-0.75);
      expect(midpoints[1].x).toBeCloseTo(0.8660254037844386);
      expect(midpoints[1].y).toBeCloseTo(0);
      expect(midpoints[2].x).toBeCloseTo(0.4330127018922193);
      expect(midpoints[2].y).toBeCloseTo(0.75);
      expect(midpoints[3].x).toBeCloseTo(-0.4330127018922193);
      expect(midpoints[3].y).toBeCloseTo(0.75);
      expect(midpoints[4].x).toBeCloseTo(-0.8660254037844386);
      expect(midpoints[4].y).toBeCloseTo(0);
      expect(midpoints[5].x).toBeCloseTo(-0.4330127018922193);
      expect(midpoints[5].y).toBeCloseTo(-0.75);
    });
  });

  describe('logical2Screen', () => {
    it('should convert logical (0, 0) to screen', () => {
      const coord = new LogicalCoordinate(0, 0);
      const screen = logical2Screen(coord);
      expect(screen.x).toBeCloseTo(0);
      expect(screen.y).toBeCloseTo(0);
    });

    it('should convert logical (1, 0) to screen', () => {
      const coord = new LogicalCoordinate(1, 0);
      const screen = logical2Screen(coord);
      expect(screen.x).toBeCloseTo(1.7320508075688772);
      expect(screen.y).toBeCloseTo(0);
    });

    it('should convert logical (0, 1) to screen', () => {
      const coord = new LogicalCoordinate(0, 1);
      const screen = logical2Screen(coord);
      expect(screen.x).toBeCloseTo(-0.8660254037844386);
      expect(screen.y).toBeCloseTo(1.5);
    });

    it('should convert logical (1, 1) to screen', () => {
      const coord = new LogicalCoordinate(1, 1);
      const screen = logical2Screen(coord);
      expect(screen.x).toBeCloseTo(0.8660254037844386);
      expect(screen.y).toBeCloseTo(1.5);
    });

    it('should convert logical (0, 2) to screen', () => {
      const coord = new LogicalCoordinate(0, 2);
      const screen = logical2Screen(coord);
      expect(screen.x).toBeCloseTo(0);
      expect(screen.y).toBeCloseTo(3);
    });

    it('should be inverse of screen2Logical for various points', () => {
      const testCoords = [
        new LogicalCoordinate(0, 0),
        new LogicalCoordinate(1, 0),
        new LogicalCoordinate(0, 1),
        new LogicalCoordinate(1, 1),
        new LogicalCoordinate(-1, 0),
        new LogicalCoordinate(-1, 1),
        new LogicalCoordinate(5, 3),
        new LogicalCoordinate(10, 7),
      ];

      testCoords.forEach((logical) => {
        const screen = logical2Screen(logical);
        const result = screen2Logical(screen);
        expect(result.x).toBe(logical.x);
        expect(result.y).toBe(logical.y);
      });
    });
  });

  describe('screen2Logical', () => {
    it('should convert screen (0, 0) to logical', () => {
      const screen = new PhysicalCoordinate(0, 0);
      const logical = screen2Logical(screen);
      expect(logical.x).toBe(0);
      expect(logical.y).toBe(0);
    });

    it('should convert screen near (0, 0) correctly', () => {
      const screen = new PhysicalCoordinate(0.5, 0.5);
      const logical = screen2Logical(screen);
      expect(logical.y).toBe(0);
    });

    it('should convert screen in second row', () => {
      const screen = new PhysicalCoordinate(0, 2);
      const logical = screen2Logical(screen);
      expect(logical.y).toBe(1);
    });

    it('should correctly identify hex on each side of vertical edge between (0,0) and (1,0)', () => {
      const inside = screen2Logical(new PhysicalCoordinate(0.5, 0.5));
      const outside = screen2Logical(new PhysicalCoordinate(1.0, 0.5));
      expect(inside.x).toBe(0);
      expect(outside.x).toBe(1);
      expect(inside.y).toBe(0);
      expect(outside.y).toBe(0);
    });

    it('should correctly identify hex on each side of vertical edge between (0,0) and (-1,0)', () => {
      const inside = screen2Logical(new PhysicalCoordinate(-0.5, 0.5));
      const outside = screen2Logical(new PhysicalCoordinate(-1.0, 0.5));
      expect(inside.x).toBe(0);
      expect(outside.x).toBe(-1);
      expect(inside.y).toBe(0);
      expect(outside.y).toBe(0);
    });

    it('should correctly identify hex on each side of horizontal edge between (0,0) and (0,1)', () => {
      const inside = screen2Logical(new PhysicalCoordinate(0, 0.5));
      const outside = screen2Logical(new PhysicalCoordinate(0, 1.2));
      expect(inside.y).toBe(0);
      expect(outside.y).toBe(1);
    });

    it('should correctly identify hex on each side of horizontal edge between (0,0) and (0,-1)', () => {
      const inside = screen2Logical(new PhysicalCoordinate(0, 0.5));
      const outside = screen2Logical(new PhysicalCoordinate(0, -0.2));
      expect(inside.y).toBe(0);
      expect(outside.y).toBe(0);
    });

    it('should correctly identify hex on each side of horizontal edge between (0,1) and (0,2)', () => {
      const inside = screen2Logical(new PhysicalCoordinate(0, 2.3));
      const outside = screen2Logical(new PhysicalCoordinate(0, 2.9));
      expect(inside.y).toBe(2);
      expect(outside.y).toBe(2);
    });

    it('should be inverse of logical2Screen for exact logical coordinates', () => {
      const testLogicalCoords = [
        new LogicalCoordinate(0, 0),
        new LogicalCoordinate(1, 0),
        new LogicalCoordinate(0, 1),
        new LogicalCoordinate(1, 1),
        new LogicalCoordinate(-1, 0),
        new LogicalCoordinate(-1, 1),
        new LogicalCoordinate(0, 2),
        new LogicalCoordinate(1, 2),
      ];

      testLogicalCoords.forEach((logical) => {
        const screen = logical2Screen(logical);
        const result = screen2Logical(screen);
        expect(result.x).toBe(logical.x);
        expect(result.y).toBe(logical.y);
      });
    });
  });
});
