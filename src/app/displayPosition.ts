import { Coordinate } from './mapTypes';

export class DisplayPosition {
  constructor(
    public readonly offset: Coordinate,
    public readonly zoom: number,
  ) {}

  public pan(origin: Coordinate, position: Coordinate): DisplayPosition {
    const diff = position.sub(origin);
    return new DisplayPosition(this.offset.add(diff), this.zoom);
  }

  public modifyZoom(
    position: Coordinate,
    size: Coordinate,
    multiplyBy: number,
  ): DisplayPosition {
    const newZoom = this.zoom * multiplyBy;
    const newOffset = position
      .mul(this.zoom - newZoom)
      .add(this.offset.mul(newZoom))
      .div(this.zoom);
    return new DisplayPosition(newOffset, newZoom);
  }

  public physical2Screen(physical: Coordinate): Coordinate {
    return physical.sub(this.offset).div(this.zoom);
  }

  public screen2Physical(screen: Coordinate): Coordinate {
    return screen.mul(this.zoom).add(this.offset);
  }
}
