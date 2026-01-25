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
import { DisplayPosition } from './displayPosition';
import { hashList } from './hash';

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

  public edgeCount = input.required<number>();
  public edges = input.required<LogicalCoordinate[]>();
  public count = computed(() => this.edges().length);
  public markCount = input.required<number>();

  private jumpList: LogicalCoordinate[] | null = null;
  private jumpIndex = 0;
  private edgesToSort: LogicalCoordinate[] = [];
  private edgesHash: number | null = null;

  constructor() {
    effect(() => this.render());
    effect(() => {
      const edges = this.edges();
      const hash = hashList(edges.map(tileMapKey));
      if (this.edgesHash === hash) {
        return;
      }
      this.edgesToSort = edges;
      this.jumpList = null;
      this.edgesHash = hash;
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

  public onRightClick(event: MouseEvent) {
    event.preventDefault();
    this.cycleItems(-1);
  }

  public onClick() {
    this.cycleItems(1);
  }

  private cycleItems(direction: number) {
    const isCalculated = this.calculateJumpList();
    // jumpList cannot be null, but we have to make TypeScript happy.
    if (this.jumpList === null || this.jumpList.length === 0) {
      return;
    }

    if (!isCalculated) {
      this.jumpIndex =
        (this.jumpIndex + direction + this.jumpList.length) %
        this.jumpList.length;
    }

    const coord = this.jumpList[this.jumpIndex];
    this.mapService.displayPosition.update((dp) => {
      const physical = dp.screen2Physical(logical2Screen(coord));
      return new DisplayPosition(
        dp.offset.sub(physical).add(this.mapService.getWindowSize().div(2)),
        dp.zoomLevel,
      );
    });
  }

  private calculateJumpList(): boolean {
    if (this.jumpList !== null) {
      return false;
    }

    this.jumpList = [];
    this.jumpIndex = 0;

    type Accumulator = {
      diff: number;
      index: number;
    };

    let coord = this.mapService
      .displayPosition()
      .physical2Screen(this.mapService.getWindowSize().div(2));
    while (this.edgesToSort.length !== 0) {
      const { index } = this.edgesToSort.reduce(
        (acc: Accumulator | null, curr: LogicalCoordinate, index: number) => {
          const diff = coord.sub(logical2Screen(curr));
          const absdiff = diff.x * diff.x + diff.y * diff.y;
          if (acc === null || absdiff < acc.diff) {
            return { diff: absdiff, index };
          } else {
            return acc;
          }
        },
        null,
      )!;

      const [best] = this.edgesToSort.splice(index, 1);
      this.jumpList.push(best);
      coord = logical2Screen(best);
    }

    return true;
  }
}
