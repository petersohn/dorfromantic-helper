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

export class CoordinateBase {
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}
}

export class PhysicalCoordinate extends CoordinateBase {
  public static fromMouseEvent(
    parent: HTMLElement,
    event: MouseEvent,
  ): PhysicalCoordinate {
    return new PhysicalCoordinate(
      event.pageX - parent.offsetLeft,
      event.pageY - parent.offsetTop,
    );
  }

  public static fromElementSize(element: HTMLElement): PhysicalCoordinate {
    return new PhysicalCoordinate(element.clientWidth, element.clientHeight);
  }

  public static fromCanvasSize(canvas: HTMLCanvasElement): PhysicalCoordinate {
    return new PhysicalCoordinate(canvas.width, canvas.height);
  }

  public add(rhs: PhysicalCoordinate): PhysicalCoordinate {
    return new PhysicalCoordinate(this.x + rhs.x, this.y + rhs.y);
  }

  public sub(rhs: PhysicalCoordinate): PhysicalCoordinate {
    return new PhysicalCoordinate(this.x - rhs.x, this.y - rhs.y);
  }

  public mul(value: number): PhysicalCoordinate {
    return new PhysicalCoordinate(this.x * value, this.y * value);
  }

  public div(value: number): PhysicalCoordinate {
    return new PhysicalCoordinate(this.x / value, this.y / value);
  }
}

export class LogicalCoordinate extends CoordinateBase {
  public neighbors(): LogicalCoordinate[] {
    return this.y % 2 == 0
      ? [
          new LogicalCoordinate(this.x + 1, this.y - 1),
          new LogicalCoordinate(this.x + 1, this.y),
          new LogicalCoordinate(this.x + 1, this.y + 1),
          new LogicalCoordinate(this.x, this.y + 1),
          new LogicalCoordinate(this.x - 1, this.y),
          new LogicalCoordinate(this.x, this.y - 1),
        ]
      : [
          new LogicalCoordinate(this.x, this.y - 1),
          new LogicalCoordinate(this.x + 1, this.y),
          new LogicalCoordinate(this.x, this.y + 1),
          new LogicalCoordinate(this.x - 1, this.y + 1),
          new LogicalCoordinate(this.x - 1, this.y),
          new LogicalCoordinate(this.x - 1, this.y - 1),
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

export interface ItemBase<T, CoordinateType> {
  coordinate: CoordinateType;
  item: T;
}

export type LogicalItem<T> = ItemBase<T, LogicalCoordinate>;
export type PhysicalItem<T> = ItemBase<T, PhysicalCoordinate>;

export type TileConfig = { normal: boolean; fill: boolean; color: string };

export const tileTypes: { [key in TileType]: TileConfig } = {
  Unknown: { normal: false, fill: false, color: '#aaa' },
  Grassland: { normal: true, fill: true, color: '#91d63e' },
  Forest: { normal: true, fill: true, color: '#1f771a' },
  Field: { normal: true, fill: true, color: '#d8d515' },
  Town: { normal: true, fill: true, color: '#ce5c73' },
  River: { normal: true, fill: true, color: '#0d99c4' },
  Lake: { normal: true, fill: true, color: '#64c3e0' },
  Railway: { normal: true, fill: true, color: '#91632b' },
  WaterStation: { normal: false, fill: true, color: '#14e8b6' },
};
