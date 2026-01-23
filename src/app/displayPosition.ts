import { PhysicalCoordinate } from './mapTypes';

const zoomLevels = [
  10.0, 12.92, 16.68, 21.51, 27.78, 35.86, 46.33, 59.85, 77.32, 100.0,
];

function findZoomLevel(zoom: number): number {
  return zoomLevels
    .map((z, i) => [Math.abs(zoom - z), i])
    .reduce((acc, value) => {
      if (acc == null) {
        return value;
      }
      return acc[0] < value[0] ? acc : value;
    })[1];
}

function getNewOffset(
  offset: PhysicalCoordinate,
  zoomPosition: PhysicalCoordinate,
  zoom: number,
  newZoom: number,
): PhysicalCoordinate {
  return zoomPosition
    .mul(zoom - newZoom)
    .add(offset.mul(newZoom))
    .div(zoom);
}

export class DisplayPosition {
  constructor(
    public readonly offset: PhysicalCoordinate,
    public readonly zoomLevel: number,
  ) {}

  static fromZoom(offset: PhysicalCoordinate, zoom: number): DisplayPosition {
    const zoomLevel = findZoomLevel(zoom);
    return new DisplayPosition(offset, zoomLevel);
  }

  public pan(
    origin: PhysicalCoordinate,
    position: PhysicalCoordinate,
  ): DisplayPosition {
    const diff = position.sub(origin);
    return new DisplayPosition(this.offset.add(diff), this.zoomLevel);
  }

  public modifyZoomLevel(
    position: PhysicalCoordinate,
    diff: number,
  ): DisplayPosition {
    const newZoomLevel = this.zoomLevel + diff;
    if (newZoomLevel < 0 || newZoomLevel >= zoomLevels.length) {
      return this;
    }

    const newZoom = zoomLevels[newZoomLevel];
    const newOffset = getNewOffset(this.offset, position, this.zoom(), newZoom);
    return new DisplayPosition(newOffset, newZoomLevel);
  }

  public physical2Screen(physical: PhysicalCoordinate): PhysicalCoordinate {
    return physical.sub(this.offset).div(this.zoom());
  }

  public screen2Physical(screen: PhysicalCoordinate): PhysicalCoordinate {
    return screen.mul(this.zoom()).add(this.offset);
  }

  public zoom(): number {
    return zoomLevels[this.zoomLevel];
  }
}
