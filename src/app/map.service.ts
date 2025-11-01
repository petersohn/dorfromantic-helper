import { computed, Injectable, signal } from '@angular/core';
import { DisplayPosition } from './displayPosition';
import {
  Coordinate,
  Edge,
  Item,
  oppositeDirection,
  Tile,
  tileColors,
  TileType,
  tileTypes,
} from './mapTypes';
import { isCaptureEventType } from '@angular/core/primitives/event-dispatch';

function tileMapKey(c: Coordinate) {
  return `${c.x},${c.y}`;
}

interface Match {
  from: TileType;
  to: TileType;
}

@Injectable()
export class MapService {
  constructor() {
    this.updateTiles();
  }

  private readonly matchMap: Match[] = [
    {
      from: 'River',
      to: 'Lake',
    },
    {
      from: 'River',
      to: 'WaterStation',
    },
    {
      from: 'Lake',
      to: 'WaterStation',
    },
    {
      from: 'Lake',
      to: 'Grassland',
    },
    {
      from: 'Railway',
      to: 'WaterStation',
    },
    {
      from: 'Grassland',
      to: 'WaterStation',
    },
  ];

  private readonly onlyMatch: TileType[] = ['River', 'Railway'];

  public readonly displayPosition = signal<DisplayPosition>(
    new DisplayPosition(new Coordinate(0, 0), 100),
  );

  private tileMap = new Map<string, Item<Tile>>();
  private readonly tiles_ = signal<Item<Tile>[]>([]);
  public readonly tiles = computed(() => this.tiles_());
  public readonly edges = computed(() => this.getEdges());

  private history: string[] = [];
  private candidateHistory: { tile: Tile; position: number }[] = [];

  private canUndoTile_ = signal<boolean>(false);
  public canUndoTile = computed(() => this.canUndoTile_());

  private candidate_ = signal<Tile>(new Tile());
  public candidate = computed(() => this.candidate_());
  public addPosition = signal(0);
  private candidateStack: Tile[] = [];

  private markMap = new Map<string, Coordinate>();
  private readonly marks_ = signal<Coordinate[]>([]);
  public readonly marks = computed(() => this.marks_());

  private windowSize: Coordinate | null = null;

  public setWindowSize(size: Coordinate) {
    this.windowSize = size;
  }

  public init() {
    if (!this.windowSize) {
      throw new Error('Size needs to be set');
    }
    const data = window.localStorage.getItem('Game');
    let loaded = false;
    if (data) {
      try {
        this.deserializeGame(data);
        loaded = true;
      } catch (e) {
        console.error(e);
      }
    }

    if (!loaded) {
      this.reset();
    }
  }

  public reset() {
    this.tileMap = new Map([
      [
        '0,0',
        {
          coordinate: new Coordinate(0, 0),
          item: Tile.singleTile('Grassland'),
        },
      ],
    ]);
    this.updateTiles();
    if (this.windowSize) {
      this.displayPosition.set(
        new DisplayPosition(this.windowSize.div(2), 100),
      );
    }
    this.history = [];
    this.candidateStack = [];
    this.markMap = new Map();
  }

  public canAddCandidate(coordinate: Coordinate): boolean {
    const c = this.candidate();
    return c.isComplete() && !!this.getEdge(c, coordinate, 0);
  }

  public addCandidate(coordinate: Coordinate): void {
    const c = this.candidate();
    if (!c.isComplete()) {
      throw new Error('Not ready');
    }

    const key = tileMapKey(coordinate);
    this.tileMap.set(key, { coordinate, item: c });
    this.history.push(key);
    this.popCandidate();
    this.updateTiles();

    this.addPosition.set(0);
    this.removeMark_(coordinate);
    this.candidateHistory = [];
    this.updateCanUndoTile();

    this.saveGame();
  }

  public rotateCandidate(delta: number) {
    const amount = delta > 0 ? -1 : 1;
    this.candidate_.update((c) => c.rotate(amount));
    this.addPosition.update((x) => (x + amount + 6) % 6);
  }

  public undoPlacement(): void {
    const key = this.history.pop();
    if (!key) {
      return;
    }

    const last = this.tileMap.get(key);
    if (last) {
      this.tileMap.delete(key);
      this.pushCandidate(last.item);
    }

    this.candidateHistory = [];
    this.updateCanUndoTile();
    this.updateTiles();
    this.saveGame();
  }

  public undoTile(): void {
    const data = this.candidateHistory.pop();
    if (!data) {
      return;
    }

    this.candidate_.set(data.tile);
    this.addPosition.set(data.position);
    this.updateCanUndoTile();
  }

  public removeTile(coordinate: Coordinate): void {
    const key = tileMapKey(coordinate);
    const tile = this.tileMap.get(key);
    if (tile) {
      this.tileMap.delete(key);
      this.updateTiles();
      this.pushCandidate(tile.item);
    }
    this.saveGame();
  }

  public getTile(coordinate: Coordinate): Item<Tile> | null {
    return this.tileMap.get(tileMapKey(coordinate)) ?? null;
  }

  public addMark(coord: Coordinate) {
    const key = tileMapKey(coord);
    if (this.tileMap.has(key)) {
      return;
    }
    this.markMap.set(key, coord);
    this.updateMarks();
    this.saveGame();
  }

  public removeMark(coord: Coordinate) {
    if (this.removeMark_(coord)) {
      this.saveGame();
    }
  }

  public hasMark(coord: Coordinate) {
    return this.markMap.has(tileMapKey(coord));
  }

  public saveGame(): void {
    const data = this.serializeGame();
    window.localStorage.setItem('Game', data);
  }

  public serializeGame(): string {
    const data: any = {
      offset: this.displayPosition().offset,
      zoom: this.displayPosition().zoom,
      tiles: this.tiles().map((t) => ({
        coordinate: t.coordinate,
        item: t.item.serialize(),
      })),
      marks: this.marks(),
    };
    return JSON.stringify(data);
  }

  public deserializeGame(input: string) {
    const data = JSON.parse(input);
    if (
      !this.is_coordinate(data.offset) ||
      typeof data.zoom !== 'number' ||
      typeof data.tiles !== 'object'
    ) {
      throw new Error('Bad input');
    }

    const tileMap = new Map<string, Item<Tile>>();
    for (const tile of data.tiles) {
      if (
        !this.is_coordinate(tile.coordinate) ||
        typeof tile.item !== 'object'
      ) {
        throw new Error('Bad input');
      }
      const items = Array.from(tile.item) as TileType[];
      for (const item of items) {
        if (!tileColors[item]) {
          throw new Error('Bad input');
        }
      }
      const coordinate = new Coordinate(tile.coordinate.x, tile.coordinate.y);
      tileMap.set(tileMapKey(coordinate), {
        coordinate,
        item: new Tile(items),
      });
    }

    const marks = data.marks ?? [];
    for (const mark of marks) {
      if (!this.is_coordinate(mark)) {
        throw new Error('Bad input');
      }
    }

    this.history = [];
    this.candidateStack = [];

    this.displayPosition.set(
      new DisplayPosition(
        new Coordinate(data.offset.x, data.offset.y),
        data.zoom,
      ),
    );
    this.tileMap = tileMap;
    this.updateTiles();

    this.markMap = new Map(marks.map((m: Coordinate) => [tileMapKey(m), m]));
    this.updateMarks();
  }

  public addTile(type: TileType) {
    this.candidate_.update((c) => {
      const p = this.addPosition();
      this.candidateHistory.push({ tile: c, position: p });
      const result = tileTypes[c.getItem(0)].normal ? c : new Tile();
      return result.add(type, p);
    });
    this.addPosition.update((p) => (p + 1) % 6);
    this.updateCanUndoTile();
  }

  public fillTile(type: TileType) {
    this.candidate_.update((c) => {
      this.candidateHistory.push({ tile: c, position: this.addPosition() });
      return !tileTypes[type].normal || c.isComplete()
        ? Tile.singleTile(type)
        : c.fillUnknown(type);
    });
    this.addPosition.set(0);
    this.updateCanUndoTile();
  }

  public clearCandidate(): void {
    this.candidate_.update((c) => {
      this.candidateHistory.push({ tile: c, position: this.addPosition() });
      return new Tile();
    });
    this.addPosition.set(0);
    this.updateCanUndoTile();
  }

  private updateCanUndoTile(): void {
    this.canUndoTile_.set(this.candidateHistory.length !== 0);
  }

  private removeMark_(coord: Coordinate): boolean {
    if (this.markMap.delete(tileMapKey(coord))) {
      this.updateMarks();
      return true;
    }
    return false;
  }

  private is_coordinate(obj: any) {
    return (
      typeof obj === 'object' &&
      typeof obj.x === 'number' &&
      typeof obj.y === 'number'
    );
  }

  private updateMarks() {
    this.marks_.set(Array.from(this.markMap.values()));
  }

  private pushCandidate(tile: Tile): void {
    this.candidate_.update((c) => {
      if (c.isComplete()) {
        this.candidateStack.push(c);
      }
      return tile;
    });
  }

  private popCandidate(): void {
    const c = this.candidateStack.pop();
    this.candidate_.set(c ?? new Tile());
  }

  private updateTiles(): void {
    this.tiles_.set(Array.from(this.tileMap.values()));
  }

  private getEdge(
    candidate: Tile,
    coordinate: Coordinate,
    rotation: number,
  ): Edge | null {
    const neighbors = coordinate.neighbors();
    let all = 0;
    let good = 0;
    for (let i = 0; i < neighbors.length; ++i) {
      const tile = this.tileMap.get(tileMapKey(neighbors[i]));
      if (tile) {
        const a = candidate.getItem((i + rotation) % 6);
        const b = tile.item.getItem(oppositeDirection(i));
        const matches = this.doesMatch(a, b);
        if (
          (this.onlyMatch.includes(a) || this.onlyMatch.includes(b)) &&
          !matches
        ) {
          return null;
        }
        ++all;
        if (matches) {
          ++good;
        }
      }
    }
    if (all !== 0) {
      return new Edge(all, good);
    }
    return null;
  }

  private getEdges(): Item<Edge>[] {
    const candidate = this.candidate();
    if (!candidate.isComplete()) {
      return [];
    }

    const freeCoordinates = new Map<string, Coordinate>();

    this.tiles_();
    for (const tile of this.tileMap.values()) {
      for (const c of tile.coordinate.neighbors()) {
        const key = tileMapKey(c);
        if (!this.tileMap.has(key)) {
          freeCoordinates.set(key, c);
        }
      }
    }

    const result: Item<Edge>[] = [];

    for (const coordinate of freeCoordinates.values()) {
      let edge: Edge | null = null;
      for (let rotation = 0; rotation < 6; ++rotation) {
        const newEdge = this.getEdge(candidate, coordinate, rotation);
        if (newEdge && (!edge || newEdge.good > edge.good)) {
          edge = newEdge;
        }
      }

      if (edge) {
        result.push({ coordinate, item: edge });
      }
    }

    return result;
  }

  private doesMatch(from: TileType, to: TileType) {
    return (
      from === to ||
      this.matchMap.some(
        (m) =>
          (m.from === from && m.to === to) || (m.from === to && m.to === from),
      )
    );
  }
}
