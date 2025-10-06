import { computed, Injectable, signal } from '@angular/core';
import { DisplayPosition } from './displayPosition';
import {
  Coordinate,
  Edge,
  Item,
  oppositeDirection,
  Tile,
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
      from: 'Railway',
      to: 'WaterStation',
    },
  ];

  private onlyMatch: TileType[] = ['River', 'Railway'];

  public displayPosition = signal<DisplayPosition>(
    new DisplayPosition(new Coordinate(0, 0), 100),
  );

  private tiles_ = signal<Item<Tile>[]>([
    {
      coordinate: new Coordinate(0, 0),
      item: new Tile([
        'Grassland',
        'Grassland',
        'Grassland',
        'Grassland',
        'Grassland',
        'Grassland',
      ]),
    },
  ]);
  private tileMap = new Map<string, Item<Tile>>();
  private history: string[] = [];

  public tiles = computed(() => this.tiles_());
  public edges = computed(() => this.getEdges());

  public candidate = signal<Tile>(new Tile());

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
    if (!this.getEdge(c, coordinate, 0)) {
      throw new Error('Cannot put here');
    }

    this.tileMap.set(key, { coordinate, item: c });
    this.history.push(key);
    this.candidate.set(new Tile());
    this.updateTiles();
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
