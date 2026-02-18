import { describe, expect, it, beforeEach } from 'vitest';
import { MapService, tileMapKey } from './map.service';
import {
  Edge,
  LogicalCoordinate,
  LogicalItem,
  PhysicalCoordinate,
  TileType,
} from './mapTypes';
import { DisplayPosition } from './displayPosition';

describe('MapService', () => {
  let service: MapService;

  beforeEach(() => {
    service = new MapService();
    service.setWindowSize(new PhysicalCoordinate(800, 600));
    service.init();
  });

  function findEdge(edges: LogicalItem<Edge>[], x: number, y: number) {
    return edges.find((e) => e.coordinate.x === x && e.coordinate.y === y);
  }

  describe('tileMapKey', () => {
    it.each([
      [new LogicalCoordinate(0, 0), '0,0'],
      [new LogicalCoordinate(1, -1), '1,-1'],
      [new LogicalCoordinate(-5, 10), '-5,10'],
    ])('should return correct key for %o', (coord, expected) => {
      expect(tileMapKey(coord)).toBe(expected);
    });
  });

  describe('constructor', () => {
    it('should initialize with empty tileMap', () => {
      const newService = new MapService();
      expect(newService.tiles()).toHaveLength(0);
    });

    it('should initialize with empty candidate', () => {
      const newService = new MapService();
      expect(newService.candidate().isEmpty()).toBe(true);
    });

    it('should initialize with empty marks', () => {
      const newService = new MapService();
      expect(newService.marks()).toHaveLength(0);
    });
  });

  describe('setWindowSize and getWindowSize', () => {
    it('should set and get window size', () => {
      service.setWindowSize(new PhysicalCoordinate(1024, 768));
      const size = service.getWindowSize();
      expect(size.x).toBe(1024);
      expect(size.y).toBe(768);
    });

    it('should throw error when window size not set', () => {
      const newService = new MapService();
      expect(() => newService.getWindowSize()).toThrow('No window size');
    });
  });

  describe('reset', () => {
    it('should reset to initial state with one Grassland tile', () => {
      service.reset();
      const tiles = service.tiles();
      expect(tiles).toHaveLength(1);
      expect(tiles[0].coordinate).toEqual(new LogicalCoordinate(0, 0));
      expect(tiles[0].item.getItem(0)).toBe(TileType.Grassland);
    });

    it('should clear history', () => {
      service.fillTile(TileType.Grassland);
      service.addCandidate(new LogicalCoordinate(1, 0));
      service.reset();
      expect(service.canUndoPlacement()).toBe(false);
    });

    it('should clear marks', () => {
      service.addMark(new LogicalCoordinate(1, 0));
      service.reset();
      expect(service.marks()).toHaveLength(0);
    });

    it('should reset display position', () => {
      service.displayPosition.set(
        new DisplayPosition(new PhysicalCoordinate(100, 200), 1),
      );
      service.reset();
      const pos = service.displayPosition();
      expect(pos.offset.x).toBe(400);
      expect(pos.offset.y).toBe(300);
      expect(pos.zoomLevel).toBe(0);
    });
  });

  describe('addTile', () => {
    it('should add multiple tile types', () => {
      service.addTile(TileType.Forest);
      service.addTile(TileType.Field);
      expect(service.candidate().getItem(0)).toBe(TileType.Forest);
      expect(service.candidate().getItem(1)).toBe(TileType.Field);
    });

    it('should allow undo of tile addition', () => {
      service.addTile(TileType.Forest);
      expect(service.canUndoTile()).toBe(true);
      service.undoTile();
      expect(service.candidate().isEmpty()).toBe(true);
    });

    it('should throw when tile is complete', () => {
      service.addTile(TileType.Forest);
      service.addTile(TileType.Field);
      service.addTile(TileType.Town);
      service.addTile(TileType.River);
      service.addTile(TileType.Lake);
      service.addTile(TileType.Railway);
      expect(() => service.addTile(TileType.Grassland)).toThrow('Tile is full');
    });
  });

  describe('fillTile', () => {
    it('should fill remaining slots with type', () => {
      service.addTile(TileType.Forest);
      service.fillTile(TileType.Field);
      const candidate = service.candidate();
      expect(candidate.isComplete()).toBe(true);
      expect(candidate.getItem(0)).toBe(TileType.Forest);
      for (let i = 1; i < 6; i++) {
        expect(candidate.getItem(i)).toBe(TileType.Field);
      }
    });

    it('should handle non-normal tile types', () => {
      service.fillTile(TileType.WaterStation);
      const candidate = service.candidate();
      expect(candidate.isComplete()).toBe(true);
      for (let i = 0; i < 6; i++) {
        expect(candidate.getItem(i)).toBe(TileType.WaterStation);
      }
    });

    it('should allow undo', () => {
      service.fillTile(TileType.WaterStation);
      expect(service.canUndoTile()).toBe(true);
    });
  });

  describe('clearCandidate', () => {
    it('should clear the candidate', () => {
      service.addTile(TileType.Forest);
      service.clearCandidate();
      expect(service.candidate().isEmpty()).toBe(true);
    });

    it('should clear candidate history', () => {
      service.addTile(TileType.Forest);
      service.clearCandidate();
      expect(service.canUndoTile()).toBe(false);
    });
  });

  describe('rotateCandidate', () => {
    it('should rotate candidate counterclockwise', () => {
      service.addTile(TileType.Forest);
      service.addTile(TileType.Field);
      const before = service.candidate();
      expect(before.getItem(0)).toBe(TileType.Forest);
      expect(before.getItem(1)).toBe(TileType.Field);
      service.rotateCandidate(-1);
      const after = service.candidate();
      expect(after.getItem(1)).toBe(TileType.Forest);
      expect(after.getItem(2)).toBe(TileType.Field);
    });

    it('should rotate candidate clockwise', () => {
      service.addTile(TileType.Forest);
      service.addTile(TileType.Field);
      service.rotateCandidate(1);
      const after = service.candidate();
      expect(after.getItem(0)).toBe(TileType.Field);
      expect(after.getItem(5)).toBe(TileType.Forest);
    });
  });

  describe('canAddCandidate', () => {
    beforeEach(() => {});

    it.each([
      [false, new LogicalCoordinate(0, 0), false],
      [false, new LogicalCoordinate(0, 0), true],
      [true, new LogicalCoordinate(0, 1), false],
      [true, new LogicalCoordinate(0, 1), true],
      [true, new LogicalCoordinate(2, 0), false],
      [false, new LogicalCoordinate(2, 0), true],
    ])(
      'should return %s for %o with checkValidity %s',
      (expected, coord, checkValidity) => {
        service.reset();
        service.fillTile(TileType.Grassland);
        expect(service.canAddCandidate(coord, checkValidity)).toBe(expected);
      },
    );
  });

  describe('addCandidate', () => {
    beforeEach(() => {
      service.reset();
      service.fillTile(TileType.Grassland);
    });

    it('should add tile to map', () => {
      service.addCandidate(new LogicalCoordinate(1, 0));
      const tiles = service.tiles();
      expect(tiles).toHaveLength(2);
    });

    it('should add tile to map at correct coordinate', () => {
      service.addCandidate(new LogicalCoordinate(1, 0));
      const tile = service.getTile(new LogicalCoordinate(1, 0));
      expect(tile).not.toBeNull();
      expect(tile!.coordinate).toEqual(new LogicalCoordinate(1, 0));
    });

    it('should enable undo placement', () => {
      service.addCandidate(new LogicalCoordinate(1, 0));
      expect(service.canUndoPlacement()).toBe(true);
    });

    it('should throw when candidate is not complete', () => {
      service.reset();
      service.addTile(TileType.Forest);
      expect(() => service.addCandidate(new LogicalCoordinate(1, 0))).toThrow(
        'Not ready',
      );
    });

    it('should remove marks at placed coordinate', () => {
      service.addMark(new LogicalCoordinate(1, 0));
      service.addCandidate(new LogicalCoordinate(1, 0));
      expect(service.hasMark(new LogicalCoordinate(1, 0))).toBe(false);
    });
  });

  describe('undoPlacement', () => {
    beforeEach(() => {
      service.reset();
      service.fillTile(TileType.Grassland);
    });

    it('should remove last placed tile', () => {
      service.addCandidate(new LogicalCoordinate(1, 0));
      service.undoPlacement();
      expect(service.tiles()).toHaveLength(1);
    });

    it('should restore candidate', () => {
      service.addCandidate(new LogicalCoordinate(1, 0));
      service.undoPlacement();
      expect(service.candidate().isComplete()).toBe(true);
    });

    it('should do nothing when history is empty', () => {
      service.undoPlacement();
      expect(service.tiles()).toHaveLength(1);
    });
  });

  describe('undoTile', () => {
    it('should restore previous candidate state after an add', () => {
      service.addTile(TileType.Forest);
      service.addTile(TileType.Field);
      service.undoTile();
      expect(service.candidate().getItem(0)).toBe(TileType.Forest);
      expect(service.candidate().isComplete()).toBe(false);
    });

    it('should restore previous candidate state after a fill', () => {
      service.addTile(TileType.Field);
      service.fillTile(TileType.Grassland);
      service.undoTile();
      expect(service.candidate().getItem(0)).toBe(TileType.Field);
      expect(service.candidate().isComplete()).toBe(false);
    });

    it('should do nothing when history is empty', () => {
      service.undoTile();
      expect(service.candidate().isEmpty()).toBe(true);
    });
  });

  describe('removeTile', () => {
    beforeEach(() => {
      service.reset();
      service.addTile(TileType.Forest);
      service.fillTile(TileType.Grassland);
      service.addCandidate(new LogicalCoordinate(1, 0));
    });

    it('should remove tile from map', () => {
      service.removeTile(new LogicalCoordinate(1, 0));
      expect(service.tiles()).toHaveLength(1);
    });

    it('should push removed tile to candidate', () => {
      service.removeTile(new LogicalCoordinate(1, 0));
      expect(service.candidate().isComplete()).toBe(true);
      expect(service.candidate().getItem(0)).toBe(TileType.Forest);
      expect(service.candidate().getItem(1)).toBe(TileType.Grassland);
    });

    it('should do nothing for non-existent tile', () => {
      service.removeTile(new LogicalCoordinate(5, 5));
      expect(service.tiles()).toHaveLength(2);
      expect(service.candidate().isEmpty()).toBe(true);
    });
  });

  describe('getTile', () => {
    it('should return null for empty coordinate', () => {
      service.reset();
      expect(service.getTile(new LogicalCoordinate(1, 0))).toBeNull();
    });

    it('should return tile for occupied coordinate', () => {
      service.reset();
      service.fillTile(TileType.Forest);
      service.addCandidate(new LogicalCoordinate(1, 0));
      const tile = service.getTile(new LogicalCoordinate(1, 0));
      expect(tile).not.toBeNull();
      expect(tile!.item.getItem(0)).toBe(TileType.Forest);
    });
  });

  describe('marks', () => {
    it('should add mark', () => {
      service.reset();
      service.addMark(new LogicalCoordinate(1, 0));
      expect(service.hasMark(new LogicalCoordinate(1, 0))).toBe(true);
      expect(service.marks()).toHaveLength(1);
    });

    it('should not add mark on occupied coordinate', () => {
      service.fillTile(TileType.Forest);
      service.addCandidate(new LogicalCoordinate(1, 0));
      service.addMark(new LogicalCoordinate(1, 0));
      expect(service.marks()).toHaveLength(0);
    });

    it('should remove mark', () => {
      service.addMark(new LogicalCoordinate(1, 0));
      service.removeMark(new LogicalCoordinate(1, 0));
      expect(service.hasMark(new LogicalCoordinate(1, 0))).toBe(false);
    });
  });

  describe('serializeGame and deserializeGame', () => {
    it('should serialize game state', () => {
      service.fillTile(TileType.Forest);
      service.addCandidate(new LogicalCoordinate(1, 0));

      const serialized = service.serializeGame();
      expect(serialized).toContain('tiles');
      expect(serialized).toContain('offset');
    });

    it('should deserialize game state', () => {
      service.fillTile(TileType.Forest);
      service.addCandidate(new LogicalCoordinate(1, 0));

      const serialized = service.serializeGame();
      const newService = new MapService();
      newService.setWindowSize(new PhysicalCoordinate(800, 600));
      newService.deserializeGame(serialized);

      expect(newService.tiles()).toHaveLength(2);
    });

    it('should throw on bad input', () => {
      expect(() => service.deserializeGame('bad json')).toThrow();
      expect(() => service.deserializeGame('{}')).toThrow();
      expect(() =>
        service.deserializeGame('{"offset": "bad", "tiles": []}'),
      ).toThrow();
    });
  });

  describe('edges', () => {
    beforeEach(() => {
      service.reset();
    });

    it('should return empty when candidate is not complete', () => {
      service.addTile(TileType.Grassland);
      expect(service.edges()).toHaveLength(0);
    });

    it('should return edges for free neighbors', () => {
      service.fillTile(TileType.Grassland);

      const edges = service.edges();
      expect(edges.length).toBeGreaterThan(0);
    });

    it('should calculate edges at exact coordinates after placing one tile', () => {
      service.fillTile(TileType.Grassland);
      service.addCandidate(new LogicalCoordinate(1, 0));

      service.fillTile(TileType.Grassland);
      const edges = service.edges();

      const edgeAt1_1 = findEdge(edges, 1, 1);
      expect(edgeAt1_1).toBeDefined();
      expect(edgeAt1_1!.item.all).toBe(2);
      expect(edgeAt1_1!.item.good).toBe(2);
    });

    it('should calculate edges at exact coordinates after placing two tiles', () => {
      service.fillTile(TileType.Grassland);
      service.addCandidate(new LogicalCoordinate(1, 0));

      service.fillTile(TileType.Grassland);
      service.addCandidate(new LogicalCoordinate(1, 1));

      service.fillTile(TileType.Grassland);
      const edges = service.edges();

      const edgeAt0_1 = findEdge(edges, 0, 1);
      expect(edgeAt0_1).toBeDefined();
      expect(edgeAt0_1!.item.all).toBe(2);
      expect(edgeAt0_1!.item.good).toBe(2);

      const edgeAt2_0 = findEdge(edges, 2, 0);
      expect(edgeAt2_0).toBeDefined();
      expect(edgeAt2_0!.item.all).toBe(1);
      expect(edgeAt2_0!.item.good).toBe(1);
    });

    it('should calculate edges for non-matching tiles', () => {
      service.fillTile(TileType.Forest);
      service.addCandidate(new LogicalCoordinate(1, 0));

      service.fillTile(TileType.Grassland);
      const edges = service.edges();

      const edgeAt1_1 = findEdge(edges, 1, 1);
      expect(edgeAt1_1).toBeDefined();
      expect(edgeAt1_1!.item.all).toBe(2);
      expect(edgeAt1_1!.item.good).toBe(1);
    });

    it('should calculate edge for River matching with Lake', () => {
      service.fillTile(TileType.River);
      service.addCandidate(new LogicalCoordinate(1, 0));

      service.fillTile(TileType.Lake);
      const edges = service.edges();

      const edgeAt1_1 = findEdge(edges, 1, 1);
      expect(edgeAt1_1).toBeDefined();
      expect(edgeAt1_1!.item.all).toBe(2);
      expect(edgeAt1_1!.item.good).toBe(2);
    });

    it('should calculate edge for Railway matching with WaterStation', () => {
      service.fillTile(TileType.Railway);
      service.addCandidate(new LogicalCoordinate(1, 0));

      service.fillTile(TileType.WaterStation);
      const edges = service.edges();

      const edgeAt1_1 = findEdge(edges, 1, 1);
      expect(edgeAt1_1).toBeDefined();
      expect(edgeAt1_1!.item.all).toBe(2);
      expect(edgeAt1_1!.item.good).toBe(2);
    });

    it('should calculate edges correctly for mixed tile types', () => {
      service.fillTile(TileType.Grassland);
      service.addCandidate(new LogicalCoordinate(1, 0));

      service.fillTile(TileType.Forest);
      service.addCandidate(new LogicalCoordinate(1, 1));

      service.fillTile(TileType.Field);
      const edges = service.edges();

      expect(edges.length).toBeGreaterThan(0);

      const edgeAt2_0 = findEdge(edges, 2, 0);
      expect(edgeAt2_0).toBeDefined();
      expect(edgeAt2_0!.item.all).toBe(1);
      expect(edgeAt2_0!.item.good).toBe(0);

      const edgeAt0_1 = findEdge(edges, 0, 1);
      expect(edgeAt0_1).toBeDefined();
      expect(edgeAt0_1!.item.all).toBe(2);
      expect(edgeAt0_1!.item.good).toBe(0);
    });

    it('should have multiple edges around a cluster of tiles', () => {
      service.fillTile(TileType.Grassland);
      service.addCandidate(new LogicalCoordinate(1, 0));

      service.fillTile(TileType.Grassland);
      service.addCandidate(new LogicalCoordinate(1, 1));

      service.fillTile(TileType.Grassland);
      service.addCandidate(new LogicalCoordinate(0, 1));

      service.fillTile(TileType.Grassland);
      const edges = service.edges();

      expect(edges.length).toBeGreaterThanOrEqual(3);

      const edgeAt2_0 = findEdge(edges, 2, 0);
      expect(edgeAt2_0).toBeDefined();
      expect(edgeAt2_0!.item.all).toBe(1);
      expect(edgeAt2_0!.item.good).toBe(1);

      const edgeAt2_1 = findEdge(edges, 2, 1);
      expect(edgeAt2_1).toBeDefined();
      expect(edgeAt2_1!.item.all).toBe(2);
      expect(edgeAt2_1!.item.good).toBe(2);

      const edgeAtMinus1_0 = findEdge(edges, -1, 0);
      expect(edgeAtMinus1_0).toBeDefined();
      expect(edgeAtMinus1_0!.item.all).toBe(2);
      expect(edgeAtMinus1_0!.item.good).toBe(2);

      const edgeAt0_m1 = findEdge(edges, 0, -1);
      expect(edgeAt0_m1).toBeDefined();
      expect(edgeAt0_m1!.item.all).toBe(1);
      expect(edgeAt0_m1!.item.good).toBe(1);
    });
  });

  describe('integration', () => {
    it('should handle full game workflow', () => {
      service.reset();

      service.fillTile(TileType.Grassland);
      expect(service.candidate().isComplete()).toBe(true);

      service.addCandidate(new LogicalCoordinate(1, 0));
      expect(service.tiles()).toHaveLength(2);

      service.fillTile(TileType.Forest);
      service.addCandidate(new LogicalCoordinate(2, 0));
      expect(service.tiles()).toHaveLength(3);

      service.undoPlacement();
      expect(service.tiles()).toHaveLength(2);
      expect(service.candidate().isComplete()).toBe(true);
    });
  });
});
