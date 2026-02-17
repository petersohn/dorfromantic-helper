import { describe, expect, it, beforeEach } from 'vitest';
import { MapService, tileMapKey } from './map.service';
import { LogicalCoordinate, PhysicalCoordinate, Tile } from './mapTypes';
import { DisplayPosition } from './displayPosition';

describe('MapService', () => {
  let service: MapService;

  beforeEach(() => {
    service = new MapService();
    service.setWindowSize(new PhysicalCoordinate(800, 600));
    service.init();
  });

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
      expect(tiles[0].item.getItem(0)).toBe('Grassland');
    });

    it('should clear history', () => {
      service.fillTile('Grassland');
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
      service.addTile('Forest');
      service.addTile('Field');
      expect(service.candidate().getItem(0)).toBe('Forest');
      expect(service.candidate().getItem(1)).toBe('Field');
    });

    it('should allow undo of tile addition', () => {
      service.addTile('Forest');
      expect(service.canUndoTile()).toBe(true);
      service.undoTile();
      expect(service.candidate().isEmpty()).toBe(true);
    });

    it('should throw when tile is complete', () => {
      service.addTile('Forest');
      service.addTile('Field');
      service.addTile('Town');
      service.addTile('River');
      service.addTile('Lake');
      service.addTile('Railway');
      expect(() => service.addTile('Grassland')).toThrow('Tile is full');
    });
  });

  describe('fillTile', () => {
    it('should fill remaining slots with type', () => {
      service.addTile('Forest');
      service.fillTile('Field');
      const candidate = service.candidate();
      expect(candidate.isComplete()).toBe(true);
      expect(candidate.getItem(0)).toBe('Forest');
      for (let i = 1; i < 6; i++) {
        expect(candidate.getItem(i)).toBe('Field');
      }
    });

    it('should handle non-normal tile types', () => {
      service.fillTile('WaterStation');
      const candidate = service.candidate();
      expect(candidate.isComplete()).toBe(true);
      for (let i = 0; i < 6; i++) {
        expect(candidate.getItem(i)).toBe('WaterStation');
      }
    });

    it('should allow undo', () => {
      service.fillTile('WaterStation');
      expect(service.canUndoTile()).toBe(true);
    });
  });

  describe('clearCandidate', () => {
    it('should clear the candidate', () => {
      service.addTile('Forest');
      service.clearCandidate();
      expect(service.candidate().isEmpty()).toBe(true);
    });

    it('should clear candidate history', () => {
      service.addTile('Forest');
      service.clearCandidate();
      expect(service.canUndoTile()).toBe(false);
    });
  });

  describe('rotateCandidate', () => {
    it('should rotate candidate counterclockwise', () => {
      service.addTile('Forest');
      service.addTile('Field');
      const before = service.candidate();
      expect(before.getItem(0)).toBe('Forest');
      expect(before.getItem(1)).toBe('Field');
      service.rotateCandidate(-1);
      const after = service.candidate();
      expect(after.getItem(1)).toBe('Forest');
      expect(after.getItem(2)).toBe('Field');
    });

    it('should rotate candidate clockwise', () => {
      service.addTile('Forest');
      service.addTile('Field');
      service.rotateCandidate(1);
      const after = service.candidate();
      expect(after.getItem(0)).toBe('Field');
      expect(after.getItem(5)).toBe('Forest');
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
        service.fillTile('Grassland');
        expect(service.canAddCandidate(coord, checkValidity)).toBe(expected);
      },
    );
  });

  describe('addCandidate', () => {
    beforeEach(() => {
      service.reset();
      service.fillTile('Grassland');
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
      service.addTile('Forest');
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
      service.fillTile('Grassland');
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
      service.addTile('Forest');
      service.addTile('Field');
      service.undoTile();
      expect(service.candidate().getItem(0)).toBe('Forest');
      expect(service.candidate().isComplete()).toBe(false);
    });

    it('should restore previous candidate state after a fill', () => {
      service.addTile('Field');
      service.fillTile('Grassland');
      service.undoTile();
      expect(service.candidate().getItem(0)).toBe('Field');
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
      service.addTile('Forest');
      service.fillTile('Grassland');
      service.addCandidate(new LogicalCoordinate(1, 0));
    });

    it('should remove tile from map', () => {
      service.removeTile(new LogicalCoordinate(1, 0));
      expect(service.tiles()).toHaveLength(1);
    });

    it('should push removed tile to candidate', () => {
      service.removeTile(new LogicalCoordinate(1, 0));
      expect(service.candidate().isComplete()).toBe(true);
      expect(service.candidate().getItem(0)).toBe('Forest');
      expect(service.candidate().getItem(1)).toBe('Grassland');
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
      service.fillTile('Forest');
      service.addCandidate(new LogicalCoordinate(1, 0));
      const tile = service.getTile(new LogicalCoordinate(1, 0));
      expect(tile).not.toBeNull();
      expect(tile!.item.getItem(0)).toBe('Forest');
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
      service.fillTile('Forest');
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
      service.fillTile('Forest');
      service.addCandidate(new LogicalCoordinate(1, 0));

      const serialized = service.serializeGame();
      expect(serialized).toContain('tiles');
      expect(serialized).toContain('offset');
    });

    it('should deserialize game state', () => {
      service.fillTile('Forest');
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
      service.addTile('Grassland');
      expect(service.edges()).toHaveLength(0);
    });

    it('should return edges for free neighbors', () => {
      service.fillTile('Grassland');

      const edges = service.edges();
      expect(edges.length).toBeGreaterThan(0);
    });
  });

  describe('integration', () => {
    it('should handle full game workflow', () => {
      service.reset();

      service.fillTile('Grassland');
      expect(service.candidate().isComplete()).toBe(true);

      service.addCandidate(new LogicalCoordinate(1, 0));
      expect(service.tiles()).toHaveLength(2);

      service.fillTile('Forest');
      service.addCandidate(new LogicalCoordinate(2, 0));
      expect(service.tiles()).toHaveLength(3);

      service.undoPlacement();
      expect(service.tiles()).toHaveLength(2);
      expect(service.candidate().isComplete()).toBe(true);
    });
  });
});
