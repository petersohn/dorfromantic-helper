import {
  TileType,
  PhysicalCoordinate,
  LogicalCoordinate,
  oppositeDirection,
  Tile,
  Edge,
  tileTypes,
} from './mapTypes';
import { describe, expect, it } from 'vitest';

describe('mapTypes', () => {
  describe('TileType', () => {
    it('should have all expected tile types', () => {
      const expectedTypes = [
        TileType.Unknown,
        TileType.Grassland,
        TileType.Forest,
        TileType.Field,
        TileType.Town,
        TileType.River,
        TileType.Lake,
        TileType.Railway,
        TileType.WaterStation,
      ];
      expectedTypes.forEach((type) => {
        expect(type).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('PhysicalCoordinate', () => {
    it('should create coordinate with x and y', () => {
      const coord = new PhysicalCoordinate(10, 20);
      expect(coord.x).toBe(10);
      expect(coord.y).toBe(20);
    });

    describe('add', () => {
      it('should add two coordinates', () => {
        const coord1 = new PhysicalCoordinate(10, 20);
        const coord2 = new PhysicalCoordinate(5, 10);
        const result = coord1.add(coord2);
        expect(result.x).toBe(15);
        expect(result.y).toBe(30);
      });
    });

    describe('sub', () => {
      it('should subtract two coordinates', () => {
        const coord1 = new PhysicalCoordinate(10, 20);
        const coord2 = new PhysicalCoordinate(5, 10);
        const result = coord1.sub(coord2);
        expect(result.x).toBe(5);
        expect(result.y).toBe(10);
      });
    });

    describe('mul', () => {
      it('should multiply coordinate by scalar', () => {
        const coord = new PhysicalCoordinate(10, 20);
        const result = coord.mul(2);
        expect(result.x).toBe(20);
        expect(result.y).toBe(40);
      });

      it('should handle fractional multiplication', () => {
        const coord = new PhysicalCoordinate(10, 20);
        const result = coord.mul(0.5);
        expect(result.x).toBe(5);
        expect(result.y).toBe(10);
      });
    });

    describe('div', () => {
      it('should divide coordinate by scalar', () => {
        const coord = new PhysicalCoordinate(10, 20);
        const result = coord.div(2);
        expect(result.x).toBe(5);
        expect(result.y).toBe(10);
      });
    });
  });

  describe('LogicalCoordinate', () => {
    it('should create coordinate with x and y', () => {
      const coord = new LogicalCoordinate(3, 4);
      expect(coord.x).toBe(3);
      expect(coord.y).toBe(4);
    });

    describe('neighbors', () => {
      it('should return 6 neighbors for even y', () => {
        const coord = new LogicalCoordinate(0, 0);
        const neighbors = coord.neighbors();
        expect(neighbors).toHaveLength(6);
      });

      it('should return correct neighbors for y=0 (even)', () => {
        const coord = new LogicalCoordinate(0, 0);
        const neighbors = coord.neighbors();
        expect(neighbors[0]).toEqual(new LogicalCoordinate(1, -1));
        expect(neighbors[1]).toEqual(new LogicalCoordinate(1, 0));
        expect(neighbors[2]).toEqual(new LogicalCoordinate(1, 1));
        expect(neighbors[3]).toEqual(new LogicalCoordinate(0, 1));
        expect(neighbors[4]).toEqual(new LogicalCoordinate(-1, 0));
        expect(neighbors[5]).toEqual(new LogicalCoordinate(0, -1));
      });

      it('should return correct neighbors for y=1 (odd)', () => {
        const coord = new LogicalCoordinate(0, 1);
        const neighbors = coord.neighbors();
        expect(neighbors[0]).toEqual(new LogicalCoordinate(0, 0));
        expect(neighbors[1]).toEqual(new LogicalCoordinate(1, 1));
        expect(neighbors[2]).toEqual(new LogicalCoordinate(0, 2));
        expect(neighbors[3]).toEqual(new LogicalCoordinate(-1, 2));
        expect(neighbors[4]).toEqual(new LogicalCoordinate(-1, 1));
        expect(neighbors[5]).toEqual(new LogicalCoordinate(-1, 0));
      });
    });
  });

  describe('oppositeDirection', () => {
    it.each([
      [0, 3],
      [1, 4],
      [2, 5],
      [3, 0],
      [4, 1],
      [5, 2],
    ])('direction %i should have opposite %i', (dir, expected) => {
      expect(oppositeDirection(dir)).toBe(expected);
    });
  });

  describe('Tile', () => {
    describe('constructor', () => {
      it('should create empty tile by default', () => {
        const tile = new Tile();
        expect(tile.isEmpty()).toBe(true);
        expect(tile.isComplete()).toBe(false);
      });

      it('should accept initial items', () => {
        const tile = new Tile([TileType.Grassland, TileType.Forest]);
        expect(tile.getItem(0)).toBe(TileType.Grassland);
        expect(tile.getItem(1)).toBe(TileType.Forest);
        expect(tile.getItem(2)).toBe(TileType.Unknown);
        expect(tile.isEmpty()).toBe(false);
        expect(tile.isComplete()).toBe(false);
      });

      it('should create a complete tile', () => {
        const tile = new Tile([
          TileType.Grassland,
          TileType.Forest,
          TileType.Grassland,
          TileType.Field,
          TileType.Field,
          TileType.Railway,
        ]);
        expect(tile.getItem(0)).toBe(TileType.Grassland);
        expect(tile.getItem(1)).toBe(TileType.Forest);
        expect(tile.getItem(2)).toBe(TileType.Grassland);
        expect(tile.getItem(3)).toBe(TileType.Field);
        expect(tile.getItem(4)).toBe(TileType.Field);
        expect(tile.getItem(5)).toBe(TileType.Railway);
        expect(tile.getItem(6)).toBe(TileType.Unknown);
        expect(tile.isComplete()).toBe(true);
        expect(tile.isEmpty()).toBe(false);
      });

      it('should truncate items to 6', () => {
        const items: TileType[] = [
          TileType.Grassland,
          TileType.Forest,
          TileType.Field,
          TileType.Town,
          TileType.River,
          TileType.Lake,
          TileType.Railway,
          TileType.WaterStation,
        ];
        const tile = new Tile(items);
        expect(tile.getItem(0)).toBe(TileType.Grassland);
        expect(tile.getItem(1)).toBe(TileType.Forest);
        expect(tile.getItem(2)).toBe(TileType.Field);
        expect(tile.getItem(3)).toBe(TileType.Town);
        expect(tile.getItem(4)).toBe(TileType.River);
        expect(tile.getItem(5)).toBe(TileType.Lake);
        expect(tile.getItem(6)).toBe(TileType.Unknown);
        expect(tile.isComplete()).toBe(true);
        expect(tile.isEmpty()).toBe(false);
      });
    });

    describe('singleTile', () => {
      it('should create tile with same type on all sides', () => {
        const tile = Tile.singleTile(TileType.Forest);
        expect(tile.isComplete()).toBe(true);
        expect(tile.isEmpty()).toBe(false);
        for (let i = 0; i < 6; i++) {
          expect(tile.getItem(i)).toBe(TileType.Forest);
        }
      });
    });

    describe('add', () => {
      it('should add item to tile', () => {
        const tile = new Tile();
        const newTile = tile.add(TileType.Forest);
        expect(newTile.getItem(0)).toBe(TileType.Forest);
      });

      it('should throw error when tile is full', () => {
        const tile = Tile.singleTile(TileType.Forest);
        expect(() => tile.add(TileType.Grassland)).toThrow('Tile is full');
      });

      it('should not mutate original tile', () => {
        const tile = new Tile();
        tile.add(TileType.Forest);
        expect(tile.isEmpty()).toBe(true);
      });
    });

    describe('fill', () => {
      it('should fill tile with specified type', () => {
        const tile = new Tile([TileType.Grassland]);
        const filled = tile.fill(TileType.Forest);
        expect(filled.isComplete()).toBe(true);
        expect(filled.getItem(0)).toBe(TileType.Grassland);
        expect(filled.getItem(1)).toBe(TileType.Forest);
        expect(filled.getItem(2)).toBe(TileType.Forest);
        expect(filled.getItem(3)).toBe(TileType.Forest);
        expect(filled.getItem(4)).toBe(TileType.Forest);
        expect(filled.getItem(5)).toBe(TileType.Forest);
      });

      it('should not mutate original tile', () => {
        const tile = new Tile([TileType.Grassland]);
        tile.fill(TileType.Forest);
        expect(tile.isComplete()).toBe(false);
      });
    });

    describe('rotate', () => {
      it('should rotate tile clockwise', () => {
        const tile = new Tile([
          TileType.Grassland,
          TileType.Forest,
          TileType.Field,
          TileType.Town,
          TileType.River,
          TileType.Lake,
        ]);
        const rotated = tile.rotate(1);
        expect(rotated.getItem(0)).toBe(TileType.Lake);
        expect(rotated.getItem(1)).toBe(TileType.Grassland);
        expect(rotated.getItem(2)).toBe(TileType.Forest);
        expect(rotated.getItem(3)).toBe(TileType.Field);
        expect(rotated.getItem(4)).toBe(TileType.Town);
        expect(rotated.getItem(5)).toBe(TileType.River);
      });

      it('should rotate tile counterclockwise', () => {
        const tile = new Tile([
          TileType.Grassland,
          TileType.Forest,
          TileType.Field,
          TileType.Town,
          TileType.River,
          TileType.Lake,
        ]);
        const rotated = tile.rotate(-1);
        expect(rotated.getItem(0)).toBe(TileType.Forest);
        expect(rotated.getItem(1)).toBe(TileType.Field);
        expect(rotated.getItem(2)).toBe(TileType.Town);
        expect(rotated.getItem(3)).toBe(TileType.River);
        expect(rotated.getItem(4)).toBe(TileType.Lake);
        expect(rotated.getItem(5)).toBe(TileType.Grassland);
      });

      it('should rotate 6 times to get original', () => {
        const tile = new Tile([
          TileType.Grassland,
          TileType.Forest,
          TileType.Field,
          TileType.Town,
          TileType.River,
          TileType.Lake,
        ]);
        let rotated = tile;
        for (let i = 0; i < 6; i++) {
          rotated = rotated.rotate(1);
        }
        for (let i = 0; i < 6; i++) {
          expect(rotated.getItem(i)).toBe(tile.getItem(i));
        }
      });

      it('should not mutate original tile', () => {
        const tile = new Tile([
          TileType.Grassland,
          TileType.Forest,
          TileType.Field,
          TileType.Town,
          TileType.River,
          TileType.Lake,
        ]);
        tile.rotate(1);
        expect(tile.getItem(0)).toBe(TileType.Grassland);
      });
    });

    describe('getAllRotations', () => {
      it('should return 6 different rotations', () => {
        const tile = new Tile([
          TileType.Grassland,
          TileType.Forest,
          TileType.Field,
          TileType.Town,
          TileType.River,
          TileType.Lake,
        ]);
        const rotations = tile.getAllRotations();
        expect(rotations).toHaveLength(6);
        for (let i = 0; i < 6; i++) {
          for (let j = i + 1; j < 6; j++) {
            let different = false;
            for (let k = 0; k < 6; k++) {
              if (rotations[i].getItem(k) !== rotations[j].getItem(k)) {
                different = true;
                break;
              }
            }
            expect(different).toBe(true);
          }
        }
      });
    });

    describe('serialize', () => {
      it('should return array of items', () => {
        const items: TileType[] = [TileType.Grassland, TileType.Forest];
        const tile = new Tile(items);
        expect(tile.serialize()).toEqual([TileType.Grassland, TileType.Forest]);
      });

      it('should return copy of array', () => {
        const tile = new Tile([
          TileType.Grassland,
          TileType.Forest,
          TileType.Field,
          TileType.Railway,
          TileType.Railway,
        ]);
        const serialized = tile.serialize();
        serialized.push(TileType.Field);
        expect(tile.isComplete()).toBe(false);
      });
    });
  });

  describe('Edge', () => {
    it('should create edge with all and good counts', () => {
      const edge = new Edge(6, 4);
      expect(edge.all).toBe(6);
      expect(edge.good).toBe(4);
    });

    describe('isGood', () => {
      it('should return true when good equals all', () => {
        const edge = new Edge(6, 6);
        expect(edge.isGood()).toBe(true);
      });

      it('should return false when good is less than all', () => {
        const edge = new Edge(6, 4);
        expect(edge.isGood()).toBe(false);
      });
    });
  });
});
