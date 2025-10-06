export type TileType =
  | 'Unknown'
  | 'Grassland'
  | 'Forest'
  | 'Field'
  | 'Town'
  | 'River'
  | 'Lake'
  | 'Railway'
  | 'WaterStation';

export class Coordinate {
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}

  public static fromMouseEvent(event: MouseEvent): Coordinate {
    return new Coordinate(event.clientX, event.clientY);
  }

  public static fromElementSize(element: HTMLElement): Coordinate {
    return new Coordinate(element.clientWidth, element.clientHeight);
  }

  public add(rhs: Coordinate): Coordinate {
    return new Coordinate(this.x + rhs.x, this.y + rhs.y);
  }

  public sub(rhs: Coordinate): Coordinate {
    return new Coordinate(this.x - rhs.x, this.y - rhs.y);
  }

  public mul(value: number): Coordinate {
    return new Coordinate(this.x * value, this.y * value);
  }

  public div(value: number): Coordinate {
    return new Coordinate(this.x / value, this.y / value);
  }

  public neighbors(): Coordinate[] {
    return [
      new Coordinate(this.x + 1, this.y - 1),
      new Coordinate(this.x + 1, this.y),
      new Coordinate(this.x + 1, this.y + 1),
      new Coordinate(this.x, this.y + 1),
      new Coordinate(this.x - 1, this.y),
      new Coordinate(this.x, this.y - 1),
    ];
  }
}

export function oppositeDirection(id: number) {
  return (id + 3) % 6;
}

export class Tile {
  constructor(private readonly items: TileType[] = []) {
    if (items.length > 6) {
      items.length = 6;
    }
    for (let i = items.length; i < 6; ++i) {
      items.push('Unknown');
    }
  }

  public getItem(id: number): TileType {
    return this.items[id];
  }

  public isComplete(): boolean {
    return this.items.length === 6;
  }

  public add(tile: TileType): Tile {
    if (this.isComplete()) {
      throw new Error('Already complete');
    }
    return new Tile([...this.items, tile]);
  }

  public rotate(amount: number): Tile {
    let result: TileType[] = [];
    for (let i = 0; i < 6; ++i) {
      result.push(this.items[(i - amount + 6) % 6]);
    }
    return new Tile(result);
  }

  public getAllRotations(): Tile[] {
    let result: Tile[] = [];
    for (let i = 0; i < 6; ++i) {
      result.push(this.rotate(i));
    }
    return result;
  }
}

export class Edge {
  constructor(
    public readonly all: number,
    public readonly good: number,
  ) {}
}

export interface Item<T> {
  coordinate: Coordinate;
  item: T;
}

export const tileColors = {
  Unknown: '#aaa',
  Grassland: '#91d63e',
  Forest: '#1f771a',
  Field: '#d8d515',
  Town: '#ce5c73',
  River: '#64c3e0',
  Lake: '#0d99c4',
  Railway: '#91632b',
  WaterStation: '#14e8b6',
};
