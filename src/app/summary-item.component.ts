import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { drawEdge, logical2Screen } from './drawHelper';
import { LogicalCoordinate, PhysicalCoordinate, Edge } from './mapTypes';
import { CommonModule } from '@angular/common';
import { MapService, tileMapKey } from './map.service';
import { DebugService } from './debug.service';
import { DisplayPosition } from './displayPosition';
import { hashList } from './hash';
import { twoOptJumpList } from './jumpList';

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
      this.jumpIndex =
        (this.jumpIndex + direction + this.jumpList.length) %
        this.jumpList.length;
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

@Component({
  selector: 'summary-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary-item.component.html',
  styleUrl: './summary-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryItemComponent {
  private readonly canvas =
    viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly mapService = inject(MapService);
  private readonly debugService = inject(DebugService);

  public edgeCount = input.required<number>();
  public edges = input.required<LogicalCoordinate[]>();
  public marks = input.required<LogicalCoordinate[]>();
  public count = computed(() => this.edges().length);
  public markCount = computed(() => this.marks().length);

  private jumpList = new JumpList(this.mapService, this.debugService);
  private markedJumpList = new JumpList(this.mapService, this.debugService);

  constructor() {
    effect(() => this.render());
    effect(() => {
      this.jumpList.setEdges(this.edges());
      this.markedJumpList.setEdges(this.marks());
    });
  }

  private render() {
    const canvas = this.canvas().nativeElement;
    const edgeCount = this.edgeCount();
    const count = this.count();

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('not yet');
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawEdge(
      ctx,
      new Edge(edgeCount, count == 0 ? 0 : edgeCount),
      new PhysicalCoordinate(canvas.width / 2, canvas.height / 2),
      canvas.width / 2,
      false,
      false,
    );
  }

  public onContextMenu(event: MouseEvent) {
    event.preventDefault();
  }

  public onMouseDown(event: MouseEvent) {
    const jumpList = event.shiftKey ? this.markedJumpList : this.jumpList;
    switch (event.button) {
      case 0:
        jumpList.cycleItems(1);
        break;
      case 1:
        jumpList.cycleItems(0);
        break;
      case 2:
        jumpList.cycleItems(-1);
        break;
    }
  }
}
