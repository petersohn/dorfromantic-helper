import { DebugService } from './debug.service';
import { DisplayPosition } from './displayPosition';
import { logical2Screen } from './drawHelper';
import { hashList } from './hash';
import { twoOptJumpList } from './jumpListHelper';
import { MapService, tileMapKey } from './map.service';
import { LogicalCoordinate } from './mapTypes';

export class JumpList {
  private jumpList: LogicalCoordinate[] | null = null;
  private jumpIndex = 0;
  private edgesToSort: LogicalCoordinate[] = [];
  private edgesHash: number | null = null;

  constructor(
    private mapService: MapService,
    private debugService: DebugService,
  ) {}

  public setEdges(edges: LogicalCoordinate[]): void {
    const hash = hashList(edges.map(tileMapKey));
    if (this.edgesHash === hash) {
      return;
    }
    this.edgesToSort = [...edges];
    this.jumpList = null;
    this.edgesHash = hash;
  }

  public cycleItems(direction: number) {
    const isCalculated = this.calculate();
    // jumpList cannot be null, but we have to make TypeScript happy.
    if (this.jumpList === null || this.jumpList.length === 0) {
      return;
    }

    if (!isCalculated) {
      const oldIndex = this.jumpIndex;
      this.jumpIndex =
        (this.jumpIndex + direction + this.jumpList.length) %
        this.jumpList.length;

      if (
        direction > 0 ? this.jumpIndex < oldIndex : this.jumpIndex > oldIndex
      ) {
        this.mapService.flashScreen();
      }
    }

    this.debugService.summaryTrace.set(this.jumpList);
    this.debugService.summaryTraceIndex.set(this.jumpIndex);

    const coord = this.jumpList[this.jumpIndex];
    this.mapService.displayPosition.update((dp) => {
      const physical = dp.screen2Physical(logical2Screen(coord));
      return new DisplayPosition(
        dp.offset.sub(physical).add(this.mapService.getWindowSize().div(2)),
        dp.zoomLevel,
      );
    });
  }

  private calculate(): boolean {
    if (this.jumpList !== null) {
      return false;
    }

    const currentPosition = this.mapService
      .displayPosition()
      .physical2Screen(this.mapService.getWindowSize().div(2));

    this.jumpList = twoOptJumpList(this.edgesToSort, currentPosition);
    this.jumpIndex = 0;
    this.edgesToSort = [];

    return true;
  }
}
