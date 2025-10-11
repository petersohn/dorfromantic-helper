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
} from './mapTypes';

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

  private matchMap: Match[] = [
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

  private onlyMatch: TileType[] = ['River', 'Railway'];

  public displayPosition = signal<DisplayPosition>(
    new DisplayPosition(new Coordinate(0, 0), 100),
  );

  private tiles_ = signal<Item<Tile>[]>([]);
  private tileMap = new Map<string, Item<Tile>>();
  private history: string[] = [];

  public tiles = computed(() => this.tiles_());
  public edges = computed(() => this.getEdges());

  public candidate = signal<Tile>(new Tile());
  public addPosition = signal(0);

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
    this.candidate.set(new Tile());
    this.updateTiles();

    this.addPosition.set(0);

    const data = this.serializeGame();
    window.localStorage.setItem('Game', data);
  }

  public rotateCandidate(delta: number) {
    const amount = delta > 0 ? -1 : 1;
    this.candidate.update((c) => c.rotate(amount));
    this.addPosition.update((x) => (x + amount + 6) % 6);
  }

  public undo(): void {
    const key = this.history.pop();
    if (!key) {
      return;
    }

    const last = this.tileMap.get(key);
    if (last) {
      this.tileMap.delete(key);
      this.candidate.set(last.item);
    }

    this.updateTiles();
  }

  public removeTile(coordinate: Coordinate): void {
    this.tileMap.delete(tileMapKey(coordinate));
    this.updateTiles();
  }

  public getTile(coordinate: Coordinate): Item<Tile> | null {
    return this.tileMap.get(tileMapKey(coordinate)) ?? null;
  }

  public serializeGame(): string {
    const data: any = {
      offset: this.displayPosition().offset,
      zoom: this.displayPosition().zoom,
      tiles: this.tiles().map((t) => ({
        coordinate: t.coordinate,
        item: t.item.serialize(),
      })),
    };
    return JSON.stringify(data);
  }

  public deserializeGame(input: string) {
    const data = JSON.parse(input);
    if (
      typeof data.offset !== 'object' ||
      typeof data.offset.x !== 'number' ||
      typeof data.offset.y !== 'number' ||
      typeof data.zoom !== 'number' ||
      typeof data.tiles !== 'object'
    ) {
      throw new Error('Bad input');
    }

    const tileMap = new Map<string, Item<Tile>>();
    for (const tile of data.tiles) {
      if (
        typeof tile.coordinate !== 'object' ||
        typeof tile.coordinate.x !== 'number' ||
        typeof tile.coordinate.y !== 'number' ||
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

    this.displayPosition.set(
      new DisplayPosition(
        new Coordinate(data.offset.x, data.offset.y),
        data.zoom,
      ),
    );
    this.tileMap = tileMap;
    this.updateTiles();
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
