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

  public static fromMouseEvent(
    parent: HTMLElement,
    event: MouseEvent,
  ): Coordinate {
    return new Coordinate(
      event.pageX - parent.offsetLeft,
      event.pageY - parent.offsetTop,
    );
  }

  public static fromElementSize(element: HTMLElement): Coordinate {
    return new Coordinate(element.clientWidth, element.clientHeight);
  }

  public static fromCanvasSize(canvas: HTMLCanvasElement): Coordinate {
    return new Coordinate(canvas.width, canvas.height);
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
    return this.y % 2 == 0
      ? [
          new Coordinate(this.x + 1, this.y - 1),
          new Coordinate(this.x + 1, this.y),
          new Coordinate(this.x + 1, this.y + 1),
          new Coordinate(this.x, this.y + 1),
          new Coordinate(this.x - 1, this.y),
          new Coordinate(this.x, this.y - 1),
        ]
      : [
          new Coordinate(this.x, this.y - 1),
          new Coordinate(this.x + 1, this.y),
          new Coordinate(this.x, this.y + 1),
          new Coordinate(this.x - 1, this.y + 1),
          new Coordinate(this.x - 1, this.y),
          new Coordinate(this.x - 1, this.y - 1),
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
  }

  public static singleTile(type: TileType): Tile {
    const items: TileType[] = [];
    for (let i = 0; i < 6; ++i) {
      items.push(type);
    }
    return new Tile(items);
  }

  public getItem(id: number): TileType {
    if (id >= this.items.length) {
      return 'Unknown';
    }
    return this.items[id];
  }

  public isComplete(): boolean {
    return this.items.length === 6;
  }

  public isEmpty(): boolean {
    return this.items.length === 0;
  }

  public add(tile: TileType): Tile {
    if (this.isComplete()) {
      throw new Error('Tile is full');
    }
    return new Tile([...this.items, tile]);
  }

  public fill(tile: TileType): Tile {
    const items = [...this.items];
    while (items.length < 6) {
      items.push(tile);
    }
    return new Tile(items);
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

  public serialize(): any {
    return [...this.items];
  }
}

export class Edge {
  constructor(
    public readonly all: number,
    public readonly good: number,
  ) {}

  public isGood(): boolean {
    return this.good === this.all;
  }
}

export interface Item<T> {
  coordinate: Coordinate;
  item: T;
}

export const tileColors: { [key in TileType]: string } = {
  Unknown: '#aaa',
  Grassland: '#91d63e',
  Forest: '#1f771a',
  Field: '#d8d515',
  Town: '#ce5c73',
  River: '#0d99c4',
  Lake: '#64c3e0',
  Railway: '#91632b',
  WaterStation: '#14e8b6',
};

export const tileTypes: {
  [key in TileType]: { normal: boolean; fill: boolean };
} = {
  Unknown: { normal: false, fill: false },
  Grassland: { normal: true, fill: true },
  Forest: { normal: true, fill: true },
  Field: { normal: true, fill: true },
  Town: { normal: true, fill: true },
  River: { normal: true, fill: true },
  Lake: { normal: true, fill: true },
  Railway: { normal: true, fill: true },
  WaterStation: { normal: false, fill: true },
};
