export type TileType =
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
    public x: number,
    public y: number,
  ) {}

  public static fromMouseEvent(event: MouseEvent): Coordinate {
    return new Coordinate(event.clientX, event.clientY);
  }

  public clone(): Coordinate {
    return new Coordinate(this.x, this.y);
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
}

export interface Tile {
  coordinate: Coordinate;
  items: TileType[];
}

export interface Edge {
  coordinate: Coordinate;
  all: number;
  good: number;
}

export const tileColors = {
  Grassland: '#91d63e',
  Forest: '#1f771a',
  Field: '#d8d515',
  Town: '#ce5c73',
  River: '#64c3e0',
  Lake: '#0d99c4',
  Railway: '#91632b',
  WaterStation: '#14e8b6',
};
